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
    <div className="w-full max-w-3xl mx-auto rounded-2xl bg-[#120e1f]/80 border border-[#e0c088]/30 backdrop-blur-xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e0c088]/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-12 rounded-md border overflow-hidden shadow bg-[#0a0812] relative flex-shrink-0"
            style={{ borderColor: persona.accent || "#e0c088" }}
          >
            <CardImage
              image={`${persona.cardImage || (persona.id === "direct" ? "major-11.jpg" : persona.id === "mystic" ? "major-17.jpg" : "major-02.jpg")}`}
              alt={persona.nameTh}
              className="w-full h-full object-cover object-top filter contrast-[1.08] saturate-[1.08] brightness-[1.03] tarot-hd-card-image"
              sizes="64px"
            />
          </div>
          <div>
            <h4 className="font-serif-th text-xs sm:text-sm font-semibold text-[#f0dcb4]">
              ถามคำถามต่อยอดกับ {persona.nameTh}
            </h4>
            <p className="text-[10px] text-[#9c93b8]">
              สงสัยจุดไหนเกี่ยวกับไพ่ที่เพิ่งเปิด สามารถพิมพ์ถามเพิ่มได้เลย
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      {messages.length === 0 && !chatLocked && (
        <div className="space-y-1.5">
          <span className="text-[11px] text-[#e0c088] font-medium block">
            ✦ คำถามที่คนนิยมถามต่อ:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(q)}
                className="text-[11px] text-[#cfc8e2] bg-[#1b1530] hover:bg-[#262040] hover:text-[#f0dcb4] border border-[#e0c088]/25 rounded-full px-3 py-1 transition-all cursor-pointer text-left"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div ref={chatLogRef} className="space-y-3 max-h-80 overflow-y-auto pr-1 no-scrollbar">
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
      ) : (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center gap-2 pt-2"
      >
        <input
          type="text"
          placeholder="พิมพ์คำถามเพิ่มเติมเกี่ยวกับไพ่ชุดนี้..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 bg-[#1b1530] border border-[#e0c088]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#f0dcb4] placeholder-[#9c93b8]/50 focus:outline-none focus:border-[#e0c088]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a25e] to-[#e0c088] text-[#0a0812] text-xs font-semibold font-serif-th hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all cursor-pointer flex-shrink-0"
        >
          ส่งคำถาม
        </button>
      </form>
      )}
    </div>
  );
};
