/**
 * 📏 เพดานแชท "ถามแม่หมอต่อ" ฝั่งไคลเอนต์ — ต้องตรงกับ `src/app/api/reading/[id]/chat/route.ts`
 * (A4-08) เซิร์ฟเวอร์ตรวจ schema แบบทั้งก้อนหรือไม่เลย: ตาแชทเดียวที่ยาวเกินเพดานทำให้ทุกข้อความถัดไปถูกปฏิเสธ
 * ไคลเอนต์จึงต้องตัดประวัติให้พอดีเพดานก่อนส่งเสมอ
 *
 * ⚠️ ค่าทั้งสี่ตัวถูกเทียบกับค่าคงที่ใน route จริงโดย `scripts/qa/test-chat-history-schema.ts`
 *    ถ้าแก้ฝั่งเซิร์ฟเวอร์ ด่านนั้นจะตกจนกว่าไฟล์นี้จะตามให้ตรง
 */
/** ความยาวข้อความที่ผู้ใช้พิมพ์ต่อหนึ่งคำถาม */
export const CHAT_MESSAGE_MAX = 800;
/** ความยาวต่อหนึ่งตาใน `history[]` (ทั้งฝั่งผู้ใช้และฝั่งแม่หมอ) */
export const CHAT_HISTORY_TURN_MAX = 800;
/** จำนวนตาสูงสุดที่ schema ยอมรับใน `history[]` */
export const CHAT_HISTORY_MAX_TURNS = 50;
/** จำนวนตาท้ายสุดที่เซิร์ฟเวอร์ replay เข้าโมเดลจริง — ส่งเกินนี้ไม่มีประโยชน์ */
export const CHAT_HISTORY_REPLAY_TURNS = 12;

/**
 * ตัดประวัติแชทให้พอดีเพดานของเซิร์ฟเวอร์: เก็บเฉพาะตาท้ายสุดที่ replay จริง และตัดข้อความยาวเกินเพดานต่อตา
 * (ไม่ปฏิเสธทั้งก้อน — ตัดท้ายข้อความที่ยาวเกินแทน)
 */
export function clampChatHistory<T extends { sender: "user" | "bot"; text: string }>(
  turns: readonly T[],
): Array<{ sender: "user" | "bot"; text: string }> {
  const keep = Math.min(CHAT_HISTORY_REPLAY_TURNS, CHAT_HISTORY_MAX_TURNS);
  return turns
    .slice(-keep)
    .map((m) => ({ sender: m.sender, text: m.text.slice(0, CHAT_HISTORY_TURN_MAX) }));
}
