using Microsoft.EntityFrameworkCore;
using HookFlow.Application.DTOs.Dashboard;
using HookFlow.Application.DTOs.Event;
using HookFlow.Application.Interfaces;
using HookFlow.Application.Interfaces.Services;
using HookFlow.Domain.Enums;

namespace HookFlow.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _context;

    public DashboardService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(Guid userId)
    {
        var baseQuery = _context.WebhookEvents
            .Include(e => e.Endpoint)
            .ThenInclude(ep => ep.Project)
            .Where(e => e.Endpoint.Project.OwnerId == userId);

        var totalEvents = await baseQuery.CountAsync();
        var processedEvents = await baseQuery.CountAsync(e => e.Status == WebhookEventStatus.Processed);
        var failedEvents = await baseQuery.CountAsync(e => e.Status == WebhookEventStatus.Failed);
        var retryingEvents = await baseQuery.CountAsync(e => e.Status == WebhookEventStatus.Retrying);
        var deadEvents = await baseQuery.CountAsync(e => e.Status == WebhookEventStatus.Dead);
        var pendingEvents = await baseQuery.CountAsync(e => e.Status == WebhookEventStatus.Pending);

        // Failure rate: failed + dead as % of total
        double failureRate = totalEvents > 0
            ? Math.Round((double)(failedEvents + deadEvents) / totalEvents * 100, 1)
            : 0;

        // Average processing time: average of DurationMs of successful attempts
        var avgProcessingTimeMs = await _context.ProcessingAttempts
            .Include(a => a.WebhookEvent)
            .ThenInclude(e => e.Endpoint)
            .ThenInclude(ep => ep.Project)
            .Where(a => a.WebhookEvent.Endpoint.Project.OwnerId == userId && a.DurationMs.HasValue)
            .AverageAsync(a => (double?)a.DurationMs) ?? 0;

        // Events today: events received since midnight UTC today
        var todayUtc = DateTime.UtcNow.Date;
        var eventsToday = await baseQuery.CountAsync(e => e.ReceivedAt >= todayUtc);

        return new DashboardSummaryDto
        {
            TotalEvents = totalEvents,
            ProcessedEvents = processedEvents,
            FailedEvents = failedEvents,
            RetryingEvents = retryingEvents,
            DeadEvents = deadEvents,
            PendingEvents = pendingEvents,
            FailureRate = failureRate,
            AvgProcessingTimeMs = Math.Round(avgProcessingTimeMs, 1),
            EventsToday = eventsToday
        };
    }

    public async Task<List<EventOverTimeDto>> GetEventsOverTimeAsync(Guid userId)
    {
        var baseQuery = _context.WebhookEvents
            .Include(e => e.Endpoint)
            .ThenInclude(ep => ep.Project)
            .Where(e => e.Endpoint.Project.OwnerId == userId);

        var daysList = new List<EventOverTimeDto>();
        var today = DateTime.UtcNow.Date;

        for (int i = 6; i >= 0; i--)
        {
            var targetDate = today.AddDays(-i);
            var nextDate = targetDate.AddDays(1);

            var total = await baseQuery.CountAsync(e => e.ReceivedAt >= targetDate && e.ReceivedAt < nextDate);
            var failed = await baseQuery.CountAsync(e => e.ReceivedAt >= targetDate && e.ReceivedAt < nextDate &&
                                                   (e.Status == WebhookEventStatus.Failed || e.Status == WebhookEventStatus.Dead));

            daysList.Add(new EventOverTimeDto
            {
                Day = targetDate.ToString("ddd"), // "Mon", "Tue", etc.
                Count = total,
                Failed = failed
            });
        }

        return daysList;
    }

    public async Task<List<StatusDistributionDto>> GetStatusDistributionAsync(Guid userId)
    {
        var baseQuery = _context.WebhookEvents
            .Include(e => e.Endpoint)
            .ThenInclude(ep => ep.Project)
            .Where(e => e.Endpoint.Project.OwnerId == userId);

        var totalEvents = await baseQuery.CountAsync();

        var groups = await baseQuery
            .GroupBy(e => e.Status)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        return groups.Select(g => new StatusDistributionDto
        {
            Status = g.Status.ToString(),
            Count = g.Count,
            Percentage = totalEvents > 0 ? Math.Round((double)g.Count / totalEvents * 100, 1) : 0
        }).ToList();
    }

    public async Task<List<WebhookEventDto>> GetRecentEventsAsync(Guid userId, int count = 5)
    {
        var baseQuery = _context.WebhookEvents
            .Include(e => e.Endpoint)
            .ThenInclude(ep => ep.Project)
            .Where(e => e.Endpoint.Project.OwnerId == userId);

        var items = await baseQuery
            .OrderByDescending(e => e.ReceivedAt)
            .Take(count)
            .Select(e => new WebhookEventDto
            {
                Id = e.Id,
                EndpointId = e.EndpointId,
                EndpointName = e.Endpoint.Name,
                ProjectName = e.Endpoint.Project.Name,
                ExternalEventId = e.ExternalEventId,
                EventType = e.EventType,
                PayloadJson = e.PayloadJson,
                HeadersJson = e.HeadersJson,
                SourceIp = e.SourceIp,
                SignatureValid = e.SignatureValid,
                Status = e.Status.ToString(),
                RetryCount = e.RetryCount,
                MaxRetryAttempts = e.MaxRetryAttempts,
                NextRetryAt = e.NextRetryAt,
                ErrorMessage = e.ErrorMessage,
                LastErrorMessage = e.ErrorMessage,
                ReceivedAt = e.ReceivedAt,
                ProcessedAt = e.ProcessedAt,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();

        return items;
    }
}
