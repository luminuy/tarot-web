/**
 * 💪 ความแรงตามตัวเลขจริง — คนที่มีมุมเดียวกันแต่แนบไม่เท่ากันต้องได้คำอ่านต่างกัน (โค้ดล้วน ผลเดิมทุกครั้ง)
 * ---------------------------------------------------------------------------
 * เจ้าของ 2026-11-02 เลือก "ความแรงตามตัวเลขจริง": เดิมมุมตรีโกณที่ห่าง 0°10′ กับห่าง 6°50′ ได้ย่อหน้าเดียวกันทุกตัวอักษร
 * - มุม: เทียบ orb กับ orb สูงสุดของคู่นั้น (`maxOrb` จากตัวคำนวณ) ➔ แนบสนิท / ชัด / หลวม
 * - ดาวจรเดินเร็ว: orb แคบอยู่แล้ว (1.5–2.5 องศา) ➔ บอกเฉพาะเมื่อตรงพอดี (≤ 0.3 องศา)
 * เกณฑ์: แนบสนิท = orb ≤ 1 องศา หรือ ≤ 15% ของ orb สูงสุด · หลวม = เกิน 60% ของ orb สูงสุด
 */
import type { Lang } from "@/data/natal/content";
import { formatDegree } from "./natal";

export type AspectStrength = "exact" | "clear" | "loose";

export function aspectStrength(orb: number, maxOrb: number): AspectStrength {
  if (orb <= 1 || orb <= maxOrb * 0.15) return "exact";
  if (orb > maxOrb * 0.6) return "loose";
  return "clear";
}

/** ประโยคบอกความแรงของมุมในผังเกิด (ต่อท้ายคำอธิบายมุม) */
export function aspectStrengthNote(orb: number, maxOrb: number, lang: Lang): string {
  const s = aspectStrength(orb, maxOrb);
  const d = formatDegree(orb);
  if (lang === "th") {
    if (s === "exact") return `มุมนี้แนบสนิท (ห่าง ${d}) เป็นเรื่องที่คุณรู้สึกชัดที่สุดเรื่องหนึ่งในผัง และคนรอบตัวเห็นได้ชัด`;
    if (s === "loose") return `มุมนี้หลวม (ห่าง ${d}) ทำงานเป็นพื้นหลัง คุณรู้สึกได้เป็นพัก ๆ ไม่ใช่เรื่องหลักของผัง`;
    return `มุมนี้ชัด (ห่าง ${d}) คุณรู้สึกได้สม่ำเสมอ`;
  }
  if (s === "exact") return `This aspect is tight (${d} off exact): one of the things you feel most clearly, and others see it too.`;
  if (s === "loose") return `This aspect is wide (${d} off exact): it works in the background and shows up now and then, not as a main theme.`;
  return `This aspect is clear (${d} off exact): you feel it steadily.`;
}

/** ดาวจรเดินเร็วที่ตรงพอดี (≤ 0.3 องศา) = แรงที่สุดของวัน · ห่างกว่านั้นไม่ต้องบอก (มีตัวเลข orb แสดงอยู่แล้ว) */
export function transitExactNote(orb: number, lang: Lang): string | null {
  if (orb > 0.3) return null;
  return lang === "th" ? "ตรงพอดีตอนนี้ แรงที่สุดของวัน" : "exact now, at full strength";
}
