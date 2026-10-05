/**
 * ✦ ไอคอนทางลัดของแอป (manifest.shortcuts) จากภาพไพ่ 1909 จริง — REFLECTION_JOURNAL_PLAN 1.10
 * รัน: npx tsx scripts/gen-shortcut-icons.ts  (ผลลัพธ์อยู่ใน public/icons/shortcut-*.png — commit ได้)
 * ภาพไพ่วางกลางพื้นครีมของแบรนด์ ไม่ยืด ไม่ตัดหน้าไพ่ · ไม่มีอิโมจิ (กฎเหล็กข้อ 2)
 */
import sharp from "sharp";

const BG = { r: 250, g: 247, b: 242, alpha: 1 }; // #FAF7F2 ตรงกับ theme_color
const ICONS: Array<[string, string]> = [
  ["shortcut-daily", "public/cards/major-19.jpg"], // ดวงอาทิตย์ — ไพ่ประจำวัน
  ["shortcut-journal", "public/cards/major-02.jpg"], // นักบวชหญิง — สมุดดวง (บันทึก/ทบทวน)
  ["shortcut-cards", "public/cards/major-00.jpg"], // คนเขลา — ไพ่ 78 ใบ (จุดเริ่มต้นของสำรับ)
];

void (async () => {
  for (const [name, src] of ICONS) {
    const card = await sharp(src).resize({ height: 84, fit: "inside" }).toBuffer();
    await sharp({ create: { width: 96, height: 96, channels: 4, background: BG } })
      .composite([{ input: card, gravity: "center" }])
      .png()
      .toFile(`public/icons/${name}.png`);
    console.log(`✓ public/icons/${name}.png`);
  }
})();
