using HookFlow.Domain.Common;

namespace HookFlow.Domain.Entities;

public class ProcessingAttempt : BaseEntity
{
    public Guid WebhookEventId { get; set; }
    public int AttemptNumber { get; set; }
    public string Status { get; set; } = string.Empty; // "Success" | "Failed"
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }
    public int? DurationMs { get; set; }
    public string? ErrorMessage { get; set; }
    public string? WorkerName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public WebhookEvent WebhookEvent { get; set; } = null!;
}
