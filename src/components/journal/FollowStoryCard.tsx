"use client";

import React, { useEffect, useState } from "react";
import { createThreadRemote, suggestCheckinDays, suggestThreadTitle } from "@/lib/journal/threads-client";
import { updateReadingMeta } from "@/lib/utils/history";

/**
 * 🧵 "ติดตามเรื่องนี้" ท้ายคำอ่าน (REFLECTION_JOURNAL_PLAN 1.4)
 * ---------------------------------------------------------------------------
 *  • ยังไม่มีเรื่อง ➔ ตั้งชื่อเรื่อง (เติมจากคำถามให้ แก้ได้) ➔ ผูกคำอ่านนี้เข้าเรื่อง
 *  • นัดกลับมาเช็ก 7 / 30 / 90 วัน (ค่าแนะนำเดาจากกรอบเวลาของคำอ่าน) ➔ อีเมลเตือนโดยไม่มีคำถามเต็ม
 *  • ผู้เยี่ยมชม ➔ ชวนเข้าสู่ระบบ (เรื่องต้องตามได้ข้ามเครื่อง + ต้องมีช่องทางเตือน)
 * ⚠️ ไฟล์นี้อยู่ในเปลือกหน้าแรก — เบา ไม่มี motion ไม่มีสำรับ
 */
export const FollowStoryCard: React.FC<{
  journalId: string;
  question: string;
  timing?: string;
  isMember: boolean;
  /** เลือก "ถามต่อจากเรื่องเดิม" ไว้แล้วตอนตั้งคำถาม */
  existingThread?: { id: string; title: string } | null;
  isEnglish: boolean;
  onSignIn: () => void;
}> = ({ journalId, question, timing, isMember, existingThread, isEnglish, onSignIn }) => {
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const [thread, setThread] = useState<{ id: string; title: string } | null>(existingThread ?? null);
  const [title, setTitle] = useState(() => suggestThreadTitle(question));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkinDays, setCheckinDays] = useState<number | null>(null);
  const suggested = suggestCheckinDays(timing);

  useEffect(() => {
    if (existingThread) setThread(existingThread);
  }, [existingThread]);

  if (!isMember) {
    return (
      <div className="glass-tile !rounded-xl p-4 sm:p-5 w-full max-w-2xl mx-auto space-y-2 font-serif-th">
        <p className="text-sm font-bold text-ink-deep">✦ {L({ th: "อยากติดตามเรื่องนี้ไหม", en: "Want to follow this story?" })}</p>
        <p className="text-xs sm:text-[13px] text-muted leading-relaxed">
          {L({
            th: "เข้าสู่ระบบเพื่อรวมคำอ่านเรื่องเดียวกันเป็นเส้นเวลา และให้เราเตือนกลับมาเขียนว่าเกิดอะไรขึ้นจริง",
            en: "Sign in to gather readings about the same matter on one timeline, and get a reminder to note what really happened.",
          })}
        </p>
        <button type="button" onClick={onSignIn} className="tap-overlay-y min-h-[44px] px-5 rounded-full btn-gold-glass text-xs sm:text-sm font-bold cursor-pointer">
          {L({ th: "เข้าสู่ระบบ", en: "Sign in" })}
        </button>
      </div>
    );
  }

  const start = async () => {
    setBusy(true);
    setError(null);
    const res = await createThreadRemote(title.trim());
    setBusy(false);
    if (!res.thread) {
      setError(res.error ?? L({ th: "สร้างเรื่องไม่สำเร็จ", en: "Couldn't create the story" }));
      return;
    }
    setThread({ id: res.thread.id, title: res.thread.title });
    updateReadingMeta(journalId, { threadId: res.thread.id });
  };

  const setCheckin = (days: number | null) => {
    setCheckinDays(days);
    updateReadingMeta(journalId, { checkinAt: days ? new Date(Date.now() + days * 86_400_000).toISOString() : null });
  };

  return (
    <div className="glass-tile !rounded-xl p-4 sm:p-5 w-full max-w-2xl mx-auto space-y-3 font-serif-th text-ink-deep">
      {thread ? (
        <p className="text-sm">
          <span className="font-bold">✦ {L({ th: "บันทึกไว้ในเรื่อง", en: "Saved to the story" })}</span> “{thread.title}”{" "}
          <a href={`${isEnglish ? "/en" : ""}/journal?thread=${encodeURIComponent(thread.id)}`} className="text-gold-ink underline underline-offset-2 text-xs sm:text-[13px]">
            {L({ th: "ดูเส้นเวลา", en: "See the timeline" })}
          </a>
        </p>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim() && !busy) void start();
          }}
        >
          <label htmlFor={`story-${journalId}`} className="block text-sm font-bold">
            ✦ {L({ th: "เริ่มติดตามเรื่องนี้", en: "Start following this story" })}
          </label>
          <p className="text-xs text-muted">
            {L({
              th: "ครั้งหน้าถามเรื่องเดิม เลือกเรื่องนี้ได้เลย แม่หมอจะจำได้ว่าเคยคุยอะไรกันไว้",
              en: "Next time you ask about it, pick this story — your reader will remember where you left off.",
            })}
          </p>
          <div className="flex gap-2">
            <input
              id={`story-${journalId}`}
              value={title}
              maxLength={60}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={L({ th: "เช่น งานใหม่ · ความสัมพันธ์กับ ก.", en: "e.g. the new job · things with A." })}
              className="flex-1 min-w-0 min-h-[44px] rounded-full border border-line-interactive-warm bg-surface/80 px-4 text-sm text-ink-deep placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
            />
            <button type="submit" disabled={busy || !title.trim()} className="tap-overlay-y min-h-[44px] px-5 rounded-full btn-gold-glass text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50">
              {busy ? "…" : L({ th: "ติดตาม", en: "Follow" })}
            </button>
          </div>
          {error && <p className="text-xs text-err">{error}</p>}
        </form>
      )}

      <div className="space-y-2 pt-1 border-t border-line-warm/40">
        <p className="text-xs sm:text-[13px] font-semibold pt-2">{L({ th: "ให้เราเตือนกลับมาเช็กว่าเกิดอะไรขึ้นจริงไหม", en: "Remind me to check what really happened?" })}</p>
        <div role="radiogroup" aria-label={L({ th: "นัดกลับมาเช็ก", en: "Check-in reminder" })} className="flex flex-wrap gap-1.5">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={checkinDays === d}
              onClick={() => setCheckin(checkinDays === d ? null : d)}
              className={`tap-overlay-y min-h-[44px] px-4 rounded-full border text-xs cursor-pointer ${
                checkinDays === d ? "bg-surface border-gold-ink font-semibold" : "glass-chip border-line-warm hover:border-gold-ink"
              }`}
            >
              {L({ th: `อีก ${d} วัน`, en: `In ${d} days` })}
              {d === suggested && checkinDays === null ? L({ th: " · แนะนำ", en: " · suggested" }) : ""}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted" role="status">
          {checkinDays
            ? L({
                th: `ตั้งนัดแล้ว — เราจะส่งอีเมลเตือนโดยไม่มีคำถามของคุณอยู่ในนั้น ยกเลิกได้ในสมุดดวง`,
                en: "Reminder set — the email won't include your question. Cancel anytime in your journal.",
              })
            : L({ th: "ไม่บังคับ · อีเมลเตือนจะไม่มีคำถามของคุณอยู่ในนั้น", en: "Optional · the reminder never includes your question." })}
        </p>
      </div>
    </div>
  );
};
