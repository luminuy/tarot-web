/**
 * ตัวกลางเข้าถึง Cloudflare bindings จากโค้ดแอป (Platform Access Layer)
 * ----------------------------------------------------------------------
 * - บน Cloudflare Worker (production / `opennextjs-cloudflare build`): คืน binding จริง
 * - บน `next dev` เครื่อง local / test: ไม่มี workerd (ISSUE-004 — macOS 12.6 รัน wrangler dev ไม่ได้)
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

async function safelyGetCloudflareContext() {
  try {
    const mod = await import("@opennextjs/cloudflare");
    if (typeof mod?.getCloudflareContext === "function") {
      return await mod.getCloudflareContext({ async: true });
    }
  } catch {
    // Dynamic import fails gracefully in local dev or standalone test runner
  }
  return null;
}

let cachedKV: AppKV | null = null;

/**
 * คืน KV store สำหรับข้อมูลแอป (config overrides / stat counters / feature flags)
 * เรียกได้จาก route handler หรือ server util — ปลอดภัยทั้ง edge และ dev
 */
export async function getAppKV(): Promise<AppKV> {
  if (cachedKV) return cachedKV;

  try {
    const ctx = await safelyGetCloudflareContext();
    if (ctx) {
      const env = ctx.env as Record<string, unknown>;
      const binding = env.NEXT_INC_CACHE_KV;
      if (binding && typeof (binding as AppKV).get === "function") {
        cachedKV = binding as AppKV;
        return cachedKV;
      }
    }
  } catch {
    // ไม่มี Cloudflare context (เช่น `next dev`) — ตกไปใช้ shim
  }

  cachedKV = createMemoryKV();
  return cachedKV;
}

/** ส่วนของ Workers AI binding ที่แอปนี้ใช้จริง (structural) */
export interface AppAI {
  run(
    model: string,
    input: Record<string, unknown>,
  ): Promise<{ response?: string } & Record<string, unknown>>;
}

let cachedAI: AppAI | null | undefined;

/**
 * คืน Workers AI binding (`env.AI`) — ใช้กับตัวจำแนกความปลอดภัยชั้น 3
 * dev / test / ยังไม่ deploy = ไม่มี binding → คืน `null` (ผู้เรียกต้อง fail-open เอง)
 */
export async function getAiBinding(): Promise<AppAI | null> {
  if (cachedAI !== undefined) return cachedAI;

  try {
    const ctx = await safelyGetCloudflareContext();
    const binding = (ctx?.env as Record<string, unknown> | undefined)?.AI;
    if (binding && typeof (binding as AppAI).run === "function") {
      cachedAI = binding as AppAI;
      return cachedAI;
    }
  } catch {
    // ไม่มี Cloudflare context — ตกไป null
  }

  cachedAI = null;
  return null;
}

/** ส่วนของ Vectorize binding ที่แอปนี้ใช้จริง (structural) */
export interface AppVectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
  values?: number[];
}
export interface AppVectorize {
  query(
    vector: number[],
    opts?: { topK?: number; returnValues?: boolean; returnMetadata?: boolean | "all" | "none" },
  ): Promise<{ matches: AppVectorizeMatch[]; count?: number }>;
  upsert(
    vectors: { id: string; values: number[]; metadata?: Record<string, unknown> }[],
  ): Promise<{ mutationId?: string } | unknown>;
  getByIds(ids: string[]): Promise<AppVectorizeMatch[]>;
}

let cachedVectorize: AppVectorize | null | undefined;

/**
 * คืน Vectorize binding (`env.VECTORIZE`) — ใช้กับค้นหาเชิงความหมาย
 * dev / test / ยังไม่ deploy = ไม่มี binding → คืน `null` (ผู้เรียกต้อง degrade เอง)
 */
export async function getVectorizeBinding(): Promise<AppVectorize | null> {
  if (cachedVectorize !== undefined) return cachedVectorize;
  try {
    const ctx = await safelyGetCloudflareContext();
    const binding = (ctx?.env as Record<string, unknown> | undefined)?.VECTORIZE;
    if (binding && typeof (binding as AppVectorize).query === "function") {
      cachedVectorize = binding as AppVectorize;
      return cachedVectorize;
    }
  } catch {
    // ไม่มี Cloudflare context
  }
  cachedVectorize = null;
  return null;
}

/** ส่วนของ R2 bucket ที่แอปนี้ใช้จริง (structural) */
export interface AppR2Object {
  body: ReadableStream | null;
  httpMetadata?: { contentType?: string };
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}
export interface AppR2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream | string,
    opts?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<AppR2Object | null>;
  head(key: string): Promise<{ size: number } | null>;
  delete(key: string): Promise<void>;
}

let cachedShareBucket: AppR2Bucket | null | undefined;

/**
 * คืน R2 bucket สำหรับภาพการ์ดแชร์ (`env.SHARE_BUCKET`)
 * dev / test / ยังไม่ deploy = ไม่มี binding → คืน `null` (ผู้เรียกต้อง degrade เอง)
 */
export async function getShareBucket(): Promise<AppR2Bucket | null> {
  if (cachedShareBucket !== undefined) return cachedShareBucket;
  try {
    const ctx = await safelyGetCloudflareContext();
    const binding = (ctx?.env as Record<string, unknown> | undefined)?.SHARE_BUCKET;
    if (binding && typeof (binding as AppR2Bucket).put === "function") {
      cachedShareBucket = binding as AppR2Bucket;
      return cachedShareBucket;
    }
  } catch {
    // ไม่มี Cloudflare context
  }
  cachedShareBucket = null;
  return null;
}

/**
 * คืน execution context เพื่อใช้ `waitUntil` (งาน background เช่น บันทึกสถิติ)
 * ถ้าไม่มี (dev) จะคืน shim ที่รัน callback ทันทีแบบ fire-and-forget
 */
export async function getWaitUntil(): Promise<(promise: Promise<unknown>) => void> {
  try {
    const ctx = await safelyGetCloudflareContext();
    if (ctx) {
      const exec = ctx.ctx as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
      if (exec?.waitUntil) return exec.waitUntil.bind(exec);
    }
  } catch {
    // ignore
  }
  return (promise: Promise<unknown>) => {
    void Promise.resolve(promise).catch(() => {});
  };
}
