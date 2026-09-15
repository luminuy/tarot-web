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

/** ของที่สูตรตั้งอยู่บน — แก้อะไรในนี้ต้องไปวัดความสูงใหม่เสมอ */
const FINGERPRINTS: { file: string; needles: string[]; why: string }[] = [
  {
    file: "src/components/encyclopedia/CardsExplorer.tsx",
    needles: [
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5",
      "card-tile-cv rounded-xl border border-line bg-surface p-3",
      'aspect-[7/12]',
      "h-[3.8125rem]",
    ],
    why: "จำนวนคอลัมน์ · gap · padding การ์ด · สัดส่วนภาพ · ความสูงแถวคีย์เวิร์ด — ทั้งห้าอย่างนี้อยู่ในสูตรโดยตรง",
  },
  {
    file: "src/components/encyclopedia/CardGroupView.tsx",
    needles: [
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4",
      "card-tile-cv rounded-xl border border-line bg-surface p-3",
      'aspect-[7/12]',
      "h-[3.8125rem]",
    ],
    why:
      "หน้าไพ่ตามชุด (/cards/major · /cards/cups ฯลฯ) ใช้การ์ดทรงเดียวกับ /cards แต่ gap แคบกว่านิดหน่อย " +
      "(gap-3 sm:gap-4 เทียบกับ gap-3.5 sm:gap-5) ➔ วัดแล้วสูตรเดียวกันคลาดแค่ 0–4px ซึ่งรับได้ " +
      "แต่ถ้าใครแก้ gap ของหน้านี้ให้ต่างจากเดิมมาก ความคลาดจะโตขึ้นจนเห็นเป็นการกระตุก",
  },
];

/** สูตรที่วัดมาแล้ว — ค่าเหล่านี้คือ content box (หักขอบ+padding 26px ออกแล้ว) */
const FORMULAS: { media: string; value: string }[] = [
  { media: "base", value: "contain-intrinsic-size: auto calc(85.71vw + 39.6px);" },
  { media: "min-width: 640px", value: "contain-intrinsic-size: auto calc(56.7vw + 27.1px);" },
  { media: "min-width: 768px", value: "contain-intrinsic-size: auto calc(43.03vw + 23.3px);" },
  { media: "min-width: 1024px", value: "contain-intrinsic-size: auto calc(28.25vw + 37.1px);" },
  { media: "min-width: 1280px", value: "contain-intrinsic-size: auto 383px;" },
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
          `${fp.file} ไม่มี \`${needle}\` แล้ว\n      เหตุผลที่ต้องมี: ${fp.why}\n      ➔ ถ้าตั้งใจแก้หน้าตาการ์ด ต้องวัดความสูงใหม่แล้วอัปเดตสูตรใน globals.css พร้อมกัน`
        );
      }
    }
  }

  const cssPath = path.join(ROOT, "src/app/globals.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  if (!css.includes(".card-tile-cv {")) {
    problems.push("globals.css ไม่มีคลาส `.card-tile-cv` แล้ว — กริดไพ่จะกลับไปวาดครบ 78 ใบทุกครั้ง (TBT ~4,200 ms)");
  }
  for (const f of FORMULAS) {
    if (!css.includes(f.value)) {
      problems.push(
        `globals.css ไม่มีสูตรของช่วงจอ "${f.media}": \`${f.value}\`\n      ➔ ถ้าจะเปลี่ยนตัวเลข ต้องวัดจริงก่อนแล้วแก้ทั้งในไฟล์นี้และในด่านนี้ให้ตรงกัน`
      );
    }
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
    "✅ สูตรความสูงการ์ดยังตรงกับของจริง: กริด 2/3/4/6 คอลัมน์ · การ์ด p-3 · ภาพ 7:12 · แถวคีย์เวิร์ดสูงคงที่ · `.card-tile-cv` ครบทั้ง 5 ช่วงจอ\n"
  );
  process.exit(0);
}

run();
