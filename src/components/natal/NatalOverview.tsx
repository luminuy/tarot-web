"use client";

import { useState } from "react";
import { stripEmoji } from "@/lib/text/no-emoji";
import type { ChartSpec } from "@/lib/astro/chart-spec";
import type { Lang } from "@/data/natal/content";
import type { NatalOverview as Overview } from "@/lib/astro/natal-overview";

/**
 * 📝 ปุ่ม "ภาพรวมผัง" (โหลดแบบ lazy จาก `NatalResult`) — ทุกคนกดได้ ไม่หักรอบ (เจ้าของสั่ง 2026-10-28: ใช้ Haiku)
 * - ข้อมูลเกิดออกจากเครื่องเฉพาะเมื่อผู้ใช้ติ๊กยินยอมแล้วกดเอง · ไม่จำการยินยอม · ไม่เก็บผลลงเครื่อง
 * - AI ล้ม = บอกตรง ๆ พร้อมปุ่มลองใหม่ (เรื่องเด่นที่โค้ดคำนวณยังอยู่บนหน้าเหนือปุ่มนี้)
 * - ข้อความจาก AI ผ่าน `stripEmoji()` ก่อนแสดง (กฎเหล็กข้อ 2)
 */
export default function NatalOverview({ spec, lang }: { spec: ChartSpec; lang: Lang }) {
  const isTh = lang === "th";
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);

  async function create() {
    if (!consent || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/natal/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chart: spec, lang, consent: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { overview?: Overview; error?: string };
      if (res.ok && data.overview) setOverview(data.overview);
      else setError(data.error || (isTh ? "เขียนภาพรวมไม่สำเร็จ ลองกดใหม่อีกครั้ง" : "Could not write the overview. Please try again."));
    } catch {
      setError(isTh ? "การเชื่อมต่อขัดข้อง ลองกดใหม่อีกครั้ง" : "Connection interrupted. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (overview) {
    return (
      <div className="altar-card-porcelain rounded-xl p-4 space-y-3 text-sm leading-relaxed">
        <p className="font-serif-th font-bold text-ink">{isTh ? "ภาพรวมผังจากแม่หมอ AI" : "Your chart overview from the AI reader"}</p>
        {overview.paragraphs.map((p, i) => (
          <div key={i} className="space-y-1">
            <p className="font-semibold text-ink">{stripEmoji(p.title)}</p>
            <p className="text-ink">{stripEmoji(p.text)}</p>
          </div>
        ))}
        <p className="text-xs text-muted">
          {isTh
            ? "เรียบเรียงโดย AI จากเรื่องเด่นที่ SeerTarot คำนวณด้านบน ตำแหน่งดาวทุกตัวมาจากตัวคำนวณ ไม่ได้มาจาก AI · เป็นแนวทางทำความเข้าใจตัวเอง ไม่ใช่คำตัดสินชีวิต"
            : "Written by AI from the themes SeerTarot calculated above. Every position comes from the calculator, not from the AI. A guide to self-understanding, not a verdict."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line-warm bg-surface/70 p-3 space-y-3 text-sm text-ink">
      <p className="font-semibold">{isTh ? "ให้แม่หมอ AI ร้อยเรื่องเด่นเป็นภาพรวมผัง" : "Let the AI reader weave these themes into an overview"}</p>
      <p className="text-xs text-muted">
        {isTh
          ? "แม่หมอ AI อ่านเรื่องเด่นทั้งหมดของผังพร้อมกัน แล้วเขียนว่าเรื่องไหนเสริมกันหรือขัดกัน พร้อมคำแนะนำที่ทำได้จริง ฟรี ไม่ใช้รอบดูดวง"
          : "The AI reader looks at all your strongest themes together, shows where they support or pull against each other, and gives practical suggestions. Free; it does not use a reading."}
      </p>
      <label className="flex items-start gap-2 text-xs cursor-pointer">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0" />
        <span>
          {isTh
            ? "ยินยอมส่งวันเวลาสถานที่เกิดและชื่อของผังนี้ไปให้เซิร์ฟเวอร์ของเว็บและผู้ให้บริการ AI ภายนอกเพื่อเขียนภาพรวม เว็บไม่บันทึกข้อมูลเกิดไว้"
            : "I agree to send this chart's birth data and name to the site's server and an external AI provider to write the overview. The birth data is not stored."}
        </span>
      </label>
      <button type="button" onClick={() => void create()} disabled={!consent || busy} className="rounded-full btn-gold-glass px-4 min-h-[44px] text-sm font-bold disabled:opacity-50">
        {busy ? (isTh ? "แม่หมอกำลังเขียน..." : "Writing...") : error ? (isTh ? "ลองใหม่อีกครั้ง" : "Try again") : isTh ? "เขียนภาพรวมผัง" : "Write my overview"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-err">
          {error}
        </p>
      )}
    </div>
  );
}
