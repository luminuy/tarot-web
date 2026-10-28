"use client";

import { useMemo, useState } from "react";
import { BODY_TEXT, MOON_SIGN_TEXT, MOON_PHASE_TEXT, PROG_PHASE_TEXT, ASPECT_TEXT, SIGN_TEXT, TRANSIT_TEXT, type Lang } from "@/data/natal/content";
import { THAI_PROVINCES, WORLD_CITIES } from "@/data/natal/places";
import { ASPECT_DEFS, formatDegree, type AspectType, type BodyId, type BodyPosition, type NatalChart } from "@/lib/astro/natal";
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
import { MoreLabel, SectionHead, SummaryBox } from "./NatalUi";
import type { NatalMeta } from "./NatalChartApp";

/**
 * ⏳ แท็บ "ตามเวลา" ของผังดวง — ดาวจร · ดาวก้าวหน้า · ผังวันเกิดปีนี้ · ผังจันทร์คืน
 * โหลดแบบ lazy เมื่อผู้ใช้กดแท็บเท่านั้น (ตัวคำนวณดาวจรสแกนรายวันหลายร้อยวัน ไม่ควรรันถ้าไม่ได้ดู)
 */

export type TimeMode = "transit" | "progress" | "solar" | "lunar";

const DAY = 86400000;
/* ช่องกรอก 16px กัน iPhone ซูม (ชุดเดียวกับฟอร์มสร้างผัง) */
const fieldClass =
  "glass-field w-full min-h-[48px] rounded-xl border border-line-interactive-warm px-3 py-2.5 text-base font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors";
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

/** สีเส้นซ้ายของการ์ดตามโทนมุม (ชุดเดียวกับเส้นบนวงผัง) */
function toneClass(type: AspectType): string {
  return `is-${ASPECT_DEFS.find((d) => d.type === type)?.tone ?? "neutral"}`;
}

/** ชื่อมุมแบบสั้น ("จตุโกณ") — ตัดองศาในวงเล็บที่ข้อมูลใส่ไว้ */
function aspectShort(type: AspectType, lang: Lang): string {
  return ASPECT_TEXT[type].name[lang].replace(/\s*\(.*\)$/, "");
}

/** "ดาวเสาร์จร จตุโกณ ดวงอาทิตย์เกิด" */
function aspectTitle(a: { t: BodyId; n: BodyId; type: AspectType }, lang: Lang, tLabel: string): string {
  const isTh = lang === "th";
  const natal = bodyName(a.n, lang);
  // "กลางฟ้า (MC)" ต่อ "เกิด" ติดวงเล็บแล้วอ่านยาก ➔ เว้นวรรคเมื่อชื่อลงท้ายด้วยวงเล็บ
  return `${bodyName(a.t, lang)}${tLabel} ${aspectShort(a.type, lang)} ${natal}${isTh ? `${natal.endsWith(")") ? " " : ""}เกิด` : " (natal)"}`;
}

/** "ลัคนาของผังราศีสิงห์: ปีนี้คุณ..." ➔ แถวสรุป ป้ายซ้าย ข้อความขวา */
function splitHighlight(h: string): { label: string; text: string } {
  const i = h.indexOf(": ");
  return i < 0 ? { label: h, text: "" } : { label: h.slice(0, i), text: h.slice(i + 2) };
}

function AspectItem({ a, lang, zone, tLabel }: { a: TransitAspect; lang: Lang; zone?: string; tLabel: string }) {
  const isTh = lang === "th";
  const p = a.period;
  const text = describeTimedAspect(a.t, a.n, a.type, lang);
  return (
    <li className={toneClass(a.type)}>
      <span className="v2-nr-item-t">{aspectTitle(a, lang, tLabel)}</span>
      {text && <span className="v2-nr-item-d">{text}</span>}
      <span className="v2-nr-item-meta tabular-nums">
        {p
          ? `${isTh ? "มีผลช่วง " : "Active "}${p.openStart ? (isTh ? "ก่อน " : "before ") : ""}${fmtDate(p.start, lang, zone)} ${isTh ? "ถึง" : "to"} ${p.openEnd ? (isTh ? "หลัง " : "after ") : ""}${fmtDate(p.end, lang, zone)}${
              p.exact.length
                ? ` · ${isTh ? "ตรงพอดี" : "exact"} ${p.exact.map((x) => fmtDate(x, lang, zone)).join(", ")}`
                : ` · ${isTh ? "ใกล้สุด" : "closest"} ${fmtDate(p.closest.utcMs, lang, zone)}`
            }`
          : `orb ${formatDegree(a.orb)}${a.applying === null ? "" : a.applying ? (isTh ? " · กำลังเข้า" : " · applying") : isTh ? " · กำลังแยก" : " · separating"}`}
      </span>
    </li>
  );
}

function eventText(e: TransitEvent, lang: Lang): string {
  const isTh = lang === "th";
  const t = bodyName(e.t, lang);
  if (e.kind === "sign") return isTh ? `${t}ย้ายเข้า${signName(e.sign, lang)}` : `${t} enters ${signName(e.sign, lang)}`;
  if (e.kind === "house") return isTh ? `${t}ย้ายเข้าเรือน ${e.house} ของผังเกิด` : `${t} enters your natal house ${e.house}`;
  return isTh
    ? `${aspectTitle({ t: e.t, n: e.n, type: e.type }, lang, "")} ตรงพอดี${e.retrograde ? " (ขณะถอยหลัง)" : ""}`
    : `${t} ${aspectShort(e.type, lang)} natal ${bodyName(e.n, lang)}, exact${e.retrograde ? " (retrograde)" : ""}`;
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
    <div className="grid gap-2 grid-cols-[minmax(0,1fr)_auto] items-end">
      <div className="min-w-0">
        <label htmlFor={`nt-date-${mode}`} className={labelClass}>
          {mode === "lunar" ? (isTh ? "หาผังจันทร์คืนถัดจากวันที่" : "Next lunar return after") : isTh ? "ดูวันที่" : "Date"}
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
      <button type="button" onClick={() => setDateStr(todayInput())} className="min-h-[48px] rounded-full border border-line-warm bg-surface px-5 text-sm text-ink">
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
    const monthList = [...months.entries()];
    const strongest = [...slow].sort((x, y) => x.orb - y.orb)[0];
    const nextEvent = calendar.find((e) => e.utcMs >= atMs);
    const tLabel = isTh ? "จร" : " (transit)";
    const slowInHouses = chart.houses ? transit.bodies.filter((b) => SLOW_IDS.includes(b.id as MovingId) && b.id !== "node" && b.house) : [];
    const jupiterHouse = slowInHouses.find((b) => b.id === "jupiter");
    const summary = [
      strongest
        ? { label: isTh ? "เรื่องใหญ่ที่สุดช่วงนี้" : "Biggest theme now", text: `${aspectTitle(strongest, lang, tLabel)}: ${describeTimedAspect(strongest.t, strongest.n, strongest.type, lang)}` }
        : { label: isTh ? "เรื่องใหญ่ที่สุดช่วงนี้" : "Biggest theme now", text: isTh ? "ช่วงนี้ไม่มีดาวเดินช้าทำมุมใกล้กับจุดสำคัญในผังเกิด ชีวิตค่อนข้างนิ่ง" : "No slow planet is close to a key point in your chart, so life is fairly steady." },
      {
        label: isTh ? "ช่วงนี้มีกี่เรื่อง" : "How much is going on",
        text: isTh ? `เรื่องระยะยาว ${slow.length} เรื่อง (มีผลเป็นสัปดาห์ถึงเดือน) · เรื่องสั้นของวันนี้ ${fast.length} เรื่อง` : `${slow.length} long-running (weeks to months) and ${fast.length} quick ones for today`,
      },
      ...(jupiterHouse
        ? [{ label: isTh ? `โอกาสอยู่เรือน ${jupiterHouse.house}` : `Luck in house ${jupiterHouse.house}`, text: describeTransitHouse("jupiter", jupiterHouse.house!, lang) }]
        : []),
      ...(nextEvent ? [{ label: isTh ? "เหตุการณ์ถัดไป" : "Next event", text: `${fmtDate(nextEvent.utcMs, lang)} ${eventText(nextEvent, lang)}` }] : []),
    ];
    let n = 0;
    return (
      <div className="v2-nr space-y-6">
        <p className="v2-nr-lead">
          {isTh
            ? "ดาวบนฟ้าวันที่เลือก (วงนอก) ทับผังเกิดของคุณ (วงใน) บอกว่าช่วงนี้ชีวิตด้านไหนกำลังถูกกระตุ้น"
            : "The sky on the chosen date (outer ring) over your birth chart (inner), showing which parts of life are being stirred."}
        </p>
        <div className="v2-nr-controls">{dateField}</div>
        <SummaryBox title={isTh ? "สรุปช่วงนี้" : "This period at a glance"} rows={summary} />
        <NatalWheel chart={chart} lang={lang} focus={focus} onFocus={setFocus} showMinor={false} outer={{ bodies: transit.bodies, aspects: transit.aspects.map((a) => ({ a: a.t, b: a.n, type: a.type, orb: a.orb, maxOrb: a.maxOrb })) }} />
        <section className="v2-nr-sec">
          <SectionHead n={++n} title={isTh ? "เรื่องระยะยาว" : "Long-running transits"}>
            {isTh ? "ดาวเดินช้า มีผลเป็นสัปดาห์ถึงเดือน เส้นซ้ายสีน้ำเงินคือไหลลื่น สีแดงคือตึง" : "Slow planets, felt for weeks to months. Blue edge = flowing, red = tense."}
          </SectionHead>
          {slow.length ? (
            <ul className="v2-nr-items">
              {slow.map((a) => (
                <AspectItem key={`${a.t}-${a.n}`} a={a} lang={lang} tLabel={tLabel} />
              ))}
            </ul>
          ) : (
            <p className="v2-nr-lead">{isTh ? "ช่วงนี้ไม่มีดาวเดินช้าทำมุมตรงกับจุดสำคัญในผังเกิด" : "No slow planet is making a close aspect right now."}</p>
          )}
        </section>
        {fast.length > 0 && (
          <section className="v2-nr-sec">
            <SectionHead n={++n} title={isTh ? "เรื่องสั้นของวันนี้" : "Today's quick transits"}>
              {isTh ? "ดาวเดินเร็ว มีผลไม่กี่ชั่วโมงถึงไม่กี่วัน" : "Fast planets, felt for hours to a few days."}
            </SectionHead>
            <ul className="v2-nr-items">
              {fast.map((a) => (
                <AspectItem key={`${a.t}-${a.n}`} a={a} lang={lang} tLabel={tLabel} />
              ))}
            </ul>
          </section>
        )}
        {slowInHouses.length > 0 && (
          <section className="v2-nr-sec">
            <SectionHead n={++n} title={isTh ? "ดาวเดินช้าอยู่เรือนไหนของคุณ" : "Where the slow planets fall"}>
              {isTh ? "ด้านของชีวิตที่ดาวแต่ละดวงกำลังทำงานด้วย" : "The part of life each slow planet is working on."}
            </SectionHead>
            <ul className="v2-nr-items">
              {slowInHouses.map((b) => (
                <li key={b.id}>
                  <span className="v2-nr-item-t">{bodyName(b.id, lang)} {isTh ? `เรือน ${b.house}` : `house ${b.house}`}</span>
                  <span className="v2-nr-item-d">{describeTransitHouse(b.id, b.house!, lang)}</span>
                  <span className="v2-nr-item-meta">{isTh ? `อยู่นาน${TRANSIT_TEXT[b.id as keyof typeof TRANSIT_TEXT].span.th}` : `Lasts ${TRANSIT_TEXT[b.id as keyof typeof TRANSIT_TEXT].span.en}`}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="v2-nr-sec">
          <SectionHead n={++n} title={isTh ? "ปฏิทิน 12 เดือนข้างหน้า" : "The next 12 months"}>
            {isTh ? "วันที่ดาวเดินช้าทำมุมตรงพอดีหรือย้ายราศี/เรือน มีผลก่อนและหลังวันนั้นหลายสัปดาห์" : "Dates when slow planets hit your chart exactly or change sign/house; felt for weeks around each date."}
          </SectionHead>
          {calendar.length === 0 ? (
            <p className="v2-nr-lead">{isTh ? "ไม่มีเหตุการณ์สำคัญในช่วงนี้" : "No major events in this period."}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 items-start">
              {monthList.slice(0, 4).map(([month, evs]) => (
                <div key={month} className="v2-nr-box">
                  <p className="v2-nr-box-t">{month}</p>
                  <ul className="space-y-2">
                    {evs.map((e, i) => (
                      <li key={i} className="flex flex-col border-l-2 border-line-warm pl-3">
                        <span className="v2-nr-item-meta tabular-nums">{fmtDate(e.utcMs, lang)}</span>
                        <span className="v2-nr-item-d">{eventText(e, lang)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="v2-nr-deep">
          {monthList.length > 4 && (
            <details>
              <summary>
                {isTh ? `ปฏิทินเดือนที่เหลือ (${monthList.length - 4} เดือน)` : `Remaining months (${monthList.length - 4})`}
                <MoreLabel isTh={isTh} />
              </summary>
              <div className="grid gap-3 md:grid-cols-2">
                {monthList.slice(4).map(([month, evs]) => (
                  <div key={month}>
                    <p className="v2-nr-sub">{month}</p>
                    <ul className="space-y-2 pt-1">
                      {evs.map((e, i) => (
                        <li key={i} className="flex flex-col border-l-2 border-line-warm pl-3">
                          <span className="v2-nr-item-meta tabular-nums">{fmtDate(e.utcMs, lang)}</span>
                          <span className="v2-nr-item-d">{eventText(e, lang)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          )}
          <details>
            <summary>
              {isTh ? "ตำแหน่งดาวจรทั้งหมด" : "All transit positions"}
              <MoreLabel isTh={isTh} />
            </summary>
            <PositionsTable bodies={transit.bodies} lang={lang} houses={!!chart.houses} />
          </details>
        </div>
      </div>
    );
  }

  if (mode === "progress" && prog) {
    const pSun = prog.bodies.find((b) => b.id === "sun")!;
    const pMoon = prog.bodies.find((b) => b.id === "moon")!;
    const natalSun = chart.bodies.find((b) => b.id === "sun")!;
    const sunText =
      pSun.sign === natalSun.sign
        ? isTh
          ? `ยังอยู่ราศีเดียวกับตอนเกิด ตัวตนกำลังลึกซึ้งขึ้นในแบบ${SIGN_TEXT[pSun.sign].keywords.th}`
          : `Still in your birth sign, deepening a ${SIGN_TEXT[pSun.sign].keywords.en} identity.`
        : isTh
          ? `ตัวตนเติบโตออกจากราศีเกิด ไปทางคน${SIGN_TEXT[pSun.sign].keywords.th}`
          : `Your identity has grown beyond your birth sign toward being ${SIGN_TEXT[pSun.sign].keywords.en}.`;
    const summary = [
      {
        label: isTh ? `ใจช่วงนี้: ${signName(pMoon.sign, lang)}` : `Heart now: ${signName(pMoon.sign, lang)}`,
        text: isTh
          ? `ดวงจันทร์ก้าวหน้าอยู่${signName(pMoon.sign, lang)}${pMoon.house ? ` เรือน ${pMoon.house}` : ""} ช่วงนี้ใจคุณเอนไปทาง${SIGN_TEXT[pMoon.sign].keywords.th}`
          : `Progressed Moon in ${signName(pMoon.sign, lang)}${pMoon.house ? `, house ${pMoon.house}` : ""}: right now your heart leans toward being ${SIGN_TEXT[pMoon.sign].keywords.en}.`,
      },
      { label: isTh ? `ตัวตน: ${signName(pSun.sign, lang)}` : `Identity: ${signName(pSun.sign, lang)}`, text: sunText },
      { label: isTh ? "จังหวะชีวิต" : "Life rhythm", text: `${MOON_PHASE_TEXT[prog.moonPhase.phase].name[lang]}: ${PROG_PHASE_TEXT[prog.moonPhase.phase][lang]}` },
    ];
    return (
      <div className="v2-nr space-y-6">
        <p className="v2-nr-lead">
          {isTh
            ? "ดาวก้าวหน้าใช้หลัก 1 วันหลังเกิด = 1 ปีของชีวิต บอกว่าข้างในคุณค่อย ๆ เปลี่ยนไปทางไหน"
            : "Progressions use one day after birth for each year of life, showing how you are slowly changing inside."}
        </p>
        <div className="v2-nr-controls">
          {dateField}
          <p className="v2-nr-note tabular-nums">
            {isTh ? `อายุ ${prog.age.toFixed(1)} ปี · Solar Arc ${prog.solarArc.toFixed(2)} องศา` : `Age ${prog.age.toFixed(1)} · solar arc ${prog.solarArc.toFixed(2)} degrees`}
          </p>
        </div>
        <SummaryBox title={isTh ? "สรุปช่วงชีวิตนี้" : "This chapter at a glance"} rows={summary} />
        <NatalWheel chart={chart} lang={lang} focus={focus} onFocus={setFocus} showMinor={false} outer={{ bodies: prog.bodies, aspects: prog.aspects.map((a) => ({ a: a.t, b: a.n, type: a.type, orb: a.orb, maxOrb: a.maxOrb })) }} />
        <section className="v2-nr-sec">
          <SectionHead n={1} title={isTh ? "อารมณ์ของช่วงชีวิตนี้" : "The mood of this chapter"}>
            {isTh ? "ดวงจันทร์ก้าวหน้าย้ายราศีทุกราว 2 ปีครึ่ง" : "The progressed Moon changes sign about every two and a half years."}
          </SectionHead>
          <div className="v2-nr-box">
            <p className="v2-nr-item-d">{MOON_SIGN_TEXT[pMoon.sign][lang]}</p>
          </div>
        </section>
        <section className="v2-nr-sec">
          <SectionHead n={2} title={isTh ? "เรื่องที่กำลังสุกงอม" : "What is ripening"}>
            {isTh ? "มุมของดาวก้าวหน้ากับผังเกิด (orb 1 องศา) แต่ละมุมมีผลราว 1 ถึง 2 ปี" : "Progressed aspects to your birth chart (1 degree orb), each felt for a year or two."}
          </SectionHead>
          {prog.aspects.length ? (
            <ul className="v2-nr-items">
              {prog.aspects.map((a) => (
                <li key={`${a.t}-${a.n}`} className={toneClass(a.type)}>
                  <span className="v2-nr-item-t">{aspectTitle(a, lang, isTh ? "ก้าวหน้า" : " (progressed)")}</span>
                  <span className="v2-nr-item-d">
                    {/* ดาวก้าวหน้าเป็นพัฒนาการระยะยาว — ห้ามใช้ประโยคดาวจร ("อารมณ์ของวันนี้") */}
                    {isTh
                      ? `${BODY_TEXT[a.t].noun.th}ที่พัฒนามาถึงตอนนี้ ${ASPECT_TEXT[a.type].meaning.th} กับ${BODY_TEXT[a.n].noun.th}ตั้งแต่เกิด`
                      : `Your developing ${BODY_TEXT[a.t].noun.en} and your natal ${BODY_TEXT[a.n].noun.en}: ${ASPECT_TEXT[a.type].meaning.en}.`}
                  </span>
                  <span className="v2-nr-item-meta tabular-nums">orb {formatDegree(a.orb)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="v2-nr-lead">{isTh ? "ช่วงนี้ไม่มีดาวก้าวหน้าทำมุมตรงกับผังเกิด" : "No progressed aspects are exact right now."}</p>
          )}
        </section>
        <div className="v2-nr-deep">
          <details>
            <summary>
              {isTh ? "ตำแหน่งดาวก้าวหน้าทั้งหมด" : "All progressed positions"}
              <MoreLabel isTh={isTh} />
            </summary>
            <PositionsTable bodies={prog.bodies} lang={lang} houses={!!chart.houses} />
          </details>
        </div>
      </div>
    );
  }

  if ((mode === "solar" || mode === "lunar") && ret) {
    const highlights = returnHighlights(ret, mode, lang).map(splitHighlight);
    const maxYear = Math.min(2100, meta.birthYear + 110);
    return (
      <div className="v2-nr space-y-6">
        <p className="v2-nr-lead">
          {mode === "solar"
            ? isTh
              ? "ผังของขณะที่ดวงอาทิตย์กลับมาที่องศาเดิมตอนคุณเกิด บอกธีมของปีตั้งแต่วันเกิดปีนี้ถึงปีหน้า"
              : "The chart for the moment the Sun returns to its birth degree, describing the year from this birthday to the next."
            : isTh
              ? "ผังของขณะที่ดวงจันทร์กลับมาที่องศาเดิมตอนคุณเกิด (ทุกราว 27 วัน) บอกบรรยากาศใจของเดือนนั้น"
              : "The chart for the moment the Moon returns to its birth degree (about every 27 days), describing that month's emotional tone."}
        </p>
        {!chart.input.timeKnown && (
          <p className="v2-nr-item-d border-l-2 border-gold-ink pl-3">
            {isTh
              ? "ไม่ทราบเวลาเกิด: เวลาของผังนี้อาจคลาดได้ถึงครึ่งวัน ลัคนาและเรือนจึงยังเชื่อไม่ได้"
              : "Birth time unknown: this chart's time may be off by up to half a day, so its Ascendant and houses are not reliable."}
          </p>
        )}
        <div className="v2-nr-controls">
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
          <p className="v2-nr-note">
            {isTh ? "ขณะของผัง " : "Chart moment: "}
            <span className="tabular-nums">
              {fmtDate(ret.input.utcMs, lang, where.zone, true)}
              {where.zone ? "" : " UTC"}
            </span>
            {mode === "solar" &&
              (isTh
                ? " (อาจตรงกับวันก่อนหรือหลังวันเกิดหนึ่งวัน เพราะปีหนึ่งยาวไม่เท่ากับจำนวนวันเต็มพอดี)"
                : " (it can fall a day before or after your birthday because a year is not a whole number of days)")}
          </p>
        </div>
        <SummaryBox
          title={mode === "solar" ? (isTh ? "ธีมของปี" : "Themes of the year") : isTh ? "บรรยากาศของเดือน" : "Mood of the month"}
          rows={highlights.map((h) => ({ label: h.label, text: h.text }))}
        />
        <NatalWheel chart={ret} lang={lang} focus={focus} onFocus={setFocus} showMinor={false} />
        <div className="v2-nr-deep">
          <details>
            <summary>
              {isTh ? "ตำแหน่งดาวของผังนี้" : "Positions in this chart"}
              <MoreLabel isTh={isTh} />
            </summary>
            <PositionsTable bodies={ret.bodies.filter((b) => [...SLOW_IDS, "sun", "moon", "mercury", "venus", "mars", "asc", "mc"].includes(b.id as MovingId))} lang={lang} houses={!!ret.houses} houseLabel={isTh ? "เรือน" : "House"} />
          </details>
        </div>
      </div>
    );
  }
  return null;
}
