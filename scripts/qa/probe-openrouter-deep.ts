/**
 * scripts/qa/probe-openrouter-deep.ts
 * ---------------------------------------------------------------------------
 * 🧪 ทดสอบเชิงลึกเฉพาะ "ผู้รอดรอบแรก" จาก `probe-openrouter.ts`
 * ก่อนตัดสินใจต่อเข้า production เป็น Tier 3 ในสาย failover (Groq → Gemini → OpenRouter?)
 *
 * ทำไมต้องมีสคริปต์นี้ (INC-0053 — ห้ามเดา ต้องวัดจริงซ้ำหลายครั้ง):
 * รอบแรก (probe-openrouter.ts) ยิงคำถามสั้น 1 ครั้ง/โมเดล ก็เจอ false positive แล้ว:
 *   - nvidia/nemotron-3.5-lightning:free ตอบเป็นอังกฤษทั้งที่สั่งไทย (regex เดิมจับได้แค่ CJK/อาหรับ ฯลฯ ไม่จับอังกฤษ)
 *   - nvidia/nemotron-3.5-content-safety:free เป็นโมเดลตรวจเนื้อหาอันตราย ไม่ใช่แชท (ตอบไม่ตรงคำถามเลย)
 *   - openrouter/free เป็น auto-router สลับโมเดลใต้ทุกครั้ง ไม่คงที่พอจะ pin ใช้จริง
 * ต้องเดา 1 ครั้งไม่พอ (บทเรียนเดียวกับ gemini-3.7-flash ที่เคยอยู่ในลิสต์แต่ตายสนิท 0/3)
 *
 * สคริปต์นี้ทำ 2 ชั้นต่อโมเดล:
 *   A) ยิงคำถามไทยสั้น **3 ครั้ง** วัดอัตราสำเร็จ + latency เฉลี่ย + เช็กอังกฤษปน (ไม่ใช่แค่ CJK)
 *   B) ยิง **คำอ่านไพ่เต็มรูปแบบ 1 ครั้ง** ด้วย prompt จริงที่ใช้ใน production
 *      (buildSystemPrompt + buildReadingMessage จาก golden case เดียวกับที่ ai:judge ใช้)
 *      แล้วตรวจด้วยด่านเดียวกับที่ groq.ts/gemini.ts ใช้จริง:
 *        - ReadingSchema.safeParse()
 *        - checkReadingConsistency() (กฎเหล็กข้อ 14 — ห้ามมโนไพ่)
 *        - enforceThaiQuality() (คะแนนภาษาไทย 0-100)
 *
 * ⚠️ ต้นทุน: โมเดลฟรี ไม่มีค่าใช้จ่าย แต่มี rate limit ต่ำ (20 req/min รวมกันทั้งบัญชี)
 *    รันด้วยมือเท่านั้น ห้ามผูกเข้า CI / repo:verify (เหมือน ai:judge และ probe-openrouter.ts)
 *
 * วิธีรัน:
 *   export OPENROUTER_API_KEY=sk-or-...
 *   npx tsx scripts/qa/probe-openrouter-deep.ts
 */

import fs from "node:fs";
import path from "node:path";
import { hasForeignScript } from "../../src/lib/ai/language";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "../../src/lib/ai/prompt";
import { getContentOverrides, resolvePersona, resolveSystemCore } from "../../src/lib/content/overrides";
import { ReadingSchema } from "../../src/lib/schema/reading";
import { checkReadingConsistency } from "../../src/lib/ai/consistency";
import { enforceThaiQuality } from "../../src/lib/ai/thai-quality";
import { getSpread } from "../../src/data/spreads";
import { cardById } from "../../src/data/cards";
import type { Category } from "../../src/data/cards/types";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const REPORT_DIR = path.join(process.cwd(), "scripts/qa/reports");
const FIXTURE = path.join(process.cwd(), "scripts/qa/fixtures/golden-readings.json");

const SHORT_TEST_PROMPT =
  "ตอบเป็นภาษาไทยล้วนสั้น ๆ ไม่เกิน 2 ประโยค: ไพ่ทาโรต์ The Fool สื่อถึงอะไร";
const SHORT_TEST_RUNS = 3;

/**
 * รายชื่อ "ผู้รอดรอบแรก" จาก probe-openrouter.ts (2026-09-12) — ตัดทิ้งไปแล้ว:
 * - nvidia/nemotron-3.5-content-safety:free (ไม่ใช่โมเดลแชท เป็น content moderation classifier)
 * - nvidia/nemotron-3.5-lightning:free (ตอบอังกฤษทั้งที่สั่งไทย)
 * - openrouter/free (auto-router สลับโมเดลใต้ ไม่คงที่)
 */
const CANDIDATE_MODELS = [
  "cohere/north-mini-code:free",
  "nex-agi/nex-n2.5-pro:free",
  "nex-agi/nex-n2.5-mini:free",
  "inclusionai/ling-3.0-flash-vl:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

interface GoldenCase {
  id: string;
  category: string;
  spreadId: string;
  question: string;
  cardIds: string[];
  reversed: boolean[];
  personaId?: string;
}

/** ตรวจอังกฤษปน — hasForeignScript() ของ production จับแค่ CJK/ซีริลลิก/อาหรับ/ฯลฯ ไม่จับละติน */
function englishLeakRatio(text: string): number {
  const thaiChars = (text.match(/[฀-๿]/g) || []).length;
  const latinLetters = (text.match(/[A-Za-z]/g) || []).length;
  const total = thaiChars + latinLetters;
  if (total === 0) return 0;
  return latinLetters / total;
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

async function chatCompletion(
  apiKey: string,
  model: string,
  messages: Array<{ role: "system" | "user"; content: string }>,
  opts: { jsonMode?: boolean; maxTokens?: number; timeoutMs?: number } = {},
): Promise<{ ok: boolean; content: string; status: number | null; error: string | null; elapsedMs: number }> {
  const startedAt = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25000);

    const res = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://tarot-web.local",
        "X-Title": "tarot-web free-model deep probe",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts.maxTokens ?? 200,
        temperature: 0.6,
        ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    clearTimeout(timeoutId);
    const elapsedMs = Date.now() - startedAt;

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, content: "", status: res.status, error: errText.slice(0, 300), elapsedMs };
    }

    const data = (await res.json()) as any;
    const content: string = data?.choices?.[0]?.message?.content?.trim() || "";
    return { ok: content.length > 0, content, status: res.status, error: content ? null : "200 แต่ไม่มีข้อความตอบกลับ", elapsedMs };
  } catch (err) {
    return {
      ok: false,
      content: "",
      status: null,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      elapsedMs: Date.now() - startedAt,
    };
  }
}

async function testShortProbeX3(apiKey: string, model: string) {
  const runs = [];
  for (let i = 0; i < SHORT_TEST_RUNS; i++) {
    const r = await chatCompletion(apiKey, model, [{ role: "user", content: SHORT_TEST_PROMPT }]);
    const leak = r.content ? englishLeakRatio(r.content) : 0;
    runs.push({ ...r, englishLeakRatio: leak, hasForeignScript: hasForeignScript(r.content) });
  }
  const okRuns = runs.filter((r) => r.ok && !r.hasForeignScript && r.englishLeakRatio < 0.3);
  return {
    runs,
    passCount: okRuns.length,
    avgElapsedMs: okRuns.length ? Math.round(okRuns.reduce((s, r) => s + r.elapsedMs, 0) / okRuns.length) : null,
  };
}

interface FullReadingFail {
  ok: false;
  stage: string;
  error: string | null;
  elapsedMs: number;
  raw?: string;
}

interface FullReadingSuccess {
  ok: true;
  stage: "done";
  elapsedMs: number;
  consistencyOk: boolean;
  consistencyFatal: boolean;
  consistencyIssues: string[];
  thaiScore: number;
  thaiIssueCodes: string[];
  englishLeakRatio: number;
  openingPreview: string | undefined;
}

type FullReadingResult = FullReadingFail | FullReadingSuccess;

async function testFullReading(apiKey: string, model: string, ctx: ReadingContext): Promise<FullReadingResult> {
  const overrides = await getContentOverrides();
  const systemInstruction = buildSystemPrompt(ctx.personaId, {
    systemCore: resolveSystemCore(overrides),
    persona: resolvePersona(overrides, ctx.personaId),
    lang: ctx.lang,
  });
  const userMessage = buildReadingMessage(ctx);

  const maxTokens = 1600 + ctx.drawn.length * 480;
  const res = await chatCompletion(
    apiKey,
    model,
    [
      { role: "system", content: systemInstruction },
      { role: "user", content: userMessage },
    ],
    { jsonMode: true, maxTokens, timeoutMs: 30000 },
  );

  if (!res.ok) {
    return { ok: false, stage: "http", error: res.error, elapsedMs: res.elapsedMs };
  }

  let parsedJson: any = null;
  try {
    parsedJson = JSON.parse(res.content);
  } catch {
    return { ok: false, stage: "json_parse", error: "JSON.parse ล้มเหลว", elapsedMs: res.elapsedMs, raw: res.content.slice(0, 300) };
  }

  const parsed = ReadingSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return {
      ok: false,
      stage: "schema",
      error: JSON.stringify(parsed.error.issues?.slice(0, 3)),
      elapsedMs: res.elapsedMs,
    };
  }

  let readingData = parsed.data;
  const consistency = checkReadingConsistency(readingData, ctx.cards, {
    drawnCount: ctx.drawn.length,
    yesNoMode: ctx.spread.yesNoMode,
  });

  const thai = enforceThaiQuality(readingData, { personaId: ctx.personaId });
  readingData = thai.reading;

  const englishLeak = englishLeakRatio(JSON.stringify(readingData));

  return {
    ok: true,
    stage: "done",
    elapsedMs: res.elapsedMs,
    consistencyOk: consistency.ok,
    consistencyFatal: consistency.fatal,
    consistencyIssues: consistency.issues.map((i) => i.code),
    thaiScore: thai.score,
    thaiIssueCodes: thai.issueCodes,
    englishLeakRatio: Math.round(englishLeak * 100) / 100,
    openingPreview: readingData.opening?.slice(0, 80),
  };
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("❌ ไม่พบ OPENROUTER_API_KEY — export OPENROUTER_API_KEY=sk-or-... ก่อนรัน");
    process.exit(1);
  }

  const golds: GoldenCase[] = JSON.parse(fs.readFileSync(FIXTURE, "utf-8"));
  const gold = golds.find((g) => g.id === "gold-001") ?? golds[0];
  const ctx = buildContext(gold);
  if (!ctx) {
    console.error("❌ สร้าง ReadingContext จาก golden fixture ไม่สำเร็จ");
    process.exit(1);
  }

  console.log(`🧪 ทดสอบเชิงลึก ${CANDIDATE_MODELS.length} โมเดล — เคสอ้างอิง: ${gold.id} (${gold.question})\n`);

  const report: Record<string, unknown> = { generatedAt: new Date().toISOString(), goldenCase: gold.id, models: {} };

  for (const model of CANDIDATE_MODELS) {
    console.log(`── ${model} ──`);

    process.stdout.write("  A) คำถามสั้น x3 ... ");
    const shortResult = await testShortProbeX3(apiKey, model);
    console.log(`${shortResult.passCount}/${SHORT_TEST_RUNS} ผ่าน · เฉลี่ย ${shortResult.avgElapsedMs ?? "-"}ms`);
    for (const [i, r] of shortResult.runs.entries()) {
      const flag = !r.ok ? `❌ ${r.error}` : r.hasForeignScript ? "❌ มีอักษรต่างด้าว" : r.englishLeakRatio >= 0.3 ? `❌ อังกฤษปน ${Math.round(r.englishLeakRatio * 100)}%` : "✅";
      console.log(`     รอบ ${i + 1}: ${flag} (${r.elapsedMs}ms)`);
    }

    process.stdout.write("  B) คำอ่านไพ่เต็มรูปแบบ x1 ... ");
    const fullResult = await testFullReading(apiKey, model, ctx);
    if (!fullResult.ok) {
      console.log(`❌ ล้มเหลวที่ขั้น "${fullResult.stage}": ${fullResult.error}`);
    } else {
      const verdict =
        fullResult.consistencyOk && !fullResult.consistencyFatal && fullResult.englishLeakRatio < 0.3
          ? "✅"
          : "⚠️";
      console.log(
        `${verdict} consistency=${fullResult.consistencyOk} thaiScore=${fullResult.thaiScore} englishLeak=${fullResult.englishLeakRatio} (${fullResult.elapsedMs}ms)`,
      );
      console.log(`     เปิดเรื่อง: "${fullResult.openingPreview}"`);
      if (fullResult.consistencyIssues.length) {
        console.log(`     ปัญหาความสอดคล้อง: ${fullResult.consistencyIssues.join(", ")}`);
      }
    }

    (report.models as Record<string, unknown>)[model] = { short: shortResult, full: fullResult };
    console.log("");
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `openrouter-deep-probe-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`📄 บันทึกรายงานเต็มไว้ที่: ${path.relative(process.cwd(), reportPath)}`);
}

main().catch((err) => {
  console.error("สคริปต์ล้มเหลว:", err);
  process.exit(1);
});
