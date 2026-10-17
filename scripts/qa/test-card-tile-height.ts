/**
 * 📐 ด่านกัน "สูตรความสูงการ์ดไพ่รอตาย" (Card Tile Height Formula Guard — INC-0174 · ISSUE-048)
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องมีด่านนี้
 *
 * กริดไพ่ 78 ใบใช้ `.card-tile-cv` (ดู `src/app/globals.css`) ซึ่งเปิด `content-visibility: auto`
 * พร้อม `contain-intrinsic-size` ที่ **คำนวณความสูงจากความกว้างจอด้วย calc(vw) ต่อ breakpoint**
 * ตัวเลขในสูตรมาจากการวัดจริง 18 ความกว้างจอ ไม่ใช่ค่าที่เดา
 *
 * สูตรนั้นจะถูกต้องต่อไปก็ต่อเมื่อ "หน้าตาของการ์ด" ไม่เปลี่ยน — ถ้าใครแก้จำนวนคอลัมน์ของกริด
 * ระยะห่าง ขนาด padding สัดส่วนภาพ หรือความสูงแถวคีย์เวิร์ด **ความสูงจริงจะเปลี่ยนทันที
 * แต่สูตรจะยังเท่าเดิม** ➔ ความสูงที่จองไว้ผิด ➔ หน้าจอกลับไปกระตุกตอนเลื่อนขึ้นเหมือน INC-0174
 * และไม่มีอะไรเตือนเลย เพราะโค้ดยังถูกต้องทุกบรรทัดและหน้าเว็บก็ดูปกติเมื่อเปิดดูเฉย ๆ
 *
 * ## ด่านนี้ตรวจอะไร (และไม่ตรวจอะไร)
 *
 * ✅ ตรวจว่า **ส่วนประกอบทุกตัวที่สูตรตั้งอยู่บน** ยังเหมือนตอนที่วัด:
 *    กริด (จำนวนคอลัมน์ · gap) · การ์ด (`p-3` · `card-tile-cv`) · ภาพ (`aspect-[7/12]`)
 *    · แถวคีย์เวิร์ดความสูงคงที่ · และตัว `.card-tile-cv` เองยังมีครบทั้ง 5 ช่วงจอ
 *
 * ❌ **ไม่ได้เปิดเบราว์เซอร์วัดความสูงจริง** — รีโปนี้ไม่มีเครื่องมือขับเบราว์เซอร์ใน CI
 *    ด่านนี้จึงทำหน้าที่เป็น "สัญญาณเตือนภัย": ถ้าใครแตะของที่สูตรพึ่งพา ด่านจะตกและบอกให้
 *    ไปวัดใหม่ตามขั้นตอนใน `docs/plans/HANDOFF_CARD_TILE_CV_2026-09-15.md` แล้วอัปเดตทั้งสองที่พร้อมกัน
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/**
 * ของที่สูตรตั้งอยู่บน — แก้อะไรในนี้ต้องไปวัดความสูงใหม่เสมอ
 *
 * 📝 2026-09-21: ไทล์ไพ่เปลี่ยนผิวจาก `border border-line bg-surface … shadow-xs`
 *    มาเป็น `.altar-card-porcelain` (ธีมกระจกอุ่น) — **วัดใหม่แล้วความสูงไม่ขยับเลย**
 *    เพราะคลาสใหม่ยังเป็นเส้นขอบ 1px เท่าเดิมและ `p-3` เท่าเดิม สิ่งที่เปลี่ยนคือสีพื้น
 *    มุมโค้ง และเงา ซึ่งไม่มีตัวไหนอยู่ในสูตรความสูง
 *
 *    วัดด้วย Chromium บน `/cards` และ `/cards/major` ที่ 375 · 640 · 768 · 1024 · 1280 · 1440px
 *    ได้ content box ตรงกันทุกทศนิยมทั้งก่อนและหลังแก้ (เช่น 1280px = 383.1px ทั้งคู่)
 *    และ padding+ขอบ ยังรวมได้ 26px เป๊ะทุกความกว้าง ตามที่สูตรหักไว้
 */
const FINGERPRINTS: { file: string; needles: string[]; why: string }[] = [
  /*
   * v3 (2026-10-17 · เจ้าของ "ทำแบบหน้าแรกกับหน้าผัง"): /cards ใช้ CardTile.tsx + v3-card-tile.css
   * สูตรไม่ได้มาจากการวัดเดา — คำนวณตรงจากโครงการ์ด: สูง = (W − 12) × 12/7 + 78 · W จากความกว้างกริดจริง (100cqi)
   * ด่านเฝ้าทุกตัวเลขที่สูตรตั้งอยู่บน: padding กรอบ 6px · ภาพ 7/12 · บล็อกชื่อ 66px · คอลัมน์+ช่องทุกช่วง
   */
  {
    file: "src/components/encyclopedia/CardsExplorer.tsx",
    needles: ["<CardTile", "v3-grid-wrap", "v3-grid"],
    why: "หน้า /cards ต้องใช้การ์ด v3 ในกริดที่เป็น container — สูตร cqi พึ่งพาโครงนี้",
  },
  {
    file: "src/components/encyclopedia/CardTile.tsx",
    needles: ["card-tile-cv v3-tile", "v3-tile-frame", "v3-tile-txt"],
    why: "โครงการ์ด v3 (กรอบ + บล็อกชื่อ) คือฐานของสูตรความสูง",
  },
  {
    file: "src/styles/v3-card-tile.css",
    needles: [
      "container-type: inline-size;",
      "padding: 6px;",
      "aspect-ratio: 7 / 12;",
      "height: 66px;",
      "contain-intrinsic-size: auto calc(((100cqi - 12px) / 2 - 12px) * 12 / 7 + 78px);",
      "contain-intrinsic-size: auto calc(((100cqi - 28px) / 3 - 12px) * 12 / 7 + 78px);",
      "contain-intrinsic-size: auto calc(((100cqi - 48px) / 4 - 12px) * 12 / 7 + 78px);",
      "contain-intrinsic-size: auto calc(((100cqi - 72px) / 5 - 12px) * 12 / 7 + 78px);",
      "gap: 22px 12px;",
      "column-gap: 14px;",
      "column-gap: 16px;",
      "column-gap: 18px;",
    ],
    why: "สูตร = ((กริด − ช่องรวม) / คอลัมน์ − 12) × 12/7 + 12 + 66 — padding กรอบ 6×2 · ภาพ 7:12 · บล็อกชื่อ 66px · ช่องคอลัมน์ 12/14/16/18",
  },
  {
    file: "src/components/encyclopedia/CardGroupView.tsx",
    needles: ["<CardTile", "v3-grid-wrap", "v3-grid"],
    why: "หน้าไพ่ตามชุดใช้การ์ด v3 ในกริด container เดียวกับ /cards — สูตร cqi พึ่งพาโครงนี้",
  },
];

function run(): void {
  console.log("📐 ตรวจสูตรความสูงการ์ดไพ่ (Card Tile Height Formula Guard)...\n");
  const problems: string[] = [];

  for (const fp of FINGERPRINTS) {
    const full = path.join(ROOT, fp.file);
    if (!fs.existsSync(full)) {
      problems.push(`หาไฟล์ไม่เจอ: ${fp.file}`);
      continue;
    }
    const src = fs.readFileSync(full, "utf-8");
    for (const needle of fp.needles) {
      if (!src.includes(needle)) {
        problems.push(
          `${fp.file} ไม่มี \`${needle}\` แล้ว\n      เหตุผลที่ต้องมี: ${fp.why}\n      ➔ ถ้าตั้งใจแก้หน้าตาการ์ด ต้องแก้สูตรใน src/styles/v3-card-tile.css ให้ตรงโครงใหม่พร้อมกัน`
        );
      }
    }
  }

  const cssPath = path.join(ROOT, "src/app/globals.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  if (!css.includes(".card-tile-cv {")) {
    problems.push("globals.css ไม่มีคลาส `.card-tile-cv` แล้ว — กริดไพ่จะกลับไปวาดครบ 78 ใบทุกครั้ง (TBT ~4,200 ms)");
  }
  if (!/\.card-tile-cv \{\s*content-visibility: auto;/.test(css)) {
    problems.push("globals.css: `.card-tile-cv` ต้องเปิด `content-visibility: auto` (ข้ามการวาดการ์ดนอกจอ)");
  }
  if (/\.card-tile-cv \{[^}]*contain-intrinsic-size/.test(css)) {
    problems.push("globals.css: ห้ามตั้ง contain-intrinsic-size ของ `.card-tile-cv` ที่นี่อีก — สูตรอยู่ที่ v3-card-tile.css ที่เดียว");
  }

  if (problems.length > 0) {
    console.error(`❌ สูตรความสูงการ์ดกับของจริงไม่ตรงกันแล้ว ${problems.length} จุด:\n`);
    for (const p of problems) console.error(`  • ${p}\n`);
    console.error(
      "  📖 ขั้นตอนวัดใหม่ทีละขั้น: docs/plans/HANDOFF_CARD_TILE_CV_2026-09-15.md\n" +
        "  ⚠️ ห้ามแก้ตัวเลขในด่านนี้ให้ผ่านเฉย ๆ โดยไม่วัด — นั่นคือการปิดสัญญาณเตือน ไม่ใช่การแก้บั๊ก\n"
    );
    process.exit(1);
  }

  console.log(
    "✅ สูตรความสูงการ์ด v3 ยังตรงกับโครงจริง: กริด container 2/3/4/5 คอลัมน์ · กรอบ 6px · ภาพ 7:12 · บล็อกชื่อ 66px\n"
  );
  process.exit(0);
}

run();
