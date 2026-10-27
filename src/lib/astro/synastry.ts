/**
 * 💞 ผังคู่ — เทียบผังสองคน (Synastry) + ผังรวม (Composite แบบจุดกึ่งกลาง)
 * ===========================================================================
 * คำนวณในเครื่องผู้ใช้ทั้งหมด ไม่มี AI · คะแนนแต่ละด้านอธิบายได้ทุกแต้ม (มาจากมุมไหนบ้าง)
 * ⚠️ ข้อความต้องบอกแนวโน้มและวิธีดูแลกัน ห้ามฟันธงว่าคู่ไหน "ไปรอด/ไม่รอด" (กฎเดียวกับ zodiac-compat)
 *
 * - มุมระหว่างผัง: ดาวของ A × ดาวของ B (มุมหลัก 5 + 150 องศา) orb แคบกว่าผังเดี่ยว 20%
 * - ดาวของอีกคนตกเรือนไหนของเรา (house overlay) — ต้องรู้เวลาเกิดของเจ้าของเรือน
 * - ผังรวม: จุดกึ่งกลางที่ใกล้กว่าของดาวแต่ละคู่ · เรือน = จุดกึ่งกลางของจุดเริ่มเรือน (ทั้งคู่ต้องรู้เวลาเกิด)
 */
import {
  ASPECT_DEFS,
  PLANET_IDS,
  angularDistance,
  aspectMaxOrb,
  distributionOf,
  dominantPlanetsOf,
  findAspects,
  findPatterns,
  houseOf,
  norm360,
  position,
  type AspectType,
  type BodyId,
  type BodyPosition,
  type NatalChart,
} from "./natal";

/** จุดที่ใช้เทียบผัง */
const SYN_BODIES: readonly BodyId[] = [...PLANET_IDS, "chiron", "node", "asc", "mc"];
const SYN_TYPES: readonly AspectType[] = ["conjunction", "opposition", "trine", "square", "sextile", "quincunx"];

export interface SynAspect {
  /** ดาวของ A */
  a: BodyId;
  /** ดาวของ B */
  b: BodyId;
  type: AspectType;
  orb: number;
  maxOrb: number;
  /** น้ำหนักความสำคัญ (ดวงสว่าง/ดาวส่วนตัว/มุมฟ้า สำคัญกว่าดาวนอก) × ความแน่นของ orb */
  weight: number;
}

export interface Overlay {
  /** ดาวของเจ้าของ `from` ไปตกเรือนของอีกฝ่าย */
  body: BodyId;
  house: number;
}

export type SynCategory = "bond" | "attraction" | "talk" | "stability" | "growth";

export interface CategoryScore {
  key: SynCategory;
  /** 0–10 */
  score: number;
  harmonious: SynAspect[];
  tense: SynAspect[];
}

export interface SynastryResult {
  aspects: SynAspect[];
  /** ดาวของ B ในเรือนของ A (A ต้องรู้เวลาเกิด) */
  bInA: Overlay[] | null;
  /** ดาวของ A ในเรือนของ B */
  aInB: Overlay[] | null;
  categories: CategoryScore[];
  composite: NatalChart;
}

const IMPORTANCE: Partial<Record<BodyId, number>> = {
  sun: 3,
  moon: 3,
  venus: 2.5,
  mars: 2.5,
  asc: 2.5,
  mercury: 2,
  mc: 1.5,
  jupiter: 1.5,
  saturn: 1.5,
  node: 1,
  chiron: 0.8,
  uranus: 0.6,
  neptune: 0.6,
  pluto: 0.6,
};

export function synastryAspects(A: NatalChart, B: NatalChart): SynAspect[] {
  const as = A.bodies.filter((x) => SYN_BODIES.includes(x.id));
  const bs = B.bodies.filter((x) => SYN_BODIES.includes(x.id));
  const out: SynAspect[] = [];
  for (const pa of as) {
    for (const pb of bs) {
      // ดาวนอกกับดาวนอก = คนรุ่นเดียวกันได้มุมเดียวกันเกือบทุกคู่ ไม่บอกอะไรเกี่ยวกับคู่นี้
      const outer = (id: BodyId) => id === "uranus" || id === "neptune" || id === "pluto";
      if (outer(pa.id) && outer(pb.id)) continue;
      const sep = angularDistance(pa.lon, pb.lon);
      let best: SynAspect | null = null;
      for (const def of ASPECT_DEFS.filter((d) => SYN_TYPES.includes(d.type))) {
        const maxOrb = aspectMaxOrb(def, pa.id, pb.id, 1) * 0.8;
        const orb = Math.abs(sep - def.angle);
        if (orb <= maxOrb && (!best || orb < best.orb)) {
          const w = (IMPORTANCE[pa.id] ?? 1) * (IMPORTANCE[pb.id] ?? 1) * (1 - orb / (maxOrb + 0.01));
          best = { a: pa.id, b: pb.id, type: def.type, orb, maxOrb, weight: w };
        }
      }
      if (best) out.push(best);
    }
  }
  return out.sort((x, y) => y.weight - x.weight);
}

function overlays(guest: NatalChart, host: NatalChart): Overlay[] | null {
  if (!host.houses) return null;
  return guest.bodies
    .filter((b) => (PLANET_IDS as readonly string[]).includes(b.id) || b.id === "asc")
    .map((b) => ({ body: b.id, house: houseOf(b.lon, host.houses!) }));
}

const TONE = new Map(ASPECT_DEFS.map((d) => [d.type, d.tone]));

/** หมวดความสัมพันธ์: นับมุมที่เกี่ยวข้อง (ทั้งสองทิศ) */
const CATEGORY_PAIRS: Record<SynCategory, readonly [BodyId, BodyId][]> = {
  bond: [
    ["sun", "moon"],
    ["moon", "moon"],
    ["moon", "venus"],
    ["sun", "sun"],
    ["moon", "asc"],
    ["sun", "asc"],
  ],
  attraction: [
    ["venus", "mars"],
    ["moon", "mars"],
    ["mars", "mars"],
    ["venus", "venus"],
    ["sun", "venus"],
    ["mars", "asc"],
    ["venus", "asc"],
    ["mars", "pluto"],
    ["venus", "pluto"],
  ],
  talk: [
    ["mercury", "mercury"],
    ["mercury", "sun"],
    ["mercury", "moon"],
    ["mercury", "asc"],
    ["mercury", "jupiter"],
  ],
  stability: [
    ["saturn", "sun"],
    ["saturn", "moon"],
    ["saturn", "venus"],
    ["saturn", "asc"],
    ["sun", "jupiter"],
    ["moon", "jupiter"],
  ],
  growth: [
    ["node", "sun"],
    ["node", "moon"],
    ["node", "venus"],
    ["jupiter", "venus"],
    ["jupiter", "jupiter"],
    ["chiron", "moon"],
    ["chiron", "sun"],
  ],
};

function inCategory(a: SynAspect, pairs: readonly [BodyId, BodyId][]): boolean {
  return pairs.some(([x, y]) => (a.a === x && a.b === y) || (a.a === y && a.b === x));
}

/**
 * คะแนนแต่ละหมวด 0–10: เริ่มที่ 5 · มุมกลมกลืนบวก มุมตึงลบครึ่งหนึ่ง (มุมตึงก็สร้างแรงดึงดูด ไม่ได้แย่ล้วน) ·
 * กุม (0 องศา) นับเป็นบวกเพราะคือการหลอมรวม · ถ่วงด้วยน้ำหนักของมุม · ตัดที่ 0–10
 */
function scoreCategories(aspects: readonly SynAspect[]): CategoryScore[] {
  return (Object.keys(CATEGORY_PAIRS) as SynCategory[]).map((key) => {
    const rel = aspects.filter((a) => inCategory(a, CATEGORY_PAIRS[key]));
    const harmonious = rel.filter((a) => TONE.get(a.type) !== "tense");
    const tense = rel.filter((a) => TONE.get(a.type) === "tense");
    const plus = harmonious.reduce((s, a) => s + a.weight, 0);
    const minus = tense.reduce((s, a) => s + a.weight, 0) * 0.5;
    const score = Math.max(0, Math.min(10, 5 + (plus - minus) / 2.5));
    return { key, score: Math.round(score * 10) / 10, harmonious, tense };
  });
}

/** จุดกึ่งกลางที่ใกล้กว่า (ไม่ข้ามไปฝั่งตรงข้ามของวง) */
export function nearMidpoint(a: number, b: number): number {
  const d = norm360(b - a);
  return d <= 180 ? norm360(a + d / 2) : norm360(b + (360 - d) / 2);
}

export function compositeChart(A: NatalChart, B: NatalChart): NatalChart {
  const cusps =
    A.houses && B.houses
      ? (() => {
          // จุดเริ่มเรือนกึ่งกลาง: ยึดกลางฟ้า/ลัคนากึ่งกลาง แล้วไล่เรือนตามลำดับให้วนครบรอบเสมอ
          const mids = A.houses!.map((c, i) => nearMidpoint(c, B.houses![i]));
          const ok = mids.every((c, i) => norm360(mids[(i + 1) % 12] - c) < 180);
          return ok ? mids : null;
        })()
      : null;
  const ids = A.bodies.map((b) => b.id).filter((id) => B.bodies.some((x) => x.id === id) && id !== "southNode" && id !== "fortune" && id !== "vertex" && id !== "dsc" && id !== "ic");
  const bodies: BodyPosition[] = ids.map((id) => {
    const pa = A.bodies.find((b) => b.id === id)!;
    const pb = B.bodies.find((b) => b.id === id)!;
    return position(id, nearMidpoint(pa.lon, pb.lon), (pa.speed + pb.speed) / 2, cusps);
  });
  const timeKnown = !!cusps && bodies.some((b) => b.id === "asc");
  const aspects = findAspects(bodies, A.input.orbScale);
  const ascB = bodies.find((b) => b.id === "asc");
  const sun = bodies.find((b) => b.id === "sun")!;
  const moon = bodies.find((b) => b.id === "moon")!;
  const elongation = norm360(moon.lon - sun.lon);
  return {
    input: { ...A.input, timeKnown },
    jdUt: (A.jdUt + B.jdUt) / 2,
    bodies,
    houses: cusps,
    houseSystemUsed: cusps ? A.houseSystemUsed : null,
    aspects,
    patterns: findPatterns(bodies, aspects),
    distribution: distributionOf(bodies, timeKnown),
    dominantPlanets: dominantPlanetsOf(bodies, aspects, null),
    chartRuler: null,
    dayChart: null,
    moonPhase: { elongation, phase: Math.floor(norm360(elongation + 22.5) / 45) % 8 },
    moonRange: null,
    signChangesOnDay: [],
    obliquity: (A.obliquity + B.obliquity) / 2,
    ramc: ascB ? nearMidpoint(A.ramc, B.ramc) : 0,
    warnings: [],
  };
}

export function computeSynastry(A: NatalChart, B: NatalChart): SynastryResult {
  const aspects = synastryAspects(A, B);
  return {
    aspects,
    bInA: overlays(B, A),
    aInB: overlays(A, B),
    categories: scoreCategories(aspects),
    composite: compositeChart(A, B),
  };
}
