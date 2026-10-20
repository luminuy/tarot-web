import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * OpenNext Cloudflare — Edge Caching
 *
 * เว็บนี้เป็น SSG ล้วน (ทุกหน้า prerender ตอน build — ไม่มี `export const revalidate`,
 * ไม่มี `revalidateTag()` / `revalidatePath()` / `unstable_cache` ที่ไหนเลย) จึงต้องการแค่:
 *
 *  incrementalCache : เก็บ HTML/RSC ของหน้าที่ prerender ไว้ใน **Workers Static Assets**
 *                     (`.open-next/assets/cdn-cgi/_next_cache/<BUILD_ID>/…` — Worker อ่านได้ผู้เดียว)
 *                     `opennextjs-cloudflare deploy` คัดลอกไฟล์เหล่านี้เข้าชุด assets ให้เอง
 *
 * ⛔ ห้ามกลับไปใช้ `kv-incremental-cache` (บทเรียน INC-0287)
 *    แบบ KV จะ seed หน้าทั้งชุดใต้คีย์ `incremental-cache/<BUILD_ID>/…` ทุกครั้งที่ deploy
 *    (ทั้ง production และ Worker preview) และ **ไม่มีวันลบชุดเก่า** — สะสมจนเกิน 14 GB
 *    เสียค่า KV Storage $0.50/GB-เดือน ทั้งที่ใช้จริงแค่ชุดของ BUILD_ID ปัจจุบันชุดเดียว
 *    Static Assets ผูกกับเวอร์ชันของ Worker เอง ชุดเก่าหายไปกับเวอร์ชันเก่า ไม่มีค่าเก็บ
 *    ข้อแลก: แคชนี้อ่านอย่างเดียว ถ้าวันหน้าเพิ่ม ISR / on-demand revalidation ต้องย้ายไป
 *    R2 incremental cache (ไม่ใช่ KV) พร้อม d1TagCache + doQueue
 *
 *    คีย์เก่าที่ค้างใน KV ถูกลบโดย `scripts/cf-kv-prune-inc-cache.ts` (รันท้าย deploy.yml)
 *    KV `NEXT_INC_CACHE_KV` ยังอยู่ — ใช้เก็บข้อมูลแอป `app:*` (ตัวนับ · ธง · session backstop)
 *
 * docs: https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,

  /**
   * ⛔ ต้องเป็น `false` เสมอ — บทเรียน INC-0106 (ห้ามเปิดกลับโดยไม่อ่านให้จบ)
   *
   * เดิมตั้ง `true` เพื่อให้หน้า SSG ตอบจาก KV ที่ edge โดยไม่ boot Next runtime
   * แต่ Next 16 เปลี่ยนวิธี prefetch มาใช้ **Client Segment Cache**: ลิงก์ที่ prefetch
   * จะยิงถาม "ผังเส้นทาง" ด้วย header `Next-Router-Segment-Prefetch: /_tree`
   *
   * cache interception ตอบจาก KV ตั้งแต่ก่อนถึง Next runtime จึง **ไม่เคยเห็น header นั้น**
   * และคืนเพย์โหลดเต็มหน้าชุดเดิมกลับไปทุกครั้ง (พิสูจน์แล้ว: ยิงมี/ไม่มี header
   * ได้ไฟล์ขนาด 29,432 ไบต์เท่ากันเป๊ะ) ไคลเอนต์หาผังที่ขอไม่เจอ จึงไม่บันทึกลงแคช
   * แล้ววนถามใหม่ทันที **ไม่มีเงื่อนไขหยุด**
   *
   * ผลจริงบน production (วัด 2026-09-08): เปิดหน้าแรกทิ้งไว้ 1 แท็บ = **~180 คำขอ/วินาที**
   * ยิงวนที่ `/` · `/daily` · `/love/1-card` · `/cards/birth-card` ตลอดเวลาที่แท็บเปิดอยู่
   * → 1.11M คำขอ/วัน (99% ของทราฟฟิกทั้งเว็บ · มาจากไทยเกือบทั้งหมด · มีเฉพาะช่วงคนตื่น)
   *
   * ปิด interception = คำขอวิ่งผ่าน Next runtime ซึ่งตอบ segment prefetch ได้ถูกต้อง
   * แลกกับ CPU ต่อคำขอที่สูงขึ้น — คุ้มมาก เพราะตัดคำขอทิ้งไปในระดับร้อยเท่า
   * (incremental cache ยังทำงานเหมือนเดิม หน้ายังไม่ต้องเรนเดอร์ใหม่)
   */
  enableCacheInterception: false,
});
