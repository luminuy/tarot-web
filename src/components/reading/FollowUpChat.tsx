"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Persona } from "@/data/personas";
import { CardImage } from "@/components/card/CardImage";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
}

interface FollowUpChatProps {
  readingId: string;
  persona: Persona;
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

export const FollowUpChat: React.FC<FollowUpChatProps> = ({ readingId, persona, readingSnapshot }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
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
              sizes="180px"
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
      {messages.length === 0 && (
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
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1 no-scrollbar">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-[#c9a25e] to-[#e0c088] text-[#0a0812] font-medium rounded-tr-none shadow-md"
                    : "bg-[#1b1530] border border-[#e0c088]/30 text-[#f0dcb4] font-serif-th rounded-tl-none shadow-lg"
                }`}
              >
                {msg.text}
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
        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
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
    </div>
  );
};
