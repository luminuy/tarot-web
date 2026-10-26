#!/usr/bin/env tsx
/**
 * 🪣 เตรียม R2 bucket ทุกตัวที่ Worker ผูกไว้ให้มีอยู่จริงก่อน deploy — รันใน deploy.yml / preview.yml ก่อน `wrangler deploy`
 * ===========================================================================
 *
 * `wrangler deploy` ตรวจว่า bucket ใน `r2_buckets` มีอยู่จริง ไม่มี = deploy ล้มทั้งรอบ
 * เพิ่ม bucket ใหม่ใน wrangler.jsonc แล้วไม่ต้องไปกดสร้างใน dashboard เอง (เคยค้างเป็นงานมือ)
 *
 * bucket ที่ต้องเป็นส่วนตัว (`PRIVATE_BINDINGS`) — เปิดลิงก์ r2.dev หรือผูกโดเมนอยู่ = ล้ม ไม่ deploy ต่อ
 * (ไฟล์ในนั้นเสิร์ฟผ่าน Worker ที่ตรวจ path เท่านั้น เปิดตรง = อ่าน key อะไรก็ได้)
 *
 *   npm run cf:r2-buckets   # ต้องมี CLOUDFLARE_API_TOKEN (Workers R2 Storage · Edit) + CLOUDFLARE_ACCOUNT_ID
 */
import { assertR2BucketPrivate, ensureR2Bucket } from "./lib/cloudflare-r2";
import { r2Bindings } from "./lib/wrangler-r2";

/** binding ที่ต้องไม่มีทางเข้าสาธารณะ — โลโก้แม่หมอเสิร์ฟผ่าน `/api/studio/logo/*` เท่านั้น */
const PRIVATE_BINDINGS = new Set(["STUDIO_BUCKET"]);

async function main(): Promise<void> {
  for (const { binding, bucket } of r2Bindings()) {
    const created = await ensureR2Bucket(bucket);
    if (PRIVATE_BINDINGS.has(binding)) await assertR2BucketPrivate(bucket);
    console.log(
      `${created ? "🆕 สร้าง" : "✅ มีอยู่แล้ว"} ${bucket} (${binding})${PRIVATE_BINDINGS.has(binding) ? " · ส่วนตัว" : ""}`,
    );
  }
}

main().catch((err) => {
  console.error(`❌ เตรียม R2 bucket ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
