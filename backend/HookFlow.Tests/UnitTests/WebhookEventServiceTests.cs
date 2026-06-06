using HookFlow.Application.DTOs.Event;
using HookFlow.Application.Services;
using HookFlow.Domain.Entities;
using HookFlow.Domain.Enums;
using HookFlow.Tests.Helpers;
using System.Linq;

namespace HookFlow.Tests.UnitTests;

public class WebhookEventServiceTests
{
    // ────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────

    private static (TestDbContext ctx, Guid userId, Guid projectId, Guid endpointId) BuildContext()
    {
        var ctx = TestDbContext.CreateFresh();
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var endpointId = Guid.NewGuid();

        ctx.Users.Add(new User { Id = userId, FullName = "Alice", Email = "a@t.com", PasswordHash = "h" });
        ctx.Projects.Add(new Project { Id = projectId, OwnerId = userId, Name = "P", Status = "Active" });
        ctx.WebhookEndpoints.Add(new WebhookEndpoint
        {
            Id = endpointId,
            ProjectId = projectId,
            Name = "Endpoint",
            Slug = "endpoint",
            IsActive = true,
            SignatureHeaderName = "X-Sig",
            Provider = WebhookProvider.Generic,
            RetryStrategy = RetryStrategy.None,
            MaxRetryAttempts = 3
        });

        // Seed một số events
        ctx.WebhookEvents.AddRange(
            new WebhookEvent
            {
                Id = Guid.NewGuid(), EndpointId = endpointId,
                Status = WebhookEventStatus.Processed, EventType = "push",
                ReceivedAt = DateTime.UtcNow.AddHours(-1), CreatedAt = DateTime.UtcNow.AddHours(-1)
            },
            new WebhookEvent
            {
                Id = Guid.NewGuid(), EndpointId = endpointId,
                Status = WebhookEventStatus.Failed, EventType = "pull_request",
                ReceivedAt = DateTime.UtcNow.AddHours(-2), CreatedAt = DateTime.UtcNow.AddHours(-2),
                ErrorMessage = "Timeout"
            },
            new WebhookEvent
            {
                Id = Guid.NewGuid(), EndpointId = endpointId,
                Status = WebhookEventStatus.Retrying, EventType = "push",
                RetryCount = 2, NextRetryAt = DateTime.UtcNow.AddMinutes(5),
                ReceivedAt = DateTime.UtcNow.AddHours(-3), CreatedAt = DateTime.UtcNow.AddHours(-3)
            },
            new WebhookEvent
            {
                Id = Guid.NewGuid(), EndpointId = endpointId,
                Status = WebhookEventStatus.Dead, EventType = "release",
                ReceivedAt = DateTime.UtcNow.AddDays(-1), CreatedAt = DateTime.UtcNow.AddDays(-1)
            }
        );

        ctx.SaveChanges();
        return (ctx, userId, projectId, endpointId);
    }

    // ────────────────────────────────────────────────────────
    // GetEventsAsync
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetEventsAsync_ReturnsAllEvents_WithNoFilters()
    {
        var (ctx, userId, _, _) = BuildContext();
        var svc = new WebhookEventService(ctx);

        var result = await svc.GetEventsAsync(new GetEventsRequest { Page = 1, PageSize = 20 }, userId);

        Assert.Equal(4, result.TotalItems);
        Assert.Equal(4, result.Items.Count());
    }

    [Fact]
    public async Task GetEventsAsync_FiltersByStatus_Correctly()
    {
        var (ctx, userId, _, _) = BuildContext();
        var svc = new WebhookEventService(ctx);

        var result = await svc.GetEventsAsync(
            new GetEventsRequest { Page = 1, PageSize = 20, Status = "Failed" }, userId);

        Assert.Equal(1, result.TotalItems);
        Assert.All(result.Items, e => Assert.Equal("Failed", e.Status));
    }

    [Fact]
    public async Task GetEventsAsync_FiltersByMultipleStatuses()
    {
        var (ctx, userId, _, _) = BuildContext();
        var svc = new WebhookEventService(ctx);

        var result = await svc.GetEventsAsync(
            new GetEventsRequest { Page = 1, PageSize = 20, Status = "Failed,Dead" }, userId);

        Assert.Equal(2, result.TotalItems);
    }

    [Fact]
    public async Task GetEventsAsync_FiltersByEventType_Correctly()
    {
        var (ctx, userId, _, _) = BuildContext();
        var svc = new WebhookEventService(ctx);

        var result = await svc.GetEventsAsync(
            new GetEventsRequest { Page = 1, PageSize = 20, EventType = "push" }, userId);

        Assert.Equal(2, result.TotalItems);
        Assert.All(result.Items, e => Assert.Equal("push", e.EventType));
    }

    [Fact]
    public async Task GetEventsAsync_FiltersByEndpointId()
    {
        var (ctx, userId, _, endpointId) = BuildContext();
        var svc = new WebhookEventService(ctx);

        var result = await svc.GetEventsAsync(
            new GetEventsRequest { Page = 1, PageSize = 20, EndpointId = endpointId }, userId);

        Assert.Equal(4, result.TotalItems);
        Assert.All(result.Items, e => Assert.Equal(endpointId, e.EndpointId));
    }

    [Fact]
    public async Task GetEventsAsync_ReturnsEmpty_ForOtherUser()
    {
        var (ctx, _, _, _) = BuildContext();
        var svc = new WebhookEventService(ctx);

        var result = await svc.GetEventsAsync(
            new GetEventsRequest { Page = 1, PageSize = 20 }, Guid.NewGuid());

        Assert.Equal(0, result.TotalItems);
    }

    [Fact]
    public async Task GetEventsAsync_Paginates_Correctly()
    {
        var (ctx, userId, _, _) = BuildContext();
        var svc = new WebhookEventService(ctx);

        var page1 = await svc.GetEventsAsync(
            new GetEventsRequest { Page = 1, PageSize = 2 }, userId);
        var page2 = await svc.GetEventsAsync(
            new GetEventsRequest { Page = 2, PageSize = 2 }, userId);

        Assert.Equal(4, page1.TotalItems);
        Assert.Equal(2, page1.Items.Count());
        Assert.Equal(2, page2.Items.Count());

        // Không được trùng items giữa hai trang
        var page1Ids = page1.Items.Select(e => e.Id).ToHashSet();
        Assert.All(page2.Items, e => Assert.DoesNotContain(e.Id, page1Ids));
    }

    [Fact]
    public async Task GetEventsAsync_FiltersByDateRange()
    {
        var (ctx, userId, _, _) = BuildContext();
        var svc = new WebhookEventService(ctx);

        var from = DateTime.UtcNow.AddHours(-2.5);
        var to = DateTime.UtcNow;

        var result = await svc.GetEventsAsync(
            new GetEventsRequest { Page = 1, PageSize = 20, FromDate = from, ToDate = to }, userId);

        // Chỉ events trong khoảng 2.5h qua (Processed + Failed)
        Assert.Equal(2, result.TotalItems);
    }

    // ────────────────────────────────────────────────────────
    // GetEventByIdAsync
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetEventByIdAsync_ReturnsEvent_WhenOwned()
    {
        var (ctx, userId, _, endpointId) = BuildContext();
        var svc = new WebhookEventService(ctx);
        var eventId = ctx.WebhookEvents.First(e => e.EndpointId == endpointId).Id;

        var dto = await svc.GetEventByIdAsync(eventId, userId);

        Assert.Equal(eventId, dto.Id);
    }

    [Fact]
    public async Task GetEventByIdAsync_Throws_WhenNotOwned()
    {
        var (ctx, _, _, endpointId) = BuildContext();
        var svc = new WebhookEventService(ctx);
        var eventId = ctx.WebhookEvents.First(e => e.EndpointId == endpointId).Id;

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.GetEventByIdAsync(eventId, Guid.NewGuid()));
    }

    [Fact]
    public async Task GetEventByIdAsync_Throws_WhenEventDoesNotExist()
    {
        var (ctx, userId, _, _) = BuildContext();
        var svc = new WebhookEventService(ctx);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.GetEventByIdAsync(Guid.NewGuid(), userId));
    }

    // ────────────────────────────────────────────────────────
    // ReplayEventAsync
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task ReplayEventAsync_ResetsToPending_WhenFailed()
    {
        var (ctx, userId, _, endpointId) = BuildContext();
        var svc = new WebhookEventService(ctx);
        var failedEvent = ctx.WebhookEvents.First(e => e.Status == WebhookEventStatus.Failed);

        var result = await svc.ReplayEventAsync(failedEvent.Id, userId);

        Assert.True(result);

        var updated = await ctx.WebhookEvents.FindAsync(failedEvent.Id);
        Assert.Equal(WebhookEventStatus.Pending, updated!.Status);
        Assert.Equal(0, updated.RetryCount);
        Assert.Null(updated.NextRetryAt);
    }

    [Fact]
    public async Task ReplayEventAsync_Throws_WhenEventIsProcessing()
    {
        var (ctx, userId, _, endpointId) = BuildContext();
        var svc = new WebhookEventService(ctx);

        // Thêm event đang Processing
        var processingEvent = new WebhookEvent
        {
            Id = Guid.NewGuid(), EndpointId = endpointId,
            Status = WebhookEventStatus.Processing,
            ReceivedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow
        };
        ctx.WebhookEvents.Add(processingEvent);
        ctx.SaveChanges();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.ReplayEventAsync(processingEvent.Id, userId));
    }

    [Fact]
    public async Task ReplayEventAsync_Throws_WhenNotOwned()
    {
        var (ctx, _, _, endpointId) = BuildContext();
        var svc = new WebhookEventService(ctx);
        var eventId = ctx.WebhookEvents.First(e => e.Status == WebhookEventStatus.Failed).Id;

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.ReplayEventAsync(eventId, Guid.NewGuid()));
    }

    // ────────────────────────────────────────────────────────
    // IgnoreEventAsync
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task IgnoreEventAsync_SetsIgnoredStatus_WhenFailed()
    {
        var (ctx, userId, _, endpointId) = BuildContext();
        var svc = new WebhookEventService(ctx);
        var failedEvent = ctx.WebhookEvents.First(e => e.Status == WebhookEventStatus.Failed);

        var result = await svc.IgnoreEventAsync(failedEvent.Id, userId);

        Assert.True(result);

        var updated = await ctx.WebhookEvents.FindAsync(failedEvent.Id);
        Assert.Equal(WebhookEventStatus.Ignored, updated!.Status);
        Assert.Null(updated.NextRetryAt);
    }

    [Fact]
    public async Task IgnoreEventAsync_SetsIgnoredStatus_WhenRetrying()
    {
        var (ctx, userId, _, endpointId) = BuildContext();
        var svc = new WebhookEventService(ctx);
        var retryingEvent = ctx.WebhookEvents.First(e => e.Status == WebhookEventStatus.Retrying);

        var result = await svc.IgnoreEventAsync(retryingEvent.Id, userId);

        Assert.True(result);
        var updated = await ctx.WebhookEvents.FindAsync(retryingEvent.Id);
        Assert.Equal(WebhookEventStatus.Ignored, updated!.Status);
    }

    [Fact]
    public async Task IgnoreEventAsync_Throws_WhenStatusIsPending()
    {
        var (ctx, userId, _, endpointId) = BuildContext();
        var svc = new WebhookEventService(ctx);

        // Thêm event Pending
        var pendingEvent = new WebhookEvent
        {
            Id = Guid.NewGuid(), EndpointId = endpointId,
            Status = WebhookEventStatus.Pending,
            ReceivedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow
        };
        ctx.WebhookEvents.Add(pendingEvent);
        ctx.SaveChanges();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.IgnoreEventAsync(pendingEvent.Id, userId));
    }

    [Fact]
    public async Task IgnoreEventAsync_Throws_WhenStatusIsProcessed()
    {
        var (ctx, userId, _, endpointId) = BuildContext();
        var svc = new WebhookEventService(ctx);
        var processedEvent = ctx.WebhookEvents.First(e => e.Status == WebhookEventStatus.Processed);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.IgnoreEventAsync(processedEvent.Id, userId));
    }
}
