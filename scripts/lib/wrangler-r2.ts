/**
 * อ่านรายการ R2 bucket ที่ Worker ผูกไว้จาก `wrangler.jsonc` — ชื่อ bucket อยู่ที่นั่นที่เดียว ไม่พิมพ์ซ้ำในสคริปต์
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export interface R2Binding {
  binding: string;
  bucket: string;
}

export function r2Bindings(): R2Binding[] {
  const raw = readFileSync(path.resolve(process.cwd(), "wrangler.jsonc"), "utf8");
  const out: R2Binding[] = [];
  for (const m of raw.matchAll(/"binding"\s*:\s*"([A-Z0-9_]+)"\s*,\s*"bucket_name"\s*:\s*"([a-z0-9-]+)"/g)) {
    out.push({ binding: m[1], bucket: m[2] });
  }
  if (out.length === 0) throw new Error("หา r2_buckets ใน wrangler.jsonc ไม่เจอ");
  return out;
}

export function r2BucketName(binding: string): string {
  const hit = r2Bindings().find((b) => b.binding === binding);
  if (!hit) throw new Error(`หา bucket_name ของ ${binding} ใน wrangler.jsonc ไม่เจอ`);
  return hit.bucket;
}
