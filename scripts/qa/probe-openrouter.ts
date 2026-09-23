/**
 * scripts/qa/probe-openrouter.ts
 * ---------------------------------------------------------------------------
 * 🧪 ทดสอบโมเดลฟรีบน OpenRouter ว่า "ใช้ได้จริง" ก่อนต่อเข้าโค้ด production
 *
 * ทำไมต้องมีสคริปต์นี้: บทเรียน INC-0053 — ห้ามเดาว่าโมเดลไหนใช้ได้ ต้องวัดจริง
 * (เคยเจอ gemini-3.7-flash / gemini-flash-latest อยู่ในลิสต์แต่ตายสนิท 0/3 ครั้ง)
 *
 * สคริปต์นี้:
 *   1. ดึงลิสต์โมเดลฟรีจริงจาก GET /api/v1/models (pricing.prompt === "0")
 *      — ไม่ hardcode ชื่อโมเดล เพราะ OpenRouter เพิ่ม/ถอดโมเดลฟรีบ่อยมาก
 *   2. ยิงคำถามภาษาไทยสั้น ๆ เข้าแต่ละโมเดล วัด latency + เช็กอักษรต่างด้าวหลุด
 *   3. สรุปตารางผ่าน/ไม่ผ่าน เรียงตามความเร็ว
 *
 * ⚠️ ต้นทุน: โมเดลฟรีไม่มีค่าใช้จ่าย แต่มีเพดาน rate limit ต่ำ (20 req/min)
 *    รันด้วยมือเท่านั้น ห้ามผูกเข้า CI / repo:verify
 *
 * วิธีรัน:
 *   export OPENROUTER_API_KEY=sk-or-...   # สร้างที่ https://openrouter.ai/keys (ฟรี ไม่ต้องผูกบัตร)
 *   npx tsx scripts/qa/probe-openrouter.ts
 *   npx tsx scripts/qa/probe-openrouter.ts --limit 5   # ทดสอบแค่ 5 ตัวแรก (เร็วขึ้น)
 *   npm run ai:probe-openrouter -- --reading 6         # + ยิงคำอ่านเต็มจริงให้ 6 ตัวที่เร็วสุด
 *
 * ขั้นที่ 2 (`--reading N`): ตอบ 2 ประโยคได้ ≠ เขียนคำอ่านได้
 *   ยิง system prompt + ข้อความคำอ่าน **ชุดเดียวกับ production** (ผังเซลติกครอส 10 ใบ = ผังที่ Groq รับไม่ไหว)
 *   ขอ JSON แล้วตรวจด้วย ReadingSchema + อักษรต่างด้าว + คะแนนภาษาไทยจากโค้ด
 *   ผลเขียนลง `openrouter-probe.json` (workflow แนบให้โหลด)
 */

import fs from "node:fs";
import path from "node:path";
import { hasForeignScript } from "../../src/lib/ai/language";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "../../src/lib/ai/prompt";
import { resolveMaxReadingTokens } from "../../src/lib/ai/reading-stream";
import { ReadingSchema } from "../../src/lib/schema/reading";
import { checkThaiQualityDeep } from "../../src/lib/ai/thai-quality";
import { getSpread } from "../../src/data/spreads";
import { cardById } from "../../src/data/cards";
import type { Category } from "../../src/data/cards/types";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

const TEST_PROMPT =
  "ตอบเป็นภาษาไทยล้วนสั้น ๆ ไม่เกิน 2 ประโยค: ไพ่ทาโรต์ The Fool สื่อถึงอะไร";

interface OpenRouterModel {
  id: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
}

interface ProbeResult {
  model: string;
  ok: boolean;
  status: number | null;
  elapsedMs: number;
  hasForeignLeak: boolean;
  answerPreview: string;
  error: string | null;
}

async function fetchFreeModels(): Promise<OpenRouterModel[]> {
  const res = await fetch(OPENROUTER_MODELS_URL);
  if (!res.ok) {
    throw new Error(`ดึงลิสต์โมเดลไม่สำเร็จ: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { data: OpenRouterModel[] };
  return data.data.filter(
    (m) => m.pricing?.prompt === "0" && m.pricing?.completion === "0",
  );
}

async function probeModel(apiKey: string, model: string): Promise<ProbeResult> {
  const startedAt = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter แนะนำให้ใส่สองอันนี้ (ไม่บังคับ แต่ช่วยไม่ให้โดนจัดลำดับความสำคัญต่ำ)
        "HTTP-Referer": "https://tarot-web.local",
        "X-Title": "tarot-web free-model probe",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: TEST_PROMPT }],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    clearTimeout(timeoutId);
    const elapsedMs = Date.now() - startedAt;

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        model,
        ok: false,
        status: res.status,
        elapsedMs,
        hasForeignLeak: false,
        answerPreview: "",
        error: errText.slice(0, 200),
      };
    }

    const data = (await res.json()) as any;
    const answer: string = data?.choices?.[0]?.message?.content?.trim() || "";

    return {
      model,
      ok: answer.length > 0,
      status: res.status,
      elapsedMs,
      hasForeignLeak: hasForeignScript(answer),
      answerPreview: answer.slice(0, 100),
      error: answer ? null : "200 แต่ไม่มีข้อความตอบกลับ",
    };
  } catch (err) {
    return {
      model,
      ok: false,
      status: null,
      elapsedMs: Date.now() - startedAt,
      hasForeignLeak: false,
      answerPreview: "",
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    };
  }
}

interface ReadingProbe {
  model: string;
  ok: boolean;
  elapsedMs: number;
  schemaOk: boolean;
  foreignLeak: boolean;
  thaiScore: number;
  thaiIssues: string[];
  outputChars: number;
  error: string | null;
  summaryPreview: string;
}

interface GoldenCase {
  id: string;
  category: string;
  spreadId: string;
  question: string;
  cardIds: string[];
  reversed: boolean[];
  personaId?: string;
}

/** บริบทเดียวกับ `run-golden-judge.ts` — ห้ามแต่งไพ่เอง ใช้ไพ่จาก fixture เท่านั้น */
function goldenContext(caseId: string): ReadingContext {
  const fixture = path.resolve(process.cwd(), "scripts/qa/fixtures/golden-readings.json");
  const all = JSON.parse(fs.readFileSync(fixture, "utf-8")) as GoldenCase[];
  const gold = all.find((g) => g.id === caseId);
  if (!gold) throw new Error(`ไม่พบเคส ${caseId} ใน golden-readings.json`);
  const spread = getSpread(gold.spreadId);
  const cards = gold.cardIds.map((id) => cardById(id));
  if (!spread || cards.some((c) => !c)) throw new Error(`เคส ${caseId} ประกอบผัง/ไพ่ไม่ได้`);
  return {
    personaId: gold.personaId ?? null,
    spread,
    category: gold.category as Category,
    question: gold.question,
    intake: {},
    drawn: gold.cardIds.map((_, i) => ({ order: i, cardIndex: i, isReversed: Boolean(gold.reversed?.[i]) })),
    cards: cards as NonNullable<ReturnType<typeof cardById>>[],
    safety: { flag: "none", block: false },
    lang: "th",
  } as ReadingContext;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("ไม่พบ JSON ในคำตอบ");
  return JSON.parse(body.slice(start, end + 1));
}

async function probeReading(apiKey: string, model: string, ctx: ReadingContext): Promise<ReadingProbe> {
  const startedAt = Date.now();
  const base: ReadingProbe = {
    model,
    ok: false,
    elapsedMs: 0,
    schemaOk: false,
    foreignLeak: false,
    thaiScore: 0,
    thaiIssues: [],
    outputChars: 0,
    error: null,
    summaryPreview: "",
  };
  try {
    // เหมือน production (openrouter.ts): ขอโหมด JSON ก่อน ถ้าโมเดลไม่รองรับ (400) ยิงใหม่แบบไม่ขอ
    const send = async (jsonMode: boolean) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      try {
        return await fetch(OPENROUTER_CHAT_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://tarot-web.local",
            "X-Title": "tarot-web reading probe",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: buildSystemPrompt(ctx.personaId, { lang: "th" }) },
              { role: "user", content: buildReadingMessage(ctx) },
            ],
            ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
            reasoning: { exclude: true },
            max_tokens: resolveMaxReadingTokens(ctx.drawn.length, 12000),
            temperature: 0.6,
          }),
        });
      } finally {
        clearTimeout(timeoutId);
      }
    };
    let res = await send(true);
    if (res.status === 400) {
      const errText = await res.text().catch(() => "");
      if (/support/i.test(errText)) res = await send(false);
      else {
        base.elapsedMs = Date.now() - startedAt;
        base.error = `HTTP 400: ${errText.slice(0, 200)}`;
        return base;
      }
    }
    base.elapsedMs = Date.now() - startedAt;
    if (!res.ok) {
      base.error = `HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`;
      return base;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data?.choices?.[0]?.message?.content ?? "";
    base.outputChars = text.length;
    if (!text) {
      base.error = "200 แต่ไม่มีข้อความตอบกลับ";
      return base;
    }
    const parsed = ReadingSchema.safeParse(extractJson(text));
    base.schemaOk = parsed.success;
    base.foreignLeak = hasForeignScript(text);
    if (!parsed.success) {
      base.error = `JSON ไม่ตรง ReadingSchema: ${parsed.error.issues.slice(0, 3).map((i) => i.path.join(".")).join(", ")}`;
      return base;
    }
    const thai = checkThaiQualityDeep(parsed.data);
    base.thaiScore = thai.score;
    base.thaiIssues = thai.issues.map((i) => i.code);
    base.summaryPreview = String((parsed.data as { summary?: string }).summary ?? "").slice(0, 120);
    base.ok = !base.foreignLeak;
    if (base.foreignLeak) {
      const m = text.match(/[^\u0000-\u024F\u0E00-\u0E7F\u2000-\u206F\u2190-\u27BF\s]{1,12}/);
      base.error = `มีอักษรต่างด้าวปนคำอ่าน${m ? ` (เช่น "${m[0]}")` : ""}`;
    }
    return base;
  } catch (err) {
    base.elapsedMs = Date.now() - startedAt;
    base.error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return base;
  }
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("❌ ไม่พบ OPENROUTER_API_KEY");
    console.error("   สร้างคีย์ฟรีที่ https://openrouter.ai/keys แล้ว:");
    console.error("   export OPENROUTER_API_KEY=sk-or-...");
    process.exit(1);
  }

  const limitArg = process.argv.find((a) => a.startsWith("--limit"));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] || process.argv[process.argv.indexOf(limitArg) + 1], 10) : undefined;

  console.log("🔎 ดึงลิสต์โมเดลฟรีจาก OpenRouter...\n");
  const freeModels = await fetchFreeModels();
  /*
   * `--only a:free,b:free` = วัดเฉพาะรายชื่อนี้ (ต้องเป็นโมเดลฟรีที่ยังอยู่ในลิสต์สด)
   * โควตาโมเดลฟรีนับรวมทั้งบัญชีต่อวัน — รอบซ้ำไม่ควรยิงทั้ง 20 กว่าตัวใหม่ทุกครั้ง
   */
  const onlyIdx = process.argv.indexOf("--only");
  const only = onlyIdx >= 0 ? (process.argv[onlyIdx + 1] ?? "").split(",").map((x) => x.trim()).filter(Boolean) : [];
  const toTest = (limit ? freeModels.slice(0, limit) : freeModels).filter(
    // ตัดโมเดลที่ไม่ใช่ text chat ออก (เช่น lyria = สร้างเพลง)
    (m) => !m.id.includes("lyria") && (only.length === 0 || only.includes(m.id)),
  );

  console.log(`พบโมเดลฟรีทั้งหมด ${freeModels.length} ตัว — จะทดสอบ ${toTest.length} ตัว\n`);

  /* `--skip-quick` + `--only`: ข้ามขั้นถามสั้น ไปเขียนคำอ่านเต็มเลย (ประหยัดโควตาฟรี) */
  const skipQuick = process.argv.includes("--skip-quick") && only.length > 0;
  const results: ProbeResult[] = [];
  for (const m of skipQuick ? [] : toTest) {
    process.stdout.write(`  กำลังยิง ${m.id} ... `);
    const r = await probeModel(apiKey, m.id);
    results.push(r);
    console.log(r.ok && !r.hasForeignLeak ? `✅ ${r.elapsedMs}ms` : `❌ ${r.error || "มีอักษรต่างด้าวปน"}`);
  }

  const good = skipQuick
    ? toTest.map((m) => ({ model: m.id, ok: true, status: null, elapsedMs: 0, hasForeignLeak: false, answerPreview: "", error: null }))
    : results
    .filter((r) => r.ok && !r.hasForeignLeak)
    .sort((a, b) => a.elapsedMs - b.elapsedMs);
  const bad = results.filter((r) => !r.ok || r.hasForeignLeak);

  console.log("\n📊 สรุปผล — ใช้ได้จริง (เรียงตามความเร็ว):\n");
  if (good.length === 0) {
    console.log("  (ไม่มีตัวไหนผ่านเลย)");
  }
  for (const r of good) {
    console.log(`  ✅ ${r.model.padEnd(45)} ${String(r.elapsedMs).padStart(6)}ms  "${r.answerPreview}"`);
  }

  console.log("\n❌ ใช้ไม่ได้ / มีปัญหา:\n");
  for (const r of bad) {
    console.log(`  ❌ ${r.model.padEnd(45)} status=${r.status ?? "-"}  ${r.error || "มีอักษรต่างด้าวปนคำตอบ"}`);
  }

  // ── ขั้นที่ 2: คำอ่านเต็มจริง ────────────────────────────────────────────────
  const readingIdx = process.argv.indexOf("--reading");
  const readingTop = readingIdx >= 0 ? parseInt(process.argv[readingIdx + 1] ?? "6", 10) || 6 : 0;
  const caseIdx = process.argv.indexOf("--case");
  const caseId = caseIdx >= 0 ? process.argv[caseIdx + 1] : "gold-021";
  const readings: ReadingProbe[] = [];

  if (readingTop > 0 && good.length > 0) {
    const ctx = goldenContext(caseId);
    const candidates = good.slice(0, readingTop);
    console.log(
      `\n🔮 ขั้นที่ 2 — คำอ่านเต็มด้วย prompt จริง (${caseId} · ผัง ${ctx.spread.id} ${ctx.drawn.length} ใบ) · ${candidates.length} ตัว\n`,
    );
    for (const [i, c] of candidates.entries()) {
      if (i > 0) await new Promise((r) => setTimeout(r, 5000)); // โมเดลฟรีจำกัด ~20 คำขอ/นาที
      process.stdout.write(`  กำลังยิง ${c.model} ... `);
      const r = await probeReading(apiKey, c.model, ctx);
      readings.push(r);
      console.log(
        r.ok
          ? `✅ ${r.elapsedMs}ms · ไทย ${r.thaiScore}/100${r.thaiIssues.length ? ` (${r.thaiIssues.join(",")})` : ""}`
          : `❌ ${r.error}`,
      );
    }
    const passed = readings.filter((r) => r.ok).sort((a, b) => b.thaiScore - a.thaiScore || a.elapsedMs - b.elapsedMs);
    console.log("\n📊 เขียนคำอ่านเต็มได้จริง (เรียงตามคะแนนไทย แล้วความเร็ว):\n");
    if (passed.length === 0) console.log("  (ไม่มีตัวไหนผ่านเลย)");
    for (const r of passed) {
      console.log(`  ✅ ${r.model.padEnd(45)} ไทย ${r.thaiScore}/100 · ${r.elapsedMs}ms · "${r.summaryPreview}"`);
    }
  }

  fs.writeFileSync(
    "openrouter-probe.json",
    JSON.stringify({ probedAt: new Date().toISOString(), caseId, quick: results, readings }, null, 2),
    "utf-8",
  );
  console.log("\n💾 ผลทั้งหมด: openrouter-probe.json");
}

main().catch((err) => {
  console.error("สคริปต์ล้มเหลว:", err);
  process.exit(1);
});
