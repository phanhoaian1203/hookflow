using System;
using System.Security.Cryptography;
using System.Text;
using HookFlow.Application.Interfaces.Services;

namespace HookFlow.Infrastructure.Services;

public class HmacSha256SignatureVerifier : IWebhookSignatureVerifier
{
    public bool VerifySignature(string rawBody, string secretKey, string incomingSignatureHeaderValue)
    {
        if (string.IsNullOrEmpty(rawBody) || string.IsNullOrEmpty(secretKey) || string.IsNullOrEmpty(incomingSignatureHeaderValue))
        {
            return false;
        }

        // The signature format is expected to be "sha256=xxxxxxx" or just "xxxxxxx"
        string expectedSignature = incomingSignatureHeaderValue;
        if (incomingSignatureHeaderValue.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
        {
            expectedSignature = incomingSignatureHeaderValue.Substring(7);
        }

        try
        {
            byte[] keyBytes = Encoding.UTF8.GetBytes(secretKey);
            byte[] bodyBytes = Encoding.UTF8.GetBytes(rawBody);

            using (var hmac = new HMACSHA256(keyBytes))
            {
                byte[] hashBytes = hmac.ComputeHash(bodyBytes);
                string computedSignature = Convert.ToHexString(hashBytes).ToLowerInvariant();

                // Convert to bytes for cryptographic constant-time comparison to prevent timing attacks
                byte[] expectedBytes = Encoding.UTF8.GetBytes(expectedSignature.Trim().ToLowerInvariant());
                byte[] computedBytes = Encoding.UTF8.GetBytes(computedSignature);

                if (expectedBytes.Length != computedBytes.Length)
                {
                    return false;
                }

                return CryptographicOperations.FixedTimeEquals(expectedBytes, computedBytes);
            }
        }
        catch
        {
            return false;
        }
    }
}
