using Microsoft.EntityFrameworkCore;
using HookFlow.Application.Interfaces;
using HookFlow.Application.Interfaces.Services;
using HookFlow.Domain.Entities;
using HookFlow.Domain.Enums;
using System.Text.Json;

namespace HookFlow.Application.Services;

public class IncomingWebhookService : IIncomingWebhookService
{
    private readonly IApplicationDbContext _context;

    public IncomingWebhookService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> ProcessIncomingWebhookAsync(string slug, string rawBody, Dictionary<string, string> headers, string? sourceIp)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            throw new ArgumentException("Slug cannot be empty.", nameof(slug));
        }

        // 1. Find the endpoint by slug
        var endpoint = await _context.WebhookEndpoints
            .FirstOrDefaultAsync(e => e.Slug == slug);

        if (endpoint == null)
        {
            throw new KeyNotFoundException($"Webhook endpoint not found with slug '{slug}'.");
        }

        // 2. If endpoint is inactive, reject it
        if (!endpoint.IsActive)
        {
            throw new InvalidOperationException($"The requested webhook endpoint '{endpoint.Name}' is currently inactive.");
        }

        // 3. Extract event metadata
        string eventType = ExtractEventType(headers, rawBody);
        string externalEventId = ExtractExternalEventId(headers, rawBody);

        // 4. Create and save the webhook event
        var webhookEvent = new WebhookEvent
        {
            EndpointId = endpoint.Id,
            ExternalEventId = externalEventId,
            EventType = eventType,
            PayloadJson = rawBody,
            HeadersJson = JsonSerializer.Serialize(headers),
            SourceIp = sourceIp,
            Status = WebhookEventStatus.Pending,
            RetryCount = 0,
            ReceivedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.WebhookEvents.Add(webhookEvent);
        await _context.SaveChangesAsync();

        return webhookEvent.Id;
    }

    #region Helper Methods

    private string ExtractEventType(Dictionary<string, string> headers, string rawBody)
    {
        var normalizedHeaders = headers.ToDictionary(h => h.Key.ToLowerInvariant(), h => h.Value);

        var headersToTry = new[] { "x-webhook-event", "x-github-event", "x-event", "webhook-event", "event-type" };
        foreach (var header in headersToTry)
        {
            if (normalizedHeaders.TryGetValue(header, out var val) && !string.IsNullOrWhiteSpace(val))
            {
                return val.Trim();
            }
        }

        if (!string.IsNullOrWhiteSpace(rawBody))
        {
            try
            {
                using (var doc = JsonDocument.Parse(rawBody))
                {
                    var root = doc.RootElement;
                    var propsToTry = new[] { "event", "eventType", "event_type", "type", "action" };
                    foreach (var prop in propsToTry)
                    {
                        if (root.TryGetProperty(prop, out var val) && val.ValueKind == JsonValueKind.String)
                        {
                            var s = val.GetString();
                            if (!string.IsNullOrWhiteSpace(s)) return s.Trim();
                        }
                    }
                }
            }
            catch
            {
                // ignore parsing exceptions
            }
        }

        return "unknown";
    }

    private string ExtractExternalEventId(Dictionary<string, string> headers, string rawBody)
    {
        var normalizedHeaders = headers.ToDictionary(h => h.Key.ToLowerInvariant(), h => h.Value);

        var headersToTry = new[] { "x-webhook-id", "x-github-delivery", "webhook-event-id", "event-id" };
        foreach (var header in headersToTry)
        {
            if (normalizedHeaders.TryGetValue(header, out var val) && !string.IsNullOrWhiteSpace(val))
            {
                return val.Trim();
            }
        }

        if (!string.IsNullOrWhiteSpace(rawBody))
        {
            try
            {
                using (var doc = JsonDocument.Parse(rawBody))
                {
                    var root = doc.RootElement;
                    var propsToTry = new[] { "id", "eventId", "event_id", "delivery_id" };
                    foreach (var prop in propsToTry)
                    {
                        if (root.TryGetProperty(prop, out var val) && val.ValueKind == JsonValueKind.String)
                        {
                            var s = val.GetString();
                            if (!string.IsNullOrWhiteSpace(s)) return s.Trim();
                        }
                    }
                }
            }
            catch
            {
                // ignore parsing exceptions
            }
        }

        return Guid.NewGuid().ToString(); // fallback to random UUID
    }

    #endregion
}
