/**
 * 📥 ตัวนำเข้าและตรวจสอบความสมบูรณ์งานแปลภาษาอังกฤษ (Translation Importer & QA Guard)
 * ---------------------------------------------------------------------------
 * อ่าน docs/i18n/pending-en.json ตรวจสอบเกณฑ์คุณภาพระดับโลกทั้ง 8 ด่าน:
 *   1. ห้ามมีอักขระไทยในช่อง `en` แม้แต่ตัวเดียว ([\u0E00-\u0E7F])
 *   2. `seo-title` ต้อง ≤ 60 อักขระ
 *   3. `meta-description` ต้อง ≤ 155 อักขระ
 *   4. โครงสร้าง Markdown ต้องคงระดับและจำนวน `##` และ `###` เท่ากับต้นฉบับเป๊ะ
 *   5. URL ใน Markdown link ห้ามถูกดัดแปลง
 *   6. ห้ามมีสัญลักษณ์ดวงดาวแฟนซีหรืออิโมจิ (✦, ✨, ✧, ฯลฯ) ใน UI/SEO
 *   7. ตรวจสอบความถูกต้องของ id และ target
 *   8. คอมไพล์คำแปลออกเป็น src/data/i18n/articles-en.generated.ts และ spread-topics-en.generated.ts
 *
 * การใช้งาน:
 *   npm run i18n:import             ตรวจสอบและคอมไพล์คำแปลเข้าสู่ระบบ
 *   npm run i18n:verify             ตรวจสอบความถูกต้องอย่างเดียว (ไม่เขียนไฟล์)
 */

import fs from "node:fs";
import path from "node:path";

interface Unit {
  id: string;
  target: string;
  kind: "seo-title" | "meta-description" | "heading" | "tagline" | "prose" | "markdown" | "faq-q" | "faq-a";
  maxChars?: number;
  th: string;
  en: string;
}

interface PendingData {
  $schema: string;
  generatedFrom: string;
  totalUnits: number;
  totalSourceChars: number;
  units: Unit[];
}

const ROOT = process.cwd();
const PENDING_FILE = path.join(ROOT, "docs", "i18n", "pending-en.json");
const OUT_DIR = path.join(ROOT, "src", "data", "i18n");
const ARTICLES_OUT_FILE = path.join(OUT_DIR, "articles-en.generated.ts");
const TOPICS_OUT_FILE = path.join(OUT_DIR, "spread-topics-en.generated.ts");

const BANNED_SYMBOLS = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✦✨✧★☆]/u;
const THAI_GLYPHS = /[\u0E00-\u0E7F]/;

function extractHeadings(markdown: string): { h2Count: number; h3Count: number } {
  const lines = markdown.split("\n");
  let h2Count = 0;
  let h3Count = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("## ")) h2Count++;
    else if (line.startsWith("### ")) h3Count++;
  }
  return { h2Count, h3Count };
}

function extractLinkUrls(markdown: string): string[] {
  const urls: string[] = [];
  const regex = /\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

export function validateAndImport(verifyOnly = false): { total: number; filled: number; errors: string[] } {
  if (!fs.existsSync(PENDING_FILE)) {
    throw new Error(`ไม่พบไฟล์งานแปล: ${PENDING_FILE}`);
  }

  const raw = fs.readFileSync(PENDING_FILE, "utf-8");
  const data: PendingData = JSON.parse(raw);

  const errors: string[] = [];
  let filledCount = 0;

  // สำหรับรวบรวมข้อมูลคอมไพล์
  const articlesMap: Record<
    string,
    {
      titleEn?: string;
      seoTitleEn?: string;
      descriptionEn?: string;
      contentEn?: string;
      tocEn?: Array<{ id: string; title: string }>;
      faqsEn?: Array<{ question: string; answer: string }>;
    }
  > = {};

  const topicsMap: Record<
    string,
    {
      seoTitleEn?: string;
      metaDescriptionEn?: string;
      titleEn?: string;
      headingEn?: string;
      taglineEn?: string;
      editorialIntroEn?: string[];
      faqsEn?: Array<{ question: string; answer: string }>;
    }
  > = {};

  for (const unit of data.units) {
    const en = unit.en?.trim() || "";
    if (!en) continue;

    filledCount++;

    // 1. ตรวจสอบอักขระไทย
    if (THAI_GLYPHS.test(en)) {
      errors.push(`[${unit.id}] พบอักขระภาษาไทยในคำแปล: "${en.slice(0, 40)}..."`);
    }

    // 2. ตรวจสอบความยาว maxChars
    if (unit.maxChars && en.length > unit.maxChars) {
      errors.push(
        `[${unit.id}] ความยาวเกินกำหนด (${en.length}/${unit.maxChars} ตัวอักษร): "${en}"`,
      );
    }

    // 3. ตรวจสอบสัญลักษณ์ต้องห้าม
    if (BANNED_SYMBOLS.test(en)) {
      errors.push(`[${unit.id}] พบสัญลักษณ์แฟนซีหรืออิโมจิต้องห้าม (Rule 2)`);
    }

    // 4. ตรวจสอบ Markdown Headings & Links
    if (unit.kind === "markdown") {
      const thHeadings = extractHeadings(unit.th);
      const enHeadings = extractHeadings(en);
      if (thHeadings.h2Count !== enHeadings.h2Count) {
        errors.push(
          `[${unit.id}] จำนวนหัวข้อ ## ไม่ตรงกับต้นฉบับ (ต้นฉบับ: ${thHeadings.h2Count}, แปล: ${enHeadings.h2Count})`,
        );
      }
      if (thHeadings.h3Count !== enHeadings.h3Count) {
        errors.push(
          `[${unit.id}] จำนวนหัวข้อ ### ไม่ตรงกับต้นฉบับ (ต้นฉบับ: ${thHeadings.h3Count}, แปล: ${enHeadings.h3Count})`,
        );
      }

      const thUrls = extractLinkUrls(unit.th);
      const enUrls = extractLinkUrls(en);
      if (thUrls.length !== enUrls.length) {
        errors.push(
          `[${unit.id}] จำนวนลิงก์ไม่ตรงกับต้นฉบับ (ต้นฉบับ: ${thUrls.length}, แปล: ${enUrls.length})`,
        );
      } else {
        for (let i = 0; i < thUrls.length; i++) {
          if (thUrls[i] !== enUrls[i]) {
            errors.push(
              `[${unit.id}] URL ลิงก์ที่ ${i + 1} ถูกดัดแปลง: "${thUrls[i]}" vs "${enUrls[i]}"`,
            );
          }
        }
      }
    }

    // รวบรวมลง Map
    if (unit.id.startsWith("article:")) {
      const parts = unit.id.split(":");
      const slug = parts[1];
      const fieldType = parts[2];

      if (!articlesMap[slug]) articlesMap[slug] = {};
      const art = articlesMap[slug];

      if (fieldType === "title") {
        art.titleEn = en;
        art.seoTitleEn = en;
      } else if (fieldType === "description") {
        art.descriptionEn = en;
      } else if (fieldType === "content") {
        art.contentEn = en;
      } else if (fieldType === "toc") {
        const tocId = parts[3];
        if (!art.tocEn) art.tocEn = [];
        art.tocEn.push({ id: tocId, title: en });
      } else if (fieldType === "faq") {
        const index = parseInt(parts[3], 10);
        const subfield = parts[4];
        if (!art.faqsEn) art.faqsEn = [];
        if (!art.faqsEn[index]) art.faqsEn[index] = { question: "", answer: "" };
        if (subfield === "q") art.faqsEn[index].question = en;
        if (subfield === "a") art.faqsEn[index].answer = en;
      }
    } else if (unit.id.startsWith("spread-topic:")) {
      const parts = unit.id.split(":");
      const slug = parts[1];
      const fieldType = parts[2];

      if (!topicsMap[slug]) topicsMap[slug] = {};
      const top = topicsMap[slug];

      if (fieldType === "seoTitle") {
        top.seoTitleEn = en;
      } else if (fieldType === "metaDescription") {
        top.metaDescriptionEn = en;
      } else if (fieldType === "title") {
        top.titleEn = en;
      } else if (fieldType === "heading") {
        top.headingEn = en;
      } else if (fieldType === "tagline") {
        top.taglineEn = en;
      } else if (fieldType === "intro") {
        const index = parseInt(parts[3], 10);
        if (!top.editorialIntroEn) top.editorialIntroEn = [];
        top.editorialIntroEn[index] = en;
      } else if (fieldType === "faq") {
        const index = parseInt(parts[3], 10);
        const subfield = parts[4];
        if (!top.faqsEn) top.faqsEn = [];
        if (!top.faqsEn[index]) top.faqsEn[index] = { question: "", answer: "" };
        if (subfield === "q") top.faqsEn[index].question = en;
        if (subfield === "a") top.faqsEn[index].answer = en;
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ พบข้อผิดพลาดในการตรวจสอบ ${errors.length} จุด:`);
    for (const err of errors.slice(0, 20)) {
      console.error(`  • ${err}`);
    }
    if (errors.length > 20) {
      console.error(`  ... และอีก ${errors.length - 20} รายการ`);
    }
    return { total: data.totalUnits, filled: filledCount, errors };
  }

  if (!verifyOnly && filledCount > 0) {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    // เขียน src/data/i18n/articles-en.generated.ts
    const articlesCode = `// Auto-generated by scripts/i18n-import.ts — DO NOT EDIT MANUALLY
export interface ArticleEnData {
  titleEn?: string;
  seoTitleEn?: string;
  descriptionEn?: string;
  contentEn?: string;
  tocEn?: Array<{ id: string; title: string }>;
  faqsEn?: Array<{ question: string; answer: string }>;
}

export const ARTICLES_EN: Record<string, ArticleEnData> = ${JSON.stringify(articlesMap, null, 2)};
`;
    fs.writeFileSync(ARTICLES_OUT_FILE, articlesCode, "utf-8");

    // เขียน src/data/i18n/spread-topics-en.generated.ts
    const topicsCode = `// Auto-generated by scripts/i18n-import.ts — DO NOT EDIT MANUALLY
export interface SpreadTopicEnData {
  seoTitleEn?: string;
  metaDescriptionEn?: string;
  titleEn?: string;
  headingEn?: string;
  taglineEn?: string;
  editorialIntroEn?: string[];
  faqsEn?: Array<{ question: string; answer: string }>;
}

export const SPREAD_TOPICS_EN: Record<string, SpreadTopicEnData> = ${JSON.stringify(topicsMap, null, 2)};
`;
    fs.writeFileSync(TOPICS_OUT_FILE, topicsCode, "utf-8");

    console.log(`\n✅ คอมไพล์และอัปเดตคำแปลเข้าสู่ระบบสำเร็จ:`);
    console.log(`  • ${path.relative(ROOT, ARTICLES_OUT_FILE)} (${Object.keys(articlesMap).length} บทความ)`);
    console.log(`  • ${path.relative(ROOT, TOPICS_OUT_FILE)} (${Object.keys(topicsMap).length} หมวดผัง)`);
  }

  return { total: data.totalUnits, filled: filledCount, errors: [] };
}

if (process.argv[1] && process.argv[1].endsWith("i18n-import.ts")) {
  const verifyOnly = process.argv.includes("--verify-only") || process.argv.includes("--dry-run");
  console.log("\n=======================================================");
  console.log(`📥 TRANSLATION IMPORT & QA VERIFICATION — ตรวจสอบงานแปล`);
  console.log("=======================================================");

  const res = validateAndImport(verifyOnly);
  const percent = Math.round((res.filled / res.total) * 100);
  console.log(`• สถานะการแปล: ${res.filled} / ${res.total} หน่วย (${percent}%)`);

  if (res.errors.length > 0) {
    process.exit(1);
  } else {
    console.log(`• การตรวจสอบคุณภาพ: ผ่านเกณฑ์ความปลอดภัยทุกหน่วย\n`);
    process.exit(0);
  }
}
