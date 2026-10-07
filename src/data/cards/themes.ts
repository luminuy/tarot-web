/**
 * ✦ แก่นเรื่อง (theme) ของไพ่ 78 ใบ — แยกหัวตั้ง/กลับหัว
 * ---------------------------------------------------------------------------
 * ใช้หา "ไพ่ที่ชี้เรื่องเดียวกัน" ในผัง (`src/lib/tarot/relations.ts`) และสถิติสมุดดวง
 * ไม่ใช่ความหมายเต็มของไพ่ — เป็นป้ายหยาบ 1–3 ป้ายต่อทิศ เพื่อจับกลุ่มเท่านั้น
 *
 * ⚠️ สถานะ: ร่างโดยทีมพัฒนาจากสารานุกรมในบ้าน (`meanings` ของแต่ละใบ)
 *    ต้องให้แม่หมอใน Marketplace ตรวจก่อนใช้กับ prompt (แผน REFLECTION_JOURNAL_PLAN 1.1)
 *    ตอนนี้ใช้แสดงผลให้ผู้ใช้เห็นเท่านั้น ไม่ได้ส่งเข้า prompt
 * ⚠️ ห้ามให้ AI สร้าง/เติมตารางนี้ — แก้ด้วยมือและผ่านคนตรวจ
 */

export const THEME_IDS = [
  "beginning",
  "ending",
  "change",
  "decision",
  "bond",
  "conflict",
  "success",
  "stillness",
  "inner",
  "security",
  "illusion",
  "healing",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEME_LABEL: Record<ThemeId, { th: string; en: string }> = {
  beginning: { th: "การเริ่มต้น", en: "Beginnings" },
  ending: { th: "การจบและปล่อยวาง", en: "Endings & release" },
  change: { th: "การเปลี่ยนแปลง", en: "Change" },
  decision: { th: "ทางเลือกและการตัดสินใจ", en: "Choices & decisions" },
  bond: { th: "ความสัมพันธ์", en: "Relationships" },
  conflict: { th: "แรงเสียดทาน", en: "Friction" },
  success: { th: "ความสำเร็จ", en: "Achievement" },
  stillness: { th: "การรอและหยุดนิ่ง", en: "Waiting & pause" },
  inner: { th: "การทบทวนภายใน", en: "Inner reflection" },
  security: { th: "ความมั่นคงและเงิน", en: "Security & money" },
  illusion: { th: "ความกลัวและภาพลวง", en: "Fear & illusion" },
  healing: { th: "การฟื้นตัว", en: "Healing" },
};

type Pair = readonly [upright: readonly ThemeId[], reversed: readonly ThemeId[]];

export const CARD_THEMES: Readonly<Record<string, Pair>> = {
  // ── Major Arcana ──
  "major-00": [["beginning", "change"], ["illusion", "stillness"]],
  "major-01": [["beginning", "success"], ["illusion"]],
  "major-02": [["inner"], ["illusion"]],
  "major-03": [["security", "bond"], ["stillness"]],
  "major-04": [["security", "success"], ["conflict"]],
  "major-05": [["bond", "security"], ["conflict", "change"]],
  "major-06": [["bond", "decision"], ["conflict", "decision"]],
  "major-07": [["success", "change"], ["stillness", "conflict"]],
  "major-08": [["healing", "inner"], ["illusion", "inner"]],
  "major-09": [["inner", "stillness"], ["stillness"]],
  "major-10": [["change"], ["stillness"]],
  "major-11": [["decision"], ["conflict"]],
  "major-12": [["stillness", "inner"], ["stillness", "decision"]],
  "major-13": [["ending", "change"], ["stillness"]],
  "major-14": [["healing"], ["conflict"]],
  "major-15": [["illusion", "bond"], ["ending", "healing"]],
  "major-16": [["change", "ending"], ["illusion", "stillness"]],
  "major-17": [["healing"], ["illusion"]],
  "major-18": [["illusion", "inner"], ["healing", "decision"]],
  "major-19": [["success"], ["stillness"]],
  "major-20": [["decision", "change"], ["inner"]],
  "major-21": [["ending", "success"], ["stillness"]],
  // ── Wands (ไฟ) ──
  "wands-01": [["beginning"], ["stillness"]],
  "wands-02": [["decision"], ["stillness"]],
  "wands-03": [["beginning", "change"], ["stillness"]],
  "wands-04": [["bond", "success"], ["conflict"]],
  "wands-05": [["conflict"], ["healing"]],
  "wands-06": [["success"], ["illusion"]],
  "wands-07": [["conflict"], ["stillness"]],
  "wands-08": [["change"], ["stillness"]],
  "wands-09": [["conflict"], ["stillness"]],
  "wands-10": [["stillness"], ["ending", "healing"]],
  "wands-11": [["beginning"], ["stillness"]],
  "wands-12": [["change"], ["conflict"]],
  "wands-13": [["success"], ["illusion"]],
  "wands-14": [["success"], ["conflict"]],
  // ── Cups (น้ำ) ──
  "cups-01": [["beginning", "bond"], ["stillness", "inner"]],
  "cups-02": [["bond"], ["conflict"]],
  "cups-03": [["bond", "success"], ["conflict"]],
  "cups-04": [["stillness", "inner"], ["beginning"]],
  "cups-05": [["ending"], ["healing"]],
  "cups-06": [["inner", "bond"], ["beginning"]],
  "cups-07": [["illusion", "decision"], ["decision"]],
  "cups-08": [["ending", "change"], ["stillness"]],
  "cups-09": [["success"], ["illusion"]],
  "cups-10": [["bond", "success"], ["conflict"]],
  "cups-11": [["beginning"], ["illusion"]],
  "cups-12": [["bond"], ["illusion"]],
  "cups-13": [["healing", "inner"], ["illusion"]],
  "cups-14": [["healing"], ["conflict"]],
  // ── Swords (ลม) ──
  "swords-01": [["decision", "beginning"], ["illusion"]],
  "swords-02": [["decision", "stillness"], ["illusion"]],
  "swords-03": [["ending"], ["healing"]],
  "swords-04": [["healing", "stillness"], ["beginning"]],
  "swords-05": [["conflict"], ["healing"]],
  "swords-06": [["change", "healing"], ["stillness"]],
  "swords-07": [["illusion"], ["decision"]],
  "swords-08": [["illusion", "stillness"], ["healing", "change"]],
  "swords-09": [["illusion"], ["healing"]],
  "swords-10": [["ending"], ["healing"]],
  "swords-11": [["beginning"], ["conflict"]],
  "swords-12": [["change"], ["conflict"]],
  "swords-13": [["decision"], ["conflict"]],
  "swords-14": [["decision"], ["conflict"]],
  // ── Pentacles (ดิน) ──
  "pentacles-01": [["beginning", "security"], ["stillness"]],
  "pentacles-02": [["decision"], ["stillness"]],
  "pentacles-03": [["bond", "success"], ["conflict"]],
  "pentacles-04": [["security", "stillness"], ["ending"]],
  "pentacles-05": [["security"], ["healing"]],
  "pentacles-06": [["bond", "security"], ["conflict"]],
  "pentacles-07": [["stillness"], ["conflict"]],
  "pentacles-08": [["success"], ["stillness"]],
  "pentacles-09": [["security", "success"], ["illusion"]],
  "pentacles-10": [["security", "bond"], ["conflict"]],
  "pentacles-11": [["beginning"], ["stillness"]],
  "pentacles-12": [["security"], ["stillness"]],
  "pentacles-13": [["security", "healing"], ["conflict"]],
  "pentacles-14": [["security", "success"], ["illusion"]],
};

/** แก่นเรื่องของไพ่ตามทิศ — ไม่พบรหัสไพ่ = อาร์เรย์ว่าง (ไม่เดาแทน · กฎเหล็กข้อ 14) */
export function themesOf(cardId: string, isReversed: boolean): readonly ThemeId[] {
  const pair = CARD_THEMES[cardId];
  if (!pair) return [];
  return isReversed ? pair[1] : pair[0];
}
