namespace HookFlow.Application.Interfaces.Services;

public interface IWebhookSignatureVerifier
{
    bool VerifySignature(string rawBody, string secretKey, string incomingSignatureHeaderValue);
}
