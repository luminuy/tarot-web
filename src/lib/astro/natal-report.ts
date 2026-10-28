/**
 * 📄 รายงานผังดวงฉบับเต็ม (ข้อมูลล้วน) — ประกอบฝั่งเซิร์ฟเวอร์ใน `/api/natal/report` หลังหักสิทธิ์
 * ---------------------------------------------------------------------------
 * หน้าเว็บ (`NatalReport.tsx`) จัดหน้าพิมพ์ให้ผู้ใช้กด "บันทึกเป็น PDF" จากเบราว์เซอร์ (ภาษาไทยแสดงถูกต้องด้วยฟอนต์ของเว็บ)
 * ตัวประกอบรายงานไม่ถูกส่งไปเบราว์เซอร์ (import เฉพาะใน route) · ทุกข้อความมาจากตัวคำนวณ + เนื้อหาที่เขียนไว้ ไม่ใช้ AI
 * ยกเว้นช่อง `aiOverview` ที่ route เติมทีหลัง (Claude Sonnet เรียบเรียงจากเรื่องเด่นที่โค้ดคำนวณ · เจ้าของสั่ง 2026-10-28)
 * มีเฉพาะส่วนที่ไม่มีในหน้าเว็บแบบฟรี: ภาพรวมผังจาก Sonnet · พยากรณ์ดาวเดินช้า 12 เดือนข้างหน้า และผังวันเกิดปีนี้ รวมในเล่มเดียว
 */
import { cardById } from "@/data/cards";
import { ASPECT_TEXT, BODY_TEXT, DIGNITY_TEXT, ELEMENT_TEXT, HOUSE_SYSTEM_TEXT, HOUSE_TEXT, MODALITY_TEXT, type Lang } from "@/data/natal/content";
import { LOT_TEXT, STAR_TEXT } from "@/data/natal/stars-content";
import { MAHA_TAKSA_TONE, SEVEN_COLUMNS, TAKSA_TEXT, THAI_DAY_NAME, THAI_PLANET_NAME } from "@/data/natal/thai-content";
import { buildChart, type ChartSpec } from "./chart-spec";
import { birthTimeSensitivity, chartHighlights, describeTimeSensitivity } from "./natal-insight";
import type { NatalOverview } from "./natal-overview";
import { starContacts } from "./fixed-stars";
import { hermeticLots } from "./lots";
import { ASPECT_DEFS, PLANET_IDS, formatDegree, type BodyId, type NatalChart } from "./natal";
import { aspectTitle, bodyName, cardsFor, chartGlance, chartSummary, describeAspect, describeBody, describePattern, describeTimedAspect, describeTransitHouse, lifeAreas, placement, returnHighlights, signName, type LifeArea, type SummaryRow } from "./natal-text";
import { solarReturn, transitCalendar } from "./techniques";
import { mahaTaksa, sevenNumbers, taksa, TAKSA_POSITIONS, thaiBirthDay } from "./thai-astro";
import { LUNAR_MONTH_TH, NAKSAT_EN, NAKSAT_TH } from "./thai-lunar";

export interface NatalReport {
  lang: Lang;
  title: string;
  birthLine: string;
  systemLine: string;
  bigThree: { label: string; value: string; cards: string[]; role: string; sign: string; deg: string }[];
  /** ภาพรวมผังที่ Claude Sonnet เรียบเรียง — route เติมหลังประกอบรายงาน · AI ล้ม = null (รายงานส่วนอื่นยังครบ) */
  aiOverview: NatalOverview | null;
  /** เรื่องเด่นของผังเรียงตามน้ำหนัก (โค้ดคำนวณ) · หัวข้อภาษาคน + ที่มาในผัง + ความหมาย + ใช้ให้ดี */
  highlights: { title: string; basis: string; text: string; advice: string }[];
  /** เวลาเกิดคลาดกี่นาทีแล้วอะไรเปลี่ยน (ไม่รู้เวลาเกิด = ว่าง) */
  timeSensitivity: string[];
  summary: string[];
  /** สรุปสั้นแบบป้าย + บรรทัด (ชุดเดียวกับหน้าเว็บ) */
  glance: SummaryRow[];
  /** ความรัก · การงาน · การเงิน */
  life: LifeArea[];
  positions: { body: string; value: string; house: string; notes: string; short: string; sign: string; deg: string }[];
  houses: string[] | null;
  houseCells: { n: number; sign: string; deg: string; title: string; bodies: string[] }[] | null;
  bodies: { title: string; paras: string[]; name: string; where: string; theme: string }[];
  aspects: { title: string; text: string; a: string; b: string; type: string; tone: "harmonious" | "tense" | "neutral" }[];
  patterns: { title: string; text: string }[];
  balance: string[];
  stars: string[];
  lots: { name: string; value: string; meaning: string }[] | null;
  thai: { day: string; taksa: { pos: string; planet: string; meaning: string }[]; maha: string[]; seven: number[][]; sevenNotes: string[] };
  yearAhead: { date: string; text: string }[];
  solarReturn: string[];
  generatedAt: number;
}

const MAIN: readonly BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "node", "lilith", "asc", "mc"];

function cardName(id: string | undefined, lang: Lang): string | null {
  const c = id ? cardById(id) : undefined;
  return c ? (lang === "th" ? `${c.nameTh} (${c.nameEn})` : c.nameEn) : null;
}

export function buildNatalReport(spec: ChartSpec, lang: Lang, nowMs: number): NatalReport {
  const th = lang === "th";
  const chart: NatalChart = buildChart({ ...spec, asteroids: false });
  const get = (id: BodyId) => chart.bodies.find((b) => b.id === id);
  const fmt = new Intl.DateTimeFormat(th ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: spec.place.zone ?? "UTC" });
  const pad = (n: number) => String(n).padStart(2, "0");
  const place = th ? spec.place.label : spec.place.labelEn ?? spec.place.label;
  const themes = chartHighlights(chart, lang, 8);

  const shortSign = (sign: number) => signName(sign, lang).replace(th ? "ราศี" : "", "");
  const bigThree = (["sun", "moon", "asc"] as const).flatMap((id) => {
    const b = get(id);
    if (!b) return [];
    const c = cardsFor(b);
    const role = { sun: th ? "ตัวตน" : "Core self", moon: th ? "ใจ" : "Heart", asc: th ? "ภาพที่คนเห็น" : "First impression" }[id];
    return [
      {
        label: bodyName(id, lang),
        value: placement(b, lang),
        cards: [cardName(c.sign, lang), cardName(c.decan, lang)].filter((x): x is string => !!x),
        role,
        sign: shortSign(b.sign),
        deg: formatDegree(b.degInSign),
      },
    ];
  });

  const positions = chart.bodies
    .filter((b) => MAIN.includes(b.id))
    .map((b) => ({
      body: bodyName(b.id, lang),
      value: placement(b, lang),
      house: b.house ? String(b.house) : "-",
      notes: [b.retrograde && b.id !== "node" ? (th ? "ถอยหลัง" : "retrograde") : "", ...b.dignities.map((d) => DIGNITY_TEXT[d].name[lang])].filter(Boolean).join(" · "),
      short: BODY_TEXT[b.id].short[lang],
      sign: shortSign(b.sign),
      deg: formatDegree(b.degInSign),
    }));

  const es = chart.distribution.elementScore;
  const ms = chart.distribution.modalityScore;
  const topEl = (Object.keys(es) as (keyof typeof es)[]).sort((a, b) => es[b] - es[a]);
  const topMo = (Object.keys(ms) as (keyof typeof ms)[]).sort((a, b) => ms[b] - ms[a]);

  // โหราไทย
  const tb = thaiBirthDay(spec.yearCe, spec.month, spec.day, spec.hour, spec.timeKnown);
  const board = taksa(tb.planet);
  const seven = sevenNumbers(tb);
  const age = (nowMs - Date.UTC(spec.yearCe, spec.month - 1, spec.day)) / (365.2425 * 86400000);
  const periods = mahaTaksa(tb.planet);
  const cur = periods.find((p) => age >= p.from && age < p.to);
  const lunar = seven.lunar;

  // พยากรณ์ 12 เดือน (ดาวเดินช้า)
  const events = transitCalendar(chart, nowMs, 365).slice(0, 60);
  const yearAhead = events.map((e) => {
    const date = fmt.format(e.utcMs);
    if (e.kind === "sign") return { date, text: th ? `${bodyName(e.t, lang)}ย้ายเข้า${signName(e.sign, lang)}` : `${bodyName(e.t, lang)} enters ${signName(e.sign, lang)}` };
    if (e.kind === "house") return { date, text: `${th ? `${bodyName(e.t, lang)}เข้าเรือน ${e.house} ของคุณ: ` : `${bodyName(e.t, lang)} enters your house ${e.house}: `}${describeTransitHouse(e.t, e.house, lang)}` };
    return {
      date,
      text: `${bodyName(e.t, lang)}${th ? "จร" : " (transit)"} ${ASPECT_TEXT[e.type].name[lang]} ${bodyName(e.n, lang)}${th ? "เกิด" : " (natal)"}${e.retrograde ? (th ? " ขณะถอยหลัง" : ", retrograde") : ""}: ${describeTimedAspect(e.t, e.n, e.type, lang)}`,
    };
  });

  // ผังวันเกิดปีนี้ (รอบล่าสุดที่ผ่านมา) ณ สถานที่เกิด
  let srLines: string[] = [];
  try {
    const nth = Math.max(0, Math.floor(age));
    const sr = solarReturn(chart, nth, { lat: spec.place.lat, lon: spec.place.lon });
    srLines = [th ? `ผังวันเกิดครั้งที่ ${nth} (${fmt.format(sr.input.utcMs)})` : `Solar return no. ${nth} (${fmt.format(sr.input.utcMs)})`, ...returnHighlights(sr, "solar", lang)];
  } catch {
    srLines = [];
  }

  const lots = hermeticLots(chart);
  return {
    lang,
    title: spec.name ? (th ? `รายงานผังดวงกำเนิดของ ${spec.name}` : `${spec.name}'s natal chart report`) : th ? "รายงานผังดวงกำเนิด" : "Natal chart report",
    birthLine: `${spec.day}/${spec.month}/${th ? spec.yearCe + 543 : spec.yearCe} · ${spec.timeKnown ? `${pad(spec.hour)}:${pad(spec.minute)}` : th ? "ไม่ทราบเวลาเกิด" : "time unknown"} · ${place}`,
    systemLine: [
      chart.input.zodiac === "lahiri" ? (th ? `ราศีนิรายนะ Lahiri (อายนางศ์ ${formatDegree(chart.ayanamsa)})` : `Sidereal, Lahiri (ayanamsa ${formatDegree(chart.ayanamsa)})`) : th ? "ราศีสายนะ (สากล)" : "Tropical zodiac",
      chart.houseSystemUsed ? `${th ? "เรือน" : "Houses"}: ${HOUSE_SYSTEM_TEXT[chart.houseSystemUsed].name[lang]}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    bigThree,
    aiOverview: null,
    highlights: themes.map((h) => ({ title: h.title, basis: h.basis, text: h.text, advice: h.advice })),
    timeSensitivity: (() => {
      const ts = birthTimeSensitivity(chart);
      return ts ? describeTimeSensitivity(ts, lang) : [];
    })(),
    summary: chartSummary(chart, lang),
    glance: chartGlance(chart, lang, themes),
    life: lifeAreas(chart, lang),
    houseCells: chart.houses
      ? chart.houses.map((c, i) => ({
          n: i + 1,
          sign: shortSign(Math.floor(c / 30) % 12),
          deg: formatDegree(c % 30),
          title: HOUSE_TEXT[i].title[lang],
          bodies: chart.bodies.filter((b) => b.house === i + 1 && (PLANET_IDS as readonly string[]).includes(b.id)).map((b) => bodyName(b.id, lang)),
        }))
      : null,
    positions,
    houses: chart.houses ? chart.houses.map((c, i) => `${i + 1}: ${signName(Math.floor(c / 30) % 12, lang)} ${formatDegree(c % 30)}`) : null,
    bodies: chart.bodies
      .filter((b) => MAIN.includes(b.id))
      .map((b) => ({
        title: `${bodyName(b.id, lang)} ${placement(b, lang)}${b.house ? (th ? ` เรือน ${b.house}` : `, house ${b.house}`) : ""}`,
        paras: describeBody(chart, b, lang),
        name: bodyName(b.id, lang),
        where: `${placement(b, lang)}${b.house ? (th ? ` เรือน ${b.house}` : `, house ${b.house}`) : ""}`,
        theme: BODY_TEXT[b.id].theme[lang],
      })),
    aspects: [...chart.aspects]
      .sort((a, b) => a.orb - b.orb)
      .slice(0, 20)
      .map((a) => ({
        title: aspectTitle(a, lang),
        text: describeAspect(a, lang),
        a: bodyName(a.a, lang),
        b: bodyName(a.b, lang),
        type: ASPECT_TEXT[a.type].name[lang].replace(/\s*\(.*\)$/, ""),
        tone: ASPECT_DEFS.find((d) => d.type === a.type)?.tone ?? "neutral",
      })),
    patterns: chart.patterns.map((p) => describePattern(chart, p, lang)),
    balance: [ELEMENT_TEXT[topEl[0]].strong[lang], ELEMENT_TEXT[topEl[3]].weak[lang], MODALITY_TEXT[topMo[0]].strong[lang]],
    stars: starContacts(chart).map((c) => `${th ? STAR_TEXT[c.star.name]?.th ?? c.star.name : c.star.name} ${th ? "ทับ" : "on"} ${bodyName(c.body, lang)} (orb ${formatDegree(c.orb)}): ${STAR_TEXT[c.star.name]?.meaning[lang] ?? ""}`),
    lots: lots ? lots.map((l) => ({ name: LOT_TEXT[l.id].name[lang], value: `${signName(l.sign, lang)} ${formatDegree(l.degInSign)}${l.house ? (th ? ` เรือน ${l.house}` : `, house ${l.house}`) : ""}`, meaning: LOT_TEXT[l.id].meaning[lang] })) : null,
    thai: {
      day: th
        ? `${THAI_DAY_NAME[tb.planet].th} · ${lunar.waxing ? "ขึ้น" : "แรม"} ${lunar.phaseDay} ค่ำ เดือน${LUNAR_MONTH_TH[lunar.month]} ปี${NAKSAT_TH[seven.naksat - 1]}`
        : `${THAI_DAY_NAME[tb.planet].en} · lunar month ${lunar.month === 88 ? "8 (second)" : lunar.month}, ${lunar.waxing ? "waxing" : "waning"} day ${lunar.phaseDay}, year of the ${NAKSAT_EN[seven.naksat - 1]}`,
      taksa: TAKSA_POSITIONS.map((pos) => ({ pos: TAKSA_TEXT[pos].name[lang], planet: THAI_PLANET_NAME[board[pos]][lang], meaning: TAKSA_TEXT[pos].meaning[lang] })),
      maha: [
        ...(cur ? [th ? `ตอนนี้ดาว${THAI_PLANET_NAME[cur.planet].th}เสวยอายุ (อายุ ${Math.round(cur.from)} ถึง ${Math.round(cur.to)} ปี): ${MAHA_TAKSA_TONE[cur.planet].th}` : `${THAI_PLANET_NAME[cur.planet].en} rules now (ages ${Math.round(cur.from)} to ${Math.round(cur.to)}): ${MAHA_TAKSA_TONE[cur.planet].en}`] : []),
        periods.map((p) => `${THAI_PLANET_NAME[p.planet][lang]} ${Math.round(p.from)}–${Math.round(p.to)}`).join(" · "),
      ],
      seven: seven.rows,
      sevenNotes: SEVEN_COLUMNS[0].map((c, i) => `${i + 1}. ${c.name} / ${SEVEN_COLUMNS[1][i].name} / ${SEVEN_COLUMNS[2][i].name}: ${th ? "รวม" : "sum"} ${seven.rows[3][i]}`),
    },
    yearAhead,
    solarReturn: srLines,
    generatedAt: nowMs,
  };
}
