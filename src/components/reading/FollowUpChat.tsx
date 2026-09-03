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
        <strong key={idx} className="text-[#CD9F5B] font-bold">
          {inner}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

/**
 * คอมโพเนนต์แสดงผลข้อความแม่หมอ:
 * - แยกความคิดออกเป็นบับเบิ้ลย่อยๆ เหมือนคนพิมพ์คุยกัน
 * - ตรวจจับการวิเคราะห์ไพ่รายใบ และแยกออกเป็น "Tarot Insight Card" มีกรอบทองคำ อ่านง่าย สบายตา
 * - ตรวจจับข้อแนะนำลำดับขั้นตอน (1. 2. 3.) และแยกเป็นการ์ดทีละข้อ
 */
const ChatMessageRenderer: React.FC<{ text: string; isError?: boolean }> = ({ text, isError }) => {
  if (isError) {
    return (
      <div className="rounded-2xl rounded-tl-xs bg-rose-50 border border-rose-200 p-3.5 sm:p-4 text-rose-800 font-serif-th text-xs sm:text-sm leading-relaxed shadow-xs">
        {text}
      </div>
    );
  }

  // ปรับการตัดข้อความ:
  // 1. แยกไพ่ที่ถูกเขียนต่อกันด้วยเครื่องหมาย - หรือ ✦ ในบรรทัดเดียว
  // 2. แยกลำดับขั้นตอน 1. 2. 3. ออกเป็นข้อๆ
  const preProcessed = text
    .replace(/\s+[-–—]\s*([^\n:]+):/g, "\n\n• **$1:**")
    .replace(/✦\s*([^\n:]+):/g, "\n\n• **$1:**")
    .replace(/([^\n])\s+(\d+\.\s+\*\*)/g, "$1\n\n$2")
    .replace(/([^\n])\s+(\d+\.\s+[ก-๙a-zA-Z])/g, "$1\n\n$2")
    .trim();

  // แยกตามการเว้นบรรทัด
  const paragraphs = preProcessed
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2.5 w-full">
      {paragraphs.map((p, pIdx) => {
        // Case 1: การ์ดวิเคราะห์ไพ่ทาโรต์ (เช่น "• **ตำแหน่งหัวใจ (9 ดาบ):** คำอธิบาย..." หรือ "• ตำแหน่ง...:")
        const cardMatch =
          p.match(/^[•\-✦]\s*\*\*(.*?)\*\*\s*:?\s*(.*)/s) ||
          p.match(/^[•\-✦]\s*([^\n:]+):\s*(.*)/s);

        if (cardMatch) {
          const cardTitle = cardMatch[1];
          const cardBody = cardMatch[2];
          return (
            <motion.div
              key={pIdx}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: pIdx * 0.12,
                type: "spring",
                stiffness: 360,
                damping: 25,
              }}
              className="rounded-2xl p-3.5 sm:p-4 bg-[#FFFFFF] border border-[#D6B48D] shadow-xs space-y-1.5 transition-all duration-300 hover:border-[#CD9F5B]"
            >
              <div className="flex items-center gap-2 text-[#CD9F5B] font-bold text-xs sm:text-sm font-serif-th">
                <span className="text-[#CD9F5B] text-xs">✦</span>
                <span>{renderFormattedText(cardTitle)}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#5A432F] leading-relaxed font-serif-th pl-3.5 border-l-2 border-[#D6B48D]">
                {renderFormattedText(cardBody)}
              </p>
            </motion.div>
          );
        }

        // Case 2: ลำดับขั้นตอนคำแนะนำ (เช่น "1. **พักสมอง:** ...")
        const stepMatch = p.match(/^(\d+)\.\s*(.*)/s);
        if (stepMatch) {
          const stepNum = stepMatch[1];
          const stepBody = stepMatch[2];
          return (
            <motion.div
              key={pIdx}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: pIdx * 0.12,
                type: "spring",
                stiffness: 360,
                damping: 25,
              }}
              className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#D6B48D] shadow-xs hover:border-[#CD9F5B] transition-all duration-300"
            >
              <span className="w-5 h-5 rounded-full bg-[#CD9F5B] text-[#FDF7F0] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-xs">
                {stepNum}
              </span>
              <div className="flex-1 min-w-0 leading-relaxed font-serif-th text-xs sm:text-sm text-[#5A432F]">
                {renderFormattedText(stepBody)}
              </div>
            </motion.div>
          );
        }

        // Case 3: ฟองแชทสนทนาทั่วไป (บับเบิ้ลโค้งมน นุ่มนวล สบายตา)
        return (
          <motion.div
            key={pIdx}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: pIdx * 0.12,
              type: "spring",
              stiffness: 360,
              damping: 25,
            }}
            className="rounded-2xl rounded-tl-xs bg-[#FFFFFF] border border-[#D6B48D] p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed text-[#5A432F] font-serif-th shadow-xs hover:border-[#CD9F5B] transition-colors"
          >
            <p className="leading-relaxed">{renderFormattedText(p)}</p>
          </motion.div>
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
    if (messages.length === 0 && !loading) return;
    const el = chatLogRef.current;
    if (!el) return;
    const scrollBottom = () => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    };
    scrollBottom();
    const t1 = setTimeout(scrollBottom, 120);
    const t2 = setTimeout(scrollBottom, 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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
      className="w-full scroll-mt-24 rounded-[1.618rem] border border-[#D6B48D] bg-[#FDF7F0] p-4 sm:p-6 shadow-md flex flex-col h-[660px] sm:h-[720px] relative overflow-hidden justify-between"
    >
      {/* Background Sacred Geometric Aura */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-radial from-[#CD9F5B]/15 via-transparent to-transparent pointer-events-none blur-2xl" />

      {/* ── 1. Modern Messenger Header ── */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#D6B48D]/30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Authentic 1909 Persona Card Avatar */}
          <div
            className="w-10 h-14 rounded-lg border-2 overflow-hidden shadow-xs bg-[#FCF0E6] relative shrink-0"
            style={{ borderColor: "#D6B48D" }}
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
              <span className="flex items-center gap-1 text-[10px] text-emerald-800 font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ออนไลน์
              </span>
            </div>
            <p className="font-serif-th text-xs text-[#8C735D] truncate mt-0.5">
              {persona.tagline || "เปิดใจคุยได้ทุกเรื่อง ไพ่พร้อมตอบเสมอ"}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#5A432F] border border-[#D6B48D] bg-[#E4C09F]/25 px-3 py-1 rounded-full font-serif-th shrink-0 font-bold">
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
          <div className="w-7 h-10 rounded border border-[#D6B48D] overflow-hidden shrink-0 mt-1 shadow-xs bg-[#FCF0E6]">
            <CardImage
              image={`${persona.cardImage || "major-02.jpg"}`}
              alt={persona.nameTh}
              className="w-full h-full object-cover object-top"
              sizes="32px"
            />
          </div>
          <div className="max-w-[88%] space-y-1">
            <div className="rounded-2xl rounded-tl-xs bg-[#FFFFFF] border border-[#D6B48D] p-3.5 sm:p-4 text-xs sm:text-sm text-[#5A432F] font-serif-th leading-relaxed shadow-xs">
              <p>
                สวัสดีค่ะ ยินดีที่ได้ร่วมเปิดไพ่ด้วยกันนะคะ ✨ มีจุดไหนในคำทำนายที่ยังสงสัย หรืออยากให้แม่หมอช่วยเจาะลึกแนวทางเพิ่มเติม พิมพ์ถามได้ตลอดเลยนะคะ
              </p>
            </div>
            <span className="text-[10px] text-[#8C735D] font-serif-th pl-1">แม่หมอพร้อมรับฟังเสมอ</span>
          </div>
        </div>

        {/* Suggested Quick Questions if user hasn't asked yet */}
        {messages.length === 0 && !chatLocked && (
          <div className="pl-9 space-y-2 pt-1">
            <span className="text-[11px] text-[#5A432F] font-serif-th font-semibold flex items-center gap-1">
              <span className="text-[#CD9F5B]">✦</span> หรือแตะเลือกคำถามยอดนิยม:
            </span>
            <div className="flex flex-col gap-1.5">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="text-left font-serif-th text-xs text-[#5A432F] hover:text-[#CD9F5B] p-2.5 rounded-xl bg-[#FCF0E6] hover:bg-[#FFFFFF] border border-[#D6B48D] hover:border-[#CD9F5B] transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                >
                  <span>"{q}"</span>
                  <span className="text-[#CD9F5B] text-xs opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">✦</span>
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
              initial={
                msg.sender === "user"
                  ? { opacity: 0, x: 28, scale: 0.94 }
                  : { opacity: 0, x: -16, y: 10, scale: 0.97 }
              }
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 26,
              }}
              className={`flex items-start gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Bot Avatar on Left */}
              {msg.sender === "bot" && (
                <motion.div
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 24 }}
                  className="w-7 h-10 rounded border border-[#D6B48D] overflow-hidden shrink-0 mt-1 shadow-xs bg-[#FCF0E6]"
                >
                  <CardImage
                    image={`${persona.cardImage || "major-02.jpg"}`}
                    alt={persona.nameTh}
                    className="w-full h-full object-cover object-top"
                    sizes="32px"
                  />
                </motion.div>
              )}

              <div className={`flex flex-col gap-1 ${msg.sender === "user" ? "items-end max-w-[85%]" : "items-start max-w-[88%]"}`}>
                {msg.sender === "user" ? (
                  <div className="rounded-2xl rounded-tr-xs bg-[#CD9F5B] text-[#FDF7F0] font-serif-th font-semibold px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs select-text">
                    {msg.text}
                  </div>
                ) : (
                  <div className="w-full space-y-2">
                    <ChatMessageRenderer text={msg.text} isError={msg.isError} />

                    {msg.isError && msg.text.includes("ไม่พบสำรับไพ่") && (
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#D6B48D] bg-[#FDF7F0] px-3 py-1.5 text-xs font-semibold text-[#5A432F] hover:border-[#CD9F5B] hover:bg-[#FFFFFF] cursor-pointer shadow-xs"
                      >
                        <span>↻</span> รีเฟรชหน้าเว็บเพื่อเชื่อมต่อสำรับไพ่อีกครั้ง
                      </button>
                    )}
                  </div>
                )}

                {/* Sub-bubble Actions (Timestamp & TTS) */}
                <div className="flex items-center gap-2 text-[10px] text-[#8C735D] font-serif-th px-1 pt-0.5">
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
                  <p className="font-serif-th text-[10px] leading-relaxed text-[#8C735D] px-1">
                    ✦ ตอนนี้แม่หมอตอบจากคลังคำตอบสำรอง ลองถามใหม่อีกครั้งในอีกสักครู่นะคะ
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Realistic Mystical Human-Like Typing Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 25 }}
            className="flex items-start gap-2.5"
            role="status"
            aria-live="polite"
            aria-label={`${persona.nameTh} กำลังพิมพ์ตอบ`}
          >
            <div className="w-7 h-10 rounded border border-[#D6B48D] overflow-hidden shrink-0 mt-1 shadow-xs bg-[#FCF0E6]">
              <CardImage
                image={`${persona.cardImage || "major-02.jpg"}`}
                alt={persona.nameTh}
                className="w-full h-full object-cover object-top"
                sizes="32px"
              />
            </div>
            <div className="rounded-2xl rounded-tl-xs border border-[#D6B48D] bg-[#FFFFFF] px-4 py-3 shadow-xs flex items-center gap-3">
              <span className="flex items-center gap-1.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block h-2 w-2 rounded-full bg-[#CD9F5B]"
                    animate={{
                      y: [0, -7, 0],
                      scale: [0.85, 1.3, 0.85],
                      opacity: [0.45, 1, 0.45],
                    }}
                    transition={{
                      duration: 0.95,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.16,
                    }}
                  />
                ))}
              </span>
              <span className="font-serif-th text-xs text-[#8C735D]">
                <span>{persona.nameTh} กำลังหยั่งรู้ไพ่และพิมพ์ตอบ...</span>
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── 3. Quick Follow-Up Chips & Messenger Input Dock ── */}
      <div className="shrink-0 pt-2 border-t border-[#D6B48D]/30 space-y-2">
        {messages.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-0.5 pb-0.5"
          >
            <span className="text-[11px] text-[#5A432F] font-serif-th font-semibold shrink-0 flex items-center gap-1">
              <span className="text-[#CD9F5B]">✦</span>
              <span>ถามต่อด่วน:</span>
            </span>
            {[
              { label: "สรุปเป็นข้อๆ", query: "ช่วยสรุปคำแนะนำให้ฉันหน่อยเป็นข้อๆ แบบเข้าใจง่าย" },
              { label: "สิ่งที่ต้องระวัง", query: "สิ่งที่ฉันต้องระวังเป็นพิเศษจากไพ่ชุดนี้คืออะไร?" },
              { label: "แนวทางก้าวแรก", query: "แนวทางเริ่มต้นก้าวแรกที่ควรทำทันทีคืออะไร?" },
            ].map((chip, idx) => (
              <motion.button
                key={idx}
                type="button"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage(chip.query)}
                className="text-[11px] text-[#5A432F] bg-[#FCF0E6] hover:bg-[#FFFFFF] hover:text-[#CD9F5B] border border-[#D6B48D] hover:border-[#CD9F5B] rounded-full px-3.5 py-1.5 transition-all cursor-pointer font-serif-th shadow-xs active:scale-95"
              >
                "{chip.label}"
              </motion.button>
            ))}
          </motion.div>
        )}

        {chatLocked ? (
          <div className="space-y-2 rounded-2xl border border-[#D6B48D] bg-[#FCF0E6] p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[#D6B48D] bg-[#FDF7F0] text-[#CD9F5B]">
                <SealedLockIcon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="font-serif-th text-xs font-bold text-[#5A432F]">
                  ถามต่อจากไพ่ชุดนี้ได้เมื่อเป็นสมาชิก
                </p>
                <p className="font-serif-th text-[11px] leading-relaxed text-[#8C735D]">
                  สมัครฟรีเพื่อคุยถามเจาะลึกต่อ เก็บบทสนทนาไว้กับดวงชุดนี้ได้ทุกเครื่อง
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => requestUpgrade("members_only")}
              className="w-full rounded-xl bg-[#CD9F5B] hover:bg-[#B8853E] px-4 py-2.5 font-serif-th text-xs font-bold text-[#FDF7F0] transition-all cursor-pointer shadow-sm"
            >
              ✦ สมัครสมาชิกฟรีเพื่อถามต่อ
            </button>
          </div>
        ) : freeChatLimitReached ? (
          <div className="space-y-2 rounded-2xl border border-[#CD9F5B] bg-[#FFFFFF] p-3.5 shadow-sm">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[#D6B48D] bg-[#FCF0E6] text-[#CD9F5B] text-xs font-bold">
                ✦
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="font-serif-th text-xs font-bold text-[#5A432F]">
                  ใช้สิทธิ์ถามคำถามต่อยอดฟรีครบ 2 ข้อแล้ว
                </p>
                <p className="font-serif-th text-[11px] leading-relaxed text-[#8C735D]">
                  ปลดล็อก <strong>ญาณพยากรณ์พิเศษ</strong> เพื่อคุยถามเจาะลึกกับแม่หมอได้ไม่จำกัดข้อ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => requestUpgrade("daily_exhausted")}
              className="w-full rounded-xl bg-[#CD9F5B] hover:bg-[#B8853E] px-4 py-2.5 font-serif-th text-xs font-bold text-[#FDF7F0] transition-all cursor-pointer shadow-sm"
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
            <div className="flex items-center gap-2 rounded-full border border-[#D6B48D] bg-[#FFFFFF] p-1.5 pl-4 focus-within:border-[#CD9F5B] focus-within:shadow-xs transition-all">
              <input
                type="text"
                placeholder={`พิมพ์ถาม ${persona.nameTh} ที่นี่...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                aria-label="พิมพ์คำถามถึงแม่หมอ"
                className="no-focus-ring min-w-0 flex-1 bg-transparent font-serif-th text-xs sm:text-sm text-[#5A432F] placeholder-[#8C735D]/60 border-none outline-none focus:outline-none focus:border-none focus:ring-0 !shadow-none"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                disabled={loading || !input.trim()}
                className="h-9 w-9 rounded-full bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] flex items-center justify-center font-bold shadow-xs disabled:opacity-40 disabled:scale-100 transition-all shrink-0 cursor-pointer"
                aria-label="ส่งข้อความ"
                title="ส่งคำถาม"
              >
                <span className="text-sm">✦</span>
              </motion.button>
            </div>

            {!isUnlimited && (
              <div className="flex justify-between items-center px-2 text-[10px] text-[#8C735D] font-serif-th">
                <span>สิทธิ์ถามฟรี: เหลืออีก {Math.max(0, 2 - userQuestionsCount)} ข้อ</span>
                <button
                  type="button"
                  onClick={() => requestUpgrade("daily_exhausted")}
                  className="text-[#CD9F5B] hover:underline cursor-pointer font-bold"
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


