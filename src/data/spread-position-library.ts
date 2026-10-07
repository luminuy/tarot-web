/**
 * ✦ คลังตำแหน่งสำหรับ "สร้างผังของฉัน" (REFLECTION_JOURNAL_PLAN 1.8)
 * ---------------------------------------------------------------------------
 * กลั่นจาก 136 ตำแหน่งของ 26 ผังในบ้าน — ผู้ใช้ส่วนใหญ่ตั้งตำแหน่งเองไม่ถนัด
 * ได้ผังที่ตำแหน่งซ้อนกันหรือกำกวมจน AI อ่านได้แย่ คลังนี้คือจุดเริ่มที่เขียนดีแล้ว (แก้ต่อได้)
 * ⚠️ ไฟล์นี้เบา (ไม่มีสำรับ) — ใช้ใน island หน้าสร้างผังได้
 */

export type PositionGroup = "me" | "other" | "past" | "now" | "obstacle" | "choice" | "future" | "advice";

export interface LibraryPosition {
  id: string;
  group: PositionGroup;
  nameTh: string;
  nameEn: string;
  meaning: string;
  meaningEn: string;
}

export const POSITION_GROUP_LABEL: Record<PositionGroup, { th: string; en: string }> = {
  me: { th: "ตัวฉัน", en: "Me" },
  other: { th: "อีกฝ่าย / คนรอบตัว", en: "The other person" },
  past: { th: "ที่มา", en: "Roots" },
  now: { th: "ตอนนี้", en: "Now" },
  obstacle: { th: "อุปสรรค", en: "Obstacles" },
  choice: { th: "ทางเลือก", en: "Choices" },
  future: { th: "ข้างหน้า", en: "Ahead" },
  advice: { th: "คำแนะนำ", en: "Guidance" },
};

export const POSITION_LIBRARY: readonly LibraryPosition[] = [
  // ตัวฉัน
  { id: "me-now", group: "me", nameTh: "สิ่งที่ฉันมีตอนนี้", nameEn: "What I have now", meaning: "ทรัพยากร ความสามารถ และพลังที่ผู้ถามมีอยู่ในมือตอนนี้", meaningEn: "The resources, strengths and energy the seeker already holds" },
  { id: "me-want", group: "me", nameTh: "สิ่งที่ฉันกำลังมองหา", nameEn: "What I'm looking for", meaning: "ความต้องการลึก ๆ ที่ผู้ถามอยากได้จากเรื่องนี้", meaningEn: "The deeper need the seeker hopes this situation will meet" },
  { id: "me-fear", group: "me", nameTh: "สิ่งที่ฉันกลัว", nameEn: "What I fear", meaning: "ความกลัวหรือความกังวลที่กำลังมีผลต่อการตัดสินใจ", meaningEn: "The fear or worry quietly shaping the seeker's choices" },
  { id: "me-hidden", group: "me", nameTh: "สิ่งที่ฉันมองไม่เห็น", nameEn: "What I can't see", meaning: "มุมที่ผู้ถามมองข้ามหรือยังไม่รู้ตัว", meaningEn: "A blind spot the seeker has overlooked or not yet noticed" },
  { id: "me-strength", group: "me", nameTh: "จุดแข็งของฉัน", nameEn: "My strength", meaning: "ความสามารถที่ผู้ถามใช้ผ่านเรื่องนี้ได้", meaningEn: "The quality that can carry the seeker through this" },
  { id: "me-feel", group: "me", nameTh: "ความรู้สึกที่แท้จริงของฉัน", nameEn: "How I truly feel", meaning: "ความรู้สึกจริงในใจผู้ถาม ไม่ใช่ที่แสดงออก", meaningEn: "The seeker's true feeling beneath what they show" },
  // อีกฝ่าย
  { id: "other-feel", group: "other", nameTh: "อีกฝ่ายรู้สึกอย่างไร", nameEn: "How they feel", meaning: "พลังงานและความรู้สึกของอีกฝ่ายที่มีต่อเรื่องนี้", meaningEn: "The other person's energy and feelings toward this" },
  { id: "other-want", group: "other", nameTh: "อีกฝ่ายต้องการอะไร", nameEn: "What they want", meaning: "สิ่งที่อีกฝ่ายต้องการหรือคาดหวัง", meaningEn: "What the other person wants or expects" },
  { id: "other-see", group: "other", nameTh: "อีกฝ่ายมองฉันอย่างไร", nameEn: "How they see me", meaning: "ภาพของผู้ถามในสายตาอีกฝ่าย", meaningEn: "How the seeker appears in the other person's eyes" },
  { id: "bond", group: "other", nameTh: "สายสัมพันธ์ระหว่างเรา", nameEn: "The bond between us", meaning: "ลักษณะของความสัมพันธ์ตอนนี้ — สิ่งที่เชื่อมและสิ่งที่ค้างคา", meaningEn: "The current nature of the connection — what links and what lingers" },
  { id: "people", group: "other", nameTh: "คนรอบตัวที่มีผล", nameEn: "People who matter here", meaning: "บุคคลหรือแรงจากคนรอบข้างที่มีผลต่อเรื่องนี้", meaningEn: "People or outside influences affecting the matter" },
  // ที่มา
  { id: "root", group: "past", nameTh: "รากของเรื่อง", nameEn: "The root", meaning: "ที่มาลึก ๆ ของสถานการณ์นี้", meaningEn: "The deeper origin of this situation" },
  { id: "past", group: "past", nameTh: "อดีตที่ยังส่งผล", nameEn: "The past still at work", meaning: "เหตุการณ์ที่ผ่านมาซึ่งยังมีผลถึงวันนี้", meaningEn: "Past events still influencing today" },
  { id: "lesson", group: "past", nameTh: "บทเรียนที่ผ่านมา", nameEn: "A past lesson", meaning: "สิ่งที่ผู้ถามได้เรียนรู้จากครั้งก่อน", meaningEn: "What the seeker learned from before" },
  // ตอนนี้
  { id: "now", group: "now", nameTh: "สถานการณ์ตอนนี้", nameEn: "The situation now", meaning: "ภาพรวมของสิ่งที่กำลังเกิดขึ้นตอนนี้", meaningEn: "An overview of what is happening right now" },
  { id: "heart", group: "now", nameTh: "หัวใจของเรื่อง", nameEn: "The heart of the matter", meaning: "แก่นสำคัญที่สุดของคำถามนี้", meaningEn: "The most essential core of this question" },
  { id: "energy", group: "now", nameTh: "พลังงานรอบตัว", nameEn: "The surrounding energy", meaning: "บรรยากาศและจังหวะรอบตัวผู้ถามช่วงนี้", meaningEn: "The atmosphere and rhythm around the seeker lately" },
  { id: "work-now", group: "now", nameTh: "งานของฉันตอนนี้", nameEn: "My work now", meaning: "สภาพงานหรือการเรียนในปัจจุบัน", meaningEn: "The current state of the seeker's work or study" },
  { id: "money-now", group: "now", nameTh: "การเงินตอนนี้", nameEn: "Money now", meaning: "สถานะการเงินและความมั่นคงในปัจจุบัน", meaningEn: "The present financial picture and sense of security" },
  // อุปสรรค
  { id: "obstacle", group: "obstacle", nameTh: "อุปสรรค", nameEn: "The obstacle", meaning: "สิ่งที่ขวางทางหรือทำให้เรื่องติดขัด", meaningEn: "What stands in the way or slows things down" },
  { id: "inner-block", group: "obstacle", nameTh: "สิ่งที่ฉันขวางตัวเอง", nameEn: "How I block myself", meaning: "นิสัยหรือความเชื่อของผู้ถามเองที่ทำให้ไม่ขยับ", meaningEn: "A habit or belief of the seeker's own that holds them back" },
  { id: "outer-block", group: "obstacle", nameTh: "แรงต้านจากภายนอก", nameEn: "Outside resistance", meaning: "ข้อจำกัดหรือแรงต้านจากสถานการณ์และคนอื่น", meaningEn: "Limits or pushback from circumstances or other people" },
  { id: "let-go", group: "obstacle", nameTh: "สิ่งที่ควรปล่อยวาง", nameEn: "What to let go of", meaning: "สิ่งที่ผู้ถามควรวางลงเพื่อไปต่อ", meaningEn: "What the seeker should set down to move on" },
  // ทางเลือก
  { id: "option-a", group: "choice", nameTh: "ถ้าเลือกทาง ก.", nameEn: "If I choose path A", meaning: "พลังงานและแนวโน้มเมื่อเลือกทางแรก", meaningEn: "The energy and likely flow of choosing the first path" },
  { id: "option-b", group: "choice", nameTh: "ถ้าเลือกทาง ข.", nameEn: "If I choose path B", meaning: "พลังงานและแนวโน้มเมื่อเลือกทางที่สอง", meaningEn: "The energy and likely flow of choosing the second path" },
  { id: "stay", group: "choice", nameTh: "ถ้าอยู่ที่เดิม", nameEn: "If I stay", meaning: "สิ่งที่เกิดเมื่อไม่เปลี่ยนแปลงอะไร", meaningEn: "What unfolds if nothing changes" },
  { id: "leave", group: "choice", nameTh: "ถ้าก้าวออกไป", nameEn: "If I leave", meaning: "สิ่งที่เกิดเมื่อกล้าเปลี่ยน", meaningEn: "What unfolds if the seeker dares to change" },
  { id: "consider", group: "choice", nameTh: "สิ่งที่ควรพิจารณา", nameEn: "What to consider", meaning: "ปัจจัยสำคัญที่ควรชั่งน้ำหนักก่อนตัดสินใจ", meaningEn: "The key factor to weigh before deciding" },
  // ข้างหน้า
  { id: "near", group: "future", nameTh: "สิ่งที่กำลังจะมา", nameEn: "What's coming", meaning: "แนวโน้มในช่วงใกล้ ๆ นี้", meaningEn: "The near-term direction of things" },
  { id: "outcome", group: "future", nameTh: "แนวโน้มของเรื่อง", nameEn: "Where it's heading", meaning: "ทิศทางที่เรื่องนี้น่าจะไป หากเดินแบบเดิม", meaningEn: "Where this is likely heading if things continue as they are" },
  { id: "opportunity", group: "future", nameTh: "โอกาสที่รออยู่", nameEn: "The opportunity", meaning: "ช่องทางหรือโอกาสที่ผู้ถามอาจคว้าได้", meaningEn: "An opening the seeker could take" },
  { id: "hope", group: "future", nameTh: "สิ่งที่หวังไว้", nameEn: "What I hope for", meaning: "ความหวังของผู้ถามและความเป็นไปได้ของมัน", meaningEn: "The seeker's hope and how it might unfold" },
  { id: "growth", group: "future", nameTh: "สิ่งที่ฉันจะได้เรียนรู้", nameEn: "What I'll grow into", meaning: "การเติบโตที่เรื่องนี้ชวนให้เกิด", meaningEn: "The growth this situation invites" },
  // คำแนะนำ
  { id: "advice", group: "advice", nameTh: "คำแนะนำ", nameEn: "Guidance", meaning: "สิ่งที่ไพ่แนะนำให้ผู้ถามทำหรือระลึกไว้", meaningEn: "What the cards suggest the seeker do or remember" },
  { id: "next-step", group: "advice", nameTh: "ก้าวต่อไป", nameEn: "Next step", meaning: "ก้าวเล็ก ๆ ที่ลงมือได้จริงในตอนนี้", meaningEn: "A small, practical step to take now" },
  { id: "focus", group: "advice", nameTh: "สิ่งที่ควรโฟกัส", nameEn: "What to focus on", meaning: "เรื่องที่ควรใส่ใจมากที่สุดช่วงนี้", meaningEn: "What deserves the most attention right now" },
  { id: "avoid", group: "advice", nameTh: "สิ่งที่ควรระวัง", nameEn: "What to watch out for", meaning: "สิ่งที่ควรหลีกเลี่ยงหรือระวังไว้", meaningEn: "What to avoid or be careful about" },
  { id: "self-care", group: "advice", nameTh: "วิธีดูแลใจตัวเอง", nameEn: "How to care for myself", meaning: "วิธีดูแลใจและพลังของผู้ถามระหว่างทาง", meaningEn: "How the seeker can look after their heart and energy along the way" },
  { id: "message", group: "advice", nameTh: "ข้อความถึงฉัน", nameEn: "A message for me", meaning: "ข้อคิดสั้น ๆ ที่ไพ่อยากฝากถึงผู้ถาม", meaningEn: "A short reflection the cards offer the seeker" },
];
