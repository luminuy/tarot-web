import { NextResponse } from "next/server";
import { z } from "zod";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, createRateLimitResponse, getClientIdentifier } from "@/lib/utils/rate-limit";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { isSignInRequired } from "@/lib/entitlement/signin-gate";
import { recordEvent } from "@/lib/stats/record";
import { SpecSchema } from "@/lib/astro/natal-spec-schema";

export const runtime = "nodejs";

/**
 * 📄 POST /api/natal/report — รายงานผังดวงฉบับเต็ม (บันทึกเป็น PDF ได้) · NATAL_CHART_PLAN รอบ 10
 * ---------------------------------------------------------------------------
 * - เจ้าของสั่ง "รายงาน PDF แบบเสียเงิน" (2026-10-28) ➔ ราคา = รอบดูดวงที่เติมไว้ 1 รอบ (`consumeReading` แบบ premium ·
 *   หักจากรอบที่ซื้อเท่านั้น ไม่กินโควตาฟรีรายวัน) · ผังเดียวกันโหลดซ้ำไม่หักซ้ำ (รหัสรายการคงที่ต่อบัญชี+ข้อมูลเกิด)
 * - สมาชิกเท่านั้น · ต้องยินยอมส่งข้อมูลเกิด (`consent: true`) · ไม่บันทึกข้อมูลเกิด (บันทึกแค่แถวหักสิทธิ์ที่มีรหัสแฮช)
 * - ประกอบรายงานล้มเหลว = คืนสิทธิ์ทันที (`refundReading`) · ปิดระบบสิทธิ์อยู่ (flag) = ไม่หัก เหมือนแชท
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
      { error: consentMissing ? msg(lang, "ต้องกดยินยอมส่งข้อมูลเกิดก่อนสร้างรายงาน", "Please agree to send your birth data first.") : msg(lang, "ข้อมูลไม่ถูกต้อง กรุณาโหลดหน้าใหม่อีกครั้ง", "Invalid request. Please reload the page.") },
      { status: 400 },
    );
  }
  const { chart: spec } = parsed.data;

  const { isPrivilegedTestRequest } = await import("@/lib/security/privileged");
  const privileged = await isPrivilegedTestRequest(request);
  const { isEntitlementEnabled } = await import("@/lib/entitlement/flag");
  const { getViewer } = await import("@/lib/entitlement/viewer");
  const [enforced, viewer] = await Promise.all([isEntitlementEnabled(), getViewer(request)]);
  if (!privileged && (enforced || isSignInRequired(viewer)) && viewer.kind !== "member") {
    return NextResponse.json({ error: msg(lang, "รายงานฉบับเต็มสำหรับสมาชิก เข้าสู่ระบบก่อนนะ", "The full report is for members. Please sign in."), reason: "members_only" }, { status: 403 });
  }

  let limit = { allowed: true, releaseConcurrency: () => {} } as ReturnType<typeof checkRateLimit>;
  if (!privileged) {
    const ip = getClientIdentifier(request);
    const edge = await consumeEdgeRateLimits([
      { key: edgeRateLimitKey("natal-report:ip", ip), config: { max: 6, windowSec: 60 } },
      ...(viewer.kind === "member" ? [{ key: edgeRateLimitKey("natal-report:user:day", viewer.userId), config: { max: 20, windowSec: 86400 } }] : []),
    ]);
    if (!edge.allowed) return createRateLimitResponse(edge.retryAfterSec, msg(lang, "สร้างรายงานถี่เกินไป รอสักครู่แล้วลองใหม่", "Too many reports. Please wait a moment."));
    limit = checkRateLimit(`natal-report:${ip}`, { maxRequests: 6, windowSeconds: 60, maxConcurrent: 1 });
    if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds, msg(lang, "กำลังสร้างรายงานอยู่ รอสักครู่", "A report is already being made. Please wait."));
  }

  try {
    // ── หักสิทธิ์ 1 รอบจากรอบที่ซื้อ (ผังเดิม = รหัสเดิม = ไม่หักซ้ำ) ──
    let charged: { readingId: string; usageId: string } | null = null;
    if (!privileged && enforced && viewer.kind === "member") {
      const canonical = JSON.stringify([viewer.userId, spec.name, spec.yearCe, spec.month, spec.day, spec.hour, spec.minute, spec.timeKnown, spec.place.lat, spec.place.lon, spec.place.zone ?? null, spec.place.fixedOffset ?? null, spec.houseSystem, spec.nodeType, spec.orbScale, spec.zodiac ?? "tropical", lang]);
      const readingId = `natalpdf_${(await sha256Hex(canonical)).slice(0, 40)}`;
      const { consumeReading } = await import("@/lib/entitlement/entitlement");
      const outcome = await consumeReading(viewer, readingId, undefined, { premium: true });
      if (outcome.status === "denied") {
        recordEvent("natal_report_blocked_credit");
        return NextResponse.json(
          { error: msg(lang, "รายงานฉบับเต็มใช้รอบดูดวงที่เติมไว้ 1 รอบ ตอนนี้ยังไม่มีรอบที่เติมไว้", "The full report uses 1 refilled reading. You have none left."), reason: "needs_credit" },
          { status: 402 },
        );
      }
      if (outcome.status === "inserted") charged = { readingId, usageId: outcome.usageId };
    }

    try {
      const { buildNatalReport } = await import("@/lib/astro/natal-report");
      const report = buildNatalReport(spec, lang, Date.now());
      recordEvent(charged ? "natal_report_created" : "natal_report_reopened");
      return NextResponse.json({ report, charged: !!charged }, { headers: { "Cache-Control": "no-store, private" } });
    } catch {
      if (charged) {
        const { refundReading } = await import("@/lib/entitlement/entitlement");
        await refundReading(charged.readingId, charged.usageId).catch(() => undefined);
      }
      return NextResponse.json({ error: msg(lang, "สร้างรายงานไม่สำเร็จ ไม่ได้หักสิทธิ์ กรุณาโหลดหน้าใหม่อีกครั้ง", "Could not build the report. Nothing was charged. Please reload the page.") }, { status: 500 });
    }
  } finally {
    limit.releaseConcurrency();
  }
}
