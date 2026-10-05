"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CardImage } from "@/components/card/CardImage";
import { MoodPicker } from "@/components/journal/MoodPicker";
import { dayKeyOf, primaryCard } from "@/components/journal/journal-format";
import { deckMeta } from "@/data/cards/deck-index-meta";
import { THEME_LABEL, themesOf, type ThemeId } from "@/data/cards/themes";
import { MAX_RITUAL_NOTE_LENGTH } from "@/lib/journal/journal-types";
import { moodOption, type MoodLevel } from "@/lib/journal/mood";
import { bangkokHour, reflectionStreak } from "@/lib/journal/ritual";
import { getReadings, updateReadingMeta, type ReadingOutcome, type SavedReadingItem } from "@/lib/utils/history";
import { markPwaValueMoment } from "@/lib/pwa/pwa-client";

/**
 * ✦ พิธีเช้า-เย็น (REFLECTION_JOURNAL_PLAN 1.9) — ส่วนที่ต่อจากการเปิดไพ่ประจำวันเดิมของ `/daily`
 * ---------------------------------------------------------------------------
 *  • เช้า (หลังพลิกไพ่): สิ่งที่ควรสังเกต 1 บรรทัด · คำถามสะท้อนตัวเองจากคลังต่อไพ่ · ใจตอนนี้ · บรรทัดเดียว
 *  • เย็น (กลับมาวันเดียวกัน): ตรงกับไพ่ / บางส่วน / ไม่ตรง (ใช้ `outcome` เดิม) · ใจตอนเย็น · บรรทัดเดียว
 *  • 7 วันที่ผ่านมา: ไพ่เรียงแถว · ใจที่เปลี่ยน · แก่นเรื่องที่เด่น · streak แบบใจดี (พักได้สัปดาห์ละ 1 วัน)
 * ไม่มีการเรียก AI เลย — เปิดทันทีและใช้ออฟไลน์ได้ · คลังคำถามโหลดแบบ dynamic import ตอนต้องใช้เท่านั้น
 */

let promptsPromise: Promise<typeof import("@/data/cards/reflection-prompts")> | null = null;
function loadPrompts() {
  if (!promptsPromise) {
    promptsPromise = import("@/data/cards/reflection-prompts");
    promptsPromise.catch(() => {
      promptsPromise = null;
    });
  }
  return promptsPromise;
}

function useReflectionPrompt(cardId: string | undefined, isReversed: boolean, isEnglish: boolean) {
  const [prompt, setPrompt] = useState<string | undefined>();
  useEffect(() => {
    if (!cardId) return;
    let alive = true;
    loadPrompts()
      .then((m) => alive && setPrompt(m.reflectionPromptFor(cardId, isReversed, isEnglish)))
      .catch(() => alive && setPrompt(undefined));
    return () => {
      alive = false;
    };
  }, [cardId, isReversed, isEnglish]);
  return prompt;
}

/** ── เช้า ── */
export const MorningReflection: React.FC<{
  cardId: string;
  isReversed: boolean;
  keywords: string[];
  journalId: string | null;
  isEnglish: boolean;
}> = ({ cardId, isReversed, keywords, journalId, isEnglish }) => {
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const prompt = useReflectionPrompt(cardId, isReversed, isEnglish);
  const [mood, setMood] = useState<MoodLevel | null>(null);
  // ✦ ทำพิธีเช้าแล้ว = จังหวะที่เห็นคุณค่า (ครบ 2 วัน ➔ ชวนติดตั้งแอปได้)
  useEffect(() => {
    markPwaValueMoment("ritual", dayKeyOf(new Date()));
  }, []);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <section className="altar-card-porcelain !rounded-2xl p-5 sm:p-6 space-y-4" aria-labelledby="morning-reflection-h">
      <header className="space-y-1">
        <p className="text-xs font-serif-th font-semibold text-gold-ink">✦ {L({ th: "พิธีเช้า 2 นาที", en: "Two-minute morning ritual" })}</p>
        <h2 id="morning-reflection-h" className="text-lg sm:text-xl font-serif-th font-bold text-ink-deep">
          {L({ th: "ก่อนเริ่มวัน ลองถามตัวเองสักข้อ", en: "Before the day begins, ask yourself one thing" })}
        </h2>
      </header>

      {keywords.length > 0 && (
        <p className="text-sm font-serif-th text-ink-deep">
          <span className="font-semibold">{L({ th: "สิ่งที่ควรสังเกตวันนี้: ", en: "Notice today: " })}</span>
          {keywords.slice(0, 3).join(" · ")}
        </p>
      )}

      <blockquote className="border-l-4 border-gold-ink pl-4 py-1 font-serif-th text-base sm:text-lg text-ink-deep leading-relaxed [text-wrap:pretty]">
        {prompt ?? <span className="text-muted italic text-sm">{L({ th: "กำลังเตรียมคำถาม…", en: "Preparing your question…" })}</span>}
      </blockquote>

      <MoodPicker
        value={mood}
        onChange={(level) => {
          setMood(level);
          if (journalId) updateReadingMeta(journalId, { moodBefore: level });
        }}
        isEnglish={isEnglish}
        compact
        label={L({ th: "ใจเช้านี้", en: "This morning I feel" })}
        hint={L({ th: "ไม่บังคับ", en: "Optional" })}
      />

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!journalId || !note.trim()) return;
          updateReadingMeta(journalId, { ritual: { morningNote: note.trim() } });
          setSaved(true);
        }}
      >
        <label htmlFor="morning-note" className="block text-xs sm:text-[13px] font-serif-th font-semibold text-ink-deep">
          {L({ th: "ตอบสั้น ๆ บรรทัดเดียว (ไม่บังคับ)", en: "One short line (optional)" })}
        </label>
        <div className="flex gap-2">
          <input
            id="morning-note"
            value={note}
            maxLength={MAX_RITUAL_NOTE_LENGTH}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            placeholder={L({ th: "วันนี้ฉันจะ…", en: "Today I will…" })}
            className="flex-1 min-w-0 min-h-[44px] rounded-full border border-line-warm bg-surface/80 px-4 text-sm font-serif-th text-ink-deep placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
          />
          <button
            type="submit"
            disabled={!journalId || !note.trim()}
            className="tap-overlay-y min-h-[44px] px-5 rounded-full btn-gold-glass text-xs sm:text-sm font-serif-th font-bold cursor-pointer disabled:opacity-50"
          >
            {saved ? L({ th: "บันทึกแล้ว", en: "Saved" }) : L({ th: "บันทึก", en: "Save" })}
          </button>
        </div>
      </form>

      <p className="text-[11px] sm:text-xs text-muted font-serif-th">
        {L({
          th: "เย็นนี้กลับมาที่หน้านี้อีกครั้ง เพื่อดูว่าวันนี้เป็นไปอย่างที่ไพ่ชวนสังเกตไหม — ใช้เวลาไม่ถึงนาที",
          en: "Come back this evening to see how the day matched what the card invited you to notice — under a minute.",
        })}
      </p>
    </section>
  );
};

/** ── เย็น ── บันทึกพิธีเช้าของวันนี้ (เวลาไทย) ถ้ามี */
function todaysMorning(list: SavedReadingItem[]): SavedReadingItem | undefined {
  const today = dayKeyOf(new Date());
  return list.find((r) => r.ritualKind === "morning" && !r.corrupted && dayKeyOf(r.date) === today);
}

export const EveningCheckin: React.FC<{ isEnglish: boolean }> = ({ isEnglish }) => {
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const [entry, setEntry] = useState<SavedReadingItem | undefined>();
  const [note, setNote] = useState("");
  const [isEvening, setIsEvening] = useState(false);

  useEffect(() => {
    setEntry(todaysMorning(getReadings()));
    setIsEvening(bangkokHour() >= 16);
  }, []);

  const pc = entry ? primaryCard(entry) : undefined;
  const meta = pc ? deckMeta(pc.cardIndex) : undefined;
  const prompt = useReflectionPrompt(meta?.id, !!pc?.isReversed, isEnglish);
  if (!entry || !meta || !pc) return null;
  const done = Boolean(entry.ritual?.eveningAt);
  const outcome = entry.outcome ?? "PENDING";

  const patch = (p: Parameters<typeof updateReadingMeta>[1]) => {
    const next = updateReadingMeta(entry.id, p);
    if (next) setEntry(next);
  };

  return (
    <section className="glass-tile !rounded-2xl p-5 sm:p-6 space-y-4" aria-labelledby="evening-h">
      <div className="flex items-start gap-4">
        <span className={`block w-14 h-24 shrink-0 rounded-lg border border-line-warm ${pc.isReversed ? "rotate-180" : ""}`}>
          <CardImage cardId={meta.id} alt={isEnglish ? meta.nameEn : meta.nameTh} sizes="56px" loading="lazy" className="w-full h-full object-cover rounded-lg" />
        </span>
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-serif-th font-semibold text-gold-ink">
            ✦ {isEvening ? L({ th: "เช็กอินเย็นนี้", en: "Evening check-in" }) : L({ th: "ไพ่ของคุณเช้านี้", en: "Your card this morning" })}
          </p>
          <h2 id="evening-h" className="text-base sm:text-lg font-serif-th font-bold text-ink-deep">
            {isEnglish ? meta.nameEn : meta.nameTh}
            {pc.isReversed ? L({ th: " (กลับหัว)", en: " (reversed)" }) : ""}
          </h2>
          {prompt && <p className="text-sm font-serif-th text-ink-deep leading-relaxed">“{prompt}”</p>}
          {entry.ritual?.morningNote && (
            <p className="text-xs font-serif-th text-muted">
              {L({ th: "เช้านี้คุณเขียนว่า: ", en: "This morning you wrote: " })}
              {entry.ritual.morningNote}
            </p>
          )}
        </div>
      </div>

      {done ? (
        <p className="text-sm font-serif-th text-ink-deep" role="status">
          {L({ th: "เช็กอินเย็นนี้แล้ว — พรุ่งนี้เช้าพบกันใหม่", en: "You've checked in this evening — see you tomorrow morning." })}
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-xs sm:text-[13px] font-serif-th font-semibold text-ink-deep">{L({ th: "วันนี้เกิดอะไรขึ้น เทียบกับไพ่", en: "How did today compare with the card?" })}</p>
            <div role="radiogroup" aria-label={L({ th: "เทียบกับไพ่", en: "Compared with the card" })} className="flex flex-wrap gap-1.5">
              {(
                [
                  ["ACCURATE", { th: "ตรงกับไพ่", en: "It matched" }],
                  ["PARTIAL", { th: "ตรงบางส่วน", en: "Partly" }],
                  ["NOT_HAPPENED", { th: "ไม่ตรง", en: "Not really" }],
                ] as Array<[ReadingOutcome, { th: string; en: string }]>
              ).map(([o, label]) => (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={outcome === o}
                  onClick={() => patch({ outcome: o })}
                  className={`tap-overlay-y min-h-[44px] px-4 rounded-full border text-xs sm:text-[13px] font-serif-th cursor-pointer ${
                    outcome === o ? "bg-surface border-gold-ink text-ink-deep font-semibold" : "glass-chip border-line-warm text-ink-deep hover:border-gold-ink"
                  }`}
                >
                  {L(label)}
                </button>
              ))}
            </div>
          </div>
          <MoodPicker
            value={entry.moodAfter}
            onChange={(level) => patch({ moodAfter: level })}
            isEnglish={isEnglish}
            compact
            label={L({ th: "ใจตอนนี้", en: "Right now I feel" })}
          />
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              patch({ ritual: { ...(note.trim() ? { eveningNote: note.trim() } : {}), eveningAt: new Date().toISOString() } });
            }}
          >
            <input
              value={note}
              maxLength={MAX_RITUAL_NOTE_LENGTH}
              onChange={(e) => setNote(e.target.value)}
              aria-label={L({ th: "บรรทัดเดียวของวันนี้", en: "One line about today" })}
              placeholder={L({ th: "สิ่งที่ตรง / ไม่ตรงกับไพ่ (ไม่บังคับ)", en: "What matched or didn't (optional)" })}
              className="flex-1 min-w-0 min-h-[44px] rounded-full border border-line-warm bg-surface/80 px-4 text-sm font-serif-th text-ink-deep placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
            />
            <button type="submit" className="tap-overlay-y min-h-[44px] px-5 rounded-full btn-gold-glass text-xs sm:text-sm font-serif-th font-bold cursor-pointer">
              {L({ th: "ปิดวัน", en: "Close the day" })}
            </button>
          </form>
        </>
      )}
    </section>
  );
};

/** ── 7 วันที่ผ่านมา + streak ใจดี ── */
export const WeekStrip: React.FC<{ isEnglish: boolean; refreshKey?: unknown }> = ({ isEnglish, refreshKey }) => {
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const [list, setList] = useState<SavedReadingItem[]>([]);
  useEffect(() => {
    setList(getReadings().filter((r) => r.ritualKind === "morning" && !r.corrupted));
  }, [refreshKey]);

  const data = useMemo(() => {
    const today = dayKeyOf(new Date());
    const byDay = new Map<string, SavedReadingItem>();
    for (const r of list) {
      const k = dayKeyOf(r.date);
      if (!byDay.has(k)) byDay.set(k, r);
    }
    const days = Array.from({ length: 7 }, (_, i) => {
      const k = new Date(Date.parse(`${today}T00:00:00Z`) - (6 - i) * 86_400_000).toISOString().slice(0, 10);
      return { key: k, entry: byDay.get(k) };
    });
    const themeCount = new Map<ThemeId, number>();
    let shifts = 0;
    let shiftSum = 0;
    for (const d of days) {
      const pc = d.entry ? primaryCard(d.entry) : undefined;
      const meta = pc ? deckMeta(pc.cardIndex) : undefined;
      if (meta && pc) for (const t of themesOf(meta.id, pc.isReversed)) themeCount.set(t, (themeCount.get(t) ?? 0) + 1);
      if (d.entry?.moodBefore && d.entry?.moodAfter) {
        shifts++;
        shiftSum += d.entry.moodAfter - d.entry.moodBefore;
      }
    }
    const topTheme = [...themeCount.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      days,
      streak: reflectionStreak(byDay.keys(), today),
      topTheme: topTheme && topTheme[1] >= 2 ? topTheme : undefined,
      avgShift: shifts ? shiftSum / shifts : null,
    };
  }, [list]);

  if (list.length < 2) return null;
  const weekday = (k: string) =>
    new Intl.DateTimeFormat(isEnglish ? "en-GB" : "th-TH", { weekday: "short", timeZone: "UTC" }).format(new Date(`${k}T00:00:00Z`));

  return (
    <section className="glass-tile !rounded-2xl p-5 sm:p-6 space-y-4" aria-labelledby="week-strip-h">
      <header className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 id="week-strip-h" className="text-base sm:text-lg font-serif-th font-bold text-ink-deep">
          {L({ th: "7 วันที่ผ่านมาของคุณ", en: "Your last seven days" })}
        </h2>
        <p className="text-xs font-serif-th text-gold-ink font-semibold">
          ✦ {L({ th: `กลับมาทบทวนต่อเนื่อง ${data.streak.days} วัน`, en: `${data.streak.days}-day reflection streak` })}
          <span className="text-muted font-normal"> · {L({ th: "พักได้สัปดาห์ละ 1 วัน", en: "one rest day a week is fine" })}</span>
        </p>
      </header>
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-3 list-none p-0 m-0">
        {data.days.map((d) => {
          const pc = d.entry ? primaryCard(d.entry) : undefined;
          const meta = pc ? deckMeta(pc.cardIndex) : undefined;
          const before = moodOption(d.entry?.moodBefore);
          const after = moodOption(d.entry?.moodAfter);
          return (
            <li key={d.key} className="flex flex-col items-center gap-1">
              <span className="text-[10px] sm:text-xs font-serif-th text-muted">{weekday(d.key)}</span>
              <span className={`block w-full max-w-[56px] aspect-[3/5] rounded-md border ${meta ? "border-line-warm" : "border-dashed border-line-warm bg-inset-warm/40"} ${pc?.isReversed ? "rotate-180" : ""}`}>
                {meta && <CardImage cardId={meta.id} alt={isEnglish ? meta.nameEn : meta.nameTh} sizes="56px" loading="lazy" className="w-full h-full object-cover rounded-md" />}
              </span>
              <span className="flex gap-0.5 h-2" aria-hidden="true">
                {before && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: before.color }} />}
                {after && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: after.color }} />}
              </span>
            </li>
          );
        })}
      </ol>
      {(data.topTheme || data.avgShift !== null) && (
        <p className="text-sm font-serif-th text-ink-deep leading-relaxed">
          {data.topTheme && (
            <>
              {L({ th: "ไพ่สัปดาห์นี้พูดถึง ", en: "This week's cards keep speaking of " })}
              <span className="font-semibold">{L(THEME_LABEL[data.topTheme[0]])}</span>
              {L({ th: ` (${data.topTheme[1]} วัน)`, en: ` (${data.topTheme[1]} days)` })}.{" "}
            </>
          )}
          {data.avgShift !== null &&
            (data.avgShift > 0.25
              ? L({ th: "ใจตอนเย็นมักเบากว่าตอนเช้า", en: "Your evenings tend to feel lighter than your mornings." })
              : data.avgShift < -0.25
                ? L({ th: "ใจตอนเย็นมักหนักกว่าตอนเช้า — ลองพักให้มากขึ้นนะ", en: "Evenings tend to feel heavier than mornings — be gentle with your rest." })
                : L({ th: "ใจเช้ากับเย็นใกล้เคียงกัน", en: "Mornings and evenings feel about the same." }))}
        </p>
      )}
      <a href={isEnglish ? "/en/journal" : "/journal"} className="inline-flex text-xs sm:text-[13px] font-serif-th font-semibold text-gold-ink underline underline-offset-2">
        ✦ {L({ th: "ดูทั้งหมดในสมุดดวง", en: "See everything in your journal" })}
      </a>
    </section>
  );
};
