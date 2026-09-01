import { createHash } from "node:crypto";
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

const DEFAULT_IP_READ_QUOTA = 40; // 40 readings per day per IP
const ipMemo = new Map<string, { count: number; at: number }>();

function hashIpForDay(ip: string, day: string): string {
  return createHash("sha256").update(`${ip}:${day}`).digest("hex").slice(0, 16);
}

/**
 * ตรวจสอบโควตาการเปิดไพ่ต่อ IP ข้าม Edge fleet (Cloudflare KV Backed)
 * ป้องกันการยิงคำขอต่อเนื่องข้าม Edge Nodes
 */
export async function checkPerIpReadQuota(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const day = utcDay();
  const ipHash = hashIpForDay(ip, day);
  const cacheKey = `${day}:${ipHash}`;

  const cached = ipMemo.get(cacheKey);
  if (cached && Date.now() - cached.at < 20_000) {
    const rem = Math.max(0, DEFAULT_IP_READ_QUOTA - cached.count);
    return { allowed: cached.count < DEFAULT_IP_READ_QUOTA, remaining: rem };
  }

  const kvKey = `app:ipq:read:${day}:${ipHash}`;
  const raw = await kvGetJSON<{ count: number }>(kvKey).catch(() => null);
  const count = raw?.count ?? 0;
  ipMemo.set(cacheKey, { count, at: Date.now() });

  const remaining = Math.max(0, DEFAULT_IP_READ_QUOTA - count);
  return { allowed: count < DEFAULT_IP_READ_QUOTA, remaining };
}

/**
 * บันทึกการใช้งานโควตาต่อ IP หลังเริ่มอ่านสำเร็จ
 */
export async function recordPerIpReadQuota(ip: string): Promise<void> {
  const day = utcDay();
  const ipHash = hashIpForDay(ip, day);
  const cacheKey = `${day}:${ipHash}`;
  const kvKey = `app:ipq:read:${day}:${ipHash}`;

  try {
    const waitUntil = await getWaitUntil();
    waitUntil(
      (async () => {
        const raw = await kvGetJSON<{ count: number }>(kvKey).catch(() => null);
        const newCount = (raw?.count ?? 0) + 1;
        await kvPutJSON(kvKey, { count: newCount }, { expirationTtl: 60 * 60 * 24 }).catch(() => {});
        ipMemo.set(cacheKey, { count: newCount, at: Date.now() });
      })()
    );
  } catch {
    const raw = await kvGetJSON<{ count: number }>(kvKey).catch(() => null);
    const newCount = (raw?.count ?? 0) + 1;
    await kvPutJSON(kvKey, { count: newCount }, { expirationTtl: 60 * 60 * 24 }).catch(() => {});
    ipMemo.set(cacheKey, { count: newCount, at: Date.now() });
  }
}

