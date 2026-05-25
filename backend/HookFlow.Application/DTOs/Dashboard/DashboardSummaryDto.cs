namespace HookFlow.Application.DTOs.Dashboard;

public class DashboardSummaryDto
{
    public int TotalEvents { get; set; }
    public int ProcessedEvents { get; set; }
    public int FailedEvents { get; set; }
    public int RetryingEvents { get; set; }
    public int DeadEvents { get; set; }
    public int PendingEvents { get; set; }
    public double FailureRate { get; set; }
    public double AvgProcessingTimeMs { get; set; }
    public int EventsToday { get; set; }
}
