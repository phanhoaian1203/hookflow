using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HookFlow.Application.DTOs.Project;
using HookFlow.Application.Interfaces.Services;

namespace HookFlow.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly IValidator<CreateProjectRequest> _createValidator;
    private readonly IValidator<UpdateProjectRequest> _updateValidator;

    public ProjectsController(
        IProjectService projectService,
        IValidator<CreateProjectRequest> createValidator,
        IValidator<UpdateProjectRequest> updateValidator)
    {
        _projectService = projectService;
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
            var projects = await _projectService.GetUserProjectsAsync(userId);
            return Ok(new
            {
                success = true,
                data = projects,
                message = "Projects retrieved successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var project = await _projectService.GetProjectByIdAsync(id, userId);
            return Ok(new
            {
                success = true,
                data = project,
                message = "Project retrieved successfully"
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
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest request)
    {
        // 1. Validate payload
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
            var project = await _projectService.CreateProjectAsync(request, userId);
            return StatusCode(201, new
            {
                success = true,
                data = project,
                message = "Project created successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { success = false, message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectRequest request)
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
            var project = await _projectService.UpdateProjectAsync(id, request, userId);
            return Ok(new
            {
                success = true,
                data = project,
                message = "Project updated successfully"
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
            await _projectService.DeleteProjectAsync(id, userId);
            return Ok(new
            {
                success = true,
                data = (object?)null,
                message = "Project deleted successfully"
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
