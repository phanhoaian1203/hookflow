using HookFlow.Domain.Common;
using HookFlow.Domain.Enums;

namespace HookFlow.Domain.Entities;

public class WebhookEndpoint : BaseEntity
{
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Slug { get; set; } = string.Empty;
    public WebhookProvider Provider { get; set; } = WebhookProvider.Generic;
    public string? SecretKey { get; set; }
    public bool IsActive { get; set; } = true;
    public string[]? AllowedEventTypes { get; set; }
    public bool VerifySignature { get; set; } = false;
    public string SignatureHeaderName { get; set; } = "X-Webhook-Signature";
    public bool RejectInvalidSignature { get; set; } = false;
    public int MaxRetryAttempts { get; set; } = 5;
    public RetryStrategy RetryStrategy { get; set; } = RetryStrategy.ExponentialBackoff;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Project Project { get; set; } = null!;
    public ICollection<WebhookEvent> Events { get; set; } = [];
}
