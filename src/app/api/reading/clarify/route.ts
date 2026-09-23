import { NextResponse } from "next/server";
import { z } from "zod";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, getClientIdentifier } from "@/lib/utils/rate-limit";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { evaluateClarification } from "@/lib/ai/clarify";
import { checkQuestion } from "@/lib/safety/guardrails";
import { looksLikePromptInjection } from "@/lib/ai/prompt-guard";

export const runtime = "nodejs";

const BodySchema = z.object({
  question: z.string().min(1).max(500),
  category: z.enum(["general", "love", "work", "money", "self"]).default("general"),
  personaId: z.string().optional(),
  nickname: z.string().max(40).optional(),
  situation: z.string().max(500).optional(),
  lang: z.enum(["th", "en"]).default("th"),
});

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json(
      { error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก (Unauthorized Origin)" },
      { status: 403 }
    );
  }

  const { isPrivilegedTestRequest } = await import("@/lib/security/privileged");
  const privileged = await isPrivilegedTestRequest(request);

  if (!privileged) {
    const clientIp = getClientIdentifier(request);
    /*
     * 🚦 T-11 + T-12: ปลายทางนี้เรียกโมเดลจริงแต่เดิมกันด้วย `Map` ต่อ isolate อย่างเดียว
     * และ **ไม่มีโควตาต่อ IP บน KV เลย** ต่างจาก `/read` ที่มี 40 ครั้ง/วัน
     * ผู้โจมตีจึงเปิดสตรีมขนานหลายเส้นให้แต่ละ isolate ใหม่แจกบักเก็ตเปล่า
     * แล้วเผางบ AI รวม 2,000 ครั้งได้ในไม่กี่นาที พอเพดานแตก `isAiCapReached()`
     * คืน true **กับทุกคน** ทั้งเว็บใช้ไม่ได้ทั้งวัน
     */
    const edge = await consumeEdgeRateLimits([
      { key: edgeRateLimitKey("clarify:ip", clientIp), config: { max: 30, windowSec: 3600 } },
      { key: edgeRateLimitKey("clarify:ip:day", clientIp), config: { max: 120, windowSec: 86400 } },
    ]);
    if (!edge.allowed) {
      // สำหรับ clarify หากติด rate limit ให้ข้ามเงียบ ๆ เพื่อไม่บล็อกขั้นตอนเปิดไพ่
      return NextResponse.json({ needsClarification: false, skipped: true });
    }

    const limit = checkRateLimit(`clarify:${clientIp}`, {
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!limit.allowed) {
      return NextResponse.json({ needsClarification: false, skipped: true });
    }
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ needsClarification: false, skipped: true });
    }

    /*
     * 🚨 กฎเหล็กข้อ 6 — ด่านวิกฤตต้องมาก่อนเรียกโมเดลทุกครั้ง (A2-04)
     * เดิมคำถามสั้นทุกคำถามถูกส่งไปสร้าง "คำถามกลับ" ก่อนถึง /start ซึ่งเป็นด่านวิกฤตเดียว
     * พิมพ์ "อยากตาย ควรทำยังไงดี" ได้คำถามกลับเหมือนดูดวงปกติ ต้องตอบก่อนถึงจะเห็นสายด่วน 1323
     * ➔ ข้ามการถามกลับ ให้ไหลเข้า /start ซึ่งบล็อกและแสดงสายด่วนทันที (ไม่ส่งข้อความวิกฤตออกไปภายนอก)
     * ข้อความที่พยายามปิดแท็บของ prompt ก็ไม่ส่งเข้าโมเดลเช่นกัน (/start จะปฏิเสธเอง)
     */
    const { question, situation, nickname, lang } = parsed.data;
    const combined = [question, situation, nickname].filter(Boolean).join(" ");
    if (
      checkQuestion(combined, lang).block ||
      [question, situation, nickname].some((v) => v && looksLikePromptInjection(v))
    ) {
      return NextResponse.json({ needsClarification: false, skipped: true });
    }

    const result = await evaluateClarification(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ needsClarification: false, skipped: true });
  }
}
