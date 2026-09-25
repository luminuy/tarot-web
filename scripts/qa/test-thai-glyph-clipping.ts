/**
 * ✂️ ด่านกันหัวสระ/วรรณยุกต์ไทยถูกตัด (Thai Glyph Clipping Gate · INC-0197)
 * ===========================================================================
 *
 * ## ทำไมต้องมีด่านนี้
 *
 * 2026-09-17 เจ้าของโปรเจกต์ทักว่าเมนูข้างในลิ้นชักนำทาง "ตัวอักษรขาด สระหาย ไ หัวหาย"
 * วัดบน production จริงแล้วพบว่า **9 หัวข้อในลิ้นชักโดนตัดยอด 2px ทุกบรรทัด**
 * เพราะคลาสสามตัวนี้มาอยู่ด้วยกัน:
 *
 * ```
 * text-[13px] leading-tight truncate     ❌ ยอด "ไ" กับสระบนถูกเฉือนหาย
 * ```
 *
 * - `truncate` = `overflow: hidden` → กล่องนี้ "ตัด" ทุกอย่างที่ล้นออกนอกกรอบ
 * - `leading-tight` (1.25) ทำให้กรอบเตี้ยกว่าตัวอักษรจริง
 *
 * ## ตัวเลขที่วัดมาได้จริง (Noto Serif Thai · เบราว์เซอร์จริง · seertarot.net)
 *
 * | ค่า | ที่วัดได้ |
 * |---|---|
 * | หมึกไทยพุ่งเหนือเส้นฐานสูงสุด (สระอี+ไม้เอก เช่น "ที่") | **1.056em** |
 * | ascent ของฟอนต์ | 1.077em · descent 0.538em → กล่องฟอนต์ 1.615em |
 *
 * กล่องบรรทัดวางเส้นฐานไว้ที่ `(line-height − 1.615em) / 2 + 1.077em`
 * ดังนั้นจะไม่ตัดหมึกก็ต่อเมื่อ **line-height ≥ 1.615 + 2 × (1.056 − 1.077) ≈ 1.573em**
 *
 * บ้านนี้จึงตั้งพื้นขั้นต่ำไว้ที่ **1.6** (เท่ากับ `--text-xs--line-height` / `--text-sm--line-height`
 * ที่ประกาศไว้ใน `globals.css` อยู่แล้ว) — `leading-tight` 1.25 · `leading-snug` 1.375 ·
 * `leading-normal` 1.5 **ต่ำกว่าพื้นทั้งสามตัว** จึงใช้คู่กับ `truncate` ไม่ได้
 *
 * ## ด่านนี้ตรวจอะไร
 *
 * คลาสเดียวกันที่มีทั้ง `truncate` (หรือ `overflow-hidden` + `text-ellipsis`)
 * และ `leading-*` ที่ต่ำกว่า 1.6 → ตกด่าน
 *
 * ## ⚠️ กับดักที่ต้องรู้ก่อนแก้ด่านนี้
 *
 * - **ไม่มี `leading-*` เลย = ผ่าน** เพราะจะตกไปใช้ค่าจากธีม (1.6–1.7) ซึ่งปลอดภัยอยู่แล้ว
 *   ด่านนี้จับเฉพาะคนที่ "ตั้งใจเขียนให้แน่นกว่าเดิม" เท่านั้น
 * - **มีช่องว่างบน/ล่าง (`py-` · `pt-`+`pb-`) = ยกเว้น** เพราะ `overflow` ตัดที่ขอบ padding box
 *   ช่องว่างจึงกลายเป็นที่ว่างให้หมึกล้นได้โดยไม่ถูกตัด (เช่น `SpreadBoard.tsx` ที่ใช้ `py-0.5`)
 * - `line-clamp-*` ไม่อยู่ในด่านนี้ เพราะมันจองความสูงเป็นจำนวนบรรทัดของ line-height เอง
 *   อาการจึงเป็นคนละแบบ — ถ้าจะเพิ่มต้องวัดใหม่ก่อน ห้ามเดา
 *
 * ## ส่วนที่ 3 · หัวข้อไทยห้ามขึ้นบรรทัดใหม่กลางวลี (2026-09-25 · เจ้าของทักจากภาพ "ทา / โรต์")
 *
 * สแกนจริงด้วยเบราว์เซอร์ทั้ง 209 หน้าไทยที่ 390/1280px เจอหัวข้อหักกลางวลี 269 แบบ ➔ แก้ด้วย
 * `ThaiPhrases` (ห่อวลีด้วย `.tp`) + เว้นวรรคตรงรอยต่อวลีในข้อความที่ยาวติดกัน ➔ เหลือ 0
 * ด่านนี้อ่าน HTML ที่บิลด์แล้ว (`dist/`) ไม่ต้องเปิดเบราว์เซอร์:
 *   a) h1–h3 ภาษาไทยที่มีตั้งแต่ 2 วลีขึ้นไป ต้องมี `class="tp"` (ลืมห่อ = ตก)
 *      ยกเว้นหัวข้อที่เป็นกล่อง flex/grid (span จะกลายเป็น flex item แยกกัน) หรือ truncate
 *   b) วลีไทยที่ยาวติดกันไม่มีช่องว่างใน h1/h2 ห้ามยาวเกิน `MAX_THAI_RUN` ตัวอักษร
 *      (ยาวกว่านี้จอมือถือต้องหักกลางวลีแน่นอน — เพิ่มช่องว่างตรงรอยต่อวลีแทน)
 */
import fs from "node:fs";
import path from "node:path";
import { assertNonEmptyCorpus } from "./lib/corpus";
import { fitTextToWidth, sliceThaiSafe, trimThaiOrphans } from "../../src/lib/text/thai-truncate";
import { groupThaiPhrases } from "../../src/components/ui/ThaiPhrases";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

/** พื้นขั้นต่ำของ line-height สำหรับกล่องที่ตัดของล้นทิ้ง — ที่มาของตัวเลขอยู่ในหัวไฟล์ */
const MIN_LEADING = 1.6;

/** ค่ามาตรฐานของ Tailwind — ตัวที่เป็นสัดส่วน (ไม่ใช่ rem) เท่านั้นที่เทียบกับพื้นนี้ได้ */
const NAMED_LEADING: Record<string, number> = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTsx(full));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

/** คลาสทุกตัวที่เป็น string literal บนบรรทัดนั้น (ครอบทุกแบบ quote) */
function classesOf(line: string): string[] {
  const out: string[] = [];
  for (const m of line.matchAll(/["'`]([^"'`]*)["'`]/g)) out.push(...m[1].split(/\s+/));
  return out.filter(Boolean);
}

/** กล่องนี้ตัดของที่ล้นทิ้งไหม */
function clipsOverflow(classes: string[]): boolean {
  if (classes.includes("truncate")) return true;
  return classes.includes("overflow-hidden") && classes.includes("text-ellipsis");
}

/** มีช่องว่างบน/ล่างให้หมึกล้นได้ไหม — overflow ตัดที่ขอบ padding box */
function hasHeadroom(classes: string[]): boolean {
  if (classes.some((c) => /^p[yt]-/.test(c))) return true;
  return classes.some((c) => /^p-/.test(c) && !/^p-(x|y|t|b|l|r)/.test(c));
}

/** line-height ที่เขียนไว้ตรง ๆ บนบรรทัดนี้ — null เมื่อไม่ได้เขียน (ตกไปใช้ค่าธีม = ปลอดภัย) */
export function explicitLeading(classes: string[]): { cls: string; value: number } | null {
  for (const c of classes) {
    const named = /^leading-([a-z]+)$/.exec(c);
    if (named && named[1] in NAMED_LEADING) return { cls: c, value: NAMED_LEADING[named[1]] };

    const arbitrary = /^leading-\[(\d*\.?\d+)\]$/.exec(c);
    if (arbitrary) return { cls: c, value: parseFloat(arbitrary[1]) };
  }
  return null;
}

type Finding = { file: string; line: number; cls: string; value: number };

export function scanClippedThaiText(files: string[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");

    for (let i = 0; i < lines.length; i++) {
      const classes = classesOf(lines[i]);
      if (!clipsOverflow(classes)) continue;
      if (hasHeadroom(classes)) continue;

      const leading = explicitLeading(classes);
      if (!leading || leading.value >= MIN_LEADING) continue;

      findings.push({ file: path.relative(ROOT, file), line: i + 1, cls: leading.cls, value: leading.value });
    }
  }

  return findings;
}

/**
 * พิสูจน์ว่าด่านนี้จับของจริงได้ ไม่ใช่ด่านที่ผ่านตลอดกาล
 * (เคสที่ 1 คือคลาสชุดที่ทำให้เกิด INC-0197 จริง ๆ)
 */
function selfTest(): boolean {
  const cases: { label: string; line: string; shouldFlag: boolean }[] = [
    { label: "ชุดคลาสที่ทำให้หัวสระขาดจริง (INC-0197)", line: `className="text-[13px] font-serif-th leading-tight truncate"`, shouldFlag: true },
    { label: "leading-snug ก็ยังต่ำกว่าพื้น", line: `className="text-xs truncate leading-snug"`, shouldFlag: true },
    { label: "leading-normal (1.5) ยังไม่พอสำหรับสระซ้อนวรรณยุกต์", line: `className="truncate leading-normal"`, shouldFlag: true },
    { label: "overflow-hidden + text-ellipsis คืออาการเดียวกัน", line: `className="overflow-hidden text-ellipsis leading-tight"`, shouldFlag: true },
    { label: "leading-[1.7] ผ่าน", line: `className="text-[13px] font-serif-th leading-[1.7] truncate"`, shouldFlag: false },
    { label: "ไม่เขียน leading เลย = ใช้ค่าธีม 1.6–1.7", line: `className="text-sm truncate"`, shouldFlag: false },
    { label: "มี py- เป็นที่ว่างให้หมึกล้น", line: `className="text-xs leading-snug py-0.5 truncate"`, shouldFlag: false },
    { label: "leading-tight ที่ไม่ได้ตัดของล้น ไม่ใช่เรื่องของด่านนี้", line: `className="text-xs leading-tight"`, shouldFlag: false },
  ];

  const tmp = path.join(ROOT, "scripts/qa/.thai-glyph-clipping-selftest.tsx");
  let ok = true;

  for (const c of cases) {
    fs.writeFileSync(tmp, `export const X = <div ${c.line} />;\n`, "utf-8");
    const flagged = scanClippedThaiText([tmp]).length > 0;
    if (flagged !== c.shouldFlag) {
      console.error(`   ❌ ตัวตรวจเพี้ยน: "${c.label}" ควร${c.shouldFlag ? "ฟ้อง" : "ผ่าน"} แต่${flagged ? "ฟ้อง" : "ผ่าน"}`);
      ok = false;
    }
  }

  fs.rmSync(tmp, { force: true });
  return ok;
}

/**
 * ✂️ การตัดข้อความด้วย "จำนวนตัวอักษร" ทำให้คลัสเตอร์ไทยขาดครึ่ง (INC-0213)
 *
 * `slice(0, 18)` ไม่รู้ว่าฟอนต์กว้างเท่าไหร่ และไม่รู้ว่าตัวที่ 18 เป็นวรรณยุกต์หรือสระหน้า
 * ผลคือได้สระลอยไม่มีพยัญชนะ หรือทัณฑฆาตหายไปทั้งที่คำยังไม่จบ
 * ยิงเคสจริงผ่านฟังก์ชันตัวเดียวกับที่ตัวเรนเดอร์ภาพแชร์ใช้ ไม่ใช่สแกนข้อความ
 */
const THAI_ORPHAN_TAIL = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E40-\u0E44]$/;

/** วัดความกว้างแบบหยาบ ๆ แทน canvas: ตัวอักษรที่ "ไม่กินที่" (สระบน/ล่าง/วรรณยุกต์) กว้าง 0 */
function fakeMeasure(text: string): number {
  return Array.from(text).reduce((w, ch) => w + (/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(ch) ? 0 : 10), 0);
}

type TruncCase = { label: string; run: () => string | null };

const TRUNC_CASES: TruncCase[] = [
  {
    label: "ท้ายข้อความห้ามเหลือวรรณยุกต์/สระหน้าลอย",
    run: () => {
      const src = "1. แก่นของเรื่อง (หัวใจของสถานการณ์)";
      for (let w = 40; w <= 260; w += 10) {
        const out = fitTextToWidth(src, fakeMeasure, w);
        const body = out.endsWith("…") ? out.slice(0, -1) : out;
        if (THAI_ORPHAN_TAIL.test(body)) return `กว้าง ${w} ได้ "${out}" ซึ่งจบด้วยเครื่องหมายลอย`;
      }
      return null;
    },
  },
  {
    label: "ผลลัพธ์ต้องไม่กว้างเกินกรอบที่ให้",
    run: () => {
      const src = "2. สิ่งที่ขวางอยู่ (อุปสรรคตรงหน้า)";
      for (let w = 40; w <= 260; w += 10) {
        const out = fitTextToWidth(src, fakeMeasure, w);
        if (fakeMeasure(out) > w) return `กว้าง ${w} ได้ "${out}" ซึ่งวัดได้ ${fakeMeasure(out)}`;
      }
      return null;
    },
  },
  {
    label: "ข้อความที่พอดีอยู่แล้วต้องไม่ถูกแตะ",
    run: () => {
      const src = "อดีต";
      const out = fitTextToWidth(src, fakeMeasure, 500);
      return out === src ? null : `ควรได้ "${src}" แต่ได้ "${out}"`;
    },
  },
  {
    label: "trimThaiOrphans ต้องคืนทัณฑฆาต/สระที่ลอยออกไป",
    run: () => {
      const out = sliceThaiSafe("สถานการณ์", 8); // จุดตัดลงพอดีหน้าทัณฑฆาต ➔ ต้องถอยทั้งคลัสเตอร์
      return out === "สถานการ" ? null : `ควรได้ "สถานการ" แต่ได้ "${out}"`;
    },
  },
  {
    label: "สระหน้าที่ไม่มีพยัญชนะตามต้องถูกตัดทิ้ง",
    run: () => {
      const out = trimThaiOrphans("ความรักเ");
      return out === "ความรัก" ? null : `ควรได้ "ความรัก" แต่ได้ "${out}"`;
    },
  },
];

export function runThaiTruncateCases(): string[] {
  const failures: string[] = [];
  for (const c of TRUNC_CASES) {
    const problem = c.run();
    if (problem) failures.push(`${c.label} — ${problem}`);
  }
  return failures;
}

/**
 * ตัวเรนเดอร์ภาพแชร์ (canvas) ห้ามตัดข้อความด้วยจำนวนตัวอักษรอีก (INC-0213)
 * ต้องวัดความกว้างจริงผ่าน `fitTextToWidth` เท่านั้น
 *
 * 2026-09-24: ตัววาดย้ายจาก `ShareModal.tsx` มาอยู่ `src/lib/share/share-card.ts` (ออกแบบการ์ดแชร์ใหม่)
 * ด่านจึงตามไปตรวจไฟล์นั้น — ShareModal เหลือแค่แสดงภาพที่วาดเสร็จแล้ว
 */
export function scanCanvasCharSlice(): string[] {
  const file = path.join(ROOT, "src/lib/share/share-card.ts");
  if (!fs.existsSync(file)) {
    return ["หาไฟล์ share-card.ts ไม่เจอ — ด่านนี้ตรวจไม่ได้ อย่าปล่อยผ่านเงียบ ๆ (INC-0213)"];
  }
  const out: string[] = [];
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  /*
   * สนใจเฉพาะ `.slice(0, n)` ที่เป็น "การย่อข้อความให้คนอ่าน" เท่านั้น
   * ดูจากสองสัญญาณในบรรทัดเดียวกัน: ต่อท้ายด้วยจุดไข่ปลา หรือส่งเข้า `fillText`
   * `cards.slice(0, 5)` (หยิบไพ่ 5 ใบแรกมาโชว์) ไม่ใช่การย่อข้อความ จึงไม่โดนจับ
   */
  const TEXT_TRUNCATION_HINT = /(\.\.\.|…|fillText)/;
  lines.forEach((line, i) => {
    if (line.trimStart().startsWith("*") || line.trimStart().startsWith("//")) return;
    if (!/\.slice\(0,\s*\d+\)/.test(line)) return;
    if (!TEXT_TRUNCATION_HINT.test(line)) return;
    out.push(
      `share-card.ts:${i + 1} ยังย่อข้อความด้วยจำนวนตัวอักษร — ตัดกลางคลัสเตอร์ไทยได้ ` +
        `ใช้ fitTextToWidth() (วัดความกว้างจริง) หรือ trimThaiOrphans() แทน (INC-0213)`,
    );
  });
  if (!fs.readFileSync(file, "utf-8").includes("fitTextToWidth")) {
    out.push("share-card.ts ไม่ได้เรียก fitTextToWidth() เลย — ตัวเรนเดอร์ภาพแชร์ต้องย่อข้อความตามความกว้างจริง (INC-0213)");
  }
  return out;
}

/* ── ส่วนที่ 3 · หัวข้อไทยห้ามหักกลางวลี ─────────────────────────────────────── */

/** วลีไทยติดกันยาวสุดที่ยอมให้มีใน h1/h2 — ค่าสูงสุดที่วัดได้ตอนตั้งด่านคือ 39 (ทุกตัวแสดงผลไม่หักกลางวลี) */
const MAX_THAI_RUN = 40;
const THAI_CHAR = /[\u0E00-\u0E7F]/;

function walkThaiHtml(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "en" && entry.name !== "_astro") out.push(...walkThaiHtml(full));
    } else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;|&#160;/g, "\u00a0")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** ข้อความหัวข้อในหน้า HTML หนึ่งหน้าที่ผิดกติกา (ว่างเปล่า = ผ่าน) */
export function scanThaiHeadings(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<(h[123])\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const [, tag, attrs, inner] = m;
    const cls = /class="([^"]*)"/.exec(attrs)?.[1] ?? "";
    const text = decodeEntities(inner.replace(/<[^>]+>/g, "")).trim();
    if (!THAI_CHAR.test(text)) continue;
    const groups = groupThaiPhrases(text).filter((g) => THAI_CHAR.test(g));
    const flexOrClipped = /(^|\s)(inline-)?(flex|grid)(\s|$)|(^|\s)truncate(\s|$)/.test(cls);
    // `.tp` จาก ThaiPhrases หรือวลีที่ผู้เขียนห่อ inline-block/nowrap เองก็นับว่าห่อแล้ว
    const wrapped = /class="[^"]*\b(tp|inline-block|whitespace-nowrap)\b/.test(inner);
    if (groups.length >= 2 && !flexOrClipped && !wrapped) {
      out.push(`<${tag}> ไม่ได้ห่อวลี: "${text.slice(0, 60)}"`);
    }
    if (tag !== "h3") {
      const longest = groups.reduce((a, g) => (g.length > a.length ? g : a), "");
      if (longest.length > MAX_THAI_RUN) out.push(`<${tag}> วลีติดกันยาว ${longest.length} ตัวอักษร: "${longest}"`);
    }
  }
  return out;
}

function runThaiHeadingSelfTest(): string[] {
  const fails: string[] = [];
  const cases: Array<[string, boolean]> = [
    ['<h1 class="x">ผังการเปิดไพ่ทาโรต์ 26 รูปแบบ</h1>', true],
    ['<h1 class="x"><span class="tp">ผังการเปิดไพ่ทาโรต์</span> <span class="tp">26&nbsp;รูปแบบ</span></h1>', false],
    ['<h2 class="flex gap-2">ไพ่ชุดใหญ่ เมเจอร์</h2>', false],
    ["<h2>ดูดวง</h2>", false],
    ["<h2>Tarot spreads for love</h2>", false],
    [`<h2><span class="tp">${"ก".repeat(MAX_THAI_RUN + 1)}</span></h2>`, true],
  ];
  for (const [html, shouldFail] of cases) {
    const failed = scanThaiHeadings(html).length > 0;
    if (failed !== shouldFail) fails.push(`${shouldFail ? "ต้องฟ้องแต่ไม่ฟ้อง" : "ไม่ควรฟ้องแต่ฟ้อง"}: ${html.slice(0, 70)}`);
  }
  const g = groupThaiPhrases("ไพ่ 78 ใบ แม่น ๆ (ครบ)");
  if (g.join("|") !== "ไพ่|78\u00a0ใบ|แม่น\u00a0ๆ\u00a0(ครบ)".replace(/\u00a0/g, "\u00a0")) {
    // "(ครบ)" ขึ้นต้นด้วยวงเล็บเปิด ไม่ผูกกับคำก่อน — เทียบเฉพาะสองกฎหลัก
    if (!(g.includes("78\u00a0ใบ") && g.some((x) => x.startsWith("แม่น\u00a0ๆ")))) {
      fails.push(`groupThaiPhrases ผูกตัวเลข/ไม้ยมกผิด: ${JSON.stringify(g)}`);
    }
  }
  return fails;
}

if (process.argv[1] && process.argv[1].endsWith("test-thai-glyph-clipping.ts")) {
  if (!fs.existsSync(SRC)) {
    console.error(`\n❌ ไม่พบโฟลเดอร์ ${SRC} — ด่านนี้ตรวจอะไรไม่ได้เลย จึงถือว่าตก`);
    process.exit(1);
  }

  if (!selfTest()) {
    console.error("\n❌ ด่านนี้ตรวจตัวเองไม่ผ่าน — ตัวตรวจเสียก่อนจะไปตรวจโค้ดจริง");
    process.exit(1);
  }
  console.log("   🧪 ตัวตรวจผ่านเคสพิสูจน์ตัวเอง 8 เคส (ฟ้อง 4 · ผ่าน 4)");

  const tsxFiles = walkTsx(SRC);
  assertNonEmptyCorpus("ไฟล์ .tsx ใน src/", tsxFiles, "ตรวจว่า walkTsx() ชี้ไปที่ src/ จริง");

  const findings = scanClippedThaiText(tsxFiles);

  if (findings.length > 0) {
    console.error(`\n❌ พบกล่องข้อความที่จะเฉือนหัวสระ/วรรณยุกต์ไทยทิ้ง ${findings.length} จุด\n`);
    for (const f of findings) {
      console.error(`   ${f.file}:${f.line}`);
      console.error(`      ${f.cls} (${f.value}) ต่ำกว่าพื้น ${MIN_LEADING} ในกล่องที่ตัดของล้นทิ้ง`);
      console.error(`      แก้: ใช้ leading-[1.7] (ค่ากลางของบ้านนี้) หรือเพิ่ม py- ให้หมึกมีที่ล้น\n`);
    }
    process.exit(1);
  }

  console.log(`✅ ไม่มีกล่องข้อความที่ตัดของล้นทิ้งพร้อม line-height ต่ำกว่า ${MIN_LEADING}`);

  const truncFailures = [...runThaiTruncateCases(), ...scanCanvasCharSlice()];
  if (truncFailures.length > 0) {
    console.error(`\n❌ การตัดข้อความไทยยังเฉือนคลัสเตอร์ขาด ${truncFailures.length} จุด\n`);
    for (const f of truncFailures) console.error(`   ${f}\n`);
    process.exit(1);
  }

  console.log(`✅ การย่อข้อความวัดจากความกว้างจริงและไม่ทิ้งสระ/วรรณยุกต์ลอย (${TRUNC_CASES.length} เคส)`);

  const headingSelfTest = runThaiHeadingSelfTest();
  if (headingSelfTest.length > 0) {
    console.error("\n❌ ตัวตรวจหัวข้อไทยตรวจตัวเองไม่ผ่าน");
    for (const f of headingSelfTest) console.error(`   ${f}`);
    process.exit(1);
  }

  const dist = path.join(ROOT, "dist");
  if (!fs.existsSync(dist)) {
    if (process.env.CI) {
      console.error("\n❌ ไม่มี dist/ — CI ต้องบิลด์ก่อนรันด่านนี้ ไม่งั้นส่วนหัวข้อไทยไม่ได้ตรวจอะไรเลย (INC-0189b)");
      process.exit(1);
    }
    console.warn("⚠️  ข้ามส่วนหัวข้อไทย — ยังไม่มี dist/ (รัน `npm run build:astro` ก่อนถ้าจะตรวจครบ)");
  } else {
    const htmlFiles = walkThaiHtml(dist);
    assertNonEmptyCorpus("หน้า HTML ภาษาไทยใน dist/", htmlFiles, "ตรวจว่า walkThaiHtml() ชี้ไปที่ dist/ จริง");
    const headingFindings = htmlFiles.flatMap((f) =>
      scanThaiHeadings(fs.readFileSync(f, "utf-8")).map((msg) => `${path.relative(ROOT, f)} · ${msg}`),
    );
    if (headingFindings.length > 0) {
      console.error(`\n❌ หัวข้อไทยที่จะหักกลางวลี ${headingFindings.length} จุด\n`);
      for (const f of headingFindings.slice(0, 40)) console.error(`   ${f}`);
      console.error("\n   แก้: ห่อเนื้อหัวข้อด้วย <ThaiPhrases> (src/components/ui/ThaiPhrases.tsx)");
      console.error("        หรือเว้นวรรคตรงรอยต่อวลีถ้าข้อความยาวติดกันเกิน " + MAX_THAI_RUN + " ตัวอักษร\n");
      process.exit(1);
    }
    console.log(`✅ หัวข้อไทยใน ${htmlFiles.length} หน้าห่อวลีครบ และไม่มีวลีติดกันยาวเกิน ${MAX_THAI_RUN} ตัวอักษร`);
  }
}
