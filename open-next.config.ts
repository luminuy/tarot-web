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
   * (KV incremental cache ยังทำงานเหมือนเดิม หน้ายังไม่ต้องเรนเดอร์ใหม่)
   */
  enableCacheInterception: false,
});
