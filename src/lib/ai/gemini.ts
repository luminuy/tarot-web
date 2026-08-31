import { parsePartialReading } from "@/lib/utils/partial-json";
import { buildReadingMessage, buildSystemPrompt, type ReadingContext } from "@/lib/ai/prompt";
import { type Reading, ReadingSchema } from "@/lib/schema/reading";
import type { ReadingEvent, UsageInfo } from "@/lib/ai/claude";

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
  "gemini-2.0-flash",
];

// ค่าเริ่มต้นก่อนได้ usageMetadata จริงจาก Gemini — ตั้งเป็นศูนย์แทนการเดาตัวเลข
// เพื่อไม่ให้ระบบคิดต้นทุน/เครดิตหลงเชื่อตัวเลขปลอมถ้า Gemini เปลี่ยน API แล้วไม่ส่ง usageMetadata มา
const DEFAULT_USAGE: UsageInfo = {
  inputTokens: 0,
  outputTokens: 0,
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
  // เก็บ usageMetadata จริงจาก chunk ล่าสุดที่มันมากับ Gemini stream
  // (ไม่ใช้ตัวเลขคงที่ เพราะระบบเครดิต/สมาชิกต้องคิดต้นทุนจากของจริง ไม่งั้นบิลกับที่คิดราคาขายไม่ตรงกัน)
  let usage: UsageInfo = { ...DEFAULT_USAGE };

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

            // usageMetadata มักมากับ chunk สุดท้ายของสตรีม เก็บล่าสุดที่เจอไว้เสมอ
            const meta = chunk.usageMetadata;
            if (meta) {
              usage = {
                inputTokens: meta.promptTokenCount ?? usage.inputTokens,
                outputTokens: meta.candidatesTokenCount ?? usage.outputTokens,
                // Gemini ไม่มี prompt caching แบบเดียวกับ Claude จึงเป็น 0 เสมอในตอนนี้
                cacheReadTokens: meta.cachedContentTokenCount ?? 0,
                cacheWriteTokens: 0,
              };
            }

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
      yield { type: "done", reading: fallbackReading, usage };
    } else {
      yield { type: "done", reading: parsed.data, usage };
    }
  } catch (error) {
    console.error("Gemini stream failed:", error);
    yield* streamMockGeminiReading(ctx);
  }
}

export async function* streamMockGeminiReading(ctx: ReadingContext): AsyncGenerator<ReadingEvent> {
  const nickname = ctx.nickname?.trim() || "ผู้แสวงหาคำตอบ";
  const question = ctx.question?.trim() || "ภาพรวมดวงชะตา";
  const category = (ctx.category || "general") as "general" | "work" | "money" | "love" | "self";

  // 1. Opening Greeting tailored by Persona
  let opening = "";
  if (ctx.personaId === "direct") {
    opening = `สวัสดีคุณ${nickname} ไพ่ทั้ง ${ctx.drawn.length} ใบสำหรับเรื่อง "${question}" วางเรียงออกมาตรงไปตรงมา ชัดเจนในทิศทางที่ต้องเลือก`;
  } else if (ctx.personaId === "mystic") {
    opening = `ยินดีต้อนรับสู่วิหารศักดิ์สิทธิ์ คุณ${nickname} สัมผัสแรกจากไพ่ทั้ง ${ctx.drawn.length} ใบปรากฏคลื่นพลังงานลี้ลับที่กำลังหมุนวนรอบคำถาม "${question}"`;
  } else {
    opening = `สวัสดีค่ะคุณ${nickname} แม่หมอเปิดไพ่ทั้ง ${ctx.drawn.length} ใบให้แล้วนะคะ สำหรับคำถาม "${question}" ไพ่ส่งมอบความกระจ่างและพลังบวกมาให้อย่างอบอุ่นค่ะ`;
  }
  yield { type: "opening", text: opening };
  await new Promise((r) => setTimeout(r, 40));

  // 2. Per-card Deep Interpretation from 78 Cards Encyclopedia
  const cardsResult = [];
  let majorCount = 0;
  const elementCounts: Record<string, number> = { ไฟ: 0, น้ำ: 0, ลม: 0, ดิน: 0 };

  for (let i = 0; i < ctx.drawn.length; i++) {
    const d = ctx.drawn[i];
    const card = ctx.cards[i];
    if (!card) continue;

    if (card.arcana === "major") majorCount++;
    if (card.element && elementCounts[card.element] !== undefined) {
      elementCounts[card.element]++;
    }

    const pos = ctx.spread.positions[d.order] || {
      nameTh: `ตำแหน่งที่ ${i + 1}`,
      meaning: "พลังงานในตำแหน่งนี้",
    };

    const orientation = d.isReversed ? "reversed" : "upright";
    const catMeaning = card.meanings?.[category]?.[orientation] || card.meanings?.general?.[orientation] || "";
    const keywords = card.keywords?.[orientation]?.slice(0, 3).join(", ") || "";

    const headline = `${card.nameTh}${d.isReversed ? " (กลับหัว)" : ""} ในตำแหน่ง${pos.nameTh}`;
    
    let reading = "";
    if (d.isReversed) {
      reading = `${card.nameTh} ในตำแหน่ง ${pos.nameTh} (${pos.meaning}) บ่งบอกถึงภาวะที่พลังงานอาจสะดุดหรือมีความลังเลภายใน คีย์สำคัญคือ "${keywords}" คำแนะนำคือ ${catMeaning}`;
    } else {
      reading = `${card.nameTh} ในตำแหน่ง ${pos.nameTh} (${pos.meaning}) เป็นสัญญาณเกื้อหนุนอย่างเด่นชัด คีย์สำคัญคือ "${keywords}" พลังงานบอกว่า ${catMeaning}`;
    }

    cardsResult.push({ position: d.order, headline, reading });
    yield { type: "card", position: d.order, headline, reading };
    await new Promise((r) => setTimeout(r, 35));
  }

  // 3. Card Connections Synthesis
  const dominantElement = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "ดิน";
  let connections = "";
  if (majorCount >= Math.ceil(ctx.drawn.length / 2)) {
    connections = `ไพ่ชุดนี้มีไพ่ชุดใหญ่ (Major Arcana) ปรากฏขึ้นถึง ${majorCount} ใบ ชี้ว่าเรื่องนี้เป็นจุดเปลี่ยนสำคัญของชีวิตที่จักรวาลกำลังจัดสรร ไม่ใช่เรื่องบังเอิญเล็กๆ น้อยๆ`;
  } else {
    connections = `พลังงานธาตุ${dominantElement}ปรากฏเด่นชัดในผังนี้ ส่งพลังเชื่อมโยงให้เห็นว่า ความพยายามและการลงมือทำทีละก้าวของคุณจะนำพาผลลัพธ์ที่จับต้องได้มาให้`;
  }
  yield { type: "connections", text: connections };
  await new Promise((r) => setTimeout(r, 30));

  // 4. Core Summary
  let summary = "";
  if (ctx.personaId === "direct") {
    summary = `สรุปสำหรับคำถาม "${question}": ความจริงปรากฏชัดเจนแล้ว อย่าปล่อยให้ความลังเลดึงเวลาไว้ จงตัดสินใจบนพื้นฐานของเหตุผลและความจริง`;
  } else if (ctx.personaId === "mystic") {
    summary = `สารจากดวงดาวและไพ่สำหรับ "${question}": ม่านหมอกกำลังสลายตัว จงเชื่อมั่นในญาณหยั่งรู้ของคุณ แล้วทางข้างหน้าจะปรากฏอย่างแจ่มชัด`;
  } else {
    summary = `แม่หมอขอสรุปให้คุณ${nickname}ว่า สำหรับ "${question}" ทุกอย่างมีทางออกที่ดีเสมอ ขอให้มั่นใจในคุณค่าของตัวเองและก้าวไปข้างหน้าอย่างอบอุ่นใจนะคะ`;
  }
  yield { type: "summary", text: summary };
  await new Promise((r) => setTimeout(r, 30));

  // 5. Actionable Advice
  const adviceList: string[] = [];
  if (dominantElement === "ไฟ") {
    adviceList.push("กล้าที่จะริเริ่มและลงมือทำทันทีที่มีโอกาส");
    adviceList.push("ระวังอารมณ์ใจร้อน ให้คิดอย่างรอบคอบก่อนเจรจา");
  } else if (dominantElement === "น้ำ") {
    adviceList.push("รับฟังความรู้สึกและสัญชาตญาณภายในของตนเอง");
    adviceList.push("ให้เวลาตัวเองได้ผ่อนคลายและเคลียร์จิตใจให้แจ่มใส");
  } else if (dominantElement === "ลม") {
    adviceList.push("รวบรวมข้อมูลและวิเคราะห์เหตุผลให้รอบด้าน");
    adviceList.push("สื่อสารอย่างตรงไปตรงมาและชัดเจนกับผู้เกี่ยวข้อง");
  } else {
    adviceList.push("จัดระเบียบแผนงานและการเงินให้มั่นคงเป็นขั้นตอน");
    adviceList.push("อดทนและสร้างรากฐานที่แข็งแรงทีละก้าว");
  }

  const finalReading: Reading = {
    opening,
    cards: cardsResult,
    connections,
    summary,
    advice: adviceList,
    timing: dominantElement === "ไฟ" ? "ภายใน 1-2 สัปดาห์นี้" : dominantElement === "น้ำ" ? "ภายใน 1 เดือนนี้" : dominantElement === "ลม" ? "เร็วๆ นี้ภายในไม่กี่วัน" : "ภายใน 1-3 เดือนนี้",
    mood: majorCount > 1 ? "ท้าทาย" : "อบอุ่น",
    yesNoAnswer: null,
  };

  yield { type: "done", reading: finalReading, usage: DEFAULT_USAGE };
}
