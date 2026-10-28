"use client";

import React, { Suspense, useMemo, useState } from "react";
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
import { aspectTitle, bodyName, cardsFor, chartSummary, describeAspect, describeBody, describePattern, placement, signName } from "@/lib/astro/natal-text";
import { zodiacSignPath } from "@/lib/tarot/zodiac";
import { NatalWheel } from "./NatalWheel";
import { FlipCard } from "./NatalFlipCard";
import type { NatalCardItem, NatalMeta } from "./NatalChartApp";
import type { TimeMode } from "./NatalTimeTools";

/* ⏳ แท็บตามเวลา (ดาวจร · ก้าวหน้า · รีเทิร์น) โหลดเมื่อกดแท็บเท่านั้น */
const NatalTimeTools = React.lazy(() => import("./NatalTimeTools"));
/* 💞 แท็บผังคู่ โหลดเมื่อกดแท็บเท่านั้น */
const NatalSynastry = React.lazy(() => import("./NatalSynastry"));

/**
 * 🪐 ผลผังดวงทั้งหมด — โหลดแบบ lazy พร้อมตัวคำนวณ (ไม่อยู่ในบันเดิลแรกของหน้า)
 * ลำดับ: สรุป ➔ วงผัง ➔ ไพ่ประจำดวงกำเนิด (คว่ำ แตะพลิกเอง) ➔ ตำแหน่งดาว ➔ เรือน ➔ มุมสัมพันธ์ ➔
 *       ธาตุ/ดาวเด่น/รูปแบบ ➔ คำอธิบายรายดาว ➔ ข้อมูลการคำนวณ
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

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="scroll-mt-24 text-lg sm:text-xl font-serif-th font-bold text-ink">
      {children}
    </h3>
  );
}

export default function NatalResult({
  chart,
  lang,
  meta,
  cards,
}: {
  chart: NatalChart;
  lang: Lang;
  meta: NatalMeta;
  cards: readonly NatalCardItem[];
}) {
  const isTh = lang === "th";
  const [focus, setFocus] = useState<BodyId | null>(null);
  const [showMinor, setShowMinor] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<"natal" | TimeMode | "synastry">("natal");
  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
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
  const summary = chartSummary(chart, lang);
  const gridIds = GRID_ORDER.filter((id) => get(id));

  const bigThree = [
    { key: "sun", body: sun, label: isTh ? "ดวงอาทิตย์: ตัวตน" : "Sun: your core self" },
    { key: "moon", body: moon, label: isTh ? "ดวงจันทร์: ใจ" : "Moon: your heart" },
    ...(asc ? [{ key: "asc", body: asc, label: isTh ? "ลัคนา: ภาพที่คนเห็น" : "Rising: how you come across" }] : []),
  ];
  const bigRevealed = (key: string) => !!revealed[`${key}:sign`] && !!revealed[`${key}:decan`];

  const elementTotal = Object.values(chart.distribution.elementScore).reduce((a, b) => a + b, 0) || 1;
  const modalityTotal = Object.values(chart.distribution.modalityScore).reduce((a, b) => a + b, 0) || 1;
  const names = (ids: BodyId[]) => (ids.length ? ids.map((id) => BODY_TEXT[id].short[lang]).join(" ") : "-");

  const nav = [
    ["natal-summary", isTh ? "สรุป" : "Summary"],
    ["natal-wheel", isTh ? "วงผัง" : "Wheel"],
    ["natal-cards", isTh ? "ไพ่ประจำดวง" : "Tarot"],
    ["natal-positions", isTh ? "ตำแหน่งดาว" : "Positions"],
    ...(chart.houses ? [["natal-houses", isTh ? "เรือน" : "Houses"]] : []),
    ["natal-aspects", isTh ? "มุมสัมพันธ์" : "Aspects"],
    ["natal-balance", isTh ? "ธาตุและดาวเด่น" : "Balance"],
    ["natal-reading", isTh ? "คำอธิบาย" : "Reading"],
  ];

  return (
    <div className="space-y-8">
      {/* ── สรุป ── */}
      <section aria-labelledby="natal-summary" className="altar-card-porcelain rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="space-y-1">
          <SectionTitle id="natal-summary">
            {meta.name ? (isTh ? `ผังดวงกำเนิดของ ${meta.name}` : `${meta.name}'s natal chart`) : isTh ? "ผังดวงกำเนิดของคุณ" : "Your natal chart"}
          </SectionTitle>
          <p className="text-sm text-muted">
            {meta.dateText} · {meta.timeText} · {meta.placeText} · {meta.offsetText}
          </p>
          <p className="text-xs text-muted">
            {isTh ? "ระบบสากล (Tropical)" : "Tropical zodiac"}
            {chart.houseSystemUsed ? ` · ${isTh ? "เรือน" : "Houses"}: ${HOUSE_SYSTEM_TEXT[chart.houseSystemUsed].name[lang]}` : ""}
            {` · ${isTh ? "โหนด" : "Node"}: ${chart.input.nodeType === "true" ? (isTh ? "จริง" : "true") : isTh ? "เฉลี่ย" : "mean"}`}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { id: "sun" as const, label: isTh ? "อาทิตย์" : "Sun" },
            { id: "moon" as const, label: isTh ? "จันทร์" : "Moon" },
            { id: "asc" as const, label: isTh ? "ลัคนา" : "Rising" },
          ].map((x) => {
            const b = get(x.id);
            return (
              <div key={x.id} className="rounded-xl border border-line-warm bg-surface/70 p-2 sm:p-3">
                <p className="text-xs text-muted">{x.label}</p>
                <p className="font-serif-th font-bold text-ink text-sm sm:text-base">{b ? signName(b.sign, lang).replace(isTh ? "ราศี" : "", "") : isTh ? "ต้องรู้เวลาเกิด" : "Needs birth time"}</p>
                {b && <p className="text-xs text-muted tabular-nums">{formatDegree(b.degInSign)}</p>}
              </div>
            );
          })}
        </div>
        {chart.warnings.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {chart.warnings.map((w) => (
              <li key={w.code} className="border-l-2 border-gold-ink pl-2 text-ink">
                {WARNING_TEXT[w.code][lang]}
                {w.bodies?.length ? ` (${w.bodies.map((id) => bodyName(id, lang)).join(isTh ? " " : ", ")})` : ""}
              </li>
            ))}
          </ul>
        )}
        {!chart.input.timeKnown && chart.moonRange && (
          <p className="text-sm text-ink border-l-2 border-line-warm pl-2">
            {isTh
              ? `ไม่ทราบเวลาเกิด: คำนวณที่เที่ยงวัน วันนั้นดวงจันทร์เดินจาก${signName(Math.floor(chart.moonRange.from / 30), lang)} ${formatDegree(chart.moonRange.from % 30)} ถึง${signName(Math.floor(chart.moonRange.to / 30), lang)} ${formatDegree(chart.moonRange.to % 30)} ไม่มีลัคนาและเรือนชะตา`
              : `Birth time unknown: calculated for noon. That day the Moon moved from ${signName(Math.floor(chart.moonRange.from / 30), lang)} ${formatDegree(chart.moonRange.from % 30)} to ${signName(Math.floor(chart.moonRange.to / 30), lang)} ${formatDegree(chart.moonRange.to % 30)}. No Ascendant or houses.`}
          </p>
        )}
        {view === "natal" && (
        <nav aria-label={isTh ? "ไปยังส่วนของผัง" : "Jump to"} className="v2-nt-noprint flex flex-wrap gap-1.5">
          {nav.map(([id, text]) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-line-warm bg-surface px-3 py-1.5 text-xs text-ink hover:border-gold-ink">
              {text}
            </a>
          ))}
        </nav>
        )}
      </section>

      {/* ── แท็บ: ผังเกิด / ตามเวลา ── */}
      <div className="v2-nt-seg v2-nt-noprint" role="tablist" aria-label={isTh ? "มุมมองของผัง" : "Chart views"}>
        {(
          [
            ["natal", isTh ? "ผังเกิด" : "Birth chart"],
            ["transit", isTh ? "ดาวจร" : "Transits"],
            ["progress", isTh ? "ดาวก้าวหน้า" : "Progressions"],
            ["solar", isTh ? "ผังวันเกิดปีนี้" : "Solar return"],
            ["lunar", isTh ? "ผังจันทร์คืน" : "Lunar return"],
            ["synastry", isTh ? "ผังคู่" : "Synastry"],
          ] as const
        ).map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k} aria-pressed={view === k} onClick={() => setView(k)}>
            {t}
          </button>
        ))}
      </div>

      {view !== "natal" && (
        <Suspense fallback={<p className="text-sm text-muted text-center">{isTh ? "กำลังคำนวณ..." : "Calculating..."}</p>}>
          {view === "synastry" ? <NatalSynastry chart={chart} lang={lang} meta={meta} /> : <NatalTimeTools chart={chart} lang={lang} meta={meta} mode={view} />}
        </Suspense>
      )}

      {view === "natal" && (
      <>
      {/* ── วงผัง ── */}
      <section aria-labelledby="natal-wheel" className="space-y-3">
        <SectionTitle id="natal-wheel">{isTh ? "วงผังดวง" : "Chart wheel"}</SectionTitle>
        <NatalWheel chart={chart} lang={lang} focus={focus} onFocus={setFocus} showMinor={showMinor} />
        <div className="v2-nt-noprint flex flex-wrap items-center justify-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer">
            <input type="checkbox" checked={showMinor} onChange={(e) => setShowMinor(e.target.checked)} className="w-4 h-4" />
            {isTh ? "แสดงมุมสัมพันธ์รอง" : "Show minor aspects"}
          </label>
          {focus && (
            <button type="button" onClick={() => setFocus(null)} className="tap-target rounded-full border border-line-warm px-3 py-1.5 text-xs">
              {isTh ? `เลิกเน้น${bodyName(focus, lang)}` : `Clear ${bodyName(focus, lang)}`}
            </button>
          )}
        </div>
        <p className="text-xs text-muted text-center">
          {isTh ? "แตะดาวในวงเพื่อเน้นมุมสัมพันธ์ของดาวดวงนั้น · เส้นน้ำเงิน = กลมกลืน · เส้นแดง = ตึง · เส้นประ = มุมรอง" : "Tap a planet to highlight its aspects. Blue = harmonious, red = tense, dashed = minor."}
        </p>
        <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted">
          {(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "node", "lilith", "ceres", "pallas", "juno", "vesta"] as const)
            .filter((id) => get(id))
            .map((id) => (
            <li key={id}>
              <span className="font-bold text-ink">{BODY_TEXT[id].short[lang]}</span> {BODY_TEXT[id].name[lang]}
            </li>
          ))}
        </ul>
      </section>

      {/* ── ไพ่ประจำดวงกำเนิด ── */}
      <section aria-labelledby="natal-cards" className="space-y-4">
        <SectionTitle id="natal-cards">{isTh ? "ไพ่ประจำดวงกำเนิด" : "Your natal tarot cards"}</SectionTitle>
        <p className="text-sm text-muted">
          {isTh
            ? "ระบบ Golden Dawn ผูกไพ่ชุดใหญ่กับราศี และผูกไพ่เลข 2 ถึง 10 กับช่วงละ 10 องศา จุดสำคัญสามจุดของคุณจึงมีไพ่ประจำจุดละสองใบ แตะเพื่อพลิกทีละใบ"
            : "In the Golden Dawn system each sign has a Major Arcana card and each ten-degree decan a numbered Minor card. Your three key points each have two cards. Tap to turn them over."}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {bigThree.map(({ key, body, label }) => {
            const c = cardsFor(body);
            const both = bigRevealed(key);
            return (
              <div key={key} className="altar-card-porcelain rounded-xl p-3 space-y-3 text-center">
                <p className="font-serif-th font-bold text-ink text-sm">{label}</p>
                <div className="flex justify-center gap-2">
                  <FlipCard card={cardById.get(c.sign)} revealed={!!revealed[`${key}:sign`]} onReveal={() => setRevealed((r) => ({ ...r, [`${key}:sign`]: true }))} label={isTh ? `ไพ่ประจำราศีของ${label}` : `Sign card for ${label}`} lang={lang} />
                  <FlipCard card={cardById.get(c.decan)} revealed={!!revealed[`${key}:decan`]} onReveal={() => setRevealed((r) => ({ ...r, [`${key}:decan`]: true }))} label={isTh ? `ไพ่ประจำช่วงองศาของ${label}` : `Decan card for ${label}`} lang={lang} />
                </div>
                {both && (
                  <p className="text-xs text-muted text-left leading-relaxed">
                    {isTh
                      ? `${signName(body.sign, lang)} คือ ${cardName(c.sign)} · ช่วงที่ ${body.decan + 1} ของราศี (${body.decan * 10} ถึง ${body.decan * 10 + 10} องศา) คือ ${cardName(c.decan)}`
                      : `${signName(body.sign, lang)} is ${cardName(c.sign)}. Decan ${body.decan + 1} (${body.decan * 10} to ${body.decan * 10 + 10} degrees) is ${cardName(c.decan)}.`}{" "}
                    <Link href={zodiacSignPath(ZODIAC_SIGNS[body.sign].id)} className="underline text-gold-ink">
                      {isTh ? "อ่านไพ่ประจำราศีนี้" : "Read about this sign"}
                    </Link>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── ตำแหน่งดาว ── */}
      <section aria-labelledby="natal-positions" className="space-y-3">
        <SectionTitle id="natal-positions">{isTh ? "ตำแหน่งดาว" : "Planet positions"}</SectionTitle>
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
                  <td>{signName(b.sign, lang).replace(isTh ? "ราศี" : "", "")}</td>
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
      </section>

      {/* ── เรือน ── */}
      {chart.houses && (
        <section aria-labelledby="natal-houses" className="space-y-3">
          <SectionTitle id="natal-houses">{isTh ? "จุดเริ่มเรือน 12 เรือน" : "House cusps"}</SectionTitle>
          <p className="text-xs text-muted">{chart.houseSystemUsed && HOUSE_SYSTEM_TEXT[chart.houseSystemUsed].note[lang]}</p>
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
                    {signName(Math.floor(cusp / 30), lang).replace(isTh ? "ราศี" : "", "")} {formatDegree(cusp % 30)}
                  </td>
                  <td className="text-muted">{HOUSE_TEXT[i].title[lang]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── มุมสัมพันธ์ ── */}
      <section aria-labelledby="natal-aspects" className="space-y-3">
        <SectionTitle id="natal-aspects">{isTh ? "มุมสัมพันธ์" : "Aspects"}</SectionTitle>
        <p className="text-xs text-muted">
          {isTh
            ? "ตัวเลขใต้ชื่อมุมคือ orb (องศาที่ห่างจากมุมพอดี) ยิ่งน้อยยิ่งแรง · กุม 0 · โยค 60 · จตุ 90 · ตรี 120 · เล็ง 180"
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
        <details className="rounded-xl border border-line-warm px-3 py-2">
          <summary className="cursor-pointer list-none flex items-center min-h-[36px] text-sm font-semibold text-ink">
            {isTh ? `รายการมุมสัมพันธ์ทั้งหมด (${visibleAspects.length})` : `All aspects (${visibleAspects.length})`}
            <span className="v2-nt-more"><span className="v2-nt-more-open">{isTh ? "อ่าน" : "Read"}</span><span className="v2-nt-more-close">{isTh ? "ย่อ" : "Close"}</span></span>
          </summary>
        <ul className="space-y-1.5 text-sm pt-2">
          {visibleAspects.map((a) => (
            <li key={`${a.a}-${a.b}`} className="flex flex-wrap items-baseline gap-x-2 border-b border-line-warm/50 pb-1.5">
              <span className="font-semibold text-ink">{aspectTitle(a, lang)}</span>
              <span className="text-xs text-muted tabular-nums">
                orb {formatDegree(a.orb)}
                {a.applying === null ? "" : a.applying ? (isTh ? " · กำลังเข้า" : " · applying") : isTh ? " · กำลังแยก" : " · separating"}
              </span>
            </li>
          ))}
        </ul>
        </details>
      </section>

      {/* ── ธาตุ ดาวเด่น รูปแบบ ── */}
      <section aria-labelledby="natal-balance" className="space-y-4">
        <SectionTitle id="natal-balance">{isTh ? "ธาตุ คุณภาพ และดาวเด่น" : "Balance and dominants"}</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="altar-card-porcelain rounded-xl p-4 space-y-2.5">
            <h4 className="font-serif-th font-bold text-ink text-sm">{isTh ? "ธาตุ (คะแนนถ่วงน้ำหนัก)" : "Elements (weighted)"}</h4>
            {(["fire", "earth", "air", "water"] as Element[]).map((e) => (
              <div key={e} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-ink font-semibold">{ELEMENT_TEXT[e].name[lang]}</span>
                  <span className="text-muted">{names(chart.distribution.elements[e])}</span>
                </div>
                <div className="v2-nt-bar">
                  <span className={e} style={{ width: `${(chart.distribution.elementScore[e] / elementTotal) * 100}%` }} />
                </div>
              </div>
            ))}
            <h4 className="font-serif-th font-bold text-ink text-sm pt-2">{isTh ? "คุณภาพราศี" : "Modalities"}</h4>
            {(["cardinal", "fixed", "mutable"] as Modality[]).map((m) => (
              <div key={m} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-ink font-semibold">{MODALITY_TEXT[m].name[lang]}</span>
                  <span className="text-muted">{names(chart.distribution.modalities[m])}</span>
                </div>
                <div className="v2-nt-bar">
                  <span className="mod" style={{ width: `${(chart.distribution.modalityScore[m] / modalityTotal) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-muted pt-1">
              {isTh ? "คะแนน: อาทิตย์ จันทร์ ลัคนา 3 · กลางฟ้า พุธ ศุกร์ อังคาร 2 · พฤหัส เสาร์ 1 · ดาวนอก 0.5" : "Weights: Sun, Moon, Ascendant 3; MC, Mercury, Venus, Mars 2; Jupiter, Saturn 1; outer planets 0.5."}
            </p>
          </div>
          <div className="altar-card-porcelain rounded-xl p-4 space-y-3 text-sm">
            <div>
              <h4 className="font-serif-th font-bold text-ink">{isTh ? "หยิน-หยาง" : "Polarity"}</h4>
              {(["yang", "yin"] as const).map((p) => (
                <p key={p} className="text-muted">
                  <span className="text-ink font-semibold">{POLARITY_TEXT[p].name[lang]}</span> {chart.distribution.polarity[p].length}: {names(chart.distribution.polarity[p])}
                </p>
              ))}
            </div>
            {chart.distribution.hemispheres && (
              <div>
                <h4 className="font-serif-th font-bold text-ink">{isTh ? "ซีกของผัง (ดาว 10 ดวง)" : "Hemispheres (10 planets)"}</h4>
                {(["north", "south", "east", "west"] as const).map((h) => (
                  <p key={h} className="text-muted">
                    <span className="text-ink font-semibold">{HEMISPHERE_TEXT[h].name[lang]}</span> {chart.distribution.hemispheres![h].length}: {names(chart.distribution.hemispheres![h])}
                  </p>
                ))}
              </div>
            )}
            <div>
              <h4 className="font-serif-th font-bold text-ink">{isTh ? "ข้างขึ้นข้างแรมตอนเกิด" : "Lunar phase at birth"}</h4>
              <p className="text-muted">
                <span className="text-ink font-semibold">{MOON_PHASE_TEXT[chart.moonPhase.phase].name[lang]}</span> ({Math.round(chart.moonPhase.elongation)}°){" "}
                {MOON_PHASE_TEXT[chart.moonPhase.phase].meaning[lang]}
              </p>
            </div>
            {chart.dayChart !== null && (
              <p className="text-muted">
                <span className="text-ink font-semibold">{isTh ? "ผังกลางวัน/กลางคืน:" : "Day or night chart:"}</span>{" "}
                {chart.dayChart ? (isTh ? "กลางวัน (ดวงอาทิตย์อยู่เหนือขอบฟ้า)" : "day (Sun above the horizon)") : isTh ? "กลางคืน (ดวงอาทิตย์อยู่ใต้ขอบฟ้า)" : "night (Sun below the horizon)"}
              </p>
            )}
          </div>
        </div>

        <div className="altar-card-porcelain rounded-xl p-4 space-y-2">
          <h4 className="font-serif-th font-bold text-ink text-sm">{isTh ? "ดาวเด่นในผัง" : "Dominant planets"}</h4>
          <ol className="space-y-1 text-sm">
            {chart.dominantPlanets.slice(0, 5).map((d, i) => (
              <li key={d.id} className="flex flex-wrap gap-x-2 border-l-2 border-line-warm pl-2">
                <span className="font-semibold text-ink">
                  {i + 1}. {BODY_TEXT[d.id].name[lang]}
                </span>
                <span className="tabular-nums text-muted">{d.score.toFixed(1)}</span>
                <span className="text-xs text-muted">
                  {d.reasons
                    .map((r) => {
                      const [k, n] = r.split(":");
                      return `${DOMINANT_REASON_TEXT[k]?.[lang] ?? k}${n ? ` ${n}` : ""}`;
                    })
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ol>
          {chart.chartRuler && (
            <p className="text-sm text-muted">
              {isTh ? "เจ้าเรือนลัคนา: " : "Chart ruler: "}
              <span className="text-ink font-semibold">{BODY_TEXT[chart.chartRuler].name[lang]}</span>
            </p>
          )}
        </div>

        {chart.patterns.length > 0 && (
          <div className="altar-card-porcelain rounded-xl p-4 space-y-2">
            <h4 className="font-serif-th font-bold text-ink text-sm">{isTh ? "รูปแบบพิเศษในผัง" : "Chart patterns"}</h4>
            <ul className="space-y-2 text-sm">
              {chart.patterns.map((p, i) => {
                const d = describePattern(chart, p, lang);
                return (
                  <li key={i} className="border-l-2 border-gold-ink pl-2">
                    <span className="font-semibold text-ink">{d.title}</span>
                    <span className="block text-muted">{d.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* ── คำอธิบาย ── */}
      <section aria-labelledby="natal-reading" className="space-y-4">
        <SectionTitle id="natal-reading">{isTh ? "คำอธิบายผังของคุณ" : "Your chart, explained"}</SectionTitle>
        <div className="altar-card-porcelain rounded-xl p-4 space-y-2 text-sm leading-relaxed">
          {summary.map((p, i) => (
            <p key={i} className={i === 0 ? "text-ink font-semibold" : "text-ink"}>
              {p}
            </p>
          ))}
        </div>
        <div className="space-y-2">
          {TABLE_ORDER.filter((id) => id !== "southNode")
            .map((id) => get(id))
            .filter((b): b is BodyPosition => !!b)
            .map((b) => {
              const c = cardsFor(b);
              const personal = b.id === "sun" || b.id === "moon" || b.id === "asc";
              const showCards = !personal || bigRevealed(b.id);
              return (
                <details key={b.id} className="altar-card-porcelain rounded-xl px-4 py-3 group" open={b.id === "sun"}>
                  <summary className="cursor-pointer list-none flex flex-wrap items-baseline gap-x-2 min-h-[32px]">
                    <span className="font-serif-th font-bold text-ink">{BODY_TEXT[b.id].name[lang]}</span>
                    <span className="text-sm text-muted">
                      {placement(b, lang)}
                      {b.house ? (isTh ? ` · เรือน ${b.house}` : ` · house ${b.house}`) : ""}
                      {b.retrograde && !["node", "lilith"].includes(b.id) ? (isTh ? " · ถอยหลัง" : " · retrograde") : ""}
                    </span>
                    <span className="v2-nt-more"><span className="v2-nt-more-open">{isTh ? "อ่าน" : "Read"}</span><span className="v2-nt-more-close">{isTh ? "ย่อ" : "Close"}</span></span>
                  </summary>
                  <div className="pt-2 space-y-2 text-sm leading-relaxed text-ink">
                    <p className="text-xs text-muted">{BODY_TEXT[b.id].theme[lang]}</p>
                    {describeBody(chart, b, lang).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    {(b.id === "asc" || b.id === "moon") && (
                      <p className="text-sm">
                        <Link href={`/natal-chart/${b.id === "asc" ? "rising" : "moon"}/${ZODIAC_SIGNS[b.sign].id}`} className="underline text-gold-ink">
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
                      <p className="text-xs text-muted border-l-2 border-line-warm pl-2">
                        {showCards
                          ? [
                              c.planet ? `${isTh ? "ไพ่ประจำดาว" : "Planet card"}: ${cardName(c.planet)}` : null,
                              `${isTh ? "ไพ่ประจำราศี" : "Sign card"}: ${cardName(c.sign)}`,
                              `${isTh ? "ไพ่ประจำช่วงองศา" : "Decan card"}: ${cardName(c.decan)}`,
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : isTh
                            ? "พลิกไพ่ในส่วนไพ่ประจำดวงกำเนิดเพื่อดูไพ่ของจุดนี้"
                            : "Turn over the cards in the tarot section to see this point's cards."}
                      </p>
                    ) : null}
                  </div>
                </details>
              );
            })}
        </div>
        <div className="space-y-2">
          <h4 className="font-serif-th font-bold text-ink">{isTh ? "มุมสัมพันธ์หลัก (เรียงจากแรงสุด)" : "Major aspects (tightest first)"}</h4>
          <ul className="space-y-2 text-sm leading-relaxed">
            {chart.aspects
              .filter((a) => majorTypes.has(a.type))
              .map((a) => (
                <li key={`${a.a}-${a.b}`} className="border-l-2 border-line-warm pl-2">
                  <span className="font-semibold text-ink">{aspectTitle(a, lang)}</span>{" "}
                  <span className="text-xs text-muted tabular-nums">orb {formatDegree(a.orb)}</span>
                  <span className="block text-ink">{describeAspect(a, lang)}</span>
                </li>
              ))}
          </ul>
        </div>
      </section>

      {/* ── ข้อมูลการคำนวณ ── */}
      <details className="text-xs text-muted">
        <summary className="cursor-pointer min-h-[32px]">{isTh ? "ข้อมูลการคำนวณ" : "Calculation details"}</summary>
        <ul className="pt-2 space-y-1 tabular-nums">
          <li>UTC: {new Date(chart.input.utcMs).toISOString().replace("T", " ").slice(0, 16)}</li>
          <li>Julian Day (UT): {chart.jdUt.toFixed(5)}</li>
          <li>
            {isTh ? "พิกัด" : "Coordinates"}: {chart.input.lat.toFixed(4)}, {chart.input.lon.toFixed(4)}
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
      </>
      )}
    </div>
  );
}
