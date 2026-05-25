using HookFlow.Infrastructure;
using HookFlow.Application;
using HookFlow.Worker;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting HookFlow Worker...");

    var builder = Host.CreateApplicationBuilder(args);

    // --- Configure Serilog ---
    builder.Services.AddSerilog((services, configuration) => configuration
        .ReadFrom.Configuration(builder.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    // --- Register Clean Architecture Layers ---
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddApplication();

    // --- Register Worker Background Service ---
    builder.Services.AddHostedService<WebhookWorker>();

    var host = builder.Build();
    
    // --- Run Host ---
    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    await Log.CloseAndFlushAsync();
}
