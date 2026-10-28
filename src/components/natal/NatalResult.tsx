"use client";

import React, { Suspense, useMemo, useRef, useState } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ZODIAC_SIGNS } from "@/data/zodiac";
import {
  BODY_TEXT,
  DIGNITY_TEXT,
  DOMINANT_REASON_TEXT,
  ELEMENT_TEXT,
  HEMISPHERE_TEXT,
  HOUSE_SYSTEM_TEXT,
  HOUSE_TEXT,
  MODALITY_TEXT,
  MOON_PHASE_TEXT,
  POLARITY_TEXT,
  SIGN_TEXT,
  ASPECT_TEXT,
  WARNING_TEXT,
  type Lang,
} from "@/data/natal/content";
import {
  ASPECT_DEFS,
  PLANET_IDS,
  SIGN_ELEMENT,
  formatDegree,
  type AspectType,
  type BodyId,
  type BodyPosition,
  type Element,
  type Modality,
  type NatalChart,
} from "@/lib/astro/natal";
import { aspectTitle, bodyName, cardsFor, chartGlance, describeAspect, describeBody, describePattern, emptyHouseNote, keyAspects as keyAspectsOf, lifeAreas, signName } from "@/lib/astro/natal-text";
import { birthTimeSensitivity, chartHighlights, describeTimeSensitivity } from "@/lib/astro/natal-insight";
import { zodiacSignPath } from "@/lib/tarot/zodiac";
import { smoothScrollBehavior } from "@/lib/use-motion-safe";
import { NatalWheel } from "./NatalWheel";
import { FlipCard } from "./NatalFlipCard";
import { MoreLabel, SectionHead, SummaryBox } from "./NatalUi";
import { fixedStarPositions, ROYAL_STARS, starContacts } from "@/lib/astro/fixed-stars";
import { hermeticLots } from "@/lib/astro/lots";
import { LOT_TEXT, STAR_TEXT } from "@/data/natal/stars-content";
import type { NatalCardItem, NatalMeta } from "./NatalChartApp";
import { NATAL_CARD_KEYWORDS } from "@/data/natal/card-keywords";
import { ELEMENT_DEPTH, PLANET_DEPTH, SECT_TEXT } from "@/data/natal/depth";
import type { ChartSpec } from "@/lib/astro/chart-spec";
import type { TimeMode } from "./NatalTimeTools";

/* ⏳ แท็บตามเวลา (ดาวจร · ก้าวหน้า · รีเทิร์น) โหลดเมื่อกดแท็บเท่านั้น */
const NatalTimeTools = React.lazy(() => import("./NatalTimeTools"));
/* 💞 แท็บผังคู่ โหลดเมื่อกดแท็บเท่านั้น */
const NatalSynastry = React.lazy(() => import("./NatalSynastry"));
/** ถามแม่หมอ AI — ส่งข้อมูลเกิดออกจากเครื่องเมื่อผู้ใช้กดยินยอมในแท็บนั้นเท่านั้น */
const NatalAsk = React.lazy(() => import("./NatalAsk"));
/** ภาพรวมผังจาก AI (Haiku) — ส่งข้อมูลเกิดเมื่อผู้ใช้ติ๊กยินยอมแล้วกดเองเท่านั้น */
const NatalOverview = React.lazy(() => import("./NatalOverview"));
/** ภาพแชร์ Big Three — วาดในเครื่อง โหลดเมื่อผู้ใช้กดสร้างภาพเท่านั้น */
const NatalShare = React.lazy(() => import("./NatalShare"));
/** โหราไทย (ทักษา · มหาทักษา · เลข 7 ตัว) — ตัวคำนวณปฏิทินจันทรคติโหลดเมื่อเปิดแท็บเท่านั้น */
const NatalThai = React.lazy(() => import("./NatalThai"));

/**
 * 🪐 ผลผังดวงทั้งหมด — โหลดแบบ lazy พร้อมตัวคำนวณ (ไม่อยู่ในบันเดิลแรกของหน้า)
 * ลำดับ (เจ้าของ 2026-10-28 "ตัวหนังสือเยอะเกินไป อยากให้มีสรุป"): ภาพรวม (สามราศีหลัก + สรุปสั้น) ➔
 *       ไพ่ประจำตัว (คว่ำ แตะพลิกเอง) ➔ วงผัง ➔ ดาวแต่ละดวง (แถวสั้น แตะอ่านต่อ) ➔ เรือน 12 กล่อง ➔
 *       มุมแรงสุด 5 คู่ ➔ สมดุลพลัง ➔ ข้อมูลละเอียด (ตาราง ดาวฤกษ์ Lots การคำนวณ พับไว้)
 */

const TABLE_ORDER: readonly BodyId[] = [
  ...PLANET_IDS,
  "chiron",
  "node",
  "southNode",
  "lilith",
  "ceres",
  "pallas",
  "juno",
  "vesta",
  "fortune",
  "vertex",
  "asc",
  "mc",
];
const GRID_ORDER: readonly BodyId[] = [...PLANET_IDS, "chiron", "node", "lilith", "ceres", "pallas", "juno", "vesta", "asc", "mc"];

const ASPECT_SHORT: Record<AspectType, { th: string; en: string }> = {
  conjunction: { th: "กุม", en: "Cnj" },
  opposition: { th: "เล็ง", en: "Opp" },
  trine: { th: "ตรี", en: "Tri" },
  square: { th: "จตุ", en: "Sqr" },
  sextile: { th: "โยค", en: "Sxt" },
  quincunx: { th: "150", en: "150" },
  semisextile: { th: "30", en: "30" },
  semisquare: { th: "45", en: "45" },
  sesquiquadrate: { th: "135", en: "135" },
  quintile: { th: "72", en: "72" },
  biquintile: { th: "144", en: "144" },
};

/** ความหมายสั้นของป้ายสถานะ ติดไว้ที่แถวดาวเลย ไม่ต้องเปิดอ่านก่อน */
const TAG_SHORT: Record<"domicile" | "exaltation" | "detriment" | "fall" | "retro", { th: string; en: string }> = {
  domicile: { th: "อยู่บ้านตัวเอง พลังเต็ม", en: "at home, works fully" },
  exaltation: { th: "ได้รับยกย่อง โดดเด่น", en: "honoured, stands out" },
  detriment: { th: "อยู่ผิดที่ ต้องปรับวิธีใช้", en: "out of place, needs adapting" },
  fall: { th: "อ่อนกำลัง ฝึกแล้วโตมาก", en: "weak here, grows with practice" },
  retro: { th: "หันเข้าด้านใน คิดก่อนแสดงออก", en: "turned inward, reflect first" },
};

export default function NatalResult({
  chart,
  lang,
  meta,
  cards,
  spec,
  actions,
}: {
  chart: NatalChart;
  lang: Lang;
  meta: NatalMeta;
  cards: readonly NatalCardItem[];
  /** ข้อมูลเกิดที่ใช้สร้างผังนี้ — ส่งให้แท็บถามแม่หมอ (เซิร์ฟเวอร์คำนวณผังเองจากข้อมูลนี้) */
  spec: ChartSpec;
  /** ปุ่มบันทึก/แชร์/รายงาน/พิมพ์ จาก NatalChartApp — วางใต้สรุป ไม่ต้องเลื่อนลงไปหาท้ายหน้า */
  actions?: React.ReactNode;
}) {
  const isTh = lang === "th";
  const [focus, setFocus] = useState<BodyId | null>(null);
  const [showMinor, setShowMinor] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<"natal" | TimeMode | "synastry" | "thai" | "ask">("natal");
  const [shareOpen, setShareOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const stars = useMemo(() => {
    const all = fixedStarPositions(chart.input.utcMs, chart.input.zodiac);
    return { all, contacts: starContacts(chart, all) };
  }, [chart]);
  const lots = useMemo(() => hermeticLots(chart), [chart]);
  /** คำอธิบายราศีบางย่อหน้าเอ่ยชื่อไพ่ประจำราศี — ไพ่ของอาทิตย์/จันทร์/ลัคนายังคว่ำอยู่ห้ามเฉลยก่อน (กฎเหล็กข้อ 4) */
  const namesHiddenCard = (text: string, ids: readonly string[]) =>
    ids.some((id) => {
      const c = cardById.get(id);
      // คำอธิบายเรียกไพ่ด้วยชื่ออังกฤษ ("ไพ่ The Devil") · ไม่เทียบชื่อไทยเพราะบางใบเป็นคำทั่วไป (เช่น "พลัง")
      return !!c && text.includes(c.nameEn);
    });
  const cardName = (id: string | undefined) => {
    const c = id ? cardById.get(id) : undefined;
    return c ? (isTh ? `${c.nameTh} (${c.nameEn})` : c.nameEn) : "";
  };

  const get = (id: BodyId) => chart.bodies.find((b) => b.id === id);
  const sun = get("sun")!;
  const moon = get("moon")!;
  const asc = get("asc");
  const majorTypes = new Set(ASPECT_DEFS.filter((d) => d.major).map((d) => d.type));
  const toneOf = new Map(ASPECT_DEFS.map((d) => [d.type, d.tone]));
  const visibleAspects = chart.aspects.filter((a) => showMinor || majorTypes.has(a.type));
  // เรื่องเด่นเรียงตามน้ำหนัก + เวลาเกิดคลาดแล้วอะไรเปลี่ยน (โค้ดล้วน · คำนวณครั้งเดียวต่อผัง · natal-insight.ts)
  const themes = useMemo(() => chartHighlights(chart, lang), [chart, lang]);
  const timeLines = useMemo(() => {
    const ts = birthTimeSensitivity(chart);
    return ts ? describeTimeSensitivity(ts, lang) : [];
  }, [chart, lang]);
  const gridIds = GRID_ORDER.filter((id) => get(id));
  /* เลขหัวส่วนนับตามลำดับที่แสดงจริง (เรือนไม่แสดงเมื่อไม่รู้เวลาเกิด) */
  let secN = 0;
  const nextN = () => ++secN;
  const shortSign = (sign: number) => signName(sign, lang).replace(isTh ? "ราศี" : "", "");
  /** ข้อความในข้อมูลขึ้นต้นด้วยหัวข้อ "ธาตุดินเด่น: ..." — ตัดหัวออกเมื่อมีป้ายบอกอยู่แล้ว */
  const afterColon = (s: string) => (s.includes(": ") ? s.slice(s.indexOf(": ") + 2) : s);

  const bigThree = [
    { key: "sun", body: sun, label: isTh ? "ดวงอาทิตย์: ตัวตน" : "Sun: your core self" },
    { key: "moon", body: moon, label: isTh ? "ดวงจันทร์: ใจ" : "Moon: your heart" },
    ...(asc ? [{ key: "asc", body: asc, label: isTh ? "ลัคนา: ภาพที่คนเห็น" : "Rising: how you come across" }] : []),
  ];
  const bigRevealed = (key: string) => !!revealed[`${key}:sign`] && !!revealed[`${key}:decan`];

  const elementTotal = Object.values(chart.distribution.elementScore).reduce((a, b) => a + b, 0) || 1;
  const modalityTotal = Object.values(chart.distribution.modalityScore).reduce((a, b) => a + b, 0) || 1;
  const pct = (n: number, total: number) => Math.round((n / total) * 100);

  const topModality = (Object.keys(chart.distribution.modalityScore) as Modality[]).reduce((a, b) =>
    chart.distribution.modalityScore[b] > chart.distribution.modalityScore[a] ? b : a,
  );
  const missingElements = (Object.keys(chart.distribution.elements) as Element[]).filter((e) => chart.distribution.elements[e].length === 0);
  const lowElement = (["fire", "earth", "air", "water"] as Element[])
    .filter((e) => pct(chart.distribution.elementScore[e], elementTotal) <= 20)
    .sort((a, b) => chart.distribution.elementScore[a] - chart.distribution.elementScore[b])[0];
  const topPlanet = chart.dominantPlanets[0];
  const keyAspects = keyAspectsOf(chart, 5);
  const majorCount = chart.aspects.filter((a) => majorTypes.has(a.type)).length;
  const planetRows = TABLE_ORDER.filter((id) => id !== "southNode" && id !== "fortune" && id !== "vertex")
    .map((id) => get(id))
    .filter((b): b is BodyPosition => !!b);

  /* สรุปสั้น: ป้ายซ้าย ข้อความขวา — คำนวณจากผังทั้งหมด ไม่ใช้ AI */
  /* สรุปสั้น + ความรัก/งาน/เงิน — ฟังก์ชันเดียวกับรายงานฉบับเต็ม (natal-text.ts) */
  const glance = chartGlance(chart, lang, themes).map((r) => ({
    label: r.label,
    text: (
      <>
        {r.lines.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </>
    ),
  }));
  const life = lifeAreas(chart, lang);

  const nav = [
    ["natal-cards", isTh ? "ไพ่ประจำตัว" : "Tarot"],
    ["natal-wheel", isTh ? "วงผัง" : "Wheel"],
    ["natal-themes", isTh ? "เรื่องเด่น" : "Themes"],
    ["natal-planets", isTh ? "ดาวแต่ละดวง" : "Planets"],
    ...(chart.houses ? [["natal-houses", isTh ? "เรือน" : "Houses"]] : []),
    ["natal-aspects", isTh ? "มุมสำคัญ" : "Aspects"],
    ["natal-balance", isTh ? "สมดุลพลัง" : "Balance"],
    ["natal-deep", isTh ? "ลงลึก" : "In depth"],
  ];

  /* แตะดาวบนวงผัง ➔ แผงใต้วงบอกความหมายทันที (ย่อหน้าที่เอ่ยชื่อไพ่ที่ยังคว่ำอยู่ถูกกรองออก) */
  const focusBody = focus ? get(focus) : undefined;
  const focusText = focusBody
    ? (() => {
        const fc = cardsFor(focusBody);
        const personal = focusBody.id === "sun" || focusBody.id === "moon" || focusBody.id === "asc";
        const ok = !personal || bigRevealed(focusBody.id);
        return describeBody(chart, focusBody, lang).filter((p) => ok || !namesHiddenCard(p, [fc.sign, fc.decan]));
      })()
    : [];

  const tone = (t: string | undefined) => (t === "harmonious" ? "harmonious" : t === "tense" ? "tense" : "neutral");

  return (
    <div className="v2-nr space-y-6 sm:space-y-8">
      {/* ── ภาพรวม: ข้อมูลเกิด · สามราศีหลัก · สรุปสั้น ── */}
      <section aria-labelledby="natal-summary" className="v2-nr-hero">
        <header className="v2-nr-hero-head">
          <p className="v2-nr-kicker">{isTh ? "ผังดวงกำเนิด" : "Natal chart"}</p>
          <h3 id="natal-summary" className="v2-nr-name">
            {meta.name ? meta.name : isTh ? "ผังของคุณ" : "Your chart"}
          </h3>
          <p className="v2-nr-birth">
            {meta.dateText} · {meta.timeText} · {meta.placeText}
          </p>
        </header>

        <ul className="v2-nr-big3">
          {[
            { id: "sun" as const, role: isTh ? "ตัวตน" : "Core self" },
            { id: "moon" as const, role: isTh ? "ใจ" : "Heart" },
            { id: "asc" as const, role: isTh ? "ภาพที่คนเห็น" : "First impression" },
          ].map((x) => {
            const b = get(x.id);
            return (
              <li key={x.id}>
                <span className="v2-nr-big3-role">
                  {x.role} <span>{BODY_TEXT[x.id].name[lang]}</span>
                </span>
                <span className="v2-nr-big3-sign">{b ? shortSign(b.sign) : isTh ? "ไม่ทราบ" : "Unknown"}</span>
                <span className="v2-nr-big3-kw">{b ? SIGN_TEXT[b.sign].keywords[lang] : isTh ? "ต้องรู้เวลาเกิด" : "Needs birth time"}</span>
              </li>
            );
          })}
        </ul>

        <SummaryBox
          title={isTh ? "สรุปผังของคุณ" : "Your chart at a glance"}
          rows={glance}
        />

        <ul className="v2-nr-life">
          {life.map((x) => (
            <li key={x.key}>
              <span className="v2-nr-life-t">{x.title}</span>
              <span className="v2-nr-life-from">{x.from}</span>
              <span className="v2-nr-life-d">{x.text}</span>
            </li>
          ))}
        </ul>

        <div className="v2-nr-cta v2-nt-noprint">
          <button
            type="button"
            className="rounded-full btn-gold-glass px-5 min-h-[44px] text-sm font-bold"
            onClick={() => {
              setView("ask");
              requestAnimationFrame(() => {
                try {
                  tabsRef.current?.scrollIntoView({ behavior: smoothScrollBehavior(), block: "start" });
                } catch {
                  tabsRef.current?.scrollIntoView();
                }
              });
            }}
          >
            {isTh ? "ถามแม่หมอเรื่องผังนี้" : "Ask the reader about this chart"}
          </button>
          <span className="v2-nr-note">
            {isTh ? "ถามเรื่องความรัก งาน หรือจังหวะชีวิต จากผังของคุณเอง" : "Ask about love, work or timing, based on your own chart."}
          </span>
        </div>

        {actions}

        {(chart.warnings.length > 0 || (!chart.input.timeKnown && chart.moonRange)) && (
          <ul className="v2-nr-warn">
            {chart.warnings.map((w) => (
              <li key={w.code}>
                {WARNING_TEXT[w.code][lang]}
                {w.bodies?.length ? ` (${w.bodies.map((id) => bodyName(id, lang)).join(isTh ? " " : ", ")})` : ""}
              </li>
            ))}
            {!chart.input.timeKnown && chart.moonRange && (
              <li>
                {isTh
                  ? `ไม่ทราบเวลาเกิด: คำนวณที่เที่ยงวัน วันนั้นดวงจันทร์เดินจาก${signName(Math.floor(chart.moonRange.from / 30), lang)} ${formatDegree(chart.moonRange.from % 30)} ถึง${signName(Math.floor(chart.moonRange.to / 30), lang)} ${formatDegree(chart.moonRange.to % 30)} ไม่มีลัคนาและเรือนชะตา`
                  : `Birth time unknown: calculated for noon. That day the Moon moved from ${signName(Math.floor(chart.moonRange.from / 30), lang)} ${formatDegree(chart.moonRange.from % 30)} to ${signName(Math.floor(chart.moonRange.to / 30), lang)} ${formatDegree(chart.moonRange.to % 30)}. No Ascendant or houses.`}
              </li>
            )}
          </ul>
        )}

        {timeLines.length > 0 && (
          <div className="v2-nr-box">
            <p className="v2-nr-box-t">{isTh ? "เวลาเกิดต้องแม่นแค่ไหน" : "How exact does your birth time need to be?"}</p>
            {timeLines.map((t, i) => (
              <p key={i} className="v2-nr-item-d">
                {t}
              </p>
            ))}
            <p className="v2-nr-note">
              {isTh ? "เวลาที่จดในสูติบัตรมักปัดเป็น 5 ถึง 15 นาที ถ้ามีข้อใดข้างบนอยู่ในช่วงนั้น ให้อ่านส่วนที่เกี่ยวข้องอย่างเผื่อใจ" : "Recorded birth times are often rounded to 5 to 15 minutes. If anything above falls in that range, read the related parts with some caution."}
            </p>
          </div>
        )}

        <p className="v2-nr-settings">
          {chart.input.zodiac === "lahiri"
            ? isTh
              ? `ราศีนิรายนะ (Lahiri · อายนางศ์ ${formatDegree(chart.ayanamsa)})`
              : `Sidereal zodiac (Lahiri, ayanamsa ${formatDegree(chart.ayanamsa)})`
            : isTh
              ? "ราศีสายนะ (สากล)"
              : "Tropical zodiac"}
          {chart.houseSystemUsed ? ` · ${isTh ? "เรือน" : "Houses"} ${HOUSE_SYSTEM_TEXT[chart.houseSystemUsed].name[lang]}` : ""}
          {` · ${meta.offsetText}`}
        </p>
        {chart.input.zodiac === "lahiri" && (
          <p className="v2-nr-settings">
            {isTh
              ? "นิรายนะยึดกลุ่มดาวจริงบนฟ้า ตำแหน่งดาวจึงถอยจากแบบสากลราว 24 องศา ราศีที่ได้มักใกล้เคียงหมอดูไทย แต่อาจต่างได้ราว 1 องศาตามตำราที่ใช้ คำอธิบายและไพ่ประจำตำแหน่งในหน้านี้อิงระบบตะวันตก ใช้ราศีนิรายนะแทนที่"
              : "The sidereal zodiac follows the actual constellations, so positions sit about 24 degrees behind the tropical ones. Thai astrologers may differ by about a degree depending on their method. Interpretations and tarot cards here are Western and are applied to the sidereal signs."}
          </p>
        )}
      </section>

      {/* ── แท็บ: ผังเกิด / ตามเวลา ── */}
      <div ref={tabsRef} className="v2-nr-tabs v2-nt-noprint scroll-mt-24" role="tablist" aria-label={isTh ? "มุมมองของผัง" : "Chart views"}>
        {(
          [
            ["natal", isTh ? "ผังเกิด" : "Birth chart"],
            ["transit", isTh ? "ดาวจร" : "Transits"],
            ["progress", isTh ? "ดาวก้าวหน้า" : "Progressions"],
            ["solar", isTh ? "ผังวันเกิดปีนี้" : "Solar return"],
            ["lunar", isTh ? "ผังจันทร์คืน" : "Lunar return"],
            ["synastry", isTh ? "ผังคู่" : "Synastry"],
            ["thai", isTh ? "โหราไทย" : "Thai astrology"],
            ["ask", isTh ? "ถามแม่หมอ" : "Ask the reader"],
          ] as const
        ).map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k} aria-pressed={view === k} onClick={() => setView(k)}>
            {t}
          </button>
        ))}
      </div>

      {view !== "natal" && (
        <Suspense fallback={<p className="text-sm text-muted text-center">{isTh ? "กำลังคำนวณ..." : "Calculating..."}</p>}>
          {view === "synastry" ? (
            <NatalSynastry chart={chart} lang={lang} meta={meta} />
          ) : view === "thai" ? (
            <NatalThai spec={spec} lang={lang} />
          ) : view === "ask" ? (
            <NatalAsk spec={spec} lang={lang} timeKnown={chart.input.timeKnown} />
          ) : (
            <NatalTimeTools chart={chart} lang={lang} meta={meta} mode={view} />
          )}
        </Suspense>
      )}

      {view === "natal" && (
      <>
      <nav aria-label={isTh ? "ไปยังส่วนของผัง" : "Jump to"} className="v2-nr-jump v2-nt-noprint">
        {nav.map(([id, text]) => (
          <a key={id} href={`#${id}`}>
            {text}
          </a>
        ))}
      </nav>

      {/* ── ไพ่ประจำดวงกำเนิด ── */}
      <section aria-labelledby="natal-cards" className="v2-nr-sec">
        <SectionHead id="natal-cards" n={nextN()} title={isTh ? "ไพ่ประจำตัวคุณ" : "Your tarot cards"}>
          {isTh ? "จุดละ 2 ใบ: ไพ่ประจำราศี และไพ่ประจำช่วงองศา แตะเพื่อพลิกทีละใบ" : "Two cards for each point: the sign card and the decan card. Tap to turn them over."}
        </SectionHead>
        <div className="grid gap-3 sm:grid-cols-3">
          {bigThree.map(({ key, body, label }) => {
            const c = cardsFor(body);
            const both = bigRevealed(key);
            return (
              <div key={key} className="v2-nr-card">
                <p className="v2-nr-card-t">{label}</p>
                <div className="flex justify-center gap-2">
                  <FlipCard card={cardById.get(c.sign)} revealed={!!revealed[`${key}:sign`]} onReveal={() => setRevealed((r) => ({ ...r, [`${key}:sign`]: true }))} label={isTh ? `ไพ่ประจำราศีของ${label}` : `Sign card for ${label}`} lang={lang} />
                  <FlipCard card={cardById.get(c.decan)} revealed={!!revealed[`${key}:decan`]} onReveal={() => setRevealed((r) => ({ ...r, [`${key}:decan`]: true }))} label={isTh ? `ไพ่ประจำช่วงองศาของ${label}` : `Decan card for ${label}`} lang={lang} />
                </div>
                {both && (
                  <dl className="v2-nr-card-names">
                    {[
                      { id: c.sign, from: signName(body.sign, lang) },
                      { id: c.decan, from: isTh ? `${body.decan * 10} ถึง ${body.decan * 10 + 10} องศา` : `${body.decan * 10} to ${body.decan * 10 + 10} degrees` },
                    ].map((x) => {
                      const card = cardById.get(x.id);
                      return (
                        <div key={x.id}>
                          <dt>{x.from}</dt>
                          <dd>
                            <Link href={`/cards/${x.id}`} className="v2-nr-cardlink">
                              {cardName(x.id)}
                            </Link>
                            {card && NATAL_CARD_KEYWORDS[card.id] && <span className="v2-nr-card-kw">{NATAL_CARD_KEYWORDS[card.id][lang]}</span>}
                          </dd>
                        </div>
                      );
                    })}
                    <Link href={zodiacSignPath(ZODIAC_SIGNS[body.sign].id)} className="v2-nr-link">
                      {isTh ? "อ่านไพ่ประจำราศีนี้" : "Read about this sign"}
                    </Link>
                  </dl>
                )}
              </div>
            );
          })}
        </div>
        <div className="v2-nt-noprint flex flex-col items-center gap-2">
          {shareOpen ? (
            <Suspense fallback={<p className="text-sm text-muted">{isTh ? "กำลังสร้างภาพ..." : "Creating the image..."}</p>}>
              <NatalShare chart={chart} lang={lang} cards={cards} />
            </Suspense>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  // ภาพแชร์มีไพ่ประจำราศี ➔ พลิกไพ่ใบนั้นบนหน้าเว็บไปพร้อมกัน (กฎเหล็กข้อ 4: ผู้ใช้เป็นคนเปิดเอง)
                  setRevealed((r) => ({ ...r, ...Object.fromEntries(bigThree.map(({ key }) => [`${key}:sign`, true])) }));
                  setShareOpen(true);
                }}
                className="rounded-full btn-gold-glass px-5 min-h-[44px] text-sm font-bold"
              >
                {isTh ? "สร้างภาพแชร์ Big Three" : "Create a Big Three image"}
              </button>
              <p className="text-xs text-muted">{isTh ? "กดแล้วไพ่ประจำราศีจะถูกพลิกและใส่ในภาพ" : "This turns over your sign cards and puts them in the image."}</p>
            </>
          )}
          {bigThree.every(({ key }) => bigRevealed(key)) && (
            <p className="v2-nr-note text-center">
              {isTh ? "อยากรู้ว่าไพ่บอกอะไรกับเรื่องที่ค้างใจตอนนี้ " : "Want to know what the cards say about what is on your mind? "}
              <Link href="/spreads" className="v2-nr-link">
                {isTh ? "เปิดไพ่ถามต่อ" : "Ask the cards"}
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* ── วงผัง ── */}
      <section aria-labelledby="natal-wheel" className="v2-nr-sec">
        <SectionHead id="natal-wheel" n={nextN()} title={isTh ? "วงผังดวง" : "Chart wheel"}>
          {isTh ? "แตะดาวในวงเพื่ออ่านความหมายและดูว่าทำมุมกับดาวไหนบ้าง" : "Tap a planet to read its meaning and see its connections."}
        </SectionHead>
        <NatalWheel chart={chart} lang={lang} focus={focus} onFocus={setFocus} showMinor={showMinor} />
        {focusBody && (
          <div className="v2-nr-focus" aria-live="polite">
            <p className="v2-nr-item-t">
              {BODY_TEXT[focusBody.id].name[lang]}{" "}
              <span className="v2-nr-planet-where">
                {shortSign(focusBody.sign)}
                {focusBody.house ? (isTh ? ` เรือน ${focusBody.house}` : `, house ${focusBody.house}`) : ""}
              </span>
            </p>
            <p className="v2-nr-item-meta">{BODY_TEXT[focusBody.id].theme[lang]}</p>
            {focusText.map((t, i) => (
              <p key={i} className="v2-nr-item-d">
                {t}
              </p>
            ))}
          </div>
        )}
        <div className="v2-nr-legend">
          <span className="is-harmonious">{isTh ? "เส้นน้ำเงิน ไหลลื่น" : "Blue: flowing"}</span>
          <span className="is-tense">{isTh ? "เส้นแดง ตึง" : "Red: tense"}</span>
          <span className="is-minor">{isTh ? "เส้นประ มุมรอง" : "Dashed: minor"}</span>
        </div>
        <div className="v2-nt-noprint flex flex-wrap items-center justify-center gap-3 text-sm">
          <label className="v2-nt-check">
            <input type="checkbox" checked={showMinor} onChange={(e) => setShowMinor(e.target.checked)} />
            {isTh ? "แสดงมุมรอง" : "Show minor aspects"}
          </label>
          {focus && (
            <button type="button" onClick={() => setFocus(null)} className="tap-target rounded-full border border-line-warm px-3 py-1.5 text-xs">
              {isTh ? `เลิกเน้น${bodyName(focus, lang)}` : `Clear ${bodyName(focus, lang)}`}
            </button>
          )}
        </div>
        <ul className="v2-nr-keys" aria-label={isTh ? "ตัวย่อบนวงผัง" : "Wheel labels"}>
          {(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "node", "lilith", "ceres", "pallas", "juno", "vesta"] as const)
            .filter((id) => get(id))
            .map((id) => (
              <li key={id}>
                <b>{BODY_TEXT[id].short[lang]}</b>
                {BODY_TEXT[id].name[lang]}
              </li>
            ))}
        </ul>
      </section>

      {/* ── เรื่องเด่นที่สุดของผัง (โค้ดจัดลำดับ) + ภาพรวมจากแม่หมอ AI (กดเองหลังยินยอม) ── */}
      <section aria-labelledby="natal-themes" className="v2-nr-sec">
        <SectionHead id="natal-themes" n={nextN()} title={isTh ? "เรื่องเด่นที่สุดของผัง" : "Your chart's strongest themes"}>
          {isTh
            ? "เรียงจากสำคัญที่สุด แต่ละข้อบอกว่าแปลว่าอะไร มาจากตรงไหนของผัง และใช้ให้ดีอย่างไร คำนวณจากผังของคุณ ไม่ใช้ AI"
            : "Most important first. Each one says what it means, where it comes from in your chart and how to make it work. Calculated from your chart without AI."}
        </SectionHead>
        {themes.length > 0 && (
          <ol className="v2-nr-items">
            {themes.map((h, i) => (
              <li key={h.key} className={`is-${h.tone}`}>
                <span className="v2-nr-item-t">
                  <span className="ui2-num text-gold-ink">{i + 1}.</span> {h.title}
                </span>
                <span className="v2-nr-item-basis">{h.basis}</span>
                <span className="v2-nr-item-d">{h.text}</span>
                {h.advice && (
                  <span className="v2-nr-item-key">
                    <b>{isTh ? "ใช้ให้ดี" : "Make it work"}</b>
                    {h.advice}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
        <p className="v2-nr-note">
          {isTh
            ? "จัดลำดับด้วยหลักโหราสากล: ดาวชิดแกนผัง รูปแบบผัง เจ้าเรือนลัคนา มุมที่แนบสนิท ดาวเด่น ธาตุ และศักดิ์ดาว"
            : "Ranked by standard astrological weight: planets on the angles, chart patterns, the chart ruler, tight aspects, the dominant planet, elements and dignities."}
        </p>
        <div className="v2-nt-noprint">
          <Suspense fallback={null}>
            <NatalOverview spec={spec} lang={lang} />
          </Suspense>
        </div>
      </section>

      {/* ── ดาวแต่ละดวง: แถวสั้น แตะอ่านต่อ ── */}
      <section aria-labelledby="natal-planets" className="v2-nr-sec">
        <SectionHead id="natal-planets" n={nextN()} title={isTh ? "ดาวแต่ละดวงบอกอะไร" : "What each planet says"}>
          {isTh ? "ดาวคือเรื่อง ราศีคือสไตล์ เรือนคือด้านของชีวิต แตะแถวเพื่ออ่านคำอธิบาย" : "Planet = what, sign = how, house = where. Tap a row to read more."}
        </SectionHead>
        <div className="v2-nr-planets">
          {planetRows.map((b) => {
            const c = cardsFor(b);
            const personal = b.id === "sun" || b.id === "moon" || b.id === "asc";
            const showCards = !personal || bigRevealed(b.id);
            const retro = b.retrograde && !["node", "southNode", "lilith"].includes(b.id);
            return (
              <details key={b.id} className={`v2-nr-planet${focus === b.id ? " is-focus" : ""}`}>
                <summary>
                  <span className="v2-nr-abbr" aria-hidden="true">{BODY_TEXT[b.id].short[lang]}</span>
                  <span className="v2-nr-planet-main">
                    <span className="v2-nr-planet-name">
                      {BODY_TEXT[b.id].name[lang]}
                      <span className="v2-nr-planet-where">
                        {shortSign(b.sign)}
                        {b.house ? (isTh ? ` เรือน ${b.house}` : `, house ${b.house}`) : ""}
                      </span>
                    </span>
                    <span className="v2-nr-planet-theme">{BODY_TEXT[b.id].theme[lang]}</span>
                    {(retro || b.dignities.length > 0) && (
                      <span className="v2-nr-planet-tags">
                        {retro && (
                          <span className="v2-nr-tag">
                            <span className="v2-nt-retro">{isTh ? "ถอยหลัง" : "Retrograde"}</span>
                            {TAG_SHORT.retro[lang]}
                          </span>
                        )}
                        {b.dignities.map((d) => (
                          <span key={d} className="v2-nr-tag">
                            <span className={`v2-nt-dig v2-nt-dig-${d}`}>{DIGNITY_TEXT[d].name[lang]}</span>
                            {TAG_SHORT[d][lang]}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="v2-nt-more">
                    <span className="v2-nt-more-open">{isTh ? "อ่าน" : "Read"}</span>
                    <span className="v2-nt-more-close">{isTh ? "ย่อ" : "Close"}</span>
                  </span>
                </summary>
                <div className="v2-nr-planet-body">
                  {describeBody(chart, b, lang)
                    .filter((p) => showCards || !namesHiddenCard(p, [c.sign, c.decan]))
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  {(b.id === "asc" || b.id === "moon") && (
                    <p>
                      <Link href={`/natal-chart/${b.id === "asc" ? "rising" : "moon"}/${ZODIAC_SIGNS[b.sign].id}`} className="v2-nr-link">
                        {b.id === "asc"
                          ? isTh
                            ? `อ่านเรื่องลัคนา${ZODIAC_SIGNS[b.sign].nameTh}แบบละเอียด`
                            : `Full guide to ${ZODIAC_SIGNS[b.sign].nameEn} rising`
                          : isTh
                            ? `อ่านเรื่องดวงจันทร์${ZODIAC_SIGNS[b.sign].nameTh}แบบละเอียด`
                            : `Full guide to the Moon in ${ZODIAC_SIGNS[b.sign].nameEn}`}
                      </Link>
                    </p>
                  )}
                  {(PLANET_IDS as readonly string[]).includes(b.id) || personal ? (
                    <p className="v2-nr-planet-cards">
                      {showCards
                        ? [
                            c.planet ? `${isTh ? "ไพ่ประจำดาว" : "Planet card"}: ${cardName(c.planet)}` : null,
                            `${isTh ? "ไพ่ประจำราศี" : "Sign card"}: ${cardName(c.sign)}`,
                            `${isTh ? "ไพ่ประจำช่วงองศา" : "Decan card"}: ${cardName(c.decan)}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : isTh
                          ? "พลิกไพ่ในส่วนไพ่ประจำตัวก่อน แล้วคำอธิบายเต็มและไพ่ของจุดนี้จะขึ้นที่นี่"
                          : "Turn over the cards in the tarot section first to see the full reading and this point's cards."}
                    </p>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* ── เรือน 12: กล่องละเรือน บอกดาวที่อยู่ข้างใน ── */}
      {chart.houses && (
        <section aria-labelledby="natal-houses" className="v2-nr-sec">
          <SectionHead id="natal-houses" n={nextN()} title={isTh ? "ดาวอยู่เรือนไหนของชีวิต" : "Where your planets live"}>
            {isTh
              ? "เรือนที่มีดาวหลายดวงคือด้านของชีวิตที่คุณทุ่มพลังมาก เรือนที่ไม่มีดาวไม่ได้แปลว่าไม่มีเรื่อง ให้ดูว่าดาวเจ้าเรือนไปอยู่ไหน"
              : "Houses with several planets are where you put the most energy. An empty house still matters: look at where its ruling planet sits."}
          </SectionHead>
          <ol className="v2-nr-houses">
            {chart.houses.map((cusp, i) => {
              const inside = planetRows.filter((b) => b.house === i + 1 && b.id !== "asc" && b.id !== "mc");
              const ruled = inside.length ? null : emptyHouseNote(chart, i + 1, lang);
              return (
                <li key={i} className={inside.length >= 3 ? "is-busy" : undefined}>
                  <span className="v2-nr-house-top">
                    <span className="v2-nr-house-n ui2-num">{i + 1}</span>
                    <span className="v2-nr-house-sign">{shortSign(Math.floor(cusp / 30))}</span>
                  </span>
                  <span className="v2-nr-house-t">{HOUSE_TEXT[i].title[lang]}</span>
                  {inside.length > 0 ? (
                    <span className="v2-nr-house-bodies">
                      {inside.map((b) => (
                        <span key={b.id}>{BODY_TEXT[b.id].name[lang]}</span>
                      ))}
                    </span>
                  ) : (
                    <span className="v2-nr-house-empty">
                      {isTh ? "ไม่มีดาว" : "No planets"}
                      {ruled && <span className="v2-nr-house-ruler">{ruled}</span>}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ── มุมสำคัญ 5 อันดับ ── */}
      <section aria-labelledby="natal-aspects" className="v2-nr-sec">
        <SectionHead id="natal-aspects" n={nextN()} title={isTh ? "ดาวที่คุยกันแรงที่สุด" : "Your strongest aspects"}>
          {isTh
            ? `มุมหลักที่แม่นที่สุด ${keyAspects.length} คู่จากทั้งหมด ${majorCount} คู่ ยิ่งอยู่บนยิ่งรู้สึกชัด ไม่นับมุมระหว่างดาวเดินช้าที่คนรุ่นเดียวกันมีเหมือนกัน`
            : `The ${keyAspects.length} tightest of your ${majorCount} major aspects. The higher, the stronger. Aspects between slow planets that your whole generation shares are left out.`}
        </SectionHead>
        <ol className="v2-nr-aspects">
          {keyAspects.map((a) => (
            <li key={`${a.a}-${a.b}`} className={`is-${tone(toneOf.get(a.type))}`}>
              <span className="v2-nr-asp-pair">
                <b>{bodyName(a.a, lang)}</b>
                <span className="v2-nr-asp-type">{ASPECT_TEXT[a.type].name[lang].replace(/\s*\(.*\)$/, "")}</span>
                <b>{bodyName(a.b, lang)}</b>
              </span>
              <span className="v2-nr-asp-text">{describeAspect(a, lang)}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── สมดุลพลัง ── */}
      <section aria-labelledby="natal-balance" className="v2-nr-sec">
        <SectionHead id="natal-balance" n={nextN()} title={isTh ? "สมดุลพลังในผัง" : "Your balance of energy"}>
          {isTh ? "นับจากดาวทุกดวง ดวงอาทิตย์ ดวงจันทร์ และลัคนามีน้ำหนักมากที่สุด" : "Counted across all planets; the Sun, Moon and Ascendant weigh the most."}
        </SectionHead>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="v2-nr-box">
            <p className="v2-nr-box-t">{isTh ? "ธาตุ" : "Elements"}</p>
            {(["fire", "earth", "air", "water"] as Element[]).map((e) => (
              <div key={e} className="v2-nr-meter">
                <span className="v2-nr-meter-l">{ELEMENT_TEXT[e].name[lang]}</span>
                <span className="v2-nt-bar">
                  <span className={e} style={{ width: `${pct(chart.distribution.elementScore[e], elementTotal)}%` }} />
                </span>
                <span className="v2-nr-meter-v ui2-num">{pct(chart.distribution.elementScore[e], elementTotal)}%</span>
              </div>
            ))}
            {missingElements.map((e) => (
              <p key={e} className="v2-nr-item-meta">
                {ELEMENT_DEPTH[e].miss[lang]} {ELEMENT_DEPTH[e].missKey[lang]}
              </p>
            ))}
            {/* ไม่มีธาตุที่ขาด: บอกธาตุที่น้อยที่สุด (ไม่เกิน 20%) ว่าควรเติมอย่างไร */}
            {missingElements.length === 0 && lowElement && (
              <p className="v2-nr-item-meta">
                {isTh
                  ? `ธาตุ${ELEMENT_TEXT[lowElement].name.th}น้อยที่สุด (${pct(chart.distribution.elementScore[lowElement], elementTotal)}%) ด้านนี้คือสิ่งที่ควรเติม: ${ELEMENT_DEPTH[lowElement].missKey.th}`
                  : `${ELEMENT_TEXT[lowElement].name.en} is your lowest element (${pct(chart.distribution.elementScore[lowElement], elementTotal)}%), the side worth building: ${ELEMENT_DEPTH[lowElement].missKey.en}`}
              </p>
            )}
            <p className="v2-nr-box-t pt-2">{isTh ? "วิธีลงมือ" : "Modes"}</p>
            {(["cardinal", "fixed", "mutable"] as Modality[]).map((m) => (
              <div key={m} className="v2-nr-meter">
                <span className="v2-nr-meter-l">{MODALITY_TEXT[m].name[lang].replace(/\s*\(.*\)$/, "")}</span>
                <span className="v2-nt-bar">
                  <span className="mod" style={{ width: `${pct(chart.distribution.modalityScore[m], modalityTotal)}%` }} />
                </span>
                <span className="v2-nr-meter-v ui2-num">{pct(chart.distribution.modalityScore[m], modalityTotal)}%</span>
              </div>
            ))}
            <p className="v2-nr-note">
              {isTh ? "จรราศี = ผู้ริเริ่ม · สถิรราศี = ผู้ยืนหยัด · อุภยราศี = ผู้ปรับตัว" : "Cardinal = starter, fixed = sustainer, mutable = adapter."}
            </p>
          </div>
          <div className="v2-nr-box">
            <p className="v2-nr-box-t">{isTh ? "ดาวเด่นในผัง" : "Most prominent planets"}</p>
            {topPlanet && <p className="v2-nr-item-d">{PLANET_DEPTH[topPlanet.id].loud[lang]}</p>}
            <ol className="v2-nr-dom">
              {chart.dominantPlanets.slice(0, 3).map((d, i) => (
                <li key={d.id}>
                  <span className="v2-nr-dom-n ui2-num">{i + 1}</span>
                  <span>
                    <b>{BODY_TEXT[d.id].name[lang]}</b>
                    <span className="v2-nr-note">
                      {d.reasons
                        .map((r) => {
                          const [k] = r.split(":");
                          return DOMINANT_REASON_TEXT[k]?.[lang] ?? k;
                        })
                        .join(isTh ? " · " : ", ")}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <dl className="v2-nr-facts">
              <div>
                <dt>{isTh ? "วิธีลงมือ" : "How you act"}</dt>
                <dd>{afterColon(MODALITY_TEXT[topModality].strong[lang])}</dd>
              </div>
              <div>
                <dt>{isTh ? "เกิดช่วง" : "Moon phase"}</dt>
                <dd>
                  {MOON_PHASE_TEXT[chart.moonPhase.phase].name[lang]}{" "}
                  <span className="v2-nr-note">{MOON_PHASE_TEXT[chart.moonPhase.phase].meaning[lang]}</span>
                </dd>
              </div>
              {chart.chartRuler && (
                <div>
                  <dt>{isTh ? "เจ้าเรือนลัคนา" : "Chart ruler"}</dt>
                  <dd>{BODY_TEXT[chart.chartRuler].name[lang]}</dd>
                </div>
              )}
              <div>
                <dt>{isTh ? "หยาง : หยิน" : "Yang : yin"}</dt>
                <dd>
                  {chart.distribution.polarity.yang.length} : {chart.distribution.polarity.yin.length}{" "}
                  <span className="v2-nr-note">
                    {chart.distribution.polarity.yang.length >= chart.distribution.polarity.yin.length ? POLARITY_TEXT.yang.meaning[lang] : POLARITY_TEXT.yin.meaning[lang]}
                  </span>
                </dd>
              </div>
              {chart.distribution.hemispheres && (
                <div>
                  <dt>{isTh ? "ดาวส่วนใหญ่อยู่" : "Most planets"}</dt>
                  <dd>
                    {chart.distribution.hemispheres.south.length >= chart.distribution.hemispheres.north.length
                      ? HEMISPHERE_TEXT.south.name[lang]
                      : HEMISPHERE_TEXT.north.name[lang]}
                    {isTh ? " และ" : " and "}
                    {chart.distribution.hemispheres.east.length >= chart.distribution.hemispheres.west.length
                      ? HEMISPHERE_TEXT.east.name[lang]
                      : HEMISPHERE_TEXT.west.name[lang]}
                    <span className="v2-nr-note block">
                      {afterColon(
                        (chart.distribution.hemispheres.south.length >= chart.distribution.hemispheres.north.length ? HEMISPHERE_TEXT.south : HEMISPHERE_TEXT.north).meaning[lang],
                      )}{" "}
                      {afterColon((chart.distribution.hemispheres.east.length >= chart.distribution.hemispheres.west.length ? HEMISPHERE_TEXT.east : HEMISPHERE_TEXT.west).meaning[lang])}
                    </span>
                  </dd>
                </div>
              )}
              {chart.dayChart !== null && (
                <div>
                  <dt>{isTh ? "เกิดตอน" : "Born by"}</dt>
                  <dd>
                    {chart.dayChart ? (isTh ? "กลางวัน (อาทิตย์อยู่เหนือขอบฟ้า)" : "day (Sun above the horizon)") : isTh ? "กลางคืน (อาทิตย์อยู่ใต้ขอบฟ้า)" : "night (Sun below the horizon)"}
                    <span className="v2-nr-note block">{SECT_TEXT[chart.dayChart ? "day" : "night"][lang]}</span>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        {chart.patterns.length > 0 && (
          <div className="v2-nr-box">
            <p className="v2-nr-box-t">{isTh ? "รูปแบบพิเศษในผัง" : "Chart patterns"}</p>
            <ul className="space-y-2">
              {chart.patterns.map((p, i) => {
                const d = describePattern(chart, p, lang);
                return (
                  <li key={i} className="v2-nr-pattern">
                    <b>{d.title}</b>
                    <span>{d.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* ── ลงลึก: ตารางสำหรับคนที่อ่านผังเป็น ── */}
      <section aria-labelledby="natal-deep" className="v2-nr-sec">
        <SectionHead id="natal-deep" n={nextN()} title={isTh ? "ข้อมูลละเอียด" : "In depth"}>
          {isTh ? "ตารางตัวเลขสำหรับคนที่อ่านผังเป็น แตะหัวข้อเพื่อเปิด" : "Tables for experienced chart readers. Tap a heading to open it."}
        </SectionHead>
        <div className="v2-nr-deep">
          <details>
            <summary>
              {isTh ? "ตำแหน่งดาวทั้งหมด" : "All positions"}
              <MoreLabel isTh={isTh} />
            </summary>
            <table className="v2-nt-table">
              <thead>
                <tr>
                  <th scope="col">{isTh ? "ดาว/จุด" : "Body"}</th>
                  <th scope="col">{isTh ? "ราศี" : "Sign"}</th>
                  <th scope="col">{isTh ? "องศา" : "Degree"}</th>
                  {chart.houses && <th scope="col">{isTh ? "เรือน" : "House"}</th>}
                  <th scope="col">{isTh ? "สถานะ" : "Notes"}</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ORDER.map((id) => get(id))
                  .filter((b): b is BodyPosition => !!b)
                  .map((b) => (
                    <tr key={b.id} className={focus === b.id ? "is-focus" : undefined} onClick={() => setFocus(focus === b.id ? null : b.id)}>
                      <td className="font-semibold text-ink">{BODY_TEXT[b.id].name[lang]}</td>
                      <td>{shortSign(b.sign)}</td>
                      <td className="tabular-nums">{formatDegree(b.degInSign)}</td>
                      {chart.houses && <td className="tabular-nums">{b.house}</td>}
                      <td>
                        {b.retrograde && !["node", "southNode", "lilith"].includes(b.id) && <span className="v2-nt-retro mr-1">{isTh ? "ถอยหลัง" : "Rx"}</span>}
                        {b.dignities.map((d) => (
                          <span key={d} className={`v2-nt-dig v2-nt-dig-${d}`}>
                            {DIGNITY_TEXT[d].name[lang]}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </details>

          {chart.houses && (
            <details>
              <summary>
                {isTh ? "จุดเริ่มเรือน" : "House cusps"}
                <MoreLabel isTh={isTh} />
              </summary>
              <p className="v2-nr-note">{chart.houseSystemUsed && HOUSE_SYSTEM_TEXT[chart.houseSystemUsed].note[lang]}</p>
              <table className="v2-nt-table">
                <thead>
                  <tr>
                    <th scope="col">{isTh ? "เรือน" : "House"}</th>
                    <th scope="col">{isTh ? "เริ่มที่" : "Cusp"}</th>
                    <th scope="col">{isTh ? "เรื่อง" : "Area of life"}</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.houses.map((cusp, i) => (
                    <tr key={i}>
                      <td className="font-semibold tabular-nums">{i + 1}</td>
                      <td className="whitespace-nowrap">
                        {shortSign(Math.floor(cusp / 30))} {formatDegree(cusp % 30)}
                      </td>
                      <td className="text-muted">{HOUSE_TEXT[i].title[lang]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}

          <details>
            <summary>
              {isTh ? `ตารางมุมสัมพันธ์ (${visibleAspects.length})` : `Aspect grid (${visibleAspects.length})`}
              <MoreLabel isTh={isTh} />
            </summary>
            <p className="v2-nr-note">
              {isTh
                ? "ตัวเลขเล็กคือ orb (องศาที่ห่างจากมุมพอดี) ยิ่งน้อยยิ่งแรง · กุม 0 · โยค 60 · จตุ 90 · ตรี 120 · เล็ง 180"
                : "The small number is the orb (distance from exact); smaller means stronger."}
            </p>
            <table className="v2-nt-grid" aria-label={isTh ? "ตารางมุมสัมพันธ์" : "Aspect grid"} style={{ "--nt-n": gridIds.length } as React.CSSProperties}>
              <colgroup>
                {gridIds.map((id) => (
                  <col key={id} />
                ))}
              </colgroup>
              <tbody>
                {gridIds.map((rowId, r, rows) => (
                  <tr key={rowId}>
                    {rows.slice(0, r).map((colId) => {
                      const a = visibleAspects.find((x) => (x.a === rowId && x.b === colId) || (x.a === colId && x.b === rowId));
                      return (
                        <td key={colId} className={a ? toneOf.get(a.type) : undefined} title={a ? aspectTitle(a, lang) : undefined}>
                          {a && (
                            <>
                              {ASPECT_SHORT[a.type][lang]}
                              <span className="o">{a.orb.toFixed(0)}</span>
                            </>
                          )}
                        </td>
                      );
                    })}
                    <th scope="row">{BODY_TEXT[rowId].short[lang]}</th>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="v2-nr-asplist">
              {visibleAspects.map((a) => (
                <li key={`${a.a}-${a.b}`}>
                  <b>{aspectTitle(a, lang)}</b>
                  <span>
                    orb {formatDegree(a.orb)}
                    {a.applying === null ? "" : a.applying ? (isTh ? " · กำลังเข้า" : " · applying") : isTh ? " · กำลังแยก" : " · separating"}
                  </span>
                </li>
              ))}
            </ul>
          </details>

          <details>
            <summary>
              {isTh ? `ดาวฤกษ์ที่ทับดาวในผัง (${stars.contacts.length})` : `Fixed stars on your chart (${stars.contacts.length})`}
              <MoreLabel isTh={isTh} />
            </summary>
            <p className="v2-nr-note">
              {isTh
                ? "ดาวฤกษ์สำคัญ 35 ดวง (รวมดาวฤกษ์หลวง 4 ดวงและ Behenian 15 ดวง) ที่ทับดาวหรือมุมฟ้าในผังของคุณ ภายใน 1 องศา (อาทิตย์ จันทร์ ลัคนา กลางฟ้า 1.5 องศา) ตำแหน่งจากแคตตาล็อก Hipparcos เลื่อนตามการหมุนควงถึงวันเกิด"
                : "Major fixed stars (including the four Royal stars and the fifteen Behenian stars) within 1 degree of a planet or angle in your chart (1.5 for the Sun, Moon, Ascendant and Midheaven). Positions come from the Hipparcos catalogue, precessed to your birth date."}
            </p>
            {stars.contacts.length ? (
              <ul className="space-y-2">
                {stars.contacts.map((c) => (
                  <li key={`${c.star.name}-${c.body}`} className="v2-nr-pattern">
                    <b>
                      {isTh ? STAR_TEXT[c.star.name]?.th ?? c.star.name : c.star.name} {isTh ? "ทับ" : "on"} {bodyName(c.body, lang)}{" "}
                      <span className="v2-nr-note tabular-nums">orb {formatDegree(c.orb)}</span>
                    </b>
                    <span>{STAR_TEXT[c.star.name]?.meaning[lang]}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{isTh ? "ไม่มีดาวฤกษ์สำคัญทับดาวในผังของคุณภายในเกณฑ์" : "No major fixed star sits within orb of your planets or angles."}</p>
            )}
            <p className="v2-nr-sub">{isTh ? "ตำแหน่งดาวฤกษ์ทั้งหมด ณ วันเกิด" : "All fixed star positions at birth"}</p>
            <table className="v2-nt-table">
              <thead>
                <tr>
                  <th scope="col">{isTh ? "ดาวฤกษ์" : "Star"}</th>
                  <th scope="col">{isTh ? "ราศี" : "Sign"}</th>
                  <th scope="col">{isTh ? "องศา" : "Degree"}</th>
                </tr>
              </thead>
              <tbody>
                {[...stars.all].sort((a, b) => a.lon - b.lon).map((st) => (
                  <tr key={st.name}>
                    <td>
                      {isTh ? STAR_TEXT[st.name]?.th ?? st.name : st.name}
                      {ROYAL_STARS.has(st.name) && <span className="block text-xs text-muted">{isTh ? "ดาวฤกษ์หลวง" : "Royal star"}</span>}
                    </td>
                    <td>{shortSign(Math.floor(st.lon / 30) % 12)}</td>
                    <td className="tabular-nums">{formatDegree(st.lon % 30)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <details>
            <summary>
              {isTh ? "จุด Lots 7 จุดของ Hermes" : "The seven Hermetic lots"}
              <MoreLabel isTh={isTh} />
            </summary>
            {lots ? (
              <>
                <p className="v2-nr-note">
                  {isTh
                    ? `สูตรของ Paulus Alexandrinus (ค.ศ. 378) ใช้ลัคนากับดาว 2 ดวง ผังของคุณเป็นผัง${chart.dayChart ? "กลางวัน" : "กลางคืน"} จึงใช้สูตร${chart.dayChart ? "กลางวัน" : "กลางคืน"}`
                    : `Formulas of Paulus Alexandrinus (378 AD) from the Ascendant and two planets. Yours is a ${chart.dayChart ? "day" : "night"} chart, so the ${chart.dayChart ? "day" : "night"} formulas apply.`}
                </p>
                <table className="v2-nt-table">
                  <thead>
                    <tr>
                      <th scope="col">Lot</th>
                      <th scope="col">{isTh ? "ตำแหน่ง" : "Position"}</th>
                      <th scope="col">{isTh ? "เรือน" : "House"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map((l) => (
                      <tr key={l.id}>
                        <td>
                          {LOT_TEXT[l.id].name[lang]}
                          <span className="block text-xs text-muted whitespace-normal">{LOT_TEXT[l.id].meaning[lang]}</span>
                        </td>
                        <td className="tabular-nums">
                          {shortSign(l.sign)} {formatDegree(l.degInSign)}
                        </td>
                        <td>{l.house}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="v2-nr-note">{isTh ? "จุด Lots ต้องใช้ลัคนา จึงต้องรู้เวลาเกิด" : "The lots need the Ascendant, so a birth time is required."}</p>
            )}
          </details>

          <details>
            <summary>
              {isTh ? "ข้อมูลการคำนวณ" : "Calculation details"}
              <MoreLabel isTh={isTh} />
            </summary>
            <ul className="v2-nr-calc tabular-nums">
              <li>UTC: {new Date(chart.input.utcMs).toISOString().replace("T", " ").slice(0, 16)}</li>
              <li>Julian Day (UT): {chart.jdUt.toFixed(5)}</li>
              <li>
                {isTh ? "พิกัด" : "Coordinates"}: {chart.input.lat.toFixed(4)}, {chart.input.lon.toFixed(4)}
              </li>
              <li>
                {isTh ? "โหนด" : "Node"}: {chart.input.nodeType === "true" ? (isTh ? "โหนดจริง" : "true node") : isTh ? "โหนดเฉลี่ย" : "mean node"}
              </li>
              <li>RAMC: {chart.ramc.toFixed(4)}° · {isTh ? "ความเอียงสุริยวิถี" : "Obliquity"}: {chart.obliquity.toFixed(4)}°</li>
              <li>{isTh ? "ธาตุของราศีลัคนา" : "Ascendant element"}: {asc ? ELEMENT_TEXT[SIGN_ELEMENT[asc.sign]].name[lang] : "-"}</li>
              <li>
                {isTh
                  ? "ตำแหน่งดาว: astronomy-engine (ตรวจกับ NASA JPL Horizons คลาดไม่เกิน 1 ลิปดา) · ไครอน: ตาราง NASA JPL · เรือน: สูตรมาตรฐานชุดเดียวกับ Swiss Ephemeris"
                  : "Planets: astronomy-engine (checked against NASA JPL Horizons, within 1 arcminute). Chiron: NASA JPL table. Houses: standard formulas as used by Swiss Ephemeris."}
              </li>
            </ul>
          </details>
        </div>
      </section>
      </>
      )}
    </div>
  );
}

