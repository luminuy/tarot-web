"use client";

import { useMemo, useState } from "react";
import { BODY_TEXT, MOON_SIGN_TEXT, MOON_PHASE_TEXT, PROG_PHASE_TEXT, ASPECT_TEXT, SIGN_TEXT, TRANSIT_TEXT, type Lang } from "@/data/natal/content";
import { THAI_PROVINCES, WORLD_CITIES } from "@/data/natal/places";
import { formatDegree, type BodyId, type BodyPosition, type NatalChart } from "@/lib/astro/natal";
import { bodyName, describeTimedAspect, describeTransitHouse, returnHighlights, signName } from "@/lib/astro/natal-text";
import {
  SLOW_IDS,
  computeProgressions,
  computeTransits,
  lunarReturn,
  solarReturn,
  transitCalendar,
  type MovingId,
  type TransitAspect,
  type TransitEvent,
} from "@/lib/astro/techniques";
import { NatalWheel } from "./NatalWheel";
import type { NatalMeta } from "./NatalChartApp";

/**
 * ⏳ แท็บ "ตามเวลา" ของผังดวง — ดาวจร · ดาวก้าวหน้า · ผังวันเกิดปีนี้ · ผังจันทร์คืน
 * โหลดแบบ lazy เมื่อผู้ใช้กดแท็บเท่านั้น (ตัวคำนวณดาวจรสแกนรายวันหลายร้อยวัน ไม่ควรรันถ้าไม่ได้ดู)
 */

export type TimeMode = "transit" | "progress" | "solar" | "lunar";

const DAY = 86400000;
const fieldClass =
  "glass-field w-full rounded-xl border border-line-interactive-warm px-3 py-2.5 text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors";
const labelClass = "block text-xs font-serif-th font-semibold text-ink mb-1";

function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "2026-10-27" ➔ เที่ยงวันตามเวลาเครื่องผู้ใช้ */
function inputToUtcMs(v: string): number {
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, 12, 0);
  if (y < 100) dt.setFullYear(y);
  return dt.getTime();
}

function fmtDate(utcMs: number, lang: Lang, zone?: string, withTime = false): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", ...(zone ? { timeZone: zone } : {}) };
  if (withTime) Object.assign(opts, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-GB", opts).format(new Date(utcMs));
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="font-serif-th font-bold text-ink text-base">{children}</h4>;
}

function PositionsTable({ bodies, lang, houses, houseLabel }: { bodies: readonly BodyPosition[]; lang: Lang; houses: boolean; houseLabel?: string }) {
  const isTh = lang === "th";
  return (
    <table className="v2-nt-table">
      <thead>
        <tr>
          <th scope="col">{isTh ? "ดาว" : "Body"}</th>
          <th scope="col">{isTh ? "ราศี" : "Sign"}</th>
          <th scope="col">{isTh ? "องศา" : "Degree"}</th>
          {houses && <th scope="col">{houseLabel ?? (isTh ? "เรือนในผังเกิด" : "Natal house")}</th>}
        </tr>
      </thead>
      <tbody>
        {bodies.map((b) => (
          <tr key={b.id}>
            <td className="font-semibold text-ink">
              {BODY_TEXT[b.id].name[lang]}
              {b.retrograde && !["node", "southNode", "lilith"].includes(b.id) && <span className="v2-nt-retro ml-1">{isTh ? "ถอยหลัง" : "Rx"}</span>}
            </td>
            <td>{signName(b.sign, lang).replace(isTh ? "ราศี" : "", "")}</td>
            <td className="tabular-nums">{formatDegree(b.degInSign)}</td>
            {houses && <td className="tabular-nums">{b.house ?? "-"}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AspectItem({ a, lang, zone, tLabel }: { a: TransitAspect; lang: Lang; zone?: string; tLabel: string }) {
  const isTh = lang === "th";
  const p = a.period;
  const text = describeTimedAspect(a.t, a.n, a.type, lang);
  return (
    <li className="border-l-2 border-line-warm pl-2 space-y-0.5">
      <p className="font-semibold text-ink">
        {bodyName(a.t, lang)}
        {tLabel} {ASPECT_TEXT[a.type].name[lang]} {bodyName(a.n, lang)}
        {isTh ? "เกิด" : " (natal)"}{" "}
        <span className="text-xs font-normal text-muted tabular-nums">
          orb {formatDegree(a.orb)}
          {a.applying === null ? "" : a.applying ? (isTh ? " · กำลังเข้า" : " · applying") : isTh ? " · กำลังแยก" : " · separating"}
        </span>
      </p>
      {p && (
        <p className="text-xs text-muted">
          {isTh ? "มีผลช่วง " : "Active "}
          {p.openStart ? (isTh ? "ก่อน " : "before ") : ""}
          {fmtDate(p.start, lang, zone)} {isTh ? "ถึง" : "to"} {p.openEnd ? (isTh ? "หลัง " : "after ") : ""}
          {fmtDate(p.end, lang, zone)}
          {p.exact.length
            ? ` · ${isTh ? "ตรงพอดี" : "exact"} ${p.exact.map((x) => fmtDate(x, lang, zone)).join(", ")}`
            : ` · ${isTh ? "ใกล้สุด" : "closest"} ${fmtDate(p.closest.utcMs, lang, zone)} (${formatDegree(p.closest.orb)})`}
        </p>
      )}
      {text && <p className="text-sm text-ink">{text}</p>}
    </li>
  );
}

function eventText(e: TransitEvent, lang: Lang): string {
  const isTh = lang === "th";
  const t = bodyName(e.t, lang);
  if (e.kind === "sign") return isTh ? `${t}ย้ายเข้า${signName(e.sign, lang)}` : `${t} enters ${signName(e.sign, lang)}`;
  if (e.kind === "house") return isTh ? `${t}ย้ายเข้าเรือน ${e.house} ของผังเกิด` : `${t} enters your natal house ${e.house}`;
  return isTh
    ? `${t}${ASPECT_TEXT[e.type].name.th} ${bodyName(e.n, lang)}เกิด ตรงพอดี${e.retrograde ? " (ขณะถอยหลัง)" : ""}`
    : `${t} ${ASPECT_TEXT[e.type].name.en} natal ${bodyName(e.n, lang)}, exact${e.retrograde ? " (retrograde)" : ""}`;
}

type PlaceChoice = "birth" | string;

function PlacePicker({ value, onChange, lang, id }: { value: PlaceChoice; onChange: (v: PlaceChoice) => void; lang: Lang; id: string }) {
  const isTh = lang === "th";
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
      <option value="birth">{isTh ? "สถานที่เกิด" : "Birthplace"}</option>
      <optgroup label={isTh ? "จังหวัดในไทย" : "Thailand"}>
        {THAI_PROVINCES.map((p) => (
          <option key={p.id} value={p.id}>
            {isTh ? p.th : p.en}
          </option>
        ))}
      </optgroup>
      <optgroup label={isTh ? "ต่างประเทศ" : "Abroad"}>
        {WORLD_CITIES.map((p) => (
          <option key={p.id} value={p.id}>
            {isTh ? p.th : p.en}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

function resolvePlace(choice: PlaceChoice, natal: NatalChart, meta: NatalMeta) {
  if (choice === "birth") return { lat: natal.input.lat, lon: natal.input.lon, zone: meta.zone };
  const p = [...THAI_PROVINCES, ...WORLD_CITIES].find((x) => x.id === choice);
  return p ? { lat: p.lat, lon: p.lon, zone: p.zone } : { lat: natal.input.lat, lon: natal.input.lon, zone: meta.zone };
}

export default function NatalTimeTools({ chart, lang, meta, mode }: { chart: NatalChart; lang: Lang; meta: NatalMeta; mode: TimeMode }) {
  const isTh = lang === "th";
  const [dateStr, setDateStr] = useState(todayInput);
  const [place, setPlace] = useState<PlaceChoice>("birth");
  const thisYear = new Date().getFullYear();
  const [srYear, setSrYear] = useState(() => Math.min(Math.max(thisYear, meta.birthYear), 2100));
  const [focus, setFocus] = useState<BodyId | null>(null);
  const atMs = useMemo(() => inputToUtcMs(dateStr), [dateStr]);

  const transit = useMemo(() => (mode === "transit" ? computeTransits(chart, atMs) : null), [mode, chart, atMs]);
  const calendar = useMemo(() => (mode === "transit" ? transitCalendar(chart, atMs, 365) : []), [mode, chart, atMs]);
  const prog = useMemo(() => (mode === "progress" ? computeProgressions(chart, atMs) : null), [mode, chart, atMs]);
  const where = resolvePlace(place, chart, meta);
  const ret = useMemo(() => {
    if (mode === "solar") return solarReturn(chart, srYear - meta.birthYear, { lat: where.lat, lon: where.lon });
    if (mode === "lunar") return lunarReturn(chart, atMs - DAY / 2, { lat: where.lat, lon: where.lon });
    return null;
  }, [mode, chart, srYear, meta.birthYear, where.lat, where.lon, atMs]);

  const dateField = (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-end">
      <div>
        <label htmlFor={`nt-date-${mode}`} className={labelClass}>
          {mode === "lunar" ? (isTh ? "หาผังจันทร์คืนถัดจากวันที่" : "Next lunar return after") : isTh ? "วันที่" : "Date"}
        </label>
        <input
          id={`nt-date-${mode}`}
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          value={dateStr}
          onChange={(e) => e.target.value && setDateStr(e.target.value)}
          className={fieldClass}
        />
      </div>
      <button type="button" onClick={() => setDateStr(todayInput())} className="tap-target rounded-full border border-line-warm bg-surface px-4 py-2 text-sm text-ink">
        {isTh ? "วันนี้" : "Today"}
      </button>
    </div>
  );

  if (mode === "transit" && transit) {
    const slow = transit.aspects.filter((a) => SLOW_IDS.includes(a.t));
    const fast = transit.aspects.filter((a) => !SLOW_IDS.includes(a.t));
    const months = new Map<string, TransitEvent[]>();
    for (const e of calendar) {
      const key = new Intl.DateTimeFormat(isTh ? "th-TH" : "en-GB", { month: "long", year: "numeric" }).format(new Date(e.utcMs));
      months.set(key, [...(months.get(key) ?? []), e]);
    }
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted">
          {isTh
            ? "ดาวบนฟ้าวันที่เลือก (วงนอก) ทับผังเกิดของคุณ (วงใน) เส้นในวงคือมุมที่ดาวจรทำกับดาวเกิด orb แคบกว่าผังเกิด ดาวเดินช้ามีผลเป็นสัปดาห์ถึงเดือน ดาวเดินเร็วมีผลไม่กี่วัน"
            : "The sky on the chosen date (outer ring) over your birth chart (inner). Lines show aspects from transiting to natal planets. Slow planets act for weeks to months, fast ones for days."}
        </p>
        {dateField}
        <NatalWheel chart={chart} lang={lang} focus={focus} onFocus={setFocus} showMinor={false} outer={{ bodies: transit.bodies, aspects: transit.aspects.map((a) => ({ a: a.t, b: a.n, type: a.type, orb: a.orb, maxOrb: a.maxOrb })) }} />
        <section className="space-y-2">
          <SubTitle>{isTh ? "ดาวจรเดินช้าที่มีผลช่วงนี้" : "Long-running transits now"}</SubTitle>
          {slow.length ? (
            <ul className="space-y-3">
              {slow.map((a) => (
                <AspectItem key={`${a.t}-${a.n}`} a={a} lang={lang} tLabel={isTh ? "จร" : " (transit)"} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{isTh ? "ช่วงนี้ไม่มีดาวเดินช้าทำมุมตรงกับจุดสำคัญในผังเกิด" : "No slow planet is making a close aspect right now."}</p>
          )}
        </section>
        {fast.length > 0 && (
          <section className="space-y-2">
            <SubTitle>{isTh ? "ดาวจรเดินเร็วของวันนี้" : "Today's quick transits"}</SubTitle>
            <ul className="space-y-3">
              {fast.map((a) => (
                <AspectItem key={`${a.t}-${a.n}`} a={a} lang={lang} tLabel={isTh ? "จร" : " (transit)"} />
              ))}
            </ul>
          </section>
        )}
        {chart.houses && (
          <section className="space-y-2">
            <SubTitle>{isTh ? "ดาวจรเดินช้าอยู่เรือนไหนของคุณ" : "Where the slow planets fall in your chart"}</SubTitle>
            <ul className="space-y-1.5 text-sm">
              {transit.bodies
                .filter((b) => SLOW_IDS.includes(b.id as MovingId) && b.id !== "node" && b.house)
                .map((b) => (
                  <li key={b.id} className="border-l-2 border-line-warm pl-2">
                    <span className="font-semibold text-ink">
                      {bodyName(b.id, lang)} {isTh ? `เรือน ${b.house}` : `house ${b.house}`}
                    </span>{" "}
                    <span className="text-muted">({TRANSIT_TEXT[b.id as keyof typeof TRANSIT_TEXT].span[lang]})</span>
                    <span className="block text-ink">{describeTransitHouse(b.id, b.house!, lang)}</span>
                  </li>
                ))}
            </ul>
          </section>
        )}
        <section className="space-y-2">
          <SubTitle>{isTh ? "ตำแหน่งดาวจร" : "Transit positions"}</SubTitle>
          <PositionsTable bodies={transit.bodies} lang={lang} houses={!!chart.houses} />
        </section>
        <section className="space-y-3">
          <SubTitle>{isTh ? "ปฏิทินดาวจร 12 เดือนข้างหน้า" : "Transit calendar, next 12 months"}</SubTitle>
          <p className="text-xs text-muted">
            {isTh
              ? "วันที่ดาวพฤหัส เสาร์ ยูเรนัส เนปจูน พลูโต และไครอน ทำมุมตรงพอดีกับจุดในผังเกิด หรือย้ายราศี/ย้ายเรือน (มีผลก่อนและหลังวันนั้นหลายสัปดาห์)"
              : "Dates when Jupiter, Saturn, Uranus, Neptune, Pluto and Chiron make exact aspects to your chart or change sign/house (felt for weeks around each date)."}
          </p>
          {calendar.length === 0 ? (
            <p className="text-sm text-muted">{isTh ? "ไม่มีเหตุการณ์สำคัญในช่วงนี้" : "No major events in this period."}</p>
          ) : (
            [...months.entries()].map(([month, evs]) => (
              <div key={month}>
                <p className="text-sm font-semibold text-ink">{month}</p>
                <ul className="text-sm space-y-1 pt-1">
                  {evs.map((e, i) => (
                    <li key={i} className="border-l-2 border-line-warm pl-2 text-ink">
                      <span className="text-muted tabular-nums">{fmtDate(e.utcMs, lang)}</span> {eventText(e, lang)}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>
    );
  }

  if (mode === "progress" && prog) {
    const pSun = prog.bodies.find((b) => b.id === "sun")!;
    const pMoon = prog.bodies.find((b) => b.id === "moon")!;
    const natalSun = chart.bodies.find((b) => b.id === "sun")!;
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted">
          {isTh
            ? "ดาวก้าวหน้า (Secondary Progression) ใช้หลัก 1 วันหลังเกิด = 1 ปีของชีวิต บอกพัฒนาการภายในที่ค่อย ๆ เปลี่ยน ดวงจันทร์ก้าวหน้าย้ายราศีทุกราว 2 ปีครึ่ง เป็นตัวบอกบรรยากาศใจของช่วงชีวิต"
            : "Secondary progressions use one day after birth for each year of life. They show slow inner development; the progressed Moon changes sign about every two and a half years and sets the emotional tone of each chapter."}
        </p>
        {dateField}
        <p className="text-sm text-ink">
          {isTh ? `อายุ ${prog.age.toFixed(1)} ปี · Solar Arc ${prog.solarArc.toFixed(2)} องศา` : `Age ${prog.age.toFixed(1)} · solar arc ${prog.solarArc.toFixed(2)} degrees`}
        </p>
        <NatalWheel chart={chart} lang={lang} focus={focus} onFocus={setFocus} showMinor={false} outer={{ bodies: prog.bodies, aspects: prog.aspects.map((a) => ({ a: a.t, b: a.n, type: a.type, orb: a.orb, maxOrb: a.maxOrb })) }} />
        <section className="altar-card-porcelain rounded-xl p-4 space-y-2 text-sm leading-relaxed">
          <SubTitle>{isTh ? "ช่วงชีวิตนี้" : "This chapter of life"}</SubTitle>
          <p className="text-ink">
            <span className="font-semibold">{isTh ? `ดวงจันทร์ก้าวหน้า${signName(pMoon.sign, lang)}` : `Progressed Moon in ${signName(pMoon.sign, lang)}`}</span>
            {isTh ? `${pMoon.house ? ` เรือน ${pMoon.house}` : ""}: ` : `${pMoon.house ? `, house ${pMoon.house}` : ""}: `}
            {MOON_SIGN_TEXT[pMoon.sign][lang]}
          </p>
          <p className="text-ink">
            <span className="font-semibold">{isTh ? `ดวงอาทิตย์ก้าวหน้า${signName(pSun.sign, lang)}` : `Progressed Sun in ${signName(pSun.sign, lang)}`}</span>
            {pSun.sign === natalSun.sign
              ? isTh
                ? `: ยังอยู่ราศีเดียวกับตอนเกิด ตัวตนกำลังลึกซึ้งขึ้นในแบบ${SIGN_TEXT[pSun.sign].keywords.th}`
                : `: still in your birth sign, deepening a ${SIGN_TEXT[pSun.sign].keywords.en} identity.`
              : isTh
                ? `: ตัวตนเติบโตออกจากราศีเกิด ไปทางคน${SIGN_TEXT[pSun.sign].keywords.th}`
                : `: your identity has grown beyond your birth sign toward being ${SIGN_TEXT[pSun.sign].keywords.en}.`}
          </p>
          <p className="text-ink">
            <span className="font-semibold">{isTh ? `ข้างขึ้นข้างแรมก้าวหน้า: ${MOON_PHASE_TEXT[prog.moonPhase.phase].name.th}` : `Progressed lunar phase: ${MOON_PHASE_TEXT[prog.moonPhase.phase].name.en}`}</span>{" "}
            {PROG_PHASE_TEXT[prog.moonPhase.phase][lang]}
          </p>
        </section>
        <section className="space-y-2">
          <SubTitle>{isTh ? "มุมของดาวก้าวหน้ากับผังเกิด (orb 1 องศา)" : "Progressed aspects to natal (1 degree orb)"}</SubTitle>
          {prog.aspects.length ? (
            <ul className="space-y-3 text-sm">
              {prog.aspects.map((a) => (
                <li key={`${a.t}-${a.n}`} className="border-l-2 border-line-warm pl-2">
                  <p className="font-semibold text-ink">
                    {bodyName(a.t, lang)}
                    {isTh ? "ก้าวหน้า" : " (progressed)"} {ASPECT_TEXT[a.type].name[lang]} {bodyName(a.n, lang)}
                    {isTh ? "เกิด" : " (natal)"} <span className="text-xs font-normal text-muted tabular-nums">orb {formatDegree(a.orb)}</span>
                  </p>
                  <p className="text-ink">
                    {/* ดาวก้าวหน้าเป็นพัฒนาการระยะยาว — ห้ามใช้ประโยคดาวจร ("อารมณ์ของวันนี้") */}
                    {(isTh
                        ? `${BODY_TEXT[a.t].noun.th}ที่พัฒนามาถึงตอนนี้ ${ASPECT_TEXT[a.type].meaning.th} กับ${BODY_TEXT[a.n].noun.th}ตั้งแต่เกิด`
                        : `Your developing ${BODY_TEXT[a.t].noun.en} and your natal ${BODY_TEXT[a.n].noun.en}: ${ASPECT_TEXT[a.type].meaning.en}.`)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{isTh ? "ช่วงนี้ไม่มีดาวก้าวหน้าทำมุมตรงกับผังเกิด" : "No progressed aspects are exact right now."}</p>
          )}
        </section>
        <section className="space-y-2">
          <SubTitle>{isTh ? "ตำแหน่งดาวก้าวหน้า" : "Progressed positions"}</SubTitle>
          <PositionsTable bodies={prog.bodies} lang={lang} houses={!!chart.houses} />
        </section>
      </div>
    );
  }

  if ((mode === "solar" || mode === "lunar") && ret) {
    const highlights = returnHighlights(ret, mode, lang);
    const maxYear = Math.min(2100, meta.birthYear + 110);
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted">
          {mode === "solar"
            ? isTh
              ? "ผังวันเกิดปีนี้ (Solar Return) คือผังของขณะที่ดวงอาทิตย์กลับมาที่องศาเดิมตอนคุณเกิด ใช้ดูธีมของปีตั้งแต่วันเกิดปีนี้ถึงปีหน้า ตำแหน่งที่คุณอยู่ในวันเกิดมีผลกับลัคนาและเรือนของผังนี้"
              : "A Solar Return is the chart for the moment the Sun returns to its exact birth degree. It describes the year from this birthday to the next; where you are on your birthday changes its Ascendant and houses."
            : isTh
              ? "ผังจันทร์คืน (Lunar Return) คือขณะที่ดวงจันทร์กลับมาที่องศาเดิมตอนคุณเกิด เกิดทุกราว 27 วัน ใช้ดูบรรยากาศใจของเดือนนั้น"
              : "A Lunar Return happens when the Moon returns to its birth degree, about every 27 days, and describes the emotional tone of that month."}
        </p>
        {!chart.input.timeKnown && (
          <p className="text-sm text-ink border-l-2 border-gold-ink pl-2">
            {isTh
              ? "ไม่ทราบเวลาเกิด: เวลาของผังนี้อาจคลาดได้ถึงครึ่งวัน ลัคนาและเรือนจึงยังเชื่อไม่ได้"
              : "Birth time unknown: this chart's time may be off by up to half a day, so its Ascendant and houses are not reliable."}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {mode === "solar" ? (
            <div>
              <label htmlFor="nt-sr-year" className={labelClass}>
                {isTh ? "วันเกิดปี" : "Birthday in"}
              </label>
              <select id="nt-sr-year" value={srYear} onChange={(e) => setSrYear(Number(e.target.value))} className={fieldClass}>
                {Array.from({ length: maxYear - meta.birthYear + 1 }, (_, i) => meta.birthYear + i).map((y) => (
                  <option key={y} value={y}>
                    {isTh ? `พ.ศ. ${y + 543}` : y}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            dateField
          )}
          <div>
            <label htmlFor={`nt-place-${mode}`} className={labelClass}>
              {mode === "solar" ? (isTh ? "วันเกิดปีนี้คุณอยู่ที่ไหน" : "Where you spend that birthday") : isTh ? "ช่วงนั้นคุณอยู่ที่ไหน" : "Where you are then"}
            </label>
            <PlacePicker id={`nt-place-${mode}`} value={place} onChange={setPlace} lang={lang} />
          </div>
        </div>
        <p className="text-sm font-semibold text-ink">
          {isTh ? "ขณะของผัง: " : "Chart moment: "}
          {fmtDate(ret.input.utcMs, lang, where.zone, true)}
          {where.zone ? "" : " UTC"}
        </p>
        {mode === "solar" && (
          <p className="text-xs text-muted">
            {isTh
              ? "ขณะของผังอาจตรงกับวันก่อนหรือหลังวันเกิดหนึ่งวัน เพราะปีหนึ่งยาวไม่เท่ากับจำนวนวันเต็มพอดี"
              : "The return can fall a day before or after your birthday because a year is not a whole number of days."}
          </p>
        )}
        <NatalWheel chart={ret} lang={lang} focus={focus} onFocus={setFocus} showMinor={false} />
        <section className="altar-card-porcelain rounded-xl p-4 space-y-2 text-sm leading-relaxed">
          <SubTitle>{mode === "solar" ? (isTh ? "ธีมของปี" : "Themes of the year") : isTh ? "บรรยากาศของเดือน" : "Mood of the month"}</SubTitle>
          {highlights.map((h, i) => (
            <p key={i} className="text-ink">
              {h}
            </p>
          ))}
        </section>
        <section className="space-y-2">
          <SubTitle>{isTh ? "ตำแหน่งดาว" : "Positions"}</SubTitle>
          <PositionsTable bodies={ret.bodies.filter((b) => [...SLOW_IDS, "sun", "moon", "mercury", "venus", "mars", "asc", "mc"].includes(b.id as MovingId))} lang={lang} houses={!!ret.houses} houseLabel={isTh ? "เรือน" : "House"} />
        </section>
      </div>
    );
  }
  return null;
}
