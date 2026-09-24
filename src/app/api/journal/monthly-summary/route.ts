import { NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { aiGatewayHeaders, geminiEndpoint } from "@/lib/ai/gateway";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { getSessionUser } from "@/lib/auth/session";
import { isAiCapReached, recordAiCall } from "@/lib/security/ai-budget";
import { listJournal } from "@/lib/journal/journal.repo";
import { cardByIndex } from "@/data/cards";
import { sanitizePromptValue } from "@/lib/ai/prompt-guard";
import { checkQuestion } from "@/lib/safety/guardrails";
import { buildOfflineMonthlySummary, ELEMENT_LABEL, type MonthlyLang } from "@/lib/journal/monthly-offline";
import { recordEvent } from "@/lib/stats/record";

export const runtime = "nodejs";

/** ข้อความถึงผู้ใช้ — เว็บเราทำสองภาษา ผู้ใช้หน้าอังกฤษต้องไม่เจอข้อความไทย */
const MSG = {
  badRequest: { th: "คำขอไม่ถูกต้อง", en: "Invalid request." },
  login: {
    th: "กรุณาเข้าสู่ระบบก่อนขอสรุปบทเรียนดวงประจำเดือน",
    en: "Please sign in to get your monthly reflection.",
  },
  tooMany: {
    th: "คุณขอสรุปบทเรียนดวงบ่อยเกินไป กรุณารอสักครู่",
    en: "You've asked for a monthly reflection too often. Please wait a moment.",
  },
  empty: {
    th: "ยังไม่มีประวัติการเปิดไพ่ที่บันทึกไว้ในบัญชี ลองเปิดไพ่และบันทึกผลก่อนนะ",
    en: "There are no saved readings in your account yet. Do a reading and save it first.",
  },
  server: {
    th: "เกิดข้อผิดพลาดในการประมวลผลบทเรียนดวง กรุณาลองใหม่อีกครั้ง",
    en: "Something went wrong while preparing your monthly reflection. Please try again.",
  },
} as const;

export async function POST(request: Request) {
  // ภาษามาทาง query เท่านั้น — ไม่อ่าน body เลย ประวัติอ่านจากบัญชีเอง (A2-08) · ค่าอื่นนอกจาก "en" = ไทย
  const lang: MonthlyLang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "th";
  const isEn = lang === "en";

  try {
    // ⚠️ เส้นทางนี้เรียกโมเดลจริงด้วย GEMINI_API_KEY ของเรา — เดิมเปิดโล่ง
    // ไม่เช็ก origin ไม่เช็กล็อกอิน และไม่นับเข้าเพดาน AI รายวันเลย
    // ใครก็ POST ข้อความอะไรก็ได้เข้ามาเป็น "ประวัติการเปิดไพ่" ปลอม ๆ แล้วได้ LLM ฟรี
    // (ข้อความในนั้นถูกต่อเข้าพรอมต์ตรง ๆ จึงเป็นช่อง prompt injection ด้วย)
    if (!isRequestAuthorizedOrigin(request)) {
      return NextResponse.json({ error: MSG.badRequest[lang] }, { status: 403 });
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: MSG.login[lang] },
        { status: 401 }
      );
    }

    // งบ AI ของวันเต็ม ≠ ผู้ใช้ต้องกลับมือเปล่า — สรุปจากประวัติจริงแบบออฟไลน์แทน (ดูด้านล่าง)
    const aiCapReached = await isAiCapReached("member");

    const clientIp = getClientIdentifier(request);

    /*
     * 🚦 T-11 + T-12: สรุปรายเดือนคือคำขอที่แพงที่สุดต่อครั้ง (prompt ยาวที่สุด)
     * แต่เดิมกันด้วย `Map` ต่อ isolate ล้วนและไม่มีโควตารายวันบน KV เลย
     */
    const edge = await consumeEdgeRateLimits([
      { key: edgeRateLimitKey("monthly:ip", clientIp), config: { max: 10, windowSec: 300 } },
      { key: edgeRateLimitKey("monthly:ip:day", clientIp), config: { max: 30, windowSec: 86400 } },
      { key: edgeRateLimitKey("monthly:user:day", user.id), config: { max: 10, windowSec: 86400 } },
    ]);
    if (!edge.allowed) {
      return createRateLimitResponse(edge.retryAfterSec, MSG.tooMany[lang]);
    }

    const limit = checkRateLimit(`monthly_journal:${clientIp}`, {
      maxRequests: 10,
      windowSeconds: 300,
    });

    if (!limit.allowed) {
      return createRateLimitResponse(limit.retryAfterSeconds, MSG.tooMany[lang]);
    }

    /*
     * ⚠️ อ่านประวัติจากฐานข้อมูลของเจ้าของบัญชีเอง ไม่รับจาก body (A2-08)
     * เดิมรับ `readings[]` จากไคลเอนต์ทั้งก้อน ไม่มีเพดานความยาว ไม่กันฉีดคำสั่ง
     * สมาชิกฟรีใช้เป็น LLM ทั่วไปด้วยข้อความหลายหมื่นตัวต่อคำขอได้ (prompt แพงสุดของเว็บ)
     * ชื่อไพ่มาจากสำรับจริงด้วย cardIndex · ข้อความผู้ใช้ผ่าน sanitizePromptValue ทุกช่อง
     */
    const journal = await listJournal(user.id, { limit: 15 });
    if (journal.length === 0) {
      return NextResponse.json(
        { error: MSG.empty[lang] },
        { status: 400 }
      );
    }
    const readings = journal.map((r) => ({
      date: r.date,
      question: sanitizePromptValue(r.question, 300),
      summary: sanitizePromptValue(r.summary, 200),
      outcome: r.outcome,
      userNote: sanitizePromptValue(r.userNote, 300) || undefined,
      cards: (r.cards || []).flatMap((c) => {
        const card = cardByIndex(c.cardIndex);
        // กฎเหล็กข้อ 14 — หาไพ่ไม่เจอให้ข้าม ห้ามเดาใบแทน
        return card ? [{ cardName: isEn ? card.nameEn : card.nameTh, isReversed: c.isReversed }] : [];
      }),
    }));

    // 🚨 กฎเหล็กข้อ 6 — โน้ต/คำถามที่มีสัญญาณวิกฤต ต้องได้สายด่วน ไม่ใช่ "คำคมพลังใจ"
    const safety = checkQuestion(readings.map((r) => `${r.question} ${r.userNote ?? ""}`).join("\n"), lang);
    if (safety.block) {
      return NextResponse.json({ error: safety.message, crisis: true }, { status: 422 });
    }

    // นับไพ่ที่ออกซ้ำ (ธาตุเด่นคำนวณใน buildOfflineMonthlySummary)
    const cardFreq: Record<string, { count: number; name: string }> = {};
    let accurateCount = 0;

    for (const r of readings) {
      if (r.outcome === "ACCURATE" || r.outcome === "PARTIAL") accurateCount++;
      for (const c of r.cards) {
        if (!cardFreq[c.cardName]) cardFreq[c.cardName] = { count: 0, name: c.cardName };
        cardFreq[c.cardName].count++;
      }
    }

    const topCards = Object.values(cardFreq)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((c) => (isEn ? `${c.name} (${c.count} ${c.count === 1 ? "time" : "times"})` : `${c.name} (ปรากฏ ${c.count} ครั้ง)`));

    /*
     * ธาตุเด่นใช้ค่าที่คำนวณเองเสมอ ไม่ใช้ค่าที่โมเดลตอบ — ป้ายบนหน้าเว็บต้องเป็นภาษาเดียวกับผู้ใช้
     * และตรงกับสูตรฝั่งออฟไลน์ (อันดับหนึ่งต้องชนะขาด ไม่งั้น = สมดุล)
     */
    const offline = buildOfflineMonthlySummary(journal, lang);
    const dominantElement = offline.dominantElement;
    const balanced = dominantElement === ELEMENT_LABEL.สมดุล[lang];

    const historyText = readings
      .map((r, i) => {
        if (isEn) {
          const cardList = r.cards.map((c) => `${c.cardName} (${c.isReversed ? "reversed" : "upright"})`).join(", ");
          return `[Entry ${i + 1} | Date: ${r.date.slice(0, 10)}] Question: "${r.question}" | Cards: ${cardList} | Summary: "${r.summary.slice(0, 100)}..." | Outcome: ${r.outcome || "PENDING"} ${r.userNote ? `(Note: ${r.userNote})` : ""}`;
        }
        const cardList = r.cards.map((c) => `${c.cardName} (${c.isReversed ? "กลับหัว" : "ตรง"})`).join(", ");
        return `[บันทึกที่ ${i + 1} | วันที่: ${r.date.slice(0, 10)}] คำถาม: "${r.question}" | ไพ่: ${cardList} | บทสรุป: "${r.summary.slice(0, 100)}..." | ผลจริง: ${r.outcome || "รอผล"} ${r.userNote ? `(โน้ต: ${r.userNote})` : ""}`;
      })
      .join("\n");

    const apiKey = aiCapReached ? undefined : process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    /*
     * 🛟 สรุปจากประวัติจริงโดยไม่เรียก AI — ใช้ทั้งตอนไม่มีคีย์ · ทุกโมเดลล่ม · และเติมช่องที่โมเดลตอบขาด
     * (เดิม: ไม่มีคีย์ = ประโยคเหมารวม · โมเดลล่ม = error 500 · JSON ขาด = เติมประโยคเหมารวมเงียบ ๆ)
     */
    if (!apiKey) {
      recordEvent(aiCapReached ? "monthly_offline_fallback:ai_cap" : "monthly_offline_fallback:no_api_key");
      return NextResponse.json(offline);
    }

    const prompt = isEn
      ? `You are a master tarot reader and warm, grounded life mentor (Tarot Life Synthesizer).
Review this user's ${readings.length} saved tarot readings from the recent period. Reflect the bigger picture of their life, notice psychological patterns, and draw out the key lessons.

Reading history:
${historyText}

Basic stats:
- Recurring cards: ${topCards.join(", ") || "no card repeated"}
- Dominant element: ${balanced ? "the elements are balanced" : dominantElement}

Write in natural, plain English — warm, encouraging and specific to their history, never generic. Do not quote the user's questions back verbatim. Reply with JSON only, in exactly this shape (no markdown outside the JSON):
{
  "title": "a short, evocative title for this month's energy",
  "dominantElement": "${dominantElement}",
  "recurringCards": ["1-3 card names"],
  "synthesis": "3-5 sharp, meaningful sentences reflecting their life and growth",
  "lifeLessons": [
    "life lesson 1",
    "life lesson 2",
    "life lesson 3"
  ],
  "empowermentQuote": "one memorable, uplifting line for the month"
}`
      : `คุณคือปรมาจารย์นักจิตวิทยาและนักพยากรณ์ไพ่ทาโรต์ระดับสูง (Tarot Life Synthesizer & Spiritual Mentor)
วิเคราะห์บันทึกการเปิดไพ่ทาโรต์ของผู้ใช้จำนวน ${readings.length} ครั้งในรอบช่วงที่ผ่านมา เพื่อสะท้อนภาพรวมชีวิต ค้นหา Pattern ทางจิตวิทยา และสรุปบทเรียนสำคัญ

ข้อมูลประวัติการเปิดไพ่:
${historyText}

สถิติเบื้องต้น:
- ไพ่ที่ออกบ่อย: ${topCards.join(", ") || "กระจายตัวหลากหลาย"}
- ธาตุเด่นในภาพรวม: ${balanced ? "พลังงานทุกธาตุสมดุลกัน" : `ธาตุ${dominantElement}`}

จงวิเคราะห์อย่างลึกซึ้ง อบอุ่น มีพลัง ให้กำลังใจ และสร้างแรงบันดาลใจ ตอบกลับเป็น JSON ในรูปแบบนี้เท่านั้น (ห้ามใส่ markdown อื่นนอก JSON):
{
  "title": "ชื่อหัวข้อสรุปภาพรวมพลังงานชีวิตที่ทรงพลังและไพเราะ",
  "dominantElement": "${dominantElement}",
  "recurringCards": ["ชื่อไพ่ 1-3 ใบ"],
  "synthesis": "บทความสะท้อนภาพรวมชีวิตและความเติบโตทางจิตวิญญาณ 3-5 ประโยคที่เฉียบคมและทรงพลัง",
  "lifeLessons": [
    "บทเรียนชีวิตข้อที่ 1",
    "บทเรียนชีวิตข้อที่ 2",
    "บทเรียนชีวิตข้อที่ 3"
  ],
  "empowermentQuote": "คำคมพลังใจศักดิ์สิทธิ์ประจำเดือนที่ประทับใจ"
}`;

    const {
      WORKING_GEMINI_MODELS,
      GEMINI_FIRST_MODEL_TIMEOUT_MS,
      GEMINI_FALLBACK_MODEL_TIMEOUT_MS,
      extractGeminiAnswer,
    } = await import("@/lib/ai/gemini");
    let res: Response | null = null;
    for (const [modelIdx, model] of WORKING_GEMINI_MODELS.entries()) {
      // เพดานเวลาเหมือนเส้นทางอื่น — ไม่มี timeout = ถ้าโมเดลค้าง คำขอค้างยาว (บทเรียน INC-0053)
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        modelIdx === 0 ? GEMINI_FIRST_MODEL_TIMEOUT_MS : GEMINI_FALLBACK_MODEL_TIMEOUT_MS,
      );
      let r: Response;
      try {
        void recordAiCall(1);
        r = await fetch(
          geminiEndpoint(model, "generateContent"),
          {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey, ...aiGatewayHeaders({ cacheTtl: 21600 }) },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
              },
            }),
          }
        );
      } catch (e) {
        console.warn(`[Monthly Summary] model ${model} → ${e instanceof Error ? e.name : String(e)}`);
        continue;
      } finally {
        clearTimeout(timeoutId);
      }
      if (r.ok) {
        res = r;
        break;
      }
      console.warn(
        `[Monthly Summary] model ${model} → ${r.status} · ${(await r.text().catch(() => "")).slice(0, 200)}`,
      );
    }

    if (!res) {
      recordEvent("monthly_offline_fallback:models_down");
      return NextResponse.json(offline);
    }

    const resJson = (await res.json()) as any;
    // ห้ามอ่าน parts[0].text ตรง ๆ — Gemini 3.x แทรก part ความคิดไว้ด้วย (บทเรียน INC-0052)
    const responseText = extractGeminiAnswer(resJson) || "{}";
    const cleanedText = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsedAI: any = {};
    try {
      parsedAI = JSON.parse(cleanedText);
    } catch {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedAI = JSON.parse(jsonMatch[0]);
        } catch {
          parsedAI = {};
        }
      }
    }

    // โมเดลตอบแต่ไม่มีเนื้อหลัก (synthesis) = ใช้ไม่ได้ทั้งก้อน ➔ สรุปออฟไลน์ทั้งฉบับ พร้อมธง fallback
    // หน้าอังกฤษแต่โมเดลตอบไทยมา = ใช้ไม่ได้เหมือนกัน (ผู้ใช้อ่านไม่ออก)
    const aiSynthesis =
      typeof parsedAI?.synthesis === "string" && parsedAI.synthesis.trim() && !(isEn && /[\u0E00-\u0E7F]/.test(parsedAI.synthesis))
        ? parsedAI.synthesis
        : null;
    if (!aiSynthesis) {
      recordEvent("monthly_offline_fallback:unusable_output");
      return NextResponse.json(offline);
    }

    // ช่องที่โมเดลตอบขาด เติมจากค่าที่คำนวณจากประวัติจริง — ไม่ใช่ประโยคเหมารวม
    return NextResponse.json({
      title: typeof parsedAI?.title === "string" && parsedAI.title.trim() ? parsedAI.title : offline.title,
      totalReadings: readings.length,
      accurateReadings: accurateCount,
      dominantElement,
      recurringCards: Array.isArray(parsedAI?.recurringCards) && parsedAI.recurringCards.length > 0 ? parsedAI.recurringCards : topCards,
      synthesis: aiSynthesis,
      lifeLessons: Array.isArray(parsedAI?.lifeLessons) && parsedAI.lifeLessons.length > 0 ? parsedAI.lifeLessons : offline.lifeLessons,
      empowermentQuote:
        typeof parsedAI?.empowermentQuote === "string" && parsedAI.empowermentQuote.trim() ? parsedAI.empowermentQuote : offline.empowermentQuote,
    });
  } catch (error) {
    console.error("[Monthly Summary API Error]:", error);
    return NextResponse.json(
      { error: MSG.server[lang] },
      { status: 500 }
    );
  }
}
