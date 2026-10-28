/**
 * scripts/qa/test-claude-reading.ts
 * QA — Claude เป็นทัพหน้าของคำอ่าน (เจ้าของสั่ง 2026-10-28: 1-3 ใบ Haiku · 4 ใบขึ้นไป Sonnet)
 * ไม่ยิง API จริง — แทน fetch ด้วยสตรีม SSE ปลอมที่ประกอบจากคำอ่านสำรองของไพ่ชุดจริงใน golden fixture
 * รันด้วย: npx tsx scripts/qa/test-claude-reading.ts
 */

import fs from "node:fs";
import path from "node:path";
import {
  CLAUDE_API_VERSION,
  CLAUDE_HAIKU_MODEL,
  CLAUDE_SONNET_MODEL,
  claudeReadingModel,
  claudeThinkingOff,
  extractJsonObject,
  generateClaudeReply,
  isClaudePaused,
  probeClaudeHealth,
  streamClaudeReading,
} from "../../src/lib/ai/claude";
import { generateAiJson } from "../../src/lib/ai/json-call";
import { streamMockGeminiReading } from "../../src/lib/ai/mock-reading";
import type { ReadingContext } from "../../src/lib/ai/prompt";
import type { ReadingEvent } from "../../src/lib/ai/types";
import { getSpread } from "../../src/data/spreads";
import { cardById } from "../../src/data/cards";
import type { Category } from "../../src/data/cards/types";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
}

interface GoldenCase {
  id: string;
  category: string;
  spreadId: string;
  question: string;
  cardIds: string[];
  reversed?: boolean[];
  personaId?: string;
}

/** ไพ่จาก fixture เท่านั้น ไม่แต่งไพ่เอง (กฎเหล็กข้อ 14) */
function goldenContext(cardCount: number): ReadingContext {
  const all = JSON.parse(fs.readFileSync(path.resolve("scripts/qa/fixtures/golden-readings.json"), "utf-8")) as GoldenCase[];
  const gold = all.find((g) => g.cardIds.length === cardCount);
  if (!gold) throw new Error(`ไม่มีเคส ${cardCount} ใบใน golden-readings.json`);
  const spread = getSpread(gold.spreadId);
  const cards = gold.cardIds.map((id) => cardById(id));
  if (!spread || cards.some((c) => !c)) throw new Error(`เคส ${gold.id} ประกอบผัง/ไพ่ไม่ได้`);
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

/** คำอ่านที่ผ่าน ReadingSchema แน่นอน — ใช้เป็นเนื้อหาที่ "Claude ปลอม" สตรีมกลับมา */
async function validReadingJson(ctx: ReadingContext): Promise<string> {
  for await (const e of streamMockGeminiReading({ ...ctx, usageMeter: undefined })) {
    if (e.type === "done") return JSON.stringify(e.reading);
  }
  throw new Error("คำอ่านสำรองไม่จบ");
}

function sse(events: unknown[]): Response {
  const text = events.map((e) => `event: ${(e as { type: string }).type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
  const bytes = new TextEncoder().encode(text);
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      // ส่งทีละ 97 ไบต์ — ตัดกลางบรรทัด/กลางอักษรไทย เหมือนเครือข่ายจริง
      for (let i = 0; i < bytes.length; i += 97) c.enqueue(bytes.slice(i, i + 97));
      c.close();
    },
  });
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
}

function claudeStream(json: string, stopReason = "end_turn"): Response {
  const text = "```json\n" + json + "\n```";
  const deltas = [];
  for (let i = 0; i < text.length; i += 40) {
    deltas.push({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: text.slice(i, i + 40) } });
  }
  return sse([
    { type: "message_start", message: { usage: { input_tokens: 120, cache_read_input_tokens: 4000, cache_creation_input_tokens: 0, output_tokens: 1 } } },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    { type: "ping" },
    ...deltas,
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: stopReason }, usage: { output_tokens: 1800 } },
    { type: "message_stop" },
  ]);
}

async function collect(ctx: ReadingContext): Promise<ReadingEvent[]> {
  const out: ReadingEvent[] = [];
  for await (const e of streamClaudeReading(ctx)) out.push(e);
  return out;
}

const realFetch = globalThis.fetch;
let lastReq: { url: string; headers: Record<string, string>; body: any } | null = null;
function mockFetch(respond: () => Response) {
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    lastReq = { url: String(url), headers: init?.headers as Record<string, string>, body: JSON.parse(String(init?.body ?? "{}")) };
    return respond();
  }) as typeof fetch;
}

async function main() {
  console.log("🟠 Claude ทัพหน้าคำอ่าน (1-3 ใบ Haiku · 4 ใบขึ้นไป Sonnet)\n");

  console.log("1) เลือกรุ่นตามจำนวนไพ่");
  check("1 2 3 ใบ = Haiku 5.5", [1, 2, 3].every((n) => claudeReadingModel(n) === CLAUDE_HAIKU_MODEL));
  check("4 5 7 10 12 ใบ = Sonnet 5.5", [4, 5, 7, 10, 12].every((n) => claudeReadingModel(n) === CLAUDE_SONNET_MODEL));
  check("รหัสรุ่นตรงตามเอกสาร (ไม่มีวันที่ต่อท้าย)", CLAUDE_HAIKU_MODEL === "claude-haiku-5-5" && CLAUDE_SONNET_MODEL === "claude-sonnet-5-5");
  check(
    "ปิดโหมดคิดให้ตรงรุ่น: Haiku disabled · Sonnet between_tools (Sonnet 5.5 ไม่รับ disabled)",
    claudeThinkingOff(CLAUDE_HAIKU_MODEL).type === "disabled" && claudeThinkingOff(CLAUDE_SONNET_MODEL).type === "between_tools",
  );
  check("ตัด code fence/ข้อความนอก JSON ออก", extractJsonObject('ok ```json\n{"a":{"b":1}}\n``` end') === '{"a":{"b":1}}');

  console.log("\n2) ไม่มีคีย์ = ไม่ยิงอะไรเลย");
  delete process.env.ANTHROPIC_API_KEY;
  let fetched = false;
  globalThis.fetch = (async () => {
    fetched = true;
    return new Response("", { status: 500 });
  }) as typeof fetch;
  const none = await collect(goldenContext(3));
  check("ไม่มี ANTHROPIC_API_KEY ➔ ไม่มีเหตุการณ์ ไม่เรียก fetch", none.length === 0 && !fetched);

  process.env.ANTHROPIC_API_KEY = "sk-ant-test";

  console.log("\n3) ผัง 3 ใบ ➔ Haiku · สตรีมจนจบ");
  const ctx3 = goldenContext(3);
  const validReadingJson3 = await validReadingJson(ctx3);
  mockFetch(() => claudeStream(validReadingJson3));
  const ev3 = await collect(ctx3);
  const done3 = ev3.find((e) => e.type === "done");
  check("ยิงไป /v1/messages", !!lastReq && lastReq.url.endsWith("/v1/messages"));
  check("รุ่น Haiku 5.5 + ปิดโหมดคิด", lastReq?.body.model === CLAUDE_HAIKU_MODEL && lastReq?.body.thinking?.type === "disabled");
  check(
    `header anthropic-version ${CLAUDE_API_VERSION} + x-api-key`,
    lastReq?.headers["anthropic-version"] === CLAUDE_API_VERSION && lastReq?.headers["x-api-key"] === "sk-ant-test",
  );
  check(
    "ไม่ส่ง temperature/top_p/top_k (API รุ่น 2026-10-21 คืน 400)",
    !!lastReq && !("temperature" in lastReq.body) && !("top_p" in lastReq.body) && !("top_k" in lastReq.body),
  );
  check("system prompt ติด cache_control", lastReq?.body.system?.[0]?.cache_control?.type === "ephemeral");
  check("stream: true · max_tokens = 1,600 + 480/ใบ", lastReq?.body.stream === true && lastReq?.body.max_tokens === 1600 + 3 * 480);
  check("ได้ opening + การ์ดครบ 3 ใบระหว่างสตรีม", ev3.some((e) => e.type === "opening") && ev3.filter((e) => e.type === "card").length === 3);
  check("จบด้วย done จากรุ่น Haiku", done3?.type === "done" && done3.model === CLAUDE_HAIKU_MODEL);
  check(
    "โทเคนเข้ารวมส่วนที่อ่านจากแคช (4,120) · โทเคนออก 1,800",
    done3?.type === "done" && done3.usage.inputTokens === 4120 && done3.usage.outputTokens === 1800 && done3.usage.cacheReadTokens === 4000,
  );

  console.log("\n4) ผัง 5 ใบ ➔ Sonnet");
  const ctx5 = goldenContext(5);
  const json5 = await validReadingJson(ctx5);
  mockFetch(() => claudeStream(json5));
  const ev5 = await collect(ctx5);
  check("รุ่น Sonnet 5.5 + between_tools", lastReq?.body.model === CLAUDE_SONNET_MODEL && lastReq?.body.thinking?.type === "between_tools");
  check("จบด้วย done จากรุ่น Sonnet", ev5.some((e) => e.type === "done" && e.model === CLAUDE_SONNET_MODEL));

  console.log("\n5) ล้มแบบไหนก็ไม่มีคำอ่านกุขึ้นเอง (กฎเหล็กข้อ 14) ให้สายสำรองรับต่อ");
  mockFetch(() => claudeStream(validReadingJson3, "refusal"));
  const evRef = await collect(ctx3);
  check("stop_reason refusal ➔ ไม่มี done", !evRef.some((e) => e.type === "done"));
  mockFetch(() => claudeStream(validReadingJson3.slice(0, Math.floor(validReadingJson3.length / 2)), "max_tokens"));
  const evCut = await collect(ctx3);
  check("JSON ขาดกลางทาง (max_tokens) ➔ ไม่มี done ไม่ต่อเติมเอง", !evCut.some((e) => e.type === "done"));
  mockFetch(() => sse([{ type: "message_start", message: { usage: { input_tokens: 10 } } }, { type: "error", error: { type: "overloaded_error" } }]));
  const evErr = await collect(ctx3);
  check("error กลางสตรีม ➔ ไม่มี done", !evErr.some((e) => e.type === "done"));

  console.log("\n5.5) ถามแม่หมอเรื่องผังดวง (/natal-chart) ➔ Sonnet + โหมดคิด (เจ้าของสั่ง: ต้องแม่นและละเอียด)");
  mockFetch(
    () =>
      new Response(
        JSON.stringify({
          stop_reason: "end_turn",
          content: [
            { type: "thinking", thinking: "", signature: "x" },
            { type: "text", text: "ดวงอาทิตย์ราศีมังกร" },
            { type: "text", text: "ในเรือนที่ 1" },
          ],
          usage: { input_tokens: 50, cache_read_input_tokens: 3000, output_tokens: 900 },
        }),
        { status: 200 },
      ),
  );
  const rep = await generateClaudeReply({
    model: CLAUDE_SONNET_MODEL,
    system: "ระบบ",
    messages: [
      { role: "assistant", content: "สวัสดี" },
      { role: "user", content: "ลัคนาฉันคืออะไร" },
    ],
    maxTokens: 8000,
    timeoutMs: 5000,
    effort: "medium",
  });
  check("คืนเฉพาะข้อความ (ไม่รวมบล็อกความคิด)", rep?.reply === "ดวงอาทิตย์ราศีมังกรในเรือนที่ 1");
  check(
    "Sonnet 5.5 · adaptive thinking · effort medium · ไม่ส่ง temperature · ไม่สตรีม",
    lastReq?.body.model === CLAUDE_SONNET_MODEL &&
      lastReq?.body.thinking?.type === "adaptive" &&
      lastReq?.body.output_config?.effort === "medium" &&
      !("temperature" in (lastReq?.body ?? {})) &&
      !lastReq?.body.stream,
  );
  check("ตัดข้อความแรกที่ไม่ใช่ของผู้ใช้ทิ้ง (API บังคับให้ผู้ใช้เริ่ม)", lastReq?.body.messages?.[0]?.role === "user" && lastReq?.body.messages.length === 1);
  check("โทเคนเข้ารวมส่วนที่อ่านจากแคช", rep?.usage.inputTokens === 3050 && rep?.usage.outputTokens === 900);
  mockFetch(() => new Response(JSON.stringify({ stop_reason: "max_tokens", content: [{ type: "text", text: "ครึ่งประโยค" }] }), { status: 200 }));
  check(
    "โดนตัดที่ max_tokens ➔ null (ไม่ส่งคำตอบขาดกลางประโยค)",
    (await generateClaudeReply({ model: CLAUDE_SONNET_MODEL, system: "s", messages: [{ role: "user", content: "q" }], maxTokens: 10, timeoutMs: 5000 })) === null,
  );
  const natalRoute = fs.readFileSync(path.resolve("src/app/api/natal/chat/route.ts"), "utf-8");
  const nClaude = natalRoute.indexOf("generateClaudeReply(");
  const nGroq = natalRoute.indexOf("generateGroqChatReply(");
  check(
    "/api/natal/chat: Claude Sonnet ก่อน Groq ➔ Gemini · ผ่านด่านกันรั่ว prompt เหมือนตัวอื่น",
    nClaude > 0 && nClaude < nGroq && /model: CLAUDE_SONNET_MODEL/.test(natalRoute) && /return await finish\(reply, "claude"\)/.test(natalRoute),
  );

  console.log("\n5.6) เส้นอื่นใช้ Claude เป็นหลัก (เจ้าของสั่ง 2026-10-28: เลือกรุ่นตามงาน)");
  const claudeText = (text: string) =>
    new Response(JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text }], usage: { input_tokens: 10, output_tokens: 10 } }), { status: 200 });
  const geminiText = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
  const urls: string[] = [];
  const routeFetch = (claudeOut: string) =>
    mockFetch(() => (lastReq!.url.endsWith("/v1/messages") ? claudeText(claudeOut) : geminiText('{"from":"gemini"}')));
  const trackUrls = () => {
    const inner = globalThis.fetch;
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      urls.push(String(url));
      return inner(url, init);
    }) as typeof fetch;
  };
  process.env.GEMINI_API_KEY = "gem-test";
  routeFetch('ได้เลย ```json\n{"from":"claude"}\n```');
  trackUrls();
  const j1 = await generateAiJson<{ from: string }>("prompt", {
    label: "QA",
    temperature: 0.6,
    cacheTtl: 21600,
    claude: { model: CLAUDE_SONNET_MODEL, effort: "low", maxTokens: 6000, timeoutMs: 5000 },
  });
  check("generateAiJson: Claude ตอบได้ ➔ ใช้ของ Claude (แกะ code fence ได้) ไม่ยิง Gemini", j1?.from === "claude" && urls.every((u) => u.endsWith("/v1/messages")));
  check(
    "generateAiJson: รุ่น/effort ตามผู้เรียก · ไม่ส่ง temperature ให้ Claude",
    lastReq?.body.model === CLAUDE_SONNET_MODEL && lastReq?.body.output_config?.effort === "low" && !("temperature" in (lastReq?.body ?? {})),
  );
  urls.length = 0;
  routeFetch("ขอโทษ ตอบเป็น JSON ไม่ได้");
  trackUrls();
  const j2 = await generateAiJson<{ from: string }>("prompt", {
    label: "QA",
    claude: { model: CLAUDE_SONNET_MODEL, effort: "low", maxTokens: 6000, timeoutMs: 5000 },
  });
  check("generateAiJson: Claude แกะ JSON ไม่ได้ ➔ ไหลไป Gemini", j2?.from === "gemini" && urls.some((u) => !u.endsWith("/v1/messages")));
  delete process.env.GEMINI_API_KEY;
  globalThis.fetch = realFetch;

  const chatRoute = fs.readFileSync(path.resolve("src/app/api/reading/[id]/chat/route.ts"), "utf-8");
  const cClaude = chatRoute.indexOf("generateClaudeReply(");
  const cGroq = chatRoute.indexOf("generateGroqChatReply(");
  const cGemini = chatRoute.indexOf("extractGeminiAnswer(data)");
  check(
    "/chat: Claude ➔ Groq ➔ Gemini · รุ่นตามจำนวนไพ่ · effort low · ผ่านด่านกันรั่ว prompt",
    cClaude > 0 &&
      cClaude < cGroq &&
      cGroq < cGemini &&
      /model: claudeReadingModel\(record\.drawn\?\.length \?\? 0\)/.test(chatRoute) &&
      /effort: "low"/.test(chatRoute) &&
      /detectPromptLeak\(cleanReply\)[\s\S]{0,400}provider: "claude"/.test(chatRoute),
  );
  const perspRoute = fs.readFileSync(path.resolve("src/app/api/reading/[id]/perspective/route.ts"), "utf-8");
  const pClaude = perspRoute.indexOf("streamClaudeReading(ctx)");
  const pGroq = perspRoute.indexOf("streamGroqReading(ctx)");
  check("/perspective: Claude ➔ Groq ➔ Gemini (Groq ไม่ทับผลของ Claude)", pClaude > 0 && pClaude < pGroq && /if \(!got && process\.env\.GROQ_API_KEY\)/.test(perspRoute));
  for (const [name, file] of [
    ["/journal/reflect", "src/app/api/journal/reflect/route.ts"],
    ["/journal/monthly-summary", "src/app/api/journal/monthly-summary/route.ts"],
  ] as const) {
    const src = fs.readFileSync(path.resolve(file), "utf-8");
    check(`${name}: ใช้ generateAiJson + Sonnet (ไม่เรียก Gemini ตรง)`, /generateAiJson</.test(src) && /model: CLAUDE_SONNET_MODEL/.test(src) && !/geminiEndpoint\(|generateGeminiJson\(/.test(src));
  }

  console.log("\n6) เครดิตหมด/คีย์ผิด ➔ พักเรียก Claude ไม่ให้ทุกคำอ่านเสียเวลายิงคำขอที่ล้มแน่");
  mockFetch(() => new Response('{"type":"error","error":{"type":"invalid_request_error","message":"credit balance is too low"}}', { status: 400 }));
  const ev400 = await collect(ctx3);
  check("400 ➔ ไม่มีเหตุการณ์ และเข้าโหมดพัก", ev400.length === 0 && isClaudePaused());
  let calledWhilePaused = false;
  globalThis.fetch = (async () => {
    calledWhilePaused = true;
    return new Response("", { status: 500 });
  }) as typeof fetch;
  await collect(ctx3);
  check("ระหว่างพักไม่ยิงคำขอใหม่", !calledWhilePaused);
  globalThis.fetch = realFetch;

  console.log("\n7) ต่อสายใน /read: Claude ก่อน Groq ➔ Gemini");
  const route = fs.readFileSync(path.resolve("src/app/api/reading/[id]/read/route.ts"), "utf-8");
  const iClaude = route.indexOf("streamClaudeReading(readingCtx)");
  const iGroq = route.indexOf("streamGroqReading(readingCtx)");
  const iGemini = route.indexOf("streamGeminiReading(readingCtx)");
  check("ลำดับ Claude ➔ Groq ➔ Gemini", iClaude > 0 && iClaude < iGroq && iGroq < iGemini);
  check("เรียก Claude เฉพาะเมื่อมี ANTHROPIC_API_KEY", /if \(process\.env\.ANTHROPIC_API_KEY\?\.trim\(\)\) \{[\s\S]{0,200}streamClaudeReading/.test(route));
  check("Claude ไม่จบ ➔ นับ failover แล้วไหลลงตัวถัดไป", route.includes('recordEvent("ai_claude_failover")'));
  const deploy = fs.readFileSync(path.resolve(".github/workflows/deploy.yml"), "utf-8");
  check(
    "deploy.yml ตั้ง ANTHROPIC_API_KEY เป็น secret ของ Worker ด้วย wrangler secret put (env ของขั้น build ไม่ถึง Worker ตอนรัน)",
    /- name: 🤖 Sync Claude key to Worker[\s\S]{0,1200}ANTHROPIC_API_KEY: \$\{\{ secrets\.ANTHROPIC_API_KEY \}\}[\s\S]{0,600}npx wrangler secret put ANTHROPIC_API_KEY/.test(deploy),
  );
  const claudeSrc = fs.readFileSync(path.resolve("src/lib/ai/claude.ts"), "utf-8");
  check("ไม่ log คีย์หรือ prompt", !/console\.\w+\([^)]*(apiKey|systemInstruction|userMessage)/.test(claudeSrc));

  console.log("\n8) แท็บสุขภาพ AI ใน /admin ตรวจ Claude ได้ (เจ้าของถาม: ตั้งคีย์แล้วรู้ได้ยังไงว่าใช้ได้)");
  mockFetch(() => claudeText("พร้อม"));
  const okProbe = await probeClaudeHealth("sk-ant-test-123");
  check("ยิงทั้ง Haiku และ Sonnet · ผ่านทั้งคู่ · ปิดโหมดคิด · max_tokens เล็ก", okProbe.length === 2 && okProbe.every((r) => r.ok && r.answerPreview === "พร้อม") && lastReq?.body.model === CLAUDE_SONNET_MODEL && lastReq?.body.thinking?.type === "between_tools" && lastReq?.body.max_tokens <= 64);
  mockFetch(() => new Response('{"type":"error","error":{"type":"invalid_request_error","message":"credit balance is too low (key sk-ant-test-123)"}}', { status: 400 }));
  const badProbe = await probeClaudeHealth("sk-ant-test-123", [CLAUDE_HAIKU_MODEL]);
  check("เครดิตหมด: ได้ HTTP 400 พร้อมเหตุผลจริง และตัดค่าคีย์ออกจากข้อความ", badProbe[0].status === 400 && !badProbe[0].ok && /credit balance/.test(badProbe[0].error ?? "") && !(badProbe[0].error ?? "").includes("sk-ant-test-123"));
  globalThis.fetch = realFetch;
  const health = fs.readFileSync(path.resolve("src/app/api/admin/ai-health/route.ts"), "utf-8");
  check(
    "ai-health: ยิง Claude ก่อน Groq/Gemini · ตัดคีย์ Claude ออกจาก error · ตั้งคีย์แต่ Claude ล้ม = ไม่รายงานว่าปกติดี",
    health.indexOf("probeClaudeHealth(claudeKey)") > 0 &&
      health.indexOf("probeClaudeHealth(claudeKey)") < health.indexOf("probeGroqHealth(") &&
      health.includes('if (claudeKey) s = s.split(claudeKey).join("***")') &&
      health.includes('verdict = "claude_unavailable"'),
  );
  check("แผงแอดมินแสดงสถานะคีย์ Claude และป้ายสถานะ claude_unavailable", /claude_unavailable:/.test(fs.readFileSync(path.resolve("src/components/admin/AiHealthPanel.tsx"), "utf-8")) && fs.readFileSync(path.resolve("src/components/admin/AiHealthPanel.tsx"), "utf-8").includes("ANTHROPIC_API_KEY"));

  console.log(`\n📊 สรุป: ผ่าน ${pass} · ตก ${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
