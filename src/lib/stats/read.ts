import { kvGetJSON } from "@/lib/platform/kv-store";
import { getAppDB } from "@/lib/platform/db";
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

function addInto(target: Record<string, number>, src: Record<string, number> | null | undefined) {
  if (!src) return;
  for (const [k, v] of Object.entries(src)) target[k] = (target[k] ?? 0) + v;
}

async function readD1Counters(days: string[]): Promise<Map<string, Record<string, number>>> {
  const out = new Map<string, Record<string, number>>();
  try {
    const db = await getAppDB();
    const keys = [...days, "all"];
    const { results } = await db
      .prepare(`SELECT day, metric, n FROM stat_counters WHERE day IN (${keys.map(() => "?").join(",")})`)
      .bind(...keys)
      .all<{ day: string; metric: string; n: number }>();
    for (const row of results || []) {
      const doc = out.get(row.day) ?? {};
      doc[row.metric] = (doc[row.metric] ?? 0) + Number(row.n);
      out.set(row.day, doc);
    }
  } catch {
    // D1 ใช้ไม่ได้ — ยังเห็นยอดจาก KV
  }
  return out;
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

  // ยอดจากตาราง D1 (ที่เก็บหลักตั้งแต่ A2-16) รวมกับยอดเก่าบน KV
  const fromD1 = await readD1Counters(days);
  addInto(allTime, fromD1.get("all"));

  const range: Record<string, number> = {};
  const daily: Record<string, Record<string, number>> = {};
  days.forEach((d, i) => {
    const doc: Record<string, number> = { ...(dayDocs[i] ?? {}) };
    addInto(doc, fromD1.get(d));
    daily[d] = doc;
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
