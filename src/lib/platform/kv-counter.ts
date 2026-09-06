import { getWaitUntil } from "@/lib/platform/cf";
import { kvGetJSON, kvPutJSON } from "@/lib/platform/kv-store";

/**
 * 🔢 ตัวนับบน KV แบบสะสมใน isolate ก่อนค่อยเขียนรวมทีเดียว (Buffered KV Counter)
 * ---------------------------------------------------------------------------
 * ทำไมต้องมี: Cloudflare KV แพ็กเกจฟรีเขียนได้ ~1,000 ครั้ง/วัน แต่การเปิดไพ่ 1 ครั้ง
 * ของผู้เยี่ยมชมเดิมเขียน KV ถึง ~4 ครั้งจากตัวนับล้วน ๆ:
 *   - โควตา AI รายวัน (`recordAiCall`)            1 ครั้ง
 *   - โควตาเปิดไพ่ต่อ IP (`recordPerIpReadQuota`)  1 ครั้ง
 *   - โควตาผู้เยี่ยมชม ต่อ IP + ต่อซับเน็ต          2 ครั้ง
 * เท่ากับเพดานจริงอยู่ที่ ~250 คน/วัน ทั้งที่เพดาน AI ในโค้ดตั้งไว้ 2,000 ครั้ง/วัน
 *
 * วิธี: ยืมแพตเทิร์นเดียวกับ `src/lib/stats/record.ts` — สะสม delta ไว้ใน buffer ระดับ
 * isolate แล้ว flush รวมกันผ่าน `waitUntil` แบบ debounce ทำให้การเขียนกลายเป็น
 * "ไม่กี่ครั้งต่อนาที" แทน "ทุกครั้งที่มีคนเปิดไพ่"
 *
 * ⚠️ ข้อแลกเปลี่ยนที่ต้องรู้ (ตั้งใจยอมรับ):
 * 1. ตัวเลขใน KV จะช้ากว่าความจริงได้ถึง `FLUSH_DEBOUNCE_MS`
 * 2. ถ้า isolate ถูก recycle ก่อน flush ตัวนับที่ค้างอยู่จะหาย (นับขาด ไม่ใช่นับเกิน)
 * 3. หลาย isolate ต่างคนต่างสะสม ทำให้ผู้ใช้อาจทะลุโควตาได้เล็กน้อยในช่วงคาบเกี่ยว
 *
 * ข้อ 1–3 ยอมรับได้เพราะของเดิมก็ไม่ได้แม่นกว่านี้อยู่แล้ว — KV เป็น eventually-consistent
 * (~60 วินาที) และโค้ดเดิม memo ค่าที่อ่านมาไว้ 20 วินาทีอยู่ก่อนแล้ว
 * (ดูหมายเหตุเดิมใน `ai-budget.ts` และ `docs/specs/ENTITLEMENT_ABUSE_MODEL.md`)
 *
 * ✅ สิ่งที่ยัง "แม่นเสมอ" คือมุมมองภายใน isolate เดียวกัน เพราะ `readCounter()`
 *    บวก delta ที่ยังค้างใน buffer กลับเข้าไปด้วย คนที่กดรัว ๆ จากเครื่องเดียว
 *    (ซึ่งมักตกอยู่ isolate เดิม) จึงยังโดนตัดตามโควตาทันที
 */

const FLUSH_DEBOUNCE_MS = 20_000;
/** อายุค่าที่อ่านจาก KV มาแคชไว้ใน isolate */
const READ_MEMO_MS = 20_000;

interface PendingDelta {
  delta: number;
  /** TTL ที่จะใช้ตอนเขียนลง KV (วินาที) */
  ttlSec: number;
}

type CounterGlobal = {
  __tarot_kvcount_buf__?: Map<string, PendingDelta>;
  __tarot_kvcount_read__?: Map<string, { value: number; at: number }>;
  __tarot_kvcount_lastFlush__?: number;
  __tarot_kvcount_flushing__?: boolean;
};

function g(): CounterGlobal {
  return globalThis as CounterGlobal;
}

function buffer(): Map<string, PendingDelta> {
  const gg = g();
  return (gg.__tarot_kvcount_buf__ ??= new Map());
}

function readCache(): Map<string, { value: number; at: number }> {
  const gg = g();
  return (gg.__tarot_kvcount_read__ ??= new Map());
}

/** delta ที่ยังไม่ได้เขียนลง KV ของคีย์นี้ */
function pendingOf(key: string): number {
  return buffer().get(key)?.delta ?? 0;
}

/**
 * อ่านค่าตัวนับ = ค่าใน KV (แคชไว้ในหน่วยความจำ) + delta ที่ยังค้างใน buffer
 * ทำให้การบังคับโควตาภายใน isolate เดียวกันยังตรงทันที
 */
export async function readCounter(key: string): Promise<number> {
  const cache = readCache();
  const cached = cache.get(key);

  if (cached && Date.now() - cached.at < READ_MEMO_MS) {
    return cached.value + pendingOf(key);
  }

  const raw = await kvGetJSON<{ count: number }>(key).catch(() => null);
  const value = raw?.count ?? 0;
  cache.set(key, { value, at: Date.now() });
  return value + pendingOf(key);
}

/**
 * เพิ่มตัวนับ (ยังไม่เขียน KV ทันที — สะสมไว้ก่อนแล้วนัด flush)
 * `ttlSec` ใช้ตอนเขียนจริง ถ้าคีย์เดิมมี ttl อยู่แล้วจะเก็บค่าที่มากกว่าไว้
 */
export function bumpCounter(key: string, ttlSec: number, amount = 1): void {
  if (!key || amount === 0) return;
  const buf = buffer();
  const cur = buf.get(key);
  buf.set(key, {
    delta: (cur?.delta ?? 0) + amount,
    ttlSec: Math.max(cur?.ttlSec ?? 0, ttlSec),
  });
  void scheduleFlush();
}

async function scheduleFlush(): Promise<void> {
  const gg = g();
  const now = Date.now();
  if (gg.__tarot_kvcount_flushing__) return;
  if (gg.__tarot_kvcount_lastFlush__ && now - gg.__tarot_kvcount_lastFlush__ < FLUSH_DEBOUNCE_MS) {
    return;
  }

  gg.__tarot_kvcount_lastFlush__ = now;
  try {
    const waitUntil = await getWaitUntil();
    waitUntil(flushCounters());
  } catch {
    // ไม่มี waitUntil (unit test / dev) — เขียนตรงไปเลย ไม่ต้องรอ
    void flushCounters();
  }
}

/**
 * เขียน delta ที่สะสมไว้ทั้งหมดลง KV (read-modify-write ทีละคีย์)
 * ถ้าคีย์ไหนเขียนไม่สำเร็จ จะคืน delta กลับ buffer เพื่อรวมไปกับรอบถัดไป
 */
export async function flushCounters(): Promise<void> {
  const gg = g();
  const buf = buffer();
  if (buf.size === 0 || gg.__tarot_kvcount_flushing__) return;

  gg.__tarot_kvcount_flushing__ = true;
  const drained = new Map(buf);
  buf.clear();

  try {
    const cache = readCache();
    await Promise.all(
      Array.from(drained, async ([key, pending]) => {
        try {
          const raw = await kvGetJSON<{ count: number }>(key).catch(() => null);
          const next = (raw?.count ?? 0) + pending.delta;
          await kvPutJSON(key, { count: next }, { expirationTtl: pending.ttlSec });
          cache.set(key, { value: next, at: Date.now() });
        } catch {
          // คืน delta กลับ buffer — รอบหน้าค่อยรวมเขียนใหม่
          const cur = buf.get(key);
          buf.set(key, {
            delta: (cur?.delta ?? 0) + pending.delta,
            ttlSec: Math.max(cur?.ttlSec ?? 0, pending.ttlSec),
          });
        }
      })
    );
  } finally {
    gg.__tarot_kvcount_flushing__ = false;
  }
}
