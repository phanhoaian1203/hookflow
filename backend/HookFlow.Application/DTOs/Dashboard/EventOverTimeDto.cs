namespace HookFlow.Application.DTOs.Dashboard;

public class EventOverTimeDto
{
    public string Day { get; set; } = string.Empty;
    public int Count { get; set; }
    public int Failed { get; set; }
}
