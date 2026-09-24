import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSpread } from "@/data/spreads";
import { checkQuestion, getCrisisMessage } from "@/lib/safety/guardrails";
import { assessCrisisRisk } from "@/lib/safety/ai-classifier";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { saveReading, persistReading } from "@/server/store";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { looksLikePromptInjection } from "@/lib/ai/prompt-guard";
import { ZODIAC_IDS } from "@/lib/ai/zodiac-context";
import { recordEvent, recordEvents } from "@/lib/stats/record";
import { DAILY_LIMIT, GUEST_BLOCK_REASON, REQUIRE_SIGNUP_TO_READ, isStandardSpread, isMasterPersona } from "@/lib/entitlement/limits";
import { SIGN_IN_GATE_REASON, getSignInGateMessage, isSignInRequired } from "@/lib/entitlement/signin-gate";
import { createCommitment, normalizeClientSeed } from "@/lib/tarot/shuffle";
import {
  DERIVED_SPREAD_ID,
  deriveDrawn,
  derivedSpreadIdFor,
  pinDerivedSpec,
  type DerivedDrawSpec,
} from "@/lib/reading/derived-draw";
import { bangkokDayKey } from "@/lib/time/bangkok";

export const runtime = "nodejs";

/**
 * 🧱 T-13: ปฏิเสธข้อความที่ตั้งใจปิดแท็บของ prompt ตั้งแต่ชั้น Zod
 * ทุกฟิลด์ที่เดินทางไปลงใน `<user_profile>` ของ prompt ต้องผ่านตัวนี้
 */
const noInjection = (label: string) =>
  z.string().refine((v) => !looksLikePromptInjection(v), {
    message: `${label} มีอักขระที่ไม่อนุญาต กรุณาพิมพ์เป็นข้อความธรรมดา`,
  });

const BodySchema = z.object({
  spreadId: z.string().min(1),
  question: noInjection("คำถาม").max(500).default(""),
  personaId: z.string().default("warm"),
  nickname: noInjection("ชื่อเล่น").max(40).optional(),
  category: z.enum(["general", "love", "work", "money", "self"]).optional(),
  lang: z.enum(["th", "en"]).default("th"),
  // เมล็ดสุ่มที่ไคลเอนต์สร้างเองด้วย crypto.getRandomValues — หัวใจของ provably-fair
  // ผูกไว้กับ record ตั้งแต่ /start เพื่อให้ตรึงก่อนการจั่วทุกกรณี และกันกรณีที่คำขอ
  // /shuffle สองอันมาพร้อมกันแล้วได้เมล็ดคนละตัวจนจั่วได้ไพ่คนละชุด
  clientSeed: z.string().min(1).max(4096).optional(),
  /*
   * ✦ ราศีที่ผู้ใช้บอกไว้ในหน้าไพ่ประจำราศี (ไม่บังคับ) — รับเฉพาะ slug ราศีที่มีจริง
   * เป็นแค่บริบทให้แม่หมอ ไม่มีผลกับการจั่วไพ่เลย (ไม่แตะ seed · ไม่แตะ derivation)
   */
  zodiac: z
    .object({
      tropical: z.enum(ZODIAC_IDS),
      thai: z.enum(ZODIAC_IDS).optional(),
      decan: z.number().int().min(0).max(2).optional(),
    })
    .optional()
    // ค่าเสียจาก storage ของเบราว์เซอร์ต้องไม่ทำให้ผู้ใช้เปิดไพ่ไม่ได้ — ทิ้งราศีแล้วไปต่อ
    .catch(undefined),
  intake: z
    .object({
      situation: noInjection("สถานการณ์").max(500).optional(),
      feeling: noInjection("ความรู้สึก").max(300).optional(),
      hoped: noInjection("สิ่งที่หวัง").max(300).optional(),
    })
    .default({}),
  /*
   * 🎯 ข้อมูลตั้งต้นของ "ไพ่ที่คำนวณได้" (คลื่นที่ 2)
   *
   * ไคลเอนต์ส่งได้แค่ **ข้อมูลตั้งต้น** เท่านั้น (วันเกิด · รหัสหัวข้อ+กอง)
   * เซิร์ฟเวอร์เป็นผู้คำนวณว่าไพ่ใบไหนออก และตรึงสเปกนี้ลง record ตั้งแต่ตรงนี้
   * ห้ามเพิ่มฟิลด์ที่ให้ไคลเอนต์ระบุ "เลขไพ่" หรือ "วันที่" เข้ามาในนี้เด็ดขาด
   * (วันที่ของสำรับประจำวันอ่านจากนาฬิกาเซิร์ฟเวอร์เท่านั้น ไม่งั้นไล่เลื่อนวันหาไพ่ที่ถูกใจได้)
   */
  derive: z
    .discriminatedUnion("kind", [
      z.object({
        kind: z.literal("birth-card"),
        day: z.number().int().min(1).max(31),
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(1800).max(2743),
        era: z.enum(["be", "ce"]),
      }),
      z.object({
        kind: z.literal("pick-a-card"),
        topicId: z.string().min(1).max(64),
        slotIndex: z.number().int().min(0).max(15),
      }),
    ])
    .optional(),
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
    // 🚦 T-11: เพดานจริงอยู่บน KV/Redis — `Map` ต่อ isolate กันอะไรไม่ได้บน Workers
    const edge = await consumeEdgeRateLimits([
      { key: edgeRateLimitKey("start:ip", clientIp), config: { max: 20, windowSec: 3600 } },
    ]);
    if (!edge.allowed) {
      return createRateLimitResponse(
        edge.retryAfterSec,
        "วันนี้เปิดไพ่ถี่ไปหน่อยแล้วนะ พักสักครู่แล้วค่อยกลับมา",
      );
    }

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

  const rawBody = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(rawBody);
  const isEnInitial = (rawBody && typeof rawBody === "object" && (rawBody as { lang?: string }).lang === "en") || false;
  if (!parsed.success) {
    return NextResponse.json(
      { error: isEnInitial ? "Invalid request data" : "ข้อมูลที่ส่งมาไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const { spreadId, question, personaId, nickname, category, intake } = parsed.data;
  const spread = getSpread(spreadId);
  if (!spread) {
    return NextResponse.json(
      { error: parsed.data.lang === "en" ? "Spread layout not found" : "ไม่พบรูปแบบการวางไพ่นี้" },
      { status: 404 }
    );
  }

  /* ── 🎯 ไพ่ที่คำนวณได้ — ตรึงสเปกตั้งแต่เปิดเซสชัน (คลื่นที่ 2) ─────────────────
   *
   * ต้องจับคู่กันเสมอทั้งสองทาง:
   *   มีสเปก แต่เปิดผังอื่น  ➔ ปฏิเสธ (ไม่งั้นไพ่ที่คำนวณได้จะไปโผล่ในผังที่ไม่ได้ออกแบบมารับ)
   *   เปิดผังของสเปก แต่ไม่ส่งสเปก ➔ ปฏิเสธ (ไม่งั้น `/shuffle` จะตกไป "จั่วสุ่ม" เงียบ ๆ
   *   แล้วหน้าเว็บจะเล่าถึงไพ่วันเกิด/ไพ่ประจำกองที่ไม่ตรงกับไพ่ที่เปิดออกมาจริง)
   */
  const derive = parsed.data.derive;
  const requiresDerivation = (Object.values(DERIVED_SPREAD_ID) as string[]).includes(spreadId);
  let derivation: DerivedDrawSpec | undefined;

  if (derive) {
    if (derivedSpreadIdFor(derive.kind) !== spreadId) {
      return NextResponse.json(
        { error: parsed.data.lang === "en" ? "Invalid request data" : "ข้อมูลที่ส่งมาไม่ถูกต้อง" },
        { status: 400 },
      );
    }
    derivation = pinDerivedSpec(derive, bangkokDayKey());
    /*
     * คำนวณทดทันทีตั้งแต่ตรงนี้ — วันเกิดที่ไม่มีอยู่จริง (30 ก.พ.) หรือรหัสกองที่ไม่มี
     * ต้องถูกปฏิเสธ **ก่อน** ผู้ใช้เสียสิทธิ์เปิดไพ่ของวันไปกับเซสชันที่ยังไงก็เปิดไพ่ไม่ออก
     */
    if (!deriveDrawn(derivation)) {
      return NextResponse.json(
        {
          error:
            parsed.data.lang === "en"
              ? "Those details do not resolve to a card. Please check and try again."
              : "ข้อมูลที่กรอกมาคำนวณเป็นไพ่ไม่ได้ กรุณาตรวจสอบแล้วลองใหม่อีกครั้ง",
        },
        { status: 400 },
      );
    }
  } else if (requiresDerivation) {
    return NextResponse.json(
      { error: parsed.data.lang === "en" ? "Invalid request data" : "ข้อมูลที่ส่งมาไม่ถูกต้อง" },
      { status: 400 },
    );
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

  const verdict = checkQuestion(textToScan, parsed.data.lang);
  if (verdict.block) {
    recordEvents(["reading_blocked", `safety_flag:${verdict.flag}`]);
    return NextResponse.json({ blocked: true, message: verdict.message }, { status: 200 });
  }

  // ชั้น 3: ตัวจำแนกด้วย Workers AI — จับสัญญาณวิกฤตแบบอ้อมที่ regex ไม่จับ
  // (เรียกเฉพาะเคสคลุมเครือ · fail-open ถ้า Workers AI ไม่พร้อม)
  if (await assessCrisisRisk(textToScan)) {
    recordEvents(["reading_blocked", "safety_flag:crisis_ai"]);
    return NextResponse.json({ blocked: true, message: getCrisisMessage(parsed.data.lang) }, { status: 200 });
  }

  // ── สิทธิ์การเปิดไพ่ (ENTITLEMENT_PLAN ข้อ 1: ล็อกขั้น 1 · ยังไม่หัก) ──
  let guestGidToPin: string | null = null;
  if (!privileged) {
    const { isEntitlementEnabled } = await import("@/lib/entitlement/flag");
    const { getViewer } = await import("@/lib/entitlement/viewer");
    const [enforced, viewer] = await Promise.all([isEntitlementEnabled(), getViewer(request)]);

    // ── ด่านล็อกอิน — อยู่ "นอก" ธงระบบสิทธิ์โดยตั้งใจ ──────────────────────────
    // ธง `entitlement.enforced` คือสวิตช์ฉุกเฉินของการนับโควตา ไม่ใช่สวิตช์ของนโยบาย
    // "ต้องสมัครสมาชิกก่อนใช้ฟรี" · เคยถูกปิดค้างไว้บน production แล้วทั้งเว็บเปิดฟรี
    // ให้คนไม่ล็อกอินโดยไม่มีใครรู้ (ดู lib/entitlement/signin-gate.ts)
    if (isSignInRequired(viewer)) {
      recordEvent("entitlement_blocked_signin");
      return NextResponse.json(
        { error: getSignInGateMessage(parsed.data.lang), reason: SIGN_IN_GATE_REASON },
        { status: 403 },
      );
    }

    if (enforced) {
      const { getEntitlement } = await import("@/lib/entitlement/entitlement");
      const ent = await getEntitlement(viewer);
      if (!ent.canStartReading) {
        recordEvent("entitlement_blocked_start");
        return NextResponse.json(
          {
            error:
              ent.kind === "guest"
                ? REQUIRE_SIGNUP_TO_READ
                  ? (parsed.data.lang === "en"
                      ? `Sign in or create a free account to continue your reading (${DAILY_LIMIT} free daily readings).`
                      : `สมัครสมาชิกฟรีหรือเข้าสู่ระบบก่อนเปิดไพ่ แล้วดูดวงได้ฟรีวันละ ${DAILY_LIMIT} ครั้ง`)
                  : (parsed.data.lang === "en"
                      ? `You have used your free reading quota. Sign in to receive ${DAILY_LIMIT} free readings daily.`
                      : `คุณใช้สิทธิ์ดูดวงฟรีครบแล้ว สมัครสมาชิกเพื่อรับสิทธิ์เปิดไพ่วันละ ${DAILY_LIMIT} ครั้งฟรี`)
                : (parsed.data.lang === "en"
                    ? `You have reached your daily quota of ${DAILY_LIMIT} readings. Return tomorrow at 00:00 or add credits to continue.`
                    : `คุณใช้โควตาดูดวงครบ ${DAILY_LIMIT} ครั้งของวันนี้แล้ว กลับมาเปิดใหม่ได้ในวันพรุ่งนี้เวลา 00:00 น. หรือเติมรอบเพื่อดูต่อทันที`),
            reason: ent.reason ?? (ent.kind === "guest" ? GUEST_BLOCK_REASON : "daily_exhausted"),
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
            {
              error:
                parsed.data.lang === "en"
                  ? "This spread layout is reserved for VIP Seer credits."
                  : "ผังพยากรณ์นี้สงวนไว้สำหรับผู้ถือญาณพยากรณ์พิเศษ",
              reason: "grand_spread",
            },
            { status: 403 },
          );
        }
        if (isMasterPersona(personaId)) {
          recordEvent("entitlement_blocked_master_persona");
          return NextResponse.json(
            {
              error:
                parsed.data.lang === "en"
                  ? "This master reader persona is reserved for VIP Seer credits."
                  : "ปรมาจารย์ท่านนี้สงวนไว้สำหรับผู้ถือญาณพยากรณ์พิเศษ",
              reason: "master_persona",
            },
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
              error:
                parsed.data.lang === "en"
                  ? "You have reached the trial reading limit from this network today. Sign in to continue."
                  : "วันนี้เปิดไพ่แบบทดลองจากเครือข่ายนี้ครบแล้ว สมัครสมาชิกเพื่อเปิดต่อได้เลย",
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
    lang: parsed.data.lang,
    safetyFlag: verdict.flag,
    safetyGuard: verdict.promptGuard,
    commitment,
    serverSeed,
    clientSeed: parsed.data.clientSeed ? normalizeClientSeed(parsed.data.clientSeed) : undefined,
    derivation,
    zodiac: parsed.data.zodiac,
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
    clientSeed: record.clientSeed,
    sessionToken,
    spread: {
      id: spread.id,
      nameTh: spread.nameTh,
      nameEn: spread.nameEn,
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
