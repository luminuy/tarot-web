/**
 * เลือก "ผัง/บทความใกล้เคียง" แบบหมุนวนตามตำแหน่งของหน้าปัจจุบัน
 *
 * ทำไมไม่ใช้ `.filter(...).slice(0, n)` ตรง ๆ: ทุกหน้าในหมวดเดียวกันจะได้ n ตัวแรกชุดเดิมเสมอ
 * ตัวท้ายหมวดไม่เคยได้ลิงก์จากพี่น้องเลย — วัดจริง 2026-10-16: `/spreads/weekly` `/spreads/year-ahead`
 * มีลิงก์เข้าแค่ 2 หน้าทั้งเว็บ ส่วนผังหัวหมวดได้ 231 หน้า ➔ Google ค้างไว้ที่ "พบแล้ว - ยังไม่ได้จัดทำดัชนี"
 *
 * วิธีนี้เริ่มจากตัวถัดจากหน้าปัจจุบันแล้ววนกลับต้นลิสต์ ทุกตัวในหมวดที่มีมากกว่า `limit`
 * จึงได้ลิงก์เข้าจากพี่น้องครบ `limit` หน้าเท่ากัน (ด่าน test-seo-wave4 เฝ้าอยู่)
 */
function rotatingNeighbors<T>(
  list: readonly T[],
  isCurrent: (item: T) => boolean,
  limit: number,
): T[] {
  const i = list.findIndex(isCurrent);
  const rotated = i === -1 ? [...list] : [...list.slice(i + 1), ...list.slice(0, i)];
  return rotated.slice(0, limit);
}

/**
 * หมุนวนในกลุ่มเดียวกันก่อน (ไม่เกิน `maxSameGroup`) แล้วเติมที่เหลือด้วยตัวถัดไปของทั้งลิสต์
 * ช่องที่เติมจากทั้งลิสต์ทำให้ตัวที่อยู่กลุ่มเดียว (เช่นผัง `family`) ยังได้ลิงก์จากตัวก่อนหน้าเสมอ
 */
export function rotatingNeighborsGrouped<T>(
  list: readonly T[],
  isCurrent: (item: T) => boolean,
  sameGroup: (item: T) => boolean,
  limit: number,
  maxSameGroup = limit,
): T[] {
  const others = rotatingNeighbors(list, isCurrent, list.length);
  const near = others.filter(sameGroup).slice(0, maxSameGroup);
  const rest = others.filter((item) => !near.includes(item));
  return [...near, ...rest].slice(0, limit);
}
