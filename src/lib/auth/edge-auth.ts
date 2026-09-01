export interface UserProfile {
  id: string;
  provider: "google" | "line" | "email";
  email?: string;
  name: string;
  avatar?: string;
  createdAt: string;
  tokenVersion?: number;
}

export const AUTH_COOKIE_NAME = "tarot_auth_session";
const KNOWN_INSECURE_SECRETS = new Set([
  "tarot-sacred-auth-sanctuary-secret-2026",
  "secret",
  "default",
]);

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.TAROT_SESSION_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!secret || secret.trim().length < 32 || KNOWN_INSECURE_SECRETS.has(secret)) {
      throw new Error(
        "[Security Guard] AUTH_SECRET must be set to a secure string (≥ 32 characters) in production!"
      );
    }
    return secret;
  }

  return (
    secret ||
    process.env.AUTH_SECRET_DEV ||
    "dev-only-auth-secret-32-chars-minimum-protection"
  );
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * ตัวเซ็น/ตรวจ payload ทั่วไป — HMAC-SHA256 + base64url เหมือน signUserSession
 * ใช้ secret ตัวเดียวกัน (`AUTH_SECRET`) · ห้ามเขียนกลไกเซ็นใหม่ที่อื่น
 * (ใช้กับคุกกี้ผู้เยี่ยมชม `tarot_guest` — ENTITLEMENT_PLAN PR C)
 */
export async function signPayload(payload: Record<string, unknown>): Promise<string> {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encodedPayload));
  let binary = "";
  const bytes = new Uint8Array(sigBuf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const signature = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${encodedPayload}.${signature}`;
}

export async function verifyPayload<T = Record<string, unknown>>(token: string): Promise<T | null> {
  if (!token || !token.includes(".")) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getAuthSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    let base64 = signature.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const binary = atob(base64);
    const sigBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) sigBytes[i] = binary.charCodeAt(i);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(encodedPayload),
    );
    if (!ok) return null;
    return JSON.parse(base64UrlDecode(encodedPayload)) as T;
  } catch {
    return null;
  }
}

export async function signUserSession(profile: UserProfile): Promise<string> {
  const payload = JSON.stringify({
    ...profile,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days session
  });
  const encodedPayload = base64UrlEncode(payload);

  const secret = getAuthSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload)
  );

  let binary = "";
  const bytes = new Uint8Array(signatureBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const signature = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${encodedPayload}.${signature}`;
}

export async function verifyUserSession(token: string): Promise<UserProfile | null> {
  if (!token || !token.includes(".")) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  try {
    const secret = getAuthSecret();
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    let base64 = signature.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const binary = atob(base64);
    const signatureBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      signatureBytes[i] = binary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(encodedPayload)
    );

    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }

    return {
      id: payload.id,
      provider: payload.provider,
      email: payload.email,
      name: payload.name,
      avatar: payload.avatar,
      createdAt: payload.createdAt,
    };
  } catch {
    return null;
  }
}

export function getGoogleOAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function getLineOAuthUrl(redirectUri: string, state: string): string {
  const channelId = process.env.LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || "";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: channelId,
    redirect_uri: redirectUri,
    state,
    scope: "profile openid email",
    bot_prompt: "normal",
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}
