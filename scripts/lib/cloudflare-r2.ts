/**
 * ตัวช่วยเรียก Cloudflare API ฝั่ง R2 สำหรับสคริปต์ใน CI (สำรอง D1 · เตรียม bucket ก่อน deploy · กฎลบอัตโนมัติ)
 * ===========================================================================
 *
 * ใช้ `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` ชุดเดียวกับที่ deploy ใช้
 * token ต้องมีสิทธิ์ `Account · Workers R2 Storage · Edit` (เติมแล้ว 2026-09-03 · INC-0066)
 *
 * กฎลบอัตโนมัติ (lifecycle) ของ R2 เป็นก้อนเดียวทั้ง bucket — PUT ทับทุกกฎ
 * จึงต้องอ่านของเดิมก่อน แล้วแทนเฉพาะกฎที่มี id ตรงกับของเรา กฎอื่น (เช่นกฎล้าง multipart
 * ค้างที่ Cloudflare ใส่ให้ทุก bucket ใหม่) ต้องอยู่ครบ
 */

const API_BASE = "https://api.cloudflare.com/client/v4";

interface CfEnvelope<T> {
  success: boolean;
  result: T;
  errors?: Array<{ code: number; message: string }>;
}

export class CloudflareApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function cloudflareCredentials(): { token: string; accountId: string } {
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!token || !accountId) {
    throw new Error("ต้องตั้ง CLOUDFLARE_API_TOKEN และ CLOUDFLARE_ACCOUNT_ID");
  }
  return { token, accountId };
}

async function cf<T>(pathname: string, init?: RequestInit): Promise<T> {
  const { token, accountId } = cloudflareCredentials();
  const res = await fetch(`${API_BASE}/accounts/${accountId}${pathname}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json().catch(() => null)) as CfEnvelope<T> | null;
  if (!res.ok || !body?.success) {
    const msg = body?.errors?.map((e) => `${e.code} ${e.message}`).join(" · ") || `HTTP ${res.status}`;
    throw new CloudflareApiError(`${init?.method ?? "GET"} ${pathname}: ${msg}`, res.status);
  }
  return body.result;
}

/** สร้าง bucket ถ้ายังไม่มี · คืน true เมื่อสร้างใหม่ */
export async function ensureR2Bucket(bucket: string): Promise<boolean> {
  try {
    await cf(`/r2/buckets/${bucket}`);
    return false;
  } catch (err) {
    if (!(err instanceof CloudflareApiError) || err.status !== 404) throw err;
  }
  await cf(`/r2/buckets`, { method: "POST", body: JSON.stringify({ name: bucket }) });
  return true;
}

/**
 * ยืนยันว่า bucket ไม่มีทางเข้าสาธารณะ (ลิงก์ r2.dev ปิด และไม่มีโดเมนของเราผูกอยู่)
 * ใช้กับ bucket ที่ต้องเป็นส่วนตัว (ไฟล์สำรองฐานข้อมูล · โลโก้แม่หมอที่เสิร์ฟผ่าน Worker) — เปิดอยู่ = โยน error ห้ามทำต่อ
 */
export async function assertR2BucketPrivate(bucket: string): Promise<void> {
  const managed = await cf<{ enabled: boolean; domain?: string }>(`/r2/buckets/${bucket}/domains/managed`);
  if (managed.enabled) {
    throw new Error(`bucket ${bucket} เปิดลิงก์สาธารณะ r2.dev (${managed.domain ?? "?"}) อยู่ — bucket นี้ต้องเป็นส่วนตัว ปิดที่ R2 › ${bucket} › Settings ก่อน`);
  }
  const custom = await cf<{ domains?: Array<{ domain: string }> }>(`/r2/buckets/${bucket}/domains/custom`);
  if ((custom.domains ?? []).length > 0) {
    const names = (custom.domains ?? []).map((d) => d.domain).join(", ");
    throw new Error(`bucket ${bucket} ผูกโดเมนสาธารณะอยู่ (${names}) — bucket นี้ต้องเป็นส่วนตัว ถอดที่ R2 › ${bucket} › Settings ก่อน`);
  }
}

interface LifecycleRule {
  id: string;
  enabled: boolean;
  conditions: { prefix?: string };
  deleteObjectsTransition?: { condition: { type: "Age"; maxAge: number } | { type: "Date"; date: string } };
  [key: string]: unknown;
}

/** bucket ที่ยังไม่เคยตั้งกฎอาจตอบ 404 แทนรายการว่าง — นับเป็นไม่มีกฎ */
async function readLifecycleRules(bucket: string): Promise<LifecycleRule[]> {
  try {
    const res = await cf<{ rules?: LifecycleRule[] }>(`/r2/buckets/${bucket}/lifecycle`);
    return res.rules ?? [];
  } catch (err) {
    if (err instanceof CloudflareApiError && err.status === 404) return [];
    throw err;
  }
}

export interface ExpireRule {
  /** id ของกฎ — ใช้หากฎเดิมของเราเวลาอัปเดต */
  id: string;
  /** "" = ทั้ง bucket */
  prefix: string;
  days: number;
}

export interface ExpireRulesResult {
  created: string[];
  updated: string[];
  unchanged: string[];
  /** กฎเก่าที่ถูกแทนด้วยกฎชุดนี้ (ตาม `supersedes`) */
  removed: string[];
}

/**
 * ตั้งกฎ "ลบไฟล์เมื่ออายุครบ N วัน" ทุกข้อให้ตรงตามที่ขอ ในการเขียนครั้งเดียว (รันซ้ำได้ ไม่สร้างกฎซ้อน)
 * - กฎอื่นที่ id ไม่ใช่ของเราอยู่ครบ · อ่านกลับหลังเขียนเพื่อยืนยันว่ากฎอยู่จริงและกฎเดิมไม่หาย
 * - `mustKeep` = key ที่ต้องไม่มีกฎลบข้อไหนครอบเลย (รวมกฎที่คนตั้งด้วยมือ) — เจอ = โยน error ไม่เขียนอะไร
 * - `supersedes` = id ของกฎเก่าที่กฎชุดนี้มาแทน (เช่นกฎที่เคยตั้งด้วยมือแบบทั้ง bucket) — ถูกถอดในการเขียนเดียวกัน
 */
export async function ensureR2ExpireRules(
  bucket: string,
  wants: ExpireRule[],
  options: { mustKeep?: string[]; supersedes?: string[] } = {},
): Promise<ExpireRulesResult> {
  const rules = await readLifecycleRules(bucket);
  const matches = (r: LifecycleRule | undefined, want: ExpireRule): boolean =>
    !!r &&
    r.enabled &&
    (r.conditions?.prefix ?? "") === want.prefix &&
    r.deleteObjectsTransition?.condition.type === "Age" &&
    r.deleteObjectsTransition.condition.maxAge === want.days * 86_400;

  const result: ExpireRulesResult = { created: [], updated: [], unchanged: [], removed: [] };
  const ours = new Set(wants.map((w) => w.id));
  const superseded = new Set(options.supersedes ?? []);
  result.removed = rules.filter((r) => superseded.has(r.id) && !ours.has(r.id)).map((r) => r.id);
  const others = rules.filter((r) => !ours.has(r.id) && !superseded.has(r.id));

  for (const key of options.mustKeep ?? []) {
    const hits = [...others, ...wants.map((w) => ({ id: w.id, enabled: true, conditions: { prefix: w.prefix }, deleteObjectsTransition: {} }))]
      .filter((r) => r.enabled && r.deleteObjectsTransition && key.startsWith(r.conditions?.prefix ?? ""));
    if (hits.length > 0) {
      throw new Error(
        `กฎลบอัตโนมัติของ ${bucket} ครอบ "${key}" ซึ่งต้องเก็บถาวร: ${hits.map((r) => `${r.id} (prefix "${r.conditions?.prefix ?? ""}")`).join(", ")}` +
          ` — ลบกฎนั้นที่ R2 › ${bucket} › Settings › Object lifecycle rules`,
      );
    }
  }

  for (const want of wants) {
    const mine = rules.find((r) => r.id === want.id);
    if (matches(mine, want)) result.unchanged.push(want.id);
    else (mine ? result.updated : result.created).push(want.id);
  }
  if (result.created.length === 0 && result.updated.length === 0 && result.removed.length === 0) return result;

  const next: LifecycleRule[] = wants.map((want) => ({
    id: want.id,
    enabled: true,
    conditions: want.prefix ? { prefix: want.prefix } : {},
    deleteObjectsTransition: { condition: { type: "Age", maxAge: want.days * 86_400 } },
  }));
  await cf(`/r2/buckets/${bucket}/lifecycle`, { method: "PUT", body: JSON.stringify({ rules: [...others, ...next] }) });

  const after = await readLifecycleRules(bucket);
  const missing = wants.filter((w) => !matches(after.find((r) => r.id === w.id), w));
  if (missing.length > 0) {
    throw new Error(
      `เขียนกฎลง ${bucket} แล้วอ่านกลับไม่เจอ: ${missing.map((w) => w.id).join(", ")} — ตรวจที่ R2 › ${bucket} › Settings › Object lifecycle rules`,
    );
  }
  const lost = others.filter((o) => !after.some((r) => r.id === o.id));
  if (lost.length > 0) {
    throw new Error(`กฎเดิมของ ${bucket} หายหลังเขียน: ${lost.map((r) => r.id).join(", ")}`);
  }
  return result;
}
