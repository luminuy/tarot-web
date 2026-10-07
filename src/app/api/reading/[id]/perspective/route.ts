import { NextResponse } from "next/server";
import { z } from "zod";
import { PERSONA_BY_ID } from "@/data/personas";
import type { TarotCard } from "@/data/cards";
import { getContentOverrides, resolveCardByIndex } from "@/lib/content/overrides";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { checkRateLimit, createRateLimitResponse, getClientIdentifier } from "@/lib/utils/rate-limit";
import { getMembersOnlyChatMessage } from "@/lib/entitlement/signin-gate";
import { isMasterPersona } from "@/lib/entitlement/limits";
import { recordEvent, recordEvents } from "@/lib/stats/record";
import { getReading, updateReading, type ReadingRecord } from "@/server/store";
import type { Reading } from "@/lib/schema/reading";
import type { ReadingEvent } from "@/lib/ai/types";
import { resolveRecordSpread } from "@/lib/tarot/record-spread";

export const runtime = "nodejs";

/**
 * ✦ POST /api/reading/[id]/perspective — "ขอมุมที่สอง" (REFLECTION_JOURNAL_PLAN 1.7)
 * ---------------------------------------------------------------------------
 * อ่าน **ไพ่ชุดเดิมเป๊ะ** ของเซสชันนี้ด้วยแม่หมออีกบุคลิก — ไม่สับไพ่ใหม่ ไม่จั่วใหม่ (Provably Fair เดิม)
 *  • นับเป็น "การถามต่อ" แบบเดียวกับแชท: สมาชิกเท่านั้น · ไม่กินโควตาเปิดไพ่ · มีเพดานถี่ต่อวัน
 *  • ต้องอ่านรอบแรกจบแล้ว (`record.result`) — ไพ่หาย/ไม่ครบ ➔ "โหลดใหม่อีกครั้ง" (กฎเหล็กข้อ 14)
 *  • ปรมาจารย์ลับยังสงวนให้ผู้ถือรอบที่ซื้อ (ด่านเดียวกับ `/start`) — ห้ามเป็นช่องหลบสิทธิ์
 *  • ได้แล้วเก็บใน `record.perspectives[personaId]` ➔ เปิดซ้ำไม่เรียก AI
 *  • ตอบเป็น JSON ก้อนเดียว (ไม่สตรีม) — หน้าจอแสดงสถานะรอ · คำอ่านสำรอง (AI ล่มทุกเจ้า) ไม่ถูกเก็บและไม่ส่งคืน
 */

const BodySchema = z.object({
  personaId: z.string().min(1).max(40),
  lang: z.enum(["th", "en"]).optional(),
});

const MSG = {
  notFound: {
    th: "ไม่พบไพ่ของรอบนี้ กรุณาโหลดใหม่อีกครั้ง",
    en: "This reading's cards could not be found. Please reload.",
  },
  notReady: {
    th: "รอให้แม่หมออ่านรอบแรกจบก่อนนะ",
    en: "Please wait for the first reading to finish.",
  },
  badPersona: { th: "ไม่พบแม่หมอท่านนี้", en: "That reader isn't available." },
  samePersona: { th: "เลือกแม่หมออีกท่านเพื่อฟังมุมใหม่", en: "Pick a different reader for a new perspective." },
  master: {
    th: "ปรมาจารย์ท่านนี้สงวนไว้สำหรับผู้ถือญาณพยากรณ์พิเศษ",
    en: "This master reader is reserved for VIP Seer credits.",
  },
  busy: {
    th: "แม่หมอท่านนี้ยังไม่ว่างสักครู่ ลองใหม่อีกครั้งนะ",
    en: "That reader is busy right now. Please try again shortly.",
  },
  cap: {
    th: "ระบบดูดวงมีผู้ใช้จำนวนมากในวันนี้ กรุณาลองใหม่ภายหลัง",
    en: "The reading service is very busy today. Please try again later.",
  },
  daily: {
    th: "วันนี้คุณขอมุมมองเพิ่มครบโควตาแล้ว กลับมาใหม่พรุ่งนี้นะ",
    en: "You've reached today's limit for extra perspectives. Come back tomorrow.",
  },
} as const;

async function loadRecord(id: string, request: Request): Promise<Partial<ReadingRecord> | undefined> {
  let record: Partial<ReadingRecord> | undefined = getReading(id);
  if (!record?.drawn || !record.result) {
    const { loadReadingFromKV, saveReading } = await import("@/server/store");
    const fromKv = await loadReadingFromKV(id);
    if (fromKv) {
      record = fromKv;
      saveReading(fromKv);
    }
  }
  if (!record?.drawn) {
    const token = request.headers.get("x-reading-token");
    if (token) {
      const { verifyReadingSessionToken } = await import("@/lib/security/session-token");
      const recovered = verifyReadingSessionToken(token);
      if (recovered && recovered.id === id) record = recovered;
    }
  }
  return record;
}

/** เก็บคำอ่านจากสตรีมของผู้ให้บริการจนได้เฟรม done — คืน null ถ้าไม่จบ/เป็นคำอ่านสำรอง */
interface Collected {
  reading: Reading;
  /** โทเคนจริงของรอบนี้ — ส่งต่อให้บัญชีต้นทุน (แทร็ก S) */
  usage: { inputTokens: number; outputTokens: number };
}

async function collect(gen: AsyncGenerator<ReadingEvent>): Promise<Collected | null> {
  for await (const ev of gen) {
    if (ev.type === "done") {
      const usage = { inputTokens: ev.usage?.inputTokens ?? 0, outputTokens: ev.usage?.outputTokens ?? 0 };
      const real = usage.inputTokens > 0 || usage.outputTokens > 0;
      return real ? { reading: ev.reading, usage } : null;
    }
    if (ev.type === "error") return null;
  }
  return null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  const lang: "th" | "en" = parsed.success && parsed.data.lang === "en" ? "en" : "th";
  const say = (m: { th: string; en: string }) => m[lang];
  if (!parsed.success) return NextResponse.json({ error: say(MSG.badPersona) }, { status: 400 });

  const persona = PERSONA_BY_ID.get(parsed.data.personaId);
  if (!persona) return NextResponse.json({ error: say(MSG.badPersona) }, { status: 400 });

  const { isPrivilegedTestRequest } = await import("@/lib/security/privileged");
  const privileged = await isPrivilegedTestRequest(request);

  // ── สมาชิกเท่านั้น (เหมือนแชทถามต่อ) + ปรมาจารย์ลับต้องมีรอบที่ซื้อ ──
  let userId: string | null = null;
  if (!privileged) {
    const { getViewer } = await import("@/lib/entitlement/viewer");
    const viewer = await getViewer(request);
    if (viewer.kind !== "member") {
      recordEvent("entitlement_blocked_perspective");
      return NextResponse.json({ error: getMembersOnlyChatMessage(lang), reason: "members_only" }, { status: 403 });
    }
    userId = viewer.userId;
    if (isMasterPersona(persona.id)) {
      const { getEntitlement } = await import("@/lib/entitlement/entitlement");
      const ent = await getEntitlement(viewer);
      if (!ent.hasPaidCredits) {
        return NextResponse.json({ error: say(MSG.master), reason: "master_persona" }, { status: 403 });
      }
    }
  }

  const record = await loadRecord(id, request);
  if (!record?.drawn || record.drawn.length === 0) {
    return NextResponse.json({ error: say(MSG.notFound), reason: "reading_not_found" }, { status: 404 });
  }
  if (!record.result) return NextResponse.json({ error: say(MSG.notReady) }, { status: 409 });
  if ((record.personaId || "warm") === persona.id) {
    return NextResponse.json({ error: say(MSG.samePersona) }, { status: 400 });
  }

  // เปิดซ้ำ = คืนของเดิม ไม่เรียก AI ไม่นับเพดาน
  const cached = record.perspectives?.[persona.id];
  if (cached) return NextResponse.json({ reading: cached, personaId: persona.id, cached: true });

  let limit = { allowed: true, releaseConcurrency: () => {} } as ReturnType<typeof checkRateLimit>;
  let costSubj: string | null = null;
  if (!privileged) {
    const clientIp = getClientIdentifier(request);
    const edge = await consumeEdgeRateLimits([
      { key: edgeRateLimitKey("perspective:ip", clientIp), config: { max: 6, windowSec: 60 } },
      ...(userId ? [{ key: edgeRateLimitKey("perspective:user:day", userId), config: { max: 12, windowSec: 86400 } }] : []),
    ]);
    if (!edge.allowed) return createRateLimitResponse(edge.retryAfterSec, say(MSG.daily));
    limit = checkRateLimit(`perspective:${clientIp}`, { maxRequests: 6, windowSeconds: 60, maxConcurrent: 1 });
    if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds, say(MSG.daily));
    const { isAiCapReached } = await import("@/lib/security/ai-budget");
    if (await isAiCapReached("member")) {
      limit.releaseConcurrency();
      recordEvent("ai_cap_hit");
      return NextResponse.json({ error: say(MSG.cap) }, { status: 503 });
    }
    // 🛡️ แทร็ก S: เพดานโทเคนต่อผู้ใช้ต่อวัน
    const { costSubject, isUserTokenCapReached, tokenCapMessage } = await import("@/lib/security/cost-ledger");
    costSubj = costSubject(userId, clientIp);
    if (await isUserTokenCapReached(costSubj, "member")) {
      limit.releaseConcurrency();
      return NextResponse.json({ error: tokenCapMessage(lang) }, { status: 429 });
    }
  }

  try {
    const spread = resolveRecordSpread(record);
    const overrides = await getContentOverrides();
    const cards = record.drawn.map((d) => resolveCardByIndex(overrides, d.cardIndex));
    // 🃏 กฎเหล็กข้อ 14 — ไพ่ใบไหนหาไม่เจอ ห้ามเดาแทน
    if (!spread || cards.some((c) => !c)) {
      return NextResponse.json({ error: say(MSG.notFound), reason: "reading_not_found" }, { status: 404 });
    }

    const ctx = {
      personaId: persona.id,
      spread,
      category: record.category ?? "general",
      question: record.question ?? "",
      intake: record.intake ?? {},
      nickname: record.nickname,
      drawn: record.drawn,
      cards: cards as TarotCard[],
      safety: { flag: record.safetyFlag ?? "none", block: false, promptGuard: record.safetyGuard },
      zodiac: record.zodiac,
      lang: record.lang || lang,
      abortSignal: (request as Request & { signal?: AbortSignal }).signal,
    } as import("@/lib/ai/prompt").ReadingContext;

    let got: Collected | null = null;
    if (process.env.GROQ_API_KEY) {
      const { streamGroqReading } = await import("@/lib/ai/groq");
      got = await collect(streamGroqReading(ctx)).catch(() => null);
    }
    if (!got) {
      const { streamGeminiReading } = await import("@/lib/ai/gemini");
      got = await collect(streamGeminiReading(ctx)).catch(() => null);
    }
    const reading: Reading | null = got?.reading ?? null;
    if (!reading) {
      recordEvent("perspective_failed");
      return NextResponse.json({ error: say(MSG.busy) }, { status: 503 });
    }

    const { recordAiCall } = await import("@/lib/security/ai-budget");
    void recordAiCall(1);
    if (costSubj) {
      const { recordAiUsage } = await import("@/lib/security/cost-ledger");
      void recordAiUsage(costSubj, got?.usage.inputTokens ?? 0, got?.usage.outputTokens ?? 0);
    }
    recordEvents(["perspective_completed", `perspective_persona:${persona.id}`]);

    const next = updateReading(id, { perspectives: { ...(record.perspectives ?? {}), [persona.id]: reading } });
    if (next) {
      const { persistReading } = await import("@/server/store");
      await persistReading(next).catch(() => recordEvent("reading_persist_failed"));
    }
    return NextResponse.json({ reading, personaId: persona.id, cached: false });
  } finally {
    limit.releaseConcurrency();
  }
}
