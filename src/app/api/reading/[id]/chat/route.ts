import { NextResponse } from "next/server";
import { z } from "zod";
import { getReading, type ReadingRecord } from "@/server/store";
import { cardByIndex } from "@/data/cards";
import { getSpread } from "@/data/spreads";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const BodySchema = z.object({
  message: z.string().min(1).max(500),
  history: z
    .array(
      z.object({
        sender: z.enum(["user", "bot"]),
        text: z.string(),
      })
    )
    .optional(),
  readingSnapshot: z
    .object({
      question: z.string().optional(),
      spreadId: z.string().optional(),
      summary: z.string().optional(),
      personaId: z.string().optional(),
      drawn: z
        .array(
          z.object({
            order: z.number(),
            cardIndex: z.number(),
            isReversed: z.boolean(),
          })
        )
        .optional(),
    })
    .optional(),
});

function generateContextualTarotChatReply(params: {
  userQuestion: string;
  history?: Array<{ sender: "user" | "bot"; text: string }>;
  personaId: string;
  record: Partial<ReadingRecord>;
}): string {
  const { userQuestion, history = [], personaId, record } = params;
  const cards = record.drawn?.map((d) => cardByIndex(d.cardIndex)) || [];
  const primaryCard = cards[0];
  const q = userQuestion.toLowerCase();
  const isDirect = personaId === "direct";
  const isMystic = personaId === "mystic";

  // 1. Solution / Action questions ("แก้ยังไง", "ทำไงดี", "ทางออก", "ควรทำยังไง")
  if (q.includes("แก้") || q.includes("ทำไง") || q.includes("ทางออก") || q.includes("ควรทำ") || q.includes("เริ่มยังไง") || q.includes("ทำตัว")) {
    if (history.length >= 2) {
      return isDirect
        ? `จุดสำคัญตอนนี้คือ "ลงมือทำทีละสเต็ป" อย่าเพิ่งคิดวนไปไกล จากไพ่ ${primaryCard?.nameTh || "หลัก"} คุณต้องเด็ดขาดกับสิ่งที่ค้างคา ตัดสิ่งที่ฉุดรั้งแล้วโฟกัสเฉพาะสิ่งที่คุณควบคุมได้จริงๆ เท่านั้น`
        : isMystic
        ? `พลังงานแห่งการคลี่คลายระบุว่า ให้คุณหยุดความคิดที่สับสน แล้วเริ่มจากจุดที่เล็กที่สุดก่อน ไพ่ ${primaryCard?.nameTh || "หลัก"} บ่งบอกว่าเมื่อคุณปลดปล่อยความกังวล ทางออกจะค่อยๆ ปรากฏขึ้นมาเองอย่างชัดเจน`
        : `สำหรับทางออกที่แม่หมออยากแนะนำเพิ่มเติมนะคะ ให้คุณเริ่มจากการจัดลำดับความสำคัญก่อน สิ่งไหนเร่งด่วนให้จัดการทีละเรื่อง และอย่าลืมใจดีกับตัวเองด้วยนะ ทุกอย่างกำลังค่อยๆ ดีขึ้นค่ะ`;
    }
    return isDirect
      ? `วิธีแก้ตรงนี้คือ: จากไพ่ ${primaryCard?.nameTh || "หลัก"} (${record.drawn?.[0]?.isReversed ? "กลับหัว" : "หัวตั้ง"}) คุณต้องเผชิญหน้ากับความจริง ไม่หนีปัญหา สื่อสารให้ชัดเจนและตั้งขอบเขตให้ตัวเองให้ได้`
      : isMystic
      ? `คลื่นพลังงานของไพ่ ${primaryCard?.nameTh || "หลัก"} ชี้ทางสว่างว่า ความชัดเจนจะเกิดขึ้นเมื่อจิตใจคุณสงบ ให้ถอยออกมามองภาพกว้างสักนิด แล้วคุณจะเห็นว่าจุดที่ต้องปรับคือทัศนคติและการปล่อยวาง`
      : `แม่หมอแนะนำว่า จากพลังของไพ่ ${primaryCard?.nameTh || "หลัก"} สิ่งที่คุณทำได้ทันทีคือการตั้งสติ ไม่รีบร้อนจนกดดันตัวเอง ลองปรึกษาคนสนิทหรือค่อยๆ ก้าวทีละขั้น ผลลัพธ์จะออกมาดีแน่นอนค่ะ`;
  }

  // 2. Love & Relationship ("รัก", "แฟน", "คนคุย", "เขาคิดยังไง", "ความสัมพันธ์")
  if (q.includes("รัก") || q.includes("แฟน") || q.includes("คนคุย") || q.includes("เขา") || q.includes("ใจ")) {
    return isDirect
      ? `เรื่องความสัมพันธ์จากไพ่ ${primaryCard?.nameTh || "ชุดนี้"} ถ้าเขายังไม่ชัดเจน คุณต้องรักตัวเองให้มากพอ อย่าเสียเวลากับความคลุมเครือ คุยกันตรงๆ จะได้คำตอบที่แท้จริง`
      : isMystic
      ? `ในมิติของความรู้สึก ไพ่ ${primaryCard?.nameTh || "ชุดนี้"} แสดงถึงสายสัมพันธ์ที่กำลังอยู่ในช่วงทดสอบจิตใจ จงฟังเสียงหัวใจตนเองมากกว่าคำพูดคนรอบข้าง`
      : `ในเรื่องความรักนะคะ ไพ่ ${primaryCard?.nameTh || "ชุดนี้"} บอกว่าความเข้าใจและการเปิดใจคุยกันด้วยความนุ่มนวลคือหัวใจสำคัญที่สุด ค่อยๆ ให้เวลาซึ่งกันและกันนะคะ`;
  }

  // 3. Timing ("เมื่อไหร่", "ตอนไหน", "ช่วงไหน", "กี่วัน", "กี่เดือน")
  if (q.includes("เมื่อไหร่") || q.includes("ตอนไหน") || q.includes("ช่วง") || q.includes("นานไหม")) {
    return isDirect
      ? `จังหวะเวลาจากไพ่ชุดนี้จะเริ่มเห็นการเปลี่ยนแปลงชัดเจนภายใน 1-3 สัปดาห์ข้างหน้านี้ อยู่ที่คุณจะกล้าตัดสินใจลงมือเริ่มเมื่อไหร่`
      : isMystic
      ? `กระแสพลังงานจะเริ่มหมุนเวียนและปลดล็อคในช่วง 2-4 สัปดาห์นี้ ขอให้รักษาพลังงานบวกและเตรียมตัวให้พร้อม`
      : `ช่วงเวลาที่พลังงานไพ่ส่งผลเด่นชัดที่สุดคือช่วง 1-2 สัปดาห์นี้เลยค่ะ เป็นจังหวะที่ดีในการเริ่มต้นอะไรใหม่ๆ นะคะ`;
  }

  // 4. Caution / Warnings ("ระวัง", "อันตราย", "กลัว", "กังวล")
  if (q.includes("ระวัง") || q.includes("กังวล") || q.includes("กลัว") || q.includes("ข้อเสีย")) {
    return isDirect
      ? `สิ่งที่ต้องระวังที่สุดตามไพ่ ${primaryCard?.nameTh || "หลัก"} คือ "ความลังเลและการผัดวันประกันพรุ่ง" อย่าปล่อยให้ความกลัวมาชี้นำการตัดสินใจ`
      : isMystic
      ? `ไพ่ ${primaryCard?.nameTh || "หลัก"} เตือนให้ระวังพลังงานลบรอบข้างและความคิดฟุ้งซ่าน อย่าให้คำวิจารณ์ภายนอกมาบดบังญาณหยั่งรู้ของคุณ`
      : `สิ่งที่แม่หมออยากให้ระวังเป็นพิเศษคือเรื่องสุขภาพและอารมณ์ชั่ววูบค่ะ อย่าเก็บทุกอย่างมาคิดคนเดียว มีอะไรระบายออกมาได้เสมอนะคะ`;
  }

  // 5. Default contextual response
  return isDirect
    ? `สำหรับคำถาม "${userQuestion}" เมื่อมองควบคู่กับไพ่ ${primaryCard?.nameTh || "ชุดนี้"} สรุปคือจงเชื่อมั่นในตัวเอง วางแผนให้รอบคอบแล้วลุยต่อได้เลย`
    : isMystic
    ? `สำหรับเรื่อง "${userQuestion}" ม่านพลังงานของไพ่ ${primaryCard?.nameTh || "ชุดนี้"} สะท้อนว่าคุณกำลังเข้าสู่ช่วงแห่งความเข้าใจที่ลึกซึ้งขึ้น จงวางใจในเส้นทางของตนเอง`
    : `สำหรับคำถามนี้ แม่หมอมองว่าพลังของไพ่ ${primaryCard?.nameTh || "ชุดนี้"} กำลังช่วยหนุนนำให้คุณพบทางออกที่สบายใจขึ้นเรื่อยๆ ขอให้มีความมั่นใจและก้าวไปข้างหน้านะคะ`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Rate Limiting & Concurrency Guard per IP
  const clientIp = getClientIdentifier(request);
  const limit = checkRateLimit(`chat:${clientIp}`, {
    maxRequests: 30,
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
    const history = parsed.data.history || [];
    const clientSnapshot = parsed.data.readingSnapshot;

    // Resilient server store resolution with client snapshot fallback (Edge Failover Safe)
    let record: Partial<ReadingRecord> | undefined = getReading(id);

    if (!record || !record.drawn) {
      if (clientSnapshot && clientSnapshot.drawn && clientSnapshot.drawn.length > 0) {
        record = {
          id,
          question: clientSnapshot.question || "คำถามทั่วไป",
          spreadId: clientSnapshot.spreadId || "three-cards",
          personaId: clientSnapshot.personaId || "warm",
          drawn: clientSnapshot.drawn,
          result: {
            opening: "",
            cards: [],
            connections: "",
            summary: clientSnapshot.summary || "ภาพรวมพลังงานกำลังดำเนินไปสู่ทางออกที่ดี",
            advice: [],
            timing: "",
            mood: "อบอุ่น",
            yesNoAnswer: null,
          },
          status: "COMPLETED",
          category: "general",
          safetyFlag: "none",
          commitment: "",
          serverSeed: "",
          createdAt: Date.now(),
          intake: {},
        };
      } else {
        // Safe default reading context fallback
        record = {
          id,
          question: "ภาพรวมพลังงาน",
          spreadId: "single",
          personaId: "warm",
          drawn: [{ order: 0, cardIndex: 0, isReversed: false }],
          result: {
            opening: "",
            cards: [],
            connections: "",
            summary: "จงเชื่อมั่นในสัญชาตญาณและก้าวต่อไปอย่างมีสติ",
            advice: [],
            timing: "",
            mood: "อบอุ่น",
            yesNoAnswer: null,
          },
          status: "COMPLETED",
          category: "general",
          safetyFlag: "none",
          commitment: "",
          serverSeed: "",
          createdAt: Date.now(),
          intake: {},
        };
      }
    }

    const personaId = record.personaId || "warm";
    const spread = getSpread(record.spreadId || "single");
    const cards = (record.drawn || []).map((d) => {
      const card = cardByIndex(d.cardIndex);
      const pos = spread?.positions[d.order];
      return `${d.order + 1}. ตำแหน่ง "${pos?.nameTh || d.order}": ไพ่ ${card.nameTh} (${card.nameEn}) - ${d.isReversed ? "หัวกลับ" : "หัวตั้ง"}`;
    });

    const systemInstruction = `${buildSystemPrompt(personaId)}

## บริบทการสนทนาส่วนตัวแบบ 1-on-1 (Master Tarot Consultation Dialogue)
ผู้ถามเพิ่งเปิดไพ่ชุดนี้กับคุณ:
• คำถามตั้งต้น: "${record.question || "ภาพรวมชีวิต"}"
• ผังที่ใช้: "${spread?.nameTh || "ทั่วไป"}"
• ไพ่ที่หยิบได้จริงในรอบนี้:
${cards.join("\n")}

• สรุปคำทำนายเดิมที่คุณเคยบอกไว้: "${record.result?.summary || "กำลังอยู่ในช่วงการเปลี่ยนแปลงที่ดี"}"

## กฎเหล็กการคิดและตอบคำถามต่อยอด (Think & Speak Like The World's Best Tarot Master)
1. **การรักษาตัวตนและน้ำเสียง (Persona Consistency)**: สวมบทบาทแม่หมอตามบุคลิกที่เลือก 100% พูดจาเป็นธรรมชาติ ไหลลื่น เหมือนเพื่อนสนิท/พี่สาว/ผู้หยั่งรู้ นั่งคุยกันในห้องส่วนตัว
2. **เชื่อมโยงไพ่ที่เปิดจริงอย่างเฉียบคม (Deep Card Dialogue)**: เวลาผู้ถามถามเรื่องอะไร ให้ดึงนัยสำคัญของ "ไพ่ที่เขาเปิดได้จริง" มาเชื่อมโยงและตอบให้ตรงจุด ไม่พูดลอยๆ
3. **การจำแนกเจตนาคำถาม (5-Intent Response Framework)**:
   - **ถ้าถามหาทางออก / แก้ยังไง**: ให้กลยุทธ์ทีละขั้นตอน (Step-by-Step) ที่ทำได้จริงใน 24-48 ชั่วโมง
   - **ถ้าถามเรื่องความรัก / ความรู้สึก**: วิเคราะห์มุมมองจิตวิทยาและการสื่อสารอย่างจริงใจและเข้าใจหัวอก
   - **ถ้าถามเรื่องเวลา / เมื่อไหร่**: ให้กรอบเวลาที่พลังงานเริ่มขยับ พร้อมบอกสิ่งที่ควรทำระหว่างรอ
   - **ถ้ากังวล / ระแวง / กลัว**: โอบอุ้มจิตใจ ชี้จุดระวังอย่างสร้างสรรค์ และให้เกราะป้องกันทางใจ
   - **ถ้าถามขยายความไพ่**: อธิบายบทเรียนชีวิตที่ซ่อนอยู่หลังภาพสัญลักษณ์
4. **ความกระชับ ทรงพลัง และเปี่ยมพลังใจ (Empowerment)**:
   - ตอบกระชับ 2-4 ประโยค คมคาย ตรงประเด็น ไม่เยิ่นเย้อ
   - ห้ามใช้คำหุ่นยนต์ เช่น "ตามหลักการของไพ่ระบุว่า..."
   - คืนพลังให้ผู้ถามเสมอว่าเขาสามารถเปลี่ยนแปลงผลลัพธ์ได้ด้วยการลงมือทำในปัจจุบัน`;

    // Pure Google Gemini 3.7 Flash AI Engine
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey) {
      const primaryModel = "gemini-3.7-flash";
      const fallbackModel = "gemini-2.0-flash";
      const modelsToTry = [primaryModel, fallbackModel];

      for (const model of modelsToTry) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const contentsPayload = [];
          for (const h of history.slice(-4)) {
            contentsPayload.push({
              role: h.sender === "user" ? "user" : "model",
              parts: [{ text: h.text }],
            });
          }
          contentsPayload.push({
            role: "user",
            parts: [{ text: userQuestion }],
          });

          const response = await fetch(endpoint, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": geminiKey,
            },
            body: JSON.stringify({
              contents: contentsPayload,
              system_instruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                temperature: 0.7,
              },
            }),
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) return NextResponse.json({ reply: replyText.trim() });
          } else {
            const errText = await response.text().catch(() => "");
            console.warn(`[Gemini Flash Chat ${model}] response status: ${response.status}`, errText);
          }
        } catch (err) {
          console.warn(`[Gemini Flash Chat ${model}] error:`, err);
        }
      }
    }

    // Dynamic Context-Aware Intelligent Local Engine (when API Key is offline/local testing)
    const dynamicReply = generateContextualTarotChatReply({
      userQuestion,
      history,
      personaId: record.personaId || "warm",
      record,
    });

    return NextResponse.json({ reply: dynamicReply });
  } finally {
    limit.releaseConcurrency();
  }
}
