#!/usr/bin/env tsx
/**
 * 📏 อ่าน INP ผู้ใช้จริงพร้อมตัวการจาก Cloudflare Analytics Engine (dataset `seertarot_rum`)
 * ===========================================================================
 *
 *   npm run cf:inp-stats            # 28 วันล่าสุด (ช่วงเดียวกับ CrUX)
 *   npm run cf:inp-stats -- 7       # 7 วันล่าสุด
 *
 * ต้องมี env: CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN ที่มีสิทธิ์ **Account · Account Analytics · Read**
 * (token เดียวกับ `npm run cf:call-stats` ได้)
 *
 * ⚠️ dataset เก็บ **เฉพาะหน้าที่ INP ≥ 200 ms** (ตัวเก็บไม่ส่งหน้าที่เร็ว — ประหยัดคำขอ)
 *    ตัวเลขในนี้จึงตอบว่า "การแตะที่ช้า ช้าเพราะอะไร" ไม่ใช่ p75 ของทั้งเว็บ (p75 ทั้งเว็บดูที่ CrUX/PSI)
 * ความหมายคอลัมน์ดูที่หัวไฟล์ `src/lib/observability/inp-metrics.ts`
 * ทุกตัวเลขถ่วงด้วย `_sample_interval` — Analytics Engine อาจสุ่มเก็บเมื่อข้อมูลเยอะ
 */

export {};

const DATASET = "seertarot_rum";
const days = Math.max(1, Math.min(90, Number(process.argv[2]) || 28));
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

type Row = {
  route: string;
  target: string;
  event: string;
  fx: string;
  loaf: string;
  script: string;
  device: string;
  w: number;
  inp: number;
  input: number;
  proc: number;
  pres: number;
  style: number;
  render: number;
  early: number;
  mem: number;
  block: string;
  blockRem: number;
  blockStyle: number;
};

/** เปอร์เซ็นไทล์แบบถ่วงน้ำหนัก (คำนวณเองจากแถวดิบ — ไม่พึ่งฟังก์ชัน quantile ของ SQL) */
function quantile(rows: Row[], pick: (r: Row) => number, q: number): number {
  const xs = rows.map((r) => ({ v: pick(r), w: r.w })).filter((x) => x.v >= 0).sort((a, b) => a.v - b.v);
  const total = xs.reduce((a, x) => a + x.w, 0);
  if (total === 0) return -1;
  let acc = 0;
  for (const x of xs) {
    acc += x.w;
    if (acc >= total * q) return x.v;
  }
  return xs[xs.length - 1].v;
}

const p = (rows: Row[], pick: (r: Row) => number, q = 0.75) => {
  const v = quantile(rows, pick, q);
  return v < 0 ? "-" : `${Math.round(v)}`;
};
const weight = (rows: Row[]) => rows.reduce((a, r) => a + r.w, 0);
const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "-");

function groupBy(rows: Row[], key: (r: Row) => string): [string, Row[]][] {
  const map = new Map<string, Row[]>();
  for (const r of rows) {
    const k = key(r);
    const list = map.get(k);
    if (list) list.push(r);
    else map.set(k, [r]);
  }
  return [...map].sort((a, b) => weight(b[1]) - weight(a[1]));
}

function printPhases(label: string, rows: Row[]): void {
  console.log(
    `   ${label.padEnd(44).slice(0, 44)} ${String(Math.round(weight(rows))).padStart(5)} ครั้ง · INP p75 ${p(rows, (r) => r.inp).padStart(4)}` +
      ` · รอคิว ${p(rows, (r) => r.input)} · โค้ด ${p(rows, (r) => r.proc)} · รอวาด ${p(rows, (r) => r.pres)}` +
      ` (สไตล์+เลย์เอาต์ ${p(rows, (r) => r.style)} · วาดบนเธรดหลัก ${p(rows, (r) => r.render)})`,
  );
}

async function main(): Promise<void> {
  if (!TOKEN || !ACCOUNT_ID) {
    console.error("❌ ต้องตั้ง CLOUDFLARE_API_TOKEN (สิทธิ์ Account Analytics: Read) และ CLOUDFLARE_ACCOUNT_ID");
    process.exit(1);
  }

  const rows = (
    await sql<Row>(`
      SELECT blob1 AS route, blob2 AS target, blob3 AS event, blob4 AS fx, blob5 AS loaf, blob6 AS script, blob7 AS device,
        _sample_interval AS w, double1 AS inp, double2 AS input, double3 AS proc, double4 AS pres,
        double5 AS style, double6 AS render, double8 AS early, double9 AS mem,
        blob8 AS block, double11 AS blockRem, double12 AS blockStyle
      FROM ${DATASET}
      WHERE timestamp > NOW() - INTERVAL '${days}' DAY
      ORDER BY timestamp DESC
      LIMIT 20000
      FORMAT JSON`)
  ).map((r) => ({ ...r, w: Number(r.w) || 1 }));

  console.log(`\n📏 INP ผู้ใช้จริงที่ช้า (≥ 200 ms) · ${days} วันล่าสุด`);
  if (rows.length === 0) {
    console.log("ยังไม่มีข้อมูล — ยังไม่มีหน้าที่ช้าหลัง deploy หรือ binding RUM_METRICS ยังไม่ขึ้น");
    return;
  }
  const total = weight(rows);
  console.log(`   ทั้งหมด ${Math.round(total)} หน้า · INP p75 ${p(rows, (r) => r.inp)} ms · p95 ${p(rows, (r) => r.inp, 0.95)} ms`);
  console.log(`   แตะก่อนหน้าโหลดเสร็จ ${pct(weight(rows.filter((r) => r.early === 1)), total)}`);
  console.log("   (ช่วงเวลาเป็น p75 หน่วย ms · รอวาดที่เหลือหลังหัก \"วาดบนเธรดหลัก\" = งาน compositor/raster/GPU)\n");

  console.log("── แยกตามหน้า");
  for (const [route, rs] of groupBy(rows, (r) => r.route).slice(0, 12)) printPhases(route, rs);

  console.log("\n── จุดที่แตะ (หน้า · element · ชนิด event) — 15 อันดับแรก");
  for (const [key, rs] of groupBy(rows, (r) => `${r.route} ${r.target} ${r.event}`).slice(0, 15)) printPhases(key, rs);

  console.log("\n── ระดับเอฟเฟกต์ (data-fx)");
  for (const [fx, rs] of groupBy(rows, (r) => r.fx || "(ไม่มี)")) printPhases(fx, rs);

  console.log("\n── ชนิดเครื่อง");
  for (const [device, rs] of groupBy(rows, (r) => r.device).slice(0, 8)) printPhases(device, rs);

  console.log("\n── หน่วยความจำเครื่อง (GB · 0 = เบราว์เซอร์ไม่บอก)");
  for (const [mem, rs] of groupBy(rows, (r) => String(r.mem))) printPhases(`${mem} GB`, rs);

  const blocked = rows.filter((r) => r.blockRem >= 0);
  if (blocked.length) {
    console.log(`\n── ตัวขวางตอนนิ้วแตะ (เฟรมยาวที่กำลังรันอยู่ = ต้นเหตุของ "รอคิว") · เจอใน ${pct(weight(blocked), total)} ของหน้าที่ช้า`);
    for (const [script, rs] of groupBy(blocked, (r) => r.block || "(ไม่มีสคริปต์ = สไตล์/เลย์เอาต์/อนิเมชัน)").slice(0, 10)) {
      console.log(
        `   ${script.padEnd(44).slice(0, 44)} ${String(Math.round(weight(rs))).padStart(5)} ครั้ง · รอคิว p75 ${p(rs, (r) => r.input)}` +
          ` · เฟรมขวางเหลือ ${p(rs, (r) => r.blockRem)} · สไตล์+เลย์เอาต์ของเฟรมนั้น ${p(rs, (r) => r.blockStyle)}`,
      );
    }
  }

  const hits = rows.filter((r) => r.loaf === "hit" && r.script);
  if (hits.length) {
    console.log("\n── สคริปต์ที่กินเวลานานสุดในเฟรมของการแตะ (Long Animation Frames)");
    for (const [script, rs] of groupBy(hits, (r) => r.script).slice(0, 10)) printPhases(script, rs);
  }
  console.log(`\n   ข้อมูลเฟรมยาว: เจอ ${pct(weight(rows.filter((r) => r.loaf === "hit")), total)} · เบราว์เซอร์รองรับแต่เฟรมไม่ยาวพอ ${pct(weight(rows.filter((r) => r.loaf === "miss")), total)} · ไม่รองรับ ${pct(weight(rows.filter((r) => r.loaf === "none")), total)}`);
}

main().catch((err) => {
  console.error(`❌ อ่านสถิติไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
