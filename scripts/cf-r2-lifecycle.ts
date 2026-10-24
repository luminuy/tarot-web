#!/usr/bin/env tsx
/**
 * 🧹 กฎลบการ์ดแชร์อัตโนมัติใน R2 (`SHARE_BUCKET`) เมื่อครบ 90 วัน — รันท้าย deploy.yml ทุกรอบ
 * ===========================================================================
 *
 * ## ทำไม
 *
 * ภาพการ์ดแชร์ + ข้อมูลหัวเรื่อง (`<id>.png` · `<id>.json` · src/app/api/share/image/route.ts) ตั้งใจให้หมดอายุ
 * 90 วันตาม PDPA (คอมเมนต์ใน wrangler.jsonc · คู่มือ deploy) แต่กฎนี้ไม่เคยถูกตั้งจริง — ค้างใน PENDING_SETUP
 * เป็นงานมือของเจ้าของมาตั้งแต่ 2026-09 · สคริปต์นี้ตั้งให้และยืนยันซ้ำทุก deploy (รันซ้ำได้ ไม่สร้างกฎซ้อน)
 *
 * ## ⚠️ ห้ามตั้งกฎทั้ง bucket
 *
 * bucket เดียวกันเก็บโลโก้สตูดิโอแม่หมอใต้ `studio-logo/` ซึ่งต้องอยู่ถาวร — คำสั่งเก่าใน PENDING_SETUP
 * (`--prefix ""`) จะลบโลโก้ทุกอันใน 90 วัน และ R2 กรองได้แค่ prefix (ไม่มีเงื่อนไขยกเว้น)
 * id ของการ์ดแชร์เป็น UUID ตัดขีด = เลขฐานสิบหก 32 ตัว จึงตั้งกฎ 16 ข้อ ข้อละหนึ่งตัวอักษรขึ้นต้น 0-9 a-f
 * ครอบการ์ดแชร์ทุกใบ (ทั้งของเก่าและใหม่) และไม่โดน `studio-logo/` ที่ขึ้นต้นด้วย `s`
 * ถ้าวันหนึ่งเปลี่ยนรูปแบบ id หรือเพิ่มไฟล์ชนิดอื่นที่รากของ bucket ต้องแก้สคริปต์นี้ด้วย
 *
 * กฎ `auto-delete-90d` ที่เคยตั้งด้วยมือใน dashboard (บันทึกใน CLOUDFLARE_FREE_STACK · ลบทั้ง bucket ใน 90 วัน)
 * ถูกแทนด้วยกฎชุดนี้ในการเขียนเดียวกัน — เจตนาเดิม (การ์ดแชร์หมดอายุ 90 วัน) ยังอยู่ครบ แค่ไม่ครอบโลโก้แม่หมอ
 * ถ้าเจอกฎลบ "ชื่ออื่น" ที่ครอบ `studio-logo/` สคริปต์จะล้มพร้อมบอกชื่อกฎ ไม่เขียนอะไร (ไม่เดาลบกฎที่ไม่รู้จัก)
 *
 * ## วิธีใช้
 *
 *   npm run cf:r2-lifecycle   # ต้องมี CLOUDFLARE_API_TOKEN (Workers R2 Storage · Edit) + CLOUDFLARE_ACCOUNT_ID
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { ensureR2ExpireRules } from "./lib/cloudflare-r2";

/** อายุการ์ดแชร์ก่อนถูกลบ (วัน) */
const SHARE_RETENTION_DAYS = 90;
/** ตัวอักษรขึ้นต้นที่เป็นไปได้ของ id การ์ดแชร์ (`crypto.randomUUID()` ตัดขีด) */
const SHARE_ID_FIRST_CHARS = "0123456789abcdef";
/** key ที่ต้องอยู่ถาวรในบัคเก็ตเดียวกัน — ห้ามมีกฎลบข้อไหนครอบ */
const MUST_KEEP = ["studio-logo/"];
/** กฎเก่าแบบทั้ง bucket ที่เคยตั้งด้วยมือ (CLOUDFLARE_FREE_STACK) — ถอดแล้วใช้กฎราย prefix แทน */
const SUPERSEDED_RULE_IDS = ["auto-delete-90d"];

/** ชื่อ bucket อ่านจาก binding `SHARE_BUCKET` ใน wrangler.jsonc — ไม่พิมพ์ซ้ำไว้สองที่ */
function readShareBucketName(): string {
  const raw = readFileSync(path.resolve(process.cwd(), "wrangler.jsonc"), "utf8");
  const m = raw.match(/"binding"\s*:\s*"SHARE_BUCKET"\s*,\s*"bucket_name"\s*:\s*"([a-z0-9-]+)"/);
  if (!m) throw new Error("หา bucket_name ของ SHARE_BUCKET ใน wrangler.jsonc ไม่เจอ");
  return m[1];
}

async function main(): Promise<void> {
  const bucket = readShareBucketName();
  const rules = [...SHARE_ID_FIRST_CHARS].map((c) => ({
    id: `expire-share-${c}`,
    prefix: c,
    days: SHARE_RETENTION_DAYS,
  }));
  const res = await ensureR2ExpireRules(bucket, rules, { mustKeep: MUST_KEEP, supersedes: SUPERSEDED_RULE_IDS });
  if (res.removed.length > 0) console.log(`🔁 ถอดกฎเก่าแบบทั้ง bucket แล้ว: ${res.removed.join(", ")} (เคยครอบโลโก้แม่หมอด้วย)`);
  console.log(
    `✅ ${bucket}: กฎลบการ์ดแชร์อายุเกิน ${SHARE_RETENTION_DAYS} วัน ${rules.length} ข้อ` +
      ` (ใหม่ ${res.created.length} · แก้ ${res.updated.length} · ตรงอยู่แล้ว ${res.unchanged.length})` +
      ` · ไม่ครอบ ${MUST_KEEP.join(", ")}`,
  );
}

main().catch((err) => {
  console.error(`❌ ตั้งกฎลบการ์ดแชร์ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
