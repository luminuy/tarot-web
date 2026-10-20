/**
 * ภาพไพ่ประดับประจำหมวด `/spreads/topic/*` — ใช้ทั้งภาพย่อผัง (`TopicSpreadList`) และกล่อง/แผงของหน้าหมวด
 * ⚠️ เป็นภาพประดับตามความหมายดั้งเดิมของไพ่ ไม่ใช่ผลสุ่มหรือคำทำนาย (กฎเหล็ก 14)
 *    ชุดละ ≥ 7 ใบ > ผังใหญ่สุดของหมวด (6 ใบ) ➔ ใบไม่ซ้ำในผังเดียว
 */
export const TOPIC_DECK: Record<string, readonly string[]> = {
  love: ["major-06", "cups-02", "cups-10", "major-03", "major-17", "cups-01", "major-19"],
  career: ["major-07", "wands-03", "pentacles-08", "major-01", "wands-06", "pentacles-03", "major-21"],
  money: ["pentacles-01", "pentacles-10", "major-10", "pentacles-07", "major-19", "pentacles-09", "wands-06"],
  health: ["major-14", "major-17", "major-19", "cups-04", "major-11", "wands-04", "major-21"],
  family: ["cups-10", "pentacles-10", "major-03", "wands-04", "cups-06", "major-04", "major-19"],
  study: ["pentacles-08", "major-02", "major-05", "swords-01", "pentacles-03", "major-01", "major-17"],
};

/** ไพ่ n ใบจากชุดของหมวด เริ่มที่ตำแหน่ง `from` (วนรอบ) */
export function topicCards(topic: string, n: number, from = 0): string[] {
  const deck = TOPIC_DECK[topic] ?? TOPIC_DECK.love;
  return Array.from({ length: n }, (_, i) => deck[(from + i) % deck.length]);
}
