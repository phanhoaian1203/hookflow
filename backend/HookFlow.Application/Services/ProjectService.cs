using Microsoft.EntityFrameworkCore;
using HookFlow.Application.DTOs.Project;
using HookFlow.Application.Interfaces;
using HookFlow.Application.Interfaces.Services;
using HookFlow.Domain.Entities;

namespace HookFlow.Application.Services;

public class ProjectService : IProjectService
{
    private readonly IApplicationDbContext _context;

    public ProjectService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProjectDto>> GetUserProjectsAsync(Guid userId)
    {
        return await _context.Projects
            .AsNoTracking()
            .Where(p => p.OwnerId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Status = p.Status,
                EndpointCount = p.Endpoints.Count,
                EventCount = p.Endpoints.SelectMany(e => e.Events).Count(),
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<ProjectDto> GetProjectByIdAsync(Guid projectId, Guid userId)
    {
        var project = await _context.Projects
            .AsNoTracking()
            .Where(p => p.Id == projectId && p.OwnerId == userId)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Status = p.Status,
                EndpointCount = p.Endpoints.Count,
                EventCount = p.Endpoints.SelectMany(e => e.Events).Count(),
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (project == null)
        {
            throw new KeyNotFoundException("Project not found or you do not have permission to access it.");
        }

        return project;
    }

    public async Task<ProjectDto> CreateProjectAsync(CreateProjectRequest request, Guid userId)
    {
        var project = new Project
        {
            OwnerId = userId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Status = project.Status,
            EndpointCount = 0,
            EventCount = 0,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt
        };
    }

    public async Task<ProjectDto> UpdateProjectAsync(Guid projectId, UpdateProjectRequest request, Guid userId)
    {
        var project = await _context.Projects
            .Include(p => p.Endpoints)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerId == userId);

        if (project == null)
        {
            throw new KeyNotFoundException("Project not found or you do not have permission to access it.");
        }

        project.Name = request.Name.Trim();
        project.Description = request.Description?.Trim();
        project.Status = request.Status.Trim();
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Status = project.Status,
            EndpointCount = project.Endpoints.Count,
            EventCount = await _context.WebhookEvents
                .Where(e => e.Endpoint.ProjectId == projectId)
                .CountAsync(),
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt
        };
    }

    public async Task DeleteProjectAsync(Guid projectId, Guid userId)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerId == userId);

        if (project == null)
        {
            throw new KeyNotFoundException("Project not found or you do not have permission to access it.");
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
    }
}
