"use client";

import { useEffect, useMemo, useState } from "react";
import { ZODIAC_ASPECTS, zodiacDistance } from "@/data/zodiac-compat";
import { BODY_TEXT, HOUSE_TEXT, SIGN_TEXT, SYN_ASPECT_MEANING, SYN_CATEGORY_TEXT, ASPECT_TEXT, type Lang } from "@/data/natal/content";
import { THAI_PROVINCES } from "@/data/natal/places";
import { formatDegree, type BodyId, type NatalChart } from "@/lib/astro/natal";
import { bodyName, describeOverlay, describeSynAspect, signName } from "@/lib/astro/natal-text";
import { buildChart, type ChartSpec } from "@/lib/astro/chart-spec";
import { loadSavedCharts, type SavedChart, type SavedPlace } from "@/lib/astro/saved-charts";
import { computeSynastry } from "@/lib/astro/synastry";
import { CitySearch, type PickedCity } from "./CitySearch";
import { NatalWheel } from "./NatalWheel";
import type { NatalMeta } from "./NatalChartApp";

/**
 * 💞 แท็บผังคู่ — เลือกอีกคนจากผังที่บันทึกไว้ หรือกรอกข้อมูลเกิดของอีกคน
 * โหลดแบบ lazy เมื่อกดแท็บ · คำนวณในเครื่อง · ข้อมูลของอีกคนไม่ถูกบันทึกเว้นแต่ผู้ใช้บันทึกผังนั้นเองจากฟอร์มหลัก
 */

const fieldClass =
  "glass-field w-full rounded-xl border border-line-interactive-warm px-3 py-2.5 text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors";
const labelClass = "block text-xs font-serif-th font-semibold text-ink mb-1";

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="font-serif-th font-bold text-ink text-base">{children}</h4>;
}

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

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        {isTh
          ? "เทียบผังของคุณกับอีกคน (Synastry) ดูว่าดาวของสองคนทำมุมกันอย่างไร ดาวของเขาตกเรือนไหนของคุณ และผังรวมของความสัมพันธ์ (Composite) ใช้เป็นแนวทางทำความเข้าใจกัน ไม่ใช่คำตัดสินว่าคู่ไหนไปรอดหรือไม่รอด"
          : "Compare your chart with someone else's (synastry): how your planets meet, where theirs fall in your houses, and the composite chart of the relationship. Use it to understand each other, not as a verdict."}
      </p>

      {saved.length > 0 && (
        <div className="space-y-2">
          <p className={labelClass}>{isTh ? "เลือกจากผังที่บันทึกไว้" : "Pick a saved chart"}</p>
          <ul className="flex flex-wrap gap-2">
            {saved.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => applySpec(c, c.name)} className="tap-target rounded-full border border-line-warm bg-surface px-3 py-1.5 text-sm text-ink">
                  {c.name || (isTh ? "ไม่มีชื่อ" : "Unnamed")}{" "}
                  <span className="text-xs text-muted">
                    {c.day}/{c.month}/{isTh ? c.yearCe + 543 : c.yearCe}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={submit} className="space-y-3 rounded-xl border border-line-warm p-3" noValidate>
        <p className="text-sm font-semibold text-ink">{isTh ? "หรือกรอกข้อมูลเกิดของอีกคน" : "Or enter their birth details"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="syn-name" className={labelClass}>
              {isTh ? "ชื่อ (ไม่บังคับ)" : "Name (optional)"}
            </label>
            <input id="syn-name" value={bName} maxLength={40} onChange={(e) => setBName(e.target.value)} className={fieldClass} autoComplete="off" />
          </div>
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
            <label className="inline-flex items-center gap-2 text-sm text-ink min-h-[44px] cursor-pointer">
              <input type="checkbox" checked={!timeKnown} onChange={(e) => setTimeKnown(!e.target.checked)} className="w-4 h-4" />
              {isTh ? "ไม่ทราบเวลาเกิด" : "Time unknown"}
            </label>
          </div>
          <div className="space-y-2">
            <span className={labelClass}>{isTh ? "สถานที่เกิด" : "Place of birth"}</span>
            <div className="v2-nt-seg" role="group" aria-label={isTh ? "ประเภทสถานที่" : "Place type"}>
              <button type="button" aria-pressed={placeMode === "thai"} onClick={() => setPlaceMode("thai")}>
                {isTh ? "จังหวัดในไทย" : "Thailand"}
              </button>
              <button type="button" aria-pressed={placeMode === "world"} onClick={() => setPlaceMode("world")}>
                {isTh ? "ค้นหาเมือง" : "Search any city"}
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
        </div>
        {error && (
          <p role="alert" className="text-sm text-err border-l-2 border-err pl-2">
            {error}
          </p>
        )}
        <button type="submit" className="btn-gold-glass w-full py-3 px-6 text-sm font-serif-th font-bold">
          {isTh ? "เทียบผังคู่" : "Compare charts"}
        </button>
      </form>

      {partner && syn && (
        <div className="space-y-6">
          <section className="altar-card-porcelain rounded-xl p-4 space-y-3">
            <SubTitle>{isTh ? `${aName} กับ ${partner.name}` : `${aName} and ${partner.name}`}</SubTitle>
            <ul className="space-y-3">
              {syn.categories.map((c) => (
                <li key={c.key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-ink">{SYN_CATEGORY_TEXT[c.key].name[lang]}</span>
                    <span className="tabular-nums text-ink">{c.score.toFixed(1)}/10</span>
                  </div>
                  <div className="v2-nt-bar">
                    <span className="mod" style={{ width: `${c.score * 10}%` }} />
                  </div>
                  <p className="text-xs text-muted">
                    {SYN_CATEGORY_TEXT[c.key].about[lang]}
                    {c.harmonious.length + c.tense.length > 0
                      ? ` · ${isTh ? "มาจาก" : "from"} ${[...c.harmonious, ...c.tense]
                          .map((a) => `${BODY_TEXT[a.a].short[lang]}-${BODY_TEXT[a.b].short[lang]} ${ASPECT_TEXT[a.type].name[lang].split(" ")[0]}`)
                          .join(", ")}`
                      : ` · ${isTh ? "ไม่มีมุมเด่นในด้านนี้ (คะแนนกลาง)" : "no strong aspects here (neutral)"}`}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted">
              {isTh
                ? "คะแนนเริ่มที่ 5 มุมกลมกลืนบวก มุมตึงลบครึ่งหนึ่ง (มุมตึงก็สร้างแรงดึงดูดและการเติบโต) ถ่วงตามความสำคัญของดาวและความแน่นของมุม"
                : "Scores start at 5; harmonious aspects add, tense ones subtract half (tension also creates attraction and growth), weighted by planet importance and orb."}
            </p>
          </section>

          <section className="space-y-2">
            <SubTitle>{isTh ? "ราศีของสองคน" : "Your signs together"}</SubTitle>
            <ul className="space-y-2 text-sm">
              {(
                [
                  ["sun", "sun", isTh ? "อาทิตย์กับอาทิตย์" : "Sun and Sun"],
                  ["moon", "moon", isTh ? "จันทร์กับจันทร์" : "Moon and Moon"],
                  ["sun", "moon", isTh ? `อาทิตย์ของ${aName}กับจันทร์ของ${partner.name}` : `${aName}'s Sun and ${partner.name}'s Moon`],
                  ["moon", "sun", isTh ? `จันทร์ของ${aName}กับอาทิตย์ของ${partner.name}` : `${aName}'s Moon and ${partner.name}'s Sun`],
                  ["asc", "asc", isTh ? "ลัคนากับลัคนา" : "Rising and rising"],
                ] as const
              ).map(([x, y, label]) => {
                const pa = get(chart, x);
                const pb = get(partner.chart, y);
                if (!pa || !pb) return null;
                const asp = ZODIAC_ASPECTS[zodiacDistance(pa.sign, pb.sign)][lang];
                return (
                  <li key={label} className="border-l-2 border-line-warm pl-2">
                    <span className="font-semibold text-ink">{label}</span>{" "}
                    <span className="text-muted">
                      ({signName(pa.sign, lang)} · {signName(pb.sign, lang)}) {asp.name}
                    </span>
                    <span className="block text-ink">{asp.summary}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="space-y-2">
            <SubTitle>{isTh ? `วงผังสองชั้น: ${aName} (วงใน) กับ ${partner.name} (วงนอก)` : `Bi-wheel: ${aName} (inner) and ${partner.name} (outer)`}</SubTitle>
            <NatalWheel
              chart={chart}
              lang={lang}
              focus={focus}
              onFocus={setFocus}
              showMinor={false}
              outer={{ bodies: partner.chart.bodies, aspects: syn.aspects.map((s) => ({ a: s.b, b: s.a, type: s.type, orb: s.orb, maxOrb: s.maxOrb })) }}
            />
          </section>

          <section className="space-y-2">
            <SubTitle>{isTh ? "มุมสำคัญระหว่างสองผัง (เรียงจากสำคัญสุด)" : "Key aspects between your charts"}</SubTitle>
            <ul className="space-y-3 text-sm">
              {syn.aspects.slice(0, 15).map((s) => (
                <li key={`${s.a}-${s.b}`} className="border-l-2 border-line-warm pl-2">
                  <p className="font-semibold text-ink">
                    {bodyName(s.a, lang)}
                    {isTh ? `${bodyName(s.a, lang).endsWith(")") ? " " : ""}ของ${aName}` : ` (${aName})`} {ASPECT_TEXT[s.type].name[lang]} {bodyName(s.b, lang)}
                    {isTh ? `${bodyName(s.b, lang).endsWith(")") ? " " : ""}ของ${partner.name}` : ` (${partner.name})`}{" "}
                    <span className="text-xs font-normal text-muted tabular-nums">orb {formatDegree(s.orb)}</span>
                  </p>
                  <p className="text-ink">{describeSynAspect(s.a, s.b, s.type, aName, partner.name, lang)}</p>
                </li>
              ))}
            </ul>
            {syn.aspects.length > 15 && (
              <details className="rounded-xl border border-line-warm px-3 py-2 text-sm">
                <summary className="cursor-pointer min-h-[36px] flex items-center font-semibold text-ink">
                  {isTh ? `มุมอื่น ๆ อีก ${syn.aspects.length - 15} มุม` : `${syn.aspects.length - 15} more aspects`}
                </summary>
                <ul className="pt-2 space-y-1">
                  {syn.aspects.slice(15).map((s) => (
                    <li key={`${s.a}-${s.b}`} className="text-ink">
                      {bodyName(s.a, lang)} {ASPECT_TEXT[s.type].name[lang]} {bodyName(s.b, lang)}{" "}
                      <span className="text-xs text-muted tabular-nums">orb {formatDegree(s.orb)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {(syn.bInA || syn.aInB) && (
            <section className="space-y-3">
              <SubTitle>{isTh ? "ดาวของอีกคนตกเรือนไหนของเรา" : "Where each person's planets fall in the other's houses"}</SubTitle>
              {(
                [
                  [syn.bInA, partner.name, aName],
                  [syn.aInB, aName, partner.name],
                ] as const
              ).map(([list, guest, host]) =>
                list ? (
                  <div key={`${guest}-${host}`} className="space-y-1">
                    <p className="text-sm font-semibold text-ink">{isTh ? `ดาวของ${guest}ในเรือนของ${host}` : `${guest}'s planets in ${host}'s houses`}</p>
                    <ul className="space-y-1 text-sm">
                      {list.map((o) => (
                        <li key={o.body} className="border-l-2 border-line-warm pl-2 text-ink">
                          <span className="font-semibold">
                            {bodyName(o.body, lang)} {isTh ? `เรือน ${o.house}` : `house ${o.house}`}
                          </span>{" "}
                          <span className="text-muted">({HOUSE_TEXT[o.house - 1].title[lang]})</span>
                          <span className="block">{describeOverlay(o.body, o.house, guest, host, lang)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p key={`${guest}-${host}`} className="text-xs text-muted">
                    {isTh ? `ต้องรู้เวลาเกิดของ${host}จึงจะดูว่าดาวของ${guest}ตกเรือนไหน` : `${host}'s birth time is needed to place ${guest}'s planets in houses.`}
                  </p>
                ),
              )}
            </section>
          )}

          <section className="space-y-3">
            <SubTitle>{isTh ? "ผังรวมของความสัมพันธ์ (Composite)" : "Composite chart of the relationship"}</SubTitle>
            <p className="text-sm text-muted">
              {isTh
                ? "ผังรวมเอาจุดกึ่งกลางของดาวแต่ละคู่มาสร้างเป็นผังใหม่ บอกว่าความสัมพันธ์นี้มีบุคลิกและเป้าหมายของตัวเองอย่างไร"
                : "The composite uses the midpoint of each pair of planets to describe the relationship as its own entity."}
            </p>
            <NatalWheel chart={syn.composite} lang={lang} focus={null} onFocus={() => undefined} showMinor={false} />
            <div className="altar-card-porcelain rounded-xl p-4 space-y-2 text-sm leading-relaxed">
              {(["sun", "moon", "asc"] as const).map((id) => {
                const b = get(syn.composite, id);
                if (!b) return null;
                const what = {
                  sun: isTh ? "แก่นของความสัมพันธ์" : "Core of the relationship",
                  moon: isTh ? "ใจของความสัมพันธ์" : "Heart of the relationship",
                  asc: isTh ? "ภาพที่คนอื่นเห็นคู่นี้" : "How others see you as a pair",
                }[id];
                return (
                  <p key={id} className="text-ink">
                    <span className="font-semibold">
                      {what}: {bodyName(id, lang)} {signName(b.sign, lang)}
                      {b.house ? (isTh ? ` เรือน ${b.house}` : `, house ${b.house}`) : ""}
                    </span>{" "}
                    {isTh ? `คู่นี้มีพลังแบบ${SIGN_TEXT[b.sign].keywords.th}` : `a ${SIGN_TEXT[b.sign].keywords.en} energy`}
                    {b.house ? (isTh ? ` และเติบโตผ่านเรื่อง${HOUSE_TEXT[b.house - 1].arena.th}` : `, growing through ${HOUSE_TEXT[b.house - 1].arena.en}`) : ""}
                  </p>
                );
              })}
            </div>
            <ul className="space-y-2 text-sm">
              {syn.composite.aspects
                .filter((a) => ["conjunction", "opposition", "trine", "square", "sextile"].includes(a.type))
                .slice(0, 8)
                .map((a) => (
                  <li key={`${a.a}-${a.b}`} className="border-l-2 border-line-warm pl-2">
                    <span className="font-semibold text-ink">
                      {bodyName(a.a, lang)} {ASPECT_TEXT[a.type].name[lang]} {bodyName(a.b, lang)}
                    </span>{" "}
                    <span className="text-xs text-muted tabular-nums">orb {formatDegree(a.orb)}</span>
                    <span className="block text-ink">
                      {isTh
                        ? `${BODY_TEXT[a.a].noun.th} กับ${BODY_TEXT[a.b].noun.th}${BODY_TEXT[a.b].noun.th.endsWith("ๆ") ? " " : ""}ของความสัมพันธ์นี้: ${(SYN_ASPECT_MEANING[a.type] ?? ASPECT_TEXT[a.type].meaning).th}`
                        : `The relationship's ${BODY_TEXT[a.a].noun.en} and ${BODY_TEXT[a.b].noun.en}: ${(SYN_ASPECT_MEANING[a.type] ?? ASPECT_TEXT[a.type].meaning).en}.`}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
