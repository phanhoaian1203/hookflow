using Microsoft.EntityFrameworkCore;
using HookFlow.Application.DTOs.Common;
using HookFlow.Application.DTOs.Event;
using HookFlow.Application.Interfaces;
using HookFlow.Application.Interfaces.Services;
using HookFlow.Domain.Entities;
using HookFlow.Domain.Enums;

namespace HookFlow.Application.Services;

public class WebhookEventService : IWebhookEventService
{
    private readonly IApplicationDbContext _context;

    public WebhookEventService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<WebhookEventDto>> GetEventsAsync(GetEventsRequest request, Guid userId)
    {
        // 1. Ownership boundary: only query endpoints belonging to projects owned by this user
        var query = _context.WebhookEvents
            .Include(e => e.Endpoint)
            .ThenInclude(ep => ep.Project)
            .Where(e => e.Endpoint.Project.OwnerId == userId);

        // 2. Apply Filters
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var statuses = request.Status.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => Enum.TryParse<WebhookEventStatus>(s.Trim(), true, out var parsed) ? parsed : (WebhookEventStatus?)null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();

            if (statuses.Any())
            {
                query = query.Where(e => statuses.Contains(e.Status));
            }
        }

        if (request.EndpointId.HasValue)
        {
            query = query.Where(e => e.EndpointId == request.EndpointId.Value);
        }

        if (request.ProjectId.HasValue)
        {
            query = query.Where(e => e.Endpoint.ProjectId == request.ProjectId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.EventType))
        {
            query = query.Where(e => e.EventType == request.EventType.Trim());
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(e => e.ReceivedAt >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(e => e.ReceivedAt <= request.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(e => 
                e.Id.ToString().Contains(search) ||
                (e.EventType != null && e.EventType.ToLower().Contains(search)) ||
                (e.ExternalEventId != null && e.ExternalEventId.ToLower().Contains(search)) ||
                (e.PayloadJson != null && e.PayloadJson.ToLower().Contains(search))
            );
        }

        // 3. Count Total Items before paging
        int totalItems = await query.CountAsync();

        // 4. Order and Page
        int page = request.Page > 0 ? request.Page : 1;
        int pageSize = request.PageSize > 0 ? request.PageSize : 20;

        var items = await query
            .OrderByDescending(e => e.ReceivedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => MapToDto(e, e.Endpoint.Name, e.Endpoint.Project.Name))
            .ToListAsync();

        return new PagedResult<WebhookEventDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems
        };
    }

    public async Task<WebhookEventDto> GetEventByIdAsync(Guid eventId, Guid userId)
    {
        var webhookEvent = await _context.WebhookEvents
            .Include(e => e.Endpoint)
            .ThenInclude(ep => ep.Project)
            .Include(e => e.ProcessingAttempts)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (webhookEvent == null || webhookEvent.Endpoint.Project.OwnerId != userId)
        {
            throw new KeyNotFoundException("Webhook event not found or you do not have permission to access it.");
        }

        return MapToDto(webhookEvent, webhookEvent.Endpoint.Name, webhookEvent.Endpoint.Project.Name);
    }

    public async Task<bool> ReplayEventAsync(Guid eventId, Guid userId)
    {
        var webhookEvent = await _context.WebhookEvents
            .Include(e => e.Endpoint)
            .ThenInclude(ep => ep.Project)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (webhookEvent == null || webhookEvent.Endpoint.Project.OwnerId != userId)
        {
            throw new KeyNotFoundException("Webhook event not found or you do not have permission to access it.");
        }

        // Only allow replaying certain statuses
        if (webhookEvent.Status == WebhookEventStatus.Processing)
        {
            throw new InvalidOperationException("Event is currently processing and cannot be replayed.");
        }

        webhookEvent.Status = WebhookEventStatus.Pending;
        webhookEvent.RetryCount = 0;
        webhookEvent.NextRetryAt = null;
        
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> IgnoreEventAsync(Guid eventId, Guid userId)
    {
        var webhookEvent = await _context.WebhookEvents
            .Include(e => e.Endpoint)
            .ThenInclude(ep => ep.Project)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (webhookEvent == null || webhookEvent.Endpoint.Project.OwnerId != userId)
        {
            throw new KeyNotFoundException("Webhook event not found or you do not have permission to access it.");
        }

        // Only allow ignoring if it is Retrying or Dead or Failed
        if (webhookEvent.Status != WebhookEventStatus.Retrying && 
            webhookEvent.Status != WebhookEventStatus.Dead && 
            webhookEvent.Status != WebhookEventStatus.Failed)
        {
            throw new InvalidOperationException("Only retrying, dead, or failed events can be ignored.");
        }

        webhookEvent.Status = WebhookEventStatus.Ignored;
        webhookEvent.NextRetryAt = null;
        
        await _context.SaveChangesAsync();
        return true;
    }

    #region Helper Methods

    private static WebhookEventDto MapToDto(WebhookEvent ev, string endpointName, string projectName)
    {
        return new WebhookEventDto
        {
            Id = ev.Id,
            EndpointId = ev.EndpointId,
            EndpointName = endpointName,
            ProjectName = projectName,
            ExternalEventId = ev.ExternalEventId,
            EventType = ev.EventType,
            PayloadJson = ev.PayloadJson,
            HeadersJson = ev.HeadersJson,
            SourceIp = ev.SourceIp,
            SignatureValid = ev.SignatureValid,
            Status = ev.Status.ToString(),
            RetryCount = ev.RetryCount,
            MaxRetryAttempts = ev.MaxRetryAttempts,
            NextRetryAt = ev.NextRetryAt,
            ErrorMessage = ev.ErrorMessage,
            LastErrorMessage = ev.ErrorMessage,
            ReceivedAt = ev.ReceivedAt,
            ProcessedAt = ev.ProcessedAt,
            CreatedAt = ev.CreatedAt,
            ProcessingAttempts = ev.ProcessingAttempts?
                .OrderBy(a => a.AttemptNumber)
                .Select(a => new ProcessingAttemptDto
                {
                    Id = a.Id,
                    WebhookEventId = a.WebhookEventId,
                    AttemptNumber = a.AttemptNumber,
                    Status = a.Status,
                    StartedAt = a.StartedAt,
                    FinishedAt = a.FinishedAt,
                    DurationMs = a.DurationMs,
                    ErrorMessage = a.ErrorMessage,
                    WorkerName = a.WorkerName,
                    CreatedAt = a.CreatedAt
                }).ToList() ?? []
        };
    }

    #endregion
}
