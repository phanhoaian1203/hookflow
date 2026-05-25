using HookFlow.Application.DTOs.Endpoint;

namespace HookFlow.Application.Interfaces.Services;

public interface IWebhookEndpointService
{
    Task<IEnumerable<WebhookEndpointDto>> GetProjectEndpointsAsync(Guid projectId, Guid userId);
    Task<IEnumerable<WebhookEndpointDto>> GetAllUserEndpointsAsync(Guid userId);
    Task<WebhookEndpointDto> GetEndpointByIdAsync(Guid endpointId, Guid userId);
    Task<(WebhookEndpointDto Endpoint, string PlainSecret)> CreateEndpointAsync(CreateEndpointRequest request, Guid userId);
    Task<WebhookEndpointDto> UpdateEndpointAsync(Guid endpointId, UpdateEndpointRequest request, Guid userId);
    Task<string> RotateSecretAsync(Guid endpointId, Guid userId);
    Task<string> GetEndpointSecretAsync(Guid endpointId, Guid userId);
    Task<WebhookEndpointDto> ToggleEndpointActiveAsync(Guid endpointId, Guid userId);
    Task DeleteEndpointAsync(Guid endpointId, Guid userId);
}
