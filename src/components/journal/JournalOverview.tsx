"use client";

import React, { useMemo, useState } from "react";
import { CardImage } from "@/components/card/CardImage";
import { THEME_LABEL } from "@/data/cards/themes";
import { computeJournalStats, MIN_CARDS_FOR_STATS, type RatioStat } from "@/lib/journal/stats";
import type { SavedReadingItem } from "@/lib/utils/history";
import { stripEmojiDeep } from "@/lib/text/no-emoji";

/**
 * ✦ ภาพรวมสมุดดวง — "บัญชีไพ่แบบซื่อตรง" (REFLECTION_JOURNAL_PLAN 1.3)
 * ทุกตัวเลขเทียบกับ "ค่าที่การสุ่มปกติจะให้" เสมอ (ขีดแนวตั้งบนแถบ) และติดป้ายเฉพาะที่ต่างอย่างมีนัย
 * ⚠️ ห้ามแสดง "ความแม่น %" หรือแปลสถิติเป็นคำทำนาย — นี่คือการนับ ไม่ใช่ดวง
 */

const ELEMENT_LABEL: Record<"F" | "W" | "A" | "E", { th: string; en: string }> = {
  F: { th: "ไฟ", en: "Fire" },
  W: { th: "น้ำ", en: "Water" },
  A: { th: "ลม", en: "Air" },
  E: { th: "ดิน", en: "Earth" },
};

interface MonthlySummary {
  title?: string;
  synthesis?: string;
  lifeLessons?: string[];
  fallback?: boolean;
}

export const JournalOverview: React.FC<{ items: SavedReadingItem[]; isEnglish: boolean; isMember: boolean }> = ({
  items,
  isEnglish,
  isMember,
}) => {
  const stats = useMemo(() => computeJournalStats(items), [items]);
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [summaryState, setSummaryState] = useState<"idle" | "loading" | "error">("idle");
  const [summaryError, setSummaryError] = useState("");

  const loadSummary = async () => {
    setSummaryState("loading");
    try {
      const res = await fetch(`/api/journal/monthly-summary?lang=${isEnglish ? "en" : "th"}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || "");
      setSummary(stripEmojiDeep(data as MonthlySummary));
      setSummaryState("idle");
    } catch (err) {
      setSummaryError((err as Error).message || L({ th: "สรุปไม่สำเร็จ ลองใหม่อีกครั้ง", en: "Couldn't summarise. Please try again." }));
      setSummaryState("error");
    }
  };

  return (
    <div className="space-y-5">
      {/* แถวตัวเลขหลัก */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Stat label={L({ th: "คำอ่าน", en: "Readings" })} value={stats.readings} />
        <Stat label={L({ th: "ไพ่ที่เปิด", en: "Cards drawn" })} value={stats.cardsDrawn} />
        <Stat label={L({ th: "บันทึกผลจริงแล้ว", en: "Outcomes recorded" })} value={stats.outcomes.recorded} />
        <Stat
          label={L({ th: "ใจดีขึ้นหลังเปิดไพ่", en: "Felt better after" })}
          value={stats.mood.pairs ? `${stats.mood.lifted}/${stats.mood.pairs}` : "—"}
        />
      </div>

      <section className="altar-card-porcelain !rounded-2xl p-4 sm:p-6 space-y-4">
        <header className="space-y-1">
          <h2 className="font-serif-th text-base sm:text-lg font-bold text-ink-deep">{L({ th: "ไพ่ที่มาหาคุณบ่อย", en: "Cards that keep showing up" })}</h2>
          <p className="text-xs text-muted font-serif-th leading-relaxed">
            {L({
              th: "เว็บเราสับไพ่แบบพิสูจน์ได้ จึงบอกตรง ๆ ว่าใบไหน \"เด่นจริง\" และใบไหนแค่บังเอิญตามโอกาสสุ่ม — ป้ายเด่นจริงขึ้นเมื่อเจอบ่อยเกินโอกาสสุ่มมากจนแทบเป็นไปไม่ได้ว่าบังเอิญ",
              en: "Our shuffle is provably fair, so we tell you honestly which cards truly stand out and which are just ordinary chance. \"Stands out\" appears only when a card shows up far more than chance would allow.",
            })}
          </p>
        </header>

        {!stats.enoughData ? (
          <p className="text-sm font-serif-th text-ink-deep">
            {L({
              th: `ตอนนี้มีไพ่ ${stats.cardsDrawn} ใบ — ขอสัก ${MIN_CARDS_FOR_STATS} ใบขึ้นไปก่อนถึงจะเริ่มเห็นภาพที่ไม่ใช่ความบังเอิญ`,
              en: `You have ${stats.cardsDrawn} cards so far — we need at least ${MIN_CARDS_FOR_STATS} before anything beyond chance can show.`,
            })}
          </p>
        ) : stats.topCards.length === 0 ? (
          <p className="text-sm font-serif-th text-ink-deep">
            {L({ th: "ยังไม่มีใบไหนมาซ้ำ — ไพ่กระจายตัวตามธรรมชาติของการสุ่ม", en: "No card has repeated yet — your cards are spread the way chance spreads them." })}
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0 m-0">
            {stats.topCards.map((c) => (
              <li key={c.cardIndex} className="flex items-center gap-3 rounded-lg bg-surface/60 border border-line-warm p-2">
                <span className="block w-9 h-[60px] shrink-0 rounded border border-line-warm">
                  <CardImage cardId={c.cardId} alt="" sizes="36px" thumb loading="lazy" className="w-full h-full object-cover rounded" />
                </span>
                <div className="min-w-0 flex-1">
                  <a href={`${isEnglish ? "/en" : ""}/cards/${c.cardId}`} className="text-sm font-serif-th font-semibold text-ink-deep hover:text-gold-ink">
                    {isEnglish ? c.nameEn : c.nameTh}
                  </a>
                  <p className="text-[11px] sm:text-xs text-muted font-serif-th">
                    {L({
                      th: `เจอ ${c.count} ครั้ง · การสุ่มปกติคาดไว้ราว ${c.expected.toFixed(1)}`,
                      en: `${c.count} times · chance alone expects about ${c.expected.toFixed(1)}`,
                    })}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[11px] font-serif-th px-2 py-1 rounded-full ${
                    c.standsOut ? "bg-gold-ink text-surface font-semibold" : "glass-chip text-muted"
                  }`}
                >
                  {c.standsOut ? L({ th: "เด่นจริง", en: "Stands out" }) : L({ th: "ปกติตามโอกาส", en: "Within chance" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {stats.enoughData && (
        <section className="altar-card-porcelain !rounded-2xl p-4 sm:p-6 space-y-4">
          <header className="space-y-1">
            <h2 className="font-serif-th text-base sm:text-lg font-bold text-ink-deep">{L({ th: "พลังที่วนรอบตัวคุณ", en: "The energies around you" })}</h2>
            <p className="text-xs text-muted font-serif-th">
              {L({ th: "แถบ = ของคุณ · ขีดตั้ง = ค่าที่การสุ่มปกติจะให้", en: "Bar = yours · tick = what ordinary chance gives" })}
            </p>
          </header>
          <div className="space-y-3">
            <RatioBar label={L({ th: "ไพ่ชุดใหญ่ (เรื่องใหญ่ในชีวิต)", en: "Major Arcana (big life themes)" })} r={stats.major} isEnglish={isEnglish} />
            <RatioBar label={L({ th: "ไพ่กลับหัว (พลังที่ยังติดค้าง)", en: "Reversed (energy held back)" })} r={stats.reversed} isEnglish={isEnglish} />
            {(["F", "W", "A", "E"] as const).map((e) => (
              <RatioBar key={e} label={`${L({ th: "ธาตุ", en: "Element:" })}${isEnglish ? " " : ""}${L(ELEMENT_LABEL[e])}`} r={stats.elements[e]} isEnglish={isEnglish} />
            ))}
          </div>
          {stats.themes.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-line-warm/40">
              <h3 className="text-sm font-serif-th font-bold text-ink-deep">{L({ th: "แก่นเรื่องที่ไพ่พูดถึง", en: "Themes your cards speak of" })}</h3>
              {stats.themes.slice(0, 6).map((t) => (
                <RatioBar key={t.theme} label={L(THEME_LABEL[t.theme])} r={t} isEnglish={isEnglish} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="glass-tile !rounded-2xl p-4 sm:p-6 space-y-3">
        <h2 className="font-serif-th text-base sm:text-lg font-bold text-ink-deep">{L({ th: "บทเรียนประจำเดือน", en: "This month's reflection" })}</h2>
        {!isMember ? (
          <p className="text-xs sm:text-sm text-muted font-serif-th">
            {L({ th: "เข้าสู่ระบบเพื่อให้แม่หมอช่วยสรุปบทเรียนจากคำอ่านทั้งเดือน", en: "Sign in to get a monthly reflection across your readings." })}
          </p>
        ) : summary ? (
          <div className="space-y-2 font-serif-th text-ink-deep">
            {summary.title && <p className="font-semibold">{summary.title}</p>}
            {summary.synthesis && <p className="text-sm leading-relaxed">{summary.synthesis}</p>}
            {summary.lifeLessons && summary.lifeLessons.length > 0 && (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {summary.lifeLessons.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={loadSummary}
              disabled={summaryState === "loading"}
              className="tap-overlay-y min-h-[44px] px-5 rounded-full btn-gold-glass text-xs sm:text-sm font-serif-th font-bold cursor-pointer disabled:opacity-60"
            >
              {summaryState === "loading" ? L({ th: "กำลังสรุป…", en: "Summarising…" }) : L({ th: "ให้แม่หมอสรุปเดือนนี้", en: "Reflect on this month" })}
            </button>
            {summaryState === "error" && <p className="text-xs text-err font-serif-th">{summaryError}</p>}
          </>
        )}
      </section>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="glass-tile !rounded-xl p-3 sm:p-4 text-center">
    <p className="font-serif-th text-xl sm:text-2xl font-bold text-ink-deep tabular-nums">{value}</p>
    <p className="text-[11px] sm:text-xs text-muted font-serif-th mt-0.5">{label}</p>
  </div>
);

const RatioBar: React.FC<{ label: string; r: RatioStat; isEnglish: boolean }> = ({ label, r, isEnglish }) => {
  const pct = Math.round(r.actual * 100);
  const exp = Math.round(r.expected * 100);
  const verdict =
    r.verdict === "higher"
      ? isEnglish
        ? "Notably more than chance"
        : "มากกว่าโอกาสสุ่มชัดเจน"
      : r.verdict === "lower"
        ? isEnglish
          ? "Notably less than chance"
          : "น้อยกว่าโอกาสสุ่มชัดเจน"
        : r.verdict === "too-few"
          ? isEnglish
            ? "Too few cards to say"
            : "ไพ่ยังน้อยเกินจะสรุป"
          : isEnglish
            ? "Within chance"
            : "อยู่ในช่วงปกติ";
  const strong = r.verdict === "higher" || r.verdict === "lower";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs font-serif-th">
        <span className="text-ink-deep font-semibold">{label}</span>
        <span className={strong ? "text-gold-ink font-semibold" : "text-muted"}>
          {pct}% <span className="text-muted font-normal">({isEnglish ? `chance ${exp}%` : `สุ่มปกติ ${exp}%`})</span> · {verdict}
        </span>
      </div>
      <div
        className="relative h-2.5 rounded-full bg-inset-warm"
        role="img"
        aria-label={`${label}: ${pct}% — ${isEnglish ? `chance ${exp}%` : `สุ่มปกติ ${exp}%`} — ${verdict}`}
      >
        <div className={`absolute inset-y-0 left-0 rounded-full ${strong ? "bg-gold-ink" : "bg-gold-ink/45"}`} style={{ width: `${Math.min(100, pct)}%` }} />
        <div aria-hidden="true" className="absolute -top-1 -bottom-1 w-0.5 bg-ink-deep/70" style={{ left: `calc(${Math.min(100, exp)}% - 1px)` }} />
      </div>
    </div>
  );
};
