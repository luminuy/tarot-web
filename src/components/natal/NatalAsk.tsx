"use client";

import { useMemo, useState } from "react";
import { splitChatParagraphs } from "@/lib/chat/format-chat-text";
import { stripEmoji } from "@/lib/text/no-emoji";
import type { ChartSpec } from "@/lib/astro/chart-spec";
import type { Lang } from "@/data/natal/content";
import { SectionHead } from "./NatalUi";
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
        <p key={i} className="text-[15px] text-ink leading-relaxed">
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
    <div className="space-y-6">
      <section aria-labelledby="nt-ask-title" className="v2-nr-sec">
        <SectionHead id="nt-ask-title" title={isTh ? "ถามแม่หมอเรื่องผังของคุณ" : "Ask the reader about your chart"}>
          {isTh
            ? "แม่หมอ AI ตอบจากตำแหน่งดาวจริงในผังนี้และดาวจรวันนี้"
            : "The AI reader answers from the real placements in this chart and today's transits."}
          {!timeKnown && (isTh ? " ไม่ทราบเวลาเกิด แม่หมอจึงดูเรือนและลัคนาให้ไม่ได้" : " Without a birth time the reader cannot look at houses or the rising sign.")}
        </SectionHead>

        <div className="v2-nr-controls">
          <p className="v2-nr-box-t">{isTh ? "ขั้นที่ 1: ยินยอมก่อนถาม" : "Step 1: agree before asking"}</p>
          <label className="flex items-start gap-3 text-sm leading-relaxed text-ink cursor-pointer min-h-[44px]">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 w-5 h-5 shrink-0 accent-ink" />
            <span>
              {isTh
                ? "ยินยอมส่งวันเวลาสถานที่เกิด ชื่อที่กรอก และผังนี้ ให้แม่หมอ AI (ผ่านผู้ให้บริการ AI ภายนอก) เพื่อตอบคำถาม เว็บไม่บันทึกข้อมูลเกิดหรือคำถามไว้ ถ้าไม่ติ๊ก ข้อมูลจะอยู่ในเครื่องนี้เท่านั้น"
                : "I agree to send my birth date, time, place, the name entered and this chart to the AI reader (via an external AI provider) to answer my questions. The site does not store the birth data or questions. If unticked, everything stays on this device."}{" "}
              <a href={isTh ? "/privacy" : "/en/privacy"} className="underline text-gold-ink">
                {isTh ? "นโยบายความเป็นส่วนตัว" : "Privacy policy"}
              </a>
            </span>
          </label>
        </div>

        {msgs.length === 0 && (
          <div className="v2-nr-controls">
            <p className="v2-nr-box-t">{isTh ? "ขั้นที่ 2: เลือกคำถาม หรือพิมพ์เองด้านล่าง" : "Step 2: pick a question or type your own below"}</p>
            {!consent && <p className="v2-nr-note">{isTh ? "ติ๊กยินยอมในขั้นที่ 1 ก่อน ปุ่มคำถามจึงจะกดได้" : "Tick the box in step 1 first to use these questions."}</p>}
            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label={isTh ? "คำถามตัวอย่าง" : "Example questions"}>
              {SUGGEST[lang].map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={!consent || busy}
                  onClick={() => void send(q)}
                  className="min-h-[44px] rounded-2xl border border-line-warm bg-surface px-3 py-2 text-left text-sm text-ink disabled:cursor-not-allowed disabled:border-dashed"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {msgs.length > 0 && (
        <ul className="space-y-3" aria-live="polite">
          {msgs.map((m, i) => (
            <li key={i} className={m.sender === "user" ? "flex justify-end" : ""}>
              {m.sender === "user" ? (
                <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-ink px-4 py-2.5 text-sm leading-relaxed text-surface">{m.text}</p>
              ) : m.error ? (
                <p role="alert" className="text-sm text-err border-l-2 border-err pl-2">
                  {m.text}
                </p>
              ) : (
                <div className="v2-nr-box">
                  <p className="v2-nr-item-meta">{isTh ? "แม่หมอตอบ" : "The reader says"}</p>
                  <BotText text={m.text} />
                </div>
              )}
            </li>
          ))}
          {busy && <li className="v2-nr-note">{isTh ? "แม่หมอกำลังดูผังของคุณ..." : "The reader is studying your chart..."}</li>}
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
          className="glass-field flex-1 min-w-0 min-h-[48px] rounded-xl border border-line-interactive-warm px-3 py-2.5 text-base text-ink disabled:cursor-not-allowed"
          autoComplete="off"
        />
        <button type="submit" disabled={!consent || busy || !input.trim()} className="shrink-0 rounded-full btn-gold-glass px-5 min-h-[48px] text-sm font-bold disabled:cursor-not-allowed">
          {isTh ? "ถาม" : "Ask"}
        </button>
      </form>
      <p className="v2-nr-note">
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
