/**
 * 🔮 AI Clarification Question Engine (HANDOFF_AI_ACCURACY_THAI B-04)
 * ---------------------------------------------------------------------------
 * ถามกลับ 1 คำถามก่อนสับไพ่ เพื่อเพิ่มข้อมูลบริบทสำคัญ
 *
 * กฎเหล็ก:
 * 1. ข้ามได้เสมอ · ถามแค่ 1 ข้อ · คำถามที่ชัดอยู่แล้วต้องไม่ถาม
 * 2. ผ่าน isAiCapReached() และนับด้วย recordAiCall() (INC-0074)
 * 3. เพดานเต็ม / โมเดลล้ม / เกิน 2.5 วินาที -> ข้ามเงียบ ๆ ไม่บล็อกผู้ใช้
 * 4. คำถามที่ AI ถามกลับต้องผ่าน checkThaiQuality() ก่อนส่งให้ผู้ใช้
 * 5. ไม่มีอิโมจิหรือสัญลักษณ์แฟนซีเด็ดขาด (Rule 2)
 */

import type { Category } from "@/data/cards/types";
import { getGroqApiKey, WORKING_GROQ_MODELS } from "@/lib/ai/groq";
import { groqChatCompletionsEndpoint, aiGatewayHeaders } from "@/lib/ai/gateway";
import { isAiCapReached, recordAiCall } from "@/lib/security/ai-budget";
import { checkThaiQuality, polishThai } from "@/lib/ai/thai-quality";
import { recordEvent } from "@/lib/stats/record";

export interface ClarifyInput {
  question: string;
  category?: Category;
  personaId?: string;
  nickname?: string;
  situation?: string;
  lang?: "th" | "en";
}

export interface ClarifyResult {
  needsClarification: boolean;
  question?: string;
  reason?: string;
  skipped?: boolean;
}

const CLARIFY_SYSTEM_PROMPT_TH = `คุณคือนักพยากรณ์ไพ่ทาโรต์ผู้เชี่ยวชาญด้านจิตวิทยาเชิงลึก หน้าที่ของคุณคือประเมินว่าคำถามของผู้ถามจำเป็นต้องถามข้อมูลบริบทเพิ่มเติมอีก 1 คำถามก่อนเปิดไพ่หรือไม่

หลักเกณฑ์การประเมิน:
1. หากคำถามมีบริบทชัดเจน มีรายละเอียด ตัวเลือก หรือสถานการณ์เฉพาะเจาะจงอยู่แล้ว เช่น:
   - "ควรย้ายไปทำงานบริษัท A ที่เสนอเงินเดือนสูงกว่า 20% แต่ต้องย้ายจังหวัดไหม"
   - "โปรเจกต์เปิดตัวแอปสัปดาห์หน้าจะมีอุปสรรคสำคัญอะไรบ้าง"
   - "ควรบอกความรู้สึกกับเพื่อนสนิทในงานเลี้ยงวันพรุ่งนี้ดีไหม"
   -> ให้ตัดสินว่า "ไม่ต้องถามเพิ่ม" ทันที โดยตั้ง needsClarification: false

2. หากคำถามสั้นมาก คลุมเครือ หรือขาดมิติสำคัญอย่างยิ่ง เช่น:
   - "เขาจะกลับมาไหม" (ไม่รู้ว่าใคร สถานะเดิมคืออะไร หรือห่างกันนานแค่ไหน)
   - "ควรลาออกไหม" (ไม่รู้ว่ามีแผนใหม่ อยากพัก หรือมีปัญหากับที่ทำงาน)
   - "ความรักช่วงนี้" (ไม่รู้ว่าโสด มีคนคุย หรือมีครอบครัว)
   - "จะเป็นอย่างไรต่อไป" (ไม่รู้ว่าเรื่องงาน ความรัก หรือชีวิตด้านใด)
   -> ให้ตัดสินว่า "ต้องการถามเพิ่ม" โดยตั้ง needsClarification: true

3. หากผู้ถามใส่บริบท (situation) มาอย่างเพียงพอแล้ว -> ให้ตั้ง needsClarification: false เสมอ

4. กฎเมื่อ needsClarification เป็น true:
   - สร้างเพียง "1 คำถาม" ที่อ่อนโยน สุภาพ เข้าอกเข้าใจ ตรงประเด็น
   - ภาษาไทย: ลงท้ายด้วย "คะ" หรือ "นะคะ" เสมอ (ห้ามลงท้ายด้วย "ค่ะ" ในประโยคคำถาม) เว้นวรรคไม้ยมกหน้าหลัง
   - ห้ามใส่อิโมจิหรือสัญลักษณ์ดวงดาวแฟนซีเด็ดขาด
   - ความยาวคำถามต้องอยู่ระหว่าง 15-70 ตัวอักษร

ตอบกลับเป็น JSON วัตถุเดียวเท่านั้น ห้ามมีข้อความอื่น:
{
  "needsClarification": boolean,
  "question": "คำถามภาษาไทย 1 ข้อ (ใส่เฉพาะเมื่อ needsClarification เป็น true)",
  "reason": "เหตุผลสั้น ๆ"
}`;

const CLARIFY_SYSTEM_PROMPT_EN = `You are an expert tarot reader and depth psychological counselor. Your role is to determine if the seeker's inquiry requires ONE brief clarifying question before the tarot ritual to ensure an accurate, deeply personalized reading.

Guidelines:
1. If the question is already clear, specific, or framed with distinct options (e.g. "Should I accept company A's offer with 20% higher salary vs staying in my current role?"), mark needsClarification: false.
2. If the inquiry is very brief, ambiguous, or lacks crucial emotional context (e.g. "Will they come back?", "Should I resign?", "Love life outlook?"), mark needsClarification: true.
3. If situation context is already detailed, mark needsClarification: false.
4. When needsClarification is true:
   - Ask EXACTLY ONE poignant, compassionate, conversational question (15-90 characters).
   - Never use emojis or decorative symbols.

Return ONLY a single valid JSON object:
{
  "needsClarification": boolean,
  "question": "One clarifying question (only if needsClarification is true)",
  "reason": "Brief rationale"
}`;

/**
 * ตัดสินใจและสร้างคำถามถามกลับก่อนสับไพ่ (B-04)
 * มีระบบ Fail-Safe: เกิน 2.5 วินาที / โควตาเต็ม / ล้มเหลว -> คืน { needsClarification: false, skipped: true } ทันที
 */
export async function evaluateClarification(input: ClarifyInput): Promise<ClarifyResult> {
  const { question, category = "general", nickname, situation, lang = "th" } = input;
  const cleanQuestion = question.trim();

  // 1. ถ้าคำถามว่าง หรือผู้ใช้ใส่บริบทมาละเอียดแล้ว ไม่ต้องถามเพิ่ม
  if (!cleanQuestion || (situation && situation.trim().length >= 20)) {
    return { needsClarification: false, skipped: true };
  }

  // 2. Fast heuristic: ถ้าคำถามยาวและมีเงื่อนไขเปรียบเทียบชัดเจน ข้ามโมเดลเพื่อประหยัดโทเค็น
  if (
    cleanQuestion.length > 50 &&
    (cleanQuestion.includes("หรือ") ||
      cleanQuestion.includes("ระหว่าง") ||
      cleanQuestion.includes("vs") ||
      cleanQuestion.includes("แต่ต้อง"))
  ) {
    return { needsClarification: false, reason: "Question is already detailed with explicit options" };
  }

  // 3. ตรวจสอบเพดาน AI ประจำวัน (INC-0074)
  try {
    if (await isAiCapReached("guest")) {
      return { needsClarification: false, skipped: true };
    }
  } catch {
    return { needsClarification: false, skipped: true };
  }

  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return { needsClarification: false, skipped: true };
  }

  const isEn = lang === "en";
  const systemInstruction = isEn ? CLARIFY_SYSTEM_PROMPT_EN : CLARIFY_SYSTEM_PROMPT_TH;
  const userMessage = isEn
    ? `Seeker: ${nickname || "Querent"}\nCategory: ${category}\nQuestion: "${cleanQuestion}"${situation ? `\nAdditional Context: "${situation}"` : ""}`
    : `ผู้ถาม: ${nickname || "ผู้มาขอคำทำนาย"}\nหมวดคำทำนาย: ${category}\nคำถาม: "${cleanQuestion}"${situation ? `\nบริบทเดิมที่มี: "${situation}"` : ""}`;

  // 4. เรียกโมเดล Groq พร้อมคุม Timeout ไม่เกิน 2.5 วินาที
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const model = WORKING_GROQ_MODELS[0] || "qwen/qwen3.8-27b";
    const res = await fetch(groqChatCompletionsEndpoint(), {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...aiGatewayHeaders({ cacheTtl: 0 }),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 300,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { needsClarification: false, skipped: true };
    }

    const data = (await res.json()) as any;
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return { needsClarification: false, skipped: true };
    }

    const parsed = JSON.parse(rawContent);
    if (!parsed || typeof parsed.needsClarification !== "boolean") {
      return { needsClarification: false, skipped: true };
    }

    if (!parsed.needsClarification || !parsed.question || typeof parsed.question !== "string") {
      return { needsClarification: false, reason: parsed.reason };
    }

    // 5. ขัดเกลาและตรวจสอบคุณภาพภาษาไทย (A-01 / B-04)
    let finalQuestion = parsed.question.trim();
    if (!isEn) {
      finalQuestion = polishThai(finalQuestion);
      const thaiCheck = checkThaiQuality(finalQuestion);
      // หากมี Fatal issue (เช่น สระซ้อน วรรณยุกต์ซ้อน คำจีน) ให้ข้ามเงียบ ๆ ไม่ปล่อยคำถามมีตำหนิออกไป
      if (thaiCheck.fatal) {
        recordEvent("ai_clarify_thai_rejected");
        return { needsClarification: false, skipped: true };
      }
    }

    // ห้ามมีเครื่องหมายอีโมจิหรือดอกจันดาวแฟนซี
    finalQuestion = finalQuestion.replace(/[\u2726\u2728\u2727\u2605\u2606\uD83D\uDCAB]/g, "").trim();

    // บันทึกการเรียกใช้งาน AI สำเร็จ
    await recordAiCall(1).catch(() => {});
    recordEvent("ai_clarify_triggered");

    return {
      needsClarification: true,
      question: finalQuestion,
      reason: parsed.reason,
    };
  } catch (err: any) {
    // Timeout หรือ Abort หรือ Network error -> ข้ามเงียบตามสเปก
    return { needsClarification: false, skipped: true };
  } finally {
    clearTimeout(timeoutId);
  }
}
