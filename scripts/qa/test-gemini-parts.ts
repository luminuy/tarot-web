/**
 * QA — ยามเฝ้าการอ่านคำตอบจาก Gemini (Gemini Answer Parts Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้ (บทเรียน INC-0052)
 * Gemini 3.x เปิดโหมดคิด (thinking) เป็นค่าเริ่มต้น คำตอบที่ส่งกลับมาใน
 * `candidates[0].content.parts` จึงมีทั้ง part ความคิดภายใน (`thought: true`
 * บางชิ้นมีแต่ `thoughtSignature` ไม่มี `text` เลย) และ part คำตอบจริงปนกัน
 * โดย **ลำดับไม่แน่นอน** — `parts[0]` จึงไม่ใช่คำตอบเสมอไป
 *
 * `src/lib/ai/gemini.ts` (ทางคำอ่านไพ่) แก้เรื่องนี้ไปแล้วตั้งแต่ ISSUE-016
 * แต่ `chat/route.ts` และ `monthly-summary/route.ts` ยังอ่าน `parts[0].text` ตรง ๆ อยู่
 * ผลคือได้ค่าว่างทุกครั้ง → วนครบทุกโมเดล → ตกไปใช้คำตอบสำเร็จรูปออฟไลน์เงียบ ๆ
 * ผู้ใช้เลยเจอคำตอบเดิมซ้ำ ๆ ทุกคำถาม และไม่มีอะไรบอกว่าไม่ได้คุยกับ AI จริง
 *
 * **บทเรียน: แก้ที่เดียวไม่พอ ถ้ายังมีที่อื่นเรียก API เดียวกันด้วยวิธีเดิม**
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ
 *  A) ห้ามอ่าน `content.parts[0]` (หรือ `parts?.[0]`) เพื่อเอาข้อความคำตอบ
 *     ต้องใช้ `extractGeminiAnswer()` / `joinGeminiAnswerParts()` จาก `@/lib/ai/gemini`
 *  B) ตัวช่วยทั้งสองต้องยังมีอยู่จริงและยังกรอง `thought` ออก
 *
 * รันด้วย: npx tsx scripts/qa/test-gemini-parts.ts
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const HELPER_FILE = "src/lib/ai/gemini.ts";

/** ไฟล์ที่เป็นเจ้าของตัวช่วยเอง จึงได้รับอนุญาตให้แตะ parts ตรง ๆ */
const INFRASTRUCTURE = [HELPER_FILE];

/** จับ `...content.parts[0]` และ `...content?.parts?.[0]` (เว้นวรรคยังไงก็จับได้) */
const BAD_PARTS_READ = /content\s*\??\.\s*parts\s*\??\.?\s*\[\s*0\s*\]/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const violations: string[] = [];

for (const file of walk(SRC)) {
  const rel = path.relative(process.cwd(), file).split(path.sep).join("/");
  if (INFRASTRUCTURE.includes(rel)) continue;

  const lines = fs.readFileSync(file, "utf-8").split("\n");
  lines.forEach((line, i) => {
    if (BAD_PARTS_READ.test(line)) {
      violations.push(
        `${rel}:${i + 1} — อ่าน content.parts[0] ตรง ๆ · ให้ใช้ extractGeminiAnswer() จาก @/lib/ai/gemini แทน\n      ${line.trim()}`,
      );
    }
  });
}

// ── ด่าน B: ตัวช่วยต้องยังอยู่และยังกรอง thought ออกจริง ──
const helperSrc = fs.readFileSync(path.join(process.cwd(), HELPER_FILE), "utf-8");
for (const needed of ["export function joinGeminiAnswerParts", "export function extractGeminiAnswer"]) {
  if (!helperSrc.includes(needed)) {
    violations.push(`${HELPER_FILE} — หายไป: \`${needed}\` (ห้ามลบ มีที่อื่นเรียกใช้อยู่)`);
  }
}
if (!/thought\s*!==\s*true/.test(helperSrc)) {
  violations.push(
    `${HELPER_FILE} — joinGeminiAnswerParts ไม่ได้กรอง part ความคิด (\`thought !== true\`) ออกแล้ว`,
  );
}

if (violations.length > 0) {
  console.error("\n❌ พบการอ่านคำตอบ Gemini ผิดวิธี (บทเรียน INC-0052)\n");
  violations.forEach((v) => console.error(`   • ${v}`));
  console.error(
    "\n   วิธีแก้: `const { extractGeminiAnswer } = await import(\"@/lib/ai/gemini\")` แล้วใช้ `extractGeminiAnswer(data)`\n",
  );
  process.exit(1);
}

console.log("✅ ทุกจุดอ่านคำตอบ Gemini ผ่านตัวช่วยที่กรอง part ความคิดออกแล้ว");
