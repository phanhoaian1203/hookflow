using HookFlow.Domain.Common;
using HookFlow.Domain.Enums;

namespace HookFlow.Domain.Entities;

public class WebhookEvent : BaseEntity
{
    public Guid EndpointId { get; set; }
    public string? ExternalEventId { get; set; }
    public string? EventType { get; set; }
    public string? PayloadJson { get; set; }
    public string? HeadersJson { get; set; }
    public string? SourceIp { get; set; }
    public bool? SignatureValid { get; set; }
    public WebhookEventStatus Status { get; set; } = WebhookEventStatus.Pending;
    public int RetryCount { get; set; } = 0;
    public int MaxRetryAttempts { get; set; } = 5;
    public DateTime? NextRetryAt { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public WebhookEndpoint Endpoint { get; set; } = null!;
    public ICollection<ProcessingAttempt> ProcessingAttempts { get; set; } = [];
}
