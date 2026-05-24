using Microsoft.AspNetCore.Mvc;
using HookFlow.Infrastructure.Persistence;

namespace HookFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly HookFlowDbContext _dbContext;

    public HealthController(HookFlowDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var dbConnected = false;
        try
        {
            dbConnected = await _dbContext.Database.CanConnectAsync();
        }
        catch
        {
            // Ignore connection errors and report unhealthy db
        }

        return Ok(new
        {
            status = dbConnected ? "healthy" : "degraded",
            service = "HookFlow.Api",
            database = dbConnected ? "connected" : "disconnected"
        });
    }
}
