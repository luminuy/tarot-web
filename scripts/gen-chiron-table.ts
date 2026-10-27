/**
 * 🪐 สร้างตารางตำแหน่งไครอน (Chiron · 2060) สำหรับผังดวงกำเนิด `/natal-chart`
 * ===========================================================================
 *
 * ไลบรารีคำนวณดาว (`astronomy-engine`) ไม่มีไครอน ➔ ดึงตำแหน่งจริงจาก NASA JPL Horizons
 * (ลองจิจูดสุริยวิถีปรากฏ ณ วันนั้น มองจากโลก · ทุก 10 วัน · ค.ศ. 1899-12 ถึง 2101-02)
 * แล้วเก็บเป็นสตริงส่วนต่างทีละช่อง หน่วย 1/100 องศา ใน `src/lib/astro/chiron-table.ts`
 * ตัวคำนวณประมาณค่าระหว่างจุดด้วยพหุนามกำลังสาม (คลาดเคลื่อนต่ำกว่า 0.01 องศา)
 *
 * รัน: `npx tsx scripts/gen-chiron-table.ts` (ต้องต่อเน็ต) — ไม่ต้องรันซ้ำ เว้นแต่จะขยายช่วงปี
 */
import fs from "node:fs";
import path from "node:path";

const START = "1899-12-01";
const STOP = "2101-02-01";
const STEP_DAYS = 10;

async function main() {
  const params = new URLSearchParams({
    format: "text",
    COMMAND: "'2060'",
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'500@399'",
    START_TIME: `'${START}'`,
    STOP_TIME: `'${STOP}'`,
    STEP_SIZE: `'${STEP_DAYS} d'`,
    QUANTITIES: "'31'",
    CSV_FORMAT: "'YES'",
    TIME_TYPE: "'UT'",
  });
  const res = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`);
  if (!res.ok) throw new Error(`Horizons ตอบ ${res.status}`);
  const text = await res.text();
  const body = text.split("$$SOE")[1]?.split("$$EOE")[0];
  if (!body) throw new Error("ไม่พบช่วงข้อมูล $$SOE/$$EOE ในคำตอบของ Horizons");
  const lons = body
    .trim()
    .split("\n")
    .map((line) => Number.parseFloat(line.split(",")[3]));
  if (lons.some((v) => !Number.isFinite(v))) throw new Error("มีแถวที่อ่านลองจิจูดไม่ได้");

  // คลี่มุมให้ต่อเนื่อง (ข้าม 360 ➔ 0 ไม่กระโดด) แล้วเก็บเป็นส่วนต่างหน่วย 1/100 องศา
  const centi: number[] = [];
  let prev = lons[0];
  let acc = lons[0];
  for (const lon of lons) {
    let d = lon - prev;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    acc += d;
    prev = lon;
    centi.push(Math.round(acc * 100));
  }
  const deltas = centi.map((v, i) => (i === 0 ? v : v - centi[i - 1]));
  const startJd = Date.parse(`${START}T00:00:00Z`) / 86400000 + 2440587.5;

  const out = `/**
 * 🪐 ตารางตำแหน่งไครอน — ไฟล์สร้างอัตโนมัติจาก \`scripts/gen-chiron-table.ts\` ห้ามแก้มือ
 * ที่มา: NASA JPL Horizons (2060 Chiron · ObsEcLon ลองจิจูดสุริยวิถีปรากฏ ณ วันนั้น มองจากโลก)
 * ช่วง ${START} ถึง ${STOP} ทุก ${STEP_DAYS} วัน (เวลา UT) · ${lons.length} จุด
 */
export const CHIRON_START_JD_UT = ${startJd};
export const CHIRON_STEP_DAYS = ${STEP_DAYS};
/** ค่าแรก = ลองจิจูด × 100 · ค่าถัดไป = ส่วนต่างจากจุดก่อนหน้า (หน่วย 1/100 องศา) */
export const CHIRON_DELTAS = "${deltas.join(",")}";
`;
  const file = path.join(process.cwd(), "src/lib/astro/chiron-table.ts");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  console.log(`เขียน ${file} แล้ว (${lons.length} จุด · ${out.length} ไบต์)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
