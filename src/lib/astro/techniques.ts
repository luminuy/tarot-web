/**
 * ⏳ เครื่องมือตามเวลาของผังดวง — ดาวจร · ปฏิทินดาวจร · ดาวก้าวหน้า · ผังวันเกิดปีนี้ · ผังจันทร์คืน
 * ===========================================================================
 * ทุกอย่างคำนวณจากผังเกิด (`NatalChart`) ในเครื่องผู้ใช้ ไม่มี AI ไม่ส่งข้อมูลออก
 * โหลดพร้อมแท็บ "ตามเวลา" เท่านั้น (dynamic import) — ไม่ถ่วงผังเกิด
 *
 * - ดาวจร (Transit): ดาวบนฟ้า ณ วันที่เลือก วางลงเรือนของผังเกิด + มุมที่ทำกับดาวเกิด (มุมหลัก · orb แคบ)
 *   ดาวจรเดินช้า (พฤหัส–พลูโต ไครอน โหนด) บอกช่วงเวลาที่มุมยังมีผลและวันที่ตรงพอดี (สแกนรายวัน ±400 วัน)
 * - ปฏิทินดาวจร: วันที่ดาวเดินช้าทำมุมตรงพอดีกับจุดในผังเกิด ใน 12 เดือนข้างหน้า + ย้ายเรือน/ย้ายราศี
 * - ดาวก้าวหน้า (Secondary Progression): 1 วันหลังเกิด = 1 ปีของชีวิต · กลางฟ้าเดินด้วย Solar Arc
 * - ผังวันเกิดปีนี้ (Solar Return): ขณะที่ดวงอาทิตย์กลับมาที่องศาเดิมของวันเกิด
 * - ผังจันทร์คืน (Lunar Return): ขณะที่ดวงจันทร์กลับมาที่องศาเดิม (ทุก ~27.3 วัน)
 */
import { MakeTime, e_tilt } from "astronomy-engine";
import {
  ASPECT_DEFS,
  PLANET_IDS,
  angularDistance,
  ascAt,
  chironLon,
  computeNatalChart,
  houseOf,
  meanNode,
  norm360,
  planetLon,
  planetLonSpeed,
  position,
  signedDiff,
  trueNode,
  zodiacShift,
  type AspectType,
  type BodyId,
  type BodyPosition,
  type NatalChart,
  type NatalInput,
  type PlanetId,
  type Zodiac,
} from "./natal";

const DAY = 86400000;
const TROPICAL_YEAR_DAYS = 365.24219;

/** มุมหลัก 5 แบบที่ใช้กับดาวจร/ดาวก้าวหน้า */
const MAJOR: readonly { type: AspectType; angle: number }[] = [
  { type: "conjunction", angle: 0 },
  { type: "opposition", angle: 180 },
  { type: "trine", angle: 120 },
  { type: "square", angle: 90 },
  { type: "sextile", angle: 60 },
];

export type MovingId = PlanetId | "chiron" | "node";
export const MOVING_IDS: readonly MovingId[] = [...PLANET_IDS, "chiron", "node"];
/** ดาวเดินช้า — มุมของดาวพวกนี้กินเวลาเป็นสัปดาห์ถึงเดือน จึงคุ้มที่จะบอกช่วงเวลา */
export const SLOW_IDS: readonly MovingId[] = ["jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "node"];
/** จุดในผังเกิดที่ดาวจร/ดาวก้าวหน้าไปกระทบ */
const NATAL_TARGETS: readonly BodyId[] = [...PLANET_IDS, "chiron", "node", "asc", "mc"];

/** ลองจิจูดของดาวที่เดินได้ ณ ขณะหนึ่ง (null = นอกช่วงตารางไครอน) */
function movingLon(id: MovingId, utcMs: number, nodeType: NatalInput["nodeType"], zodiac?: Zodiac): number | null {
  const ay = zodiacShift(zodiac, utcMs);
  if (id === "chiron") {
    const c = chironLon(utcMs / DAY + 2440587.5);
    return c === null ? null : norm360(c - ay);
  }
  if (id === "node") return norm360((nodeType === "true" ? trueNode : meanNode)(MakeTime(new Date(utcMs))) - ay);
  return norm360(planetLon(id, MakeTime(new Date(utcMs))) - ay);
}

function movingPositions(utcMs: number, nodeType: NatalInput["nodeType"], cusps: readonly number[] | null, zodiac?: Zodiac): BodyPosition[] {
  const out: BodyPosition[] = [];
  const ay = zodiacShift(zodiac, utcMs);
  for (const id of MOVING_IDS) {
    if ((PLANET_IDS as readonly string[]).includes(id)) {
      const { lon, speed } = planetLonSpeed(id as PlanetId, utcMs);
      out.push(position(id, lon - ay, speed, cusps));
      continue;
    }
    const lon = movingLon(id, utcMs, nodeType, zodiac);
    const next = movingLon(id, utcMs + DAY, nodeType, zodiac);
    if (lon === null) continue;
    out.push(position(id, lon, next === null ? 0 : signedDiff(next, lon), cusps));
  }
  return out;
}

// ─────────────────────────── ดาวจร ───────────────────────────

export interface TransitAspect {
  /** ดาวจร */
  t: MovingId;
  /** จุดในผังเกิด */
  n: BodyId;
  type: AspectType;
  orb: number;
  maxOrb: number;
  applying: boolean | null;
  /** ดาวเดินช้า: ช่วงที่ orb อยู่ในเกณฑ์ (UTC ms) และวันที่ตรงพอดีในช่วงนั้น */
  period?: { start: number; end: number; exact: number[]; openStart: boolean; openEnd: boolean; closest: { utcMs: number; orb: number } };
}

export interface TransitResult {
  utcMs: number;
  bodies: BodyPosition[];
  aspects: TransitAspect[];
}

/** orb ของดาวจร: แคบกว่าผังเกิดมาก (ดวงจันทร์ 2.5 · ดวงอาทิตย์ 2 · ที่เหลือ 1.5) */
function transitOrb(t: MovingId, scale: number): number {
  return (t === "moon" ? 2.5 : t === "sun" ? 2 : 1.5) * scale;
}

/** ลองจิจูดรายวันของดาวเดินช้า ±400 วัน (แคชต่อการคำนวณหนึ่งครั้ง) */
function dailySeries(id: MovingId, center: number, nodeType: NatalInput["nodeType"], days: number, zodiac?: Zodiac): (number | null)[] {
  const out: (number | null)[] = [];
  for (let k = -days; k <= days; k++) out.push(movingLon(id, center + k * DAY, nodeType, zodiac));
  return out;
}

function aspectDeviation(tLon: number, nLon: number, angle: number): number {
  return angularDistance(tLon, nLon) - angle;
}

/** `withPeriods = false` = ข้ามการไล่หาช่วงเวลาของดาวเดินช้า (ไล่ ±400 วัน) — ใช้ฝั่งเซิร์ฟเวอร์ที่ต้องการแค่ภาพ ณ ขณะนั้น */
export function computeTransits(natal: NatalChart, utcMs: number, orbScale = 1, withPeriods = true): TransitResult {
  const nodeType = natal.input.nodeType;
  const zodiac = natal.input.zodiac;
  const bodies = movingPositions(utcMs, nodeType, natal.houses, zodiac);
  const targets = natal.bodies.filter((b) => NATAL_TARGETS.includes(b.id));
  const aspects: TransitAspect[] = [];
  const SCAN = 400;
  const series = new Map<MovingId, (number | null)[]>();

  for (const tb of bodies) {
    const t = tb.id as MovingId;
    const maxOrb = transitOrb(t, orbScale);
    for (const nb of targets) {
      if (t === "node" && nb.id === "node") continue;
      let best: TransitAspect | null = null;
      for (const a of MAJOR) {
        const orb = Math.abs(aspectDeviation(tb.lon, nb.lon, a.angle));
        if (orb <= maxOrb && (!best || orb < best.orb)) {
          const next = Math.abs(aspectDeviation(tb.lon + tb.speed * 0.01, nb.lon, a.angle));
          best = { t, n: nb.id, type: a.type, orb, maxOrb, applying: tb.speed === 0 ? null : next < orb };
        }
      }
      if (!best) continue;
      if (withPeriods && SLOW_IDS.includes(t)) {
        let s = series.get(t);
        if (!s) {
          s = dailySeries(t, utcMs, nodeType, SCAN, zodiac);
          series.set(t, s);
        }
        const angle = MAJOR.find((m) => m.type === best!.type)!.angle;
        const dev = s.map((lon) => (lon === null ? null : aspectDeviation(lon, nb.lon, angle)));
        let i0 = SCAN;
        let i1 = SCAN;
        while (i0 > 0 && dev[i0 - 1] !== null && Math.abs(dev[i0 - 1]!) <= maxOrb) i0--;
        while (i1 < dev.length - 1 && dev[i1 + 1] !== null && Math.abs(dev[i1 + 1]!) <= maxOrb) i1++;
        const exact: number[] = [];
        let closestI = SCAN;
        for (let i = i0; i <= i1; i++) if (Math.abs(dev[i]!) < Math.abs(dev[closestI]!)) closestI = i;
        for (let i = Math.max(i0, 1); i <= Math.min(i1, dev.length - 2); i++) {
          const a0 = Math.abs(dev[i - 1]!);
          const a1 = Math.abs(dev[i]!);
          const a2 = Math.abs(dev[i + 1]!);
          // จุดต่ำสุดเฉพาะที่ ที่ต่ำพอจะนับว่า "ตรงพอดี" (ดาวถอยหลังอาจแตะแล้วถอยกลับ)
          if (a1 <= a0 && a1 < a2 && a1 < 0.25) exact.push(utcMs + (i - SCAN) * DAY);
        }
        best.period = {
          start: utcMs + (i0 - SCAN) * DAY,
          end: utcMs + (i1 - SCAN) * DAY,
          exact,
          openStart: i0 === 0,
          openEnd: i1 === dev.length - 1,
          closest: { utcMs: utcMs + (closestI - SCAN) * DAY, orb: Math.abs(dev[closestI]!) },
        };
      }
      aspects.push(best);
    }
  }
  // เรียง: ดาวเดินช้าก่อน (มีผลนาน) แล้วตาม orb
  const weight = (t: MovingId) => (SLOW_IDS.includes(t) ? 0 : 1);
  aspects.sort((a, b) => weight(a.t) - weight(b.t) || a.orb - b.orb);
  return { utcMs, bodies, aspects };
}

// ─────────────────────────── ดวงวันนี้ ───────────────────────────

export type DayTone = "flow" | "friction" | "mixed" | "intense" | "quiet";

export interface DailyOverview {
  utcMs: number;
  /** ดวงจันทร์จร (`house` = เรือนของผังเกิด ถ้ารู้เวลาเกิด) */
  moon: BodyPosition;
  /** ข้างขึ้นข้างแรมของวันนี้ 0–7 (0 = จันทร์ดับ · 4 = เต็มดวง) */
  moonPhase: number;
  /** มุมดาวจรเดินเร็วที่แน่นที่สุด (ไม่เกิน 4) */
  fast: TransitAspect[];
  /** มุมดาวเดินช้าที่เป็นพื้นหลังช่วงนี้ (ไม่เกิน 2) */
  slow: TransitAspect[];
  tone: DayTone;
}

/**
 * สรุปดวงของวันจากผังเกิด — คำนวณในเครื่อง ไม่ใช้ AI (กฎ "ไม่ใช้ AI ในที่ที่คำนวณได้")
 * ภาพรวมของวันนับจากมุมของดาวเดินเร็ว: กุม (0 องศา) นับเป็นกลาง · มีแต่กุม = วันเข้มข้น
 */
export function dailyOverview(natal: NatalChart, utcMs: number): DailyOverview {
  const tr = computeTransits(natal, utcMs);
  const moon = tr.bodies.find((b) => b.id === "moon")!;
  const sun = tr.bodies.find((b) => b.id === "sun")!;
  const moonPhase = Math.floor(norm360(norm360(moon.lon - sun.lon) + 22.5) / 45) % 8;
  const fast = tr.aspects.filter((a) => !SLOW_IDS.includes(a.t)).sort((a, b) => a.orb - b.orb).slice(0, 4);
  const slow = tr.aspects.filter((a) => SLOW_IDS.includes(a.t)).sort((a, b) => a.orb - b.orb).slice(0, 2);
  const tone = (a: TransitAspect) => ASPECT_DEFS.find((d) => d.type === a.type)?.tone ?? "neutral";
  const soft = fast.filter((a) => tone(a) === "harmonious").length;
  const hard = fast.filter((a) => tone(a) === "tense").length;
  const dayTone: DayTone = soft && hard ? "mixed" : soft ? "flow" : hard ? "friction" : fast.length ? "intense" : "quiet";
  return { utcMs, moon, moonPhase, fast, slow, tone: dayTone };
}

// ─────────────────────────── ปฏิทินดาวจร ───────────────────────────

export type TransitEvent =
  | { kind: "exact"; utcMs: number; t: MovingId; n: BodyId; type: AspectType; retrograde: boolean }
  | { kind: "house"; utcMs: number; t: MovingId; house: number }
  | { kind: "sign"; utcMs: number; t: MovingId; sign: number };

/** เหตุการณ์สำคัญของดาวเดินช้า (พฤหัส–พลูโต ไครอน) ในช่วง `days` วันนับจาก `fromUtcMs` */
export function transitCalendar(natal: NatalChart, fromUtcMs: number, days = 365): TransitEvent[] {
  const nodeType = natal.input.nodeType;
  const targets = natal.bodies.filter((b) => NATAL_TARGETS.includes(b.id));
  const ids: MovingId[] = ["jupiter", "saturn", "uranus", "neptune", "pluto", "chiron"];
  const events: TransitEvent[] = [];
  for (const t of ids) {
    const lons: (number | null)[] = [];
    for (let k = 0; k <= days; k++) lons.push(movingLon(t, fromUtcMs + k * DAY, nodeType, natal.input.zodiac));
    for (let k = 1; k <= days; k++) {
      const p = lons[k - 1];
      const c = lons[k];
      if (p === null || c === null) continue;
      const when = fromUtcMs + k * DAY;
      const retrograde = signedDiff(c, p) < 0;
      if (Math.floor(p / 30) !== Math.floor(c / 30)) events.push({ kind: "sign", utcMs: when, t, sign: Math.floor(c / 30) });
      if (natal.houses) {
        const hp = houseOf(p, natal.houses);
        const hc = houseOf(c, natal.houses);
        if (hp !== hc) events.push({ kind: "house", utcMs: when, t, house: hc });
      }
      for (const nb of targets) {
        for (const a of MAJOR) {
          // จุดตรงพอดี = ค่าเบี่ยงแบบมีเครื่องหมายเปลี่ยนข้าง (ทั้งมุม +a และ −a)
          for (const sgn of a.angle === 0 || a.angle === 180 ? [1] : [1, -1]) {
            const target = norm360(nb.lon + sgn * a.angle);
            const d0 = signedDiff(p, target);
            const d1 = signedDiff(c, target);
            if (Math.abs(d0) < 5 && Math.abs(d1) < 5 && (d0 === 0 || d0 * d1 < 0)) {
              events.push({ kind: "exact", utcMs: when, t, n: nb.id, type: a.type, retrograde });
            }
          }
        }
      }
    }
  }
  return events.sort((a, b) => a.utcMs - b.utcMs);
}

// ─────────────────────────── ดาวก้าวหน้า ───────────────────────────

export interface ProgressionResult {
  /** อายุ (ปี) ณ วันที่เลือก */
  age: number;
  /** ขณะของ "วันก้าวหน้า" (เกิด + อายุ วัน) */
  progUtcMs: number;
  bodies: BodyPosition[];
  aspects: TransitAspect[];
  /** มุมห่างจันทร์-อาทิตย์ก้าวหน้า (ข้างขึ้นข้างแรมก้าวหน้า) */
  moonPhase: { elongation: number; phase: number };
  solarArc: number;
}

export function computeProgressions(natal: NatalChart, targetUtcMs: number): ProgressionResult {
  const age = (targetUtcMs - natal.input.utcMs) / (TROPICAL_YEAR_DAYS * DAY);
  const progUtcMs = natal.input.utcMs + age * DAY;
  const moving = movingPositions(progUtcMs, natal.input.nodeType, natal.houses, natal.input.zodiac).filter((b) => (PLANET_IDS as readonly string[]).includes(b.id));
  const natalSun = natal.bodies.find((b) => b.id === "sun")!;
  const progSun = moving.find((b) => b.id === "sun")!;
  const solarArc = norm360(progSun.lon - natalSun.lon);
  const bodies = [...moving];
  const mc = natal.bodies.find((b) => b.id === "mc");
  if (mc && natal.houses) {
    const eps = e_tilt(MakeTime(new Date(progUtcMs))).tobl;
    const progMc = norm360(mc.lon + solarArc);
    // RAMC ของกลางฟ้าก้าวหน้า = ไรต์แอสเซนชันของจุดนั้นบนสุริยวิถี (คิดบนพิกัดสายนะ แล้วเลื่อนกลับถ้าเป็นนิรายนะ)
    const ay = zodiacShift(natal.input.zodiac, progUtcMs);
    const mcTrop = progMc + ay;
    const r = Math.PI / 180;
    const ramc = norm360(Math.atan2(Math.sin(mcTrop * r) * Math.cos(eps * r), Math.cos(mcTrop * r)) / r);
    bodies.push(position("mc", progMc, 0, natal.houses));
    bodies.push(position("asc", ascAt(ramc, natal.input.lat, eps) - ay, 0, natal.houses));
  }
  const targets = natal.bodies.filter((b) => NATAL_TARGETS.includes(b.id));
  const aspects: TransitAspect[] = [];
  // ดาวก้าวหน้าที่มีความหมาย = ดาวเดินเร็ว + มุมฟ้า (ดาวพฤหัสขึ้นไปขยับแค่ไม่กี่องศาทั้งชีวิต จึงกุมตัวเองเสมอ)
  const PROG_SOURCES: readonly BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "asc", "mc"];
  for (const pb of bodies.filter((b) => PROG_SOURCES.includes(b.id))) {
    for (const nb of targets) {
      for (const a of MAJOR) {
        const orb = Math.abs(aspectDeviation(pb.lon, nb.lon, a.angle));
        if (orb <= 1) {
          const next = Math.abs(aspectDeviation(pb.lon + pb.speed * 0.01, nb.lon, a.angle));
          aspects.push({ t: pb.id as MovingId, n: nb.id, type: a.type, orb, maxOrb: 1, applying: pb.speed === 0 ? null : next < orb });
        }
      }
    }
  }
  aspects.sort((a, b) => a.orb - b.orb);
  const pm = moving.find((b) => b.id === "moon")!;
  const elongation = norm360(pm.lon - progSun.lon);
  return { age, progUtcMs, bodies, aspects, moonPhase: { elongation, phase: Math.floor(norm360(elongation + 22.5) / 45) % 8 }, solarArc };
}

// ─────────────────────────── รีเทิร์น ───────────────────────────

/** หาขณะที่ดาว `id` กลับมาที่ลองจิจูด `targetLon` ใกล้ `guessUtcMs` (นิวตัน + ป้องกันกระโดด) */
function findReturn(id: "sun" | "moon", targetLon: number, guessUtcMs: number, zodiac?: Zodiac): number {
  let t = guessUtcMs;
  const meanSpeed = id === "sun" ? 0.9856 : 13.176;
  for (let i = 0; i < 30; i++) {
    const { lon, speed } = planetLonSpeed(id, t);
    // นิรายนะ: กลับมาที่ตำแหน่งนิรายนะเดิม (ดวงอาทิตย์ช้ากว่าแบบสายนะราว 20 นาทีต่อปีที่ผ่านไป)
    const d = signedDiff(targetLon, lon - zodiacShift(zodiac, t));
    if (Math.abs(d) < 1e-6) break;
    t += (d / (speed > 0.1 ? speed : meanSpeed)) * DAY;
  }
  return t;
}

export interface ReturnPlace {
  lat: number;
  lon: number;
}

/**
 * ผังวันเกิดครั้งที่ `nth` (0 = ปีที่เกิด · 1 = วันเกิดครบ 1 ขวบ …) ณ สถานที่ที่เลือก
 * ⚠️ รับเป็นจำนวนปีหลังเกิด ไม่ใช่ปี ค.ศ. — วันเกิดตามเวลาท้องถิ่นกับตาม UTC อาจคนละปี (เกิด 1 ม.ค. ตอนเช้าในไทย = 31 ธ.ค. UTC)
 */
export function solarReturn(natal: NatalChart, nth: number, place: ReturnPlace): NatalChart {
  const sun = natal.bodies.find((b) => b.id === "sun")!;
  const utcMs = findReturn("sun", sun.lon, natal.input.utcMs + nth * TROPICAL_YEAR_DAYS * DAY, natal.input.zodiac);
  return computeNatalChart({ ...natal.input, ...place, utcMs, timeKnown: true, dayStartUtcMs: undefined, dayEndUtcMs: undefined });
}

/** ผังจันทร์คืนครั้งแรกหลัง `afterUtcMs` ณ สถานที่ที่เลือก */
export function lunarReturn(natal: NatalChart, afterUtcMs: number, place: ReturnPlace): NatalChart {
  const moon = natal.bodies.find((b) => b.id === "moon")!;
  const now = planetLon("moon", MakeTime(new Date(afterUtcMs))) - zodiacShift(natal.input.zodiac, afterUtcMs);
  const ahead = norm360(moon.lon - now);
  const utcMs = findReturn("moon", moon.lon, afterUtcMs + (ahead / 13.176) * DAY, natal.input.zodiac);
  return computeNatalChart({ ...natal.input, ...place, utcMs, timeKnown: true, dayStartUtcMs: undefined, dayEndUtcMs: undefined });
}
