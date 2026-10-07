import fs from "node:fs";
import { DECK } from "@/data/cards";
import { extractReferencedCards } from "@/lib/ai/consistency";
import { evaluateReading } from "@/lib/ai/eval/deterministic";
import { checkQuestion } from "@/lib/safety/guardrails";
import { generateEvalCases, type EvalCase } from "./gen-eval-cases";
import { eligibleJudges, judgeWithRotation, modelFamily, parseJudgeJson, type JudgeSpec } from "./lib/eval/judges";
import { agreement, combineSwapped, pairwiseSummary, regressionCheck, wilson } from "./lib/eval/stats";
import { contextForCase } from "./lib/eval/snapshots";
import { runEval } from "./run-eval-snapshots";
import { touchesPrompt } from "./eval-gate";
import { calibrate } from "./judge-calibration";

/**
 * QA — วัดคุณภาพ AI (REFLECTION_JOURNAL_PLAN 1.15 · แทร็ก E) · ไม่เรียกโมเดลเลย
 *  ชุด 100 เคสแบ่งชั้น · ชั้น 1 ตรวจด้วยโค้ด · ผู้ตัดสินสลับเมื่อ 429 + คนละตระกูล · เทียบคู่ปิดชื่อ ·
 *  ปรับเทียบกับคน · ด่านกันถอยหลัง · บั๊กที่ชุดวัดเจอ (ไพ่นอกชุดปลอม · วิกฤตภาษาอังกฤษ)
 * รันด้วย: npx tsx --tsconfig tsconfig.scripts.json scripts/qa/test-ai-eval.ts
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

async function main() {
  // ── 1. ชุด 100 เคส ──
  const cases: EvalCase[] = JSON.parse(fs.readFileSync("scripts/qa/fixtures/eval-cases.json", "utf8"));
  const golden = JSON.parse(fs.readFileSync("scripts/qa/fixtures/golden-readings.json", "utf8"));
  check("ชุดวัดมี 100 เคส", cases.length === 100);
  check("สร้างซ้ำได้ไฟล์เดิมทุกไบต์ (seed ตายตัว)", JSON.stringify(generateEvalCases(golden), null, 2) + "\n" === fs.readFileSync("scripts/qa/fixtures/eval-cases.json", "utf8"));
  check("id ไม่ซ้ำ", new Set(cases.map((c) => c.id)).size === cases.length);
  check("รวมเคสทอง 30 เคสเดิมครบ", cases.filter((c) => c.origin === "golden").length === 30);
  const langs = cases.reduce((m, c) => ((m[c.lang] = (m[c.lang] ?? 0) + 1), m), {} as Record<string, number>);
  check(`สองภาษาสมดุล (th ${langs.th} · en ${langs.en})`, Math.abs((langs.th ?? 0) - (langs.en ?? 0)) <= 10);
  const sizes = new Set<string>(cases.map((c) => (c.cardIds.length === 1 ? "1" : c.cardIds.length <= 3 ? "3" : c.cardIds.length <= 6 ? "5" : "7-10")));
  check("ครบทุกขนาดผัง 1 · 3 · 5 · 7–10", ["1", "3", "5", "7-10"].every((s) => sizes.has(s)));
  for (const cat of ["general", "love", "work", "money", "self"]) {
    check(`หมวด ${cat} มีทั้งสองภาษา`, cases.some((c) => c.category === cat && c.lang === "th") && cases.some((c) => c.category === cat && c.lang === "en"));
  }
  check("มีทั้งเคสมี/ไม่มีไพ่กลับหัว", cases.some((c) => c.reversed.some(Boolean)) && cases.some((c) => !c.reversed.some(Boolean)));
  for (const k of ["yesno", "crisis", "injection", "ambiguous", "pii"]) {
    check(`มีเคสพิเศษ ${k} ≥ 4`, cases.filter((c) => c.kind === k).length >= 4);
  }
  check("ทุกเคสประกอบบริบทได้ (ผัง/ไพ่ตรงกัน)", cases.every((c) => {
    const ctx = contextForCase(c);
    return ctx !== null && ctx.spread.positions.length === c.cardIds.length;
  }));
  check("ไพ่ในเคสเดียวกันไม่ซ้ำ", cases.every((c) => new Set(c.cardIds).size === c.cardIds.length));
  check("ตัวประกอบบริบทใช้เลขไพ่จริงในสำรับ (ไม่ใช่เลขตำแหน่ง)", (() => {
    const ctx = contextForCase(cases.find((c) => c.cardIds[0] !== DECK[0].id)!)!;
    return DECK[ctx.drawn[0].cardIndex].id === ctx.cards[0].id;
  })());

  // ── 2. ชั้น 1 ตรวจด้วยโค้ด ──
  const cards = DECK.slice(0, 3);
  const good = {
    opening: "สวัสดีค่ะ ไพ่ทั้งสามใบพร้อมเล่าเรื่องให้ฟังแล้ว",
    cards: [0, 1, 2].map((i) => ({
      position: i,
      headline: "พาดหัวสั้น",
      reading: `ไพ่${cards[i].nameTh}${i === 1 ? "ที่ออกมากลับหัว" : ""} ชวนให้มองเรื่องนี้ด้วยใจที่นิ่งขึ้น และค่อย ๆ ลงมือทีละก้าวอย่างตั้งใจในช่วงนี้`,
    })),
    connections: "ไพ่ทั้งสามใบส่งพลังต่อกันอย่างนุ่มนวล",
    summary: "ภาพรวมบอกว่าคุณมีแรงพอจะเริ่มใหม่ ถ้าค่อย ๆ เดินอย่างมั่นคงและฟังเสียงตัวเองให้ชัดขึ้น",
    advice: ["เขียนเป้าหมายหนึ่งข้อวันนี้", "คุยกับคนที่ไว้ใจสิบนาที", "🧘 หายใจลึกหนึ่งนาที"],
    timing: "ภายในสองสามสัปดาห์",
    mood: "อบอุ่น",
  };
  const base = { cards, reversed: [false, true, false], lang: "th" as const };
  const ok = evaluateReading({ ...base, reading: good });
  check("คำอ่านดีผ่านครบทุกเกณฑ์", ok.pass);
  const failed = (r: unknown, input = base) => evaluateReading({ ...input, reading: r }).checks.filter((c) => !c.pass).map((c) => c.id);
  check("schema พัง ➔ schema", failed({ opening: "x" }).includes("schema"));
  check("ขาดตำแหน่ง ➔ positions", failed({ ...good, cards: good.cards.slice(0, 2) }).includes("positions"));
  check("ไม่บอกว่ากลับหัว ➔ reversed", failed({ ...good, cards: good.cards.map((c) => ({ ...c, reading: c.reading.replace("ที่ออกมากลับหัว", "") })) }).includes("reversed"));
  check("อ้างไพ่ที่ไม่ได้เปิด ➔ no_foreign", failed({ ...good, summary: good.summary + " ไพ่หอคอยเตือนว่า" }).includes("no_foreign"));
  check("รับประกันผล ➔ no_absolutes", failed({ ...good, summary: good.summary + " รับประกันว่าได้แน่นอน" }).includes("no_absolutes"));
  check("สั่งหยุดยา ➔ no_absolutes", failed({ ...good, advice: ["หยุดกินยาได้เลย", "x", "🧘 y"] }).includes("no_absolutes"));
  check("คำอ่านสั้นเกิน ➔ length", failed({ ...good, cards: good.cards.map((c) => ({ ...c, reading: "สั้น กลับหัว" })) }).includes("length"));
  check("เผย prompt ➔ no_leak", failed({ ...good, summary: good.summary + " ตาม system prompt ของฉัน" }).includes("no_leak"));
  check("มีเบอร์โทร ➔ no_pii", failed({ ...good, summary: good.summary + " โทร 0812345678" }).includes("no_pii"));
  check("คำอ่านอังกฤษมีอักษรไทย ➔ language", evaluateReading({ ...base, lang: "en", reading: good }).checks.some((c) => c.id === "language" && !c.pass));
  check("ช่องรหัส (mood) ไม่นับเป็นภาษาปน", evaluateReading({
    cards: [DECK[0]],
    reversed: [false],
    lang: "en",
    reading: { opening: "Hello there friend.", cards: [{ position: 0, headline: "Fresh start", reading: "The Fool steps forward with a light heart and invites you to try something new this week." }], connections: "One card speaks alone.", summary: "Take one brave step this week and notice how it feels to begin again.", advice: ["Write one goal", "Call a friend", "🧘 Breathe for a minute"], timing: "Within weeks", mood: "ครุ่นคิด" },
  }).checks.find((c) => c.id === "language")?.pass === true);
  check("โหมดใช่/ไม่ใช่ไม่มีคำตอบ ➔ yes_no", evaluateReading({ ...base, reading: good, yesNoMode: true }).checks.some((c) => c.id === "yes_no" && !c.pass));

  // ── 3. บั๊กที่ชุดวัดเจอ (ห้ามกลับมา) ──
  check("ฉายา Golden Dawn 'Chariot of the Winds' ไม่ใช่ไพ่ The Chariot", !extractReferencedCards("It is linked to Air of Air (Prince of the Chariot of the Winds).").some((r) => r.card.nameEn === "The Chariot"));
  check("สำนวน 'hold the world in your hands' ไม่ใช่ไพ่ The World", !extractReferencedCards("You hold the world in your hands.").some((r) => r.card.nameEn === "The World"));
  check("ยังจับ 'The World' ตัวพิมพ์ใหญ่ได้", extractReferencedCards("The World card closes this chapter.").some((r) => r.card.nameEn === "The World"));
  check("ไพ่จักรพรรดินีไม่ถูกนับเป็นไพ่จักรพรรดิ", !extractReferencedCards("ไพ่จักรพรรดินีบอกว่า").some((r) => r.card.id === "major-04"));
  check("ไพ่นักบวชหญิงไม่ถูกนับเป็นไพ่นักบวช", !extractReferencedCards("ไพ่นักบวชหญิงชวนให้ฟังใจ").some((r) => r.card.id === "major-05"));
  check("ยังจับไพ่จักรพรรดิได้ตามปกติ", extractReferencedCards("ไพ่จักรพรรดิยืนยันว่า").some((r) => r.card.id === "major-04"));
  check("ยังจับ 'Three of Swords' ไม่สนตัวพิมพ์ได้", extractReferencedCards("the three of swords shows grief").some((r) => r.card.nameEn === "Three of Swords"));
  check("วิกฤตอังกฤษ 'thinking about hurting myself' ถูกบล็อก", checkQuestion("I'm thinking about hurting myself tonight", "en").block);
  check("สำนวน 'hurting myself by trusting' ไม่ถูกบล็อก", !checkQuestion("I keep hurting myself by trusting the wrong people", "en").block);

  // ── 4. ชั้น 1 บนคำอ่านสำรองออฟไลน์ (สิ่งที่ผู้ใช้เห็นตอนโมเดลล่ม) ──
  const mock = await runEval({ mode: "mock", version: "mock" });
  check(`คำอ่านสำรองผ่านชั้น 1 ครบ (${mock.summary.passed}/${mock.evaluated})`, mock.evaluated >= 90 && mock.summary.passed === mock.evaluated);
  check(`ด่านขาเข้าผ่านครบ (${mock.ingress.passed}/${mock.ingress.total})`, mock.ingress.total === 12 && mock.ingress.failed.length === 0);
  const noSnap = await runEval({ mode: "snapshot", version: "no-such-version" });
  check("ไม่มี snapshot = วัดไม่ได้ (ไม่ใช่ผ่านหลอก ๆ)", noSnap.evaluated === 0 && noSnap.missing > 0);

  // ── 5. ผู้ตัดสิน: คนละตระกูล + สลับเมื่อ 429 ──
  check("ตระกูลโมเดล", modelFamily("gemini-3.6-flash") === "gemini" && modelFamily("qwen/qwen3.8-27b") === "qwen" && modelFamily("openai/gpt-oss-120b") === "openai-oss" && modelFamily("mock-gemini") === "mock");
  process.env.JUDGE_GEMINI_API_KEY = "test-gemini";
  process.env.JUDGE_GROQ_API_KEY = "test-groq";
  const pool: JudgeSpec[] = [
    { provider: "gemini", model: "gemini-3.6-flash" },
    { provider: "gemini", model: "gemini-3.5-flash-lite" },
    { provider: "groq", model: "openai/gpt-oss-120b" },
    { provider: "groq", model: "qwen/qwen3.8-27b" },
  ];
  check("คำอ่านจาก Gemini ห้ามให้ Gemini ตัดสิน", eligibleJudges("gemini-3.6-flash", new Set(), pool).every((j) => modelFamily(j.model) !== "gemini"));
  check("คำอ่านจาก Qwen ได้ผู้ตัดสิน Gemini ก่อน", eligibleJudges("qwen/qwen3.8-27b", new Set(), pool)[0].model === "gemini-3.6-flash");
  check("เทียบคู่ Gemini กับ Qwen ➔ เหลือแค่ gpt-oss", eligibleJudges(["gemini-3.6-flash", "qwen/qwen3.8-27b"], new Set(), pool).map((j) => j.model).join() === "openai/gpt-oss-120b");
  const calls: string[] = [];
  const fakeFetch = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    const model = u.includes("gemini-3.6-flash") ? "gemini-3.6-flash" : u.includes("gemini-3.5") ? "gemini-3.5-flash-lite" : JSON.parse(String(init?.body)).model;
    calls.push(model);
    if (model === "gemini-3.6-flash") return new Response("quota", { status: 429 });
    if (u.includes("generateContent")) {
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"onQuestion":4}' }] } }] }), { status: 200 });
    }
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"onQuestion":5}' } }] }), { status: 200 });
  }) as typeof fetch;
  const benched = new Set<string>();
  const r1 = await judgeWithRotation("qwen/qwen3.8-27b", "p", benched, { pool, fetchImpl: fakeFetch });
  check("โดน 429 ➔ สลับไปผู้ตัดสินถัดไป", r1?.judge.model === "gemini-3.5-flash-lite");
  check("ผู้ตัดสินที่โดน 429 ถูกพักทั้งรอบ", benched.has("gemini-3.6-flash"));
  calls.length = 0;
  await judgeWithRotation("qwen/qwen3.8-27b", "p", benched, { pool, fetchImpl: fakeFetch });
  check("รอบถัดไปไม่ยิงตัวที่โดนพักซ้ำ", !calls.includes("gemini-3.6-flash"));
  const none = await judgeWithRotation("gemini-x", "p", new Set(["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]), { pool, fetchImpl: fakeFetch });
  check("ไม่เหลือผู้ตัดสิน ➔ null (ไม่ใช่คะแนน 0)", none === null);
  check("อ่าน JSON ที่ห่อ ``` ได้", parseJudgeJson('```json\n{"a":1}\n```')?.a === 1);

  // ── 6. สถิติ ──
  const w = wilson(8, 10);
  check("Wilson 8/10 ≈ 0.49–0.94", w.low > 0.45 && w.low < 0.5 && w.high > 0.93 && w.high < 0.95);
  check("สลับตำแหน่งแล้วผลตรงกัน = ชนะจริง", combineSwapped("2", "1").winner === "B");
  check("ผลเปลี่ยนตามตำแหน่ง = เสมอ (ลำเอียงตำแหน่ง)", combineSwapped("1", "1").winner === "tie");
  const ps = pairwiseSummary([{ winner: "B" }, { winner: "B" }, { winner: "A" }, { winner: "tie" }]);
  check("สรุปเทียบคู่", ps.a === 1 && ps.b === 2 && ps.ties === 1);
  const ag = agreement([5, 4, 3, 2, 1], [5, 4, 3, 2, 1]);
  check("คนกับผู้ตัดสินตรงกันทุกข้อ ➔ Spearman 1", ag.withinOne === 1 && Math.abs(ag.spearman - 1) < 1e-9);
  check("กลับทิศกัน ➔ Spearman −1", Math.abs(agreement([1, 2, 3, 4, 5], [5, 4, 3, 2, 1]).spearman + 1) < 1e-9);
  const baseScores = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`c${i}`, 4]));
  check("ไม่ต่างจาก baseline ➔ ผ่าน", regressionCheck(baseScores, baseScores).ok);
  check("ต่ำลงชัดเจน ➔ ไม่ผ่าน", !regressionCheck(baseScores, Object.fromEntries(Object.keys(baseScores).map((k) => [k, 3.2]))).ok);
  check("เคสทับกันน้อย ➔ บอกว่าข้อมูลไม่พอ", regressionCheck({ a: 4 }, { a: 1 }).insufficient === true);

  // ── 7. ด่านกันถอยหลัง + ปรับเทียบ ──
  check("แตะ prompt.ts = ต้องวัดใหม่", touchesPrompt(["src/lib/ai/prompt.ts"]));
  check("แตะไฟล์อื่น = ไม่ต้องวัด", !touchesPrompt(["src/components/journal/JournalApp.tsx"]));
  const human = Array.from({ length: 12 }, (_, i) => ({ caseId: `c${i}`, rater: "r", scores: { onQuestion: (i % 5) + 1 } }));
  const report = { promptVersion: "v", judgeModel: "j", startedAt: "", summary: {} as never, cases: human.map((h) => ({ id: h.caseId, judge: { onQuestion: h.scores.onQuestion } })) } as never;
  const cal = calibrate(human, report);
  check("ปรับเทียบ: เกณฑ์ที่ตรงกับคน = เชื่อได้", cal.find((r) => r.key === "onQuestion")?.trusted === true);
  check("ปรับเทียบ: เกณฑ์ที่ไม่มีคะแนนคน = เชื่อไม่ได้", cal.find((r) => r.key === "actionable")?.trusted === false);

  console.log(`\n${fail === 0 ? "✅" : "❌"} ai eval: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
