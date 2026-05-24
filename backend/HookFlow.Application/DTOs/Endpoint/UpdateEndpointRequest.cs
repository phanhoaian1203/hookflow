namespace HookFlow.Application.DTOs.Endpoint;

public class UpdateEndpointRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string[]? AllowedEventTypes { get; set; }
    public string SignatureHeaderName { get; set; } = "X-Webhook-Signature";
    public bool RejectInvalidSignature { get; set; } = false;
    public int MaxRetryAttempts { get; set; } = 5;
    public string RetryStrategy { get; set; } = "ExponentialBackoff";
}
