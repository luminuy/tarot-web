"use client";

import React, { useId, useMemo, useState } from "react";
import { PERSONAS, type Persona } from "@/data/personas";
import type { Reading } from "@/lib/schema/reading";
import { ASPECT_LABEL, comparePerspectives } from "@/lib/reading/perspective";

/**
 * ✦ "อยากฟังอีกมุมไหม" — มุมที่สองของไพ่ชุดเดิม (REFLECTION_JOURNAL_PLAN 1.7)
 * ---------------------------------------------------------------------------
 * เลือกแม่หมอที่ยังไม่ได้ฟัง ➔ `/api/reading/[id]/perspective` อ่านไพ่ชุดเดิมเป๊ะ (ไม่สับใหม่)
 * ➔ สลับแท็บดูสองมุม + กล่อง "ตรงกัน / ต่างกัน" ที่คำนวณด้วยโค้ด
 * ⚠️ ห้ามมีคำว่า "แม่นกว่า/ถูกกว่า" และห้ามแสดงชื่อโมเดล AI · ไพ่ไม่เปลี่ยน เปลี่ยนแค่มุมมอง
 */
export const SecondPerspectivePanel: React.FC<{
  readingId: string;
  original: Partial<Reading>;
  originalPersona: Persona;
  positionNames: string[];
  isEnglish: boolean;
}> = ({ readingId, original, originalPersona, positionNames, isEnglish }) => {
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const id = useId();
  const [loaded, setLoaded] = useState<Record<string, Reading>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>(originalPersona.id);

  const others = PERSONAS.filter((p) => p.id !== originalPersona.id);
  const active = tab === originalPersona.id ? original : loaded[tab];
  const activePersona = PERSONAS.find((p) => p.id === tab) ?? originalPersona;
  const compareWith = Object.keys(loaded)[0];
  const comparison = useMemo(
    () => (compareWith ? comparePerspectives(original, loaded[compareWith]) : null),
    [original, loaded, compareWith],
  );
  const name = (p: Persona) => (isEnglish ? p.nameEn || p.nameTh : p.nameTh);
  const label = (a: keyof typeof ASPECT_LABEL) => L(ASPECT_LABEL[a]);

  const ask = async (p: Persona) => {
    if (loaded[p.id]) {
      setTab(p.id);
      return;
    }
    setPending(p.id);
    setError(null);
    try {
      const res = await fetch(`/api/reading/${encodeURIComponent(readingId)}/perspective`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: p.id, lang: isEnglish ? "en" : "th" }),
      });
      const data = (await res.json().catch(() => ({}))) as { reading?: Reading; error?: string };
      if (!res.ok || !data.reading) throw new Error(data.error || L({ th: "ขอมุมมองไม่สำเร็จ ลองใหม่อีกครั้ง", en: "Couldn't get that perspective. Please try again." }));
      setLoaded((m) => ({ ...m, [p.id]: data.reading! }));
      setTab(p.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="glass-tile !rounded-xl p-4 sm:p-5 space-y-4 font-serif-th text-ink-deep" aria-labelledby={`${id}-h`}>
      <header className="space-y-1">
        <h5 id={`${id}-h`} className="text-sm sm:text-base font-bold">
          ✦ {L({ th: "อยากฟังอีกมุมไหม", en: "Hear it from another angle?" })}
        </h5>
        <p className="text-xs sm:text-[13px] text-muted leading-relaxed">
          {L({
            th: "ไพ่ไม่เปลี่ยน เปลี่ยนแค่มุมมอง — แม่หมออีกท่านจะอ่านไพ่ชุดเดิมของคุณด้วยสายตาของตัวเอง",
            en: "The cards stay the same — only the point of view changes. Another reader reads your exact cards in their own way.",
          })}
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label={L({ th: "เลือกแม่หมอ", en: "Choose a reader" })}>
        {others.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => void ask(p)}
            disabled={pending !== null}
            aria-pressed={tab === p.id}
            className={`tap-overlay-y min-h-[44px] text-left px-3.5 py-2 rounded-xl border text-xs cursor-pointer transition-colors disabled:opacity-60 ${
              tab === p.id ? "bg-surface border-gold-ink" : "glass-chip border-line-warm hover:border-gold-ink"
            }`}
          >
            <span className="block font-semibold">
              {name(p)}
              {pending === p.id ? ` · ${L({ th: "กำลังอ่าน…", en: "reading…" })}` : loaded[p.id] ? " ✦" : ""}
            </span>
            <span className="block text-[11px] text-muted max-w-[16rem]">{isEnglish ? p.taglineEn : p.tagline}</span>
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-err">{error}</p>}

      {Object.keys(loaded).length > 0 && (
        <>
          {comparison && (
            <div className="rounded-lg bg-surface/70 border border-line-warm p-3 space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
              <p className="font-bold">{L({ th: "สองมุมนี้เทียบกัน", en: "How the two views compare" })}</p>
              {comparison.yesNoAgree !== null && (
                <p>
                  {comparison.yesNoAgree
                    ? L({ th: "ทั้งสองมุมให้คำตอบใช่/ไม่ใช่ตรงกัน", en: "Both views give the same yes/no answer." })
                    : L({ th: "สองมุมเอนคำตอบใช่/ไม่ใช่ต่างกัน — ไพ่ชุดนี้มีทั้งสองแรงอยู่ในตัว", en: "The two views lean differently on yes/no — these cards hold both pulls." })}
                </p>
              )}
              {comparison.shared.length > 0 && (
                <p>
                  <span className="font-semibold">{L({ th: "เห็นตรงกันว่าเรื่องนี้เกี่ยวกับ: ", en: "Both see this as about: " })}</span>
                  {comparison.shared.map(label).join(" · ")}
                </p>
              )}
              {comparison.onlyA.length > 0 && (
                <p>
                  <span className="font-semibold">{name(originalPersona)}</span>
                  {L({ th: " เน้น", en: " leans on " })}
                  {comparison.onlyA.map(label).join(" · ")}
                </p>
              )}
              {comparison.onlyB.length > 0 && (
                <p>
                  <span className="font-semibold">{name(PERSONAS.find((p) => p.id === compareWith) ?? originalPersona)}</span>
                  {L({ th: " เน้น", en: " leans on " })}
                  {comparison.onlyB.map(label).join(" · ")}
                </p>
              )}
            </div>
          )}

          <div role="tablist" aria-label={L({ th: "มุมมองของแม่หมอ", en: "Reader perspectives" })} className="flex flex-wrap gap-1.5">
            {[originalPersona, ...others.filter((p) => loaded[p.id])].map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={tab === p.id}
                onClick={() => setTab(p.id)}
                className={`tap-overlay-y min-h-[44px] px-4 rounded-full text-xs font-semibold cursor-pointer ${tab === p.id ? "btn-gold-glass" : "glass-chip text-ink-deep"}`}
              >
                {name(p)}
                {p.id === originalPersona.id ? L({ th: " (มุมแรก)", en: " (first)" }) : ""}
              </button>
            ))}
          </div>

          {active && (
            <div role="tabpanel" className="space-y-3 text-xs sm:text-sm leading-relaxed">
              {(active.cards ?? []).map((c) => (
                <div key={c.position} className="space-y-0.5">
                  <p className="text-[11px] font-mono text-muted">
                    {c.position + 1}. {positionNames[c.position] ?? ""}
                  </p>
                  {c.headline && <p className="font-semibold text-gold-ink">{c.headline}</p>}
                  {tab !== originalPersona.id && c.reading && <p>{c.reading}</p>}
                </div>
              ))}
              {active.summary && (
                <div className="pl-3 border-l-2 border-gold-ink/60">
                  <p className="font-semibold">{L({ th: `สรุปจาก${name(activePersona)}`, en: `${name(activePersona)}'s summary` })}</p>
                  <p>{active.summary}</p>
                </div>
              )}
              {active.advice && active.advice.length > 0 && (
                <ul className="list-disc pl-5 space-y-1">
                  {active.advice.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};
