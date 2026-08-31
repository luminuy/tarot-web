import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * ตัวกลางเข้าถึง Cloudflare bindings จากโค้ดแอป (Platform Access Layer)
 * ----------------------------------------------------------------------
 * - บน Cloudflare Worker (production / `opennextjs-cloudflare build`): คืน binding จริง
 * - บน `next dev` เครื่อง local: ไม่มี workerd (ISSUE-004 — macOS 12.6 รัน wrangler dev ไม่ได้)
 *   จึง fallback เป็น in-memory shim — ข้อมูลรีเซ็ตเมื่อรีสตาร์ท dev server ซึ่งรับได้สำหรับงานพัฒนา
 *
 * ⚠️ ห้ามเรียก `initOpenNextCloudflareForDev()` ใน next.config.ts —
 *    มันสตาร์ท workerd ซึ่งพังบน macOS < 13.5 (ISSUE-004) และจะทำให้ `npm run dev` ใช้ไม่ได้ทั้งหมด
 *    การตรวจ path KV จริงให้ทำหลัง deploy ด้วย curl บน production (แนวเดียวกับ INC-0010/0016)
 *
 * หมายเหตุ: reuse KV namespace `NEXT_INC_CACHE_KV` ที่ผูกไว้แล้วใน wrangler.jsonc
 * (ของ OpenNext incremental cache) โดยใช้ key prefix `app:` แยกโซนกันชัดเจน —
 * ไม่ต้อง provision namespace ใหม่ ไม่ต้องแตะ wrangler.jsonc (กัน INC-0034)
 */

/** ส่วนของ KVNamespace API ที่แอปนี้ใช้จริง (structural — ไม่ต้องพึ่ง @cloudflare/workers-types) */
export interface AppKV {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; expiration?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: {
    prefix?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
}

/** in-memory shim: ใช้เฉพาะตอน dev / test ที่ไม่มี Cloudflare binding */
function createMemoryKV(): AppKV {
  const g = globalThis as { __tarot_kv_shim__?: Map<string, { v: string; exp?: number }> };
  const store = (g.__tarot_kv_shim__ ??= new Map());

  const alive = (k: string) => {
    const rec = store.get(k);
    if (!rec) return undefined;
    if (rec.exp && Date.now() > rec.exp) {
      store.delete(k);
      return undefined;
    }
    return rec;
  };

  return {
    async get(key) {
      return alive(key)?.v ?? null;
    },
    async put(key, value, options) {
      const exp = options?.expirationTtl
        ? Date.now() + options.expirationTtl * 1000
        : options?.expiration
          ? options.expiration * 1000
          : undefined;
      store.set(key, { v: value, exp });
    },
    async delete(key) {
      store.delete(key);
    },
    async list(options) {
      const prefix = options?.prefix ?? "";
      const keys = [...store.keys()]
        .filter((k) => k.startsWith(prefix) && alive(k))
        .sort()
        .slice(0, options?.limit ?? 1000)
        .map((name) => ({ name }));
      return { keys, list_complete: true };
    },
  };
}

let cachedKV: AppKV | null = null;

/**
 * คืน KV store สำหรับข้อมูลแอป (config overrides / stat counters / feature flags)
 * เรียกได้จาก route handler หรือ server util — ปลอดภัยทั้ง edge และ dev
 */
export async function getAppKV(): Promise<AppKV> {
  if (cachedKV) return cachedKV;

  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx.env as Record<string, unknown>;
    const binding = env.NEXT_INC_CACHE_KV;
    if (binding && typeof (binding as AppKV).get === "function") {
      cachedKV = binding as AppKV;
      return cachedKV;
    }
  } catch {
    // ไม่มี Cloudflare context (เช่น `next dev`) — ตกไปใช้ shim
  }

  cachedKV = createMemoryKV();
  return cachedKV;
}

/**
 * คืน execution context เพื่อใช้ `waitUntil` (งาน background เช่น บันทึกสถิติ)
 * ถ้าไม่มี (dev) จะคืน shim ที่รัน callback ทันทีแบบ fire-and-forget
 */
export async function getWaitUntil(): Promise<(promise: Promise<unknown>) => void> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const exec = ctx.ctx as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
    if (exec?.waitUntil) return exec.waitUntil.bind(exec);
  } catch {
    // ignore
  }
  return (promise: Promise<unknown>) => {
    void Promise.resolve(promise).catch(() => {});
  };
}
