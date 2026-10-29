/**
 * 🎯 เรื่องเด่นของผัง (จัดลำดับความสำคัญ) + ความไวต่อเวลาเกิด — โค้ดล้วน ไม่มี AI (ผลเดิมทุกครั้ง)
 * ---------------------------------------------------------------------------
 * เจ้าของสั่ง 2026-10-28 "ทำให้แม่นกว่านี้" ➔ คำอธิบายเดิมประกอบทีละดาวโดยไม่ชั่งน้ำหนัก ไฟล์นี้เลือกเรื่องที่หนักที่สุดของผังขึ้นก่อน
 * - เกณฑ์น้ำหนัก (หลักโหราสากลทั่วไป): ดาวชิดแกนผัง (ลัคนา/กลางฟ้า/จุดตก/ฐานผัง) > รูปแบบผัง/กลุ่มดาว > เจ้าเรือนลัคนา >
 *   มุมสัมพันธ์หลักที่แนบสนิท (orb ไม่เกิน 2 องศา · มีดวงอาทิตย์/จันทร์ยิ่งหนัก) > ดาวเด่น > ธาตุ > ศักดิ์ดาว
 * - คู่ดาวรุ่น (ยูเรนัส เนปจูน พลูโต) ที่ทำมุมกันเองไม่นับ เพราะทั้งรุ่นมีเหมือนกัน · กลุ่มดาวในราศีที่มีดาวส่วนตัวไม่ถึง 2 ดวงน้ำหนักลดลง (คนเกิดปีเดียวกันมีเหมือนกัน)
 * - ใช้ทั้งหน้าเว็บ (โหลดพร้อมผลผังแบบ lazy) และฝั่งเซิร์ฟเวอร์ (prompt ของแม่หมอ AI · ภาพรวมผัง · รายงาน)
 *
 * เจ้าของสั่ง 2026-10-28 รอบสอง "เข้าใจง่ายแต่ลึกซึ้ง" ➔ แต่ละข้อมี 4 ชั้น (เนื้อหาใน `src/data/natal/depth.ts`):
 *   หัวข้อภาษาคน (แปลว่าอะไรกับชีวิต) · ที่มาทางโหรา (ดาว ราศี เรือน มุม) · ความหมายลงลึก (ทำไม แสดงออกอย่างไร ด้านเงา) · ใช้ให้ดี
 * - ดาวหลายดวงชิดแกนเดียวกันรวมเป็นข้อเดียว (เดิมขึ้นซ้ำ 6 ข้อประโยคเดียวกันในผังที่ดาวกองบนกลางฟ้า)
 * - กลุ่มดาวในเรือนกับในราศีที่เป็นดาวชุดเดียวกัน (ซ้อนกันตั้งแต่ 3 ดวง) รวมเป็นข้อเดียว · กลุ่มในเรือนที่ตรงกับแกน (เรือน 1/4/7/10) รวมเข้าข้อดาวชิดแกน
 * - "ใช้ให้ดี" ห้ามซ้ำกันในรายการเดียว (แต่ละข้อมีตัวเลือกสำรอง)
 *
 * ความไวต่อเวลาเกิด: ขยับเวลาดาราคติ (RAMC) ทีละนาทีแล้วคำนวณลัคนา/กลางฟ้า/เรือนใหม่ด้วยสูตรเดียวกับตัวคำนวณหลัก
 * บอกผู้ใช้ว่าถ้าเวลาบนสูติบัตรคลาดกี่นาที อะไรในผังจะเปลี่ยน (เวลาเกิดที่จดมักปัดเป็น 5 ถึง 15 นาที)
 */
import { BODY_TEXT, DIGNITY_TEXT, ELEMENT_TEXT, HOUSE_TEXT, SIGN_TEXT, type Lang } from "@/data/natal/content";
import { ANGLE_DEPTH, ASPECT_KEY, BODY_VOICE, DIGNITY_DEPTH, ELEMENT_DEPTH, HOUSE_DEPTH, PLANET_DEPTH } from "@/data/natal/depth";
import {
  ASPECT_DEFS,
  PLANET_IDS,
  ascAt,
  computeHouses,
  formatDegree,
  houseOf,
  mcAt,
  norm360,
  type Aspect,
  type BodyId,
  type ChartPattern,
  type Element,
  type NatalChart,
  type PatternType,
  type PlanetId,
} from "./natal";
import { bodyName, describeAspect, joinWords, signName } from "./natal-text";

export type HighlightKind = "angle" | "pattern" | "ruler" | "aspect" | "dominant" | "element" | "dignity";
export type HighlightTone = "harmonious" | "tense" | "neutral";

export interface Highlight {
  /** คีย์คงที่ของข้อนี้ (ใช้กันซ้ำ) */
  key: string;
  kind: HighlightKind;
  /** น้ำหนักยิ่งมากยิ่งสำคัญ — ใช้เรียงลำดับเท่านั้น ไม่แสดงผู้ใช้ */
  weight: number;
  bodies: BodyId[];
  /** หัวข้อภาษาคน: เรื่องนี้แปลว่าอะไรกับชีวิตคุณ (ไม่มีศัพท์โหรา) */
  title: string;
  /** ที่มาทางโหราที่โค้ดคำนวณได้ (ดาว ราศี เรือน มุม ระยะคลาด) */
  basis: string;
  /** ความหมายแบบลงลึก: ทำไมเรื่องนี้สำคัญ แสดงออกอย่างไร และด้านเงา */
  text: string;
  /** ใช้เรื่องนี้ให้เป็นประโยชน์อย่างไร (ประโยคเดียว · ไม่ซ้ำกันในรายการเดียว · ว่างได้) */
  advice: string;
  /** โทนของเรื่อง (สีเส้นซ้ายบนหน้าเว็บ) */
  tone: HighlightTone;
  /** รูปแบบผังที่ข้อนี้อธิบายไปแล้ว (`patternKey`) — กล่องรูปแบบพิเศษไม่ต้องอธิบายซ้ำ */
  covers?: string[];
}

/** คีย์คงที่ของรูปแบบผัง ใช้จับคู่กับ `Highlight.covers` */
export function patternKey(p: ChartPattern): string {
  if (p.type === "stellium-house") return `stellium-house:${p.house}`;
  if (p.type === "stellium-sign") return `stellium-sign:${p.sign}`;
  return `${p.type}:${p.bodies.join("-")}`;
}

/**
 * ระหว่างคัดเลือก: ความหมายเก็บเป็นประโยคย่อย (`parts`) และ "ใช้ให้ดี" มีหลายตัวเลือก
 * ตอนจัดอันดับ ประโยคที่ข้อก่อนหน้าพูดไปแล้วถูกตัดออก (เช่น จุดแข็งของราศีเดียวกันในข้อกลุ่มดาวกับข้อเจ้าเรือนลัคนา)
 * และ "ใช้ให้ดี" เลือกตัวแรกที่ยังไม่ถูกใช้
 */
type Candidate = Omit<Highlight, "advice" | "text"> & { parts: string[]; advice: string[]; /** ข้อในกลุ่มเดียวกันขึ้นได้ข้อเดียว */ group?: string };
/** รูปแบบผังที่ไม่ใช่กลุ่มดาว: ความหมายเป็นย่อหน้าเดียว */
type PatternDraft = Omit<Candidate, "parts"> & { text: string };

const PERSONAL = new Set<BodyId>(["sun", "moon", "mercury", "venus", "mars"]);
const GENERATIONAL = new Set<BodyId>(["uranus", "neptune", "pluto"]);
const MAJOR = new Set(ASPECT_DEFS.filter((d) => d.major).map((d) => d.type));
const TONE = new Map(ASPECT_DEFS.map((d) => [d.type, d.tone]));
const PATTERN_WEIGHT: Record<PatternType, number> = {
  "grand-cross": 8.5,
  "stellium-house": 8,
  "t-square": 8,
  "stellium-sign": 7.5,
  "grand-trine": 7.5,
  kite: 7.5,
  yod: 7,
};
/** กลุ่มดาวในราศีที่มีดาวส่วนตัวไม่ถึง 2 ดวง ส่วนใหญ่เป็นดาวเดินช้าที่คนเกิดปีเดียวกันมีเหมือนกัน */
const GENERATION_STELLIUM_WEIGHT = 5.5;
/** ดาวชิดแกนผังได้ไม่เกินกี่องศา */
const ANGLE_ORB = 6;
/** มุมสัมพันธ์ที่นับว่า "แนบสนิท" */
const TIGHT_ORB = 2;
/** แกนผัง ➔ เรือนที่แกนนั้นเปิด (กลุ่มดาวในเรือนนี้พูดเรื่องเดียวกับดาวชิดแกน) */
const ANGLE_HOUSE: Record<"asc" | "mc" | "dsc" | "ic", number> = { asc: 1, mc: 10, dsc: 7, ic: 4 };

const isPlanet = (id: BodyId): id is PlanetId => (PLANET_IDS as readonly string[]).includes(id);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** จุดเด่นของผังเรียงจากสำคัญที่สุด (ตัดที่ `max` ข้อ) */
export function chartHighlights(chart: NatalChart, lang: Lang, max = 7): Highlight[] {
  const th = lang === "th";
  const out: Candidate[] = [];
  const get = (id: BodyId) => chart.bodies.find((b) => b.id === id);
  const name = (id: BodyId) => bodyName(id, lang);
  /** ชื่อในประโยคอังกฤษ: "the Sun" (หัวข้อใช้ `name`) */
  const prose = (id: BodyId) => (!th && (id === "sun" || id === "moon") ? `the ${name(id)}` : name(id));
  const word = (id: BodyId) => BODY_VOICE[id].word[lang];
  const names = (ids: readonly BodyId[]) => ids.map(name).join(th ? " " : ", ");
  const words = (ids: readonly BodyId[]) => joinWords(ids.map(word), lang);
  const sign = (s: number) => signName(s, lang);
  /** จุดแข็งและจุดระวังของราศี — ประโยคเดียวกันทุกข้อ เพื่อให้ตัวกันซ้ำตัดออกได้ */
  const giftWatch = (s: number) =>
    th ? `จุดแข็งคือ${SIGN_TEXT[s].gift.th} ส่วนที่ต้องระวังคือ${SIGN_TEXT[s].watch.th}` : `Your strength is ${SIGN_TEXT[s].gift.en}; watch out for ${SIGN_TEXT[s].watch.en}.`;

  // ── 1) ดาวชิดแกนผัง — กุมลัคนา/กลางฟ้า หรือเล็งลัคนา/กลางฟ้า (= กุมจุดตก/ฐานผัง) · หลายดวงบนแกนเดียวกันรวมเป็นข้อเดียว
  const onAngle = new Map<"asc" | "mc" | "dsc" | "ic", { planet: PlanetId; orb: number }[]>();
  for (const a of chart.aspects) {
    for (const [planet, axis] of [
      [a.a, a.b],
      [a.b, a.a],
    ] as const) {
      if (!isPlanet(planet) || (axis !== "asc" && axis !== "mc") || a.orb > ANGLE_ORB) continue;
      const angle = a.type === "conjunction" ? axis : a.type === "opposition" ? (axis === "asc" ? "dsc" : "ic") : null;
      if (!angle) continue;
      if (!onAngle.has(angle)) onAngle.set(angle, []);
      onAngle.get(angle)!.push({ planet, orb: a.orb });
    }
  }
  /** กลุ่มดาวในเรือนที่ถูกรวมเข้าข้อดาวชิดแกนแล้ว */
  const foldedHouses = new Set<number>();
  for (const [angle, list] of onAngle) {
    list.sort((x, y) => x.orb - y.orb);
    const lead = list[0];
    const ids = list.map((x) => x.planet);
    const P = get(lead.planet)!;
    const ad = ANGLE_DEPTH[angle];
    const houseNo = ANGLE_HOUSE[angle];
    const stellium = chart.patterns.find((p) => p.type === "stellium-house" && p.house === houseNo && p.bodies.some((b) => ids.includes(b as PlanetId)));
    if (stellium) foldedHouses.add(houseNo);
    const hd = HOUSE_DEPTH[houseNo - 1];
    const weight = Math.max(...list.map((x) => 9 + (ANGLE_ORB - x.orb) / ANGLE_ORB + (PERSONAL.has(x.planet) ? 0.5 : 0))) + 0.3 * (list.length - 1);
    const stelliumNote = stellium
      ? th
        ? ` และมีดาว ${stellium.bodies.length} ดวงอยู่เรือน ${houseNo}`
        : `, with ${stellium.bodies.length} planets in house ${houseNo}`
      : "";
    let title: string;
    let basis: string;
    let parts: string[];
    if (list.length === 1) {
      const w = word(lead.planet);
      title = th
        ? { asc: `${w}ของคุณคือสิ่งแรกที่คนเห็น`, mc: `${w}ของคุณคือสิ่งที่งานและสังคมจดจำ`, dsc: `${w}ของคุณเห็นชัดที่สุดผ่านคู่และคนใกล้ชิด`, ic: `${w}ของคุณหยั่งรากอยู่ในบ้านและโลกส่วนตัว` }[angle]
        : { asc: `Your ${w} is the first thing people see`, mc: `Your ${w} is what the world remembers you for`, dsc: `Your ${w} shows most clearly through partners and close bonds`, ic: `Your ${w} is rooted in home and private life` }[angle];
      basis = th
        ? `${name(lead.planet)}${sign(P.sign)} ชิด${name(angle)} ห่าง ${formatDegree(lead.orb)}${stelliumNote}`
        : `${name(lead.planet)} in ${sign(P.sign)}, ${formatDegree(lead.orb)} from the ${name(angle)}${stelliumNote}`;
      const style = SIGN_TEXT[P.sign].style[lang];
      parts = [ad.why[lang], PLANET_DEPTH[lead.planet].loud[lang], stellium ? hd.why[lang] : th ? `ด้านนี้ของคุณแสดงออก${style}` : `It comes out ${style}.`];
    } else {
      title = ad.many[lang];
      basis = th ? `ดาว ${list.length} ดวงชิด${name(angle)}: ${names(ids)}${stelliumNote}` : `${list.length} planets near the ${name(angle)}: ${names(ids)}${stelliumNote}`;
      parts = [
        ad.why[lang],
        th ? `ผังของคุณมีดาวอยู่ตรงนี้ถึง ${list.length} ดวง ทั้ง${words(ids)}ของคุณจึงไปแสดงออกที่${ad.arena.th}พร้อมกัน` : `Your chart has ${list.length} planets here, so your ${words(ids)} all play out in ${ad.arena.en} at once.`,
        stellium ? hd.why[lang] : PLANET_DEPTH[lead.planet].loud[lang],
      ];
    }
    out.push({
      key: `angle:${angle}`,
      kind: "angle",
      weight,
      bodies: [...ids, angle],
      title,
      basis,
      parts,
      advice: [...(stellium ? [hd.key[lang]] : []), PLANET_DEPTH[lead.planet].key[lang]],
      tone: "neutral",
      covers: stellium ? [patternKey(stellium)] : undefined,
    });
  }

  // ── 2) รูปแบบผัง / กลุ่มดาว
  const signStelliums = chart.patterns.filter((p) => p.type === "stellium-sign");
  const mergedSigns = new Set<ChartPattern>();
  for (const p of chart.patterns) {
    if (p.type === "stellium-house" && p.house) {
      if (foldedHouses.has(p.house)) continue;
      const hd = HOUSE_DEPTH[p.house - 1];
      // ดาวชุดเดียวกันในราศีเดียว (ซ้อนกันตั้งแต่ 3 ดวง) ➔ เล่าในข้อเดียว
      const twin = signStelliums.find((s) => s.sign !== undefined && s.bodies.filter((b) => p.bodies.includes(b)).length >= 3);
      if (twin) mergedSigns.add(twin);
      const twinSign = twin?.sign;
      out.push({
        key: `pattern:stellium-house:${p.house}`,
        kind: "pattern",
        weight: PATTERN_WEIGHT[p.type],
        bodies: p.bodies,
        title: th ? `ชีวิตคุณทุ่มพลังไปที่เรื่อง${hd.topic.th}` : `Much of your energy goes into ${hd.topic.en}`,
        basis: th
          ? `ดาว ${p.bodies.length} ดวงอยู่เรือน ${p.house} (${HOUSE_TEXT[p.house - 1].title.th}): ${names(p.bodies)}${twinSign !== undefined ? ` ส่วนใหญ่อยู่${sign(twinSign)}` : ""}`
          : `${p.bodies.length} planets in house ${p.house} (${HOUSE_TEXT[p.house - 1].title.en}): ${names(p.bodies)}${twinSign !== undefined ? `, mostly in ${sign(twinSign)}` : ""}`,
        parts: [
          hd.why[lang],
          th
            ? `${words(p.bodies)}ของคุณมารวมกันที่เรื่องนี้${twinSign !== undefined ? ` และเพราะดาวกลุ่มนี้อยู่${sign(twinSign)} คุณจึงทำเรื่องนี้${SIGN_TEXT[twinSign].style.th}` : ""}`
            : `Your ${words(p.bodies)} all gather here.${twinSign !== undefined ? ` Because most of them sit in ${sign(twinSign)}, you go about it ${SIGN_TEXT[twinSign].style.en}.` : ""}`,
          hd.shadow[lang],
        ],
        advice: [hd.key[lang]],
        tone: "neutral",
        covers: [patternKey(p), ...(twin ? [patternKey(twin)] : [])],
      });
    }
  }
  for (const p of chart.patterns) {
    if (p.type === "stellium-house") continue;
    if (p.type === "stellium-sign") {
      if (mergedSigns.has(p) || p.sign === undefined) continue;
      const s = p.sign;
      const st = SIGN_TEXT[s];
      const opp = (s + 6) % 12;
      const generation = p.bodies.filter((b) => PERSONAL.has(b)).length < 2;
      out.push({
        key: `pattern:stellium-sign:${s}`,
        kind: "pattern",
        weight: generation ? GENERATION_STELLIUM_WEIGHT : PATTERN_WEIGHT[p.type],
        bodies: p.bodies,
        title: th ? `นิสัยแบบ${sign(s)}เข้มข้นในตัวคุณ` : `${sign(s)} traits run strong in you`,
        basis: th ? `ดาว ${p.bodies.length} ดวงอยู่${sign(s)}: ${names(p.bodies)}` : `${p.bodies.length} planets in ${sign(s)}: ${names(p.bodies)}`,
        parts: [
          th
            ? `ดาวหลายดวงรวมกันในราศีเดียว ลักษณะ${st.keywords.th} จึงชัดในตัวคุณกว่าคนทั่วไป ทั้ง${words(p.bodies)}ของคุณทำงาน${st.style.th}`
            : `With several planets in one sign, you are more ${st.keywords.en} than most. Your ${words(p.bodies)} all work ${st.style.en}.`,
          giftWatch(s),
          ...(generation
            ? [th ? "ดาวกลุ่มนี้ส่วนใหญ่เดินช้า คนที่เกิดช่วงเดียวกับคุณจึงมีเหมือนกัน ให้ดูเรือนที่ดาวอยู่ประกอบด้วย" : "Most of these planets move slowly, so people born around the same time share this; read it together with the houses they fall in."]
            : []),
        ],
        advice: [
          th
            ? `ลองยืม${SIGN_TEXT[opp].gift.th}ของ${sign(opp)}ซึ่งเป็นราศีตรงข้ามมาใช้บ้าง พลังของราศีนี้จะสมดุลขึ้น`
            : `To balance it, borrow from ${sign(opp)}, the opposite sign: ${SIGN_TEXT[opp].gift.en}.`,
        ],
        tone: "neutral",
        covers: [patternKey(p)],
      });
      continue;
    }
    const c = patternCandidate(chart, p, lang);
    if (c) {
      const { text, ...rest } = c;
      out.push({ ...rest, parts: [text], covers: [patternKey(p)] });
    }
  }

  // ── 3) เจ้าเรือนลัคนา
  const ruler = chart.chartRuler ? get(chart.chartRuler) : undefined;
  const asc = get("asc");
  if (ruler && asc && chart.chartRuler) {
    const id = chart.chartRuler;
    const st = SIGN_TEXT[ruler.sign];
    const hd = ruler.house ? HOUSE_DEPTH[ruler.house - 1] : undefined;
    const arena = ruler.house ? HOUSE_TEXT[ruler.house - 1].arena : undefined;
    out.push({
      key: `ruler:${id}`,
      kind: "ruler",
      weight: 7,
      bodies: [id],
      title: th ? `ชีวิตคุณถูกนำด้วย${word(id)}${hd ? ` และมักพาไปที่เรื่อง${hd.topic.th}` : ""}` : `Your ${word(id)} steers your life${hd ? `, often toward ${hd.topic.en}` : ""}`,
      basis: th
        ? `ลัคนา${sign(asc.sign)} เจ้าเรือนลัคนาคือ${name(id)} อยู่${sign(ruler.sign)}${ruler.house ? ` เรือน ${ruler.house}` : ""}`
        : `${sign(asc.sign)} rising, ruled by ${prose(id)} in ${sign(ruler.sign)}${ruler.house ? `, house ${ruler.house}` : ""}`,
      parts: [
        th
          ? `ดาวเจ้าเรือนลัคนาเป็นเหมือนกัปตันของทั้งผัง ของคุณคือ${name(id)}ใน${sign(ruler.sign)} ${word(id)}จึงเป็นตัวกำหนดทิศทางชีวิต และคุณใช้มัน${st.style.th}`
          : `The ruler of your rising sign acts as captain of the whole chart. Yours is ${prose(id)} in ${sign(ruler.sign)}, so your ${word(id)} sets your direction, and you use it ${st.style.en}.`,
        ...(arena ? [th ? `ไม่ว่าจะเริ่มจากเรื่องไหน ชีวิตมักพากลับมาที่${arena.th}` : `Wherever you start, life tends to bring you back to ${arena.en}.`] : []),
        giftWatch(ruler.sign),
        ...(hd ? [hd.why[lang]] : []),
      ],
      advice: [...(hd ? [hd.key[lang]] : []), PLANET_DEPTH[id].key[lang]],
      tone: "neutral",
    });
  }

  // ── 4) มุมสัมพันธ์หลักที่แนบสนิท (ไม่รวมแกนผัง · ไม่รวมคู่ดาวรุ่นกันเอง)
  for (const a of chart.aspects) {
    if (!MAJOR.has(a.type) || a.orb > TIGHT_ORB || !isPlanet(a.a) || !isPlanet(a.b)) continue;
    if (GENERATIONAL.has(a.a) && GENERATIONAL.has(a.b)) continue;
    const lum = Number(a.a === "sun" || a.a === "moon") + Number(a.b === "sun" || a.b === "moon");
    const personal = Number(PERSONAL.has(a.a)) + Number(PERSONAL.has(a.b));
    const type = a.type as keyof typeof ASPECT_KEY;
    out.push({
      key: `aspect:${a.a}:${a.b}`,
      kind: "aspect",
      weight: 5.5 + (TIGHT_ORB - a.orb) / TIGHT_ORB + lum * 0.75 + personal * 0.25,
      bodies: [a.a, a.b],
      title: aspectHeadline(a, lang),
      basis: th ? `${name(a.a)} ${aspectName(a, lang)} ${name(a.b)} คลาดเพียง ${formatDegree(a.orb)}` : `${name(a.a)} ${aspectName(a, lang)} ${name(a.b)}, only ${formatDegree(a.orb)} from exact`,
      parts: [describeAspect(a, lang)],
      // มุมชนิดเดียวกันขึ้นได้ข้อเดียว (สองข้อ "คุณแกว่งระหว่าง…" ติดกันอ่านซ้ำซาก · ส่วนมุมสำคัญด้านล่างมีครบอยู่แล้ว)
      group: `aspect:${a.type}`,
      advice: [ASPECT_KEY[type][lang], PLANET_DEPTH[a.a].key[lang], PLANET_DEPTH[a.b].key[lang]],
      tone: TONE.get(a.type) ?? "neutral",
    });
  }

  // ── 5) ดาวเด่นอันดับหนึ่ง
  const top = chart.dominantPlanets[0];
  const topBody = top ? get(top.id) : undefined;
  if (top && topBody) {
    const pd = PLANET_DEPTH[top.id];
    out.push({
      key: `dominant:${top.id}`,
      kind: "dominant",
      weight: 6,
      bodies: [top.id],
      title: th ? `${word(top.id)}คือแกนของชีวิตคุณ` : `Your ${word(top.id)} is the centre of your life`,
      basis: th
        ? `ดาวเด่นที่สุดของผัง: ${name(top.id)}${sign(topBody.sign)}${topBody.house ? ` เรือน ${topBody.house}` : ""}`
        : `Most prominent planet: ${prose(top.id)} in ${sign(topBody.sign)}${topBody.house ? `, house ${topBody.house}` : ""}`,
      parts: [
        th ? `เมื่อนับทั้งตำแหน่ง เรือน ศักดิ์ และมุมสัมพันธ์ ${name(top.id)}มีน้ำหนักมากที่สุดในผังคุณ` : `Counting placement, house, dignity and aspects, ${prose(top.id)} carries the most weight in your chart.`,
        pd.loud[lang],
        pd.shadow[lang],
      ],
      advice: [pd.key[lang]],
      tone: "neutral",
    });
  }

  // ── 6) ธาตุเด่นชัด (เกิน 40%) / ธาตุที่ไม่มีดาวเลย
  const es = chart.distribution.elementScore;
  const total = Object.values(es).reduce((s, v) => s + v, 0) || 1;
  const elements = Object.keys(es) as Element[];
  const missing = elements.filter((e) => chart.distribution.elements[e].length === 0);
  const elName = (e: Element) => (th ? ELEMENT_TEXT[e].name.th : ELEMENT_TEXT[e].name.en.toLowerCase());
  for (const e of elements) {
    const share = es[e] / total;
    const ed = ELEMENT_DEPTH[e];
    if (share >= 0.4) {
      const miss = missing.filter((m) => m !== e);
      out.push({
        key: `element:${e}:strong`,
        kind: "element",
        weight: 5 + share,
        bodies: chart.distribution.elements[e],
        title: ed.head[lang],
        basis: th
          ? `ธาตุ${elName(e)} ${Math.round(share * 100)}% ของผัง: ${names(chart.distribution.elements[e])}`
          : `${cap(elName(e))} makes up ${Math.round(share * 100)}% of the chart: ${names(chart.distribution.elements[e])}`,
        parts: [
          ed.strong[lang],
          ...(miss.length ? [th ? `ส่วนธาตุ${joinWords(miss.map(elName), lang)}ที่ไม่มีดาวเลย คือด้านที่คุณต้องตั้งใจเติมเอง` : `With no ${joinWords(miss.map(elName), lang)} at all, that side is one you have to build on purpose.`] : []),
        ],
        advice: [ed.key[lang]],
        tone: "neutral",
      });
    }
    if (chart.distribution.elements[e].length === 0) {
      out.push({
        key: `element:${e}:missing`,
        kind: "element",
        weight: 4.5,
        bodies: [],
        title: ed.missHead[lang],
        basis: th ? `ไม่มีดาวในธาตุ${elName(e)}เลย` : `No planets in ${elName(e)}`,
        parts: [
          ed.miss[lang],
          th
            ? "ธาตุที่ขาดไม่ได้แปลว่าคุณไม่มีด้านนี้ แต่ด้านนี้ไม่มาเอง ต้องตั้งใจสร้าง และหลายคนกลับเก่งเรื่องนั้นเพราะฝึกมาตลอดชีวิต"
            : "A missing element does not mean you lack that side; it means it will not come by itself. Many people end up excelling at it because they practised all their lives.",
        ],
        advice: [ed.missKey[lang]],
        tone: "neutral",
      });
    }
  }

  // ── 7) ศักดิ์ดาวของดาวส่วนตัวและดาวสังคม
  for (const b of chart.bodies) {
    if (!isPlanet(b.id) || GENERATIONAL.has(b.id)) continue;
    const id = b.id;
    for (const d of b.dignities) {
      const strong = d === "domicile" || d === "exaltation";
      const dd = DIGNITY_DEPTH[d];
      const st = SIGN_TEXT[b.sign];
      const theme = BODY_TEXT[id].theme[lang];
      out.push({
        key: `dignity:${id}:${d}`,
        kind: "dignity",
        weight: (strong ? 4.5 : 4) + (id === "sun" || id === "moon" ? 0.5 : 0),
        bodies: [id],
        title: th ? `${word(id)}ของคุณ${dd.head.th}` : `Your ${word(id)} ${dd.head.en}`,
        basis: th ? `${name(id)}${sign(b.sign)} (${DIGNITY_TEXT[d].name.th}: ${dd.term.th})` : `${name(id)} in ${sign(b.sign)} (${DIGNITY_TEXT[d].name.en}: ${dd.term.en})`,
        parts: strong
          ? th
            ? [`${name(id)}ดูแลเรื่อง${theme}`, dd.flow.th, `ในตัวคุณ ด้านนี้แสดงออก${st.style.th}`]
            : [`${cap(prose(id))} governs ${theme}.`, dd.flow.en, `In you, it comes out ${st.style.en}.`]
          : th
            ? [`${name(id)}ดูแลเรื่อง${theme} แต่${sign(b.sign)}ถนัดทำทุกอย่าง${st.style.th} ซึ่งไม่ใช่วิธีที่ดาวนี้คุ้นเคย`, dd.flow.th]
            : [`${cap(prose(id))} governs ${theme}, but ${sign(b.sign)} does everything ${st.style.en}, which is not how this planet likes to work.`, dd.flow.en],
        advice: [dd.key[lang], PLANET_DEPTH[id].key[lang]],
        tone: strong ? "harmonious" : "neutral",
      });
    }
  }

  // เรียง · กันซ้ำ · จำกัดจำนวนต่อชนิด (ไม่ให้มุมสัมพันธ์หรือศักดิ์ดาวกินที่ทั้งรายการ) · "ใช้ให้ดี" ไม่ซ้ำ
  const cap_: Partial<Record<HighlightKind, number>> = { aspect: 3, dignity: 2, element: 1, pattern: 2 };
  const used: Partial<Record<HighlightKind, number>> = {};
  const seen = new Set<string>();
  const advised = new Set<string>();
  const said = new Set<string>();
  const groups = new Set<string>();
  const ranked: Highlight[] = [];
  for (const h of out.sort((x, y) => y.weight - x.weight)) {
    if (seen.has(h.key)) continue;
    // ดาวเด่นอันดับหนึ่งที่ขึ้นมาแล้วในฐานะดาวชิดแกนหรือเจ้าเรือนลัคนา ไม่ต้องพูดซ้ำ
    if (h.kind === "dominant" && ranked.some((r) => (r.kind === "angle" || r.kind === "ruler") && r.bodies.includes(h.bodies[0]))) continue;
    if ((used[h.kind] ?? 0) >= (cap_[h.kind] ?? Infinity)) continue;
    if (h.group && groups.has(h.group)) continue;
    if (h.group) groups.add(h.group);
    seen.add(h.key);
    used[h.kind] = (used[h.kind] ?? 0) + 1;
    const advice = h.advice.find((x) => !advised.has(x)) ?? "";
    if (advice) advised.add(advice);
    const fresh = h.parts.filter((x) => !said.has(x));
    const parts = fresh.length ? fresh : h.parts;
    for (const x of parts) said.add(x);
    const { parts: _parts, group: _group, ...rest } = h;
    void _parts;
    void _group;
    ranked.push({ ...rest, text: parts.join(" "), advice });
    if (ranked.length >= max) break;
  }
  return ranked;
}

const ASPECT_SHORT: Record<"conjunction" | "opposition" | "trine" | "square" | "sextile", { th: string; en: string }> = {
  conjunction: { th: "กุม", en: "conjunct" },
  opposition: { th: "เล็ง", en: "opposite" },
  trine: { th: "ตรีโกณ", en: "trine" },
  square: { th: "จตุโกณ", en: "square" },
  sextile: { th: "โยค", en: "sextile" },
};

/** ชื่อมุมหลักพร้อมองศา ("กุม (0 องศา)" · "conjunct (0 degrees)") */
function aspectName(a: Aspect, lang: Lang): string {
  const deg = ASPECT_DEFS.find((d) => d.type === a.type)?.angle ?? 0;
  const short = ASPECT_SHORT[a.type as keyof typeof ASPECT_SHORT]?.[lang] ?? a.type;
  return lang === "th" ? `${short} (${deg} องศา)` : `${short} (${deg} degrees)`;
}

/** หัวข้อภาษาคนของมุมหลัก 5 แบบ */
function aspectHeadline(a: Aspect, lang: Lang): string {
  const A = BODY_VOICE[a.a].word[lang];
  const B = BODY_VOICE[a.b].word[lang];
  if (lang === "th") {
    switch (a.type) {
      case "conjunction":
        return `${A}กับ${B}ของคุณเป็นเรื่องเดียวกัน`;
      case "trine":
        return `${A}หนุน${B}ได้อย่างเป็นธรรมชาติ`;
      case "sextile":
        return `${A}เปิดทางให้${B} เมื่อคุณลงมือ`;
      case "square":
        return `${A}กับ${B}ดึงกัน และนั่นคือแรงผลักของคุณ`;
      default:
        return `คุณแกว่งระหว่าง${A}กับ${B}`;
    }
  }
  switch (a.type) {
    case "conjunction":
      return `Your ${A} and ${B} are one story`;
    case "trine":
      return `Your ${A} naturally supports your ${B}`;
    case "sextile":
      return `Your ${A} opens doors for your ${B} when you act`;
    case "square":
      return `Your ${A} and ${B} pull against each other, and that drives you`;
    default:
      return `You swing between your ${A} and your ${B}`;
  }
}

/** รูปแบบผังที่ไม่ใช่กลุ่มดาว: สามเหลี่ยมใหญ่ · ตัว T · กากบาทใหญ่ · นิ้วพระเจ้า · ว่าว */
function patternCandidate(chart: NatalChart, p: ChartPattern, lang: Lang): PatternDraft | null {
  const th = lang === "th";
  const name = (id: BodyId) => bodyName(id, lang);
  const word = (id: BodyId) => BODY_VOICE[id].word[lang];
  const names = (ids: readonly BodyId[]) => ids.map(name).join(th ? " " : ", ");
  const words = (ids: readonly BodyId[]) => joinWords(ids.map(word), lang);
  const base = { key: `pattern:${p.type}:${p.bodies.join("-")}`, kind: "pattern" as const, weight: PATTERN_WEIGHT[p.type], bodies: p.bodies };
  switch (p.type) {
    case "grand-trine": {
      const gift = p.element ? ELEMENT_DEPTH[p.element].gift[lang] : undefined;
      const el = p.element ? (th ? ELEMENT_TEXT[p.element].name.th : ELEMENT_TEXT[p.element].name.en) : "";
      return {
        ...base,
        title: th ? (gift ? `คุณมีพรสวรรค์ด้าน${gift}ที่ไหลลื่น` : "คุณมีพรสวรรค์ที่ไหลลื่น") : gift ? `You have a flowing gift for ${gift}` : "You have a flowing natural gift",
        basis: th ? `สามเหลี่ยมใหญ่${el ? `ธาตุ${el}` : ""}: ${names(p.bodies)} ทำมุม 120 องศากันครบ` : `Grand Trine${el ? ` in ${el}` : ""}: ${names(p.bodies)}, all 120 degrees apart`,
        text: th
          ? `ดาวสามดวงส่งพลังถึงกันเป็นวงครบ ${words(p.bodies)}ของคุณจึงทำงานด้วยกันได้ราบรื่นแทบไม่ต้องพยายาม จุดที่ต้องระวังคือความง่ายอาจทำให้คุณไม่ฝึกต่อ หรืออยู่ในพื้นที่สบายนานเกินไป`
          : `Three planets feed each other in a closed circle, so your ${words(p.bodies)} work together almost effortlessly. The catch is that ease can stop you practising, or keep you in your comfort zone too long.`,
        advice: [th ? "ตั้งเป้าที่ท้าทายให้พรสวรรค์นี้ได้ทำงานจริง แล้วมันจะกลายเป็นผลงาน" : "Give this gift a challenging goal so it turns into real achievement."],
        tone: "harmonious",
      };
    }
    case "t-square": {
      if (!p.apex) return null;
      const [x, y] = p.bodies.filter((b) => b !== p.apex);
      const apexBody = chart.bodies.find((b) => b.id === p.apex);
      // ขาที่ว่างของตัว T (จุดตรงข้ามดาวยอด) คือทางคลายแรงกดดัน
      const release = apexBody && chart.houses ? HOUSE_TEXT[houseOf(norm360(apexBody.lon + 180), chart.houses) - 1].arena[lang] : undefined;
      return {
        ...base,
        title: th ? `${word(p.apex)}คือจุดที่ชีวิตผลักให้คุณโต` : `Your ${word(p.apex)} is where life pushes you to grow`,
        basis: th ? `รูปตัว T: ${name(x)} เล็ง ${name(y)} และทั้งคู่ทำมุมฉากกับ${name(p.apex)} (ดาวยอด)` : `T-square: ${name(x)} opposite ${name(y)}, both square ${name(p.apex)} (the apex)`,
        text: th
          ? `${word(x)}กับ${word(y)}ของคุณดึงกันคนละทาง แล้วแรงตึงนั้นไหลมารวมที่${word(p.apex)} คุณจึงรู้สึกกดดันเรื่องนี้บ่อยกว่าเรื่องอื่น และมักเป็นเรื่องที่ทำให้คุณพยายามมากที่สุดในชีวิต${release ? ` ทางคลายแรงกดดันมักอยู่ที่เรื่อง${release}` : ""}`
          : `Your ${word(x)} and ${word(y)} pull in opposite directions, and the tension collects in your ${word(p.apex)}. You feel pressure here more often than anywhere else, and it is often where you work hardest in life.${release ? ` The release valve is usually ${release}.` : ""}`,
        advice: [th ? `เมื่อรู้สึกถูกกดดันเรื่อง${word(p.apex)} ให้มองว่าเป็นสัญญาณให้ลงมือ ไม่ใช่สัญญาณให้ถอย` : `When you feel pressure around your ${word(p.apex)}, treat it as a signal to act, not to retreat.`],
        tone: "tense",
      };
    }
    case "grand-cross":
      return {
        ...base,
        title: th ? "ชีวิตท้าทายคุณจากหลายทิศ และนั่นทำให้คุณแข็งแกร่ง" : "Life challenges you from every side, and that makes you strong",
        basis: th ? `กากบาทใหญ่: ${names(p.bodies)} ทำมุมฉากและเล็งกันครบสี่ทิศ` : `Grand Cross: ${names(p.bodies)} locked in squares and oppositions`,
        text: th
          ? `${words(p.bodies)}ของคุณดึงกันเป็นสี่ทิศ ชีวิตจึงมักมีหลายเรื่องเรียกร้องพร้อมกัน คุณอาจรู้สึกว่าไม่ค่อยได้พัก แต่คนที่มีผังแบบนี้มักแข็งแกร่ง ทนแรงกดดันได้มาก และมองเห็นทุกด้านของปัญหา`
          : `Your ${words(p.bodies)} pull in four directions, so life often makes several demands at once. You may feel you rarely get a break, but people with this pattern tend to be resilient, handle pressure well and see every side of a problem.`,
        advice: [th ? "จัดลำดับว่าเรื่องไหนสำคัญที่สุดในแต่ละช่วง แล้วทุ่มทีละเรื่อง แทนการพยายามทำทุกอย่างพร้อมกัน" : "Decide what matters most in each season of life and focus on one thing at a time."],
        tone: "tense",
      };
    case "yod": {
      if (!p.apex) return null;
      const [x, y] = p.bodies.filter((b) => b !== p.apex);
      return {
        ...base,
        title: th ? `${word(p.apex)}คือภารกิจเฉพาะตัวของคุณ` : `Your ${word(p.apex)} carries a personal mission`,
        basis: th ? `นิ้วพระเจ้า (Yod): ${name(x)} กับ ${name(y)} ทำมุม 60 องศา และทั้งคู่ทำมุม 150 องศากับ${name(p.apex)}` : `Yod: ${name(x)} and ${name(y)} in sextile, both quincunx ${name(p.apex)}`,
        text: th
          ? `${word(p.apex)}เป็นเรื่องที่ชีวิตเรียกร้องให้คุณปรับจูนอยู่เสมอ มันไม่เข้าที่ง่ายเหมือนเรื่องอื่น และบางครั้งรู้สึกเหมือนต้องทำหน้าที่ที่คนอื่นไม่เข้าใจ ยิ่งคุณยอมรับความไม่เหมือนใครของเรื่องนี้ มันก็ยิ่งกลายเป็นสิ่งที่มีแต่คุณทำได้`
          : `Life keeps asking you to fine-tune your ${word(p.apex)}. It never settles as easily as other areas, and sometimes it feels like a role others do not understand. The more you accept how unusual it is, the more it becomes something only you can do.`,
        advice: [th ? "ทดลองและปรับไปเรื่อย ๆ อย่ารอคำตอบที่สมบูรณ์แบบ" : "Keep experimenting and adjusting instead of waiting for the perfect answer."],
        tone: "neutral",
      };
    }
    case "kite": {
      if (!p.apex) return null;
      const trine = p.bodies.filter((b) => b !== p.apex);
      return {
        ...base,
        title: th ? "พรสวรรค์ของคุณมีหางเสือพาไปสู่ผลงาน" : "Your talent has a rudder that steers it to results",
        basis: th ? `ว่าว (Kite): สามเหลี่ยมใหญ่ของ${names(trine)} โดยมี${name(p.apex)}เป็นหาง` : `Kite: a Grand Trine of ${names(trine)} with ${name(p.apex)} as its tail`,
        text: th
          ? `คุณมีพรสวรรค์ที่ไหลลื่นจากสามเหลี่ยมใหญ่ และมี${word(p.apex)}เป็นแรงดึงที่พาพรสวรรค์นั้นออกมาใช้จริง ต่างจากคนที่มีพรสวรรค์แต่ไม่รู้จะใช้ทำอะไร คุณมีแรงผลักให้สร้างผลงาน`
          : `You have the flowing talent of a Grand Trine, and your ${word(p.apex)} is the pull that puts it to real use. Unlike people who have talent but no direction, you have a push to produce results.`,
        advice: [th ? `ใช้${word(p.apex)}เป็นตัวตั้งเป้า แล้วให้พรสวรรค์ที่มีพาไปถึง` : `Let your ${word(p.apex)} set the goal, and let your talent carry you there.`],
        tone: "harmonious",
      };
    }
    default:
      return null;
  }
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
