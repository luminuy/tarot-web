#!/usr/bin/env tsx
/**
 * 🧹 ลบแคชหน้า Next รุ่นเก่าที่ค้างอยู่ใน KV (`incremental-cache/…`)
 * ===========================================================================
 *
 * ## ปัญหาที่สคริปต์นี้แก้ (KV Storage บวมเกิน 14 GB · 2026-10-19)
 *
 * เดิม `open-next.config.ts` ใช้ `kv-incremental-cache` ซึ่งทุกครั้งที่ deploy
 * (production + Worker preview) จะ seed หน้าที่ prerender ทั้งชุดลง KV ใต้คีย์
 * `incremental-cache/<BUILD_ID>/<hash>.cache` แต่ **ไม่เคยลบชุดของ BUILD_ID เก่า**
 * ทุก deploy จึงทิ้งขยะไว้หนึ่งชุด สะสมจนบิล KV Storage ขึ้นเป็นรายวัน
 *
 * ตอนนี้แคชย้ายไปอยู่ Workers Static Assets แล้ว ไม่มีโค้ดไหนอ่านคีย์ `incremental-cache/`
 * อีกเลย สคริปต์นี้จึงลบทิ้ง **ทั้ง prefix** — รอบแรกลบของสะสมทั้งหมด
 * รอบต่อ ๆ ไปเหลือแค่ list 1 ครั้งที่ว่างเปล่า (กันใครเผลอเปิด KV cache กลับมา)
 *
 * ⚠️ ไม่แตะคีย์ข้อมูลแอป `app:*` เด็ดขาด — ลบเฉพาะคีย์ที่ขึ้นต้นด้วย prefix ของ OpenNext
 *
 * ## วิธีใช้
 *
 *   npm run cf:kv-prune -- --dry-run   # นับอย่างเดียว ไม่ลบ
 *   npm run cf:kv-prune                # ลบจริง
 *
 * ต้องมี env: CLOUDFLARE_API_TOKEN (สิทธิ์ Workers KV Storage · Edit — ชุดเดียวกับที่ deploy ใช้อยู่)
 *             CLOUDFLARE_ACCOUNT_ID
 * namespace id อ่านจาก `wrangler.jsonc` (binding `NEXT_INC_CACHE_KV`) หรือ override ด้วย CF_KV_NAMESPACE_ID
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const API_BASE = "https://api.cloudflare.com/client/v4";
/** prefix ค่าเริ่มต้นของ OpenNext (`DEFAULT_PREFIX` ใน overrides/internal) — โปรเจกต์นี้ไม่เคยตั้ง NEXT_INC_CACHE_KV_PREFIX */
const PREFIX = "incremental-cache/";
const BINDING = "NEXT_INC_CACHE_KV";
/** เพดาน bulk delete ของ Cloudflare ต่อคำขอ */
const DELETE_BATCH = 10_000;

const DRY_RUN = process.argv.includes("--dry-run");
const TOKEN = process.env.CLOUDFLARE_API_TOKEN?.trim();
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

interface CfResponse<T> {
  success: boolean;
  result: T;
  errors?: Array<{ code: number; message: string }>;
  result_info?: { cursor?: string; count?: number };
}

function readNamespaceId(): string {
  const fromEnv = process.env.CF_KV_NAMESPACE_ID?.trim();
  if (fromEnv) return fromEnv;
  const raw = readFileSync(path.resolve(process.cwd(), "wrangler.jsonc"), "utf8");
  const m = raw.match(new RegExp(`"binding"\\s*:\\s*"${BINDING}"\\s*,\\s*"id"\\s*:\\s*"([0-9a-f]{32})"`));
  if (!m) throw new Error(`หา id ของ ${BINDING} ใน wrangler.jsonc ไม่เจอ — ตั้ง CF_KV_NAMESPACE_ID แทน`);
  return m[1];
}

async function cf<T>(url: string, init?: RequestInit): Promise<CfResponse<T>> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json().catch(() => null)) as CfResponse<T> | null;
  if (!res.ok || !body?.success) {
    const msg = body?.errors?.map((e) => `${e.code} ${e.message}`).join(" · ") || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

async function main(): Promise<void> {
  if (!TOKEN || !ACCOUNT_ID) {
    console.error("❌ ต้องตั้ง CLOUDFLARE_API_TOKEN และ CLOUDFLARE_ACCOUNT_ID");
    process.exit(1);
  }
  const ns = readNamespaceId();
  const base = `${API_BASE}/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${ns}`;

  // list ให้ครบก่อนค่อยลบ — ลบไปพร้อม list ด้วย cursor เดิมเสี่ยงข้ามคีย์
  const keys: string[] = [];
  const builds = new Map<string, number>();
  let cursor: string | undefined;
  do {
    const qs = new URLSearchParams({ prefix: PREFIX, limit: "1000" });
    if (cursor) qs.set("cursor", cursor);
    const page = await cf<Array<{ name: string }>>(`${base}/keys?${qs}`);
    for (const { name } of page.result) {
      if (!name.startsWith(PREFIX)) continue; // กันพลาด — ไม่มีวันลบนอก prefix
      keys.push(name);
      const buildId = name.slice(PREFIX.length).split("/")[0] || "(ไม่มี)";
      builds.set(buildId, (builds.get(buildId) ?? 0) + 1);
    }
    cursor = page.result_info?.cursor || undefined;
  } while (cursor);

  console.log(`🔎 พบคีย์แคชหน้า Next เก่าใน KV ${keys.length.toLocaleString()} คีย์ จาก ${builds.size} build`);
  if (keys.length === 0) {
    console.log("✅ ไม่มีอะไรต้องลบ");
    return;
  }
  if (DRY_RUN) {
    console.log("ℹ️  --dry-run: ไม่ได้ลบจริง");
    return;
  }

  let deleted = 0;
  for (let i = 0; i < keys.length; i += DELETE_BATCH) {
    const batch = keys.slice(i, i + DELETE_BATCH);
    await cf<unknown>(`${base}/bulk/delete`, { method: "POST", body: JSON.stringify(batch) });
    deleted += batch.length;
    console.log(`🧹 ลบแล้ว ${deleted.toLocaleString()}/${keys.length.toLocaleString()}`);
  }
  console.log("✅ ล้างแคชหน้า Next เก่าใน KV ครบแล้ว (คีย์ app:* ไม่ถูกแตะ)");
}

main().catch((err) => {
  console.error(`❌ ล้าง KV ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
