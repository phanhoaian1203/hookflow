using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using HookFlow.Application.Interfaces.Services;
using HookFlow.Application.Services;

namespace HookFlow.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;
        
        services.AddValidatorsFromAssembly(assembly);

        // Register application services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProjectService, ProjectService>();

        return services;
    }
}
