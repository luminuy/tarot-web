/**
 * scripts/qa/run-golden-judge.ts
 * ---------------------------------------------------------------------------
 * 🧑‍⚖️ Golden Runner + LLM Judge — ปิดคอลัมน์ `judge_score` ที่ว่างมาตั้งแต่ PR #245
 * (HANDOFF_AI_ACCURACY_THAI A-02)
 *
 * ปัญหาที่สคริปต์นี้แก้: Golden Set 30 เคสมีอยู่จริงตั้งแต่ W1.1 แต่ `test-ai-reading-golden.ts`
 * ตรวจแค่ว่า "ไฟล์ fixture ถูกฟอร์แมต" — **ไม่เคยยิงเข้าโมเดลจริงสักครั้ง**
 * ทุกงาน "ทำให้แม่นขึ้น" จึงพิสูจน์ไม่ได้เลยว่าดีขึ้นหรือแย่ลง
 *
 * ขั้นตอน:
 *   1. อ่าน `fixtures/golden-readings.json` → ประกอบ `ReadingContext` จริง
 *   2. ยิงผ่านเส้นทางเดียวกับ production (`streamGroqReading`)
 *   3. ตรวจด้วยโค้ด: `checkReadingConsistency()` + `checkThaiQuality()` (ต้นทุน 0)
 *   4. ส่งให้ **LLM Judge** ให้คะแนน 6 เกณฑ์ (ภาคผนวก B ของแผน)
 *   5. เขียนรายงาน `scripts/qa/reports/judge-<PROMPT_VERSION>-<timestamp>.json`
 *
 * 🔑 **Judge ต้องเป็นคนละตระกูลกับผู้ผลิต** — ใช้ Gemini ตัดสินคำอ่านที่ Groq/Qwen ผลิต
 *    โมเดลตระกูลเดียวกันให้คะแนนงานตัวเองสูงเกินจริงเป็นระบบ (self-preference bias)
 *
 * ⚠️ **ข้อบังคับด้านต้นทุน**: ใช้คีย์ของนักพัฒนา รันด้วยมือเท่านั้น
 *    ห้ามผูกเข้า CI · ห้ามผูกเข้า `repo:verify` · ห้ามให้แตะเพดาน `isAiCapReached()` ของ production
 *
 * วิธีรัน:
 *   npm run ai:judge                          # ครบ 30 เคส
 *   npm run ai:judge -- --limit 3             # รันเร็วตอนพัฒนา
 *   npm run ai:judge -- --compare 20260904-1  # เทียบกับผลของ prompt version เดิม
 */

import fs from "node:fs";
import path from "node:path";
import { streamGroqReading } from "../../src/lib/ai/groq";
import { getSpread } from "../../src/data/spreads";
import { cardById } from "../../src/data/cards";
import { checkReadingConsistency } from "../../src/lib/ai/consistency";
import { checkThaiQualityDeep } from "../../src/lib/ai/thai-quality";
import { PROMPT_VERSION } from "../../src/lib/ai/prompt-version";
import { geminiEndpoint, aiGatewayHeaders } from "../../src/lib/ai/gateway";
import type { ReadingContext } from "../../src/lib/ai/prompt";
import type { Reading } from "../../src/lib/schema/reading";
import type { Category } from "../../src/data/cards/types";

const REPORT_DIR = path.join(process.cwd(), "scripts/qa/reports");
const FIXTURE = path.join(process.cwd(), "scripts/qa/fixtures/golden-readings.json");

/** โมเดลผู้ตัดสิน — คนละตระกูลกับผู้ผลิตคำอ่านเสมอ */
const JUDGE_MODEL = "gemini-3.6-flash";

/** ภาคผนวก B — เกณฑ์ให้คะแนน 1-5 ทั้ง 6 ข้อ */
const RUBRIC = [
  { key: "onQuestion", label: "ตอบตรงคำถาม" },
  { key: "cardGrounded", label: "ยึดกับภาพไพ่ 1909 จริง" },
  { key: "actionable", label: "ลงมือทำได้จริง" },
  { key: "personaFit", label: "ตรงบุคลิกแม่หมอ" },
  { key: "notVague", label: "ไม่กำกวม (ไม่ใช่ Barnum)" },
  { key: "thaiNatural", label: "ภาษาไทยถูกต้องและเป็นธรรมชาติ" },
] as const;

type RubricKey = (typeof RUBRIC)[number]["key"];

interface GoldenCase {
  id: string;
  category: string;
  spreadId: string;
  question: string;
  cardIds: string[];
  reversed: boolean[];
  personaId?: string;
}

interface CaseResult {
  id: string;
  category: string;
  spreadId: string;
  personaId: string;
  model: string | null;
  elapsedMs: number;
  ok: boolean;
  error?: string;
  consistencyIssues: string[];
  thaiScore: number;
  thaiIssues: string[];
  judge: Partial<Record<RubricKey, number>> & { average?: number; comment?: string };
}

interface JudgeReport {
  promptVersion: string;
  judgeModel: string;
  startedAt: string;
  cases: CaseResult[];
  summary: {
    total: number;
    succeeded: number;
    avgThaiScore: number;
    avgElapsedMs: number;
    consistencyIssueRate: number;
    rubric: Record<RubricKey, number>;
    overall: number;
  };
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function buildContext(gold: GoldenCase): ReadingContext | null {
  const spread = getSpread(gold.spreadId);
  if (!spread) return null;
  const cards = gold.cardIds.map((id) => cardById(id)).filter(Boolean) as ReturnType<typeof cardById>[];
  if (cards.length !== gold.cardIds.length) return null;

  return {
    personaId: gold.personaId ?? null,
    spread,
    category: gold.category as Category,
    question: gold.question,
    intake: {},
    drawn: gold.cardIds.map((_, i) => ({
      order: i,
      cardIndex: i,
      isReversed: Boolean(gold.reversed?.[i]),
    })),
    cards: cards as NonNullable<ReturnType<typeof cardById>>[],
    safety: { flag: "none", block: false },
    lang: "th",
  } as ReadingContext;
}

/**
 * ให้ Gemini ตัดสินคำอ่านตาม rubric 6 ข้อ
 * คืน `null` เมื่อเรียกไม่สำเร็จ — ไม่ throw เพื่อให้เคสที่เหลือรันต่อได้
 */
async function judgeReading(
  gold: GoldenCase,
  reading: Reading,
  apiKey: string
): Promise<CaseResult["judge"] | null> {
  const cardLines = gold.cardIds
    .map((id, i) => {
      const card = cardById(id);
      const pos = getSpread(gold.spreadId)?.positions[i];
      return `- ตำแหน่ง "${pos?.nameTh ?? i + 1}": ${card?.nameTh} (${card?.nameEn}) ${
        gold.reversed?.[i] ? "หัวกลับ" : "หัวตั้ง"
      }`;
    })
    .join("\n");

  const rubricLines = RUBRIC.map((r, i) => `${i + 1}. ${r.key} — ${r.label}`).join("\n");

  const prompt = `คุณคือกรรมการประเมินคุณภาพคำทำนายไพ่ทาโรต์ภาษาไทย ประเมินอย่างเข้มงวดและตรงไปตรงมา

คำถามของผู้ถาม: "${gold.question}"
ไพ่ที่เปิดได้และตำแหน่งในผัง:
${cardLines}

คำอ่านที่ต้องประเมิน (JSON):
${JSON.stringify(reading, null, 2)}

ให้คะแนน 1-5 ทุกเกณฑ์ (5 = ดีเยี่ยม · 1 = แย่มาก):
${rubricLines}

หลักการให้คะแนนที่ต้องยึด:
- "ตอบตรงคำถาม" 5 คะแนน = อ้างรายละเอียดในคำถามได้จริง · 1 คะแนน = พูดกว้าง ๆ ใช้กับคำถามอะไรก็ได้
- "ยึดกับภาพไพ่จริง" 5 คะแนน = อ้างองค์ประกอบที่อยู่บนไพ่ 1909 ใบนั้นจริง · 1 คะแนน = อ้างภาพที่ไม่มีอยู่ หรือไม่อ้างเลย
- "ลงมือทำได้จริง" 5 คะแนน = ทำได้จริงใน 24-48 ชั่วโมงและวัดผลได้ · 1 คะแนน = คำปลอบใจลอย ๆ
- "ไม่กำกวม" 1 คะแนน = เต็มไปด้วยประโยคที่ตีความได้ทุกทาง
- "ภาษาไทยถูกต้อง" 1 คะแนน = มีคำผิด สำนวนแปลตรงตัว หรือทับศัพท์อังกฤษเกลื่อน

ตอบกลับเป็น JSON เท่านั้น รูปแบบ:
{"onQuestion":3,"cardGrounded":3,"actionable":3,"personaFit":3,"notVague":3,"thaiNatural":3,"comment":"เหตุผลสั้น ๆ ไม่เกิน 2 ประโยค"}`;

  try {
    const res = await fetch(geminiEndpoint(JUDGE_MODEL, "generateContent"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        ...aiGatewayHeaders({ cacheTtl: 0 }),
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    });
    if (!res.ok) {
      console.warn(`    ⚠️ judge HTTP ${res.status}`);
      return null;
    }
    const payload: any = await res.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
    const parsed = JSON.parse(text);

    const scores: CaseResult["judge"] = { comment: parsed.comment };
    let sum = 0;
    let n = 0;
    for (const r of RUBRIC) {
      const v = Number(parsed[r.key]);
      if (Number.isFinite(v)) {
        scores[r.key] = v;
        sum += v;
        n++;
      }
    }
    scores.average = n > 0 ? Math.round((sum / n) * 100) / 100 : undefined;
    return scores;
  } catch (err) {
    console.warn("    ⚠️ judge ล้มเหลว:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function runCase(gold: GoldenCase, judgeKey: string | null): Promise<CaseResult> {
  const base: CaseResult = {
    id: gold.id,
    category: gold.category,
    spreadId: gold.spreadId,
    personaId: gold.personaId ?? "default",
    model: null,
    elapsedMs: 0,
    ok: false,
    consistencyIssues: [],
    thaiScore: 0,
    thaiIssues: [],
    judge: {},
  };

  const ctx = buildContext(gold);
  if (!ctx) {
    base.error = "ประกอบ ReadingContext ไม่ได้ (spreadId หรือ cardIds ไม่ถูกต้อง)";
    return base;
  }

  const startedAt = Date.now();
  let reading: Reading | null = null;
  try {
    for await (const event of streamGroqReading(ctx)) {
      if (event.type === "done") {
        reading = event.reading;
        base.model = event.model ?? null;
      }
    }
  } catch (err) {
    base.error = err instanceof Error ? err.message : String(err);
  }
  base.elapsedMs = Date.now() - startedAt;

  if (!reading) {
    base.error = base.error ?? "โมเดล Groq ไม่คืนคำอ่านที่สมบูรณ์";
    return base;
  }
  base.ok = true;

  const consistency = checkReadingConsistency(reading, ctx.cards, {
    drawnCount: ctx.drawn.length,
    yesNoMode: ctx.spread.yesNoMode,
  });
  base.consistencyIssues = consistency.issues.map((i) => i.code);

  const thai = checkThaiQualityDeep(reading, { personaId: ctx.personaId });
  base.thaiScore = thai.score;
  base.thaiIssues = thai.issues.map((i) => i.code);

  if (judgeKey) {
    const judged = await judgeReading(gold, reading, judgeKey);
    if (judged) base.judge = judged;
  }

  return base;
}

function summarize(cases: CaseResult[]): JudgeReport["summary"] {
  const succeeded = cases.filter((c) => c.ok);
  const rubric = {} as Record<RubricKey, number>;
  for (const r of RUBRIC) {
    const vals = cases.map((c) => c.judge[r.key]).filter((v): v is number => typeof v === "number");
    rubric[r.key] = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
  }
  const rubricVals = Object.values(rubric).filter((v) => v > 0);

  return {
    total: cases.length,
    succeeded: succeeded.length,
    avgThaiScore:
      succeeded.length > 0
        ? Math.round(succeeded.reduce((a, c) => a + c.thaiScore, 0) / succeeded.length)
        : 0,
    avgElapsedMs:
      succeeded.length > 0
        ? Math.round(succeeded.reduce((a, c) => a + c.elapsedMs, 0) / succeeded.length)
        : 0,
    consistencyIssueRate:
      succeeded.length > 0
        ? Math.round((succeeded.filter((c) => c.consistencyIssues.length > 0).length / succeeded.length) * 100)
        : 0,
    rubric,
    overall:
      rubricVals.length > 0
        ? Math.round((rubricVals.reduce((a, b) => a + b, 0) / rubricVals.length) * 100) / 100
        : 0,
  };
}

/** หารายงานล่าสุดของ prompt version ที่ระบุ (ใช้กับ --compare) */
function latestReportFor(version: string): JudgeReport | null {
  if (!fs.existsSync(REPORT_DIR)) return null;
  const files = fs
    .readdirSync(REPORT_DIR)
    .filter((f) => f.startsWith(`judge-${version}-`) && f.endsWith(".json"))
    .sort();
  if (files.length === 0) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(REPORT_DIR, files[files.length - 1]), "utf-8"));
  } catch {
    return null;
  }
}

function printComparison(current: JudgeReport, previous: JudgeReport) {
  console.log(`\n📊 เทียบ ${previous.promptVersion} → ${current.promptVersion}`);
  console.log("─".repeat(70));
  for (const r of RUBRIC) {
    const before = previous.summary.rubric[r.key] ?? 0;
    const after = current.summary.rubric[r.key] ?? 0;
    const delta = Math.round((after - before) * 100) / 100;
    const mark = delta > 0.05 ? "🟢 ดีขึ้น" : delta < -0.05 ? "🔴 แย่ลง" : "⚪ เท่าเดิม";
    console.log(
      `  ${r.label.padEnd(32)} ${before.toFixed(2)} → ${after.toFixed(2)}  (${delta >= 0 ? "+" : ""}${delta})  ${mark}`
    );
  }
  const thaiDelta = current.summary.avgThaiScore - previous.summary.avgThaiScore;
  console.log(
    `  ${"คะแนนภาษาไทยจากโค้ด (0-100)".padEnd(32)} ${previous.summary.avgThaiScore} → ${current.summary.avgThaiScore}  (${
      thaiDelta >= 0 ? "+" : ""
    }${thaiDelta})`
  );
  console.log("\n⚠️ judge คือตัวชี้วัดรอง — ถ้า judge บอกดีขึ้นแต่ ACCURATE จากคนจริงลดลง ให้เชื่อคนจริงและย้อนกลับทันที");
}

/**
 * โหมดซ้อมแห้ง — ประกอบ ReadingContext ของทุกเคสโดยไม่ยิงเข้าโมเดลเลย
 * ใช้ตรวจว่า fixture กับสำรับ/ผังยังตรงกันอยู่ (รันได้ในเครื่องที่ไม่มีคีย์ และใน CI)
 */
const VALID_CATEGORIES = ["general", "love", "work", "money", "self"];

function dryRun(cases: GoldenCase[]): number {
  let broken = 0;
  for (const gold of cases) {
    // ⚠️ กับดักที่เคยเหยียบมาแล้ว: fixture เคยใช้ "finance" ซึ่งเป็น **id ของชิปใน UI**
    // ไม่ใช่ค่า Category จริง (`money`) ➔ `card.meanings[category]` เป็น undefined เงียบ ๆ
    // แล้วตกไปใช้ความหมายหมวด general — เคสการเงิน 6 เคสจึงไม่เคยทดสอบหมวดการเงินเลย
    if (!VALID_CATEGORIES.includes(gold.category)) {
      broken++;
      console.log(`  ❌ ${gold.id}: category "${gold.category}" ไม่ใช่ค่าที่ระบบรู้จัก (${VALID_CATEGORIES.join(" | ")})`);
      continue;
    }
    const ctx = buildContext(gold);
    if (!ctx) {
      broken++;
      console.log(`  ❌ ${gold.id}: ประกอบ ReadingContext ไม่ได้ (spreadId="${gold.spreadId}")`);
      continue;
    }
    const positions = ctx.spread.positions.length;
    const mismatch = positions !== gold.cardIds.length;
    if (mismatch) {
      broken++;
      console.log(`  ❌ ${gold.id}: ผังต้องการ ${positions} ใบ แต่ fixture ให้ ${gold.cardIds.length} ใบ`);
    } else {
      console.log(`  ✅ ${gold.id}: ${gold.category}/${gold.spreadId} · ${gold.cardIds.length} ใบ พร้อมยิง`);
    }
  }
  return broken;
}

function loadEnvIfPresent() {
  for (const file of [".env", ".env.local"]) {
    const p = path.join(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    const lines = fs.readFileSync(p, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  loadEnvIfPresent();
  const groqKey = process.env.GROQ_API_KEY;
  const judgeKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;

  const isDryRun = process.argv.includes("--dry-run");
  if (isDryRun) {
    const all: GoldenCase[] = JSON.parse(fs.readFileSync(FIXTURE, "utf-8"));
    const limitArg = Number(arg("limit") ?? 0);
    const subset = limitArg > 0 ? all.slice(0, limitArg) : all;
    console.log(`\n🧪 ซ้อมแห้ง (ไม่เรียกโมเดล) — ${subset.length} เคส`);
    const broken = dryRun(subset);
    console.log(broken === 0 ? "\n✨ ทุกเคสประกอบบริบทได้ครบ" : `\n❌ มี ${broken} เคสที่ประกอบไม่ได้`);
    if (broken > 0) process.exit(1);
    return;
  }

  if (!groqKey) {
    console.log("\n🔑 ยังรันไม่ได้ — สคริปต์นี้ต้องยิงเข้าโมเดลจริง");
    console.log("   ตั้งค่าก่อนรัน:");
    console.log("     export GROQ_API_KEY=<คีย์ของนักพัฒนา>        # ผู้ผลิตคำอ่าน (บังคับ)");
    console.log("     export GEMINI_API_KEY=<คีย์ของนักพัฒนา>      # ผู้ตัดสิน (ไม่ใส่ = ตรวจด้วยโค้ดอย่างเดียว)");
    console.log("\n   ⚠️ ใช้คีย์ของนักพัฒนาเท่านั้น ห้ามผูกสคริปต์นี้เข้า CI หรือ repo:verify");
    return; // จบอย่างสุภาพ ไม่ throw
  }
  if (!judgeKey) {
    console.log("⚠️ ไม่พบ GEMINI_API_KEY — จะรันเฉพาะการตรวจด้วยโค้ด (ไม่มีคะแนน judge)");
  }

  const limit = Number(arg("limit") ?? 0);
  const compareWith = arg("compare");
  const delayArg = Number(arg("delay") ?? 50000);

  const golden: GoldenCase[] = JSON.parse(fs.readFileSync(FIXTURE, "utf-8"));
  const cases = limit > 0 ? golden.slice(0, limit) : golden;

  console.log(`\n🧑‍⚖️ Golden Runner + LLM Judge`);
  console.log(`   prompt version : ${PROMPT_VERSION}`);
  console.log(`   จำนวนเคส        : ${cases.length} / ${golden.length}`);
  console.log(`   ผู้ตัดสิน        : ${judgeKey ? JUDGE_MODEL : "— (ไม่มีคีย์)"}`);
  if (delayArg > 0) {
    console.log(`   คูลดาวน์ rate limit : ${Math.round(delayArg / 1000)}s ระหว่างเคส`);
  }
  console.log("─".repeat(70));

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(REPORT_DIR, `judge-${PROMPT_VERSION}-${stamp}.json`);

  const results: CaseResult[] = [];
  for (const [i, gold] of cases.entries()) {
    if (i > 0 && delayArg > 0) {
      process.stdout.write(`⏳ รอคูลดาวน์ ${Math.round(delayArg / 1000)}s ... `);
      await new Promise((r) => setTimeout(r, delayArg));
    }
    process.stdout.write(`  [${i + 1}/${cases.length}] ${gold.id} (${gold.category}/${gold.spreadId}) ... `);
    let result = await runCase(gold, judgeKey);

    let retries = 0;
    while (!result.ok && retries < 3) {
      retries++;
      process.stdout.write(`⚠️ ลองใหม่รอบที่ ${retries} (รอ 35s) ... `);
      await new Promise((r) => setTimeout(r, 35000));
      result = await runCase(gold, judgeKey);
    }

    results.push(result);
    if (!result.ok) {
      console.log(`❌ ${result.error}`);
    } else {
      const avg = result.judge.average;
      console.log(
        `✅ ${result.elapsedMs}ms · ไทย ${result.thaiScore}/100${avg ? ` · judge ${avg.toFixed(2)}/5` : ""}${
          result.consistencyIssues.length > 0 ? ` · ⚠️ ${result.consistencyIssues.join(",")}` : ""
        }`
      );
    }

    // เขียนไฟล์รายงานความคืบหน้าระหว่างรัน
    const currentReport: JudgeReport = {
      promptVersion: PROMPT_VERSION,
      judgeModel: judgeKey ? JUDGE_MODEL : "none",
      startedAt: new Date().toISOString(),
      cases: results,
      summary: summarize(results),
    };
    fs.writeFileSync(outPath, JSON.stringify(currentReport, null, 2), "utf-8");
  }

  const report: JudgeReport = {
    promptVersion: PROMPT_VERSION,
    judgeModel: judgeKey ? JUDGE_MODEL : "none",
    startedAt: new Date().toISOString(),
    cases: results,
    summary: summarize(results),
  };
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("\n" + "═".repeat(70));
  console.log(`📊 สรุปผล (${report.summary.succeeded}/${report.summary.total} เคสสำเร็จ)`);
  for (const r of RUBRIC) {
    console.log(`   ${r.label.padEnd(32)} ${report.summary.rubric[r.key].toFixed(2)} / 5`);
  }
  console.log(`   ${"คะแนนรวมเฉลี่ย".padEnd(32)} ${report.summary.overall.toFixed(2)} / 5`);
  console.log(`   ${"คะแนนภาษาไทยจากโค้ด".padEnd(32)} ${report.summary.avgThaiScore} / 100`);
  console.log(`   ${"เวลาสร้างคำอ่านเฉลี่ย".padEnd(32)} ${report.summary.avgElapsedMs} ms`);
  console.log(`   ${"เคสที่ติดด่านความสอดคล้อง".padEnd(32)} ${report.summary.consistencyIssueRate}%`);
  console.log(`\n💾 รายงาน: ${path.relative(process.cwd(), outPath)}`);

  if (compareWith) {
    const previous = latestReportFor(compareWith);
    if (!previous) {
      console.log(`\n⚠️ ไม่พบรายงานของเวอร์ชัน "${compareWith}" ใน ${path.relative(process.cwd(), REPORT_DIR)}`);
    } else {
      printComparison(report, previous);
    }
  }
}

main().catch((err) => {
  console.error("💥 run-golden-judge ล้มเหลว:", err);
  process.exit(1);
});
