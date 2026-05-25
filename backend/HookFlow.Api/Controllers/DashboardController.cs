using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HookFlow.Application.Interfaces.Services;

namespace HookFlow.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
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

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        try
        {
            var userId = GetUserId();
            var result = await _dashboardService.GetSummaryAsync(userId);
            return Ok(new
            {
                success = true,
                data = result,
                message = "Dashboard summary metrics retrieved successfully"
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
                message = "An error occurred while fetching dashboard summary metrics",
                errors = new[] { ex.Message }
            });
        }
    }

    [HttpGet("events-over-time")]
    public async Task<IActionResult> GetEventsOverTime()
    {
        try
        {
            var userId = GetUserId();
            var result = await _dashboardService.GetEventsOverTimeAsync(userId);
            return Ok(new
            {
                success = true,
                data = result,
                message = "Event logs volume statistics over time retrieved successfully"
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
                message = "An error occurred while fetching event logs volume statistics",
                errors = new[] { ex.Message }
            });
        }
    }

    [HttpGet("status-distribution")]
    public async Task<IActionResult> GetStatusDistribution()
    {
        try
        {
            var userId = GetUserId();
            var result = await _dashboardService.GetStatusDistributionAsync(userId);
            return Ok(new
            {
                success = true,
                data = result,
                message = "Event status distribution breakdown retrieved successfully"
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
                message = "An error occurred while fetching event status distribution breakdown",
                errors = new[] { ex.Message }
            });
        }
    }

    [HttpGet("recent-events")]
    public async Task<IActionResult> GetRecentEvents([FromQuery] int count = 5)
    {
        try
        {
            var userId = GetUserId();
            var result = await _dashboardService.GetRecentEventsAsync(userId, count);
            return Ok(new
            {
                success = true,
                data = result,
                message = "Recent webhook events retrieved successfully"
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
                message = "An error occurred while fetching recent webhook events",
                errors = new[] { ex.Message }
            });
        }
    }
}
