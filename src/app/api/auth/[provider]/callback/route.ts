import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signUserSession, type UserProfile } from "@/lib/auth/edge-auth";
import { setAuthCookie } from "@/lib/auth/session";
import { resolveAppOrigin } from "@/lib/security/app-origin";

export const runtime = "nodejs";

const OAUTH_STATE_COOKIE = "tarot_oauth_state";

/**
 * รหัสข้อผิดพลาดที่ยอมให้ส่งกลับหน้าเว็บได้ — หน้าเว็บจะแปลงเป็นข้อความไทยเอง
 * ⚠️ ห้ามส่งข้อความดิบจากผู้ให้บริการ (หรือจาก query string) ต่อไปที่ `?auth_error=`
 * เพราะผู้โจมตีตั้งข้อความอะไรก็ได้ให้เว็บเราแสดงเอง (เช่น "บัญชีถูกระงับ โทร 08x-xxx")
 */
type AuthErrorCode =
  | "state_mismatch"
  | "access_denied"
  | "provider_unavailable"
  | "provider_error"
  | "profile_unavailable"
  | "server_error";

function fail(origin: string, code: AuthErrorCode) {
  const response = NextResponse.redirect(`${origin}/?auth_error=${code}`);
  // ล้าง state ทิ้งทุกทางออก ไม่ให้ค้างไว้ให้ใช้ซ้ำจนกว่าจะครบ 10 นาที
  response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const origin = resolveAppOrigin(request);

  if (provider !== "google" && provider !== "line") {
    return fail(origin, "provider_unavailable");
  }
  const oauthProvider: "google" | "line" = provider;

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  if (!state || !expectedState || state !== expectedState) {
    return fail(origin, "state_mismatch");
  }

  if (error || !code) {
    return fail(origin, "access_denied");
  }

  const redirectUri = `${origin}/api/auth/${provider}/callback`;

  try {
    let profile: UserProfile | null = null;
    let providerUserId = "";

    if (oauthProvider === "google") {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
      if (!clientId || !clientSecret) return fail(origin, "provider_unavailable");

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

      const tokens = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok || !tokens?.access_token) {
        console.error("[OAuth google] token exchange failed", tokenRes.status, tokens?.error);
        return fail(origin, "provider_error");
      }

      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userData = await userRes.json().catch(() => ({}));

      // ⚠️ ต้องยืนยันว่ามี id จริงก่อนเสมอ — ของเดิม `String(userData.id)` ทำให้คำขอที่ล้มเหลว
      // กลายเป็นบัญชีชื่อ `google_undefined` ที่ผู้ใช้หลายคนใช้ร่วมกัน (เห็นประวัติกันข้ามคน)
      if (!userRes.ok || !userData?.id) {
        console.error("[OAuth google] userinfo failed", userRes.status);
        return fail(origin, "profile_unavailable");
      }
      providerUserId = String(userData.id);

      profile = {
        id: `google_${providerUserId}`,
        provider: "google",
        // รับอีเมลมาผูกบัญชีได้เฉพาะที่ Google ยืนยันแล้วเท่านั้น —
        // อีเมลที่ยังไม่ยืนยันใช้เข้ายึดบัญชีเดิมที่ใช้อีเมลเดียวกันได้ (account takeover by email linking)
        email: userData.verified_email === false ? undefined : userData.email,
        name: userData.name || "ผู้เดินทางค้นหาชะตา",
        avatar: userData.picture,
        createdAt: new Date().toISOString(),
      };
    } else {
      const channelId = process.env.LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || "";
      const channelSecret = process.env.LINE_CHANNEL_SECRET || "";
      if (!channelId || !channelSecret) return fail(origin, "provider_unavailable");

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

      const tokens = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok || !tokens?.access_token) {
        console.error("[OAuth line] token exchange failed", tokenRes.status, tokens?.error);
        return fail(origin, "provider_error");
      }

      const userRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userData = await userRes.json().catch(() => ({}));
      if (!userRes.ok || !userData?.userId) {
        console.error("[OAuth line] profile failed", userRes.status);
        return fail(origin, "profile_unavailable");
      }
      providerUserId = String(userData.userId);

      profile = {
        id: `line_${providerUserId}`,
        provider: "line",
        name: userData.displayName || "ผู้เดินทางชาว LINE",
        avatar: userData.pictureUrl,
        createdAt: new Date().toISOString(),
      };
    }

    // Persist user identity & Account Linking to D1 database
    try {
      const {
        findUserIdByOAuth,
        getUserByEmail,
        getUserById,
        linkOAuthIdentity,
        upsertUserOnLogin,
      } = await import("@/lib/users/users.repo");
      const { grantSignupBonus } = await import("@/lib/entitlement/entitlement");

      // 1. Check if this OAuth provider ID is already linked
      const existingLinkedUserId = await findUserIdByOAuth(oauthProvider, providerUserId);

      if (existingLinkedUserId) {
        // ผูกไว้แล้ว → ต้องใช้ id เดิมเสมอ แม้จะอ่านแถวผู้ใช้ไม่สำเร็จ
        // ไม่งั้นจะได้เซสชันภายใต้ id ใหม่ แล้วประวัติ/สิทธิ์ของเจ้าตัวหายไปทั้งชุด
        profile.id = existingLinkedUserId;
        const linkedUser = await getUserById(existingLinkedUserId);
        if (linkedUser) {
          profile.tokenVersion = linkedUser.tokenVersion;
          if (linkedUser.name) profile.name = linkedUser.name;
          if (linkedUser.email) profile.email = linkedUser.email;
          if (linkedUser.avatarUrl) profile.avatar = linkedUser.avatarUrl;
        }
      } else if (profile.email) {
        // 2. Check if a user with this email already exists
        const existingEmailUser = await getUserByEmail(profile.email);
        if (existingEmailUser) {
          await linkOAuthIdentity(oauthProvider, providerUserId, existingEmailUser.id);
          profile.id = existingEmailUser.id;
          profile.tokenVersion = existingEmailUser.tokenVersion;
          if (existingEmailUser.name) profile.name = existingEmailUser.name;
          if (existingEmailUser.avatarUrl) profile.avatar = existingEmailUser.avatarUrl;
        } else {
          // 3. New User with Email
          const created = await upsertUserOnLogin({
            id: profile.id,
            provider: profile.provider,
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.avatar,
          });
          profile.tokenVersion = created.tokenVersion;
          await linkOAuthIdentity(oauthProvider, providerUserId, profile.id);
          await grantSignupBonus(profile.id);
        }
      } else {
        // 4. OAuth without email (หรืออีเมลที่ผู้ให้บริการยังไม่ยืนยัน)
        const created = await upsertUserOnLogin({
          id: profile.id,
          provider: profile.provider,
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.avatar,
        });
        profile.tokenVersion = created.tokenVersion;
        await linkOAuthIdentity(oauthProvider, providerUserId, profile.id);
        await grantSignupBonus(profile.id);
      }
    } catch (dbErr) {
      console.error("[OAuth D1 User Upsert Warning]:", dbErr);
      // Non-blocking fallback: allow login even if D1 transiently fails
    }

    const sessionToken = await signUserSession(profile);
    const response = NextResponse.redirect(`${origin}/?auth_success=1`);
    setAuthCookie(response, sessionToken);
    response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });

    return response;
  } catch (err) {
    console.error(`[OAuth Callback Error - ${provider}]:`, err);
    return fail(origin, "server_error");
  }
}
