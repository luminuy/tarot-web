import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import d1TagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

/**
 * OpenNext Cloudflare — Edge Caching pipeline
 *
 *  incrementalCache : ISR/SSG cache เก็บใน KV (NEXT_INC_CACHE_KV)
 *                     → หน้า static เสิร์ฟจาก edge ไม่ต้อง boot Next runtime ทุก request
 *  tagCache         : ตาราง revalidations ใน D1 (NEXT_TAG_CACHE_D1)
 *                     → รองรับ revalidateTag() / revalidatePath()
 *  queue: doQueue   : คิว revalidation แบบ async ผ่าน Durable Object (NEXT_CACHE_DO_QUEUE)
 *                     เมื่อหน้า ISR หมดอายุ ผู้ใช้ได้หน้าเก่าทันที ส่วนการ regenerate
 *                     ไปทำใน background (ตัวเลือกที่แนะนำสำหรับ production — ไม่บล็อกคำขอ
 *                     และไม่ชน subrequest limit แบบ queue: "direct")
 *                     DO class `DOQueueHandler` ประกาศใน wrangler.jsonc + worker export ให้เอง
 *  enableCacheInterception:
 *                     เช็ก cache ก่อนเข้า Next router → หน้าที่ cache อยู่แล้วตอบเร็วขึ้นมาก
 *                     (ต้องเป็น false ถ้าเปิดใช้ PPR ซึ่งโปรเจกต์นี้ไม่ได้ใช้)
 *
 * binding ทั้งหมดนิยามใน wrangler.jsonc — ตาราง D1 ถูกสร้างอัตโนมัติตอน `opennextjs-cloudflare deploy`
 * docs: https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  tagCache: d1TagCache,
  queue: doQueue,
  enableCacheInterception: true,
});
