import { checkQuestion } from "@/lib/safety/guardrails";
import { getAppDB } from "@/lib/platform/db";

export type ScreeningVerdict = "pass" | "block" | "needs_review";
export type QuestionCategory = "love" | "work" | "money" | "self" | "general";
export type QuestionUrgency = "low" | "medium" | "high";

export interface AIScreeningRecord {
  id: string;
  ticketId: string | null;
  verdict: ScreeningVerdict;
  category: QuestionCategory;
  urgency: QuestionUrgency;
  inScope: boolean;
  brief: string;
  suggestedSpread: string;
  flags: string[];
  createdAt: number;
}

export interface PerformScreeningInput {
  question: string;
  ticketId?: string;
  drawnCardsSummary?: string;
}

/**
 * วิเคราะห์หมวดหมู่และคีย์เวิร์ดคำถามด้วย Heuristic Analysis
 */
function analyzeQuestionCategory(q: string): {
  category: QuestionCategory;
  urgency: QuestionUrgency;
  suggestedSpread: string;
} {
  const lower = q.toLowerCase();

  // Love keywords
  if (
    lower.includes("รัก") ||
    lower.includes("แฟน") ||
    lower.includes("คนคุย") ||
    lower.includes("ชอบ") ||
    lower.includes("เลิก") ||
    lower.includes("คู่") ||
    lower.includes("แต่งงาน") ||
    lower.includes("เนื้อคู่") ||
    lower.includes("แอบชอบ")
  ) {
    const isUrgent = lower.includes("ด่วน") || lower.includes("เลิกกัน") || lower.includes("นอกใจ");
    return {
      category: "love",
      urgency: isUrgent ? "high" : "medium",
      suggestedSpread: lower.includes("แฟนเก่า") ? "ex-lover-return" : "love-two-hearts",
    };
  }

  // Work & Career keywords
  if (
    lower.includes("งาน") ||
    lower.includes("สมัคร") ||
    lower.includes("เจ้านาย") ||
    lower.includes("ธุรกิจ") ||
    lower.includes("ย้ายงาน") ||
    lower.includes("สัมภาษณ์") ||
    lower.includes("สอบ") ||
    lower.includes("เลื่อนตำแหน่ง")
  ) {
    const isUrgent = lower.includes("ลาออก") || lower.includes("ถูกไล่ออก") || lower.includes("สัมภาษณ์พรุ่งนี้");
    return {
      category: "work",
      urgency: isUrgent ? "high" : "medium",
      suggestedSpread: "work-career-crossroads",
    };
  }

  // Money & Wealth keywords
  if (
    lower.includes("เงิน") ||
    lower.includes("หนี้") ||
    lower.includes("ลงทุน") ||
    lower.includes("ขาย") ||
    lower.includes("โชคลาภ") ||
    lower.includes("รายได้") ||
    lower.includes("การเงิน")
  ) {
    const isUrgent = lower.includes("หมดตัว") || lower.includes("หนี้ท่วม");
    return {
      category: "money",
      urgency: isUrgent ? "high" : "medium",
      suggestedSpread: "money-flow",
    };
  }

  // Self & Spiritual keywords
  if (
    lower.includes("ตัวเอง") ||
    lower.includes("หมดไฟ") ||
    lower.includes("สับสน") ||
    lower.includes("ทางตัน") ||
    lower.includes("พลังงาน") ||
    lower.includes("จิตใจ") ||
    lower.includes("ชีวิต")
  ) {
    return {
      category: "self",
      urgency: "medium",
      suggestedSpread: "seven-chakras",
    };
  }

  return {
    category: "general",
    urgency: "low",
    suggestedSpread: "three-cards",
  };
}

/**
 * สร้าง Brief สรุปใจความสำคัญสำหรับแม่หมอ
 */
function synthesizeBrief(
  category: QuestionCategory,
  question: string,
  drawnCardsSummary?: string
): string {
  const cleanQ = question.trim().replace(/\s+/g, " ");
  let brief = `ลูกดวงสอบถามในหมวด [${
    category === "love"
      ? "ความรักความสัมพันธ์"
      : category === "work"
        ? "การงานและอาชีพ"
        : category === "money"
          ? "การเงินและโชคลาภ"
          : category === "self"
            ? "จิตใจและการพัฒนาตนเอง"
            : "คำถามทั่วไป"
  }]: "${cleanQ}"`;

  if (drawnCardsSummary) {
    brief += `\n✦ ไพ่ที่ลูกดวงเปิดได้เบื้องต้น: ${drawnCardsSummary}`;
  }

  return brief;
}

/**
 * ดำเนินการคัดกรองคำถามด้วย AI Safety Guardrails + AI Synthesizer
 */
export async function performAIScreening(input: PerformScreeningInput): Promise<AIScreeningRecord> {
  const db = await getAppDB();
  const id = `screen_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = Date.now();

  // 1. Safety Guardrails Check (ด่านความปลอดภัยสูงสุด)
  const safety = checkQuestion(input.question);
  if (safety.block) {
    const isCrisis = safety.flag === "crisis";
    const flags = [safety.flag];
    const brief = isCrisis
      ? "✦ สัญญาณวิกฤต: คำถามเข้าข่ายทำร้ายตนเองหรือภาวะวิกฤตทางจิตใจ ระบบได้บล็อกและแสดงสายด่วน 1323 เรียบร้อยแล้ว"
      : `✦ คำถามไม่ผ่านเกณฑ์ความปลอดภัย (${safety.flag}): ${safety.message || "ผิดนโยบายการให้บริการ"}`;

    const record: AIScreeningRecord = {
      id,
      ticketId: input.ticketId || null,
      verdict: "block",
      category: "general",
      urgency: isCrisis ? "high" : "medium",
      inScope: false,
      brief,
      suggestedSpread: "three-cards",
      flags,
      createdAt: now,
    };

    await db
      .prepare(
        `INSERT INTO ai_screening (
          id, ticket_id, verdict, category, urgency, in_scope, brief, suggested_spread, flags, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.ticketId,
        record.verdict,
        record.category,
        record.urgency,
        record.inScope ? 1 : 0,
        record.brief,
        record.suggestedSpread,
        JSON.stringify(record.flags),
        record.createdAt
      )
      .run();

    return record;
  }

  // 2. Intent Analysis & Categorization
  const analysis = analyzeQuestionCategory(input.question);
  const brief = synthesizeBrief(analysis.category, input.question, input.drawnCardsSummary);

  const record: AIScreeningRecord = {
    id,
    ticketId: input.ticketId || null,
    verdict: "pass",
    category: analysis.category,
    urgency: analysis.urgency,
    inScope: true,
    brief,
    suggestedSpread: analysis.suggestedSpread,
    flags: [],
    createdAt: now,
  };

  await db
    .prepare(
      `INSERT INTO ai_screening (
        id, ticket_id, verdict, category, urgency, in_scope, brief, suggested_spread, flags, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      record.id,
      record.ticketId,
      record.verdict,
      record.category,
      record.urgency,
      record.inScope ? 1 : 0,
      record.brief,
      record.suggestedSpread,
      JSON.stringify(record.flags),
      record.createdAt
    )
    .run();

  return record;
}

/**
 * ดึงผลการคัดกรองด้วย Screening ID
 */
export async function getAIScreeningById(id: string): Promise<AIScreeningRecord | null> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT * FROM ai_screening WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{
      id: string;
      ticket_id: string | null;
      verdict: string;
      category: string;
      urgency: string;
      in_scope: number;
      brief: string;
      suggested_spread: string;
      flags: string;
      created_at: number;
    }>();

  if (!row) return null;

  let flags: string[] = [];
  try {
    flags = JSON.parse(row.flags || "[]");
  } catch {
    // ignore
  }

  return {
    id: row.id,
    ticketId: row.ticket_id,
    verdict: row.verdict as ScreeningVerdict,
    category: (row.category as QuestionCategory) || "general",
    urgency: (row.urgency as QuestionUrgency) || "low",
    inScope: Boolean(row.in_scope),
    brief: row.brief,
    suggestedSpread: row.suggested_spread,
    flags,
    createdAt: row.created_at,
  };
}
