import { kvGetJSON, kvPutJSON, KEY } from "@/lib/platform/kv-store";
import { getWaitUntil } from "@/lib/platform/cf";
import { utcDay } from "@/lib/stats/record";

const DEFAULT_DAILY_CAP = 2000;
const MEMO_MS = 30_000;
let memo: { day: string; count: number; at: number } | null = null;

export function getAiDailyCap(): number {
  const n = Number(process.env.AI_DAILY_CALL_CAP);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_CAP;
}

/**
 * true ถ้าวันนี้เรียก AI เกินเพดานแล้ว — ตรวจสอบก่อนเริ่ม stream Gemini
 */
export async function isAiCapReached(): Promise<boolean> {
  const day = utcDay();
  if (!memo || memo.day !== day || Date.now() - memo.at > MEMO_MS) {
    const raw = await kvGetJSON<{ count: number }>(KEY.aiCap(day)).catch(() => null);
    memo = { day, count: raw?.count ?? 0, at: Date.now() };
  }
  return memo.count >= getAiDailyCap();
}

/**
 * เรียกหลังจุด Gemini call สำเร็จ (ใน done handler) — best-effort, background
 */
export async function recordAiCall(n = 1): Promise<void> {
  const day = utcDay();
  try {
    const waitUntil = await getWaitUntil();
    waitUntil(
      (async () => {
        const k = KEY.aiCap(day);
        const cur = (await kvGetJSON<{ count: number }>(k).catch(() => null))?.count ?? 0;
        await kvPutJSON(k, { count: cur + n }, { expirationTtl: 60 * 60 * 48 }).catch(() => {});
        if (memo?.day === day) {
          memo.count = cur + n;
        }
      })()
    );
  } catch {
    // If background waitUntil fails or is not available
    const k = KEY.aiCap(day);
    const cur = (await kvGetJSON<{ count: number }>(k).catch(() => null))?.count ?? 0;
    await kvPutJSON(k, { count: cur + n }, { expirationTtl: 60 * 60 * 48 }).catch(() => {});
    if (memo?.day === day) {
      memo.count = cur + n;
    }
  }
}
