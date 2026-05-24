using HookFlow.Domain.Entities;

namespace HookFlow.Application.Interfaces.Security;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
