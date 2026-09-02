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
 *  C) ห้ามใช้ `CANDIDATE_GEMINI_MODELS` (รายการทุกตัวที่รู้จัก รวมตัวที่วัดแล้วว่าค้าง)
 *     ในเส้นทางที่มีผู้ใช้นั่งรอ — ใช้ `WORKING_GEMINI_MODELS` เท่านั้น
 *     อนุญาตเฉพาะด่านตรวจสุขภาพ ซึ่งต้องวัดทุกตัวต่อไปเพื่อรู้ว่าตัวไหนกลับมาใช้ได้ (บทเรียน INC-0053)
 *  D) ทุก fetch ที่ยิงไป generativelanguage.googleapis.com ต้องมี `signal:` (เพดานเวลา)
 *     ไม่งั้นถ้าโมเดลค้าง คำขอจะค้างไปเรื่อย ๆ ไม่มีที่สิ้นสุด (บทเรียน INC-0053)
 *
 * รันด้วย: npx tsx scripts/qa/test-gemini-parts.ts
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const HELPER_FILE = "src/lib/ai/gemini.ts";
/** ด่านตรวจสุขภาพเท่านั้นที่ได้รับอนุญาตให้ยิงทุกโมเดล รวมตัวที่รู้อยู่แล้วว่าค้าง */
const HEALTH_ROUTE = "src/app/api/admin/ai-health/route.ts";

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

// ── ด่าน C + D: สแกนซ้ำอีกรอบด้วยมุมมองทั้งไฟล์ ──
for (const file of walk(SRC)) {
  const rel = path.relative(process.cwd(), file).split(path.sep).join("/");
  const text = fs.readFileSync(file, "utf-8");

  // C) รายการโมเดลทุกตัว ใช้ได้เฉพาะด่านตรวจสุขภาพ
  if (rel !== HELPER_FILE && rel !== HEALTH_ROUTE && text.includes("CANDIDATE_GEMINI_MODELS")) {
    violations.push(
      `${rel} — ใช้ CANDIDATE_GEMINI_MODELS ในเส้นทางที่มีผู้ใช้รอ · ให้ใช้ WORKING_GEMINI_MODELS แทน`,
    );
  }

  // D) ทุก fetch ในไฟล์ที่คุยกับ Gemini ต้องมีเพดานเวลา
  //    ตรวจ "ทั้งไฟล์" ไม่ใช่แค่บรรทัดที่มี URL เพราะบางที่ประกอบ URL ไว้เป็นตัวแปรคนละบรรทัด
  //    (เช่น `const endpoint = ...` ใน gemini.ts ซึ่งอยู่ห่างจาก fetch ไป 20 บรรทัด)
  if (text.includes("generativelanguage.googleapis.com")) {
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (!line.includes("fetch(")) return;
      const window = lines.slice(i, i + 14).join("\n");
      if (!window.includes("signal:")) {
        violations.push(
          `${rel}:${i + 1} — fetch ในไฟล์ที่เรียก Gemini แต่ไม่มี \`signal:\` (ไม่มีเพดานเวลา) · ต้องใส่ AbortController + setTimeout`,
        );
      }
    });
  }
}

// ── ด่าน B: ตัวช่วยต้องยังอยู่และยังกรอง thought ออกจริง ──
const helperSrc = fs.readFileSync(path.join(process.cwd(), HELPER_FILE), "utf-8");
for (const needed of [
  "export function joinGeminiAnswerParts",
  "export function extractGeminiAnswer",
  "export const WORKING_GEMINI_MODELS",
  "export const GEMINI_FIRST_MODEL_TIMEOUT_MS",
]) {
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
  console.error("\n❌ พบการเรียก Gemini ที่ผิดกฎ (บทเรียน INC-0052 / INC-0053)\n");
  violations.forEach((v) => console.error(`   • ${v}`));
  console.error(
    "\n   วิธีแก้: อ่านคำตอบด้วย `extractGeminiAnswer(data)` · เลือกโมเดลจาก `WORKING_GEMINI_MODELS`" +
      "\n           · ทุก fetch ต้องมี AbortController + setTimeout แล้วส่ง `signal:` เข้าไป\n",
  );
  process.exit(1);
}

console.log(
  "✅ อ่านคำตอบ Gemini ถูกวิธี · ใช้เฉพาะโมเดลที่พิสูจน์แล้ว · ทุก fetch มีเพดานเวลา",
);
