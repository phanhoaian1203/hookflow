using HookFlow.Application.DTOs.Dashboard;
using HookFlow.Application.DTOs.Event;

namespace HookFlow.Application.Interfaces.Services;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(Guid userId);
    Task<List<EventOverTimeDto>> GetEventsOverTimeAsync(Guid userId);
    Task<List<StatusDistributionDto>> GetStatusDistributionAsync(Guid userId);
    Task<List<WebhookEventDto>> GetRecentEventsAsync(Guid userId, int count = 5);
}
