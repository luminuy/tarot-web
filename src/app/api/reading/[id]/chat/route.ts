import { NextResponse } from "next/server";
import { z } from "zod";
import { getReading } from "@/server/store";
import { cardByIndex } from "@/data/cards";
import { getSpread } from "@/data/spreads";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const BodySchema = z.object({
  message: z.string().min(1).max(500),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getReading(id);

  if (!record || !record.drawn || !record.result) {
    return NextResponse.json({ error: "ไม่พบข้อมูลการเปิดไพ่ หรือการเปิดไพ่ยังไม่เสร็จสมบูรณ์" }, { status: 404 });
  }

  // Rate Limiting & Concurrency Guard per IP
  const clientIp = getClientIdentifier(request);
  const limit = checkRateLimit(`chat:${clientIp}`, {
    maxRequests: 25,
    windowSeconds: 60,
    maxConcurrent: 2,
  });

  if (!limit.allowed) {
    return createRateLimitResponse(limit.retryAfterSeconds, "คุณส่งข้อความเร็วเกินไป พักหายใจสักครู่แล้วค่อยพิมพ์ใหม่นะ");
  }

  try {
    const parsed = BodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม" }, { status: 400 });
    }

    const userQuestion = parsed.data.message;
    const spread = getSpread(record.spreadId);
    const cards = record.drawn.map((d) => {
      const card = cardByIndex(d.cardIndex);
      const pos = spread?.positions[d.order];
      return `${d.order + 1}. ตำแหน่ง "${pos?.nameTh || d.order}": ไพ่ ${card.nameTh} (${card.nameEn}) - ${d.isReversed ? "หัวกลับ" : "หัวตั้ง"}`;
    });

    const systemInstruction = `${buildSystemPrompt(record.personaId)}

## บริบทการตอบคำถามต่อยอด (1-on-1 Follow-up Consultation)
ผู้ถามเพิ่งเปิดไพ่ชุดนี้ไปกับคุณ:
คำถามตั้งต้น: "${record.question}"
ไพ่ที่เขาหยิบได้จริง:
${cards.join("\n")}

สรุปคำทำนายเดิมที่คุณเคยบอกไว้: "${record.result.summary}"

## หัวใจการตอบคำถามเพิ่มเติม (ต้องคุยเหมือนคนจริง 100%)
1. พูดคุยอย่างเป็นกันเอง ตอบคำถามใหม่ของผู้ถามโดยเชื่อมโยงเข้ากับ "ไพ่ชุดเดิมที่เปิดไปแล้ว" ได้อย่างชาญฉลาดและตรงประเด็น
2. ห้ามใช้คำว่า "ตามหลักการของไพ่" หรือตอบแบบบอท ให้พูดจาเหมือนกำลังคุยกันในแชทส่วนตัว เช่น "ถ้าถามเรื่องนี้จากไพ่ชุดเดิม แม่หมอมองว่า...", "จุดที่น่าสนใจคือ..."
3. ตอบกระชับ 2-4 ประโยค ชัดเจน อบอุ่น ฟันธง และให้ข้อคิดที่นำไปใช้ได้จริงทันที`;

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (geminiKey) {
    const models = ["gemini-3.7-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    for (const model of models) {
      console.log(`💬 [Gemini Chat] Sending follow-up to model: ${model}`);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(endpoint, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": geminiKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userQuestion }] }],
            system_instruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              temperature: 0.7,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) return NextResponse.json({ reply: replyText.trim() });
        }
      } catch (err) {
        console.warn(`Chat model ${model} error/timeout:`, err);
      }
    }
  }

    // Instant Fallback / Local Mock
    return NextResponse.json({
      reply: `จากไพ่ที่คุณเปิดไป (${record.drawn.map((d) => cardByIndex(d.cardIndex).nameTh).join(", ")}) สิ่งที่ต้องระวังและโฟกัสมากที่สุดคือการมีสติอยู่กับปัจจุบัน อย่าเพิ่งด่วนตัดสินใจจากอารมณ์ชั่ววูบ และก้าวต่อไปอย่างมั่นคงนะคะ`,
    });
  } finally {
    limit.releaseConcurrency();
  }
}
