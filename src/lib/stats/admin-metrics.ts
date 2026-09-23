/**
 * 📊 ทะเบียนเมตริกที่แผงสถิติแอดมินอ่าน + ตัวสรุปก้อนตัวนับ 1 วัน/1 ช่วง
 * ---------------------------------------------------------------------------
 * ฟังก์ชันบริสุทธิ์ ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และหน้าแอดมิน (ห้าม import อะไรที่แตะ D1/KV)
 *
 * ทำไมต้องรวมชื่อเมตริกไว้ที่เดียว: แผงเดิมอ่าน `ai_failover_groq_to_gemini`
 * ทั้งที่ตัวบันทึกเขียน `ai_groq_failover` ➔ การ์ด failover ขึ้น 0 ตลอดกาลโดยไม่มีใครรู้
 * ตอนนี้ด่าน `scripts/qa/test-admin-stats-keys.ts` ไล่ตรวจว่าทุกชื่อในไฟล์นี้
 * มีจุดบันทึกจริงใน `src/` — ชื่อที่ไม่มีใครเขียน = ด่านแดง
 */

/** เมตริกชื่อเต็ม (ตรงตัว) */
export const METRIC = {
  started: "reading_started",
  completed: "reading_completed",
  failed: "reading_failed",
  cancelled: "reading_client_cancelled",
  persistFailed: "reading_persist_failed",
  readingBlocked: "reading_blocked",
  chat: "chat_message",
  chatBlocked: "chat_blocked",
  chatOffline: "chat_offline_fallback",
  dailyCheckin: "daily_checkin",
  clarify: "ai_clarify_triggered",
  aiCapHit: "ai_cap_hit",
  groqFailover: "ai_groq_failover",
  mockServed: "ai_mock_served",
  latencyMs: "ai_latency_ms",
  tokensIn: "ai_tokens_in",
  tokensOut: "ai_tokens_out",
  blockedStart: "entitlement_blocked_start",
  blockedRead: "entitlement_blocked_read",
  blockedSignin: "entitlement_blocked_signin",
  blockedGrand: "entitlement_blocked_grand_spread",
  blockedMaster: "entitlement_blocked_master_persona",
  blockedChat: "entitlement_blocked_chat",
  guestIpCapped: "entitlement_guest_ip_capped",
  digestSent: "digest_sent",
  checkoutFailed: "checkout_failed",
  purchaseGrantFailed: "purchase_grant_failed",
} as const;

/** เมตริกแบบมี prefix (ค่าหลัง prefix คือมิติ เช่น ชื่อผัง/ผู้ให้บริการ AI) */
export const PREFIX = {
  aiCall: "ai_call:",
  aiError: "ai_error:",
  schemaFail: "ai_schema_fail:",
  foreignTrip: "ai_foreign_trip:",
  spread: "spread:",
  persona: "persona:",
  category: "category:",
  safetyFlag: "safety_flag:",
} as const;

/**
 * ผู้ให้บริการ AI ที่นับแยก — ตัวบันทึกเขียนทั้ง `<prefix><provider>` และ `<prefix><model>`
 * จึงต้องรวมเฉพาะคีย์ผู้ให้บริการ ไม่งั้นนับซ้ำเป็นสองเท่า
 */
const AI_PROVIDERS = ["groq", "gemini"] as const;

export const CATEGORY_NAME: Record<string, string> = {
  general: "ทั่วไป",
  love: "ความรัก",
  work: "การงาน",
  money: "การเงิน",
  self: "ตัวเอง",
};

export const FLAG_NAME: Record<string, string> = {
  crisis: "สัญญาณวิกฤต (1323)",
  crisis_ai: "สัญญาณวิกฤต — AI ตรวจพบ (1323)",
  medical: "สุขภาพ/การแพทย์",
  legal: "กฎหมาย/คดี",
  gambling: "หวย/พนัน/หุ้น",
  third_party: "เรื่องบุคคลที่สาม",
};

export interface CountRow {
  key: string;
  count: number;
}

export type Counters = Record<string, number>;

function rows(doc: Counters, prefix: string): CountRow[] {
  return Object.entries(doc)
    .filter(([k, v]) => k.startsWith(prefix) && v > 0)
    .map(([k, count]) => ({ key: k.slice(prefix.length), count }))
    .sort((a, b) => b.count - a.count);
}

function sumProviders(doc: Counters, prefix: string): number {
  return AI_PROVIDERS.reduce((s, p) => s + (doc[`${prefix}${p}`] ?? 0), 0);
}

/** สัดส่วนเป็นจำนวนเต็มเปอร์เซ็นต์ · ตัวหารเป็น 0 = `null` (แสดง "—" ไม่ใช่ "0%") */
export function pctOf(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

/** ส่วนต่างเทียบช่วงก่อนหน้า · ช่วงก่อนเป็น 0 = ไม่มีเปอร์เซ็นต์ให้เทียบ */
export function change(cur: number, prev: number): { diff: number; pct: number | null } {
  return { diff: cur - prev, pct: prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null };
}

export interface StatsSummary {
  usage: {
    started: number;
    completed: number;
    completionPct: number | null;
    failed: number;
    cancelled: number;
    persistFailed: number;
    chat: number;
    dailyCheckin: number;
    clarify: number;
  };
  safety: {
    readingBlocked: number;
    chatBlocked: number;
    total: number;
    flags: CountRow[];
  };
  gating: {
    total: number;
    blockedStart: number;
    blockedRead: number;
    blockedSignin: number;
    blockedPremium: number;
    blockedChat: number;
    guestIpCapped: number;
    aiCapHit: number;
  };
  ai: {
    calls: number;
    groq: number;
    gemini: number;
    groqPct: number | null;
    failover: number;
    errors: number;
    schemaFails: number;
    foreignTrips: number;
    mockServed: number;
    chatOffline: number;
    avgLatencyMs: number | null;
    tokensIn: number;
    tokensOut: number;
  };
  business: {
    digestSent: number;
    checkoutFailed: number;
    purchaseGrantFailed: number;
  };
  top: {
    categories: CountRow[];
    spreads: CountRow[];
    personas: CountRow[];
  };
}

/** สรุปก้อนตัวนับ (ของวันเดียว หรือผลรวมทั้งช่วง) ให้อยู่ในหมวดที่แผงแอดมินใช้ */
export function summarize(doc: Counters | null | undefined): StatsSummary {
  const d = doc ?? {};
  const v = (k: string) => d[k] ?? 0;

  const started = v(METRIC.started);
  const completed = v(METRIC.completed);
  const groq = v(`${PREFIX.aiCall}groq`);
  const gemini = v(`${PREFIX.aiCall}gemini`);
  const calls = groq + gemini;

  const readingBlocked = v(METRIC.readingBlocked);
  const chatBlocked = v(METRIC.chatBlocked);

  const blockedStart = v(METRIC.blockedStart);
  const blockedRead = v(METRIC.blockedRead);
  const blockedSignin = v(METRIC.blockedSignin);
  const blockedPremium = v(METRIC.blockedGrand) + v(METRIC.blockedMaster);
  const blockedChat = v(METRIC.blockedChat);
  const guestIpCapped = v(METRIC.guestIpCapped);
  const aiCapHit = v(METRIC.aiCapHit);

  return {
    usage: {
      started,
      completed,
      completionPct: pctOf(completed, started),
      failed: v(METRIC.failed),
      cancelled: v(METRIC.cancelled),
      persistFailed: v(METRIC.persistFailed),
      chat: v(METRIC.chat),
      dailyCheckin: v(METRIC.dailyCheckin),
      clarify: v(METRIC.clarify),
    },
    safety: {
      readingBlocked,
      chatBlocked,
      total: readingBlocked + chatBlocked,
      flags: rows(d, PREFIX.safetyFlag),
    },
    gating: {
      total: blockedStart + blockedRead + blockedSignin + blockedPremium + blockedChat + guestIpCapped + aiCapHit,
      blockedStart,
      blockedRead,
      blockedSignin,
      blockedPremium,
      blockedChat,
      guestIpCapped,
      aiCapHit,
    },
    ai: {
      calls,
      groq,
      gemini,
      groqPct: pctOf(groq, calls),
      failover: v(METRIC.groqFailover),
      errors: sumProviders(d, PREFIX.aiError),
      schemaFails: sumProviders(d, PREFIX.schemaFail),
      foreignTrips: sumProviders(d, PREFIX.foreignTrip),
      mockServed: v(METRIC.mockServed),
      chatOffline: v(METRIC.chatOffline),
      avgLatencyMs: completed > 0 ? Math.round(v(METRIC.latencyMs) / completed) : null,
      tokensIn: v(METRIC.tokensIn),
      tokensOut: v(METRIC.tokensOut),
    },
    business: {
      digestSent: v(METRIC.digestSent),
      checkoutFailed: v(METRIC.checkoutFailed),
      purchaseGrantFailed: v(METRIC.purchaseGrantFailed),
    },
    top: {
      categories: rows(d, PREFIX.category),
      spreads: rows(d, PREFIX.spread),
      personas: rows(d, PREFIX.persona),
    },
  };
}
