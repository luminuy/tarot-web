/**
 * ฟังก์ชันบริสุทธิ์ ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และแดชบอร์ดแอดมิน (client)
 * แยกออกจาก read.ts เพราะ read.ts ดึง getAppDB (node:sqlite) — ถ้า client import read.ts บิลด์จะล้ม
 */

/** แยก metric ที่มี prefix (เช่น "spread:") ออกมาเป็น { ค่าหลัง prefix: count } เรียงมากไปน้อย */
export function breakdown(
  source: Record<string, number>,
  prefix: string,
): Array<{ key: string; count: number }> {
  return Object.entries(source)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, count]) => ({ key: k.slice(prefix.length), count }))
    .sort((a, b) => b.count - a.count);
}
