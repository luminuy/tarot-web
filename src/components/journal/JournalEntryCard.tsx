"use client";

import React, { useId, useState } from "react";
import { CardImage } from "@/components/card/CardImage";
import { deckMeta } from "@/data/cards/deck-index-meta";
import { MAX_TAG_LENGTH, MAX_TAGS_PER_ENTRY, normalizeTags, RITUAL_FOCUS_LABEL } from "@/lib/journal/journal-types";
import { moodLabel, moodOption, type MoodLevel } from "@/lib/journal/mood";
import type { ReadingMetaPatch, ReadingOutcome, SavedReadingItem } from "@/lib/utils/history";
import { MoodPicker } from "./MoodPicker";
import { CATEGORY_LABEL, OUTCOME_LABEL, formatDate } from "./journal-format";

/**
 * ✦ การ์ดบันทึกหนึ่งรายการในสมุดดวง (REFLECTION_JOURNAL_PLAN 1.3)
 * แถวบน: วันที่ · ผัง · หมวด · ปักหมุด ✦ — แถวไพ่ (ภาพ 1909 ผ่าน CardImage) — คำถาม — ใจก่อน ➔ หลัง
 * เปิดรายละเอียด: สรุปคำอ่าน · ผลจริง · บันทึก · แท็ก · ยินยอมให้แม่หมอ AI อ่าน · ลบ
 * 🃏 รายการที่ข้อมูลไพ่พัง (`corrupted`) ➔ บอกตรง ๆ ให้โหลดใหม่ ไม่แสดงเหมือนคำอ่านที่ไม่มีไพ่ (กฎเหล็กข้อ 14)
 */
export const JournalEntryCard: React.FC<{
  item: SavedReadingItem;
  isEnglish: boolean;
  isMember: boolean;
  knownTags: string[];
  onPatch: (id: string, patch: ReadingMetaPatch) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
  /** เปิดรายละเอียดไว้ตั้งแต่แรก (ลิงก์จากอีเมลนัดเช็ก) */
  defaultOpen?: boolean;
}> = ({ item, isEnglish, isMember, knownTags, onPatch, onDelete, onTagClick, defaultOpen }) => {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [noteDraft, setNoteDraft] = useState(item.userNote ?? "");
  const [tagDraft, setTagDraft] = useState("");
  const detailId = useId();
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const cards = [...(item.cards ?? [])].sort((a, b) => a.order - b.order);
  const before = moodOption(item.moodBefore);
  const after = moodOption(item.moodAfter);
  const outcome = item.outcome ?? "PENDING";
  const tags = item.tags ?? [];
  const isRitual = item.ritualKind === "morning";

  const addTag = (raw: string) => {
    const next = normalizeTags([...tags, raw]);
    if (next.length !== tags.length) onPatch(item.id, { tags: next });
    setTagDraft("");
  };

  if (item.corrupted) {
    return (
      <article className="glass-tile !rounded-xl p-4 border border-line-warm">
        <p className="text-xs text-muted font-serif-th">{formatDate(item.date, isEnglish, true)}</p>
        <p className="text-sm text-err font-serif-th mt-1">
          {isEnglish
            ? "This entry's card data is damaged. Please reload the page."
            : "ข้อมูลไพ่ของบันทึกนี้เสียหาย กรุณาโหลดใหม่อีกครั้ง"}
        </p>
      </article>
    );
  }

  return (
    <article id={`entry-${item.id}`} className={`altar-card-porcelain !rounded-xl p-4 sm:p-5 space-y-3 scroll-mt-24 ${item.pinned ? "ring-1 ring-gold-ink/60" : ""}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-[11px] sm:text-xs text-muted font-serif-th tracking-wide">
            {formatDate(item.date, isEnglish, true)}
            {" · "}
            {isRitual ? L({ th: "พิธีเช้า", en: "Morning ritual" }) : item.spreadName}
            {" · "}
            {L(CATEGORY_LABEL[item.category] ?? CATEGORY_LABEL.general)}
          </p>
          <h3 className="text-sm sm:text-[15px] font-serif-th font-semibold text-ink-deep leading-snug [text-wrap:pretty]">
            {item.question}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onPatch(item.id, { pinned: !item.pinned })}
          aria-pressed={!!item.pinned}
          aria-label={item.pinned ? L({ th: "เลิกปักหมุด", en: "Unpin" }) : L({ th: "ปักหมุด", en: "Pin" })}
          className={`tap-overlay-y shrink-0 w-11 h-11 -mr-2 -mt-2 rounded-full flex items-center justify-center text-lg cursor-pointer transition-colors ${
            item.pinned ? "text-gold-ink" : "text-line-warm hover:text-gold-ink"
          }`}
        >
          ✦
        </button>
      </header>

      {/* แถวไพ่ — ห่อบรรทัดได้ ไม่ตัดขอบ (กฎเหล็กข้อ 3) */}
      <ul className="flex flex-wrap gap-2 list-none p-0 m-0" aria-label={L({ th: "ไพ่ที่เปิดได้", en: "Cards drawn" })}>
        {cards.map((c) => {
          const meta = deckMeta(c.cardIndex);
          const name = meta ? (isEnglish ? meta.nameEn : meta.nameTh) : isEnglish ? c.cardNameEn || c.cardNameTh : c.cardNameTh;
          return (
            <li key={c.order} className="flex flex-col items-center w-[52px]" title={`${c.positionName}: ${name}`}>
              <span className={`block w-[44px] h-[74px] rounded-md border border-line-warm bg-inset-warm ${c.isReversed ? "rotate-180" : ""}`}>
                {meta ? (
                  <CardImage cardId={meta.id} alt={name} sizes="44px" thumb loading="lazy" className="w-full h-full object-cover rounded-md" />
                ) : null}
              </span>
              <span className="sr-only">
                {c.positionName}: {name}
                {c.isReversed ? L({ th: " (กลับหัว)", en: " (reversed)" }) : ""}
              </span>
            </li>
          );
        })}
      </ul>

      {(before || after || tags.length > 0 || outcome !== "PENDING") && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-serif-th">
          {(before || after) && (
            <span className="glass-chip inline-flex items-center gap-1.5 px-2.5 py-1 text-ink-deep">
              <Dot color={before?.color} />
              {moodLabel(item.moodBefore, isEnglish) ?? "—"}
              <span aria-hidden="true" className="text-muted">
                ➔
              </span>
              <span className="sr-only">{L({ th: " เปลี่ยนเป็น ", en: " changed to " })}</span>
              <Dot color={after?.color} />
              {moodLabel(item.moodAfter, isEnglish) ?? "—"}
            </span>
          )}
          {outcome !== "PENDING" && (
            <span className="glass-chip px-2.5 py-1 text-ink-deep">{L(OUTCOME_LABEL[outcome])}</span>
          )}
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTagClick(t)}
              className="tap-overlay-y glass-chip px-2.5 py-1 text-gold-ink hover:text-gold-ink-deep cursor-pointer"
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen((v) => !v)}
        className="tap-overlay-y text-xs font-serif-th font-semibold text-gold-ink hover:text-gold-ink-deep cursor-pointer"
      >
        {open ? L({ th: "ย่อ", en: "Collapse" }) : L({ th: "เปิดบันทึก · เขียนสิ่งที่เกิดขึ้นจริง", en: "Open · write what really happened" })}
      </button>

      {open && (
        <div id={detailId} className="space-y-4 pt-1 border-t border-line-warm/40">
          {item.summary && (
            <section className="space-y-1">
              <h4 className="text-xs font-serif-th font-bold text-ink-deep">{L({ th: "สรุปคำอ่านตอนนั้น", en: "What the reading said" })}</h4>
              <p className="text-xs sm:text-[13px] font-serif-th text-ink-deep leading-relaxed whitespace-pre-line">{item.summary}</p>
            </section>
          )}

          {isRitual && item.ritual && (
            <section className="space-y-1 text-xs sm:text-[13px] font-serif-th text-ink-deep">
              {item.ritual.focus && (
                <p>
                  <span className="font-semibold">{L({ th: "วันนี้ใส่ใจเรื่อง: ", en: "Today's focus: " })}</span>
                  {L(RITUAL_FOCUS_LABEL[item.ritual.focus])}
                </p>
              )}
              {item.ritual.morningNote && (
                <p>
                  <span className="font-semibold">{L({ th: "เช้านี้: ", en: "This morning: " })}</span>
                  {item.ritual.morningNote}
                </p>
              )}
              {item.ritual.eveningNote && (
                <p>
                  <span className="font-semibold">{L({ th: "เย็นนี้: ", en: "This evening: " })}</span>
                  {item.ritual.eveningNote}
                </p>
              )}
            </section>
          )}

          <section className="space-y-2">
            <h4 className="text-xs font-serif-th font-bold text-ink-deep">{L({ th: "สิ่งที่เกิดขึ้นจริง", en: "What actually happened" })}</h4>
            <div role="radiogroup" aria-label={L({ th: "ผลจริง", en: "Outcome" })} className="flex flex-wrap gap-1.5">
              {(["ACCURATE", "PARTIAL", "NOT_HAPPENED", "PENDING"] as ReadingOutcome[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={outcome === o}
                  onClick={() => onPatch(item.id, { outcome: o })}
                  className={`tap-overlay-y min-h-[44px] px-3.5 rounded-full border text-xs font-serif-th cursor-pointer transition-colors ${
                    outcome === o ? "bg-surface border-gold-ink text-ink-deep font-semibold" : "glass-chip border-line-warm text-ink-deep hover:border-gold-ink"
                  }`}
                >
                  {L(OUTCOME_LABEL[o])}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="sr-only">{L({ th: "บันทึกของคุณ", en: "Your note" })}</span>
              <textarea
                value={noteDraft}
                maxLength={2000}
                rows={3}
                onChange={(e) => setNoteDraft(e.target.value)}
                onBlur={() => {
                  if (noteDraft !== (item.userNote ?? "")) onPatch(item.id, { userNote: noteDraft.trim() });
                }}
                placeholder={L({ th: "เกิดอะไรขึ้นบ้าง ตรงหรือต่างจากที่ไพ่บอกตรงไหน…", en: "What happened? Where did it match or differ from the cards…" })}
                className="w-full rounded-lg border border-line-interactive-warm bg-surface/80 p-3 text-xs sm:text-[13px] font-serif-th text-ink-deep placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
              />
            </label>
          </section>

          {item.checkinAt && (
            <section className="flex items-center justify-between gap-2 rounded-lg bg-surface/60 border border-line-warm p-3 text-xs font-serif-th">
              <span className="text-ink-deep">
                {L({ th: "นัดกลับมาเช็ก: ", en: "Check-in reminder: " })}
                <span className="font-semibold">{formatDate(item.checkinAt, isEnglish)}</span>
              </span>
              <button
                type="button"
                onClick={() => onPatch(item.id, { checkinAt: null })}
                className="tap-overlay-y min-h-[44px] px-3 text-muted hover:text-err cursor-pointer"
              >
                {L({ th: "ยกเลิกนัด", en: "Cancel" })}
              </button>
            </section>
          )}

          <MoodPicker
            value={item.moodAfter}
            onChange={(level: MoodLevel | null) => onPatch(item.id, { moodAfter: level })}
            isEnglish={isEnglish}
            compact
            label={L({ th: "ใจหลังเรื่องนี้", en: "How you feel about it now" })}
          />

          <section className="space-y-2">
            <h4 className="text-xs font-serif-th font-bold text-ink-deep">
              {L({ th: "แท็กของฉัน", en: "My tags" })}{" "}
              <span className="font-normal text-muted">
                ({tags.length}/{MAX_TAGS_PER_ENTRY})
              </span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="glass-chip inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 text-xs font-serif-th text-ink-deep">
                  #{t}
                  <button
                    type="button"
                    onClick={() => onPatch(item.id, { tags: tags.filter((x) => x !== t) })}
                    aria-label={`${L({ th: "ลบแท็ก", en: "Remove tag" })} ${t}`}
                    className="tap-overlay-y w-7 h-7 rounded-full text-muted hover:text-err cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {tags.length < MAX_TAGS_PER_ENTRY && (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (tagDraft.trim()) addTag(tagDraft);
                }}
              >
                <input
                  value={tagDraft}
                  maxLength={MAX_TAG_LENGTH}
                  onChange={(e) => setTagDraft(e.target.value)}
                  list={`${detailId}-tags`}
                  placeholder={L({ th: "เช่น งานใหม่ · แฟน · สอบ", en: "e.g. new job · partner · exam" })}
                  className="flex-1 min-w-0 min-h-[44px] rounded-full border border-line-interactive-warm bg-surface/80 px-4 text-xs font-serif-th text-ink-deep placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
                />
                <datalist id={`${detailId}-tags`}>
                  {knownTags
                    .filter((t) => !tags.includes(t))
                    .map((t) => (
                      <option key={t} value={t} />
                    ))}
                </datalist>
                <button type="submit" className="tap-overlay-y min-h-[44px] px-4 rounded-full btn-gold-glass text-xs font-serif-th font-bold cursor-pointer">
                  {L({ th: "เพิ่ม", en: "Add" })}
                </button>
              </form>
            )}
          </section>

          {isMember && (
            <section className="flex items-start justify-between gap-3 rounded-lg bg-surface/60 border border-line-warm p-3">
              <div className="space-y-0.5">
                <p className="text-xs font-serif-th font-semibold text-ink-deep">{L({ th: "ให้แม่หมอ AI อ่านบันทึกนี้ได้", en: "Let the AI reader see this entry" })}</p>
                <p className="text-[11px] text-muted font-serif-th leading-relaxed">
                  {L({
                    th: "ปิดไว้เป็นค่าเริ่มต้น — เปิดแล้วแม่หมอจะใช้บันทึก ใจ และแท็กของรายการนี้ตอนมองภาพรวมเรื่องของคุณ",
                    en: "Off by default. When on, the reader may use this entry's note, mood and tags when reflecting on your story.",
                  })}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!item.shareWithAi}
                onClick={() => onPatch(item.id, { shareWithAi: !item.shareWithAi })}
                className={`tap-overlay-y shrink-0 relative w-12 h-7 rounded-full border cursor-pointer transition-colors ${
                  item.shareWithAi ? "bg-gold-ink border-gold-ink" : "bg-inset border-line-warm"
                }`}
              >
                <span className="sr-only">{L({ th: "ให้แม่หมอ AI อ่าน", en: "Share with AI reader" })}</span>
                <span
                  aria-hidden="true"
                  className={`absolute top-0.5 w-[22px] h-[22px] rounded-full bg-surface shadow transition-[left] ${item.shareWithAi ? "left-[22px]" : "left-0.5"}`}
                />
              </button>
            </section>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(L({ th: "ลบบันทึกนี้ถาวร?", en: "Delete this entry permanently?" }))) onDelete(item.id);
              }}
              className="tap-overlay-y min-h-[44px] px-3 text-xs font-serif-th text-muted hover:text-err cursor-pointer"
            >
              {L({ th: "ลบบันทึกนี้", en: "Delete entry" })}
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

const Dot: React.FC<{ color?: string }> = ({ color }) => (
  <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color ?? "transparent", border: color ? undefined : "1px solid currentColor" }} />
);
