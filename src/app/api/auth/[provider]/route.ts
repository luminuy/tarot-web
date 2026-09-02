import { NextResponse } from "next/server";
import { getGoogleOAuthUrl, getLineOAuthUrl } from "@/lib/auth/edge-auth";
import { resolveAppOrigin } from "@/lib/security/app-origin";

export const runtime = "nodejs";

const OAUTH_STATE_COOKIE = "tarot_oauth_state";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const origin = resolveAppOrigin(request);

  if (provider !== "google" && provider !== "line") {
    return NextResponse.json({ error: "ไม่พบผู้ให้บริการล็อกอินนี้" }, { status: 400 });
  }

  // ตรวจว่าตั้งค่า credential ของผู้ให้บริการนี้ไว้จริงก่อนพาผู้ใช้ออกไป —
  // ไม่งั้นผู้ใช้จะถูกเด้งไปเจอหน้า error ของ Google/LINE แทนที่จะได้คำอธิบายเป็นภาษาไทย
  const configured =
    provider === "google"
      ? Boolean(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
      : Boolean(process.env.LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LINE_CHANNEL_ID);

  if (!configured) {
    return NextResponse.redirect(`${origin}/?auth_error=provider_unavailable`);
  }

  const state = crypto.randomUUID();
  const redirectUri = `${origin}/api/auth/${provider}/callback`;
  const authUrl =
    provider === "google"
      ? getGoogleOAuthUrl(redirectUri, state)
      : getLineOAuthUrl(redirectUri, state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  return response;
}
