import { getAppKV } from "@/lib/platform/cf";

/**
 * Typed JSON helper รอบ ๆ KV + isolate-level memo cache
 * ---------------------------------------------------------
 * KV ของ Cloudflare อ่านเร็ว (edge cache) แต่ยัง eventually-consistent (~60s global)
 * เหมาะกับ: config overrides, stat counters, feature flags (อ่านบ่อย เขียนน้อย)
 * ไม่เหมาะกับ: ข้อมูล transactional / ต้อง consistency ทันที → ใช้ D1 (Phase 2)
 *
 * key prefix ทั้งหมดขึ้นต้น `app:` เพื่อแยกจาก key ของ OpenNext ใน namespace เดียวกัน
 */

export const KEY = {
  /** เอกสาร override เนื้อหาทั้งหมด (prompt / persona / card meanings) — 1 ก้อน JSON */
  contentOverride: () => "app:override:content",
  /** feature flag ราย key */
  flag: (name: string) => `app:flag:${name}`,
  /** ตัวนับสถิติ: app:stat:<metric>:<bucket>  (bucket = YYYY-MM-DD หรือ "all") */
  stat: (metric: string, bucket: string) => `app:stat:${metric}:${bucket}`,
  /** prefix สำหรับ list ตัวนับของ metric หนึ่ง */
  statPrefix: (metric: string) => `app:stat:${metric}:`,
  /** audit log entry (append-only, key เรียงตามเวลา) */
  audit: (ts: number, rand: string) => `app:audit:${ts}:${rand}`,
  auditPrefix: () => "app:audit:",
  /** reading session state (cross-isolate durable backstop) */
  reading: (id: string) => `app:reading:${id}`,
  /** ตัวนับโควตาเรียก AI ต่อวัน: app:aicap:YYYY-MM-DD */
  aiCap: (day: string) => `app:aicap:${day}`,
} as const;

/** memo cache ระดับ isolate — กัน round-trip ซ้ำภายในคำขอเดียว / ข้ามคำขอในช่วงสั้น */
type MemoEntry = { value: unknown; exp: number };
const memo = new Map<string, MemoEntry>();

export function invalidateMemo(key?: string): void {
  if (key) memo.delete(key);
  else memo.clear();
}

/**
 * อ่านค่า JSON จาก KV
 * @param ttlMs อายุ memo cache (0 = ไม่ cache, อ่านสดทุกครั้ง)
 */
export async function kvGetJSON<T>(key: string, ttlMs = 0): Promise<T | null> {
  if (ttlMs > 0) {
    const hit = memo.get(key);
    if (hit && hit.exp > Date.now()) return hit.value as T | null;
  }

  const kv = await getAppKV();
  const raw = await kv.get(key);
  let parsed: T | null = null;
  if (raw != null) {
    try {
      parsed = JSON.parse(raw) as T;
    } catch {
      parsed = null;
    }
  }

  if (ttlMs > 0) memo.set(key, { value: parsed, exp: Date.now() + ttlMs });
  return parsed;
}

/** เขียนค่า JSON ลง KV + ล้าง memo ของ key นั้น */
export async function kvPutJSON(
  key: string,
  value: unknown,
  options?: { expirationTtl?: number },
): Promise<void> {
  const kv = await getAppKV();
  await kv.put(key, JSON.stringify(value), options);
  memo.delete(key);
}

/** ลบ key + ล้าง memo */
export async function kvDelete(key: string): Promise<void> {
  const kv = await getAppKV();
  await kv.delete(key);
  memo.delete(key);
}

/**
 * เพิ่มค่าตัวนับแบบ atomic-best-effort (KV ไม่มี atomic increment จริง —
 * read-modify-write; ยอมรับ race เล็กน้อยสำหรับสถิติเชิงสังเกต ไม่ใช่ตัวเลขบัญชี)
 */
export async function kvIncr(key: string, by = 1): Promise<void> {
  const kv = await getAppKV();
  const current = Number((await kv.get(key)) ?? 0);
  const next = Number.isFinite(current) ? current + by : by;
  await kv.put(key, String(next));
  memo.delete(key);
}

/** อ่านทุก key ภายใต้ prefix (จัดการ pagination ให้) */
export async function kvListKeys(prefix: string, max = 1000): Promise<string[]> {
  const kv = await getAppKV();
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const res = await kv.list({ prefix, cursor, limit: 1000 });
    for (const k of res.keys) out.push(k.name);
    cursor = res.list_complete ? undefined : res.cursor;
  } while (cursor && out.length < max);
  return out.slice(0, max);
}
