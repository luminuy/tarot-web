"use client";

import { useMemo, useState } from "react";
import type { ChartSpec } from "@/lib/astro/chart-spec";
import type { Lang } from "@/data/natal/content";
import { LUNAR_MONTH_TH, NAKSAT_EN, NAKSAT_TH } from "@/lib/astro/thai-lunar";
import { checkName, mahaTaksa, PLANET_DIRECTION, PLANET_LETTERS, sevenNumbers, taksa, TAKSA_POSITIONS, thaiBirthDay } from "@/lib/astro/thai-astro";
import { MAHA_TAKSA_TONE, SEVEN_COLUMNS, TAKSA_TEXT, THAI_DAY_NAME, THAI_PLANET_NAME } from "@/data/natal/thai-content";

/**
 * 🇹🇭 แท็บ "โหราไทย" ในผลผังดวง (lazy) — ทักษา · ตรวจชื่อ · มหาทักษา · เลข 7 ตัว
 * คำนวณในเครื่องจากวันเวลาเกิดที่ผู้ใช้กรอก ไม่ยิง API · ตัวคำนวณอยู่ที่ `thai-astro.ts` / `thai-lunar.ts`
 */

const MS_YEAR = 365.2425 * 86400000;

function ageText(years: number, isTh: boolean): string {
  const y = Math.floor(years + 1e-9);
  const m = Math.floor((years - y) * 12 + 1e-9);
  if (isTh) return m ? `${y} ปี ${m} เดือน` : `${y} ปี`;
  return m ? `${y}y ${m}m` : `${y}y`;
}

export default function NatalThai({ spec, lang }: { spec: ChartSpec; lang: Lang }) {
  const isTh = lang === "th";
  const birth = useMemo(() => thaiBirthDay(spec.yearCe, spec.month, spec.day, spec.hour, spec.timeKnown), [spec]);
  const board = useMemo(() => taksa(birth.planet), [birth]);
  const [name, setName] = useState(spec.name);
  const nameCheck = useMemo(() => checkName(name, birth.planet), [name, birth]);
  const auto = useMemo(() => sevenNumbers(birth), [birth]);
  const [monthSel, setMonthSel] = useState<number | null>(null);
  const [naksatSel, setNaksatSel] = useState<number | null>(null);
  const seven = useMemo(() => sevenNumbers(birth, monthSel ?? undefined, naksatSel ?? undefined), [birth, monthSel, naksatSel]);
  const periods = useMemo(() => mahaTaksa(birth.planet), [birth]);
  // อายุ ณ ตอนนี้ (นับจากวันเกิดท้องถิ่น) — แสดงหลัง hydrate เท่านั้นเพราะอยู่ในแท็บที่ผู้ใช้กดเปิด
  const [now] = useState(() => Date.now());
  const age = (now - Date.UTC(spec.yearCe, spec.month - 1, spec.day)) / MS_YEAR;
  const current = periods.find((p) => age >= p.from && age < p.to);
  const currentSub = current?.sub.find((s) => age >= s.from && age < s.to);

  const pn = (p: keyof typeof THAI_PLANET_NAME) => THAI_PLANET_NAME[p][lang];
  const lunar = auto.lunar;
  const lunarText = isTh
    ? `${lunar.waxing ? "ขึ้น" : "แรม"} ${lunar.phaseDay} ค่ำ เดือน${LUNAR_MONTH_TH[lunar.month]} ปี${NAKSAT_TH[auto.naksat - 1]}`
    : `${lunar.waxing ? "waxing" : "waning"} day ${lunar.phaseDay}, lunar month ${lunar.month === 88 ? "8 (second)" : lunar.month}, year of the ${NAKSAT_EN[auto.naksat - 1]}`;
  const sums = seven.rows[3];
  const hi = Math.max(...sums);
  const lo = Math.min(...sums);

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        {isTh
          ? "โหราศาสตร์ไทยพื้นฐานจากวันเกิด: ทักษา ตรวจอักษรกาลกิณีในชื่อ มหาทักษา (ดาวเสวยอายุ) และเลข 7 ตัว คำนวณตามตำราในเครื่องนี้ ไม่ใช้ AI ส่วนลัคนาแบบไทยเลือก \"นิรายนะ\" ในตั้งค่าขั้นสูง"
          : "Basic Thai astrology from your birth date: the Taksa board, a name-letter check, Maha Taksa life periods and the Seven Numbers. Calculated on this device from the traditional texts. For a Thai-style rising sign, choose \"sidereal\" in advanced settings."}
      </p>

      <section aria-labelledby="th-day" className="altar-card-porcelain rounded-2xl p-4 space-y-2">
        <h3 id="th-day" className="font-serif-th font-bold text-ink">
          {isTh ? "วันเกิดแบบโหราไทย" : "Your Thai astrological birthday"}
        </h3>
        <p className="text-sm text-ink">
          <strong>{THAI_DAY_NAME[birth.planet][lang]}</strong> · {lunarText}
        </p>
        {birth.shifted && (
          <p className="text-xs text-muted">{isTh ? "เกิดก่อน 06.00 น. ตำราโหรไทยนับเป็นวันก่อนหน้า" : "Born before 6 a.m., so Thai astrology counts the previous day."}</p>
        )}
        {birth.uncertain && (
          <p className="text-xs text-muted">
            {isTh
              ? "ไม่ทราบเวลาเกิด จึงถือเป็นกลางวัน ถ้าเกิดก่อน 06.00 น. ให้นับวันก่อนหน้า และถ้าเกิดวันพุธหลัง 18.00 น. จะเป็นพุธกลางคืน (ราหู)"
              : "Birth time unknown, so daytime is assumed. Before 6 a.m. counts as the previous day; Wednesday after 6 p.m. is Wednesday night (Rahu)."}
          </p>
        )}
        <p className="text-xs text-muted">
          {isTh
            ? "วันจันทรคติคำนวณตามคัมภีร์สุริยยาตร์แบบปฏิทินหลวง บางปีปฏิทินที่ประกาศจริงต่างได้ 1 วัน เทียบกับปฏิทินโหรของคุณได้"
            : "The lunar date follows the traditional Thai calendar arithmetic; the published calendar occasionally differs by one day."}
        </p>
      </section>

      <section aria-labelledby="th-taksa" className="space-y-3">
        <h3 id="th-taksa" className="font-serif-th font-bold text-ink">
          {isTh ? "ทักษา (ภูมิทักษาของคุณ)" : "Your Taksa board"}
        </h3>
        <table className="v2-nt-table">
          <thead>
            <tr>
              <th scope="col">{isTh ? "ตำแหน่ง" : "Position"}</th>
              <th scope="col">{isTh ? "ดาว" : "Planet"}</th>
              <th scope="col">{isTh ? "อักษร" : "Letters"}</th>
              <th scope="col">{isTh ? "ความหมาย" : "Meaning"}</th>
            </tr>
          </thead>
          <tbody>
            {TAKSA_POSITIONS.map((pos) => {
              const p = board[pos];
              return (
                <tr key={pos} className={pos === "kalakini" ? "text-err" : ""}>
                  <td>{TAKSA_TEXT[pos].name[lang]}</td>
                  <td>
                    {pn(p)}
                    <span className="block text-xs text-muted">{PLANET_DIRECTION[p][lang]}</span>
                  </td>
                  <td className="whitespace-normal">{p === 1 ? (isTh ? "สระทั้งหมด" : "all vowels") : PLANET_LETTERS[p].split("").join(" ")}</td>
                  <td className="whitespace-normal text-xs">{TAKSA_TEXT[pos].meaning[lang]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="th-name" className="space-y-3">
        <h3 id="th-name" className="font-serif-th font-bold text-ink">
          {isTh ? "ตรวจอักษรในชื่อ" : "Check the letters in a name"}
        </h3>
        <label htmlFor="th-name-input" className="sr-only">
          {isTh ? "ชื่อภาษาไทย" : "Thai name"}
        </label>
        <input
          id="th-name-input"
          type="text"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder={isTh ? "พิมพ์ชื่อภาษาไทย" : "Type a name in Thai"}
          className="glass-field w-full rounded-xl border border-line-interactive-warm px-3 py-2.5 text-sm text-ink"
          autoComplete="off"
        />
        {nameCheck.letters.length > 0 && (
          <>
            <p className={`text-sm ${nameCheck.kalakini.length ? "text-err" : "text-ink"}`}>
              {nameCheck.kalakini.length
                ? isTh
                  ? `มีอักษรกาลกิณีของคน${THAI_DAY_NAME[birth.planet].th}: ${nameCheck.kalakini.join(" ")}`
                  : `Contains Kalakini letters for ${THAI_DAY_NAME[birth.planet].en}: ${nameCheck.kalakini.join(" ")}`
                : isTh
                  ? "ไม่มีอักษรกาลกิณี"
                  : "No Kalakini letters"}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {nameCheck.letters.map((l, i) => (
                <li key={i} className={`rounded-lg border px-2 py-1 text-xs ${l.position === "kalakini" ? "border-err text-err" : "border-line-warm text-ink"}`}>
                  {l.ch} · {TAKSA_TEXT[l.position].name.th}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="th-maha" className="space-y-3">
        <h3 id="th-maha" className="font-serif-th font-bold text-ink">
          {isTh ? "มหาทักษา (ดาวเสวยอายุ 108 ปี)" : "Maha Taksa (108-year life periods)"}
        </h3>
        {current && (
          <p className="text-sm text-ink border-l-2 border-gold-ink pl-2">
            {isTh
              ? `ตอนนี้อายุ ${ageText(age, true)} ดาว${pn(current.planet)}เสวย (${ageText(current.from, true)} ถึง ${ageText(current.to, true)})${currentSub ? ` ดาว${pn(currentSub.planet)}แทรก (ถึงอายุ ${ageText(currentSub.to, true)})` : ""} · ${MAHA_TAKSA_TONE[current.planet].th}`
              : `At ${ageText(age, false)}, ${pn(current.planet)} rules (${ageText(current.from, false)} to ${ageText(current.to, false)})${currentSub ? `, with ${pn(currentSub.planet)} as sub-period until ${ageText(currentSub.to, false)}` : ""}: ${MAHA_TAKSA_TONE[current.planet].en}.`}
          </p>
        )}
        <table className="v2-nt-table">
          <thead>
            <tr>
              <th scope="col">{isTh ? "ดาวเสวย" : "Ruler"}</th>
              <th scope="col">{isTh ? "อายุ" : "Ages"}</th>
              <th scope="col">{isTh ? "ปี" : "Years"}</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.planet} className={p === current ? "font-semibold" : ""}>
                <td>{pn(p.planet)}</td>
                <td>
                  {Math.round(p.from)} {isTh ? "ถึง" : "to"} {Math.round(p.to)}
                </td>
                <td>{p.to - p.from}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted">
          {isTh
            ? "เริ่มที่ดาววันเกิดเต็มช่วงตั้งแต่เกิด แล้วเวียนตามลำดับทักษา ดาวแทรกในแต่ละช่วงยาว (กำลังดาวเสวย × กำลังดาวแทรก ÷ 108) ปี"
            : "Starts with your birthday planet from birth, then follows the Taksa order. Each sub-period lasts (ruler years × sub-ruler years ÷ 108) years."}
        </p>
      </section>

      <section aria-labelledby="th-seven" className="space-y-3">
        <h3 id="th-seven" className="font-serif-th font-bold text-ink">
          {isTh ? "เลข 7 ตัว 4 ฐาน" : "The Seven Numbers (four rows)"}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="th-month" className="text-xs text-muted">
              {isTh ? "เดือนจันทรคติ" : "Lunar month"}
            </label>
            <select id="th-month" value={seven.month} onChange={(e) => setMonthSel(Number(e.target.value))} className="glass-field w-full rounded-xl border border-line-interactive-warm px-2 py-2 text-sm text-ink">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((mo) => (
                <option key={mo} value={mo}>
                  {isTh ? `เดือน${LUNAR_MONTH_TH[mo]}` : `Month ${mo}`}
                  {mo === (auto.month) ? (isTh ? " (คำนวณได้)" : " (calculated)") : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="th-naksat" className="text-xs text-muted">
              {isTh ? "ปีนักษัตร" : "Zodiac year"}
            </label>
            <select id="th-naksat" value={seven.naksat} onChange={(e) => setNaksatSel(Number(e.target.value))} className="glass-field w-full rounded-xl border border-line-interactive-warm px-2 py-2 text-sm text-ink">
              {NAKSAT_TH.map((n, i) => (
                <option key={n} value={i + 1}>
                  {isTh ? `ปี${n}` : NAKSAT_EN[i]}
                  {i + 1 === auto.naksat ? (isTh ? " (คำนวณได้)" : " (calculated)") : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <table className="v2-nt-table text-center">
          <tbody>
            {seven.rows.map((row, r) => (
              <tr key={r} className={r === 3 ? "font-semibold border-t-2 border-line-warm" : ""}>
                <th scope="row" className="text-left text-xs">
                  {[isTh ? "วัน" : "Day", isTh ? "เดือน" : "Month", isTh ? "ปี" : "Year", isTh ? "รวม" : "Sum"][r]}
                </th>
                {row.map((v, c) => (
                  <td key={c} className={r === 3 && (v === hi || v === lo) ? (v === hi ? "text-gold-ink" : "text-err") : ""}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="space-y-1 text-xs text-muted">
          {SEVEN_COLUMNS[0].map((c, i) => (
            <li key={c.name} className={`border-l-2 pl-2 ${sums[i] === hi ? "border-gold-ink text-ink" : sums[i] === lo ? "border-err" : "border-line-warm"}`}>
              {isTh ? "ช่อง" : "Column"} {i + 1}: {SEVEN_COLUMNS[0][i].name} / {SEVEN_COLUMNS[1][i].name} / {SEVEN_COLUMNS[2][i].name} (
              {SEVEN_COLUMNS[0][i].meaning[lang]} · {SEVEN_COLUMNS[1][i].meaning[lang]} · {SEVEN_COLUMNS[2][i].meaning[lang]}) · {isTh ? "รวม" : "sum"} {sums[i]}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">
          {isTh
            ? `ฐานรวมคือผลบวกในแต่ละช่อง ตำราใช้ดูกำลังของแต่ละเรื่อง ช่องที่ผลรวมสูงสุด (${hi}) คือเรื่องที่มีกำลังมาก ช่องที่ต่ำสุด (${lo}) คือเรื่องที่ต้องประคับประคอง เดือนและปีนักษัตรคำนวณจากปฏิทินจันทรคติ (ปีนักษัตรเปลี่ยนวันขึ้น 1 ค่ำ เดือน 5) ถ้าปฏิทินโหรของคุณต่าง แก้ได้ด้านบน`
            : `The sum row adds each column. Tradition reads it as strength: the highest column (${hi}) is a strong area, the lowest (${lo}) needs care. Month and zodiac year come from the Thai lunar calendar (the zodiac year changes on the first waxing day of month 5); adjust them above if your almanac differs.`}
        </p>
      </section>
    </div>
  );
}
