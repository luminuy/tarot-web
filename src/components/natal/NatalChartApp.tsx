"use client";

import React, { Suspense, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { THAI_PROVINCES, WORLD_CITIES, type BirthPlace } from "@/data/natal/places";
import { smoothScrollBehavior } from "@/lib/use-motion-safe";
import { formatUtcOffset, localToUtc, localToUtcFixed } from "@/lib/astro/timezone";
import type { HouseSystem, NatalChart, NodeType } from "@/lib/astro/natal";

/**
 * 🪐 เครื่องสร้างผังดวงกำเนิด (island ของ `/natal-chart`)
 * ---------------------------------------------------------------------------
 * - ตัวคำนวณดาว + คำอธิบาย + ผลทั้งหมด **โหลดตอนกดสร้างผังเท่านั้น** (`import()` / `React.lazy`)
 *   บันเดิลแรกของหน้ามีแค่ฟอร์ม · ด่าน `test-natal-chart` ข้อ 7 เฝ้าอยู่
 * - วันเวลาสถานที่เกิดไม่ออกจากเครื่อง: ไม่ยิง API · ไม่ใส่ใน URL · ไม่เก็บลง localStorage
 * - ไม่มีโค้ดเดาไพ่/เดาค่า: คำนวณไม่ได้ = บอกผู้ใช้ตรง ๆ (กฎเหล็กข้อ 14)
 */

export interface NatalCardItem {
  id: string;
  nameTh: string;
  nameEn: string;
  image: string;
}

export interface NatalMeta {
  name: string;
  dateText: string;
  timeText: string;
  placeText: string;
  offsetText: string;
}

const NatalResult = React.lazy(() => import("./NatalResult"));

const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const HOUSE_OPTIONS: { id: HouseSystem; th: string; en: string }[] = [
  { id: "placidus", th: "Placidus (นิยมที่สุด)", en: "Placidus (most popular)" },
  { id: "whole", th: "Whole Sign (หนึ่งราศีหนึ่งเรือน)", en: "Whole Sign" },
  { id: "koch", th: "Koch", en: "Koch" },
  { id: "equal", th: "Equal (เรือนละ 30 องศา)", en: "Equal" },
  { id: "porphyry", th: "Porphyry", en: "Porphyry" },
  { id: "regiomontanus", th: "Regiomontanus", en: "Regiomontanus" },
  { id: "campanus", th: "Campanus", en: "Campanus" },
];

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

const fieldClass =
  "glass-field w-full rounded-xl border border-line-interactive-warm px-3 py-2.5 text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors";
const labelClass = "block text-xs font-serif-th font-semibold text-ink mb-1";

function daysIn(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

type PlaceMode = "thai" | "world" | "custom";

export function NatalChartApp({ cards }: { cards: readonly NatalCardItem[] }) {
  const { isEnglish } = useLocale();
  const lang = isEnglish ? "en" : "th";
  const [name, setName] = useState("");
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(1);
  const [era, setEra] = useState<"be" | "ce">(isEnglish ? "ce" : "be");
  const [yearInput, setYearInput] = useState(isEnglish ? "1995" : "2538");
  const [timeKnown, setTimeKnown] = useState(true);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [placeMode, setPlaceMode] = useState<PlaceMode>("thai");
  const [thaiId, setThaiId] = useState(THAI_PROVINCES[0].id);
  const [worldId, setWorldId] = useState(WORLD_CITIES[0].id);
  const [lat, setLat] = useState("13.7525");
  const [lon, setLon] = useState("100.4942");
  const [offsetH, setOffsetH] = useState("7");
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [nodeType, setNodeType] = useState<NodeType>("true");
  const [orbScale, setOrbScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ chart: NatalChart; meta: NatalMeta } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const yearNum = Number.parseInt(yearInput, 10);
  const yearCe = Number.isFinite(yearNum) ? (era === "be" ? yearNum - 543 : yearNum) : NaN;
  const maxDay = Number.isFinite(yearCe) ? daysIn(yearCe, month) : 31;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!Number.isFinite(yearCe) || yearCe < MIN_YEAR || yearCe > MAX_YEAR) {
      setError(
        isEnglish
          ? `Please enter a year between ${MIN_YEAR} and ${MAX_YEAR}.`
          : `กรุณาใส่ปีเกิดระหว่าง พ.ศ. ${MIN_YEAR + 543} ถึง ${MAX_YEAR + 543} (ค.ศ. ${MIN_YEAR} ถึง ${MAX_YEAR})`,
      );
      return;
    }
    if (day > maxDay) {
      setError(isEnglish ? "That date does not exist." : "วันที่นี้ไม่มีในเดือนที่เลือก");
      return;
    }

    let place: { lat: number; lon: number; label: string; zone?: string; fixedOffset?: number };
    if (placeMode === "custom") {
      const la = Number.parseFloat(lat);
      const lo = Number.parseFloat(lon);
      const off = Number.parseFloat(offsetH);
      if (!(Math.abs(la) <= 89.9) || !(Math.abs(lo) <= 180) || !(Math.abs(off) <= 14)) {
        setError(isEnglish ? "Check the latitude (-90 to 90), longitude (-180 to 180) and UTC offset (-14 to 14)." : "ตรวจละติจูด (-90 ถึง 90) ลองจิจูด (-180 ถึง 180) และเขตเวลา (-14 ถึง 14) อีกครั้ง");
        return;
      }
      place = { lat: la, lon: lo, label: `${la.toFixed(4)}, ${lo.toFixed(4)}`, fixedOffset: off * 60 };
    } else {
      const p: BirthPlace | undefined = (placeMode === "thai" ? THAI_PROVINCES : WORLD_CITIES).find((x) => x.id === (placeMode === "thai" ? thaiId : worldId));
      if (!p) return;
      place = { lat: p.lat, lon: p.lon, label: isEnglish ? p.en : p.th, zone: p.zone };
    }

    const toUtc = (h: number, m: number) =>
      place.zone ? localToUtc(place.zone, yearCe, month, day, h, m) : { utcMs: localToUtcFixed(place.fixedOffset!, yearCe, month, day, h, m), offsetMinutes: place.fixedOffset! };
    const at = timeKnown ? toUtc(hour, minute) : toUtc(12, 0);

    setBusy(true);
    try {
      const { computeNatalChart } = await import("@/lib/astro/natal");
      const chart = computeNatalChart({
        utcMs: at.utcMs,
        timeKnown,
        dayStartUtcMs: timeKnown ? undefined : toUtc(0, 0).utcMs,
        dayEndUtcMs: timeKnown ? undefined : toUtc(23, 59).utcMs,
        lat: place.lat,
        lon: place.lon,
        houseSystem,
        nodeType,
        orbScale,
      });
      const pad = (n: number) => String(n).padStart(2, "0");
      setResult({
        chart,
        meta: {
          name: name.trim().slice(0, 40),
          dateText: isEnglish ? `${day} ${MONTHS_EN[month - 1]} ${yearCe}` : `${day} ${MONTHS_TH[month - 1]} พ.ศ. ${yearCe + 543}`,
          timeText: timeKnown ? `${pad(hour)}:${pad(minute)}${isEnglish ? "" : " น."}` : isEnglish ? "time unknown" : "ไม่ทราบเวลาเกิด",
          placeText: place.label,
          offsetText: formatUtcOffset(at.offsetMinutes),
        },
      });
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: smoothScrollBehavior(), block: "start" }));
    } catch {
      setError(isEnglish ? "The calculator could not load. Please reload the page and try again." : "โหลดเครื่องคำนวณไม่สำเร็จ กรุณาโหลดหน้าใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  const years = era === "be" ? `${MIN_YEAR + 543}–${MAX_YEAR + 543}` : `${MIN_YEAR}–${MAX_YEAR}`;

  return (
    <div className="v2-nt space-y-8">
      <form onSubmit={handleSubmit} className="v2-nt-noprint space-y-5" noValidate>
        <div>
          <label htmlFor="nt-name" className={labelClass}>
            {isEnglish ? "Name (optional, stays on this page)" : "ชื่อ (ไม่บังคับ ใช้แสดงบนผังเท่านั้น)"}
          </label>
          <input id="nt-name" type="text" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} autoComplete="off" />
        </div>

        <fieldset className="space-y-2">
          <legend className={labelClass}>{isEnglish ? "Date of birth" : "วันเดือนปีเกิด"}</legend>
          <div className="grid grid-cols-3 gap-2">
            <select aria-label={isEnglish ? "Day" : "วัน"} value={day} onChange={(e) => setDay(Number(e.target.value))} className={fieldClass}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d} disabled={d > maxDay}>
                  {d}
                </option>
              ))}
            </select>
            <select aria-label={isEnglish ? "Month" : "เดือน"} value={month} onChange={(e) => setMonth(Number(e.target.value))} className={fieldClass}>
              {(isEnglish ? MONTHS_EN : MONTHS_TH).map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <input
              aria-label={isEnglish ? `Year (${years})` : `ปี (${years})`}
              inputMode="numeric"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
              className={fieldClass}
            />
          </div>
          <div className="v2-nt-seg" role="group" aria-label={isEnglish ? "Year format" : "รูปแบบปี"}>
            {(["be", "ce"] as const).map((x) => (
              <button
                key={x}
                type="button"
                aria-pressed={era === x}
                onClick={() => {
                  if (x === era) return;
                  if (Number.isFinite(yearNum)) setYearInput(String(x === "be" ? yearNum + 543 : yearNum - 543));
                  setEra(x);
                }}
              >
                {x === "be" ? (isEnglish ? "Buddhist Era" : "พ.ศ.") : isEnglish ? "AD (CE)" : "ค.ศ."}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className={labelClass}>{isEnglish ? "Time of birth (local clock time)" : "เวลาเกิด (ตามเวลาท้องถิ่น)"}</legend>
          <div className="grid grid-cols-2 gap-2">
            <select aria-label={isEnglish ? "Hour" : "ชั่วโมง"} value={hour} disabled={!timeKnown} onChange={(e) => setHour(Number(e.target.value))} className={fieldClass}>
              {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")} {isEnglish ? "h" : "นาฬิกา"}
                </option>
              ))}
            </select>
            <select aria-label={isEnglish ? "Minute" : "นาที"} value={minute} disabled={!timeKnown} onChange={(e) => setMinute(Number(e.target.value))} className={fieldClass}>
              {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")} {isEnglish ? "min" : "นาที"}
                </option>
              ))}
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-ink min-h-[44px] cursor-pointer">
            <input type="checkbox" checked={!timeKnown} onChange={(e) => setTimeKnown(!e.target.checked)} className="w-4 h-4" />
            {isEnglish ? "I don't know my birth time" : "ไม่ทราบเวลาเกิด"}
          </label>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className={labelClass}>{isEnglish ? "Place of birth" : "สถานที่เกิด"}</legend>
          <div className="v2-nt-seg" role="group" aria-label={isEnglish ? "Place type" : "ประเภทสถานที่"}>
            {(
              [
                ["thai", isEnglish ? "Thailand" : "จังหวัดในไทย"],
                ["world", isEnglish ? "Abroad" : "ต่างประเทศ"],
                ["custom", isEnglish ? "Coordinates" : "ระบุพิกัดเอง"],
              ] as const
            ).map(([m, t]) => (
              <button key={m} type="button" aria-pressed={placeMode === m} onClick={() => setPlaceMode(m)}>
                {t}
              </button>
            ))}
          </div>
          {placeMode === "thai" && (
            <select aria-label={isEnglish ? "Province" : "จังหวัด"} value={thaiId} onChange={(e) => setThaiId(e.target.value)} className={fieldClass}>
              {THAI_PROVINCES.map((p) => (
                <option key={p.id} value={p.id}>
                  {isEnglish ? p.en : p.th}
                </option>
              ))}
            </select>
          )}
          {placeMode === "world" && (
            <select aria-label={isEnglish ? "City" : "เมือง"} value={worldId} onChange={(e) => setWorldId(e.target.value)} className={fieldClass}>
              {WORLD_CITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {isEnglish ? p.en : p.th}
                </option>
              ))}
            </select>
          )}
          {placeMode === "custom" && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="nt-lat" className="block text-[11px] text-muted mb-0.5">
                  {isEnglish ? "Latitude (N +)" : "ละติจูด (เหนือ +)"}
                </label>
                <input id="nt-lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="nt-lon" className="block text-[11px] text-muted mb-0.5">
                  {isEnglish ? "Longitude (E +)" : "ลองจิจูด (ตะวันออก +)"}
                </label>
                <input id="nt-lon" inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="nt-off" className="block text-[11px] text-muted mb-0.5">
                  {isEnglish ? "UTC offset (hours)" : "เขตเวลา UTC (ชม.)"}
                </label>
                <input id="nt-off" inputMode="decimal" value={offsetH} onChange={(e) => setOffsetH(e.target.value)} className={fieldClass} />
              </div>
            </div>
          )}
          {placeMode !== "custom" && (
            <p className="text-xs text-muted">
              {isEnglish
                ? "Daylight saving time and historical time zones are applied automatically."
                : "ระบบปรับเวลาออมแสงและเขตเวลาในอดีตให้เอง (เช่น ไทยก่อนปี 2463 ใช้เวลา +6:42)"}
            </p>
          )}
        </fieldset>

        <details className="rounded-xl border border-line-warm px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold text-ink min-h-[36px] flex items-center">{isEnglish ? "Advanced settings" : "ตั้งค่าขั้นสูง"}</summary>
          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            <div>
              <label htmlFor="nt-house" className={labelClass}>
                {isEnglish ? "House system" : "ระบบเรือน"}
              </label>
              <select id="nt-house" value={houseSystem} onChange={(e) => setHouseSystem(e.target.value as HouseSystem)} className={fieldClass}>
                {HOUSE_OPTIONS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {isEnglish ? h.en : h.th}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nt-node" className={labelClass}>
                {isEnglish ? "Lunar node" : "โหนดดวงจันทร์ (ราหู)"}
              </label>
              <select id="nt-node" value={nodeType} onChange={(e) => setNodeType(e.target.value as NodeType)} className={fieldClass}>
                <option value="true">{isEnglish ? "True node" : "โหนดจริง (True)"}</option>
                <option value="mean">{isEnglish ? "Mean node" : "โหนดเฉลี่ย (Mean)"}</option>
              </select>
            </div>
            <div>
              <label htmlFor="nt-orb" className={labelClass}>
                {isEnglish ? "Aspect orbs" : "ความกว้างของมุม (orb)"}
              </label>
              <select id="nt-orb" value={orbScale} onChange={(e) => setOrbScale(Number(e.target.value))} className={fieldClass}>
                <option value={0.75}>{isEnglish ? "Narrow" : "แคบ"}</option>
                <option value={1}>{isEnglish ? "Standard" : "มาตรฐาน"}</option>
                <option value={1.25}>{isEnglish ? "Wide" : "กว้าง"}</option>
              </select>
            </div>
          </div>
        </details>

        {error && (
          <p role="alert" className="text-sm text-err border-l-2 border-err pl-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-gold-glass w-full py-3 px-6 text-sm font-serif-th font-bold duration-200 cursor-pointer active:scale-95 tracking-wide disabled:opacity-70"
        >
          {busy ? (isEnglish ? "Calculating..." : "กำลังคำนวณ...") : result ? (isEnglish ? "Recalculate chart" : "คำนวณผังใหม่") : isEnglish ? "Create my chart" : "สร้างผังดวงของฉัน"}
        </button>
        <p className="text-xs text-muted text-center">
          {isEnglish
            ? "Calculated entirely in your browser. Your birth data is never sent or saved."
            : "คำนวณในเครื่องของคุณทั้งหมด ข้อมูลวันเกิดไม่ถูกส่งออกไปและไม่ถูกบันทึก"}
        </p>
      </form>

      <div ref={resultRef} className="scroll-mt-24" aria-live="polite">
        {result && (
          <Suspense fallback={<p className="text-sm text-muted text-center">{isEnglish ? "Drawing your chart..." : "กำลังวาดผังดวง..."}</p>}>
            <NatalResult chart={result.chart} lang={lang} meta={result.meta} cards={cards} />
            <div className="v2-nt-noprint flex flex-wrap justify-center gap-2 pt-6">
              <button type="button" onClick={() => window.print()} className="rounded-full border border-line-warm bg-surface px-4 py-2 text-sm text-ink min-h-[44px]">
                {isEnglish ? "Print or save as PDF" : "พิมพ์ หรือบันทึกเป็น PDF"}
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("natal-app")?.scrollIntoView({ behavior: smoothScrollBehavior() })}
                className="rounded-full border border-line-warm bg-surface px-4 py-2 text-sm text-ink min-h-[44px]"
              >
                {isEnglish ? "Edit birth details" : "แก้ข้อมูลเกิด"}
              </button>
            </div>
          </Suspense>
        )}
      </div>
    </div>
  );
}
