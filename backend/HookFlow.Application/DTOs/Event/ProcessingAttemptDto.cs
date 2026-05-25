namespace HookFlow.Application.DTOs.Event;

public class ProcessingAttemptDto
{
    public Guid Id { get; set; }
    public Guid WebhookEventId { get; set; }
    public int AttemptNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public int? DurationMs { get; set; }
    public string? ErrorMessage { get; set; }
    public string? WorkerName { get; set; }
    public DateTime CreatedAt { get; set; }
}
