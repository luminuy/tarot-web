import { parsePartialReading } from "@/lib/partial-json";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "@/lib/prompt";
import { type Reading, ReadingSchema } from "@/lib/reading-schema";
import type { ReadingEvent, UsageInfo } from "@/lib/claude";

/**
 * ตัวเชื่อมกับ Google Gemini API (Ultra-Low Latency Streaming)
 * -------------------------------------------------
 * ไฟล์นี้ทำงานฝั่งเซิร์ฟเวอร์เท่านั้น
 */

export const GEMINI_MODEL = "gemini-3.7-flash";

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error("ยังไม่ได้ตั้งค่า GEMINI_API_KEY หรือ GOOGLE_API_KEY");
  }
  return key;
}

const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    opening: {
      type: "STRING",
      description: "คำทักทายและความรู้สึกแรกเมื่อเห็นไพ่ทั้งชุด 1-2 ประโยค ห้ามเฉลยรายละเอียดรายใบตรงนี้",
    },
    cards: {
      type: "ARRAY",
      description: "คำอ่านรายใบ ต้องมีครบทุกตำแหน่งที่ให้มา เรียงตาม position จากน้อยไปมาก",
      items: {
        type: "OBJECT",
        properties: {
          position: { type: "INTEGER", description: "index ตำแหน่งตามที่ระบุในข้อมูลไพ่" },
          headline: { type: "STRING", description: "พาดหัวสั้นกระชับสรุปใจความของไพ่ใบนี้" },
          reading: { type: "STRING", description: "คำอ่าน 2-3 ประโยคกระชับทรงพลัง เชื่อมโยงความหมายไพ่และตำแหน่งเข้ากับคำถาม" },
        },
        required: ["position", "headline", "reading"],
      },
    },
    connections: {
      type: "STRING",
      description: "ไพ่ทั้งชุดคุยกันอย่างไร ชี้ความสัมพันธ์ที่มีอยู่จริง 2-3 ประโยค",
    },
    summary: {
      type: "STRING",
      description: "สรุปคำตอบต่อคำถามของผู้ถามโดยตรง 2-3 ประโยค",
    },
    advice: {
      type: "ARRAY",
      description: "สิ่งที่ผู้ถามลงมือทำได้จริงภายในสัปดาห์นี้ ข้อละหนึ่งประโยค 2-3 ข้อ",
      items: { type: "STRING" },
    },
    timing: {
      type: "STRING",
      description: "กรอบเวลาโดยประมาณที่เรื่องน่าจะขยับ",
    },
    yesNoAnswer: {
      type: "STRING",
      enum: ["ใช่", "ไม่ใช่", "ยังไม่แน่"],
      description: "ใส่ค่าเฉพาะเมื่อโหมดใช่/ไม่ใช่ถูกเปิด นอกนั้นให้เป็น null หรือเว้นว่าง",
    },
    mood: {
      type: "STRING",
      enum: ["สดใส", "อบอุ่น", "สงบ", "ครุ่นคิด", "ท้าทาย"],
      description: "อารมณ์รวมของคำอ่านชุดนี้",
    },
  },
  required: ["opening", "cards", "connections", "summary", "advice", "timing", "mood"],
};

export const CANDIDATE_GEMINI_MODELS = [
  "gemini-3.7-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

const DEFAULT_USAGE: UsageInfo = {
  inputTokens: 350,
  outputTokens: 600,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

export async function* streamGeminiReading(ctx: ReadingContext): AsyncGenerator<ReadingEvent> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    yield* streamMockGeminiReading(ctx);
    return;
  }

  const systemInstruction = buildSystemPrompt(ctx.personaId);
  const userPrompt = buildReadingMessage(ctx);

  let response: Response | null = null;

  for (const model of CANDIDATE_GEMINI_MODELS) {
    console.log(`🔮 [Gemini Stream] Requesting tarot reading with model: ${model}`);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
    const requestBody = {
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      system_instruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: GEMINI_RESPONSE_SCHEMA,
        temperature: 0.7,
        thinkingConfig: {
          thinkingBudget: 0, // Disable chain-of-thought latency for high speed
        },
      },
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        console.log(`✨ [Gemini Stream] Connected and streaming successfully with: ${model}`);
        response = res;
        break;
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`Gemini Model ${model} returned ${res.status}:`, errText);
      }
    } catch (e) {
      console.warn(`Gemini Model ${model} fetch failed:`, e);
    }
  }

  if (!response || !response.body) {
    console.warn("ทุก Gemini Model ไม่ตอบสนอง ทำการสลับไปใช้ Local Reading Stream เพื่อไม่ให้ผู้ใช้ต้องรอนาน");
    yield* streamMockGeminiReading(ctx);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let jsonAccumulator = "";
  let sentOpening = false;
  let sentConnections = false;
  let sentSummary = false;
  let cardsSent = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const chunk = JSON.parse(jsonStr);
            const textPart = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textPart) {
              jsonAccumulator += textPart;
              const partial = parsePartialReading(jsonAccumulator);

              if (!sentOpening && partial.opening) {
                sentOpening = true;
                yield { type: "opening", text: partial.opening };
              }

              while (cardsSent < partial.cards.length) {
                const card = partial.cards[cardsSent];
                cardsSent++;
                yield {
                  type: "card",
                  position: card.position,
                  headline: card.headline,
                  reading: card.reading,
                };
              }

              if (!sentConnections && partial.connections) {
                sentConnections = true;
                yield { type: "connections", text: partial.connections };
              }

              if (!sentSummary && partial.summary) {
                sentSummary = true;
                yield { type: "summary", text: partial.summary };
              }
            }
          } catch (e) {
            // Chunk parse ignore
          }
        }
      }
    }

    const parsed = ReadingSchema.safeParse(JSON.parse(jsonAccumulator));
    if (!parsed.success) {
      const loose = parsePartialReading(jsonAccumulator);
      const fallbackReading: Reading = {
        opening: loose.opening || "สวัสดีค่ะ ไพ่ชุดนี้มีพลังงานที่น่าจับตามองมาก",
        cards: loose.cards.map((c) => ({
          position: c.position,
          headline: c.headline,
          reading: c.reading,
        })),
        connections: loose.connections || "ไพ่ทุกใบสะท้อนถึงการเปลี่ยนแปลงที่กำลังดำเนินไป",
        summary: loose.summary || "จงเชื่อมั่นในสัญชาตญาณและก้าวต่อไปอย่างมีสติ",
        advice: ["ตั้งสติและลงมือทำสิ่งที่ทำได้จริง", "เปิดรับโอกาสใหม่ๆ"],
        timing: "ภายใน 1-3 เดือนนี้",
        mood: "ครุ่นคิด",
        yesNoAnswer: null,
      };
      yield { type: "done", reading: fallbackReading, usage: DEFAULT_USAGE };
    } else {
      yield { type: "done", reading: parsed.data, usage: DEFAULT_USAGE };
    }
  } catch (error) {
    console.error("Gemini stream failed:", error);
    yield* streamMockGeminiReading(ctx);
  }
}

export async function* streamMockGeminiReading(ctx: ReadingContext): AsyncGenerator<ReadingEvent> {
  const opening = `สวัสดีค่ะ คุณ${ctx.nickname || "ผู้ถาม"} สัมผัสแรกที่เห็นไพ่ทั้ง ${ctx.drawn.length} ใบสำหรับคำถาม "${ctx.question}" สัมผัสได้ถึงคลื่นพลังงานแห่งการเปลี่ยนแปลงและโอกาสใหม่ที่กำลังหมุนเข้ามา`;
  yield { type: "opening", text: opening };

  const cardsResult = [];
  for (let i = 0; i < ctx.drawn.length; i++) {
    const d = ctx.drawn[i];
    const card = ctx.cards[i];
    const pos = ctx.spread.positions[d.order] || { nameTh: `ตำแหน่งที่ ${i + 1}` };

    const headline = `${card.nameTh} (${d.isReversed ? "กลับหัว" : "หัวตั้ง"}) ในตำแหน่ง ${pos.nameTh}`;
    const reading = `${card.nameTh} ในตำแหน่ง ${pos.nameTh} สะท้อนถึงพลังงานของชีวิต ${
      d.isReversed
        ? "มีอุปสรรคหรือความสับสนที่ต้องค่อยๆ คลายปมด้วยสติ"
        : "เป็นจังหวะที่เกื้อหนุนและให้ความกระจ่างแจ้งในการตัดสินใจ"
    }`;

    cardsResult.push({ position: d.order, headline, reading });
    yield { type: "card", position: d.order, headline, reading };
  }

  const connections = "ไพ่ทั้งหมดในชุดนี้ส่งพลังเกื้อกูลกัน ชี้ให้เห็นว่าสิ่งที่อยู่ในใจคุณกำลังจะพบทางออกที่ลงตัว";
  yield { type: "connections", text: connections };

  const summary = `สำหรับคำถาม "${ctx.question}" บทสรุปคือจงมั่นใจในก้าวต่อไปและตัดสินใจด้วยความรอบคอบ`;
  yield { type: "summary", text: summary };

  const finalReading: Reading = {
    opening,
    cards: cardsResult,
    connections,
    summary,
    advice: ["ตั้งสติและลงมือทำสิ่งที่วางแผนไว้", "เปิดใจรับฟังความคิดเห็นรอบข้าง"],
    timing: "ภายใน 1-2 สัปดาห์ข้างหน้านี้",
    mood: "อบอุ่น",
    yesNoAnswer: null,
  };

  yield { type: "done", reading: finalReading, usage: DEFAULT_USAGE };
}
