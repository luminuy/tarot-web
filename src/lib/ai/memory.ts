import { listJournal, listThreadEntries } from "@/lib/journal/journal.repo";
import type { PastReadingSnapshot } from "@/lib/ai/karmic";
import { cardByIndex } from "@/data/cards";
import { sanitizePromptValue } from "@/lib/ai/prompt-guard";
import { checkQuestion } from "@/lib/safety/guardrails";

/**
 * 🛟 กฎเหล็กข้อ 6 — บันทึกที่ผู้ใช้ยินยอมให้แม่หมออ่านต้องผ่านด่านวิกฤตชุดเดียวกับคำถาม
 * (REFLECTION_JOURNAL_PLAN 1.5: บันทึกที่มีสัญญาณทำร้ายตัวเองไม่ส่งเข้า AI และต้องเห็นสายด่วน 1323)
 * ตรวจทั้งสองภาษาเสมอ — บันทึกเขียนภาษาไหนก็ได้ ไม่ขึ้นกับภาษาของหน้า
 */
export function noteHasCrisisSignal(note: string | null | undefined): boolean {
  const text = (note ?? "").trim();
  if (!text) return false;
  return checkQuestion(text, "th").block || checkQuestion(text, "en").block;
}

/** คำสั่งเพิ่มให้แม่หมอ AI เมื่อบันทึกล่าสุดมีสัญญาณวิกฤต — ไม่มีเนื้อหาบันทึกอยู่ในนี้ */
export function noteCrisisPromptGuard(lang: "th" | "en"): string {
  return lang === "en"
    ? "The seeker's latest private note showed signs of serious distress, so it was withheld from you. Do not guess at or mention that note. Do not read any card as hopeless or as fate that cannot be changed. Keep the tone gentle, focus on caring for themselves right now and on the people around them who can help, and make the closing feel safe and supportive."
    : "บันทึกล่าสุดของผู้ถามมีสัญญาณความทุกข์ใจหนัก ระบบจึงไม่ส่งบันทึกนั้นมาให้ ห้ามเดาหรือพูดถึงบันทึกนั้น ห้ามตีความไพ่ใบใดว่าสิ้นหวังหรือเป็นชะตาที่เปลี่ยนไม่ได้ ใช้น้ำเสียงอ่อนโยน เน้นการดูแลใจตัวเองตอนนี้และคนรอบตัวที่พึ่งพาได้ ปิดท้ายให้รู้สึกปลอดภัยและมีคนอยู่ข้าง ๆ";
}

/**
 * ประโยคสายด่วนที่ `/read` ต่อท้ายสรุปคำอ่านเอง (ไม่พึ่งให้โมเดลพูด) เมื่อบันทึกล่าสุดมีสัญญาณวิกฤต
 * ข้อความล้วน ไม่มีสัญลักษณ์ตกแต่ง (กฎเหล็กข้อ 2)
 */
export function noteCrisisCareLine(lang: "th" | "en"): string {
  return lang === "en"
    ? "If things feel too heavy right now, you do not have to carry them alone. The Thai mental health hotline 1323 is free and open 24 hours, and if you are in immediate danger please call 1669."
    : "ถ้าช่วงนี้มีเรื่องหนักใจจนรับไม่ไหว ไม่ต้องแบกไว้คนเดียวนะ โทรคุยกับสายด่วนสุขภาพจิต 1323 ได้ฟรีตลอด 24 ชั่วโมง และถ้ากำลังตกอยู่ในอันตรายทันที โทร 1669";
}

/**
 * 🧠 ความทรงจำข้ามครั้งของแม่หมอ (Cross-Session Karmic Memory)
 * ส่งเฉพาะรูปย่อ ไม่ส่งคำอ่านเต็ม:
 *  1. prompt ไม่ยาวเกินจำเป็น รักษา latency และความเร็ว
 *  2. ลดความเสี่ยงข้อมูลส่วนบุคคลหลุดออกนอกระบบ (PDPA-compliant)
 *  3. ดึงเฉพาะแก่นที่แม่หมอต้องรู้: "เคยได้ไพ่อะไร ถามอะไร แล้วผลลัพธ์เป็นอย่างไร"
 * ⚠️ ผู้เยี่ยมชมไม่มีประวัติ หรือเกิดข้อผิดพลาดใด ๆ → คืน undefined อย่างปลอดภัย ห้าม throw
 */
export async function loadKarmicMemory(
  userId: string | null | undefined,
  limit = 3,
  /** ✦ ถามต่อจากเส้นเรื่องเดิม — ดึงคำอ่านในเรื่องนั้น (ค้นด้วย userId เสมอ อ่านของคนอื่นไม่ได้) */
  threadId?: string,
): Promise<PastReadingSnapshot | undefined> {
  if (!userId) return undefined;

  try {
    // จำกัดเวลาค้นหาประวัติไม่เกิน 250ms เพื่อรักษา TTFB Budget ไม่ให้สตรีมช้า
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 250));
    const pastPromise = threadId
      ? listThreadEntries(userId, threadId, limit).then((list) => list.reverse()) // ใหม่ ➔ เก่า เหมือน listJournal
      : listJournal(userId, { limit });

    const past = await Promise.race([pastPromise, timeoutPromise]);
    if (!past || past.length === 0) return undefined;

    const latest = past[0];
    if (!latest?.cards || latest.cards.length === 0) return undefined;

    /*
     * ⚠️ ข้อมูลในสมุดบันทึกมาจากไคลเอนต์ (A2-07) — ห้ามวางลง prompt ดิบ
     *  • ชื่อไพ่ อ่านจากสำรับจริงด้วย cardIndex ไม่ใช่ cardNameTh ที่ไคลเอนต์ส่งมา (กุได้)
     *    หาไม่เจอ = ไม่พูดถึงไพ่ใบนั้น (กฎเหล็กข้อ 14 — ห้ามเดาใบแทน)
     *  • คำถาม/สรุป ผ่าน sanitizePromptValue (ปิดแท็บของ prompt ไม่ได้ + มีเพดานความยาว)
     */
    const nameOf = (idx: number | undefined): string | undefined => {
      const card = typeof idx === "number" ? cardByIndex(idx) : undefined;
      return card ? `${card.nameTh} (${card.nameEn})` : undefined;
    };
    const primaryCardName = nameOf(latest.cards[0]?.cardIndex);
    if (!primaryCardName) return undefined;

    return {
      primaryCardName,
      question: sanitizePromptValue(latest.question, 300) || undefined,
      outcome: latest.outcome,
      daysAgo: Math.max(0, Math.floor((Date.now() - new Date(latest.date).getTime()) / 86_400_000)),
      recentPrimaryCards: past
        .slice(1)
        .map((r) => nameOf(r.cards[0]?.cardIndex))
        .filter((name): name is string => Boolean(name)),
      date: latest.date,
      summary: sanitizePromptValue(latest.summary, 600) || undefined,
      ...(threadId ? { sameThread: true } : {}),
      /*
       * 🔐 กติกาความเป็นส่วนตัวข้อ 1 — บันทึกส่วนตัวเข้า prompt ได้เฉพาะรายการที่ผู้ใช้กดยินยอมเอง (share_with_ai)
       *    ใจตอนนี้/แท็ก/บันทึกพิธี ไม่เข้า prompt ในทุกกรณี
       */
      /*
       * 🛟 กฎเหล็กข้อ 6 — บันทึกที่มีสัญญาณวิกฤตไม่เข้า prompt เลย ส่งแค่ธงให้ `/read` ดูแลต่อ
       *    (ตรวจข้อความดิบก่อนตัดความยาว ไม่ให้สัญญาณที่อยู่ท้ายบันทึกหลุดด่าน)
       */
      ...(latest.shareWithAi && latest.userNote
        ? noteHasCrisisSignal(latest.userNote)
          ? { noteCrisis: true }
          : { sharedNote: sanitizePromptValue(latest.userNote, 300) || undefined }
        : {}),
    };
  } catch (err) {
    console.warn("[karmic memory] อ่านประวัติไม่สำเร็จ:", err);
    return undefined; // ประวัติอ่านไม่ได้ = ระบบต้องให้คำอ่านทำงานต่อไปได้ตามปกติ
  }
}
