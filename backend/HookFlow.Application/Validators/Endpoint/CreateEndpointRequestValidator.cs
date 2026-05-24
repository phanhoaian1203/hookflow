using FluentValidation;
using HookFlow.Application.DTOs.Endpoint;
using HookFlow.Domain.Enums;

namespace HookFlow.Application.Validators.Endpoint;

public class CreateEndpointRequestValidator : AbstractValidator<CreateEndpointRequest>
{
    public CreateEndpointRequestValidator()
    {
        RuleFor(x => x.ProjectId)
            .NotEmpty().WithMessage("Project ID is required");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Endpoint name is required")
            .Length(2, 100).WithMessage("Endpoint name must be between 2 and 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters");

        RuleFor(x => x.Provider)
            .NotEmpty().WithMessage("Provider is required")
            .Must(p => Enum.TryParse<WebhookProvider>(p, true, out _))
            .WithMessage("Invalid provider type");

        RuleFor(x => x.SignatureHeaderName)
            .NotEmpty().WithMessage("Signature header name is required")
            .MaximumLength(100).WithMessage("Signature header name must not exceed 100 characters");

        RuleFor(x => x.MaxRetryAttempts)
            .InclusiveBetween(1, 10).WithMessage("Max retry attempts must be between 1 and 10");

        RuleFor(x => x.RetryStrategy)
            .NotEmpty().WithMessage("Retry strategy is required")
            .Must(s => Enum.TryParse<RetryStrategy>(s, true, out _))
            .WithMessage("Invalid retry strategy");
    }
}
