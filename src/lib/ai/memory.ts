import { listJournal } from "@/lib/journal/journal.repo";
import type { PastReadingSnapshot } from "@/lib/ai/karmic";
import { cardByIndex } from "@/data/cards";
import { sanitizePromptValue } from "@/lib/ai/prompt-guard";

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
): Promise<PastReadingSnapshot | undefined> {
  if (!userId) return undefined;

  try {
    // จำกัดเวลาค้นหาประวัติไม่เกิน 250ms เพื่อรักษา TTFB Budget ไม่ให้สตรีมช้า
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 250));
    const pastPromise = listJournal(userId, { limit });

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
    };
  } catch (err) {
    console.warn("[karmic memory] อ่านประวัติไม่สำเร็จ:", err);
    return undefined; // ประวัติอ่านไม่ได้ = ระบบต้องให้คำอ่านทำงานต่อไปได้ตามปกติ
  }
}
