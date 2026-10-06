import { recordEvent } from "@/lib/stats/record";

/**
 * 🛡️ งบลองใหม่ต่อคำขอ (REFLECTION_JOURNAL_PLAN 1.14 · แทร็ก S)
 * ---------------------------------------------------------------------------
 * สายสำรองของคำอ่านมีได้ถึง 5 โมเดล (Groq 3 + Gemini 2) แต่ละตัวรอได้นานสุด ~55 วินาที
 * ถ้าผู้ให้บริการช้าทั้งสาย คำขอเดียวจะลองครบทุกตัว = กินงบ + ผู้ใช้นั่งรอเกือบ 5 นาที
 * งบนี้จำกัดทั้ง "จำนวนครั้งที่ลอง" และ "เวลารวม" ของทั้งสาย · ไม่ส่งงบมา = พฤติกรรมเดิมทุกอย่าง
 */
export interface RetryBudget {
  /** ขอลองอีก 1 ครั้ง — false = งบหมด ให้หยุดสายสำรองทันที */
  take(): boolean;
  /** เวลาที่เหลือ (ms) — ใช้หนีบ timeout ของแต่ละครั้งไม่ให้เกินงบรวม */
  remainingMs(): number;
}

export const DEFAULT_READING_RETRY = { maxAttempts: 4, totalMs: 90_000 } as const;

export function createRetryBudget(opts: { maxAttempts: number; totalMs: number }, now: () => number = Date.now): RetryBudget {
  const deadline = now() + opts.totalMs;
  let used = 0;
  return {
    take() {
      if (used >= opts.maxAttempts || now() >= deadline) {
        recordEvent("ai_retry_budget_exhausted");
        return false;
      }
      used++;
      return true;
    },
    remainingMs() {
      return Math.max(0, deadline - now());
    },
  };
}

/** หนีบ timeout ของครั้งนี้ให้ไม่เกินเวลาที่เหลือในงบ (อย่างน้อย 1 วินาที — ให้ fetch ล้มเองอย่างเป็นระเบียบ) */
export function clampToBudget(timeoutMs: number, budget?: RetryBudget): number {
  if (!budget) return timeoutMs;
  return Math.max(1000, Math.min(timeoutMs, budget.remainingMs()));
}
