"use client";

import React, { useEffect, useState } from "react";
import { CardImage } from "@/components/card/CardImage";
import { deckMeta } from "@/data/cards/deck-index-meta";
import { moodLabel, moodOption } from "@/lib/journal/mood";
import {
  deleteThreadRemote,
  fetchThreadDetail,
  fetchThreads,
  patchThreadRemote,
  type JournalThread,
} from "@/lib/journal/threads-client";
import type { ReadingMetaPatch, SavedReadingItem } from "@/lib/utils/history";
import { JournalEntryCard } from "./JournalEntryCard";
import { OUTCOME_LABEL, formatDate, primaryCard } from "./journal-format";

/**
 * 🧵 เรื่องที่ติดตาม + เส้นเวลา (REFLECTION_JOURNAL_PLAN 1.4)
 * ---------------------------------------------------------------------------
 * รายการเรื่อง ➔ แตะ ➔ เส้นเวลา: ไพ่ใบหลักเรียงตามวัน (แนวนอนบนจอกว้าง · แนวตั้งบนมือถือ)
 * ระหว่างจุดแสดงใจที่เปลี่ยน · ทุกจุดเปิดบันทึกเต็มได้ (เขียนสิ่งที่เกิดขึ้นจริง)
 * ปิดเรื่องพร้อมบทสรุป ("เรื่องนี้จบแล้ว") · เปลี่ยนชื่อ · ลบเรื่อง (คำอ่านยังอยู่ในสมุด)
 * ⚠️ ภาพไพ่ผ่าน CardImage · แถวไพ่ห่อบรรทัดได้ ไม่ตัดขอบ (กฎเหล็กข้อ 3 · 8)
 */
export const JournalThreads: React.FC<{
  isEnglish: boolean;
  isMember: boolean;
  initialThreadId: string | null;
  knownTags: string[];
  onPatch: (id: string, patch: ReadingMetaPatch) => void;
  onDelete: (id: string) => void;
  /** ส่วนสะท้อนภาพรวมของเรื่อง (คลื่น 4) — ไม่ส่ง = ไม่แสดง */
  renderReflection?: (threadId: string, entries: SavedReadingItem[]) => React.ReactNode;
}> = ({ isEnglish, isMember, initialThreadId, knownTags, onPatch, onDelete, renderReflection }) => {
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const [threads, setThreads] = useState<JournalThread[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(initialThreadId);
  const [detail, setDetail] = useState<{ thread: JournalThread; entries: SavedReadingItem[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closingNote, setClosingNote] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);

  useEffect(() => {
    if (!isMember) return;
    void fetchThreads().then(setThreads);
  }, [isMember]);

  useEffect(() => {
    if (!openId || !isMember) {
      setDetail(null);
      return;
    }
    let alive = true;
    setLoadingDetail(true);
    void fetchThreadDetail(openId).then((d) => {
      if (!alive) return;
      setDetail(d);
      setClosingNote(d?.thread.closingNote ?? "");
      setLoadingDetail(false);
    });
    return () => {
      alive = false;
    };
  }, [openId, isMember]);

  if (!isMember) {
    return (
      <div className="altar-card-porcelain !rounded-2xl p-6 text-center space-y-3 font-serif-th">
        <p className="text-base text-ink-deep">
          {L({ th: "เข้าสู่ระบบเพื่อติดตามเรื่องเดียวกันข้ามหลายคำอ่าน", en: "Sign in to follow one story across many readings." })}
        </p>
        <a href={isEnglish ? "/en/account" : "/account"} className="tap-overlay-y inline-flex min-h-[44px] items-center px-5 rounded-full btn-gold-glass text-sm font-bold">
          {L({ th: "เข้าสู่ระบบ", en: "Sign in" })}
        </a>
      </div>
    );
  }

  const patchEntry = (id: string, patch: ReadingMetaPatch) => {
    onPatch(id, patch);
    setDetail((d) =>
      d
        ? {
            ...d,
            entries: patch.threadId === null ? d.entries.filter((e) => e.id !== id) : d.entries.map((e) => (e.id === id ? { ...e, ...normalizePatch(patch) } : e)),
          }
        : d,
    );
  };

  if (openId) {
    const t = detail?.thread;
    const entries = detail?.entries ?? [];
    return (
      <section className="space-y-4" aria-label={L({ th: "เส้นเวลาของเรื่อง", en: "Story timeline" })}>
        <button type="button" onClick={() => setOpenId(null)} className="tap-overlay-y min-h-[44px] text-xs sm:text-sm font-serif-th font-semibold text-gold-ink cursor-pointer">
          ← {L({ th: "เรื่องทั้งหมด", en: "All stories" })}
        </button>
        {loadingDetail && !detail ? (
          <p className="text-sm text-muted font-serif-th italic" role="status">
            {L({ th: "กำลังเปิดเรื่อง…", en: "Opening the story…" })}
          </p>
        ) : !t ? (
          <p className="text-sm text-err font-serif-th">{L({ th: "ไม่พบเรื่องนี้", en: "Story not found." })}</p>
        ) : (
          <>
            <header className="altar-card-porcelain !rounded-2xl p-4 sm:p-6 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                {renaming !== null ? (
                  <form
                    className="flex gap-2 flex-1 min-w-0"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const title = renaming.trim();
                      if (!title) return;
                      if (await patchThreadRemote(t.id, { title })) {
                        setDetail((d) => (d ? { ...d, thread: { ...d.thread, title } } : d));
                        setThreads((list) => list?.map((x) => (x.id === t.id ? { ...x, title } : x)) ?? list);
                      }
                      setRenaming(null);
                    }}
                  >
                    <input
                      value={renaming}
                      maxLength={60}
                      onChange={(e) => setRenaming(e.target.value)}
                      aria-label={L({ th: "ชื่อเรื่อง", en: "Story title" })}
                      className="flex-1 min-w-0 min-h-[44px] rounded-full border border-line-interactive-warm bg-surface/80 px-4 text-sm font-serif-th text-ink-deep"
                    />
                    <button type="submit" className="tap-overlay-y min-h-[44px] px-4 rounded-full btn-gold-glass text-xs font-serif-th font-bold cursor-pointer">
                      {L({ th: "บันทึก", en: "Save" })}
                    </button>
                  </form>
                ) : (
                  <h2 className="font-serif-th text-lg sm:text-2xl font-bold text-ink-deep [text-wrap:balance]">“{t.title}”</h2>
                )}
                <span className={`glass-chip px-3 py-1 text-xs font-serif-th ${t.status === "closed" ? "text-muted" : "text-gold-ink font-semibold"}`}>
                  {t.status === "closed" ? L({ th: "จบแล้ว", en: "Closed" }) : L({ th: "กำลังติดตาม", en: "Following" })}
                </span>
              </div>
              <p className="text-xs text-muted font-serif-th">
                {L({ th: `${entries.length} คำอ่าน · เริ่ม ${formatDate(t.createdAt, false)}`, en: `${entries.length} readings · since ${formatDate(t.createdAt, true)}` })}
              </p>
              {t.closingNote && t.status === "closed" && (
                <p className="text-sm font-serif-th text-ink-deep border-l-4 border-gold-ink pl-3">{t.closingNote}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1 text-xs font-serif-th">
                <button type="button" onClick={() => setRenaming(t.title)} className="tap-overlay-y min-h-[44px] px-3 rounded-full glass-chip text-ink-deep cursor-pointer">
                  {L({ th: "เปลี่ยนชื่อ", en: "Rename" })}
                </button>
                {t.status === "open" ? (
                  <button type="button" onClick={() => setClosing(true)} className="tap-overlay-y min-h-[44px] px-3 rounded-full glass-chip text-ink-deep cursor-pointer">
                    {L({ th: "เรื่องนี้จบแล้ว", en: "This story has ended" })}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (await patchThreadRemote(t.id, { status: "open" })) setDetail((d) => (d ? { ...d, thread: { ...d.thread, status: "open" } } : d));
                    }}
                    className="tap-overlay-y min-h-[44px] px-3 rounded-full glass-chip text-ink-deep cursor-pointer"
                  >
                    {L({ th: "เปิดติดตามอีกครั้ง", en: "Reopen" })}
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(L({ th: "ลบเรื่องนี้? (คำอ่านทั้งหมดยังอยู่ในสมุด)", en: "Delete this story? (Your readings stay in the journal.)" }))) return;
                    if (await deleteThreadRemote(t.id)) {
                      setThreads((list) => list?.filter((x) => x.id !== t.id) ?? list);
                      setOpenId(null);
                    }
                  }}
                  className="tap-overlay-y min-h-[44px] px-3 rounded-full text-muted hover:text-err cursor-pointer"
                >
                  {L({ th: "ลบเรื่อง", en: "Delete story" })}
                </button>
              </div>
              {closing && (
                <form
                  className="space-y-2 pt-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await patchThreadRemote(t.id, { status: "closed", closingNote: closingNote.trim() || null })) {
                      setDetail((d) => (d ? { ...d, thread: { ...d.thread, status: "closed", closingNote: closingNote.trim() || undefined } } : d));
                      setThreads((list) => list?.map((x) => (x.id === t.id ? { ...x, status: "closed" } : x)) ?? list);
                    }
                    setClosing(false);
                  }}
                >
                  <label htmlFor="closing-note" className="block text-xs font-serif-th font-semibold text-ink-deep">
                    {L({ th: "สรุปเรื่องนี้สั้น ๆ ถึงตัวเอง (ไม่บังคับ)", en: "A short note to yourself about how it ended (optional)" })}
                  </label>
                  <textarea
                    id="closing-note"
                    rows={3}
                    maxLength={1000}
                    value={closingNote}
                    onChange={(e) => setClosingNote(e.target.value)}
                    className="w-full rounded-lg border border-line-interactive-warm bg-surface/80 p-3 text-sm font-serif-th text-ink-deep"
                  />
                  <button type="submit" className="tap-overlay-y min-h-[44px] px-5 rounded-full btn-gold-glass text-xs font-serif-th font-bold cursor-pointer">
                    {L({ th: "ปิดเรื่อง", en: "Close the story" })}
                  </button>
                </form>
              )}
            </header>

            {entries.length > 0 && (
              <ol className="relative flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 list-none p-0 m-0 sm:pl-0 pl-5 border-l-2 sm:border-l-0 border-gold-ink/40">
                {entries.map((e, i) => {
                  const pc = primaryCard(e);
                  const meta = pc ? deckMeta(pc.cardIndex) : undefined;
                  const prev = entries[i - 1];
                  const mood = moodOption(e.moodAfter ?? e.moodBefore);
                  const prevMood = prev ? (prev.moodAfter ?? prev.moodBefore) : undefined;
                  const nowMood = e.moodAfter ?? e.moodBefore;
                  return (
                    <li key={e.id} className="flex sm:flex-col items-center sm:items-center gap-3 sm:w-28">
                      <span className="hidden sm:block text-[11px] font-serif-th text-muted">{formatDate(e.date, isEnglish)}</span>
                      <span className={`block w-14 h-24 shrink-0 rounded-lg border border-line-warm bg-surface ${pc?.isReversed ? "rotate-180" : ""}`}>
                        {meta && <CardImage cardId={meta.id} alt={isEnglish ? meta.nameEn : meta.nameTh} sizes="56px" loading="lazy" className="w-full h-full object-cover rounded-lg" />}
                      </span>
                      <div className="min-w-0 sm:text-center space-y-0.5">
                        <p className="sm:hidden text-[11px] font-serif-th text-muted">{formatDate(e.date, isEnglish)}</p>
                        <p className="text-xs font-serif-th font-semibold text-ink-deep">{meta ? (isEnglish ? meta.nameEn : meta.nameTh) : "—"}</p>
                        {mood && (
                          <p className="text-[11px] font-serif-th text-muted inline-flex items-center gap-1">
                            <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ backgroundColor: mood.color }} />
                            {moodLabel(nowMood, isEnglish)}
                            {prevMood && nowMood && nowMood !== prevMood ? (nowMood > prevMood ? " ↑" : " ↓") : ""}
                          </p>
                        )}
                        <p className="text-[11px] font-serif-th text-gold-ink">{L(OUTCOME_LABEL[e.outcome ?? "PENDING"])}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {renderReflection && entries.length > 0 && renderReflection(t.id, entries)}

            <div className="space-y-3">
              {[...entries].reverse().map((e) => (
                <JournalEntryCard
                  key={e.id}
                  item={e}
                  isEnglish={isEnglish}
                  isMember
                  knownTags={knownTags}
                  onPatch={patchEntry}
                  onDelete={(id) => {
                    onDelete(id);
                    setDetail((d) => (d ? { ...d, entries: d.entries.filter((x) => x.id !== id) } : d));
                  }}
                  onTagClick={() => {}}
                />
              ))}
            </div>
          </>
        )}
      </section>
    );
  }

  if (threads === null) {
    return (
      <p className="text-center text-sm text-muted font-serif-th italic" role="status">
        {L({ th: "กำลังโหลดเรื่องที่ติดตาม…", en: "Loading your stories…" })}
      </p>
    );
  }
  if (threads.length === 0) {
    return (
      <div className="altar-card-porcelain !rounded-2xl p-6 text-center font-serif-th space-y-2">
        <p className="text-base text-ink-deep">{L({ th: "ยังไม่มีเรื่องที่ติดตาม", en: "You aren't following any story yet." })}</p>
        <p className="text-xs sm:text-sm text-muted">
          {L({
            th: "หลังเปิดไพ่ แตะ \"เริ่มติดตามเรื่องนี้\" แล้วครั้งหน้าที่ถามเรื่องเดิม เลือกเรื่องนี้ได้เลย",
            en: "After a reading, tap \"Start following this story\" — next time you ask about it, pick the story.",
          })}
        </p>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0">
      {threads.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => setOpenId(t.id)}
            className="tap-overlay-y w-full text-left altar-card-porcelain !rounded-xl p-4 space-y-1 cursor-pointer hover:ring-1 hover:ring-gold-ink/60"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="font-serif-th font-bold text-ink-deep">“{t.title}”</span>
              <span className={`text-[11px] font-serif-th shrink-0 ${t.status === "closed" ? "text-muted" : "text-gold-ink"}`}>
                {t.status === "closed" ? L({ th: "จบแล้ว", en: "Closed" }) : L({ th: "กำลังติดตาม", en: "Following" })}
              </span>
            </span>
            <span className="block text-xs text-muted font-serif-th">
              {L({ th: `${t.entryCount ?? 0} คำอ่าน`, en: `${t.entryCount ?? 0} readings` })}
              {t.lastEntryAt ? ` · ${L({ th: "ล่าสุด", en: "latest" })} ${formatDate(t.lastEntryAt, isEnglish)}` : ""}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
};

/** แพตช์ฝั่งหน้าจอ: null ของใจ/เรื่อง/นัด = ล้างค่า */
function normalizePatch(p: ReadingMetaPatch): Partial<SavedReadingItem> {
  const out: Partial<SavedReadingItem> = {};
  if (p.outcome !== undefined) out.outcome = p.outcome;
  if (p.userNote !== undefined) out.userNote = p.userNote || undefined;
  if (p.pinned !== undefined) out.pinned = p.pinned || undefined;
  if (p.tags !== undefined) out.tags = p.tags;
  if (p.moodBefore !== undefined) out.moodBefore = p.moodBefore ?? undefined;
  if (p.moodAfter !== undefined) out.moodAfter = p.moodAfter ?? undefined;
  if (p.shareWithAi !== undefined) out.shareWithAi = p.shareWithAi || undefined;
  if (p.checkinAt !== undefined) out.checkinAt = p.checkinAt ?? undefined;
  return out;
}
