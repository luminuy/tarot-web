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
    <div className="mx-auto mt-3 max-w-xl rounded-xl border border-line-warm bg-surface/70 p-3 space-y-3 text-sm text-ink">
      <p className="font-semibold">{isTh ? "รายงานผังดวงฉบับเต็ม (บันทึกเป็น PDF)" : "Full natal chart report (save as PDF)"}</p>
      <p className="text-xs text-muted">
        {isTh
          ? "รวมทุกอย่างในเล่มเดียว: ตำแหน่งดาว คำอธิบายทุกดวง มุมสัมพันธ์ ดาวฤกษ์ จุด Lots โหราไทย พร้อมพยากรณ์ดาวเดินช้า 12 เดือนข้างหน้า และผังวันเกิดปีนี้ ใช้รอบดูดวงที่เติมไว้ 1 รอบ ผังเดิมโหลดซ้ำไม่หักซ้ำ"
          : "Everything in one document: positions, every placement explained, aspects, fixed stars, lots, Thai astrology, plus the next 12 months of slow-planet transits and this year's solar return. Uses 1 refilled reading; re-opening the same chart is free."}
      </p>
      <label className="flex items-start gap-2 text-xs cursor-pointer">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0" />
        <span>
          {isTh
            ? "ยินยอมส่งวันเวลาสถานที่เกิดและชื่อของผังนี้ไปให้เซิร์ฟเวอร์ของเว็บคำนวณรายงาน เว็บไม่บันทึกข้อมูลเกิดไว้"
            : "I agree to send this chart's birth data and name to the site's server to build the report. The birth data is not stored."}
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void create()} disabled={!consent || busy} className="rounded-full btn-gold-glass px-4 min-h-[44px] text-sm font-bold disabled:opacity-50">
          {busy ? (isTh ? "กำลังสร้างรายงาน..." : "Creating...") : isTh ? "สร้างรายงาน" : "Create report"}
        </button>
        <button type="button" onClick={onClose} className="rounded-full border border-line-warm px-4 min-h-[44px] text-sm text-ink">
          {isTh ? "ปิด" : "Close"}
        </button>
      </div>
      {error && (
        <div role="alert" className="text-xs text-err space-y-1">
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
  const H = ({ children }: { children: React.ReactNode }) => <h2 className="nt-report-h2">{children}</h2>;
  return (
    // data-floating: หลบกฎ body > :not(...) { position: relative } ของ layout ไม่งั้นรายงานไม่ทับเต็มจอ
    <div id="nt-report-root" data-floating="" role="dialog" aria-modal="true" aria-labelledby="nt-report-title" className="nt-report">
      <div className="nt-report-bar">
        <button type="button" onClick={() => window.print()} className="rounded-full btn-gold-glass px-4 min-h-[44px] text-sm font-bold">
          {isTh ? "บันทึกเป็น PDF / พิมพ์" : "Save as PDF / Print"}
        </button>
        <button type="button" onClick={onClose} className="rounded-full border border-line-warm bg-surface px-4 min-h-[44px] text-sm text-ink">
          {isTh ? "ปิดรายงาน" : "Close report"}
        </button>
      </div>
      <article className="nt-report-page">
        <header className="space-y-1">
          <p className="text-xs tracking-widest text-gold-ink">SEERTAROT</p>
          <h1 id="nt-report-title" className="font-serif-th font-bold text-2xl text-ink">
            {report.title}
          </h1>
          <p className="text-sm text-ink">{report.birthLine}</p>
          <p className="text-xs text-muted">{report.systemLine}</p>
        </header>

        <section>
          <H>{isTh ? "อาทิตย์ จันทร์ ลัคนา" : "Sun, Moon and Rising"}</H>
          <ul className="space-y-1 text-sm">
            {report.bigThree.map((b) => (
              <li key={b.label}>
                <strong>{b.label}</strong> {b.value} · {isTh ? "ไพ่ประจำ" : "cards"}: {b.cards.join(" + ")}
              </li>
            ))}
          </ul>
          {report.summary.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {p}
            </p>
          ))}
        </section>

        <section>
          <H>{isTh ? "ตำแหน่งดาว" : "Positions"}</H>
          <table className="v2-nt-table">
            <tbody>
              {report.positions.map((p) => (
                <tr key={p.body}>
                  <td>{p.body}</td>
                  <td>{p.value}</td>
                  <td>{p.house}</td>
                  <td className="whitespace-normal">{p.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.houses && <p className="text-xs text-muted">{report.houses.join(" · ")}</p>}
        </section>

        <section>
          <H>{isTh ? "คำอธิบายแต่ละตำแหน่ง" : "Each placement explained"}</H>
          {report.bodies.map((b) => (
            <div key={b.title} className="nt-report-block">
              <h3 className="font-semibold text-ink text-sm">{b.title}</h3>
              {b.paras.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </section>

        <section>
          <H>{isTh ? "มุมสัมพันธ์สำคัญ" : "Key aspects"}</H>
          {report.aspects.map((a) => (
            <div key={a.title} className="nt-report-block">
              <h3 className="font-semibold text-ink text-sm">{a.title}</h3>
              <p className="text-sm leading-relaxed">{a.text}</p>
            </div>
          ))}
          {report.patterns.map((p) => (
            <div key={p.title} className="nt-report-block">
              <h3 className="font-semibold text-ink text-sm">{p.title}</h3>
              <p className="text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
          {report.balance.map((b, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {b}
            </p>
          ))}
        </section>

        <section>
          <H>{isTh ? "ดาวฤกษ์และจุด Lots" : "Fixed stars and lots"}</H>
          {report.stars.length ? report.stars.map((s, i) => <p key={i} className="text-sm leading-relaxed">{s}</p>) : <p className="text-sm text-muted">{isTh ? "ไม่มีดาวฤกษ์สำคัญทับดาวในผัง" : "No major star contacts."}</p>}
          {report.lots?.map((l) => (
            <p key={l.name} className="text-sm leading-relaxed">
              <strong>{l.name}</strong> {l.value}: {l.meaning}
            </p>
          ))}
        </section>

        <section>
          <H>{isTh ? "โหราไทย" : "Thai astrology"}</H>
          <p className="text-sm">{report.thai.day}</p>
          <p className="text-sm">{report.thai.taksa.map((t) => `${t.pos}: ${t.planet}`).join(" · ")}</p>
          {report.thai.maha.map((m, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {m}
            </p>
          ))}
          <table className="v2-nt-table text-center">
            <tbody>
              {report.thai.seven.map((row, r) => (
                <tr key={r}>
                  {row.map((v, c) => (
                    <td key={c}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted">{report.thai.sevenNotes.join(" · ")}</p>
        </section>

        <section>
          <H>{isTh ? "12 เดือนข้างหน้า (ดาวเดินช้า)" : "The next 12 months (slow planets)"}</H>
          {report.yearAhead.length ? (
            <ul className="space-y-1">
              {report.yearAhead.map((e, i) => (
                <li key={i} className="text-sm leading-relaxed border-l-2 border-line-warm pl-2">
                  <strong>{e.date}</strong> {e.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{isTh ? "ไม่มีเหตุการณ์ดาวเดินช้าที่ตรงพอดีในช่วงนี้" : "No exact slow-planet events in this period."}</p>
          )}
        </section>

        {report.solarReturn.length > 0 && (
          <section>
            <H>{isTh ? "ผังวันเกิดปีนี้" : "This year's solar return"}</H>
            {report.solarReturn.map((s, i) => (
              <p key={i} className="text-sm leading-relaxed">
                {s}
              </p>
            ))}
          </section>
        )}

        <footer className="text-xs text-muted pt-4">
          {isTh
            ? "คำนวณโดย SeerTarot จากตำแหน่งดาวจริง (เทียบ NASA JPL) · เป็นแนวทางทำความเข้าใจตัวเอง ไม่ใช่คำตัดสินชีวิต · seertarot.net/natal-chart"
            : "Calculated by SeerTarot from real planetary positions (checked against NASA JPL). A guide to self-understanding, not a verdict. seertarot.net/natal-chart"}
        </footer>
      </article>
    </div>
  );
}
