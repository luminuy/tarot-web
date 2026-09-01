import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, signUserSession } from "@/lib/auth/edge-auth";
import { consumeToken } from "@/lib/auth/auth-tokens.repo";
import { getUserById, markEmailVerified } from "@/lib/users/users.repo";

export const runtime = "nodejs";

function getOriginUrl(request: Request): string {
  const url = new URL(request.url);
  const rawHost = request.headers.get("x-forwarded-host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || (url.protocol.replace(":", ""));
  return process.env.APP_ORIGIN || `${protocol}://${rawHost}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const origin = getOriginUrl(request);

  if (!token) {
    return NextResponse.redirect(`${origin}/?verify_error=invalid`);
  }

  try {
    const result = await consumeToken(token, "verify");
    if (!result) {
      return NextResponse.redirect(`${origin}/?verify_error=expired`);
    }

    await markEmailVerified(result.userId);

    const user = await getUserById(result.userId);
    const redirectUrl = `${origin}/?verified=1`;
    const response = NextResponse.redirect(redirectUrl);

    // หากพบข้อมูลผู้ใช้ ให้ออก Session Cookie ให้อัตโนมัติ
    if (user) {
      const sessionToken = await signUserSession({
        id: user.id,
        provider: user.provider,
        email: user.email || undefined,
        name: user.name,
        createdAt: new Date(user.createdAt).toISOString(),
        tokenVersion: user.tokenVersion,
      });

      response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (err) {
    console.error("[Verify Email Error]", err);
    return NextResponse.redirect(`${origin}/?verify_error=server`);
  }
}
