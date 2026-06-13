using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HookFlow.Application.DTOs.Auth;
using HookFlow.Application.Interfaces.Services;

namespace HookFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IValidator<RegisterRequest> _registerValidator;
    private readonly IValidator<LoginRequest> _loginValidator;

    public AuthController(
        IAuthService authService,
        IValidator<RegisterRequest> registerValidator,
        IValidator<LoginRequest> loginValidator)
    {
        _authService = authService;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var validationResult = await _registerValidator.ValidateAsync(request);
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
            var response = await _authService.RegisterAsync(request);
            return StatusCode(201, new
            {
                success = true,
                data = response,
                message = "Registration successful"
            });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                success = false,
                data = (object?)null,
                message = ex.Message,
                errors = new[] { ex.Message }
            });
        }
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var validationResult = await _loginValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(new
            {
                success = false,
                data = (object?)null,
                message = "Validation failed",
                errors = errors
            });
        }

        try
        {
            // 2. Perform login
            var response = await _authService.LoginAsync(request);
            return Ok(new
            {
                success = true,
                data = response,
                message = "Login successful"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new
            {
                success = false,
                data = (object?)null,
                message = ex.Message,
                errors = new[] { ex.Message }
            });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new
            {
                success = false,
                data = (object?)null,
                message = "Unauthorized claim",
                errors = new[] { "User ID claim is missing from token." }
            });
        }

        if (!Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return BadRequest(new
            {
                success = false,
                data = (object?)null,
                message = "Invalid user ID claim",
                errors = new[] { "User ID claim is not a valid GUID." }
            });
        }

        try
        {
            // 2. Fetch current profile
            var user = await _authService.GetCurrentUserAsync(userId);
            return Ok(new
            {
                success = true,
                data = user,
                message = "Profile retrieved successfully"
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
    }
}
