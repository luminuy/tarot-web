import { kvGetJSON } from "@/lib/platform/kv-store";
import { flush, utcDay } from "@/lib/stats/record";

export interface StatsSnapshot {
  /** ผลรวมทุก metric ตั้งแต่เปิดระบบ */
  allTime: Record<string, number>;
  /** ผลรวม metric ในช่วง `rangeDays` วันล่าสุด */
  range: Record<string, number>;
  rangeDays: number;
  /** ตัวนับรายวัน metric ที่เลือก — สำหรับกราฟเส้น */
  daily: Record<string, Record<string, number>>;
  generatedAt: number;
}

function addInto(target: Record<string, number>, src: Record<string, number> | null) {
  if (!src) return;
  for (const [k, v] of Object.entries(src)) target[k] = (target[k] ?? 0) + v;
}

/** ดึงสถิติ — flush buffer ที่ค้างก่อน เพื่อให้ตัวเลขสดที่สุด */
export async function getStats(rangeDays = 30): Promise<StatsSnapshot> {
  await flush().catch(() => {});

  const days: string[] = [];
  const now = new Date();
  for (let i = 0; i < rangeDays; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(utcDay(d));
  }

  const [allTime, ...dayDocs] = await Promise.all([
    kvGetJSON<Record<string, number>>("app:stat:all").then((r) => r ?? {}),
    ...days.map((d) => kvGetJSON<Record<string, number>>(`app:stat:day:${d}`)),
  ]);

  const range: Record<string, number> = {};
  const daily: Record<string, Record<string, number>> = {};
  days.forEach((d, i) => {
    const doc = dayDocs[i];
    daily[d] = doc ?? {};
    addInto(range, doc);
  });

  return { allTime, range, rangeDays, daily, generatedAt: Date.now() };
}

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
