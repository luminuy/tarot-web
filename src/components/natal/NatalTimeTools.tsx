"use client";

import { useMemo, useState } from "react";
import { BODY_TEXT, HOUSE_TEXT, MOON_SIGN_TEXT, MOON_PHASE_TEXT, PROG_PHASE_TEXT, ASPECT_TEXT, SIGN_TEXT, TRANSIT_TEXT, type Lang } from "@/data/natal/content";
import { THAI_PROVINCES, WORLD_CITIES } from "@/data/natal/places";
import { ASPECT_DEFS, formatDegree, type AspectType, type BodyId, type BodyPosition, type NatalChart } from "@/lib/astro/natal";
import { bodyName, describeTimedAspect, describeTransitHouse, signName, thw } from "@/lib/astro/natal-text";
import { returnReading, type ReturnMonth } from "@/lib/astro/return-reading";
import { transitExactNote } from "@/lib/astro/strength";
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

function toneOf(type: AspectType): "harmonious" | "tense" | "neutral" {
  return ASPECT_DEFS.find((d) => d.type === type)?.tone ?? "neutral";
}

/** สีเส้นซ้ายของการ์ดตามโทนมุม (ชุดเดียวกับเส้นบนวงผัง) */
function toneClass(type: AspectType): string {
  return `is-${toneOf(type)}`;
}

/**
 * ความหมายของมุมดาวก้าวหน้า (มุมหลัก 5 แบบ) — เป็นพัฒนาการระยะ 1 ถึง 2 ปี ไม่ใช่อารมณ์รายวันแบบดาวจร
 * เจ้าของ 2026-11-02 "ตอบชัด ตรงประเด็น" ➔ บอกผลของมุมแต่ละแบบตรง ๆ แทนความหมายกลางของมุม
 */
const PROG_ASPECT_TEXT: Partial<Record<AspectType, { th: string; en: string }>> = {
  conjunction: { th: "สองเรื่องนี้มาบรรจบกันพอดี เรื่องนี้กำลังเปิดบทใหม่ในชีวิตคุณ และเด่นชัดกว่าช่วงอื่น", en: "The two meet exactly: this part of your life is opening a new chapter and stands out more than usual." },
  trine: { th: "สองเรื่องนี้หนุนกัน สิ่งที่คุณสร้างไว้ให้ผลง่ายขึ้น ใช้จังหวะนี้ต่อยอด", en: "They support each other: what you have built pays off more easily. Build on it now." },
  sextile: { th: "สองเรื่องนี้เปิดโอกาสให้กัน แต่โอกาสจะเกิดเมื่อคุณเป็นฝ่ายเริ่มก่อน", en: "They open doors for each other, but only once you make the first move." },
  square: { th: "สองเรื่องนี้ขัดกัน วิธีเดิมที่เคยได้ผลกำลังใช้ไม่ได้ ปรับวิธีแล้วคุณจะโตขึ้นชัดเจน", en: "They clash: an approach that used to work has stopped working. Change it and you will grow noticeably." },
  opposition: { th: "สองเรื่องนี้ดึงกันคนละทาง และมาถึงคุณผ่านคนใกล้ตัว หาทางให้ทั้งสองด้านอยู่ด้วยกันได้", en: "They pull in opposite directions, and it reaches you through someone close. Find a way for both sides to coexist." },
};

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

/** เดือนสำคัญของผังวันเกิดปีนี้: "มี.ค. 2570 ดาวเสาร์จร… ตรงพอดี และ…" */
function monthText(m: ReturnMonth, lang: Lang, zone?: string): string {
  const month = new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-GB", { month: "long", year: "numeric", ...(zone ? { timeZone: zone } : {}) }).format(new Date(m.utcMs));
  return `${month}: ${m.events.slice(0, 3).map((e) => eventText(e, lang)).join(lang === "th" ? " และ " : "; ")}`;
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
          : `${transitExactNote(a.orb, lang) ? `${transitExactNote(a.orb, lang)} · ` : ""}orb ${formatDegree(a.orb)}${a.applying === null ? "" : a.applying ? (isTh ? " · กำลังแรงขึ้น" : " · building") : isTh ? " · กำลังคลายลง" : " · easing"}`}
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
  // ผังปีสแกนปฏิทินดาวเดินช้า 365 วันหาเดือนสำคัญ (~0.2 วินาที) ➔ คำนวณเมื่อผังเปลี่ยนเท่านั้น
  const reading = useMemo(() => (ret && (mode === "solar" || mode === "lunar") ? returnReading(chart, ret, mode, lang) : null), [chart, ret, mode, lang]);

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
    /* เรื่องระยะยาวแยกตามโทน ➔ บอกตรง ๆ ว่าช่วงนี้แรงกดดันหรือแรงหนุนมากกว่า และควรทำอะไร */
    const hard = slow.filter((a) => toneOf(a.type) === "tense").length;
    const soft = slow.filter((a) => toneOf(a.type) === "harmonious").length;
    const even = slow.length - hard - soft;
    const mix = (
      isTh
        ? [hard ? `ตึง ${hard}` : "", soft ? `ไหลลื่น ${soft}` : "", even ? `เข้มข้น ${even}` : ""]
        : [hard ? `${hard} tense` : "", soft ? `${soft} flowing` : "", even ? `${even} intense` : ""]
    )
      .filter(Boolean)
      .join(" · ");
    const pace =
      hard > soft
        ? isTh
          ? "ช่วงนี้แรงกดดันมากกว่าแรงหนุน ทำทีละเรื่อง และอย่ารับภาระใหม่เพิ่ม"
          : "More pressure than support right now: take one thing at a time and do not take on new commitments."
        : soft > hard
          ? isTh
            ? "ช่วงนี้แรงหนุนมากกว่าแรงกดดัน เป็นจังหวะที่ดีสำหรับเริ่มเรื่องใหม่"
            : "More support than pressure right now: a good time to start something new."
          : hard
            ? isTh
              ? "แรงหนุนกับแรงกดดันพอ ๆ กัน ลงมือเรื่องที่ไหลลื่นก่อน แล้วค่อยแก้เรื่องที่ตึง"
              : "Support and pressure are even: act first on what flows, then work through what is tense."
            : isTh
              ? "ดาวเดินช้ากำลังทับจุดในผังของคุณโดยตรง เรื่องนั้นจะเด่นชัดกว่าเรื่องอื่น ให้ความสำคัญกับมันก่อน"
              : "Slow planets sit right on points in your chart, so those areas stand out. Give them your attention first.";
    const lasts = strongest?.period
      ? isTh
        ? ` มีผล${strongest.period.openEnd ? "เกิน" : "ถึง"} ${fmtDate(strongest.period.end, lang)}`
        : ` Lasts ${strongest.period.openEnd ? "past" : "until"} ${fmtDate(strongest.period.end, lang)}.`
      : "";
    const summary = [
      strongest
        ? { label: isTh ? "เรื่องใหญ่ที่สุดช่วงนี้" : "Biggest theme now", text: `${aspectTitle(strongest, lang, tLabel)}: ${describeTimedAspect(strongest.t, strongest.n, strongest.type, lang)}${lasts}` }
        : {
            label: isTh ? "เรื่องใหญ่ที่สุดช่วงนี้" : "Biggest theme now",
            text: isTh
              ? "ช่วงนี้ไม่มีดาวเดินช้าแตะจุดสำคัญในผังเกิด ไม่มีแรงผลักใหญ่จากฟ้า ใช้ช่วงนี้ทำเรื่องที่วางแผนไว้ให้เสร็จ"
              : "No slow planet is touching a key point in your chart. There is no big outside push, so use this time to finish what you planned.",
          },
      {
        label: isTh ? "ช่วงนี้มีกี่เรื่อง" : "How much is going on",
        text: slow.length
          ? isTh
            ? `เรื่องระยะยาว ${slow.length} เรื่อง (${mix}) · เรื่องสั้นของวันนี้ ${fast.length} เรื่อง ${pace}`
            : `${slow.length} long-running (${mix}) and ${fast.length} quick ones today. ${pace}`
          : isTh
            ? `ไม่มีเรื่องระยะยาว · เรื่องสั้นของวันนี้ ${fast.length} เรื่อง`
            : `No long-running transits; ${fast.length} quick ones today.`,
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
            ? "วงนอกคือดาวบนฟ้าวันที่เลือก วงในคือผังเกิดของคุณ หน้านี้บอกว่าช่วงนี้เรื่องไหนในชีวิตถูกกระตุ้น และควรรับมืออย่างไร"
            : "Outer ring: the sky on the chosen date. Inner ring: your birth chart. This shows which parts of your life are stirred now, and how to handle them."}
        </p>
        <div className="v2-nr-controls">{dateField}</div>
        <SummaryBox title={isTh ? "สรุปช่วงนี้" : "This period at a glance"} rows={summary} />
        <NatalWheel chart={chart} lang={lang} focus={focus} onFocus={setFocus} showMinor={false} outer={{ bodies: transit.bodies, aspects: transit.aspects.map((a) => ({ a: a.t, b: a.n, type: a.type, orb: a.orb, maxOrb: a.maxOrb })) }} />
        <section className="v2-nr-sec">
          <SectionHead n={++n} title={isTh ? "เรื่องระยะยาว" : "Long-running transits"}>
            {isTh
              ? "ดาวเดินช้า มีผลเป็นสัปดาห์ถึงเดือน ใช้วางแผนเรื่องใหญ่ เส้นซ้ายสีน้ำเงินคือจังหวะให้ลงมือ สีแดงคือเรื่องที่ต้องรับมือ"
              : "Slow planets, felt for weeks to months; use them to plan big moves. Blue edge = time to act, red = something to handle."}
          </SectionHead>
          {slow.length ? (
            <ul className="v2-nr-items">
              {slow.map((a) => (
                <AspectItem key={`${a.t}-${a.n}`} a={a} lang={lang} tLabel={tLabel} />
              ))}
            </ul>
          ) : (
            <p className="v2-nr-lead">
              {isTh
                ? "ช่วงนี้ไม่มีดาวเดินช้าแตะจุดสำคัญในผังเกิด ไม่มีเรื่องใหญ่ที่ต้องรับมือ เดินตามแผนเดิมต่อได้เลย"
                : "No slow planet is touching a key point in your chart right now. Nothing big to handle; carry on with your plans."}
            </p>
          )}
        </section>
        {fast.length > 0 && (
          <section className="v2-nr-sec">
            <SectionHead n={++n} title={isTh ? "เรื่องสั้นของวันนี้" : "Today's quick transits"}>
              {isTh ? "ดาวเดินเร็ว มีผลไม่กี่ชั่วโมงถึงไม่กี่วัน ใช้เลือกจังหวะของเรื่องเล็กในวันนี้" : "Fast planets, felt for hours to a few days. Use them to time small things today."}
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
              {isTh ? "เรื่องในชีวิตที่ดาวแต่ละดวงกำลังทำงานอยู่ และจะอยู่อีกนานแค่ไหน" : "The part of life each slow planet is working on, and for how long."}
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
            {isTh
              ? "วันที่ดาวเดินช้าแตะผังของคุณตรงพอดี หรือย้ายราศี/เรือน ผลเริ่มก่อนวันนั้นและอยู่ต่อหลายสัปดาห์ จดวันไว้วางแผนเรื่องใหญ่"
              : "Dates when slow planets hit your chart exactly or change sign/house. The effect starts weeks before and lasts weeks after; mark them when planning big things."}
          </SectionHead>
          {calendar.length === 0 ? (
            <p className="v2-nr-lead">{isTh ? "ไม่มีเหตุการณ์สำคัญใน 12 เดือนข้างหน้า" : "No major events in the next 12 months."}</p>
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
          ? `ยังอยู่ราศีเดียวกับตอนเกิด ช่วงนี้ความเป็นคน${SIGN_TEXT[pSun.sign].keywords.th}ของคุณชัดและลึกขึ้นกว่าเดิม`
          : `Still in your birth sign: your ${SIGN_TEXT[pSun.sign].keywords.en} nature is growing clearer and deeper.`
        : isTh
          ? `ตัวตนของคุณเติบโตออกจากราศีเกิดแล้ว ตอนนี้คุณเป็นคน${SIGN_TEXT[pSun.sign].keywords.th}มากกว่าเดิม`
          : `Your identity has grown past your birth sign: you are now more ${SIGN_TEXT[pSun.sign].keywords.en} than before.`;
    const summary = [
      {
        label: isTh ? `ใจช่วงนี้: ${signName(pMoon.sign, lang)}` : `Heart now: ${signName(pMoon.sign, lang)}`,
        text: isTh
          ? `ดวงจันทร์ก้าวหน้าอยู่${signName(pMoon.sign, lang)}${pMoon.house ? ` เรือน ${pMoon.house}` : ""} ช่วงนี้คุณรู้สึกและตอบสนองแบบคน${SIGN_TEXT[pMoon.sign].keywords.th}${pMoon.house ? ` และใจจดจ่ออยู่กับเรื่อง${HOUSE_TEXT[pMoon.house - 1].arena.th}` : ""}`
          : `Progressed Moon in ${signName(pMoon.sign, lang)}${pMoon.house ? `, house ${pMoon.house}` : ""}: right now your feelings and reactions are ${SIGN_TEXT[pMoon.sign].keywords.en}${pMoon.house ? `, and your heart is focused on ${HOUSE_TEXT[pMoon.house - 1].arena.en}` : ""}.`,
      },
      { label: isTh ? `ตัวตน: ${signName(pSun.sign, lang)}` : `Identity: ${signName(pSun.sign, lang)}`, text: sunText },
      { label: isTh ? "จังหวะชีวิต" : "Life rhythm", text: `${MOON_PHASE_TEXT[prog.moonPhase.phase].name[lang]}: ${PROG_PHASE_TEXT[prog.moonPhase.phase][lang]}` },
    ];
    return (
      <div className="v2-nr space-y-6">
        <p className="v2-nr-lead">
          {isTh
            ? "ดาวก้าวหน้าใช้หลัก 1 วันหลังเกิด = 1 ปีของชีวิต บอกว่าตอนนี้ข้างในคุณเปลี่ยนไปถึงไหนแล้ว และเรื่องไหนกำลังสุกงอม"
            : "Progressions count one day after birth as one year of life. They show how far you have changed inside and what is ripening now."}
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
            {isTh
              ? "ดวงจันทร์ก้าวหน้าย้ายราศีทุกราว 2 ปีครึ่ง ข้อความนี้คือสิ่งที่ใจคุณต้องการในช่วงนี้"
              : "The progressed Moon changes sign about every two and a half years. This is what your heart needs in this stretch."}
          </SectionHead>
          <div className="v2-nr-box">
            <p className="v2-nr-item-d">{MOON_SIGN_TEXT[pMoon.sign][lang]}</p>
          </div>
        </section>
        <section className="v2-nr-sec">
          <SectionHead n={2} title={isTh ? "เรื่องที่กำลังสุกงอม" : "What is ripening"}>
            {isTh
              ? "มุมของดาวก้าวหน้ากับผังเกิด (orb 1 องศา) แต่ละข้อคือเรื่องที่เห็นผลภายใน 1 ถึง 2 ปีนี้"
              : "Progressed aspects to your birth chart (1 degree orb). Each one plays out over the next year or two."}
          </SectionHead>
          {prog.aspects.length ? (
            <ul className="v2-nr-items">
              {prog.aspects.map((a) => (
                <li key={`${a.t}-${a.n}`} className={toneClass(a.type)}>
                  <span className="v2-nr-item-t">{aspectTitle(a, lang, isTh ? "ก้าวหน้า" : " (progressed)")}</span>
                  <span className="v2-nr-item-d">
                    {/* ดาวก้าวหน้าเป็นพัฒนาการระยะยาว — ห้ามใช้ประโยคดาวจร ("อารมณ์ของวันนี้") */}
                    {isTh
                      ? `${thw(BODY_TEXT[a.t].noun.th)}ที่พัฒนามาถึงตอนนี้ กับ${thw(BODY_TEXT[a.n].noun.th)}ตั้งแต่เกิด: ${PROG_ASPECT_TEXT[a.type]?.th ?? ASPECT_TEXT[a.type].meaning.th}`
                      : `Your developing ${BODY_TEXT[a.t].noun.en} and your natal ${BODY_TEXT[a.n].noun.en}: ${PROG_ASPECT_TEXT[a.type]?.en ?? `${ASPECT_TEXT[a.type].meaning.en}.`}`}
                  </span>
                  <span className="v2-nr-item-meta tabular-nums">orb {formatDegree(a.orb)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="v2-nr-lead">
              {isTh
                ? "ช่วงนี้ไม่มีดาวก้าวหน้าทำมุมตรงกับผังเกิด ไม่มีเรื่องใดกำลังสุกงอมเป็นพิเศษ ให้ดูอารมณ์ของช่วงชีวิตด้านบนเป็นหลัก"
                : "No progressed aspects are exact right now, so nothing is coming to a head. Go by the mood of this chapter above."}
            </p>
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

  if ((mode === "solar" || mode === "lunar") && ret && reading) {
    const rows = [
      ...reading.rows,
      ...(reading.heavyMonth
        ? [{ label: isTh ? "เดือนที่หนักที่สุดของปี" : "The heaviest month", text: `${monthText(reading.heavyMonth, lang, where.zone)} ${isTh ? "ปิดงานใหญ่ให้เสร็จก่อนเดือนนี้ และอย่าเริ่มเรื่องเสี่ยงในเดือนนี้" : "Finish big tasks before it and do not start risky ventures during it."}` }]
        : []),
      ...(reading.liftMonth
        ? [{ label: isTh ? "เดือนที่มีแรงหนุนมากที่สุด" : "The best-supported month", text: `${monthText(reading.liftMonth, lang, where.zone)} ${isTh ? "ใช้เดือนนี้เริ่มเรื่องใหม่ ยื่นขอ หรือเปิดตัว" : "Use it to start something new, apply or launch."}` }]
        : []),
    ];
    const maxYear = Math.min(2100, meta.birthYear + 110);
    return (
      <div className="v2-nr space-y-6">
        <p className="v2-nr-lead">
          {mode === "solar"
            ? isTh
              ? "ผังของนาทีที่ดวงอาทิตย์กลับมาที่องศาเดิมตอนคุณเกิด ใช้อ่านปีของคุณตั้งแต่วันเกิดปีนี้ถึงวันเกิดปีหน้า แถวแรกของสรุปคือเรื่องที่ควรทุ่มแรงมากที่สุด"
              : "The chart for the minute the Sun returns to its birth degree. It reads your year from this birthday to the next; the first row of the summary is where to put the most effort."
            : isTh
              ? "ผังของนาทีที่ดวงจันทร์กลับมาที่องศาเดิมตอนคุณเกิด (ทุกราว 27 วัน) ใช้อ่านเดือนของคุณ แถวแรกของสรุปคือเรื่องที่ใจคุณจดจ่อที่สุด"
              : "The chart for the minute the Moon returns to its birth degree (about every 27 days). It reads your month; the first row of the summary is what your heart is most focused on."}
        </p>
        {!chart.input.timeKnown && (
          <p className="v2-nr-item-d border-l-2 border-gold-ink pl-3">
            {isTh
              ? "ไม่ทราบเวลาเกิด: เวลาของผังนี้คลาดได้ถึงครึ่งวัน สรุปด้านล่างอิงลัคนาและเรือนทั้งหมด จึงยังใช้ไม่ได้จนกว่าจะรู้เวลาเกิด"
              : "Birth time unknown: this chart's time can be off by up to half a day. The summary below depends on the Ascendant and houses, so do not rely on it until you know your birth time."}
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
                ? " (ตรงกับวันก่อนหรือหลังวันเกิดได้หนึ่งวัน เพราะหนึ่งปีไม่ได้ยาวเป็นจำนวนวันเต็ม)"
                : " (it can fall a day before or after your birthday because a year is not a whole number of days)")}
          </p>
        </div>
        {reading.verdict && (
          <div className="v2-nr-lead">
            <p className="v2-nr-lead-k">{mode === "solar" ? (isTh ? "ปีนี้ของคุณในประโยคเดียว" : "Your year in one line") : isTh ? "เดือนนี้ของคุณในประโยคเดียว" : "Your month in one line"}</p>
            <p className="v2-nr-lead-t">{reading.verdict.title}</p>
            <p className="v2-nr-note">{reading.verdict.why}</p>
          </div>
        )}
        <SummaryBox title={mode === "solar" ? (isTh ? "ธีมของปี" : "Themes of the year") : isTh ? "บรรยากาศของเดือน" : "Mood of the month"} rows={rows} />
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
