import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSpread } from "@/data/spreads";
import { checkQuestion, CRISIS_MESSAGE } from "@/lib/safety/guardrails";
import { assessCrisisRisk } from "@/lib/safety/ai-classifier";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { createCommitment } from "@/lib/tarot/shuffle";
import { saveReading, persistReading } from "@/server/store";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { recordEvent, recordEvents } from "@/lib/stats/record";
import { DAILY_LIMIT, GUEST_LIMIT, isStandardSpread, isMasterPersona } from "@/lib/entitlement/limits";

export const runtime = "nodejs";

const BodySchema = z.object({
  spreadId: z.string().min(1),
  question: z.string().max(500).default(""),
  personaId: z.string().default("warm"),
  nickname: z.string().max(40).optional(),
  category: z.enum(["general", "love", "work", "money", "self"]).optional(),
  intake: z
    .object({
      situation: z.string().max(500).optional(),
      feeling: z.string().max(300).optional(),
      hoped: z.string().max(300).optional(),
    })
    .default({}),
});

/**
 * ขั้นที่ 1 ของการเปิดไพ่ — ตรวจคำถามและประกาศคำมั่นเรื่องความสุ่ม
 *
 * สำคัญ: commitment ต้องถูกสร้างและส่งให้ผู้ใช้ "ก่อน" ที่ผู้ใช้จะสับไพ่
 * นั่นคือสิ่งที่ทำให้พิสูจน์ได้ว่าเราไม่ได้เลือกไพ่หลังจากเห็นคำถามแล้ว
 */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก (Unauthorized Origin)" }, { status: 403 });
  }

  const { isPrivilegedTestRequest } = await import("@/lib/security/privileged");
  const privileged = await isPrivilegedTestRequest(request);

  if (!privileged) {
    const clientIp = getClientIdentifier(request);
    const limit = checkRateLimit(`start:${clientIp}`, {
      maxRequests: 20,
      windowSeconds: 3600,
    });
    if (!limit.allowed) {
      return createRateLimitResponse(
        limit.retryAfterSeconds,
        "วันนี้เปิดไพ่ถี่ไปหน่อยแล้วนะ พักสักครู่แล้วค่อยกลับมา",
      );
    }
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  }

  const { spreadId, question, personaId, nickname, category, intake } = parsed.data;
  const spread = getSpread(spreadId);
  if (!spread) {
    return NextResponse.json({ error: "ไม่พบรูปแบบการวางไพ่นี้" }, { status: 404 });
  }

  // ตรวจความปลอดภัยของคำถามก่อนทำอย่างอื่นทั้งหมด (รวมทุกฟิลด์ที่ผู้ใช้กรอก: P0-5 fix)
  const textToScan = [
    question,
    intake.situation,
    intake.feeling,
    intake.hoped,
    nickname,
  ]
    .filter(Boolean)
    .join(" ");

  const verdict = checkQuestion(textToScan);
  if (verdict.block) {
    recordEvents(["reading_blocked", `safety_flag:${verdict.flag}`]);
    return NextResponse.json({ blocked: true, message: verdict.message }, { status: 200 });
  }

  // ชั้น 3: ตัวจำแนกด้วย Workers AI — จับสัญญาณวิกฤตแบบอ้อมที่ regex ไม่จับ
  // (เรียกเฉพาะเคสคลุมเครือ · fail-open ถ้า Workers AI ไม่พร้อม)
  if (await assessCrisisRisk(textToScan)) {
    recordEvents(["reading_blocked", "safety_flag:crisis_ai"]);
    return NextResponse.json({ blocked: true, message: CRISIS_MESSAGE }, { status: 200 });
  }

  // ── สิทธิ์การเปิดไพ่ (ENTITLEMENT_PLAN ข้อ 1: ล็อกขั้น 1 · ยังไม่หัก) ──
  let guestGidToPin: string | null = null;
  if (!privileged) {
    const { isEntitlementEnabled } = await import("@/lib/entitlement/flag");
    if (await isEntitlementEnabled()) {
      const { getViewer } = await import("@/lib/entitlement/viewer");
      const { getEntitlement } = await import("@/lib/entitlement/entitlement");
      const viewer = await getViewer(request);
      const ent = await getEntitlement(viewer);
      if (!ent.canStartReading) {
        recordEvent("entitlement_blocked_start");
        return NextResponse.json(
          {
            error:
              ent.kind === "guest"
                ? `คุณใช้สิทธิ์ดูดวงฟรี ${GUEST_LIMIT} ครั้งแล้ว สมัครสมาชิกเพื่อรับสิทธิ์เปิดไพ่วันละ ${DAILY_LIMIT} ครั้งฟรี`
                : `คุณใช้โควตาดูดวงครบ ${DAILY_LIMIT} ครั้งของวันนี้แล้ว กลับมาเปิดใหม่ได้ในวันพรุ่งนี้เวลา 00:00 น. หรือเติมรอบเพื่อดูต่อทันที`,
            reason: ent.reason ?? (ent.kind === "guest" ? "guest_used" : "daily_exhausted"),
            resetAt: ent.resetAt,
          },
          { status: 403 },
        );
      }

      // ── ผังใหญ่ + ปรมาจารย์ลับ = สงวนไว้สำหรับผู้ซื้อ credits เท่านั้น (server-side enforcement) ──
      if (!ent.hasPaidCredits) {
        if (!isStandardSpread(spreadId)) {
          recordEvent("entitlement_blocked_grand_spread");
          return NextResponse.json(
            { error: "ผังพยากรณ์นี้สงวนไว้สำหรับผู้ถือญาณพยากรณ์พิเศษ", reason: "grand_spread" },
            { status: 403 },
          );
        }
        if (isMasterPersona(personaId)) {
          recordEvent("entitlement_blocked_master_persona");
          return NextResponse.json(
            { error: "ปรมาจารย์ท่านนี้สงวนไว้สำหรับผู้ถือญาณพยากรณ์พิเศษ", reason: "master_persona" },
            { status: 403 },
          );
        }
      }
      if (viewer.kind === "guest") {
        // เพดานเฉพาะผู้เยี่ยมชมต่อ IP/ซับเน็ต — เช็คที่นี่ (ก่อนพิธีจับไพ่) เพื่อ UX ที่ดี
        const { isGuestReadQuotaReached } = await import("@/lib/security/ai-budget");
        if (await isGuestReadQuotaReached(getClientIdentifier(request))) {
          recordEvent("entitlement_guest_ip_capped");
          return NextResponse.json(
            {
              error: "วันนี้เปิดไพ่แบบทดลองจากเครือข่ายนี้ครบแล้ว สมัครสมาชิกเพื่อเปิดต่อได้เลย",
              reason: "guest_used",
            },
            { status: 403 },
          );
        }
        // ผู้เยี่ยมชมที่ยังไม่มี gid คงที่ → ปักหมุด gid ตั้งแต่ขั้น start (used=0)
        // เพื่อให้ read / guest-consume / เครื่องหมายฝั่ง server ใช้ค่าเดียวกันตลอดวงจร
        if (viewer.gid === "anon") {
          const { newGid } = await import("@/lib/entitlement/guest");
          guestGidToPin = newGid();
        }
      }
    }
  }

  const { serverSeed, commitment } = createCommitment();
  const id = randomUUID();

  const record: import("@/server/store").ReadingRecord = {
    id,
    status: "DRAWING",
    spreadId,
    category: category ?? spread.defaultCategory,
    personaId,
    question: question.trim(),
    intake,
    nickname,
    safetyFlag: verdict.flag,
    safetyGuard: verdict.promptGuard,
    commitment,
    serverSeed,
    createdAt: Date.now(),
  };

  saveReading(record);
  await persistReading(record);

  recordEvents([
    "reading_started",
    `spread:${spreadId}`,
    `persona:${personaId}`,
    `category:${record.category}`,
    ...(verdict.flag !== "none" ? [`safety_flag:${verdict.flag}`] : []),
  ]);

  const { signReadingSessionToken } = await import("@/lib/security/session-token");
  const sessionToken = signReadingSessionToken(record);

  const res = NextResponse.json({
    id,
    readingId: id,
    commitment,
    sessionToken,
    spread: {
      id: spread.id,
      nameTh: spread.nameTh,
      positions: spread.positions,
    },
  });

  if (guestGidToPin) {
    const { GUEST_COOKIE_NAME, GUEST_COOKIE_OPTIONS, guestCookieValue } = await import(
      "@/lib/entitlement/guest"
    );
    const token = await guestCookieValue({ gid: guestGidToPin, used: 0 }).catch(() => null);
    if (token) res.cookies.set(GUEST_COOKIE_NAME, token, GUEST_COOKIE_OPTIONS);
  }

  return res;
}
