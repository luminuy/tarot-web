#!/usr/bin/env tsx
/**
 * 🧹 กฎลบอัตโนมัติของ R2 — รันท้าย deploy.yml ทุกรอบ (รันซ้ำได้ ไม่สร้างกฎซ้อน)
 * ===========================================================================
 *
 * ## ทำอะไร
 *
 * 1. `SHARE_BUCKET` (ภาพการ์ดแชร์ `<id>.png` · `<id>.json` · src/app/api/share/image/route.ts)
 *    ลบเองทั้ง bucket เมื่อครบ 90 วันตาม PDPA — กฎเดียว `expire-share-90d`
 * 2. `STUDIO_BUCKET` (โลโก้สตูดิโอแม่หมอ `studio-logo/`) ต้องเก็บถาวร — ยืนยันว่าไม่มีกฎลบข้อไหนครอบ
 *    (รวมกฎที่คนตั้งด้วยมือใน dashboard) เจอ = ล้มพร้อมบอกชื่อกฎ ไม่เขียนอะไร
 *
 * ## ประวัติ
 *
 * - ก่อน 2026-10-24: กฎค้างเป็นงานมือใน PENDING_SETUP · มีกฎ `auto-delete-90d` ที่ตั้งด้วยมือแบบทั้ง bucket
 * - 2026-10-24: โลโก้แม่หมออยู่ bucket เดียวกับการ์ดแชร์ ➔ ต้องตั้ง 16 กฎราย prefix (0-9 a-f) หลบ `studio-logo/`
 * - 2026-10-26: แยกโลโก้ไป bucket `seertarot-studio` ➔ bucket การ์ดแชร์กลับมาเป็นกฎเดียวทั้ง bucket
 *   กฎ 16 ข้อเดิมและ `auto-delete-90d` ถูกแทนในการเขียนเดียวกัน
 *   ตรวจก่อนสลับ: production ตอบ `studio_disabled` (สตูดิโอยังไม่เคยเปิด) จึงไม่มีโลโก้ค้างใน bucket การ์ดแชร์
 *
 * ⚠️ ห้ามเก็บของถาวรใด ๆ ใน `SHARE_BUCKET` อีก — ของใหม่ที่ต้องอยู่ถาวรให้ไปอยู่ bucket ของตัวเอง
 *
 * ## วิธีใช้
 *
 *   npm run cf:r2-lifecycle   # ต้องมี CLOUDFLARE_API_TOKEN (Workers R2 Storage · Edit) + CLOUDFLARE_ACCOUNT_ID
 */
import { ensureR2ExpireRules } from "./lib/cloudflare-r2";
import { r2BucketName } from "./lib/wrangler-r2";

/** อายุการ์ดแชร์ก่อนถูกลบ (วัน) */
const SHARE_RETENTION_DAYS = 90;
/** กฎเก่าที่กฎทั้ง bucket มาแทน: กฎมือ `auto-delete-90d` + กฎราย prefix 16 ข้อของรุ่น 2026-10-24 */
const SUPERSEDED_RULE_IDS = ["auto-delete-90d", ...[..."0123456789abcdef"].map((c) => `expire-share-${c}`)];
/** key ใน bucket โลโก้ที่ต้องไม่มีกฎลบข้อไหนครอบ */
const STUDIO_MUST_KEEP = ["studio-logo/"];

async function main(): Promise<void> {
  const share = r2BucketName("SHARE_BUCKET");
  const res = await ensureR2ExpireRules(share, [{ id: "expire-share-90d", prefix: "", days: SHARE_RETENTION_DAYS }], {
    supersedes: SUPERSEDED_RULE_IDS,
  });
  if (res.removed.length > 0) console.log(`🔁 ถอดกฎเก่าแล้ว: ${res.removed.join(", ")}`);
  console.log(
    `✅ ${share}: ลบการ์ดแชร์อายุเกิน ${SHARE_RETENTION_DAYS} วันทั้ง bucket` +
      ` (${res.created.length ? "ตั้งใหม่" : res.updated.length ? "แก้แล้ว" : "ตรงอยู่แล้ว"})`,
  );

  const studio = r2BucketName("STUDIO_BUCKET");
  await ensureR2ExpireRules(studio, [], { mustKeep: STUDIO_MUST_KEEP });
  console.log(`✅ ${studio}: ไม่มีกฎลบครอบ ${STUDIO_MUST_KEEP.join(", ")} (โลโก้แม่หมออยู่ถาวร)`);
}

main().catch((err) => {
  console.error(`❌ ตั้งกฎลบอัตโนมัติของ R2 ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
