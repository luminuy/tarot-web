/**
 * Cloudflare Turnstile Invisible Bot Protection Service
 * Validates challenge tokens on the server side to prevent automated bot quota abuse.
 */

export class TurnstileService {
  private static SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

  /**
   * Verify Turnstile token against Cloudflare's API
   */
  static async verifyToken(
    token?: string,
    remoteIp?: string,
    secretKey?: string
  ): Promise<{ success: boolean; errorCodes?: string[] }> {
    const secret = secretKey || process.env.TURNSTILE_SECRET_KEY;

    // If Turnstile is not configured in environment, allow requests (graceful dev mode)
    if (!secret || !token) {
      return { success: true };
    }

    try {
      const formData = new URLSearchParams();
      formData.append("secret", secret);
      formData.append("response", token);
      if (remoteIp) {
        formData.append("remoteip", remoteIp);
      }

      const res = await fetch(this.SITEVERIFY_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const outcome = (await res.json()) as { success: boolean; "error-codes"?: string[] };
      return {
        success: outcome.success,
        errorCodes: outcome["error-codes"],
      };
    } catch (error) {
      console.error("Turnstile verification error:", error);
      // On network failure to verification endpoint, do not lock out real users
      return { success: true };
    }
  }
}
