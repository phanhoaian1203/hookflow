namespace HookFlow.Application.DTOs.Event;

public class GetEventsRequest
{
    public string? Status { get; set; }
    public Guid? EndpointId { get; set; }
    public Guid? ProjectId { get; set; }
    public string? EventType { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
