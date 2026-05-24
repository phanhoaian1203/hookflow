using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HookFlow.Application.DTOs.Endpoint;
using HookFlow.Application.Interfaces.Services;

namespace HookFlow.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/webhook-endpoints")]
public class WebhookEndpointsController : ControllerBase
{
    private readonly IWebhookEndpointService _endpointService;
    private readonly IValidator<CreateEndpointRequest> _createValidator;
    private readonly IValidator<UpdateEndpointRequest> _updateValidator;

    public WebhookEndpointsController(
        IWebhookEndpointService endpointService,
        IValidator<CreateEndpointRequest> createValidator,
        IValidator<UpdateEndpointRequest> updateValidator)
    {
        _endpointService = endpointService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
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
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var userId = GetUserId();
            var endpoints = await _endpointService.GetAllUserEndpointsAsync(userId);
            return Ok(new
            {
                success = true,
                data = endpoints,
                message = "Webhook endpoints retrieved successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetByProject(Guid projectId)
    {
        try
        {
            var userId = GetUserId();
            var endpoints = await _endpointService.GetProjectEndpointsAsync(projectId, userId);
            return Ok(new
            {
                success = true,
                data = endpoints,
                message = "Project webhook endpoints retrieved successfully"
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
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var endpoint = await _endpointService.GetEndpointByIdAsync(id, userId);
            return Ok(new
            {
                success = true,
                data = endpoint,
                message = "Webhook endpoint retrieved successfully"
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
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEndpointRequest request)
    {
        var validationResult = await _createValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return UnprocessableEntity(new
            {
                success = false,
                data = (object?)null,
                message = "Validation failed",
                errors = errors
            });
        }

        try
        {
            var userId = GetUserId();
            var result = await _endpointService.CreateEndpointAsync(request, userId);
            return StatusCode(201, new
            {
                success = true,
                data = new
                {
                    endpoint = result.Endpoint,
                    secretKey = result.PlainSecret
                },
                message = "Webhook endpoint created successfully"
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
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEndpointRequest request)
    {
        var validationResult = await _updateValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return UnprocessableEntity(new
            {
                success = false,
                data = (object?)null,
                message = "Validation failed",
                errors = errors
            });
        }

        try
        {
            var userId = GetUserId();
            var endpoint = await _endpointService.UpdateEndpointAsync(id, request, userId);
            return Ok(new
            {
                success = true,
                data = endpoint,
                message = "Webhook endpoint updated successfully"
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
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var endpoint = await _endpointService.ToggleEndpointActiveAsync(id, userId);
            return Ok(new
            {
                success = true,
                data = endpoint,
                message = "Webhook endpoint status toggled successfully"
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
    }

    [HttpPost("{id:guid}/rotate-secret")]
    public async Task<IActionResult> RotateSecret(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var newSecret = await _endpointService.RotateSecretAsync(id, userId);
            return Ok(new
            {
                success = true,
                data = new
                {
                    secretKey = newSecret
                },
                message = "Webhook endpoint secret key rotated successfully"
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
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _endpointService.DeleteEndpointAsync(id, userId);
            return Ok(new
            {
                success = true,
                data = (object?)null,
                message = "Webhook endpoint deleted successfully"
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
    }
}
