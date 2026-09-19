import { NextResponse } from "next/server";
import { getGoogleOAuthUrl, getLineOAuthUrl } from "@/lib/auth/edge-auth";
import { OAUTH_STATE_COOKIE, OAUTH_RETURN_COOKIE } from "@/lib/auth/cookie-names";
import { resolveAppOrigin } from "@/lib/security/app-origin";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const origin = resolveAppOrigin(request);

  if (provider !== "google" && provider !== "line") {
    return NextResponse.json({ error: "ไม่พบผู้ให้บริการล็อกอินนี้" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const rawReturnUrl = searchParams.get("returnUrl");
  // ตรวจสอบความปลอดภัย: รับเฉพาะ relative path ภายในโดเมน (ขึ้นต้นด้วย "/" และไม่ขึ้นต้นด้วย "//" หรือมี "\") ป้องกัน Open Redirect
  let safeReturnUrl: string | null = null;
  if (
    rawReturnUrl &&
    rawReturnUrl.startsWith("/") &&
    !rawReturnUrl.startsWith("//") &&
    !rawReturnUrl.includes("\\")
  ) {
    safeReturnUrl = rawReturnUrl;
  }

  // ตรวจว่าตั้งค่า credential ของผู้ให้บริการนี้ไว้จริงก่อนพาผู้ใช้ออกไป —
  // ไม่งั้นผู้ใช้จะถูกเด้งไปเจอหน้า error ของ Google/LINE แทนที่จะได้คำอธิบายเป็นภาษาไทย
  const configured =
    provider === "google"
      ? Boolean(process.env.GOOGLE_CLIENT_ID)
      : Boolean(process.env.LINE_CHANNEL_ID);

  if (!configured) {
    const isEnglish = safeReturnUrl?.startsWith("/en") || safeReturnUrl === "/en";
    const redirectPath = isEnglish ? `/en?auth_error=provider_unavailable` : `/?auth_error=provider_unavailable`;
    return NextResponse.redirect(`${origin}${redirectPath}`);
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

  if (safeReturnUrl) {
    response.cookies.set(OAUTH_RETURN_COOKIE, safeReturnUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });
  } else {
    response.cookies.set(OAUTH_RETURN_COOKIE, "", { path: "/", maxAge: 0 });
  }

  return response;
}
