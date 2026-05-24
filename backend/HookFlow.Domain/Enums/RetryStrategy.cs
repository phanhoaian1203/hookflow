namespace HookFlow.Domain.Enums;

public enum RetryStrategy
{
    None,
    LinearBackoff,
    ExponentialBackoff
}
