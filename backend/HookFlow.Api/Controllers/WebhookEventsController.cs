using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HookFlow.Application.DTOs.Event;
using HookFlow.Application.Interfaces.Services;

namespace HookFlow.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/webhook-events")]
public class WebhookEventsController : ControllerBase
{
    private readonly IWebhookEventService _eventService;

    public WebhookEventsController(IWebhookEventService eventService)
    {
        _eventService = eventService;
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("User session is invalid. Please log in again.");
        }
        return userId;
    }

    [HttpGet]
    public async Task<IActionResult> GetEvents([FromQuery] GetEventsRequest request)
    {
        try
        {
            var userId = GetUserId();
            var result = await _eventService.GetEventsAsync(request, userId);
            
            return Ok(new
            {
                success = true,
                data = result,
                message = "Webhook events retrieved successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                data = (object?)null,
                message = "An error occurred while fetching webhook events",
                errors = new[] { ex.Message }
            });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var ev = await _eventService.GetEventByIdAsync(id, userId);
            
            return Ok(new
            {
                success = true,
                data = ev,
                message = "Webhook event details retrieved successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
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
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                data = (object?)null,
                message = "An error occurred while fetching webhook event details",
                errors = new[] { ex.Message }
            });
        }
    }

    [HttpPost("{id:guid}/replay")]
    public async Task<IActionResult> ReplayEvent(Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _eventService.ReplayEventAsync(id, userId);
            
            return Ok(new
            {
                success = true,
                data = (object?)null,
                message = "Event has been queued for replay successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
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
            return BadRequest(new
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
                message = "An error occurred while replaying webhook event",
                errors = new[] { ex.Message }
            });
        }
    }

    [HttpPost("{id:guid}/ignore")]
    public async Task<IActionResult> IgnoreEvent(Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _eventService.IgnoreEventAsync(id, userId);
            
            return Ok(new
            {
                success = true,
                data = (object?)null,
                message = "Event has been ignored successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
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
            return BadRequest(new
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
                message = "An error occurred while ignoring webhook event",
                errors = new[] { ex.Message }
            });
        }
    }
}
