using Microsoft.EntityFrameworkCore;
using HookFlow.Application.DTOs.Project;
using HookFlow.Application.Services;
using HookFlow.Domain.Entities;
using HookFlow.Tests.Helpers;

namespace HookFlow.Tests.UnitTests;

public class ProjectServiceTests
{


    private static (TestDbContext ctx, Guid userId, Guid otherUserId) BuildContext()
    {
        var ctx = TestDbContext.CreateFresh();

        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();

        ctx.Users.AddRange(
            new User { Id = userId, FullName = "Alice", Email = "alice@test.com", PasswordHash = "hash" },
            new User { Id = otherUserId, FullName = "Bob", Email = "bob@test.com", PasswordHash = "hash" }
        );

        ctx.Projects.AddRange(
            new Project { Id = Guid.NewGuid(), OwnerId = userId, Name = "Project Alpha", Status = "Active" },
            new Project { Id = Guid.NewGuid(), OwnerId = userId, Name = "Project Beta", Status = "Active" },
            new Project { Id = Guid.NewGuid(), OwnerId = otherUserId, Name = "Bob's Project", Status = "Active" }
        );

        ctx.SaveChanges();
        return (ctx, userId, otherUserId);
    }



    [Fact]
    public async Task GetUserProjectsAsync_ReturnsOnlyOwnedProjects()
    {
        var (ctx, userId, _) = BuildContext();
        var svc = new ProjectService(ctx);

        var result = (await svc.GetUserProjectsAsync(userId)).ToList();

        Assert.Equal(2, result.Count);
        Assert.All(result, p => Assert.Contains(p.Name, new[] { "Project Alpha", "Project Beta" }));
    }

    [Fact]
    public async Task GetUserProjectsAsync_ReturnsEmpty_WhenNoProjects()
    {
        var (ctx, _, _) = BuildContext();
        var svc = new ProjectService(ctx);
        var unknownUser = Guid.NewGuid();

        var result = await svc.GetUserProjectsAsync(unknownUser);

        Assert.Empty(result);
    }


    [Fact]
    public async Task GetProjectByIdAsync_ReturnsProject_WhenOwnerMatches()
    {
        var (ctx, userId, _) = BuildContext();
        var svc = new ProjectService(ctx);
        var projectId = ctx.Projects.First(p => p.OwnerId == userId).Id;

        var dto = await svc.GetProjectByIdAsync(projectId, userId);

        Assert.Equal(projectId, dto.Id);
    }

    [Fact]
    public async Task GetProjectByIdAsync_Throws_WhenProjectBelongsToAnotherUser()
    {
        var (ctx, userId, otherUserId) = BuildContext();
        var svc = new ProjectService(ctx);
        var bobProjectId = ctx.Projects.First(p => p.OwnerId == otherUserId).Id;

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.GetProjectByIdAsync(bobProjectId, userId));
    }

    [Fact]
    public async Task GetProjectByIdAsync_Throws_WhenProjectDoesNotExist()
    {
        var (ctx, userId, _) = BuildContext();
        var svc = new ProjectService(ctx);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.GetProjectByIdAsync(Guid.NewGuid(), userId));
    }



    [Fact]
    public async Task CreateProjectAsync_ReturnsNewProject_WithCorrectOwner()
    {
        var (ctx, userId, _) = BuildContext();
        var svc = new ProjectService(ctx);
        var request = new CreateProjectRequest { Name = "  New Project  ", Description = "Desc" };

        var dto = await svc.CreateProjectAsync(request, userId);

        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal("New Project", dto.Name);   // phải được trim
        Assert.Equal("Active", dto.Status);
        Assert.Equal(0, dto.EndpointCount);
        Assert.Equal(0, dto.EventCount);
    }

    [Fact]
    public async Task CreateProjectAsync_PersistsToDatabase()
    {
        var (ctx, userId, _) = BuildContext();
        var svc = new ProjectService(ctx);
        var request = new CreateProjectRequest { Name = "Persist Me" };

        var dto = await svc.CreateProjectAsync(request, userId);

        var saved = await ctx.Projects.FindAsync(dto.Id);
        Assert.NotNull(saved);
        Assert.Equal(userId, saved!.OwnerId);
    }


    [Fact]
    public async Task UpdateProjectAsync_UpdatesNameAndStatus()
    {
        var (ctx, userId, _) = BuildContext();
        var svc = new ProjectService(ctx);
        var projectId = ctx.Projects.First(p => p.OwnerId == userId).Id;

        var request = new UpdateProjectRequest
        {
            Name = "Updated Name",
            Description = "New desc",
            Status = "Inactive"
        };

        var dto = await svc.UpdateProjectAsync(projectId, request, userId);

        Assert.Equal("Updated Name", dto.Name);
        Assert.Equal("Inactive", dto.Status);
    }

    [Fact]
    public async Task UpdateProjectAsync_Throws_WhenNotOwner()
    {
        var (ctx, userId, otherUserId) = BuildContext();
        var svc = new ProjectService(ctx);
        var bobProjectId = ctx.Projects.First(p => p.OwnerId == otherUserId).Id;
        var request = new UpdateProjectRequest { Name = "Hack", Description = null, Status = "Active" };

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.UpdateProjectAsync(bobProjectId, request, userId));
    }


    [Fact]
    public async Task DeleteProjectAsync_RemovesProject_WhenOwner()
    {
        var (ctx, userId, _) = BuildContext();
        var svc = new ProjectService(ctx);
        var projectId = ctx.Projects.First(p => p.OwnerId == userId).Id;

        await svc.DeleteProjectAsync(projectId, userId);

        var deleted = await ctx.Projects.FindAsync(projectId);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task DeleteProjectAsync_Throws_WhenNotOwner()
    {
        var (ctx, userId, otherUserId) = BuildContext();
        var svc = new ProjectService(ctx);
        var bobProjectId = ctx.Projects.First(p => p.OwnerId == otherUserId).Id;

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => svc.DeleteProjectAsync(bobProjectId, userId));
    }
}
