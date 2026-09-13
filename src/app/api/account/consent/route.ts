import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { setMarketingConsent } from "@/lib/users/users.repo";
import { setDigestEmail } from "@/lib/digest/digest.repo";

import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

/**
 * รับได้ทั้งสองสวิตช์ แยกกันหรือมาพร้อมกันก็ได้ แต่ต้องมีอย่างน้อยหนึ่งตัว
 * - `marketing` = ยินยอมรับข่าวสารทั่วไป
 * - `digest`    = สมัครรับ "ดวงประจำวัน" ทางอีเมลทุกเช้า (คนละความยินยอมกัน)
 */
const ConsentSchema = z
  .object({
    marketing: z.boolean().optional(),
    digest: z.boolean().optional(),
  })
  .refine((v) => v.marketing !== undefined || v.digest !== undefined, {
    message: "ต้องระบุอย่างน้อยหนึ่งสวิตช์",
  });

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }

  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
    }

    const limit = checkRateLimit(`account_consent:${user.id}`, {
      maxRequests: 20,
      windowSeconds: 60,
    });
    if (!limit.allowed) {
      return createRateLimitResponse(limit.retryAfterSeconds, "คุณทำรายการถี่เกินไป กรุณารอสักครู่");
    }

    const body = await request.json().catch(() => ({}));
    const parsed = ConsentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "รูปแบบข้อมูลความยินยอมไม่ถูกต้อง" }, { status: 400 });
    }

    const { marketing, digest } = parsed.data;

    // สมัครรับดวงประจำวัน = ยินยอมให้ส่งอีเมลหาโดยปริยาย จึงต้องเปิด marketing_consent ให้ครบคู่
    // ไม่งั้นผู้ใช้กดสมัครแล้วไม่เคยได้รับอะไรเลย เพราะคิวส่งบังคับให้ครบทั้งสองธง
    if (digest === true) {
      await setMarketingConsent(user.id, true);
      await setDigestEmail(user.id, true);
    } else if (digest === false) {
      await setDigestEmail(user.id, false);
    }

    if (marketing !== undefined) {
      await setMarketingConsent(user.id, marketing);
      // ถอนความยินยอมรับข่าวสาร = ถอนการรับดวงประจำวันไปด้วย (ถอนแล้วต้องเงียบสนิททุกช่องทาง)
      if (marketing === false) await setDigestEmail(user.id, false);
    }

    // ล้างแคชโปรไฟล์ของ isolate นี้ทันที ไม่งั้น /api/auth/me อาจตอบค่าเดิมได้อีก 30 วิ
    (await import("@/lib/auth/user-cache")).invalidateUserCache(user.id);
    return NextResponse.json({ success: true, marketing, digest });
  } catch (error) {
    console.error("[Marketing Consent API Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถบันทึกความยินยอมได้" }, { status: 500 });
  }
}
