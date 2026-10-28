"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { THAI_PROVINCES, type BirthPlace } from "@/data/natal/places";
import { deleteSavedChart, loadSavedCharts, saveChart, type SavedChart, type SavedPlace } from "@/lib/astro/saved-charts";
import { CitySearch, type PickedCity } from "./CitySearch";
import { encodeChartShare } from "@/lib/astro/chart-share";
import { smoothScrollBehavior } from "@/lib/use-motion-safe";
import { formatUtcOffset, localToUtc, localToUtcFixed } from "@/lib/astro/timezone";
import type { HouseSystem, NatalChart, NodeType, Zodiac } from "@/lib/astro/natal";

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
  /** คำสำคัญหน้าตรง 3 คำ — มีเฉพาะฝั่งบิลด์ (NATAL_CARDS) ไม่ส่งเข้า island · หน้าเว็บอ่านจาก src/data/natal/card-keywords.ts */
  kw?: { th: string; en: string };
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
/** ดวงวันนี้ — โหลดเมื่อมีผังบันทึกไว้ในเครื่องเท่านั้น (ดึงตัวคำนวณตามมา) */
const NatalToday = React.lazy(() => import("./NatalToday"));
/** ผังที่เพื่อนส่งมาทางลิงก์ `#add=` — โหลดเมื่อเปิดลิงก์แบบนั้นเท่านั้น */
const NatalImport = React.lazy(() => import("./NatalImport"));
/** รายงานฉบับเต็มแบบเสียเงิน (ใช้รอบที่เติมไว้ 1 รอบ) — โหลดเมื่อกดปุ่มเท่านั้น */
const NatalReportPanel = React.lazy(() => import("./NatalReportPanel"));

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

/* ช่องกรอก 16px กัน iPhone ซูมตอนแตะ (แผน UI 2.0 ข้อ 5.2) */
const fieldClass =
  "glass-field w-full min-h-[48px] rounded-xl border border-line-interactive-warm px-3 py-2.5 text-base font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors";
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
  const [zodiac, setZodiac] = useState<Zodiac>("tropical");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ chart: NatalChart; meta: NatalMeta; spec: ChartSpec } | null>(null);
  // ผังที่บันทึกไว้อ่านหลัง hydrate เท่านั้น (HTML จากเซิร์ฟเวอร์ต้องตรงกับรอบแรกของเบราว์เซอร์)
  useEffect(() => setSaved(loadSavedCharts()), []);
  // ลิงก์ผังจากเพื่อน: ข้อมูลอยู่หลัง # (ไม่ถึงเซิร์ฟเวอร์) · ไม่บันทึกจนกว่าผู้ใช้จะกดเอง
  const [incoming, setIncoming] = useState<string | null>(null);
  useEffect(() => {
    const h = window.location.hash;
    if (h.startsWith("#add=")) setIncoming(h.slice(5));
  }, []);
  const [shareStep, setShareStep] = useState<"idle" | "confirm" | "done">("idle");
  const [reportOpen, setReportOpen] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
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
    return { name: name.trim().slice(0, 40), day, month, yearCe, hour, minute, timeKnown, place, houseSystem, nodeType, orbScale, asteroids, zodiac };
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
        zodiac: spec.zodiac,
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
  function openSaved(c: ChartSpec) {
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
    setZodiac(c.zodiac ?? "tropical");
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
      {incoming && (
        <div className="v2-nt-noprint">
          <Suspense fallback={null}>
            <NatalImport
              code={incoming}
              lang={lang}
              onSave={(spec) => {
                const next = saveChart(spec);
                if (next) setSaved(next);
                return !!next;
              }}
              onOpen={(spec) => openSaved(spec)}
              onClose={() => setIncoming(null)}
            />
          </Suspense>
        </div>
      )}
      {saved.length > 0 && (
        <div className="v2-nt-noprint">
          <Suspense fallback={null}>
            <NatalToday charts={saved} cards={cards} lang={lang} onOpen={openSaved} />
          </Suspense>
        </div>
      )}
      <form onSubmit={handleSubmit} className="v2-nt-noprint v2-nt-form" noValidate>
        {saved.length > 0 && (
          <div className="v2-nt-saved">
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

        <div className="v2-nt-sheet">
          <div className="v2-nt-row">
            <div className="v2-nt-row-head">
              <span className="v2-nt-row-n ui2-num" aria-hidden="true">1</span>
              <div>
                <label htmlFor="nt-name" className="v2-nt-row-t">
                  {isEnglish ? "Name" : "ชื่อ"}
                </label>
                <p className="v2-nt-row-hint">{isEnglish ? "Optional, only shown on your chart" : "ไม่บังคับ ใช้แสดงบนผังเท่านั้น"}</p>
              </div>
            </div>
            <div className="v2-nt-row-body">
              <input
                id="nt-name"
                type="text"
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                autoComplete="off"
                placeholder={isEnglish ? "e.g. Mia" : "เช่น มายด์"}
              />
            </div>
          </div>

          <div className="v2-nt-row" role="group" aria-labelledby="nt-date-t">
            <div className="v2-nt-row-head">
              <span className="v2-nt-row-n ui2-num" aria-hidden="true">2</span>
              <div>
                <p id="nt-date-t" className="v2-nt-row-t">
                  {isEnglish ? "Date of birth" : "วันเดือนปีเกิด"}
                </p>
                <p className="v2-nt-row-hint">{isEnglish ? `Year ${years}` : `ปี ${years}`}</p>
              </div>
            </div>
            <div className="v2-nt-row-body space-y-2">
              <div className="v2-nt-date">
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
            </div>
          </div>

          <div className="v2-nt-row" role="group" aria-labelledby="nt-time-t">
            <div className="v2-nt-row-head">
              <span className="v2-nt-row-n ui2-num" aria-hidden="true">3</span>
              <div>
                <p id="nt-time-t" className="v2-nt-row-t">
                  {isEnglish ? "Time of birth" : "เวลาเกิด"}
                </p>
                <p className="v2-nt-row-hint">{isEnglish ? "Local clock time. Needed for the Ascendant and houses" : "ตามเวลาท้องถิ่น ใช้หาลัคนาและเรือนชะตา"}</p>
              </div>
            </div>
            <div className="v2-nt-row-body space-y-2">
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
              <label className="v2-nt-check">
                <input type="checkbox" checked={!timeKnown} onChange={(e) => setTimeKnown(!e.target.checked)} />
                {isEnglish ? "I don't know my birth time" : "ไม่ทราบเวลาเกิด"}
              </label>
            </div>
          </div>

          <div className="v2-nt-row" role="group" aria-labelledby="nt-place-t">
            <div className="v2-nt-row-head">
              <span className="v2-nt-row-n ui2-num" aria-hidden="true">4</span>
              <div>
                <p id="nt-place-t" className="v2-nt-row-t">
                  {isEnglish ? "Place of birth" : "สถานที่เกิด"}
                </p>
                <p className="v2-nt-row-hint">
                  {placeMode !== "custom"
                    ? isEnglish
                      ? "Daylight saving and historical time zones are applied automatically"
                      : "ระบบปรับเวลาออมแสงและเขตเวลาในอดีตให้เอง (เช่น ไทยก่อนปี 2463 ใช้เวลา +6:42)"
                    : isEnglish
                      ? "North and east are positive numbers"
                      : "ทิศเหนือและทิศตะวันออกเป็นค่าบวก"}
                </p>
              </div>
            </div>
            <div className="v2-nt-row-body space-y-2">
              <div className="v2-nt-seg v2-nt-seg-fill" role="group" aria-label={isEnglish ? "Place type" : "ประเภทสถานที่"}>
                {(
                  [
                    ["thai", isEnglish ? "Thailand" : "จังหวัดในไทย"],
                    ["world", isEnglish ? "Any city" : "ค้นหาเมือง"],
                    ["custom", isEnglish ? "Coordinates" : "ระบุพิกัด"],
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
                    <label htmlFor="nt-lat" className="block text-xs text-muted mb-1">
                      {isEnglish ? "Latitude" : "ละติจูด"}
                    </label>
                    <input id="nt-lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} className={fieldClass} />
                  </div>
                  <div>
                    <label htmlFor="nt-lon" className="block text-xs text-muted mb-1">
                      {isEnglish ? "Longitude" : "ลองจิจูด"}
                    </label>
                    <input id="nt-lon" inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} className={fieldClass} />
                  </div>
                  <div>
                    <label htmlFor="nt-off" className="block text-xs text-muted mb-1">
                      {isEnglish ? "UTC offset (h)" : "เขตเวลา UTC (ชม.)"}
                    </label>
                    <input id="nt-off" inputMode="decimal" value={offsetH} onChange={(e) => setOffsetH(e.target.value)} className={fieldClass} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <details className="v2-nt-adv">
          <summary>
            <span className="min-w-0">
              <span className="v2-nt-row-t">{isEnglish ? "Advanced settings" : "ตั้งค่าขั้นสูง"}</span>
              <span className="v2-nt-adv-sum">
                {[
                  zodiac === "tropical" ? (isEnglish ? "Tropical" : "สายนะ") : isEnglish ? "Sidereal" : "นิรายนะ",
                  HOUSE_OPTIONS.find((h) => h.id === houseSystem)?.[isEnglish ? "en" : "th"],
                  nodeType === "true" ? (isEnglish ? "True node" : "โหนดจริง") : isEnglish ? "Mean node" : "โหนดเฉลี่ย",
                ].join(", ")}
              </span>
            </span>
            <span className="v2-nt-adv-tog" aria-hidden="true">
              <span className="v2-nt-adv-closed">{isEnglish ? "Change" : "ปรับ"}</span>
              <span className="v2-nt-adv-open">{isEnglish ? "Close" : "ปิด"}</span>
            </span>
          </summary>
          <div className="grid gap-3 sm:grid-cols-2 pt-3">
            <div>
              <label htmlFor="nt-zodiac" className={labelClass}>
                {isEnglish ? "Zodiac" : "ระบบราศี"}
              </label>
              <select id="nt-zodiac" value={zodiac} onChange={(e) => setZodiac(e.target.value as Zodiac)} className={fieldClass}>
                <option value="tropical">{isEnglish ? "Tropical (Western)" : "สายนะ (สากล)"}</option>
                <option value="lahiri">{isEnglish ? "Sidereal, Lahiri (Thai/Indian)" : "นิรายนะ แบบไทย/อินเดีย (Lahiri)"}</option>
              </select>
            </div>
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
          <label className="v2-nt-check pt-1">
            <input type="checkbox" checked={asteroids} onChange={(e) => setAsteroids(e.target.checked)} />
            {isEnglish ? "Show asteroids (Ceres, Pallas, Juno, Vesta)" : "แสดงดาวเคราะห์น้อย 4 ดวง (ซีรีส พัลลัส จูโน เวสต้า)"}
          </label>
        </details>

        {error && (
          <p role="alert" className="text-sm text-err border-l-2 border-err pl-2">
            {error}
          </p>
        )}

        <div className="v2-nt-submit">
          <button
            type="submit"
            disabled={busy}
            className="btn-gold-glass w-full py-3.5 px-6 text-base font-serif-th font-bold duration-200 cursor-pointer active:scale-95 tracking-wide disabled:opacity-70"
          >
            {busy ? (isEnglish ? "Calculating..." : "กำลังคำนวณ...") : result ? (isEnglish ? "Recalculate chart" : "คำนวณผังใหม่") : isEnglish ? "Create my chart" : "สร้างผังดวงของฉัน"}
          </button>
          <p className="v2-nt-privacy">
            <span className="font-semibold text-ink">{isEnglish ? "Private by design." : "ข้อมูลไม่ออกจากเครื่อง"}</span>{" "}
            {isEnglish
              ? "Calculated entirely in your browser. Your birth data is never sent anywhere, and is only kept on this device if you press save."
              : "คำนวณในเครื่องของคุณทั้งหมด ข้อมูลวันเกิดไม่ถูกส่งออกไปไหน และจะเก็บไว้ในเครื่องนี้ก็ต่อเมื่อคุณกดบันทึกเอง"}
          </p>
        </div>
      </form>

      <div ref={resultRef} className="scroll-mt-24" aria-live="polite">
        {result && (
          <Suspense fallback={<p className="text-sm text-muted text-center">{isEnglish ? "Drawing your chart..." : "กำลังวาดผังดวง..."}</p>}>
            <NatalResult
              chart={result.chart}
              lang={lang}
              meta={result.meta}
              cards={cards}
              spec={result.spec}
              actions={
                <div className="v2-nt-noprint space-y-2">
                  <div className="v2-nr-actions">
                    <button type="button" onClick={handleSave} disabled={saveState === "saved"} className="rounded-full border border-line-warm bg-surface px-4 py-2 text-sm text-ink min-h-[44px] disabled:opacity-70">
                      {saveState === "saved"
                        ? isEnglish
                          ? "Saved"
                          : "บันทึกแล้ว"
                        : isEnglish
                          ? "Save on this device"
                          : "บันทึกในเครื่องนี้"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShareStep("confirm");
                        setShareNote(null);
                      }}
                      className="rounded-full border border-line-warm bg-surface px-4 py-2 text-sm text-ink min-h-[44px]"
                    >
                      {isEnglish ? "Send to a friend" : "ส่งให้เพื่อน"}
                    </button>
                    <button type="button" onClick={() => setReportOpen(true)} className="rounded-full border border-gold-ink bg-surface px-4 py-2 text-sm font-semibold text-ink min-h-[44px]">
                      {isEnglish ? "Full report (PDF)" : "รายงานเต็ม (PDF)"}
                    </button>
                    <button type="button" onClick={() => window.print()} className="rounded-full border border-line-warm bg-surface px-4 py-2 text-sm text-ink min-h-[44px]">
                      {isEnglish ? "Print" : "พิมพ์"}
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById("natal-app")?.scrollIntoView({ behavior: smoothScrollBehavior() })}
                      className="rounded-full border border-line-warm bg-surface px-4 py-2 text-sm text-ink min-h-[44px]"
                    >
                      {isEnglish ? "Edit birth details" : "แก้ข้อมูลเกิด"}
                    </button>
                  </div>
                  {reportOpen && (
                    <Suspense fallback={null}>
                      <NatalReportPanel spec={result.spec} lang={lang} onClose={() => setReportOpen(false)} />
                    </Suspense>
                  )}
                  {shareStep !== "idle" && (
                    <div className="mx-auto mt-3 max-w-xl rounded-xl border border-line-warm bg-surface/70 p-3 space-y-2 text-sm text-ink">
                      <p>
                        {isEnglish
                          ? "The link contains the birth date, time, place and name of this chart, so your friend can open it and compare charts. It goes straight from you to them and is not stored by the site. Only send it to people you trust."
                          : "ลิงก์นี้มีวันเวลาสถานที่เกิดและชื่อของผังนี้ เพื่อนเปิดแล้วเทียบผังกันได้ทันที ข้อมูลส่งจากคุณถึงเพื่อนตรง ๆ เว็บไม่ได้เก็บไว้ ส่งให้เฉพาะคนที่ไว้ใจเท่านั้น"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const url = `${window.location.origin}${isEnglish ? "/en" : ""}/natal-chart#add=${encodeChartShare(result.spec)}`;
                            try {
                              if (navigator.share) {
                                await navigator.share({ title: isEnglish ? "My natal chart" : "ผังดวงของฉัน", url });
                                setShareStep("done");
                                return;
                              }
                            } catch (err) {
                              if ((err as { name?: string })?.name === "AbortError") return;
                            }
                            try {
                              await navigator.clipboard.writeText(url);
                              setShareNote(isEnglish ? "Link copied. Paste it into a chat with your friend." : "คัดลอกลิงก์แล้ว วางในแชทกับเพื่อนได้เลย");
                            } catch {
                              setShareNote(url);
                            }
                            setShareStep("done");
                          }}
                          className="rounded-full btn-gold-glass px-4 min-h-[44px] text-sm font-bold"
                        >
                          {isEnglish ? "Create the link" : "สร้างลิงก์"}
                        </button>
                        <button type="button" onClick={() => setShareStep("idle")} className="rounded-full border border-line-warm px-4 min-h-[44px] text-sm text-ink">
                          {isEnglish ? "Cancel" : "ยกเลิก"}
                        </button>
                      </div>
                      {shareNote && <p className="text-xs text-muted break-all">{shareNote}</p>}
                    </div>
                  )}
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
                </div>
              }
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
