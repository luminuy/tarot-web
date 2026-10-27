/**
 * 🌏 สร้างฐานข้อมูลเมืองทั่วโลกสำหรับช่องค้นหาสถานที่เกิด (`/natal-chart`)
 * ===========================================================================
 *
 * ที่มา: GeoNames (CC BY 4.0 · ต้องให้เครดิตในหน้าเว็บ) — เมืองที่มีประชากรตั้งแต่ 15,000 คน
 *   curl -O https://download.geonames.org/export/dump/cities15000.zip && unzip cities15000.zip
 *   curl -O https://download.geonames.org/export/dump/admin1CodesASCII.txt
 *   npx tsx scripts/gen-cities.ts <โฟลเดอร์ที่มีสองไฟล์นั้น>
 *
 * ผลลัพธ์: `src/data/natal/cities-world.ts` (ห้ามแก้มือ) — โหลดแบบ dynamic import ตอนผู้ใช้เปิดช่องค้นหาเท่านั้น
 * ค้นหาในเครื่องผู้ใช้ ไม่ส่งคำค้น (ชื่อเมืองเกิด) ไปที่ไหน
 * ชื่อไทยดึงจาก alternatenames ที่เป็นอักษรไทย (มีราว 2,000 เมือง) · พิกัดปัด 2 ตำแหน่ง (ราว 1 กม. — ลัคนาเลื่อนไม่ถึง 0.02 องศา)
 */
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("ใช้: npx tsx scripts/gen-cities.ts <โฟลเดอร์ที่มี cities15000.txt และ admin1CodesASCII.txt>");
  process.exit(1);
}
const THAI = /[฀-๿]/;
const admin = new Map<string, string>();
for (const line of fs.readFileSync(path.join(dir, "admin1CodesASCII.txt"), "utf8").split("\n")) {
  const p = line.split("\t");
  if (p.length > 2) admin.set(p[0], p[2]);
}
interface Row {
  pop: number;
  name: string;
  th: string;
  cc: string;
  adm: string;
  lat: number;
  lon: number;
  zone: string;
}
const rows: Row[] = [];
for (const line of fs.readFileSync(path.join(dir, "cities15000.txt"), "utf8").split("\n")) {
  const f = line.split("\t");
  if (f.length < 18) continue;
  const alts = f[3] ? f[3].split(",") : [];
  rows.push({
    pop: Number(f[14] || 0),
    name: f[1].replace(/\|/g, " "),
    th: (alts.find((a) => THAI.test(a)) ?? "").replace(/\|/g, " "),
    cc: f[8],
    adm: admin.get(`${f[8]}.${f[10]}`) ?? "",
    lat: Math.round(Number(f[4]) * 100) / 100,
    lon: Math.round(Number(f[5]) * 100) / 100,
    zone: f[17],
  });
}
if (rows.length < 20000) throw new Error(`อ่านได้แค่ ${rows.length} เมือง — ไฟล์ไม่ครบ`);
// เรียงตามประเทศแล้วตามประชากร — แถวของประเทศเดียวกันอยู่ติดกัน บีบอัดได้ดีกว่าเรียงตามประชากรล้วนราว 20%
rows.sort((a, b) => a.cc.localeCompare(b.cc) || b.pop - a.pop);
/** ระดับประชากร (เลขหลักเดียว = log10 ปัดลง: 4 = หมื่น · 5 = แสน · 6 = ล้าน · 7 = สิบล้าน) ใช้จัดอันดับผลค้นหา */
const tier = (pop: number) => Math.max(4, Math.min(9, Math.floor(Math.log10(Math.max(pop, 1)))));
const zones = [...new Set(rows.map((r) => r.zone))].sort();
const admins = [...new Set(rows.map((r) => r.adm))].sort();
const zi = new Map(zones.map((z, i) => [z, i]));
const ai = new Map(admins.map((a, i) => [a, i]));
const body = rows.map((r) => `${r.name}|${r.th}|${r.cc}|${ai.get(r.adm)}|${r.lat}|${r.lon}|${zi.get(r.zone)}|${tier(r.pop)}`).join("\n");
const out = `/**
 * 🌏 เมืองทั่วโลก ${rows.length} เมือง — ไฟล์สร้างอัตโนมัติจาก \`scripts/gen-cities.ts\` ห้ามแก้มือ
 * ข้อมูล: GeoNames (https://www.geonames.org/) สัญญาอนุญาต CC BY 4.0 · เมืองประชากร 15,000 คนขึ้นไป · เรียงตามประเทศแล้วตามประชากร
 * แถว: ชื่อ|ชื่อไทย|รหัสประเทศ|ลำดับเขตปกครอง|ละติจูด|ลองจิจูด|ลำดับเขตเวลา|ระดับประชากร (log10)
 */
export const CITY_ZONES: readonly string[] = ${JSON.stringify(zones)};
export const CITY_ADMINS: readonly string[] = ${JSON.stringify(admins)};
export const CITY_ROWS = ${JSON.stringify(body)};
`;
fs.writeFileSync(path.join(process.cwd(), "src/data/natal/cities-world.ts"), out);
console.log(`เขียน src/data/natal/cities-world.ts แล้ว (${rows.length} เมือง · ${out.length} ไบต์)`);
