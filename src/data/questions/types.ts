/**
 * ❓ หน้าคำถาม `/questions/[slug]` (REFLECTION_JOURNAL_PLAN 1.11 · แทร็ก Q)
 * ---------------------------------------------------------------------------
 * ชั้นลูกของหน้าหมวด `/spreads/topic/*` (ไม่สร้างหมวดซ้ำ = ไม่แย่งอันดับกันเอง)
 * เลือกคำถามจาก **คำค้นจริง** (Google Autocomplete th/en ดึงเมื่อ 2026-10-06 · บันทึกใน `searchPhrases`)
 *
 * เนื้อหาที่หน้า AI ทั่วไปไม่มี:
 *  • กล่อง "ถามเลยตอนนี้" — ตั้งคำถาม + ผังที่เหมาะไว้ให้แล้ว
 *  • ไพ่ที่ควรรู้จักพร้อมเหตุผลเฉพาะคำถามนี้ · แนวโน้มใช่/ไม่ใช่คำนวณจาก `yes-no.ts` (ไม่เดา)
 *  • เหตุผลรายตำแหน่งของผังที่แนะนำ · ตัวอย่างการอ่าน (ติดป้ายว่าเป็นตัวอย่าง ไม่ใช่คำทำนายของใคร)
 * ⚠️ ด่าน `scripts/qa/test-question-pages.ts` กันหน้าบาง: ข้อความเฉพาะหน้า ≥ 600 คำ (ไทย) / ≥ 450 คำ (อังกฤษ) ·
 *    ย่อหน้าเปิดไม่ซ้ำ · ลิงก์ภายใน ≥ 8 · title/description ตามเพดาน · หน้าอังกฤษไม่มีอักษรไทย
 */

export type QuestionTopic = "love" | "career" | "money" | "study" | "family" | "general";

export interface QuestionCopy {
  /** หัวเรื่อง (H1) — ภาษาคนแบบที่คนพิมพ์ค้นจริง */
  question: string;
  /** <title> ไม่รวมแบรนด์ — ≤ 60 ตัวอักษร */
  title: string;
  /** meta description — ≤ 155 ตัวอักษร */
  description: string;
  /** คำค้นจริงที่หน้านี้ตอบ (หลักฐานการเลือกหัวข้อ) */
  searchPhrases: string[];
  /** ย่อหน้าเปิด — ต้องไม่ซ้ำกับหน้าอื่น */
  intro: string[];
  /** ไพ่ตอบอะไรได้ / อะไรที่ไม่ควรถามไพ่ (ความซื่อตรง) */
  limits: string;
  /** ถามแบบไหนได้คำตอบที่ใช้ได้จริงกว่า */
  betterQuestions: string[];
  /** เหตุผลรายตำแหน่งของผังที่แนะนำ — จำนวนเท่ากับตำแหน่งในผัง */
  positionWhy: string[];
  /** เหตุผลเฉพาะคำถามนี้ของไพ่ที่ควรรู้จัก — คีย์ = id ไพ่ */
  cardNotes: Record<string, string>;
  /** เมื่อไพ่ตอบแล้ว ทำอะไรต่อ */
  afterReading: string[];
  /** ตัวอย่างการอ่าน (สมมติ) */
  example: { cards: Array<{ id: string; reversed?: boolean }>; text: string };
  /** คำถามที่คนมักถามต่อ — เขียนในเนื้อหา (ไม่หวัง rich result) */
  followUps: Array<{ q: string; a: string }>;
}

export interface QuestionPage {
  slug: string;
  topic: QuestionTopic;
  /** ผังที่แนะนำ — ต้องเป็นผังสาธารณะที่มีจริง */
  spreadId: string;
  /** หมวดของคำถาม (ส่งต่อให้พิธีเปิดไพ่) */
  category: "general" | "love" | "work" | "money" | "self";
  /** แสดงแนวโน้มใช่/ไม่ใช่ของไพ่ที่ควรรู้จัก (คำนวณจาก yes-no.ts) */
  yesNo?: boolean;
  /** วันที่เขียน/แก้เนื้อหาล่าสุด (ISO) — ใช้ใน sitemap และ Article JSON-LD */
  updatedAt: string;
  th: QuestionCopy;
  en: QuestionCopy;
}

/** หน้าหมวดแม่ของแต่ละหัวข้อ — คำถามทั่วไปชี้กลับคลังผัง */
export const TOPIC_PARENT: Record<QuestionTopic, { path: string; th: string; en: string }> = {
  love: { path: "/spreads/topic/love", th: "ความรัก", en: "Love" },
  career: { path: "/spreads/topic/career", th: "การงาน", en: "Career" },
  money: { path: "/spreads/topic/money", th: "การเงิน", en: "Money" },
  study: { path: "/spreads/topic/study", th: "การเรียน", en: "Study" },
  family: { path: "/spreads/topic/family", th: "ครอบครัว", en: "Family" },
  general: { path: "/spreads", th: "ผังพยากรณ์", en: "Tarot Spreads" },
};
