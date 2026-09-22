/**
 * 👻 ด่านกันของประดับล่องหน (Invisible Ornament Gate — ISSUE-046)
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องมีด่านนี้
 *
 * ตรวจจริงเมื่อ 2026-09-13 พบ **จุดสถานะสีเขียวที่มองไม่เห็นเลย** บนแถบ
 * "อ่านคำทำนายครบถ้วนแล้ว" ของ `StreamReader.tsx` — กล่องแถบใช้ `bg-[#EBF3ED]`
 * แล้ววงกลมข้างในใส่ `bg-[#EBF3ED]` ซ้ำ วงกลมจึงกลืนหายไปกับพื้นหลังสนิท
 *
 * ของแบบนี้ **typecheck จับไม่ได้ · lint จับไม่ได้ · คนอ่าน diff ก็ไม่สะดุด**
 * เพราะทั้งสองบรรทัดถูกต้องตามไวยากรณ์ทุกประการ ต่างกันแค่ว่าอยู่ซ้อนกัน
 * ตัวที่พิสูจน์ว่าเป็นความพลาดจริงคือพี่น้องของมัน `QuickChatResult.tsx`
 * ที่เป็นแถบเดียวกันเป๊ะแต่ใช้ `bg-ok` ถูกต้อง — ของนี้คือสำเนาที่ลอกผิด
 *
 * กวาดทั้งเว็บรอบนั้นเจอชนิดเดียวกันอีกจุด: `ProvablyFairPanel.tsx`
 * เหรียญ ✓ `w-5 h-5 rounded-full bg-[#EBF3ED]` นั่งอยู่บนกล่อง `bg-[#EBF3ED]`
 *
 * ## ด่านนี้ตรวจอะไร
 *
 * ของประดับทรงกลม (`rounded-full` + คู่ `w-N h-N` ที่เล็กกว่า 8) ที่มีสีพื้นของตัวเอง
 * **ห้ามมีสีพื้นตรงกับกล่องที่ครอบมันอยู่** — ตรงกันเมื่อไรคือมองไม่เห็น
 *
 * ## วิธีหา "กล่องที่ครอบอยู่" — ใช้ระดับการย่อหน้า
 *
 * ทั้ง repo ผ่าน prettier ย่อหน้าจึงสม่ำเสมอ 100% บรรทัดที่ย่อหน้าน้อยกว่าและอยู่เหนือขึ้นไป
 * ที่ใกล้ที่สุด = แท็กที่ครอบอยู่ · วิธีนี้ไม่ต้องเขียน parser JSX (ซึ่งจะไปสะดุด
 * generic อย่าง `useState<boolean>` แล้วนับเป็นแท็กเปิด)
 *
 * ## ⚠️ กับดักที่ต้องรู้ก่อนแก้ด่านนี้
 *
 * - เทียบเฉพาะตอนที่ **ทั้งลูกและแม่มีคลาส `bg-` เพียงตัวเดียว** ถ้าฝั่งใดมีหลายตัว
 *   (เช่นสลับตามเงื่อนไข) จะข้ามไป — ยอมปล่อยผ่านดีกว่าฟ้องผิดแล้วโดนปิดด่าน
 * - จับเฉพาะของประดับขนาดเล็ก ไม่ได้ห้ามกล่องซ้อนกล่องสีเดียวกันทั่วไป
 *   (พื้นสีเดียวกันซ้อนกันเป็นเรื่องปกติและถูกต้องในดีไซน์นี้)
 */
import fs from "node:fs";
import path from "node:path";
import { assertNonEmptyCorpus } from "./lib/corpus";
import { splitChatParagraphs, stripStrayBoldMarkers } from "../../src/lib/chat/format-chat-text";
import { splitTocNumber } from "../../src/lib/text/toc-label";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

/** คลาสพื้นหลังที่ "เล็กเกินกว่าจะเป็นกล่องจริง" — ถือเป็นของประดับ */
const MAX_ORNAMENT_SIZE = 8;

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTsx(full));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

/** คลาสทั้งหมดที่เป็น string literal บนบรรทัดนั้น (ครอบทุกแบบ quote) */
function classesOf(line: string): string[] {
  const out: string[] = [];
  for (const m of line.matchAll(/["'`]([^"'`]*)["'`]/g)) out.push(...m[1].split(/\s+/));
  return out.filter(Boolean);
}

/** คลาสพื้นหลังตัวเดียวของบรรทัดนี้ — คืน null ถ้าไม่มีหรือมีหลายตัว */
function soleBg(classes: string[]): string | null {
  const bgs = [...new Set(classes.filter((c) => /^bg-/.test(c) && !/^bg-(clip|blend|origin|repeat|size|position|no-repeat)/.test(c)))];
  return bgs.length === 1 ? bgs[0] : null;
}

/** เป็นของประดับทรงกลมขนาดเล็กไหม */
function isSmallRound(classes: string[]): boolean {
  if (!classes.includes("rounded-full")) return false;
  const w = classes.find((c) => /^w-\d+(\.\d+)?$/.test(c));
  const h = classes.find((c) => /^h-\d+(\.\d+)?$/.test(c));
  if (!w || !h) return false;
  return parseFloat(w.slice(2)) < MAX_ORNAMENT_SIZE && parseFloat(h.slice(2)) < MAX_ORNAMENT_SIZE;
}

const indentOf = (line: string): number => line.length - line.trimStart().length;

type Finding = { file: string; line: number; bg: string; parentLine: number };

export function scanInvisibleOrnaments(files: string[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");

    for (let i = 0; i < lines.length; i++) {
      const classes = classesOf(lines[i]);
      if (!isSmallRound(classes)) continue;
      const bg = soleBg(classes);
      if (!bg) continue;

      // เดินขึ้นหา "กล่องที่ครอบอยู่" = บรรทัดเหนือขึ้นไปที่ย่อหน้าน้อยกว่า และมีสีพื้น
      const myIndent = indentOf(lines[i]);
      let ceiling = myIndent;
      for (let j = i - 1; j >= 0; j--) {
        if (!lines[j].trim()) continue;
        const ind = indentOf(lines[j]);
        if (ind >= ceiling) continue;
        ceiling = ind;
        const parentBg = soleBg(classesOf(lines[j]));
        if (!parentBg) {
          if (ind === 0) break;
          continue;
        }
        if (parentBg === bg) {
          findings.push({ file: path.relative(ROOT, file), line: i + 1, bg, parentLine: j + 1 });
        }
        break; // เจอกล่องที่มีสีพื้นตัวแรกแล้ว — ตัวที่อยู่สูงกว่านั้นถูกทับไปแล้ว
      }
    }
  }

  return findings;
}


/**
 * 🫥 ข้อความที่ล่องหนเพราะคอลัมน์ยุบเหลือกว้าง 0 (iOS Safari)
 * ---------------------------------------------------------------------------
 * INC-0200 · 2026-09-18 เจ้าของเปิดลิ้นชักนำทางบน iPhone แล้วชื่อ "วิหารพยากรณ์" กับบรรทัด
 * "RIDER-WAITE TAROT" หายไปทั้งคู่ เหลือแต่ป้าย 1909 RWS ลอยอยู่กลางหัวลิ้นชัก
 *
 * ต้นเหตุ: คอลัมน์ที่ครอบข้อความเขียนไว้แค่ `flex flex-col min-w-0` โดยไม่มีฐานความกว้าง
 * ลูกทั้งสองบรรทัดใช้ `truncate` ซึ่งมี **min-content เป็น 0**
 * Safari คิดความกว้างคอลัมน์แบบ shrink-to-fit แล้วยุบเหลือเท่าป้ายที่เป็น `shrink-0`
 * ข้อความจึงกว้าง 0 และหายทั้งคู่ · Chrome ใช้ max-content จึงไม่มีใครเห็นอาการตอนรีวิว
 *
 * กฎ: คอลัมน์ (`flex-col`) ที่มี `min-w-0` และข้างในมีลูกที่ `truncate`
 * ต้องมีฐานความกว้างเสมอ — `flex-1` · `grow` · `w-full` · `basis-*`
 */
const WIDTH_BASIS = /\b(flex-1|grow|w-full|basis-)/;

type CollapseFinding = { file: string; line: number; truncateLine: number };

export function scanCollapsingColumns(files: string[]): CollapseFinding[] {
  const findings: CollapseFinding[] = [];

  for (const file of files) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");

    for (let i = 0; i < lines.length; i++) {
      const classes = classesOf(lines[i]).join(" ");
      if (!/\bflex-col\b/.test(classes) || !/\bmin-w-0\b/.test(classes)) continue;
      if (WIDTH_BASIS.test(classes)) continue;

      /* มองหาลูกที่ `truncate` ภายในบล็อกเดียวกัน (ย่อหน้าลึกกว่า) */
      const ownIndent = indentOf(lines[i]);
      for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
        if (!lines[j].trim()) continue;
        if (indentOf(lines[j]) <= ownIndent) break;
        if (classesOf(lines[j]).includes("truncate")) {
          findings.push({ file: path.relative(ROOT, file), line: i + 1, truncateLine: j + 1 });
          break;
        }
      }
    }
  }

  return findings;
}

/**
 * 🃏 การ์ดแชร์ผลคำทำนาย — ชื่อตำแหน่งห้าม `whitespace-nowrap` (INC-0211)
 *
 * ต้นเหตุ: ชื่อตำแหน่งของผังใหญ่ยาว 160-229px (เช่น "1. แก่นของเรื่อง (หัวใจของสถานการณ์)")
 * แต่คอลัมน์ของไพ่แต่ละใบกว้างแค่ 96px · `whitespace-nowrap` ทำให้มันล้นออกนอกคอลัมน์
 * ทั้งซ้ายและขวา แล้วไป **ทับชื่อของไพ่ใบข้าง ๆ** จนอ่านไม่ออกทั้งคู่
 * (วัดของจริงที่ 430px: ทับกัน 3 คู่ · ใบแรกล้นออกนอกการ์ดไป 7px)
 *
 * ลายน้ำท้ายการ์ดเป็นอาการกลับกัน: ไม่มี `whitespace-nowrap` เลย บนจอแคบจึงตัดกลางคำ
 * เห็นเป็น "SEERTAROT.NE" แล้วขึ้นบรรทัดใหม่เป็น "T"
 *
 * กฎ: ในบล็อกโชว์ไพ่ของ ShareModal ชื่อตำแหน่งต้องตัดบรรทัดได้และมี `line-clamp-*`
 *     ส่วนลายน้ำท้ายการ์ดต้อง `whitespace-nowrap` ทั้งสองก้อน และแถวต้อง `flex-wrap`
 */
type ShareFinding = { rule: string; hint: string };

export function scanShareCardText(root: string): ShareFinding[] {
  const out: ShareFinding[] = [];
  const file = path.join(root, "src/components/reading/ShareModal.tsx");
  if (!fs.existsSync(file)) {
    return [{ rule: "หาไฟล์ ShareModal.tsx ไม่เจอ", hint: "ด่านนี้ตรวจไม่ได้ — อย่าปล่อยผ่านเงียบ ๆ (INC-0211)" }];
  }
  const text = fs.readFileSync(file, "utf-8");

  const posSpan = text.match(/<span className="([^"]*)"[^>]*>\s*\{isEnglish \? \(c\.position\.nameEn/);
  if (!posSpan) {
    out.push({
      rule: "หา <span> ชื่อตำแหน่งในการ์ดแชร์ไม่เจอ",
      hint: "มาร์กอัปเปลี่ยนไป — แก้ด่านให้ตรงก่อน อย่าปล่อยผ่าน (INC-0211)",
    });
  } else {
    const cls = posSpan[1];
    if (/\bwhitespace-nowrap\b/.test(cls)) {
      out.push({
        rule: "ชื่อตำแหน่งในการ์ดแชร์ใช้ `whitespace-nowrap`",
        hint: "ชื่อยาวกว่าคอลัมน์ 96px เกือบเท่าตัว มันจะล้นไปทับชื่อไพ่ใบข้าง ๆ — เอาออก (INC-0211)",
      });
    }
    if (!/\bline-clamp-\d\b/.test(cls)) {
      out.push({
        rule: "ชื่อตำแหน่งในการ์ดแชร์ไม่มี `line-clamp-*`",
        hint: "ไม่จำกัดจำนวนบรรทัด ความสูงหัวคอลัมน์จะไม่เท่ากัน ไพ่ในแถวเดียวกันเรียงไม่ตรง (INC-0211)",
      });
    }
  }
  /* `className` เป็น optional ในแพตเทิร์น — ถ้าใครถอดออกทั้งก้อน ด่านต้องฟ้องว่า
     "ไม่มี whitespace-nowrap" ให้ตรงอาการ ไม่ใช่ฟ้องว่าหามาร์กอัปไม่เจอ */
  const footerRow = text.match(
    /<div className="([^"]*)"[^>]*>\s*<span(?: className="([^"]*)")?\s*>PROVABLY-FAIR SHA-256<\/span>\s*<span(?: className="([^"]*)")?\s*>SEERTAROT\.NET<\/span>/,
  );
  if (!footerRow) {
    out.push({
      rule: "หาแถวลายน้ำท้ายการ์ดแชร์ไม่เจอ",
      hint: "มาร์กอัปเปลี่ยนไป — แก้ด่านให้ตรงก่อน อย่าปล่อยผ่าน (INC-0211)",
    });
  } else {
    const [, rowCls, a = "", b = ""] = footerRow;
    if (!/\bflex-wrap\b/.test(rowCls)) {
      out.push({
        rule: "แถวลายน้ำท้ายการ์ดแชร์ไม่มี `flex-wrap`",
        hint: "จอแคบแล้วสองก้อนเบียดกันจนตัดกลางคำ — ต้องให้ย้ายลงบรรทัดใหม่ทั้งก้อน (INC-0211)",
      });
    }
    for (const [cls, label] of [[a, "PROVABLY-FAIR SHA-256"], [b, "SEERTAROT.NET"]] as const) {
      if (!/\bwhitespace-nowrap\b/.test(cls)) {
        out.push({
          rule: `ลายน้ำ "${label}" ไม่มี \`whitespace-nowrap\``,
          hint: "บนจอแคบจะถูกตัดกลางคำ (เห็นเป็น SEERTAROT.NE แล้วขึ้นบรรทัดใหม่เป็น T) — INC-0211",
        });
      }
    }
  }
  return out;
}

/**
 * 💬 ข้อความแชทของแม่หมอต้องไม่ถูกผ่ากลางคำ (INC-0212)
 *
 * ตัวจัดย่อหน้าเคยนับ "ขีดกลาง" เป็นสัญลักษณ์หัวข้อย่อยโดยไม่สนว่ามีช่องว่างขนาบไหม
 * คำว่า `(De-load Routine):` จึงถูกผ่าครึ่งเป็นสองย่อหน้า ผู้ใช้เห็นคำขาดหายกลางคัน
 * พร้อม `**` โผล่ดิบ ๆ · ยิงเคสจริงผ่านฟังก์ชันตัวเดียวกับที่หน้าเว็บใช้ ไม่ใช่สแกนข้อความ
 */
type ChatCase = { label: string; input: string; expect: (out: string[]) => string | null };

const CHAT_CASES: ChatCase[] = [
  {
    label: "ยัติภังค์กลางคำห้ามถูกผ่า (เคสที่ผู้ทดสอบเจอ)",
    input:
      "1. **ทำกิจวัตรลดภาระ (De-load Routine):** จดรายการทั้งหมดออกมาค่ะ\n" +
      "2. **สร้างกระบวนการอัตโนมัติ (Automation & Process):** หาเครื่องมือมาช่วยค่ะ",
    expect: (out) =>
      out.length === 2 && out[0].includes("(De-load Routine):")
        ? null
        : `ควรได้ 2 ย่อหน้าและคำว่า "(De-load Routine):" ต้องอยู่ครบ — ได้ ${JSON.stringify(out)}`,
  },
  {
    label: "คำที่มียัติภังค์อื่น ๆ ต้องไม่ถูกผ่า",
    input: "ลอง self-care ดูนะคะ อย่าลืม work-life balance และ e-mail หาเพื่อนบ้างค่ะ",
    expect: (out) =>
      out.length === 1 && out[0].includes("self-care") && out[0].includes("work-life") && out[0].includes("e-mail")
        ? null
        : `ต้องเหลือย่อหน้าเดียวและคำครบ — ได้ ${JSON.stringify(out)}`,
  },
  {
    label: "หัวข้อย่อยจริงที่เขียนด้วยขีดต้องยังแยกการ์ดได้",
    input: "สรุปไพ่ที่ได้ค่ะ - ตำแหน่งหัวใจ (9 ดาบ): ความกังวลที่สะสม - ตำแหน่งอนาคต (ดวงอาทิตย์): ทางที่สว่างขึ้น",
    expect: (out) =>
      out.length === 3 && out[1].startsWith("• **ตำแหน่งหัวใจ (9 ดาบ):**")
        ? null
        : `ควรแยกเป็นหัวข้อย่อย 2 ใบ — ได้ ${JSON.stringify(out)}`,
  },
  {
    label: "ห้ามมีดาวซ้อนสี่ตัว (ห่อซ้ำ) ในผลลัพธ์",
    input: "สรุปค่ะ - ตำแหน่งหัวใจ: ความกังวล\n• ตำแหน่งอนาคต: ทางสว่าง\nไพ่สิบไม้เท้า — ภาระหนัก: แบกเกินตัวค่ะ",
    expect: (out) =>
      out.some((o) => o.includes("****"))
        ? `เจอ \`****\` แปลว่าถูกห่อซ้ำ หัวข้อสีทองจะกลายเป็นสตริงว่าง — ได้ ${JSON.stringify(out)}`
        : null,
  },
  {
    label: "ดาวที่ไม่ครบคู่ต้องถูกกวาดทิ้งตอนเรนเดอร์",
    input: "",
    expect: () => (stripStrayBoldMarkers("1. **หัวข้อที่ดาวไม่ปิด ข้อความต่อ").includes("**")
      ? "stripStrayBoldMarkers ยังปล่อย `**` หลุดออกไปถึงผู้ใช้"
      : null),
  },
];

export function runChatFormatCases(): string[] {
  const failures: string[] = [];
  for (const c of CHAT_CASES) {
    const out = c.input ? splitChatParagraphs(c.input) : [];
    const problem = c.expect(out);
    if (problem) failures.push(`${c.label} — ${problem}`);
  }
  return failures;
}

/**
 * 🔢 สารบัญบทความ — เลขข้อต้องมีชั้นเดียว และจุดต้องไม่ตกบรรทัด (INC-0214)
 *
 * สารบัญเรนเดอร์เลขให้เองจากลำดับ แต่ชื่อหัวข้อของบางบทความเขียนเลขนำหน้ามาด้วย
 * ผู้ใช้จึงเห็น "1. 1. แก่นแท้ของความรัก…" · และป้ายเลขที่ไม่มี `shrink-0`
 * ถูกบีบจนจุดตกไปอยู่บรรทัดใหม่เฉพาะข้อที่ชื่อยาวสองบรรทัด
 */
type TocCase = { label: string; run: () => string | null };

const TOC_CASES: TocCase[] = [
  {
    label: "ชื่อหัวข้อที่มีเลขนำหน้าต้องไม่ได้เลขซ้ำสองชั้น",
    run: () => {
      const { marker, label } = splitTocNumber("1. แก่นแท้ของความรักในมุมมองไพ่ทาโรต์", 1);
      if (marker !== "1") return `เลขข้อควรเป็น "1" แต่ได้ "${marker}"`;
      return label.startsWith("1.") ? `ชื่อหัวข้อยังมีเลขติดมา: "${label}"` : null;
    },
  },
  {
    label: "ใช้เลขของผู้เขียนเพื่อให้ตรงกับหัวข้อในเนื้อบทความ",
    run: () => {
      const { marker } = splitTocNumber("6. ไพ่บอกเนื้อคู่ (Soulmate & Twin Flame) มีจริงไหม?", 3);
      return marker === "6" ? null : `ควรได้ "6" (เลขของผู้เขียน) แต่ได้ "${marker}"`;
    },
  },
  {
    label: "ชื่อหัวข้อที่ไม่มีเลขต้องได้เลขจากลำดับ",
    run: () => {
      const { marker, label } = splitTocNumber("คำถามที่พบบ่อย (FAQ)", 5);
      if (marker !== "5") return `ควรได้ "5" แต่ได้ "${marker}"`;
      return label === "คำถามที่พบบ่อย (FAQ)" ? null : `ชื่อหัวข้อถูกแก้โดยไม่จำเป็น: "${label}"`;
    },
  },
  {
    label: "ตัวเลขที่เป็นเนื้อหาจริงห้ามถูกตัดทิ้ง",
    run: () => {
      /* "3 ใบ" ไม่ได้ตามด้วยจุด/วงเล็บ จึงไม่ใช่เลขข้อ ต้องอยู่ครบ */
      const { label } = splitTocNumber("ไพ่ยิปซีความรัก 3 ใบ", 2);
      return label === "ไพ่ยิปซีความรัก 3 ใบ" ? null : `ชื่อหัวข้อถูกตัด: "${label}"`;
    },
  },
];

export function runTocCases(): string[] {
  const failures: string[] = [];
  for (const c of TOC_CASES) {
    const problem = c.run();
    if (problem) failures.push(`${c.label} — ${problem}`);
  }

  /* ป้ายเลขข้อต้อง `shrink-0` ไม่งั้นจุดตกบรรทัด */
  const file = path.join(ROOT, "src/components/blog/ArticleReadingClient.tsx");
  if (!fs.existsSync(file)) {
    failures.push("หาไฟล์ ArticleReadingClient.tsx ไม่เจอ — ด่านนี้ตรวจไม่ได้ อย่าปล่อยผ่านเงียบ ๆ (INC-0214)");
    return failures;
  }
  const text = fs.readFileSync(file, "utf-8");
  const markerSpan = text.match(/<span className="([^"]*)"[^>]*>\s*\{marker\}\./);
  if (!markerSpan) {
    failures.push("หา <span> ป้ายเลขข้อในสารบัญไม่เจอ — มาร์กอัปเปลี่ยนไป แก้ด่านให้ตรงก่อน (INC-0214)");
  } else if (!/\bshrink-0\b/.test(markerSpan[1])) {
    failures.push(
      "ป้ายเลขข้อในสารบัญไม่มี `shrink-0` — จะถูกบีบจนจุดตกไปอยู่บรรทัดใหม่ในข้อที่ชื่อยาว (INC-0214)",
    );
  }
  /* ต้องเรียกกับชื่อหัวข้อจริง ไม่ใช่แค่มีบรรทัด import ค้างไว้ */
  if (!/splitTocNumber\(\s*item\.title/.test(text)) {
    failures.push("สารบัญไม่ได้เรียก splitTocNumber() — เลขข้อจะซ้ำสองชั้นกับชื่อหัวข้อที่มีเลขนำหน้า (INC-0214)");
  }
  return failures;
}

/**
 * 🥊 `flex-1` กับ `whitespace-nowrap` อยู่ด้วยกันไม่ได้ (INC-0215)
 *
 * `flex-1` = `flex-basis: 0` + ยอมให้หด ➔ กล่องจะถูกบีบตามที่ว่างที่เหลือ
 * `whitespace-nowrap` = ตัวหนังสือหดตามไม่ได้ ➔ พอที่ไม่พอ มันล้นออกนอกกล่อง
 * ถ้าไม่มีอะไรมาตัด (`overflow: visible` ซึ่งเป็นค่าเริ่มต้น) ผู้ใช้เห็นตัวหนังสือ
 * **หลุดออกนอกพื้นปุ่ม/พื้นป้าย** ไปทับของข้าง ๆ
 *
 * เจอจริงตอนกวาดทั้งเว็บด้วยการเรนเดอร์: ปุ่ม "Only what's needed" ของแถบคุกกี้
 * ที่ 320px ถูกบีบเหลือ 122px แต่ตัวหนังสือต้องการ 127px ➔ ล้นออกนอกปุ่ม 5px
 *
 * ✅ ยกเว้นเมื่อมีตัวตัดของล้นอยู่แล้ว (`truncate` · `overflow-hidden` · `text-ellipsis`)
 *    เพราะนั่นคือแพตเทิร์น "ย่อด้วยจุดไข่ปลา" ที่ตั้งใจ ไม่ใช่ตัวหนังสือหลุดกรอบ
 */
const FLEX_GROW_TOKEN = /\b(flex-1|grow)\b/;
const HAS_CLIPPER = /\b(truncate|overflow-hidden|overflow-clip|text-ellipsis)\b/;

type SqueezeFinding = { file: string; line: number; classes: string };

/**
 * 🃏 ป้ายลอยสองอันบนไพ่ใบเดียวกันต้องอยู่คนละขอบบน-ล่าง (บทเรียนรอบ 133)
 * ---------------------------------------------------------------------------
 * ไพ่ในผังกว้างแค่ **96px** บนมือถือ (`w-24`) แต่ของที่ลอยทับอยู่มีสองชิ้น:
 *
 *   • ป้าย "กลับหัว" ใน `TarotCard.tsx`     — กว้าง 55px
 *   • ปุ่ม "ขยาย" ใน `SpreadBoard.tsx`      — กว้าง 70px (ยื่นออกนอกไพ่ 10px)
 *
 * 55 + 70 = 125px > 96px ➔ **ถ้าอยู่แถวเดียวกัน ยังไงก็ทับกัน** ไม่ว่าจะชิดซ้ายชิดขวาแค่ไหน
 * วัดจริงตอนทั้งคู่อยู่แถวบน: ทับกัน **13×8px** ที่ 320 · 360 · 390 · 430px
 * (จอ ≥640px ไพ่กว้าง 112px จึงพอดีเฉียดไม่ทับ — บั๊กนี้เลยโผล่เฉพาะมือถือ)
 *
 * กฎจึงเป็น: **ทั้งสองชิ้นต้องอยู่คนละขอบ (บน/ล่าง) เสมอ**
 * ย้ายชิ้นไหนก็ได้ แต่ห้ามให้ไปกองอยู่แถวเดียวกันอีก
 *
 * ⚠️ "เลื่อนไปทางขวา" แก้ไม่ได้ — ปุ่มขยายยื่นพ้นขอบไพ่ไป 10px อยู่แล้ว
 *    และแผงผังไพ่เป็น `overflow-hidden` ที่ 320px เหลือที่ว่างถึงขอบแผงแค่ 9px
 */
export interface CardBadgeFinding {
  rule: string;
  hint: string;
}

/** ป้ายลอยชิ้นนี้เกาะขอบบนหรือขอบล่างของไพ่ */
function edgeBandOf(classes: string): "top" | "bottom" | "unknown" {
  if (/(^|\s|-)top-/.test(classes)) return "top";
  if (/(^|\s|-)bottom-/.test(classes)) return "bottom";
  return "unknown";
}

export function scanCardFloatingBadges(root: string): CardBadgeFinding[] {
  const out: CardBadgeFinding[] = [];

  const cardFile = path.join(root, "src/components/card/TarotCard.tsx");
  const boardFile = path.join(root, "src/components/spread/SpreadBoard.tsx");
  for (const f of [cardFile, boardFile]) {
    if (!fs.existsSync(f)) {
      out.push({ rule: `หาไฟล์ ${path.relative(root, f)} ไม่เจอ`, hint: "ไฟล์ถูกย้าย/เปลี่ยนชื่อ — ด่านนี้ตรวจอะไรไม่ได้" });
      return out;
    }
  }

  // ป้าย "กลับหัว" — กล่อง absolute ที่อยู่เหนือข้อความ "กลับหัว" ที่ใกล้ที่สุด
  const cardSrc = fs.readFileSync(cardFile, "utf-8").split("\n");
  const badgeTextLine = cardSrc.findIndex((l) => l.includes('"Reversed" : "กลับหัว"'));
  const badgeBoxLine = badgeTextLine < 0 ? -1 : cardSrc.slice(0, badgeTextLine).map((l, i) => ({ l, i })).reverse().find((x) => x.l.includes("absolute"))?.i ?? -1;

  // ปุ่ม "ขยาย" ของผังไพ่ — className ของปุ่มที่อยู่เหนือข้อความ "ขยาย" ที่ใกล้ที่สุด
  const boardSrc = fs.readFileSync(boardFile, "utf-8").split("\n");
  const zoomTextLine = boardSrc.findIndex((l) => l.includes('"Zoom" : "ขยาย"'));
  const zoomBoxLine = zoomTextLine < 0 ? -1 : boardSrc.slice(0, zoomTextLine).map((l, i) => ({ l, i })).reverse().find((x) => x.l.includes("absolute"))?.i ?? -1;

  if (badgeBoxLine < 0 || zoomBoxLine < 0) {
    out.push({
      rule: "หาป้าย \"กลับหัว\" หรือปุ่ม \"ขยาย\" ในซอร์สไม่เจอ",
      hint: "ถ้าย้ายที่อยู่ของสองชิ้นนี้ ต้องอัปเดตด่านนี้ให้ตรวจของจริงต่อได้ ห้ามปล่อยให้ด่านเงียบ",
    });
    return out;
  }

  const badgeBand = edgeBandOf(cardSrc[badgeBoxLine]);
  const zoomBand = edgeBandOf(boardSrc[zoomBoxLine]);

  if (badgeBand === "unknown" || zoomBand === "unknown") {
    out.push({
      rule: `อ่านขอบที่ป้ายเกาะอยู่ไม่ออก (กลับหัว=${badgeBand} · ขยาย=${zoomBand})`,
      hint: "ทั้งสองชิ้นต้องระบุขอบบน/ล่างให้ชัดด้วยคลาส `top-*` หรือ `bottom-*`",
    });
    return out;
  }

  if (badgeBand === zoomBand) {
    out.push({
      rule: `ป้าย "กลับหัว" กับปุ่ม "ขยาย" ไปกองอยู่ขอบ${badgeBand === "top" ? "บน" : "ล่าง"}ด้วยกัน`,
      hint: "ไพ่กว้าง 96px บนมือถือ แต่สองชิ้นรวมกัน 125px ➔ ทับกันแน่นอน · ย้ายชิ้นใดชิ้นหนึ่งไปอีกขอบ",
    });
  }

  return out;
}

export function scanNowrapInsideFlexGrow(files: string[]): SqueezeFinding[] {
  const findings: SqueezeFinding[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.startsWith("*") || trimmed.startsWith("//")) continue;
      /* ต้องดู "ทีละสตริง" ไม่ใช่รวมทั้งบรรทัด — คลาสคนละก้อนไม่ได้อยู่บน element เดียวกัน */
      const quoted = [...line.matchAll(/["'`]([^"'`]*)["'`]/g)].map((m) => m[1]);
      for (const cls of quoted) {
        if (!/\bwhitespace-nowrap\b/.test(cls)) continue;
        if (!FLEX_GROW_TOKEN.test(cls)) continue;
        if (HAS_CLIPPER.test(cls)) continue;
        findings.push({ file: path.relative(ROOT, file), line: i + 1, classes: cls.slice(0, 120) });
      }
    }
  }
  return findings;
}

if (process.argv[1] && process.argv[1].endsWith("test-invisible-element.ts")) {
  const tsxFiles = walkTsx(SRC);
  assertNonEmptyCorpus("ไฟล์ .tsx ใน src/", tsxFiles, "ตรวจว่า walk() ชี้ไปที่ src/ จริง");
  const findings = scanInvisibleOrnaments(tsxFiles);

  if (findings.length > 0) {
    console.error(`\n❌ พบของประดับที่กลืนหายไปกับพื้นหลัง ${findings.length} จุด\n`);
    for (const f of findings) {
      console.error(`   ${f.file}:${f.line}`);
      console.error(`      วงกลมใช้ ${f.bg} — ตรงกับกล่องที่ครอบอยู่ (บรรทัด ${f.parentLine}) จึงมองไม่เห็น`);
      console.error(`      แก้: ใช้สีทึบของสถานะนั้นแทน (เช่น bg-ok / bg-gold-ink)\n`);
    }
    process.exit(1);
  }

  console.log("✅ ไม่มีของประดับทรงกลมที่สีพื้นตรงกับกล่องที่ครอบอยู่");

  const collapsing = scanCollapsingColumns(tsxFiles);
  if (collapsing.length > 0) {
    console.error(`\n❌ พบคอลัมน์ที่จะยุบเหลือกว้าง 0 บน iOS Safari ${collapsing.length} จุด\n`);
    for (const f of collapsing) {
      console.error(`   ${f.file}:${f.line}`);
      console.error(`      \`flex-col min-w-0\` ไม่มีฐานความกว้าง แต่มีลูกที่ใช้ \`truncate\` (บรรทัด ${f.truncateLine})`);
      console.error(`      แก้: เติม \`flex-1\` (หรือ \`w-full\`) ให้คอลัมน์นั้น ไม่งั้นข้อความจะหายทั้งบล็อกบน Safari\n`);
    }
    process.exit(1);
  }

  console.log("✅ ไม่มีคอลัมน์ `flex-col min-w-0` ที่ไร้ฐานความกว้างทั้งที่มีลูกใช้ truncate");

  const share = scanShareCardText(ROOT);
  if (share.length > 0) {
    console.error(`\n❌ การ์ดแชร์ผลคำทำนาย: ตัวหนังสือจะซ้อนกัน/ตกบรรทัด ${share.length} จุด\n`);
    for (const f of share) {
      console.error(`   ${f.rule}`);
      console.error(`      ${f.hint}\n`);
    }
    process.exit(1);
  }

  console.log("✅ การ์ดแชร์: ชื่อตำแหน่งตัดบรรทัดได้และจำกัดบรรทัด · ลายน้ำท้ายการ์ดไม่ตัดกลางคำ");

  const chat = runChatFormatCases();
  if (chat.length > 0) {
    console.error(`\n❌ ข้อความแชทของแม่หมอถูกผ่ากลางคำ/ดาวหลุด ${chat.length} เคส\n`);
    for (const f of chat) console.error(`   ${f}\n`);
    process.exit(1);
  }

  console.log(`✅ ข้อความแชท: ยัติภังค์กลางคำไม่ถูกผ่า · หัวข้อย่อยจริงยังแยกได้ · ไม่มีดาวหลุด (${CHAT_CASES.length} เคส)`);

  const toc = runTocCases();
  if (toc.length > 0) {
    console.error(`\n❌ สารบัญบทความ: เลขข้อซ้ำ/จุดตกบรรทัด ${toc.length} จุด\n`);
    for (const f of toc) console.error(`   ${f}\n`);
    process.exit(1);
  }

  console.log(`✅ สารบัญบทความ: เลขข้อมีชั้นเดียวและจุดไม่ตกบรรทัด (${TOC_CASES.length} เคส)`);

  const squeezed = scanNowrapInsideFlexGrow(tsxFiles);
  if (squeezed.length > 0) {
    console.error(`\n❌ พบกล่องที่ยอมให้หดแต่ตัวหนังสือหดตามไม่ได้ ${squeezed.length} จุด\n`);
    for (const f of squeezed) {
      console.error(`   ${f.file}:${f.line}`);
      console.error(`      "${f.classes}"`);
      console.error(`      \`flex-1\`/\`grow\` คู่กับ \`whitespace-nowrap\` = ตัวหนังสือล้นออกนอกกล่องเมื่อจอแคบ`);
      console.error(`      แก้: ถอด \`whitespace-nowrap\` ให้ตัดบรรทัดได้ หรือเติม \`truncate\` ถ้าตั้งใจย่อด้วยจุดไข่ปลา (INC-0215)\n`);
    }
    process.exit(1);
  }

  console.log("✅ ไม่มีกล่องที่ `flex-1`/`grow` คู่กับ `whitespace-nowrap` โดยไม่มีตัวตัดของล้น");

  const badges = scanCardFloatingBadges(ROOT);
  if (badges.length > 0) {
    console.error(`\n❌ ป้ายลอยบนไพ่ทับกัน ${badges.length} จุด\n`);
    for (const f of badges) {
      console.error(`   ${f.rule}`);
      console.error(`      ${f.hint}\n`);
    }
    process.exit(1);
  }

  console.log('✅ ป้าย "กลับหัว" กับปุ่ม "ขยาย" อยู่คนละขอบของไพ่ จึงทับกันไม่ได้');
}
