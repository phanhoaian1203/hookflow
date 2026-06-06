using HookFlow.Application.DTOs.Auth;
using HookFlow.Application.Interfaces.Security;
using HookFlow.Application.Services;
using HookFlow.Domain.Entities;
using HookFlow.Tests.Helpers;
using Moq;

namespace HookFlow.Tests.UnitTests;

public class AuthServiceTests
{
    // ────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────

    private static (TestDbContext ctx, Mock<IPasswordHasher> hasher, Mock<IJwtTokenGenerator> jwt) BuildMocks()
    {
        var ctx = TestDbContext.CreateFresh();

        var hasher = new Mock<IPasswordHasher>();
        // HashPassword trả về chuỗi hash giả
        hasher.Setup(h => h.HashPassword(It.IsAny<string>())).Returns("hashed_password");
        // VerifyPassword mặc định true
        hasher.Setup(h => h.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(true);

        var jwt = new Mock<IJwtTokenGenerator>();
        jwt.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("jwt.token.value");

        return (ctx, hasher, jwt);
    }

    // ────────────────────────────────────────────────────────
    // RegisterAsync
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task RegisterAsync_ReturnsAuthResponse_WithAccessToken()
    {
        var (ctx, hasher, jwt) = BuildMocks();
        var svc = new AuthService(ctx, hasher.Object, jwt.Object);

        var request = new RegisterRequest
        {
            FullName = "Alice Smith",
            Email = "alice@example.com",
            Password = "Password123!"
        };

        var response = await svc.RegisterAsync(request);

        Assert.Equal("jwt.token.value", response.AccessToken);
        Assert.Equal("alice@example.com", response.User.Email);
        Assert.Equal("Alice Smith", response.User.FullName);
        Assert.Equal("User", response.User.Role);
    }

    [Fact]
    public async Task RegisterAsync_PersistsUser_InDatabase()
    {
        var (ctx, hasher, jwt) = BuildMocks();
        var svc = new AuthService(ctx, hasher.Object, jwt.Object);

        var request = new RegisterRequest
        {
            FullName = "Bob",
            Email = "bob@example.com",
            Password = "pass"
        };

        var response = await svc.RegisterAsync(request);

        var user = await ctx.Users.FindAsync(response.User.Id);
        Assert.NotNull(user);
        Assert.Equal("hashed_password", user!.PasswordHash);
    }

    [Fact]
    public async Task RegisterAsync_Throws_WhenEmailAlreadyTaken()
    {
        var (ctx, hasher, jwt) = BuildMocks();
        ctx.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FullName = "Existing",
            Email = "existing@example.com",
            PasswordHash = "h"
        });
        await ctx.SaveChangesAsync();

        var svc = new AuthService(ctx, hasher.Object, jwt.Object);

        var request = new RegisterRequest
        {
            FullName = "Clone",
            Email = "EXISTING@EXAMPLE.COM",   // case insensitive test
            Password = "pass"
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.RegisterAsync(request));
    }

    [Fact]
    public async Task RegisterAsync_HashesPassword_UsingPasswordHasher()
    {
        var (ctx, hasher, jwt) = BuildMocks();
        var svc = new AuthService(ctx, hasher.Object, jwt.Object);

        var request = new RegisterRequest { FullName = "X", Email = "x@x.com", Password = "plaintext" };
        await svc.RegisterAsync(request);

        hasher.Verify(h => h.HashPassword("plaintext"), Times.Once);
    }

    // ────────────────────────────────────────────────────────
    // LoginAsync
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_ReturnsAuthResponse_WhenCredentialsValid()
    {
        var (ctx, hasher, jwt) = BuildMocks();
        ctx.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FullName = "Alice",
            Email = "alice@example.com",
            PasswordHash = "hashed_password",
            IsActive = true
        });
        await ctx.SaveChangesAsync();

        var svc = new AuthService(ctx, hasher.Object, jwt.Object);

        var response = await svc.LoginAsync(new LoginRequest
        {
            Email = "alice@example.com",
            Password = "any_password"
        });

        Assert.Equal("jwt.token.value", response.AccessToken);
        Assert.Equal("Alice", response.User.FullName);
    }

    [Fact]
    public async Task LoginAsync_Throws_WhenEmailNotFound()
    {
        var (ctx, hasher, jwt) = BuildMocks();
        var svc = new AuthService(ctx, hasher.Object, jwt.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => svc.LoginAsync(new LoginRequest { Email = "nobody@x.com", Password = "pass" }));
    }

    [Fact]
    public async Task LoginAsync_Throws_WhenUserIsInactive()
    {
        var (ctx, hasher, jwt) = BuildMocks();
        ctx.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FullName = "Disabled",
            Email = "disabled@x.com",
            PasswordHash = "h",
            IsActive = false
        });
        await ctx.SaveChangesAsync();

        var svc = new AuthService(ctx, hasher.Object, jwt.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => svc.LoginAsync(new LoginRequest { Email = "disabled@x.com", Password = "pass" }));
    }

    [Fact]
    public async Task LoginAsync_Throws_WhenPasswordInvalid()
    {
        var (ctx, hasher, jwt) = BuildMocks();
        // Override: VerifyPassword trả false
        hasher.Setup(h => h.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(false);

        ctx.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FullName = "Alice",
            Email = "alice@x.com",
            PasswordHash = "hashed_password",
            IsActive = true
        });
        await ctx.SaveChangesAsync();

        var svc = new AuthService(ctx, hasher.Object, jwt.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => svc.LoginAsync(new LoginRequest { Email = "alice@x.com", Password = "wrong" }));
    }

    // ────────────────────────────────────────────────────────
    // GetCurrentUserAsync
    // ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetCurrentUserAsync_ReturnsUserDto_WhenUserExists()
    {
        var (ctx, hasher, jwt) = BuildMocks();
        var userId = Guid.NewGuid();
        ctx.Users.Add(new User
        {
            Id = userId,
            FullName = "Charlie",
            Email = "charlie@x.com",
            PasswordHash = "h",
            Role = "Admin"
        });
        await ctx.SaveChangesAsync();

        var svc = new AuthService(ctx, hasher.Object, jwt.Object);

        var dto = await svc.GetCurrentUserAsync(userId);

        Assert.Equal(userId, dto.Id);
        Assert.Equal("Charlie", dto.FullName);
        Assert.Equal("Admin", dto.Role);
    }

    [Fact]
    public async Task GetCurrentUserAsync_Throws_WhenUserNotFound()
    {
        var (ctx, hasher, jwt) = BuildMocks();
        var svc = new AuthService(ctx, hasher.Object, jwt.Object);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.GetCurrentUserAsync(Guid.NewGuid()));
    }
}
