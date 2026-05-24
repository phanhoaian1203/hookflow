using Serilog;
using Scalar.AspNetCore;
using HookFlow.Infrastructure;
using HookFlow.Application;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // --- Configure Serilog ---
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    // --- Configure Services ---
    builder.Services.AddControllers();

    // Register Clean Architecture layers
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddApplication();

    // Configure OpenAPI & Swashbuckle Swagger
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddOpenApi();

    var app = builder.Build();

    // --- Configure HTTP Request Pipeline ---
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        
        // Map Scalar UI
        app.MapScalarApiReference(options =>
        {
            options.WithTitle("HookFlow API Reference")
                   .WithTheme(ScalarTheme.Purple)
                   .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
        });

        // Map Swashbuckle Swagger UI
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/openapi/v1.json", "HookFlow API v1");
            options.RoutePrefix = "swagger";
        });
    }

    app.UseHttpsRedirection();
    
    app.UseAuthorization();

    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application startup failed");
}
finally
{
    Log.CloseAndFlush();
}
