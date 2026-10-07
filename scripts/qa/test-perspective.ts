import { readFileSync } from "node:fs";
import { aspectProfile, BANNED_COMPARISON_WORDS, comparePerspectives } from "../../src/lib/reading/perspective";

/**
 * QA — "มุมที่สอง" (REFLECTION_JOURNAL_PLAN 1.7)
 * รันด้วย: npx tsx scripts/qa/test-perspective.ts
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

const route = readFileSync("src/app/api/reading/[id]/perspective/route.ts", "utf8");
const ui = readFileSync("src/components/reading/insight/SecondPerspectivePanel.tsx", "utf8");
const lib = readFileSync("src/lib/reading/perspective.ts", "utf8");

// ── ไพ่ชุดเดิมเป๊ะ: ห้ามมีเส้นทางสับ/จั่วใหม่ ──
check("route ไม่เรียก drawCards/shuffle", !/drawCards|shuffle|createServerSeed|pickedIndices\s*=/.test(route));
check("route อ่านไพ่จาก record.drawn", /record\.drawn/.test(route));
check("route ไพ่หาไม่เจอ = 404 โหลดใหม่ (กฎ 14)", /cards\.some\(\(c\) => !c\)/.test(route) && /reading_not_found/.test(route));
check("route ต้องอ่านรอบแรกจบก่อน", /!record\.result/.test(route));
check("route สมาชิกเท่านั้น", /viewer\.kind !== "member"/.test(route));
check("route กันปรมาจารย์ลับด้วยรอบที่ซื้อ", /isMasterPersona/.test(route) && /hasPaidCredits/.test(route));
check("route มีเพดานงบ AI + เพดานถี่", /isAiCapReached/.test(route) && /consumeEdgeRateLimits/.test(route));
check("route ไม่เก็บ/ไม่คืนคำอ่านสำรอง", /real \?/.test(route));
check("route แคชในเซสชันเดิม", /perspectives\?\.\[persona\.id\]/.test(route));

// ── ห้ามคำจัดอันดับ/ชื่อโมเดล ──
const uiText = ui.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
check("UI ไม่มีคำว่าแม่นกว่า/ถูกกว่า", !BANNED_COMPARISON_WORDS.test(uiText));
check("UI ไม่มีชื่อโมเดล", !/gemini|groq|qwen|llama|gpt/i.test(uiText));
const libCode = lib.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").replace(/BANNED_COMPARISON_WORDS[^\n]*/, "");
check("lib ไม่มีคำจัดอันดับนอกตัวกรอง", !/แม่นกว่า/.test(libCode));
check("UI บอกว่าไพ่ไม่เปลี่ยน", /ไพ่ไม่เปลี่ยน/.test(ui) && /cards stay the same/.test(ui));

// ── การเทียบด้วยโค้ด ──
const warm = {
  summary: "ความรู้สึกในใจคุณตอนนี้อบอุ่นขึ้น หัวใจเริ่มเปิดรับอีกครั้ง ความรู้สึกเหงาค่อย ๆ จางไป",
  cards: [{ position: 0, headline: "หัวใจที่เปิด", reading: "อารมณ์ของคุณกำลังฟื้นตัว" }],
};
const direct = {
  summary: "ลงมือวางแผนให้ชัด เริ่มจากก้าวเล็ก ๆ ตัดสินใจภายในสัปดาห์นี้ และระวังความล่าช้า",
  cards: [{ position: 0, headline: "ลงมือ", reading: "วางแผนและเริ่มทำ" }],
};
const cmp = comparePerspectives(warm, direct);
check("มุมอบอุ่นเน้นความรู้สึก", cmp.onlyA.includes("feeling"));
check("มุมตรงเน้นสิ่งที่ลงมือทำ", cmp.onlyB.includes("action"));
check("ข้อความว่าง = ไม่มีด้านที่เน้น", Object.values(aspectProfile({})).every((v) => v === 0));
check("ใช่/ไม่ใช่ตรงกัน", comparePerspectives({ yesNoAnswer: "ใช่" } as never, { yesNoAnswer: "ใช่" } as never).yesNoAgree === true);
check("ไม่ใช่ผังใช่/ไม่ใช่ = null", cmp.yesNoAgree === null);

console.log(`\n✦ perspective: ผ่าน ${pass} · ไม่ผ่าน ${fail}`);
if (fail > 0) process.exit(1);
