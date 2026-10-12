"use client";

import React, { useState } from "react";
import { formatDate } from "./journal-format";
import { stripEmojiDeep } from "@/lib/text/no-emoji";

/**
 * ✦ "สิ่งที่สมุดของคุณสะท้อน" (REFLECTION_JOURNAL_PLAN 1.5 · คลื่น 4)
 * ทุกข้อสังเกตมีชิปอ้างอิงคำอ่านต้นทาง แตะแล้วเปิดคำอ่านนั้น · ปิดท้ายด้วยคำถามชวนคิด 1 ข้อ (ไม่ใช่คำทำนาย)
 * AI ล่ม/งบเต็ม ➔ แสดงข้อเท็จจริงที่คำนวณได้แทน พร้อมบอกตรง ๆ ว่าเป็นการนับจากสมุด
 */

interface Ref {
  ref: string;
  entryId: string;
  date: string;
  card?: string;
}
interface ReflectData {
  mode: "ai" | "facts" | "too-few";
  observations: Array<{ text: string; refs: string[] }>;
  facts: Array<{ id: string; text: string; refs: string[] }>;
  refs: Ref[];
  question?: string;
  crisis?: boolean;
  crisisMessage?: string;
}

export const ReflectionPanel: React.FC<{
  scope: { threadId: string } | { days: 30 | 90 };
  isEnglish: boolean;
  onOpenEntry: (entryId: string) => void;
}> = ({ scope, isEnglish, onOpenEntry }) => {
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const [data, setData] = useState<ReflectData | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const run = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/journal/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...scope, lang: isEnglish ? "en" : "th" }),
      });
      const body = (await res.json().catch(() => ({}))) as ReflectData & { error?: string };
      if (!res.ok) throw new Error(body.error || "");
      setData(stripEmojiDeep(body));
      setState("idle");
    } catch (err) {
      setError((err as Error).message || L({ th: "ดูภาพรวมไม่สำเร็จ ลองใหม่อีกครั้ง", en: "Couldn't reflect right now. Please try again." }));
      setState("error");
    }
  };

  const refMap = new Map((data?.refs ?? []).map((r) => [r.ref, r]));
  const Chips = ({ refs }: { refs: string[] }) => (
    <span className="flex flex-wrap gap-1 mt-1">
      {refs.map((r) => {
        const ref = refMap.get(r);
        if (!ref) return null;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onOpenEntry(ref.entryId)}
            className="tap-overlay-y min-h-[32px] px-2 rounded-full glass-chip text-[11px] text-gold-ink hover:text-gold-ink-deep cursor-pointer"
          >
            {formatDate(ref.date, isEnglish)}
            {ref.card ? ` · ${ref.card}` : ""}
          </button>
        );
      })}
    </span>
  );

  return (
    <section className="altar-card-porcelain !rounded-2xl p-4 sm:p-6 space-y-3 font-serif-th text-ink-deep" aria-live="polite">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <h3 className="text-base sm:text-lg font-bold">{L({ th: "สิ่งที่สมุดของคุณสะท้อน", en: "What your journal reflects" })}</h3>
          <p className="text-xs text-muted">
            {"threadId" in scope
              ? L({ th: "มองภาพรวมของเรื่องนี้จากทุกคำอ่านที่ผ่านมา", en: "A look across every reading in this story" })
              : L({ th: `มองภาพรวม ${scope.days} วันที่ผ่านมา`, en: `A look across the last ${scope.days} days` })}
          </p>
        </div>
        {!data && (
          <button
            type="button"
            onClick={() => void run()}
            disabled={state === "loading"}
            className="tap-overlay-y min-h-[44px] px-5 rounded-full btn-gold-glass text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-60"
          >
            {state === "loading" ? L({ th: "กำลังอ่านสมุด…", en: "Reading your journal…" }) : L({ th: "ดูภาพรวม", en: "Reflect" })}
          </button>
        )}
      </header>

      {state === "error" && <p className="text-xs text-err">{error}</p>}

      {data?.crisis && (
        <div className="rounded-lg bg-err-wash border border-line-warm p-3 text-sm">{data.crisisMessage}</div>
      )}

      {data && !data.crisis && data.mode === "too-few" && (
        <p className="text-sm">
          {L({
            th: "ตอนนี้มีคำอ่านยังน้อยเกินจะเห็นรูปแบบ — ขอสัก 3 คำอ่านขึ้นไปก่อนนะ",
            en: "There aren't enough readings yet to see a pattern — come back after at least three.",
          })}
        </p>
      )}

      {data && !data.crisis && data.mode === "ai" && (
        <ul className="space-y-3 list-none p-0 m-0">
          {data.observations.map((o, i) => (
            <li key={i} className="pl-3 border-l-2 border-gold-ink/60 text-sm leading-relaxed">
              {o.text}
              <Chips refs={o.refs} />
            </li>
          ))}
        </ul>
      )}

      {data && !data.crisis && data.mode === "facts" && (
        <>
          <p className="text-xs text-muted">
            {L({
              th: "ตอนนี้แม่หมอ AI ไม่ว่าง — นี่คือสิ่งที่นับได้จากสมุดของคุณตรง ๆ",
              en: "The AI reader is unavailable right now — here is what your journal shows, counted directly.",
            })}
          </p>
          {data.facts.length === 0 ? (
            <p className="text-sm">{L({ th: "ยังไม่เห็นรูปแบบที่เด่นชัดในช่วงนี้", en: "No clear pattern stands out in this period yet." })}</p>
          ) : (
            <ul className="space-y-3 list-none p-0 m-0">
              {data.facts.map((f) => (
                <li key={f.id} className="pl-3 border-l-2 border-gold-ink/60 text-sm leading-relaxed">
                  {f.text}
                  <Chips refs={f.refs} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {data?.question && !data.crisis && (
        <p className="rounded-lg bg-surface/70 border border-line-warm p-3 text-sm">
          <span className="font-semibold">{L({ th: "คำถามชวนคิด: ", en: "A question to sit with: " })}</span>
          {data.question}
        </p>
      )}

      {data && !data.crisis && data.mode !== "too-few" && (
        <p className="text-[11px] text-muted">
          {L({
            th: "นี่คือการสะท้อนรูปแบบจากสมุดของคุณ ไม่ใช่คำทำนายว่าอนาคตจะเป็นอย่างไร",
            en: "This reflects patterns in your journal — it is not a prediction of what will happen.",
          })}
        </p>
      )}
    </section>
  );
};
