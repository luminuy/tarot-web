/**
 * 🎯 ด่านพื้นที่กดขั้นต่ำ (Tap Target Gate — UX-06 · UX-07 · UX-15)
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องมีด่านนี้
 *
 * วัดจริงบน production เมื่อ 2026-09-11: **หน้าแรกหน้าเดียว** มีองค์ประกอบที่กดได้
 * เล็กกว่า 44px ถึง 44 จุด และจุดบอกตำแหน่งสไลด์เล็กเพียง 6 x 6 px
 * ขณะที่ทั้ง repo ไม่มี `min-h-[44px]` เลยแม้แต่จุดเดียว
 *
 * เจ้าของโปรเจกต์สั่งไว้ตั้งแต่ต้นว่า "คนมีอายุ สายตาไม่ดีอ่านยากมาก" จนต้องยก
 * สเกลตัวอักษรทั้งชุด — แต่ "พื้นที่กด" ซึ่งเป็นปัญหาเดียวกันสำหรับนิ้วที่ไม่นิ่ง
 * กลับไม่เคยถูกยกตาม
 *
 * ## ด่านนี้ตรวจอะไร
 *
 * `<button>` ที่มี padding แนวตั้งน้อย (`py-0` ถึง `py-2`) หรือขนาดตายตัวเล็ก
 * (`h-8` / `h-9` / `w-8` / `w-9`) **ต้องมีอย่างใดอย่างหนึ่ง**:
 *   - `tap-target` (ขยายขนาดจริง)
 *   - `tap-overlay` / `tap-overlay-y` (ขยายเฉพาะพื้นที่กดด้วย pseudo-element)
 *   - `min-h-11` / `min-h-12` / `h-11` / `h-12` หรือ `min-h-[44px]` ขึ้นไป
 *   - `min-w-6` + `h-6` (เคสจุดสไลด์ที่ผ่านเกณฑ์ 24x24 ของ WCAG 2.2 AA)
 *
 * ## ⚠️ กับดักที่ต้องรู้
 *
 * - **ปุ่มไอคอนในหัวเว็บห้ามขยายขนาดจริง** ความสูงหัวเว็บถูกตรึงที่ `--site-header-h`
 *   และมีด่าน `test-sticky-header` วัดของจริงอยู่ (INC-0109) ขยายตรง ๆ = ด่านนั้นแตก
 *   ต้องใช้ `tap-overlay` ซึ่งเป็น pseudo-element ไม่กินที่ใน flow
 * - **ปุ่มสองตัวที่วางชิดกันห้ามใช้ `tap-overlay` เต็มสองแกน** overlay จะทับกัน
 *   แล้วตัวที่มาทีหลังใน DOM จะขโมยคลิกของตัวหน้าไปเงียบ ๆ — ใช้ `tap-overlay-y` แทน
 * - **ลิงก์กลางย่อหน้า (inline text link) ได้รับการยกเว้นจาก SC 2.5.8 อยู่แล้ว**
 *   ด่านนี้จึงตรวจเฉพาะ `<button>` ไม่ตรวจ `<a>`
 * - เพดานเป็น ratchet เหมือนด่านพาเลต: **ลดได้อย่างเดียว ห้ามเพิ่ม**
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

/**
 * จำนวนปุ่มที่ยังไม่ได้แก้ — **ratchet: ลดได้อย่างเดียว ห้ามเพิ่ม**
 *
 * 📌 ทำไมยังเหลือ 89 จุด (และทำไมไม่กวาดรวดเดียว)
 * ---------------------------------------------------------------------------
 * ตอนตั้งด่านนี้ครั้งแรกมี 114 จุด กวาดไปแล้ว 24 จุดที่เป็น "พิลล์เรียงแนวนอน"
 * ในเส้นทางอ่านไพ่ ซึ่งเติม `tap-overlay-y` ได้อย่างปลอดภัยเพราะ overlay
 * ของปุ่มที่เรียงกันแนวนอนไม่มีทางทับกัน
 *
 * ที่เหลือ 89 จุดกวาดด้วย codemod ไม่ได้ เพราะส่วนใหญ่เป็น **ปุ่มที่ซ้อนกันแนวตั้ง
 * ในแผงแคบ ๆ** (สมุดบันทึก 15 จุด · หน้าต่างเข้าสู่ระบบ 6 จุด · สารานุกรม 5 จุด)
 * ถ้าเผลอใส่ `tap-overlay-y` ให้ปุ่มที่ห่างกันน้อยกว่า 44px overlay จะทับกัน
 * แล้วปุ่มที่มาทีหลังใน DOM จะ **ขโมยคลิกของปุ่มข้างบนไปเงียบ ๆ** ซึ่งแย่กว่าปุ่มเล็ก
 *
 * แต่ละจุดจึงต้องดูระยะห่างจริงก่อนตัดสินใจว่าจะขยาย overlay · ขยายขนาดจริง
 * · หรือจัดวางใหม่ — เป็นงานที่ต้องเห็นภาพ ไม่ใช่งาน codemod
 *
 * ⚠️ ห้ามขยับเพดานขึ้นเด็ดขาด ทุกครั้งที่แก้เพิ่มให้ปรับเพดานลงตามทันที
 */
const MAX_SMALL_BUTTONS = 89;

/** คลาสที่ถือว่า "แก้แล้ว" */
const SAFE =
  /\btap-target\b|\btap-overlay(?:-y)?\b|\bmin-h-1[1-9]\b|\bh-1[1-9]\b|\bmin-h-\[(?:4[4-9]|[5-9]\d|\d{3,})px\]|\bh-\[(?:4[4-9]|[5-9]\d|\d{3,})px\]|\bmin-w-6\b|\bpy-[3-9]\b|\bpy-1[0-9]\b|\bp-[3-9]\b/;

/** รูปแบบที่ส่อว่าปุ่มเล็กเกินไป */
const RISKY = /\bpy-(?:0|0\.5|1|1\.5|2|2\.5)\b|\bp-(?:1|1\.5|2|2\.5)\b|\bh-[89]\b|\bw-[89]\b/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** อ่านแท็กเปิดของ `<button>` โดยนับวงเล็บปีกกา เพื่อไม่ให้ `=>` ใน onClick ตัดแท็กผิดที่ */
function buttonTags(src: string): { tag: string; line: number }[] {
  const out: { tag: string; line: number }[] = [];
  const re = /<button\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    let depth = 0;
    let inStr: string | null = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (inStr) {
        if (c === inStr && src[i - 1] !== "\\") inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") inStr = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    out.push({ tag: src.slice(m.index, i + 1), line: src.slice(0, m.index).split("\n").length });
  }
  return out;
}

const offenders: string[] = [];
for (const file of walk(SRC)) {
  const src = fs.readFileSync(file, "utf8");
  for (const { tag, line } of buttonTags(src)) {
    const cls = [...tag.matchAll(/className=\{?[`"']([^`"']*)/g)].map((x) => x[1]).join(" ");
    if (!cls) continue;
    if (!RISKY.test(cls)) continue;
    if (SAFE.test(cls)) continue;
    offenders.push(`${path.relative(ROOT, file)}:${line}`);
  }
}

if (offenders.length > MAX_SMALL_BUTTONS) {
  console.error(
    `❌ QA FAILED — ปุ่มที่พื้นที่กดเล็กเกินเกณฑ์มี ${offenders.length} จุด เกินเพดาน ${MAX_SMALL_BUTTONS}`
  );
  console.error(`   ➔ เติม \`tap-target\` (ขยายจริง) หรือ \`tap-overlay\` / \`tap-overlay-y\` (ขยายเฉพาะพื้นที่กด)`);
  console.error(`   ➔ ปุ่มไอคอนในหัวเว็บต้องใช้ \`tap-overlay\` เท่านั้น — ขยายจริงจะทำให้ด่าน test-sticky-header แตก`);
  console.error(`   ➔ ห้ามขยับเพดานขึ้นเพื่อให้ด่านผ่าน`);
  for (const o of offenders.slice(0, 15)) console.error(`      • ${o}`);
  process.exit(1);
}

console.log("✅ ผ่าน — พื้นที่กดอยู่ในเกณฑ์");
console.log(
  `   - ปุ่มที่ยังไม่ได้แก้ ${offenders.length} จุด (เพดาน ${MAX_SMALL_BUTTONS})` +
    (offenders.length < MAX_SMALL_BUTTONS ? ` — ลดลงแล้ว ปรับเพดานลงเป็น ${offenders.length} ได้เลย` : "")
);
