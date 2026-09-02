import { NextResponse } from "next/server";
import { signUserSession } from "@/lib/auth/edge-auth";
import { setAuthCookie } from "@/lib/auth/session";
import { consumeToken } from "@/lib/auth/auth-tokens.repo";
import { getUserById, markEmailVerified } from "@/lib/users/users.repo";
import { resolveAppOrigin } from "@/lib/security/app-origin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const origin = resolveAppOrigin(request);

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

      setAuthCookie(response, sessionToken);
    }

    return response;
  } catch (err) {
    console.error("[Verify Email Error]", err);
    return NextResponse.redirect(`${origin}/?verify_error=server`);
  }
}
