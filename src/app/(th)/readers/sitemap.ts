import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/config/site";
import { listPublicApprovedReaders } from "@/lib/marketplace/readers.repo";

/**
 * 🗺️ sitemap ของโปรไฟล์แม่หมอ — เสิร์ฟที่ `/readers/sitemap.xml` (A7-04)
 * ---------------------------------------------------------------------------
 * โปรไฟล์ `/readers/<id>` เป็น `index, follow` + canonical ของตัวเอง แต่ sitemap หลัก (`src/app/sitemap.ts`)
 * สร้างจากข้อมูลคงที่ตอน build จึงไม่รู้จักแม่หมอใน D1 — แยกเป็นไฟล์นี้ที่อ่านฐานข้อมูลสดทุกครั้ง
 * และประกาศไว้ใน `robots.ts` (บรรทัด `sitemap`) · `/readers/*` อยู่ใน run_worker_first แล้ว
 *
 * ⚠️ ไม่ย้ายไปรวมใน sitemap หลัก: ด่าน test-en-routing / test-rendered-coverage เรียก `sitemap()` แบบ sync
 *    และเทียบกับหน้าที่เรนเดอร์ใน `dist/` — โปรไฟล์จาก D1 ไม่มีไฟล์ HTML ให้เทียบ
 */
export const dynamic = "force-dynamic";

/** เพดานจำนวน URL ต่อไฟล์ (มาตรฐาน sitemap รับได้ 50,000 — ตั้งต่ำไว้กันคำค้นฐานข้อมูลหนัก) */
const MAX_READERS = 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const readers = await listPublicApprovedReaders();
    return readers.slice(0, MAX_READERS).map((reader) => ({
      url: `${SITE_ORIGIN}/readers/${encodeURIComponent(reader.id)}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (err) {
    // ฐานข้อมูลล่มชั่วคราว = sitemap ว่าง ดีกว่าตอบ 500 ให้ Google จำว่าไฟล์นี้เสีย
    console.error("[sitemap/readers] อ่านรายชื่อแม่หมอไม่สำเร็จ", err);
    return [];
  }
}
