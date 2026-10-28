"use client";

import { useMemo, useState } from "react";
import type { ChartSpec } from "@/lib/astro/chart-spec";
import type { Lang } from "@/data/natal/content";
import { LUNAR_MONTH_TH, NAKSAT_EN, NAKSAT_TH } from "@/lib/astro/thai-lunar";
import { checkName, mahaTaksa, PLANET_DIRECTION, PLANET_LETTERS, sevenNumbers, taksa, TAKSA_POSITIONS, thaiBirthDay } from "@/lib/astro/thai-astro";
import { MAHA_TAKSA_TONE, SEVEN_COLUMNS, TAKSA_TEXT, THAI_DAY_NAME, THAI_PLANET_NAME } from "@/data/natal/thai-content";
import { MoreLabel, SectionHead, SummaryBox } from "./NatalUi";

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

  const sriPlanet = board.sri;
  const kalaPlanet = board.kalakini;
  const kalaLetters = kalaPlanet === 1 ? (isTh ? "สระทั้งหมด" : "all vowels") : PLANET_LETTERS[kalaPlanet].split("").join(" ");
  const hiCol = sums.indexOf(hi);
  const loCol = sums.indexOf(lo);
  const colName = (i: number) => (isTh ? `${SEVEN_COLUMNS[0][i].name} (${SEVEN_COLUMNS[0][i].meaning.th})` : `${SEVEN_COLUMNS[0][i].en} (${SEVEN_COLUMNS[0][i].meaning.en})`);

  return (
    <div className="space-y-6 sm:space-y-8">
      <p className="v2-nr-lead">
        {isTh
          ? "โหราไทยพื้นฐานจากวันเกิด คำนวณตามตำราในเครื่องนี้ ไม่ใช้ AI · อยากได้ลัคนาแบบไทยให้เลือก \"นิรายนะ\" ในตั้งค่าขั้นสูง"
          : "Basic Thai astrology from your birth date, calculated on this device from the traditional texts. For a Thai-style rising sign, choose \"sidereal\" in advanced settings."}
      </p>

      <SummaryBox
        title={isTh ? "สรุปโหราไทยของคุณ" : "Your Thai astrology at a glance"}
        rows={[
          {
            label: isTh ? "วันเกิดแบบไทย" : "Thai birthday",
            text: (
              <>
                <strong>{THAI_DAY_NAME[birth.planet][lang]}</strong> · {lunarText}
              </>
            ),
          },
          {
            label: isTh ? "ดาวศรี (เสน่ห์ โชคดี)" : "Sri planet (grace)",
            text: isTh ? `ดาว${pn(sriPlanet)} · ${PLANET_DIRECTION[sriPlanet].th}` : `${pn(sriPlanet)} · ${PLANET_DIRECTION[sriPlanet].en}`,
          },
          {
            label: isTh ? "อักษรที่ควรเลี่ยง" : "Letters to avoid",
            text: isTh ? `กาลกิณีคือดาว${pn(kalaPlanet)}: ${kalaLetters}` : `Kalakini is ${pn(kalaPlanet)}: ${kalaLetters}`,
          },
          ...(current
            ? [
                {
                  label: isTh ? "ช่วงชีวิตตอนนี้" : "Current life period",
                  text: isTh
                    ? `ดาว${pn(current.planet)}เสวยอายุ ถึงอายุ ${ageText(current.to, true)} · ${MAHA_TAKSA_TONE[current.planet].th}`
                    : `${pn(current.planet)} rules until age ${ageText(current.to, false)}: ${MAHA_TAKSA_TONE[current.planet].en}.`,
                },
              ]
            : []),
          {
            label: isTh ? "เลข 7 ตัว" : "Seven Numbers",
            text: isTh ? `ผลรวมสูงสุด: ${colName(hiCol)} ${hi} · ต่ำสุด: ${colName(loCol)} ${lo}` : `Highest sum: ${colName(hiCol)} ${hi}. Lowest: ${colName(loCol)} ${lo}.`,
          },
        ]}
      />
      {(birth.shifted || birth.uncertain) && (
        <p className="v2-nr-note border-l-2 border-gold-ink pl-2">
          {birth.shifted
            ? isTh
              ? "เกิดก่อน 06.00 น. ตำราโหรไทยนับเป็นวันก่อนหน้า"
              : "Born before 6 a.m., so Thai astrology counts the previous day."
            : isTh
              ? "ไม่ทราบเวลาเกิด จึงถือเป็นกลางวัน ถ้าเกิดก่อน 06.00 น. ให้นับวันก่อนหน้า และถ้าเกิดวันพุธหลัง 18.00 น. จะเป็นพุธกลางคืน (ราหู)"
              : "Birth time unknown, so daytime is assumed. Before 6 a.m. counts as the previous day; Wednesday after 6 p.m. is Wednesday night (Rahu)."}
        </p>
      )}

      <section aria-labelledby="th-taksa" className="v2-nr-sec">
        <SectionHead id="th-taksa" n={1} title={isTh ? "ทักษา: ดาว 8 ตำแหน่งของคุณ" : "Your Taksa board"}>
          {isTh ? "แต่ละตำแหน่งดูแลเรื่องหนึ่งของชีวิต ใช้ตั้งชื่อ เลือกสี และเลือกทิศ" : "Each position looks after one area of life; used for names, colours and directions."}
        </SectionHead>
        <ul className="v2-nr-items sm:grid-cols-2">
          {TAKSA_POSITIONS.map((pos) => {
            const p = board[pos];
            return (
              <li key={pos} className={pos === "kalakini" ? "is-tense" : pos === "sri" ? "is-harmonious" : undefined}>
                <span className="v2-nr-item-t">
                  {TAKSA_TEXT[pos].name[lang]} {isTh ? `· ดาว${pn(p)}` : `· ${pn(p)}`}
                </span>
                <span className="v2-nr-item-d">{TAKSA_TEXT[pos].meaning[lang]}</span>
                <span className="v2-nr-item-meta">
                  {isTh ? "อักษร" : "Letters"}: {p === 1 ? (isTh ? "สระทั้งหมด" : "all vowels") : PLANET_LETTERS[p].split("").join(" ")} · {PLANET_DIRECTION[p][lang]}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="th-name" className="v2-nr-sec">
        <SectionHead id="th-name" n={2} title={isTh ? "ตรวจอักษรในชื่อ" : "Check the letters in a name"}>
          {isTh ? "พิมพ์ชื่อภาษาไทย ระบบบอกว่าแต่ละตัวอยู่ตำแหน่งไหนของทักษา" : "Type a Thai name to see where each letter falls on your Taksa board."}
        </SectionHead>
        <div className="v2-nr-controls">
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
            className="glass-field w-full min-h-[48px] rounded-xl border border-line-interactive-warm px-3 py-2.5 text-base text-ink"
            autoComplete="off"
          />
          {nameCheck.letters.length > 0 && (
            <>
              <p className={`text-sm font-semibold border-l-2 pl-2 ${nameCheck.kalakini.length ? "text-err border-err" : "text-ink border-gold-ink"}`}>
                {nameCheck.kalakini.length
                  ? isTh
                    ? `มีอักษรกาลกิณีของคน${THAI_DAY_NAME[birth.planet].th}: ${nameCheck.kalakini.join(" ")}`
                    : `Contains Kalakini letters for ${THAI_DAY_NAME[birth.planet].en}: ${nameCheck.kalakini.join(" ")}`
                  : isTh
                    ? "ไม่มีอักษรกาลกิณี ใช้ได้"
                    : "No Kalakini letters"}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {nameCheck.letters.map((l, i) => (
                  <li key={i} className={`rounded-lg border px-2 py-1 text-xs ${l.position === "kalakini" ? "border-err text-err" : "border-line-warm text-ink"}`}>
                    {l.ch} {TAKSA_TEXT[l.position].name.th}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="th-maha" className="v2-nr-sec">
        <SectionHead id="th-maha" n={3} title={isTh ? "มหาทักษา: ดาวที่ดูแลช่วงชีวิต" : "Maha Taksa: life periods"}>
          {isTh ? "ชีวิต 108 ปีแบ่งเป็น 8 ช่วง แต่ละช่วงมีดาวหนึ่งดวงเสวยอายุ" : "A 108-year life is divided into eight periods, each ruled by one planet."}
        </SectionHead>
        {current && (
          <ul className="v2-nr-items">
            <li className="is-neutral">
              <span className="v2-nr-item-meta">{isTh ? `ตอนนี้อายุ ${ageText(age, true)}` : `You are ${ageText(age, false)}`}</span>
              <span className="v2-nr-item-t">
                {isTh
                  ? `ดาว${pn(current.planet)}เสวย (อายุ ${ageText(current.from, true)} ถึง ${ageText(current.to, true)})`
                  : `${pn(current.planet)} rules (ages ${ageText(current.from, false)} to ${ageText(current.to, false)})`}
              </span>
              <span className="v2-nr-item-d">{MAHA_TAKSA_TONE[current.planet][lang]}</span>
              {currentSub && (
                <span className="v2-nr-item-meta">
                  {isTh ? `ดาว${pn(currentSub.planet)}แทรก ถึงอายุ ${ageText(currentSub.to, true)}` : `${pn(currentSub.planet)} sub-period until ${ageText(currentSub.to, false)}`}
                </span>
              )}
            </li>
          </ul>
        )}
        <div className="v2-nr-deep">
          <details>
            <summary>
              {isTh ? "ช่วงมหาทักษาทั้ง 8 ช่วง" : "All eight periods"}
              <MoreLabel isTh={isTh} />
            </summary>
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
                  <tr key={p.planet} className={p === current ? "font-semibold is-focus" : ""}>
                    <td>
                      {pn(p.planet)}
                      {p === current && <span className="block text-xs text-gold-ink">{isTh ? "ช่วงปัจจุบัน" : "current"}</span>}
                    </td>
                    <td>
                      {Math.round(p.from)} {isTh ? "ถึง" : "to"} {Math.round(p.to)}
                    </td>
                    <td>{p.to - p.from}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="v2-nr-note">
              {isTh
                ? "เริ่มที่ดาววันเกิดเต็มช่วงตั้งแต่เกิด แล้วเวียนตามลำดับทักษา ดาวแทรกในแต่ละช่วงยาว (กำลังดาวเสวย × กำลังดาวแทรก ÷ 108) ปี"
                : "Starts with your birthday planet from birth, then follows the Taksa order. Each sub-period lasts (ruler years × sub-ruler years ÷ 108) years."}
            </p>
          </details>
        </div>
      </section>

      <section aria-labelledby="th-seven" className="v2-nr-sec">
        <SectionHead id="th-seven" n={4} title={isTh ? "เลข 7 ตัว 4 ฐาน" : "The Seven Numbers"}>
          {isTh ? "แถวรวมบอกกำลังของแต่ละเรื่อง ช่องสูงสุดคือเรื่องที่เด่น ช่องต่ำสุดคือเรื่องที่ต้องดูแล" : "The sum row shows the strength of each area: highest is strongest, lowest needs care."}
        </SectionHead>
        <div className="v2-nr-controls">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="th-month" className="block text-xs text-muted mb-1">
                {isTh ? "เดือนจันทรคติ" : "Lunar month"}
              </label>
              <select id="th-month" value={seven.month} onChange={(e) => setMonthSel(Number(e.target.value))} className="glass-field w-full min-h-[48px] rounded-xl border border-line-interactive-warm px-2 py-2 text-base text-ink">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((mo) => (
                  <option key={mo} value={mo}>
                    {isTh ? `เดือน${LUNAR_MONTH_TH[mo]}` : `Month ${mo}`}
                    {mo === auto.month ? (isTh ? " (คำนวณได้)" : " (calculated)") : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="th-naksat" className="block text-xs text-muted mb-1">
                {isTh ? "ปีนักษัตร" : "Zodiac year"}
              </label>
              <select id="th-naksat" value={seven.naksat} onChange={(e) => setNaksatSel(Number(e.target.value))} className="glass-field w-full min-h-[48px] rounded-xl border border-line-interactive-warm px-2 py-2 text-base text-ink">
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
          <p className="v2-nr-note">
            {isTh
              ? `ช่องรวมสูงสุด ${hi} คือเรื่องที่มีกำลังมาก · ต่ำสุด ${lo} คือเรื่องที่ต้องประคับประคอง · เดือนและปีนักษัตรคำนวณจากปฏิทินจันทรคติ (ปีนักษัตรเปลี่ยนวันขึ้น 1 ค่ำ เดือน 5) ถ้าปฏิทินโหรของคุณต่าง แก้ได้ด้านบน`
              : `Highest sum ${hi} is a strong area; lowest ${lo} needs care. Month and zodiac year come from the Thai lunar calendar (the zodiac year changes on the first waxing day of month 5); adjust them above if your almanac differs.`}
          </p>
        </div>
        <div className="v2-nr-deep">
          <details>
            <summary>
              {isTh ? "ความหมายของแต่ละช่อง" : "What each column means"}
              <MoreLabel isTh={isTh} />
            </summary>
            <ul className="v2-nr-items">
              {SEVEN_COLUMNS[0].map((c, i) => (
                <li key={c.name} className={sums[i] === hi ? "is-harmonious" : sums[i] === lo ? "is-tense" : undefined}>
                  <span className="v2-nr-item-t">
                    {isTh ? "ช่อง" : "Column"} {i + 1} · {isTh ? "รวม" : "sum"} {sums[i]}
                  </span>
                  <span className="v2-nr-item-d">
                    {SEVEN_COLUMNS[0][i].name} / {SEVEN_COLUMNS[1][i].name} / {SEVEN_COLUMNS[2][i].name}
                  </span>
                  <span className="v2-nr-item-meta">
                    {SEVEN_COLUMNS[0][i].meaning[lang]} · {SEVEN_COLUMNS[1][i].meaning[lang]} · {SEVEN_COLUMNS[2][i].meaning[lang]}
                  </span>
                </li>
              ))}
            </ul>
          </details>
          <details>
            <summary>
              {isTh ? "ความแม่นของปฏิทินจันทรคติ" : "About the lunar calendar"}
              <MoreLabel isTh={isTh} />
            </summary>
            <p className="v2-nr-note">
              {isTh
                ? "วันจันทรคติคำนวณตามคัมภีร์สุริยยาตร์แบบปฏิทินหลวง บางปีปฏิทินที่ประกาศจริงต่างได้ 1 วัน เทียบกับปฏิทินโหรของคุณได้"
                : "The lunar date follows the traditional Thai calendar arithmetic; the published calendar occasionally differs by one day."}
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
