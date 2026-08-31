import { NextResponse } from "next/server";
import { getGoogleOAuthUrl, getLineOAuthUrl } from "@/lib/auth/edge-auth";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", ""));
  const origin = `${protocol}://${host}`;

  const state = Math.random().toString(36).slice(2, 12);
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
