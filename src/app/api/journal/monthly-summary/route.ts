import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

const JournalItemSchema = z.object({
  id: z.string(),
  date: z.string(),
  question: z.string(),
  spreadName: z.string(),
  cards: z.array(
    z.object({
      order: z.number(),
      positionName: z.string(),
      cardIndex: z.number(),
      cardNameTh: z.string(),
      cardNameEn: z.string().optional(),
      isReversed: z.boolean(),
      element: z.string().optional(),
    })
  ),
  summary: z.string(),
  outcome: z.enum(["PENDING", "ACCURATE", "PARTIAL", "NOT_HAPPENED"]).optional(),
  userNote: z.string().optional(),
});

const RequestSchema = z.object({
  readings: z.array(JournalItemSchema).min(1, "ต้องมีประวัติการเปิดไพ่อาวุโสอย่างน้อย 1 รายการ"),
});

export async function POST(request: Request) {
  try {
    const clientIp = getClientIdentifier(request);
    const limit = checkRateLimit(`monthly_journal:${clientIp}`, {
      maxRequests: 10,
      windowSeconds: 300,
    });

    if (!limit.allowed) {
      return createRateLimitResponse(limit.retryAfterSeconds, "คุณขอสรุปบทเรียนดวงบ่อยเกินไป กรุณารอสักครู่");
    }

    const body = await request.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลบันทึกไม่ถูกต้อง หรือยังไม่มีประวัติการเปิดไพ่" },
        { status: 400 }
      );
    }

    const readings = parsed.data.readings.slice(0, 15); // Analyze up to 15 recent readings

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

    const dominantElement = Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0][0] || "สมดุล";

    // Prepare context for Gemini AI
    const historyText = readings
      .map((r, i) => {
        const cardList = r.cards.map((c) => `${c.cardNameTh} (${c.isReversed ? "กลับหัว" : "ตรง"})`).join(", ");
        return `[บันทึกที่ ${i + 1} | วันที่: ${r.date.slice(0, 10)}] คำถาม: "${r.question}" | ไพ่: ${cardList} | บทสรุป: "${r.summary.slice(0, 100)}..." | ผลจริง: ${r.outcome || "รอผล"} ${r.userNote ? `(โน้ต: ${r.userNote})` : ""}`;
      })
      .join("\n");

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        title: "กระจกสะท้อนคลื่นพลังงานและบทเรียนชีวิตรอบเดือน",
        totalReadings: readings.length,
        accurateReadings: accurateCount,
        dominantElement,
        recurringCards: topCards,
        synthesis: `ตลอดการเปิดไพ่ ${readings.length} ครั้งที่ผ่านมา พลังงานธาตุ${dominantElement} มีอิทธิพลต่อการตัดสินใจและอารมณ์ของคุณอย่างเด่นชัด ไพ่ที่ปรากฏบ่อยเตือนให้คุณรักษาจุดยืน ความสงบในจิตใจ และกล้าที่จะเปลี่ยนแปลงในสิ่งที่ค้างคา`,
        lifeLessons: [
          "ทุกทางเลือกในอดีตได้หล่อหลอมให้คุณมีสติและเข้าใจตนเองลึกซึ้งยิ่งขึ้น",
          "คลื่นพลังงานรอบตัวกำลังเปิดรับโอกาสใหม่ จงเชื่อมั่นในสัญชาตญาณของตนเอง",
        ],
        empowermentQuote: "ชะตาชีวิตไม่ใช่สิ่งที่ถูกกำหนดไว้ล่วงหน้า แต่คือผืนผ้าที่คุณเป็นผู้ถักทอด้วยมือของคุณเองทุกวัน",
      });
    }

    const prompt = `คุณคือปรมาจารย์นักจิตวิทยาและนักพยากรณ์ไพ่ทาโรต์ระดับสูง (Tarot Life Synthesizer & Spiritual Mentor)
วิเคราะห์บันทึกการเปิดไพ่ทาโรต์ของผู้ใช้จำนวน ${readings.length} ครั้งในรอบช่วงที่ผ่านมา เพื่อสะท้อนภาพรวมชีวิต ค้นหา Pattern ทางจิตวิทยา และสรุปบทเรียนสำคัญ

ข้อมูลประวัติการเปิดไพ่:
${historyText}

สถิติเบื้องต้น:
- ไพ่ที่ออกบ่อย: ${topCards.join(", ") || "กระจายตัวหลากหลาย"}
- ธาตุเด่นในภาพรวม: ธาตุ${dominantElement}

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

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API returned status ${res.status}`);
    }

    const resJson = await res.json() as any;
    const responseText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsedAI = JSON.parse(responseText);

    return NextResponse.json({
      title: parsedAI.title || "กระจกสะท้อนพลังงานและบทเรียนชีวิตรอบเดือน",
      totalReadings: readings.length,
      accurateReadings: accurateCount,
      dominantElement: parsedAI.dominantElement || dominantElement,
      recurringCards: parsedAI.recurringCards || topCards,
      synthesis: parsedAI.synthesis || "พลังงานโดยรวมของคุณกำลังเคลื่อนเข้าสู่จุดเปลี่ยนที่สำคัญ",
      lifeLessons: parsedAI.lifeLessons || ["ความเข้าใจตนเองคือกุญแจสู่ทุกทางออก"],
      empowermentQuote: parsedAI.empowermentQuote || "โชคชะตาอยู่ในมือของคุณเสมอ",
    });
  } catch (error) {
    console.error("[Monthly Summary API Error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการประมวลผลบทเรียนดวง กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
