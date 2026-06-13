using Microsoft.EntityFrameworkCore;
using HookFlow.Application.DTOs.Endpoint;
using HookFlow.Application.Interfaces;
using HookFlow.Application.Interfaces.Services;
using HookFlow.Domain.Entities;
using HookFlow.Domain.Enums;
using System.Security.Cryptography;

namespace HookFlow.Application.Services;

public class WebhookEndpointService : IWebhookEndpointService
{
    private readonly IApplicationDbContext _context;
    private const string BaseWebhookUrl = "http://localhost:5167/api/incoming-webhooks/";

    public WebhookEndpointService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<WebhookEndpointDto>> GetProjectEndpointsAsync(Guid projectId, Guid userId)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.Id == projectId && p.OwnerId == userId);
        if (!projectExists)
        {
            throw new KeyNotFoundException("Project not found or you do not have permission to access it.");
        }

        return await _context.WebhookEndpoints
            .AsNoTracking()
            .Where(e => e.ProjectId == projectId)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => MapToDto(e, e.Project.Name))
            .ToListAsync();
    }

    public async Task<IEnumerable<WebhookEndpointDto>> GetAllUserEndpointsAsync(Guid userId)
    {
        return await _context.WebhookEndpoints
            .AsNoTracking()
            .Where(e => e.Project.OwnerId == userId)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => MapToDto(e, e.Project.Name))
            .ToListAsync();
    }

    public async Task<WebhookEndpointDto> GetEndpointByIdAsync(Guid endpointId, Guid userId)
    {
        var endpoint = await _context.WebhookEndpoints
            .AsNoTracking()
            .Include(e => e.Project)
            .FirstOrDefaultAsync(e => e.Id == endpointId);

        if (endpoint == null || endpoint.Project.OwnerId != userId)
        {
            throw new KeyNotFoundException("Webhook endpoint not found or you do not have permission to access it.");
        }

        return MapToDto(endpoint, endpoint.Project.Name);
    }

    public async Task<(WebhookEndpointDto Endpoint, string PlainSecret)> CreateEndpointAsync(CreateEndpointRequest request, Guid userId)
    {
        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.OwnerId == userId);
        if (project == null)
        {
            throw new KeyNotFoundException("Project not found or you do not have permission to access it.");
        }

        string baseSlug = GenerateSlug(request.Name);
        string finalSlug = baseSlug;
        bool exists = await _context.WebhookEndpoints.AnyAsync(e => e.Slug == finalSlug);
        if (exists)
        {
            const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            var random = new Random();
            do
            {
                var suffix = new string(Enumerable.Repeat(chars, 5).Select(s => s[random.Next(s.Length)]).ToArray());
                finalSlug = $"{baseSlug}-{suffix}";
            } while (await _context.WebhookEndpoints.AnyAsync(e => e.Slug == finalSlug));
        }

        string plainSecret = GenerateSecretKey();

        Enum.TryParse<WebhookProvider>(request.Provider, true, out var provider);
        Enum.TryParse<RetryStrategy>(request.RetryStrategy, true, out var retryStrategy);

        var endpoint = new WebhookEndpoint
        {
            ProjectId = request.ProjectId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Slug = finalSlug,
            Provider = provider,
            SecretKey = plainSecret,
            IsActive = true,
            AllowedEventTypes = request.AllowedEventTypes,
            VerifySignature = request.VerifySignature,
            SignatureHeaderName = request.SignatureHeaderName.Trim(),
            RejectInvalidSignature = request.RejectInvalidSignature,
            MaxRetryAttempts = request.MaxRetryAttempts,
            RetryStrategy = retryStrategy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.WebhookEndpoints.Add(endpoint);
        await _context.SaveChangesAsync();

        return (MapToDto(endpoint, project.Name), plainSecret);
    }

    public async Task<WebhookEndpointDto> UpdateEndpointAsync(Guid endpointId, UpdateEndpointRequest request, Guid userId)
    {
        var endpoint = await _context.WebhookEndpoints
            .Include(e => e.Project)
            .FirstOrDefaultAsync(e => e.Id == endpointId);

        if (endpoint == null || endpoint.Project.OwnerId != userId)
        {
            throw new KeyNotFoundException("Webhook endpoint not found or you do not have permission to access it.");
        }

        Enum.TryParse<RetryStrategy>(request.RetryStrategy, true, out var retryStrategy);

        endpoint.Name = request.Name.Trim();
        endpoint.Description = request.Description?.Trim();
        endpoint.AllowedEventTypes = request.AllowedEventTypes;
        endpoint.VerifySignature = request.VerifySignature;
        endpoint.SignatureHeaderName = request.SignatureHeaderName.Trim();
        endpoint.RejectInvalidSignature = request.RejectInvalidSignature;
        endpoint.MaxRetryAttempts = request.MaxRetryAttempts;
        endpoint.RetryStrategy = retryStrategy;
        endpoint.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(endpoint, endpoint.Project.Name);
    }

    public async Task<string> RotateSecretAsync(Guid endpointId, Guid userId)
    {
        var endpoint = await _context.WebhookEndpoints
            .Include(e => e.Project)
            .FirstOrDefaultAsync(e => e.Id == endpointId);

        if (endpoint == null || endpoint.Project.OwnerId != userId)
        {
            throw new KeyNotFoundException("Webhook endpoint not found or you do not have permission to access it.");
        }

        string newSecret = GenerateSecretKey();
        endpoint.SecretKey = newSecret;
        endpoint.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return newSecret;
    }

    public async Task<string> GetEndpointSecretAsync(Guid endpointId, Guid userId)
    {
        var endpoint = await _context.WebhookEndpoints
            .Include(e => e.Project)
            .FirstOrDefaultAsync(e => e.Id == endpointId);

        if (endpoint == null || endpoint.Project.OwnerId != userId)
        {
            throw new KeyNotFoundException("Webhook endpoint not found or you do not have permission to access it.");
        }

        return endpoint.SecretKey ?? string.Empty;
    }

    public async Task<WebhookEndpointDto> ToggleEndpointActiveAsync(Guid endpointId, Guid userId)
    {
        var endpoint = await _context.WebhookEndpoints
            .Include(e => e.Project)
            .FirstOrDefaultAsync(e => e.Id == endpointId);

        if (endpoint == null || endpoint.Project.OwnerId != userId)
        {
            throw new KeyNotFoundException("Webhook endpoint not found or you do not have permission to access it.");
        }

        endpoint.IsActive = !endpoint.IsActive;
        endpoint.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(endpoint, endpoint.Project.Name);
    }

    public async Task DeleteEndpointAsync(Guid endpointId, Guid userId)
    {
        var endpoint = await _context.WebhookEndpoints
            .Include(e => e.Project)
            .FirstOrDefaultAsync(e => e.Id == endpointId);

        if (endpoint == null || endpoint.Project.OwnerId != userId)
        {
            throw new KeyNotFoundException("Webhook endpoint not found or you do not have permission to access it.");
        }

        _context.WebhookEndpoints.Remove(endpoint);
        await _context.SaveChangesAsync();
    }

    #region Helper Methods

    private static WebhookEndpointDto MapToDto(WebhookEndpoint endpoint, string projectName)
    {
        return new WebhookEndpointDto
        {
            Id = endpoint.Id,
            ProjectId = endpoint.ProjectId,
            ProjectName = projectName,
            Name = endpoint.Name,
            Description = endpoint.Description,
            Slug = endpoint.Slug,
            WebhookUrl = $"{BaseWebhookUrl}{endpoint.Slug}",
            Provider = endpoint.Provider.ToString(),
            IsActive = endpoint.IsActive,
            AllowedEventTypes = endpoint.AllowedEventTypes,
            VerifySignature = endpoint.VerifySignature,
            SignatureHeaderName = endpoint.SignatureHeaderName,
            RejectInvalidSignature = endpoint.RejectInvalidSignature,
            MaxRetryAttempts = endpoint.MaxRetryAttempts,
            RetryStrategy = endpoint.RetryStrategy.ToString(),
            CreatedAt = endpoint.CreatedAt,
            UpdatedAt = endpoint.UpdatedAt
        };
    }

    private string GenerateSlug(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "endpoint";

        string str = name.ToLowerInvariant();
        var sb = new System.Text.StringBuilder();
        foreach (char c in str)
        {
            if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'))
            {
                sb.Append(c);
            }
            else if (c == ' ' || c == '-' || c == '_')
            {
                sb.Append('-');
            }
        }
        string slug = sb.ToString();
        while (slug.Contains("--"))
        {
            slug = slug.Replace("--", "-");
        }
        slug = slug.Trim('-');
        return string.IsNullOrEmpty(slug) ? "endpoint" : slug;
    }

    private string GenerateSecretKey()
    {
        var bytes = new byte[24];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(bytes);
        }
        return "wh_sk_" + Convert.ToHexString(bytes).ToLowerInvariant();
    }

    #endregion
}
