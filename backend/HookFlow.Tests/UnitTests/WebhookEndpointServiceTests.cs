using HookFlow.Application.DTOs.Endpoint;
using HookFlow.Application.Services;
using HookFlow.Domain.Entities;
using HookFlow.Domain.Enums;
using HookFlow.Tests.Helpers;

namespace HookFlow.Tests.UnitTests;

public class WebhookEndpointServiceTests
{


    private static (TestDbContext ctx, Guid userId, Guid projectId) BuildContext()
    {
        var ctx = TestDbContext.CreateFresh();
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        ctx.Users.Add(new User { Id = userId, FullName = "Alice", Email = "alice@test.com", PasswordHash = "h" });

        var project = new Project { Id = projectId, OwnerId = userId, Name = "My Project", Status = "Active" };
        ctx.Projects.Add(project);

        ctx.WebhookEndpoints.AddRange(
            new WebhookEndpoint
            {
                Id = Guid.NewGuid(), ProjectId = projectId,
                Name = "Endpoint One", Slug = "endpoint-one",
                IsActive = true, SignatureHeaderName = "X-Sig",
                Provider = WebhookProvider.GitHub,
                RetryStrategy = RetryStrategy.ExponentialBackoff,
                MaxRetryAttempts = 3
            },
            new WebhookEndpoint
            {
                Id = Guid.NewGuid(), ProjectId = projectId,
                Name = "Endpoint Two", Slug = "endpoint-two",
                IsActive = false, SignatureHeaderName = "X-Sig",
                Provider = WebhookProvider.Generic,
                RetryStrategy = RetryStrategy.None,
                MaxRetryAttempts = 5
            }
        );

        ctx.SaveChanges();
        return (ctx, userId, projectId);
    }


    [Fact]
    public async Task GetProjectEndpointsAsync_ReturnsAllEndpointsOfProject()
    {
        var (ctx, userId, projectId) = BuildContext();
        var svc = new WebhookEndpointService(ctx);

        var result = (await svc.GetProjectEndpointsAsync(projectId, userId)).ToList();

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetProjectEndpointsAsync_Throws_WhenProjectNotOwned()
    {
        var (ctx, _, projectId) = BuildContext();
        var svc = new WebhookEndpointService(ctx);
        var strangerUserId = Guid.NewGuid();

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.GetProjectEndpointsAsync(projectId, strangerUserId));
    }


    [Fact]
    public async Task GetEndpointByIdAsync_ReturnsEndpoint_WhenOwned()
    {
        var (ctx, userId, projectId) = BuildContext();
        var svc = new WebhookEndpointService(ctx);
        var endpointId = ctx.WebhookEndpoints.First(e => e.ProjectId == projectId).Id;

        var dto = await svc.GetEndpointByIdAsync(endpointId, userId);

        Assert.Equal(endpointId, dto.Id);
    }

    [Fact]
    public async Task GetEndpointByIdAsync_Throws_WhenEndpointDoesNotExist()
    {
        var (ctx, userId, _) = BuildContext();
        var svc = new WebhookEndpointService(ctx);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.GetEndpointByIdAsync(Guid.NewGuid(), userId));
    }


    [Fact]
    public async Task CreateEndpointAsync_CreatesEndpoint_WithSlugAndSecret()
    {
        var (ctx, userId, projectId) = BuildContext();
        var svc = new WebhookEndpointService(ctx);

        var request = new CreateEndpointRequest
        {
            ProjectId = projectId,
            Name = "My New Endpoint",
            Provider = "GitHub",
            VerifySignature = true,
            SignatureHeaderName = "X-Hub-Signature-256",
            RejectInvalidSignature = false,
            MaxRetryAttempts = 5,
            RetryStrategy = "ExponentialBackoff"
        };

        var (dto, plainSecret) = await svc.CreateEndpointAsync(request, userId);

        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal("My New Endpoint", dto.Name);
        Assert.False(string.IsNullOrWhiteSpace(dto.Slug));
        Assert.StartsWith("wh_sk_", plainSecret);  // format bí mật
        Assert.Equal("GitHub", dto.Provider);
        Assert.True(dto.IsActive);
    }

    [Fact]
    public async Task CreateEndpointAsync_GeneratesUniqueSlug_WhenConflict()
    {
        var (ctx, userId, projectId) = BuildContext();
        var svc = new WebhookEndpointService(ctx);

        // Tên giống "Endpoint One" -> slug "endpoint-one" đã tồn tại
        var request = new CreateEndpointRequest
        {
            ProjectId = projectId,
            Name = "Endpoint One",
            Provider = "Generic",
            SignatureHeaderName = "X-Sig",
            RetryStrategy = "None",
            MaxRetryAttempts = 3
        };

        var (dto, _) = await svc.CreateEndpointAsync(request, userId);

        // Slug phải khác "endpoint-one" vì đã tồn tại
        Assert.NotEqual("endpoint-one", dto.Slug);
        Assert.StartsWith("endpoint-one-", dto.Slug);
    }

    [Fact]
    public async Task CreateEndpointAsync_Throws_WhenProjectNotOwned()
    {
        var (ctx, _, projectId) = BuildContext();
        var svc = new WebhookEndpointService(ctx);
        var strangerUserId = Guid.NewGuid();

        var request = new CreateEndpointRequest
        {
            ProjectId = projectId,
            Name = "Hacker Endpoint",
            Provider = "Generic",
            SignatureHeaderName = "X-Sig",
            RetryStrategy = "None",
            MaxRetryAttempts = 3
        };

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.CreateEndpointAsync(request, strangerUserId));
    }


    [Fact]
    public async Task ToggleEndpointActiveAsync_FlipsIsActive()
    {
        var (ctx, userId, projectId) = BuildContext();
        var svc = new WebhookEndpointService(ctx);

        // Lấy endpoint đang active = true
        var activeEndpoint = ctx.WebhookEndpoints.First(e => e.IsActive);

        var dto = await svc.ToggleEndpointActiveAsync(activeEndpoint.Id, userId);

        Assert.False(dto.IsActive);

        // Toggle lần 2
        var dto2 = await svc.ToggleEndpointActiveAsync(activeEndpoint.Id, userId);
        Assert.True(dto2.IsActive);
    }



    [Fact]
    public async Task RotateSecretAsync_ReturnsNewSecret_WithCorrectPrefix()
    {
        var (ctx, userId, projectId) = BuildContext();
        var svc = new WebhookEndpointService(ctx);
        var endpoint = ctx.WebhookEndpoints.First();

        var oldSecret = endpoint.SecretKey;
        var newSecret = await svc.RotateSecretAsync(endpoint.Id, userId);

        Assert.StartsWith("wh_sk_", newSecret);
        Assert.NotEqual(oldSecret, newSecret);
    }



    [Fact]
    public async Task DeleteEndpointAsync_RemovesEndpoint_WhenOwned()
    {
        var (ctx, userId, _) = BuildContext();
        var svc = new WebhookEndpointService(ctx);
        var endpointId = ctx.WebhookEndpoints.First().Id;

        await svc.DeleteEndpointAsync(endpointId, userId);

        var deleted = await ctx.WebhookEndpoints.FindAsync(endpointId);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task DeleteEndpointAsync_Throws_WhenNotOwned()
    {
        var (ctx, _, _) = BuildContext();
        var svc = new WebhookEndpointService(ctx);
        var endpointId = ctx.WebhookEndpoints.First().Id;
        var strangerUserId = Guid.NewGuid();

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.DeleteEndpointAsync(endpointId, strangerUserId));
    }


    [Theory]
    [InlineData("My Endpoint Name", "my-endpoint-name")]
    [InlineData("Hello World!", "hello-world")]
    [InlineData("test--double--dash", "test-double-dash")]
    [InlineData("123 Numbers", "123-numbers")]
    public async Task CreateEndpointAsync_GeneratesCorrectSlug(string inputName, string expectedSlug)
    {
        var (ctx, userId, projectId) = BuildContext();
        var svc = new WebhookEndpointService(ctx);

        var request = new CreateEndpointRequest
        {
            ProjectId = projectId,
            Name = inputName,
            Provider = "Generic",
            SignatureHeaderName = "X-Sig",
            RetryStrategy = "None",
            MaxRetryAttempts = 3
        };

        var (dto, _) = await svc.CreateEndpointAsync(request, userId);

        // Slug phải bắt đầu bằng expected (có thể có suffix nếu trùng)
        Assert.StartsWith(expectedSlug, dto.Slug);
    }
}
