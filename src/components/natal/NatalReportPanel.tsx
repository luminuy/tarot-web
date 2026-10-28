"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ChartSpec } from "@/lib/astro/chart-spec";
import type { Lang } from "@/data/natal/content";
import type { NatalReport } from "@/lib/astro/natal-report";

/**
 * 📄 รายงานผังดวงฉบับเต็ม (โหลดแบบ lazy เมื่อกดปุ่ม) — ใช้รอบดูดวงที่เติมไว้ 1 รอบ (เจ้าของสั่ง "รายงาน PDF แบบเสียเงิน")
 * - ส่งข้อมูลเกิดเมื่อผู้ใช้ติ๊กยินยอมเท่านั้น · เซิร์ฟเวอร์ประกอบรายงานแล้วส่งกลับเป็นข้อมูล
 * - แสดงเป็นหน้าพิมพ์เต็มจอ (portal) แล้วผู้ใช้กด "บันทึกเป็น PDF" จากหน้าต่างพิมพ์ของเบราว์เซอร์
 *   (ฟอนต์ไทยของเว็บถูกต้องทุกตัว ต่างจากการสร้าง PDF ฝั่งเซิร์ฟเวอร์ที่ต้องฝังฟอนต์และจัดสระเอง)
 */
export default function NatalReportPanel({ spec, lang, onClose }: { spec: ChartSpec; lang: Lang; onClose: () => void }) {
  const isTh = lang === "th";
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; reason?: string } | null>(null);
  const [report, setReport] = useState<NatalReport | null>(null);

  useEffect(() => {
    if (!report) return;
    document.body.classList.add("nt-report-open");
    return () => document.body.classList.remove("nt-report-open");
  }, [report]);

  async function create() {
    if (!consent || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/natal/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chart: spec, lang, consent: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { report?: NatalReport; error?: string; reason?: string };
      if (res.ok && data.report) setReport(data.report);
      else setError({ text: data.error || (isTh ? "สร้างรายงานไม่สำเร็จ ลองใหม่อีกครั้ง" : "Could not create the report. Please try again."), reason: data.reason });
    } catch {
      setError({ text: isTh ? "การเชื่อมต่อขัดข้อง ลองใหม่อีกครั้ง" : "Connection interrupted. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="v2-nr-box mx-auto mt-4 max-w-xl text-ink">
      <p className="v2-nr-box-t">{isTh ? "รายงานผังดวงฉบับเต็ม (บันทึกเป็น PDF)" : "Full natal chart report (save as PDF)"}</p>
      <ul className="v2-nr-items">
        {(isTh
          ? ["ตำแหน่งดาวและคำอธิบายทุกดวง", "มุมสัมพันธ์ ดาวฤกษ์ และจุด Lots", "โหราไทย: ทักษา มหาทักษา เลข 7 ตัว", "ดาวเดินช้า 12 เดือนข้างหน้า และผังวันเกิดปีนี้"]
          : ["Every position, each one explained", "Aspects, fixed stars and lots", "Thai astrology: Taksa, life periods, Seven Numbers", "Slow planets for the next 12 months and this year's solar return"]
        ).map((t) => (
          <li key={t}>
            <span className="v2-nr-item-d">{t}</span>
          </li>
        ))}
      </ul>
      <p className="v2-nr-note">
        {isTh ? "ใช้รอบดูดวงที่เติมไว้ 1 รอบ ผังเดิมโหลดซ้ำไม่หักซ้ำ" : "Uses 1 refilled reading; re-opening the same chart is free."}
      </p>
      <label className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer min-h-[44px]">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 w-5 h-5 shrink-0 accent-ink" />
        <span>
          {isTh
            ? "ยินยอมส่งวันเวลาสถานที่เกิดและชื่อของผังนี้ไปให้เซิร์ฟเวอร์ของเว็บคำนวณรายงาน เว็บไม่บันทึกข้อมูลเกิดไว้"
            : "I agree to send this chart's birth data and name to the site's server to build the report. The birth data is not stored."}
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void create()} disabled={!consent || busy} className="rounded-full btn-gold-glass px-5 min-h-[44px] text-sm font-bold disabled:cursor-not-allowed">
          {busy ? (isTh ? "กำลังสร้างรายงาน..." : "Creating...") : isTh ? "สร้างรายงาน" : "Create report"}
        </button>
        <button type="button" onClick={onClose} className="rounded-full border border-line-warm bg-surface px-5 min-h-[44px] text-sm text-ink">
          {isTh ? "ปิด" : "Close"}
        </button>
      </div>
      {!consent && <p className="v2-nr-note">{isTh ? "ติ๊กยินยอมก่อน ปุ่มสร้างรายงานจึงจะกดได้" : "Tick the box first to create the report."}</p>}
      {error && (
        <div role="alert" className="text-sm text-err border-l-2 border-err pl-2 space-y-1">
          <p>{error.text}</p>
          {error.reason === "members_only" && (
            <a href="/account" className="underline text-gold-ink">
              {isTh ? "เข้าสู่ระบบ / สมัครสมาชิก" : "Sign in or create an account"}
            </a>
          )}
          {error.reason === "needs_credit" && (
            <a href={isTh ? "/pricing" : "/en/pricing"} className="underline text-gold-ink">
              {isTh ? "ดูแพ็กเกจเติมรอบ" : "See refill packages"}
            </a>
          )}
        </div>
      )}
      {report && createPortal(<ReportView report={report} onClose={() => setReport(null)} />, document.body)}
    </div>
  );
}

function ReportView({ report, onClose }: { report: NatalReport; onClose: () => void }) {
  const isTh = report.lang === "th";
  const t = (th: string, en: string) => (isTh ? th : en);
  // หัวข้อแต่ละส่วน: เลขในวงกลม + ชื่อ + คำอธิบายบรรทัดเดียว (ชุดเดียวกับผลผังบนหน้าเว็บ)
  const sections = [
    { id: "pos", th: "ตำแหน่งดาวและเรือน", en: "Positions and houses", dTh: "ดาวแต่ละดวงอยู่ราศีไหน และตกเรือนไหนของชีวิต", dEn: "Where each planet sits, by sign and by house" },
    { id: "body", th: "ดาวแต่ละดวงบอกอะไร", en: "What each placement says", dTh: "ดาวคือเรื่อง ราศีคือสไตล์ เรือนคือด้านของชีวิต", dEn: "Planet = what, sign = how, house = where" },
    { id: "asp", th: "ดาวที่คุยกันแรงที่สุด", en: "Your strongest aspects", dTh: "เส้นซ้ายสีน้ำเงินคือไหลลื่น สีแดงคือตึง", dEn: "Blue edge = flowing, red edge = tense" },
    { id: "star", th: "ดาวฤกษ์และจุด Lots", en: "Fixed stars and lots", dTh: "ดาวฤกษ์ที่ทับดาวในผัง และจุดโชคทั้ง 7 ของ Hermes", dEn: "Fixed stars on your planets, and the seven Hermetic lots" },
    { id: "thai", th: "โหราไทย", en: "Thai astrology", dTh: "วันเกิดแบบไทย ทักษา มหาทักษา และเลข 7 ตัว", dEn: "Thai birth day, Taksa, life periods and the Seven Numbers" },
    { id: "year", th: "12 เดือนข้างหน้า", en: "The next 12 months", dTh: "วันที่ดาวเดินช้าทำมุมตรงกับผังของคุณ", dEn: "Dates when slow planets make exact contact with your chart" },
    ...(report.solarReturn.length ? [{ id: "sr", th: "ผังวันเกิดปีนี้", en: "This year's solar return", dTh: "ธีมของปีนับจากวันเกิดครั้งล่าสุด", dEn: "The theme of the year since your last birthday" }] : []),
  ];
  const H = ({ id }: { id: string }) => {
    const i = sections.findIndex((x) => x.id === id);
    const sec = sections[i];
    return (
      <header className="nr-h">
        <span className="nr-h-n ui2-num" aria-hidden="true">
          {i + 1}
        </span>
        <div>
          <h2 className="nr-h-t">{isTh ? sec.th : sec.en}</h2>
          <p className="nr-h-d">{isTh ? sec.dTh : sec.dEn}</p>
        </div>
      </header>
    );
  };
  const [srHead, ...srRest] = report.solarReturn;

  return (
    // data-floating: หลบกฎ body > :not(...) { position: relative } ของ layout ไม่งั้นรายงานไม่ทับเต็มจอ
    <div id="nt-report-root" data-floating="" role="dialog" aria-modal="true" aria-labelledby="nt-report-title" className="nt-report">
      <div className="nt-report-bar">
        <button type="button" onClick={() => window.print()} className="rounded-full btn-gold-glass px-4 min-h-[44px] text-sm font-bold">
          {t("บันทึกเป็น PDF / พิมพ์", "Save as PDF / Print")}
        </button>
        <button type="button" onClick={onClose} className="rounded-full border border-line-warm bg-surface px-4 min-h-[44px] text-sm text-ink">
          {t("ปิดรายงาน", "Close report")}
        </button>
      </div>
      <article className="nt-report-page">
        {/* ── หน้าแรก: ปก + สามราศีหลัก + สรุป + ความรัก/งาน/เงิน + สารบัญ ── */}
        <section className="nr-cover">
          <header className="nr-cover-head">
            <p className="nr-kicker">SeerTarot · {t("รายงานผังดวงกำเนิด", "Natal chart report")}</p>
            <h1 id="nt-report-title" className="nr-title">
              {report.title}
            </h1>
            <p className="nr-birth">{report.birthLine}</p>
            <p className="nr-system">{report.systemLine}</p>
          </header>

          <ul className="nr-big3">
            {report.bigThree.map((b) => (
              <li key={b.label}>
                <span className="nr-big3-role">
                  {b.role}
                  <span>{b.label}</span>
                </span>
                <span className="nr-big3-sign">{b.sign}</span>
                <span className="nr-big3-deg ui2-num">{b.deg}</span>
                <span className="nr-big3-cards">
                  {b.cards.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </span>
              </li>
            ))}
          </ul>

          <div className="nr-sum">
            <p className="nr-sum-t">{t("สรุปผังของคุณ", "Your chart at a glance")}</p>
            <dl>
              {report.highlights.map((r) => (
                <div key={r.label}>
                  <dt>{r.label}</dt>
                  <dd>
                    {r.lines.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <ul className="nr-life">
            {report.life.map((x) => (
              <li key={x.key}>
                <span className="nr-life-t">{x.title}</span>
                <span className="nr-life-from">{x.from}</span>
                <span className="nr-life-d">{x.text}</span>
              </li>
            ))}
          </ul>

          <nav className="nr-toc" aria-label={t("สารบัญ", "Contents")}>
            <p className="nr-toc-t">{t("ในเล่มนี้", "In this report")}</p>
            <ol>
              {sections.map((x, i) => (
                <li key={x.id}>
                  <span className="ui2-num">{i + 1}</span>
                  {isTh ? x.th : x.en}
                </li>
              ))}
            </ol>
          </nav>
        </section>

        {/* ── 1. ตำแหน่งดาวและเรือน ── */}
        <section className="nr-sec nr-break">
          <H id="pos" />
          <table className="nr-table">
            <thead>
              <tr>
                <th scope="col">{t("ดาว/จุด", "Body")}</th>
                <th scope="col">{t("ราศี", "Sign")}</th>
                <th scope="col">{t("องศา", "Degree")}</th>
                <th scope="col">{t("เรือน", "House")}</th>
                <th scope="col">{t("สถานะ", "Notes")}</th>
              </tr>
            </thead>
            <tbody>
              {report.positions.map((p) => (
                <tr key={p.body}>
                  <td>
                    <span className="nr-abbr" aria-hidden="true">
                      {p.short}
                    </span>
                    <b>{p.body}</b>
                  </td>
                  <td>{p.sign}</td>
                  <td className="ui2-num">{p.deg}</td>
                  <td className="ui2-num">{p.house}</td>
                  <td>{p.notes && <span className="nr-note-tag">{p.notes}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.houseCells && (
            <>
              <p className="nr-sub">{t("12 เรือนของชีวิต", "The 12 houses")}</p>
              <ol className="nr-houses">
                {report.houseCells.map((h) => (
                  <li key={h.n} className={h.bodies.length >= 3 ? "is-busy" : undefined}>
                    <span className="nr-house-top">
                      <span className="nr-house-n ui2-num">{h.n}</span>
                      <span className="nr-house-sign">
                        {h.sign} {h.deg}
                      </span>
                    </span>
                    <span className="nr-house-t">{h.title}</span>
                    <span className="nr-house-b">{h.bodies.length ? h.bodies.join(isTh ? " " : ", ") : t("ไม่มีดาว", "No planets")}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        {/* ── 2. ดาวแต่ละดวง ── */}
        <section className="nr-sec nr-break">
          <H id="body" />
          <div className="nr-bodies">
            {report.bodies.map((b) => (
              <div key={b.title} className="nr-body">
                <p className="nr-body-head">
                  <b>{b.name}</b>
                  <span>{b.where}</span>
                </p>
                <p className="nr-body-theme">{b.theme}</p>
                {b.paras.map((p, i) => (
                  <p key={i} className="nr-body-p">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. มุมสัมพันธ์ + รูปแบบ + สมดุล ── */}
        <section className="nr-sec nr-break">
          <H id="asp" />
          <ul className="nr-aspects">
            {report.aspects.map((a) => (
              <li key={a.title} className={`is-${a.tone}`}>
                <span className="nr-asp-pair">
                  <b>{a.a}</b>
                  <span className="nr-asp-type">{a.type}</span>
                  <b>{a.b}</b>
                </span>
                <span className="nr-asp-text">{a.text}</span>
              </li>
            ))}
          </ul>
          {report.patterns.length > 0 && (
            <div className="nr-box">
              <p className="nr-box-t">{t("รูปแบบพิเศษในผัง", "Chart patterns")}</p>
              {report.patterns.map((p) => (
                <p key={p.title} className="nr-line">
                  <b>{p.title}</b>
                  <span>{p.text}</span>
                </p>
              ))}
            </div>
          )}
          <div className="nr-box">
            <p className="nr-box-t">{t("สมดุลพลัง", "Balance of energy")}</p>
            {report.balance.map((b, i) => (
              <p key={i} className="nr-line">
                <span>{b}</span>
              </p>
            ))}
          </div>
        </section>

        {/* ── 4. ดาวฤกษ์ + Lots ── */}
        <section className="nr-sec">
          <H id="star" />
          {report.stars.length ? (
            <div className="nr-box">
              {report.stars.map((s, i) => (
                <p key={i} className="nr-line">
                  <span>{s}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="nr-muted">{t("ไม่มีดาวฤกษ์สำคัญทับดาวในผัง", "No major star contacts.")}</p>
          )}
          {report.lots && (
            <table className="nr-table">
              <thead>
                <tr>
                  <th scope="col">Lot</th>
                  <th scope="col">{t("ตำแหน่ง", "Position")}</th>
                  <th scope="col">{t("ความหมาย", "Meaning")}</th>
                </tr>
              </thead>
              <tbody>
                {report.lots.map((l) => (
                  <tr key={l.name}>
                    <td>
                      <b>{l.name}</b>
                    </td>
                    <td>{l.value}</td>
                    <td className="nr-wrap">{l.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ── 5. โหราไทย ── */}
        <section className="nr-sec nr-break">
          <H id="thai" />
          <p className="nr-thai-day">{report.thai.day}</p>
          <ul className="nr-taksa">
            {report.thai.taksa.map((x) => (
              <li key={x.pos}>
                <span className="nr-taksa-pos">{x.pos}</span>
                <b>{x.planet}</b>
                <span className="nr-taksa-m">{x.meaning}</span>
              </li>
            ))}
          </ul>
          <div className="nr-box">
            <p className="nr-box-t">{t("มหาทักษา (ดาวเสวยอายุ)", "Life periods (Maha Taksa)")}</p>
            {report.thai.maha.map((m, i) => (
              <p key={i} className="nr-line">
                <span>{m}</span>
              </p>
            ))}
          </div>
          <p className="nr-sub">{t("เลข 7 ตัว 4 ฐาน", "The Seven Numbers")}</p>
          <table className="nr-table nr-seven">
            <tbody>
              {report.thai.seven.map((row, r) => (
                <tr key={r} className={r === report.thai.seven.length - 1 ? "is-sum" : undefined}>
                  {row.map((v, c) => (
                    <td key={c} className="ui2-num">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="nr-muted">{report.thai.sevenNotes.join(" · ")}</p>
        </section>

        {/* ── 6. 12 เดือนข้างหน้า ── */}
        <section className="nr-sec nr-break">
          <H id="year" />
          {report.yearAhead.length ? (
            <ol className="nr-timeline">
              {report.yearAhead.map((e, i) => (
                <li key={i}>
                  <span className="nr-tl-date">{e.date}</span>
                  <span className="nr-tl-text">{e.text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="nr-muted">{t("ไม่มีเหตุการณ์ดาวเดินช้าที่ตรงพอดีในช่วงนี้", "No exact slow-planet events in this period.")}</p>
          )}
        </section>

        {/* ── 7. ผังวันเกิดปีนี้ ── */}
        {report.solarReturn.length > 0 && (
          <section className="nr-sec">
            <H id="sr" />
            <div className="nr-box">
              <p className="nr-box-t">{srHead}</p>
              {srRest.map((s, i) => {
                const k = s.indexOf(": ");
                return (
                  <p key={i} className="nr-line">
                    {k > 0 ? (
                      <>
                        <b>{s.slice(0, k)}</b>
                        <span>{s.slice(k + 2)}</span>
                      </>
                    ) : (
                      <span>{s}</span>
                    )}
                  </p>
                );
              })}
            </div>
          </section>
        )}

        <footer className="nr-foot">
          {t(
            "คำนวณโดย SeerTarot จากตำแหน่งดาวจริง (เทียบ NASA JPL) · เป็นแนวทางทำความเข้าใจตัวเอง ไม่ใช่คำตัดสินชีวิต · seertarot.net/natal-chart",
            "Calculated by SeerTarot from real planetary positions (checked against NASA JPL). A guide to self-understanding, not a verdict. seertarot.net/natal-chart",
          )}
        </footer>
      </article>
    </div>
  );
}
