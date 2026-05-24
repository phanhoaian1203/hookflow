namespace HookFlow.Application.DTOs.Endpoint;

public class CreateEndpointRequest
{
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Provider { get; set; } = "Generic";
    public string[]? AllowedEventTypes { get; set; }
    public string SignatureHeaderName { get; set; } = "X-Webhook-Signature";
    public bool RejectInvalidSignature { get; set; } = false;
    public int MaxRetryAttempts { get; set; } = 5;
    public string RetryStrategy { get; set; } = "ExponentialBackoff";
}
