using FluentValidation;
using HookFlow.Application.DTOs.Project;

namespace HookFlow.Application.Validators.Project;

public class UpdateProjectRequestValidator : AbstractValidator<UpdateProjectRequest>
{
    private static readonly string[] ValidStatuses = { "Active", "Inactive", "Archived" };

    public UpdateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Project name is required")
            .Length(2, 100).WithMessage("Project name must be between 2 and 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status is required")
            .Must(status => ValidStatuses.Contains(status))
            .WithMessage("Status must be Active, Inactive, or Archived");
    }
}
