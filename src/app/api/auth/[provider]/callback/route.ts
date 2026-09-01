import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signUserSession, type UserProfile } from "@/lib/auth/edge-auth";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const ALLOWED_HOSTS = new Set(["tarot.luminuy.com", "localhost:3000"]);
  const rawHost = request.headers.get("x-forwarded-host") || url.host;
  const host = ALLOWED_HOSTS.has(rawHost) || rawHost.endsWith(".workers.dev") ? rawHost : "tarot.luminuy.com";
  const protocol = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", ""));
  const origin = process.env.APP_ORIGIN || `${protocol}://${host}`;

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("tarot_oauth_state")?.value;

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent("คำขอล็อกอินไม่ถูกต้อง (state mismatch)")}`
    );
  }

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error || "ไม่ได้รับสิทธิ์การล็อกอิน")}`);
  }

  const redirectUri = `${origin}/api/auth/${provider}/callback`;

  try {
    let profile: UserProfile | null = null;

    if (provider === "google") {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenRes.json();
      if (!tokens.access_token) {
        throw new Error(tokens.error_description || "ไม่สามารถแลก Google Token ได้");
      }

      // Fetch profile
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userData = await userRes.json();

      profile = {
        id: `google_${userData.id}`,
        provider: "google",
        email: userData.email,
        name: userData.name || "ผู้เดินทางค้นหาชะตา",
        avatar: userData.picture,
        createdAt: new Date().toISOString(),
      };
    } else if (provider === "line") {
      const channelId = process.env.LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || "";
      const channelSecret = process.env.LINE_CHANNEL_SECRET || "";

      // Exchange code for token
      const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: channelId,
          client_secret: channelSecret,
        }),
      });

      const tokens = await tokenRes.json();
      if (!tokens.access_token) {
        throw new Error(tokens.error_description || "ไม่สามารถแลก LINE Token ได้");
      }

      // Fetch profile
      const userRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userData = await userRes.json();

      profile = {
        id: `line_${userData.userId}`,
        provider: "line",
        name: userData.displayName || "ผู้เดินทางชาว LINE",
        avatar: userData.pictureUrl,
        createdAt: new Date().toISOString(),
      };
    }

    if (!profile) {
      throw new Error("ไม่สามารถสร้างข้อมูลผู้ใช้ได้");
    }

    // Persist user identity to D1 database
    try {
      const { upsertUserOnLogin } = await import("@/lib/users/users.repo");
      await upsertUserOnLogin({
        id: profile.id,
        provider: profile.provider,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatar,
      });
    } catch (dbErr) {
      console.error("[OAuth D1 User Upsert Warning]:", dbErr);
      // Non-blocking fallback: allow login even if D1 transiently fails
    }

    const sessionToken = await signUserSession(profile);
    const response = NextResponse.redirect(`${origin}/?auth_success=1`);

    response.cookies.set("tarot_auth_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
    response.cookies.delete("tarot_oauth_state");

    return response;
  } catch (err: any) {
    console.error("[OAuth Callback Error]:", err);
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(err.message || "เกิดข้อผิดพลาดในการล็อกอิน")}`);
  }
}
