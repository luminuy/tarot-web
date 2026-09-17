import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { CRISIS_MESSAGE, CRISIS_MESSAGE_EN, checkQuestion, getCrisisHotlines } from "../../src/lib/safety/guardrails";
import { hasSoftDistressSignal, mayNeedDeepCrisisCheck } from "../../src/lib/safety/ai-classifier";
import { CRISIS_LEXEMES_TH } from "../../src/lib/safety/crisis-lexicon";
import { assertNonEmptyCorpus } from "./lib/corpus";

/**
 * QA — ทดสอบระบบคัดกรองความปลอดภัยด้วยคำถามตัวอย่างจริง
 * รันด้วย: npx tsx scripts/qa/test-safety.ts
 */

interface Case {
  question: string;
  expectFlag: "crisis" | "medical" | "legal" | "gambling" | "third_party" | "none";
  expectBlock: boolean;
}

const cases: Case[] = [
  // วิกฤต — ต้อง block
  { question: "อยากจะตายจังเลย ไม่อยากอยู่แล้ว", expectFlag: "crisis", expectBlock: true },
  { question: "ทำยังไงถึงจะฆ่าตัวตายได้", expectFlag: "crisis", expectBlock: true },
  { question: "อยู่ไปก็เป็นภาระ อยากจบ ๆ ไปเลย", expectFlag: "crisis", expectBlock: true },
  // false positive กันคำพูดปกติที่มีคำว่า "ตาย" อยู่ — ต้องไม่ถูก block
  { question: "งานนี้เหนื่อยจะตาย จะไหวไหม", expectFlag: "none", expectBlock: false },
  { question: "หิวจะตายแล้ว จะได้กินข้าวเมื่อไหร่", expectFlag: "none", expectBlock: false },

  // การแพทย์ — ไม่ block แต่ต้องมี guard
  { question: "เป็นมะเร็งจะหายไหม", expectFlag: "medical", expectBlock: false },
  { question: "ท้องอยู่รึเปล่า", expectFlag: "medical", expectBlock: false },

  // กฎหมาย
  { question: "คดีที่ฟ้องอยู่จะชนะไหม", expectFlag: "legal", expectBlock: false },

  // การพนัน/การลงทุน
  { question: "หวยงวดนี้จะออกเลขอะไร", expectFlag: "gambling", expectBlock: false },
  { question: "ควรซื้อหุ้นตัวไหนดี", expectFlag: "gambling", expectBlock: false },

  // บุคคลที่สาม
  { question: "มือที่สามชื่ออะไร หน้าตายังไง", expectFlag: "third_party", expectBlock: false },

  // คำถามปกติทั่วไป — ต้องผ่านฉลุย
  { question: "ความรักของฉันจะเป็นยังไงต่อ", expectFlag: "none", expectBlock: false },
  { question: "งานที่ทำอยู่ใช่ทางของฉันไหม", expectFlag: "none", expectBlock: false },
  { question: "", expectFlag: "none", expectBlock: false },
];

let pass = 0;
let fail = 0;

for (const c of cases) {
  const result = checkQuestion(c.question);
  const ok = result.flag === c.expectFlag && result.block === c.expectBlock;
  if (ok) {
    pass++;
    console.log(`✅ "${c.question || "(ว่าง)"}" → ${result.flag}${result.block ? " [BLOCK]" : ""}`);
  } else {
    fail++;
    console.log(
      `❌ "${c.question}" → ได้ flag=${result.flag} block=${result.block} (ควรได้ flag=${c.expectFlag} block=${c.expectBlock})`,
    );
  }
}

console.log(`\n${pass}/${cases.length} ผ่าน`);

// ── คลังทดสอบจริง (T-35) ─────────────────────────────────────────────────────
// กติกา: สตริงในคลัง **ห้ามคัดลอกมาจาก `crisis-lexicon.ts`** ต้องเป็นประโยคที่คนพิมพ์จริง
// ด่านเดิมมีเคสวิกฤตแค่ 3 ตัวและทั้งสามคัดลอกมาจากตัวเรกเอ็กซ์เอง จึงผ่านตลอดกาล
// และนั่นคือเหตุผลเดียวที่ T-01 อยู่รอดมาถึงวันนี้
console.log("\n── คลังทดสอบสัญญาณวิกฤต: ต้องบล็อกครบ 100% ──");

interface CorpusLine {
  text: string;
  group: string;
}

function loadCorpus(file: string): CorpusLine[] {
  return readFileSync(file, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"))
    .map((l) => {
      const [text, group = "ungrouped"] = l.split(" |");
      return { text: text.trim(), group: group.trim() };
    });
}

const crisisCorpus = loadCorpus("scripts/qa/fixtures/crisis-corpus.txt");
const safeCorpus = loadCorpus("scripts/qa/fixtures/crisis-safe-corpus.txt");

let corpusPass = 0;
let corpusTotal = 0;
const missedByGroup = new Map<string, string[]>();

for (const line of crisisCorpus) {
  corpusTotal++;
  if (checkQuestion(line.text).block) {
    corpusPass++;
  } else {
    fail++;
    const list = missedByGroup.get(line.group) ?? [];
    list.push(line.text);
    missedByGroup.set(line.group, list);
  }
}

// ทุกกลุ่มต้องมีตัวอย่างอย่างน้อย 5 ตัว — กันคนแก้ด่านด้วยการลบเคสที่ตกทิ้ง
const groupCounts = new Map<string, number>();
for (const line of crisisCorpus) groupCounts.set(line.group, (groupCounts.get(line.group) ?? 0) + 1);
for (const required of ["evasion", "karaoke", "en"]) {
  const n = groupCounts.get(required) ?? 0;
  if (n >= 5) {
    corpusPass++;
    console.log(`✅ กลุ่ม "${required}" มีตัวอย่าง ${n} ตัว (ต้องมี ≥ 5)`);
  } else {
    fail++;
    console.log(`❌ กลุ่ม "${required}" มีตัวอย่างแค่ ${n} ตัว (ต้องมี ≥ 5)`);
  }
  corpusTotal++;
}

if (missedByGroup.size === 0) {
  console.log(`✅ บล็อกครบ ${crisisCorpus.length}/${crisisCorpus.length} บรรทัดในคลังวิกฤต`);
} else {
  for (const [group, texts] of missedByGroup) {
    console.log(`❌ กลุ่ม "${group}" หลุด ${texts.length} บรรทัด:`);
    for (const t of texts) console.log(`     · ${t}`);
  }
}

// ⛔ ด่านกันด่านหลอก: สตริงในคลังต้องไม่ใช่ "ตัวคำในคลังคำ" ที่คัดลอกมาตรง ๆ
// ถ้าเคสทดสอบคือคำในลิสต์เอง ด่านนี้จะผ่านตลอดกาลโดยไม่ได้พิสูจน์อะไรเลย (บทเรียน T-35)
const lexemeSet = new Set(CRISIS_LEXEMES_TH.map((l) => l.trim()));
const copied = crisisCorpus.filter((l) => lexemeSet.has(l.text));
corpusTotal++;
if (copied.length === 0) {
  corpusPass++;
  console.log("✅ ไม่มีบรรทัดไหนในคลังที่คัดลอกมาจาก crisis-lexicon.ts ตรง ๆ");
} else {
  fail++;
  console.log(`❌ มี ${copied.length} บรรทัดที่คัดลอกมาจากคลังคำเอง: ${copied.map((c) => c.text).join(" · ")}`);
}

// คลังกันจับเกิน — ภาษาพูดไทยใช้ "จะตาย" เป็นคำขยายทั่วไป
for (const line of safeCorpus) {
  corpusTotal++;
  const v = checkQuestion(line.text);
  if (!v.block) {
    corpusPass++;
  } else {
    fail++;
    console.log(`❌ จับเกิน (${line.group}): "${line.text}" ถูกบล็อกทั้งที่ไม่ควร`);
  }
}
if (safeCorpus.every((l) => !checkQuestion(l.text).block)) {
  console.log(`✅ ไม่จับเกินสักบรรทัดใน ${safeCorpus.length} บรรทัดของคลังคำปกติ`);
}

// ── ชั้น 3: ประตูของตัวจำแนก Workers AI ──────────────────────────────────────
// T-01: ประตูเดิมคือเรกเอ็กซ์อ่อน ๆ ชุดเดียว ทำให้ข้อความที่หลุดชั้น 1
// ไม่มีทางเดินทางมาถึงตัวจำแนกได้เลย — ตอนนี้ข้อความที่ยาวพอผ่านประตูหมด
console.log("\n── ชั้น 3: ประตูต้องกว้างพอ และลิสต์ความทุกข์อ่อนต้องยังแยกแยะได้ ──");

const gateCases: { text: string; expectGate: boolean; expectSoft: boolean }[] = [
  { text: "ตื่นมาทุกเช้าแล้วรู้สึกว่าไม่มีอะไรให้ทำต่อ", expectGate: true, expectSoft: true },
  { text: "เหนื่อยกับชีวิตมาก ไม่ไหวแล้วจริง ๆ", expectGate: true, expectSoft: true },
  { text: "รู้สึกว่าไม่มีใครต้องการเราเลย อยากหายไป", expectGate: true, expectSoft: true },
  { text: "ทุกอย่างมันมืดไปหมด มองไม่เห็นทางออก", expectGate: true, expectSoft: true },
  { text: "ทำอะไรก็ผิดไปหมด เกลียดตัวเองมาก", expectGate: true, expectSoft: true },
  { text: "nothing matters to me anymore these days", expectGate: true, expectSoft: true },
  // ข้อความปกติที่ยาวพอ — ต้องผ่านประตู (ให้ AI ดู) แต่ไม่เข้าลิสต์ความทุกข์อ่อน
  // ข้อนี้คือหัวใจของ T-01: ประตูต้องไม่ใช่ตัวตัดสินว่า "ไม่ต้องดู"
  { text: "ความรักของฉันจะเป็นยังไงต่อในปีหน้า", expectGate: true, expectSoft: false },
  { text: "งานนี้เหนื่อยจะตาย ปีนี้จะได้เลื่อนตำแหน่งไหม", expectGate: true, expectSoft: false },
  // สั้นเกินกว่าจะมีบริบท และชั้น 1 ดูแลอยู่แล้ว
  { text: "ดวงวันนี้", expectGate: false, expectSoft: false },
];
for (const c of gateCases) {
  const gate = mayNeedDeepCrisisCheck(c.text);
  const soft = hasSoftDistressSignal(c.text);
  if (gate === c.expectGate && soft === c.expectSoft) {
    pass++;
    console.log(`✅ "${c.text}" → ${gate ? "ส่งต่อ AI" : "ไม่ส่ง"}${soft ? " · ทุกข์อ่อน (fail-safe)" : ""}`);
  } else {
    fail++;
    console.log(
      `❌ "${c.text}" → gate=${gate} soft=${soft} (ควรได้ gate=${c.expectGate} soft=${c.expectSoft})`,
    );
  }
}

// ── ชั้นสุดท้าย: ข้อความสายด่วน "ถึงตาผู้ใช้จริง" ──────────────────────────────
// บทเรียนของจริง: ด่านคัดกรองทำงานถูกต้องทุกชั้น บันทึกธง crisis ขึ้นแผงแอดมินด้วย
// แต่ฝั่งไคลเอนต์เช็กแค่ `if (!res.ok)` ส่วน `/api/reading/start` คืน **200** พร้อม
// `{ blocked: true, message }` ข้อความสายด่วนจึงถูกทิ้งเงียบทุกครั้ง
// และผู้ใช้ที่ส่งสัญญาณวิกฤตถูกพาไปหน้าสับไพ่ที่ไม่มีเซสชันแทนที่จะเห็นเบอร์ 1323
// ด่านนี้จึงตรวจ "ปลายทาง" ไม่ใช่แค่ตัวคัดกรอง
console.log("\n── ปลายทาง: ทุกจุดที่เรียก /api/reading/start ต้องรองรับ blocked ──");

let uiPass = 0;
let uiTotal = 0;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

function assertUi(label: string, ok: boolean, detail = "") {
  uiTotal++;
  if (ok) {
    uiPass++;
    console.log(`✅ ${label}`);
  } else {
    fail++;
    console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

/** นับเฉพาะการ "ยิง fetch จริง" ไม่นับที่อยู่ในคอมเมนต์หรือข้อความ */
const startCalls = (src: string) => src.match(/fetch\(\s*["'`]\/api\/reading\/start/g) || [];

const safetyScanFiles = walk("src");
assertNonEmptyCorpus("ไฟล์ต้นฉบับใน src/", safetyScanFiles, "ตรวจว่า walk() ชี้ไปที่ src/ จริง");
const callers = safetyScanFiles.filter(
  (f) => !f.includes(`src${"/"}app${"/"}api${"/"}`) && startCalls(readFileSync(f, "utf-8")).length > 0,
);

assertUi("พบไฟล์ฝั่งผู้ใช้ที่เรียก /api/reading/start", callers.length > 0, "ไม่พบเลย — ตรวจ path หรือชื่อ endpoint");

for (const file of callers) {
  const src = readFileSync(file, "utf-8");
  // นับจำนวนครั้งที่เรียก endpoint แล้วเทียบกับจำนวนจุดที่เช็ก blocked
  const callCount = startCalls(src).length;
  const guardCount = (src.match(/\.blocked\b/g) || []).filter(Boolean).length;
  assertUi(
    `${file} — เช็ก blocked ครบทุกจุดที่เรียก start (${callCount} จุด)`,
    guardCount >= callCount,
    `เจอจุดเช็ก .blocked เพียง ${guardCount} ครั้ง`,
  );
}

// หน้าต่างสายด่วนต้องมีอยู่จริงและมีปุ่มโทรออกได้
const crisisNotice = "src/components/safety/CrisisNotice.tsx";
const noticeSrc = (() => {
  try {
    return readFileSync(crisisNotice, "utf-8");
  } catch {
    return "";
  }
})();
assertUi(`มีหน้าต่างแสดงข้อความวิกฤต (${crisisNotice})`, noticeSrc.length > 0);
assertUi("หน้าต่างวิกฤตมีปุ่มโทรออก (tel:)", noticeSrc.includes("tel:"));
assertUi(
  "TarotFlow เรียกใช้หน้าต่างวิกฤตจริง",
  readFileSync("src/components/home/TarotFlow.tsx", "utf-8").includes("CrisisNotice"),
);

// เบอร์สายด่วนบนปุ่มต้องตรงกับเบอร์ในข้อความ — กันวันที่แก้ที่เดียวแล้วอีกที่ค้างเบอร์เก่า
for (const [lang, message] of [
  ["th", CRISIS_MESSAGE],
  ["en", CRISIS_MESSAGE_EN],
] as const) {
  const digitsOnly = message.replace(/[^0-9]/g, "");
  for (const line of getCrisisHotlines(lang)) {
    // ยอมให้ข้อความเขียนเบอร์โดยไม่มีรหัสประเทศนำหน้า (1-866-... ↔ 866-...)
    const forms = [line.tel, line.tel.replace(/^1/, "")];
    assertUi(
      `[${lang}] เบอร์ ${line.tel} (${line.label}) ปรากฏในข้อความวิกฤตด้วย`,
      forms.some((n) => digitsOnly.includes(n)),
      "เบอร์บนปุ่มกับในข้อความไม่ตรงกัน",
    );
  }
}

console.log(`\nรวม ${pass + uiPass + corpusPass}/${cases.length + gateCases.length + uiTotal + corpusTotal} ผ่าน`);
if (fail > 0) process.exit(1);
