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
  lahiriAyanamsa,
  zodiacShift,
  type NatalInput,
  type PlanetId,
} from "../../src/lib/astro/natal";
import { Body, DefineStar, Ecliptic, GeoVector, MakeTime } from "astronomy-engine";
import { localToUtc, formatUtcOffset } from "../../src/lib/astro/timezone";
import { THAI_PROVINCES, WORLD_CITIES } from "../../src/data/natal/places";
import { assertNonEmptyCorpus } from "./lib/corpus";
import { searchCities, cityCount } from "../../src/lib/astro/city-search";
import { computeSynastry, nearMidpoint } from "../../src/lib/astro/synastry";
import { asteroidTables } from "../../src/lib/astro/asteroids";
import {
  computeProgressions,
  computeTransits,
  dailyOverview,
  lunarReturn,
  solarReturn,
  transitCalendar,
} from "../../src/lib/astro/techniques";
import { DAY_TONE_TEXT, MOON_PHASE_DAY_TEXT } from "../../src/data/natal/content";

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
  {
    utc: "1905-03-15T12:00Z",
    sun: 354.24564,
    moon: 97.75677,
    mercury: 359.37435,
    venus: 36.83262,
    mars: 233.20169,
    jupiter: 31.62245,
    saturn: 327.07714,
    uranus: 273.98312,
    neptune: 95.37182,
    pluto: 79.71461,
    chiron: 304.79276,
  },
  {
    utc: "1930-07-04T03:30Z",
    sun: 101.43209,
    moon: 203.68526,
    mercury: 88.45774,
    venus: 137.68472,
    mars: 52.65356,
    jupiter: 91.64326,
    saturn: 278.35584,
    uranus: 15.25252,
    neptune: 151.51349,
    pluto: 108.94699,
    chiron: 47.68585,
  },
  {
    utc: "1950-11-20T18:45Z",
    sun: 237.8838,
    moon: 15.79129,
    mercury: 248.69077,
    venus: 239.56552,
    mars: 280.98553,
    jupiter: 328.84091,
    saturn: 180.01032,
    uranus: 98.94314,
    neptune: 198.52161,
    pluto: 139.86089,
    chiron: 261.51271,
  },
  {
    utc: "1969-12-31T23:05Z",
    sun: 280.11734,
    moon: 190.22006,
    mercury: 298.99988,
    venus: 274.40519,
    mars: 342.20775,
    jupiter: 212.31978,
    saturn: 32.0625,
    uranus: 188.72017,
    neptune: 239.88469,
    pluto: 177.39221,
    chiron: 2.51974,
  },
  {
    utc: "1985-05-09T08:00Z",
    sun: 48.63916,
    moon: 289.58733,
    mercury: 23.3137,
    venus: 9.60743,
    mars: 68.94911,
    jupiter: 315.86588,
    saturn: 235.31049,
    uranus: 257.09528,
    neptune: 273.31198,
    pluto: 212.92281,
    chiron: 67.19663,
  },
  {
    utc: "1999-08-11T11:00Z",
    sun: 138.34767,
    moon: 138.27106,
    mercury: 120.15979,
    venus: 152.15705,
    mars: 226.8447,
    jupiter: 34.68089,
    saturn: 46.87648,
    uranus: 314.66923,
    neptune: 302.54703,
    pluto: 247.75369,
    chiron: 237.73854,
  },
  {
    utc: "2010-01-01T00:00Z",
    sun: 280.45115,
    moon: 103.24439,
    mercury: 288.99587,
    venus: 277.84996,
    mars: 138.81749,
    jupiter: 326.35884,
    saturn: 184.50657,
    uranus: 353.09007,
    neptune: 324.58208,
    pluto: 273.3088,
    chiron: 323.1153,
  },
  {
    utc: "2024-02-29T15:15Z",
    sun: 340.52355,
    moon: 216.06599,
    mercury: 341.63559,
    venus: 316.04173,
    mars: 312.63484,
    jupiter: 41.25209,
    saturn: 339.86863,
    uranus: 49.56889,
    neptune: 356.72718,
    pluto: 301.20639,
    chiron: 17.21553,
  },
  {
    utc: "2050-06-21T06:00Z",
    sun: 90.09734,
    moon: 112.25329,
    mercury: 91.53761,
    venus: 130.51663,
    mars: 323.23297,
    jupiter: 125.33722,
    saturn: 308.04363,
    uranus: 166.94918,
    neptune: 57.09416,
    pluto: 340.66711,
    chiron: 247.09872,
  },
  {
    utc: "2090-10-10T21:30Z",
    sun: 198.08024,
    moon: 42.72539,
    mercury: 207.82413,
    venus: 188.33328,
    mars: 134.70285,
    jupiter: 255.95439,
    saturn: 85.41243,
    uranus: 342.63402,
    neptune: 146.89162,
    pluto: 24.59082,
    chiron: 108.79249,
  },
];

function input(utcMs: number, over: Partial<NatalInput> = {}): NatalInput {
  return {
    utcMs,
    timeKnown: true,
    lat: 13.75,
    lon: 100.5,
    houseSystem: "placidus",
    nodeType: "true",
    orbScale: 1,
    ...over,
  };
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
      const alt =
        Math.asin(Math.sin(lat * r) * Math.sin(a.dec * r) + Math.cos(lat * r) * Math.cos(a.dec * r) * Math.cos(ha)) / r;
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
        Math.abs(-c3.ha - (c3.sda + (2 * (180 - c3.sda)) / 3))
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
  check(
    `ที่เส้นศูนย์สูตร Placidus = Koch = Regiomontanus = Campanus (ต่างกันสุด ${eqWorst.toExponential(1)})`,
    eqWorst < 1e-6
  );

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
  check(
    "มีอาทิตย์ตั้งฉากจันทร์ (orb ไม่ถึง 0.2 องศา)",
    c.aspects.some((a) => a.a === "sun" && a.b === "moon" && a.type === "square" && a.orb < 0.2)
  );
  check(
    "เจอกลุ่มดาว 3 ดวงในราศีมังกร",
    c.patterns.some((p) => p.type === "stellium-sign" && p.sign === 9)
  );
  check("เจ้าเรือนลัคนา (มังกร) = ดาวเสาร์", c.chartRuler === "saturn");
  check(
    "โหนดจริงกับโหนดเฉลี่ยห่างกันไม่เกิน 2 องศา",
    angularDistance(
      get("node").lon,
      computeNatalChart(input(utcMs, { nodeType: "mean" })).bodies.find((b) => b.id === "node")!.lon
    ) < 2
  );
  check(
    "โหนดใต้อยู่ตรงข้ามโหนดเหนือพอดี",
    Math.abs(angularDistance(get("node").lon, get("southNode").lon) - 180) < 1e-9
  );
  check("เวอร์เท็กซ์อยู่ครึ่งตะวันตกของผัง (เรือน 5–8)", [5, 6, 7, 8].includes(get("vertex").house ?? 0));
}

console.log("\n5) เขตเวลา · ไม่รู้เวลาเกิด · ขั้วโลก · ศักดิ์ดาว");
{
  const old = localToUtc("Asia/Bangkok", 1915, 6, 1, 12, 0);
  check(
    `ไทยก่อน พ.ศ. 2463 ใช้เวลาท้องถิ่นกรุงเทพฯ (${formatUtcOffset(old.offsetMinutes)})`,
    formatUtcOffset(old.offsetMinutes) === "UTC+6:42:04"
  );
  check(
    "นิวยอร์กหน้าร้อนใช้เวลาออมแสง UTC-4",
    localToUtc("America/New_York", 1990, 7, 4, 12, 0).offsetMinutes === -240
  );
  check("นิวยอร์กหน้าหนาว UTC-5", localToUtc("America/New_York", 1990, 1, 4, 12, 0).offsetMinutes === -300);

  const noon = localToUtc("Asia/Bangkok", 1970, 1, 1, 12, 0).utcMs;
  const u = computeNatalChart(
    input(noon, {
      timeKnown: false,
      dayStartUtcMs: localToUtc("Asia/Bangkok", 1970, 1, 1, 0, 0).utcMs,
      dayEndUtcMs: localToUtc("Asia/Bangkok", 1970, 1, 1, 23, 59).utcMs,
    })
  );
  check(
    "ไม่รู้เวลาเกิด: ไม่มีเรือน ลัคนา กลางฟ้า ส่วนแห่งโชค เวอร์เท็กซ์",
    !u.houses && !u.bodies.some((b) => ["asc", "mc", "fortune", "vertex"].includes(b.id))
  );
  check(
    "ไม่รู้เวลาเกิด: มีช่วงที่ดวงจันทร์เดินในวันนั้น (ราว 12–15 องศา)",
    !!u.moonRange && norm360(u.moonRange.to - u.moonRange.from) > 11 && norm360(u.moonRange.to - u.moonRange.from) < 16
  );
  check(
    "ไม่รู้เวลาเกิด: มุมสัมพันธ์ไม่มีลัคนา/กลางฟ้า",
    !u.aspects.some((a) => ["asc", "mc"].includes(a.a) || ["asc", "mc"].includes(a.b))
  );

  const polar = computeNatalChart(input(Date.UTC(1990, 5, 1, 12), { lat: 69.65, lon: 18.96 }));
  check(
    "ละติจูดเกิน 66 องศา: Placidus เปลี่ยนเป็น Porphyry และแจ้งผู้ใช้",
    polar.houseSystemUsed === "porphyry" && polar.warnings.some((w) => w.code === "polar-house-fallback")
  );

  check(
    "อาทิตย์ราศีสิงห์ = เกษตร · ราศีกุมภ์ = ประ",
    dignitiesOf("sun", 4).includes("domicile") && dignitiesOf("sun", 10).includes("detriment")
  );
  check(
    "พุธราศีกันย์ = เกษตร + อุจจ์ · ราศีมีน = ประ + นิจ",
    dignitiesOf("mercury", 5).join() === "domicile,exaltation" && dignitiesOf("mercury", 11).join() === "detriment,fall"
  );

  const out = computeNatalChart(input(Date.UTC(1890, 0, 1)));
  check(
    "นอกช่วงตารางไครอน (ก่อน ค.ศ. 1900) แจ้งผู้ใช้ ไม่เดาค่า",
    !out.bodies.some((b) => b.id === "chiron") && out.warnings.some((w) => w.code === "chiron-out-of-range")
  );
}

console.log("\n6) รายชื่อสถานที่");
{
  check(`จังหวัดไทยครบ 77 (มี ${THAI_PROVINCES.length})`, THAI_PROVINCES.length === 77);
  check(
    "พิกัดทุกจังหวัดอยู่ในกรอบประเทศไทย",
    THAI_PROVINCES.every((p) => p.lat > 5.5 && p.lat < 20.6 && p.lon > 97.3 && p.lon < 105.7)
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
  check(
    `ผังวันเกิดปีที่ 56: ดวงอาทิตย์กลับมาที่องศาเดิม (ห่าง ${(angularDistance(srSun.lon, sunN.lon) * 3600).toFixed(2)}″)`,
    angularDistance(srSun.lon, sunN.lon) < 1 / 3600
  );
  const srDate = new Date(sr.input.utcMs);
  check(
    "ผังวันเกิดปีที่ 56 ตกช่วงวันเกิดปี 2026 (31 ธ.ค. 2025 ถึง 2 ม.ค. 2026 UTC)",
    srDate >= new Date("2025-12-30") && srDate <= new Date("2026-01-02")
  );
  const after = Date.UTC(2026, 9, 27);
  const lr = lunarReturn(natal, after, { lat: 13.7525, lon: 100.4942 });
  const lrMoon = lr.bodies.find((b) => b.id === "moon")!;
  check(
    "ผังจันทร์คืน: ดวงจันทร์กลับองศาเดิม ภายใน 28 วันหลังวันที่เลือก",
    angularDistance(lrMoon.lon, moonN.lon) < 2 / 3600 &&
      lr.input.utcMs > after &&
      lr.input.utcMs - after < 28 * 86400000
  );
  const prog = computeProgressions(natal, Date.UTC(2026, 9, 27));
  check(
    `ดาวก้าวหน้า: อายุ ${prog.age.toFixed(2)} ปี (ควรราว 56.8) · Solar Arc ราว 1 องศาต่อปี`,
    Math.abs(prog.age - 56.82) < 0.02 && prog.solarArc > 50 && prog.solarArc < 62
  );
  check(
    "ดาวก้าวหน้าไม่นับดาวเดินช้ากุมตัวเอง",
    !prog.aspects.some((a) => a.t === a.n && ["jupiter", "saturn", "uranus", "neptune", "pluto"].includes(a.t))
  );
  const tr = computeTransits(natal, Date.UTC(2026, 9, 27, 5));
  const satSq = tr.aspects.find((a) => a.t === "saturn" && a.n === "sun" && a.type === "square");
  check(
    "ดาวจร: เสาร์จรจตุโกณอาทิตย์เกิดมีช่วงเวลาและวันตรงพอดีอยู่ในช่วงนั้น",
    !!satSq?.period &&
      satSq.period.exact.every((x) => x >= satSq.period!.start && x <= satSq.period!.end) &&
      satSq.period.start <= tr.utcMs &&
      satSq.period.end >= tr.utcMs
  );
  check(
    "ดาวจร: orb ทุกมุมไม่เกินเกณฑ์",
    tr.aspects.every((a) => a.orb <= a.maxOrb + 1e-9)
  );
  const cal = transitCalendar(natal, Date.UTC(2026, 9, 27), 365);
  let calOk = cal.length > 0;
  for (const e of cal) {
    if (e.kind !== "exact") continue;
    // ณ วันที่ของเหตุการณ์ ดาวจรต้องห่างจากมุมพอดีไม่เกินระยะที่เดินได้ใน 1 วัน
    const t = computeTransits(natal, e.utcMs, 3).aspects.find((a) => a.t === e.t && a.n === e.n && a.type === e.type);
    if (!t || t.orb > 0.5) calOk = false;
  }
  check(
    `ปฏิทินดาวจร: ทุกวันที่ "ตรงพอดี" ตรงจริงเมื่อคำนวณซ้ำ (${cal.filter((e) => e.kind === "exact").length} เหตุการณ์)`,
    calOk
  );
}

console.log("\n6.6) ค้นหาเมืองทั่วโลก + ผังที่บันทึกไว้");
{
  check(`ฐานข้อมูลเมืองมีมากกว่า 30,000 เมือง (มี ${cityCount()})`, cityCount() > 30000);
  const hy = searchCities("หาดใหญ่", 3)[0];
  check('พิมพ์ไทย "หาดใหญ่" เจอ Hat Yai เขตเวลา Asia/Bangkok', hy?.name === "Hat Yai" && hy.zone === "Asia/Bangkok");
  check('พิมพ์ไทย "เชียง" เมืองไทยขึ้นก่อนเมืองต่างประเทศ', searchCities("เชียง", 1)[0]?.country === "TH");
  const sp = searchCities("springfield, illinois", 3);
  check('"springfield, illinois" กรองด้วยรัฐได้', sp.length > 0 && sp.every((c) => c.admin === "Illinois"));
  check('ไม่สนเครื่องหมายเสียง ("sao paulo" เจอ São Paulo)', searchCities("sao paulo", 1)[0]?.name === "São Paulo");
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
  // saveChart มี 2 จุด และทั้งสองเป็นปุ่มที่ผู้ใช้กด: ปุ่มบันทึกผังของตัวเอง + ปุ่ม "บันทึกไว้ในเครื่องนี้" ของผังที่เพื่อนส่งมา
  check(
    "บันทึกผังลงเครื่องเกิดจากปุ่มที่ผู้ใช้กดเท่านั้น (handleSave + onSave ของผังจากเพื่อน)",
    saveCalls === 2 && handleSave.includes("saveChart(") && /onSave=\{\(spec\) => \{\s*const next = saveChart\(spec\)/.test(app)
  );
  const savedSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/astro/saved-charts.ts"), "utf8");
  check(
    "ผังที่บันทึกใช้คีย์จากทะเบียน (STORAGE_KEYS.natalCharts)",
    savedSrc.includes("STORAGE_KEYS.natalCharts") && !/fetch\(/.test(savedSrc)
  );
}

console.log("\n6.7) ผังคู่ (Synastry + Composite)");
{
  check(
    "จุดกึ่งกลางที่ใกล้กว่า: 350 กับ 10 = 0 (ไม่ใช่ 180)",
    Math.abs(nearMidpoint(350, 10)) < 1e-9 || Math.abs(nearMidpoint(350, 10) - 360) < 1e-9
  );
  check("จุดกึ่งกลาง 280 กับ 112 = 196 (ข้ามทางสั้น)", Math.abs(nearMidpoint(280, 112) - 196) < 1e-9);
  const A = computeNatalChart(input(Date.UTC(1969, 11, 31, 23, 5)));
  const B = computeNatalChart(input(Date.UTC(1972, 6, 15, 3, 30), { lat: 18.79, lon: 98.98 }));
  const s1 = computeSynastry(A, B);
  const s2 = computeSynastry(B, A);
  check("มุมระหว่างผังนับเท่ากันไม่ว่าใครเป็น A หรือ B", s1.aspects.length === s2.aspects.length);
  check(
    "orb ทุกมุมอยู่ในเกณฑ์",
    s1.aspects.every((a) => a.orb <= a.maxOrb + 1e-9)
  );
  check(
    "ไม่นับดาวนอกกับดาวนอก (คนรุ่นเดียวกันได้มุมเดียวกันทุกคู่)",
    !s1.aspects.some(
      (a) => ["uranus", "neptune", "pluto"].includes(a.a) && ["uranus", "neptune", "pluto"].includes(a.b)
    )
  );
  check(
    "คะแนนทุกหมวดอยู่ระหว่าง 0 ถึง 10",
    s1.categories.every((c) => c.score >= 0 && c.score <= 10)
  );
  const cSun = s1.composite.bodies.find((b) => b.id === "sun")!;
  check(
    "ดวงอาทิตย์ของผังรวม = จุดกึ่งกลางของสองคน",
    Math.abs(cSun.lon - nearMidpoint(A.bodies[0].lon, B.bodies[0].lon)) < 1e-9
  );
  check(
    "ผังรวมมีเรือนวนครบ 360 องศาเมื่อรู้เวลาเกิดทั้งคู่",
    !!s1.composite.houses &&
      Math.abs(s1.composite.houses.reduce((t, c, i, arr) => t + norm360(arr[(i + 1) % 12] - c), 0) - 360) < 1e-6
  );
  check(
    "ดาวของอีกคนตกเรือนของเรา: ครบทุกดวง",
    (s1.bInA?.length ?? 0) >= 11 && s1.bInA!.every((o) => o.house >= 1 && o.house <= 12)
  );
}

console.log("\n6.8) ดาวเคราะห์น้อย 4 ดวงเทียบ NASA JPL (จุดนอกตาราง = ทดสอบการประมาณค่า)");
{
  // ค่าอ้างอิง JPL Horizons ที่ 10 วันที่เดียวกับข้อ 1 (ดึง 2026-10-27 · COMMAND 1; 2; 3; 4;)
  const REF: Record<"ceres" | "pallas" | "juno" | "vesta", number[]> = {
    ceres: [
      320.3504029, 115.599879, 274.517975, 321.1057935, 76.7194536, 129.0495597, 244.5611232, 277.5899255, 131.1930413,
      67.4714565,
    ],
    pallas: [
      306.047522, 82.2543312, 255.9921731, 298.056139, 29.345847, 86.1543845, 217.7821596, 245.6769841, 82.2472703,
      331.1140262,
    ],
    juno: [
      10.007117, 303.1047475, 220.9918255, 304.6611657, 177.6122917, 237.1662883, 4.4290425, 164.4401416, 154.269212,
      226.3660548,
    ],
    vesta: [
      185.475055, 150.4434404, 40.5523521, 146.1226568, 204.0655485, 171.9349804, 156.6282598, 83.306946, 166.1615417,
      224.5441655,
    ],
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
  check(
    "ไม่เปิดตัวเลือก = ไม่มีดาวเคราะห์น้อยในผัง",
    !off.bodies.some((b) => ["ceres", "pallas", "juno", "vesta"].includes(b.id))
  );
  const natalSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/astro/natal.ts"), "utf8");
  check(
    "ตัวคำนวณหลักไม่ import ตารางดาวเคราะห์น้อย (โหลดแยกเมื่อผู้ใช้เปิดเท่านั้น)",
    !/from\s+["']\.\/asteroid-tables["']|from\s+["']\.\/asteroids["']/.test(natalSrc)
  );
}

console.log("\n6.9) ดวงวันนี้จากผังที่บันทึกไว้");
{
  const natal = computeNatalChart(input(Date.UTC(1969, 11, 31, 23, 5)));
  const at = Date.UTC(2026, 9, 28, 2);
  const d = dailyOverview(natal, at);
  const tr = computeTransits(natal, at);
  check(
    "ดวงจันทร์วันนี้ตรงกับดวงจันทร์ในแท็บดาวจร และมีเรือนของผังเกิด",
    d.moon.lon === tr.bodies.find((b) => b.id === "moon")!.lon && !!d.moon.house
  );
  check(
    "มุมของวัน: เดินเร็วไม่เกิน 4 · เดินช้าไม่เกิน 2 · เรียงจากแน่นไปหลวม",
    d.fast.length <= 4 && d.slow.length <= 2 && d.fast.every((a, i) => i === 0 || d.fast[i - 1].orb <= a.orb)
  );
  // ภาพรวมของวันต้องมาจากมุมที่แสดงจริง: ไม่มีมุมเดินเร็ว = ฟ้าเงียบเท่านั้น
  let toneOk = true;
  for (let k = 0; k < 30; k++) {
    const x = dailyOverview(natal, at + k * 86400000);
    if ((x.fast.length === 0) !== (x.tone === "quiet")) toneOk = false;
    if (!DAY_TONE_TEXT[x.tone] || !MOON_PHASE_DAY_TEXT[x.moonPhase]) toneOk = false;
  }
  check("30 วันติด: ภาพรวมของวันสอดคล้องกับมุมที่แสดง และมีข้อความครบทุกกรณี", toneOk);
  const full = dailyOverview(natal, Date.UTC(2026, 10, 24, 14));
  check("ข้างขึ้นข้างแรม: 24 พ.ย. 2026 เป็นจันทร์เต็มดวง", full.moonPhase === 4);
  const todaySrc = fs
    .readFileSync(path.join(process.cwd(), "src/components/natal/NatalToday.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  check(
    "ดวงวันนี้ไม่ยิง API ไม่เขียนที่เก็บ ไม่ใส่ URL และไม่สุ่มไพ่",
    !/\bfetch\(|localStorage|sessionStorage|history\.(push|replace)State|Math\.random/.test(todaySrc)
  );
}

console.log("\n6.10) ราศีนิรายนะแบบ Lahiri (ไทย/อินเดีย)");
{
  // ค่าอ้างอิง Swiss Ephemeris (SE_SIDM_LAHIRI) ณ J2000 = 23°51′25.5″
  check(
    "อายนางศ์ Lahiri ณ J2000 ตรง Swiss Ephemeris (คลาดไม่เกิน 1 ฟิลิปดา)",
    Math.abs(lahiriAyanamsa(2451545) - 23.85708) * 3600 < 1
  );
  // นิยามของ Lahiri (จิตราปักษ์): ดาวจิตรา (Spica) อยู่ราว 180 องศานิรายนะ
  DefineStar(Body.Star1, 13 + 25 / 60 + 11.579 / 3600, -(11 + 9 / 60 + 40.75 / 3600), 250);
  const spicaOk = ["1960-01-01T00:00Z", "2000-01-01T12:00Z", "2050-01-01T00:00Z"].every((d) => {
    const t = Date.parse(d);
    const sid = norm360(Ecliptic(GeoVector(Body.Star1, MakeTime(new Date(t)), true)).elon - zodiacShift("lahiri", t));
    return Math.abs(sid - 180) < 0.05;
  });
  check("ดาวจิตรา (Spica) อยู่ 180 องศานิรายนะ ±3 ลิปดา ทุกยุค", spicaOk);
  const at = Date.UTC(1969, 11, 31, 23, 5);
  const trop = computeNatalChart(input(at));
  const sid = computeNatalChart(input(at, { zodiac: "lahiri" }));
  const ay = zodiacShift("lahiri", at);
  check(
    "ทุกจุดในผังนิรายนะ = สายนะ ลบอายนางศ์ของขณะเกิด",
    trop.bodies.every((b) => {
      const s2 = sid.bodies.find((x) => x.id === b.id);
      return !!s2 && angularDistance(s2.lon, norm360(b.lon - ay)) < 1e-6;
    }) &&
      Math.abs(sid.ayanamsa - ay) < 1e-12 &&
      trop.ayanamsa === 0
  );
  check(
    "นิรายนะ: ดาวอยู่เรือนเดิมและมุมสัมพันธ์ชุดเดิม (เลื่อนทั้งผังเท่ากัน)",
    trop.bodies.every((b) => sid.bodies.find((x) => x.id === b.id)?.house === b.house) &&
      trop.aspects.length === sid.aspects.length &&
      sid.houses!.every((c, i) => angularDistance(c, norm360(trop.houses![i] - ay)) < 1e-6)
  );
  check(
    "ตัวอย่าง: ลัคนาสายนะมังกร ➔ นิรายนะธนู · อาทิตย์สายนะมังกร ➔ นิรายนะธนู",
    sid.bodies.find((b) => b.id === "asc")!.sign === 8 && sid.bodies.find((b) => b.id === "sun")!.sign === 8
  );
  const sr = solarReturn(sid, 30, { lat: 13.75, lon: 100.5 });
  check(
    "ผังวันเกิดแบบนิรายนะ: ดวงอาทิตย์กลับมาที่ตำแหน่งนิรายนะเดิม",
    angularDistance(sr.bodies.find((b) => b.id === "sun")!.lon, sid.bodies.find((b) => b.id === "sun")!.lon) < 1e-4
  );
  const t1 = Date.UTC(2026, 9, 28);
  const trS = computeTransits(sid, t1);
  const trT = computeTransits(trop, t1);
  // มุมจรไม่จำเป็นต้องชุดเดิม: อายนางศ์ ณ วันนี้มากกว่าวันเกิด (การหมุนควงราว 0.8 องศาใน 57 ปี) — นี่คือความต่างจริงของสองระบบ
  check(
    "ดาวจรของผังนิรายนะใช้อายนางศ์ของวันนั้น (ไม่ใช่ของวันเกิด)",
    angularDistance(
      trS.bodies.find((b) => b.id === "moon")!.lon,
      norm360(trT.bodies.find((b) => b.id === "moon")!.lon - zodiacShift("lahiri", t1))
    ) < 1e-6 && trS.aspects.every((a) => a.orb <= a.maxOrb + 1e-9)
  );
  const pS = computeProgressions(sid, t1);
  const pT = computeProgressions(trop, t1);
  const pAsc = (p: typeof pS) => p.bodies.find((b) => b.id === "asc")!.lon;
  check(
    "ลัคนาก้าวหน้าแบบนิรายนะ = แบบสายนะ ลบอายนางศ์",
    angularDistance(pAsc(pS), norm360(pAsc(pT) - zodiacShift("lahiri", pS.progUtcMs))) < 1e-6
  );
}

console.log("\n6.11) ถามแม่หมอ AI เรื่องผัง (ยินยอมก่อนส่ง · สิทธิ์ AI เดิม)");
{
  const root = process.cwd();
  const rd = (f: string) => fs.readFileSync(path.join(root, f), "utf8");
  const { formatChartForPrompt } = await import("../../src/lib/astro/natal-ai");
  const at = Date.UTC(1969, 11, 31, 23, 5);
  const known = computeNatalChart(input(at));
  const unknown = computeNatalChart(input(at, { timeKnown: false }));
  const tk = formatChartForPrompt(known, "th", "x", computeTransits(known, Date.UTC(2026, 9, 28), 1, false));
  const tu = formatChartForPrompt(unknown, "en", "x", computeTransits(unknown, Date.UTC(2026, 9, 28), 1, false));
  check("บริบทผังใน prompt ไม่มี undefined/NaN และมีดาวครบ 10 ดวง", !/undefined|NaN/.test(tk + tu) && ["ดวงอาทิตย์", "ดวงจันทร์", "ดาวพุธ", "ดาวศุกร์", "ดาวอังคาร", "ดาวพฤหัสบดี", "ดาวเสาร์", "ดาวยูเรนัส", "ดาวเนปจูน", "ดาวพลูโต"].every((n) => tk.includes(n)));
  check("ไม่ทราบเวลาเกิด: บริบทไม่มีเรือน/ลัคนา และบอกโมเดลห้ามพูดถึง", !/house \d|Ascendant:/.test(tu.replace("no Ascendant", "")) && tu.includes("Birth time unknown"));
  const route = rd("src/app/api/natal/chat/route.ts");
  const code = route.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  check("API: ตรวจ Origin · ต้องมี consent: true · สมาชิกเท่านั้น", code.includes("isRequestAuthorizedOrigin(request)") && /consent:\s*z\.literal\(true\)/.test(code) && code.includes('reason: "members_only"'));
  check("API: สิทธิ์ฟรีรายวัน + เพดานต่อบัญชี + เพดานโทเคน + เพดานงบ AI รวม", code.includes("NATAL_AI_FREE_PER_DAY") && code.includes("NATAL_AI_USER_DAY_MAX") && code.includes("isUserTokenCapReached(") && code.includes("isAiCapReached(") && code.includes("recordAiUsage("));
  check("API: กันฉีดคำสั่ง + สัญญาณวิกฤต (สายด่วน) + ด่านขาออกทั้งสองผู้ให้บริการ", code.includes("noteInjectionAttempt(") && code.includes("checkQuestion(") && code.includes("assessCrisisRisk(") && (code.match(/detectPromptLeak\(/g) ?? []).length >= 2);
  check("API: คำนวณผังเองฝั่งเซิร์ฟเวอร์ · ชื่อ/สถานที่ผ่าน sanitize · ตัดอีโมจิ", code.includes("buildChart(") && /sanitizePromptValue\(spec\.name/.test(code) && code.includes("sanitizePromptValue(lang === \"en\" ? spec.place.labelEn") && code.includes("stripEmoji("));
  check("API: ไม่ log ข้อมูลเกิด/คำถาม และไม่มีคำตอบสำเร็จรูปตอน AI ล่ม", !/console\.(log|warn|error)\([^)]*(spec|question|rawBody|parsed)/.test(code) && code.includes('reason: "ai_unavailable"'));
  const ask = rd("src/components/natal/NatalAsk.tsx").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  check("แท็บถามแม่หมอ: ยิง API เฉพาะเมื่อยินยอม · ส่ง consent: true · ไม่เขียนที่เก็บ", (ask.match(/fetch\(/g) ?? []).length === 1 && /if \(!question \|\| busy \|\| !consent\) return;/.test(ask) && ask.includes("consent: true") && !/localStorage|sessionStorage/.test(ask));
  check("แท็บถามแม่หมอโหลดแบบ React.lazy จากผลผัง", /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalAsk["']\s*\)\s*\)/.test(rd("src/components/natal/NatalResult.tsx")));
  check("นโยบายความเป็นส่วนตัวทั้งสองภาษาบอกเรื่องส่งข้อมูลเกิดให้ AI เมื่อยินยอม", rd("src/app/_shared/pages/privacy-th.tsx").includes("ถามแม่หมอ") && rd("src/app/_shared/pages/privacy-en.tsx").includes("Ask the reader"));
}

console.log("\n6.12) ภาพแชร์ Big Three (วาดในเครื่อง · ไม่มีข้อมูลเกิด)");
{
  const root = process.cwd();
  const share = fs.readFileSync(path.join(root, "src/components/natal/NatalShare.tsx"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  check("ภาพแชร์ไม่ยิง API ไม่อัปโหลด", !/\bfetch\(|\/api\//.test(share));
  // รับแค่ผัง ภาษา และรายการไพ่ — ไม่รับ meta/spec (ชื่อ วันเวลา สถานที่) และไม่อ่านเวลา/พิกัดเกิดจากผัง
  check(
    "ภาพแชร์ไม่มีชื่อ วันเวลา หรือสถานที่เกิด",
    /export default function NatalShare\(\{ chart, lang, cards \}/.test(share) && !/meta|spec|input\.(utcMs|lat|lon)|dateText|placeText/.test(share),
  );
  check("ไพ่ในภาพหาไม่เจอ = ข้าม ไม่หยิบใบอื่นแทน (กฎเหล็ก 14)", /if \(!card\) continue;/.test(share));
  const res = fs.readFileSync(path.join(root, "src/components/natal/NatalResult.tsx"), "utf8");
  check("ภาพแชร์โหลดแบบ lazy และกดสร้างภาพ = พลิกไพ่ประจำราศีบนหน้าเว็บด้วย (กฎเหล็ก 4)", /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalShare["']\s*\)\s*\)/.test(res) && /`\$\{key\}:sign`, true\]/.test(res));
}

console.log("\n6.13) โหราไทย — ปฏิทินจันทรคติ · ทักษา · มหาทักษา · เลข 7 ตัว (เทียบตำราและวันที่ประกาศจริง)");
{
  const { thaiLunarDate, thaiLunarFromJdn, julianDayNumber, dateOfJdn, naksatYear } = await import("../../src/lib/astro/thai-lunar");
  const { taksa, thaiBirthDay, sevenNumbers, mahaTaksa, checkName, TAKSA_POSITIONS } = await import("../../src/lib/astro/thai-astro");
  const t0 = thaiLunarDate(2000, 1, 1);
  check("1 ม.ค. 2000 = เดือนอ้าย แรม 9 ค่ำ (ตัวอย่างของ pythaidate ต้นฉบับ)", t0.month === 1 && t0.day === 24);
  // วันวิสาขบูชาที่ประกาศจริง (เดือน 6 ขึ้น 15 ค่ำ · ปีอธิกมาสเป็นเดือน 7)
  const visakha: [number, number, number][] = [[2020, 5, 6], [2021, 5, 26], [2022, 5, 15], [2023, 6, 3], [2024, 5, 22], [2025, 5, 11], [2026, 5, 31]];
  check("วิสาขบูชา 7 ปีตรงวันประกาศจริงทุกปี", visakha.every(([y, m, d]) => { const t = thaiLunarDate(y, m, d); return t.day === 15 && t.month === (t.leapMonthYear ? 7 : 6); }));
  // ตารางมาฆบูชา 36 ปีของวิกิพีเดียไทย (พ.ศ. 2539–2574): เดือนต้องถูกทุกปี วันคลาดได้ไม่เกิน 1 (ปีที่ทางการเลื่อนอธิกวาร)
  const makha: [number, number, number][] = [[2539,3,4],[2551,2,21],[2563,2,8],[2540,2,22],[2552,2,9],[2564,2,26],[2541,2,11],[2553,2,28],[2565,2,16],[2542,3,1],[2554,2,18],[2566,3,6],[2543,2,19],[2555,3,7],[2567,2,24],[2544,2,8],[2556,2,25],[2568,2,13],[2545,2,26],[2557,2,14],[2569,3,4],[2546,2,16],[2558,3,4],[2570,2,22],[2547,3,5],[2559,2,22],[2571,2,11],[2548,2,23],[2560,2,11],[2572,2,28],[2549,2,13],[2561,3,1],[2573,2,18],[2550,3,3],[2562,2,19],[2574,3,8]];
  let makhaExact = 0;
  const makhaOk = makha.every(([be, m, d]) => {
    const y = be - 543;
    const want = thaiLunarDate(y, 6, 15).leapMonthYear ? 4 : 3;
    const jd = julianDayNumber(y, m, d);
    for (const k of [0, -1, 1]) {
      const t = thaiLunarFromJdn(jd + k);
      if (t.month === want && t.day === 15) { if (k === 0) makhaExact++; return true; }
    }
    return false;
  });
  check(`มาฆบูชา 36 ปี: เดือนถูกทุกปี วันคลาดไม่เกิน 1 (ตรงเป๊ะ ${makhaExact}/36)`, makhaOk && makhaExact >= 26);
  const official = (y: number, m: number, d: number) => { const t = thaiLunarDate(y, m, d); return t.day === 15; };
  check("มาฆบูชาที่ราชการประกาศ 12 ก.พ. 2568 และ 3 มี.ค. 2569 ตรงเป๊ะ", official(2025, 2, 12) && official(2026, 3, 3));
  check("เกิด 3 ม.ค. 2552 ยังเป็นปีชวด (ปีนักษัตรเปลี่ยนวันขึ้น 1 ค่ำ เดือน 5 · ตัวอย่างในตำรา)", naksatYear(2009, 1, 3).index === 1);
  const ny = dateOfJdn(naksatYear(2026, 10, 28).changeJdn);
  check("ปีมะเมีย 2569 เริ่มวันขึ้น 1 ค่ำ เดือน 5 (มีนาคม 2026)", naksatYear(2026, 10, 28).index === 7 && ny.y === 2026 && ny.m === 3);
  // ตารางภูมิทักษา 8 วันจาก thaibabyname.com (ลำดับ บริวาร อายุ เดช ศรี มูละ อุตสาหะ มนตรี กาลกิณี)
  const TABLE: Record<number, number[]> = {
    1: [1, 2, 3, 4, 7, 5, 8, 6], 2: [2, 3, 4, 7, 5, 8, 6, 1], 3: [3, 4, 7, 5, 8, 6, 1, 2], 4: [4, 7, 5, 8, 6, 1, 2, 3],
    5: [5, 8, 6, 1, 2, 3, 4, 7], 6: [6, 1, 2, 3, 4, 7, 5, 8], 7: [7, 5, 8, 6, 1, 2, 3, 4], 8: [8, 6, 1, 2, 3, 4, 7, 5],
  };
  check("ภูมิทักษาทั้ง 8 วันตรงตารางตำรา", Object.entries(TABLE).every(([b, row]) => { const t = taksa(Number(b) as 1); return TAKSA_POSITIONS.every((pos, i) => t[pos] === row[i]); }));
  check(
    "วันโหร: พฤหัส 03.00 น. = พุธกลางคืน (ราหู) · พุธ 20.00 น. = ราหู · พุธ 10.00 น. = พุธ · เสาร์ 05.00 น. = ศุกร์",
    thaiBirthDay(2026, 10, 29, 3, true).planet === 8 && thaiBirthDay(2026, 10, 28, 20, true).planet === 8 && thaiBirthDay(2026, 10, 28, 10, true).planet === 4 && thaiBirthDay(2026, 10, 31, 5, true).planet === 6,
  );
  // ตัวอย่างในตำรา: เกิดวันอาทิตย์ เดือนยี่ ปีขาล ➔ ฐานรวม 6 9 12 15 18 14 10
  const sun = thaiBirthDay(2026, 11, 1, 10, true);
  check("เลข 7 ตัว: ตัวอย่างในตำรา (อาทิตย์ · เดือนยี่ · ปีขาล) ได้ฐานรวม 6 9 12 15 18 14 10", sevenNumbers(sun, 2, 3).rows[3].join(" ") === "6 9 12 15 18 14 10");
  const mt = mahaTaksa(1);
  check("มหาทักษา: รวม 108 ปี · เกิดวันอาทิตย์ = อาทิตย์ 0–6 จันทร์ 6–21 · ดาวแทรกในช่วงอาทิตย์ของจันทร์ ≈ 10 เดือน", mt[7].to === 108 && mt[0].planet === 1 && mt[0].to === 6 && mt[1].planet === 2 && mt[1].to === 21 && Math.abs((mt[0].sub[1].to - mt[0].sub[1].from) * 12 - 10) < 0.01 && mt.every((p) => Math.abs(p.sub[7].to - p.to) < 1e-9));
  check("อักษรกาลกิณี: วันอาทิตย์ = ศ ษ ส ห ฬ ฮ · วันจันทร์ = สระ", checkName("สมศักดิ์", 1).kalakini.join("") === "สศ" && checkName("กนก", 2).kalakini.length === 0 && checkName("กานดา", 2).kalakini.includes("า"));
  const thaiSrc = fs.readFileSync(path.join(process.cwd(), "src/components/natal/NatalThai.tsx"), "utf8");
  check("แท็บโหราไทยไม่ยิง API และโหลดแบบ lazy", !/\bfetch\(/.test(thaiSrc) && /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalThai["']\s*\)\s*\)/.test(fs.readFileSync(path.join(process.cwd(), "src/components/natal/NatalResult.tsx"), "utf8")));
}

console.log("\n6.14) ดาวฤกษ์ 35 ดวง + จุด Lots 7 จุดของ Hermes");
{
  const { fixedStarPositions, starContacts } = await import("../../src/lib/astro/fixed-stars");
  const { hermeticLots } = await import("../../src/lib/astro/lots");
  // ลองจิจูดสุริยวิถีปี 2000 จากตารางอ้างอิงโหราตะวันตก (ปัดเป็นลิปดา)
  const REF: Record<string, number> = { Regulus: 149 + 50 / 60, Spica: 203 + 50 / 60, Aldebaran: 69 + 47 / 60, Antares: 249 + 46 / 60, Fomalhaut: 333 + 52 / 60, Algol: 56 + 10 / 60, Sirius: 104 + 5 / 60, Arcturus: 204 + 14 / 60, Vega: 285 + 19 / 60, Alcyone: 60, Betelgeuse: 88 + 45 / 60, Rigel: 76 + 50 / 60, Pollux: 113 + 13 / 60, Castor: 110 + 14 / 60, Procyon: 115 + 47 / 60, Denebola: 171 + 37 / 60, Achernar: 345 + 19 / 60, Altair: 301 + 47 / 60, "Deneb Adige": 335 + 20 / 60, Markab: 353 + 29 / 60, Scheat: 359 + 22 / 60, Capella: 81 + 51 / 60, Canopus: 104 + 58 / 60, Alphecca: 222 + 18 / 60, Polaris: 88 + 34 / 60, Zubenelgenubi: 225 + 5 / 60, Zubeneschamali: 229 + 22 / 60, "Deneb Algedi": 323 + 33 / 60, Zosma: 161 + 19 / 60, Alkaid: 176 + 56 / 60, Hamal: 37 + 40 / 60, Vindemiatrix: 189 + 56 / 60, Algorab: 193 + 27 / 60, Bellatrix: 80 + 57 / 60, Mirach: 30 + 24 / 60 };
  const s2000 = fixedStarPositions(Date.UTC(2000, 0, 1, 12));
  const worst = Math.max(...s2000.map((p) => angularDistance(p.lon, REF[p.name] ?? NaN) * 60));
  check(`ดาวฤกษ์ 35 ดวง ปี 2000 ตรงตารางอ้างอิงไม่เกิน 1.5 ลิปดา (แย่สุด ${worst.toFixed(2)}′)`, s2000.length === 35 && worst <= 1.5);
  const s1900 = fixedStarPositions(Date.UTC(1900, 0, 1)).find((p) => p.name === "Regulus")!;
  check("การหมุนควง: เรกูลัสปี 1900 อยู่ราว 28°27′ สิงห์ (ถอยราว 1°23′ ต่อศตวรรษ)", Math.abs(s1900.lon - (148 + 27 / 60)) < 0.05);
  const at = Date.UTC(1969, 11, 31, 23, 5);
  const night = computeNatalChart(input(at));
  const day = computeNatalChart(input(Date.UTC(1970, 0, 1, 5, 0)));
  const lotOk = (c: typeof night) => {
    const L = hermeticLots(c)!;
    const g = (id: string) => c.bodies.find((b) => b.id === id)!.lon;
    const f = (id: string) => L.find((l) => l.id === id)!.lon;
    const d = c.dayChart;
    const lot = (a: number, b: number) => norm360(d ? g("asc") + a - b : g("asc") + b - a);
    const spirit = lot(g("sun"), g("moon"));
    const fortune = lot(g("moon"), g("sun"));
    return (
      angularDistance(f("fortune"), g("fortune")) < 1e-9 &&
      angularDistance(f("spirit"), spirit) < 1e-9 &&
      angularDistance(f("eros"), lot(g("venus"), spirit)) < 1e-9 &&
      angularDistance(f("victory"), lot(g("jupiter"), spirit)) < 1e-9 &&
      angularDistance(f("necessity"), lot(fortune, g("mercury"))) < 1e-9 &&
      angularDistance(f("courage"), lot(fortune, g("mars"))) < 1e-9 &&
      angularDistance(f("nemesis"), lot(fortune, g("saturn"))) < 1e-9 &&
      angularDistance(norm360(f("fortune") + f("spirit")), norm360(2 * g("asc"))) < 1e-9
    );
  };
  check("Lots 7 จุดตรงสูตร Paulus ทั้งผังกลางคืนและกลางวัน · Fortune ตรงกับจุดในผัง", night.dayChart === false && day.dayChart === true && lotOk(night) && lotOk(day));
  check("ไม่ทราบเวลาเกิด = ไม่มี Lots (ต้องใช้ลัคนา)", hermeticLots(computeNatalChart(input(at, { timeKnown: false }))) === null);
  const contacts = starContacts(night);
  check("ดาวฤกษ์ทับดาว: orb ไม่เกินเกณฑ์ทุกคู่", contacts.every((c) => c.orb <= 1.5));
}

console.log("\n6.15) ผังของเพื่อน — ลิงก์ส่งผัง (#add=) · ตรวจค่าทุกช่อง · จัดอันดับความเข้ากัน");
{
  const { encodeChartShare, decodeChartShare } = await import("../../src/lib/astro/chart-share");
  const spec = { name: "ฝน ทดสอบ", day: 1, month: 1, yearCe: 1970, hour: 6, minute: 5, timeKnown: true, place: { mode: "thai" as const, label: "กรุงเทพมหานคร", labelEn: "Bangkok", lat: 13.7525, lon: 100.4942, zone: "Asia/Bangkok", refId: "bangkok" }, houseSystem: "placidus" as const, nodeType: "true" as const, orbScale: 1, zodiac: "lahiri" as const };
  const code = encodeChartShare(spec);
  const back = decodeChartShare(code);
  check("ลิงก์ส่งผัง: เข้ารหัสแล้วถอดกลับได้ครบทุกช่อง (ชื่อภาษาไทยไม่เพี้ยน) และอักขระปลอดภัยใน URL", !!back && back.name === spec.name && back.yearCe === 1970 && back.month === 1 && back.day === 1 && back.hour === 6 && back.minute === 5 && back.timeKnown && back.zodiac === "lahiri" && back.houseSystem === "placidus" && back.place.zone === "Asia/Bangkok" && back.place.label === "กรุงเทพมหานคร" && back.place.lat === 13.7525 && back.place.lon === 100.4942 && back.place.refId === "bangkok" && /^[A-Za-z0-9_-]+$/.test(code));
  const tamper = (patch: Record<string, unknown>) => {
    const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(code.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))));
    const b = new TextEncoder().encode(JSON.stringify({ ...o, ...patch }));
    let bin = "";
    for (const x of b) bin += String.fromCharCode(x);
    return decodeChartShare(btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
  };
  check(
    "ลิงก์ที่ถูกแก้ค่าผิดช่วง/เขตเวลาปลอม/วันที่ไม่มีจริง/แท็ก HTML ถูกปฏิเสธทั้งก้อน",
    tamper({ y: 1800 }) === null && tamper({ m: 13 }) === null && tamper({ d: 31, m: 2 }) === null && tamper({ n: "<script>" }) === null &&
      tamper({ p: ["thai", "x", "", 999, 100, "Asia/Bangkok", null, ""] }) === null && tamper({ p: ["thai", "x", "", 13, 100, "Mars/Base", null, ""] }) === null &&
      decodeChartShare("not-a-real-code!!") === null
  );
  const app2 = fs.readFileSync(path.join(process.cwd(), "src/components/natal/NatalChartApp.tsx"), "utf8");
  const imp = fs.readFileSync(path.join(process.cwd(), "src/components/natal/NatalImport.tsx"), "utf8");
  check(
    "ผังจากเพื่อน: โหลดแบบ lazy · ลบ #add= ออกจากแถบที่อยู่ทันที · ไม่ยิง API · มีคำเตือนก่อนสร้างลิงก์",
    /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalImport["']\s*\)\s*\)/.test(app2) && imp.includes("history.replaceState") && !/\bfetch\(/.test(imp) && app2.includes("ส่งให้เฉพาะคนที่ไว้ใจเท่านั้น")
  );
  const syn = fs.readFileSync(path.join(process.cwd(), "src/components/natal/NatalSynastry.tsx"), "utf8");
  check("แท็บผังคู่จัดอันดับความเข้ากันกับทุกผังที่บันทึก (ไม่นับผังตัวเอง · ระบบราศีเดียวกัน)", syn.includes("const ranked = useMemo") && syn.includes("zodiac: chart.input.zodiac") && syn.includes("continue;"));
}

console.log("\n6.16) รายงานฉบับเต็มแบบเสียเงิน (PDF)");
{
  const root = process.cwd();
  const rd = (f: string) => fs.readFileSync(path.join(root, f), "utf8");
  const { buildNatalReport } = await import("../../src/lib/astro/natal-report");
  const spec = { name: "ทดสอบ", day: 1, month: 1, yearCe: 1970, hour: 6, minute: 5, timeKnown: true, place: { mode: "thai" as const, label: "กรุงเทพมหานคร", lat: 13.7525, lon: 100.4942, zone: "Asia/Bangkok" }, houseSystem: "placidus" as const, nodeType: "true" as const, orbScale: 1 };
  const rTh = buildNatalReport(spec, "th", Date.UTC(2026, 9, 28));
  const rEn = buildNatalReport({ ...spec, timeKnown: false }, "en", Date.UTC(2026, 9, 28));
  check(
    "รายงาน: ครบทุกส่วน ไม่มี undefined/NaN · ดาวครบ · พยากรณ์ 12 เดือนมีวันที่เรียงกัน · ไม่รู้เวลาเกิด = ไม่มีเรือน/Lots",
    !/undefined|NaN/.test(JSON.stringify(rTh) + JSON.stringify(rEn)) && rTh.bodies.length >= 13 && rTh.yearAhead.length > 0 && rTh.solarReturn.length > 0 && rTh.lots !== null && rEn.houses === null && rEn.lots === null && rTh.thai.seven.length === 4,
  );
  const route = rd("src/app/api/natal/report/route.ts").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  check(
    "API รายงาน: ตรวจ Origin · ต้องยินยอม · สมาชิกเท่านั้น · หักจากรอบที่ซื้อ (premium) · รหัสคงที่ต่อผัง (ไม่หักซ้ำ) · ล้มเหลว = คืนสิทธิ์",
    route.includes("isRequestAuthorizedOrigin(request)") && /consent:\s*z\.literal\(true\)/.test(route) && route.includes('reason: "members_only"') && route.includes("{ premium: true }") && route.includes("natalpdf_") && route.includes("refundReading(charged.readingId, charged.usageId)") && route.includes('reason: "needs_credit"'),
  );
  check("API รายงาน: ไม่ log ข้อมูลเกิด", !/console\.(log|warn|error)\([^)]*(spec|raw|parsed)/.test(route));
  const panel = rd("src/components/natal/NatalReportPanel.tsx").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  check(
    "หน้ารายงาน: ยิง API เฉพาะหลังยินยอม · โหลดแบบ lazy · ตัวประกอบรายงานไม่ถูกส่งไปเบราว์เซอร์ (import แค่ชนิดข้อมูล)",
    (panel.match(/fetch\(/g) ?? []).length === 1 && panel.includes("if (!consent || busy) return;") && panel.includes("consent: true") &&
      /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalReportPanel["']\s*\)\s*\)/.test(rd("src/components/natal/NatalChartApp.tsx")) &&
      !fs.readdirSync(path.join(root, "src/components/natal")).some((f) => /^\s*import\s+(?!type\b)[^;]*natal-report["']/m.test(rd(`src/components/natal/${f}`))),
  );
  // layout มีกฎ body > :not(.fixed):not([data-floating]):not([data-site-header]) { position: relative } ➔ portal ที่ไม่มี
  // data-floating จะไม่ทับเต็มจอ (เจอตอนดูหน้าจริงรอบนี้ — รายงานไปต่อท้ายหน้าแทน)
  check("หน้ารายงาน: portal ใต้ body มี data-floating (ไม่งั้นกฎ layout บังคับ position: relative)", /id="nt-report-root"\s+data-floating=/.test(panel));
}

console.log("\n6.17) ความแม่นของคำอธิบาย — เรื่องเด่นเรียงตามน้ำหนัก · เวลาเกิดคลาดแล้วอะไรเปลี่ยน · ภาพรวมจาก AI (ปุ่มฟรี Haiku · รายงาน Sonnet)");
{
  const root = process.cwd();
  const rd = (f: string) => fs.readFileSync(path.join(root, f), "utf8");
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const { chartHighlights, birthTimeSensitivity, describeTimeSensitivity } = await import("../../src/lib/astro/natal-insight");
  const { validateOverview, buildOverviewPrompt } = await import("../../src/lib/astro/natal-overview");

  // ผังทดสอบหลายแบบ: กรุงเทพ 4 เวลา + ลอนดอน (ละติจูดสูง) — ไม่ใช่ค่าที่โค้ดเราเคยคำนวณ แต่เทียบกับการคำนวณผังใหม่ทั้งผัง
  const samples: NatalInput[] = [
    input(Date.UTC(1969, 11, 31, 23, 5)),
    input(Date.UTC(1990, 4, 17, 3, 42)),
    input(Date.UTC(2001, 8, 11, 12, 0)),
    input(Date.UTC(1985, 1, 2, 18, 30), { houseSystem: "whole" }),
    input(Date.UTC(1978, 6, 21, 9, 15), { lat: 51.5, lon: -0.12, houseSystem: "koch" }),
  ];
  let sortedOk = true;
  let capOk = true;
  let cleanOk = true;
  let enOk = true;
  for (const inp of samples) {
    const c = computeNatalChart(inp);
    const th = chartHighlights(c, "th");
    const en = chartHighlights(c, "en");
    sortedOk &&= th.length > 0 && th.every((h, i) => i === 0 || th[i - 1].weight >= h.weight) && th.length <= 7;
    capOk &&= th.filter((h) => h.kind === "aspect").length <= 3 && th.filter((h) => h.kind === "dignity").length <= 2 && new Set(th.map((h) => h.key)).size === th.length;
    cleanOk &&= !/undefined|NaN|ๆ[^\s"]/.test(JSON.stringify(th));
    enOk &&= !/[฀-๿]/.test(JSON.stringify(en));
  }
  check("เรื่องเด่น: เรียงจากน้ำหนักมากไปน้อย · ไม่เกิน 7 ข้อ", sortedOk);
  check("เรื่องเด่น: มุมสัมพันธ์ไม่เกิน 3 · ศักดิ์ดาวไม่เกิน 2 · ไม่ซ้ำ", capOk);
  check("เรื่องเด่น: ไม่มี undefined/NaN · ไม้ยมกมีวรรคตามหลัง · อังกฤษไม่มีอักษรไทย", cleanOk && enOk);
  const bkk = chartHighlights(computeNatalChart(samples[0]), "th");
  check("เรื่องเด่น: ดาวชิดแกนผังมาก่อนเรื่องอื่น (ผัง 1970 ดวงจันทร์ชิดกลางฟ้า)", bkk[0]?.kind === "angle" && bkk[0].bodies.includes("moon"));
  const gen = chartHighlights(computeNatalChart(samples[1]), "th");
  check("เรื่องเด่น: ไม่นับมุมระหว่างดาวรุ่นด้วยกัน (ยูเรนัส เนปจูน พลูโต)", !gen.some((h) => h.kind === "aspect" && h.bodies.every((b) => ["uranus", "neptune", "pluto"].includes(b))));

  // ความไวต่อเวลาเกิด: ทุกข้อที่รายงานต้องตรงกับการคำนวณผังใหม่ทั้งผัง ณ เวลานั้น (และนาทีก่อนหน้ายังไม่เปลี่ยน)
  let tsChecked = 0;
  let tsOk = true;
  for (const inp of samples) {
    const c = computeNatalChart(inp);
    const ts = birthTimeSensitivity(c);
    if (!ts) {
      tsOk = false;
      continue;
    }
    const at = (min: number) => computeNatalChart({ ...inp, utcMs: inp.utcMs + min * 60000 });
    const signed = (s: { minutes: number; dir: string }) => s.minutes * (s.dir === "earlier" ? -1 : 1);
    for (const [id, shift] of [["asc", ts.asc], ["mc", ts.mc]] as const) {
      if (!shift) continue;
      const m = signed(shift);
      tsChecked++;
      tsOk &&= at(m).bodies.find((b) => b.id === id)!.sign === shift.to && at(m - Math.sign(m)).bodies.find((b) => b.id === id)!.sign === c.bodies.find((b) => b.id === id)!.sign;
    }
    for (const h of ts.houses) {
      const m = signed(h.shift);
      tsChecked++;
      tsOk &&= at(m).bodies.find((b) => b.id === h.id)!.house === h.shift.to && at(m - Math.sign(m)).bodies.find((b) => b.id === h.id)!.house === h.from;
    }
    tsOk &&= describeTimeSensitivity(ts, "th").length > 0 && !/[฀-๿]/.test(describeTimeSensitivity(ts, "en").join(" "));
  }
  check(`เวลาเกิดคลาด: ทุกข้อตรงกับการคำนวณผังใหม่ทั้งผัง (ตรวจ ${tsChecked} ข้อ)`, tsOk && tsChecked >= 5, `checked=${tsChecked}`);
  check("เวลาเกิดคลาด: ไม่รู้เวลาเกิด = ไม่คำนวณ (null)", birthTimeSensitivity(computeNatalChart(input(Date.UTC(1990, 4, 17, 5), { timeKnown: false }))) === null);

  // ตัวตรวจคำตอบ AI
  const hl = chartHighlights(computeNatalChart(samples[0]), "th");
  const goodPara = (refs: string[], text = "ดวงจันทร์ที่อยู่บนกลางฟ้าทำให้อารมณ์ของคุณกลายเป็นส่วนหนึ่งของงานและภาพที่สังคมจดจำ") => ({ title: "ใจที่คนเห็น", text, refs });
  const good = validateOverview({ paragraphs: [goodPara(["h1"]), goodPara(["h2", "h3"])] }, hl, "th");
  check("ตัวตรวจ AI: ย่อหน้าที่อ้างรหัสจริงผ่าน · แปลงรหัสเป็นชื่อเรื่องเด่น", good?.length === 2 && good[0].basedOn[0] === hl[0].title);
  check("ตัวตรวจ AI: อ้างรหัสที่ไม่มีจริงถูกตัด (เหลือไม่ถึง 2 ย่อหน้า = null)", validateOverview({ paragraphs: [goodPara(["h1"]), goodPara(["h99"])] }, hl, "th") === null);
  const leakCode = validateOverview({ paragraphs: [goodPara(["h1"]), goodPara(["h2"]), goodPara(["h3"], "ตามข้อ h1 ดวงจันทร์บนกลางฟ้าทำให้อารมณ์ของคุณเป็นที่จดจำในที่ทำงาน")] }, hl, "th");
  const fated = validateOverview({ paragraphs: [goodPara(["h1"]), goodPara(["h2"]), goodPara(["h3"], "ปีหน้าเรื่องงานจะเกิดขึ้นแน่ เพราะดวงจันทร์บนกลางฟ้าของคุณส่งแรงเต็มที่")] }, hl, "th");
  check("ตัวตรวจ AI: ย่อหน้าที่รหัสหลุดลงเนื้อความถูกตัด · ย่อหน้าฟันธงถูกตัด (ย่อหน้าดีอยู่ครบ)", leakCode?.length === 2 && fated?.length === 2 && !JSON.stringify(fated).includes("เกิดขึ้นแน่"));
  check("ตัวตรวจ AI: หน้าอังกฤษที่ตอบไทยถูกตัด · คำตอบไม่ใช่วัตถุ = null", validateOverview({ paragraphs: [goodPara(["h1"]), goodPara(["h2"])] }, hl, "en") === null && validateOverview("x", hl, "th") === null);
  const prompt = buildOverviewPrompt(computeNatalChart(samples[0]), "th", "x", hl);
  const promptUnknown = buildOverviewPrompt(computeNatalChart(input(Date.UTC(1990, 4, 17, 5), { timeKnown: false })), "en", "x", chartHighlights(computeNatalChart(input(Date.UTC(1990, 4, 17, 5), { timeKnown: false })), "en"));
  check("prompt ภาพรวม: มีเรื่องเด่น h1.. จากโค้ด · ไม่มี undefined · ไม่รู้เวลาเกิดสั่งห้ามพูดถึงเรือน", prompt.includes(`h1: ${hl[0].title}`) && !/undefined|NaN/.test(prompt + promptUnknown) && promptUnknown.includes("never mention the Ascendant"));

  // ต่อสาย
  const ov = strip(rd("src/app/api/natal/overview/route.ts"));
  check(
    "API ภาพรวม: Origin · ต้องยินยอม · Haiku · เพดานถี่/ต่อวัน/ต่อผัง + เพดานโทเคน + งบ AI รวม · AI ล้ม = 503 ไม่มีคำตอบสำเร็จรูป",
    ov.includes("isRequestAuthorizedOrigin(request)") && /consent:\s*z\.literal\(true\)/.test(ov) && /model: CLAUDE_HAIKU_MODEL/.test(ov) && ov.includes("natal-overview:chart:day") && ov.includes("isUserTokenCapReached(") && ov.includes("isAiCapReached(") && ov.includes('reason: "ai_unavailable"') && !/console\.(log|warn|error)\([^)]*(spec|raw|parsed)/.test(ov),
  );
  const ovLib = strip(rd("src/lib/astro/natal-overview.ts"));
  check("ภาพรวม: ส่งตัวตรวจให้ generateAiJson (Claude ตอบไม่ผ่าน ➔ Gemini) · ไม่แคช · ไม่เก็บ log ที่ Gateway", /accept: \(x\) => validateOverview\(/.test(ovLib) && ovLib.includes("cacheTtl: 0") && ovLib.includes("collectLog: false"));
  const rep = strip(rd("src/app/api/natal/report/route.ts"));
  const iBuilt = rep.indexOf("buildNatalReport(spec");
  const iAi = rep.indexOf("generateNatalOverview(");
  check(
    "รายงานเสียเงิน: ภาพรวมโดย Sonnet หลังประกอบรายงานเสร็จ · ส่วน AI อยู่ใน try ของตัวเอง (AI ล้มไม่คืนสิทธิ์ ไม่ทำรายงานล้ม)",
    iBuilt > 0 && iAi > iBuilt && /model: CLAUDE_SONNET_MODEL/.test(rep) && /try \{\s*const \{ isAiCapReached \}/.test(rep) && rep.includes('recordEvent("natal_report_ai_failed")'),
  );
  check("ถามแม่หมอ: prompt มีเรื่องเด่นที่โค้ดจัดลำดับ (ยังใช้ Sonnet)", /formatChartForPrompt\([^)]*chartHighlights\(chart, lang/.test(rd("src/app/api/natal/chat/route.ts")) && /model: CLAUDE_SONNET_MODEL/.test(rd("src/app/api/natal/chat/route.ts")));
  const btn = strip(rd("src/components/natal/NatalOverview.tsx"));
  check(
    "ปุ่มภาพรวม: โหลดแบบ lazy · ยิง API เฉพาะหลังยินยอม · ไม่เขียนที่เก็บ · ตัดอีโมจิ · import แค่ชนิดข้อมูลของฝั่งเซิร์ฟเวอร์",
    /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalOverview["']\s*\)\s*\)/.test(rd("src/components/natal/NatalResult.tsx")) &&
      (btn.match(/fetch\(/g) ?? []).length === 1 && btn.includes("if (!consent || busy) return;") && btn.includes("consent: true") && !/localStorage|sessionStorage/.test(btn) && btn.includes("stripEmoji(") &&
      !/^\s*import\s+(?!type\b)[^;]*natal-overview["']/m.test(btn),
  );
  check("นโยบายความเป็นส่วนตัวทั้งสองภาษาบอกเรื่องปุ่มภาพรวมผังและรายงาน", rd("src/app/_shared/pages/privacy-th.tsx").includes("เขียนภาพรวมผัง") && rd("src/app/_shared/pages/privacy-en.tsx").includes("Write my overview"));
}

console.log("\n6.20) คำสำคัญไพ่ประจำตัว — ไม่ฝังลง HTML · ตรงกับข้อมูลไพ่ต้นทางทุกใบ");
{
  const { NATAL_CARDS, packNatalCards } = await import("../../src/app/_shared/pages/natal-chart");
  const { NATAL_CARD_KEYWORDS } = await import("../../src/data/natal/card-keywords");
  const mismatch = NATAL_CARDS.filter((c) => {
    const k = NATAL_CARD_KEYWORDS[c.id];
    return !k || !c.kw || k.th !== c.kw.th || k.en !== c.kw.en || !k.th || !k.en;
  }).map((c) => c.id);
  check(
    `card-keywords.ts ครบ ${NATAL_CARDS.length} ใบและตรงกับ summary.ts/keywords-en.ts${mismatch.length ? ` (ไม่ตรง: ${mismatch.slice(0, 5).join(", ")})` : ""}`,
    mismatch.length === 0 && Object.keys(NATAL_CARD_KEYWORDS).length === NATAL_CARDS.length,
  );
  const packed = JSON.parse(packNatalCards()) as unknown[][];
  check(
    "prop ของ island (ฝังลง HTML) มีแค่ id ชื่อไทย ชื่ออังกฤษ — ไม่มีคำสำคัญ (งบ HTML ของหน้า)",
    packed.length === NATAL_CARDS.length && packed.every((r) => r.length === 3),
  );
  const resultSrc = fs.readFileSync(path.join(process.cwd(), "src/components/natal/NatalResult.tsx"), "utf8");
  check("NatalResult (โหลดแบบ lazy) อ่านคำสำคัญจาก card-keywords.ts", /NATAL_CARD_KEYWORDS\[card\.id\]/.test(resultSrc));
}

console.log("\n7) กติกา island — ตัวคำนวณ/คำอธิบาย/ผลผังโหลดแบบ dynamic import เท่านั้น");
{
  const root = process.cwd();
  const entry = path.join(root, "src/components/natal/NatalChartApp.tsx");
  const files = [
    entry,
    path.join(root, "src/components/natal/CitySearch.tsx"),
    ...fs.readdirSync(path.join(root, "astro/islands")).map((f) => path.join(root, "astro/islands", f)),
  ].filter((f) => fs.existsSync(f) && /\.(tsx?|astro)$/.test(f));
  assertNonEmptyCorpus("ไฟล์ island + ฟอร์มผังดวง", files, "ต้องเจออย่างน้อย NatalChartApp.tsx และ astro/islands/*");
  // ของหนักที่ห้ามติดบันเดิลแรกของหน้า: ตัวคำนวณดาว (~50 KB) · ตารางไครอน · คำอธิบายสองภาษา · ผลผังทั้งหมด
  const heavy =
    /^\s*import\s+(?!type\b)[^;]*from\s+["'](@\/lib\/astro\/natal(-text)?|astronomy-engine|@\/lib\/astro\/chiron-table|@\/data\/natal\/content|\.\/NatalResult|\.\/NatalWheel|@\/components\/natal\/(NatalResult|NatalWheel)|@\/data\/natal\/cities-world|@\/lib\/astro\/city-search|@\/lib\/astro\/asteroids|@\/lib\/astro\/asteroid-tables|@\/lib\/astro\/(techniques|chart-spec)|\.\/NatalToday)["']/m;
  const offenders = files.filter((f) => heavy.test(fs.readFileSync(f, "utf8")));
  check(
    "ไฟล์ island และหน้าฟอร์มผังดวงไม่ import ของหนักแบบ static",
    offenders.length === 0,
    offenders.map((f) => `    ${path.relative(root, f)}`).join("\n")
  );
  const resultSrc = fs.readFileSync(path.join(root, "src/components/natal/NatalResult.tsx"), "utf8");
  check(
    "แท็บตามเวลาและผังคู่โหลดแบบ React.lazy (ผลผังเกิดไม่ลาก techniques/synastry มาด้วย)",
    /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalTimeTools["']\s*\)\s*\)/.test(resultSrc) &&
      /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalSynastry["']\s*\)\s*\)/.test(resultSrc) &&
      !/^\s*import\s+(?!type\b)[^;]*from\s+["'](@\/lib\/astro\/(techniques|synastry)|\.\/(NatalTimeTools|NatalSynastry))["']/m.test(
        resultSrc
      )
  );
  const src = fs.existsSync(entry) ? fs.readFileSync(entry, "utf8") : "";
  check("ฟอร์มโหลดตัวคำนวณด้วย import() ตอนกดสร้างผัง", /import\(\s*["']@\/lib\/astro\/natal["']\s*\)/.test(src));
  check(
    "ดวงวันนี้โหลดแบบ React.lazy (เฉพาะเมื่อมีผังบันทึกไว้)",
    /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalToday["']\s*\)\s*\)/.test(src)
  );
  check(
    "ผลผังโหลดแบบ React.lazy",
    /React\.lazy\(\s*\(\)\s*=>\s*import\(\s*["']\.\/NatalResult["']\s*\)\s*\)/.test(src)
  );
  check(
    "ข้อมูลวันเกิดไม่ออกจากเครื่อง (ฟอร์มไม่ยิง fetch · ไม่เขียน localStorage/URL)",
    !/\bfetch\(|localStorage|sessionStorage|history\.(push|replace)State|location\.search/.test(
      src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
    )
  );
}

console.log(`\n📊 สรุป: ผ่าน ${pass} · ตก ${fail}`);
if (fail > 0) process.exit(1);
console.log(
  "✅ ผังดวงกำเนิดตรงฟ้าจริง: ดาวเทียบ JPL · ลัคนา/เรือนตรวจด้วยเรขาคณิต · เขตเวลาย้อนหลัง · ตัวคำนวณไม่ถ่วงบันเดิล"
);
