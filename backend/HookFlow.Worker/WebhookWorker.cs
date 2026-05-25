using HookFlow.Application.Interfaces;
using HookFlow.Domain.Entities;
using HookFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HookFlow.Worker;

public class WebhookWorker : BackgroundService
{
    private readonly ILogger<WebhookWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public WebhookWorker(ILogger<WebhookWorker> logger, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Webhook Worker started at: {time}", DateTimeOffset.Now);

        while (!stoppingToken.IsCancellationRequested)
        {
            bool processedAny = false;
            try
            {
                processedAny = await ProcessPendingEventsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing webhook events.");
            }

            if (processedAny)
            {
                // Immediately check for more events without delay
                continue;
            }

            // Polling interval of 5 seconds when idle
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task<bool> ProcessPendingEventsAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var now = DateTime.UtcNow;
        // Fetch the oldest Pending or ready-to-Retry event
        var webhookEvent = await context.WebhookEvents
            .Include(e => e.Endpoint)
            .Where(e => e.Status == WebhookEventStatus.Pending || 
                        (e.Status == WebhookEventStatus.Retrying && e.NextRetryAt <= now))
            .OrderBy(e => e.NextRetryAt ?? e.ReceivedAt)
            .FirstOrDefaultAsync(stoppingToken);

        if (webhookEvent == null)
        {
            return false;
        }

        _logger.LogInformation("Processing event {EventId} for endpoint {EndpointName}", webhookEvent.Id, webhookEvent.Endpoint?.Name);

        // 1. Set Status = Processing
        var previousStatus = webhookEvent.Status;
        webhookEvent.Status = WebhookEventStatus.Processing;
        await context.SaveChangesAsync(stoppingToken);

        // 2. Count existing attempts to determine current attempt number
        int attemptNumber = await context.ProcessingAttempts
            .CountAsync(a => a.WebhookEventId == webhookEvent.Id, stoppingToken) + 1;

        // 3. Create ProcessingAttempt
        var attempt = new ProcessingAttempt
        {
            Id = Guid.NewGuid(),
            WebhookEventId = webhookEvent.Id,
            AttemptNumber = attemptNumber,
            Status = "Processing",
            StartedAt = DateTime.UtcNow,
            WorkerName = Environment.MachineName,
            CreatedAt = DateTime.UtcNow
        };

        context.ProcessingAttempts.Add(attempt);
        await context.SaveChangesAsync(stoppingToken);

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        string? errorMessage = null;
        bool isSuccess = true;

        try
        {
            // 4. Simulate processing (duration between 500ms and 1500ms)
            await Task.Delay(Random.Shared.Next(500, 1500), stoppingToken);

            // Determine if it should fail based on payload JSON contents
            string payload = webhookEvent.PayloadJson ?? string.Empty;
            if (payload.Contains("\"fail\":") || payload.Contains("\"error\":") || payload.Contains("\"simulate_failure\":"))
            {
                throw new Exception("Simulated processing failure due to matching keyword ('fail', 'error', or 'simulate_failure') in payload.");
            }

            // 10% chance of random network failure simulation
            if (Random.Shared.Next(0, 100) < 10)
            {
                throw new Exception("Random simulated network processing failure (10% chance).");
            }
        }
        catch (Exception ex)
        {
            isSuccess = false;
            errorMessage = ex.Message;
            _logger.LogWarning(ex, "Failed to process event {EventId}", webhookEvent.Id);
        }
        finally
        {
            stopwatch.Stop();
            var durationMs = (int)stopwatch.ElapsedMilliseconds;

            // 5. Update Attempt details
            attempt.FinishedAt = DateTime.UtcNow;
            attempt.DurationMs = durationMs;
            attempt.Status = isSuccess ? "Success" : "Failed";
            attempt.ErrorMessage = errorMessage;

            // 6. Update WebhookEvent Status
            if (isSuccess)
            {
                webhookEvent.Status = WebhookEventStatus.Processed;
                webhookEvent.ProcessedAt = DateTime.UtcNow;
                webhookEvent.ErrorMessage = null;
            }
            else
            {
                if (previousStatus == WebhookEventStatus.Retrying)
                {
                    webhookEvent.RetryCount++;
                }
                webhookEvent.ErrorMessage = errorMessage;

                if (webhookEvent.RetryCount < webhookEvent.MaxRetryAttempts)
                {
                    webhookEvent.Status = WebhookEventStatus.Retrying;
                    webhookEvent.NextRetryAt = CalculateNextRetryAt(webhookEvent.RetryCount + 1);
                }
                else
                {
                    webhookEvent.Status = WebhookEventStatus.Dead;
                    webhookEvent.NextRetryAt = null;
                }
            }

            await context.SaveChangesAsync(stoppingToken);

            _logger.LogInformation("Finished processing event {EventId}. Status: {Status}, Duration: {DurationMs}ms", 
                webhookEvent.Id, webhookEvent.Status, durationMs);
        }
        return true;
    }

    private static DateTime CalculateNextRetryAt(int retryCount)
    {
        var delay = retryCount switch
        {
            1 => TimeSpan.FromMinutes(1),
            2 => TimeSpan.FromMinutes(5),
            3 => TimeSpan.FromMinutes(15),
            4 => TimeSpan.FromHours(1),
            _ => TimeSpan.FromHours(1) // Fallback for any unexpected count
        };
        return DateTime.UtcNow.Add(delay);
    }
}
