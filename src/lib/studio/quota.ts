import { edgeRateLimitKey, bumpEdgeCounter, peekEdgeCounter } from "@/lib/security/edge-ratelimit";

/**
 * 🎟️ โควตาร่างคำอ่านด้วย AI ของแม่หมอ — แยกจากผู้ใช้ทั่วไป (REFLECTION_JOURNAL_PLAN 1.13)
 *  • ต่อแม่หมอต่อวัน ตั้งผ่าน `STUDIO_DRAFTS_PER_DAY` (ค่าเริ่ม 40)
 *  • อีกชั้น: บัญชีโทเคนรายวัน tier `reader` (`cost-ledger.ts`) + เพดานงบ AI ทั้งเว็บ
 *  • ⏸️ แพ็กเกจรายเดือนผ่าน Stripe ยังรอเจ้าของตั้งราคา — ตอนนี้ทุกคนได้โควตาเท่ากัน
 */
const WINDOW_SEC = 86_400;

export function studioDraftsPerDay(): number {
  const n = Number(process.env.STUDIO_DRAFTS_PER_DAY);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 40;
}

const key = (readerId: string) => edgeRateLimitKey("studio:draft:day", readerId);

export async function studioDraftQuota(readerId: string): Promise<{ used: number; limit: number }> {
  const used = await peekEdgeCounter(key(readerId), WINDOW_SEC).catch(() => 0);
  return { used, limit: studioDraftsPerDay() };
}

/** นับก่อนเรียก AI · เกินโควตา = false (ไม่นับเพิ่มต่อเมื่อเกิน) */
export async function takeStudioDraft(readerId: string): Promise<boolean> {
  const { used, limit } = await studioDraftQuota(readerId);
  if (used >= limit) return false;
  await bumpEdgeCounter(key(readerId), WINDOW_SEC).catch(() => 0);
  return true;
}
