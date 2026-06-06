using HookFlow.Application.Interfaces.Services;
using HookFlow.Application.Services;
using HookFlow.Domain.Entities;
using HookFlow.Domain.Enums;
using HookFlow.Tests.Helpers;
using Moq;

namespace HookFlow.Tests.UnitTests;

public class IncomingWebhookServiceTests
{
    // ────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────

    private static (TestDbContext ctx, WebhookEndpoint endpoint) BuildContext(
        bool isActive = true,
        bool verifySignature = false,
        bool rejectInvalidSignature = false)
    {
        var ctx = TestDbContext.CreateFresh();
        var userId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        ctx.Users.Add(new User { Id = userId, FullName = "Alice", Email = "a@t.com", PasswordHash = "h" });
        ctx.Projects.Add(new Project { Id = projectId, OwnerId = userId, Name = "P", Status = "Active" });

        var endpoint = new WebhookEndpoint
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Name = "Test Endpoint",
            Slug = "test-slug",
            IsActive = isActive,
            VerifySignature = verifySignature,
            SignatureHeaderName = "X-Webhook-Signature",
            RejectInvalidSignature = rejectInvalidSignature,
            SecretKey = "my-secret",
            MaxRetryAttempts = 3,
            RetryStrategy = RetryStrategy.ExponentialBackoff,
            Provider = WebhookProvider.Generic
        };
        ctx.WebhookEndpoints.Add(endpoint);
        ctx.SaveChanges();

        return (ctx, endpoint);
    }

    private static Mock<IWebhookSignatureVerifier> MockVerifier(bool returns)
    {
        var mock = new Mock<IWebhookSignatureVerifier>();
        mock.Setup(v => v.VerifySignature(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(returns);
        return mock;
    }

    // ────────────────────────────────────────────────────────
    // Slug validation
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task ProcessIncomingWebhookAsync_Throws_WhenSlugIsEmpty()
    {
        var (ctx, _) = BuildContext();
        var svc = new IncomingWebhookService(ctx, MockVerifier(true).Object);

        await Assert.ThrowsAsync<ArgumentException>(
            () => svc.ProcessIncomingWebhookAsync("", "{}", new Dictionary<string, string>(), null));
    }

    [Fact]
    public async Task ProcessIncomingWebhookAsync_Throws_WhenSlugNotFound()
    {
        var (ctx, _) = BuildContext();
        var svc = new IncomingWebhookService(ctx, MockVerifier(true).Object);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.ProcessIncomingWebhookAsync("nonexistent-slug", "{}", new Dictionary<string, string>(), null));
    }

    // ────────────────────────────────────────────────────────
    // Inactive endpoint
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task ProcessIncomingWebhookAsync_Throws_WhenEndpointIsInactive()
    {
        var (ctx, endpoint) = BuildContext(isActive: false);
        var svc = new IncomingWebhookService(ctx, MockVerifier(true).Object);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.ProcessIncomingWebhookAsync(endpoint.Slug, "{}", new Dictionary<string, string>(), null));
    }

    // ────────────────────────────────────────────────────────
    // Happy path - no signature
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task ProcessIncomingWebhookAsync_SavesEvent_AndReturnsPendingStatus()
    {
        var (ctx, endpoint) = BuildContext(verifySignature: false);
        var svc = new IncomingWebhookService(ctx, MockVerifier(true).Object);

        var body = "{\"event\":\"push\",\"id\":\"abc-123\"}";
        var eventId = await svc.ProcessIncomingWebhookAsync(
            endpoint.Slug, body, new Dictionary<string, string>(), "1.2.3.4");

        Assert.NotEqual(Guid.Empty, eventId);

        var savedEvent = await ctx.WebhookEvents.FindAsync(eventId);
        Assert.NotNull(savedEvent);
        Assert.Equal(WebhookEventStatus.Pending, savedEvent!.Status);
        Assert.Equal("1.2.3.4", savedEvent.SourceIp);
        Assert.Equal(body, savedEvent.PayloadJson);
        Assert.Null(savedEvent.SignatureValid);  // không verify -> null
    }

    // ────────────────────────────────────────────────────────
    // Event type & external ID extraction
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task ProcessIncomingWebhookAsync_ExtractsEventType_FromHeader()
    {
        var (ctx, endpoint) = BuildContext();
        var svc = new IncomingWebhookService(ctx, MockVerifier(true).Object);

        var headers = new Dictionary<string, string> { { "X-GitHub-Event", "push" } };
        var eventId = await svc.ProcessIncomingWebhookAsync(endpoint.Slug, "{}", headers, null);

        var ev = await ctx.WebhookEvents.FindAsync(eventId);
        Assert.Equal("push", ev!.EventType);
    }

    [Fact]
    public async Task ProcessIncomingWebhookAsync_ExtractsEventType_FromPayloadJson()
    {
        var (ctx, endpoint) = BuildContext();
        var svc = new IncomingWebhookService(ctx, MockVerifier(true).Object);

        var body = "{\"eventType\":\"order.created\"}";
        var eventId = await svc.ProcessIncomingWebhookAsync(endpoint.Slug, body, new Dictionary<string, string>(), null);

        var ev = await ctx.WebhookEvents.FindAsync(eventId);
        Assert.Equal("order.created", ev!.EventType);
    }

    [Fact]
    public async Task ProcessIncomingWebhookAsync_FallsBackToUnknown_WhenNoEventType()
    {
        var (ctx, endpoint) = BuildContext();
        var svc = new IncomingWebhookService(ctx, MockVerifier(true).Object);

        var eventId = await svc.ProcessIncomingWebhookAsync(
            endpoint.Slug, "{\"data\":\"something\"}", new Dictionary<string, string>(), null);

        var ev = await ctx.WebhookEvents.FindAsync(eventId);
        Assert.Equal("unknown", ev!.EventType);
    }

    [Fact]
    public async Task ProcessIncomingWebhookAsync_ExtractsExternalId_FromHeader()
    {
        var (ctx, endpoint) = BuildContext();
        var svc = new IncomingWebhookService(ctx, MockVerifier(true).Object);

        var headers = new Dictionary<string, string> { { "X-GitHub-Delivery", "delivery-id-xyz" } };
        var eventId = await svc.ProcessIncomingWebhookAsync(endpoint.Slug, "{}", headers, null);

        var ev = await ctx.WebhookEvents.FindAsync(eventId);
        Assert.Equal("delivery-id-xyz", ev!.ExternalEventId);
    }

    // ────────────────────────────────────────────────────────
    // Signature verification
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task ProcessIncomingWebhookAsync_SetsSignatureValid_True_WhenSignatureOk()
    {
        var (ctx, endpoint) = BuildContext(verifySignature: true, rejectInvalidSignature: false);
        var verifier = MockVerifier(true);
        var svc = new IncomingWebhookService(ctx, verifier.Object);

        var headers = new Dictionary<string, string> { { "X-Webhook-Signature", "valid-sig" } };
        var eventId = await svc.ProcessIncomingWebhookAsync(endpoint.Slug, "{}", headers, null);

        var ev = await ctx.WebhookEvents.FindAsync(eventId);
        Assert.True(ev!.SignatureValid);
        Assert.Equal(WebhookEventStatus.Pending, ev.Status);
    }

    [Fact]
    public async Task ProcessIncomingWebhookAsync_SetsInvalidSignatureStatus_WhenSignatureFails()
    {
        var (ctx, endpoint) = BuildContext(verifySignature: true, rejectInvalidSignature: false);
        var verifier = MockVerifier(false);
        var svc = new IncomingWebhookService(ctx, verifier.Object);

        var headers = new Dictionary<string, string> { { "X-Webhook-Signature", "bad-sig" } };
        var eventId = await svc.ProcessIncomingWebhookAsync(endpoint.Slug, "{}", headers, null);

        var ev = await ctx.WebhookEvents.FindAsync(eventId);
        Assert.False(ev!.SignatureValid);
        Assert.Equal(WebhookEventStatus.InvalidSignature, ev.Status);
    }

    [Fact]
    public async Task ProcessIncomingWebhookAsync_SetsInvalidSignature_WhenHeaderMissing()
    {
        var (ctx, endpoint) = BuildContext(verifySignature: true, rejectInvalidSignature: false);
        var svc = new IncomingWebhookService(ctx, MockVerifier(true).Object);

        // Không gửi header signature
        var eventId = await svc.ProcessIncomingWebhookAsync(
            endpoint.Slug, "{}", new Dictionary<string, string>(), null);

        var ev = await ctx.WebhookEvents.FindAsync(eventId);
        Assert.False(ev!.SignatureValid);
        Assert.Equal(WebhookEventStatus.InvalidSignature, ev.Status);
    }

    [Fact]
    public async Task ProcessIncomingWebhookAsync_Throws_WhenRejectInvalidSignature_IsTrue()
    {
        var (ctx, endpoint) = BuildContext(verifySignature: true, rejectInvalidSignature: true);
        var verifier = MockVerifier(false);
        var svc = new IncomingWebhookService(ctx, verifier.Object);

        var headers = new Dictionary<string, string> { { "X-Webhook-Signature", "wrong-sig" } };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.ProcessIncomingWebhookAsync(endpoint.Slug, "{}", headers, null));
    }

    [Fact]
    public async Task ProcessIncomingWebhookAsync_SavesEvent_EvenWhenSignatureInvalid_AndNotRejecting()
    {
        var (ctx, endpoint) = BuildContext(verifySignature: true, rejectInvalidSignature: false);
        var verifier = MockVerifier(false);
        var svc = new IncomingWebhookService(ctx, verifier.Object);

        var headers = new Dictionary<string, string> { { "X-Webhook-Signature", "bad-sig" } };

        // Không throw - chỉ lưu event với status InvalidSignature
        var eventId = await svc.ProcessIncomingWebhookAsync(endpoint.Slug, "{}", headers, null);

        var ev = await ctx.WebhookEvents.FindAsync(eventId);
        Assert.NotNull(ev);
        Assert.Equal(WebhookEventStatus.InvalidSignature, ev!.Status);
    }
}
