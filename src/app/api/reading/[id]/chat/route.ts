import { NextResponse } from "next/server";
import { z } from "zod";
import { getReading, type ReadingRecord } from "@/server/store";
import { cardByIndex } from "@/data/cards";
import { getSpread } from "@/data/spreads";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { getContentOverrides, resolveCardByIndex, resolvePersona, resolveSystemCore } from "@/lib/content/overrides";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";

import { formatCardLoreForPrompt } from "@/data/cards/visual-lore";
import { checkQuestion, CRISIS_MESSAGE } from "@/lib/safety/guardrails";
import { assessCrisisRisk } from "@/lib/safety/ai-classifier";
import { aiGatewayHeaders, geminiEndpoint } from "@/lib/ai/gateway";
import { recordEvent, recordEvents } from "@/lib/stats/record";
import { sanitizeTarotText, stripThinkingTags } from "@/lib/ai/language";

export const runtime = "nodejs";

const BodySchema = z.object({
  message: z.string().min(1, "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม").max(2000, "คำถามยาวเกิน 2,000 ตัวอักษร"),
  history: z
    .array(
      z.object({
        sender: z.enum(["user", "bot"]),
        text: z.string().max(50000),
      })
    )
    .max(50)
    .optional(),
  readingSnapshot: z
    .object({
      question: z.string().max(1000).optional(),
      spreadId: z.string().max(100).optional(),
      summary: z.string().max(10000).optional(),
      personaId: z.string().max(100).optional(),
      drawn: z
        .array(
          z.object({
            order: z.number().int().min(0).max(77),
            cardIndex: z.number().int().min(0).max(77),
            isReversed: z.boolean(),
          })
        )
        .max(78)
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

  // Crisis / self-harm safety check for offline fallback
  const safety = checkQuestion(userQuestion);
  if (safety.block) {
    return safety.message || "หากคุณกำลังเผชิญช่วงเวลาที่ยากลำบาก สายด่วนสุขภาพจิต 1323 พร้อมรับฟังเสมอค่ะ";
  }

  const cards = (record.drawn?.map((d) => cardByIndex(d.cardIndex)) || []).filter(
    (c): c is import("@/data/cards").TarotCard => !!c
  );
  const primaryCard = cards[0];

  const q = userQuestion.toLowerCase();
  const isDirect = personaId === "direct";
  const isMystic = personaId === "mystic";
  const isPlayful = personaId === "playful";
  const isMaster = personaId === "master";

  // 1. Solution / Action questions ("แก้ยังไง", "ทำไงดี", "ทางออก", "ควรทำยังไง")
  if (q.includes("แก้") || q.includes("ทำไง") || q.includes("ทางออก") || q.includes("ควรทำ") || q.includes("เริ่มยังไง") || q.includes("ทำตัว")) {
    if (history.length >= 2) {
      if (isPlayful) {
        return `แกรรร สเต็ปนี้ง่ายมาก! จากไพ่ ${primaryCard?.nameTh || "หลัก"} พักความเครียดไว้ก่อน แล้วเริ่มทำสิ่งเล็กๆ ที่ทำเสร็จได้ใน 10 นาทีนี้เลย รับรองว่าพอเครื่องติดแล้วทุกอย่างจะโฟลว์เอง ลุยยย! ✨`;
      }
      if (isMaster) {
        return `สำหรับกลยุทธ์ขั้นต่อไป: ไพ่ ${primaryCard?.nameTh || "หลัก"} ชี้ชัดว่าต้องวางแผน 2 ขั้นตอน: 1) ตัดภาระงานที่ไม่สร้างผลลัพธ์ออกทันที 2) กำหนดเส้นตายการตัดสินใจให้ชัดเจนภายใน 48 ชั่วโมงนี้ครับ`;
      }
      return isDirect
        ? `จุดสำคัญตอนนี้คือ "ลงมือทำทีละสเต็ป" อย่าเพิ่งคิดวนไปไกล จากไพ่ ${primaryCard?.nameTh || "หลัก"} คุณต้องเด็ดขาดกับสิ่งที่ค้างคา ตัดสิ่งที่ฉุดรั้งแล้วโฟกัสเฉพาะสิ่งที่คุณควบคุมได้จริงๆ เท่านั้น`
        : isMystic
        ? `พลังงานแห่งการคลี่คลายระบุว่า ให้คุณหยุดความคิดที่สับสน แล้วเริ่มจากจุดที่เล็กที่สุดก่อน ไพ่ ${primaryCard?.nameTh || "หลัก"} บ่งบอกว่าเมื่อคุณปลดปล่อยความกังวล ทางออกจะค่อยๆ ปรากฏขึ้นมาเองอย่างชัดเจน`
        : `สำหรับทางออกที่แม่หมออยากแนะนำเพิ่มเติมนะคะ ให้คุณเริ่มจากการจัดลำดับความสำคัญก่อน สิ่งไหนเร่งด่วนให้จัดการทีละเรื่อง และอย่าลืมใจดีกับตัวเองด้วยนะ ทุกอย่างกำลังค่อยๆ ดีขึ้นค่ะ`;
    }
    if (isPlayful) {
      return `โอ๊ยยย เจ้าไพ่ ${primaryCard?.nameTh || "หลัก"} (${record.drawn?.[0]?.isReversed ? "กลับหัว" : "หัวตั้ง"}) ใบนี้มันบอกว่าอย่าเพิ่งนอยด์ไปแก ทางแก้คือเคลียร์ใจตัวเองก่อน อะไรไม่ชัวร์อย่าเพิ่งไปรับปาก ค่อยๆ ก้าวไปทีละก้าว เดี๋ยวก็สวยงาม! ✦`;
    }
    if (isMaster) {
      return `แนวทางแก้ไขตามหลักการของไพ่ ${primaryCard?.nameTh || "หลัก"}: ต้องวิเคราะห์ต้นเหตุอย่างมีเหตุผล แยกแยะข้อเท็จจริงออกจากอารมณ์ แล้วตั้งเป้าหมายระยะสั้นเพื่อควบคุมสถานการณ์ให้ได้ครับ`;
    }
    return isDirect
      ? `วิธีแก้ตรงนี้คือ: จากไพ่ ${primaryCard?.nameTh || "หลัก"} (${record.drawn?.[0]?.isReversed ? "กลับหัว" : "หัวตั้ง"}) คุณต้องเผชิญหน้ากับความจริง ไม่หนีปัญหา สื่อสารให้ชัดเจนและตั้งขอบเขตให้ตัวเองให้ได้`
      : isMystic
      ? `คลื่นพลังงานของไพ่ ${primaryCard?.nameTh || "หลัก"} ชี้ทางสว่างว่า ความชัดเจนจะเกิดขึ้นเมื่อจิตใจคุณสงบ ให้ถอยออกมามองภาพกว้างสักนิด แล้วคุณจะเห็นว่าจุดที่ต้องปรับคือทัศนคติและการปล่อยวาง`
      : `แม่หมอแนะนำว่า จากพลังของไพ่ ${primaryCard?.nameTh || "หลัก"} สิ่งที่คุณทำได้ทันทีคือการตั้งสติ ไม่รีบร้อนจนกดดันตัวเอง ลองปรึกษาคนสนิทหรือค่อยๆ ก้าวทีละขั้น ผลลัพธ์จะออกมาดีแน่นอนค่ะ`;
  }

  // 2. Love & Relationship ("รัก", "แฟน", "คนคุย", "เขาคิดยังไง", "ความสัมพันธ์")
  if (q.includes("รัก") || q.includes("แฟน") || q.includes("คนคุย") || q.includes("เขา") || q.includes("ใจ")) {
    if (isPlayful) {
      return `เรื่องความรักนี่ขอเม้าท์เลย! ไพ่ ${primaryCard?.nameTh || "ชุดนี้"} บอกว่าถ้าเขาทำตัวลึกลับหรือไม่ชัดเจน เราก็ต้องสวยและเชิ่ดเข้าไว้ รักตัวเองให้สุดแล้วเสน่ห์จะทำงานเองแก! ✦`;
    }
    if (isMaster) {
      return `ในมิติของความสัมพันธ์: ไพ่ ${primaryCard?.nameTh || "ชุดนี้"} บ่งชี้ว่าความชัดเจนคือสิ่งที่ต้องสร้าง ไม่ใช่สิ่งที่ต้องรอ ประเมินความคุ้มค่าทางอารมณ์และตัดสินใจบนพื้นฐานของความเป็นจริงครับ`;
    }
    return isDirect
      ? `เรื่องความสัมพันธ์จากไพ่ ${primaryCard?.nameTh || "ชุดนี้"} ถ้าเขายังไม่ชัดเจน คุณต้องรักตัวเองให้มากพอ อย่าเสียเวลากับความคลุมเครือ คุยกันตรงๆ จะได้คำตอบที่แท้จริง`
      : isMystic
      ? `ในมิติของความรู้สึก ไพ่ ${primaryCard?.nameTh || "ชุดนี้"} แสดงถึงสายสัมพันธ์ที่กำลังอยู่ในช่วงทดสอบจิตใจ จงฟังเสียงหัวใจตนเองมากกว่าคำพูดคนรอบข้าง`
      : `ในเรื่องความรักนะคะ ไพ่ ${primaryCard?.nameTh || "ชุดนี้"} บอกว่าความเข้าใจและการเปิดใจคุยกันด้วยความนุ่มนวลคือหัวใจสำคัญที่สุด ค่อยๆ ให้เวลาซึ่งกันและกันนะคะ`;
  }

  // 3. Timing ("เมื่อไหร่", "ตอนไหน", "ช่วงไหน", "กี่วัน", "กี่เดือน")
  if (q.includes("เมื่อไหร่") || q.includes("ตอนไหน") || q.includes("ช่วง") || q.includes("นานไหม")) {
    if (isPlayful) {
      return `จังหวะเวลานี้ไพ่กระซิบมาว่า ไวสุดคือ 1-2 สัปดาห์นี้เลยแก! แต่ระหว่างนี้ห้ามนอนเฉยๆ นะ ต้องเตรียมตัวให้พร้อมรอรับโชคด้วย! ✨`;
    }
    if (isMaster) {
      return `จากการคำนวณวงรอบพลังงานไพ่: กรอบเวลาที่เหตุการณ์จะตกผลึกคือช่วง 2-3 สัปดาห์ข้างหน้านี้ โดยจะเริ่มเห็นสัญญาณบวกแรกภายใน 7 วันครับ`;
    }
    return isDirect
      ? `จังหวะเวลาจากไพ่ชุดนี้จะเริ่มเห็นการเปลี่ยนแปลงชัดเจนภายใน 1-3 สัปดาห์ข้างหน้านี้ อยู่ที่คุณจะกล้าตัดสินใจลงมือเริ่มเมื่อไหร่`
      : isMystic
      ? `กระแสพลังงานจะเริ่มหมุนเวียนและปลดล็อคในช่วง 2-4 สัปดาห์นี้ ขอให้รักษาพลังงานบวกและเตรียมตัวให้พร้อม`
      : `ช่วงเวลาที่พลังงานไพ่ส่งผลเด่นชัดที่สุดคือช่วง 1-2 สัปดาห์นี้เลยค่ะ เป็นจังหวะที่ดีในการเริ่มต้นอะไรใหม่ๆ นะคะ`;
  }

  // 4. Caution / Warnings ("ระวัง", "อันตราย", "กลัว", "กังวล")
  if (q.includes("ระวัง") || q.includes("กังวล") || q.includes("กลัว") || q.includes("ข้อเสีย")) {
    if (isPlayful) {
      return `สิ่งที่ต้องระวังสุดๆ จากไพ่ ${primaryCard?.nameTh || "หลัก"} คือ "การคิดมากไปเองก่อนนอน" แกเอ๊ยยย พักสมองบ้าง ความกังวล 90% ไม่เคยเกิดขึ้นจริง! `;
    }
    if (isMaster) {
      return `ข้อควรระวังสำคัญ: ไพ่ ${primaryCard?.nameTh || "หลัก"} เตือนเรื่องการตัดสินใจด้วยความรีบร้อนหรือขาดข้อมูลรอบด้าน ต้องตรวจสอบรายละเอียดให้รัดกุมก่อนลงนามหรือตกลงครับ`;
    }
    return isDirect
      ? `สิ่งที่ต้องระวังที่สุดตามไพ่ ${primaryCard?.nameTh || "หลัก"} คือ "ความลังเลและการผัดวันประกันพรุ่ง" อย่าปล่อยให้ความกลัวมาชี้นำการตัดสินใจ`
      : isMystic
      ? `ไพ่ ${primaryCard?.nameTh || "หลัก"} เตือนให้ระวังพลังงานลบรอบข้างและความคิดฟุ้งซ่าน อย่าให้คำวิจารณ์ภายนอกมาบดบังญาณหยั่งรู้ของคุณ`
      : `สิ่งที่แม่หมออยากให้ระวังเป็นพิเศษคือเรื่องสุขภาพและอารมณ์ชั่ววูบค่ะ อย่าเก็บทุกอย่างมาคิดคนเดียว มีอะไรระบายออกมาได้เสมอนะคะ`;
  }

  // 5. Default contextual response
  if (isPlayful) {
    return `สำหรับเรื่อง "${userQuestion}" จากหน้าไพ่ ${primaryCard?.nameTh || "ชุดนี้"} สรุปให้ฟังสั้นๆ เลยนะแก: มั่นใจในเสน่ห์และความสามารถของตัวเองเข้าไว้ เส้นทางข้างหน้ามีเรื่องสนุกๆ รออยู่อีกเพียบ! ✦`;
  }
  if (isMaster) {
    return `สำหรับประเด็น "${userQuestion}": เมื่อพิจารณาควบคู่กับไพ่ ${primaryCard?.nameTh || "ชุดนี้"} ขอให้คุณยึดมั่นในวินัยและเป้าหมายหลัก ทิศทางโดยรวมเป็นบวกและกำลังพัฒนาไปในทางที่ถูกต้องครับ`;
  }
  return isDirect
    ? `สำหรับคำถาม "${userQuestion}" เมื่อมองควบคู่กับไพ่ ${primaryCard?.nameTh || "ชุดนี้"} สรุปคือจงเชื่อมั่นในตัวเอง วางแผนให้รอบคอบแล้วลุยต่อได้เลย`
    : isMystic
    ? `สำหรับเรื่อง "${userQuestion}" ม่านพลังงานของไพ่ ${primaryCard?.nameTh || "ชุดนี้"} สะท้อนว่าคุณกำลังเข้าสู่ช่วงแห่งความเข้าใจที่ลึกซึ้งขึ้น จงวางใจในเส้นทางของตนเอง`
    : `สำหรับคำถามนี้ แม่หมอมองว่าพลังของไพ่ ${primaryCard?.nameTh || "ชุดนี้"} กำลังช่วยหนุนนำให้คุณพบทางออกที่สบายใจขึ้นเรื่อยๆ ขอให้มีความมั่นใจและก้าวไปข้างหน้านะคะ`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก (Unauthorized Origin)" }, { status: 403 });
  }

  const { id } = await params;

  // Rate Limiting & Concurrency Guard per IP
  const { isPrivilegedTestRequest } = await import("@/lib/security/privileged");
  const privileged = await isPrivilegedTestRequest(request);

  // ── การคุยต่อกับแม่หมอ = สมาชิกเท่านั้น (ENTITLEMENT_PLAN ข้อ 4) · ไม่กินโควตาเปิดไพ่ ──
  if (!privileged) {
    const { isEntitlementEnabled } = await import("@/lib/entitlement/flag");
    if (await isEntitlementEnabled()) {
      const { getViewer } = await import("@/lib/entitlement/viewer");
      const viewer = await getViewer(request);
      if (viewer.kind !== "member") {
        recordEvent("entitlement_blocked_chat");
        return NextResponse.json(
          {
            error: "สมัครสมาชิกเพื่อถามแม่หมอต่อ และเก็บดวงไว้ดูย้อนหลังได้ทุกเครื่อง",
            reason: "members_only",
          },
          { status: 403 },
        );
      }
    }
  }

  let limit = { allowed: true, releaseConcurrency: () => {} } as ReturnType<typeof checkRateLimit>;
  if (!privileged) {
    const clientIp = getClientIdentifier(request);
    limit = checkRateLimit(`chat:${clientIp}`, {
      maxRequests: 30,
      windowSeconds: 60,
      maxConcurrent: 2,
    });

    if (!limit.allowed) {
      return createRateLimitResponse(limit.retryAfterSeconds, "คุณส่งข้อความเร็วเกินไป พักหายใจสักครู่แล้วค่อยพิมพ์ใหม่นะ");
    }
  }

  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      console.warn("[Chat API] Schema validation failed:", JSON.stringify(firstIssue));
      const errorMessage =
        firstIssue?.path[0] === "message"
          ? (firstIssue.message || "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม")
          : "ข้อมูลการสนทนาไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const userQuestion = parsed.data.message;
    const history = parsed.data.history || [];
    const clientSnapshot = parsed.data.readingSnapshot;

    recordEvent("chat_message");

    // P0-4 Guard: Screen userQuestion for crisis / self-harm signals (Golden Rule 6 & Hotline 1323)
    const safetyVerdict = checkQuestion(userQuestion);
    if (safetyVerdict.block) {
      recordEvents(["chat_blocked", `safety_flag:${safetyVerdict.flag}`]);
      return NextResponse.json({
        reply: safetyVerdict.message,
        blocked: true,
        crisisCard: true,
      });
    }

    // ชั้น 3: ตัวจำแนกด้วย Workers AI สำหรับสัญญาณวิกฤตแบบอ้อม (fail-open)
    if (await assessCrisisRisk(userQuestion)) {
      recordEvents(["chat_blocked", "safety_flag:crisis_ai"]);
      return NextResponse.json({ reply: CRISIS_MESSAGE, blocked: true, crisisCard: true });
    }

    // Resilient server store resolution with session token and client snapshot fallback (Edge Failover Safe)
    let record: Partial<ReadingRecord> | undefined = getReading(id);

    if (!record || !record.drawn) {
      const token = request.headers.get("x-reading-token");
      if (token) {
        const { verifyReadingSessionToken } = await import("@/lib/security/session-token");
        const recovered = verifyReadingSessionToken(token);
        if (recovered && recovered.id === id) {
          record = recovered;
        }
      }
    }

    if (!record || !record.drawn) {
      if (clientSnapshot && clientSnapshot.drawn && clientSnapshot.drawn.length > 0) {
        record = {
          id,
          question: clientSnapshot.question || "คำถามทั่วไป",
          spreadId: clientSnapshot.spreadId || "three-card",
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
      }
    }

    if (!record || !record.drawn || record.drawn.length === 0) {
      return NextResponse.json(
        {
          error: "ไม่พบสำรับไพ่ที่เปิดไว้ในรอบนี้ กรุณารีเฟรชหน้าเว็บเพื่อเชื่อมต่อกับสำรับไพ่ของคุณอีกครั้ง",
          reason: "reading_not_found",
        },
        { status: 404 },
      );
    }

    const personaId = record.personaId || "warm";
    const spread = getSpread(record.spreadId || "single");
    const overrideDoc = await getContentOverrides();
    const cards = (record.drawn || [])
      .map((d) => {
        const card = resolveCardByIndex(overrideDoc, d.cardIndex);
        if (!card) return null;
        const pos = spread?.positions[d.order];
        const lore = formatCardLoreForPrompt(card.id);
        const cardHeader = `${d.order + 1}. ตำแหน่ง "${pos?.nameTh || d.order}": ไพ่ ${card.nameTh} (${card.nameEn}) - ${d.isReversed ? "หัวกลับ" : "หัวตั้ง"} | ธาตุ: ${card.element}`;
        return lore ? `${cardHeader}\n   ${lore}` : cardHeader;
      })
      .filter((line): line is string => !!line);

    const systemInstruction = `${buildSystemPrompt(personaId, {
      systemCore: resolveSystemCore(overrideDoc),
      persona: resolvePersona(overrideDoc, personaId),
    })}

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
4. **จังหวะและรูปแบบการแชทเสมือนมนุษย์คุยกัน (Human-First Chat Rhythm & Spacing)**:
   - **ห้ามเขียนข้อความยาวติดกันเป็นพืดก้อนเดียวเด็ดขาด** (เพราะในมือถือจะอึดอัดมาก)
   - **เว้นบรรทัด 2 ครั้ง (เว้นหนึ่งบรรทัดว่าง) ระหว่างแต่ละย่อหน้าเสมอ** เพื่อให้ข้อความเว้นช่องไฟสบายตา น่าอ่าน เหมือนส่งแชทคุยกันจริงๆ
   - **เมื่ออ้างอิงถึงไพ่แต่ละใบ (เช่น ตำแหน่งหัวใจ, อุปสรรค, เป้าหมาย) ต้องขึ้นบรรทัดใหม่ทุกใบเสมอ ห้ามเขียนต่อกันด้วยเครื่องหมายขีด (-) ในบรรทัดเดียวเด็ดขาด**
     ตัวอย่างที่ถูกต้อง:
     • **ตำแหน่งหัวใจ (9 ดาบ):** คำอธิบาย...
     • **อุปสรรคตรงหน้า (Page of Swords):** คำอธิบาย...
     • **เป้าหมายในใจ (8 ดาบ):** คำอธิบาย...
   - แบ่งเป็น 3-4 ท่อนสั้นๆ ชัดเจน:
     • ท่อนที่ 1 (ทักทาย & ตอบตรงประเด็น): เปิดบทสนทนาอย่างเป็นกันเองและชี้ประเด็นสำคัญทันที
     • ท่อนที่ 2 (เชื่อมโยงไพ่ทีละใบ): ดึงข้อคิดจากไพ่ที่เปิดได้ทีละข้อ ชัดเจน กระชับ
     • ท่อนที่ 3 (คำแนะนำวิธีทำ): วิธีรับมือหรือแก้เกม 1-2 ข้อสั้นๆ
     • ท่อนที่ 4 (คำถามชวนคุยต่อ & พลังใจ): ปิดท้ายด้วยคำถามชวนคุยต่ออย่างใส่ใจ หรือให้กำลังใจสั้นๆ 1 ประโยค
   - เน้นคำสำคัญด้วยเครื่องหมายตัวหนา เช่น **ตัวหนา** เท่าที่จำเป็น
   - ห้ามใช้คำหุ่นยนต์ เช่น "ตามหลักการของไพ่ระบุว่า..."`;

    // ── Tier 1: Groq LPU AI Engine (Qwen 3.8 27B) — ทัพหน้าความเร็ว 300+ tok/s ตอบใน 0.5-1s รองรับ 14,400 req/day ──
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const { generateGroqChatReply } = await import("@/lib/ai/groq");
        const groqResult = await generateGroqChatReply({
          systemInstruction,
          messages: [
            ...history.slice(-20).map((h) => ({
              role: (h.sender === "user" ? "user" : "assistant") as "user" | "assistant",
              content: h.text,
            })),
            { role: "user", content: userQuestion },
          ],
          apiKey: groqKey,
        });

        if (groqResult && groqResult.reply) {
          const cleanReply = sanitizeTarotText(stripThinkingTags(groqResult.reply));
          if (cleanReply) {
            return NextResponse.json({
              reply: cleanReply,
              provider: "groq",
              model: groqResult.model,
            });
          }
        }
      } catch (groqErr) {
        console.warn("[chat] Groq Tier 1 error:", groqErr);
      }
    }

    // ── Tier 2: Google Gemini Flash Engine (เมื่อ Groq ขัดข้องหรือไม่มีคีย์) ──
    const { isAiCapReached } = await import("@/lib/security/ai-budget");
    const aiCapHit = !privileged && (await isAiCapReached("member"));

    const geminiKey = !aiCapHit ? process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY : undefined;
    if (geminiKey) {
      const {
        WORKING_GEMINI_MODELS,
        GEMINI_FIRST_MODEL_TIMEOUT_MS,
        GEMINI_FALLBACK_MODEL_TIMEOUT_MS,
        extractGeminiAnswer,
      } = await import("@/lib/ai/gemini");
      const modelsToTry = WORKING_GEMINI_MODELS;

      for (const [modelIdx, model] of modelsToTry.entries()) {
        const endpoint = geminiEndpoint(model, "generateContent");
        try {
          // กลยุทธ์ hedge: ให้ตัวแรกแค่ 8 วินาที ถ้าไม่ทันก็ตัดใจไปตัวถัดไป
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            modelIdx === 0 ? GEMINI_FIRST_MODEL_TIMEOUT_MS : GEMINI_FALLBACK_MODEL_TIMEOUT_MS,
          );

          // ขยายประวัติสนทนาเป็น 20 ข้อความ เพื่อให้คุยต่อเนื่องได้ยาวนานโดยไม่ลืมบริบท
          const rawHistory = history.slice(-20).map((h) => ({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text.slice(0, 4000) }],
          }));
          rawHistory.push({
            role: "user",
            parts: [{ text: userQuestion }],
          });

          // P2-14: Coalesce adjacent roles and discard leading model turns
          const contentsPayload: Array<{ role: string; parts: Array<{ text: string }> }> = [];
          for (const item of rawHistory) {
            if (contentsPayload.length === 0 && item.role === "model") {
              continue;
            }
            const last = contentsPayload[contentsPayload.length - 1];
            if (last && last.role === item.role) {
              last.parts[0].text += `\n${item.parts[0].text}`;
            } else {
              contentsPayload.push({ ...item });
            }
          }

          const response = await fetch(endpoint, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": geminiKey,
              ...aiGatewayHeaders({ cacheTtl: 0 }),
            },
            body: JSON.stringify({
              contents: contentsPayload,
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                temperature: 0.7,
              },
            }),
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const replyText = extractGeminiAnswer(data);
            if (replyText) {
              const cleanReply = sanitizeTarotText(replyText);
              return NextResponse.json({
                reply: cleanReply,
                provider: "gemini",
                model,
              });
            }
            console.warn(
              `[Gemini Flash Chat ${model}] 200 แต่ไม่มีข้อความคำตอบ · finishReason=${
                data.candidates?.[0]?.finishReason
              } · parts=${JSON.stringify(data.candidates?.[0]?.content?.parts)?.slice(0, 300)}`,
            );
          } else {
            const errText = await response.text().catch(() => "");
            console.warn(`[Gemini Flash Chat ${model}] response status: ${response.status}`, errText);
          }
        } catch (err) {
          console.warn(`[Gemini Flash Chat ${model}] error:`, err);
        }
      }
    }

    // ── มาถึงตรงนี้ = ไม่ได้คำตอบจากทั้ง Gemini และ Groq ต้องใช้คลังคำตอบสำรองออฟไลน์ ──
    // เดิมส่งคืนเหมือนคำตอบ AI ทุกประการ ผู้ใช้จึงแยกไม่ออกว่ากำลังคุยกับข้อความสำเร็จรูป
    // (เจ้าของโปรเจกต์เจอเองว่า 2 คำถามคนละเรื่องได้คำตอบเดียวกันเป๊ะ)
    // ต่อไปนี้ต้องติดธง `fallback` กลับไปเสมอ ให้หน้าเว็บบอกผู้ใช้ตรง ๆ
    console.warn(
      `[chat] ตกไปใช้คำตอบสำรองออฟไลน์ · reason=${
        aiCapHit ? "ai_daily_cap" : geminiKey ? "gemini_unavailable" : "no_api_key"
      } · readingId=${id}`,
    );
    recordEvent("chat_offline_fallback");

    const dynamicReply = generateContextualTarotChatReply({
      userQuestion,
      history,
      personaId: record.personaId || "warm",
      record,
    });

    return NextResponse.json({
      reply: dynamicReply,
      fallback: true,
      fallbackReason: aiCapHit ? "ai_daily_cap" : geminiKey ? "gemini_unavailable" : "no_api_key",
    });
  } finally {
    limit.releaseConcurrency();
  }
}
