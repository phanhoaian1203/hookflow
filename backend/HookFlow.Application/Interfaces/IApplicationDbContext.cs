using Microsoft.EntityFrameworkCore;
using HookFlow.Domain.Entities;

namespace HookFlow.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Project> Projects { get; }
    DbSet<WebhookEndpoint> WebhookEndpoints { get; }
    DbSet<WebhookEvent> WebhookEvents { get; }
    DbSet<ProcessingAttempt> ProcessingAttempts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
