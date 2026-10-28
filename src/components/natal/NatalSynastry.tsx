"use client";

import { useEffect, useMemo, useState } from "react";
import { ZODIAC_ASPECTS, zodiacDistance } from "@/data/zodiac-compat";
import { BODY_TEXT, HOUSE_TEXT, SIGN_TEXT, SYN_ASPECT_MEANING, SYN_CATEGORY_TEXT, ASPECT_TEXT, type Lang } from "@/data/natal/content";
import { THAI_PROVINCES } from "@/data/natal/places";
import { ASPECT_DEFS, formatDegree, type AspectType, type BodyId, type NatalChart } from "@/lib/astro/natal";
import { bodyName, describeOverlay, describeSynAspect, signName } from "@/lib/astro/natal-text";
import { buildChart, type ChartSpec } from "@/lib/astro/chart-spec";
import { loadSavedCharts, type SavedChart, type SavedPlace } from "@/lib/astro/saved-charts";
import { computeSynastry, type SynCategory } from "@/lib/astro/synastry";

const SYN_KEYS: readonly SynCategory[] = ["bond", "attraction", "talk", "stability", "growth"];
import { CitySearch, type PickedCity } from "./CitySearch";
import { NatalWheel } from "./NatalWheel";
import { MoreLabel, SectionHead, SummaryBox } from "./NatalUi";
import type { NatalMeta } from "./NatalChartApp";

/**
 * 💞 แท็บผังคู่ — เลือกอีกคนจากผังที่บันทึกไว้ หรือกรอกข้อมูลเกิดของอีกคน
 * โหลดแบบ lazy เมื่อกดแท็บ · คำนวณในเครื่อง · ข้อมูลของอีกคนไม่ถูกบันทึกเว้นแต่ผู้ใช้บันทึกผังนั้นเองจากฟอร์มหลัก
 */

/* ช่องกรอก 16px กัน iPhone ซูมตอนแตะ (แผน UI 2.0 ข้อ 5.2) · ชุดเดียวกับฟอร์มหลัก */
const fieldClass =
  "glass-field w-full min-h-[48px] rounded-xl border border-line-interactive-warm px-3 py-2.5 text-base font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors";
const labelClass = "block text-sm font-serif-th font-semibold text-ink mb-1";

/** ดาวส่วนตัวที่แสดงในหน้าหลักของ "ดาวตกเรือนไหน" — ที่เหลืออยู่ในข้อมูลละเอียด */
const PERSONAL: readonly BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "asc"];
/** มุมระหว่างผังที่โชว์ก่อนพับ */
const TOP_ASPECTS = 6;

const toneOf = (type: AspectType) => ASPECT_DEFS.find((d) => d.type === type)?.tone ?? "neutral";
const shortAspect = (type: AspectType, lang: Lang) => ASPECT_TEXT[type].name[lang].replace(/\s*\(.*\)$/, "");

export default function NatalSynastry({ chart, lang, meta }: { chart: NatalChart; lang: Lang; meta: NatalMeta }) {
  const isTh = lang === "th";
  const aName = meta.name || (isTh ? "คุณ" : "You");
  const [saved, setSaved] = useState<SavedChart[]>([]);
  useEffect(() => setSaved(loadSavedCharts()), []);
  const [bName, setBName] = useState("");
  const [dateStr, setDateStr] = useState("1995-01-01");
  const [timeStr, setTimeStr] = useState("12:00");
  const [timeKnown, setTimeKnown] = useState(true);
  const [placeMode, setPlaceMode] = useState<"thai" | "world">("thai");
  const [thaiId, setThaiId] = useState(THAI_PROVINCES[0].id);
  const [city, setCity] = useState<PickedCity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<{ chart: NatalChart; name: string } | null>(null);
  const [focus, setFocus] = useState<BodyId | null>(null);

  const syn = useMemo(() => (partner ? computeSynastry(chart, partner.chart) : null), [chart, partner]);

  /** ความเข้ากันกับทุกคนที่บันทึกไว้ (ไม่นับผังของตัวเอง) — เรียงจากคะแนนเฉลี่ย 5 หมวด */
  const ranked = useMemo(() => {
    const out: { c: SavedChart; overall: number; best: (typeof SYN_KEYS)[number] }[] = [];
    for (const c of saved) {
      try {
        const other = buildChart({ ...c, zodiac: chart.input.zodiac });
        if (other.input.utcMs === chart.input.utcMs && other.input.lat === chart.input.lat && other.input.lon === chart.input.lon) continue;
        const cats = computeSynastry(chart, other).categories;
        const overall = cats.reduce((a, x) => a + x.score, 0) / cats.length;
        const best = [...cats].sort((a, b) => b.score - a.score)[0].key;
        out.push({ c, overall: Math.round(overall * 10) / 10, best });
      } catch {
        // ผังที่บันทึกเสีย (ค่าผิดช่วง) — ข้าม ไม่เดาค่า
      }
    }
    return out.sort((a, b) => b.overall - a.overall);
  }, [saved, chart]);

  function applySpec(spec: ChartSpec, name: string) {
    setError(null);
    try {
      // อีกคนใช้ระบบราศีเดียวกับผังของเราเสมอ (ผังที่บันทึกไว้อาจตั้งต่างกัน)
      setPartner({ chart: buildChart({ ...spec, zodiac: chart.input.zodiac }), name: name || (isTh ? "อีกคน" : "Partner") });
    } catch {
      setError(isTh ? "คำนวณผังของอีกคนไม่สำเร็จ กรุณาโหลดหน้าใหม่อีกครั้ง" : "Could not calculate the other chart. Please reload the page.");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    if (!y || y < 1900 || y > 2100 || !m || !d) {
      setError(isTh ? "กรุณาใส่วันเกิดระหว่าง ค.ศ. 1900 ถึง 2100" : "Please enter a birth date between 1900 and 2100.");
      return;
    }
    let place: SavedPlace;
    if (placeMode === "world") {
      if (!city) {
        setError(isTh ? "ค้นหาแล้วเลือกเมืองเกิดของอีกคนก่อน" : "Search and pick the other person's birth city first.");
        return;
      }
      place = { mode: "world", label: city.label, labelEn: city.labelEn, lat: city.lat, lon: city.lon, zone: city.zone };
    } else {
      const p = THAI_PROVINCES.find((x) => x.id === thaiId)!;
      place = { mode: "thai", label: p.th, labelEn: p.en, lat: p.lat, lon: p.lon, zone: p.zone, refId: p.id };
    }
    applySpec(
      {
        name: bName.trim().slice(0, 40),
        day: d,
        month: m,
        yearCe: y,
        hour: hh || 0,
        minute: mm || 0,
        timeKnown,
        place,
        houseSystem: chart.input.houseSystem,
        nodeType: chart.input.nodeType,
        orbScale: chart.input.orbScale,
      },
      bName.trim(),
    );
  }

  const get = (c: NatalChart, id: BodyId) => c.bodies.find((b) => b.id === id);

  /* สรุปบนสุด — คำนวณจากผลที่มีอยู่แล้ว (คะแนน 5 หมวด · มุมเรียงตามน้ำหนัก · ดาวของอีกคนในเรือนของเรา) ไม่ใช้ AI */
  const summary = (() => {
    if (!partner || !syn) return [];
    const pName = partner.name;
    const cats = [...syn.categories].sort((x, y) => y.score - x.score);
    const overall = syn.categories.reduce((t, c) => t + c.score, 0) / syn.categories.length;
    const verdict = isTh
      ? overall >= 7
        ? "เข้ากันดีมาก"
        : overall >= 5.5
          ? "เข้ากันดี"
          : overall >= 4.5
            ? "กลาง ๆ ต้องปรับเข้าหากันบ้าง"
            : "ต่างกันมาก ต้องใช้ความเข้าใจกันสูง"
      : overall >= 7
        ? "A very easy match"
        : overall >= 5.5
          ? "A good match"
          : overall >= 4.5
            ? "Middle ground, some adjusting needed"
            : "Very different, needs a lot of understanding";
    const best = cats[0];
    const weak = cats[cats.length - 1];
    const rows: { label: string; text: React.ReactNode }[] = [
      {
        label: isTh ? `โดยรวม ${overall.toFixed(1)}/10` : `Overall ${overall.toFixed(1)}/10`,
        text: isTh
          ? `${verdict} เด่นเรื่อง${SYN_CATEGORY_TEXT[best.key].name.th} ส่วนเรื่อง${SYN_CATEGORY_TEXT[weak.key].name.th}ต้องดูแลมากกว่า`
          : `${verdict}. Strongest in ${SYN_CATEGORY_TEXT[best.key].name.en.toLowerCase()}; ${SYN_CATEGORY_TEXT[weak.key].name.en.toLowerCase()} needs the most care.`,
      },
    ];
    const good = syn.aspects.find((a) => toneOf(a.type) === "harmonious");
    if (good)
      rows.push({
        label: isTh ? "จุดที่เข้ากันที่สุด" : "Best connection",
        text: describeSynAspect(good.a, good.b, good.type, aName, pName, lang),
      });
    const hard = syn.aspects.find((a) => toneOf(a.type) === "tense");
    if (hard)
      rows.push({
        label: isTh ? "จุดที่ต้องระวัง" : "Handle with care",
        text: describeSynAspect(hard.a, hard.b, hard.type, aName, pName, lang),
      });
    if (syn.bInA?.length) {
      const count = new Map<number, number>();
      for (const o of syn.bInA) count.set(o.house, (count.get(o.house) ?? 0) + 1);
      const [house, n] = [...count].sort((x, y) => y[1] - x[1] || x[0] - y[0])[0];
      rows.push({
        label: isTh ? `${pName}มีผลกับเรื่องไหนของ${aName}` : `Where ${pName} lands in ${aName}'s chart`,
        text: isTh
          ? `ดาวของ${pName} ${n} ดวงตกเรือน ${house} (${HOUSE_TEXT[house - 1].title.th}) จึงมีผลกับเรื่อง${HOUSE_TEXT[house - 1].arena.th}${HOUSE_TEXT[house - 1].arena.th.endsWith("ๆ") ? " " : ""}ของ${aName}มากที่สุด`
          : `${n} of ${pName}'s planets fall in house ${house} (${HOUSE_TEXT[house - 1].title.en}), so ${pName} affects ${aName}'s ${HOUSE_TEXT[house - 1].arena.en} the most.`,
      });
    }
    return rows;
  })();

  const aspectLabel = (s: { a: BodyId; b: BodyId }) =>
    isTh
      ? { a: `${bodyName(s.a, lang)}ของ${aName}`, b: `${bodyName(s.b, lang)}ของ${partner?.name ?? ""}` }
      : { a: `${aName}'s ${bodyName(s.a, lang)}`, b: `${partner?.name ?? ""}'s ${bodyName(s.b, lang)}` };
  const hasOverlay = !!(syn?.bInA || syn?.aInB);

  return (
    <div className="space-y-6 sm:space-y-8">
      <p className="v2-nr-lead">
        {isTh
          ? "เทียบผังของคุณกับอีกคน ดูว่าดาวของสองคนคุยกันแบบไหน ใช้เป็นแนวทางทำความเข้าใจกัน ไม่ใช่คำตัดสินว่าคู่ไหนไปรอดหรือไม่รอด"
          : "Compare your chart with someone else's to see how your planets meet. Use it to understand each other, not as a verdict."}
      </p>

      {ranked.length > 0 && (
        <div className="v2-nr-box">
          <p className="v2-nr-box-t">{isTh ? "ความเข้ากันกับคนที่บันทึกไว้" : "Compatibility with your saved charts"}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ranked.map(({ c, overall, best }) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => applySpec(c, c.name)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-line-warm bg-surface px-3 py-2 text-left min-h-[52px] hover:border-gold-ink"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink truncate leading-[1.7]">{c.name || (isTh ? "ไม่มีชื่อ" : "Unnamed")}</span>
                    <span className="block text-xs text-muted">
                      {isTh ? "เด่นเรื่อง" : "Strongest:"} {SYN_CATEGORY_TEXT[best].name[lang]}
                    </span>
                  </span>
                  <span className="shrink-0 text-base font-bold text-ink tabular-nums">{overall.toFixed(1)}/10</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="v2-nr-note">
            {isTh
              ? "แตะชื่อเพื่อดูละเอียด · คะแนนเฉลี่ยจาก 5 ด้าน เป็นแนวทางเริ่มคุยกัน ส่งผังให้เพื่อนได้จากปุ่ม \"ส่งให้เพื่อน\" ใต้สรุปผัง"
              : "Tap a name for details. The average of five areas is a conversation starter. Send charts with the \"Send to a friend\" button under the chart summary."}
          </p>
        </div>
      )}

      <form onSubmit={submit} className="v2-nr-controls" noValidate>
        <p className="v2-nr-box-t">
          {ranked.length > 0 ? (isTh ? "หรือกรอกข้อมูลเกิดของอีกคน" : "Or enter their birth details") : isTh ? "ข้อมูลเกิดของอีกคน" : "Their birth details"}
        </p>
        <div>
          <label htmlFor="syn-name" className={labelClass}>
            {isTh ? "ชื่อ" : "Name"} <span className="font-sans font-normal text-xs text-muted">{isTh ? "ไม่บังคับ" : "optional"}</span>
          </label>
          <input id="syn-name" value={bName} maxLength={40} onChange={(e) => setBName(e.target.value)} className={fieldClass} autoComplete="off" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="syn-date" className={labelClass}>
              {isTh ? "วันเกิด (ค.ศ.)" : "Date of birth"}
            </label>
            <input id="syn-date" type="date" min="1900-01-01" max="2100-12-31" value={dateStr} onChange={(e) => e.target.value && setDateStr(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="syn-time" className={labelClass}>
              {isTh ? "เวลาเกิด" : "Time of birth"}
            </label>
            <input id="syn-time" type="time" value={timeStr} disabled={!timeKnown} onChange={(e) => setTimeStr(e.target.value)} className={fieldClass} />
          </div>
        </div>
        <label className="v2-nt-check">
          <input type="checkbox" checked={!timeKnown} onChange={(e) => setTimeKnown(!e.target.checked)} />
          {isTh ? "ไม่ทราบเวลาเกิดของอีกคน" : "Their birth time is unknown"}
        </label>
        <div role="group" aria-labelledby="syn-place-t" className="space-y-2">
          <p id="syn-place-t" className={labelClass}>
            {isTh ? "สถานที่เกิด" : "Place of birth"}
          </p>
          <div className="v2-nt-seg v2-nt-seg-fill" role="group" aria-label={isTh ? "ประเภทสถานที่" : "Place type"}>
            <button type="button" aria-pressed={placeMode === "thai"} onClick={() => setPlaceMode("thai")}>
              {isTh ? "จังหวัดในไทย" : "Thailand"}
            </button>
            <button type="button" aria-pressed={placeMode === "world"} onClick={() => setPlaceMode("world")}>
              {isTh ? "ค้นหาเมือง" : "Any city"}
            </button>
          </div>
          {placeMode === "thai" ? (
            <select aria-label={isTh ? "จังหวัด" : "Province"} value={thaiId} onChange={(e) => setThaiId(e.target.value)} className={fieldClass}>
              {THAI_PROVINCES.map((p) => (
                <option key={p.id} value={p.id}>
                  {isTh ? p.th : p.en}
                </option>
              ))}
            </select>
          ) : (
            <CitySearch lang={lang} value={city} onPick={setCity} fieldClass={fieldClass} />
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-err border-l-2 border-err pl-2">
            {error}
          </p>
        )}
        <button type="submit" className="btn-gold-glass w-full py-3.5 px-6 text-base font-serif-th font-bold">
          {isTh ? "เทียบผังคู่" : "Compare charts"}
        </button>
      </form>

      {partner && syn && (
        <div className="space-y-6 sm:space-y-8">
          {/* ── 1 สรุป ── */}
          <section aria-labelledby="syn-summary" className="v2-nr-sec">
            <SectionHead id="syn-summary" n={1} title={isTh ? `${aName} กับ ${partner.name}` : `${aName} and ${partner.name}`}>
              {isTh ? "ภาพรวมของคู่นี้ก่อน รายละเอียดอยู่ด้านล่าง" : "The big picture first; details below."}
            </SectionHead>
            <SummaryBox title={isTh ? "สรุปผังคู่" : "At a glance"} rows={summary} />
            <div className="v2-nr-box">
              <p className="v2-nr-box-t">{isTh ? "คะแนน 5 ด้าน" : "Five areas"}</p>
              <ul className="space-y-3">
                {syn.categories.map((c) => (
                  <li key={c.key} className="space-y-1">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-semibold text-ink">{SYN_CATEGORY_TEXT[c.key].name[lang]}</span>
                      <span className="tabular-nums text-ink">{c.score.toFixed(1)}/10</span>
                    </div>
                    <div className="v2-nt-bar">
                      <span className="mod" style={{ width: `${c.score * 10}%` }} />
                    </div>
                    <p className="v2-nr-item-meta">{SYN_CATEGORY_TEXT[c.key].about[lang]}</p>
                  </li>
                ))}
              </ul>
              <p className="v2-nr-note">
                {isTh
                  ? "คะแนนเริ่มที่ 5 มุมกลมกลืนบวก มุมตึงลบครึ่งหนึ่ง (มุมตึงก็สร้างแรงดึงดูดและการเติบโต)"
                  : "Scores start at 5; harmonious aspects add, tense ones subtract half (tension also creates attraction and growth)."}
              </p>
            </div>
          </section>

          {/* ── 2 ราศีของสองคน ── */}
          <section aria-labelledby="syn-signs" className="v2-nr-sec">
            <SectionHead id="syn-signs" n={2} title={isTh ? "ราศีของสองคน" : "Your signs together"}>
              {isTh ? "เทียบราศีหลักของสองคนแบบง่ายที่สุด" : "The simplest comparison: your key signs side by side."}
            </SectionHead>
            <ul className="v2-nr-items">
              {(
                [
                  ["sun", "sun", isTh ? "ตัวตนกับตัวตน (อาทิตย์)" : "Sun and Sun"],
                  ["moon", "moon", isTh ? "ใจกับใจ (จันทร์)" : "Moon and Moon"],
                  ["sun", "moon", isTh ? `ตัวตนของ${aName} กับใจของ${partner.name}` : `${aName}'s Sun and ${partner.name}'s Moon`],
                  ["moon", "sun", isTh ? `ใจของ${aName} กับตัวตนของ${partner.name}` : `${aName}'s Moon and ${partner.name}'s Sun`],
                  ["asc", "asc", isTh ? "ภาพแรกกับภาพแรก (ลัคนา)" : "Rising and rising"],
                ] as const
              ).map(([x, y, label]) => {
                const pa = get(chart, x);
                const pb = get(partner.chart, y);
                if (!pa || !pb) return null;
                const asp = ZODIAC_ASPECTS[zodiacDistance(pa.sign, pb.sign)][lang];
                return (
                  <li key={label}>
                    <span className="v2-nr-item-t">{label}</span>
                    <span className="v2-nr-item-meta">
                      {signName(pa.sign, lang)} {isTh ? "กับ" : "and"} {signName(pb.sign, lang)}: {asp.name}
                    </span>
                    <span className="v2-nr-item-d">{asp.summary}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ── 3 วงผังสองชั้น ── */}
          <section aria-labelledby="syn-wheel" className="v2-nr-sec">
            <SectionHead id="syn-wheel" n={3} title={isTh ? "วงผังสองชั้น" : "Bi-wheel"}>
              {isTh ? `วงในคือ${aName} วงนอกคือ${partner.name} แตะดาวเพื่อเน้นเส้นของดาวดวงนั้น` : `Inner ring: ${aName}. Outer ring: ${partner.name}. Tap a planet to highlight its lines.`}
            </SectionHead>
            <NatalWheel
              chart={chart}
              lang={lang}
              focus={focus}
              onFocus={setFocus}
              showMinor={false}
              outer={{ bodies: partner.chart.bodies, aspects: syn.aspects.map((s) => ({ a: s.b, b: s.a, type: s.type, orb: s.orb, maxOrb: s.maxOrb })) }}
            />
          </section>

          {/* ── 4 มุมสำคัญ ── */}
          <section aria-labelledby="syn-aspects" className="v2-nr-sec">
            <SectionHead id="syn-aspects" n={4} title={isTh ? "ดาวของสองคนคุยกันแบบไหน" : "How your planets meet"}>
              {isTh
                ? `${Math.min(TOP_ASPECTS, syn.aspects.length)} คู่ที่สำคัญที่สุดจากทั้งหมด ${syn.aspects.length} คู่ · ขอบน้ำเงินไหลลื่น ขอบแดงตึง`
                : `The ${Math.min(TOP_ASPECTS, syn.aspects.length)} most important of ${syn.aspects.length}. Blue edge flows, red edge is tense.`}
            </SectionHead>
            <ul className="v2-nr-items">
              {syn.aspects.slice(0, TOP_ASPECTS).map((s) => {
                const l = aspectLabel(s);
                return (
                  <li key={`${s.a}-${s.b}`} className={`is-${toneOf(s.type)}`}>
                    <span className="v2-nr-item-t">
                      {l.a} <span className="font-normal text-muted">{shortAspect(s.type, lang)}</span> {l.b}
                    </span>
                    <span className="v2-nr-item-d">{describeSynAspect(s.a, s.b, s.type, aName, partner.name, lang)}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ── 5 ดาวตกเรือน ── */}
          {hasOverlay && (
            <section aria-labelledby="syn-houses" className="v2-nr-sec">
              <SectionHead id="syn-houses" n={5} title={isTh ? "ดาวของอีกคนตกเรือนไหน" : "Where you land in each other's charts"}>
                {isTh ? "อีกคนพาพลังเข้ามาในเรื่องไหนของชีวิต (ดาวส่วนตัว ที่เหลืออยู่ในข้อมูลละเอียด)" : "Which part of life each person stirs in the other (personal planets; the rest is in the details)."}
              </SectionHead>
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  [
                    [syn.bInA, partner.name, aName],
                    [syn.aInB, aName, partner.name],
                  ] as const
                ).map(([list, guest, host]) => (
                  <div key={`${guest}-${host}`} className="v2-nr-box">
                    <p className="v2-nr-box-t">{isTh ? `ดาวของ${guest} ในเรือนของ${host}` : `${guest}'s planets in ${host}'s houses`}</p>
                    {list ? (
                      <ul className="v2-nr-items">
                        {list
                          .filter((o) => PERSONAL.includes(o.body))
                          .map((o) => (
                            <li key={o.body}>
                              <span className="v2-nr-item-t">
                                {bodyName(o.body, lang)}{" "}
                                <span className="font-normal text-muted">
                                  {isTh ? `เรือน ${o.house} ${HOUSE_TEXT[o.house - 1].title.th}` : `house ${o.house}, ${HOUSE_TEXT[o.house - 1].title.en}`}
                                </span>
                              </span>
                              <span className="v2-nr-item-d">{describeOverlay(o.body, o.house, guest, host, lang)}</span>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="v2-nr-note">{isTh ? `ต้องรู้เวลาเกิดของ${host}จึงจะดูว่าดาวของ${guest}ตกเรือนไหน` : `${host}'s birth time is needed to place ${guest}'s planets in houses.`}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 6 ผังรวม ── */}
          <section aria-labelledby="syn-composite" className="v2-nr-sec">
            <SectionHead id="syn-composite" n={hasOverlay ? 6 : 5} title={isTh ? "ผังรวมของความสัมพันธ์" : "The relationship's own chart"}>
              {isTh ? "เอาจุดกึ่งกลางของดาวแต่ละคู่มาสร้างผังใหม่ (Composite) บอกบุคลิกของความสัมพันธ์นี้" : "Built from the midpoints of each pair of planets (composite): the personality of the relationship."}
            </SectionHead>
            <SummaryBox
              title={isTh ? "ความสัมพันธ์นี้เป็นแบบไหน" : "What this relationship is like"}
              rows={(["sun", "moon", "asc"] as const).flatMap((id) => {
                const b = get(syn.composite, id);
                if (!b) return [];
                const what = {
                  sun: isTh ? "แก่นของคู่นี้" : "Core",
                  moon: isTh ? "ใจของคู่นี้" : "Heart",
                  asc: isTh ? "ภาพที่คนอื่นเห็น" : "How others see you",
                }[id];
                return [
                  {
                    label: `${what}: ${signName(b.sign, lang)}`,
                    text: isTh
                      ? `คู่นี้มีพลังแบบ${SIGN_TEXT[b.sign].keywords.th}${b.house ? ` และเติบโตผ่านเรื่อง${HOUSE_TEXT[b.house - 1].arena.th}` : ""}`
                      : `A ${SIGN_TEXT[b.sign].keywords.en} energy${b.house ? `, growing through ${HOUSE_TEXT[b.house - 1].arena.en}` : ""}.`,
                  },
                ];
              })}
            />
            <NatalWheel chart={syn.composite} lang={lang} focus={null} onFocus={() => undefined} showMinor={false} />
          </section>

          {/* ── ข้อมูลละเอียด ── */}
          <section aria-labelledby="syn-deep" className="v2-nr-sec">
            <SectionHead id="syn-deep" title={isTh ? "ข้อมูลละเอียด" : "In depth"}>
              {isTh ? "ตารางสำหรับคนที่อ่านผังเป็น แตะหัวข้อเพื่อเปิด" : "Tables for experienced chart readers. Tap a heading to open it."}
            </SectionHead>
            <div className="v2-nr-deep">
              <details>
                <summary>
                  {isTh ? `มุมระหว่างสองผังทั้งหมด (${syn.aspects.length})` : `All aspects between the charts (${syn.aspects.length})`}
                  <MoreLabel isTh={isTh} />
                </summary>
                <table className="v2-nt-table">
                  <thead>
                    <tr>
                      <th scope="col">{aName}</th>
                      <th scope="col">{isTh ? "มุม" : "Aspect"}</th>
                      <th scope="col">{partner.name}</th>
                      <th scope="col">orb</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syn.aspects.map((s) => (
                      <tr key={`${s.a}-${s.b}`}>
                        <td className="font-semibold text-ink">{bodyName(s.a, lang)}</td>
                        <td>{shortAspect(s.type, lang)}</td>
                        <td>{bodyName(s.b, lang)}</td>
                        <td className="tabular-nums">{formatDegree(s.orb)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
              {(
                [
                  [syn.bInA, partner.name, aName],
                  [syn.aInB, aName, partner.name],
                ] as const
              ).map(([list, guest, host]) =>
                list ? (
                  <details key={`${guest}-${host}`}>
                    <summary>
                      {isTh ? `ดาวทุกดวงของ${guest} ในเรือนของ${host}` : `All of ${guest}'s planets in ${host}'s houses`}
                      <MoreLabel isTh={isTh} />
                    </summary>
                    <table className="v2-nt-table">
                      <thead>
                        <tr>
                          <th scope="col">{isTh ? "ดาว" : "Planet"}</th>
                          <th scope="col">{isTh ? "เรือน" : "House"}</th>
                          <th scope="col">{isTh ? "เรื่อง" : "Area of life"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((o) => (
                          <tr key={o.body}>
                            <td className="font-semibold text-ink">{bodyName(o.body, lang)}</td>
                            <td className="tabular-nums">{o.house}</td>
                            <td className="text-muted">{HOUSE_TEXT[o.house - 1].title[lang]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                ) : null,
              )}
              <details>
                <summary>
                  {isTh ? "มุมสำคัญในผังรวม" : "Key aspects in the composite"}
                  <MoreLabel isTh={isTh} />
                </summary>
                <ul className="v2-nr-items">
                  {syn.composite.aspects
                    .filter((a) => ["conjunction", "opposition", "trine", "square", "sextile"].includes(a.type))
                    .slice(0, 8)
                    .map((a) => (
                      <li key={`${a.a}-${a.b}`} className={`is-${toneOf(a.type)}`}>
                        <span className="v2-nr-item-t">
                          {bodyName(a.a, lang)} <span className="font-normal text-muted">{shortAspect(a.type, lang)}</span> {bodyName(a.b, lang)}
                        </span>
                        <span className="v2-nr-item-d">
                          {isTh
                            ? `${BODY_TEXT[a.a].noun.th} กับ${BODY_TEXT[a.b].noun.th}${BODY_TEXT[a.b].noun.th.endsWith("ๆ") ? " " : ""}ของความสัมพันธ์นี้: ${(SYN_ASPECT_MEANING[a.type] ?? ASPECT_TEXT[a.type].meaning).th}`
                            : `The relationship's ${BODY_TEXT[a.a].noun.en} and ${BODY_TEXT[a.b].noun.en}: ${(SYN_ASPECT_MEANING[a.type] ?? ASPECT_TEXT[a.type].meaning).en}.`}
                        </span>
                        <span className="v2-nr-item-meta tabular-nums">orb {formatDegree(a.orb)}</span>
                      </li>
                    ))}
                </ul>
              </details>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
