/**
 * 🎂 คำอ่านผังวันเกิดปีนี้ (Solar Return) และผังจันทร์คืน (Lunar Return) แบบเต็ม — โค้ดล้วน ไม่มี AI (ผลเดิมทุกครั้ง)
 * ---------------------------------------------------------------------------
 * เจ้าของ 2026-11-02 "ตอบชัดจัดเต็ม ไม่เอาตอบกลาง ๆ" ➔ เลือก "ผังวันเกิดปีนี้/จันทร์คืนแบบเต็ม"
 * เดิมแท็บนี้บอกแค่ลัคนา เรือนของอาทิตย์/จันทร์ และรายชื่อดาวในเรือนมุมเฉย ๆ
 *
 * วิธีอ่าน (หลักผังรีเทิร์นทั่วไป):
 * 1. ประโยคฟันธง "ปีนี้คือปีของ…" — ให้คะแนนเรือน: เรือนของดวงอาทิตย์ (ผังปี) / ดวงจันทร์ (ผังเดือน) หนักสุด
 *    + ดาวในแต่ละเรือน (เรือนมุม 1/4/7/10 คูณ 1.5) + เรือนของเจ้าลัคนาผังนี้ + เรือนในผังเกิดที่ลัคนาผังนี้ตกลงไป
 * 2. ดาวในเรือนมุม = เรื่องที่แรงที่สุดของช่วงนั้น — บอกว่าดาวดวงนั้นทำอะไรกับเรื่องของเรือนนั้น + สิ่งที่ควรทำ
 * 3. ลัคนาผังนี้ตกเรือนไหนของผังเกิด (ต้องรู้เวลาเกิด) · เจ้าลัคนาผังนี้อยู่เรือนไหน
 * 4. ผังปีเท่านั้น: เดือนที่หนักที่สุด / เดือนที่มีแรงหนุนมากที่สุด จากปฏิทินดาวเดินช้า 12 เดือนนับจากวันเกิด
 *
 * ⚠️ ไม่รู้เวลาเกิด: เวลาของผังรีเทิร์นคลาดได้ถึงครึ่งวัน ➔ ไม่อ่านเรือนเลย เหลือแค่ปฏิทินดาวเดินช้า (ไม่ใช้ดวงจันทร์เกิด)
 * ⚠️ ห้ามทำนายความตาย อุบัติเหตุ โรค ตั้งครรภ์ ผลคดี ผลการลงทุน (กติกาเดียวกับทั้งหน้า)
 */
import { HOUSE_TEXT, type Lang, type T } from "@/data/natal/content";
import { HOUSE_DEPTH } from "@/data/natal/depth";
import { PLANET_IDS, TRADITIONAL_RULER, houseOf, type BodyId, type NatalChart, type PlanetId } from "./natal";
import { bodyName, joinWords, signName, thw } from "./natal-text";
import { transitCalendar, type TransitEvent } from "./techniques";

/**
 * ดาวในเรือนมุมของผังรีเทิร์นทำอะไรกับเรื่องของเรือนนั้น — `does` เป็นประโยคย่อยที่ยืนเองได้ (ต่อหลัง "ในเรื่อง…")
 * `act` = สิ่งที่ควรทำ (ประโยคสั่งสั้น) · ดาวหลายดวงในเรือนเดียวกันรวมเป็นข้อเดียว ใช้ `act` ของดาวที่หนักที่สุด (`ACT_ORDER`)
 */
export const RETURN_PLANET: Record<PlanetId, { does: T; act: T }> = {
  sun: {
    does: { th: "คุณถูกจับตาและได้เครดิตเต็ม", en: "you are noticed and get full credit" },
    act: { th: "ตั้งเป้าหนึ่งข้อในเรื่องนี้แล้วทำให้คนเห็น", en: "Set one goal here and let people see you work on it." },
  },
  moon: {
    does: { th: "ใจคุณขึ้นลงตามเรื่องนี้", en: "your mood rises and falls with it" },
    act: { th: "จดว่าอะไรทำให้ใจขึ้นลง แล้วตัดสินใจตอนใจนิ่ง", en: "Note what moves your mood and decide only when you feel calm." },
  },
  mercury: {
    does: { th: "งานคุย เอกสาร และการเดินทางระยะสั้นเพิ่มขึ้น", en: "talks, paperwork and short trips pile up" },
    act: { th: "อ่านทุกเอกสารให้จบก่อนเซ็น และตกลงเรื่องสำคัญเป็นลายลักษณ์อักษร", en: "Read every document before you sign and put key agreements in writing." },
  },
  venus: {
    does: { th: "คนดีและความราบรื่นเข้ามา", en: "good people and ease arrive" },
    act: { th: "รับคำชวนและเปิดตัวกับคนใหม่ คนที่เข้ามาช่วงนี้ช่วยคุณได้จริง", en: "Say yes to invitations and meet new people; who shows up now really helps." },
  },
  mars: {
    does: { th: "จังหวะเร็วขึ้นและมีการปะทะ", en: "the pace speeds up and clashes flare" },
    act: { th: "ใช้แรงนี้ปิดงานยาก และนับถึงสิบก่อนตอบโต้ทุกครั้ง", en: "Use the drive to finish hard tasks, and count to ten before you react." },
  },
  jupiter: {
    does: { th: "มีโอกาสใหญ่ที่สุดของช่วงนี้รออยู่", en: "the biggest opening of the period is waiting" },
    act: { th: "ตอบรับโอกาสที่เข้ามา แล้วลงมือภายในสัปดาห์เดียว", en: "Say yes to the opening and act on it within a week." },
  },
  saturn: {
    does: { th: "ภาระและความรับผิดชอบหนักขึ้น", en: "duties and responsibility get heavier" },
    act: { th: "วางแผนเป็นขั้น ทำทีละขั้นให้เสร็จ ผลที่สร้างช่วงนี้อยู่ทนที่สุด", en: "Plan in steps and finish them one by one; what you build now lasts." },
  },
  uranus: {
    does: { th: "มีการเปลี่ยนแปลงกะทันหัน", en: "sudden changes hit" },
    act: { th: "เผื่อแผนสำรองไว้เสมอ และเลิกใช้วิธีเดิมทันทีที่มันไม่ได้ผล", en: "Keep a backup plan and drop the old way as soon as it stops working." },
  },
  neptune: {
    does: { th: "ภาพไม่ชัดและหลอกตาง่าย", en: "the picture blurs and is easy to misread" },
    act: { th: "ตรวจข้อเท็จจริงสองรอบก่อนเชื่อหรือจ่ายเงิน", en: "Check the facts twice before you believe or pay." },
  },
  pluto: {
    does: { th: "ของเก่าถูกรื้อและเปลี่ยนถึงราก", en: "old structures are torn down to the roots" },
    act: { th: "ปล่อยสิ่งที่หมดหน้าที่ ยิ่งยึดไว้ยิ่งเสียแรง", en: "Let go of what has run its course; holding on costs you more." },
  },
};

/** ดาวที่ใช้ `act` เมื่อมีหลายดวงในเรือนเดียวกัน (ตัวสร้างเหตุการณ์มาก่อน) */
const ACT_ORDER: readonly PlanetId[] = ["saturn", "jupiter", "pluto", "uranus", "mars", "venus", "neptune", "sun", "mercury", "moon"];

/** ดาวที่ถ่วงคะแนนเรือนหนักกว่าดาวอื่น (เป็นตัวสร้างเหตุการณ์ในผังรีเทิร์น) */
const HEAVY = new Set<BodyId>(["venus", "mars", "jupiter", "saturn"]);
const ANGULAR = new Set([1, 4, 7, 10]);
const PLANETS = PLANET_IDS as readonly string[];

export interface ReturnRow {
  label: string;
  text: string;
}

export interface ReturnMonth {
  /** วันที่ตรงพอดีของเหตุการณ์แรกในเดือนนั้น (UTC ms) */
  utcMs: number;
  events: Extract<TransitEvent, { kind: "exact" }>[];
}

export interface ReturnReading {
  /** ประโยคฟันธงบนสุด "ปีนี้คือปีของ…" + เหตุผลจากผัง (ไม่มีเมื่อไม่รู้เวลาเกิด) */
  verdict: { title: string; why: string } | null;
  rows: ReturnRow[];
  /** ผังปีเท่านั้น: เดือนที่หนักที่สุด / เดือนที่มีแรงหนุนมากที่สุด */
  heavyMonth: ReturnMonth | null;
  liftMonth: ReturnMonth | null;
}

const topic = (h: number, lang: Lang) => HOUSE_DEPTH[h - 1].topic[lang];
const arena = (h: number, lang: Lang) => HOUSE_TEXT[h - 1].arena[lang];

/** คะแนนเรือน 1–12 ของผังรีเทิร์น + เหตุผลที่ใช้อ้างในประโยคฟันธง */
function scoreHouses(natal: NatalChart, ret: NatalChart, kind: "solar" | "lunar", lang: Lang): { score: number[]; why: string[][] } {
  const th = lang === "th";
  const score = Array<number>(12).fill(0);
  const why: string[][] = Array.from({ length: 12 }, () => []);
  const add = (h: number | null | undefined, w: number, reason?: string) => {
    if (!h) return;
    score[h - 1] += w;
    if (reason) why[h - 1].push(reason);
  };
  const focusId = kind === "solar" ? "sun" : "moon";
  for (const b of ret.bodies) {
    if (!PLANETS.includes(b.id) || !b.house) continue;
    const base = b.id === focusId ? 4 : kind === "solar" && b.id === "moon" ? 2 : HEAVY.has(b.id) ? 1.5 : 1;
    const w = base * (ANGULAR.has(b.house) ? 1.5 : 1);
    add(b.house, w, th ? `${bodyName(b.id, lang)}อยู่เรือน ${b.house}` : `${b.id === "sun" || b.id === "moon" ? "the " : ""}${bodyName(b.id, lang)} in house ${b.house}`);
  }
  const asc = ret.bodies.find((b) => b.id === "asc");
  if (asc) {
    const ruler = ret.bodies.find((b) => b.id === TRADITIONAL_RULER[asc.sign]);
    if (ruler?.house) add(ruler.house, 2, th ? `เจ้าลัคนาอยู่เรือน ${ruler.house}` : `the chart ruler in house ${ruler.house}`);
    if (natal.houses) {
      const h = houseOf(asc.lon, natal.houses);
      add(h, 2, th ? `ลัคนาตกเรือน ${h} ของผังเกิด` : `the Ascendant falling in your natal house ${h}`);
    }
  }
  return { score, why };
}

/** เดือนที่หนัก/หนุนที่สุดใน 12 เดือนนับจากวันเกิดปีนี้ (ดาวเดินช้าตรงพอดีกับจุดส่วนตัวในผังเกิด) */
function keyMonths(natal: NatalChart, fromUtcMs: number): { heavy: ReturnMonth | null; lift: ReturnMonth | null } {
  const personal = new Set<BodyId>(["sun", "mercury", "venus", "mars", "asc", "mc", ...(natal.input.timeKnown ? (["moon"] as const) : [])]);
  const exact = transitCalendar(natal, fromUtcMs, 365).filter(
    (e): e is Extract<TransitEvent, { kind: "exact" }> => e.kind === "exact" && personal.has(e.n),
  );
  const heavyW = (e: (typeof exact)[number]) =>
    (["saturn", "pluto", "uranus"].includes(e.t) ? 3 : 2) * (["square", "opposition", "conjunction"].includes(e.type) ? 1 : 0.4);
  const liftW = (e: (typeof exact)[number]) => (e.t === "jupiter" && ["trine", "sextile", "conjunction"].includes(e.type) ? 3 : 0);
  const pick = (weight: (e: (typeof exact)[number]) => number): ReturnMonth | null => {
    const months = new Map<number, { w: number; events: typeof exact }>();
    for (const e of exact) {
      const w = weight(e);
      if (w <= 0) continue;
      // เดือนนับจากวันเกิด (ช่วงละ 30.4 วัน) — ไม่ผูกกับปฏิทินของเขตเวลาใดเขตเวลาหนึ่ง
      const m = Math.floor((e.utcMs - fromUtcMs) / (30.4375 * 86_400_000));
      const cur = months.get(m) ?? { w: 0, events: [] };
      cur.w += w;
      cur.events.push(e);
      months.set(m, cur);
    }
    let best: { w: number; events: typeof exact } | null = null;
    for (const v of months.values()) if (!best || v.w > best.w) best = v;
    return best ? { utcMs: best.events[0].utcMs, events: best.events } : null;
  };
  return { heavy: pick(heavyW), lift: pick(liftW) };
}

export function returnReading(natal: NatalChart, ret: NatalChart, kind: "solar" | "lunar", lang: Lang): ReturnReading {
  const th = lang === "th";
  const period = kind === "solar" ? (th ? "ปีนี้" : "this year") : th ? "เดือนนี้" : "this month";
  const rows: ReturnRow[] = [];
  const months = kind === "solar" ? keyMonths(natal, ret.input.utcMs) : { heavy: null, lift: null };
  // ไม่รู้เวลาเกิด: เวลาผังคลาดได้ถึงครึ่งวัน ลัคนา/เรือนเชื่อไม่ได้ ➔ ไม่อ่านเรือน
  if (!natal.input.timeKnown || !ret.houses) return { verdict: null, rows, heavyMonth: months.heavy, liftMonth: months.lift };

  const { score, why } = scoreHouses(natal, ret, kind, lang);
  const order = score.map((s, i) => ({ h: i + 1, s })).sort((a, b) => b.s - a.s);
  const [first, second] = order;
  const top2 = why[first.h - 1].slice(0, 2);
  // "เรือน 1และดวงจันทร์" อ่านติดกัน ➔ ฝั่งไทยเว้นวรรคก่อน "และ" เพราะเหตุผลลงท้ายด้วยตัวเลขเรือน
  const reasons = th ? top2.join(" และ") : joinWords(top2, lang);
  const verdict = th
    ? {
        title: `${period}คือ${kind === "solar" ? "ปี" : "เดือน"}ของ${topic(first.h, lang)}`,
        why: `เพราะ${reasons}${second.s > 0 ? ` เรื่องรองคือ${topic(second.h, lang)}` : ""}`,
      }
    : {
        title: `${period === "this year" ? "This year" : "This month"} is about ${topic(first.h, lang)}`,
        why: `Because of ${reasons}.${second.s > 0 ? ` Second in line: ${topic(second.h, lang)}.` : ""}`,
      };

  const get = (id: BodyId) => ret.bodies.find((b) => b.id === id);
  const asc = get("asc");
  if (asc && natal.houses) {
    const h = houseOf(asc.lon, natal.houses);
    rows.push({
      label: th ? `ลัคนา${period}ตกเรือน ${h} ของผังเกิด` : `This chart's Ascendant falls in your natal house ${h}`,
      text: th ? `${period}คุณใช้ชีวิตผ่านเรื่อง${thw(arena(h, lang))}เป็นหลัก คนรอบตัวจะเห็นคุณในบทนี้` : `${period === "this year" ? "This year" : "This month"} you live mainly through ${arena(h, lang)}; people will see you in that role.`,
    });
  }
  if (asc) {
    const rulerId = TRADITIONAL_RULER[asc.sign];
    const ruler = get(rulerId);
    if (ruler?.house) {
      rows.push({
        label: th ? `เจ้าลัคนา${period}: ${bodyName(rulerId, lang)} เรือน ${ruler.house}` : `Chart ruler: ${bodyName(rulerId, lang)} in house ${ruler.house}`,
        text: th
          ? `แรงทั้งหมดของ${period}ไหลไปที่เรื่อง${arena(ruler.house, lang)} ทุ่มเวลาให้เรื่องนี้ก่อนเรื่องอื่น`
          : `The energy of the period flows into ${arena(ruler.house, lang)}. Put your time here first.`,
      });
    }
  }
  // ดาวในเรือนมุม: รวมดาวเรือนเดียวกันเป็นข้อเดียว (ผังปีไม่นับดวงจันทร์ซึ่งมีข้อของตัวเอง)
  const byHouse = new Map<number, PlanetId[]>();
  for (const b of ret.bodies) {
    if (!PLANETS.includes(b.id) || !b.house || !ANGULAR.has(b.house) || (kind === "solar" && b.id === "moon")) continue;
    byHouse.set(b.house, [...(byHouse.get(b.house) ?? []), b.id as PlanetId]);
  }
  const angularRows = [...byHouse]
    .map(([h, ids]) => ({ h, ids: [...ids].sort((a, b) => ACT_ORDER.indexOf(a) - ACT_ORDER.indexOf(b)) }))
    .sort((a, b) => b.ids.length - a.ids.length || ACT_ORDER.indexOf(a.ids[0]) - ACT_ORDER.indexOf(b.ids[0]));
  for (const { h, ids } of angularRows) {
    const names = [...ids].sort((x, y) => PLANET_IDS.indexOf(x) - PLANET_IDS.indexOf(y)).map((id) => bodyName(id, lang)).join(th ? " " : ", ");
    // แต่ละดาวเป็นประโยคของตัวเอง (ในประโยคมี "และ" อยู่แล้ว ต่อด้วย "และ" อีกชั้นจะอ่านปนกัน) · เรียงตามลำดับดาวปกติ
    const natural = [...ids].sort((x, y) => PLANET_IDS.indexOf(x) - PLANET_IDS.indexOf(y));
    const clauses = natural.map((id) => RETURN_PLANET[id].does[lang]).join(th ? " " : "; ");
    rows.push({
      label: th ? `${names} เรือน ${h} (เรือนมุม เด่นมาก)` : `${names} in house ${h} (angular, very strong)`,
      text: th ? `ในเรื่อง${arena(h, lang)} ${clauses} ${RETURN_PLANET[ids[0]].act.th}` : `In ${arena(h, lang)}: ${clauses}. ${RETURN_PLANET[ids[0]].act.en}`,
    });
  }
  const focus = get(kind === "solar" ? "sun" : "moon");
  // เรือนของดวงอาทิตย์ (ผังปี) / ดวงจันทร์ (ผังเดือน) คือเรื่องหลัก — อยู่เรือนมุมแล้วมีในข้อดาวเรือนมุม ไม่ซ้ำ
  if (focus?.house && !ANGULAR.has(focus.house)) {
    rows.unshift({
      label: th ? `${bodyName(focus.id, lang)}เรือน ${focus.house}` : `${bodyName(focus.id, lang)} in house ${focus.house}`,
      text:
        kind === "solar"
          ? th
            ? `เรื่องหลักของปีนี้คือ${arena(focus.house, lang)} ${HOUSE_DEPTH[focus.house - 1].key.th}`
            : `The main theme this year is ${arena(focus.house, lang)}. ${HOUSE_DEPTH[focus.house - 1].key.en}`
          : th
            ? `ใจคุณจดจ่อที่สุดเดือนนี้อยู่ที่เรื่อง${arena(focus.house, lang)} จัดเวลาให้เรื่องนี้ก่อนเรื่องอื่น`
            : `This month your heart is fixed on ${arena(focus.house, lang)}. Make time for it before anything else.`,
    });
  }
  if (kind === "solar") {
    const moon = get("moon");
    if (moon?.house) {
      rows.push({
        label: th ? `ดวงจันทร์${signName(moon.sign, lang)} เรือน ${moon.house}` : `Moon in ${signName(moon.sign, lang)}, house ${moon.house}`,
        text: th ? `ใจของคุณ${period}ผูกอยู่กับเรื่อง${arena(moon.house, lang)} เรื่องนี้ทำให้คุณสุขหรือทุกข์ได้มากที่สุด` : `Your heart ${period} is tied to ${arena(moon.house, lang)}; this is what lifts or drains you most.`,
      });
    }
  }
  return { verdict, rows, heavyMonth: months.heavy, liftMonth: months.lift };
}

