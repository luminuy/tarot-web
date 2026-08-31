import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

/**
 * OpenNext Cloudflare — Edge Caching
 *
 * เว็บนี้เป็น SSG ล้วน (ทุกหน้า prerender ตอน build — ไม่มี `export const revalidate`,
 * ไม่มี `revalidateTag()` / `revalidatePath()` ที่ไหนเลย) จึงต้องการแค่:
 *
 *  incrementalCache : เก็บ HTML/RSC ของหน้าที่ prerender ไว้ใน KV (NEXT_INC_CACHE_KV)
 *                     `opennextjs-cloudflare deploy` จะ seed หน้าเหล่านี้ลง KV ตอน deploy
 *  enableCacheInterception:
 *                     เช็ก KV ก่อนเข้า Next router → หน้า SSG ตอบจาก edge ได้เลย
 *                     ไม่ต้อง boot Next runtime (ยืนยัน header `x-opennext-cache: HIT`)
 *                     ต้องเป็น false ถ้าเปิด PPR — โปรเจกต์นี้ไม่ได้ใช้
 *
 * ❌ ไม่ใช้ tagCache (D1) / queue (Durable Object) เพราะไม่มี revalidation ให้ทำ
 *    ถ้าวันหน้าเพิ่ม ISR หรือ on-demand revalidation ค่อยเติม d1TagCache + doQueue
 *    พร้อม binding ใน wrangler.jsonc (ดู git history commit #19)
 *
 * docs: https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  enableCacheInterception: true,
});
