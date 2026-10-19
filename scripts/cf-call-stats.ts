#!/usr/bin/env tsx
/**
 * 📊 อ่านสถิติความเสถียรวิดีโอคอลแม่หมอจาก Cloudflare Analytics Engine (dataset `seertarot_calls`)
 * ===========================================================================
 *
 *   npm run cf:call-stats            # 30 วันล่าสุด
 *   npm run cf:call-stats -- 7       # 7 วันล่าสุด
 *
 * ต้องมี env: CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN ที่มีสิทธิ์ **Account · Account Analytics · Read**
 * (token ของ deploy ใน CI ไม่จำเป็นต้องมีสิทธิ์นี้ — สร้าง token อ่านอย่างเดียวแยกไว้ใช้เองได้)
 *
 * ความหมายคอลัมน์ดูที่หัวไฟล์ `src/lib/marketplace/call-metrics.ts`
 * ทุกตัวเลขคูณ `_sample_interval` — Analytics Engine อาจสุ่มเก็บเมื่อข้อมูลเยอะ ต้องถ่วงกลับเสมอ
 */

export {};

const DATASET = "seertarot_calls";
const days = Math.max(1, Math.min(90, Number(process.argv[2]) || 30));
const TOKEN = process.env.CLOUDFLARE_API_TOKEN?.trim();
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

async function sql<T>(query: string): Promise<T[]> {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: query,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return (JSON.parse(text) as { data: T[] }).data;
}

const pct = (n: number, d: number) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "-");
const sec = (ms: number) => (Number.isFinite(ms) && ms >= 0 ? `${(ms / 1000).toFixed(1)} วิ` : "-");

async function main(): Promise<void> {
  if (!TOKEN || !ACCOUNT_ID) {
    console.error("❌ ต้องตั้ง CLOUDFLARE_API_TOKEN (สิทธิ์ Account Analytics: Read) และ CLOUDFLARE_ACCOUNT_ID");
    process.exit(1);
  }
  const where = `WHERE timestamp > NOW() - INTERVAL '${days}' DAY`;

  type Row = {
    role: string;
    outcome: string;
    n: number;
    connected_ms: number;
    first_ms_sum: number;
    first_n: number;
    auto: number;
    manual: number;
    recov: number;
    drops: number;
    good: number;
    fair: number;
    weak: number;
  };
  const rows = await sql<Row>(`
    SELECT blob1 AS role, blob2 AS outcome,
      SUM(_sample_interval) AS n,
      SUM(_sample_interval * double2) AS connected_ms,
      SUM(IF(double1 >= 0, _sample_interval * double1, 0)) AS first_ms_sum,
      SUM(IF(double1 >= 0, _sample_interval, 0)) AS first_n,
      SUM(_sample_interval * double3) AS auto,
      SUM(_sample_interval * double4) AS manual,
      SUM(_sample_interval * double5) AS recov,
      SUM(_sample_interval * double7) AS drops,
      SUM(_sample_interval * double8) AS good,
      SUM(_sample_interval * double9) AS fair,
      SUM(_sample_interval * double10) AS weak
    FROM ${DATASET} ${where}
    GROUP BY role, outcome
    FORMAT JSON`);

  console.log(`\n📊 สถิติวิดีโอคอล ${days} วันล่าสุด (นับจากสรุปสายของแต่ละฝั่ง)\n`);
  if (rows.length === 0) {
    console.log("ยังไม่มีข้อมูล — ยังไม่มีสายจริงหลัง deploy หรือ binding CALL_METRICS ยังไม่ขึ้น");
    return;
  }

  for (const role of ["customer", "reader"]) {
    const rs = rows.filter((r) => r.role === role).map((r) => ({ ...r, n: Number(r.n) }));
    if (rs.length === 0) continue;
    const total = rs.reduce((a, r) => a + r.n, 0);
    const by = (o: string) => rs.find((r) => r.outcome === o)?.n ?? 0;
    const attempted = total - by("peer-absent");
    const sum = (k: keyof Row) => rs.reduce((a, r) => a + Number(r[k]), 0);
    const q = sum("good") + sum("fair") + sum("weak");
    console.log(`── ฝั่ง${role === "customer" ? "ลูกค้า" : "แม่หมอ"} · ${total} ครั้งที่เข้าห้อง (อีกฝั่งไม่มา ${by("peer-absent")})`);
    console.log(`   ต่อติดตลอดไม่หลุด     ${by("clean")} (${pct(by("clean"), attempted)})`);
    console.log(`   หลุดแล้วกลับมาติดได้    ${by("recovered")} (${pct(by("recovered"), attempted)})`);
    console.log(`   หลุดแล้วไม่กลับมา      ${by("dropped")} (${pct(by("dropped"), attempted)})`);
    console.log(`   ต่ออัตโนมัติจนหมดเพดาน ${by("gave-up")} (${pct(by("gave-up"), attempted)})`);
    console.log(`   ต่อไม่ติดเลย          ${by("never-connected")} (${pct(by("never-connected"), attempted)})`);
    console.log(`   เวลาจนต่อติดครั้งแรก (เฉลี่ย) ${sec(sum("first_ms_sum") / sum("first_n"))}`);
    console.log(`   เวลาคุยรวม ${(sum("connected_ms") / 3_600_000).toFixed(1)} ชม.`);
    console.log(`   หลุด ${sum("drops")} ครั้ง · กลับมาติด ${sum("recov")} ครั้ง · ต่อใหม่อัตโนมัติ ${sum("auto")} · กดเอง ${sum("manual")}`);
    console.log(`   คุณภาพสาย: ดี ${pct(sum("good"), q)} · พอใช้ ${pct(sum("fair"), q)} · อ่อน ${pct(sum("weak"), q)}\n`);
  }

  const devices = await sql<{ role: string; device: string; n: number; bad: number }>(`
    SELECT blob1 AS role, blob3 AS device, SUM(_sample_interval) AS n,
      SUM(IF(blob2 IN ('dropped', 'gave-up', 'never-connected'), _sample_interval, 0)) AS bad
    FROM ${DATASET} ${where} AND blob2 != 'peer-absent'
    GROUP BY role, device
    ORDER BY n DESC
    FORMAT JSON`);
  console.log("── แยกตามเครื่อง (สายที่มีปัญหา = หลุดไม่กลับ / หมดเพดาน / ต่อไม่ติด)");
  for (const d of devices) {
    console.log(`   ${d.role.padEnd(8)} ${d.device.padEnd(18)} ${String(d.n).padStart(4)} สาย · มีปัญหา ${pct(Number(d.bad), Number(d.n))}`);
  }
}

main().catch((err) => {
  console.error(`❌ อ่านสถิติไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
