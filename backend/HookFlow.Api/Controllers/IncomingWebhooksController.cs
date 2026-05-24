using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HookFlow.Application.Interfaces.Services;

namespace HookFlow.Api.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/incoming-webhooks")]
public class IncomingWebhooksController : ControllerBase
{
    private readonly IIncomingWebhookService _incomingWebhookService;

    public IncomingWebhooksController(IIncomingWebhookService incomingWebhookService)
    {
        _incomingWebhookService = incomingWebhookService;
    }

    [HttpPost("{slug}")]
    public async Task<IActionResult> Receive(string slug)
    {
        // Enable buffering so the request body can be read multiple times (e.g. for signature validation)
        Request.EnableBuffering();

        // Read all headers
        var headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString());

        // Read raw body
        string rawBody = string.Empty;
        using (var reader = new System.IO.StreamReader(
            Request.Body, 
            encoding: System.Text.Encoding.UTF8, 
            detectEncodingFromByteOrderMarks: true, 
            bufferSize: 1024, 
            leaveOpen: true))
        {
            rawBody = await reader.ReadToEndAsync();
            // Reset position to allow future reads
            Request.Body.Position = 0;
        }

        // Get Client IP Address (handling proxies like Nginx or Cloudflare)
        string? sourceIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            sourceIp = forwardedFor.FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
        }

        try
        {
            var eventId = await _incomingWebhookService.ProcessIncomingWebhookAsync(slug, rawBody, headers, sourceIp);
            
            // Return 202 Accepted as webhooks are typically processed asynchronously
            return Accepted(new
            {
                success = true,
                data = new { eventId },
                message = "Webhook event received and queued for processing"
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new
            {
                success = false,
                data = (object?)null,
                message = ex.Message,
                errors = new[] { ex.Message }
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(403, new
            {
                success = false,
                data = (object?)null,
                message = ex.Message,
                errors = new[] { ex.Message }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                data = (object?)null,
                message = "An error occurred while processing the incoming webhook event",
                errors = new[] { ex.Message }
            });
        }
    }
}
