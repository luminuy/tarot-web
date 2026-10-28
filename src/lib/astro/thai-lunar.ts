/**
 * 🌙 ปฏิทินจันทรคติไทย (จุลศักราช) — วันที่สากล ➔ เดือนไทย · ขึ้น/แรม · ปีนักษัตร
 * ---------------------------------------------------------------------------
 * พอร์ตจาก pythaidate 0.2.0 (`lsyear.py` + `csdate.py`) · MIT License · Copyright 2023 Mark Hollow
 * ซึ่งคำนวณตามคัมภีร์สุริยยาตร์แบบดั้งเดิม (หรคุณ · กัมมัชพล · อวมาน · ดิถี) ตามที่ J.C. Eade และ Faraut อธิบาย
 * ไม่ใช่การคำนวณเฟสจันทร์ทางดาราศาสตร์ — ปฏิทินหลวงของไทยใช้สูตรนี้
 *
 * ด่าน `test-natal-chart` เทียบวันมาฆบูชา/วิสาขบูชาที่ประกาศจริงหลายสิบปี
 * ใช้กับเลข 7 ตัว (ฐานเดือน · ฐานปี) และบอกวันจันทรคติของวันเกิด
 *
 * เดือน: 1 = อ้าย · 2 = ยี่ · 3–12 · ปีอธิกมาสมีเดือน 8 สองหน (เดือน 8 หลังแทนด้วย 88)
 * วัน: 1–15 = ขึ้น 1–15 ค่ำ · 16–30 = แรม 1–15 ค่ำ (เดือนขาดมีแรมถึง 14 ค่ำ)
 */

const DAYS_IN_800_YEARS = 292207;
const TIME_UNITS_IN_1_DAY = 800;
const EPOCH_OFFSET = 373;
const CS_JULIAN_DAY_OFFSET = 1954167;

type CalType = "A" | "B" | "C" | "c";

const fdiv = (a: number, b: number) => Math.floor(a / b);
const mod = (a: number, b: number) => ((a % b) + b) % b;

interface LSYear {
  offset: boolean;
  horakhun: number;
  kammacapon: number;
  avoman: number;
  tithi: number;
  weekday: number;
  langsak: number;
  nyd: number;
  leapday: boolean;
  calType: CalType;
  nextNyd: number;
  offsetDays: number;
}

/** ปีจันทรคติ ณ วันขึ้นปีใหม่ (`LSYear` ของต้นฉบับ) */
function lsYear(year: number): LSYear {
  const horakhun = fdiv(year * DAYS_IN_800_YEARS + EPOCH_OFFSET, TIME_UNITS_IN_1_DAY) + 1;
  const kammacapon = TIME_UNITS_IN_1_DAY - mod(year * DAYS_IN_800_YEARS + EPOCH_OFFSET, TIME_UNITS_IN_1_DAY);
  const avoQuot = fdiv(horakhun * 11 + 650, 692);
  let avoman = mod(horakhun * 11 + 650, 692);
  if (avoman === 0) avoman = 692;
  let tithi = mod(avoQuot + horakhun, 30);
  if (avoman === 692) tithi -= 1;
  const weekday = mod(horakhun, 7);

  const horakhun1 = fdiv((year + 1) * DAYS_IN_800_YEARS + EPOCH_OFFSET, TIME_UNITS_IN_1_DAY) + 1;
  const quot1 = fdiv(horakhun1 * 11 + 650, 692);
  const tithi1 = mod(quot1 + horakhun1, 30);

  // Faraut หน้า 28
  const langsak = Math.max(1, tithi);
  let nyd = langsak;
  if (nyd < 6) nyd += 29;
  nyd = mod(weekday - nyd + 1 + 35, 7);

  const leapday = kammacapon <= 207;
  let calType: CalType = "A";
  if (tithi > 24 || tithi < 6) calType = "C";
  if (tithi === 25 && tithi1 === 5) calType = "A";
  if ((leapday && avoman <= 126) || (!leapday && avoman <= 137)) calType = calType !== "C" ? "B" : "c";

  const nextNyd = calType === "A" ? mod(nyd + 4, 7) : calType === "B" ? mod(nyd + 5, 7) : mod(nyd + 6, 7);
  return { offset: false, horakhun, kammacapon, avoman, tithi, weekday, langsak, nyd, leapday, calType, nextNyd, offsetDays: 0 };
}

const year0Cache = new Map<number, LSYear>();

/** ปรับชนิดปีให้ต่อเนื่องกับปีข้างเคียง (`calculate_year0` ของต้นฉบับ) */
function year0(year: number): LSYear {
  const hit = year0Cache.get(year);
  if (hit) return hit;
  const y = [lsYear(year - 2), lsYear(year - 1), lsYear(year), lsYear(year + 1), lsYear(year + 2)];
  for (let i = 0; i < 5; i++) {
    if (y[2].tithi === 24 && y[3].tithi === 6) {
      y[i].calType = "C";
      y[i].nextNyd = mod(y[i].nextNyd + 2, 7);
    }
  }
  // อธิกวารกับอธิกมาสชนกันในปีเดียวไม่ได้ (ต่างจากพม่า) ➔ ย้ายอธิกวารไปปีก่อนหรือปีถัดไปให้วันในสัปดาห์ต่อเนื่อง
  for (const i of [1, 2, 3]) {
    if (y[i].calType === "c") {
      const j = y[i].nyd === y[i - 1].nextNyd ? 1 : -1;
      y[i + j].calType = "B";
      y[i + j].nextNyd = mod(y[i + j].nextNyd + 1, 7);
    }
  }
  for (const i of [1, 2, 3]) {
    if (y[i - 1].nextNyd !== y[i].nyd && y[i].nextNyd !== y[i + 1].nyd) {
      y[i].offset = true;
      y[i].langsak += 1;
      y[i].nyd = mod(y[i].nyd + 6, 7);
      y[i].nextNyd = mod(y[i].nextNyd + 6, 7);
    }
  }
  for (let i = 0; i < 5; i++) if (y[i].calType === "c") y[i].calType = "C";
  const r = y[2];
  r.offsetDays = r.langsak;
  if (r.offsetDays < 6 + (r.offset ? 1 : 0)) r.offsetDays += 29;
  year0Cache.set(year, r);
  return r;
}

const LUNAR_MONTHS = [0, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 8, 88, 15, 16];
const FIND: Record<"A" | "B" | "C", readonly [number, number][]> = {
  A: [[383, 16], [354, 15], [324, 12], [295, 11], [265, 10], [236, 9], [206, 8], [177, 7], [147, 6], [118, 5], [88, 4], [59, 3], [29, 2]],
  B: [[384, 16], [355, 15], [325, 12], [296, 11], [266, 10], [237, 9], [207, 8], [178, 7], [148, 6], [119, 5], [89, 4], [59, 3], [29, 2]],
  C: [[384, 15], [354, 12], [325, 11], [295, 10], [266, 9], [236, 8], [207, 7], [177, 6], [148, 5], [118, 14], [88, 13], [59, 3], [29, 2]],
};

function findDate(cal: "A" | "B" | "C", days: number): { month: number; day: number } {
  for (const [a, b] of FIND[cal]) {
    if (days > a) return { month: LUNAR_MONTHS[b], day: days - a };
  }
  return { month: LUNAR_MONTHS[1], day: days };
}

export interface ThaiLunarDate {
  /** จุลศักราช */
  csYear: number;
  /** 1–12 · 88 = เดือน 8 หลังในปีอธิกมาส */
  month: number;
  /** 1–15 ขึ้น · 16–30 แรม */
  day: number;
  waxing: boolean;
  /** ค่ำที่ (1–15) */
  phaseDay: number;
  leapMonthYear: boolean;
}

/** Julian Day Number (เที่ยงวัน) ของวันที่ตามปฏิทินเกรโกเรียน */
export function julianDayNumber(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000) + 2440588;
}

/** วันที่สากล (ปี เดือน วัน ตามเวลาท้องถิ่น) ➔ วันทางจันทรคติไทย */
export function thaiLunarFromJdn(jd: number): ThaiLunarDate {
  const hk = jd - CS_JULIAN_DAY_OFFSET;
  let year = fdiv(hk * 800 - 373, 292207);
  let days: number;
  if (mod(hk, 292207) === 95333) {
    year -= 1;
    days = 365;
  } else {
    days = hk - year0(year).horakhun;
  }
  // fromyd
  let y0 = year0(year);
  let daysInYear = 365 + (y0.leapday ? 1 : 0);
  while (days > daysInYear) {
    year += 1;
    days -= daysInYear;
    y0 = year0(year);
    daysInYear = 365 + (y0.leapday ? 1 : 0);
  }
  const cal = (y0.calType === "c" ? "C" : y0.calType) as "A" | "B" | "C";
  const r = findDate(cal, y0.offsetDays + days);
  const month = r.month === 15 || r.month === 16 ? r.month - 10 : r.month;
  return { csYear: year, month, day: r.day, waxing: r.day <= 15, phaseDay: r.day <= 15 ? r.day : r.day - 15, leapMonthYear: cal === "C" };
}

export function thaiLunarDate(y: number, m: number, d: number): ThaiLunarDate {
  return thaiLunarFromJdn(julianDayNumber(y, m, d));
}

export const NAKSAT_TH = ["ชวด", "ฉลู", "ขาล", "เถาะ", "มะโรง", "มะเส็ง", "มะเมีย", "มะแม", "วอก", "ระกา", "จอ", "กุน"] as const;
export const NAKSAT_EN = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"] as const;
export const LUNAR_MONTH_TH: Record<number, string> = {
  1: "อ้าย",
  2: "ยี่",
  3: "สาม",
  4: "สี่",
  5: "ห้า",
  6: "หก",
  7: "เจ็ด",
  8: "แปด",
  88: "แปดหลัง",
  9: "เก้า",
  10: "สิบ",
  11: "สิบเอ็ด",
  12: "สิบสอง",
};

/**
 * ปีนักษัตรทางโหราศาสตร์ไทย: เปลี่ยนวันขึ้น 1 ค่ำ เดือน 5 (ไม่ใช่ 1 มกราคม และไม่ใช่วันสงกรานต์)
 * คืนลำดับ 1–12 (ชวด = 1) · หาวันขึ้น 1 ค่ำ เดือน 5 ล่าสุดที่ไม่เกินวันนี้ แล้วนับจากปีสากลของวันนั้น
 */
export function naksatYear(y: number, m: number, d: number): { index: number; changeJdn: number } {
  const jd = julianDayNumber(y, m, d);
  for (let k = 0; k < 420; k++) {
    const t = thaiLunarFromJdn(jd - k);
    if (t.month === 5 && t.day === 1) {
      const gy = gregorianYearOfJdn(jd - k);
      return { index: mod(gy - 4, 12) + 1, changeJdn: jd - k };
    }
  }
  // ไม่ควรถึง (เดือน 5 มีทุกปี) — ใช้ปีสากลแทนและให้ผู้ใช้แก้เองได้
  return { index: mod(y - 4, 12) + 1, changeJdn: jd };
}

export function gregorianYearOfJdn(jd: number): number {
  return new Date((jd - 2440588) * 86400000).getUTCFullYear();
}

export function dateOfJdn(jd: number): { y: number; m: number; d: number } {
  const t = new Date((jd - 2440588) * 86400000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
