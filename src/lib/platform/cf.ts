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
 * KV ข้อมูลแอปผูกชื่อ `APP_KV` (namespace เดิมที่เคยชื่อ `NEXT_INC_CACHE_KV`) · คีย์ทุกตัวขึ้นต้น `app:`
 * เปลี่ยนชื่อ 2026-10-24 เพราะชื่อเดิมพาเข้าใจผิดว่าเป็นแคชของ OpenNext — แคชหน้า Next ย้ายไป static assets แล้ว (INC-0287)
 * แต่ข้อมูลแอปยังอยู่ใต้ชื่อแคช คีย์ขยะ 14 GB จึงซ่อนอยู่ในที่ที่ดูเหมือนปกติ
 */

/** ชื่อ binding ของ KV ข้อมูลแอปใน wrangler.jsonc — ด่าน test-prefetch-loop กฎ 1c เทียบสองไฟล์ให้ตรงกัน */
export const APP_KV_BINDING = "APP_KV";

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

/**
 * เข้าถึง binding ของ Cloudflare อย่างปลอดภัย (คืน null เมื่อรันนอก Workers)
 * ⚠️ มีที่เดียวเท่านั้น — เดิมมีสำเนาเหมือนกันทุกตัวอักษรอยู่ใน `db.ts` ด้วย
 * ถ้าวันหนึ่งต้องแก้วิธีเข้าถึง context (เช่นเปลี่ยน API ของ OpenNext) จะต้องไล่แก้สองที่
 * แล้วมีโอกาสแก้ตกหล่นจนฝั่ง D1 กับฝั่ง KV ทำงานคนละแบบ
 */
export async function safelyGetCloudflareContext() {
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
 * KV ที่ getAppKV() ได้มา — binding จริง · ตัวจำลองตอน dev/test · หรือรันบน Cloudflare แต่ไม่เจอ binding
 * กรณีหลังคือตั้งค่าผิด: แอปยังทำงานต่อด้วยตัวจำลองในหน่วยความจำ (ข้อมูลหายทุก isolate) จึงต้องโผล่ในหน้าสุขภาพระบบ
 */
export type AppKVSource = "binding" | "dev-shim" | "missing-binding";
let kvSource: AppKVSource | null = null;

/** แหล่งของ KV ที่ใช้อยู่ (null = ยังไม่เคยเรียก getAppKV) */
export function getAppKVSource(): AppKVSource | null {
  return kvSource;
}

/**
 * คืน KV store สำหรับข้อมูลแอป (config overrides / stat counters / feature flags)
 * เรียกได้จาก route handler หรือ server util — ปลอดภัยทั้ง edge และ dev
 */
export async function getAppKV(): Promise<AppKV> {
  if (cachedKV) return cachedKV;

  let onCloudflare = false;
  try {
    const ctx = await safelyGetCloudflareContext();
    if (ctx) {
      onCloudflare = true;
      const env = ctx.env as Record<string, unknown>;
      const binding = env[APP_KV_BINDING];
      if (binding && typeof (binding as AppKV).get === "function") {
        cachedKV = binding as AppKV;
        kvSource = "binding";
        return cachedKV;
      }
    }
  } catch {
    // ไม่มี Cloudflare context (เช่น `next dev`) — ตกไปใช้ shim
  }

  kvSource = onCloudflare ? "missing-binding" : "dev-shim";
  if (onCloudflare) {
    console.error(`[Platform KV] ไม่พบ binding ${APP_KV_BINDING} — ใช้ KV จำลองในหน่วยความจำแทน (ข้อมูลไม่ถูกเก็บจริง)`);
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

/** ส่วนของ Analytics Engine dataset ที่แอปนี้ใช้จริง (structural) */
export interface AppAnalyticsDataset {
  writeDataPoint(point: { indexes?: string[]; blobs?: string[]; doubles?: number[] }): void;
}

const cachedDatasets = new Map<string, AppAnalyticsDataset | null>();

/** dev / test / ยังไม่ deploy = ไม่มี binding → คืน `null` (ผู้เรียกข้ามการบันทึกเอง) */
async function getAnalyticsDataset(binding: string): Promise<AppAnalyticsDataset | null> {
  const cached = cachedDatasets.get(binding);
  if (cached !== undefined) return cached;
  let dataset: AppAnalyticsDataset | null = null;
  try {
    const ctx = await safelyGetCloudflareContext();
    const value = (ctx?.env as Record<string, unknown> | undefined)?.[binding];
    if (value && typeof (value as AppAnalyticsDataset).writeDataPoint === "function") {
      dataset = value as AppAnalyticsDataset;
    }
  } catch {
    // ไม่มี Cloudflare context
  }
  cachedDatasets.set(binding, dataset);
  return dataset;
}

/** ชุดทดสอบเท่านั้น — ใส่ dataset ในหน่วยความจำแทนของจริง (`undefined` = กลับไปอ่าน binding ใหม่) */
function setDatasetForTests(binding: string, dataset: AppAnalyticsDataset | null | undefined): void {
  if (dataset === undefined) cachedDatasets.delete(binding);
  else cachedDatasets.set(binding, dataset);
}

/** Analytics Engine dataset สถิติวิดีโอคอล (`env.CALL_METRICS`) */
export function getCallMetricsDataset(): Promise<AppAnalyticsDataset | null> {
  return getAnalyticsDataset("CALL_METRICS");
}

/** ชุดทดสอบเท่านั้น — ใส่ dataset ในหน่วยความจำแทนของจริง */
export function setCallMetricsForTests(dataset: AppAnalyticsDataset | null | undefined): void {
  setDatasetForTests("CALL_METRICS", dataset);
}

/** Analytics Engine dataset INP ผู้ใช้จริง (`env.RUM_METRICS` · `src/lib/observability/inp-metrics.ts`) */
export function getRumMetricsDataset(): Promise<AppAnalyticsDataset | null> {
  return getAnalyticsDataset("RUM_METRICS");
}

/** ชุดทดสอบเท่านั้น — ใส่ dataset ในหน่วยความจำแทนของจริง */
export function setRumMetricsForTests(dataset: AppAnalyticsDataset | null | undefined): void {
  setDatasetForTests("RUM_METRICS", dataset);
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

/**
 * R2 bucket ที่ Worker ผูกไว้ (ชื่อ binding ต้องตรง `r2_buckets` ใน wrangler.jsonc)
 * - `SHARE_BUCKET` (`seertarot-share`) — ภาพการ์ดแชร์ · ลบเองทั้ง bucket เมื่อครบ 90 วัน
 * - `STUDIO_BUCKET` (`seertarot-studio`) — โลโก้สตูดิโอแม่หมอ · เก็บถาวร ห้ามมีกฎลบอัตโนมัติ
 * แยก bucket ตามอายุข้อมูล (2026-10-26) — เดิมโลโก้อยู่ bucket การ์ดแชร์ ต้องตั้งกฎลบหลบ prefix 16 ข้อ
 */
type R2BindingName = "SHARE_BUCKET" | "STUDIO_BUCKET";
const cachedBuckets = new Map<R2BindingName, AppR2Bucket | null>();

async function getR2Bucket(name: R2BindingName): Promise<AppR2Bucket | null> {
  const hit = cachedBuckets.get(name);
  if (hit !== undefined) return hit;
  let bucket: AppR2Bucket | null = null;
  try {
    const ctx = await safelyGetCloudflareContext();
    const binding = (ctx?.env as Record<string, unknown> | undefined)?.[name];
    if (binding && typeof (binding as AppR2Bucket).put === "function") bucket = binding as AppR2Bucket;
  } catch {
    // ไม่มี Cloudflare context
  }
  cachedBuckets.set(name, bucket);
  return bucket;
}

function setBucketForTests(name: R2BindingName, bucket: AppR2Bucket | null | undefined): void {
  if (bucket === undefined) cachedBuckets.delete(name);
  else cachedBuckets.set(name, bucket);
}

/**
 * คืน R2 bucket สำหรับภาพการ์ดแชร์ (`env.SHARE_BUCKET`)
 * dev / test / ยังไม่ deploy = ไม่มี binding → คืน `null` (ผู้เรียกต้อง degrade เอง)
 */
export function getShareBucket(): Promise<AppR2Bucket | null> {
  return getR2Bucket("SHARE_BUCKET");
}

/** คืน R2 bucket สำหรับโลโก้สตูดิโอแม่หมอ (`env.STUDIO_BUCKET`) · ไม่มี binding → `null` เหมือนกัน */
export function getStudioBucket(): Promise<AppR2Bucket | null> {
  return getR2Bucket("STUDIO_BUCKET");
}

/** ชุดทดสอบเท่านั้น — ใส่ bucket ในหน่วยความจำแทน R2 (`undefined` = กลับไปหา binding จริงรอบถัดไป) */
export function setShareBucketForTests(bucket: AppR2Bucket | null | undefined): void {
  setBucketForTests("SHARE_BUCKET", bucket);
}

/** ชุดทดสอบเท่านั้น — เหมือน `setShareBucketForTests` แต่เป็น bucket โลโก้แม่หมอ */
export function setStudioBucketForTests(bucket: AppR2Bucket | null | undefined): void {
  setBucketForTests("STUDIO_BUCKET", bucket);
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
