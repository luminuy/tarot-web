/**
 * 📏 เพดานของ "ถามแม่หมอ AI เรื่องผังดวง" — ใช้ร่วมกันทั้งหน้าเว็บ (`NatalAsk.tsx`) และ `/api/natal/chat`
 * ไฟล์นี้ต้องเบา (ไม่มี import) เพราะหน้าเว็บโหลดด้วย
 */
/** สมาชิกที่ไม่มีรอบเติม: ถามเรื่องผังฟรีได้วันละกี่ข้อ (เทียบเท่า "ถามแม่หมอต่อ" 2 ข้อต่อการเปิดไพ่ 1 ครั้งต่อวัน) */
export const NATAL_AI_FREE_PER_DAY = 2;
/** เพดานต่อบัญชีต่อวัน แม้มีรอบเติม (เท่ากับเพดานคำถามต่อไพ่หนึ่งชุด) */
export const NATAL_AI_USER_DAY_MAX = 20;
/** ความยาวคำถามหนึ่งข้อ */
export const NATAL_AI_MESSAGE_MAX = 500;
/** ความยาวต่อหนึ่งตาในประวัติ และจำนวนตาท้ายสุดที่ replay เข้าโมเดล */
export const NATAL_AI_HISTORY_TURN_MAX = 800;
export const NATAL_AI_HISTORY_TURNS = 8;
