import { readFileSync } from "node:fs";
import { DECK, cardById } from "@/data/cards";
import { getSpread, PUBLIC_SPREADS } from "@/data/spreads";
import { QUESTIONS, TOPIC_PARENT, relatedQuestions, type QuestionCopy } from "@/data/questions";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/config/meta-length";
import { hasEnglishTwin } from "@/lib/i18n/paths";
import { isAstroRoute } from "@/lib/routing/astro-routes";
import { looksLikePromptInjection } from "@/lib/ai/prompt-guard";
import { checkQuestion } from "@/lib/safety/guardrails";

/**
 * QA — หน้าคำถาม `/questions/*` (REFLECTION_JOURNAL_PLAN 1.11 · แทร็ก Q) · ด่านกันหน้าบาง
 *  ข้อความเฉพาะหน้า ≥ 600 คำ (ไทย) / ≥ 450 คำ (อังกฤษ) · ย่อหน้าเปิดไม่ซ้ำ · ลิงก์ภายใน ≥ 8 ·
 *  title/description ตามเพดาน · หน้าอังกฤษไม่มีอักษรไทย · ผัง/ไพ่มีจริง · ไม่มีอิโมจิอื่นนอกจาก ✦ ✨ ·
 *  ไม่สัญญาผล/ไม่ให้ตัวเลขเสี่ยงโชค · เส้นทาง/ฝาแฝด/แผนผังเว็บครบ
 * รันด้วย: npx tsx scripts/qa/test-question-pages.ts
 * ⚠️ ยังไม่ลงทะเบียนใน `repo:verify` — เพิ่มตอนเปิด PR พร้อมแก้เลขจำนวนด่านในเอกสาร
 */
let pass = 0;
let fail = 0;
const check = (label: string, ok: boolean) => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`❌ ${label}`);
  }
};

const words = (t: string, lang: "th" | "en") =>
  [...new Intl.Segmenter(lang, { granularity: "word" }).segment(t)].filter((s) => s.isWordLike).length;
const prose = (c: QuestionCopy) =>
  [c.question, ...c.intro, c.limits, ...c.betterQuestions, ...c.positionWhy, ...Object.values(c.cardNotes), ...c.afterReading, c.example.text, ...c.followUps.flatMap((f) => [f.q, f.a])].join(" ");
const EMOJI = /\p{Extended_Pictographic}/u;
/** สัญญาผล = "รับประกัน/guarantee" ที่ไม่ได้อยู่ในประโยคปฏิเสธ ("ไม่ได้รับประกัน" · "doesn't guarantee" · "not a guarantee") */
function promisesOutcome(text: string): boolean {
  if (/แน่นอน\s*100|100\s*%\s*(sure|certain)/i.test(text)) return true;
  for (const m of text.matchAll(/รับประกัน|guarantee/gi)) {
    const before = text.slice(Math.max(0, (m.index ?? 0) - 14), m.index).toLowerCase();
    if (!/(ไม่|ไม่ได้|ไม่ใช่|ไม่ใช่การ|not a |not |n't |no |never )\s*$/.test(before)) return true;
  }
  return false;
}
const ALLOWED_EMOJI = /[✦✨]/gu;

check("มี 20 หน้า", QUESTIONS.length === 20);
check("slug ไม่ซ้ำ", new Set(QUESTIONS.map((q) => q.slug)).size === QUESTIONS.length);
check("slug เป็นตัวพิมพ์เล็ก-ขีดกลางเท่านั้น", QUESTIONS.every((q) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(q.slug)));
check("ไม่ชนกับเส้นทางผังเดิม (ไม่สร้างหมวดซ้ำ)", QUESTIONS.every((q) => !PUBLIC_SPREADS.some((s) => s.id === q.slug)));

const openers = new Map<string, string>();
for (const q of QUESTIONS) {
  const spread = getSpread(q.spreadId);
  check(`${q.slug}: ผัง ${q.spreadId} มีจริงและเป็นผังสาธารณะ`, Boolean(spread) && !spread!.internal);
  check(`${q.slug}: หมวดแม่มีจริง`, Boolean(TOPIC_PARENT[q.topic]));
  check(`${q.slug}: updatedAt เป็นวันที่`, /^\d{4}-\d{2}-\d{2}$/.test(q.updatedAt));

  for (const lang of ["th", "en"] as const) {
    const c = q[lang];
    const label = `${q.slug}/${lang}`;
    const n = words(prose(c), lang);
    check(`${label}: ข้อความเฉพาะหน้า ${n} คำ (≥ ${lang === "th" ? 600 : 450})`, n >= (lang === "th" ? 600 : 450));
    check(`${label}: title ≤ ${TITLE_MAX} (${c.title.length})`, c.title.length > 0 && c.title.length <= TITLE_MAX);
    check(`${label}: description ≤ ${DESCRIPTION_MAX} (${c.description.length})`, c.description.length >= 70 && c.description.length <= DESCRIPTION_MAX);
    check(`${label}: มีคำค้นจริงอ้างอิง ≥ 2`, c.searchPhrases.length >= 2);
    check(`${label}: ย่อหน้าเปิด 2 ย่อหน้า`, c.intro.length >= 2);
    const opener = c.intro[0].slice(0, 80);
    check(`${label}: ย่อหน้าเปิดไม่ซ้ำหน้าอื่น`, !openers.has(`${lang}:${opener}`));
    openers.set(`${lang}:${opener}`, q.slug);
    check(`${label}: เหตุผลรายตำแหน่งครบตามผัง`, Boolean(spread) && c.positionWhy.length === spread!.positions.length);
    const noteIds = Object.keys(c.cardNotes);
    check(`${label}: ไพ่ที่ควรรู้จัก 6–8 ใบ`, noteIds.length >= 6 && noteIds.length <= 8);
    check(`${label}: ไพ่ที่ควรรู้จักมีอยู่จริงในสำรับ`, noteIds.every((id) => Boolean(cardById(id))));
    check(`${label}: ตัวอย่างใช้ไพ่ครบตามผังและมีจริง`, Boolean(spread) && c.example.cards.length === spread!.positions.length && c.example.cards.every((x) => Boolean(cardById(x.id))));
    check(`${label}: ตัวอย่างไม่ใช้ไพ่ซ้ำ`, new Set(c.example.cards.map((x) => x.id)).size === c.example.cards.length);
    check(`${label}: คำถามต่อ ≥ 3 · หลังอ่าน ≥ 3 · ถามแบบดีกว่า ≥ 3`, c.followUps.length >= 3 && c.afterReading.length >= 3 && c.betterQuestions.length >= 3);
    const all = JSON.stringify(c);
    check(`${label}: ไม่มีอิโมจิอื่นนอกจาก ✦ ✨ (กฎเหล็กข้อ 2)`, !EMOJI.test(all.replace(ALLOWED_EMOJI, "")));
    if (lang === "en") check(`${label}: หน้าอังกฤษไม่มีอักษรไทย`, !/[฀-๿]/.test(all));
    check(`${label}: ไม่สัญญาผล (รับประกัน/แน่นอน 100%)`, !promisesOutcome(all));
    check(`${label}: ไม่ให้ตัวเลขเสี่ยงโชค`, !/เลขเด็ด(คือ|งวดนี้)|เลขนำโชค(คือ|ของคุณ)|ตัวเลขนำโชค\s*\d|lucky numbers? (is|are|for you)\b/i.test(all));
    check(`${label}: คำถามในกล่องถามเลยผ่านด่านคำสั่งแฝงและด่านวิกฤต`, !looksLikePromptInjection(c.betterQuestions[0]) && !checkQuestion(c.betterQuestions[0], lang).block);
  }
  // ลิงก์ภายใน: ผัง 1 + หมวดแม่ 2 (breadcrumb + ท้ายหน้า) + หน้ารวม 2 + ไพ่ที่ควรรู้จัก + คำถามที่เกี่ยวข้อง
  const internalLinks = 1 + 2 + 2 + Object.keys(q.th.cardNotes).length + relatedQuestions(q.slug, 4).length;
  check(`${q.slug}: ลิงก์ภายใน ≥ 8 (${internalLinks})`, internalLinks >= 8);
}

// หน้าคำถามเรื่องที่อ่อนไหวต้องพูดเรื่องความปลอดภัย/ขอบเขตชัดเจน
const ethics = QUESTIONS.find((q) => q.slug === "is-there-someone-else")!;
check("หน้ามือที่สาม: ประกาศชัดว่าไม่ระบุตัวบุคคล", /ไม่บอกชื่อ/.test(ethics.th.limits) && /won't give names/.test(ethics.en.limits));
const guide = QUESTIONS.find((q) => q.slug === "what-should-i-ask-tarot")!;
check("หน้าวิธีถาม: มีสายด่วน 1323 (กฎเหล็กข้อ 6)", guide.th.limits.includes("1323"));

// เส้นทาง · ฝาแฝด · แผนผังเว็บ · ลิงก์ขึ้นลง
check("/questions เป็นหน้า Astro", isAstroRoute("/questions") && isAstroRoute("/questions/does-he-love-me"));
check("/questions มีฝาแฝดอังกฤษ", hasEnglishTwin("/questions") && hasEnglishTwin("/questions/does-he-love-me"));
const sitemap = readFileSync("src/app/sitemap.ts", "utf8");
check("แผนผังเว็บมีหน้าคำถาม", sitemap.includes("questionRoutes") && sitemap.includes("QUESTIONS.map"));
check("หน้าหมวดลิงก์ลงไปหน้าคำถาม", readFileSync("src/app/_shared/pages/spread-topic.tsx", "utf8").includes("/questions/${q.slug}"));
const page = readFileSync("src/app/_shared/pages/question-page.tsx", "utf8");
check("หน้าคำถามใช้ Article + BreadcrumbList (ไม่ใช่ FAQPage)", page.includes('"@type": "Article"') && page.includes("buildBreadcrumbJsonLd") && !page.includes('"@type": "FAQPage"'));
check("ภาพไพ่ผ่าน CardImage พร้อม sizes (กฎเหล็กข้อ 8)", page.includes("<CardImage") && !/<img\s/.test(page) && (page.match(/<CardImage[^>]*sizes=/g) ?? []).length >= 2);
for (const f of ["astro/pages/questions/[slug].astro", "astro/pages/en/questions/[slug].astro", "astro/pages/questions/index.astro", "astro/pages/en/questions/index.astro"]) {
  check(`มีไฟล์ ${f}`, (() => { try { readFileSync(f); return true; } catch { return false; } })());
}
const slugPage = readFileSync("astro/pages/questions/[slug].astro", "utf8");
check("กล่องถามเลยโหลดเมื่อเลื่อนถึง (client:visible)", slugPage.includes("client:visible"));
const ask = readFileSync("src/components/questions/AskNowBox.tsx", "utf8");
check("กล่องถามเลยไม่ใส่คำถามใน URL (เรื่องส่วนตัว)", !/\?q=|encodeURIComponent\(question/.test(ask));
check("กล่องถามเลยไม่ import สำรับ (island เบา)", !/@\/data\/cards|@\/data\/spreads"/.test(ask));
check("TarotFlow รับคำถามที่ตั้งไว้เฉพาะผังที่ตรงกัน", readFileSync("src/components/home/TarotFlow.tsx", "utf8").includes("takeQuestionPrefill(routeSpread.id)"));
check("สำรับครบ 78 ใบ (ข้อมูลอ้างอิง)", DECK.length === 78);

console.log(`\n${fail === 0 ? "✅" : "❌"} question pages: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
