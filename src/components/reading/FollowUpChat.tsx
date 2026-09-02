"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Persona } from "@/data/personas";
import { CardImage } from "@/components/card/CardImage";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { requestUpgrade } from "@/lib/entitlement/upgrade-bus";
import { SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import { TTSReaderButton } from "./TTSReaderButton";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
}

interface FollowUpChatProps {
  readingId: string;
  persona: Persona;
  sessionToken?: string | null;
  readingSnapshot?: {
    question?: string;
    spreadId?: string;
    summary?: string;
    personaId?: string;
    drawn?: Array<{ order: number; cardIndex: number; isReversed: boolean }>;
  };
}

/** id ของส่วน "คุยต่อกับแม่หมอ" — ใช้เป็นจุดหมายของปุ่มเลื่อนลงมาจากแผงคำทำนาย */
export const ASK_ORACLE_SECTION_ID = "ask-oracle";

const SUGGESTED_QUESTIONS = [
  "ไพ่แนะนำให้ฉันระวังเรื่องอะไรมากที่สุด?",
  "มีอะไรที่ฉันสามารถเริ่มลงมือทำได้เลยในวันพรุ่งนี้?",
  "จังหวะเวลานี้เหมาะกับการตัดสินใจเรื่องนี้หรือยัง?",
];

export const FollowUpChat: React.FC<FollowUpChatProps> = ({ readingId, persona, sessionToken, readingSnapshot }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ent = useEntitlement();
  const chatLocked = !!ent && ent.enabled && !ent.canChat;
  const isUnlimited =
    !ent ||
    !ent.enabled ||
    ent.role === "admin" ||
    ent.role === "unlimited" ||
    (typeof ent.bonusRemaining === "number" && ent.bonusRemaining > 0);
  const userQuestionsCount = messages.filter((m) => m.sender === "user").length;
  const freeChatLimitReached = !isUnlimited && userQuestionsCount >= 2;
  const chatLogRef = React.useRef<HTMLDivElement>(null);

  // เลื่อนเฉพาะ "กล่องแชท" ให้เห็นข้อความล่าสุด — ห้ามใช้ scrollIntoView เพราะมันจะ
  // เลื่อนทั้งหน้าจอ (window) ตามไปด้วย ทำให้ผู้ใช้โดนดึงหน้าเด้งลงมาทุกครั้งที่กดส่ง
  // และเลื่อนก็ต่อเมื่อผู้ใช้อยู่ใกล้ก้นแชทอยู่แล้ว (ถ้าเลื่อนขึ้นไปอ่านเก่าจะไม่ยุ่ง)
  React.useEffect(() => {
    if (messages.length === 0) return;
    const el = chatLogRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/reading/${readingId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-reading-token": sessionToken || "",
        },
        body: JSON.stringify({
          message: query,
          sessionToken: sessionToken || undefined,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
          readingSnapshot: readingSnapshot || {
            personaId: persona.id,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: data.reply,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: data.error || "ขออภัยนะ แม่หมอไม่สามารถตอบคำถามนี้ได้ในขณะนี้",
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (e) {
      console.error("Chat error", e);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "การเชื่อมต่อขัดข้อง ลองใหม่อีกครั้งนะ",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ห้องคุยกับแม่หมอ — แยกออกมาเป็นส่วนของตัวเองเต็มความกว้าง ไม่ซ่อนอยู่ใต้แท็บอีกต่อไป
       เพราะคนส่วนใหญ่อยากคุยต่อหลังอ่านคำทำนายจบ (คำสั่งเจ้าของโปรเจกต์) */
    <section
      id={ASK_ORACLE_SECTION_ID}
      aria-labelledby="ask-oracle-title"
      className="w-full scroll-mt-24 rounded-3xl border-2 border-[#e5c07b]/45 bg-gradient-to-b from-[#181029]/95 via-[#0d0918]/95 to-[#07050d]/95 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_0_45px_rgba(229,192,123,0.2)] space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[#e5c07b]/25 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-[72px] rounded-lg border-2 overflow-hidden shadow-[0_0_18px_rgba(229,192,123,0.35)] bg-[#0a0812] relative flex-shrink-0"
            style={{ borderColor: persona.accent || "#e0c088" }}
          >
            <CardImage
              image={`${persona.cardImage || (persona.id === "direct" ? "major-11.jpg" : persona.id === "mystic" ? "major-17.jpg" : "major-02.jpg")}`}
              alt={persona.nameTh}
              className="w-full h-full object-cover object-top filter contrast-[1.08] saturate-[1.08] brightness-[1.03] tarot-hd-card-image"
              sizes="96px"
            />
          </div>
          <div className="min-w-0">
            <h3
              id="ask-oracle-title"
              className="font-serif-th text-lg sm:text-xl font-bold font-mystic-gold"
            >
              คุยต่อกับ {persona.nameTh}
            </h3>
            <p className="mt-0.5 font-serif-th text-xs sm:text-sm leading-relaxed text-[#cfc8e2]/85">
              ยังสงสัยตรงไหน อยากเล่าเพิ่ม หรืออยากให้ขยายความ พิมพ์คุยกับแม่หมอได้เลย
            </p>
          </div>
        </div>
        <span className="self-start whitespace-nowrap rounded-full border border-[#e5c07b]/40 bg-[#e5c07b]/10 px-3.5 py-1.5 font-serif-th text-[11px] text-[#f5deaa] sm:self-auto">
          ✦ แม่หมอยังถือไพ่ชุดนี้ของคุณอยู่
        </span>
      </div>

      {/* Suggested Quick Questions */}
      {messages.length === 0 && !chatLocked && (
        <div className="space-y-2">
          <span className="block font-serif-th text-xs text-[#e5c07b] font-semibold">
            ✦ แตะเลือกคำถามที่คนถามกันบ่อย หรือพิมพ์เองก็ได้
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(q)}
                className="cursor-pointer rounded-full border border-[#e5c07b]/30 bg-[#1b1530] px-4 py-2 text-left font-serif-th text-xs text-[#cfc8e2] transition-all hover:border-[#e5c07b]/60 hover:bg-[#262040] hover:text-[#f5deaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700]"
              >
                “{q}”
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div ref={chatLogRef} className="space-y-3 max-h-[26rem] overflow-y-auto pr-1 no-scrollbar">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col items-start gap-1 max-w-[85%]">
                <div
                  className={`w-full rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-[#c9a25e] to-[#e0c088] text-[#0a0812] font-medium rounded-tr-none shadow-md"
                      : "bg-[#1b1530] border border-[#e0c088]/30 text-[#f0dcb4] font-serif-th rounded-tl-none shadow-lg"
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === "bot" && (
                  <TTSReaderButton
                    textToRead={msg.text}
                    personaId={persona.id}
                    className="text-[10px] py-1 px-2.5"
                  />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-[#e0c088] font-serif-th"
          >
            <span className="w-2 h-2 rounded-full bg-[#e0c088] animate-ping" />
            {persona.nameTh} กำลังมองไพ่และพิมพ์ตอบคุณ...
          </motion.div>
        )}
      </div>

      {/* Input Bar */}
      {chatLocked ? (
        /* กั้นเฉพาะช่องพิมพ์ — คำทำนายที่อ่านไปแล้วยังอยู่ครบ ไม่ถูกซ่อน */
        <div className="mt-2 space-y-3 rounded-2xl border border-[#e0c088]/35 bg-[#150f26] p-4">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#e0c088]/35 bg-[#1f1836] text-[#ffd700]">
              <SealedLockIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="font-serif-th text-xs font-bold text-[#f0dcb4] sm:text-sm">
                ถามต่อจากไพ่ชุดนี้ได้เมื่อเป็นสมาชิก
              </p>
              <p className="font-serif-th text-[11px] leading-relaxed text-[#9c93b8]">
                สมัครฟรีเพื่อคุยถามเจาะลึกต่อ เก็บบทสนทนาไว้กับดวงชุดนี้ และดูย้อนหลังได้ทุกเครื่อง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => requestUpgrade("members_only")}
            className="w-full rounded-xl bg-gradient-to-r from-[#c9a25e] to-[#e0c088] px-4 py-3 font-serif-th text-xs font-bold text-[#0a0812] transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120e1f]"
          >
            <span className="mr-1.5">✦</span> สมัครสมาชิกฟรีเพื่อถามต่อ
          </button>
        </div>
      ) : freeChatLimitReached ? (
        /* โควตาแชทฟรี 2 ข้อครบแล้ว — ชวนปลดล็อกญาณพยากรณ์พิเศษ */
        <div className="mt-2 space-y-3 rounded-2xl border border-[#ffd700]/40 bg-gradient-to-b from-[#1b1035] to-[#120b22] p-4 shadow-[0_0_25px_rgba(212,175,55,0.18)]">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#ffd700]/40 bg-[#251545] text-[#ffd700]">
              <span className="font-bold text-sm">✦</span>
            </span>
            <div className="min-w-0 space-y-1">
              <p className="font-serif-th text-xs font-bold text-[#f5deaa] sm:text-sm">
                คุณใช้สิทธิ์ถามคำถามต่อยอดฟรีครบ 2 ข้อแล้ว
              </p>
              <p className="font-serif-th text-[11px] leading-relaxed text-[#cfc8e2]">
                ปลดล็อก <strong>ญาณพยากรณ์พิเศษ</strong> เพื่อคุยถามเจาะลึกกับแม่หมอได้ไม่จำกัดข้อ พร้อมคำแนะนำลึกซึ้ง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => requestUpgrade("daily_exhausted")}
            className="w-full rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] px-4 py-3 font-serif-th text-xs font-bold text-[#0a0812] transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700]"
          >
            <span className="mr-1.5">✦</span> ปลดล็อกญาณพยากรณ์พิเศษเพื่อถามต่อไม่จำกัด
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="space-y-1.5 pt-2"
        >
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="พิมพ์คำถามของคุณที่นี่ เช่น ควรเริ่มลงมือตอนไหนดี..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              aria-label="พิมพ์คำถามถึงแม่หมอ"
              className="min-w-0 flex-1 rounded-xl border border-[#e5c07b]/35 bg-[#1b1530] px-4 py-3.5 font-serif-th text-sm text-[#f5deaa] placeholder-[#9c93b8]/60 transition-colors focus:border-[#e5c07b] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex-shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] px-6 py-3.5 font-serif-th text-sm font-bold text-[#0a0812] shadow-[0_0_18px_rgba(212,175,55,0.28)] transition-all hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
              ส่งคำถาม
            </button>
          </div>
          {!isUnlimited && (
            <div className="flex justify-between items-center px-1 text-[10px] text-[#9c93b8] font-serif-th">
              <span>โควตาถามต่อฟรีสำหรับสมาชิก: เหลืออีก {Math.max(0, 2 - userQuestionsCount)} ข้อ</span>
              <button
                type="button"
                onClick={() => requestUpgrade("daily_exhausted")}
                className="text-[#ffd700] hover:underline cursor-pointer"
              >
                ✦ ปลดล็อกถามไม่จำกัด
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  );
};
