import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { parsePartialReading } from "@/lib/utils/partial-json";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "@/lib/ai/prompt";
import { type Reading, ReadingSchema } from "@/lib/schema/reading";

/**
 * ตัวเชื่อมกับ Claude
 * -------------------------------------------------
 * ทั้งไฟล์นี้ทำงานฝั่งเซิร์ฟเวอร์เท่านั้น ห้าม import จาก client component
 */

export const MODEL = "claude-3-5-sonnet-20241022";

/**
 * ระดับความพยายามของโมเดล
 * การอ่านไพ่ต้องเชื่อมโยงไพ่หลายใบเข้าหากันและกลับมาตอบคำถามให้ตรง
 * "medium" ให้คุณภาพที่ดีพอโดยไม่ยืดเวลารอจนผู้ใช้เบื่อ
 * ถ้าจะปรับ ให้วัดจากคะแนน "แม่นไหม" ที่ผู้ใช้ให้ท้ายคำอ่าน ไม่ใช่ปรับตามความรู้สึก
 */
const EFFORT = "medium" as const;

let cachedClient: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!cachedClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY — คัดลอก .env.example เป็น .env แล้วใส่คีย์");
    }
    cachedClient = new Anthropic();
  }
  return cachedClient;
}

export type ReadingEvent =
  | { type: "opening"; text: string }
  | { type: "card"; position: number; headline: string; reading: string }
  | { type: "connections"; text: string }
  | { type: "summary"; text: string }
  | { type: "done"; reading: Reading; usage: UsageInfo }
  | { type: "error"; message: string };

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

/** ข้อความเมื่อโมเดลปฏิเสธ — ผู้ใช้ต้องไม่เจอ error ดิบ */
const REFUSAL_MESSAGE =
  "ขอโทษนะ คำถามนี้เราอ่านให้ไม่ได้จริง ๆ มันเกินขอบเขตที่ไพ่ควรตอบ ลองตั้งคำถามใหม่ในมุมที่เกี่ยวกับความรู้สึกหรือการตัดสินใจของคุณเองดูไหม เครดิตของรอบนี้ไม่ถูกหักนะ";

/**
 * อ่านไพ่แบบ streaming
 *
 * ทำไมต้อง stream: การรอข้อความยาว 10-20 วินาทีโดยหน้าจอนิ่ง ๆ ทำลายบรรยากาศ
 * เราจึงส่งคำอ่านออกไปทีละส่วนให้ตรงกับจังหวะที่ผู้ใช้พลิกไพ่ทีละใบ
 *
 * ทำไม system เป็นอาร์เรย์และติด cache_control: ส่วนนั้นคือกฎ + บุคลิก
 * ซึ่งเหมือนเดิมทุกครั้ง จึงให้ Claude แคชไว้ ส่วนไพ่ที่จั่วได้อยู่ใน messages
 * ซึ่งเปลี่ยนทุกครั้ง — เรียงแบบนี้แคชถึงจะไม่พังทุก request
 */
export async function* streamReading(ctx: ReadingContext): AsyncGenerator<ReadingEvent> {
  if (!process.env.ANTHROPIC_API_KEY) {
    yield* streamMockReading(ctx);
    return;
  }
  const client = getClient();

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    system: [
      {
        type: "text",
        text: buildSystemPrompt(ctx.personaId),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildReadingMessage(ctx) }],
    output_config: {
      effort: EFFORT,
      format: zodOutputFormat(ReadingSchema),
    },
  });

  let buffer = "";
  let sentOpening = false;
  let sentConnections = false;
  let sentSummary = false;
  let cardsSent = 0;

  try {
    for await (const event of stream) {
      if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;

      buffer += event.delta.text;
      const partial = parsePartialReading(buffer);

      if (!sentOpening && partial.opening) {
        sentOpening = true;
        yield { type: "opening", text: partial.opening };
      }

      // ส่งเฉพาะไพ่ใบใหม่ที่เพิ่งอ่านจบ ไม่ส่งซ้ำใบเดิม
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

    const final = await stream.finalMessage();

    if (final.stop_reason === "refusal") {
      yield { type: "error", message: REFUSAL_MESSAGE };
      return;
    }

    const parsed = ReadingSchema.safeParse(JSON.parse(buffer));
    if (!parsed.success) {
      // โมเดลตอบผิดโครงสร้าง — เกิดได้ยากเมื่อใช้ structured output แต่ต้องกันไว้
      console.error("โครงสร้างคำอ่านไม่ตรง schema", parsed.error.issues.slice(0, 3));
      yield { type: "error", message: "คำอ่านขัดข้องระหว่างทาง ลองเปิดใหม่อีกครั้งนะ เครดิตไม่ถูกหัก" };
      return;
    }

    yield {
      type: "done",
      reading: parsed.data,
      usage: {
        inputTokens: final.usage.input_tokens,
        outputTokens: final.usage.output_tokens,
        cacheReadTokens: final.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: final.usage.cache_creation_input_tokens ?? 0,
      },
    };
  } catch (error) {
    console.error("streamReading ล้มเหลว", error);
    const message =
      error instanceof Anthropic.RateLimitError
        ? "ตอนนี้มีคนเปิดไพ่พร้อมกันเยอะมาก รอสักครู่แล้วลองใหม่นะ เครดิตไม่ถูกหัก"
        : "เชื่อมต่อกับแม่หมอไม่ได้ชั่วคราว ลองใหม่อีกครั้งนะ เครดิตไม่ถูกหัก";
    yield { type: "error", message };
  }
}

/** จำลองการอ่านไพ่แบบสตรีมมิ่งสำหรับโหมดพัฒนาหรือเมื่อยังไม่ได้ใส่ API Key */
async function* streamMockReading(ctx: ReadingContext): AsyncGenerator<ReadingEvent> {
  const { spread, category, drawn, cards, nickname } = ctx;
  const name = nickname || "คุณ";

  await new Promise((r) => setTimeout(r, 400));
  yield {
    type: "opening",
    text: `สวัสดีค่ะ${name} เมื่อสัมผัสถึงพลังงานของไพ่ที่คุณเลือกด้วยตัวเองในสำรับนี้ ไพ่ทั้ง ${spread.positions.length} ใบสื่อสารเรื่องราวที่น่าสนใจและมีพลังชัดเจนมากค่ะ`,
  };

  const cardReadings: import("@/lib/schema/reading").CardReading[] = [];

  for (let i = 0; i < drawn.length; i++) {
    await new Promise((r) => setTimeout(r, 600));
    const d = drawn[i];
    const card = cards[i];
    const pos = spread.positions[d.order];
    const orientation = d.isReversed ? "หัวกลับ" : "หัวตั้ง";
    const meaning = d.isReversed
      ? card.meanings[category].reversed
      : card.meanings[category].upright;

    const headline = `${card.nameTh} (${orientation})`;
    const readingText = `ในตำแหน่ง "${pos.nameTh}" ซึ่งตอบถึง ${pos.meaning}: ไพ่ ${card.nameTh} ชี้ว่า ${meaning} สื่อถึงพลังงานธาตุ${card.element} ที่กำลังขับเคลื่อนสถานการณ์นี้อย่างมีนัยสำคัญ`;

    cardReadings.push({
      position: pos.index,
      headline,
      reading: readingText,
    });

    yield {
      type: "card",
      position: pos.index,
      headline,
      reading: readingText,
    };
  }

  await new Promise((r) => setTimeout(r, 500));
  const connectionsText = `ไพ่ชุดนี้สะท้อนความเชื่อมโยงของพลังงานที่กำลังก่อตัว โดยมีธาตุหลักส่งผลให้เรื่องราวในอดีตกำลังคลี่คลายไปสู่บทเรียนสำคัญในขั้นถัดไป`;
  yield { type: "connections", text: connectionsText };

  await new Promise((r) => setTimeout(r, 500));
  const summaryText = `โดยสรุปแล้ว เส้นทางข้างหน้าขึ้นอยู่กับการตัดสินใจและการรับรู้ตัวตนที่ชัดเจนของคุณ ความจริงใจต่อความรู้สึกของตนเองจะนำพาผลลัพธ์ที่ดีที่สุดมาให้`;
  yield { type: "summary", text: summaryText };

  const fullReading: Reading = {
    opening: `สวัสดีค่ะ${name} เมื่อสัมผัสถึงพลังงานของไพ่ที่คุณเลือกด้วยตัวเองในสำรับนี้ ไพ่ทั้ง ${spread.positions.length} ใบสื่อสารเรื่องราวที่น่าสนใจและมีพลังชัดเจนมากค่ะ`,
    cards: cardReadings,
    connections: connectionsText,
    summary: summaryText,
    advice: [
      "ให้เวลากับตัวเองในการทบทวนเป้าหมายที่แท้จริงอย่างน้อย 10 นาทีในวันพรุ่งนี้",
      "เปิดรับมุมมองใหม่ๆ และไม่ยึดติดกับสิ่งที่ผ่านไปแล้ว",
      "ลงมือทำในสิ่งที่ควบคุมได้ทีละก้าวอย่างต่อเนื่อง",
    ],
    timing: "ภายใน 2-4 สัปดาห์ข้างหน้านี้ พลังงานจะเริ่มขยับเห็นทิศทางที่ชัดเจนขึ้น",
    yesNoAnswer: spread.yesNoMode ? "ใช่" : null,
    mood: "อบอุ่น",
  };

  yield {
    type: "done",
    reading: fullReading,
    usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
  };
}
