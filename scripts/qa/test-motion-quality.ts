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
 *  8. `transform` ที่ประกอบจาก custom property และมี `transition` อยู่ด้วย
 *     ตัวแปรทุกตัวที่ใช้ต้องประกาศด้วย `@property` เสมอ
 *
 *     🚨 กับดักที่เกือบหลุดขึ้น production จริงในรอบนี้:
 *     custom property ที่ไม่ได้ประกาศ `@property` เบราว์เซอร์ถือเป็น "ข้อความที่เอาไปแทนที่"
 *     ไม่ใช่ค่าที่ไล่ระดับได้ · พอค่ามันเปลี่ยน คุณสมบัติที่อ้างถึงมันจะถูกคำนวณใหม่ทันที
 *     **โดยไม่ผ่าน transition** — ไพ่จึงกระโดดพลิกแทนที่จะค่อย ๆ หมุน
 *     ทั้งที่โค้ดอ่านแล้วถูกทุกบรรทัดและ `transition-duration` ก็อ่านค่าได้ 0.55s จริง
 *     จับได้เพราะเก็บตัวอย่าง `transform` ทุกเฟรมด้วย Chromium เท่านั้น
 *     (ดูด้วยตาเปล่าหรือเชื่อว่าตั้ง duration แล้วต้องทำงาน = ปล่อยผ่าน)
 *
 *  6. โทเคนจังหวะกลางต้องยังผูกอยู่ — `--default-transition-duration` และ
 *     `--default-transition-timing-function` ต้องถูกประกาศใน globals.css
 *     ถ้าใครลบทิ้ง ทุกจุดที่เขียน `transition` เฉย ๆ จะเด้งกลับไปใช้ค่าเริ่มต้นของ Tailwind
 *     (150ms + easing คนละตัว) แล้วเว็บจะกลับไป "จังหวะไม่เท่ากัน" เงียบ ๆ โดยไม่มีใครรู้
 *
 *  9. คีย์เฟรมของ element ที่จัดกลางด้วยยูทิลิตี้ `translate-*` ของ Tailwind
 *     ห้ามมี `transform: translate…(%)` ซ้ำเข้าไปอีก
 *
 *     🚨 กับดักที่หลุดขึ้น production จริง — INC-0123 (แถบแจ้งเตือนไปนอนคร่อมขอบซ้ายจอ):
 *     Tailwind v4 คอมไพล์ `-translate-x-1/2` เป็นคุณสมบัติเดี่ยว `translate:` **ไม่ใช่** `transform:`
 *     ซึ่งตามสเปกเบราว์เซอร์คิด `translate → rotate → scale → transform` แล้วคูณต่อกัน
 *     ไม่ใช่ทับกันแบบสมัย v3 · คีย์เฟรมที่พา -50% ไปด้วย "เพื่อกันกล่องวาป" จึงกลายเป็น
 *     -100% กล่องเลื่อนไปครึ่งตัวเอง และเพราะ fill-mode เป็น `both` มันค้างผิดที่ถาวร
 *     ให้คีย์เฟรมขยับแค่แกน Y / scale / opacity ปล่อยการจัดกลางเป็นหน้าที่ของคลาส
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
const ALLOWLIST: { file: string; needle: string; reason: string }[] = [
  // ว่างเปล่าคือสถานะที่ถูกต้อง — หนี้ของกฎ 9 (หน้าต่างลอย 4 บานที่ขาออกไม่เล่น)
  // ถูกเก็บกวาดครบแล้วในรอบเดียวกับ INC-0126 · ห้ามเพิ่มรายการใหม่โดยไม่มีตัวเลขที่วัดมาแล้วกำกับ
];

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

/**
 * กฎ 8 — ตัวแปรที่ถูกใช้ใน `transform` ของ rule ที่มี `transition` ต้องประกาศ `@property`
 * ไม่งั้น transition จะไม่ทำงานเลยแบบเงียบ ๆ (ดูคำอธิบายกับดักที่หัวไฟล์)
 */
function checkUnregisteredTransformVars(violations: Violation[]): void {
  for (const file of walk(SRC, [".css"])) {
    const r = rel(file);
    const css = fs.readFileSync(file, "utf-8");
    const registered = new Set(
      [...css.matchAll(/@property\s+(--[\w-]+)/g)].map((m) => m[1]),
    );

    // แยกเป็นบล็อก selector { ... } แบบหยาบ ๆ พอสำหรับไฟล์ CSS ที่เขียนด้วยมือ
    const blockRe = /([^{}]+)\{([^{}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = blockRe.exec(css)) !== null) {
      const [, selector, body] = m;
      if (!/\btransition\b/.test(body)) continue;

      const transformDecl = body.match(/(^|;)\s*transform\s*:([^;]*)/);
      if (!transformDecl) continue;

      // transition ต้องครอบคลุม transform จริง (หรือเป็น shorthand ที่ระบุ transform)
      const coversTransform = /transition(-property)?\s*:[^;]*\b(transform|all)\b/.test(body);
      if (!coversTransform) continue;

      for (const v of transformDecl[2].matchAll(/var\(\s*(--[\w-]+)/g)) {
        const name = v[1];
        if (registered.has(name)) continue;
        const line = css.slice(0, m.index).split("\n").length;
        violations.push({
          rule: "8 · ตัวแปรใน transform ไม่ได้ประกาศ @property",
          file: r,
          line,
          code: `${selector.trim().slice(0, 60)} { transform: … ${name} … }`,
          hint: `ประกาศ \`@property ${name} { syntax: "<angle>"; inherits: false; initial-value: 0deg; }\` (ปรับ syntax ตามชนิดค่า) ไม่งั้น transition จะไม่ทำงานเลยแบบเงียบ ๆ`,
        });
      }
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

/**
 * กฎ 9 — คีย์เฟรมห้ามจัดกลางซ้ำกับยูทิลิตี้ `translate-*` ของ Tailwind
 *
 * ตรวจแบบไขว้ระหว่างสองฝั่ง เพราะฝั่งเดียวพิสูจน์อะไรไม่ได้เลย:
 *   ฝั่ง CSS  — `.anim-xxx` ผูกกับ `@keyframes` ชื่อไหน และคีย์เฟรมนั้นมี translate เป็น % ไหม
 *   ฝั่ง TSX  — element ที่ใส่ `.anim-xxx` นั้นใส่ `-translate-x-1/2` (หรือพี่น้อง) ด้วยหรือเปล่า
 * เจอครบทั้งสองฝั่งเมื่อไหร่ = ระยะจะถูกคูณสองแน่นอน (translate + transform คนละคุณสมบัติกัน)
 */
function checkKeyframeCenteringConflict(violations: Violation[]): void {
  // ── ฝั่ง CSS ────────────────────────────────────────────────────────────
  /** ชื่อคีย์เฟรม → มี translate ที่เป็นเปอร์เซ็นต์อยู่ใน transform ไหม */
  const keyframeShiftsByPercent = new Map<string, string>();
  /** ชื่อคลาส (ไม่มีจุดนำหน้า) → รายชื่อคีย์เฟรมที่มันเรียกใช้ */
  const classAnimations = new Map<string, string[]>();

  for (const file of walk(SRC, [".css"])) {
    const css = fs.readFileSync(file, "utf-8");

    for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)) {
      const [, name, body] = m;
      for (const decl of body.matchAll(/transform\s*:([^;}]*)/g)) {
        const hit = decl[1].match(/translate[XY]?\(\s*-?[\d.]+%/);
        if (hit) keyframeShiftsByPercent.set(name, hit[0]);
      }
    }

    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const [, selector, body] = m;
      const decl = body.match(/animation(?:-name)?\s*:([^;}]*)/);
      if (!decl) continue;
      const names = decl[1].split(/[\s,]+/).filter(Boolean);
      for (const cls of selector.matchAll(/\.([\w-]+)/g)) {
        classAnimations.set(cls[1], [...(classAnimations.get(cls[1]) ?? []), ...names]);
      }
    }
  }

  // ── ฝั่ง TSX ────────────────────────────────────────────────────────────
  const TAILWIND_TRANSLATE = /(^|[\s"'`{])-?translate-[xy]-[\w./[\]%-]+/;

  for (const file of walk(SRC, [".tsx"])) {
    const r = rel(file);
    const lines = fs.readFileSync(file, "utf-8").split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (isCommentLine(lines[i])) continue;

      for (const hit of lines[i].matchAll(/\b(anim-[\w-]+)\b/g)) {
        const cls = hit[1];
        const animations = classAnimations.get(cls);
        if (!animations) continue;

        const guilty = animations.find((n) => keyframeShiftsByPercent.has(n));
        if (!guilty) continue;

        // className ของกล่องเดียวกันมักกินหลายบรรทัด — มองรอบ ๆ จุดที่เจอคลาสอนิเมชัน
        const window = lines.slice(Math.max(0, i - 8), Math.min(lines.length, i + 9)).join("\n");
        if (!TAILWIND_TRANSLATE.test(window)) continue;
        if (isAllowed(r, cls)) continue;

        violations.push({
          rule: "9 · คีย์เฟรมจัดกลางซ้ำกับ translate ของ Tailwind",
          file: r,
          line: i + 1,
          code: `${cls} → @keyframes ${guilty} { transform: … ${keyframeShiftsByPercent.get(guilty)}… }`,
          hint: `Tailwind v4 คอมไพล์ \`translate-*\` เป็นคุณสมบัติ \`translate:\` ซึ่งเบราว์เซอร์คูณต่อกับ \`transform:\` ของคีย์เฟรม (ไม่ได้ทับกันแบบ v3) ระยะจึงกลายเป็นสองเท่าและค้างถาวรเพราะ fill-mode \`both\` — เอา translate ที่เป็น % ออกจาก @keyframes ${guilty} ให้เหลือแค่แกน Y / scale / opacity`,
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

/**
 * กฎ 9 — ห้าม `if (!isOpen) return null` อยู่**เหนือ** `AnimatePresence` (INC-0126)
 *
 * 🚨 นี่คือบั๊กที่อ่านโค้ดแล้วมองไม่เห็น: `exit={{...}}` เขียนไว้ครบทุกบรรทัด ดูเหมือนทำงาน
 * แต่พอสถานะปิด คอมโพเนนต์คืน `null` ทั้งก้อน → `AnimatePresence` หายไปพร้อมลูกในเฟรมเดียวกัน
 * มันจึงไม่มีอะไรค้างไว้เล่นขาออก · หน้าต่างดับหายวับแทนที่จะค่อย ๆ จางไป
 * วัดจริงที่ `AuthModal` ก่อนแก้: หลังกดปิด อยู่ใน DOM แค่ 41ms และ opacity มีค่าเดียว
 * (หลังแก้: 270ms · 12 ขั้น)
 *
 * ทางที่ถูก: ย้ายเงื่อนไขเข้าไป**ข้างใน** — `<AnimatePresence>{isOpen && (...)}</AnimatePresence>`
 */
function checkExitKilledByEarlyReturn(violations: Violation[]): void {
  // เงื่อนไขที่สื่อถึง "สถานะเปิด/ปิดของหน้าต่าง" เท่านั้น — `if (!mantra) return null` ของการ์ดย่อยไม่เกี่ยว
  const OPEN_STATE_RE = /\b(isOpen|isVisible|isShown|isMounted)\b/;

  for (const file of walk(SRC, [".tsx"])) {
    const r = rel(file);
    const lines = fs.readFileSync(file, "utf-8").split("\n");

    const presenceAt = lines.findIndex((l) => !isCommentLine(l) && l.includes("<AnimatePresence"));
    if (presenceAt === -1) continue;

    for (let i = 0; i < presenceAt; i++) {
      const line = lines[i];
      if (isCommentLine(line)) continue;
      const m = /^\s*if\s*\((.+)\)\s*return null;/.exec(line);
      if (!m || !OPEN_STATE_RE.test(m[1])) continue;

      const code = line.trim();
      if (isAllowed(r, code)) continue;

      violations.push({
        rule: "9 · return null เหนือ AnimatePresence ฆ่าอนิเมชันขาออก (INC-0126)",
        file: r,
        line: i + 1,
        code: code.slice(0, 160),
        hint: "คืน null ทั้งก้อน = AnimatePresence หายไปพร้อมลูก · exit ที่เขียนไว้ไม่เคยทำงาน — ย้ายเงื่อนไขเข้าไปข้างใน `<AnimatePresence>{isOpen && (...)}</AnimatePresence>`",
      });
    }
  }
}

/**
 * กฎ 10 — ห้ามใช้คลาสของ `tailwindcss-animate` (INC-0126 รอบเก็บกวาด)
 *
 * 🚨 โปรเจกต์นี้**ไม่ได้ติดตั้งปลั๊กอินตัวนั้น** คลาสอย่าง `animate-in fade-in duration-200`
 * จึงไม่ผลิต CSS ออกมาสักบรรทัด — ไม่มีอนิเมชันเกิดขึ้นจริงแม้แต่เฟรมเดียว
 * แต่โค้ดอ่านแล้วเหมือนมีครบ คนอ่านต่อจึงไม่มีทางรู้ว่าของที่เห็นเด้งพรึ่บคือบั๊ก
 * พบตอนตรวจรอบนี้ 3 จุด (หน้าต่างชื่อเล่นของไพ่ด่วน · แผงผลไพ่ประจำตัว · เมนูมือถือแอดมิน)
 *
 * ทางที่ถูก: ใช้คลาส `.anim-*` ใน `globals.css` ซึ่งเป็น CSS keyframes จริงและถูกปิดอัตโนมัติ
 * เมื่อผู้ใช้เปิด `prefers-reduced-motion`
 */
function checkPhantomAnimateClasses(violations: Violation[]): void {
  const PHANTOM_RE = /\b(animate-in|animate-out|fade-in|fade-out|zoom-in|zoom-out|slide-in-from|slide-out-to)\b/;

  for (const file of walk(SRC, [".tsx"])) {
    const r = rel(file);
    const lines = fs.readFileSync(file, "utf-8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isCommentLine(line)) continue;
      // สนใจเฉพาะที่อยู่ในรายชื่อคลาสจริง ๆ — `cursor-zoom-out` ของ Tailwind แท้ต้องไม่โดนจับ
      const classAttr = /class(Name)?=/.test(line) || /^\s*["'`].*["'`],?\s*$/.test(line);
      if (!classAttr) continue;
      const m = PHANTOM_RE.exec(line.replace(/cursor-zoom-(in|out)/g, ""));
      if (!m) continue;
      if (isAllowed(r, m[0])) continue;

      violations.push({
        rule: "10 · คลาสผีของ tailwindcss-animate ที่ไม่ได้ติดตั้ง (INC-0126)",
        file: r,
        line: i + 1,
        code: line.trim().slice(0, 160),
        hint: `"${m[0]}" ไม่ผลิต CSS ออกมาเลยเพราะไม่มีปลั๊กอินตัวนั้นในโปรเจกต์ — ใช้คลาส .anim-* ใน globals.css แทน`,
      });
    }
  }
}

function run(): void {
  console.log("🔍 ตรวจคุณภาพโมชั่นทั้งเว็บ (Motion Quality Guard)...\n");

  const violations: Violation[] = [];
  checkTsx(violations);
  checkWaitWithoutExit(violations);
  checkExitKilledByEarlyReturn(violations);
  checkPhantomAnimateClasses(violations);
  checkUnregisteredTransformVars(violations);
  checkCss(violations);
  checkKeyframeCenteringConflict(violations);
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
    "\n✅ ผ่านทุกเกณฑ์: ไม่มี transition-all · ไม่มี backdrop-filter · ไม่มีลูปไม่รู้จบบนเธรดหลัก · ไม่มี translate3d(0,0,0) · ไม่มี motion อนิเมตคุณสมบัติเชิง layout · ไม่มี mode=\"wait\" ที่ไม่มี exit · ไม่มี return null เหนือ AnimatePresence · ไม่มีคลาสผีของ tailwindcss-animate · ไม่มีคีย์เฟรมที่จัดกลางซ้ำกับ translate ของ Tailwind · โทเคนจังหวะกลางยังผูกอยู่\n"
  );
  process.exit(0);
}

run();
