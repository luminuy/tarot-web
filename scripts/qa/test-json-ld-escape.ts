/**
 * 🧾 ด่าน JSON-LD ต้องผ่านตัวเขียนที่ escape แล้วเท่านั้น (T-17)
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องมีด่านนี้
 *
 * รอบตรวจ 2026-09-16 พบว่าทุกบล็อก JSON-LD ในรีโป (~20 ไฟล์) เขียนด้วย
 * `JSON.stringify(x)` ดิบ ๆ ลง `dangerouslySetInnerHTML` โดยไม่ escape `<` เลย
 *
 * เนื้อหาใน `<script>` ไม่ถูกตีความเป็น HTML entity **แต่เบราว์เซอร์ปิดบล็อกสคริปต์
 * ทันทีที่เจอสตริง `</script`** ไม่ว่าจะอยู่กลาง string literal ก็ตาม ค่าที่ผู้ใช้
 * ควบคุมได้ตัวเดียวที่มีคำนั้นจึงหลุดออกมาเป็น HTML ของหน้าได้
 *
 * วันนี้ค่าที่ไหลเข้ามีแค่ `reader.displayName` (เขียนผ่าน API แอดมิน) จึงยังไม่ร้ายแรง
 * แต่สเปก Marketplace วางไว้แล้วว่าจะเปิดให้แม่หมอแก้โปรไฟล์เอง — วันนั้นมันจะกลายเป็น
 * ช่องโหว่ระดับสูงทันทีโดยไม่มีใครกลับมาแก้ไฟล์ทั้ง 20 ไฟล์
 *
 * ## ด่านนี้ตรวจอะไร
 *
 * ห้ามมี `dangerouslySetInnerHTML` ที่รับค่าจาก `JSON.stringify(` ตรง ๆ
 * ต้องเรียกผ่าน `jsonLdScript()` (`src/lib/seo/json-ld.ts`) เท่านั้น
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "astro"];
const HELPER = "src/lib/seo/json-ld.ts";

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass++;
    console.log(`✅ ${label}`);
  } else {
    fail++;
    console.log(`❌ ${label}${detail ? `\n   ${detail}` : ""}`);
  }
}

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|astro)$/.test(name)) out.push(full);
  }
  return out;
}

console.log("🧾 [QA] JSON-LD ต้องถูก escape ก่อนฝังลงหน้าเว็บ\n");

check(
  `มีตัวเขียนกลางอยู่จริง (${HELPER})`,
  fs.existsSync(path.join(ROOT, HELPER)),
  "ไฟล์นี้คือแหล่งความจริงเดียวของการ escape — หายเมื่อไหร่ทุกหน้ากลับไปเสี่ยงทันที",
);

// ตัวเขียนกลางต้อง escape ครบทั้งสามตัวจริง ๆ ไม่ใช่มีไฟล์เฉย ๆ
const helperSrc = fs.existsSync(path.join(ROOT, HELPER))
  ? fs.readFileSync(path.join(ROOT, HELPER), "utf-8")
  : "";
for (const [label, needle] of [
  ["<", "u003c"],
  [">", "u003e"],
  ["&", "u0026"],
] as const) {
  check(`ตัวเขียนกลาง escape อักขระ \`${label}\``, helperSrc.includes(needle));
}

const offenders: string[] = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const rel = path.relative(ROOT, file);
    if (rel === HELPER) continue;
    const src = fs.readFileSync(file, "utf-8");
    const lines = src.split("\n");
    lines.forEach((line, i) => {
      // `__html: JSON.stringify(...)` หรือ `dangerouslySetInnerHTML={{ __html: JSON.stringify`
      if (/__html:\s*JSON\.stringify\s*\(/.test(line)) {
        offenders.push(`${rel}:${i + 1}`);
      }
    });
  }
}

check(
  "ไม่มี `JSON.stringify` เปล่าใน `dangerouslySetInnerHTML` เหลืออยู่",
  offenders.length === 0,
  offenders.length > 0
    ? `เจอ ${offenders.length} จุด — เปลี่ยนเป็น jsonLdScript() ที่ escape แล้ว:\n   ${offenders.join("\n   ")}`
    : "",
);

// ต้องมีคนเรียกใช้จริง ไม่ใช่สร้างไฟล์ทิ้งไว้แล้วไม่มีใครใช้
let callers = 0;
for (const dir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const rel = path.relative(ROOT, file);
    if (rel === HELPER) continue;
    if (fs.readFileSync(file, "utf-8").includes("jsonLdScript(")) callers++;
  }
}
check(`มีไฟล์ที่เรียก jsonLdScript() จริง (${callers} ไฟล์)`, callers >= 10);

console.log(`\n${pass}/${pass + fail} ผ่าน`);
if (fail > 0) process.exit(1);
