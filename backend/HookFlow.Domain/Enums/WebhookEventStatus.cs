namespace HookFlow.Domain.Enums;

public enum WebhookEventStatus
{
    Pending,
    Processing,
    Processed,
    Failed,
    Retrying,
    Dead,
    Ignored,
    InvalidSignature,
    Duplicate
}
