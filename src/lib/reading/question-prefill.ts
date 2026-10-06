/**
 * ✦ ส่งคำถามจากหน้าคำถาม `/questions/*` ไปยังพิธีเปิดไพ่ `/read/<ผัง>` (REFLECTION_JOURNAL_PLAN 1.11)
 * ใช้ sessionStorage ครั้งเดียวแล้วลบ — ไม่ใส่คำถามไว้ใน URL (คำถามเป็นเรื่องส่วนตัว ไม่ควรติดไปกับลิงก์/ประวัติเบราว์เซอร์)
 * ⚠️ ไฟล์นี้เบา ใช้ได้ทั้งใน island ของหน้าคำถามและใน TarotFlow
 */
import { STORAGE_KEYS } from "@/lib/storage/keys";

export interface QuestionPrefill {
  question: string;
  category: "general" | "love" | "work" | "money" | "self";
  spreadId: string;
  /** อายุ 30 นาที — กันคำถามเก่าค้างมาเติมในรอบที่ผู้ใช้ไม่ได้ตั้งใจ */
  at: number;
}

const MAX_AGE_MS = 30 * 60 * 1000;

export function queueQuestionPrefill(p: Omit<QuestionPrefill, "at">): boolean {
  try {
    sessionStorage.setItem(STORAGE_KEYS.questionPrefill, JSON.stringify({ ...p, question: p.question.slice(0, 500), at: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

/** อ่านแล้วลบทันที · ใช้ได้เฉพาะเมื่อผังตรงกับหน้าที่เปิดอยู่ (กันไปเติมผิดผัง) */
export function takeQuestionPrefill(spreadId: string): QuestionPrefill | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.questionPrefill);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEYS.questionPrefill);
    const v = JSON.parse(raw) as QuestionPrefill;
    if (!v || typeof v.question !== "string" || v.spreadId !== spreadId) return null;
    if (Date.now() - (v.at ?? 0) > MAX_AGE_MS) return null;
    return v;
  } catch {
    return null;
  }
}
