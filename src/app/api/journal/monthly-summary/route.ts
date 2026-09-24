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
import { buildOfflineMonthlySummary } from "@/lib/journal/monthly-offline";
import { recordEvent } from "@/lib/stats/record";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // ⚠️ เส้นทางนี้เรียกโมเดลจริงด้วย GEMINI_API_KEY ของเรา — เดิมเปิดโล่ง
    // ไม่เช็ก origin ไม่เช็กล็อกอิน และไม่นับเข้าเพดาน AI รายวันเลย
    // ใครก็ POST ข้อความอะไรก็ได้เข้ามาเป็น "ประวัติการเปิดไพ่" ปลอม ๆ แล้วได้ LLM ฟรี
    // (ข้อความในนั้นถูกต่อเข้าพรอมต์ตรง ๆ จึงเป็นช่อง prompt injection ด้วย)
    if (!isRequestAuthorizedOrigin(request)) {
      return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 403 });
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนขอสรุปบทเรียนดวงประจำเดือน" },
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
      return createRateLimitResponse(
        edge.retryAfterSec,
        "คุณขอสรุปบทเรียนดวงบ่อยเกินไป กรุณารอสักครู่",
      );
    }

    const limit = checkRateLimit(`monthly_journal:${clientIp}`, {
      maxRequests: 10,
      windowSeconds: 300,
    });

    if (!limit.allowed) {
      return createRateLimitResponse(limit.retryAfterSeconds, "คุณขอสรุปบทเรียนดวงบ่อยเกินไป กรุณารอสักครู่");
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
        { error: "ยังไม่มีประวัติการเปิดไพ่ที่บันทึกไว้ในบัญชี ลองเปิดไพ่และบันทึกผลก่อนนะ" },
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
        return card ? [{ cardNameTh: card.nameTh, element: String(card.element), isReversed: c.isReversed }] : [];
      }),
    }));

    // 🚨 กฎเหล็กข้อ 6 — โน้ต/คำถามที่มีสัญญาณวิกฤต ต้องได้สายด่วน ไม่ใช่ "คำคมพลังใจ"
    const safety = checkQuestion(readings.map((r) => `${r.question} ${r.userNote ?? ""}`).join("\n"));
    if (safety.block) {
      return NextResponse.json({ error: safety.message, crisis: true }, { status: 422 });
    }

    // Summarize card frequencies and elements
    const cardFreq: Record<string, { count: number; nameTh: string; element?: string }> = {};
    const elementCount: Record<string, number> = { ไฟ: 0, น้ำ: 0, ลม: 0, ดิน: 0 };
    let accurateCount = 0;

    for (const r of readings) {
      if (r.outcome === "ACCURATE" || r.outcome === "PARTIAL") accurateCount++;
      for (const c of r.cards) {
        if (!cardFreq[c.cardNameTh]) {
          cardFreq[c.cardNameTh] = { count: 0, nameTh: c.cardNameTh, element: c.element };
        }
        cardFreq[c.cardNameTh].count++;
        if (c.element && elementCount[c.element] !== undefined) {
          elementCount[c.element]++;
        }
      }
    }

    const topCards = Object.values(cardFreq)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((c) => `${c.nameTh} (ปรากฏ ${c.count} ครั้ง)`);

    const sortedElements = Object.entries(elementCount).sort((a, b) => b[1] - a[1]);
    const dominantElement =
      sortedElements[0] && sortedElements[0][1] > 0 && sortedElements[0][1] > (sortedElements[1]?.[1] ?? 0)
        ? sortedElements[0][0]
        : "สมดุล";

    // Prepare context for Gemini AI
    const historyText = readings
      .map((r, i) => {
        const cardList = r.cards.map((c) => `${c.cardNameTh} (${c.isReversed ? "กลับหัว" : "ตรง"})`).join(", ");
        return `[บันทึกที่ ${i + 1} | วันที่: ${r.date.slice(0, 10)}] คำถาม: "${r.question}" | ไพ่: ${cardList} | บทสรุป: "${r.summary.slice(0, 100)}..." | ผลจริง: ${r.outcome || "รอผล"} ${r.userNote ? `(โน้ต: ${r.userNote})` : ""}`;
      })
      .join("\n");

    const apiKey = aiCapReached ? undefined : process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    /*
     * 🛟 สรุปจากประวัติจริงโดยไม่เรียก AI — ใช้ทั้งตอนไม่มีคีย์ · ทุกโมเดลล่ม · และเติมช่องที่โมเดลตอบขาด
     * (เดิม: ไม่มีคีย์ = ประโยคเหมารวม · โมเดลล่ม = error 500 · JSON ขาด = เติมประโยคเหมารวมเงียบ ๆ)
     */
    const offline = buildOfflineMonthlySummary(journal);

    if (!apiKey) {
      recordEvent(aiCapReached ? "monthly_offline_fallback:ai_cap" : "monthly_offline_fallback:no_api_key");
      return NextResponse.json(offline);
    }

    const prompt = `คุณคือปรมาจารย์นักจิตวิทยาและนักพยากรณ์ไพ่ทาโรต์ระดับสูง (Tarot Life Synthesizer & Spiritual Mentor)
วิเคราะห์บันทึกการเปิดไพ่ทาโรต์ของผู้ใช้จำนวน ${readings.length} ครั้งในรอบช่วงที่ผ่านมา เพื่อสะท้อนภาพรวมชีวิต ค้นหา Pattern ทางจิตวิทยา และสรุปบทเรียนสำคัญ

ข้อมูลประวัติการเปิดไพ่:
${historyText}

สถิติเบื้องต้น:
- ไพ่ที่ออกบ่อย: ${topCards.join(", ") || "กระจายตัวหลากหลาย"}
- ธาตุเด่นในภาพรวม: ${dominantElement === "สมดุล" ? "พลังงานทุกธาตุสมดุลกัน" : `ธาตุ${dominantElement}`}

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
    const aiSynthesis = typeof parsedAI?.synthesis === "string" && parsedAI.synthesis.trim() ? parsedAI.synthesis : null;
    if (!aiSynthesis) {
      recordEvent("monthly_offline_fallback:unusable_output");
      return NextResponse.json(offline);
    }

    // ช่องที่โมเดลตอบขาด เติมจากค่าที่คำนวณจากประวัติจริง — ไม่ใช่ประโยคเหมารวม
    return NextResponse.json({
      title: typeof parsedAI?.title === "string" && parsedAI.title.trim() ? parsedAI.title : offline.title,
      totalReadings: readings.length,
      accurateReadings: accurateCount,
      dominantElement: typeof parsedAI?.dominantElement === "string" ? parsedAI.dominantElement : dominantElement,
      recurringCards: Array.isArray(parsedAI?.recurringCards) && parsedAI.recurringCards.length > 0 ? parsedAI.recurringCards : topCards,
      synthesis: aiSynthesis,
      lifeLessons: Array.isArray(parsedAI?.lifeLessons) && parsedAI.lifeLessons.length > 0 ? parsedAI.lifeLessons : offline.lifeLessons,
      empowermentQuote:
        typeof parsedAI?.empowermentQuote === "string" && parsedAI.empowermentQuote.trim() ? parsedAI.empowermentQuote : offline.empowermentQuote,
    });
  } catch (error) {
    console.error("[Monthly Summary API Error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการประมวลผลบทเรียนดวง กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
