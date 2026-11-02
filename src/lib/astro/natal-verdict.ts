/**
 * ⚖️ ข้อสรุป 3 บรรทัด — ความรัก · การงาน · การเงิน (โค้ดล้วน ไม่มี AI · ผลเดิมทุกครั้ง)
 * ---------------------------------------------------------------------------
 * เจ้าของ 2026-11-02 เลือก "ข้อสรุป 3 บรรทัดบนสุด": ฟันธงว่าแต่ละด้านเด่นหรือต้องออกแรง พร้อมเหตุผลจากผังจริง
 *
 * วิธีให้คะแนน (หลักโหราสากลดั้งเดิม · ไม่ใช่สถิติ):
 * - ความรัก: ศักดิ์ของดาวศุกร์ · มุมหลักที่ดาวศุกร์ได้รับ (ดาวให้คุณ + / ดาวหนัก −) · ดาวในเรือน 7 · ศักดิ์ของเจ้าเรือน 7
 * - การงาน: ดาวในเรือน 10 · ศักดิ์ของดวงอาทิตย์ ดาวอังคาร ดาวเสาร์ และเจ้าเรือน 10 · มุมอาทิตย์-พฤหัส / อาทิตย์-เสาร์ / อังคาร-เสาร์
 * - การเงิน: ดาวในเรือน 2 และ 8 · ศักดิ์ของดาวพฤหัสและดาวศุกร์ · มุมศุกร์-พฤหัส ศุกร์-เสาร์ พฤหัส-เนปจูน ศุกร์-เนปจูน · เจ้าเรือน 2
 * มุมแนบ (≤ 3 องศา) นับเต็ม มุมหลวมนับ 60% · ไม่รู้เวลาเกิด = ไม่นับเรือนและเจ้าเรือน (ดาวอย่างเดียว)
 *
 * ⚠️ ห้ามทำนายเหตุการณ์ (แต่งงาน/หย่า/รวย/ล้มละลาย) และห้ามรับรองผลการลงทุน — บอกนิสัยและแนวโน้มของผังแบบฟันธง
 */
import { ASPECT_TEXT, type Lang, type T } from "@/data/natal/content";
import { TRADITIONAL_RULER, type Aspect, type BodyId, type NatalChart, type PlanetId } from "./natal";
import { bodyName } from "./natal-text";

export type AreaKey = "love" | "work" | "money";

interface Factor {
  w: number;
  /** ที่มาในผัง + ผลที่เกิด เช่น "ดาวพฤหัสตรีโกณดาวศุกร์ (ใจกว้างและเจอคนดีง่าย)" */
  why: string;
}

export interface AreaVerdict {
  key: AreaKey;
  label: string;
  /** คำฟันธงสั้น เช่น "เป็นจุดแข็งของผัง" */
  verdict: string;
  /** ประโยคเต็ม: เพราะอะไร + จุดที่ต้องระวัง/ตัวช่วย */
  text: string;
  score: number;
}

const MAJOR = new Set(["conjunction", "opposition", "trine", "square", "sextile"]);
const HARD = new Set<BodyId>(["saturn", "uranus", "neptune", "pluto"]);

function aspectBetween(chart: NatalChart, x: BodyId, y: BodyId): Aspect | undefined {
  return chart.aspects.find((a) => MAJOR.has(a.type) && ((a.a === x && a.b === y) || (a.a === y && a.b === x)));
}

/** "กุม" = กลาง: กับดาวหนักนับเป็นแรงต้าน กับดาวอื่นนับเป็นแรงหนุน */
function aspectSide(a: Aspect, other: BodyId): 1 | -1 {
  if (a.type === "trine" || a.type === "sextile") return 1;
  if (a.type === "square" || a.type === "opposition") return -1;
  return HARD.has(other) ? -1 : 1;
}

const tightness = (a: Aspect) => (a.orb <= 3 ? 1 : 0.6);
const aspName = (a: Aspect, lang: Lang) => ASPECT_TEXT[a.type].name[lang].replace(/\s*\(.*\)$/, "");

/** ผลของดาว `other` ที่ทำมุมกับดาวหลักของด้านนั้น — แยกฝั่งหนุน/ต้าน */
type Effects = Partial<Record<BodyId, { plus?: T; minus?: T; w: number }>>;

const LOVE_ASPECTS: Effects = {
  jupiter: { plus: { th: "ใจกว้างในความรักและเจอคนดีง่าย", en: "generous in love and meets good people easily" }, minus: { th: "รักง่ายและให้เกินตัว", en: "falls fast and gives too much" }, w: 1.5 },
  moon: { plus: { th: "อ่อนโยนและดูแลคนรักเป็น", en: "tender and good at caring for a partner" }, minus: { th: "ใจกับความต้องการในความรักดึงกันคนละทาง", en: "heart and desires pull in different directions" }, w: 1 },
  sun: { plus: { th: "มีเสน่ห์และกล้าแสดงความรัก", en: "charming and open about love" }, w: 1 },
  mars: { plus: { th: "เคมีแรงและกล้าเข้าหา", en: "strong chemistry and the nerve to make a move" }, minus: { th: "ใจร้อนและทะเลาะง่ายในความรัก", en: "hot-tempered and quick to fight in love" }, w: 1 },
  saturn: { plus: { th: "รักจริงจังและซื่อสัตย์", en: "serious and loyal in love" }, minus: { th: "รักช้าและเปิดใจยาก", en: "slow to fall in love and to open up" }, w: 1.5 },
  uranus: { plus: { th: "ชอบความสัมพันธ์ที่ให้อิสระและไม่จำเจ", en: "thrives in free, unconventional relationships" }, minus: { th: "ความสัมพันธ์เปลี่ยนเร็วและเบื่อง่าย", en: "relationships change fast and boredom comes quickly" }, w: 1.25 },
  neptune: { plus: { th: "โรแมนติกและเข้าใจคนรักลึก", en: "romantic and deeply understanding" }, minus: { th: "มองคนรักดีเกินจริง", en: "idealizes partners" }, w: 1 },
  pluto: { plus: { th: "รักลึกและผูกพันจริง", en: "loves deeply and bonds for real" }, minus: { th: "รักแรง หึงหวง และยึดติด", en: "intense, jealous and possessive in love" }, w: 1.25 },
};

const HOUSE_EFFECT: Record<AreaKey | "shared", Partial<Record<PlanetId, { w: number; t: T }>>> = {
  /** เรือน 8 = เงินร่วม เงินของคู่และหุ้นส่วน (ไม่พูดถึงมรดก: สื่อถึงการตาย) */
  shared: {
    jupiter: { w: 1, t: { th: "ได้ประโยชน์จากเงินร่วมกับคู่และหุ้นส่วน", en: "you gain through shared money with partners" } },
    venus: { w: 0.75, t: { th: "เงินเข้ามาผ่านคู่หรือหุ้นส่วน", en: "money comes through partners" } },
    neptune: { w: -0.75, t: { th: "เงินร่วมกับคนอื่นไม่ชัด ต้องมีสัญญาทุกครั้ง", en: "shared money gets murky; always put it in writing" } },
    uranus: { w: -0.5, t: { th: "เงินร่วมกับคนอื่นเปลี่ยนกะทันหัน", en: "shared money shifts suddenly" } },
  },
  love: {
    jupiter: { w: 1.5, t: { th: "คู่ที่เข้ามาช่วยให้ชีวิตคุณดีขึ้น", en: "partners improve your life" } },
    venus: { w: 1.5, t: { th: "ความสัมพันธ์ราบรื่นและหาคู่ได้ง่าย", en: "relationships run smoothly and partners come easily" } },
    sun: { w: 0.5, t: { th: "ชีวิตคู่เป็นเรื่องใหญ่ของชีวิต", en: "partnership is central to your life" } },
    moon: { w: 0.5, t: { th: "ต้องการคู่ที่ให้ความอบอุ่นทางใจ", en: "you need a partner who gives emotional warmth" } },
    saturn: { w: -1, t: { th: "ชีวิตคู่มาช้าและต้องรับผิดชอบหนัก", en: "partnership comes late and carries real weight" } },
    uranus: { w: -1, t: { th: "ความสัมพันธ์เปลี่ยนกะทันหัน", en: "relationships change suddenly" } },
    mars: { w: -0.5, t: { th: "ปะทะกับคู่บ่อย", en: "you clash with partners often" } },
    pluto: { w: -0.5, t: { th: "ความสัมพันธ์เข้มข้นและมีเรื่องอำนาจ", en: "relationships are intense and power plays show up" } },
    neptune: { w: -0.5, t: { th: "มองคู่ไม่ชัด เลือกคนผิดง่าย", en: "you misread partners and pick the wrong one easily" } },
  },
  work: {
    jupiter: { w: 2, t: { th: "งานเติบโตเร็วและมีผู้ใหญ่หนุน", en: "your career grows fast with backing from above" } },
    sun: { w: 1.5, t: { th: "คนเห็นผลงานชัดและได้เครดิต", en: "your work is seen and credited" } },
    venus: { w: 1, t: { th: "งานราบรื่นและคนในที่ทำงานรัก", en: "work goes smoothly and colleagues like you" } },
    mars: { w: 1, t: { th: "ทะเยอทะยานและชอบแข่งขัน", en: "ambitious and competitive" } },
    saturn: { w: 1, t: { th: "ขึ้นช้าแต่มั่นคง ได้ตำแหน่งจากความอดทน", en: "you rise slowly but surely, earning rank through patience" } },
    mercury: { w: 0.5, t: { th: "งานใช้ความคิดและการพูดเป็นหลัก", en: "your work runs on ideas and talk" } },
    pluto: { w: 0.5, t: { th: "อยากมีอำนาจตัดสินใจในงาน", en: "you want real power at work" } },
    moon: { w: 0.5, t: { th: "ต้องทำงานที่มีความหมายกับใจ", en: "you need work that means something to you" } },
    uranus: { w: -0.5, t: { th: "เปลี่ยนงานบ่อย", en: "you change jobs often" } },
    neptune: { w: -0.5, t: { th: "เป้าหมายงานไม่ชัด", en: "your career goals are blurry" } },
  },
  money: {
    jupiter: { w: 2, t: { th: "หาเงินเก่งและมีช่องทางเงินเข้ามาเรื่อย ๆ", en: "you earn well and new income keeps arriving" } },
    venus: { w: 1.5, t: { th: "หาเงินได้จากสิ่งที่ชอบ", en: "you earn from what you enjoy" } },
    sun: { w: 0.5, t: { th: "เงินเป็นเรื่องที่คุณให้ความสำคัญ", en: "money matters a lot to you" } },
    saturn: { w: -0.5, t: { th: "เงินมาช้า ต้องเก็บออมเป็นระบบ", en: "money comes slowly, so save systematically" } },
    mars: { w: -0.5, t: { th: "หาเงินได้แต่ใช้เร็ว", en: "you earn it and spend it fast" } },
    uranus: { w: -1, t: { th: "รายได้ขึ้นลงไม่สม่ำเสมอ", en: "income rises and falls unevenly" } },
    neptune: { w: -1, t: { th: "เงินรั่วโดยไม่รู้ตัว", en: "money leaks without you noticing" } },
  },
};

const DIGNITY_W = { domicile: 1, exaltation: 1, detriment: -1, fall: -1 } as const;

/** ศักดิ์ของดาว: เกษตร/อุจจ์ + · ประ/นิจ − */
function dignityFactor(chart: NatalChart, id: PlanetId, scale: number, plus: T, minus: T, lang: Lang, role?: T): Factor | null {
  const b = chart.bodies.find((x) => x.id === id);
  if (!b || !b.dignities.length) return null;
  const w = b.dignities.reduce((n, d) => n + DIGNITY_W[d], 0) * scale;
  if (!w) return null;
  // เจ้าเรือนต้องบอกบทบาท ("ดาวเสาร์ได้ตำแหน่งดี (เจอคู่ที่ดี)" เฉย ๆ อ่านไม่ออกว่าดาวเสาร์เกี่ยวกับคู่ตรงไหน)
  const who = lang === "th" ? `${bodyName(id, lang)}${role ? `ซึ่งเป็น${role.th}` : ""}` : `${bodyName(id, lang)}${role ? `, ${role.en},` : ""}`;
  return { w, why: `${who}${lang === "th" ? (w > 0 ? "ได้ตำแหน่งดี" : "อยู่ราศีที่อ่อน") : w > 0 ? " is well placed" : " is weakly placed"} (${(w > 0 ? plus : minus)[lang]})` };
}

function aspectFactors(chart: NatalChart, main: BodyId, effects: Effects, lang: Lang): Factor[] {
  const out: Factor[] = [];
  for (const [other, e] of Object.entries(effects) as [BodyId, NonNullable<Effects[BodyId]>][]) {
    const a = aspectBetween(chart, main, other);
    if (!a) continue;
    const side = aspectSide(a, other);
    const t = side > 0 ? e.plus : e.minus;
    if (!t) continue;
    out.push({ w: side * e.w * tightness(a), why: lang === "th" ? `${bodyName(other, lang)}${aspName(a, lang)}${bodyName(main, lang)} (${t.th})` : `${bodyName(other, lang)} ${aspName(a, lang).toLowerCase()} ${bodyName(main, lang)} (${t.en})` });
  }
  return out;
}

function houseFactors(chart: NatalChart, house: number, area: AreaKey | "shared", lang: Lang, scale = 1): Factor[] {
  const out: Factor[] = [];
  for (const b of chart.bodies) {
    if (b.house !== house) continue;
    const e = HOUSE_EFFECT[area][b.id as PlanetId];
    if (!e) continue;
    out.push({ w: e.w * scale, why: lang === "th" ? `${bodyName(b.id, lang)}อยู่เรือน ${house} (${e.t.th})` : `${bodyName(b.id, lang)} in house ${house} (${e.t.en})` });
  }
  return out;
}

/** ดาวเจ้าเรือน `house` (แบบดั้งเดิม) — ไม่รู้เวลาเกิด = null */
function houseRuler(chart: NatalChart, house: number): PlanetId | null {
  if (!chart.houses) return null;
  return TRADITIONAL_RULER[Math.floor(chart.houses[house - 1] / 30) % 12];
}

function pairFactor(chart: NatalChart, x: BodyId, y: BodyId, side: 1 | -1, w: number, t: T, lang: Lang): Factor | null {
  const a = aspectBetween(chart, x, y);
  if (!a || aspectSide(a, HARD.has(y) ? y : x) !== side) return null;
  return { w: side * w * tightness(a), why: lang === "th" ? `${bodyName(x, lang)}${aspName(a, lang)}${bodyName(y, lang)} (${t.th})` : `${bodyName(x, lang)} ${aspName(a, lang).toLowerCase()} ${bodyName(y, lang)} (${t.en})` };
}

/** คำฟันธง 8 ระดับ — ไม่มีระดับ "แล้วแต่คุณ" (เจ้าของ "ไม่เอาตอบกลาง ๆ") · ช่วงกลางบอกว่าเอียงไปทางไหน */
const VERDICT: Record<"top" | "good" | "snag" | "smooth" | "flat" | "trips" | "effort" | "lesson", T> = {
  top: { th: "เป็นจุดแข็งของผัง", en: "A real strength in your chart" },
  good: { th: "ไปได้ดี", en: "Goes well" },
  snag: { th: "ไปได้ แต่มีจุดสะดุดหนึ่งเรื่องที่ต้องคุมให้อยู่", en: "Works, as long as you keep one weak spot in check" },
  smooth: { th: "ราบรื่น", en: "Smooth" },
  flat: { th: "เรียบ ไม่ใช่เรื่องที่ผังเน้น", en: "Steady; not where your chart puts its weight" },
  trips: { th: "สะดุดง่ายกว่าคนทั่วไป", en: "Trips up more easily than for most" },
  effort: { th: "ต้องออกแรงมากกว่าคนอื่น", en: "Takes more effort than for most people" },
  lesson: { th: "เป็นบทเรียนใหญ่ของชีวิต", en: "One of your life's big lessons" },
};

function judge(key: AreaKey, label: string, factors: (Factor | null)[], lang: Lang): AreaVerdict {
  const fs = factors.filter((f): f is Factor => !!f);
  const score = Math.round(fs.reduce((n, f) => n + f.w, 0) * 10) / 10;
  const plus = fs.filter((f) => f.w > 0).sort((a, b) => b.w - a.w);
  const minus = fs.filter((f) => f.w < 0).sort((a, b) => a.w - b.w);
  const band =
    score >= 2.5 ? "top" : score >= 1 ? "good" : score <= -2.5 ? "lesson" : score <= -1 ? "effort" : score < 0 ? "trips" : minus.length ? "snag" : plus.length ? "smooth" : "flat";
  const th = lang === "th";
  const lead = score < 0 ? minus[0] : plus[0];
  const other = score < 0 ? plus[0] : minus[0];
  const parts: string[] = [];
  if (lead) parts.push(th ? `เพราะ${lead.why}` : `Because ${lead.why}.`);
  if (other) parts.push(score < 0 ? (th ? `ตัวช่วยของคุณคือ${other.why}` : `Your ally: ${other.why}.`) : th ? `จุดที่ต้องระวังคือ${other.why}` : `Watch out: ${other.why}.`);
  return { key, label, verdict: VERDICT[band][lang], text: parts.join(" "), score };
}

export function chartVerdicts(chart: NatalChart, lang: Lang): AreaVerdict[] {
  const th = lang === "th";
  const T2 = (t: string, e: string): T => ({ th: t, en: e });
  const r7 = houseRuler(chart, 7);
  const r10 = houseRuler(chart, 10);
  const r2 = houseRuler(chart, 2);
  const love = judge(
    "love",
    th ? "ความรัก" : "Love",
    [
      dignityFactor(chart, "venus", 1.5, T2("รักเป็นและมีเสน่ห์โดยธรรมชาติ", "loving and naturally attractive"), T2("ความรักไม่มาง่าย ต้องเรียนรู้วิธีรักของตัวเอง", "love does not come easily; you learn your own way of loving"), lang),
      ...aspectFactors(chart, "venus", LOVE_ASPECTS, lang),
      ...houseFactors(chart, 7, "love", lang),
      r7 && r7 !== "venus" ? dignityFactor(chart, r7, 1, T2("เจอคู่ที่ดีกับคุณ", "you attract good partners"), T2("คู่ที่เลือกพาเรื่องหนักมาด้วย", "the partners you pick bring heavy baggage"), lang, T2("เจ้าเรือนคู่", "ruler of your partnership house")) : null,
    ],
    lang,
  );
  const work = judge(
    "work",
    th ? "การงาน" : "Work",
    [
      ...houseFactors(chart, 10, "work", lang),
      dignityFactor(chart, "sun", 1, T2("มั่นใจและเป็นผู้นำได้", "confident and able to lead"), T2("ต้องสร้างความมั่นใจในงานเอง", "you build your work confidence yourself"), lang),
      dignityFactor(chart, "mars", 1, T2("ลงมือเร็วและสู้งาน", "quick to act and hard-working"), T2("แรงลงมือไม่สม่ำเสมอ", "your drive comes and goes"), lang),
      dignityFactor(chart, "saturn", 1, T2("วินัยดีและทำงานหนักได้นาน", "disciplined with real staying power"), T2("ความรับผิดชอบหนักใจกว่าคนอื่น", "responsibility weighs on you more than on others"), lang),
      r10 && !["sun", "mars", "saturn"].includes(r10) ? dignityFactor(chart, r10, 1, T2("เส้นทางอาชีพเปิดง่าย", "your career path opens easily"), T2("เส้นทางอาชีพต้องสร้างเองทีละขั้น", "you build your career path step by step"), lang, T2("เจ้าเรือนงาน", "ruler of your career house")) : null,
      pairFactor(chart, "sun", "jupiter", 1, 1, T2("มั่นใจและได้โอกาส", "confidence that attracts opportunity"), lang),
      pairFactor(chart, "sun", "saturn", -1, 1, T2("ถูกกดดันจากผู้ใหญ่และต้องพิสูจน์ตัวเองซ้ำ", "pressure from above; you must prove yourself again and again"), lang),
      pairFactor(chart, "mars", "saturn", -1, 0.5, T2("ติดขัดตอนจะลงมือ เร่งไม่ได้", "you stall when it is time to act"), lang),
      pairFactor(chart, "sun", "mars", 1, 0.5, T2("พลังทำงานสูง", "high working energy"), lang),
    ],
    lang,
  );
  const money = judge(
    "money",
    th ? "การเงิน" : "Money",
    [
      ...houseFactors(chart, 2, "money", lang),
      ...houseFactors(chart, 8, "shared", lang),
      dignityFactor(chart, "jupiter", 1.5, T2("มีโอกาสทางเงินมากกว่าคนทั่วไป", "more money openings than most people"), T2("โอกาสทางเงินต้องหาเองและใจกว้างเกินตัวได้ง่าย", "you find money openings yourself and overgive easily"), lang),
      dignityFactor(chart, "venus", 1, T2("ดึงดูดเงินและของดีเข้าหาตัว", "you draw money and good things toward you"), T2("ใช้เงินตามความรู้สึก", "you spend on feelings"), lang),
      r2 && !["jupiter", "venus"].includes(r2) ? dignityFactor(chart, r2, 1, T2("รายได้หลักมั่นคง", "your main income is steady"), T2("รายได้หลักต้องบริหารใกล้ชิด", "your main income needs close management"), lang, T2("เจ้าเรือนเงิน", "ruler of your money house")) : null,
      pairFactor(chart, "venus", "jupiter", 1, 1, T2("เงินไหลเข้าง่ายกว่าคนทั่วไป", "money flows in more easily than for most"), lang),
      pairFactor(chart, "venus", "saturn", -1, 0.5, T2("ระวังเงินจนตึงและไม่กล้าใช้กับตัวเอง", "so careful with money you will not spend on yourself"), lang),
      pairFactor(chart, "jupiter", "neptune", -1, 0.5, T2("ใจกว้างจนเงินรั่ว", "so generous that money leaks"), lang),
      pairFactor(chart, "venus", "neptune", -1, 0.5, T2("จ่ายเงินตามอารมณ์และเชื่อคนง่าย", "you spend on impulse and trust too easily"), lang),
    ],
    lang,
  );
  return [love, work, money];
}
