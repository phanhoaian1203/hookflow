using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HookFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMaxRetryAttemptsToEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxRetryAttempts",
                table: "WebhookEvents",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxRetryAttempts",
                table: "WebhookEvents");
        }
    }
}
