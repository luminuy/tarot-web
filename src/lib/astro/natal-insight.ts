/**
 * 🎯 จุดเด่นของผัง (จัดลำดับความสำคัญ) + ความไวต่อเวลาเกิด — โค้ดล้วน ไม่มี AI (ผลเดิมทุกครั้ง)
 * ---------------------------------------------------------------------------
 * เจ้าของสั่ง 2026-10-28 "ทำให้แม่นกว่านี้" ➔ คำอธิบายเดิมประกอบทีละดาวโดยไม่ชั่งน้ำหนัก ไฟล์นี้เลือกเรื่องที่หนักที่สุดของผังขึ้นก่อน
 * - เกณฑ์น้ำหนัก (หลักโหราสากลทั่วไป): ดาวชิดแกนผัง (ลัคนา/กลางฟ้า/จุดตก/ฐานผัง) > รูปแบบผัง/กลุ่มดาว > เจ้าเรือนลัคนา >
 *   มุมสัมพันธ์หลักที่แนบสนิท (orb ไม่เกิน 2 องศา · มีดวงอาทิตย์/จันทร์ยิ่งหนัก) > ดาวเด่น > ธาตุ > ศักดิ์ดาว
 * - คู่ดาวรุ่น (ยูเรนัส เนปจูน พลูโต) ที่ทำมุมกันเองไม่นับ เพราะทั้งรุ่นมีเหมือนกัน
 * - ใช้ทั้งหน้าเว็บ (โหลดพร้อมผลผังแบบ lazy) และฝั่งเซิร์ฟเวอร์ (prompt ของแม่หมอ AI · ภาพรวมผัง · รายงาน)
 *
 * ความไวต่อเวลาเกิด: ขยับเวลาดาราคติ (RAMC) ทีละนาทีแล้วคำนวณลัคนา/กลางฟ้า/เรือนใหม่ด้วยสูตรเดียวกับตัวคำนวณหลัก
 * บอกผู้ใช้ว่าถ้าเวลาบนสูติบัตรคลาดกี่นาที อะไรในผังจะเปลี่ยน (เวลาเกิดที่จดมักปัดเป็น 5 ถึง 15 นาที)
 */
import { BODY_TEXT, DIGNITY_TEXT, ELEMENT_TEXT, type Lang } from "@/data/natal/content";
import {
  ASPECT_DEFS,
  PLANET_IDS,
  ascAt,
  computeHouses,
  formatDegree,
  houseOf,
  mcAt,
  norm360,
  type BodyId,
  type Element,
  type NatalChart,
  type PatternType,
} from "./natal";
import { aspectTitle, bodyName, describeAspect, describePattern, signName } from "./natal-text";

export type HighlightKind = "angle" | "pattern" | "ruler" | "aspect" | "dominant" | "element" | "dignity";

export interface Highlight {
  /** คีย์คงที่ของข้อนี้ (ใช้กันซ้ำ) */
  key: string;
  kind: HighlightKind;
  /** น้ำหนักยิ่งมากยิ่งสำคัญ — ใช้เรียงลำดับเท่านั้น ไม่แสดงผู้ใช้ */
  weight: number;
  bodies: BodyId[];
  title: string;
  text: string;
}

const PERSONAL = new Set<BodyId>(["sun", "moon", "mercury", "venus", "mars"]);
const GENERATIONAL = new Set<BodyId>(["uranus", "neptune", "pluto"]);
const MAJOR = new Set(ASPECT_DEFS.filter((d) => d.major).map((d) => d.type));
const PATTERN_WEIGHT: Record<PatternType, number> = {
  "grand-cross": 8.5,
  "stellium-house": 8,
  "t-square": 8,
  "stellium-sign": 7.5,
  "grand-trine": 7.5,
  kite: 7.5,
  yod: 7,
};
/** ดาวชิดแกนผังได้ไม่เกินกี่องศา */
const ANGLE_ORB = 6;
/** มุมสัมพันธ์ที่นับว่า "แนบสนิท" */
const TIGHT_ORB = 2;
/** คำนามที่ลงท้ายไม้ยมกต้องเว้นวรรคก่อนคำถัดไป (แบบเดียวกับ `natal-text.ts`) */
const noun = (id: BodyId) => {
  const n = BODY_TEXT[id].noun.th;
  return n.endsWith("ๆ") ? `${n} ` : n;
};

const ANGLE_MEANING: Record<"asc" | "mc" | "dsc" | "ic", { th: string; en: string }> = {
  asc: { th: "เป็นสิ่งที่คนเห็นในตัวคุณตั้งแต่แรกพบ และหล่อหลอมวิธีที่คุณเริ่มต้นทุกอย่าง", en: "is what people notice in you first and shapes how you begin everything" },
  mc: { th: "เป็นสิ่งที่งานและสังคมจดจำคุณ และมักผลักทิศทางอาชีพ", en: "is what your work and public life remember you for, and it tends to steer your career" },
  dsc: { th: "เห็นชัดที่สุดผ่านคู่ครอง หุ้นส่วน และคนที่คุณดึงดูดเข้ามา", en: "shows most clearly through partners and the people you attract" },
  ic: { th: "หยั่งรากลึกในบ้าน ครอบครัว และโลกส่วนตัวของคุณ", en: "is rooted deep in your home, family and private world" },
};

/** จุดเด่นของผังเรียงจากสำคัญที่สุด (ตัดที่ `max` ข้อ) */
export function chartHighlights(chart: NatalChart, lang: Lang, max = 7): Highlight[] {
  const th = lang === "th";
  const out: Highlight[] = [];
  const get = (id: BodyId) => chart.bodies.find((b) => b.id === id);
  const isPlanet = (id: BodyId) => (PLANET_IDS as readonly string[]).includes(id);

  // 1) ดาวชิดแกนผัง — กุมลัคนา/กลางฟ้า หรือเล็งลัคนา/กลางฟ้า (= กุมจุดตก/ฐานผัง)
  for (const a of chart.aspects) {
    const pair: [BodyId, BodyId][] = [
      [a.a, a.b],
      [a.b, a.a],
    ];
    for (const [planet, axis] of pair) {
      if (!isPlanet(planet) || (axis !== "asc" && axis !== "mc") || a.orb > ANGLE_ORB) continue;
      const angle = a.type === "conjunction" ? axis : a.type === "opposition" ? (axis === "asc" ? "dsc" : "ic") : null;
      if (!angle) continue;
      out.push({
        key: `angle:${planet}:${angle}`,
        kind: "angle",
        weight: 9 + (ANGLE_ORB - a.orb) / ANGLE_ORB + (PERSONAL.has(planet) ? 0.5 : 0),
        bodies: [planet, angle],
        title: th ? `${bodyName(planet, lang)}ชิด${bodyName(angle, lang)} (ห่าง ${formatDegree(a.orb)})` : `${bodyName(planet, lang)} on the ${bodyName(angle, lang)} (${formatDegree(a.orb)} away)`,
        text: th
          ? `ดาวที่อยู่บนแกนผังเป็นดาวที่ดังที่สุดในผัง เรื่อง${noun(planet)}ของคุณจึง${ANGLE_MEANING[angle].th}`
          : `A planet on an angle is the loudest voice in a chart, so your ${BODY_TEXT[planet].noun.en} ${ANGLE_MEANING[angle].en}.`,
      });
    }
  }

  // 2) รูปแบบผัง / กลุ่มดาว
  for (const p of chart.patterns) {
    const d = describePattern(chart, p, lang);
    out.push({ key: `pattern:${p.type}:${p.bodies.join("-")}`, kind: "pattern", weight: PATTERN_WEIGHT[p.type], bodies: p.bodies, title: d.title, text: d.text });
  }

  // 3) เจ้าเรือนลัคนา
  const ruler = chart.chartRuler ? get(chart.chartRuler) : undefined;
  if (ruler) {
    out.push({
      key: `ruler:${ruler.id}`,
      kind: "ruler",
      weight: 7,
      bodies: [ruler.id],
      title: th ? `เจ้าเรือนลัคนา: ${bodyName(ruler.id, lang)}` : `Chart ruler: ${bodyName(ruler.id, lang)}`,
      text: th
        ? `${bodyName(ruler.id, lang)}อยู่${signName(ruler.sign, lang)}${ruler.house ? ` เรือน ${ruler.house}` : ""} ดาวดวงนี้เป็นเหมือนกัปตันของทั้งผัง เรื่อง${noun(ruler.id)}จึงกำหนดทิศทางชีวิตคุณมากกว่าดาวดวงอื่น`
        : `${bodyName(ruler.id, lang)} sits in ${signName(ruler.sign, lang)}${ruler.house ? `, house ${ruler.house}` : ""}. As captain of the chart, your ${BODY_TEXT[ruler.id].noun.en} steers your life more than any other planet.`,
    });
  }

  // 4) มุมสัมพันธ์หลักที่แนบสนิท (ไม่รวมแกนผัง · ไม่รวมคู่ดาวรุ่นกันเอง)
  for (const a of chart.aspects) {
    if (!MAJOR.has(a.type) || a.orb > TIGHT_ORB || !isPlanet(a.a) || !isPlanet(a.b)) continue;
    if (GENERATIONAL.has(a.a) && GENERATIONAL.has(a.b)) continue;
    const lum = Number(a.a === "sun" || a.a === "moon") + Number(a.b === "sun" || a.b === "moon");
    const personal = Number(PERSONAL.has(a.a)) + Number(PERSONAL.has(a.b));
    out.push({
      key: `aspect:${a.a}:${a.b}`,
      kind: "aspect",
      weight: 5.5 + (TIGHT_ORB - a.orb) / TIGHT_ORB + lum * 0.75 + personal * 0.25,
      bodies: [a.a, a.b],
      title: `${aspectTitle(a, lang)} (orb ${formatDegree(a.orb)})`,
      text: describeAspect(a, lang),
    });
  }

  // 5) ดาวเด่นอันดับหนึ่ง
  const top = chart.dominantPlanets[0];
  if (top) {
    out.push({
      key: `dominant:${top.id}`,
      kind: "dominant",
      weight: 6,
      bodies: [top.id],
      title: th ? `ดาวเด่นที่สุด: ${bodyName(top.id, lang)}` : `Most prominent planet: ${bodyName(top.id, lang)}`,
      text: th
        ? `เมื่อนับทั้งตำแหน่ง เรือน ศักดิ์ และมุมสัมพันธ์ ${bodyName(top.id, lang)}มีน้ำหนักมากที่สุด เรื่อง${noun(top.id)}จึงเป็นแกนของชีวิตคุณ`
        : `Counting placement, house, dignity and aspects, ${bodyName(top.id, lang)} carries the most weight, so your ${BODY_TEXT[top.id].noun.en} is a central thread of your life.`,
    });
  }

  // 6) ธาตุเด่นชัด (เกิน 40%) / ธาตุที่ไม่มีดาวเลย
  const es = chart.distribution.elementScore;
  const total = Object.values(es).reduce((s, v) => s + v, 0) || 1;
  for (const e of Object.keys(es) as Element[]) {
    const share = es[e] / total;
    if (share >= 0.4) {
      out.push({ key: `element:${e}:strong`, kind: "element", weight: 5 + share, bodies: chart.distribution.elements[e], title: th ? `ธาตุ${ELEMENT_TEXT[e].name.th}เด่น (${Math.round(share * 100)}%)` : `Strong ${ELEMENT_TEXT[e].name.en.toLowerCase()} (${Math.round(share * 100)}%)`, text: ELEMENT_TEXT[e].strong[lang] });
    }
    if (chart.distribution.elements[e].length === 0) {
      out.push({ key: `element:${e}:missing`, kind: "element", weight: 4.5, bodies: [], title: th ? `ไม่มีดาวในธาตุ${ELEMENT_TEXT[e].name.th}` : `No planets in ${ELEMENT_TEXT[e].name.en.toLowerCase()}`, text: ELEMENT_TEXT[e].weak[lang] });
    }
  }

  // 7) ศักดิ์ดาวของดาวส่วนตัวและดาวสังคม
  for (const b of chart.bodies) {
    if (!isPlanet(b.id) || GENERATIONAL.has(b.id)) continue;
    for (const d of b.dignities) {
      const strong = d === "domicile" || d === "exaltation";
      out.push({
        key: `dignity:${b.id}:${d}`,
        kind: "dignity",
        weight: (strong ? 4.5 : 4) + (b.id === "sun" || b.id === "moon" ? 0.5 : 0),
        bodies: [b.id],
        title: `${bodyName(b.id, lang)} ${signName(b.sign, lang)} (${DIGNITY_TEXT[d].name[lang]})`,
        text: th ? `${bodyName(b.id, lang)}${DIGNITY_TEXT[d].meaning.th}` : `${bodyName(b.id, lang)} in ${signName(b.sign, lang)}: ${DIGNITY_TEXT[d].meaning.en}.`,
      });
    }
  }

  // เรียง · กันซ้ำ · จำกัดจำนวนต่อชนิด (ไม่ให้มุมสัมพันธ์หรือศักดิ์ดาวกินที่ทั้งรายการ)
  const cap: Partial<Record<HighlightKind, number>> = { aspect: 3, dignity: 2, element: 1, pattern: 2 };
  const used: Partial<Record<HighlightKind, number>> = {};
  const seen = new Set<string>();
  const ranked: Highlight[] = [];
  for (const h of out.sort((x, y) => y.weight - x.weight)) {
    if (seen.has(h.key)) continue;
    // ดาวเด่นอันดับหนึ่งที่ขึ้นมาแล้วในฐานะดาวชิดแกนหรือเจ้าเรือนลัคนา ไม่ต้องพูดซ้ำ
    if (h.kind === "dominant" && ranked.some((r) => (r.kind === "angle" || r.kind === "ruler") && r.bodies[0] === h.bodies[0])) continue;
    if ((used[h.kind] ?? 0) >= (cap[h.kind] ?? Infinity)) continue;
    seen.add(h.key);
    used[h.kind] = (used[h.kind] ?? 0) + 1;
    ranked.push(h);
    if (ranked.length >= max) break;
  }
  return ranked;
}

// ─────────────────────────── ความไวต่อเวลาเกิด ───────────────────────────

/** เวลาดาราคติเดินเร็วกว่านาฬิกาเล็กน้อย: 360.9856 องศาต่อวัน */
const RAMC_PER_MINUTE = 360.98564736629 / 1440;

export interface TimeShift {
  /** ต้องคลาดกี่นาทีถึงเปลี่ยน */
  minutes: number;
  dir: "earlier" | "later";
  /** ราศี (ลัคนา/กลางฟ้า) หรือเรือน (ดาว) ที่จะกลายเป็น */
  to: number;
}

export interface TimeSensitivity {
  /** ช่วงที่ไล่ดูของลัคนาและกลางฟ้า (นาที) */
  angleWindow: number;
  /** ช่วงที่ไล่ดูของเรือนดาว (นาที) */
  houseWindow: number;
  asc: TimeShift | null;
  mc: TimeShift | null;
  houses: { id: BodyId; from: number; shift: TimeShift }[];
}

function nearer(a: TimeShift | null, b: TimeShift | null): TimeShift | null {
  if (!a) return b;
  if (!b) return a;
  return b.minutes < a.minutes ? b : a;
}

/**
 * ถ้าเวลาเกิดคลาดไป N นาที ลัคนา/กลางฟ้า/เรือนของดาวหลักจะเปลี่ยนไหม — ไม่รู้เวลาเกิด = null
 * ตรึงละติจูด ความเอียงแกนโลก และอายนางศ์ไว้ (ภายในหนึ่งชั่วโมงเปลี่ยนไม่ถึง 0.001 องศา) · ดาวเดินตามความเร็วของตัวเอง
 */
export function birthTimeSensitivity(chart: NatalChart, angleWindow = 30, houseWindow = 15): TimeSensitivity | null {
  if (!chart.input.timeKnown || !chart.houses) return null;
  const { lat } = chart.input;
  const eps = chart.obliquity;
  const ay = chart.ayanamsa;
  const system = chart.input.houseSystem;
  const asc0 = chart.bodies.find((b) => b.id === "asc");
  const mc0 = chart.bodies.find((b) => b.id === "mc");
  const planets = chart.bodies.filter((b) => (PLANET_IDS as readonly string[]).includes(b.id) && !GENERATIONAL.has(b.id) && b.house);
  let asc: TimeShift | null = null;
  let mc: TimeShift | null = null;
  const houseShift = new Map<BodyId, TimeShift>();

  for (const dir of ["earlier", "later"] as const) {
    const sign = dir === "earlier" ? -1 : 1;
    let ascFound = false;
    let mcFound = false;
    const houseFound = new Set<BodyId>();
    const span = Math.max(angleWindow, houseWindow);
    for (let m = 1; m <= span; m++) {
      const ramc = chart.ramc + sign * m * RAMC_PER_MINUTE;
      if (m <= angleWindow) {
        if (!ascFound && asc0) {
          const s = Math.floor(norm360(ascAt(ramc, lat, eps) - ay) / 30);
          if (s !== asc0.sign) {
            ascFound = true;
            asc = nearer(asc, { minutes: m, dir, to: s });
          }
        }
        if (!mcFound && mc0) {
          const s = Math.floor(norm360(mcAt(ramc, eps) - ay) / 30);
          if (s !== mc0.sign) {
            mcFound = true;
            mc = nearer(mc, { minutes: m, dir, to: s });
          }
        }
      }
      if (m <= houseWindow && houseFound.size < planets.length) {
        const cusps = computeHouses(system, ramc, lat, eps).cusps.map((c) => norm360(c - ay));
        for (const p of planets) {
          if (houseFound.has(p.id)) continue;
          const h = houseOf(norm360(p.lon + (p.speed * sign * m) / 1440), cusps);
          if (h !== p.house) {
            houseFound.add(p.id);
            const cur = houseShift.get(p.id) ?? null;
            const next = nearer(cur, { minutes: m, dir, to: h });
            if (next) houseShift.set(p.id, next);
          }
        }
      }
    }
  }

  return {
    angleWindow,
    houseWindow,
    asc,
    mc,
    houses: planets
      .filter((p) => houseShift.has(p.id))
      .map((p) => ({ id: p.id, from: p.house as number, shift: houseShift.get(p.id)! }))
      .sort((a, b) => a.shift.minutes - b.shift.minutes),
  };
}

/** ประโยคอธิบายความไวต่อเวลาเกิดให้ผู้ใช้อ่าน */
export function describeTimeSensitivity(ts: TimeSensitivity, lang: Lang): string[] {
  const th = lang === "th";
  const when = (s: TimeShift) =>
    th ? `ถ้าเวลาเกิด${s.dir === "earlier" ? "เร็วกว่านี้" : "ช้ากว่านี้"} ${s.minutes} นาที` : `If you were born ${s.minutes} minute${s.minutes === 1 ? "" : "s"} ${s.dir}`;
  const out: string[] = [];
  if (ts.asc) out.push(th ? `${when(ts.asc)} ลัคนาจะเป็น${signName(ts.asc.to, lang)} ซึ่งเปลี่ยนเรือนทั้งผัง` : `${when(ts.asc)}, your rising sign would be ${signName(ts.asc.to, lang)}, which shifts every house.`);
  if (ts.mc) out.push(th ? `${when(ts.mc)} กลางฟ้าจะเป็น${signName(ts.mc.to, lang)}` : `${when(ts.mc)}, your Midheaven would be ${signName(ts.mc.to, lang)}.`);
  for (const h of ts.houses) {
    out.push(th ? `${when(h.shift)} ${bodyName(h.id, lang)}จะย้ายจากเรือน ${h.from} ไปเรือน ${h.shift.to}` : `${when(h.shift)}, ${bodyName(h.id, lang)} would move from house ${h.from} to house ${h.shift.to}.`);
  }
  if (!out.length) {
    out.push(
      th
        ? `ลัคนาและกลางฟ้าไม่เปลี่ยนแม้เวลาเกิดคลาดไป ${ts.angleWindow} นาที และดาวหลักไม่ย้ายเรือนแม้คลาดไป ${ts.houseWindow} นาที ผังนี้ทนต่อเวลาเกิดที่คลาดเล็กน้อย`
        : `Your rising sign and Midheaven hold even if your birth time is ${ts.angleWindow} minutes off, and no main planet changes house within ${ts.houseWindow} minutes. This chart is robust to a slightly inaccurate birth time.`,
    );
  }
  return out;
}
