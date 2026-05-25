using Microsoft.EntityFrameworkCore;
using HookFlow.Infrastructure.Persistence;
using Serilog;
using Scalar.AspNetCore;
using HookFlow.Infrastructure;
using HookFlow.Application;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

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

    // --- Configure CORS ---
    var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]?
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        ?? new[] { "http://localhost:5173", "http://localhost:5174", "http://localhost:5175" };

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("CorsPolicy", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    // --- Configure Services ---
    builder.Services.AddControllers();

    // Register Clean Architecture layers
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddApplication();

    // --- Configure JWT Authentication ---
    var secretKey = builder.Configuration["Jwt:Secret"] ?? "your_super_secret_jwt_key_that_is_at_least_256_bits_long_hookflow";
    var key = Encoding.UTF8.GetBytes(secretKey);

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // Dev environment only
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "HookFlow",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "HookFlowUsers",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

    // Configure OpenAPI (.NET 9/10 native)
    builder.Services.AddOpenApi();

    var app = builder.Build();

    // --- Apply Database Migrations on Startup ---
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var context = services.GetRequiredService<HookFlowDbContext>();
            context.Database.Migrate();
            Log.Information("Database migrated successfully.");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "An error occurred while migrating the database.");
        }
    }

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

        // Map Swashbuckle Swagger UI (points to the native .NET OpenAPI JSON!)
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/openapi/v1.json", "HookFlow API v1");
            options.RoutePrefix = "swagger";
        });
    }

    app.UseCors("CorsPolicy");

    app.UseHttpsRedirection();
    
    app.UseAuthentication();
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
