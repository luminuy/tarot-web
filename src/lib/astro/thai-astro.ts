/**
 * 🇹🇭 โหราศาสตร์ไทยพื้นฐาน — ทักษา · อักษรกาลกิณี · มหาทักษา · เลข 7 ตัว
 * ---------------------------------------------------------------------------
 * คำนวณได้ทั้งหมด ไม่ใช้ AI · ไม่ตีความเกินตำรา (ข้อความอ่านผลอยู่ใน `src/data/natal/thai-content.ts`)
 *
 * แหล่งที่ตรวจทานแล้ว (NATAL_CHART_PLAN หัวข้อ 3.14):
 * - ตารางภูมิทักษา 8 วัน (บริวาร … กาลกิณี) + อักษรประจำดาว: thaibabyname.com/astrology_mahataksa.asp
 *   ลำดับดาวเวียนตามทักษา 1 2 3 4 7 5 8 6 (อาทิตย์ จันทร์ อังคาร พุธ เสาร์ พฤหัส ราหู ศุกร์)
 * - วันพุธกลางคืน 18.00–05.59 น. (ศิลปวัฒนธรรม) · เกิด 00.00–05.59 น. นับเป็นวันก่อน (วันโหรเริ่ม 06.00 น.)
 * - มหาทักษา: อาทิตย์ 6 จันทร์ 15 อังคาร 8 พุธ 17 เสาร์ 10 พฤหัส 19 ราหู 12 ศุกร์ 21 = 108 ปี
 *   เริ่มที่ดาววันเกิดเต็มช่วงตั้งแต่เกิด · ดาวแทรก = กำลังดาวเสวย × กำลังดาวแทรก ÷ 108 ปี (horasatthai.com)
 * - เลข 7 ตัว 4 ฐาน: ฐานวัน (อาทิตย์ 1 … เสาร์ 7) · ฐานเดือนจันทรคติ (เดือน n เริ่มที่ ((n−1) mod 7)+1) ·
 *   ฐานปีนักษัตร (ชวด 1 … เริ่มที่ ((n−1) mod 7)+1 · ปีเปลี่ยนวันขึ้น 1 ค่ำ เดือน 5) · ฐานรวมบวกตรง ๆ ไม่หักลบ
 *   (seehorasat.blogspot.com · 7dara.blogspot.com)
 */
import { naksatYear, thaiLunarDate, type ThaiLunarDate } from "./thai-lunar";

/** ดาวในระบบไทย: 1 อาทิตย์ 2 จันทร์ 3 อังคาร 4 พุธ 5 พฤหัส 6 ศุกร์ 7 เสาร์ 8 ราหู */
export type ThaiPlanet = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const TAKSA_ORDER: readonly ThaiPlanet[] = [1, 2, 3, 4, 7, 5, 8, 6];
export const TAKSA_POSITIONS = ["boriwan", "ayu", "det", "sri", "mula", "utsaha", "montri", "kalakini"] as const;
export type TaksaPosition = (typeof TAKSA_POSITIONS)[number];

/** กำลังดาว (ปีที่เสวยในมหาทักษา) */
export const MAHA_TAKSA_YEARS: Record<ThaiPlanet, number> = { 1: 6, 2: 15, 3: 8, 4: 17, 5: 19, 6: 21, 7: 10, 8: 12 };

/** อักษรประจำดาว (อาทิตย์ = สระทั้งหมด) */
export const PLANET_LETTERS: Record<ThaiPlanet, string> = {
  1: "อะาำิีึืุูเแโใไัฤฦ็",
  2: "กขคฆง",
  3: "จฉชซฌญ",
  4: "ฎฏฐฑฒณ",
  5: "บปผฝพฟภม",
  6: "ศษสหฬฮ",
  7: "ดตถทธน",
  8: "ยรลว",
};
/** ทิศประจำดาว */
export const PLANET_DIRECTION: Record<ThaiPlanet, { th: string; en: string }> = {
  1: { th: "อีสาน (ตะวันออกเฉียงเหนือ)", en: "Northeast" },
  2: { th: "บูรพา (ตะวันออก)", en: "East" },
  3: { th: "อาคเนย์ (ตะวันออกเฉียงใต้)", en: "Southeast" },
  4: { th: "ทักษิณ (ใต้)", en: "South" },
  7: { th: "หรดี (ตะวันตกเฉียงใต้)", en: "Southwest" },
  5: { th: "ประจิม (ตะวันตก)", en: "West" },
  8: { th: "พายัพ (ตะวันตกเฉียงเหนือ)", en: "Northwest" },
  6: { th: "อุดร (เหนือ)", en: "North" },
};

export interface ThaiBirthDay {
  /** วันในสัปดาห์ตามวันโหร (0 = อาทิตย์ … 6 = เสาร์) หลังเลื่อนเกิดก่อน 06.00 น. เป็นวันก่อน */
  weekday: number;
  /** ดาวประจำวันเกิด (พุธกลางคืน = 8 ราหู) */
  planet: ThaiPlanet;
  /** วันที่สากลที่ใช้เป็นวันโหร */
  civil: { y: number; m: number; d: number };
  /** เลื่อนเป็นวันก่อนเพราะเกิดก่อน 06.00 น. */
  shifted: boolean;
  /** ไม่รู้เวลาเกิด: แยกพุธกลางวัน/กลางคืนไม่ได้ และอาจเป็นวันก่อน */
  uncertain: boolean;
}

function addDays(y: number, m: number, d: number, k: number) {
  const t = new Date(Date.UTC(y, m - 1, d) + k * 86400000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** วันเกิดแบบโหราไทย จากวันเวลาเกิดท้องถิ่น */
export function thaiBirthDay(y: number, m: number, d: number, hour: number, timeKnown: boolean): ThaiBirthDay {
  const shifted = timeKnown && hour < 6;
  const civil = shifted ? addDays(y, m, d, -1) : { y, m, d };
  const weekday = new Date(Date.UTC(civil.y, civil.m - 1, civil.d)).getUTCDay();
  const night = timeKnown && (hour >= 18 || hour < 6);
  const planet: ThaiPlanet = weekday === 3 && night ? 8 : (([1, 2, 3, 4, 5, 6, 7] as const)[weekday] as ThaiPlanet);
  return { weekday, planet, civil, shifted, uncertain: !timeKnown };
}

/** ภูมิทักษา: ดาวในแต่ละตำแหน่ง เริ่มบริวาร = ดาววันเกิด แล้วเวียนตามลำดับทักษา */
export function taksa(birth: ThaiPlanet): Record<TaksaPosition, ThaiPlanet> {
  const start = TAKSA_ORDER.indexOf(birth);
  const out = {} as Record<TaksaPosition, ThaiPlanet>;
  TAKSA_POSITIONS.forEach((pos, i) => (out[pos] = TAKSA_ORDER[(start + i) % 8]));
  return out;
}

/** ดาวของอักษรตัวหนึ่ง (ไม่ใช่อักษร = null · วรรณยุกต์ ไม่นับ) */
export function letterPlanet(ch: string): ThaiPlanet | null {
  for (const p of [1, 2, 3, 4, 5, 6, 7, 8] as ThaiPlanet[]) if (PLANET_LETTERS[p].includes(ch)) return p;
  return null;
}

export interface NameCheck {
  /** อักษรแต่ละตัวในชื่อ พร้อมตำแหน่งทักษา */
  letters: { ch: string; planet: ThaiPlanet; position: TaksaPosition }[];
  /** อักษรกาลกิณีที่พบ (ซ้ำตัดออก) */
  kalakini: string[];
}

/** ตรวจชื่อภาษาไทยกับทักษาของวันเกิด */
export function checkName(name: string, birth: ThaiPlanet): NameCheck {
  const map = taksa(birth);
  const posOf = new Map<ThaiPlanet, TaksaPosition>(TAKSA_POSITIONS.map((p) => [map[p], p]));
  const letters: NameCheck["letters"] = [];
  for (const ch of name.normalize("NFC")) {
    const p = letterPlanet(ch);
    if (p) letters.push({ ch, planet: p, position: posOf.get(p)! });
  }
  const kalakini = [...new Set(letters.filter((l) => l.position === "kalakini").map((l) => l.ch))];
  return { letters, kalakini };
}

export interface MahaPeriod {
  planet: ThaiPlanet;
  /** อายุเริ่ม–สิ้นสุด (ปี) */
  from: number;
  to: number;
  sub: { planet: ThaiPlanet; from: number; to: number }[];
}

/** มหาทักษา 108 ปี: เริ่มที่ดาววันเกิดเต็มช่วงตั้งแต่เกิด แล้วเวียนตามลำดับทักษา · ดาวแทรกเริ่มที่ดาวเสวยเอง */
export function mahaTaksa(birth: ThaiPlanet): MahaPeriod[] {
  const start = TAKSA_ORDER.indexOf(birth);
  const out: MahaPeriod[] = [];
  let age = 0;
  for (let i = 0; i < 8; i++) {
    const planet = TAKSA_ORDER[(start + i) % 8];
    const len = MAHA_TAKSA_YEARS[planet];
    const sub: MahaPeriod["sub"] = [];
    let s = age;
    for (let j = 0; j < 8; j++) {
      const sp = TAKSA_ORDER[(start + i + j) % 8];
      const sl = (len * MAHA_TAKSA_YEARS[sp]) / 108;
      sub.push({ planet: sp, from: s, to: s + sl });
      s += sl;
    }
    out.push({ planet, from: age, to: age + len, sub });
    age += len;
  }
  return out;
}

export interface SevenNumbers {
  lunar: ThaiLunarDate;
  /** เดือนจันทรคติที่ใช้ (1–12 · เดือน 8 หลังนับเป็น 8) */
  month: number;
  /** ปีนักษัตร 1–12 (ชวด = 1) */
  naksat: number;
  rows: [number[], number[], number[], number[]];
}

const rowFrom = (start: number) => Array.from({ length: 7 }, (_, i) => ((start - 1 + i) % 7) + 1);

/** เลข 7 ตัว 4 ฐาน · `monthOverride`/`naksatOverride` = ผู้ใช้แก้ตามปฏิทินโหรของตัวเอง */
export function sevenNumbers(birth: ThaiBirthDay, monthOverride?: number, naksatOverride?: number): SevenNumbers {
  const { y, m, d } = birth.civil;
  const lunar = thaiLunarDate(y, m, d);
  const month = monthOverride ?? (lunar.month === 88 ? 8 : lunar.month);
  const naksat = naksatOverride ?? naksatYear(y, m, d).index;
  const r1 = rowFrom(birth.weekday + 1);
  const r2 = rowFrom(((month - 1) % 7) + 1);
  const r3 = rowFrom(((naksat - 1) % 7) + 1);
  const r4 = r1.map((v, i) => v + r2[i] + r3[i]);
  return { lunar, month, naksat, rows: [r1, r2, r3, r4] };
}
