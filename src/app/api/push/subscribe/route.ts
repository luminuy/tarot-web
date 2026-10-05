import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { deletePushSubscription, getPushSubscription, upsertPushSubscription } from "@/lib/push/push.repo";
import { isAllowedPushEndpoint, vapidConfigured } from "@/lib/push/webpush";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

/**
 * 🔔 สมัคร/ตั้งค่า/ยกเลิกการแจ้งเตือน (REFLECTION_JOURNAL_PLAN 1.10) — สมาชิกเท่านั้น · เลือกเปิดเอง
 * GET ?endpoint= = ค่าที่ตั้งไว้ของเครื่องนี้ · POST = สมัคร/อัปเดต · DELETE = ยกเลิก
 * endpoint ต้องเป็นผู้ให้บริการ push ที่รู้จัก (กัน SSRF) · กุญแจต้องเป็นรูปแบบที่ถูกต้อง
 */
const SubSchema = z.object({
  endpoint: z.string().url().max(1024).refine(isAllowedPushEndpoint, "ผู้ให้บริการแจ้งเตือนไม่รองรับ"),
  keys: z.object({
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{80,100}$/),
    auth: z.string().regex(/^[A-Za-z0-9_-]{16,32}$/),
  }),
});
const BodySchema = z.object({
  subscription: SubSchema,
  morningHour: z.number().int().min(0).max(23).nullable(),
  checkins: z.boolean(),
  lang: z.enum(["th", "en"]).default("th"),
});

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ subscribed: false }, { status: 401 });
  const endpoint = new URL(request.url).searchParams.get("endpoint") ?? "";
  const sub = endpoint ? await getPushSubscription(user.id, endpoint) : null;
  return NextResponse.json(
    sub ? { subscribed: true, morningHour: sub.morningHour, checkins: sub.checkins } : { subscribed: false },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  if (!vapidConfigured()) return NextResponse.json({ error: "ยังไม่เปิดระบบแจ้งเตือน" }, { status: 503 });
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const gate = checkRateLimit(`push_sub:${user.id}`, { maxRequests: 10, windowSeconds: 60 });
  if (!gate.allowed) return createRateLimitResponse(gate.retryAfterSeconds, "ตั้งค่าถี่เกินไป กรุณารอสักครู่");
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลการแจ้งเตือนไม่ถูกต้อง" }, { status: 400 });
  const { subscription, morningHour, checkins, lang } = parsed.data;
  await upsertPushSubscription(
    user.id,
    { endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    { lang, morningHour, checkins },
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { endpoint?: string };
  if (!body.endpoint) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  await deletePushSubscription(user.id, body.endpoint);
  return NextResponse.json({ success: true });
}
