using HookFlow.Domain.Entities;
using HookFlow.Domain.Enums;
using Xunit;

namespace HookFlow.Tests.UnitTests;

public class WebhookEventTests
{
    [Fact]
    public void WebhookEvent_ShouldHaveDefaultValues_OnCreation()
    {
        // Act
        var webhookEvent = new WebhookEvent();

        // Assert
        Assert.Equal(WebhookEventStatus.Pending, webhookEvent.Status);
        Assert.Equal(0, webhookEvent.RetryCount);
        Assert.Equal(5, webhookEvent.MaxRetryAttempts);
        Assert.Null(webhookEvent.NextRetryAt);
        Assert.Null(webhookEvent.ErrorMessage);
        Assert.Null(webhookEvent.ProcessedAt);
        Assert.True((DateTime.UtcNow - webhookEvent.ReceivedAt).TotalSeconds < 5);
        Assert.True((DateTime.UtcNow - webhookEvent.CreatedAt).TotalSeconds < 5);
        Assert.Empty(webhookEvent.ProcessingAttempts);
    }

    [Fact]
    public void WebhookEvent_ShouldAllowUpdatingStatusAndAttempts()
    {
        // Arrange
        var webhookEvent = new WebhookEvent();
        var attempt = new ProcessingAttempt
        {
            Id = Guid.NewGuid(),
            AttemptNumber = 1,
            Status = "Success",
            StartedAt = DateTime.UtcNow,
            FinishedAt = DateTime.UtcNow,
            DurationMs = 150
        };

        // Act
        webhookEvent.Status = WebhookEventStatus.Processed;
        webhookEvent.ProcessedAt = DateTime.UtcNow;
        webhookEvent.ProcessingAttempts.Add(attempt);

        // Assert
        Assert.Equal(WebhookEventStatus.Processed, webhookEvent.Status);
        Assert.NotNull(webhookEvent.ProcessedAt);
        Assert.Single(webhookEvent.ProcessingAttempts);
        Assert.Equal(attempt, webhookEvent.ProcessingAttempts.First());
    }
}
