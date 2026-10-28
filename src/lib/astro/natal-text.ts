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
  SYN_ASPECT_MEANING,
  SYN_PAIR_TEXT,
  TRANSIT_TEXT,
  TRANSIT_TONE,
  type Lang,
} from "@/data/natal/content";
import { BODY_VOICE, CHIRON_SIGN, HOUSE_DEPTH, MC_CAREER, PLANET_DEPTH, PLANET_SIGN_TEXT, TRANSIT_KEY } from "@/data/natal/depth";
import {
  ASPECT_DEFS,
  PLANET_IDS,
  formatDegree,
  type AspectType,
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
export const thw = (s: string) => (s.endsWith("ๆ") ? `${s} ` : s);

/** รายการคำ: "ตัวตนและความรัก" · "ตัวตน ความรัก และความฝัน" · "self, love and dreams" */
export function joinWords(items: readonly string[], lang: Lang): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return lang === "th" ? `${thw(items[0])}และ${items[1]}` : `${items[0]} and ${items[1]}`;
  const init = items.slice(0, -1);
  const last = items[items.length - 1];
  return lang === "th" ? `${init.join(" ")} และ${last}` : `${init.join(", ")} and ${last}`;
}

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

/** ดาวที่มีคำอธิบายรายราศีเขียนแยกไว้ (`PLANET_SIGN_TEXT`) */
const SIGN_WRITTEN = new Set<BodyId>(["mercury", "venus", "mars", "jupiter", "saturn"]);

/**
 * ย่อหน้าคำอธิบายของดาว/จุดหนึ่งดวง
 * เจ้าของ 2026-10-28 "เข้าใจง่ายแต่ลึกซึ้ง · อัปเกรดทั้งหน้า" ➔ เลิกประกอบ "คำกริยาของดาว + ท่าทีของราศี" กับทุกดาว
 * (ดาวในราศีเดียวกันเคยได้ประโยคเดียวกัน และบางคู่อ่านไม่เป็นภาษา) · พุธถึงเสาร์ใช้ย่อหน้าที่เขียนรายราศี ·
 * ดาวรุ่นพูดถึงคนรุ่นเดียวกัน · ไครอน ลิลิธ กลางฟ้า มีแม่แบบของตัวเอง
 */
export function describeBody(chart: NatalChart, b: BodyPosition, lang: Lang): string[] {
  const th = lang === "th";
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
        th
          ? `เจ้าเรือนลัคนาคือ${bodyName(ruler.id, lang)} ซึ่งอยู่${signName(ruler.sign, lang)}${ruler.house ? ` เรือน ${ruler.house}` : ""} ดาวดวงนี้จึงเป็นเหมือนกัปตันของทั้งผัง เรื่อง${thw(HOUSE_TEXT[(ruler.house ?? 1) - 1].arena.th)}มีผลต่อชีวิตคุณมาก`
          : `Your chart ruler is ${prose(ruler.id, lang)} in ${signName(ruler.sign, lang)}${ruler.house ? `, house ${ruler.house}` : ""}. It acts as the captain of the whole chart, so ${HOUSE_TEXT[(ruler.house ?? 1) - 1].arena[lang]} weigh heavily in your life.`,
      );
    }
    return out;
  } else if (b.id === "node") {
    const opp = (b.sign + 6) % 12;
    out.push(
      th
        ? `ชีวิตชวนให้คุณเติบโต${st.style.th} โดยฝึกใช้${st.gift.th} ส่วนโหนดใต้ใน${signName(opp, lang)}คือสิ่งที่ถนัดอยู่แล้วจนติดเป็นนิสัย (${SIGN_TEXT[opp].keywords.th}) ใช้เป็นฐานได้ แต่ถ้าวนอยู่ที่เดิมจะรู้สึกว่าชีวิตไม่ไปไหน`
        : `Life invites you to grow ${st.style.en}, learning to use ${st.gift.en}. Your South Node in ${signName(opp, lang)} is your comfort zone (${SIGN_TEXT[opp].keywords.en}): a good base, but staying there too long makes life feel stuck.`,
    );
  } else if (b.id === "southNode") {
    return out;
  } else if (SIGN_WRITTEN.has(b.id)) {
    const ps = PLANET_SIGN_TEXT[b.id as "mercury"][b.sign];
    out.push(`${ps.core[lang]} ${ps.edge[lang]}`);
  } else if (bt.generational) {
    out.push(
      th
        ? `${name}อยู่ราศีเดียวนานหลายปี ${sign}จึงบอกเรื่องของคนรุ่นคุณมากกว่าตัวคุณคนเดียว คนรุ่นนี้มอง${bt.theme.th}ในแบบที่${st.keywords.th}${b.house ? " ส่วนที่เป็นเรื่องเฉพาะตัวคุณคือเรือนที่ดาวอยู่" : ""}`
        : `${cap(prose(b.id, lang))} stays in one sign for years, so ${sign} describes your generation more than you personally: people of your generation approach ${bt.theme.en} in their own way, ${st.keywords.en}.${b.house ? " What is personal to you is the house it falls in." : ""}`,
    );
  } else if (b.id === "chiron") {
    out.push(
      th
        ? `แผลใจที่คุณพกมานานมักเกี่ยวกับ${CHIRON_SIGN[b.sign].th} เรื่องนี้อาจเจ็บซ้ำเป็นพัก ๆ แต่เมื่อคุณเข้าใจมัน มันจะกลายเป็นสิ่งที่คุณช่วยคนอื่นได้ดีที่สุด`
        : `The old wound you carry is often about ${CHIRON_SIGN[b.sign].en}. It may ache again from time to time, but once you understand it, it becomes the very thing you are best at helping others with.`,
    );
  } else if (b.id === "lilith") {
    out.push(
      th
        ? `ด้านที่คุณเป็นคน${st.keywords.th} คือด้านที่ไม่ยอมให้ใครกดหรือควบคุม ถ้าถูกบังคับให้ซ่อนด้านนี้นานเกินไป มันจะปะทุออกมาแรงกว่าที่ตั้งใจ การยอมรับด้านนี้อย่างเปิดเผยคือพลังของคุณ`
        : `The part of you that is ${st.keywords.en} is the part you refuse to let anyone control. Forced into hiding for too long, it bursts out harder than you intend. Owning it openly is your power.`,
    );
  } else if (b.id === "mc") {
    out.push(
      th
        ? `งานและบทบาทที่ทำให้คุณภูมิใจคือบทบาทที่ได้เป็นคน${st.keywords.th} งานที่ใช่มักเป็น${MC_CAREER[b.sign].th}`
        : `The work and role that make you proud let you be ${st.keywords.en}. The right path is often ${MC_CAREER[b.sign].en}.`,
    );
  } else {
    // ดาวเคราะห์น้อย · จุดคำนวณ (ส่วนแห่งโชค เวอร์เท็กซ์ จุดตก ก้นฟ้า)
    const w = BODY_VOICE[b.id].word[lang];
    out.push(th ? `ด้าน${w}ของคุณเป็นไป${st.style.th} และได้พลังจาก${st.gift.th}` : `Your ${w} works ${st.style.en}, drawing strength from ${st.gift.en}.`);
  }

  // กลางฟ้าในระบบเรือนแบบมุม (Placidus ฯลฯ) คือจุดเริ่มเรือน 10 เสมอ — บอกซ้ำไม่มีประโยชน์
  if (b.house && !(b.id === "mc" && b.house === 10)) {
    const ht = HOUSE_TEXT[b.house - 1];
    out.push(th ? `อยู่เรือน ${b.house} (${ht.title.th}) พลังนี้จึงลงไปที่เรื่อง${thw(ht.arena.th)}มากที่สุด` : `In house ${b.house} (${ht.title.en}), this energy goes mostly into ${ht.arena.en}.`);
  }

  for (const d of b.dignities) {
    out.push(th ? `${name}${DIGNITY_TEXT[d].meaning.th}` : `${cap(prose(b.id, lang))} in ${sign}: ${DIGNITY_TEXT[d].meaning.en}.`);
  }

  if (b.retrograde && !["node", "southNode", "lilith", "sun", "moon"].includes(b.id)) {
    out.push(
      th
        ? `${name}ถอยหลังตอนคุณเกิด พลังนี้หันเข้าด้านใน คุณมักทบทวนเรื่องนี้กับตัวเองก่อนแสดงออก`
        : `${cap(prose(b.id, lang))} was retrograde when you were born: this energy turns inward, and you tend to work it through privately before showing it.`,
    );
  }
  return out;
}

/**
 * ประโยคของมุมหลัก 5 แบบ จาก "สิ่งที่ดาวแต่ละดวงต้องการ" (`BODY_VOICE`) — ใช้ได้กับทุกดาวและทุกจุด
 * (เจ้าของ 2026-10-28 "สื่อความหมายไม่ชัด" ➔ รอบแรกใช้คำกริยาของดาว แต่คำกริยาบางดวงต่อกันไม่เป็นภาษา
 * เช่น "อีกใจอยากไม่ยอมให้ใครกด" ➔ รอบสอง "เข้าใจง่ายแต่ลึกซึ้ง" ใช้ความต้องการ + มุมมองว่ามุมนี้ทำงานในใจอย่างไร)
 * มุมรองยังใช้ความหมายกลางของมุม
 */
export function describeAspect(a: Aspect, lang: Lang): string {
  const A = BODY_VOICE[a.a];
  const B = BODY_VOICE[a.b];
  const meaning = ASPECT_TEXT[a.type].meaning[lang];
  if (lang === "th") {
    switch (a.type) {
      case "conjunction":
        return `ความต้องการที่จะ${A.want.th}กับความต้องการที่จะ${B.want.th}ในตัวคุณหลอมเป็นแรงเดียวกัน เมื่อสองเรื่องนี้ไปทางเดียวกัน พลังของคุณเข้มข้นและชัดเจนมาก แต่เมื่อด้านหนึ่งสะดุด อีกด้านจะสะเทือนตามทันที`;
      case "trine":
        return `${A.word.th}กับ${B.word.th}ของคุณหนุนกันเองโดยไม่ต้องฝืน ยิ่งคุณ${A.want.th} ก็ยิ่ง${B.want.th}ง่ายขึ้น คนรอบตัวมักมองว่านี่คือพรสวรรค์ แต่ตัวคุณเองอาจมองข้ามเพราะมันง่ายเกินไป`;
      case "sextile":
        return `${A.word.th}กับ${B.word.th}ของคุณพร้อมช่วยกัน แต่ประตูบานนี้ไม่เปิดเอง ต้องเป็นคุณที่เริ่มก่อน และเมื่อเริ่มแล้ว สองด้านนี้จะส่งแรงให้กันจนเกิดโอกาสใหม่`;
      case "square":
        return `ใจหนึ่งต้องการ${A.want.th} อีกใจต้องการ${B.want.th} สองอย่างนี้มักชนกันในจังหวะสำคัญจนรู้สึกติดขัดหรือหงุดหงิด แต่แรงเสียดทานนี้เองที่ผลักให้คุณไม่หยุดนิ่ง และเก่งขึ้นทุกครั้งที่หาทางให้สองด้านอยู่ด้วยกันได้`;
      case "opposition":
        return `คุณแกว่งไปมาระหว่างความต้องการที่จะ${A.want.th} กับความต้องการที่จะ${B.want.th} และมักเห็นอีกด้านผ่านคนใกล้ตัว คนที่ทำให้คุณหงุดหงิดที่สุดอาจกำลังสะท้อนด้านที่คุณยังไม่ยอมใช้ ทางออกคือหาจุดกลาง ไม่ใช่เลือกข้าง`;
      default:
        return `${BODY_TEXT[a.a].noun.th} กับ${thw(BODY_TEXT[a.b].noun.th)}ของคุณ: ${meaning}`;
    }
  }
  switch (a.type) {
    case "conjunction":
      return `Your need ${A.want.en} and your need ${B.want.en} are fused into one drive. When they pull the same way, your energy is intense and clear; when one stumbles, the other shakes too.`;
    case "trine":
      return `Your ${A.word.en} and ${B.word.en} support each other without effort: the more you manage ${A.want.en}, the easier it is ${B.want.en}. Others may see it as a gift, while you may overlook it because it comes so easily.`;
    case "sextile":
      return `Your ${A.word.en} and ${B.word.en} are ready to help each other, but this door does not open by itself. You have to make the first move; once you do, the two feed each other and new opportunities appear.`;
    case "square":
      return `Part of you wants ${A.want.en}; another part wants ${B.want.en}. They tend to collide at key moments, leaving you stuck or frustrated, but that friction keeps you moving and makes you more capable each time you find a way for both to live together.`;
    case "opposition":
      return `You swing between the need ${A.want.en} and the need ${B.want.en}, often meeting the other side through people close to you. Whoever frustrates you most may be mirroring a side of you that you have not yet claimed. The answer is a middle path, not picking a side.`;
    default:
      return `Your ${BODY_TEXT[a.a].noun.en} with your ${BODY_TEXT[a.b].noun.en}: ${meaning}.`;
  }
}

export function aspectTitle(a: Aspect, lang: Lang): string {
  return `${bodyName(a.a, lang)} ${ASPECT_TEXT[a.type].name[lang]} ${bodyName(a.b, lang)}`;
}

export function describePattern(chart: NatalChart, p: ChartPattern, lang: Lang): { title: string; text: string } {
  const th = lang === "th";
  const pt = PATTERN_TEXT[p.type];
  const names = p.bodies.map((id) => bodyName(id, lang)).join(th ? " " : ", ");
  let title = pt.name[lang];
  if (p.type === "stellium-sign" && p.sign !== undefined) title += `: ${signName(p.sign, lang)}`;
  if (p.type === "stellium-house" && p.house) title += th ? `: เรือน ${p.house}` : `: house ${p.house}`;
  if (p.type === "grand-trine" && p.element) title += th ? ` ธาตุ${ELEMENT_TEXT[p.element].name.th}` : ` in ${ELEMENT_TEXT[p.element].name.en}`;
  // กลุ่มดาว: บอกว่าดาวกลุ่มนี้ทำให้คุณเป็นคนแบบไหน ไม่ใช่แค่นิยามศัพท์
  if (p.type === "stellium-house" && p.house) {
    const why = HOUSE_DEPTH[p.house - 1].why[lang];
    return { title, text: th ? `ดาว ${p.bodies.length} ดวงอยู่เรือนนี้ (${names}) ${why}` : `${p.bodies.length} planets fall in this house (${names}). ${why}` };
  }
  if (p.type === "stellium-sign" && p.sign !== undefined) {
    const kw = SIGN_TEXT[p.sign].keywords[lang];
    return {
      title,
      text: th ? `ดาว ${p.bodies.length} ดวงรวมกันในราศีนี้ (${names}) ลักษณะ${kw} จึงชัดในตัวคุณกว่าคนทั่วไป` : `${p.bodies.length} planets gather in this sign (${names}), making you more ${kw} than most.`,
    };
  }
  let text = `${pt.meaning[lang]} (${names})`;
  if (p.apex && (p.type === "t-square" || p.type === "yod")) {
    text += th
      ? ` ดาวยอดคือ${bodyName(p.apex, lang)} เรื่อง${thw(BODY_TEXT[p.apex].noun.th)}จึงเป็นจุดที่ชีวิตผลักให้คุณเติบโต`
      : ` The apex is ${prose(p.apex, lang)}: life pushes you to grow through your ${BODY_TEXT[p.apex].noun.en}.`;
  }
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
        ? `ดาวที่เด่นที่สุดในผังคือ${bodyName(top.id, lang)} ${PLANET_DEPTH[top.id].loud.th}`
        : `The most prominent planet in your chart is ${prose(top.id, lang)}. ${PLANET_DEPTH[top.id].loud.en}`,
    );
  }
  return out.map(cap);
}

// ─────────────────────────── สรุปสั้น (หน้าเว็บ + รายงานฉบับเต็มใช้ชุดเดียวกัน) ───────────────────────────

export interface SummaryRow {
  label: string;
  /** แยกบรรทัดละข้อ อ่านไล่ตาง่ายกว่าประโยคยาวที่ต่อด้วย "และ" หลายครั้ง */
  lines: string[];
}

const afterColon = (s: string) => (s.includes(": ") ? s.slice(s.indexOf(": ") + 2) : s);

/**
 * เรื่องเด่น · จุดแข็ง · ต้องระวัง · ธาตุเด่น · รูปแบบพิเศษ (เจ้าของ 2026-10-28 "อยากให้มีสรุป")
 * `themes` = หัวข้อเรื่องเด่นที่จัดลำดับแล้ว (`chartHighlights`) — ส่งมาแล้วจะขึ้นแถวแรกเป็นภาษาคน 3 ข้อ แทนแถวรูปแบบพิเศษที่เป็นศัพท์โหรา
 * (รับเป็นพารามิเตอร์เพราะ natal-insight import ไฟล์นี้อยู่แล้ว ห้าม import กลับ)
 */
export function chartGlance(chart: NatalChart, lang: Lang, themes?: readonly { title: string }[]): SummaryRow[] {
  const th = lang === "th";
  const get = (id: BodyId) => chart.bodies.find((b) => b.id === id);
  const sun = get("sun")!;
  const moon = get("moon")!;
  const asc = get("asc");
  const uniq = (xs: string[]) => [...new Set(xs)].map(cap);
  const el: Element = topKey(chart.distribution.elementScore);
  const rows: SummaryRow[] = [
    { label: th ? "จุดแข็ง" : "Strengths", lines: uniq([SIGN_TEXT[sun.sign].gift[lang], SIGN_TEXT[moon.sign].gift[lang], ...(asc ? [SIGN_TEXT[asc.sign].gift[lang]] : [])]) },
    { label: th ? "ต้องระวัง" : "Watch out for", lines: uniq([SIGN_TEXT[sun.sign].watch[lang], SIGN_TEXT[moon.sign].watch[lang]]) },
    { label: th ? `ธาตุเด่น: ${ELEMENT_TEXT[el].name.th}` : `Strongest element: ${ELEMENT_TEXT[el].name.en}`, lines: [afterColon(ELEMENT_TEXT[el].strong[lang])] },
  ];
  // "ดาวรวมกลุ่มในราศีเดียว: ราศีมังกร" ×2 ➔ "ดาวรวมกลุ่มในราศีเดียว: ราศีมังกร ราศีกุมภ์"
  const groups = new Map<string, string[]>();
  for (const p of chart.patterns) {
    const t = describePattern(chart, p, lang).title;
    const i = t.indexOf(": ");
    const head = i < 0 ? t : t.slice(0, i);
    if (!groups.has(head)) groups.set(head, []);
    if (i >= 0) groups.get(head)!.push(t.slice(i + 2));
  }
  if (themes?.length) {
    rows.unshift({ label: th ? "เรื่องเด่น" : "Core themes", lines: themes.slice(0, 3).map((t) => t.title) });
  } else if (groups.size) {
    rows.push({
      label: th ? "รูปแบบพิเศษ" : "Chart pattern",
      lines: [...groups].map(([head, parts]) => (parts.length ? `${head}: ${parts.join(th ? " " : ", ")}` : head)),
    });
  }
  return rows;
}

export interface LifeArea {
  key: "love" | "work" | "money";
  title: string;
  /** ดาว/จุดที่ใช้อ่าน เช่น "ดาวศุกร์ราศีพิจิก" */
  from: string;
  text: string;
}

/** ความรัก · การงาน · การเงิน — จากดาวศุกร์ ดาวอังคาร ดาวพฤหัส และจุดเริ่มเรือน 2 / 7 / 10 (คำนวณ ไม่ใช้ AI) */
export function lifeAreas(chart: NatalChart, lang: Lang): LifeArea[] {
  const th = lang === "th";
  const get = (id: BodyId) => chart.bodies.find((b) => b.id === id)!;
  const venus = get("venus");
  const mars = get("mars");
  const jupiter = get("jupiter");
  const cuspSign = (n: number) => (chart.houses ? Math.floor(chart.houses[n - 1] / 30) % 12 : null);
  const in10 = chart.bodies.filter((b) => b.house === 10 && (PLANET_IDS as readonly string[]).includes(b.id));
  const names = in10.map((b) => bodyName(b.id, lang)).join(th ? " " : ", ");
  const dsc = cuspSign(7);
  const mc = cuspSign(10);
  const h2 = cuspSign(2);
  return [
    {
      key: "love",
      title: th ? "ความรัก" : "Love",
      from: th ? `ดาวศุกร์${signName(venus.sign, lang)}` : `Venus in ${signName(venus.sign, lang)}`,
      text: th
        ? `${PLANET_SIGN_TEXT.venus[venus.sign].core.th}${dsc !== null ? ` คนที่ดึงดูดคุณมักเป็นคน${SIGN_TEXT[dsc].keywords.th}` : ""}`
        : `${PLANET_SIGN_TEXT.venus[venus.sign].core.en}${dsc !== null ? ` You are drawn to people who are ${SIGN_TEXT[dsc].keywords.en}.` : ""}`,
    },
    {
      key: "work",
      title: th ? "การงาน" : "Work",
      from: mc !== null ? (th ? `กลางฟ้า${signName(mc, lang)}` : `Midheaven in ${signName(mc, lang)}`) : th ? `ดาวอังคาร${signName(mars.sign, lang)}` : `Mars in ${signName(mars.sign, lang)}`,
      text: th
        ? `${mc !== null ? `งานที่ใช่คือ${MC_CAREER[mc].th} ` : ""}คุณลงมือทำงาน${SIGN_TEXT[mars.sign].style.th}${in10.length ? ` มี${names}อยู่เรือนงาน งานจึงเป็นเรื่องใหญ่ของชีวิต` : ""}`
        : `${mc !== null ? `The right path for you is ${MC_CAREER[mc].en}. ` : ""}You get things done ${SIGN_TEXT[mars.sign].style.en}.${in10.length ? ` With ${names} in your career house, work is a big part of your life.` : ""}`,
    },
    {
      key: "money",
      title: th ? "การเงิน" : "Money",
      from: h2 !== null ? (th ? `เรือน 2 ${signName(h2, lang)}` : `2nd house in ${signName(h2, lang)}`) : th ? `ดาวพฤหัสบดี${signName(jupiter.sign, lang)}` : `Jupiter in ${signName(jupiter.sign, lang)}`,
      text: th
        ? `${h2 !== null ? `คุณจัดการเงิน${SIGN_TEXT[h2].style.th} ` : ""}${PLANET_SIGN_TEXT.jupiter[jupiter.sign].core.th}${jupiter.house ? ` ช่องทางที่โชคมักมาคือ${HOUSE_TEXT[jupiter.house - 1].arena.th}` : ""}`
        : `${h2 !== null ? `You handle money ${SIGN_TEXT[h2].style.en}. ` : ""}${PLANET_SIGN_TEXT.jupiter[jupiter.sign].core.en}${jupiter.house ? ` Luck tends to arrive through ${HOUSE_TEXT[jupiter.house - 1].arena.en}.` : ""}`,
    },
  ];
}

// ─────────────────────────── ตามเวลา ───────────────────────────

/**
 * ประโยคของดาวจร (หรือดาวก้าวหน้า) ที่ทำมุมกับจุดในผังเกิด
 * ดาวเดินช้าต่อท้ายด้วย "ใช้ช่วงนี้อย่างไร" (`TRANSIT_KEY`) — อยู่นานเป็นสัปดาห์ถึงปี ผู้ใช้ต้องการรู้ว่าควรทำอะไร ไม่ใช่แค่ว่าเกิดอะไร
 */
export function describeTimedAspect(t: BodyId, n: BodyId, type: AspectType, lang: Lang): string {
  const tt = TRANSIT_TEXT[t as keyof typeof TRANSIT_TEXT];
  const tone = ASPECT_DEFS.find((d) => d.type === type)?.tone ?? "neutral";
  const noun = BODY_TEXT[n].noun[lang];
  if (!tt) return "";
  const keySet = TRANSIT_KEY[t as keyof typeof TRANSIT_KEY];
  // มุมกุม (neutral) ของดาวโอกาส/ทิศทางนับเป็นไหลลื่น · ของดาวที่กดดันนับเป็นแรงผลัก
  const flow = tone === "harmonious" || (tone === "neutral" && (t === "jupiter" || t === "node"));
  const key = keySet ? ` ${(flow ? keySet.flow : keySet.push)[lang]}` : "";
  return lang === "th"
    ? `${tt.effect.th}เรื่อง${thw(noun)}ของคุณ ${TRANSIT_TONE[tone].th}${key}`
    : `${cap(tt.effect.en)} your ${noun} ${TRANSIT_TONE[tone].en}.${key}`;
}

/** ดาวจรอยู่เรือนไหนของผังเกิด */
export function describeTransitHouse(t: BodyId, house: number, lang: Lang): string {
  const tt = TRANSIT_TEXT[t as keyof typeof TRANSIT_TEXT];
  if (!tt) return "";
  const arena = HOUSE_TEXT[house - 1].arena[lang];
  return lang === "th" ? `${tt.effect.th}เรื่อง${arena}` : `${cap(tt.effect.en)} ${arena}.`;
}

/** จุดเด่นของผังวันเกิดปีนี้ / ผังจันทร์คืน */
export function returnHighlights(ret: NatalChart, kind: "solar" | "lunar", lang: Lang): string[] {
  const get = (id: BodyId) => ret.bodies.find((b) => b.id === id);
  const asc = get("asc");
  const sun = get("sun")!;
  const moon = get("moon")!;
  const out: string[] = [];
  const period = kind === "solar" ? (lang === "th" ? "ปีนี้" : "this year") : lang === "th" ? "เดือนนี้" : "this month";
  if (asc) {
    out.push(
      lang === "th"
        ? `ลัคนาของผัง${signName(asc.sign, lang)}: ${period}คุณเข้าหาชีวิตแบบคน${SIGN_TEXT[asc.sign].keywords.th}`
        : `${signName(asc.sign, lang)} rising: ${period} you meet life in a ${SIGN_TEXT[asc.sign].keywords.en} way.`,
    );
  }
  const focus = kind === "solar" ? sun : moon;
  if (focus.house) {
    out.push(
      lang === "th"
        ? `${kind === "solar" ? "ดวงอาทิตย์" : "ดวงจันทร์"}อยู่เรือน ${focus.house}: เรื่องเด่นของ${period}คือ${HOUSE_TEXT[focus.house - 1].arena.th}`
        : `${kind === "solar" ? "Sun" : "Moon"} in house ${focus.house}: the main theme ${period} is ${HOUSE_TEXT[focus.house - 1].arena.en}.`,
    );
  }
  if (kind === "solar" && moon.house) {
    out.push(
      lang === "th"
        ? `ดวงจันทร์อยู่${signName(moon.sign, lang)} เรือน ${moon.house}: ใจของคุณปีนี้ผูกกับเรื่อง${HOUSE_TEXT[moon.house - 1].arena.th}`
        : `Moon in ${signName(moon.sign, lang)}, house ${moon.house}: your heart this year is tied to ${HOUSE_TEXT[moon.house - 1].arena.en}.`,
    );
  }
  const angular = ret.bodies.filter((b) => (PLANET_IDS as readonly string[]).includes(b.id) && b.house && [1, 4, 7, 10].includes(b.house) && b.id !== focus.id);
  if (angular.length) {
    out.push(
      lang === "th"
        ? `ดาวที่อยู่เรือนมุม (เด่นเป็นพิเศษ${period}): ${angular.map((b) => `${bodyName(b.id, lang)} เรือน ${b.house}`).join(" · ")}`
        : `Planets on the angles (extra strong ${period}): ${angular.map((b) => `${bodyName(b.id, lang)} in house ${b.house}`).join(", ")}.`,
    );
  }
  return out;
}

// ─────────────────────────── ผังคู่ ───────────────────────────

/** ประโยคของมุมระหว่างดาวของ A กับดาวของ B */
export function describeSynAspect(a: BodyId, b: BodyId, type: AspectType, aName: string, bName: string, lang: Lang): string {
  const key = [a, b].sort().join("-");
  const tone = ASPECT_DEFS.find((d) => d.type === type)?.tone ?? "neutral";
  const pair = SYN_PAIR_TEXT[key];
  if (pair) return (tone === "tense" ? pair.tense : pair.harmonious)[lang];
  const A = BODY_TEXT[a].noun[lang];
  const B = BODY_TEXT[b].noun[lang];
  const meaning = SYN_ASPECT_MEANING[type] ?? ASPECT_TEXT[type].meaning;
  return lang === "th" ? `${thw(A)}ของ${aName} กับ${thw(B)}ของ${bName}: ${meaning.th}` : `${aName}'s ${A} and ${bName}'s ${B}: ${meaning.en}.`;
}

/** ดาวของ guest ตกเรือนของ host */
export function describeOverlay(body: BodyId, house: number, guest: string, host: string, lang: Lang): string {
  const arena = HOUSE_TEXT[house - 1].arena[lang];
  return lang === "th"
    ? `${guest}นำ${thw(BODY_TEXT[body].noun.th)}เข้ามาในเรื่อง${thw(arena)}ของ${host}`
    : `${guest} brings ${BODY_TEXT[body].noun.en} into ${host}'s ${arena}.`;
}
