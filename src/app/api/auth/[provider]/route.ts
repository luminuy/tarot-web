import { NextResponse } from "next/server";
import { getGoogleOAuthUrl, getLineOAuthUrl } from "@/lib/auth/edge-auth";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(request.url);
  const ALLOWED_HOSTS = new Set(["tarot.luminuy.com", "localhost:3000"]);
  const rawHost = request.headers.get("x-forwarded-host") || url.host;
  const host = ALLOWED_HOSTS.has(rawHost) || rawHost.endsWith(".workers.dev") ? rawHost : "tarot.luminuy.com";
  const protocol = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", ""));
  const origin = process.env.APP_ORIGIN || `${protocol}://${host}`;

  const state = crypto.randomUUID();
  const redirectUri = `${origin}/api/auth/${provider}/callback`;

  if (provider === "google") {
    const authUrl = getGoogleOAuthUrl(redirectUri, state);
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("tarot_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });
    return response;
  }

  if (provider === "line") {
    const authUrl = getLineOAuthUrl(redirectUri, state);
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("tarot_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ error: "ไม่พบผู้ให้บริการล็อกอินนี้" }, { status: 400 });
}
