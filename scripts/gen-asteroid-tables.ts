/**
 * ☄️ สร้างตารางตำแหน่งดาวเคราะห์น้อย 4 ดวงหลัก (Ceres · Pallas · Juno · Vesta) สำหรับผังดวง `/natal-chart`
 * ===========================================================================
 * วิธีเดียวกับไครอน (`gen-chiron-table.ts`) แต่ทุก 5 วัน — ดาวเคราะห์น้อยอยู่ใกล้โลกกว่า ช่วงถอยหลังเลี้ยวเร็วกว่า
 * (Pallas มีละติจูดสุริยวิถีสูงถึง ±50 องศา ลองจิจูดจึงเปลี่ยนเร็วเป็นช่วง ๆ)
 * ที่มา: NASA JPL Horizons · ลองจิจูดสุริยวิถีปรากฏ ณ วันนั้น มองจากโลก · ค.ศ. 1899-12 ถึง 2101-02
 *
 * รัน: `NODE_USE_ENV_PROXY=1 npx tsx scripts/gen-asteroid-tables.ts` (ต้องต่อเน็ต · เครื่องที่มีพร็อกซีต้องใส่ตัวแปรนั้น)
 * ผลลัพธ์: `src/lib/astro/asteroid-tables.ts` (ห้ามแก้มือ) — โหลดแบบ dynamic import เมื่อผู้ใช้เปิด "แสดงดาวเคราะห์น้อย" เท่านั้น
 */
import fs from "node:fs";
import path from "node:path";

const START = "1899-12-01";
const STOP = "2101-02-01";
const STEP_DAYS = 5;
const BODIES = [
  { key: "ceres", command: "1;" },
  { key: "pallas", command: "2;" },
  { key: "juno", command: "3;" },
  { key: "vesta", command: "4;" },
] as const;

async function fetchLons(command: string): Promise<number[]> {
  const params = new URLSearchParams({
    format: "text",
    COMMAND: `'${command}'`,
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
  const body = (await res.text()).split("$$SOE")[1]?.split("$$EOE")[0];
  if (!body) throw new Error("ไม่พบช่วงข้อมูล $$SOE/$$EOE");
  const lons = body
    .trim()
    .split("\n")
    .map((line) => Number.parseFloat(line.split(",")[3]));
  if (lons.some((v) => !Number.isFinite(v))) throw new Error("มีแถวที่อ่านลองจิจูดไม่ได้");
  return lons;
}

function encode(lons: number[]): string {
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
  return centi.map((v, i) => (i === 0 ? v : v - centi[i - 1])).join(",");
}

async function main() {
  const startJd = Date.parse(`${START}T00:00:00Z`) / 86400000 + 2440587.5;
  let out = `/**
 * ☄️ ตารางตำแหน่งดาวเคราะห์น้อย — ไฟล์สร้างอัตโนมัติจาก \`scripts/gen-asteroid-tables.ts\` ห้ามแก้มือ
 * ที่มา: NASA JPL Horizons (ObsEcLon ลองจิจูดสุริยวิถีปรากฏ ณ วันนั้น มองจากโลก) · ${START} ถึง ${STOP} ทุก ${STEP_DAYS} วัน (UT)
 * ค่าแรก = ลองจิจูด × 100 · ค่าถัดไป = ส่วนต่างจากจุดก่อนหน้า (หน่วย 1/100 องศา)
 */
export const ASTEROID_START_JD_UT = ${startJd};
export const ASTEROID_STEP_DAYS = ${STEP_DAYS};
`;
  for (const b of BODIES) {
    const lons = await fetchLons(b.command);
    out += `export const ${b.key.toUpperCase()}_DELTAS = "${encode(lons)}";\n`;
    console.log(`${b.key}: ${lons.length} จุด`);
  }
  const file = path.join(process.cwd(), "src/lib/astro/asteroid-tables.ts");
  fs.writeFileSync(file, out);
  console.log(`เขียน ${file} แล้ว (${out.length} ไบต์)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
