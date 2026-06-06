using Microsoft.EntityFrameworkCore;
using HookFlow.Domain.Entities;
using HookFlow.Application.Interfaces;

namespace HookFlow.Tests.Helpers;

/// <summary>
/// TestDbContext dùng EF Core InMemory provider để tạo DB giả lập trong unit tests,
/// không cần kết nối thật với PostgreSQL.
/// </summary>
public class TestDbContext : DbContext, IApplicationDbContext
{
    public TestDbContext(DbContextOptions options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<WebhookEndpoint> WebhookEndpoints => Set<WebhookEndpoint>();
    public DbSet<WebhookEvent> WebhookEvents => Set<WebhookEvent>();
    public DbSet<ProcessingAttempt> ProcessingAttempts => Set<ProcessingAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasMany(u => u.Projects).WithOne(p => p.Owner).HasForeignKey(p => p.OwnerId);
        });

        modelBuilder.Entity<Project>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasOne(p => p.Owner).WithMany(u => u.Projects).HasForeignKey(p => p.OwnerId);
            e.HasMany(p => p.Endpoints).WithOne(ep => ep.Project).HasForeignKey(ep => ep.ProjectId);
        });

        modelBuilder.Entity<WebhookEndpoint>(e =>
        {
            e.HasKey(ep => ep.Id);
            e.HasOne(ep => ep.Project).WithMany(p => p.Endpoints).HasForeignKey(ep => ep.ProjectId);
            e.HasMany(ep => ep.Events).WithOne(ev => ev.Endpoint).HasForeignKey(ev => ev.EndpointId);

            // Lưu enum dưới dạng string trong InMemory
            e.Property(ep => ep.Provider).HasConversion<string>();
            e.Property(ep => ep.RetryStrategy).HasConversion<string>();
        });

        modelBuilder.Entity<WebhookEvent>(e =>
        {
            e.HasKey(ev => ev.Id);
            e.HasOne(ev => ev.Endpoint).WithMany(ep => ep.Events).HasForeignKey(ev => ev.EndpointId);
            e.HasMany(ev => ev.ProcessingAttempts).WithOne(a => a.WebhookEvent).HasForeignKey(a => a.WebhookEventId);

            e.Property(ev => ev.Status).HasConversion<string>();
        });

        modelBuilder.Entity<ProcessingAttempt>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasOne(a => a.WebhookEvent).WithMany(ev => ev.ProcessingAttempts).HasForeignKey(a => a.WebhookEventId);
        });
    }

    /// <summary>
    /// Factory method tạo một instance mới với InMemory database (tên duy nhất mỗi lần gọi).
    /// </summary>
    public static TestDbContext CreateFresh()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestDbContext(options);
    }
}
