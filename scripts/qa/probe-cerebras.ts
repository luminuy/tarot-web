/**
 * scripts/qa/probe-cerebras.ts
 * ---------------------------------------------------------------------------
 * 🧪 วัดว่า Cerebras รับ "ผังไพ่ใหญ่" ของเราไหวจริงไหม ก่อนไว้ใจให้รับผู้ใช้จริง
 *
 * ทำไมต้องมีสคริปต์นี้แยกจาก `probe-openrouter.ts`:
 * ตัวนั้นทดสอบด้วยคำถามประโยคเดียว ("The Fool สื่อถึงอะไร") กินไม่ถึง 100 โทเค็น
 * ➔ ต่อให้ผ่านหมดทุกโมเดลก็ **ไม่ได้บอกอะไรเลยว่าผัง 12 ใบจะรอดไหม**
 * ซึ่งเป็นคำถามเดียวที่เราต้องการคำตอบ (INC-0136 — Groq ตายที่ 4 ใบขึ้นไป)
 *
 * สคริปต์นี้ยิงด้วย **prompt ของจริงจาก `buildReadingMessage()`** ทุกขนาดผัง
 * แล้ววัด 6 อย่างต่อโมเดล:
 *   1. รับคำขอขนาดเต็มไหวไหม (ไม่โดน 429 / 400 context ล้น)
 *   2. คืน JSON ที่ `JSON.parse` ได้ไหม
 *   3. ผ่าน `ReadingSchema` ครบไหม (ไพ่ครบทุกใบ ไม่โดนตัดกลาง)
 *   4. ผ่านด่านความสอดคล้อง `checkReadingConsistency()` ไหม
 *   5. คะแนนภาษาไทยจาก `checkThaiQualityDeep()`
 *   6. อักษรต่างด้าวหลุดไหม (Qwen มีประวัติพ่นจีนปนไทย)
 *
 * ⚠️ ต้นทุน: ชั้นฟรีของ Cerebras จำกัด **5 คำขอ/นาที** และ 1M โทเค็น/วัน
 *    สคริปต์จึงหน่วง 13 วินาทีระหว่างคำขอโดยปริยาย และ **ห้ามผูกเข้า CI เด็ดขาด**
 *    (กติกาเดียวกับ `run-golden-judge.ts` — ต้องมีคนกดรันเองเท่านั้น)
 *
 * วิธีรัน:
 *   export CEREBRAS_API_KEY=csk-...      # สร้างฟรีที่ https://cloud.cerebras.ai ไม่ต้องผูกบัตร
 *   npm run ai:probe-cerebras            # ยิงครบ 4 ขนาดผัง × ทุกโมเดล
 *   npm run ai:probe-cerebras -- --spreads 12        # เฉพาะผัง 12 ใบ (เคสหนักสุด)
 *   npm run ai:probe-cerebras -- --list              # แค่ดูว่าคีย์นี้เห็นโมเดลอะไรบ้าง (ฟรี ไม่เปลืองโควตา)
 */

import { SPREADS } from "../../src/data/spreads";
import { DECK } from "../../src/data/cards";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "../../src/lib/ai/prompt";
import { CEREBRAS_MODEL_CONFIGS, type CerebrasModelConfig } from "../../src/lib/ai/cerebras";
import { ReadingSchema } from "../../src/lib/schema/reading";
import { checkReadingConsistency } from "../../src/lib/ai/consistency";
import { checkThaiQualityDeep } from "../../src/lib/ai/thai-quality";
import { countForeignCharacters, stripThinkingTags } from "../../src/lib/ai/language";

const MODELS_URL = "https://api.cerebras.ai/v1/models";
const CHAT_URL = "https://api.cerebras.ai/v1/chat/completions";

/** ขนาดผังที่ต้องพิสูจน์ — 1 ใบเป็นกลุ่มควบคุม ที่เหลือคือของที่ Groq ทำไม่ได้ */
const DEFAULT_SPREAD_SIZES = [1, 5, 10, 12];

/** ชั้นฟรี 5 RPM ➔ เว้น 13 วินาทีให้ปลอดภัย */
const DEFAULT_DELAY_MS = 13000;

interface ProbeRow {
  model: string;
  cards: number;
  spreadId: string;
  status: number | null;
  elapsedMs: number;
  outChars: number;
  jsonOk: boolean;
  schemaOk: boolean;
  cardsReturned: number;
  consistencyOk: boolean;
  thaiScore: number | null;
  foreignChars: number;
  error: string | null;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function buildContext(cardCount: number): ReadingContext | null {
  const spread = SPREADS.find((s) => s.positions.length === cardCount);
  if (!spread) return null;
  const drawn = Array.from({ length: cardCount }, (_, i) => ({
    order: i,
    cardIndex: (i * 7) % DECK.length,
    isReversed: i % 3 === 0,
  }));
  return {
    personaId: "warm",
    spread,
    category: (spread as any).category ?? "general",
    question: "ช่วงนี้ชีวิตหนูวนอยู่ที่เดิม อยากรู้ว่าควรไปต่อทางไหนดีคะ",
    intake: {
      situation: "ทำงานเดิมมา 3 ปี รู้สึกตัน",
      feeling: "เหนื่อยใจแต่ยังไม่อยากยอมแพ้",
      hoped: "อยากเจอทางที่ใช่สักที",
    },
    drawn: drawn as any,
    cards: drawn.map((d) => DECK[d.cardIndex]) as any,
    safety: { flag: "none", block: false } as any,
    nickname: "หนูนา",
    lang: "th",
  };
}

async function listModels(apiKey: string): Promise<void> {
  const res = await fetch(MODELS_URL, { headers: { Authorization: `Bearer ${apiKey}` } });
  const body = await res.text();
  console.log(`GET /v1/models → HTTP ${res.status}`);
  try {
    const data = JSON.parse(body);
    for (const m of data.data ?? []) {
      console.log(`  • ${m.id}`);
    }
  } catch {
    console.log(body.slice(0, 500));
  }
}

async function probe(
  apiKey: string,
  config: CerebrasModelConfig,
  cardCount: number,
): Promise<ProbeRow | null> {
  const model = config.id;
  const ctx = buildContext(cardCount);
  if (!ctx) {
    console.warn(`ข้ามผัง ${cardCount} ใบ — ไม่มีผังขนาดนี้ในระบบ`);
    return null;
  }

  const systemInstruction = buildSystemPrompt(ctx.personaId, { persona: undefined as any, lang: "th" });
  const userMessage = buildReadingMessage(ctx);
  /*
   * ⚠️ ต้องคำนวณงบแบบเดียวกับ `cerebras.ts` เป๊ะ รวมตัวคูณเผื่อโทเค็นความคิดด้วย
   * ถ้า probe ยิงด้วยค่าคนละชุดกับ production ผลที่วัดได้จะไม่ได้ตอบคำถามที่เราถาม
   * (บทเรียนเดียวกับ probe-openrouter ที่วัดด้วยคำถามประโยคเดียวจนมองไม่เห็นปัญหาผังใหญ่)
   */
  const maxTokens = Math.min(
    16000,
    Math.min(8000, 1600 + cardCount * 480) * config.reasoningBudgetMultiplier,
  );

  const row: ProbeRow = {
    model,
    cards: cardCount,
    spreadId: ctx.spread.id,
    status: null,
    elapsedMs: 0,
    outChars: 0,
    jsonOk: false,
    schemaOk: false,
    cardsReturned: 0,
    consistencyOk: false,
    thaiScore: null,
    foreignChars: 0,
    error: null,
  };

  const startedAt = Date.now();
  try {
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: maxTokens,
        temperature: 0.6,
        reasoning_effort: config.reasoningEffort,
        ...(config.supportsHiddenReasoning ? { reasoning_format: "hidden" } : {}),
      }),
    });
    row.status = res.status;
    row.elapsedMs = Date.now() - startedAt;

    const bodyText = await res.text();
    if (!res.ok) {
      row.error = bodyText.slice(0, 220);
      return row;
    }

    const payload = JSON.parse(bodyText);
    const content: string = payload.choices?.[0]?.message?.content ?? "";
    row.outChars = content.length;
    row.foreignChars = countForeignCharacters(content);

    let parsed: any = null;
    try {
      parsed = JSON.parse(stripThinkingTags(content));
      row.jsonOk = true;
    } catch {
      row.error = "JSON.parse ไม่ผ่าน (น่าจะโดนตัดกลาง)";
      return row;
    }

    const schema = ReadingSchema.safeParse(parsed);
    row.schemaOk = schema.success;
    if (!schema.success) {
      row.error = JSON.stringify(schema.error.issues?.slice(0, 2));
      return row;
    }

    row.cardsReturned = schema.data.cards?.length ?? 0;
    const consistency = checkReadingConsistency(schema.data, ctx.cards, {
      drawnCount: ctx.drawn.length,
      yesNoMode: ctx.spread.yesNoMode,
    });
    row.consistencyOk = consistency.ok && !consistency.fatal;
    if (consistency.fatal) {
      row.error = `ความสอดคล้องล้มเหลว: ${consistency.issues.find((i) => i.fatal)?.code}`;
    }
    row.thaiScore = checkThaiQualityDeep(schema.data).score;
  } catch (err) {
    row.elapsedMs = Date.now() - startedAt;
    row.error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }
  return row;
}

async function main() {
  const apiKey = process.env.CEREBRAS_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "❌ ไม่พบ CEREBRAS_API_KEY\n" +
        "   สร้างคีย์ฟรีที่ https://cloud.cerebras.ai (ไม่ต้องผูกบัตร) แล้วรัน:\n" +
        "   export CEREBRAS_API_KEY=csk-...",
    );
    process.exit(1);
  }

  if (process.argv.includes("--list")) {
    await listModels(apiKey);
    return;
  }

  const sizes = arg("spreads")
    ? arg("spreads")!.split(",").map((n) => Number(n.trim()))
    : DEFAULT_SPREAD_SIZES;
  const delayMs = arg("delay") ? Number(arg("delay")) : DEFAULT_DELAY_MS;
  const models = arg("model")
    ? CEREBRAS_MODEL_CONFIGS.filter((c) => c.id === arg("model"))
    : [...CEREBRAS_MODEL_CONFIGS];
  if (models.length === 0) {
    console.error(`❌ ไม่รู้จักโมเดล "${arg("model")}" — มีให้เลือก: ${CEREBRAS_MODEL_CONFIGS.map((c) => c.id).join(", ")}`);
    process.exit(1);
  }

  console.log(
    `🧪 ยิง Cerebras ด้วย prompt ผังจริง — ${models.length} โมเดล × ${sizes.length} ขนาดผัง` +
      ` (หน่วง ${delayMs / 1000} วินาที/คำขอ กันชน 5 RPM)\n`,
  );

  const rows: ProbeRow[] = [];
  let first = true;
  for (const model of models) {
    for (const size of sizes) {
      if (!first) await new Promise((r) => setTimeout(r, delayMs));
      first = false;
      process.stdout.write(
        `  ยิง ${model.id} (คิด: ${model.reasoningEffort}) · ผัง ${size} ใบ ... `,
      );
      const row = await probe(apiKey, model, size);
      if (!row) {
        console.log("ข้าม");
        continue;
      }
      rows.push(row);
      console.log(
        row.schemaOk && row.consistencyOk
          ? `✅ ${row.elapsedMs}ms · ไทย ${row.thaiScore}`
          : `❌ HTTP ${row.status} · ${row.error?.slice(0, 80) ?? "ไม่ผ่าน"}`,
      );
    }
  }

  console.log("\n📊 สรุป");
  console.log(
    "โมเดล                ใบ  ผัง                 HTTP   เวลา  ไพ่ที่คืน  JSON  Schema  สอดคล้อง  ไทย  ต่างด้าว",
  );
  for (const r of rows) {
    console.log(
      `${r.model.padEnd(20)} ${String(r.cards).padStart(2)}  ${r.spreadId.padEnd(18)} ` +
        `${String(r.status ?? "-").padStart(4)} ${String(r.elapsedMs).padStart(6)}ms ` +
        `${String(r.cardsReturned).padStart(8)}  ${r.jsonOk ? " ✅ " : " ❌ "}  ` +
        `${r.schemaOk ? "  ✅  " : "  ❌  "}  ${r.consistencyOk ? "   ✅   " : "   ❌   "}  ` +
        `${String(r.thaiScore ?? "-").padStart(3)}  ${String(r.foreignChars).padStart(7)}`,
    );
    if (r.error) console.log(`    └─ ${r.error.slice(0, 160)}`);
  }

  const bigOk = rows.filter((r) => r.cards >= 4 && r.schemaOk && r.consistencyOk);
  console.log(
    `\n${bigOk.length > 0 ? "✅" : "❌"} ผังใหญ่ (4 ใบขึ้นไป) ผ่านครบทุกด่าน ${bigOk.length}/${rows.filter((r) => r.cards >= 4).length} เคส`,
  );
  if (bigOk.length === 0) {
    console.log("   ➔ ยังห้ามเปิดใช้ Cerebras กับผู้ใช้จริง — ต้องหาสาเหตุก่อน");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
