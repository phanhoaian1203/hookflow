using HookFlow.Application.DTOs.Common;
using HookFlow.Application.DTOs.Event;

namespace HookFlow.Application.Interfaces.Services;

public interface IWebhookEventService
{
    Task<PagedResult<WebhookEventDto>> GetEventsAsync(GetEventsRequest request, Guid userId);
    Task<WebhookEventDto> GetEventByIdAsync(Guid eventId, Guid userId);
}
