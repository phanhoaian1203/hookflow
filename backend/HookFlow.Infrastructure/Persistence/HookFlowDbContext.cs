using Microsoft.EntityFrameworkCore;
using HookFlow.Domain.Entities;

namespace HookFlow.Infrastructure.Persistence;

public class HookFlowDbContext : DbContext
{
    public HookFlowDbContext(DbContextOptions<HookFlowDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<WebhookEndpoint> WebhookEndpoints => Set<WebhookEndpoint>();
    public DbSet<WebhookEvent> WebhookEvents => Set<WebhookEvent>();
    public DbSet<ProcessingAttempt> ProcessingAttempts => Set<ProcessingAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- User Configuration ---
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);
            entity.Property(u => u.Role).IsRequired().HasMaxLength(50).HasDefaultValue("User");
            entity.Property(u => u.IsActive).IsRequired().HasDefaultValue(true);

            entity.HasIndex(u => u.Email).IsUnique().HasDatabaseName("idx_users_email");
            entity.HasIndex(u => u.CreatedAt).HasDatabaseName("idx_users_created_at");
        });

        // --- Project Configuration ---
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(100);
            entity.Property(p => p.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Active");

            entity.HasOne(p => p.Owner)
                .WithMany(u => u.Projects)
                .HasForeignKey(p => p.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(p => p.OwnerId).HasDatabaseName("idx_projects_owner_id");
            entity.HasIndex(p => p.Status).HasDatabaseName("idx_projects_status");
            entity.HasIndex(p => p.CreatedAt).HasDatabaseName("idx_projects_created_at");
        });

        // --- WebhookEndpoint Configuration ---
        modelBuilder.Entity<WebhookEndpoint>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SecretKey).HasMaxLength(512);
            entity.Property(e => e.SignatureHeaderName).IsRequired().HasMaxLength(100).HasDefaultValue("X-Webhook-Signature");

            entity.Property(e => e.Provider)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.RetryStrategy)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.HasOne(e => e.Project)
                .WithMany(p => p.Endpoints)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.Slug).IsUnique().HasDatabaseName("idx_endpoints_slug");
            entity.HasIndex(e => e.ProjectId).HasDatabaseName("idx_endpoints_project_id");
            entity.HasIndex(e => e.IsActive).HasDatabaseName("idx_endpoints_is_active");
            entity.HasIndex(e => e.Provider).HasDatabaseName("idx_endpoints_provider");
        });

        // --- WebhookEvent Configuration ---
        modelBuilder.Entity<WebhookEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExternalEventId).HasMaxLength(255);
            entity.Property(e => e.EventType).HasMaxLength(100);
            entity.Property(e => e.SourceIp).HasMaxLength(45);

            entity.Property(e => e.PayloadJson).HasColumnType("jsonb");
            entity.Property(e => e.HeadersJson).HasColumnType("jsonb");

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.HasOne(e => e.Endpoint)
                .WithMany(ep => ep.Events)
                .HasForeignKey(e => e.EndpointId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.EndpointId).HasDatabaseName("idx_events_endpoint_id");
            entity.HasIndex(e => e.Status).HasDatabaseName("idx_events_status");
            entity.HasIndex(e => e.ReceivedAt).HasDatabaseName("idx_events_received_at");
            entity.HasIndex(e => e.EventType).HasDatabaseName("idx_events_event_type");

            entity.HasIndex(e => e.NextRetryAt)
                .HasFilter("\"Status\" = 'Retrying'")
                .HasDatabaseName("idx_events_next_retry_at");

            entity.HasIndex(e => e.ExternalEventId)
                .HasFilter("\"ExternalEventId\" IS NOT NULL")
                .HasDatabaseName("idx_events_external_event_id");

            entity.HasIndex(e => new { e.EndpointId, e.Status }).HasDatabaseName("idx_events_endpoint_status");
            entity.HasIndex(e => new { e.Status, e.ReceivedAt }).HasDatabaseName("idx_events_status_received");
        });

        // --- ProcessingAttempt Configuration ---
        modelBuilder.Entity<ProcessingAttempt>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Status).IsRequired().HasMaxLength(20);
            entity.Property(a => a.WorkerName).HasMaxLength(100);

            entity.HasOne(a => a.WebhookEvent)
                .WithMany(e => e.ProcessingAttempts)
                .HasForeignKey(a => a.WebhookEventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(a => a.WebhookEventId).HasDatabaseName("idx_attempts_event_id");
            entity.HasIndex(a => new { a.WebhookEventId, a.AttemptNumber }).HasDatabaseName("idx_attempts_event_number");
        });
    }
}
