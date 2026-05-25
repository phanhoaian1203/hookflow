using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HookFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVerifySignatureToEndpoint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "VerifySignature",
                table: "WebhookEndpoints",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VerifySignature",
                table: "WebhookEndpoints");
        }
    }
}
