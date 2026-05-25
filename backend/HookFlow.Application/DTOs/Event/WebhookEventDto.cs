namespace HookFlow.Application.DTOs.Event;

public class WebhookEventDto
{
    public Guid Id { get; set; }
    public Guid EndpointId { get; set; }
    public string EndpointName { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string? ExternalEventId { get; set; }
    public string? EventType { get; set; }
    public string? PayloadJson { get; set; }
    public string? HeadersJson { get; set; }
    public string? SourceIp { get; set; }
    public bool? SignatureValid { get; set; }
    public string Status { get; set; } = string.Empty;
    public int RetryCount { get; set; }
    public DateTime? NextRetryAt { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime ReceivedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<ProcessingAttemptDto> ProcessingAttempts { get; set; } = [];
}
