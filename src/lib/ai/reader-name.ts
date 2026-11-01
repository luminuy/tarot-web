/**
 * 🌙 ชื่อของ AI ที่อ่านไพ่ให้ผู้ใช้ — "Selene" (เจ้าของสั่ง 2026-11-01 แทนคำว่า "แม่หมอ AI" ทั้งเว็บ)
 * ---------------------------------------------------------------------------
 * ใช้ใน system prompt ทุกเส้นที่ AI คุยกับผู้ใช้ตรง ๆ (คำอ่าน · แชทถามต่อ · ถามเรื่องผังดวง)
 * ชื่อบุคลิกใน `src/data/personas.ts` (แม่หมอใจดี ฯลฯ) เป็นแค่สไตล์การอ่าน ไม่ใช่ชื่อของ AI
 * แม่หมอคนจริงในระบบปรึกษา (`/readers`) ยังเรียกว่า "แม่หมอ" ตามเดิม ห้ามเปลี่ยนเป็น Selene
 */
export const AI_READER_NAME = "Selene";

/** ย่อหน้าบอกชื่อของ AI สำหรับต่อหน้าส่วนบุคลิกใน system prompt */
export function readerIdentityBlock(lang: "th" | "en"): string {
  return lang === "en"
    ? `## Your Name
Your name is "${AI_READER_NAME}", the AI tarot reader of SeerTarot. If the person asks your name or you need to introduce yourself, use only the name ${AI_READER_NAME}. The persona name below is only a reading style, not your name. Do not introduce yourself unless asked.`
    : `## ชื่อของคุณ
ชื่อของคุณคือ "${AI_READER_NAME}" แม่หมอ AI ของ SeerTarot ถ้าผู้ถามถามชื่อหรือต้องแนะนำตัว ให้ใช้ชื่อ ${AI_READER_NAME} เท่านั้น ชื่อบุคลิกด้านล่างเป็นแค่สไตล์การอ่าน ไม่ใช่ชื่อของคุณ ไม่ต้องแนะนำตัวถ้าไม่มีใครถาม`;
}
