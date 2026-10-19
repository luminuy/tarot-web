/**
 * 📶 ตรรกะ "ต่อสายใหม่อัตโนมัติ" + "วัดคุณภาพสาย" ของห้องวิดีโอคอล (ฟังก์ชันล้วน ไม่แตะเบราว์เซอร์)
 * ---------------------------------------------------------------------------
 * แยกจาก `VideoCallRoom.tsx` เพื่อให้ด่าน `test-marketplace-readers` ทดสอบได้โดยไม่ต้องมีกล้อง/TURN จริง
 *
 * ## ต่อสายใหม่อัตโนมัติ (เจ้าของสั่ง 2026-10-19 "ความเสถียรล่ะ" ➔ "ทำเลย")
 * เดิมเน็ตกระตุก (สลับ Wi-Fi ↔ 4G · เข้าลิฟต์) สายค้างที่ "สัญญาณหลุด" จนกว่าคนจะกด "ต่อสายใหม่" เอง
 * ลูกค้าส่วนใหญ่ไม่กด แล้วเข้าใจว่าแม่หมอวางสาย
 *
 *   • **ฝั่งลูกค้า (ฝั่งเสนอ offer) เป็นคนสั่งต่อใหม่ฝั่งเดียว** — สองฝั่งสั่งพร้อมกัน = รอบ (`round`) กระโดดสองที
 *     แล้วไล่กันไม่จบ · เน็ตแม่หมอหลุด ฝั่งลูกค้าก็เห็นสายหลุดเหมือนกันจึงสั่งแทนได้
 *   • เคยติดแล้วหลุด (`disconnected`) ➔ รอ 5 วิให้ ICE ฟื้นเองก่อน · หลุดถาวร (`failed`) ➔ ต่อใหม่ทันที
 *   • ยังไม่เคยติดในรอบนี้ ➔ ให้เวลาเจรจา 20 วิ (เก็บ ICE ได้ถึง 6 วิต่อฝั่ง + รอบถามสถานะ)
 *   • ครั้งถัดไปเว้น 10 · 20 · 30 วิ · ครบ {@link MAX_AUTO_RESTARTS} ครั้งแล้วหยุด ให้คนกดเอง
 *     (กันชนเพดาน 120 ครั้ง/ชม. ของ `/api/marketplace/calls` และไม่ยิงวนตอนอีกฝั่งปิดเครื่องไปแล้ว)
 *   • สั่งเฉพาะตอนอีกฝั่งยังอยู่ในห้อง และเครื่องเรามีเน็ต
 */

/** ให้ ICE ฟื้นตัวเองก่อน หลังสายที่เคยติดเริ่มสะดุด */
export const DISCONNECT_GRACE_MS = 5_000;
/** เวลาเจรจาสายรอบใหม่ก่อนถือว่าค้าง */
export const NEGOTIATE_TIMEOUT_MS = 20_000;
/** ต่อใหม่อัตโนมัติได้กี่ครั้งต่อการหลุดหนึ่งช่วง (นับใหม่เมื่อติดอีกครั้ง หรือคนกดต่อสายใหม่เอง) */
export const MAX_AUTO_RESTARTS = 8;

/** ระยะเว้นก่อนต่อใหม่ครั้งที่ `attempt` (เริ่ม 0) — 0 · 10 · 20 · 30 · 30 … วินาที */
export function restartBackoffMs(attempt: number): number {
  if (attempt <= 0) return 0;
  return Math.min(10_000 * attempt, 30_000);
}

export interface RecoveryState {
  now: number;
  /** สายรอบนี้ติดอยู่ตอนนี้ */
  connected: boolean;
  /** เวลาที่รอบนี้เริ่ม (ได้ round ใหม่) */
  roundStartedAt: number;
  /** เวลาที่สายซึ่งเคยติดในรอบนี้เริ่มหลุด (null = ยังไม่เคยติด หรือติดอยู่) */
  lostAt: number | null;
  /** สายหลุดถาวร (`connectionState === "failed"`) */
  failed: boolean;
  /** เวลาที่เราสั่งต่อใหม่ล่าสุด (null = ยังไม่เคยในช่วงหลุดนี้) */
  lastRestartAt: number | null;
  /** สั่งต่อใหม่อัตโนมัติไปแล้วกี่ครั้งในช่วงหลุดนี้ */
  attempts: number;
  peerPresent: boolean;
  online: boolean;
  /** เน็ตเพิ่งกลับมา (เหตุการณ์ `online`) — ต่อใหม่ทันทีไม่ต้องรอ */
  networkReturned: boolean;
}

export type RecoveryDecision = "wait" | "restart" | "give-up";

export function decideRecovery(s: RecoveryState): RecoveryDecision {
  if (s.connected || !s.peerPresent || !s.online) return "wait";
  if (s.attempts >= MAX_AUTO_RESTARTS) return "give-up";
  if (s.networkReturned) return "restart";

  const due =
    s.lostAt !== null
      ? s.lostAt + (s.failed ? 0 : DISCONNECT_GRACE_MS)
      : s.roundStartedAt + (s.failed ? 0 : NEGOTIATE_TIMEOUT_MS);
  if (s.now < due) return "wait";
  if (s.lastRestartAt !== null && s.now - s.lastRestartAt < restartBackoffMs(s.attempts)) return "wait";
  return "restart";
}

// ── คุณภาพสาย ──────────────────────────────────────────────────────────────

export type CallQuality = "good" | "fair" | "weak";

export const CALL_QUALITY_LABEL: Record<CallQuality, string> = {
  good: "สัญญาณดี",
  fair: "สัญญาณพอใช้",
  weak: "สัญญาณอ่อน",
};

/** ตัวนับแพ็กเก็ตสะสมจาก `getStats()` (รวมทุกแทร็กขาเข้า) */
export interface PacketCounters {
  received: number;
  lost: number;
}

/** สัดส่วนแพ็กเก็ตหายในช่วงระหว่างสองครั้งที่วัด (0–1) */
export function lossRatio(prev: PacketCounters | null, cur: PacketCounters): number {
  const received = cur.received - (prev?.received ?? 0);
  const lost = cur.lost - (prev?.lost ?? 0);
  const total = received + Math.max(0, lost);
  if (total <= 0) return 0;
  return Math.max(0, lost) / total;
}

/**
 * จัดระดับจากเวลาไป-กลับ (วินาที) + แพ็กเก็ตหาย — เกณฑ์ตามประสบการณ์ใช้งานวิดีโอคอลทั่วไป:
 * ต่ำกว่า 300 ms และหายไม่ถึง 2% คุยลื่น · เกิน 600 ms หรือหายเกิน 8% ภาพแตก/เสียงขาด
 */
export function classifyCallQuality(rttSec: number | null, loss: number): CallQuality {
  const rtt = rttSec ?? 0;
  if (rtt > 0.6 || loss > 0.08) return "weak";
  if (rtt > 0.3 || loss > 0.02) return "fair";
  return "good";
}
