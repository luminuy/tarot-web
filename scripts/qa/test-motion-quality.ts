/**
 * QA — ยามเฝ้าคุณภาพโมชั่นทั้งเว็บ (Motion Quality Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้
 * เว็บนี้เสียเฟรมมาแล้ว 3 รอบใหญ่จาก "อนิเมชันที่ดูไม่มีพิษภัย" และทุกรอบจบด้วย
 * กฎป้องกันถาวรที่เขียนไว้ในเอกสาร แล้วก็ถูกละเมิดซ้ำอยู่ดีเพราะไม่มีเครื่องตรวจ:
 *
 *   INC-0056 — backdrop-blur พื้นที่ใหญ่ (หัวเว็บ · ฉากหลังโมดัล) วัดจริง fps 30 → 58 เมื่อถอดออก
 *              กฎเขียนไว้แล้ว แต่ตอนตรวจรอบนี้ยังพบ backdrop-blur ค้างอยู่ 10 จุด
 *   INC-0108 — `translate3d(0,0,0)` ถูก Lightning CSS ยุบเหลือ transform 2D
 *              เลเยอร์ GPU ที่ตั้งใจบังคับจึงไม่เคยเกิดขึ้นจริงเลย ต้องเขียน `translateZ(0)` เท่านั้น
 *   INC-0053 — อ่านค่าที่ขึ้นกับเบราว์เซอร์ระหว่างเรนเดอร์ของคอมโพเนนต์ที่ถูก SSR
 *
 * **บทเรียนเดียวกันกับ test-will-change.ts: กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน**
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ (6 ข้อ)
 *
 *  1. ห้ามใช้ `transition-all` ใน .tsx และห้าม `transition: all` ในไฟล์ CSS
 *     `all` = "อนิเมตทุกคุณสมบัติที่เปลี่ยน" รวมถึง width / height / padding / border-width
 *     ซึ่งบังคับให้เบราว์เซอร์คำนวณ layout ใหม่ทุกเฟรม · ใช้ `transition` เฉย ๆ แทน
 *     (Tailwind v4 ให้ชุดคุณสมบัติที่ปลอดภัยมาอยู่แล้ว: สี · opacity · box-shadow · transform · filter)
 *     ถ้าจงใจอนิเมตคุณสมบัติเชิง layout จริง ๆ ให้ระบุชื่อตรง ๆ เช่น `transition-[width]`
 *     เพื่อให้คนอ่านโค้ดเห็นว่า "ตั้งใจ" ไม่ใช่เผลอ
 *
 *  2. ห้ามใช้ backdrop-filter / backdrop-blur ที่ใดก็ตามใน src (INC-0056)
 *     ทุกจุดที่เคยใช้ในเว็บนี้เป็นพื้นที่ใหญ่ที่มีของลอยทับหรือมีอนิเมชันวิ่งอยู่ทั้งหมด
 *     ถ้าอนาคตมีเคสที่ "เล็กจริงและนิ่งจริง" ให้เพิ่มลง ALLOWLIST พร้อมตัวเลข fps ที่วัดมา
 *
 *  3. ห้ามใช้ลูป `repeat: Infinity` ของ motion — ลูปไม่รู้จบต้องเป็น CSS keyframes เท่านั้น
 *     motion คำนวณค่าใหม่บนเธรดหลักทุกเฟรมตลอดเวลาที่ element อยู่บนจอ
 *     ส่วน CSS keyframes ที่แตะเฉพาะ transform/opacity เบราว์เซอร์ยกไปให้ compositor ทำเอง
 *
 *  4. ห้ามเขียน `translate3d(0, 0, 0)` ในไฟล์ CSS (INC-0108) — ต้องใช้ `translateZ(0)`
 *
 *  5. ห้ามให้ motion อนิเมตคุณสมบัติที่บังคับ layout/paint ใหม่ทั้งกล่อง
 *     (`width` · `boxShadow` · `top` · `left` · `padding` · `margin` · `filter`)
 *     ใช้ `scaleX`/`scaleY` แทน width/height · ใช้ชั้นเงาซ้อนที่อนิเมต opacity แทน boxShadow
 *     `height: "auto"` ของแถบยุบ/ขยายได้รับผ่อนผันไว้ใน ALLOWLIST (ดูเหตุผลข้างล่าง)
 *
 *  7. ห้าม `<AnimatePresence mode="wait">` ที่ไม่มี `exit` อยู่ข้างในเลยสักตัว
 *     `mode="wait"` มีหน้าที่เดียวคือ "รอตัวเก่าเล่นอนิเมชันขาออกให้จบก่อนค่อยเข้าตัวใหม่"
 *     ถ้าไม่มีขาออก มันจึงไม่ได้ทำอะไรเลย นอกจากแบกความเสี่ยงมาเปล่า ๆ —
 *     `AnimatePresence mode="wait"` คือสาเหตุรากของ INC-0015 ที่ทำให้พิธีดูดวงค้างตายทั้งขั้น
 *     (exit-transition deadlock กับ motion@13 + React 19.2)
 *
 *  6. โทเคนจังหวะกลางต้องยังผูกอยู่ — `--default-transition-duration` และ
 *     `--default-transition-timing-function` ต้องถูกประกาศใน globals.css
 *     ถ้าใครลบทิ้ง ทุกจุดที่เขียน `transition` เฉย ๆ จะเด้งกลับไปใช้ค่าเริ่มต้นของ Tailwind
 *     (150ms + easing คนละตัว) แล้วเว็บจะกลับไป "จังหวะไม่เท่ากัน" เงียบ ๆ โดยไม่มีใครรู้
 *
 * 🔒 หลักการ Ratchet: จุดละเมิดเก่าใส่ ALLOWLIST ได้ แต่ห้ามเพิ่มรายการใหม่
 *
 * รันด้วย: npx tsx scripts/qa/test-motion-quality.ts
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

interface Violation {
  rule: string;
  file: string;
  line: number;
  code: string;
  hint: string;
}

/**
 * รายการผ่อนผันแบบ Ratchet
 * ทุกรายการต้องมีเหตุผลที่ "วัดมาแล้ว" หรืออธิบายได้ว่าทำไมทางที่ถูกกว่าใช้ไม่ได้
 */
const ALLOWLIST: { file: string; needle: string; reason: string }[] = [];

/** คุณสมบัติที่ห้ามให้ motion อนิเมต (บังคับ layout หรือ paint ใหม่ทั้งกล่อง) */
const FORBIDDEN_MOTION_PROPS = [
  "width",
  "height",
  "boxShadow",
  "padding",
  "margin",
  "top",
  "left",
  "right",
  "bottom",
];

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

function rel(p: string): string {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

function isAllowed(file: string, needle: string): boolean {
  return ALLOWLIST.some((a) => file === a.file && needle === a.needle);
}

/** ข้ามบรรทัดที่เป็นคอมเมนต์ล้วน — กฎพวกนี้ถูกอธิบายไว้ในคอมเมนต์หลายที่ */
function isCommentLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith("*") || t.startsWith("//") || t.startsWith("/*");
}

function checkTsx(violations: Violation[]): void {
  for (const file of walk(SRC, [".tsx", ".ts"])) {
    const r = rel(file);
    const lines = fs.readFileSync(file, "utf-8").split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isCommentLine(line)) continue;
      const at = { file: r, line: i + 1, code: line.trim().slice(0, 160) };

      // กฎ 1
      if (/\btransition-all\b/.test(line) && !isAllowed(r, "transition-all")) {
        violations.push({
          ...at,
          rule: "1 · transition-all",
          hint: 'ใช้ `transition` เฉย ๆ (ชุดคุณสมบัติปลอดภัยของ Tailwind) หรือระบุชื่อตรง ๆ เช่น `transition-[width]` ถ้าตั้งใจจริง',
        });
      }

      // กฎ 2
      if (/backdrop-blur|backdropFilter|backdrop-filter/.test(line) && !isAllowed(r, "backdrop")) {
        violations.push({
          ...at,
          rule: "2 · backdrop-filter (INC-0056)",
          hint: "ใช้พื้นทึบแทน (เช่นคลาส `.modal-scrim`) — เบลอพื้นหลังบังคับให้เบราว์เซอร์วาดทั้งจอใหม่ทุกเฟรม",
        });
      }

      // กฎ 3
      if (/repeat:\s*Infinity/.test(line) && !isAllowed(r, "repeat-infinity")) {
        violations.push({
          ...at,
          rule: "3 · ลูปไม่รู้จบของ motion",
          hint: "ย้ายไปเป็น CSS keyframes ที่แตะเฉพาะ transform/opacity (ดูตัวอย่าง `.anim-badge-pulse` ใน globals.css)",
        });
      }

      // กฎ 5 — ดูเฉพาะบรรทัดที่อยู่ในบล็อก animate/initial/exit/whileHover/whileTap ของ motion
      const inMotionBlock = /(animate|initial|exit|whileHover|whileTap|whileInView)=\{\{/.test(line);
      const isBareProp = /^\s*(width|height|boxShadow|padding|margin|top|left|right|bottom):/.test(line);
      if (inMotionBlock || isBareProp) {
        for (const prop of FORBIDDEN_MOTION_PROPS) {
          const re = new RegExp(`(^|[{,\\s])${prop}:`);
          if (!re.test(line)) continue;
          // `isBareProp` อาจเป็น object ธรรมดาที่ไม่เกี่ยวกับ motion — นับเฉพาะที่อยู่ในไฟล์ที่ import motion
          if (isBareProp && !inMotionBlock) {
            const head = lines.slice(0, i).join("\n");
            if (!/from "motion\/react"/.test(head)) continue;
            // ต้องมีบล็อก motion เปิดค้างอยู่จริงในไม่กี่บรรทัดก่อนหน้า
            const window = lines.slice(Math.max(0, i - 6), i).join("\n");
            if (!/(animate|initial|exit|whileHover|whileTap|whileInView)=\{\{/.test(window)) continue;
          }
          if (isAllowed(r, prop)) continue;
          violations.push({
            ...at,
            rule: `5 · motion อนิเมต ${prop}`,
            hint:
              prop === "boxShadow"
                ? "วางชั้นเงาซ้อนไว้แล้วอนิเมตแค่ opacity (ดู TarotCard.tsx)"
                : "ใช้ transform (scaleX/scaleY/translate) แทน — compositor ทำได้โดยไม่แตะ layout",
          });
        }
      }
    }
  }
}

/**
 * กฎ 7 — `<AnimatePresence mode="wait">` ต้องมี `exit` อยู่ข้างในอย่างน้อยหนึ่งตัว
 * ตรวจจากบล็อกจริง (ตั้งแต่แท็กเปิดถึง `</AnimatePresence>` ที่ใกล้ที่สุด)
 */
function checkWaitWithoutExit(violations: Violation[]): void {
  for (const file of walk(SRC, [".tsx"])) {
    const r = rel(file);
    const text = fs.readFileSync(file, "utf-8");
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (isCommentLine(lines[i])) continue;
      if (!/<AnimatePresence[^>]*mode=["']wait["']/.test(lines[i])) continue;

      const closeAt = lines.findIndex((l, k) => k > i && l.includes("</AnimatePresence>"));
      const block = lines.slice(i, closeAt === -1 ? lines.length : closeAt + 1).join("\n");
      if (/\bexit=/.test(block)) continue;

      violations.push({
        rule: "7 · mode=\"wait\" ที่ไม่มี exit (INC-0015)",
        file: r,
        line: i + 1,
        code: lines[i].trim().slice(0, 160),
        hint: 'ไม่มีอนิเมชันขาออก `mode="wait"` จึงไม่ได้ทำอะไรเลย นอกจากเสี่ยง exit-transition deadlock — ถอด AnimatePresence ออกแล้วใช้คลาส `.anim-swap-rise-sm` แทน',
      });
    }
  }
}

function checkCss(violations: Violation[]): void {
  for (const file of walk(SRC, [".css"])) {
    const r = rel(file);
    const lines = fs.readFileSync(file, "utf-8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isCommentLine(line)) continue;
      const at = { file: r, line: i + 1, code: line.trim().slice(0, 160) };

      // กฎ 4
      if (/translate3d\(\s*0\s*(px)?\s*,\s*0\s*(px)?\s*,\s*0\s*(px)?\s*\)/.test(line)) {
        violations.push({
          ...at,
          rule: "4 · translate3d(0,0,0) (INC-0108)",
          hint: "เขียน `translateZ(0)` แทน — Lightning CSS ยุบ translate3d ที่แกน z เป็น 0 ให้เหลือ transform 2D ซึ่งไม่บังคับเลเยอร์ GPU",
        });
      }

      // กฎ 1 (ฝั่ง CSS) — `transition: all` เขียนได้ทั้งใน .tsx และในไฟล์ CSS
      // ⚠️ ช่องโหว่นี้เจอตอน "ตรวจของจริงด้วย Chromium" ไม่ใช่ตอนอ่านโค้ด:
      //    ด่านรุ่นแรกตรวจแต่คลาส `transition-all` ใน .tsx จึงมองไม่เห็น
      //    `.altar-card-porcelain { transition: all }` ที่ซ่อนอยู่ใน globals.css
      //    ทั้งที่คลาสนั้นถูกใช้ 16 จุด (หน้า /daily ใบเดียวมี 11 กล่อง)
      if (/transition(-property)?\s*:\s*all\b/.test(line)) {
        violations.push({
          ...at,
          rule: "1 · transition: all (ฝั่ง CSS)",
          hint: "ระบุชื่อคุณสมบัติที่เปลี่ยนจริงตรง ๆ เช่น `transition-property: border-color, box-shadow, transform;`",
        });
      }

      // กฎ 2 (ฝั่ง CSS)
      if (/backdrop-filter\s*:/.test(line)) {
        violations.push({
          ...at,
          rule: "2 · backdrop-filter (INC-0056)",
          hint: "ใช้พื้นทึบแทน",
        });
      }
    }
  }
}

/** กฎ 6 — โทเคนจังหวะกลางต้องยังอยู่ */
function checkTokens(violations: Violation[]): void {
  const file = path.join(SRC, "app", "globals.css");
  const css = fs.readFileSync(file, "utf-8");
  for (const token of ["--default-transition-duration", "--default-transition-timing-function"]) {
    const re = new RegExp(`^\\s*${token}\\s*:`, "m");
    if (!re.test(css)) {
      violations.push({
        rule: "6 · โทเคนจังหวะกลางหาย",
        file: rel(file),
        line: 0,
        code: token,
        hint: "ต้องประกาศใน @theme — ถ้าลบทิ้ง ทุกจุดที่เขียน `transition` เฉย ๆ จะเด้งกลับไปใช้ค่าเริ่มต้นของ Tailwind (150ms + easing คนละตัว)",
      });
    }
  }
}

function run(): void {
  console.log("🔍 ตรวจคุณภาพโมชั่นทั้งเว็บ (Motion Quality Guard)...\n");

  const violations: Violation[] = [];
  checkTsx(violations);
  checkWaitWithoutExit(violations);
  checkCss(violations);
  checkTokens(violations);

  if (violations.length > 0) {
    console.error(`❌ พบอนิเมชันที่ผิดกฎ ${violations.length} จุด:\n`);
    for (const v of violations) {
      console.error(`  [กฎ ${v.rule}] ${v.file}:${v.line}`);
      console.error(`    โค้ด: ${v.code}`);
      console.error(`    💡 ${v.hint}\n`);
    }
    process.exit(1);
  }

  for (const a of ALLOWLIST) {
    console.warn(`⚠️  ALLOWLIST ยังผ่อนผัน: ${a.file} (${a.needle}) — ${a.reason}`);
  }

  console.log(
    "\n✅ ผ่านทุกเกณฑ์: ไม่มี transition-all · ไม่มี backdrop-filter · ไม่มีลูปไม่รู้จบบนเธรดหลัก · ไม่มี translate3d(0,0,0) · ไม่มี motion อนิเมตคุณสมบัติเชิง layout · ไม่มี mode=\"wait\" ที่ไม่มี exit · โทเคนจังหวะกลางยังผูกอยู่\n"
  );
  process.exit(0);
}

run();
