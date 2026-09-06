/**
 * 📤 ตัวส่งออกงานแปลภาษาอังกฤษ (Translation Export / Status)
 * ---------------------------------------------------------------------------
 * ใช้ส่งงานให้ทีมแปลโดยไม่ต้องให้ทีมแปลเปิดโค้ดเลยสักไฟล์ และใช้ตรวจว่ารับงานกลับมาครบหรือยัง
 *
 *   npm run i18n:export   → เขียน docs/i18n/pending-en.json (ทุกข้อความที่ยังไม่มีฉบับอังกฤษ)
 *   npm run i18n:status   → สรุปว่าแปลไปแล้วกี่ % เหลืออะไรบ้าง
 *
 * ⚠️ ห้ามแก้ค่า `id` ในไฟล์ที่ส่งออกเด็ดขาด — ฝั่ง import ใช้ `id` จับคู่กลับเข้าโครงข้อมูล
 * ถ้า `id` เพี้ยน คำแปลจะไปลงผิดบทความ
 */
import fs from "node:fs";
import path from "node:path";

import { ARTICLES } from "../src/data/articles";
import { SPREAD_TOPICS } from "../src/data/spread-topics";

const OUT_DIR = path.join(process.cwd(), "docs", "i18n");
const OUT_FILE = path.join(OUT_DIR, "pending-en.json");

interface Unit {
  /** กุญแจจับคู่ตอน import กลับ — ห้ามแก้ */
  id: string;
  /** ไฟล์และฟิลด์ปลายทางที่คำแปลจะไปลง */
  target: string;
  /** ประเภทข้อความ ช่วยให้ผู้แปลรู้ว่าต้องคุมความยาวไหม */
  kind: "seo-title" | "meta-description" | "heading" | "tagline" | "prose" | "markdown" | "faq-q" | "faq-a";
  /** เพดานความยาวของฉบับอังกฤษ (อักขระ) — เกินแล้ว Google ตัดกลางคัน */
  maxChars?: number;
  th: string;
  en: string;
}

const units: Unit[] = [];

function push(unit: Omit<Unit, "en">) {
  units.push({ ...unit, en: "" });
}

// ── บทความ 26 บท ──────────────────────────────────────────────────────────
for (const article of ARTICLES) {
  const base = `article:${article.slug}`;
  const file = `src/data/articles.ts → ARTICLES["${article.slug}"]`;

  push({ id: `${base}:title`, target: `${file}.titleEn`, kind: "seo-title", maxChars: 60, th: article.title });
  push({
    id: `${base}:description`,
    target: `${file}.descriptionEn`,
    kind: "meta-description",
    maxChars: 155,
    th: article.description,
  });

  (article.toc ?? []).forEach((item, index) => {
    push({
      id: `${base}:toc:${item.id}`,
      target: `${file}.tocEn[${index}].title`,
      kind: "heading",
      th: item.title,
    });
  });

  (article.faqs ?? []).forEach((faq, index) => {
    push({ id: `${base}:faq:${index}:q`, target: `${file}.faqsEn[${index}].question`, kind: "faq-q", th: faq.question });
    push({ id: `${base}:faq:${index}:a`, target: `${file}.faqsEn[${index}].answer`, kind: "faq-a", th: faq.answer });
  });

  push({ id: `${base}:content`, target: `${file}.contentEn`, kind: "markdown", th: article.content });
}

// ── หมวดผังพยากรณ์ 6 หมวด ─────────────────────────────────────────────────
for (const topic of Object.values(SPREAD_TOPICS)) {
  const base = `spread-topic:${topic.slug}`;
  const file = `src/data/spread-topics.ts → SPREAD_TOPICS.${topic.slug}`;

  push({ id: `${base}:seoTitle`, target: `${file}.seoTitleEn`, kind: "seo-title", maxChars: 60, th: topic.seoTitle });
  push({
    id: `${base}:metaDescription`,
    target: `${file}.metaDescriptionEn`,
    kind: "meta-description",
    maxChars: 155,
    th: topic.metaDescription,
  });
  push({ id: `${base}:title`, target: `${file}.titleEn`, kind: "heading", th: topic.titleTh });
  push({ id: `${base}:heading`, target: `${file}.headingEn`, kind: "heading", th: topic.heading });
  push({ id: `${base}:tagline`, target: `${file}.taglineEn`, kind: "tagline", th: topic.tagline });

  (topic.editorialIntro ?? []).forEach((paragraph, index) => {
    push({ id: `${base}:intro:${index}`, target: `${file}.editorialIntroEn[${index}]`, kind: "prose", th: paragraph });
  });

  (topic.faqs ?? []).forEach((faq, index) => {
    push({ id: `${base}:faq:${index}:q`, target: `${file}.faqsEn[${index}].question`, kind: "faq-q", th: faq.question });
    push({ id: `${base}:faq:${index}:a`, target: `${file}.faqsEn[${index}].answer`, kind: "faq-a", th: faq.answer });
  });
}

function summarize() {
  const byKind = new Map<string, { count: number; chars: number }>();
  let chars = 0;
  for (const unit of units) {
    chars += unit.th.length;
    const entry = byKind.get(unit.kind) ?? { count: 0, chars: 0 };
    entry.count += 1;
    entry.chars += unit.th.length;
    byKind.set(unit.kind, entry);
  }
  return { chars, byKind };
}

const command = process.argv[2] ?? "export";
const { chars, byKind } = summarize();

console.log("\n=======================================================");
console.log("📤 TRANSLATION EXPORT — งานแปลไทย → อังกฤษ");
console.log("=======================================================");
console.log(`✦ หน่วยข้อความทั้งหมด : ${units.length} หน่วย`);
console.log(`✦ ความยาวรวม         : ${chars.toLocaleString()} อักขระ ≈ ${Math.round(chars / 6).toLocaleString()} คำไทย`);
console.log("");
for (const [kind, entry] of [...byKind.entries()].sort((a, b) => b[1].chars - a[1].chars)) {
  console.log(`  ${kind.padEnd(18)} ${String(entry.count).padStart(4)} หน่วย · ${String(entry.chars).padStart(6)} อักขระ`);
}

if (command === "status") {
  console.log("\n(โหมด status — ยังไม่มีฟิลด์ *En ในโครงข้อมูล จึงถือว่าค้างทั้งหมด)");
  console.log("");
  process.exit(0);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      $schema: "หน่วยละ 1 ข้อความ — เติมคำแปลลงช่อง `en` เท่านั้น ห้ามแก้ `id` / `th` / `target`",
      generatedFrom: "npm run i18n:export",
      totalUnits: units.length,
      totalSourceChars: chars,
      units,
    },
    null,
    2,
  ) + "\n",
  "utf-8",
);

console.log(`\n✅ เขียนไฟล์แล้ว: ${path.relative(process.cwd(), OUT_FILE)}`);
console.log("   ส่งไฟล์นี้ให้ทีมแปลได้เลย — เติมเฉพาะช่อง `en` แล้วส่งกลับ\n");
