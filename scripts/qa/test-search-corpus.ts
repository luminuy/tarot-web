import { buildSearchCorpus } from "../../src/lib/search/vectorize";
import { DECK } from "../../src/data/cards";
import { ARTICLES } from "../../src/data/articles";

/**
 * QA — corpus ค้นหาเชิงความหมาย ต้องครบ ไพ่ 78 + บทความทั้งหมด
 * รันด้วย: npx tsx scripts/qa/test-search-corpus.ts
 */

let pass = 0;
let fail = 0;
const ok = (cond: boolean, label: string) => {
  if (cond) {
    pass++;
    console.log(`✅ ${label}`);
  } else {
    fail++;
    console.log(`❌ ${label}`);
  }
};

const corpus = buildSearchCorpus();
const cards = corpus.filter((d) => d.type === "card");
const articles = corpus.filter((d) => d.type === "article");

ok(cards.length === DECK.length, `ไพ่ครบ ${DECK.length} ใบ (ได้ ${cards.length})`);
ok(articles.length === ARTICLES.length, `บทความครบ ${ARTICLES.length} (ได้ ${articles.length})`);

ok(
  cards.every((d) => d.id.startsWith("card:") && d.metadata.ref && d.metadata.title),
  "ไพ่ทุก doc มี id `card:*` + metadata ref/title",
);
ok(
  articles.every((d) => d.id.startsWith("article:") && d.metadata.ref && d.metadata.title),
  "บทความทุก doc มี id `article:*` + metadata ref/title",
);

ok(
  corpus.every((d) => d.text.trim().length >= 20),
  "ทุก doc มีข้อความ embed ยาวพอ (≥20 ตัวอักษร)",
);

ok(new Set(corpus.map((d) => d.id)).size === corpus.length, "id ไม่ซ้ำกัน");

// metadata value ต้องเป็น string ล้วน (ข้อกำหนด Vectorize)
ok(
  corpus.every((d) => Object.values(d.metadata).every((v) => typeof v === "string")),
  "metadata เป็น string ล้วน (Vectorize รองรับ)",
);

console.log(`\n${pass}/${pass + fail} ผ่าน`);
if (fail > 0) process.exit(1);
