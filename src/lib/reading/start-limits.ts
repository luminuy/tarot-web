/**
 * 📏 เพดานข้อความที่ส่งไป `/api/reading/start` — ต้องตรงกับ `intake.situation` ใน
 * `src/app/api/reading/start/route.ts` (A4-07)
 * เซิร์ฟเวอร์ตอบ 400 "ข้อมูลที่ส่งมาไม่ถูกต้อง" แบบไม่บอกช่อง ถ้าเกินเพดาน
 * ไคลเอนต์จึงต้องตัดให้พอดีก่อนส่งเสมอ ไม่ปล่อยให้ผู้ใช้ติดทางตัน
 *
 * ⚠️ `START_SITUATION_MAX` ถูกเทียบกับ route จริงโดย `scripts/qa/test-flow-state.ts`
 */
/** ความยาวสูงสุดของ `intake.situation` ที่เซิร์ฟเวอร์รับ */
export const START_SITUATION_MAX = 500;
/** ความยาวสูงสุดของคำตอบในการ์ดที่แม่หมอถามกลับ — เผื่อที่ให้ถ้อยคำห่อ "(ข้อมูลเพิ่มเติม: …)" เมื่อมีเรื่องราวเดิมอยู่ */
export const CLARIFY_ANSWER_MAX = 400;
