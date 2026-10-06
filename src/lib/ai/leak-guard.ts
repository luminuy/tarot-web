/**
 * 🛡️ ด่านขาออก: คำตอบของ AI ต้องไม่มีท่อนกติกาของระบบ (REFLECTION_JOURNAL_PLAN 1.14 · แทร็ก S)
 * ---------------------------------------------------------------------------
 * ด่านขาเข้า (`looksLikePromptInjection` · `looksLikeInstructionAttack`) จับได้ไม่ 100%
 * ถ้าคำสั่งฉีดหลุดเข้าไปแล้วโมเดล "เผย" กติกาของระบบออกมา — ด่านนี้จับที่ขาออก
 *
 * แทนที่จะยัดคำล่อสุ่มเพิ่มใน prompt (ทำให้ prompt ทุกรุ่นเปลี่ยน ต้องวัด ai:judge ใหม่)
 * เราใช้ **ลายนิ้วมือ** = ท่อนข้อความที่อยู่ใน system prompt จริงอยู่แล้ว และไม่มีเหตุผลที่คำอ่านไพ่ปกติจะพูดถึง
 * ด่าน `scripts/qa/test-ai-security.ts` ยืนยันว่าลายนิ้วมือทุกตัวยังอยู่ใน prompt ที่สร้างจริง
 * (แก้ prompt แล้วลายนิ้วมือหาย = ด่านตก ➔ ต้องอัปเดตรายการนี้ ไม่ใช่ปล่อยให้ด่านขาออกตาบอดเงียบ ๆ)
 *
 * เจอ ➔ ถือเป็นความผิดพลาดร้ายแรง (`PROMPT_LEAK` fatal) ลองโมเดลถัดไป/คำอ่านสำรอง + นับเหตุการณ์
 */

export const PROMPT_FINGERPRINTS: readonly string[] = [
  // ขอบเขตความเชื่อถือ (prompt-guard.ts) — มีในทุก prompt คำอ่าน
  "ขอบเขตความเชื่อถือ",
  "TRUST BOUNDARY",
  "user_profile",
  "context_details",
  // หัวบล็อกของ prompt คำอ่าน (prompt.ts)
  "Genuinely Drawn Cards",
  "Embody your resident persona",
  "ไพ่ที่ผู้ถามสุ่มเลือกหยิบได้จริง",
  "จงสวมบทบาทแม่หมอตามน้ำเสียงที่กำหนด",
];

/** คำทั่วไปที่ชี้ว่ากำลังเล่าถึงคำสั่งระบบ (ไม่จำเป็นต้องอยู่ใน prompt) */
export const LEAK_PHRASES: readonly string[] = ["system prompt", "system instruction", "คำสั่งระบบ", "พรอมต์ระบบ"];

const ALL = [...PROMPT_FINGERPRINTS, ...LEAK_PHRASES];
const LOWER = ALL.map((f) => f.toLowerCase());

/** คืนลายนิ้วมือตัวแรกที่เจอ (ไม่สนตัวพิมพ์เล็ก/ใหญ่) · ไม่เจอ = null */
export function detectPromptLeak(text: string): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  const i = LOWER.findIndex((f) => t.includes(f));
  return i >= 0 ? ALL[i] : null;
}

/** รวมค่าสตริงทั้งหมดในอ็อบเจกต์ (ไม่รวมชื่อคีย์) — ใช้ตรวจคำอ่าน JSON ทั้งก้อน */
export function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, out);
  else if (value && typeof value === "object") for (const v of Object.values(value)) collectStrings(v, out);
  return out;
}
