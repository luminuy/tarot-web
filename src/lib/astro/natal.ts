/**
 * 🪐 ตัวคำนวณผังดวงกำเนิด (Natal Chart) — ระบบสากล (Tropical) · คำนวณในเครื่องผู้ใช้ทั้งหมด
 * ===========================================================================
 *
 * ## หลัก
 * - **คำนวณด้วยโค้ดล้วน ไม่มี AI** (กฎ "ไม่ใช้ AI ในที่ที่คำนวณได้") — ผลเหมือนเดิมทุกครั้งที่ใส่ข้อมูลเดิม
 * - **ไม่ส่งวันเวลาสถานที่เกิดออกจากเครื่อง** — ไฟล์นี้ถูกโหลดแบบ dynamic import ใน island เท่านั้น
 * - ตำแหน่งดาว: `astronomy-engine` (MIT · VSOP87/ELP ย่อ) ลองจิจูดสุริยวิถีปรากฏ ณ วันนั้น
 *   เทียบ NASA JPL Horizons 10 วันที่ ค.ศ. 1905–2090 คลาดไม่เกิน 1 ลิปดา (ด่าน `test-natal-chart`)
 * - ไครอน: ตารางจาก JPL ทุก 10 วัน (`chiron-table.ts`) ช่วง ค.ศ. 1900–2100
 * - เรือนชะตา 7 ระบบ (สูตรเดียวกับ Swiss Ephemeris): Placidus · Koch · Regiomontanus · Campanus ·
 *   Porphyry · Equal · Whole Sign — ละติจูดเกิน 66 องศา Placidus/Koch หาค่าไม่ได้ ➔ ใช้ Porphyry แทนและแจ้ง
 *
 * ## หน่วย
 * ลองจิจูดทุกค่าเป็นองศา 0–360 (0 = ต้นราศีเมษ) · ความเร็วเป็นองศาต่อวัน
 */
import {
  Body,
  Ecliptic,
  GeoMoonState,
  GeoVector,
  MakeTime,
  RotateVector,
  Rotation_EQJ_ECT,
  SiderealTime,
  e_tilt,
  type AstroTime,
} from "astronomy-engine";
import { CHIRON_DELTAS, CHIRON_START_JD_UT, CHIRON_STEP_DAYS } from "./chiron-table";

// ─────────────────────────── ชนิดข้อมูล ───────────────────────────

export const PLANET_IDS = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
] as const;
export type PlanetId = (typeof PLANET_IDS)[number];

export type PointId = "chiron" | "node" | "southNode" | "lilith" | "fortune" | "vertex";
export type AngleId = "asc" | "mc" | "dsc" | "ic";
export type BodyId = PlanetId | PointId | AngleId;

export type HouseSystem = "placidus" | "koch" | "regiomontanus" | "campanus" | "porphyry" | "equal" | "whole";
export const HOUSE_SYSTEMS: readonly HouseSystem[] = [
  "placidus",
  "koch",
  "regiomontanus",
  "campanus",
  "porphyry",
  "equal",
  "whole",
];

export type NodeType = "true" | "mean";
export type Dignity = "domicile" | "exaltation" | "detriment" | "fall";
export type Element = "fire" | "earth" | "air" | "water";
export type Modality = "cardinal" | "fixed" | "mutable";

export interface NatalInput {
  /** ขณะเกิดเป็น UTC (ms) — แปลงจากเวลาท้องถิ่นแล้ว (`timezone.ts`) */
  utcMs: number;
  /** ไม่รู้เวลาเกิด: `utcMs` ต้องเป็นเที่ยงวันท้องถิ่น · ไม่คำนวณเรือน/ลัคนา/จุดที่ขึ้นกับเวลา */
  timeKnown: boolean;
  /** ขณะเริ่มวันและสิ้นวันเกิด (UTC ms) — ใช้เมื่อไม่รู้เวลาเกิด เพื่อบอกช่วงที่ดวงจันทร์เดิน */
  dayStartUtcMs?: number;
  dayEndUtcMs?: number;
  /** ละติจูด (เหนือเป็นบวก) */
  lat: number;
  /** ลองจิจูด (ตะวันออกเป็นบวก) */
  lon: number;
  houseSystem: HouseSystem;
  nodeType: NodeType;
  /** ตัวคูณ orb ของมุมสัมพันธ์ (0.5 แคบ – 1.5 กว้าง · ค่าปกติ 1) */
  orbScale: number;
}

export interface BodyPosition {
  id: BodyId;
  lon: number;
  /** องศา/วัน (จุดคงที่บางจุดเป็น 0) */
  speed: number;
  retrograde: boolean;
  sign: number;
  degInSign: number;
  /** ช่วง 10 องศาในราศี 0–2 */
  decan: number;
  /** เรือน 1–12 (ไม่รู้เวลาเกิด = null) */
  house: number | null;
  dignities: Dignity[];
}

export type AspectType =
  | "conjunction"
  | "opposition"
  | "trine"
  | "square"
  | "sextile"
  | "quincunx"
  | "semisextile"
  | "semisquare"
  | "sesquiquadrate"
  | "quintile"
  | "biquintile";

export interface AspectDef {
  type: AspectType;
  angle: number;
  orb: number;
  major: boolean;
  /** กลุ่มพลัง: กลมกลืน · ตึง · กลาง */
  tone: "harmonious" | "tense" | "neutral";
}

/** orb มาตรฐาน (องศา) — ใกล้เคียงค่าเริ่มต้นของโปรแกรมโหราสากลทั่วไป · ดวงอาทิตย์/จันทร์บวกเพิ่ม 25% */
export const ASPECT_DEFS: readonly AspectDef[] = [
  { type: "conjunction", angle: 0, orb: 8, major: true, tone: "neutral" },
  { type: "opposition", angle: 180, orb: 8, major: true, tone: "tense" },
  { type: "trine", angle: 120, orb: 7, major: true, tone: "harmonious" },
  { type: "square", angle: 90, orb: 7, major: true, tone: "tense" },
  { type: "sextile", angle: 60, orb: 5, major: true, tone: "harmonious" },
  { type: "quincunx", angle: 150, orb: 3, major: false, tone: "tense" },
  { type: "semisextile", angle: 30, orb: 2, major: false, tone: "harmonious" },
  { type: "semisquare", angle: 45, orb: 2, major: false, tone: "tense" },
  { type: "sesquiquadrate", angle: 135, orb: 2, major: false, tone: "tense" },
  { type: "quintile", angle: 72, orb: 1.5, major: false, tone: "harmonious" },
  { type: "biquintile", angle: 144, orb: 1.5, major: false, tone: "harmonious" },
];

export interface Aspect {
  a: BodyId;
  b: BodyId;
  type: AspectType;
  /** ระยะห่างจากมุมพอดี (องศา) */
  orb: number;
  /** orb ที่ยอมรับได้ของคู่นี้ */
  maxOrb: number;
  /** กำลังเข้าใกล้มุมพอดี (applying) — false = กำลังแยกออก (separating) · null = คู่ที่หยุดนิ่ง */
  applying: boolean | null;
}

export type PatternType = "stellium-sign" | "stellium-house" | "grand-trine" | "t-square" | "grand-cross" | "yod" | "kite";

export interface ChartPattern {
  type: PatternType;
  bodies: BodyId[];
  /** ราศี (stellium-sign) / เรือน (stellium-house) / ธาตุของ grand trine */
  sign?: number;
  house?: number;
  element?: Element;
  /** ยอดของ T-square / Yod (ดาวที่ถูกกดดัน) */
  apex?: BodyId;
}

export interface Distribution {
  elements: Record<Element, BodyId[]>;
  modalities: Record<Modality, BodyId[]>;
  /** คะแนนถ่วงน้ำหนัก (อาทิตย์/จันทร์/ลัคนา 3 · กลางฟ้า 2 · พุธ ศุกร์ อังคาร 2 · พฤหัส เสาร์ 1 · ดาวนอก 0.5) */
  elementScore: Record<Element, number>;
  modalityScore: Record<Modality, number>;
  signScore: number[];
  /** ต้องรู้เวลาเกิด */
  hemispheres: { north: BodyId[]; south: BodyId[]; east: BodyId[]; west: BodyId[] } | null;
  quadrants: [BodyId[], BodyId[], BodyId[], BodyId[]] | null;
  houseCounts: number[] | null;
  polarity: { yang: BodyId[]; yin: BodyId[] };
}

export interface PlanetScore {
  id: PlanetId;
  score: number;
  reasons: string[];
}

export type WarningCode =
  | "polar-house-fallback"
  | "moon-sign-uncertain"
  | "sign-change-on-day"
  | "chiron-out-of-range"
  | "cusp-near";

export interface ChartWarning {
  code: WarningCode;
  bodies?: BodyId[];
}

export interface NatalChart {
  input: NatalInput;
  jdUt: number;
  bodies: BodyPosition[];
  /** ลองจิจูดจุดเริ่มเรือน 1–12 (index 0 = เรือน 1) · ไม่รู้เวลา = null */
  houses: number[] | null;
  houseSystemUsed: HouseSystem | null;
  aspects: Aspect[];
  patterns: ChartPattern[];
  distribution: Distribution;
  dominantPlanets: PlanetScore[];
  /** ดาวเจ้าเรือนลัคนา (แบบดั้งเดิม) · ไม่รู้เวลา = null */
  chartRuler: PlanetId | null;
  /** ดวงอาทิตย์อยู่เหนือขอบฟ้า (กลางวัน) · ไม่รู้เวลา = null */
  dayChart: boolean | null;
  moonPhase: { elongation: number; phase: number };
  /** ไม่รู้เวลาเกิด: ช่วงที่ดวงจันทร์เดินในวันนั้น */
  moonRange: { from: number; to: number } | null;
  /** ไม่รู้เวลาเกิด: ดาวที่ย้ายราศีภายในวันนั้น (ราศีที่แสดงอาจไม่ใช่ของคุณ) */
  signChangesOnDay: BodyId[];
  obliquity: number;
  /** เวลาดาราคติท้องถิ่น (องศา) */
  ramc: number;
  warnings: ChartWarning[];
}

// ─────────────────────────── ตัวช่วยมุม ───────────────────────────

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

export function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

/** ระยะห่างสั้นที่สุดระหว่างสองมุม 0–180 */
export function angularDistance(a: number, b: number): number {
  const d = Math.abs(norm360(a - b));
  return d > 180 ? 360 - d : d;
}

/** a − b ในช่วง −180..180 */
export function signedDiff(a: number, b: number): number {
  return norm360(a - b + 180) - 180;
}

const sind = (x: number) => Math.sin(x * RAD);
const cosd = (x: number) => Math.cos(x * RAD);
const tand = (x: number) => Math.tan(x * RAD);
const asind = (x: number) => Math.asin(Math.max(-1, Math.min(1, x))) * DEG;
const atand = (x: number) => Math.atan(x) * DEG;
const atan2d = (y: number, x: number) => Math.atan2(y, x) * DEG;

// ─────────────────────────── ดาวเคราะห์ ───────────────────────────

const BODY_OF: Record<PlanetId, Body> = {
  sun: Body.Sun,
  moon: Body.Moon,
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
};

export function planetLon(id: PlanetId, time: AstroTime): number {
  return norm360(Ecliptic(GeoVector(BODY_OF[id], time, true)).elon);
}

/** ลองจิจูด + ความเร็ว (ผลต่างกลาง ±6 ชม.) */
export function planetLonSpeed(id: PlanetId, utcMs: number): { lon: number; speed: number } {
  const h = 6 * 3600000;
  const lon = planetLon(id, MakeTime(new Date(utcMs)));
  const before = planetLon(id, MakeTime(new Date(utcMs - h)));
  const after = planetLon(id, MakeTime(new Date(utcMs + h)));
  return { lon, speed: signedDiff(after, before) * 2 };
}

// ─────────────────────────── จุดคำนวณ ───────────────────────────

/** ศตวรรษจูเลียน (TT) นับจาก J2000 */
function centuriesTT(time: AstroTime): number {
  return time.tt / 36525;
}

/** โหนดเหนือเฉลี่ย (Mean Node) — Meeus, Astronomical Algorithms บทที่ 47 */
export function meanNode(time: AstroTime): number {
  const T = centuriesTT(time);
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000);
}

/** โหนดเหนือจริง (True Node · แบบ osculating) จากเวกเตอร์ตำแหน่ง-ความเร็วของดวงจันทร์ บนสุริยวิถี ณ วันนั้น */
export function trueNode(time: AstroTime): number {
  const st = GeoMoonState(time);
  const rot = Rotation_EQJ_ECT(time);
  const r = RotateVector(rot, { x: st.x, y: st.y, z: st.z, t: time } as never);
  const v = RotateVector(rot, { x: st.vx, y: st.vy, z: st.vz, t: time } as never);
  const hx = r.y * v.z - r.z * v.y;
  const hy = r.z * v.x - r.x * v.z;
  // เวกเตอร์โหนดขึ้น = ẑ × h = (−hy, hx, 0)
  return norm360(atan2d(hx, -hy));
}

/** ลิลิธ (Black Moon Lilith · จุดไกลโลกเฉลี่ยของวงโคจรดวงจันทร์) — Meeus บทที่ 47 (perigee + 180) */
function meanLilith(time: AstroTime): number {
  const T = centuriesTT(time);
  const perigee = 83.3532465 + 4069.0137287 * T - 0.01032 * T * T - (T * T * T) / 80053 + (T * T * T * T) / 18999000;
  return norm360(perigee + 180);
}

/** ไครอนจากตาราง JPL (ประมาณค่าด้วยพหุนามลากรองจ์ 4 จุด) · นอกช่วงตาราง = null */
let chironCenti: Int32Array | null = null;
function chironTable(): Int32Array {
  if (!chironCenti) {
    const parts = CHIRON_DELTAS.split(",");
    const arr = new Int32Array(parts.length);
    let acc = 0;
    for (let i = 0; i < parts.length; i++) {
      acc += Number(parts[i]);
      arr[i] = acc;
    }
    chironCenti = arr;
  }
  return chironCenti;
}

export function chironLon(jdUt: number): number | null {
  const table = chironTable();
  const x = (jdUt - CHIRON_START_JD_UT) / CHIRON_STEP_DAYS;
  const i = Math.floor(x) - 1;
  if (i < 0 || i + 3 >= table.length) return null;
  const f = x - (i + 1); // 0..1 ระหว่างจุด i+1 กับ i+2
  const p0 = table[i] / 100;
  const p1 = table[i + 1] / 100;
  const p2 = table[i + 2] / 100;
  const p3 = table[i + 3] / 100;
  // ลากรองจ์ที่ t = −1, 0, 1, 2
  const v =
    (p0 * (-f * (f - 1) * (f - 2))) / 6 +
    (p1 * ((f + 1) * (f - 1) * (f - 2))) / 2 +
    (p2 * (-(f + 1) * f * (f - 2))) / 2 +
    (p3 * ((f + 1) * f * (f - 1))) / 6;
  return norm360(v);
}

// ─────────────────────────── มุมฟ้าและเรือน ───────────────────────────

/**
 * จุดสุริยวิถีที่กำลังขึ้นที่ขอบฟ้าตะวันออก สำหรับเวลาดาราคติ `ramc` ใต้ "ขั้ว" ละติจูด `pole`
 * (สูตรเดียวกับลัคนา — ระบบเรือนหลายระบบคือสูตรนี้ที่เลื่อน ramc/ขั้วต่างกัน · เทียบ Asc1 ของ Swiss Ephemeris
 *  โดย `ascAt(x, φ)` = `Asc1(x + 90, φ)`)
 */
export function ascAt(ramc: number, pole: number, eps: number): number {
  return norm360(atan2d(cosd(ramc), -(sind(ramc) * cosd(eps) + tand(pole) * sind(eps))));
}

/** กลางฟ้า (MC) */
export function mcAt(ramc: number, eps: number): number {
  return norm360(atan2d(sind(ramc), cosd(ramc) * cosd(eps)));
}

/** ไรต์แอสเซนชันของจุดบนสุริยวิถี → ลองจิจูด */
function lonFromRa(ra: number, eps: number): number {
  return norm360(atan2d(sind(ra), cosd(ra) * cosd(eps)));
}

function declOfLon(lon: number, eps: number): number {
  return asind(sind(eps) * sind(lon));
}

/** Placidus — แบ่งครึ่งส่วนโค้งกลางวัน/กลางคืนของแต่ละจุดเป็นสามส่วน (วนแก้จนนิ่ง) · หาไม่ได้ = null */
function placidusCusp(ramc: number, lat: number, eps: number, cusp: 11 | 12 | 2 | 3): number | null {
  let lon = norm360(ramc + (cusp === 11 ? 30 : cusp === 12 ? 60 : cusp === 2 ? 120 : 150));
  for (let i = 0; i < 60; i++) {
    const t = tand(lat) * tand(declOfLon(lon, eps));
    if (Math.abs(t) > 1) return null;
    const sda = 90 + asind(t);
    const ra =
      cusp === 11
        ? ramc + sda / 3
        : cusp === 12
          ? ramc + (2 * sda) / 3
          : cusp === 2
            ? ramc + 60 + (2 * sda) / 3
            : ramc + 120 + sda / 3;
    const next = lonFromRa(norm360(ra), eps);
    if (angularDistance(next, lon) < 1e-7) return next;
    lon = next;
  }
  return lon;
}

function quadrantCusps(asc: number, mc: number, c11: number, c12: number, c2: number, c3: number): number[] {
  return [asc, c2, c3, norm360(mc + 180), norm360(c11 + 180), norm360(c12 + 180), norm360(asc + 180), norm360(c2 + 180), norm360(c3 + 180), mc, c11, c12];
}

function porphyry(asc: number, mc: number): number[] {
  const q1 = norm360(asc - mc); // จาก MC ไป ASC
  const q2 = norm360(mc + 180 - asc); // จาก ASC ไป IC
  return quadrantCusps(asc, mc, mc + q1 / 3, mc + (2 * q1) / 3, asc + q2 / 3, asc + (2 * q2) / 3).map(norm360);
}

export function computeHouses(
  system: HouseSystem,
  ramc: number,
  lat: number,
  eps: number,
): { cusps: number[]; used: HouseSystem } {
  const asc = ascAt(ramc, lat, eps);
  const mc = mcAt(ramc, eps);
  switch (system) {
    case "equal":
      return { cusps: Array.from({ length: 12 }, (_, i) => norm360(asc + 30 * i)), used: system };
    case "whole": {
      const start = Math.floor(asc / 30) * 30;
      return { cusps: Array.from({ length: 12 }, (_, i) => norm360(start + 30 * i)), used: system };
    }
    case "porphyry":
      return { cusps: porphyry(asc, mc), used: system };
    case "regiomontanus": {
      const p1 = atand(tand(lat) * 0.5);
      const p2 = atand(tand(lat) * cosd(30));
      return {
        cusps: quadrantCusps(asc, mc, ascAt(ramc - 60, p1, eps), ascAt(ramc - 30, p2, eps), ascAt(ramc + 30, p2, eps), ascAt(ramc + 60, p1, eps)),
        used: system,
      };
    }
    case "campanus": {
      const p1 = asind(sind(lat) / 2);
      const p2 = asind((Math.sqrt(3) / 2) * sind(lat));
      const x1 = atand(Math.sqrt(3) / cosd(lat));
      const x2 = atand(1 / Math.sqrt(3) / cosd(lat));
      return {
        cusps: quadrantCusps(asc, mc, ascAt(ramc - x1, p1, eps), ascAt(ramc - x2, p2, eps), ascAt(ramc + x2, p2, eps), ascAt(ramc + x1, p1, eps)),
        used: system,
      };
    }
    case "koch": {
      const t = tand(lat) * tand(declOfLon(mc, eps));
      if (Math.abs(lat) >= 66 || Math.abs(t) > 1) return { cusps: porphyry(asc, mc), used: "porphyry" };
      const ad3 = asind(t) / 3;
      return {
        cusps: quadrantCusps(
          asc,
          mc,
          ascAt(ramc - 60 - 2 * ad3, lat, eps),
          ascAt(ramc - 30 - ad3, lat, eps),
          ascAt(ramc + 30 + ad3, lat, eps),
          ascAt(ramc + 60 + 2 * ad3, lat, eps),
        ),
        used: system,
      };
    }
    case "placidus": {
      if (Math.abs(lat) >= 66) return { cusps: porphyry(asc, mc), used: "porphyry" };
      const c11 = placidusCusp(ramc, lat, eps, 11);
      const c12 = placidusCusp(ramc, lat, eps, 12);
      const c2 = placidusCusp(ramc, lat, eps, 2);
      const c3 = placidusCusp(ramc, lat, eps, 3);
      if (c11 === null || c12 === null || c2 === null || c3 === null) return { cusps: porphyry(asc, mc), used: "porphyry" };
      return { cusps: quadrantCusps(asc, mc, c11, c12, c2, c3), used: system };
    }
  }
}

/** ดาวอยู่เรือนไหน (1–12) */
export function houseOf(lon: number, cusps: readonly number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    const span = norm360(end - start);
    if (norm360(lon - start) < span) return i + 1;
  }
  return 1;
}

// ─────────────────────────── ราศี ธาตุ ศักดิ์ดาว ───────────────────────────

export const SIGN_ELEMENT: readonly Element[] = ["fire", "earth", "air", "water", "fire", "earth", "air", "water", "fire", "earth", "air", "water"];
export const SIGN_MODALITY: readonly Modality[] = [
  "cardinal",
  "fixed",
  "mutable",
  "cardinal",
  "fixed",
  "mutable",
  "cardinal",
  "fixed",
  "mutable",
  "cardinal",
  "fixed",
  "mutable",
];

/** เจ้าเรือนราศีแบบดั้งเดิม (ระบบที่ Golden Dawn ใช้ผูกไพ่) */
export const TRADITIONAL_RULER: readonly PlanetId[] = [
  "mars",
  "venus",
  "mercury",
  "moon",
  "sun",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "saturn",
  "jupiter",
];
/** เจ้าเรือนร่วมแบบสมัยใหม่ (ราศีพิจิก กุมภ์ มีน) */
export const MODERN_CORULER: Partial<Record<number, PlanetId>> = { 7: "pluto", 10: "uranus", 11: "neptune" };

const DOMICILE: Partial<Record<PlanetId, number[]>> = {
  sun: [4],
  moon: [3],
  mercury: [2, 5],
  venus: [1, 6],
  mars: [0, 7],
  jupiter: [8, 11],
  saturn: [9, 10],
  uranus: [10],
  neptune: [11],
  pluto: [7],
};
const EXALTATION: Partial<Record<PlanetId, number>> = { sun: 0, moon: 1, mercury: 5, venus: 11, mars: 9, jupiter: 3, saturn: 6 };

export function dignitiesOf(id: BodyId, sign: number): Dignity[] {
  const out: Dignity[] = [];
  const dom = DOMICILE[id as PlanetId];
  const ex = EXALTATION[id as PlanetId];
  if (dom?.includes(sign)) out.push("domicile");
  if (ex === sign) out.push("exaltation");
  if (dom?.some((s) => (s + 6) % 12 === sign)) out.push("detriment");
  if (ex !== undefined && (ex + 6) % 12 === sign) out.push("fall");
  return out;
}

// ─────────────────────────── มุมสัมพันธ์ ───────────────────────────

/** จุดที่ร่วมคำนวณมุมสัมพันธ์ (โหนดใต้ · กลางฟ้าคู่ตรงข้าม · ส่วนแห่งโชค · เวอร์เท็กซ์ ไม่นับ) */
const ASPECT_BODIES: readonly BodyId[] = [...PLANET_IDS, "chiron", "node", "lilith", "asc", "mc"];
const LUMINARIES = new Set<BodyId>(["sun", "moon"]);
const MINOR_POINTS = new Set<BodyId>(["chiron", "node", "lilith", "asc", "mc"]);

export function aspectMaxOrb(def: AspectDef, a: BodyId, b: BodyId, orbScale: number): number {
  let orb = def.orb;
  if (LUMINARIES.has(a) || LUMINARIES.has(b)) orb *= 1.25;
  if (MINOR_POINTS.has(a) || MINOR_POINTS.has(b)) orb = def.major ? Math.min(orb, 5) : Math.min(orb, 1);
  return orb * orbScale;
}

export function findAspects(bodies: readonly BodyPosition[], orbScale: number): Aspect[] {
  const list = bodies.filter((b) => ASPECT_BODIES.includes(b.id));
  const out: Aspect[] = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const A = list[i];
      const B = list[j];
      if ((A.id === "asc" || A.id === "mc") && (B.id === "asc" || B.id === "mc")) continue;
      const sep = angularDistance(A.lon, B.lon);
      let best: Aspect | null = null;
      for (const def of ASPECT_DEFS) {
        const maxOrb = aspectMaxOrb(def, A.id, B.id, orbScale);
        const orb = Math.abs(sep - def.angle);
        if (orb <= maxOrb && (!best || orb < best.orb)) {
          // เข้าใกล้หรือแยกออก: ดูว่า orb เล็กลงไหมเมื่อเดินไปข้างหน้าเล็กน้อย
          let applying: boolean | null = null;
          if (A.speed !== 0 || B.speed !== 0) {
            const dt = 0.01;
            const sepNext = angularDistance(A.lon + A.speed * dt, B.lon + B.speed * dt);
            applying = Math.abs(sepNext - def.angle) < orb;
          }
          best = { a: A.id, b: B.id, type: def.type, orb, maxOrb, applying };
        }
      }
      if (best) out.push(best);
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

// ─────────────────────────── รูปแบบผังดวง ───────────────────────────

function hasAspect(aspects: readonly Aspect[], a: BodyId, b: BodyId, type: AspectType): boolean {
  return aspects.some((x) => x.type === type && ((x.a === a && x.b === b) || (x.a === b && x.b === a)));
}

export function findPatterns(bodies: readonly BodyPosition[], aspects: readonly Aspect[]): ChartPattern[] {
  const planets = bodies.filter((b) => (PLANET_IDS as readonly string[]).includes(b.id));
  const ids = planets.map((p) => p.id);
  const out: ChartPattern[] = [];

  // กลุ่มดาว 3 ดวงขึ้นไปในราศีเดียว/เรือนเดียว (Stellium)
  for (let s = 0; s < 12; s++) {
    const inSign = planets.filter((p) => p.sign === s).map((p) => p.id);
    if (inSign.length >= 3) out.push({ type: "stellium-sign", bodies: inSign, sign: s });
  }
  for (let h = 1; h <= 12; h++) {
    const inHouse = planets.filter((p) => p.house === h).map((p) => p.id);
    if (inHouse.length >= 3) out.push({ type: "stellium-house", bodies: inHouse, house: h });
  }

  const n = ids.length;
  const seen = new Set<string>();
  const key = (arr: BodyId[]) => [...arr].sort().join("|");
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++) {
        const [a, b, c] = [ids[i], ids[j], ids[k]];
        // สามเหลี่ยมใหญ่ (Grand Trine)
        if (hasAspect(aspects, a, b, "trine") && hasAspect(aspects, b, c, "trine") && hasAspect(aspects, a, c, "trine")) {
          const el = SIGN_ELEMENT[planets[i].sign];
          out.push({ type: "grand-trine", bodies: [a, b, c], element: el });
          // ว่าว (Kite): ดาวดวงที่สี่อยู่ตรงข้ามจุดหนึ่ง และทำมุม 60 กับอีกสองจุด
          for (const d of ids) {
            if (d === a || d === b || d === c) continue;
            for (const [apex, o1, o2] of [
              [a, b, c],
              [b, a, c],
              [c, a, b],
            ] as const) {
              if (hasAspect(aspects, d, apex, "opposition") && hasAspect(aspects, d, o1, "sextile") && hasAspect(aspects, d, o2, "sextile")) {
                const kk = key([a, b, c, d]);
                if (!seen.has(`kite${kk}`)) {
                  seen.add(`kite${kk}`);
                  out.push({ type: "kite", bodies: [a, b, c, d], apex: d });
                }
              }
            }
          }
        }
        // T-square: สองดวงตรงข้ามกัน ทั้งคู่ตั้งฉากกับดวงที่สาม
        for (const [apex, x, y] of [
          [a, b, c],
          [b, a, c],
          [c, a, b],
        ] as const) {
          if (hasAspect(aspects, x, y, "opposition") && hasAspect(aspects, apex, x, "square") && hasAspect(aspects, apex, y, "square")) {
            out.push({ type: "t-square", bodies: [x, y, apex], apex });
          }
          // Yod: สองดวงทำมุม 60 กัน ทั้งคู่ทำมุม 150 กับดวงที่สาม
          if (hasAspect(aspects, x, y, "sextile") && hasAspect(aspects, apex, x, "quincunx") && hasAspect(aspects, apex, y, "quincunx")) {
            out.push({ type: "yod", bodies: [x, y, apex], apex });
          }
        }
      }

  // กากบาทใหญ่ (Grand Cross): สองคู่ตรงข้าม + ตั้งฉากครบ 4
  const opps = aspects.filter((x) => x.type === "opposition" && ids.includes(x.a as PlanetId) && ids.includes(x.b as PlanetId));
  for (let i = 0; i < opps.length; i++)
    for (let j = i + 1; j < opps.length; j++) {
      const p = opps[i];
      const q = opps[j];
      if ([p.a, p.b].some((x) => x === q.a || x === q.b)) continue;
      if (
        hasAspect(aspects, p.a, q.a, "square") &&
        hasAspect(aspects, p.a, q.b, "square") &&
        hasAspect(aspects, p.b, q.a, "square") &&
        hasAspect(aspects, p.b, q.b, "square")
      ) {
        const kk = key([p.a, p.b, q.a, q.b]);
        if (!seen.has(`gc${kk}`)) {
          seen.add(`gc${kk}`);
          out.push({ type: "grand-cross", bodies: [p.a, q.a, p.b, q.b] });
        }
      }
    }
  // T-square ที่เป็นส่วนหนึ่งของกากบาทใหญ่ไม่ต้องแสดงซ้ำ
  const crosses = out.filter((p) => p.type === "grand-cross");
  return out.filter((p) => p.type !== "t-square" || !crosses.some((c) => p.bodies.every((b) => c.bodies.includes(b))));
}

// ─────────────────────────── การกระจายและดาวเด่น ───────────────────────────

const WEIGHT: Partial<Record<BodyId, number>> = {
  sun: 3,
  moon: 3,
  asc: 3,
  mc: 2,
  mercury: 2,
  venus: 2,
  mars: 2,
  jupiter: 1,
  saturn: 1,
  uranus: 0.5,
  neptune: 0.5,
  pluto: 0.5,
};

export function distributionOf(bodies: readonly BodyPosition[], timeKnown: boolean): Distribution {
  const counted = bodies.filter((b) => (PLANET_IDS as readonly string[]).includes(b.id) || (timeKnown && (b.id === "asc" || b.id === "mc")));
  const elements: Record<Element, BodyId[]> = { fire: [], earth: [], air: [], water: [] };
  const modalities: Record<Modality, BodyId[]> = { cardinal: [], fixed: [], mutable: [] };
  const elementScore: Record<Element, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalityScore: Record<Modality, number> = { cardinal: 0, fixed: 0, mutable: 0 };
  const signScore = Array<number>(12).fill(0);
  const yang: BodyId[] = [];
  const yin: BodyId[] = [];
  for (const b of counted) {
    const w = WEIGHT[b.id] ?? 1;
    elements[SIGN_ELEMENT[b.sign]].push(b.id);
    modalities[SIGN_MODALITY[b.sign]].push(b.id);
    elementScore[SIGN_ELEMENT[b.sign]] += w;
    modalityScore[SIGN_MODALITY[b.sign]] += w;
    signScore[b.sign] += w;
    (b.sign % 2 === 0 ? yang : yin).push(b.id);
  }
  const planets = bodies.filter((b) => (PLANET_IDS as readonly string[]).includes(b.id));
  let hemispheres: Distribution["hemispheres"] = null;
  let quadrants: Distribution["quadrants"] = null;
  let houseCounts: number[] | null = null;
  if (timeKnown) {
    hemispheres = { north: [], south: [], east: [], west: [] };
    quadrants = [[], [], [], []];
    houseCounts = Array<number>(12).fill(0);
    for (const p of planets) {
      const h = p.house ?? 1;
      houseCounts[h - 1]++;
      (h <= 6 ? hemispheres.north : hemispheres.south).push(p.id);
      (h >= 10 || h <= 3 ? hemispheres.east : hemispheres.west).push(p.id);
      quadrants[Math.floor((h - 1) / 3)].push(p.id);
    }
  }
  return { elements, modalities, elementScore, modalityScore, signScore, hemispheres, quadrants, houseCounts, polarity: { yang, yin } };
}

/**
 * ดาวเด่นในผัง — คะแนนโปร่งใส อธิบายได้ทุกแต้ม:
 * เจ้าเรือนลัคนา +3 · อาทิตย์/จันทร์ +2 · อยู่เรือนมุม (1 4 7 10) +2 · กุมลัคนา/กลางฟ้าในระยะ 8 องศา +3 ·
 * เกษตร +2 · อุจจ์ +1.5 · ประ/นิจ −1 · มุมสัมพันธ์หลักแต่ละมุม +0.5
 */
export function dominantPlanetsOf(bodies: readonly BodyPosition[], aspects: readonly Aspect[], chartRuler: PlanetId | null): PlanetScore[] {
  const asc = bodies.find((b) => b.id === "asc");
  const mc = bodies.find((b) => b.id === "mc");
  const scores: PlanetScore[] = [];
  for (const id of PLANET_IDS) {
    const p = bodies.find((b) => b.id === id);
    if (!p) continue;
    let score = 0;
    const reasons: string[] = [];
    if (id === chartRuler) {
      score += 3;
      reasons.push("chart-ruler");
    }
    if (id === "sun" || id === "moon") {
      score += 2;
      reasons.push("luminary");
    }
    if (p.house && [1, 4, 7, 10].includes(p.house)) {
      score += 2;
      reasons.push("angular");
    }
    if ((asc && angularDistance(p.lon, asc.lon) <= 8) || (mc && angularDistance(p.lon, mc.lon) <= 8)) {
      score += 3;
      reasons.push("on-angle");
    }
    if (p.dignities.includes("domicile")) {
      score += 2;
      reasons.push("domicile");
    }
    if (p.dignities.includes("exaltation")) {
      score += 1.5;
      reasons.push("exaltation");
    }
    if (p.dignities.includes("detriment") || p.dignities.includes("fall")) {
      score -= 1;
      reasons.push("debilitated");
    }
    const majors = aspects.filter((a) => (a.a === id || a.b === id) && ASPECT_DEFS.find((d) => d.type === a.type)?.major).length;
    if (majors) {
      score += majors * 0.5;
      reasons.push(`aspects:${majors}`);
    }
    scores.push({ id, score, reasons });
  }
  return scores.sort((a, b) => b.score - a.score);
}

// ─────────────────────────── ตัวคำนวณหลัก ───────────────────────────

export function position(id: BodyId, lon: number, speed: number, cusps: readonly number[] | null): BodyPosition {
  const L = norm360(lon);
  const sign = Math.floor(L / 30) % 12;
  const degInSign = L - sign * 30;
  return {
    id,
    lon: L,
    speed,
    retrograde: speed < 0,
    sign,
    degInSign,
    decan: Math.min(2, Math.floor(degInSign / 10)),
    house: cusps ? houseOf(L, cusps) : null,
    dignities: dignitiesOf(id, sign),
  };
}

export function computeNatalChart(input: NatalInput): NatalChart {
  const time = MakeTime(new Date(input.utcMs));
  const jdUt = input.utcMs / 86400000 + 2440587.5;
  const eps = e_tilt(time).tobl;
  const ramc = norm360(SiderealTime(time) * 15 + input.lon);
  const warnings: ChartWarning[] = [];

  let cusps: number[] | null = null;
  let houseSystemUsed: HouseSystem | null = null;
  if (input.timeKnown) {
    const h = computeHouses(input.houseSystem, ramc, input.lat, eps);
    cusps = h.cusps;
    houseSystemUsed = h.used;
    if (h.used !== input.houseSystem) warnings.push({ code: "polar-house-fallback" });
  }

  const bodies: BodyPosition[] = [];
  for (const id of PLANET_IDS) {
    const { lon, speed } = planetLonSpeed(id, input.utcMs);
    bodies.push(position(id, lon, speed, cusps));
  }

  // ไครอน
  const ch = chironLon(jdUt);
  if (ch !== null) {
    const ch2 = chironLon(jdUt + 1);
    bodies.push(position("chiron", ch, ch2 === null ? 0 : signedDiff(ch2, ch), cusps));
  } else {
    warnings.push({ code: "chiron-out-of-range" });
  }

  // โหนดและลิลิธ (ความเร็วจากผลต่าง 1 วัน)
  const nodeFn = input.nodeType === "true" ? trueNode : meanNode;
  const node = nodeFn(time);
  const nodeNext = nodeFn(MakeTime(new Date(input.utcMs + 86400000)));
  const nodeSpeed = signedDiff(nodeNext, node);
  bodies.push(position("node", node, nodeSpeed, cusps));
  bodies.push(position("southNode", node + 180, nodeSpeed, cusps));
  const lil = meanLilith(time);
  bodies.push(position("lilith", lil, signedDiff(meanLilith(MakeTime(new Date(input.utcMs + 86400000))), lil), cusps));

  const sun = bodies[0];
  const moon = bodies[1];
  let dayChart: boolean | null = null;
  let chartRuler: PlanetId | null = null;

  if (input.timeKnown && cusps) {
    const asc = ascAt(ramc, input.lat, eps);
    const mc = mcAt(ramc, eps);
    bodies.push(position("asc", asc, 0, cusps));
    bodies.push(position("mc", mc, 0, cusps));
    bodies.push(position("dsc", asc + 180, 0, cusps));
    bodies.push(position("ic", mc + 180, 0, cusps));
    // กลางวัน = ดวงอาทิตย์อยู่ครึ่งบนของผัง (เรือน 7–12 ตามขอบฟ้าจริง)
    dayChart = norm360(sun.lon - asc) > 180;
    // ส่วนแห่งโชค (Part of Fortune) — สูตรกลางวัน/กลางคืนแบบดั้งเดิม
    const fortune = dayChart ? asc + moon.lon - sun.lon : asc + sun.lon - moon.lon;
    bodies.push(position("fortune", fortune, 0, cusps));
    // เวอร์เท็กซ์: จุดตัดเส้นเมริเดียนแรกด้านตะวันตกกับสุริยวิถี
    const colat = input.lat >= 0 ? 90 - input.lat : -90 - input.lat;
    bodies.push(position("vertex", ascAt(ramc + 180, colat, eps), 0, cusps));
    chartRuler = TRADITIONAL_RULER[Math.floor(asc / 30) % 12];
  }

  // ไม่รู้เวลาเกิด: บอกช่วงของดวงจันทร์ + ดาวที่ย้ายราศีในวันนั้น
  let moonRange: NatalChart["moonRange"] = null;
  const signChangesOnDay: BodyId[] = [];
  if (!input.timeKnown && input.dayStartUtcMs !== undefined && input.dayEndUtcMs !== undefined) {
    const t0 = MakeTime(new Date(input.dayStartUtcMs));
    const t1 = MakeTime(new Date(input.dayEndUtcMs));
    const m0 = planetLon("moon", t0);
    const m1 = planetLon("moon", t1);
    moonRange = { from: m0, to: m1 };
    for (const id of PLANET_IDS) {
      const a = Math.floor(planetLon(id, t0) / 30);
      const b = Math.floor(planetLon(id, t1) / 30);
      if (a !== b) signChangesOnDay.push(id);
    }
    if (signChangesOnDay.includes("moon")) warnings.push({ code: "moon-sign-uncertain" });
    const others = signChangesOnDay.filter((x) => x !== "moon");
    if (others.length) warnings.push({ code: "sign-change-on-day", bodies: others });
  }

  // ดาวที่อยู่ใกล้รอยต่อราศีมาก (0°–0.5° หรือ 29.5°–30°) — ข้อมูลเวลาคลาดนิดเดียวราศีก็เปลี่ยน
  if (input.timeKnown) {
    const near = bodies
      .filter((b) => ["sun", "moon", "mercury", "venus", "mars", "asc", "mc"].includes(b.id))
      .filter((b) => b.degInSign < 0.5 || b.degInSign > 29.5)
      .map((b) => b.id);
    if (near.length) warnings.push({ code: "cusp-near", bodies: near });
  }

  const aspects = findAspects(bodies, input.orbScale);
  const patterns = findPatterns(bodies, aspects);
  const distribution = distributionOf(bodies, input.timeKnown);
  const dominantPlanets = dominantPlanetsOf(bodies, aspects, chartRuler);
  const elongation = norm360(moon.lon - sun.lon);

  return {
    input,
    jdUt,
    bodies,
    houses: cusps,
    houseSystemUsed,
    aspects,
    patterns,
    distribution,
    dominantPlanets,
    chartRuler,
    dayChart,
    moonPhase: { elongation, phase: Math.floor(norm360(elongation + 22.5) / 45) % 8 },
    moonRange,
    signChangesOnDay,
    obliquity: eps,
    ramc,
    warnings,
  };
}

/** "12°05′" — องศาในราศีแบบอ่านง่าย (ปัดลงเป็นลิปดา) */
export function formatDegree(degInSign: number): string {
  const totalMin = Math.floor(degInSign * 60 + 1e-9);
  const d = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${d}°${String(m).padStart(2, "0")}′`;
}
