import { readFileSync } from "node:fs";
import { classifyQuestion, computePatterns, validateObservations } from "../../src/lib/journal/patterns";
import type { SavedReadingItem } from "../../src/lib/utils/history";

/**
 * QA — "สิ่งที่สมุดของคุณสะท้อน" (REFLECTION_JOURNAL_PLAN 1.5 · คลื่น 4)
 * รันด้วย: npx tsx scripts/qa/test-reflect.ts
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

const mk = (i: number, q: string, cards: Array<[number, boolean]>, extra: Partial<SavedReadingItem> = {}): SavedReadingItem => ({
  id: `rj_${i}`,
  date: new Date(Date.UTC(2026, 8, 1 + i * 3)).toISOString(),
  question: q,
  spreadId: "three-card",
  spreadName: "s",
  category: "love",
  personaId: "warm",
  personaName: "p",
  summary: "",
  advice: [],
  cards: cards.map(([cardIndex, isReversed], order) => ({ order, positionName: `p${order}`, cardIndex, cardNameTh: "", isReversed })),
  ...extra,
});

const SECRET = "ความลับส่วนตัวมากของผู้ใช้";
const entries = [
  mk(1, `เขาคิดยังไงกับฉัน ${SECRET}`, [[6, false], [37, false], [15, true]], { moodBefore: 2, moodAfter: 4, outcome: "PARTIAL" }),
  mk(2, "แฟนเก่าจะกลับมาไหม เขารู้สึกยังไง", [[6, false], [40, false], [41, false]], { moodBefore: 2, moodAfter: 3, outcome: "NOT_HAPPENED" }),
  mk(3, "ฉันควรทำอย่างไรกับความรู้สึกตัวเอง", [[6, true], [9, false], [55, false]], { moodBefore: 3, moodAfter: 4 }),
  mk(4, "ฉันควรเริ่มใหม่ยังไงดี", [[38, false], [9, false], [19, false]], { moodBefore: 2, moodAfter: 4, outcome: "ACCURATE" }),
];
const res = computePatterns(entries);
check("รหัสอ้างอิงเรียงตามเวลา r1..r4", res.refs.map((r) => r.ref).join() === "r1,r2,r3,r4" && res.refs[0].entryId === "rj_1");
check("พอจะเห็นรูปแบบ (≥3)", res.enough);
check("มีข้อเท็จจริงอย่างน้อย 3 ข้อ", res.facts.length >= 3);
const valid = new Set(res.refs.map((r) => r.ref));
check("ทุกข้อเท็จจริงอ้างรหัสที่มีจริง", res.facts.every((f) => f.refs.length > 0 && f.refs.every((r) => valid.has(r))));
check("ไพ่ The Lovers ซ้ำ 3 ครั้งถูกจับ", res.facts.some((f) => f.kind === "card-repeat" && /คนรัก|Lovers/.test(f.th + f.en)));
check("ใจเบาลงหลังเปิดไพ่ถูกจับ", res.facts.some((f) => f.kind === "mood"));
check("ชนิดคำถามเปลี่ยน (อีกฝ่าย ➔ ตัวเอง) ถูกจับ", res.facts.some((f) => f.kind === "question-shift"));
check("ไม่มีข้อความคำถามรั่วในข้อเท็จจริง", !JSON.stringify(res).includes(SECRET) && !JSON.stringify(res).includes("แฟนเก่า"));
check("คำอ่านน้อยกว่า 3 = ยังน้อยเกิน", !computePatterns(entries.slice(0, 2)).enough);
check("รายการพังไม่ถูกนับ", computePatterns([...entries, { ...mk(9, "x", [[1, false]]), corrupted: true }]).refs.length === 4);
check("จัดชนิดคำถาม: อีกฝ่าย", classifyQuestion("เขาคิดยังไงกับฉัน") === "other");
check("จัดชนิดคำถาม: ตัวเอง", classifyQuestion("ฉันควรทำอย่างไรดี") === "self");
check("จัดชนิดคำถาม: เวลา", classifyQuestion("เมื่อไหร่จะได้งาน") === "timing");

// ── ด่านตรวจคำตอบ AI ──
const raw = [
  { text: "ความรักวนกลับมาให้คุณทบทวน", refs: ["r1", "r2"] },
  { text: "ข้อนี้อ้างรหัสปลอม", refs: ["r99"] },
  { text: "ไม่มีอ้างอิงเลย", refs: [] },
  { text: "ความรักจะเกิดขึ้นแน่นอนเดือนหน้า", refs: ["r1"] },
  { text: "ในเนื้อหาอ้าง r42 ที่ไม่มีจริง", refs: ["r1"] },
  { text: "ใจคุณเบาลงหลังเปิดไพ่ (r1, r4)", refs: ["r1", "r4"] },
];
const ok = validateObservations(raw, valid, false);
check("เก็บเฉพาะข้อที่มีหลักฐานจริง (2 ข้อ)", ok.length === 2);
check("ตัดรหัสออกจากข้อความที่แสดง", ok.every((o) => !/\br\d+\b/.test(o.text)));
check("อังกฤษมีอักษรไทย = ตัดทิ้ง", validateObservations([{ text: "ความรัก", refs: ["r1"] }], valid, true).length === 0);
check("ไม่ใช่อาร์เรย์ = ว่าง", validateObservations({ nope: 1 }, valid, false).length === 0);

// ── ตรวจโค้ดเส้น API ──
const route = readFileSync("src/app/api/journal/reflect/route.ts", "utf8");
const promptPart = route.slice(route.indexOf("const prompt = isEn"), route.indexOf("const ai = await"));
check("prompt ไม่มีข้อความคำถามผู้ใช้", !/\.question\b|e\.question|r\.question/.test(promptPart));
check("prompt ไม่มีใจตอนนี้/แท็ก", !/mood|tags/.test(promptPart));
check("บันทึกเข้า prompt เฉพาะที่ยินยอม", /e\.shareWithAi && e\.userNote/.test(route));
check("มีด่านวิกฤต 1323", /checkQuestion/.test(route) && /crisis: true/.test(route));
check("มีทางสำรองเมื่อ AI ล่ม", /models_down/.test(route) && /unusable_output/.test(route));
check("มีเพดานถี่ + งบ AI", /consumeEdgeRateLimits/.test(route) && /isAiCapReached/.test(route));
const monthly = readFileSync("src/app/api/journal/monthly-summary/route.ts", "utf8");
check("สรุปรายเดือนส่งบันทึกเฉพาะที่ยินยอม", /r\.shareWithAi \? sanitizePromptValue\(r\.userNote/.test(monthly));

console.log(`\n✦ reflect: ผ่าน ${pass} · ไม่ผ่าน ${fail}`);
if (fail > 0) process.exit(1);
