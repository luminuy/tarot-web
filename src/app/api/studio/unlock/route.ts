import { z } from "zod";
import { apiFail, apiOk } from "@/lib/api/envelope";
import { verifyPassword } from "@/lib/auth/password";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { isStudioEnabled } from "@/lib/studio/dpa";
import { hashShareToken, isWellFormedToken, signViewCookie, viewCookieName } from "@/lib/studio/share";
import { getSharedReading } from "@/lib/studio/studio.repo";
import { getClientIdentifier } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const Body = z.object({ token: z.string().max(64), password: z.string().min(1).max(64) });

/**
 * POST /api/studio/unlock — ลูกค้าใส่รหัสเปิดคำอ่านที่แม่หมอส่งให้
 * ผ่าน ➔ คุกกี้ลายเซ็นผูกกับลิงก์นั้น อายุ 12 ชม. (path `/r/` เท่านั้น) · เดารหัส: 8 ครั้ง/15 นาที ต่อ IP และต่อลิงก์
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) return apiFail("ไม่อนุญาตให้เข้าถึงจากภายนอก", 403);
  if (!isStudioEnabled()) return apiFail("ไม่พบคำอ่านนี้", 404);
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isWellFormedToken(parsed.data.token)) return apiFail("ไม่พบคำอ่านนี้", 404);
  const tokenHash = hashShareToken(parsed.data.token);

  const limit = await consumeEdgeRateLimits([
    { key: edgeRateLimitKey("studio:unlock:ip", getClientIdentifier(request)), config: { max: 8, windowSec: 900 } },
    { key: edgeRateLimitKey("studio:unlock:link", tokenHash.slice(0, 24)), config: { max: 8, windowSec: 900 } },
  ]);
  if (!limit.allowed) return apiFail("ลองรหัสหลายครั้งเกินไป รอสักครู่แล้วลองใหม่", 429, "rate_limited");

  const shared = await getSharedReading(tokenHash);
  if (!shared) return apiFail("ลิงก์นี้หมดอายุหรือถูกยกเลิกแล้ว", 404);
  if (!shared.passwordHash) return apiOk();
  if (!(await verifyPassword(parsed.data.password, shared.passwordHash))) return apiFail("รหัสไม่ถูกต้อง", 401, "bad_password");

  const res = apiOk();
  res.cookies.set(viewCookieName(tokenHash), signViewCookie(tokenHash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/r/",
    maxAge: 12 * 3600,
  });
  return res;
}
