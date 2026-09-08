/**
 * QA — ยามเฝ้าลูป prefetch ที่ยิงคำขอไม่รู้จบ (Segment Prefetch Loop Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้ — บทเรียน INC-0106
 * Next 16 เปลี่ยนวิธี prefetch มาใช้ **Client Segment Cache**: ลิงก์ที่เปิด prefetch
 * จะยิงถาม "ผังเส้นทาง" ด้วย header `Next-Router-Segment-Prefetch: /_tree`
 *
 * ถ้า `enableCacheInterception: true` ใน `open-next.config.ts`
 * OpenNext จะตอบจาก KV ตั้งแต่ก่อนถึง Next runtime → **ไม่เคยเห็น header นั้น**
 * และคืนเพย์โหลดเต็มหน้าชุดเดิมกลับไปทุกครั้ง ไคลเอนต์หาผังที่ขอไม่เจอ
 * จึงไม่บันทึกลงแคช แล้ววนถามใหม่ทันที **ไม่มีเงื่อนไขหยุด**
 *
 * วัดจริงบน production 2026-09-08: เปิดหน้าแรกทิ้งไว้แท็บเดียว = **~180 คำขอ/วินาที**
 * รวมเป็น 1.11M คำขอ/วัน ≈ 99% ของทราฟฟิกทั้งเว็บ โดยไม่มีใครรู้ตัวเลย
 * (พิสูจน์ที่เซิร์ฟเวอร์: ยิงมี/ไม่มี header ได้ไฟล์ขนาด 29,432 ไบต์เท่ากันเป๊ะ)
 *
 * **บทเรียน: ค่าที่ "ดูเหมือนช่วยเรื่องประสิทธิภาพ" อาจเป็นตัวสร้างคำขอเองก็ได้
 * ถ้าไม่มีเครื่องตรวจ มันจะถูกเปิดกลับในรอบปรับแต่งครั้งถัดไป**
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ:
 *  1. `open-next.config.ts` ต้องตั้ง `enableCacheInterception: false`
 *  2. ห้ามเขียน `prefetch={true}` ตรง ๆ ที่ไหนในโค้ด (ค่า default ของ Next ก็ prefetch อยู่แล้ว
 *     การเขียนย้ำแปลว่าตั้งใจเปิด ซึ่งควรอธิบายเหตุผลก่อน ไม่ใช่ใส่ผ่าน ๆ)
 *
 * 🔬 วิธีตรวจซ้ำด้วยมือ (เปิดหน้าแรกทิ้งไว้แล้วรันใน DevTools Console):
 *   let n=0; const of=fetch; window.fetch=(...a)=>{if(String(a[0]).includes('_rsc'))n++;return of(...a)};
 *   setTimeout(()=>console.log('คำขอ/วินาที =', n/3), 3000)
 *   ต้องได้ใกล้ 0 — ถ้าได้หลักสิบขึ้นไปแปลว่าลูปกลับมาแล้ว
 *
 * รันด้วย: npx tsx scripts/qa/test-prefetch-loop.ts
 */

import fs from "node:fs";
import path from "node:path";

const CONFIG_FILE = path.join(process.cwd(), "open-next.config.ts");
const SRC = path.join(process.cwd(), "src");

/** ตัดคอมเมนต์ออก เพื่อไม่ให้ข้อความอธิบายในไฟล์ถูกนับเป็นโค้ดที่รันจริง */
function codeOnly(source: string): string {
  return source
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
    })
    .join("\n");
}

function findTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findTsxFiles(full));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function run(): void {
  const errors: string[] = [];

  // ── กฎ 1: cache interception ต้องปิด ────────────────────────────────────
  const config = codeOnly(fs.readFileSync(CONFIG_FILE, "utf-8"));
  const match = config.match(/enableCacheInterception:\s*(true|false)/);

  if (!match) {
    errors.push(
      "ไม่พบการตั้ง `enableCacheInterception` ใน open-next.config.ts\n" +
        "    💡 ต้องระบุเป็น `false` ให้ชัดเจน พร้อมคอมเมนต์อ้าง INC-0106",
    );
  } else if (match[1] === "true") {
    errors.push(
      "`enableCacheInterception: true` ใน open-next.config.ts\n" +
        "    ค่านี้ทำให้คำตอบจาก KV ข้าม Next runtime → segment prefetch ของ Next 16 พังเงียบ ๆ\n" +
        "    แล้วไคลเอนต์วนยิงคำขอ ~180 ครั้ง/วินาที ต่อ 1 แท็บที่เปิดค้างไว้ (INC-0106)\n" +
        '    💡 ต้องเป็น `false` — ถ้าจะเปิดกลับ ต้องยืนยันก่อนว่า OpenNext ตอบ header\n' +
        "       `Next-Router-Segment-Prefetch: /_tree` ได้ถูกต้องแล้วจริง ๆ",
    );
  }

  // ── กฎ 2: ห้ามเขียน prefetch={true} ตรง ๆ ───────────────────────────────
  for (const file of findTsxFiles(SRC)) {
    const source = codeOnly(fs.readFileSync(file, "utf-8"));
    if (/prefetch=\{true\}/.test(source)) {
      const rel = path.relative(process.cwd(), file);
      errors.push(
        `พบ \`prefetch={true}\` ใน ${rel}\n` +
          "    💡 ถ้าจำเป็นจริงต้องอธิบายเหตุผลไว้ในคอมเมนต์เหนือบรรทัดนั้น และยืนยันว่า\n" +
          "       ไม่ทำให้เกิดลูป segment prefetch (ดูวิธีวัดในหัวไฟล์นี้)",
      );
    }
  }

  if (errors.length > 0) {
    console.error("❌ พบความเสี่ยงที่จะเกิดลูป prefetch ยิงคำขอไม่รู้จบ:");
    for (const e of errors) console.error(`  - ${e}\n`);
    process.exit(1);
  }

  console.log(
    "✅ ผ่านทุกเกณฑ์: cache interception ปิดอยู่ (segment prefetch ของ Next 16 ทำงานได้) " +
      "· ไม่มีจุดใดบังคับเปิด prefetch\n",
  );
  process.exit(0);
}

run();
