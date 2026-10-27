"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { THAI_PROVINCES, type BirthPlace } from "@/data/natal/places";
import { deleteSavedChart, loadSavedCharts, saveChart, type SavedChart, type SavedPlace } from "@/lib/astro/saved-charts";
import { CitySearch, type PickedCity } from "./CitySearch";
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
  /** ปีเกิด ค.ศ. ตามเวลาท้องถิ่น (ใช้หาผังวันเกิดปีต่อ ๆ ไป) */
  birthYear: number;
  /** เขตเวลา IANA ของสถานที่เกิด (ระบุพิกัดเอง = ไม่มี) */
  zone?: string;
}

const NatalResult = React.lazy(() => import("./NatalResult"));

/** ทุกอย่างที่ใช้สร้างผังซ้ำได้ (= ข้อมูลที่บันทึกลงเครื่องเมื่อผู้ใช้กดบันทึก) */
type ChartSpec = Omit<SavedChart, "id" | "savedAt">;

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
  const [worldCity, setWorldCity] = useState<PickedCity | null>(null);
  const [saved, setSaved] = useState<SavedChart[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">("idle");
  const [lat, setLat] = useState("13.7525");
  const [lon, setLon] = useState("100.4942");
  const [offsetH, setOffsetH] = useState("7");
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [nodeType, setNodeType] = useState<NodeType>("true");
  const [orbScale, setOrbScale] = useState(1);
  const [asteroids, setAsteroids] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ chart: NatalChart; meta: NatalMeta; spec: ChartSpec } | null>(null);
  // ผังที่บันทึกไว้อ่านหลัง hydrate เท่านั้น (HTML จากเซิร์ฟเวอร์ต้องตรงกับรอบแรกของเบราว์เซอร์)
  useEffect(() => setSaved(loadSavedCharts()), []);
  const resultRef = useRef<HTMLDivElement>(null);

  const yearNum = Number.parseInt(yearInput, 10);
  const yearCe = Number.isFinite(yearNum) ? (era === "be" ? yearNum - 543 : yearNum) : NaN;
  const maxDay = Number.isFinite(yearCe) ? daysIn(yearCe, month) : 31;

  /** ข้อมูลเกิดจากฟอร์ม ➔ สเปกผัง (ตรวจค่าแล้ว) · ผิดเมื่อไหร่ตั้งข้อความแล้วคืน null */
  function specFromForm(): ChartSpec | null {
    if (!Number.isFinite(yearCe) || yearCe < MIN_YEAR || yearCe > MAX_YEAR) {
      setError(
        isEnglish
          ? `Please enter a year between ${MIN_YEAR} and ${MAX_YEAR}.`
          : `กรุณาใส่ปีเกิดระหว่าง พ.ศ. ${MIN_YEAR + 543} ถึง ${MAX_YEAR + 543} (ค.ศ. ${MIN_YEAR} ถึง ${MAX_YEAR})`,
      );
      return null;
    }
    if (day > maxDay) {
      setError(isEnglish ? "That date does not exist." : "วันที่นี้ไม่มีในเดือนที่เลือก");
      return null;
    }
    let place: SavedPlace;
    if (placeMode === "custom") {
      const la = Number.parseFloat(lat);
      const lo = Number.parseFloat(lon);
      const off = Number.parseFloat(offsetH);
      if (!(Math.abs(la) <= 89.9) || !(Math.abs(lo) <= 180) || !(Math.abs(off) <= 14)) {
        setError(isEnglish ? "Check the latitude (-90 to 90), longitude (-180 to 180) and UTC offset (-14 to 14)." : "ตรวจละติจูด (-90 ถึง 90) ลองจิจูด (-180 ถึง 180) และเขตเวลา (-14 ถึง 14) อีกครั้ง");
        return null;
      }
      const label = `${la.toFixed(4)}, ${lo.toFixed(4)}`;
      place = { mode: "custom", lat: la, lon: lo, label, labelEn: label, fixedOffset: off * 60 };
    } else if (placeMode === "world") {
      if (!worldCity) {
        setError(isEnglish ? "Search and pick your birth city first." : "ค้นหาแล้วเลือกเมืองเกิดก่อน");
        return null;
      }
      place = { mode: "world", lat: worldCity.lat, lon: worldCity.lon, label: worldCity.label, labelEn: worldCity.labelEn, zone: worldCity.zone };
    } else {
      const p: BirthPlace | undefined = THAI_PROVINCES.find((x) => x.id === thaiId);
      if (!p) return null;
      place = { mode: "thai", lat: p.lat, lon: p.lon, label: p.th, labelEn: p.en, zone: p.zone, refId: p.id };
    }
    return { name: name.trim().slice(0, 40), day, month, yearCe, hour, minute, timeKnown, place, houseSystem, nodeType, orbScale, asteroids };
  }

  async function runChart(spec: ChartSpec) {
    const { place } = spec;
    const toUtc = (h: number, m: number) =>
      place.zone
        ? localToUtc(place.zone, spec.yearCe, spec.month, spec.day, h, m)
        : { utcMs: localToUtcFixed(place.fixedOffset ?? 0, spec.yearCe, spec.month, spec.day, h, m), offsetMinutes: place.fixedOffset ?? 0 };
    const at = spec.timeKnown ? toUtc(spec.hour, spec.minute) : toUtc(12, 0);
    setBusy(true);
    setSaveState("idle");
    try {
      const { computeNatalChart } = await import("@/lib/astro/natal");
      // ดาวเคราะห์น้อย: ตาราง ~59 KB โหลดเฉพาะเมื่อผู้ใช้เปิดตัวเลือก
      const tables = spec.asteroids ? (await import("@/lib/astro/asteroids")).asteroidTables() : undefined;
      const chart = computeNatalChart({
        asteroids: tables,
        utcMs: at.utcMs,
        timeKnown: spec.timeKnown,
        dayStartUtcMs: spec.timeKnown ? undefined : toUtc(0, 0).utcMs,
        dayEndUtcMs: spec.timeKnown ? undefined : toUtc(23, 59).utcMs,
        lat: place.lat,
        lon: place.lon,
        houseSystem: spec.houseSystem,
        nodeType: spec.nodeType,
        orbScale: spec.orbScale,
      });
      const pad = (n: number) => String(n).padStart(2, "0");
      setResult({
        chart,
        spec,
        meta: {
          name: spec.name,
          dateText: isEnglish ? `${spec.day} ${MONTHS_EN[spec.month - 1]} ${spec.yearCe}` : `${spec.day} ${MONTHS_TH[spec.month - 1]} พ.ศ. ${spec.yearCe + 543}`,
          timeText: spec.timeKnown ? `${pad(spec.hour)}:${pad(spec.minute)}${isEnglish ? "" : " น."}` : isEnglish ? "time unknown" : "ไม่ทราบเวลาเกิด",
          placeText: isEnglish ? (place.labelEn ?? place.label) : place.label,
          offsetText: formatUtcOffset(at.offsetMinutes),
          birthYear: spec.yearCe,
          zone: place.zone,
        },
      });
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: smoothScrollBehavior(), block: "start" }));
    } catch {
      setError(isEnglish ? "The calculator could not load. Please reload the page and try again." : "โหลดเครื่องคำนวณไม่สำเร็จ กรุณาโหลดหน้าใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const spec = specFromForm();
    if (spec) await runChart(spec);
  }

  /** เปิดผังที่บันทึกไว้: เติมฟอร์มให้ตรง (แก้ต่อได้) แล้วคำนวณทันที */
  function openSaved(c: SavedChart) {
    setError(null);
    setName(c.name);
    setDay(c.day);
    setMonth(c.month);
    setEra(isEnglish ? "ce" : "be");
    setYearInput(String(isEnglish ? c.yearCe : c.yearCe + 543));
    setTimeKnown(c.timeKnown);
    setHour(c.hour);
    setMinute(c.minute);
    setPlaceMode(c.place.mode);
    if (c.place.mode === "thai" && c.place.refId) setThaiId(c.place.refId);
    if (c.place.mode === "world" && c.place.zone)
      setWorldCity({ label: c.place.label, labelEn: c.place.labelEn ?? c.place.label, lat: c.place.lat, lon: c.place.lon, zone: c.place.zone });
    if (c.place.mode === "custom") {
      setLat(String(c.place.lat));
      setLon(String(c.place.lon));
      setOffsetH(String((c.place.fixedOffset ?? 0) / 60));
    }
    setHouseSystem(c.houseSystem);
    setNodeType(c.nodeType);
    setOrbScale(c.orbScale);
    setAsteroids(!!c.asteroids);
    void runChart(c);
  }

  function handleSave() {
    if (!result) return;
    const next = saveChart(result.spec);
    if (next) {
      setSaved(next);
      setSaveState("saved");
    } else {
      setSaveState("failed");
    }
  }

  const years = era === "be" ? `${MIN_YEAR + 543}–${MAX_YEAR + 543}` : `${MIN_YEAR}–${MAX_YEAR}`;

  return (
    <div className="v2-nt space-y-8">
      <form onSubmit={handleSubmit} className="v2-nt-noprint space-y-5" noValidate>
        {saved.length > 0 && (
          <div className="space-y-2">
            <p className={labelClass}>{isEnglish ? "Charts saved on this device" : "ผังที่บันทึกไว้ในเครื่องนี้"}</p>
            <ul className="flex flex-wrap gap-2">
              {saved.map((c) => (
                <li key={c.id} className="inline-flex items-stretch rounded-full border border-line-warm bg-surface overflow-visible">
                  <button type="button" onClick={() => openSaved(c)} className="tap-target px-3 py-1.5 text-sm text-ink">
                    {c.name || (isEnglish ? "Unnamed" : "ไม่มีชื่อ")}{" "}
                    <span className="text-xs text-muted">
                      {c.day}/{c.month}/{isEnglish ? c.yearCe : c.yearCe + 543}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaved(deleteSavedChart(c.id))}
                    aria-label={isEnglish ? `Delete saved chart ${c.name}` : `ลบผังที่บันทึกไว้ ${c.name}`}
                    className="tap-target border-l border-line-warm px-3 text-xs text-err"
                  >
                    {isEnglish ? "Delete" : "ลบ"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
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
                ["world", isEnglish ? "Search any city" : "ค้นหาเมือง"],
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
          {placeMode === "world" && <CitySearch lang={lang} value={worldCity} onPick={setWorldCity} fieldClass={fieldClass} />}
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
          <label className="inline-flex items-center gap-2 text-sm text-ink min-h-[44px] cursor-pointer pt-1">
            <input type="checkbox" checked={asteroids} onChange={(e) => setAsteroids(e.target.checked)} className="w-4 h-4" />
            {isEnglish ? "Show asteroids (Ceres, Pallas, Juno, Vesta)" : "แสดงดาวเคราะห์น้อย 4 ดวง (ซีรีส พัลลัส จูโน เวสต้า)"}
          </label>
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
            ? "Calculated entirely in your browser. Your birth data is never sent anywhere, and is only kept on this device if you press save."
            : "คำนวณในเครื่องของคุณทั้งหมด ข้อมูลวันเกิดไม่ถูกส่งออกไปไหน และจะเก็บไว้ในเครื่องนี้ก็ต่อเมื่อคุณกดบันทึกเอง"}
        </p>
      </form>

      <div ref={resultRef} className="scroll-mt-24" aria-live="polite">
        {result && (
          <Suspense fallback={<p className="text-sm text-muted text-center">{isEnglish ? "Drawing your chart..." : "กำลังวาดผังดวง..."}</p>}>
            <NatalResult chart={result.chart} lang={lang} meta={result.meta} cards={cards} />
            <div className="v2-nt-noprint flex flex-wrap justify-center gap-2 pt-6">
              <button type="button" onClick={handleSave} disabled={saveState === "saved"} className="rounded-full border border-line-warm bg-surface px-4 py-2 text-sm text-ink min-h-[44px] disabled:opacity-70">
                {saveState === "saved"
                  ? isEnglish
                    ? "Saved on this device"
                    : "บันทึกไว้ในเครื่องนี้แล้ว"
                  : isEnglish
                    ? "Save this chart on this device"
                    : "บันทึกผังนี้ไว้ในเครื่องนี้"}
              </button>
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
            {saveState === "failed" && (
              <p role="alert" className="text-sm text-err text-center pt-2">
                {isEnglish ? "Could not save: this browser blocks local storage (private mode?)." : "บันทึกไม่ได้ เบราว์เซอร์นี้ปิดการเก็บข้อมูลในเครื่อง (อาจเป็นโหมดส่วนตัว)"}
              </p>
            )}
            {saveState === "saved" && (
              <p className="text-xs text-muted text-center pt-2">
                {isEnglish
                  ? "Saved only in this browser. Delete it any time from the list above the form."
                  : "เก็บไว้ในเบราว์เซอร์นี้เท่านั้น ลบได้ทุกเมื่อจากรายการเหนือฟอร์ม"}
              </p>
            )}
          </Suspense>
        )}
      </div>
    </div>
  );
}
