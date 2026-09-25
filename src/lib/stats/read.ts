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

/** อ่านก้อนตัวนับของวันที่ระบุ (KV เดิม + D1) — `docs` เรียงตามลำดับ `days` ที่ส่งเข้าไป */
async function readDayDocs(days: string[]): Promise<{ allTime: Record<string, number>; docs: Record<string, number>[] }> {
  const [allTime, ...dayDocs] = await Promise.all([
    kvGetJSON<Record<string, number>>("app:stat:all").then((r) => r ?? {}),
    ...days.map((d) => kvGetJSON<Record<string, number>>(`app:stat:day:${d}`).catch(() => null)),
  ]);

  // ยอดจากตาราง D1 (ที่เก็บหลักตั้งแต่ A2-16) รวมกับยอดเก่าบน KV
  const fromD1 = await readD1Counters(days);
  addInto(allTime, fromD1.get("all"));

  const docs = days.map((d, i) => {
    const doc: Record<string, number> = { ...(dayDocs[i] ?? {}) };
    addInto(doc, fromD1.get(d));
    return doc;
  });
  return { allTime, docs };
}

/** วันก่อนหน้าของคีย์วัน `YYYY-MM-DD` (ตามปฏิทิน UTC เดียวกับที่ตัวนับใช้) */
export function previousDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDay(d);
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

  const { allTime, docs } = await readDayDocs(days);

  const range: Record<string, number> = {};
  const daily: Record<string, Record<string, number>> = {};
  days.forEach((d, i) => {
    daily[d] = docs[i];
    addInto(range, docs[i]);
  });

  return { allTime, range, rangeDays, daily, generatedAt: Date.now() };
}

/**
 * ยอด "คำทำนายที่อ่านจบแล้ว" สะสมทั้งหมด — ตัวเลขเดียวที่หน้าแรกแสดงต่อสาธารณะ (แผนหน้าแรก ข้อ 3)
 * อ่านอย่างเดียว ไม่ `flush()` — เส้นที่เรียกถูกแคชที่ขอบ ต่างจากแผงแอดมินที่ต้องการตัวเลขสดที่สุด
 * อ่านไม่ได้ทั้งสองแหล่ง = 0 (หน้าเว็บซ่อนตัวนับเองเมื่อยอดยังไม่ถึงเกณฑ์ ไม่มีวันแสดงเลขปลอม)
 */
export async function getPublicReadingTotal(): Promise<number> {
  const { allTime } = await readDayDocs([]);
  return Math.max(0, Math.floor(Number(allTime.reading_completed ?? 0)));
}

export interface DayActivity {
  /** บัญชีสมาชิกที่สร้างในวันนั้น */
  newUsers: number | null;
  /** ความเห็นจากผู้ใช้ที่ส่งเข้ามาในวันนั้น */
  feedback: number | null;
  /** คะแนนเฉลี่ย (1–5) ของความเห็นที่ให้ดาว */
  avgRating: number | null;
}

export interface DayStats {
  day: string;
  prevDay: string;
  current: Record<string, number>;
  previous: Record<string, number>;
  activity: DayActivity;
  prevActivity: DayActivity;
  generatedAt: number;
}

/** ช่วงเวลา [เริ่ม, จบ) ของวัน UTC เป็นมิลลิวินาที — ใช้คัดแถว D1 ที่เก็บ `created_at` เป็น epoch ms */
function dayBounds(day: string): [number, number] {
  const start = Date.parse(`${day}T00:00:00Z`);
  return [start, start + 24 * 60 * 60 * 1000];
}

async function readDayActivity(day: string): Promise<DayActivity> {
  const [from, to] = dayBounds(day);
  const out: DayActivity = { newUsers: null, feedback: null, avgRating: null };
  let db;
  try {
    db = await getAppDB();
  } catch {
    return out;
  }
  // แต่ละตารางแยก try — ตารางไหนยังไม่ migrate ก็ยังเห็นอีกตาราง (null = อ่านไม่ได้ ไม่ใช่ 0)
  try {
    const r = await db
      .prepare("SELECT COUNT(*) AS n FROM users WHERE created_at >= ? AND created_at < ?")
      .bind(from, to)
      .first<{ n: number }>();
    out.newUsers = Number(r?.n ?? 0);
  } catch {
    /* ตาราง users ใช้ไม่ได้ */
  }
  try {
    const r = await db
      .prepare(
        "SELECT COUNT(*) AS n, AVG(rating) AS avg FROM user_feedback WHERE created_at >= ? AND created_at < ?",
      )
      .bind(from, to)
      .first<{ n: number; avg: number | null }>();
    out.feedback = Number(r?.n ?? 0);
    out.avgRating = r?.avg == null ? null : Math.round(Number(r.avg) * 10) / 10;
  } catch {
    /* ตาราง user_feedback ใช้ไม่ได้ */
  }
  return out;
}

/** สรุปของวันเดียว + วันก่อนหน้าไว้เทียบ — ใช้กับ "สรุปรายวัน" ที่เลือกวันได้ */
export async function getDayStats(day: string): Promise<DayStats> {
  await flush().catch(() => {});
  const prevDay = previousDay(day);
  const [{ docs }, activity, prevActivity] = await Promise.all([
    readDayDocs([day, prevDay]),
    readDayActivity(day),
    readDayActivity(prevDay),
  ]);
  return {
    day,
    prevDay,
    current: docs[0],
    previous: docs[1],
    activity,
    prevActivity,
    generatedAt: Date.now(),
  };
}

export { breakdown } from "@/lib/stats/breakdown";
