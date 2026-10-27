/**
 * ✍️ ประกอบคำอธิบายผังดวงจากตัวเลขที่คำนวณได้ — โค้ดล้วน ไม่มี AI (ผลเดิมทุกครั้ง)
 * โหลดพร้อมตัวคำนวณ (dynamic import) เพราะดึงคำอธิบายราศีทั้ง 12 จาก `src/data/zodiac.ts`
 */
import { ZODIAC_SIGNS } from "@/data/zodiac";
import {
  ASPECT_TEXT,
  BODY_TEXT,
  DIGNITY_TEXT,
  ELEMENT_TEXT,
  HEMISPHERE_TEXT,
  HOUSE_TEXT,
  MODALITY_TEXT,
  MOON_PHASE_TEXT,
  MOON_SIGN_TEXT,
  PATTERN_TEXT,
  RISING_TEXT,
  SIGN_TEXT,
  type Lang,
} from "@/data/natal/content";
import {
  formatDegree,
  type Aspect,
  type BodyId,
  type BodyPosition,
  type ChartPattern,
  type Element,
  type Modality,
  type NatalChart,
} from "./natal";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** ไม้ยมกต้องมีวรรคตามหลังเสมอ แม้คำถัดไปจะต่อท้ายทันทีในแม่แบบประโยค */
const thw = (s: string) => (s.endsWith("ๆ") ? `${s} ` : s);

/** ชื่อในประโยคอังกฤษ: "the Sun" / "the Moon" (หัวข้อใช้ `bodyName`) */
function prose(id: BodyId, lang: Lang): string {
  const n = BODY_TEXT[id].name[lang];
  return lang === "en" && (id === "sun" || id === "moon") ? `the ${n}` : n;
}

export function signName(sign: number, lang: Lang): string {
  const s = ZODIAC_SIGNS[sign];
  return lang === "th" ? s.nameTh : s.nameEn;
}

export function bodyName(id: BodyId, lang: Lang): string {
  return BODY_TEXT[id].name[lang];
}

/** "ราศีมังกร 10°07′" / "Capricorn 10°07′" */
export function placement(b: BodyPosition, lang: Lang): string {
  return `${signName(b.sign, lang)} ${formatDegree(b.degInSign)}`;
}

export interface BodyCards {
  /** ไพ่ประจำดาว */
  planet?: string;
  /** ไพ่ประจำราศีที่ดาวอยู่ (Major) */
  sign: string;
  /** ไพ่ประจำช่วง 10 องศา (Minor 2–10) */
  decan: string;
}

export function cardsFor(b: BodyPosition): BodyCards {
  const s = ZODIAC_SIGNS[b.sign];
  return { planet: BODY_TEXT[b.id].cardId, sign: s.majorCardId, decan: s.decans[b.decan].cardId };
}

/** ย่อหน้าคำอธิบายของดาว/จุดหนึ่งดวง */
export function describeBody(chart: NatalChart, b: BodyPosition, lang: Lang): string[] {
  const bt = BODY_TEXT[b.id];
  const st = SIGN_TEXT[b.sign];
  const name = bt.name[lang];
  const sign = signName(b.sign, lang);
  const out: string[] = [];

  if (b.id === "sun") {
    out.push(ZODIAC_SIGNS[b.sign][lang].nature);
  } else if (b.id === "moon") {
    out.push(MOON_SIGN_TEXT[b.sign][lang]);
  } else if (b.id === "asc") {
    out.push(RISING_TEXT[b.sign][lang]);
    const ruler = chart.chartRuler ? chart.bodies.find((x) => x.id === chart.chartRuler) : undefined;
    if (ruler) {
      out.push(
        lang === "th"
          ? `เจ้าเรือนลัคนาคือ${bodyName(ruler.id, lang)} ซึ่งอยู่${signName(ruler.sign, lang)}${ruler.house ? ` เรือน ${ruler.house}` : ""} ดาวดวงนี้จึงเป็นเหมือนกัปตันของทั้งผัง เรื่อง${HOUSE_TEXT[(ruler.house ?? 1) - 1].arena[lang]}มีผลต่อชีวิตคุณมาก`
          : `Your chart ruler is ${prose(ruler.id, lang)} in ${signName(ruler.sign, lang)}${ruler.house ? `, house ${ruler.house}` : ""}. It acts as the captain of the whole chart, so ${HOUSE_TEXT[(ruler.house ?? 1) - 1].arena[lang]} weigh heavily in your life.`,
      );
    }
    return out;
  } else if (b.id === "node") {
    const opp = (b.sign + 6) % 12;
    out.push(
      lang === "th"
        ? `ชีวิตชวนให้คุณเติบโต${st.style.th} โดยฝึกใช้${st.gift.th} ส่วนโหนดใต้ใน${signName(opp, lang)}คือสิ่งที่ถนัดอยู่แล้วจนติดเป็นนิสัย (${SIGN_TEXT[opp].keywords.th}) ใช้เป็นฐานได้ แต่ถ้าวนอยู่ที่เดิมจะรู้สึกว่าชีวิตไม่ไปไหน`
        : `Life invites you to grow ${st.style.en}, learning to use ${st.gift.en}. Your South Node in ${signName(opp, lang)} is your comfort zone (${SIGN_TEXT[opp].keywords.en}): a good base, but staying there too long makes life feel stuck.`,
    );
  } else if (b.id === "southNode") {
    return out;
  } else {
    out.push(
      lang === "th"
        ? `คุณ${bt.verb.th}${st.style.th} ด้านนี้ได้พลังจาก${st.gift.th} แต่ต้องระวัง${st.watch.th}`
        : `You ${bt.verb.en} ${st.style.en}. This side of you draws strength from ${st.gift.en}, but watch out for ${st.watch.en}.`,
    );
  }

  if (bt.generational) {
    out.push(
      lang === "th"
        ? `${name}อยู่ราศีเดียวนานหลายปี ราศีจึงบอกเรื่องของคนรุ่นเดียวกันมากกว่าตัวคุณคนเดียว ให้ดูเรือนที่ดาวอยู่เป็นหลัก`
        : `${cap(prose(b.id, lang))} stays in one sign for years, so its sign describes your generation more than you personally. Its house matters more.`,
    );
  }

  if (b.house) {
    const ht = HOUSE_TEXT[b.house - 1];
    out.push(
      lang === "th"
        ? `อยู่เรือน ${b.house} (${ht.title.th}) เรื่องนี้จึงเห็นชัดที่สุดในด้าน${ht.arena.th}`
        : `In house ${b.house} (${ht.title.en}), this shows most clearly through ${ht.arena.en}.`,
    );
  }

  for (const d of b.dignities) {
    out.push(lang === "th" ? `${name}${DIGNITY_TEXT[d].meaning.th}` : `${cap(prose(b.id, lang))} in ${sign}: ${DIGNITY_TEXT[d].meaning.en}.`);
  }

  if (b.retrograde && !["node", "southNode", "lilith", "sun", "moon"].includes(b.id)) {
    out.push(
      lang === "th"
        ? `${name}ถอยหลังตอนคุณเกิด พลังนี้หันเข้าด้านใน คุณมักทบทวนเรื่องนี้กับตัวเองก่อนแสดงออก`
        : `${cap(prose(b.id, lang))} was retrograde when you were born: this energy turns inward, and you tend to work it through privately before showing it.`,
    );
  }
  return out;
}

export function describeAspect(a: Aspect, lang: Lang): string {
  const A = BODY_TEXT[a.a];
  const B = BODY_TEXT[a.b];
  const meaning = ASPECT_TEXT[a.type].meaning[lang];
  return lang === "th" ? `${A.noun.th} กับ${thw(B.noun.th)}ของคุณ: ${meaning}` : `Your ${A.noun.en} with your ${B.noun.en}: ${meaning}.`;
}

export function aspectTitle(a: Aspect, lang: Lang): string {
  return `${bodyName(a.a, lang)} ${ASPECT_TEXT[a.type].name[lang]} ${bodyName(a.b, lang)}`;
}

export function describePattern(chart: NatalChart, p: ChartPattern, lang: Lang): { title: string; text: string } {
  const pt = PATTERN_TEXT[p.type];
  const names = p.bodies.map((id) => bodyName(id, lang)).join(lang === "th" ? " " : ", ");
  let title = pt.name[lang];
  if (p.type === "stellium-sign" && p.sign !== undefined) title += lang === "th" ? `: ${signName(p.sign, lang)}` : `: ${signName(p.sign, lang)}`;
  if (p.type === "stellium-house" && p.house) title += lang === "th" ? `: เรือน ${p.house}` : `: house ${p.house}`;
  if (p.type === "grand-trine" && p.element) title += lang === "th" ? ` ธาตุ${ELEMENT_TEXT[p.element].name.th}` : ` in ${ELEMENT_TEXT[p.element].name.en}`;
  let text = `${pt.meaning[lang]} (${names})`;
  if (p.apex && (p.type === "t-square" || p.type === "yod")) {
    text +=
      lang === "th"
        ? ` ดาวยอดคือ${bodyName(p.apex, lang)} เรื่อง${thw(BODY_TEXT[p.apex].noun.th)}จึงเป็นจุดที่ชีวิตผลักให้คุณเติบโต`
        : ` The apex is ${prose(p.apex, lang)}: life pushes you to grow through your ${BODY_TEXT[p.apex].noun.en}.`;
  }
  if (p.type === "stellium-house" && p.house) text += lang === "th" ? ` ด้าน${HOUSE_TEXT[p.house - 1].arena.th}` : `: ${HOUSE_TEXT[p.house - 1].arena.en}.`;
  void chart;
  return { title, text };
}

function topKey<K extends string>(score: Record<K, number>): K {
  return (Object.keys(score) as K[]).reduce((a, b) => (score[b] > score[a] ? b : a));
}

/** ภาพรวมทั้งผังเป็นย่อหน้าสั้น ๆ */
export function chartSummary(chart: NatalChart, lang: Lang): string[] {
  const get = (id: BodyId) => chart.bodies.find((b) => b.id === id);
  const sun = get("sun")!;
  const moon = get("moon")!;
  const asc = get("asc");
  const out: string[] = [];

  out.push(
    lang === "th"
      ? `อาทิตย์${signName(sun.sign, lang)} จันทร์${signName(moon.sign, lang)}${asc ? ` ลัคนา${signName(asc.sign, lang)}` : ""}: ตัวตนข้างในเป็นคน${SIGN_TEXT[sun.sign].keywords.th} ใจลึก ๆ เป็นคน${SIGN_TEXT[moon.sign].keywords.th}${asc ? ` ส่วนคนที่เพิ่งรู้จักจะเห็นคุณเป็นคน${SIGN_TEXT[asc.sign].keywords.th}` : ""}`
      : `Sun in ${signName(sun.sign, lang)}, Moon in ${signName(moon.sign, lang)}${asc ? `, ${signName(asc.sign, lang)} rising` : ""}: at your core you are ${SIGN_TEXT[sun.sign].keywords.en}, your heart needs to be ${SIGN_TEXT[moon.sign].keywords.en}${asc ? `, and people first meet someone ${SIGN_TEXT[asc.sign].keywords.en}` : ""}.`,
  );

  const el: Element = topKey(chart.distribution.elementScore);
  const mod: Modality = topKey(chart.distribution.modalityScore);
  out.push(`${ELEMENT_TEXT[el].strong[lang]} ${MODALITY_TEXT[mod].strong[lang]}`);
  for (const e of Object.keys(chart.distribution.elements) as Element[]) {
    if (chart.distribution.elements[e].length === 0) out.push(ELEMENT_TEXT[e].weak[lang]);
  }

  const h = chart.distribution.hemispheres;
  if (h) {
    if (h.north.length >= 7) out.push(HEMISPHERE_TEXT.north.meaning[lang]);
    if (h.south.length >= 7) out.push(HEMISPHERE_TEXT.south.meaning[lang]);
    if (h.east.length >= 7) out.push(HEMISPHERE_TEXT.east.meaning[lang]);
    if (h.west.length >= 7) out.push(HEMISPHERE_TEXT.west.meaning[lang]);
  }

  out.push(MOON_PHASE_TEXT[chart.moonPhase.phase].meaning[lang]);

  const top = chart.dominantPlanets[0];
  if (top) {
    out.push(
      lang === "th"
        ? `ดาวที่เด่นที่สุดในผังคือ${bodyName(top.id, lang)} เรื่อง${thw(BODY_TEXT[top.id].noun.th)}จึงเป็นแกนสำคัญของชีวิตคุณ`
        : `The most prominent planet in your chart is ${prose(top.id, lang)}, putting your ${BODY_TEXT[top.id].noun.en} at the centre of your life.`,
    );
  }
  return out.map(cap);
}
