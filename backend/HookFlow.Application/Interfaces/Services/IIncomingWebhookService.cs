namespace HookFlow.Application.Interfaces.Services;

public interface IIncomingWebhookService
{
    Task<Guid> ProcessIncomingWebhookAsync(string slug, string rawBody, Dictionary<string, string> headers, string? sourceIp);
}
