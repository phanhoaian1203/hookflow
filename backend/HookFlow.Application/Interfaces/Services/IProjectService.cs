using HookFlow.Application.DTOs.Project;

namespace HookFlow.Application.Interfaces.Services;

public interface IProjectService
{
    Task<IEnumerable<ProjectDto>> GetUserProjectsAsync(Guid userId);
    Task<ProjectDto> GetProjectByIdAsync(Guid projectId, Guid userId);
    Task<ProjectDto> CreateProjectAsync(CreateProjectRequest request, Guid userId);
    Task<ProjectDto> UpdateProjectAsync(Guid projectId, UpdateProjectRequest request, Guid userId);
    Task DeleteProjectAsync(Guid projectId, Guid userId);
}
