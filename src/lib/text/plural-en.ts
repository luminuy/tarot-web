/**
 * "1 card" / "2 cards" — ข้อความอังกฤษที่จำนวนเป็น 1 ได้ (ผังไพ่ 1 ใบ · ผังสร้างเอง · สถิติ)
 * B1: หน้าอังกฤษเคยขึ้น "1 cards" ในผังไพ่ใบเดียว
 */
export function cardsEn(n: number): string {
  return `${n} ${n === 1 ? "card" : "cards"}`;
}
