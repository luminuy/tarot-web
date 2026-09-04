import { listJournal } from "@/lib/journal/journal.repo";
import type { PastReadingSnapshot } from "@/lib/ai/karmic";

/**
 * 🧠 ความทรงจำข้ามครั้งของแม่หมอ (Cross-Session Karmic Memory)
 * ส่งเฉพาะรูปย่อ ไม่ส่งคำอ่านเต็ม:
 *  1. prompt ไม่ยาวเกินจำเป็น รักษา latency และความเร็ว
 *  2. ลดความเสี่ยงข้อมูลส่วนบุคคลหลุดออกนอกระบบ (PDPA-compliant)
 *  3. ดึงเฉพาะแก่นที่แม่หมอต้องรู้: "เคยได้ไพ่อะไร ถามอะไร แล้วผลลัพธ์เป็นอย่างไร"
 * ⚠️ ผู้เยี่ยมชมไม่มีประวัติ หรือเกิดข้อผิดพลาดใดๆ → คืน undefined อย่างปลอดภัย ห้าม throw
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

    const primaryCard = latest.cards[0];
    const cardName = primaryCard.cardNameTh
      ? `${primaryCard.cardNameTh}${primaryCard.cardNameEn ? ` (${primaryCard.cardNameEn})` : ""}`
      : primaryCard.cardNameEn || "ไพ่ใบสำคัญ";

    return {
      primaryCardName: cardName,
      question: latest.question,
      outcome: latest.outcome,
      daysAgo: Math.max(0, Math.floor((Date.now() - new Date(latest.date).getTime()) / 86_400_000)),
      recentPrimaryCards: past
        .slice(1)
        .map((r) => r.cards[0]?.cardNameTh)
        .filter((name): name is string => Boolean(name)),
      date: latest.date,
      summary: latest.summary,
    };
  } catch (err) {
    console.warn("[karmic memory] อ่านประวัติไม่สำเร็จ:", err);
    return undefined; // ประวัติอ่านไม่ได้ = ระบบต้องให้คำอ่านทำงานต่อไปได้ตามปกติ
  }
}
