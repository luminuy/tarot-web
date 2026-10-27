/**
 * 🪐 ด่านผังดวงกำเนิด (`/natal-chart`) — ตัวเลขต้องตรงฟ้าจริง
 * ===========================================================================
 *
 * ผังดวงคำนวณในเครื่องผู้ใช้ทั้งหมด ไม่มีเซิร์ฟเวอร์ช่วยตรวจ ➔ ผิดเมื่อไหร่ผู้ใช้เห็นทันทีเมื่อเทียบกับเว็บอื่น
 * ด่านนี้จึงตรวจกับ "ของจริง" ไม่ใช่กับค่าที่โค้ดเราเคยคำนวณไว้:
 *
 * 1. ตำแหน่งดาว 10 ดวง + ไครอน เทียบ NASA JPL Horizons 10 วันที่ (ค.ศ. 1905–2090)
 *    (ลองจิจูดสุริยวิถีปรากฏ ณ วันนั้น มองจากศูนย์กลางโลก · ดึงด้วย API ของ Horizons เมื่อ 2026-10-27)
 * 2. ลัคนาต้องอยู่บนขอบฟ้าตะวันออกจริง · กลางฟ้าต้องอยู่บนเส้นเมริเดียนจริง (คำนวณมุมเงยย้อนกลับ)
 * 3. จุดเริ่มเรือน Placidus ต้องแบ่งส่วนโค้งกลางวัน/กลางคืนเป็นสามส่วนจริง (ตรวจด้วยมุมชั่วโมง ไม่ใช่สูตรเดิม)
 * 4. ที่เส้นศูนย์สูตร Placidus = Koch = Regiomontanus = Campanus (คุณสมบัติทางเรขาคณิต)
 * 5. เขตเวลาย้อนหลัง/เวลาออมแสง · ไม่รู้เวลาเกิด · ละติจูดขั้วโลก · ศักดิ์ดาว · รายชื่อจังหวัด
 * 6. กติกา island: ตัวคำนวณ (มีข้อมูลดาว ~50 KB) ต้องโหลดแบบ dynamic import เท่านั้น
 */
import fs from "node:fs";
import path from "node:path";
import {
  ascAt,
  computeHouses,
  computeNatalChart,
  dignitiesOf,
  mcAt,
  norm360,
  angularDistance,
  type NatalInput,
  type PlanetId,
} from "../../src/lib/astro/natal";
import { localToUtc, formatUtcOffset } from "../../src/lib/astro/timezone";
import { THAI_PROVINCES, WORLD_CITIES } from "../../src/data/natal/places";
import { assertNonEmptyCorpus } from "./lib/corpus";
import { searchCities, cityCount } from "../../src/lib/astro/city-search";
import { computeSynastry, nearMidpoint } from "../../src/lib/astro/synastry";
import { asteroidTables } from "../../src/lib/astro/asteroids";
import { computeProgressions, computeTransits, lunarReturn, solarReturn, transitCalendar } from "../../src/lib/astro/techniques";

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, hint = "") {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${hint ? `\n${hint}` : ""}`);
  }
}

/** ค่าอ้างอิงจาก JPL Horizons (QUANTITIES=31 ObsEcLon · CENTER=500@399 · TIME_TYPE=UT) */
const JPL: Array<{ utc: string } & Record<PlanetId | "chiron", number>> = [
  { utc: "1905-03-15T12:00Z", sun: 354.24564, moon: 97.75677, mercury: 359.37435, venus: 36.83262, mars: 233.20169, jupiter: 31.62245, saturn: 327.07714, uranus: 273.98312, neptune: 95.37182, pluto: 79.71461, chiron: 304.79276 },
  { utc: "1930-07-04T03:30Z", sun: 101.43209, moon: 203.68526, mercury: 88.45774, venus: 137.68472, mars: 52.65356, jupiter: 91.64326, saturn: 278.35584, uranus: 15.25252, neptune: 151.51349, pluto: 108.94699, chiron: 47.68585 },
  { utc: "1950-11-20T18:45Z", sun: 237.8838, moon: 15.79129, mercury: 248.69077, venus: 239.56552, mars: 280.98553, jupiter: 328.84091, saturn: 180.01032, uranus: 98.94314, neptune: 198.52161, pluto: 139.86089, chiron: 261.51271 },
  { utc: "1969-12-31T23:05Z", sun: 280.11734, moon: 190.22006, mercury: 298.99988, venus: 274.40519, mars: 342.20775, jupiter: 212.31978, saturn: 32.0625, uranus: 188.72017, neptune: 239.88469, pluto: 177.39221, chiron: 2.51974 },
  { utc: "1985-05-09T08:00Z", sun: 48.63916, moon: 289.58733, mercury: 23.3137, venus: 9.60743, mars: 68.94911, jupiter: 315.86588, saturn: 235.31049, uranus: 257.09528, neptune: 273.31198, pluto: 212.92281, chiron: 67.19663 },
  { utc: "1999-08-11T11:00Z", sun: 138.34767, moon: 138.27106, mercury: 120.15979, venus: 152.15705, mars: 226.8447, jupiter: 34.68089, saturn: 46.87648, uranus: 314.66923, neptune: 302.54703, pluto: 247.75369, chiron: 237.73854 },
  { utc: "2010-01-01T00:00Z", sun: 280.45115, moon: 103.24439, mercury: 288.99587, venus: 277.84996, mars: 138.81749, jupiter: 326.35884, saturn: 184.50657, uranus: 353.09007, neptune: 324.58208, pluto: 273.3088, chiron: 323.1153 },
  { utc: "2024-02-29T15:15Z", sun: 340.52355, moon: 216.06599, mercury: 341.63559, venus: 316.04173, mars: 312.63484, jupiter: 41.25209, saturn: 339.86863, uranus: 49.56889, neptune: 356.72718, pluto: 301.20639, chiron: 17.21553 },
  { utc: "2050-06-21T06:00Z", sun: 90.09734, moon: 112.25329, mercury: 91.53761, venus: 130.51663, mars: 323.23297, jupiter: 125.33722, saturn: 308.04363, uranus: 166.94918, neptune: 57.09416, pluto: 340.66711, chiron: 247.09872 },
  { utc: "2090-10-10T21:30Z", sun: 198.08024, moon: 42.72539, mercury: 207.82413, venus: 188.33328, mars: 134.70285, jupiter: 255.95439, saturn: 85.41243, uranus: 342.63402, neptune: 146.89162, pluto: 24.59082, chiron: 108.79249 },
];

function input(utcMs: number, over: Partial<NatalInput> = {}): NatalInput {
  return { utcMs, timeKnown: true, lat: 13.75, lon: 100.5, houseSystem: "placidus", nodeType: "true", orbScale: 1, ...over };
}

console.log("\n1) ตำแหน่งดาวเทียบ NASA JPL Horizons");
{
  let worst = 0;
  let worstMoon = 0;
  let worstChiron = 0;
  let where = "";
  for (const row of JPL) {
    const chart = computeNatalChart(input(Date.parse(row.utc)));
    for (const key of Object.keys(row) as Array<keyof typeof row>) {
      if (key === "utc") continue;
      const b = chart.bodies.find((x) => x.id === key);
      if (!b) {
        fail++;
        console.log(`  ✗ ไม่มี ${key} ในผัง ${row.utc}`);
        continue;
      }
      const err = angularDistance(b.lon, row[key] as number) * 3600;
      if (key === "moon") worstMoon = Math.max(worstMoon, err);
      else if (key === "chiron") worstChiron = Math.max(worstChiron, err);
      else if (err > worst) {
        worst = err;
        where = `${key} ${row.utc}`;
      }
    }
  }
  check(`ดาวเคราะห์ 9 ดวงคลาดไม่เกิน 30 ฟิลิปดา (แย่สุด ${worst.toFixed(1)}″ · ${where})`, worst <= 30);
  check(`ดวงจันทร์คลาดไม่เกิน 90 ฟิลิปดา (แย่สุด ${worstMoon.toFixed(1)}″)`, worstMoon <= 90);
  check(`ไครอนจากตาราง 10 วันคลาดไม่เกิน 36 ฟิลิปดา (แย่สุด ${worstChiron.toFixed(1)}″)`, worstChiron <= 36);
}

console.log("\n2) ลัคนา/กลางฟ้าอยู่บนขอบฟ้า/เมริเดียนจริง");
{
  const eps = 23.44;
  let worstAlt = 0;
  let worstHa = 0;
  let eastOk = true;
  for (const lat of [-40, -12, 0, 13.75, 35, 51.5, 60]) {
    for (let ramc = 0; ramc < 360; ramc += 15) {
      const asc = ascAt(ramc, lat, eps);
      const mc = mcAt(ramc, eps);
      const toEq = (lon: number) => {
        const r = Math.PI / 180;
        const ra = Math.atan2(Math.sin(lon * r) * Math.cos(eps * r), Math.cos(lon * r)) / r;
        const dec = Math.asin(Math.sin(eps * r) * Math.sin(lon * r)) / r;
        return { ra, dec };
      };
      const r = Math.PI / 180;
      const a = toEq(asc);
      const ha = (ramc - a.ra) * r;
      const alt = Math.asin(Math.sin(lat * r) * Math.sin(a.dec * r) + Math.cos(lat * r) * Math.cos(a.dec * r) * Math.cos(ha)) / r;
      worstAlt = Math.max(worstAlt, Math.abs(alt));
      // ทิศตะวันออก: มุมชั่วโมงติดลบ (ยังไม่ถึงเมริเดียน)
      if (Math.sin(ha) > 0) eastOk = false;
      const m = toEq(mc);
      worstHa = Math.max(worstHa, angularDistance(m.ra, ramc));
    }
  }
  check(`ลัคนามีมุมเงย 0 (แย่สุด ${worstAlt.toExponential(1)} องศา)`, worstAlt < 1e-6);
  check("ลัคนาอยู่ฝั่งตะวันออกเสมอ (ไม่ใช่จุดตก)", eastOk);
  check(`กลางฟ้ามีมุมชั่วโมง 0 (แย่สุด ${worstHa.toExponential(1)} องศา)`, worstHa < 1e-6);
}

console.log("\n3) Placidus แบ่งส่วนโค้งเป็นสามส่วนจริง");
{
  const eps = 23.44;
  const r = Math.PI / 180;
  let worst = 0;
  for (const lat of [-35, 0, 13.75, 40, 55]) {
    for (let ramc = 5; ramc < 360; ramc += 37) {
      const { cusps, used } = computeHouses("placidus", ramc, lat, eps);
      if (used !== "placidus") continue;
      const hourAngle = (lon: number) => {
        const ra = Math.atan2(Math.sin(lon * r) * Math.cos(eps * r), Math.cos(lon * r)) / r;
        const dec = Math.asin(Math.sin(eps * r) * Math.sin(lon * r)) / r;
        const sda = 90 + Math.asin(Math.tan(lat * r) * Math.tan(dec * r)) / r;
        // มุมชั่วโมงทิศตะวันออกเป็นลบ
        const ha = norm360(ramc - ra + 180) - 180;
        return { ha, sda };
      };
      const c11 = hourAngle(cusps[10]);
      const c12 = hourAngle(cusps[11]);
      const c2 = hourAngle(cusps[1]);
      const c3 = hourAngle(cusps[2]);
      worst = Math.max(
        worst,
        Math.abs(c11.ha + c11.sda / 3),
        Math.abs(c12.ha + (2 * c12.sda) / 3),
        // ใต้ขอบฟ้า: นับจากขอบฟ้าลงไปด้วยส่วนโค้งกลางคืน (180 − sda)
        Math.abs(-c2.ha - (c2.sda + (180 - c2.sda) / 3)),
        Math.abs(-c3.ha - (c3.sda + (2 * (180 - c3.sda)) / 3)),
      );
    }
  }
  check(`มุมชั่วโมงของจุดเริ่มเรือน 11 12 2 3 ตรงสัดส่วน (แย่สุด ${worst.toExponential(1)} องศา)`, worst < 1e-5);

  let eqWorst = 0;
  for (let ramc = 0; ramc < 360; ramc += 23) {
    const p = computeHouses("placidus", ramc, 0, eps).cusps;
    for (const sys of ["koch", "regiomontanus", "campanus"] as const) {
      const q = computeHouses(sys, ramc, 0, eps).cusps;
      for (let i = 0; i < 12; i++) eqWorst = Math.max(eqWorst, angularDistance(p[i], q[i]));
    }
  }
  check(`ที่เส้นศูนย์สูตร Placidus = Koch = Regiomontanus = Campanus (ต่างกันสุด ${eqWorst.toExponential(1)})`, eqWorst < 1e-6);

  let orderOk = true;
  for (const sys of ["placidus", "koch", "regiomontanus", "campanus", "porphyry", "equal", "whole"] as const) {
    for (const lat of [-45, 13.75, 52]) {
      for (let ramc = 0; ramc < 360; ramc += 29) {
        const c = computeHouses(sys, ramc, lat, eps).cusps;
        let total = 0;
        for (let i = 0; i < 12; i++) total += norm360(c[(i + 1) % 12] - c[i]);
        if (Math.abs(total - 360) > 1e-6) orderOk = false;
      }
    }
  }
  check("ทุกระบบเรือนเรียงจุดเริ่มเรือนวนครบรอบพอดี 360 องศา (ไม่มีเรือนกลับหัว)", orderOk);
}

console.log("\n4) ผังตัวอย่าง 1 ม.ค. 2513 06:05 กรุงเทพฯ");
{
  const { utcMs } = localToUtc("Asia/Bangkok", 1970, 1, 1, 6, 5);
  const c = computeNatalChart(input(utcMs));
  const get = (id: string) => c.bodies.find((b) => b.id === id)!;
  check("เวลาไทย 06:05 = UTC 23:05 ของวันก่อน", new Date(utcMs).toISOString() === "1969-12-31T23:05:00.000Z");
  check("ลัคนาราศีมังกร · กลางฟ้าราศีตุลย์", get("asc").sign === 9 && get("mc").sign === 6);
  check("ดวงอาทิตย์อยู่เรือน 1 (ก่อนพระอาทิตย์ขึ้น) และเป็นผังกลางคืน", get("sun").house === 1 && c.dayChart === false);
  check("ดาวเสาร์และพลูโตถอยหลัง", get("saturn").retrograde && get("pluto").retrograde && !get("jupiter").retrograde);
  check("มีอาทิตย์ตั้งฉากจันทร์ (orb ไม่ถึง 0.2 องศา)", c.aspects.some((a) => a.a === "sun" && a.b === "moon" && a.type === "square" && a.orb < 0.2));
  check("เจอกลุ่มดาว 3 ดวงในราศีมังกร", c.patterns.some((p) => p.type === "stellium-sign" && p.sign === 9));
  check("เจ้าเรือนลัคนา (มังกร) = ดาวเสาร์", c.chartRuler === "saturn");
  check(
    "โหนดจริงกับโหนดเฉลี่ยห่างกันไม่เกิน 2 องศา",
    angularDistance(get("node").lon, computeNatalChart(input(utcMs, { nodeType: "mean" })).bodies.find((b) => b.id === "node")!.lon) < 2,
  );
  check("โหนดใต้อยู่ตรงข้ามโหนดเหนือพอดี", Math.abs(angularDistance(get("node").lon, get("southNode").lon) - 180) < 1e-9);
  check("เวอร์เท็กซ์อยู่ครึ่งตะวันตกของผัง (เรือน 5–8)", [5, 6, 7, 8].includes(get("vertex").house ?? 0));
}

console.log("\n5) เขตเวลา · ไม่รู้เวลาเกิด · ขั้วโลก · ศักดิ์ดาว");
{
  const old = localToUtc("Asia/Bangkok", 1915, 6, 1, 12, 0);
  check(`ไทยก่อน พ.ศ. 2463 ใช้เวลาท้องถิ่นกรุงเทพฯ (${formatUtcOffset(old.offsetMinutes)})`, formatUtcOffset(old.offsetMinutes) === "UTC+6:42:04");
  check("นิวยอร์กหน้าร้อนใช้เวลาออมแสง UTC-4", localToUtc("America/New_York", 1990, 7, 4, 12, 0).offsetMinutes === -240);
  check("นิวยอร์กหน้าหนาว UTC-5", localToUtc("America/New_York", 1990, 1, 4, 12, 0).offsetMinutes === -300);

  const noon = localToUtc("Asia/Bangkok", 1970, 1, 1, 12, 0).utcMs;
  const u = computeNatalChart(
    input(noon, {
      timeKnown: false,
      dayStartUtcMs: localToUtc("Asia/Bangkok", 1970, 1, 1, 0, 0).utcMs,
      dayEndUtcMs: localToUtc("Asia/Bangkok", 1970, 1, 1, 23, 59).utcMs,
    }),
  );
  check("ไม่รู้เวลาเกิด: ไม่มีเรือน ลัคนา กลางฟ้า ส่วนแห่งโชค เวอร์เท็กซ์", !u.houses && !u.bodies.some((b) => ["asc", "mc", "fortune", "vertex"].includes(b.id)));
  check("ไม่รู้เวลาเกิด: มีช่วงที่ดวงจันทร์เดินในวันนั้น (ราว 12–15 องศา)", !!u.moonRange && norm360(u.moonRange.to - u.moonRange.from) > 11 && norm360(u.moonRange.to - u.moonRange.from) < 16);
  check("ไม่รู้เวลาเกิด: มุมสัมพันธ์ไม่มีลัคนา/กลางฟ้า", !u.aspects.some((a) => ["asc", "mc"].includes(a.a) || ["asc", "mc"].includes(a.b)));

  const polar = computeNatalChart(input(Date.UTC(1990, 5, 1, 12), { lat: 69.65, lon: 18.96 }));
  check("ละติจูดเกิน 66 องศา: Placidus เปลี่ยนเป็น Porphyry และแจ้งผู้ใช้", polar.houseSystemUsed === "porphyry" && polar.warnings.some((w) => w.code === "polar-house-fallback"));

  check("อาทิตย์ราศีสิงห์ = เกษตร · ราศีกุมภ์ = ประ", dignitiesOf("sun", 4).includes("domicile") && dignitiesOf("sun", 10).includes("detriment"));
  check("พุธราศีกันย์ = เกษตร + อุจจ์ · ราศีมีน = ประ + นิจ", dignitiesOf("mercury", 5).join() === "domicile,exaltation" && dignitiesOf("mercury", 11).join() === "detriment,fall");

  const out = computeNatalChart(input(Date.UTC(1890, 0, 1)));
  check("นอกช่วงตารางไครอน (ก่อน ค.ศ. 1900) แจ้งผู้ใช้ ไม่เดาค่า", !out.bodies.some((b) => b.id === "chiron") && out.warnings.some((w) => w.code === "chiron-out-of-range"));
}

console.log("\n6) รายชื่อสถานที่");
{
  check(`จังหวัดไทยครบ 77 (มี ${THAI_PROVINCES.length})`, THAI_PROVINCES.length === 77);
  check(
    "พิกัดทุกจังหวัดอยู่ในกรอบประเทศไทย",
    THAI_PROVINCES.every((p) => p.lat > 5.5 && p.lat < 20.6 && p.lon > 97.3 && p.lon < 105.7),
  );
  const ids = [...THAI_PROVINCES, ...WORLD_CITIES].map((p) => p.id);
  check("รหัสสถานที่ไม่ซ้ำกัน", new Set(ids).size === ids.length);
  let zonesOk = true;
  for (const c of WORLD_CITIES) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: c.zone });
    } catch {
      zonesOk = false;
      console.log(`    เขตเวลาไม่รู้จัก: ${c.zone}`);
    }
  }
  check("เขตเวลาของทุกเมืองเป็นชื่อ IANA ที่ใช้ได้", zonesOk);
}

console.log("\n6.5) เครื่องมือตามเวลา (ดาวจร · ปฏิทิน · ก้าวหน้า · รีเทิร์น)");
{
  const natal = computeNatalChart(input(Date.UTC(1969, 11, 31, 23, 5), { lat: 13.7525, lon: 100.4942 }));
  const sunN = natal.bodies.find((b) => b.id === "sun")!;
  const moonN = natal.bodies.find((b) => b.id === "moon")!;
  const sr = solarReturn(natal, 56, { lat: 13.7525, lon: 100.4942 });
  const srSun = sr.bodies.find((b) => b.id === "sun")!;
  check(`ผังวันเกิดปีที่ 56: ดวงอาทิตย์กลับมาที่องศาเดิม (ห่าง ${(angularDistance(srSun.lon, sunN.lon) * 3600).toFixed(2)}″)`, angularDistance(srSun.lon, sunN.lon) < 1 / 3600);
  const srDate = new Date(sr.input.utcMs);
  check("ผังวันเกิดปีที่ 56 ตกช่วงวันเกิดปี 2026 (31 ธ.ค. 2025 ถึง 2 ม.ค. 2026 UTC)", srDate >= new Date("2025-12-30") && srDate <= new Date("2026-01-02"));
  const after = Date.UTC(2026, 9, 27);
  const lr = lunarReturn(natal, after, { lat: 13.7525, lon: 100.4942 });
  const lrMoon = lr.bodies.find((b) => b.id === "moon")!;
  check(
    "ผังจันทร์คืน: ดวงจันทร์กลับองศาเดิม ภายใน 28 วันหลังวันที่เลือก",
    angularDistance(lrMoon.lon, moonN.lon) < 2 / 3600 && lr.input.utcMs > after && lr.input.utcMs - after < 28 * 86400000,
  );
  const prog = computeProgressions(natal, Date.UTC(2026, 9, 27));
  check(`ดาวก้าวหน้า: อายุ ${prog.age.toFixed(2)} ปี (ควรราว 56.8) · Solar Arc ราว 1 องศาต่อปี`, Math.abs(prog.age - 56.82) < 0.02 && prog.solarArc > 50 && prog.solarArc < 62);
  check("ดาวก้าวหน้าไม่นับดาวเดินช้ากุมตัวเอง", !prog.aspects.some((a) => a.t === a.n && ["jupiter", "saturn", "uranus", "neptune", "pluto"].includes(a.t)));
  const tr = computeTransits(natal, Date.UTC(2026, 9, 27, 5));
  const satSq = tr.aspects.find((a) => a.t === "saturn" && a.n === "sun" && a.type === "square");
  check(
    "ดาวจร: เสาร์จรจตุโกณอาทิตย์เกิดมีช่วงเวลาและวันตรงพอดีอยู่ในช่วงนั้น",
    !!satSq?.period && satSq.period.exact.every((x) => x >= satSq.period!.start && x <= satSq.period!.end) && satSq.period.start <= tr.utcMs && satSq.period.end >= tr.utcMs,
  );
  check("ดาวจร: orb ทุกมุมไม่เกินเกณฑ์", tr.aspects.every((a) => a.orb <= a.maxOrb + 1e-9));
  const cal = transitCalendar(natal, Date.UTC(2026, 9, 27), 365);
  let calOk = cal.length > 0;
  for (const e of cal) {
    if (e.kind !== "exact") continue;
    // ณ วันที่ของเหตุการณ์ ดาวจรต้องห่างจากมุมพอดีไม่เกินระยะที่เดินได้ใน 1 วัน
    const t = computeTransits(natal, e.utcMs, 3).aspects.find((a) => a.t === e.t && a.n === e.n && a.type === e.type);
    if (!t || t.orb > 0.5) calOk = false;
  }
  check(`ปฏิทินดาวจร: ทุกวันที่ "ตรงพอดี" ตรงจริงเมื่อคำนวณซ้ำ (${cal.filter((e) => e.kind === "exact").length} เหตุการณ์)`, calOk);
}

console.log("\n6.6) ค้นหาเมืองทั่วโลก + ผังที่บันทึกไว้");
{
  check(`ฐานข้อมูลเมืองมีมากกว่า 30,000 เมือง (มี ${cityCount()})`, cityCount() > 30000);
  const hy = searchCities("หาดใหญ่", 3)[0];
  check("พิมพ์ไทย \"หาดใหญ่\" เจอ Hat Yai เขตเวลา Asia/Bangkok", hy?.name === "Hat Yai" && hy.zone === "Asia/Bangkok");
  check("พิมพ์ไทย \"เชียง\" เมืองไทยขึ้นก่อนเมืองต่างประเทศ", searchCities("เชียง", 1)[0]?.country === "TH");
  const sp = searchCities("springfield, illinois", 3);
  check("\"springfield, illinois\" กรองด้วยรัฐได้", sp.length > 0 && sp.every((c) => c.admin === "Illinois"));
  check("ไม่สนเครื่องหมายเสียง (\"sao paulo\" เจอ São Paulo)", searchCities("sao paulo", 1)[0]?.name === "São Paulo");
  let zonesOk = true;
  for (const c of searchCities("a", 200).concat(searchCities("san", 200))) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: c.zone });
    } catch {
      zonesOk = false;
    }
  }
  check("เขตเวลาของเมืองที่สุ่มตรวจเป็นชื่อ IANA ที่ใช้ได้", zonesOk);

  const app = fs.readFileSync(path.join(process.cwd(), "src/components/natal/NatalChartApp.tsx"), "utf8");
  const saveCalls = app.match(/\bsaveChart\(/g)?.length ?? 0;
  const handleSave = app.match(/function handleSave\(\)[\s\S]*?\n  \}/)?.[0] ?? "";
  check("บันทึกผังลงเครื่องเกิดจากปุ่มที่ผู้ใช้กดเท่านั้น (saveChart อยู่ใน handleSave ที่เดียว)", saveCalls === 1 && handleSave.includes("saveChart("));
  const savedSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/astro/saved-charts.ts"), "utf8");
  check("ผังที่บันทึกใช้คีย์จากทะเบียน (STORAGE_KEYS.natalCharts)", savedSrc.includes("STORAGE_KEYS.natalCharts") && !/fetch\(/.test(savedSrc));
}

console.log("\n6.7) ผังคู่ (Synastry + Composite)");
{
  check("จุดกึ่งกลางที่ใกล้กว่า: 350 กับ 10 = 0 (ไม่ใช่ 180)", Math.abs(nearMidpoint(350, 10)) < 1e-9 || Math.abs(nearMidpoint(350, 10) - 360) < 1e-9);
  check("จุดกึ่งกลาง 280 กับ 112 = 196 (ข้ามทางสั้น)", Math.abs(nearMidpoint(280, 112) - 196) < 1e-9);
  const A = computeNatalChart(input(Date.UTC(1969, 11, 31, 23, 5)));
  const B = computeNatalChart(input(Date.UTC(1972, 6, 15, 3, 30), { lat: 18.79, lon: 98.98 }));
  const s1 = computeSynastry(A, B);
  const s2 = computeSynastry(B, A);
  check("มุมระหว่างผังนับเท่ากันไม่ว่าใครเป็น A หรือ B", s1.aspects.length === s2.aspects.length);
  check("orb ทุกมุมอยู่ในเกณฑ์", s1.aspects.every((a) => a.orb <= a.maxOrb + 1e-9));
  check("ไม่นับดาวนอกกับดาวนอก (คนรุ่นเดียวกันได้มุมเดียวกันทุกคู่)", !s1.aspects.some((a) => ["uranus", "neptune", "pluto"].includes(a.a) && ["uranus", "neptune", "pluto"].includes(a.b)));
  check("คะแนนทุกหมวดอยู่ระหว่าง 0 ถึง 10", s1.categories.every((c) => c.score >= 0 && c.score <= 10));
  const cSun = s1.composite.bodies.find((b) => b.id === "sun")!;
  check("ดวงอาทิตย์ของผังรวม = จุดกึ่งกลางของสองคน", Math.abs(cSun.lon - nearMidpoint(A.bodies[0].lon, B.bodies[0].lon)) < 1e-9);
  check("ผังรวมมีเรือนวนครบ 360 องศาเมื่อรู้เวลาเกิดทั้งคู่", !!s1.composite.houses && Math.abs(s1.composite.houses.reduce((t, c, i, arr) => t + norm360(arr[(i + 1) % 12] - c), 0) - 360) < 1e-6);
  check("ดาวของอีกคนตกเรือนของเรา: ครบทุกดวง", (s1.bInA?.length ?? 0) >= 11 && s1.bInA!.every((o) => o.house >= 1 && o.house <= 12));
}

console.log("\n6.8) ดาวเคราะห์น้อย 4 ดวงเทียบ NASA JPL (จุดนอกตาราง = ทดสอบการประมาณค่า)");
{
  // ค่าอ้างอิง JPL Horizons ที่ 10 วันที่เดียวกับข้อ 1 (ดึง 2026-10-27 · COMMAND 1; 2; 3; 4;)
  const REF: Record<"ceres" | "pallas" | "juno" | "vesta", number[]> = {
    ceres: [320.3504029, 115.599879, 274.517975, 321.1057935, 76.7194536, 129.0495597, 244.5611232, 277.5899255, 131.1930413, 67.4714565],
    pallas: [306.047522, 82.2543312, 255.9921731, 298.056139, 29.345847, 86.1543845, 217.7821596, 245.6769841, 82.2472703, 331.1140262],
    juno: [10.007117, 303.1047475, 220.9918255, 304.6611657, 177.6122917, 237.1662883, 4.4290425, 164.4401416, 154.269212, 226.3660548],
    vesta: [185.475055, 150.4434404, 40.5523521, 146.1226568, 204.0655485, 171.9349804, 156.6282598, 83.306946, 166.1615417, 224.5441655],
  };
  const tables = asteroidTables();
  let worst = 0;
  let where = "";
  JPL.forEach((row, i) => {
    const chart = computeNatalChart(input(Date.parse(row.utc), { asteroids: tables }));
    for (const id of Object.keys(REF) as (keyof typeof REF)[]) {
      const b = chart.bodies.find((x) => x.id === id);
      const err = b ? angularDistance(b.lon, REF[id][i]) * 3600 : Infinity;
      if (err > worst) {
        worst = err;
        where = `${id} ${row.utc}`;
      }
    }
  });
  check(`ดาวเคราะห์น้อยคลาดจาก JPL ไม่เกิน 60 ฟิลิปดา (แย่สุด ${worst.toFixed(1)}″ · ${where})`, worst <= 60);
  const off = computeNatalChart(input(Date.UTC(1990, 0, 1)));
  check("ไม่เปิดตัวเลือก = ไม่มีดาวเคราะห์น้อยในผัง", !off.bodies.some((b) => ["ceres", "pallas", "juno", "vesta"].includes(b.id)));
  const natalSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/astro/natal.ts"), "utf8");
  check("ตัวคำนวณหลักไม่ import ตารางดาวเคราะห์น้อย (โหลดแยกเมื่อผู้ใช้เปิดเท่านั้น)", !/from\s+["']\.\/asteroid-tables["']|from\s+["']\.\/asteroids["']/.test(natalSrc));
}

console.log("\n7) กติกา island — ตัวคำนวณ/คำอธิบาย/ผลผังโหลดแบบ dynamic import เท่านั้น");
{
  const root = process.cwd();
  const entry = path.join(root, "src/components/natal/NatalChartApp.tsx");
  const files = [
    entry,
    path.join(root, "src/components/natal/CitySearch.tsx"),
    ...fs
      .readdirSync(path.join(root, "astro/islands"))
      .map((f) => path.join(root, "astro/islands", f)),
  ].filter((f) => fs.existsSync(f) && /\.(tsx?|astro)$/.test(f));
  assertNonEmptyCorpus("ไฟล์ island + ฟอร์มผังดวง", files, "ต้องเจออย่างน้อย NatalChartApp.tsx และ astro/islands/*");
  // ของหนักที่ห้ามติดบันเดิลแรกของหน้า: ตัวคำนวณดาว (~50 KB) · ตารางไครอน · คำอธิบายสองภาษา · ผลผังทั้งหมด
  const heavy = /^\s*import\s+(?!type\b)[^;]*from\s+["'](@\/lib\/astro\/natal(-text)?|astronomy-engine|@\/lib\/astro\/chiron-table|@\/data\/natal\/content|\.\/NatalResult|\.\/NatalWheel|@\/components\/natal\/(NatalResult|NatalWheel)|@\/data\/natal\/cities-world|@\/lib\/astro\/city-search|@\/lib\/astro\/asteroids|@\/lib\/astro\/asteroid-tables)["']/m;
  const offenders = files.filter((f) => heavy.test(fs.readFileSync(f, "utf8")));
  check(
    "ไฟล์ island และหน้าฟอร์มผังดวงไม่ import ของหนักแบบ static",
    offenders.length === 0,
    offenders.map((f) => `    ${path.relative(root, f)}`).join("\n"),
  );
  const resultSrc = fs.readFileSync(path.join(root, "src/components/natal/NatalResult.tsx"), "utf8");
  check(
    "แท็บตามเวลาและผังคู่โหลดแบบ React.lazy (ผลผังเกิดไม่ลาก techniques/synastry มาด้วย)",
    /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalTimeTools["']\s*\)\s*\)/.test(resultSrc) &&
      /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalSynastry["']\s*\)\s*\)/.test(resultSrc) &&
      !/^\s*import\s+(?!type\b)[^;]*from\s+["'](@\/lib\/astro\/(techniques|synastry)|\.\/(NatalTimeTools|NatalSynastry))["']/m.test(resultSrc),
  );
  const src = fs.existsSync(entry) ? fs.readFileSync(entry, "utf8") : "";
  check("ฟอร์มโหลดตัวคำนวณด้วย import() ตอนกดสร้างผัง", /import\(\s*["']@\/lib\/astro\/natal["']\s*\)/.test(src));
  check("ผลผังโหลดแบบ React.lazy", /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalResult["']\s*\)\s*\)/.test(src));
  check(
    "ข้อมูลวันเกิดไม่ออกจากเครื่อง (ฟอร์มไม่ยิง fetch · ไม่เขียน localStorage/URL)",
    !/\bfetch\(|localStorage|sessionStorage|history\.(push|replace)State|location\.search/.test(
      src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""),
    ),
  );
}

console.log(`\n📊 สรุป: ผ่าน ${pass} · ตก ${fail}`);
if (fail > 0) process.exit(1);
console.log("✅ ผังดวงกำเนิดตรงฟ้าจริง: ดาวเทียบ JPL · ลัคนา/เรือนตรวจด้วยเรขาคณิต · เขตเวลาย้อนหลัง · ตัวคำนวณไม่ถ่วงบันเดิล");
