/**
 * 🗺️ แหล่งความจริงเดียวของ "หน้าที่เรนเดอร์ออกมาจริง" สำหรับด่านตรวจทุกด่าน
 * ===========================================================================
 *
 * ปัญหาที่แก้
 * ----------
 * ด่านตรวจ 6 ด่าน (`test-en-routing` · `test-og-images` · `test-a11y-critical` ·
 * `test-meta-length` · `test-sticky-header` · `test-bundle-budget`) ต่างคนต่าง
 * เขียน path `.next/server/app` ฝังไว้ในไฟล์ตัวเอง
 *
 * ผลคือ **ด่านทั้งหมดผูกกับ Next.js โดยไม่มีใครตั้งใจ** — ถ้าวันหนึ่งย้ายหน้าเนื้อหา
 * บางกลุ่มไปเรนเดอร์ด้วยเครื่องมืออื่น (เช่น Astro สำหรับ 290 หน้าที่ไม่ต้องใช้ JS)
 * ด่านเหล่านี้จะ **ยังผ่านเขียวอยู่โดยไม่ได้ตรวจหน้าที่ย้ายไปเลยสักหน้า**
 * เพราะมันมองเห็นแค่โฟลเดอร์ของ Next
 *
 * นั่นคือความล้มเหลวที่เงียบที่สุดแบบหนึ่ง: hreflang ยังชี้ครบในสายตาด่าน
 * แต่หน้าปลายทางจริงอาจหายไปแล้ว
 *
 * วิธีแก้
 * ------
 * ประกาศรายการ "รากของผลลัพธ์การเรนเดอร์" ไว้ที่ `OUTPUT_ROOTS` ที่เดียว
 * ด่านทุกด่านเรียก `collectRenderedPages()` แทนการเดา path เอง
 * วันที่เพิ่มเครื่องมือเรนเดอร์ตัวที่สอง **แก้ที่นี่บรรทัดเดียว ด่านทั้ง 6 ครอบคลุมทันที**
 *
 * ⚠️ ห้ามเขียน `.next/server/app` ลงในไฟล์ด่านใด ๆ อีก — ด่าน
 *    `test-rendered-coverage.ts` ตรวจข้อนี้ให้อัตโนมัติแล้ว
 */

import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "../../..");

/**
 * รากของผลลัพธ์การเรนเดอร์ทั้งหมดที่ประกอบกันเป็นเว็บจริงหนึ่งเว็บ
 *
 * `urlPrefix` มีไว้เผื่อเครื่องมือที่เขียนไฟล์ลงโฟลเดอร์ย่อย — ปกติเป็น "" (ราก)
 *
 * 📌 เพิ่มเครื่องมือใหม่: ใส่ระเบียนใหม่ที่นี่ที่เดียว แล้ว **ห้ามลืมใส่ `optional: true`**
 *    ถ้ามันยังไม่ได้ถูกบิลด์เสมอ ไม่งั้นด่านจะตกบนเครื่องที่ยังไม่ได้รันบิลด์ตัวนั้น
 */
export const OUTPUT_ROOTS: Array<{
  name: string;
  dir: string;
  urlPrefix?: string;
  optional?: boolean;
}> = [
  { name: "next", dir: ".next/server/app" },
  // ตัวอย่างสำหรับอนาคต — ปลดคอมเมนต์เมื่อมีจริง:
  // { name: "astro", dir: "dist", optional: true },
];

export interface RenderedPage {
  /** เส้นทางแบบที่ผู้ใช้เห็น เช่น `/cards/major-06` · หน้าแรกคือ `/` */
  route: string;
  /** path เต็มของไฟล์ HTML บนดิสก์ */
  file: string;
  /** ชื่อเครื่องมือที่เรนเดอร์หน้านี้ (`OUTPUT_ROOTS[].name`) */
  renderer: string;
}

/** ทำให้เส้นทางอยู่ในรูปเดียวกันเสมอ — ไม่มี `/` ท้าย ยกเว้นหน้าแรก */
export function normalizeRoute(route: string): string {
  if (!route.startsWith("/")) route = `/${route}`;
  if (route === "/") return "/";
  return route.replace(/\/+$/, "");
}

function walk(dir: string, out: string[]): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

/**
 * รวบรวมหน้า HTML ที่เรนเดอร์จริงจากทุกรากที่ประกาศไว้
 *
 * ⚠️ ไฟล์ที่ขึ้นต้นด้วย `_` (เช่น `_not-found.html` · `_global-error.html`)
 *    ถูกคัดออก เพราะไม่ใช่หน้าที่มี URL จริงให้คนเข้า
 */
export function collectRenderedPages(): RenderedPage[] {
  const pages: RenderedPage[] = [];
  for (const root of OUTPUT_ROOTS) {
    const abs = path.join(ROOT, root.dir);
    if (!fs.existsSync(abs)) {
      if (root.optional) continue;
      throw new Error(
        `ไม่พบผลลัพธ์การเรนเดอร์ของ "${root.name}" ที่ ${root.dir} — รัน npm run build ก่อน`,
      );
    }
    for (const file of walk(abs, [])) {
      const rel = path.relative(abs, file).replace(/\\/g, "/").replace(/\.html$/, "");
      if (rel.split("/").some((seg) => seg.startsWith("_"))) continue;
      const route = normalizeRoute(`${root.urlPrefix ?? ""}/${rel === "index" ? "" : rel}`);
      pages.push({ route, file, renderer: root.name });
    }
  }
  return pages;
}

/** แผนที่ `เส้นทาง ➔ หน้า` สำหรับด่านที่ต้องการค้นหาแบบเจาะจง */
export function renderedRouteMap(): Map<string, RenderedPage> {
  return new Map(collectRenderedPages().map((p) => [p.route, p]));
}

/**
 * รายการ "โฟลเดอร์ราก" ทั้งหมดที่มีไฟล์ HTML ของเว็บอยู่ (path เต็มบนดิสก์)
 *
 * ใช้กับด่านที่มีตัวเดินไฟล์เป็นของตัวเองอยู่แล้วและอาศัย `path.relative(ราก, ไฟล์)`
 * ในการถอดชื่อเส้นทาง — ด่านพวกนั้นวนรากทีละตัวได้เลยโดยไม่ต้องรื้อตรรกะเดิม
 *
 * ⚠️ ราก `optional` ที่ยังไม่ถูกบิลด์จะไม่ถูกคืนออกมา ด่านจึงไม่ตกบนเครื่องที่
 *    ยังไม่ได้รันบิลด์ตัวนั้น
 */
export function renderedOutputDirs(): string[] {
  const dirs: string[] = [];
  for (const root of OUTPUT_ROOTS) {
    const abs = path.join(ROOT, root.dir);
    if (fs.existsSync(abs)) dirs.push(abs);
    else if (!root.optional) dirs.push(abs); // ให้ด่านเดิมเป็นคนแจ้งว่ายังไม่ได้บิลด์ ตามข้อความของมันเอง
  }
  return dirs;
}

/** รากหลัก — สำหรับด่านที่ยังต้องการ path เดียว (เช่น ตอนพิมพ์ข้อความแจ้งเตือน) */
export function primaryOutputDir(): string {
  return renderedOutputDirs()[0];
}
