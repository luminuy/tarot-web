import { getWaitUntil } from "@/lib/platform/cf";
import { kvGetJSON, kvPutJSON } from "@/lib/platform/kv-store";

/**
 * เก็บสถิติการใช้งานแบบ observational (ไม่ใช่ตัวเลขบัญชี)
 * ---------------------------------------------------------
 * ข้อจำกัด: Cloudflare KV free plan เขียนได้ ~1,000 ครั้ง/วัน — จึง **ห้าม** เขียนต่อ event
 * วิธี: สะสมใน buffer ระดับ isolate แล้ว flush รวมกันผ่าน `waitUntil` แบบ debounce
 *   - `app:stat:day:<YYYY-MM-DD>`  → { metric: count }  (หมดอายุ 400 วัน)
 *   - `app:stat:all`               → { metric: count }  (สะสมตลอดกาล)
 * ยอมรับการสูญเสีย < FLUSH_DEBOUNCE_MS วินาทีต่อ isolate ถ้า worker ถูก recycle
 *
 * ⚠️ metric string ต้องเป็น enum/dimension ที่ไม่มี PII เท่านั้น
 *    (เช่น "reading_started", "spread:celtic-cross", "safety_flag:crisis")
 */

const FLUSH_DEBOUNCE_MS = 20_000;
const DAY_TTL_SEC = 60 * 60 * 24 * 400;

type Buffer = Map<string, number>;
type StatGlobal = {
  __tarot_stat_buf__?: Buffer;
  __tarot_stat_lastFlush__?: number;
  __tarot_stat_flushing__?: boolean;
};

function g(): StatGlobal {
  return globalThis as StatGlobal;
}

function buffer(): Buffer {
  const gg = g();
  return (gg.__tarot_stat_buf__ ??= new Map());
}

export function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** เพิ่มค่าตัวนับลง buffer + นัด flush */
export function recordEvent(metric: string, amount = 1): void {
  if (!metric || amount === 0) return;
  const buf = buffer();
  buf.set(metric, (buf.get(metric) ?? 0) + amount);
  void scheduleFlush();
}

/** เพิ่มหลาย metric พร้อมกัน */
export function recordEvents(metrics: Array<string | [string, number]>): void {
  for (const m of metrics) {
    if (Array.isArray(m)) recordEvent(m[0], m[1]);
    else recordEvent(m);
  }
}

async function scheduleFlush(): Promise<void> {
  const gg = g();
  const now = Date.now();
  if (gg.__tarot_stat_flushing__) return;
  if (gg.__tarot_stat_lastFlush__ && now - gg.__tarot_stat_lastFlush__ < FLUSH_DEBOUNCE_MS) return;

  gg.__tarot_stat_lastFlush__ = now;
  const waitUntil = await getWaitUntil();
  waitUntil(flush());
}

/** เขียน buffer ปัจจุบันลง KV (merge-add) */
export async function flush(): Promise<void> {
  const gg = g();
  const buf = buffer();
  if (buf.size === 0 || gg.__tarot_stat_flushing__) return;

  gg.__tarot_stat_flushing__ = true;
  const drained = new Map(buf);
  buf.clear();

  try {
    const dayKey = `app:stat:day:${utcDay()}`;
    const allKey = "app:stat:all";

    const [day, all] = await Promise.all([
      kvGetJSON<Record<string, number>>(dayKey),
      kvGetJSON<Record<string, number>>(allKey),
    ]);

    const nextDay = { ...(day ?? {}) };
    const nextAll = { ...(all ?? {}) };
    for (const [metric, count] of drained) {
      nextDay[metric] = (nextDay[metric] ?? 0) + count;
      nextAll[metric] = (nextAll[metric] ?? 0) + count;
    }

    await Promise.all([
      kvPutJSON(dayKey, nextDay, { expirationTtl: DAY_TTL_SEC }),
      kvPutJSON(allKey, nextAll),
    ]);
  } catch {
    // flush ล้มเหลว — คืนค่าที่ drain ไปกลับ buffer เพื่อลองใหม่รอบหน้า
    for (const [metric, count] of drained) {
      buf.set(metric, (buf.get(metric) ?? 0) + count);
    }
  } finally {
    gg.__tarot_stat_flushing__ = false;
  }
}
