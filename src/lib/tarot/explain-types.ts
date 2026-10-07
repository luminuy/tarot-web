/**
 * ✦ สัญญาข้อมูลของแผง "ทำไมแม่หมออ่านแบบนี้" + หลักฐานคำอ่าน (REFLECTION_JOURNAL_PLAN 1.2 · 1.6)
 * ไฟล์ชนิดข้อมูลล้วน — หน้าเว็บ import ได้โดยไม่ลากสำรับ/สารานุกรมเข้าบันเดิล
 */

export interface ExplainCard {
  order: number;
  cardId: string;
  name: string;
  /** ชื่ออังกฤษ (หน้าไทยใช้วงเล็บต่อท้าย) */
  nameEn: string;
  isReversed: boolean;
  keywords: string[];
  meaning: string;
  position: { name: string; meaning: string };
  themes: string[];
}

export interface ExplainResponse {
  cards: ExplainCard[];
  relations: {
    pairs: Array<{ a: number; b: number; kind: "support" | "tension" | "echo"; note: string; strength: number }>;
    clusters: Array<{ label: string; positions: number[] }>;
    signals: Array<{ id: string; note: string; positions: number[] }>;
  };
}

/** เฟรม SSE `basis` จาก `/api/reading/[id]/read` — บอกแค่ "ใช้/ไม่ใช้" ไม่มีเนื้อหาส่วนตัว */
export interface ReadingBasis {
  /** ความทรงจำแม่หมอ (คำอ่านที่บันทึกไว้) ถูกส่งเข้าคำอ่านรอบนี้ */
  history: boolean;
  /** ผู้ใช้เข้าสู่ระบบอยู่ */
  member: boolean;
  /** ผู้ใช้เล่ารายละเอียดเพิ่ม (สถานการณ์ · ความรู้สึก · สิ่งที่หวัง) */
  intake: boolean;
  /** ผู้ใช้พิมพ์คำถามเอง (ไม่ใช่คำถามภาพรวมที่ระบบเติมให้) */
  question: boolean;
}
