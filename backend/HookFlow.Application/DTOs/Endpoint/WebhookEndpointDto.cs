namespace HookFlow.Application.DTOs.Endpoint;

public class WebhookEndpointDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string WebhookUrl { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string[]? AllowedEventTypes { get; set; }
    public bool VerifySignature { get; set; }
    public string SignatureHeaderName { get; set; } = "X-Webhook-Signature";
    public bool RejectInvalidSignature { get; set; }
    public int MaxRetryAttempts { get; set; }
    public string RetryStrategy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
