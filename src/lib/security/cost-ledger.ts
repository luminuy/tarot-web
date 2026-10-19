import { createHash } from "node:crypto";
import { getAppDB } from "@/lib/platform/db";
import { subnetPrefix } from "@/lib/security/ai-budget";
import { recordEvent } from "@/lib/stats/record";
import { bangkokDayKey } from "@/lib/time/bangkok";

/**
 * 🛡️ บัญชีต้นทุน AI ต่อผู้ใช้ต่อวัน (REFLECTION_JOURNAL_PLAN 1.14 · แทร็ก S · migrations/0026)
 * ---------------------------------------------------------------------------
 * เพดานเดิมนับ "ครั้ง" รวมทั้งเว็บ (`ai-budget.ts`) + ความถี่ต่อ IP/ผู้ใช้ — แต่ไม่รู้ว่า "ใครกินโทเคนไปเท่าไร"
 * คนเดียวที่ส่งคำถามยาวสุดเพดานซ้ำ ๆ หรือถามต่อในแชทยาว ๆ จึงกินงบได้มากกว่าคนอื่นหลายสิบเท่า
 *
 *  • นับโทเคนเข้า/ออกจริงจาก `usage` ของผู้ให้บริการ ต่อ "ตัวตน": สมาชิก = บัญชี · ผู้เยี่ยมชม = ซับเน็ต (แฮช)
 *  • เพดานรายวันตามระดับ: ผู้เยี่ยมชม < สมาชิก < ผู้ถือรอบที่ซื้อ/ไม่จำกัด (ตั้งผ่าน env ได้)
 *  • fail-open: D1 ล่ม ➔ ไม่บล็อกใคร (มีเพดานรวมทั้งเว็บกันอยู่อีกชั้น) แต่ยิง metric ให้เห็น
 *  • ข้อมูลรายบัญชีเป็นข้อมูลส่วนบุคคล ➔ ลงทะเบียนส่งออก/ลบใน `src/lib/privacy/user-data.ts`
 *  • วันของบัญชีตัดตามวันไทย (`bangkokDayKey`) ให้ตรงกับข้อความ "พรุ่งนี้กลับมาใช้ได้" ที่ผู้ใช้เห็น (A3-03)
 */

/** วันของบัญชีต้นทุน — ตัดเที่ยงคืนเวลาไทย เส้นเดียวกับโควตาเปิดไพ่รายวัน */
function ledgerDay(d = new Date()): string {
  return bangkokDayKey(d);
}

/** `reader` = แม่หมอใน Reader Studio (โควตาร่างคำอ่านแยกจากผู้ใช้ทั่วไป — แผน 1.13) */
export type CostTier = "guest" | "member" | "paid" | "reader";

const DEFAULTS: Record<CostTier, number> = { guest: 60_000, member: 300_000, paid: 1_500_000, reader: 800_000 };
const ENV: Record<CostTier, string> = {
  guest: "AI_GUEST_DAILY_TOKENS",
  member: "AI_MEMBER_DAILY_TOKENS",
  paid: "AI_PAID_DAILY_TOKENS",
  reader: "AI_READER_DAILY_TOKENS",
};

export function dailyTokenCap(tier: CostTier): number {
  const n = Number(process.env[ENV[tier]]);
  return Number.isFinite(n) && n > 0 ? n : DEFAULTS[tier];
}

/** ตัวตนในบัญชีต้นทุน — สมาชิกใช้ userId · ผู้เยี่ยมชมใช้แฮชของซับเน็ต (ไม่เก็บ IP ดิบ · PDPA) */
export function costSubject(userId: string | null | undefined, ip: string): string {
  if (userId) return `u:${userId}`;
  return `g:${createHash("sha256").update(subnetPrefix(ip)).digest("hex").slice(0, 16)}`;
}

/** โทเคนโดยประมาณจากจำนวนอักขระ — ใช้เมื่อผู้ให้บริการไม่ส่ง `usage` มา (สูตรเดียวกับ reading-stream.ts) */
export function estimateTokens(chars: number): number {
  return Math.max(0, Math.round(chars / 3.5));
}

export async function recordAiUsage(subject: string, tokensIn: number, tokensOut: number): Promise<void> {
  const tin = Math.max(0, Math.round(tokensIn || 0));
  const tout = Math.max(0, Math.round(tokensOut || 0));
  try {
    const db = await getAppDB();
    await db
      .prepare(
        `INSERT INTO ai_usage_daily (day, subject, calls, tokens_in, tokens_out) VALUES (?, ?, 1, ?, ?)
         ON CONFLICT(day, subject) DO UPDATE SET calls = calls + 1, tokens_in = tokens_in + excluded.tokens_in, tokens_out = tokens_out + excluded.tokens_out`,
      )
      .bind(ledgerDay(), subject, tin, tout)
      .run();
    if (Math.random() < 0.01) {
      const cutoff = ledgerDay(new Date(Date.now() - 35 * 86_400_000));
      await db.prepare(`DELETE FROM ai_usage_daily WHERE day < ?`).bind(cutoff).run().catch(() => undefined);
    }
  } catch {
    recordEvent("ai_cost_ledger_degraded");
  }
}

export async function getAiUsageFor(subject: string, day = ledgerDay()): Promise<{ calls: number; tokens: number }> {
  try {
    const db = await getAppDB();
    const row = await db
      .prepare(`SELECT calls, tokens_in + tokens_out AS tokens FROM ai_usage_daily WHERE day = ? AND subject = ?`)
      .bind(day, subject)
      .first<{ calls: number; tokens: number }>();
    return { calls: Number(row?.calls ?? 0), tokens: Number(row?.tokens ?? 0) };
  } catch {
    return { calls: 0, tokens: 0 };
  }
}

/**
 * true = วันนี้ตัวตนนี้ใช้โทเคนครบเพดานของระดับตัวเองแล้ว (ตรวจ "ก่อน" เรียกโมเดล)
 *
 * A3-03: สมาชิกที่ถือรอบที่ซื้อได้เพดาน `paid` — ผู้เรียกส่ง `hasPaidCredits` มาให้
 * อ่านสิทธิ์เฉพาะเมื่อใช้ถึงเพดานสมาชิกแล้วเท่านั้น คำขอส่วนใหญ่จึงไม่ต้องอ่าน D1 เพิ่ม
 * อ่านสิทธิ์ไม่ได้ ➔ ใช้เพดานสมาชิกตามเดิม (ไม่ให้เพดานสูงขึ้นเพราะระบบเราพัง)
 */
export async function isUserTokenCapReached(
  subject: string,
  tier: CostTier,
  opts: { hasPaidCredits?: () => Promise<boolean> } = {},
): Promise<boolean> {
  const { tokens } = await getAiUsageFor(subject);
  let effective: CostTier = tier;
  if (tier === "member" && opts.hasPaidCredits && tokens >= dailyTokenCap("member")) {
    const paid = await opts.hasPaidCredits().catch(() => false);
    if (paid) effective = "paid";
  }
  const reached = tokens >= dailyTokenCap(effective);
  if (reached) recordEvent(`ai_user_cap_reached:${effective}`);
  return reached;
}

export function tokenCapMessage(lang: "th" | "en"): string {
  return lang === "en"
    ? "You've used today's AI reading allowance. It resets tomorrow — your saved readings are still here."
    : "วันนี้ใช้แม่หมอ AI ครบโควตาของวันแล้ว พรุ่งนี้กลับมาใช้ได้ตามปกติ คำอ่านที่บันทึกไว้ยังอยู่ครบ";
}

/* ── PDPA ── */
export async function exportAiUsage(userId: string): Promise<Array<{ day: string; calls: number; tokensIn: number; tokensOut: number }>> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(`SELECT day, calls, tokens_in, tokens_out FROM ai_usage_daily WHERE subject = ? ORDER BY day DESC`)
    .bind(`u:${userId}`)
    .all<{ day: string; calls: number; tokens_in: number; tokens_out: number }>();
  return (results || []).map((r) => ({ day: r.day, calls: r.calls, tokensIn: r.tokens_in, tokensOut: r.tokens_out }));
}

export async function deleteAiUsage(userId: string): Promise<number> {
  const db = await getAppDB();
  const res = await db.prepare(`DELETE FROM ai_usage_daily WHERE subject = ?`).bind(`u:${userId}`).run();
  return res.meta?.changes ?? 0;
}
