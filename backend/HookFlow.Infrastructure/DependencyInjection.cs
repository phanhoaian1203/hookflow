using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using HookFlow.Application.Interfaces;
using HookFlow.Application.Interfaces.Security;
using HookFlow.Application.Interfaces.Services;
using HookFlow.Infrastructure.Persistence;
using HookFlow.Infrastructure.Security;
using HookFlow.Infrastructure.Services;

namespace HookFlow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<HookFlowDbContext>(options =>
            options.UseNpgsql(connectionString, b => 
                b.MigrationsAssembly(typeof(HookFlowDbContext).Assembly.FullName)));

        // Register database context abstraction
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<HookFlowDbContext>());

        // Register security services
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<IWebhookSignatureVerifier, HmacSha256SignatureVerifier>();

        return services;
    }
}
