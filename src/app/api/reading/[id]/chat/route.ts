import { NextResponse } from "next/server";
import { z } from "zod";
import { getReading, type ReadingRecord } from "@/server/store";
import { cardByIndex } from "@/data/cards";
import { getSpread } from "@/data/spreads";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { getContentOverrides, resolveCardByIndex, resolvePersona, resolveSystemCore } from "@/lib/content/overrides";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { looksLikePromptInjection, sanitizePromptValue } from "@/lib/ai/prompt-guard";

import { formatCardLoreForPrompt } from "@/data/cards/visual-lore";
import { diagnoseQuestionEnergy } from "@/lib/ai/intent";
import { analyzeSpatialGazeDialogue } from "@/lib/ai/gaze";
import { checkQuestion, getCrisisMessage } from "@/lib/safety/guardrails";
import { assessCrisisRisk } from "@/lib/safety/ai-classifier";
import { aiGatewayHeaders, geminiEndpoint } from "@/lib/ai/gateway";
import { recordEvent, recordEvents } from "@/lib/stats/record";
import { sanitizeTarotText, stripThinkingTags } from "@/lib/ai/language";
import { buildOfflineChatReply } from "@/lib/ai/chat-fallback";
import { getMembersOnlyChatMessage, isSignInRequired } from "@/lib/entitlement/signin-gate";

export const runtime = "nodejs";

/**
 * 🧱 T-13: ปฏิเสธข้อความที่ตั้งใจปิดแท็บของ prompt ตั้งแต่ชั้น Zod
 * ผู้ใช้จริงไม่มีเหตุผลต้องพิมพ์ `</` หรือ `<system>` ในคำถามดูดวง
 */
const noInjection = (label: string) =>
  z.string().refine((v) => !looksLikePromptInjection(v), {
    message: `${label} มีอักขระที่ไม่อนุญาต กรุณาพิมพ์เป็นข้อความธรรมดา`,
  });

/**
 * 📏 T-38: เพดานความยาวของ "หนึ่งตาแชท"
 * ของเดิมยอมรับ 2,000 ตัวอักษรต่อข้อความ และประวัติป้อนกลับ 50,000 ตัวอักษรต่อตา
 * (8 เท่าของเพดาน 500 ที่บังคับกับคำถามตอนเปิดไพ่) โดยไม่ผ่านการกรองเช่นกัน
 * คำสั่งที่ฉีดไว้ตาแรกจึงอยู่ยาวไปทุกตาถัดไป และไม่มีเพดานรวมของขนาด prompt เลย
 */
const CHAT_MESSAGE_MAX = 800;
const CHAT_HISTORY_TURN_MAX = 800;
/** จำนวนตาที่ replay กลับเข้าโมเดล — ตัดจากท้ายสุด (ตาล่าสุดมีค่าที่สุด) */
const CHAT_HISTORY_REPLAY_TURNS = 12;
/** งบอักขระรวมของประวัติทั้งหมดที่ replay ได้ในหนึ่งคำขอ */
const CHAT_HISTORY_CHAR_BUDGET = 6000;

const BodySchema = z.object({
  message: noInjection("คำถาม")
    .min(1, "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม")
    .max(CHAT_MESSAGE_MAX, `คำถามยาวเกิน ${CHAT_MESSAGE_MAX} ตัวอักษร`),
  lang: z.enum(["th", "en"]).optional(),
  history: z
    .array(
      z.object({
        sender: z.enum(["user", "bot"]),
        text: z.string().max(CHAT_HISTORY_TURN_MAX),
      })
    )
    .max(50)
    .optional(),
  // ⚠️ `readingSnapshot` ถูกถอดออกโดยตั้งใจ (A2-02) — ห้ามเพิ่มกลับ
  //    ไคลเอนต์ส่งไพ่/ปรมาจารย์/สรุปคำทำนายอะไรมาก็ได้ ไม่ผ่าน Provably Fair ไม่ผ่านด่านกันฉีด prompt
  //    ของที่เชื่อได้มีแค่ หน่วยความจำ ➔ KV ➔ โทเคนเซสชันที่มีลายเซ็น HMAC เท่านั้น
});


/**
 * 📏 T-38: เลือกตาแชทที่จะ replay กลับเข้าโมเดล ภายใต้ทั้งเพดานจำนวนตาและงบอักขระรวม
 * ไล่จากตาล่าสุดย้อนขึ้นไป (ตาล่าสุดมีค่าต่อคำตอบมากที่สุด) และ **กรองทุกตา** ด้วย
 * ตัวกันฉีดคำสั่งชุดเดียวกับคำถามตั้งต้น — ไม่งั้นคำสั่งที่ฉีดไว้ตาแรกจะอยู่ยาวทุกตาถัดไป
 */
function selectReplayHistory(
  history: Array<{ sender: "user" | "bot"; text: string }>,
): Array<{ sender: "user" | "bot"; text: string }> {
  const picked: Array<{ sender: "user" | "bot"; text: string }> = [];
  let budget = CHAT_HISTORY_CHAR_BUDGET;

  for (let i = history.length - 1; i >= 0 && picked.length < CHAT_HISTORY_REPLAY_TURNS; i--) {
    const text = sanitizePromptValue(history[i].text, CHAT_HISTORY_TURN_MAX);
    if (!text) continue;
    if (text.length > budget) break;
    budget -= text.length;
    picked.unshift({ sender: history[i].sender, text });
  }
  return picked;
}

function generateContextualTarotChatReply(params: {
  userQuestion: string;
  history?: Array<{ sender: "user" | "bot"; text: string }>;
  personaId: string;
  record: Partial<ReadingRecord>;
  lang?: "th" | "en";
}): string {
  const { userQuestion, history = [], personaId, record, lang = "th" } = params;

  // Crisis / self-harm safety check for offline fallback
  const safety = checkQuestion(userQuestion, lang);
  if (safety.block) {
    return safety.message || (lang === "en" ? "If you or someone you know is going through a tough time, please call or text 988 to reach the Suicide & Crisis Lifeline." : "หากคุณกำลังเผชิญช่วงเวลาที่ยากลำบาก สายด่วนสุขภาพจิต 1323 พร้อมรับฟังเสมอค่ะ");
  }

  /*
   * ยกเครื่อง 2026-09-24 — ย้ายไป `lib/ai/chat-fallback.ts` (ทดสอบได้ · อ้างไพ่ทุกใบ + คำอ่านจริง)
   * ของเดิมดูแค่ไพ่ใบแรกและมีประโยคกุข้อมูล ("สัญญาณบวกแรกภายใน 7 วัน") — ดูหัวไฟล์ใหม่
   */
  void history; // ประวัติแชทไม่ใช้กับคำตอบสำรอง — ตอบจากไพ่และคำอ่านจริงเท่านั้น
  return buildOfflineChatReply({ userQuestion, personaId, lang, record });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก (Unauthorized Origin)" }, { status: 403 });
  }

  const { id } = await params;

  const rawBody = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(rawBody);
  const initialLang: "th" | "en" =
    parsed.success && parsed.data.lang
      ? parsed.data.lang
      : (request.headers.get("referer")?.includes("/en") ? "en" : "th");

  // Rate Limiting & Concurrency Guard per IP
  const { isPrivilegedTestRequest } = await import("@/lib/security/privileged");
  const privileged = await isPrivilegedTestRequest(request);

  // ── การคุยต่อกับแม่หมอ = สมาชิกเท่านั้น (ENTITLEMENT_PLAN ข้อ 4) · ไม่กินโควตาเปิดไพ่ ──
  if (!privileged) {
    const { isEntitlementEnabled } = await import("@/lib/entitlement/flag");
    const { getViewer } = await import("@/lib/entitlement/viewer");
    const [enforced, viewer] = await Promise.all([isEntitlementEnabled(), getViewer(request)]);
    // ด่านล็อกอินอยู่นอกธงโควตา (`isSignInRequired`) — ธงถูกปิดค้างได้ แต่ "เฉพาะสมาชิก" ต้องไม่หาย
    if ((enforced || isSignInRequired(viewer)) && viewer.kind !== "member") {
      recordEvent("entitlement_blocked_chat");
      return NextResponse.json(
        { error: getMembersOnlyChatMessage(initialLang), reason: "members_only" },
        { status: 403 },
      );
    }
  }

  let limit = { allowed: true, releaseConcurrency: () => {} } as ReturnType<typeof checkRateLimit>;
  if (!privileged) {
    const clientIp = getClientIdentifier(request);

    /*
     * 🚦 T-11 + T-12: ปลายทางนี้เรียกโมเดลทุกครั้งแต่เดิมกันด้วย `Map` ต่อ isolate อย่างเดียว
     * และ **ไม่มีโควตารายวันบน KV เลย** ต่างจาก `/read` ที่มี 40 ครั้ง/วันต่อ IP
     * คนเดียวจึงถล่มงบ AI รวมของทั้งเว็บจนระบบดับทั้งวันได้ (isAiCapReached คืน true กับทุกคน)
     * นับทั้งต่อ IP และต่อ userId — สมัครบัญชีฟรีเองได้ การกันแค่ IP จึงไม่พอ
     */
    const chatUserId = await (async () => {
      try {
        const { getSessionUser } = await import("@/lib/auth/session");
        return (await getSessionUser())?.id ?? null;
      } catch {
        return null;
      }
    })();

    const edge = await consumeEdgeRateLimits([
      { key: edgeRateLimitKey("chat:ip", clientIp), config: { max: 30, windowSec: 60 } },
      { key: edgeRateLimitKey("chat:ip:day", clientIp), config: { max: 200, windowSec: 86400 } },
      ...(chatUserId
        ? [{ key: edgeRateLimitKey("chat:user:day", chatUserId), config: { max: 150, windowSec: 86400 } }]
        : []),
    ]);
    if (!edge.allowed) {
      return createRateLimitResponse(
        edge.retryAfterSec,
        initialLang === "en"
          ? "You have reached today's follow-up chat limit. Please come back tomorrow."
          : "วันนี้คุณถามต่อครบโควตาแล้ว กลับมาใหม่พรุ่งนี้นะ",
      );
    }

    limit = checkRateLimit(`chat:${clientIp}`, {
      maxRequests: 30,
      windowSeconds: 60,
      maxConcurrent: 2,
    });

    if (!limit.allowed) {
      return createRateLimitResponse(
        limit.retryAfterSeconds,
        initialLang === "en"
          ? "You are sending messages too quickly. Please pause a moment before trying again."
          : "คุณส่งข้อความเร็วเกินไป พักหายใจสักครู่แล้วค่อยพิมพ์ใหม่นะ"
      );
    }
  }

  try {
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      console.warn("[Chat API] Schema validation failed:", JSON.stringify(firstIssue));
      const errorMessage =
        firstIssue?.path[0] === "message"
          ? (firstIssue.message || (initialLang === "en" ? "Please specify your question." : "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม"))
          : (initialLang === "en" ? "Invalid chat payload. Please try again." : "ข้อมูลการสนทนาไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const userQuestion = parsed.data.message;
    /*
     * 📏 T-38: ประวัติที่จะ replay ถูกกรองและจำกัดงบตั้งแต่ตรงนี้จุดเดียว
     * ทั้งสองเส้นทางผู้ให้บริการใช้ชุดเดียวกัน — ของเดิมต่างคนต่าง `.slice(-20)` และ
     * `.slice(0, 4000)` เอง ทำให้ prompt โตได้ถึง 80,000 ตัวอักษรต่อคำขอโดยไม่มีเพดานรวม
     */
    const history = selectReplayHistory(parsed.data.history || []);

    recordEvent("chat_message");

    // P0-4 Guard: Screen userQuestion for crisis / self-harm signals (Golden Rule 6 & Hotline 1323 / 988)
    const safetyVerdict = checkQuestion(userQuestion, initialLang);
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
      return NextResponse.json({ reply: getCrisisMessage(initialLang), blocked: true, crisisCard: true });
    }

    // Resilient server store resolution with session token and client snapshot fallback (Edge Failover Safe)
    let record: Partial<ReadingRecord> | undefined = getReading(id);

    // Durable KV failover recovery: if memory was lost on edge worker isolate
    if (!record || !record.drawn) {
      const { loadReadingFromKV, saveReading } = await import("@/server/store");
      const fromKv = await loadReadingFromKV(id);
      if (fromKv) {
        record = fromKv;
        saveReading(record as ReadingRecord);
      }
    }

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

    if (!record || !record.drawn || record.drawn.length === 0) {
      return NextResponse.json(
        {
          error: initialLang === "en" ? "Reading deck not found for this session. Please refresh to reconnect." : "ไม่พบสำรับไพ่ที่เปิดไว้ในรอบนี้ กรุณารีเฟรชหน้าเว็บเพื่อเชื่อมต่อกับสำรับไพ่ของคุณอีกครั้ง",
          reason: "reading_not_found",
        },
        { status: 404 },
      );
    }

    const activeLang: "th" | "en" = parsed.data.lang || record.lang || initialLang;
    const isEnglish = activeLang === "en";

    const personaId = record.personaId || "warm";
    const spread = getSpread(record.spreadId || "single");
    const overrideDoc = await getContentOverrides();
    const cards = (record.drawn || [])
      .map((d) => {
        const card = resolveCardByIndex(overrideDoc, d.cardIndex);
        if (!card) return null;
        const pos = spread?.positions[d.order];
        const lore = formatCardLoreForPrompt(card.id);
        const cardHeader = isEnglish
          ? `${d.order + 1}. Position "${pos?.nameEn || pos?.nameTh || d.order}": Card ${card.nameEn} (${card.nameTh}) - ${d.isReversed ? "Reversed" : "Upright"} | Element: ${card.element}`
          : `${d.order + 1}. ตำแหน่ง "${pos?.nameTh || d.order}": ไพ่ ${card.nameTh} (${card.nameEn}) - ${d.isReversed ? "หัวกลับ" : "หัวตั้ง"} | ธาตุ: ${card.element}`;
        return lore ? `${cardHeader}\n   ${lore}` : cardHeader;
      })
      .filter((line): line is string => !!line);

    const rawCards = (record.drawn || [])
      .map((d) => cardByIndex(d.cardIndex))
      .filter((c): c is import("@/data/cards").TarotCard => !!c);
    const gazeDialogue = analyzeSpatialGazeDialogue(rawCards);
    const questionDiagnosis = diagnoseQuestionEnergy(userQuestion);

    /*
     * ข้อพึงระวังพิเศษ (สุขภาพ/กฎหมาย/พนัน/บุคคลที่สาม) — A2-03
     * `/read` แทรก `promptGuard` ลง prompt แต่แชทเคยใช้แค่เคสวิกฤต แล้วทิ้ง verdict อื่นไป
     * ถามต่อว่า "ขอเลขเด็ดงวดนี้" / "มะเร็งจะหายไหม" โมเดลจึงไม่มีข้อห้ามเลย
     * ใช้ของข้อความนี้ก่อน ถ้าไม่มีให้ใช้ของคำถามตั้งต้นของรอบ
     */
    const safetyGuard = safetyVerdict.promptGuard || record.safetyGuard || "";
    const guardSection = safetyGuard
      ? isEnglish
        ? `\n## Special Care Required In This Answer\n${safetyGuard}\n`
        : `\n## ข้อพึงระวังพิเศษในการตอบ\n${safetyGuard}\n`
      : "";

    const systemInstruction = isEnglish
      ? `${buildSystemPrompt(personaId, {
          persona: resolvePersona(overrideDoc, personaId),
          lang: "en",
        })}

## Master Tarot Consultation Dialogue (1-on-1 Private Session)
The seeker just drew these cards with you:
• Initial Question: "${record.question || "Life Path & Guidance"}"
• Spread: "${spread?.nameEn || spread?.nameTh || "General"}"
• Drawn Cards:
${cards.join("\n")}

• Previous Reading Summary: "${record.result?.summary || "Energy is moving towards a positive resolution."}"
${gazeDialogue.dialogueNarrative ? `\n• Visual Card Dialogue:\n${gazeDialogue.dialogueNarrative}` : ""}
${guardSection}

## Consultation Guidelines (Authentic American English Reader)
1. **Persona Consistency**: Embody the chosen tarot reader persona with warmth, psychological depth, and intuitive wisdom. Speak naturally like a trusted mentor or sister in a private sanctum.
2. **Deep Card Dialogue**: Directly connect every insight to the specific cards drawn. Never give generic horoscopic statements.
3. **Intent-Driven Guidance**:
   - If asking for solutions/action: Provide practical, step-by-step guidance executable within 24-48 hours.
   - If asking about relationships: Offer empathetic psychological insight and healthy communication boundaries.
   - If asking about timing: Frame cyclical timing without fatalistic determinism.
   - If expressing anxiety/fear: Ground their emotional state and offer constructive mindfulness.
4. **Natural Chat Rhythm & Spacing**:
   - Use double line breaks between paragraphs for mobile readability.
   - When referencing cards, place each card on a new line with bold titles:
     • **Heart of the Matter (9 of Swords):** Insight...
   - 3-4 concise conversational beats: greeting/direct answer, card connection, practical empowerment, and an open caring follow-up question.`
      : `${buildSystemPrompt(personaId, {
          systemCore: resolveSystemCore(overrideDoc),
          persona: resolvePersona(overrideDoc, personaId),
          lang: "th",
        })}

## บริบทการสนทนาส่วนตัวแบบ 1-on-1 (Master Tarot Consultation Dialogue)
ผู้ถามเพิ่งเปิดไพ่ชุดนี้กับคุณ:
• คำถามตั้งต้น: "${record.question || "ภาพรวมชีวิต"}"
• ผังที่ใช้: "${spread?.nameTh || "ทั่วไป"}"
• ไพ่ที่หยิบได้จริงในรอบนี้:
${cards.join("\n")}

• สรุปคำทำนายเดิมที่คุณเคยบอกไว้: "${record.result?.summary || "กำลังอยู่ในช่วงการเปลี่ยนแปลงที่ดี"}"
${gazeDialogue.dialogueNarrative ? `\n• บทสนทนาทางสายตาบนหน้าไพ่:\n${gazeDialogue.dialogueNarrative}` : ""}
${questionDiagnosis.promptDirective}
${guardSection}

## กฎเหล็กการคิดและตอบคำถามต่อยอด (Think & Speak Like The World's Best Tarot Master)
1. **การรักษาตัวตนและน้ำเสียง (Persona Consistency)**: สวมบทบาทแม่หมอตามบุคลิกที่เลือก 100% พูดจาเป็นธรรมชาติ ไหลลื่น เหมือนเพื่อนสนิท/พี่สาว/ผู้หยั่งรู้ นั่งคุยกันในห้องส่วนตัว
2. **เชื่อมโยงไพ่ที่เปิดจริงอย่างเฉียบคม (Deep Card Dialogue)**: เวลาผู้ถามถามเรื่องอะไร ให้ดึงนัยสำคัญของ "ไพ่ที่เขาเปิดได้จริง" มาเชื่อมโยงและตอบให้ตรงจุด ไม่พูดลอย ๆ
3. **การจำแนกเจตนาคำถาม (5-Intent Response Framework)**:
   - **ถ้าถามหาทางออก / แก้ยังไง**: ให้กลยุทธ์ทีละขั้นตอน (Step-by-Step) ที่ทำได้จริงใน 24-48 ชั่วโมง
   - **ถ้าถามเรื่องความรัก / ความรู้สึก**: วิเคราะห์มุมมองจิตวิทยาและการสื่อสารอย่างจริงใจและเข้าใจหัวอก
   - **ถ้าถามเรื่องเวลา / เมื่อไหร่**: ให้กรอบเวลาที่พลังงานเริ่มขยับ พร้อมบอกสิ่งที่ควรทำระหว่างรอ
   - **ถ้ากังวล / ระแวง / กลัว**: โอบอุ้มจิตใจ ชี้จุดระวังอย่างสร้างสรรค์ และให้เกราะป้องกันทางใจ
4. **จังหวะและรูปแบบการแชทเสมือนมนุษย์คุยกัน (Human-First Chat Rhythm & Spacing)**:
   - **ห้ามเขียนข้อความยาวติดกันเป็นพืดก้อนเดียวเด็ดขาด** (เพราะในมือถือจะอึดอัดมาก)
   - **เว้นบรรทัด 2 ครั้ง (เว้นหนึ่งบรรทัดว่าง) ระหว่างแต่ละย่อหน้าเสมอ** เพื่อให้ข้อความเว้นช่องไฟสบายตา น่าอ่าน เหมือนส่งแชทคุยกันจริง ๆ
   - **เมื่ออ้างอิงถึงไพ่แต่ละใบ (เช่น ตำแหน่งหัวใจ, อุปสรรค, เป้าหมาย) ต้องขึ้นบรรทัดใหม่ทุกใบเสมอ ห้ามเขียนต่อกันด้วยเครื่องหมายขีด (-) ในบรรทัดเดียวเด็ดขาด**
     ตัวอย่างที่ถูกต้อง:
     • **ตำแหน่งหัวใจ (9 ดาบ):** คำอธิบาย...
     • **อุปสรรคตรงหน้า (Page of Swords):** คำอธิบาย...
     • **เป้าหมายในใจ (8 ดาบ):** คำอธิบาย...
   - แบ่งเป็น 3-4 ท่อนสั้น ๆ ชัดเจน:
     • ท่อนที่ 1 (ทักทาย & ตอบตรงประเด็น): เปิดบทสนทนาอย่างเป็นกันเองและชี้ประเด็นสำคัญทันที
     • ท่อนที่ 2 (เชื่อมโยงไพ่ทีละใบ): ดึงข้อคิดจากไพ่ที่เปิดได้ทีละข้อ ชัดเจน กระชับ
     • ท่อนที่ 3 (คำแนะนำวิธีทำ): วิธีรับมือหรือแก้เกม 1-2 ข้อสั้น ๆ
     • ท่อนที่ 4 (คำถามชวนคุยต่อ & พลังใจ): ปิดท้ายด้วยคำถามชวนคุยต่ออย่างใส่ใจ หรือให้กำลังใจสั้น ๆ 1 ประโยค
   - เน้นคำสำคัญด้วยเครื่องหมายตัวหนา เช่น **ตัวหนา** เท่าที่จำเป็น
   - ห้ามใช้คำหุ่นยนต์ เช่น "ตามหลักการของไพ่ระบุว่า..."`;

    // ── เพดานค่าใช้จ่าย AI รายวัน — ต้องตรวจ "ก่อน" เรียกผู้ให้บริการรายใดก็ตาม ──
    // ของเดิมตรวจหลังชั้น Groq ทำให้ทางเดิน Groq (ซึ่งเป็นทางหลัก) ไม่เคยถูกนับ
    // และไม่เคยถูกเบรกเลย — `AI_DAILY_CALL_CAP` บังคับใช้กับการอ่านไพ่ฝั่งเดียว
    // ส่วนแชทถามต่อใช้เงินได้ไม่จำกัดและไม่ปรากฏใน /admin
    const { isAiCapReached, recordAiCall } = await import("@/lib/security/ai-budget");
    const aiCapHit = !privileged && (await isAiCapReached("member"));
    if (aiCapHit) {
      return NextResponse.json(
        {
          error: isEnglish
            ? "The consultation system has reached its daily quota. Please return tomorrow."
            : "ระบบให้บริการคำทำนายครบโควตาของวันนี้แล้ว กรุณากลับมาใหม่พรุ่งนี้",
        },
        { status: 429 }
      );
    }

    // ── Tier 1: Groq LPU AI Engine (Qwen 3.8 27B) — ทัพหน้าความเร็ว 300+ tok/s ตอบใน 0.5-1s รองรับ 14,400 req/day ──
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const { generateGroqChatReply } = await import("@/lib/ai/groq");
        const groqResult = await generateGroqChatReply({
          systemInstruction,
          messages: [
            // ประวัติถูกกรอง ตัดความยาว และจำกัดงบอักขระรวมมาแล้วที่ selectReplayHistory()
            ...history.map((h) => ({
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
            await recordAiCall(1);
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
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
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

          // ประวัติถูกกรองและจำกัดงบมาแล้วที่ selectReplayHistory() — ที่นี่แค่แปลงรูปแบบ
          const rawHistory = history.map((h) => ({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }],
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
              await recordAiCall(1);
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
        geminiKey ? "gemini_unavailable" : "no_api_key"
      } · readingId=${id}`,
    );
    recordEvent("chat_offline_fallback");

    /*
     * 🔴 T-41: `sanitizeTarotText` เคยถูกใช้กับ "คำตอบจากโมเดล" เท่านั้น
     * ส่วนบันไดคำตอบที่เขียนด้วยมือถูก return ตรง ๆ — ทั้งที่นี่คือข้อความที่ผู้ใช้เห็น
     * ตอน Groq และ Gemini ล่มพร้อมกัน **คือตอนที่คุณภาพสำคัญที่สุด**
     * และเป็นเส้นทางเดียวที่ปรับปรุงโมเดลแล้วไม่ช่วยอะไรเลย
     */
    const dynamicReply = sanitizeTarotText(
      generateContextualTarotChatReply({
        userQuestion,
        history,
        personaId: record.personaId || "warm",
        record,
        lang: activeLang,
      }),
    );

    return NextResponse.json({
      reply: dynamicReply,
      fallback: true,
      fallbackReason: geminiKey ? "gemini_unavailable" : "no_api_key",
    });
  } finally {
    limit.releaseConcurrency();
  }
}
