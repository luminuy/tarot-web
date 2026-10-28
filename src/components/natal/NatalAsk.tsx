"use client";

import { useMemo, useState } from "react";
import { splitChatParagraphs } from "@/lib/chat/format-chat-text";
import { stripEmoji } from "@/lib/text/no-emoji";
import type { ChartSpec } from "@/lib/astro/chart-spec";
import type { Lang } from "@/data/natal/content";
import { NATAL_AI_FREE_PER_DAY, NATAL_AI_HISTORY_TURN_MAX, NATAL_AI_HISTORY_TURNS, NATAL_AI_MESSAGE_MAX } from "@/lib/astro/natal-ai-limits";

/**
 * 💬 แท็บ "ถามแม่หมอ" ในผลผังดวง (โหลดแบบ lazy จาก `NatalResult`)
 * - ข้อมูลเกิดออกจากเครื่องเฉพาะเมื่อผู้ใช้ติ๊กยินยอมแล้วกดส่งเอง (เจ้าของเคาะ 2026-10-28) · ไม่จำการยินยอมข้ามการเปิดหน้า
 * - ไม่เก็บบทสนทนาลงเครื่อง · ข้อความจาก AI ผ่าน `stripEmoji()` ก่อนแสดง (กฎเหล็กข้อ 2)
 */

interface Msg {
  sender: "user" | "bot";
  text: string;
  error?: boolean;
  crisis?: boolean;
}

const SUGGEST: Record<Lang, string[]> = {
  th: ["จุดแข็งที่สุดในผังของฉันคืออะไร", "ผังนี้บอกอะไรเรื่องความรักบ้าง", "งานแบบไหนเหมาะกับฉัน", "ช่วงนี้ดาวจรกำลังสอนอะไรฉัน"],
  en: ["What is the strongest part of my chart?", "What does my chart say about love?", "What kind of work suits me?", "What are the current transits teaching me?"],
};

function Bold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : <span key={i}>{p.replace(/\*\*/g, "")}</span>))}
    </>
  );
}

function BotText({ text }: { text: string }) {
  const paras = useMemo(() => splitChatParagraphs(stripEmoji(text)), [text]);
  return (
    <div className="space-y-2">
      {paras.map((p, i) => (
        <p key={i} className="text-sm text-ink leading-relaxed">
          <Bold text={p.replace(/^[-–—]\s+/, "")} />
        </p>
      ))}
    </div>
  );
}

export default function NatalAsk({ spec, lang, timeKnown }: { spec: ChartSpec; lang: Lang; timeKnown: boolean }) {
  const isTh = lang === "th";
  const [consent, setConsent] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [freeLeft, setFreeLeft] = useState<number | null>(null);
  const [needSignIn, setNeedSignIn] = useState(false);
  const [needRefill, setNeedRefill] = useState(false);

  async function send(q: string) {
    const question = q.trim().slice(0, NATAL_AI_MESSAGE_MAX);
    if (!question || busy || !consent) return;
    const history = msgs
      .filter((m) => !m.error && !m.crisis)
      .slice(-NATAL_AI_HISTORY_TURNS)
      .map((m) => ({ sender: m.sender, text: m.text.slice(0, NATAL_AI_HISTORY_TURN_MAX) }));
    setMsgs((m) => [...m, { sender: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/natal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, lang, consent: true, chart: spec, history }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string; reason?: string; crisisCard?: boolean; freeRemaining?: number | null };
      if (res.ok && data.reply) {
        setMsgs((m) => [...m, { sender: "bot", text: data.reply!, crisis: !!data.crisisCard }]);
        if (typeof data.freeRemaining === "number") setFreeLeft(data.freeRemaining);
      } else {
        if (data.reason === "members_only") setNeedSignIn(true);
        if (data.reason === "natal_free_exhausted") setNeedRefill(true);
        setMsgs((m) => [
          ...m,
          { sender: "bot", error: true, text: data.error || (isTh ? "แม่หมอตอบไม่ได้ตอนนี้ ลองใหม่อีกครั้งนะ" : "The reader cannot answer right now. Please try again.") },
        ]);
      }
    } catch {
      setMsgs((m) => [...m, { sender: "bot", error: true, text: isTh ? "การเชื่อมต่อขัดข้อง ลองใหม่อีกครั้งนะ" : "Connection interrupted. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {isTh
          ? "ถามแม่หมอ AI เรื่องผังของคุณได้ตรง ๆ แม่หมอจะตอบจากตำแหน่งดาวจริงในผังนี้และดาวจรวันนี้ ใช้สิทธิ์ AI เดียวกับการถามแม่หมอต่อ (สมาชิก)"
          : "Ask the AI reader anything about your chart. Answers draw on the real placements in this chart and today's transits. Uses the same AI allowance as follow-up questions (members)."}
        {!timeKnown && (isTh ? " ไม่ทราบเวลาเกิด แม่หมอจึงดูเรือนและลัคนาให้ไม่ได้" : " Without a birth time the reader cannot look at houses or the rising sign.")}
      </p>

      <label className="flex items-start gap-2 rounded-xl border border-line-warm bg-surface/70 p-3 text-sm text-ink cursor-pointer">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 w-4 h-4 shrink-0" />
        <span>
          {isTh
            ? "ยินยอมส่งวันเวลาสถานที่เกิด ชื่อที่กรอก และผังนี้ ให้แม่หมอ AI (ผ่านผู้ให้บริการ AI ภายนอก) เพื่อตอบคำถาม เว็บไม่บันทึกข้อมูลเกิดหรือคำถามไว้ ถ้าไม่ติ๊ก ข้อมูลจะอยู่ในเครื่องนี้เท่านั้น"
            : "I agree to send my birth date, time, place, the name entered and this chart to the AI reader (via an external AI provider) to answer my questions. The site does not store the birth data or questions. If unticked, everything stays on this device."}{" "}
          <a href={isTh ? "/privacy" : "/en/privacy"} className="underline text-gold-ink">
            {isTh ? "นโยบายความเป็นส่วนตัว" : "Privacy policy"}
          </a>
        </span>
      </label>

      {msgs.length > 0 && (
        <ul className="space-y-3" aria-live="polite">
          {msgs.map((m, i) => (
            <li key={i} className={m.sender === "user" ? "flex justify-end" : ""}>
              {m.sender === "user" ? (
                <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-surface border border-line-warm px-3 py-2 text-sm text-ink">{m.text}</p>
              ) : m.error ? (
                <p role="alert" className="text-sm text-err border-l-2 border-err pl-2">
                  {m.text}
                </p>
              ) : (
                <div className="altar-card-porcelain rounded-2xl rounded-tl-sm p-3 sm:p-4">
                  <BotText text={m.text} />
                </div>
              )}
            </li>
          ))}
          {busy && <li className="text-sm text-muted">{isTh ? "แม่หมอกำลังดูผังของคุณ..." : "The reader is studying your chart..."}</li>}
        </ul>
      )}

      {needSignIn && (
        <a href="/account" className="inline-flex min-h-[44px] items-center rounded-full border border-gold-ink px-4 text-sm font-semibold text-ink">
          {isTh ? "เข้าสู่ระบบ / สมัครสมาชิก" : "Sign in or create an account"}
        </a>
      )}
      {needRefill && (
        <a href={isTh ? "/pricing" : "/en/pricing"} className="inline-flex min-h-[44px] items-center rounded-full border border-gold-ink px-4 text-sm font-semibold text-ink">
          {isTh ? "ดูแพ็กเกจเติมรอบ" : "See refill packages"}
        </a>
      )}

      {msgs.length === 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={isTh ? "คำถามตัวอย่าง" : "Example questions"}>
          {SUGGEST[lang].map((q) => (
            <button key={q} type="button" disabled={!consent || busy} onClick={() => void send(q)} className="tap-target rounded-full border border-line-warm px-3 py-1.5 text-sm text-ink disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex gap-2"
      >
        <label htmlFor="nt-ask" className="sr-only">
          {isTh ? "คำถามเรื่องผังดวง" : "Your question about the chart"}
        </label>
        <input
          id="nt-ask"
          type="text"
          value={input}
          maxLength={NATAL_AI_MESSAGE_MAX}
          disabled={!consent}
          onChange={(e) => setInput(e.target.value)}
          placeholder={consent ? (isTh ? "พิมพ์คำถามเรื่องผังของคุณ" : "Type a question about your chart") : isTh ? "ติ๊กยินยอมด้านบนก่อนถาม" : "Tick the consent box above first"}
          className="glass-field flex-1 min-w-0 rounded-xl border border-line-interactive-warm px-3 py-2.5 text-sm text-ink disabled:opacity-60"
          autoComplete="off"
        />
        <button type="submit" disabled={!consent || busy || !input.trim()} className="shrink-0 rounded-full btn-gold-glass px-4 min-h-[44px] text-sm font-bold disabled:opacity-50">
          {isTh ? "ถาม" : "Ask"}
        </button>
      </form>
      <p className="text-xs text-muted">
        {freeLeft !== null
          ? isTh
            ? `วันนี้เหลือสิทธิ์ถามฟรีเรื่องผังดวงอีก ${freeLeft} ข้อ`
            : `${freeLeft} free chart ${freeLeft === 1 ? "question" : "questions"} left today`
          : isTh
            ? `สมาชิกถามฟรีวันละ ${NATAL_AI_FREE_PER_DAY} ข้อ ถ้ามีรอบดูดวงที่เติมไว้ถามต่อได้มากกว่านั้น · คำตอบเป็นแนวทาง ไม่ใช่คำตัดสินชีวิต`
            : `Members get ${NATAL_AI_FREE_PER_DAY} free questions a day, more with refilled readings. Answers are guidance, not a verdict on your life.`}
      </p>
    </div>
  );
}
