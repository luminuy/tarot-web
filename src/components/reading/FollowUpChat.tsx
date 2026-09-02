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
  /** `true` = คำตอบสำเร็จรูปออฟไลน์ ไม่ได้มาจาก AI จริง (เซิร์ฟเวอร์ติดธง `fallback` มา) */
  isFallback?: boolean;
  /** `true` = ข้อความแจ้งเตือนข้อผิดพลาดระบบ (จะไม่ถูกส่งต่อเป็นประวัติการคุย) */
  isError?: boolean;
  timestamp?: string;
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

/**
 * ฟังก์ชันแยกและจัดรูปแบบข้อความแชทให้อ่านง่าย เว้นช่องไฟสบายตาเสมือนคนคุยกันจริงๆ
 */
function renderFormattedText(text: string) {
  // แยก **ตัวหนา** ออกมาแสดงผลเป็นสีทองประกาย
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="text-[#ffd700] font-bold">
          {inner}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

/**
 * คอมโพเนนต์แสดงผลฟองแชทของแม่หมอ:
 * - แยกย่อหน้าและเว้นวรรคให้อ่านง่าย
 * - แยกข้อแนะนำที่เป็นลำดับ (1. 2. 3. หรือ •) ออกเป็นการ์ดคำแนะนำย่อยสบายตา
 */
const ChatMessageRenderer: React.FC<{ text: string; isError?: boolean }> = ({ text, isError }) => {
  if (isError) {
    return <p className="font-serif-th text-xs sm:text-sm leading-relaxed text-rose-200">{text}</p>;
  }

  // ปรับการตัดข้อความ: หากมีตัวเลข 1. 2. 3. ติดกัน ให้แยกย่อหน้าใหม่
  const preProcessed = text
    .replace(/([.!?:)”"])\s+(\d+\.\s+\*\*)/g, "$1\n\n$2")
    .replace(/([.!?:)”"])\s+(\d+\.\s+)/g, "$1\n\n$2")
    .replace(/([.!?:)”"])\s+([•\-]\s+)/g, "$1\n\n$2");

  // แยกตามการเว้นบรรทัด
  const paragraphs = preProcessed
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 font-serif-th text-xs sm:text-sm text-[#f5deaa]/95 leading-relaxed">
      {paragraphs.map((p, pIdx) => {
        // ตรวจสอบว่าขึ้นต้นด้วยตัวเลขข้อหรือไม่ เช่น "1. ..." หรือ "2. ..."
        const stepMatch = p.match(/^(\d+)\.\s*(.*)/s);
        if (stepMatch) {
          const stepNum = stepMatch[1];
          const stepBody = stepMatch[2];
          return (
            <div
              key={pIdx}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-[#140d25]/80 border border-[#e5c07b]/25 my-1.5 shadow-sm"
            >
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-[#0a0715] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow">
                {stepNum}
              </span>
              <div className="flex-1 min-w-0 leading-relaxed text-[#f5deaa]">
                {renderFormattedText(stepBody)}
              </div>
            </div>
          );
        }

        // ตรวจสอบว่าเป็น bullet หรือไม่ เช่น "• ..." หรือ "- ..."
        const bulletMatch = p.match(/^[•\-]\s*(.*)/s);
        if (bulletMatch) {
          return (
            <div key={pIdx} className="flex items-start gap-2 pl-1 my-1">
              <span className="text-[#ffd700] text-xs shrink-0 mt-0.5">✦</span>
              <div className="flex-1 leading-relaxed text-[#f5deaa]">{renderFormattedText(bulletMatch[1])}</div>
            </div>
          );
        }

        // ข้อความย่อหน้าทั่วไป
        return (
          <p key={pIdx} className="leading-relaxed">
            {renderFormattedText(p)}
          </p>
        );
      })}
    </div>
  );
};

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

  React.useEffect(() => {
    if (messages.length === 0) return;
    const el = chatLogRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  const getTimeString = () => {
    const now = new Date();
    return now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: getTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const validHistory = messages
        .filter(
          (m) =>
            !m.isError &&
            m.text !== "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม" &&
            !m.text.includes("การเชื่อมต่อขัดข้อง") &&
            !m.text.includes("ขออภัยนะ แม่หมอไม่สามารถตอบคำถามนี้ได้ในขณะนี้")
        )
        .map((m) => ({ sender: m.sender, text: m.text.slice(0, 4000) }));

      const res = await fetch(`/api/reading/${readingId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-reading-token": sessionToken || "",
        },
        body: JSON.stringify({
          message: query,
          sessionToken: sessionToken || undefined,
          history: validHistory,
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
          isFallback: data.fallback === true,
          timestamp: getTimeString(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: data.error || "ขออภัยนะ แม่หมอไม่สามารถตอบคำถามนี้ได้ในขณะนี้",
          isError: true,
          timestamp: getTimeString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (e) {
      console.error("Chat error", e);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "การเชื่อมต่อขัดข้อง ลองใหม่อีกครั้งนะ",
        isError: true,
        timestamp: getTimeString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id={ASK_ORACLE_SECTION_ID}
      aria-labelledby="ask-oracle-title"
      className="w-full scroll-mt-24 rounded-3xl border border-[#e5c07b]/35 bg-gradient-to-b from-[#140d28]/95 via-[#0a0714]/95 to-[#05040a]/95 backdrop-blur-2xl p-4 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col h-[660px] sm:h-[720px] relative overflow-hidden justify-between"
    >
      {/* Background Sacred Geometric Aura */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-radial from-[#e5c07b]/10 via-transparent to-transparent pointer-events-none blur-2xl" />

      {/* ── 1. Modern Messenger Header ── */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#e5c07b]/20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Authentic 1909 Persona Card Avatar */}
          <div
            className="w-10 h-14 rounded-lg border-2 overflow-hidden shadow-[0_0_15px_rgba(229,192,123,0.35)] bg-[#07050d] relative shrink-0"
            style={{ borderColor: persona.accent || "#e5c07b" }}
          >
            <CardImage
              image={`${persona.cardImage || (persona.id === "direct" ? "major-11.jpg" : persona.id === "mystic" ? "major-17.jpg" : "major-02.jpg")}`}
              alt={persona.nameTh}
              className="w-full h-full object-cover object-top filter contrast-[1.05] brightness-[1.02] tarot-hd-card-image"
              sizes="64px"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 id="ask-oracle-title" className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold truncate">
                {persona.nameTh}
              </h3>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ออนไลน์
              </span>
            </div>
            <p className="font-serif-th text-xs text-[#cfc8e2]/75 truncate mt-0.5">
              {persona.tagline || "เปิดใจคุยได้ทุกเรื่อง ไพ่พร้อมตอบเสมอ"}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#f5deaa] border border-[#e5c07b]/35 bg-[#e5c07b]/10 px-3 py-1 rounded-full font-serif-th shrink-0">
          <span>✦</span> ถือสำรับของคุณอยู่
        </span>
      </div>

      {/* ── 2. Chat Log Messages Area ── */}
      <div
        ref={chatLogRef}
        className="flex-1 overflow-y-auto space-y-4 py-3.5 pr-1.5 no-scrollbar scroll-smooth"
      >
        {/* First Persona Welcome Greeting */}
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-10 rounded border border-[#e5c07b]/40 overflow-hidden shrink-0 mt-1 shadow bg-[#0a0715]">
            <CardImage
              image={`${persona.cardImage || "major-02.jpg"}`}
              alt={persona.nameTh}
              className="w-full h-full object-cover object-top"
              sizes="32px"
            />
          </div>
          <div className="max-w-[88%] space-y-1">
            <div className="rounded-2xl rounded-tl-xs bg-[#19122c]/90 border border-[#e5c07b]/25 p-3.5 sm:p-4 text-xs sm:text-sm text-[#f5deaa] font-serif-th leading-relaxed shadow-lg backdrop-blur">
              <p>
                สวัสดีค่ะ ยินดีที่ได้ร่วมเปิดไพ่ด้วยกันนะคะ ✨ มีจุดไหนในคำทำนายที่ยังสงสัย หรืออยากให้แม่หมอช่วยเจาะลึกแนวทางเพิ่มเติม พิมพ์ถามได้ตลอดเลยนะคะ
              </p>
            </div>
            <span className="text-[10px] text-[#9c93b8]/70 font-serif-th pl-1">แม่หมอพร้อมรับฟังเสมอ</span>
          </div>
        </div>

        {/* Suggested Quick Questions if user hasn't asked yet */}
        {messages.length === 0 && !chatLocked && (
          <div className="pl-9 space-y-2 pt-1">
            <span className="text-[11px] text-[#e5c07b] font-serif-th font-semibold flex items-center gap-1">
              <span>✦</span> หรือแตะเลือกคำถามยอดนิยม:
            </span>
            <div className="flex flex-col gap-1.5">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="text-left font-serif-th text-xs text-[#cfc8e2] hover:text-[#ffd700] p-2.5 rounded-xl bg-[#140e24] hover:bg-[#20163a] border border-[#e5c07b]/20 hover:border-[#e5c07b]/50 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <span>"{q}"</span>
                  <span className="text-[#e5c07b] text-xs opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">✦</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Conversation Stream */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex items-start gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Bot Avatar on Left */}
              {msg.sender === "bot" && (
                <div className="w-7 h-10 rounded border border-[#e5c07b]/40 overflow-hidden shrink-0 mt-1 shadow bg-[#0a0715]">
                  <CardImage
                    image={`${persona.cardImage || "major-02.jpg"}`}
                    alt={persona.nameTh}
                    className="w-full h-full object-cover object-top"
                    sizes="32px"
                  />
                </div>
              )}

              <div className={`flex flex-col gap-1 ${msg.sender === "user" ? "items-end max-w-[85%]" : "items-start max-w-[88%]"}`}>
                <div
                  className={`rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                    msg.sender === "user"
                      ? "rounded-tr-xs bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] font-serif-th font-semibold shadow-[0_4px_15px_rgba(212,175,55,0.2)]"
                      : msg.isError
                      ? "rounded-tl-xs bg-[#25131a] border border-rose-500/40 text-rose-200 font-serif-th shadow-md"
                      : "rounded-tl-xs bg-[#19122c]/95 border border-[#e5c07b]/30 text-[#f5deaa] font-serif-th shadow-lg backdrop-blur"
                  }`}
                >
                  <ChatMessageRenderer text={msg.text} isError={msg.isError} />

                  {msg.isError && msg.text.includes("ไม่พบสำรับไพ่") && (
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#e5c07b]/40 bg-[#140e24] px-3 py-1.5 text-xs font-semibold text-[#ffd700] hover:bg-[#20163a] cursor-pointer shadow"
                    >
                      <span>↻</span> รีเฟรชหน้าเว็บเพื่อเชื่อมต่อสำรับไพ่อีกครั้ง
                    </button>
                  )}
                </div>

                {/* Sub-bubble Actions (Timestamp & TTS) */}
                <div className="flex items-center gap-2 text-[10px] text-[#9c93b8]/70 font-serif-th px-1">
                  {msg.timestamp && <span>{msg.timestamp}</span>}
                  {msg.sender === "bot" && !msg.isError && (
                    <TTSReaderButton
                      textToRead={msg.text}
                      personaId={persona.id}
                      className="text-[10px] py-0.5 px-2"
                    />
                  )}
                </div>

                {msg.isFallback && (
                  <p className="font-serif-th text-[10px] leading-relaxed text-[#9c93b8] px-1">
                    ✦ ตอนนี้แม่หมอตอบจากคลังคำตอบสำรอง ลองถามใหม่อีกครั้งในอีกสักครู่นะคะ
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Realistic Human-Like Typing Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5"
            role="status"
            aria-live="polite"
            aria-label={`${persona.nameTh} กำลังพิมพ์ตอบ`}
          >
            <div className="w-7 h-10 rounded border border-[#e5c07b]/40 overflow-hidden shrink-0 mt-1 shadow bg-[#0a0715]">
              <CardImage
                image={`${persona.cardImage || "major-02.jpg"}`}
                alt={persona.nameTh}
                className="w-full h-full object-cover object-top"
                sizes="32px"
              />
            </div>
            <div className="rounded-2xl rounded-tl-xs border border-[#e5c07b]/30 bg-[#19122c]/95 px-4 py-3 shadow-lg flex items-center gap-3">
              <span className="flex items-center gap-1.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block h-2 w-2 rounded-full bg-gradient-to-r from-[#ffd700] to-[#e5c07b]"
                    animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{
                      duration: 0.85,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.18,
                    }}
                  />
                ))}
              </span>
              <span className="font-serif-th text-xs text-[#f5deaa]">
                {persona.nameTh} กำลังดูไพ่และพิมพ์ตอบ...
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── 3. Quick Follow-Up Chips & Messenger Input Dock ── */}
      <div className="shrink-0 pt-2 border-t border-[#e5c07b]/15 space-y-2">
        {messages.length > 0 && !loading && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] text-[#e5c07b] font-serif-th font-semibold shrink-0">✦ ถามต่อด่วน:</span>
            {["สรุปให้หน่อยเป็นข้อๆ", "สิ่งที่ต้องระวังเป็นพิเศษ", "แนวทางเริ่มต้นก้าวแรก"].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(chip)}
                className="text-[11px] text-[#cfc8e2] bg-[#140e24] hover:bg-[#22173d] hover:text-[#ffd700] border border-[#e5c07b]/25 rounded-full px-3 py-1 transition-all cursor-pointer shrink-0 font-serif-th whitespace-nowrap shadow-sm"
              >
                "{chip}"
              </button>
            ))}
          </div>
        )}

        {chatLocked ? (
          <div className="space-y-2 rounded-2xl border border-[#e0c088]/35 bg-[#150f26] p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[#e0c088]/35 bg-[#1f1836] text-[#ffd700]">
                <SealedLockIcon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="font-serif-th text-xs font-bold text-[#f0dcb4]">
                  ถามต่อจากไพ่ชุดนี้ได้เมื่อเป็นสมาชิก
                </p>
                <p className="font-serif-th text-[11px] leading-relaxed text-[#9c93b8]">
                  สมัครฟรีเพื่อคุยถามเจาะลึกต่อ เก็บบทสนทนาไว้กับดวงชุดนี้ได้ทุกเครื่อง
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => requestUpgrade("members_only")}
              className="w-full rounded-xl bg-gradient-to-r from-[#c9a25e] to-[#e0c088] px-4 py-2.5 font-serif-th text-xs font-bold text-[#0a0812] transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer shadow"
            >
              ✦ สมัครสมาชิกฟรีเพื่อถามต่อ
            </button>
          </div>
        ) : freeChatLimitReached ? (
          <div className="space-y-2 rounded-2xl border border-[#ffd700]/40 bg-gradient-to-b from-[#1b1035] to-[#120b22] p-3.5 shadow-lg">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[#ffd700]/40 bg-[#251545] text-[#ffd700] text-xs font-bold">
                ✦
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="font-serif-th text-xs font-bold text-[#f5deaa]">
                  ใช้สิทธิ์ถามคำถามต่อยอดฟรีครบ 2 ข้อแล้ว
                </p>
                <p className="font-serif-th text-[11px] leading-relaxed text-[#cfc8e2]">
                  ปลดล็อก <strong>ญาณพยากรณ์พิเศษ</strong> เพื่อคุยถามเจาะลึกกับแม่หมอได้ไม่จำกัดข้อ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => requestUpgrade("daily_exhausted")}
              className="w-full rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] px-4 py-2.5 font-serif-th text-xs font-bold text-[#0a0812] transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer shadow"
            >
              ✦ ปลดล็อกญาณพยากรณ์พิเศษเพื่อถามต่อไม่จำกัด
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="space-y-1.5"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-[#e5c07b]/40 bg-[#120b22]/90 p-1.5 pl-3.5 focus-within:border-[#ffd700] transition-colors shadow-inner">
              <input
                type="text"
                placeholder={`พิมพ์ถาม ${persona.nameTh} ที่นี่...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                aria-label="พิมพ์คำถามถึงแม่หมอ"
                className="min-w-0 flex-1 bg-transparent font-serif-th text-xs sm:text-sm text-[#f5deaa] placeholder-[#9c93b8]/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] px-4 py-2 font-serif-th text-xs sm:text-sm font-bold text-[#0a0812] shadow-[0_0_12px_rgba(212,175,55,0.3)] transition-all hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:shadow-none flex items-center gap-1"
              >
                <span>ส่ง</span>
                <span className="text-[10px]">✦</span>
              </button>
            </div>

            {!isUnlimited && (
              <div className="flex justify-between items-center px-2 text-[10px] text-[#9c93b8] font-serif-th">
                <span>สิทธิ์ถามฟรี: เหลืออีก {Math.max(0, 2 - userQuestionsCount)} ข้อ</span>
                <button
                  type="button"
                  onClick={() => requestUpgrade("daily_exhausted")}
                  className="text-[#ffd700] hover:underline cursor-pointer"
                >
                  ปลดล็อกไม่จำกัด ✦
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </section>
  );
};

