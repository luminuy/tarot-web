import { NextResponse } from "next/server";
import { z } from "zod";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, createRateLimitResponse, getClientIdentifier } from "@/lib/utils/rate-limit";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { recordEvent } from "@/lib/stats/record";
import { SpecSchema } from "@/lib/astro/natal-spec-schema";

export const runtime = "nodejs";

/**
 * 📝 POST /api/natal/overview — ปุ่ม "ภาพรวมผัง" ที่ทุกคนกดได้ (เจ้าของสั่ง 2026-10-28: ใช้ Haiku)
 * ---------------------------------------------------------------------------
 * - ไม่ต้องล็อกอิน · ไม่หักรอบดูดวง · ต้องติ๊กยินยอมส่งข้อมูลเกิด (`consent: true`) ทุกครั้ง
 * - Claude Haiku 5.5 (effort low) ➔ Gemini · โมเดลเรียบเรียงจาก "เรื่องเด่น" ที่โค้ดคำนวณเท่านั้น (`natal-overview.ts`)
 * - เพดาน: ถี่ต่อ IP · ต่อวันต่อ IP/บัญชี · เพดานโทเคนรายคน · เพดานงบ AI รวม
 * - AI ล้ม = 503 `ai_unavailable` ไม่มีคำตอบสำเร็จรูป (หน้าเว็บยังแสดงเรื่องเด่นที่โค้ดคำนวณอยู่แล้ว + ปุ่มลองใหม่)
 * - ไม่บันทึก/ไม่ log ข้อมูลเกิด
 * - INC-0292 "ผูกกับการหักสิทธิ์ตรงไหน": ไม่ผูก — เจ้าของสั่งให้ทุกคนกดได้ฟรี (ราคาต่อผังของ Haiku ราว $0.001)
 *   "เพดานต่อหน่วยงาน": ผังเดียวกัน (แฮชข้อมูลเกิด + ภาษา) ขอได้ 3 ครั้งต่อวัน นอกเหนือจากเพดานต่อเวลา
 */
const BodySchema = z.object({
  chart: SpecSchema,
  lang: z.enum(["th", "en"]),
  consent: z.literal(true),
});

const msg = (lang: "th" | "en", th: string, en: string) => (lang === "en" ? en : th);

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก (Unauthorized Origin)" }, { status: 403 });
  const raw = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  const lang: "th" | "en" = parsed.success ? parsed.data.lang : (raw as { lang?: string } | null)?.lang === "en" ? "en" : "th";
  if (!parsed.success) {
    const consentMissing = parsed.error.issues.some((i) => i.path[0] === "consent");
    return NextResponse.json(
      { error: consentMissing ? msg(lang, "ต้องกดยินยอมส่งข้อมูลเกิดก่อน", "Please agree to send your birth data first.") : msg(lang, "ข้อมูลไม่ถูกต้อง กรุณาโหลดหน้าใหม่อีกครั้ง", "Invalid request. Please reload the page.") },
      { status: 400 },
    );
  }
  const { chart: spec } = parsed.data;

  const { isPrivilegedTestRequest } = await import("@/lib/security/privileged");
  const privileged = await isPrivilegedTestRequest(request);
  const { getViewer } = await import("@/lib/entitlement/viewer");
  const viewer = await getViewer(request);
  const userId = viewer.kind === "member" ? viewer.userId : null;

  let limit = { allowed: true, releaseConcurrency: () => {} } as ReturnType<typeof checkRateLimit>;
  let costSubj: string | null = null;
  if (!privileged) {
    const ip = getClientIdentifier(request);
    const chartKey = (await sha256Hex(JSON.stringify([spec.yearCe, spec.month, spec.day, spec.hour, spec.minute, spec.timeKnown, spec.place.lat, spec.place.lon, spec.houseSystem, spec.zodiac ?? "tropical", lang]))).slice(0, 32);
    const edge = await consumeEdgeRateLimits([
      { key: edgeRateLimitKey("natal-overview:chart:day", chartKey), config: { max: 3, windowSec: 86400 } },
      { key: edgeRateLimitKey("natal-overview:ip", ip), config: { max: 4, windowSec: 60 } },
      { key: edgeRateLimitKey("natal-overview:ip:day", ip), config: { max: userId ? 30 : 8, windowSec: 86400 } },
      ...(userId ? [{ key: edgeRateLimitKey("natal-overview:user:day", userId), config: { max: 20, windowSec: 86400 } }] : []),
    ]);
    if (!edge.allowed) {
      return createRateLimitResponse(
        edge.retryAfterSec,
        edge.retryAfterSec <= 120
          ? msg(lang, "ขอภาพรวมถี่ไปนิด รอสักครู่แล้วลองใหม่", "A little too fast. Please wait a moment.")
          : msg(lang, "วันนี้ขอภาพรวมผังครบจำนวนแล้ว กลับมาใหม่พรุ่งนี้นะ", "You have reached today's chart overviews. Please come back tomorrow."),
      );
    }
    const { costSubject, isUserTokenCapReached, tokenCapMessage } = await import("@/lib/security/cost-ledger");
    costSubj = costSubject(userId, ip);
    if (await isUserTokenCapReached(costSubj, userId ? "member" : "guest")) return NextResponse.json({ error: tokenCapMessage(lang) }, { status: 429 });
    const { isAiCapReached } = await import("@/lib/security/ai-budget");
    if (await isAiCapReached(userId ? "member" : "guest")) {
      recordEvent("ai_cap_hit");
      return NextResponse.json({ error: msg(lang, "ระบบ AI ครบโควตาของวันนี้แล้ว กลับมาใหม่พรุ่งนี้นะ", "The AI service has reached today's quota. Please come back tomorrow.") }, { status: 503 });
    }
    limit = checkRateLimit(`natal-overview:${ip}`, { maxRequests: 4, windowSeconds: 60, maxConcurrent: 1 });
    if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds, msg(lang, "กำลังเขียนภาพรวมอยู่ รอสักครู่", "An overview is already being written. Please wait."));
  }

  try {
    const [{ buildChart }, { generateNatalOverview }, { CLAUDE_HAIKU_MODEL }] = await Promise.all([
      import("@/lib/astro/chart-spec"),
      import("@/lib/astro/natal-overview"),
      import("@/lib/ai/claude"),
    ]);
    let chart: ReturnType<typeof buildChart>;
    try {
      chart = buildChart({ ...spec, asteroids: false });
    } catch {
      return NextResponse.json({ error: msg(lang, "คำนวณผังไม่สำเร็จ กรุณาโหลดหน้าใหม่อีกครั้ง", "Could not calculate the chart. Please reload the page.") }, { status: 400 });
    }
    // Haiku พอ: งานยาก (คำนวณ + จัดลำดับ) โค้ดทำแล้ว โมเดลแค่เรียบเรียง · ราคาราว 1/20 ของ Sonnet
    const result = await generateNatalOverview(chart, spec, lang, { model: CLAUDE_HAIKU_MODEL, effort: "low", maxTokens: 4000, timeoutMs: 25000 }, "NatalOverview");
    if (!result) {
      recordEvent("natal_overview_failed");
      return NextResponse.json({ error: msg(lang, "แม่หมอ AI ยังไม่ว่างตอนนี้ ลองกดใหม่อีกครั้งนะ", "The AI reader is busy right now. Please try again."), reason: "ai_unavailable" }, { status: 503 });
    }
    if (costSubj) {
      const { estimateTokens, recordAiUsage } = await import("@/lib/security/cost-ledger");
      const outChars = result.overview.paragraphs.reduce((n, p) => n + p.title.length + p.text.length, 0);
      await recordAiUsage(costSubj, estimateTokens(result.promptChars), estimateTokens(outChars)).catch(() => undefined);
    }
    recordEvent("natal_overview_created");
    return NextResponse.json({ overview: result.overview }, { headers: { "Cache-Control": "no-store, private" } });
  } finally {
    limit.releaseConcurrency();
  }
}
