import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  getReadings,
  deleteReading,
  clearAllReadings,
  updateReadingOutcome,
  type SavedReadingItem,
  type ReadingOutcome,
} from "@/lib/utils/history";
import { soundManager } from "@/lib/utils/audio";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n";

interface ReadingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReading?: (reading: SavedReadingItem) => void;
}

interface MonthlySummaryResult {
  title: string;
  totalReadings: number;
  accurateReadings: number;
  dominantElement: string;
  recurringCards: string[];
  synthesis: string;
  lifeLessons: string[];
  empowermentQuote: string;
}

const CATEGORY_MAP_TH: Record<string, string> = {
  general: "ทั่วไป",
  love: "ความรัก",
  career: "การงาน",
  work: "การงาน",
  money: "การเงิน",
  finance: "การเงิน",
  spiritual: "จิตวิญญาณ",
  decision: "การตัดสินใจ",
};

const CATEGORY_MAP_EN: Record<string, string> = {
  general: "General",
  love: "Love & Relationships",
  career: "Career & Ambition",
  work: "Career & Ambition",
  money: "Finance & Abundance",
  finance: "Finance & Abundance",
  spiritual: "Spiritual Path",
  decision: "Life Decisions",
};

export const ReadingHistoryModal: React.FC<ReadingHistoryModalProps> = ({ isOpen, onClose }) => {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const [readings, setReadings] = useState<SavedReadingItem[]>([]);
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<"ALL" | ReadingOutcome>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  // Monthly AI Summary state
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryResult | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReadings(getReadings());
      setMonthlySummary(null);
      setSummaryError(null);
      // Dual-mode server sync refresh
      import("@/lib/utils/history").then((m) => {
        m.fetchServerReadings().then((serverItems) => {
          if (serverItems && serverItems.length > 0) {
            setReadings(serverItems);
          }
        });
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteReading(id);
    setReadings(getReadings());
    soundManager.playCardSelectSound();
  };

  const handleClearAll = () => {
    const confirmMsg = isEn
      ? "Are you sure you want to clear your entire reading history?"
      : "คุณต้องการล้างประวัติการดูดวงทั้งหมดใช่หรือไม่?";
    if (window.confirm(confirmMsg)) {
      clearAllReadings();
      setReadings([]);
      soundManager.playCardSelectSound();
    }
  };

  const handleSetOutcome = (e: React.MouseEvent, id: string, outcome: ReadingOutcome) => {
    e.stopPropagation();
    soundManager.playCardSelectSound();
    updateReadingOutcome(id, outcome);
    if (outcome !== "PENDING") {
      trackEvent("reading_feedback", {
        reading_id: id,
        outcome,
      });
    }
    setReadings(getReadings());
  };

  const handleSaveNote = (e: React.MouseEvent, id: string, currentOutcome: ReadingOutcome = "PENDING") => {
    e.stopPropagation();
    soundManager.playCardSelectSound();
    updateReadingOutcome(id, currentOutcome, noteDraft);
    setReadings(getReadings());
    setEditingNoteId(null);
  };

  const handleGenerateMonthlySummary = async () => {
    if (readings.length === 0) return;
    setIsGeneratingSummary(true);
    setSummaryError(null);
    soundManager.playOracleRevealSound();

    try {
      const res = await fetch("/api/journal/monthly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEn ? "Unable to generate monthly reflection" : "ไม่สามารถสรุปบทเรียนดวงได้"));
      }

      setMonthlySummary(data);
    } catch (err: any) {
      setSummaryError(err.message || (isEn ? "An error occurred while generating monthly reflection" : "เกิดข้อผิดพลาดในการสรุปบทเรียนดวง"));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const filtered = readings.filter((r) => {
    const matchesSearch =
      r.question.toLowerCase().includes(search.toLowerCase()) ||
      r.spreadName.toLowerCase().includes(search.toLowerCase()) ||
      r.cards.some((c) => c.cardNameTh.toLowerCase().includes(search.toLowerCase()) || (c.cardNameEn && c.cardNameEn.toLowerCase().includes(search.toLowerCase()))) ||
      (r.userNote && r.userNote.toLowerCase().includes(search.toLowerCase()));

    const currentOutcome = r.outcome || "PENDING";
    const matchesOutcome = outcomeFilter === "ALL" || currentOutcome === outcomeFilter;

    return matchesSearch && matchesOutcome;
  });

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEn ? "Tarot Reading Journal" : "สมุดบันทึกดวงชะตา"}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#171512]/60 backdrop-blur-xs"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="w-full max-w-2xl max-h-[88vh] rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] p-5 sm:p-7 shadow-[0_20px_50px_rgba(42,38,31,0.18)] flex flex-col relative space-y-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D5CEC2]/40 pb-3">
            <div className="flex items-center gap-2.5">
              
              <div>
                <h3 className="font-serif-th text-sm sm:text-base font-bold text-[#29261F]">
                  {isEn ? "Reading History & Outcome Log" : "ประวัติการดูดวง & บันทึกผลลัพธ์จริง"}
                </h3>
                <p className="text-[13px] text-[#635B4E] font-serif-th">
                  {isEn
                    ? `Tarot readings and real-life manifestations (${readings.length} ${readings.length === 1 ? "entry" : "entries"})`
                    : `บันทึกคำทำนายและบันทึกผลลัพธ์ในชีวิต (${readings.length} รายการ)`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {readings.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[13px] text-[#A6392C] hover:text-[#A6392C] border border-[#D5CEC2] bg-[#FCEEEA] px-3 py-1 rounded-full transition-all cursor-pointer font-serif-th"
                >
                  {isEn ? "Clear All" : "ลบทั้งหมด"}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label={isEn ? "Close reading history" : "ปิดประวัติการดูดวง"}
                className="w-9 h-9 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] text-[#29261F] hover:bg-[#29261F] hover:text-[#F3F0EA] text-sm flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A58A5C]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* AI Monthly Synthesis Banner / Trigger */}
          {readings.length >= 1 && (
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-left">
                
                <div>
                  <h4 className="text-xs sm:text-sm font-serif-th font-bold text-[#29261F]">
                    {isEn ? "Monthly AI Synthesis & Insights" : "สรุปภาพรวมดวงประจำเดือนด้วย AI"}
                  </h4>
                  <p className="text-[13px] text-[#635B4E]">
                    {isEn
                      ? "Let AI synthesize recurring cards, themes, and key monthly lessons"
                      : "ให้ AI วิเคราะห์ไพ่ที่เปิดได้บ่อย พร้อมสรุปข้อคิดและบทเรียนสำคัญประจำเดือนของคุณ"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isGeneratingSummary}
                onClick={handleGenerateMonthlySummary}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] font-serif-th font-bold text-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 flex-shrink-0 shadow-xs"
              >
                {isGeneratingSummary ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-[#D5CEC2] border-t-transparent animate-spin" />
                    <span>{isEn ? "Analyzing..." : "กำลังวิเคราะห์..."}</span>
                  </>
                ) : (
                  <>
                    
                    <span>{isEn ? "Synthesize Month" : "สรุปบทเรียนดวง"}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Monthly AI Summary Display Card (If generated) */}
          {monthlySummary && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-[#FFFFFF] border-2 border-[#D5CEC2] space-y-2.5 relative shadow-xs"
            >
              <button
                type="button"
                onClick={() => setMonthlySummary(null)}
                className="absolute top-3 right-3 text-[#635B4E] hover:text-[#29261F] text-xs p-1 cursor-pointer"
                title={isEn ? "Close summary" : "ปิดสรุป"}
              >
                ✕
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#29261F] text-[#F3F0EA] font-bold font-mono text-[13px]">
                  {isEn ? `Dominant: ${monthlySummary.dominantElement}` : `ธาตุ${monthlySummary.dominantElement}เด่น`}
                </span>
                <h4 className="font-serif-th text-xs sm:text-sm font-bold text-[#29261F] truncate">
                  {monthlySummary.title}
                </h4>
              </div>

              <p className="text-xs text-[#29261F] font-serif-th leading-relaxed italic">
                “{monthlySummary.synthesis}”
              </p>

              {monthlySummary.lifeLessons && monthlySummary.lifeLessons.length > 0 && (
                <div className="pt-1 space-y-1">
                  <span className="text-[13px] text-[#A58A5C] font-bold block font-serif-th">
                    {isEn ? "Key Monthly Lessons:" : "บทเรียนสำคัญในรอบเดือน:"}
                  </span>
                  <ul className="space-y-1 text-[13px] text-[#29261F]">
                    {monthlySummary.lifeLessons.map((lesson, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#A58A5C]">✓</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {monthlySummary.empowermentQuote && (
                <div className="text-[13px] text-[#A58A5C] pt-1 border-t border-[#D5CEC2]/40 font-serif-th text-center font-bold">
                  {monthlySummary.empowermentQuote}
                </div>
              )}
            </motion.div>
          )}

          {summaryError && (
            <div className="p-3 rounded-xl bg-[#FCEEEA] border border-[#D5CEC2] text-[#A6392C] text-xs font-serif-th text-center">
              {summaryError}
            </div>
          )}

          {/* Outcome Filter Tabs & Search Bar */}
          {readings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none text-[13px] font-serif-th">
                <button
                  type="button"
                  onClick={() => setOutcomeFilter("ALL")}
                  className={`px-3.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "ALL"
                      ? "bg-[#29261F] text-[#F3F0EA] font-bold shadow-xs"
                      : "bg-[#EAE7E0] text-[#635B4E] hover:text-[#29261F] border border-[#D5CEC2]"
                  }`}
                >
                  {isEn ? `All (${readings.length})` : `ทั้งหมด (${readings.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeFilter("ACCURATE")}
                  className={`px-3.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "ACCURATE"
                      ? "bg-[#3A7044] text-white font-bold"
                      : "bg-[#EBF3ED] text-[#3A7044] border border-[#D5CEC2]"
                  }`}
                >
                  {isEn
                    ? `Manifested (${readings.filter((r) => r.outcome === "ACCURATE").length})`
                    : `เกิดขึ้นจริง (${readings.filter((r) => r.outcome === "ACCURATE").length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeFilter("PARTIAL")}
                  className={`px-3.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "PARTIAL"
                      ? "bg-[#A58A5C] text-white font-bold"
                      : "bg-[#EAE7E0] text-[#A58A5C] border border-[#D5CEC2]"
                  }`}
                >
                  {isEn
                    ? `Partially (${readings.filter((r) => r.outcome === "PARTIAL").length})`
                    : `จริงบางส่วน (${readings.filter((r) => r.outcome === "PARTIAL").length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeFilter("PENDING")}
                  className={`px-3.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "PENDING"
                      ? "bg-[#29261F] text-[#F3F0EA] font-bold"
                      : "bg-[#FFFFFF] text-[#635B4E] hover:text-[#29261F] border border-[#D5CEC2]"
                  }`}
                >
                  {isEn
                    ? `⏳ In Progress (${readings.filter((r) => !r.outcome || r.outcome === "PENDING").length})`
                    : `⏳ รอผล (${readings.filter((r) => !r.outcome || r.outcome === "PENDING").length})`}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder={isEn ? "Search questions, spreads, cards, or notes..." : "ค้นหาตามคำถาม, ผัง, ชื่อไพ่ หรือบันทึกโน้ต..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D5CEC2] rounded-xl px-3.5 py-2 text-xs text-[#29261F] placeholder:text-[#635B4E] focus:outline-none focus:border-[#A58A5C]"
                />
              </div>
            </div>
          )}

          {/* Reading List Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar min-h-[220px]">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 opacity-70">
                
                <p className="font-serif-th text-xs text-[#635B4E]">
                  {readings.length === 0
                    ? (isEn
                        ? "No readings recorded yet. Completed readings will appear here automatically."
                        : "ยังไม่มีประวัติการดูดวง เมื่อคุณดูดวงเสร็จจะถูกบันทึกไว้ที่นี่โดยอัตโนมัติ")
                    : (isEn ? "No reading logs found matching your search" : "ไม่พบบันทึกที่ตรงกับเงื่อนไขการค้นหา")}
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const isExpanded = expandedId === item.id;
                const isEditingNote = editingNoteId === item.id;
                const formattedDate = new Date(item.date).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const outcome = item.outcome || "PENDING";

                return (
                  <div
                    key={item.id}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] hover:border-[#A58A5C] transition-all cursor-pointer space-y-2.5 shadow-xs"
                  >
                    {/* Top Row: Spread & Date */}
                    <div className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-[#EAE7E0] text-[#29261F] border border-[#D5CEC2] px-2.5 py-0.5 rounded-full font-serif-th font-bold">
                          {isEn ? `Spread: ${item.spreadName}` : `ผัง: ${item.spreadName}`}
                        </span>
                        <span className="text-[#635B4E]">
                          {isEn ? `Topic: ${CATEGORY_MAP_EN[item.category] || item.category}` : `หมวด: ${CATEGORY_MAP_TH[item.category] || item.category}`}
                        </span>
                        <span className="text-[#A58A5C]">
                          {isEn ? `· Reader: ${item.personaName}` : `· แม่หมอ ${item.personaName}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[#635B4E] font-mono">{formattedDate}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item.id)}
                          className="text-[#A6392C] hover:text-[#A6392C] p-1 text-xs transition-colors cursor-pointer"
                          title={isEn ? "Delete entry" : "ลบบันทึกนี้"}
                          aria-label={isEn ? "Delete entry" : "ลบบันทึกนี้"}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Question */}
                    <p className="font-serif-th text-xs sm:text-sm font-bold text-[#29261F]">"{item.question}"</p>

                    {/* Miniature Cards Preview */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                      {item.cards.map((c, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] flex items-center gap-1.5 flex-shrink-0 text-[13px]"
                        >
                          
                          <span className="font-serif-th text-[#29261F] font-medium">
                            {(isEn && c.cardNameEn) ? c.cardNameEn : c.cardNameTh}
                          </span>
                          {c.isReversed && (
                            <span className="text-[12px] text-[#A6392C] font-mono font-bold">
                              {isEn ? "(Reversed)" : "(กลับหัว)"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Summary Quote */}
                    <p className="text-xs text-[#635B4E] font-serif-th leading-relaxed line-clamp-2">
                      “{item.summary}”
                    </p>

                    {/* Outcome Status Selector Tag Deck */}
                    <div
                      className="pt-2 border-t border-[#D5CEC2]/40 flex flex-wrap items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap text-[13px] font-serif-th">
                        <span className="text-[#635B4E]">{isEn ? "Outcome:" : "ผลจริงในชีวิต:"}</span>
                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "ACCURATE")}
                          className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                            outcome === "ACCURATE"
                              ? "bg-[#3A7044] text-white font-bold"
                              : "bg-[#EBF3ED] text-[#3A7044] border border-[#D5CEC2]"
                          }`}
                        >
                          {isEn ? "Manifested" : "เกิดขึ้นจริง"}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "PARTIAL")}
                          className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                            outcome === "PARTIAL"
                              ? "bg-[#A58A5C] text-white font-bold"
                              : "bg-[#EAE7E0] text-[#A58A5C] border border-[#D5CEC2]"
                          }`}
                        >
                          {isEn ? "Partially" : "จริงบางส่วน"}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "PENDING")}
                          className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                            outcome === "PENDING"
                              ? "bg-[#29261F] text-[#F3F0EA] font-bold"
                              : "bg-[#FFFFFF] text-[#635B4E] border border-[#D5CEC2]"
                          }`}
                        >
                          {isEn ? "⏳ In Progress" : "⏳ รอผล"}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "NOT_HAPPENED")}
                          className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                            outcome === "NOT_HAPPENED"
                              ? "bg-[#A6392C] text-white font-bold"
                              : "bg-[#FCEEEA] text-[#A6392C] border border-[#D5CEC2]"
                          }`}
                        >
                          {isEn ? "✕ Not Manifested" : "✕ ไม่เกิดขึ้น"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNoteId(isEditingNote ? null : item.id);
                          setNoteDraft(item.userNote || "");
                        }}
                        className="text-[13px] text-[#A58A5C] hover:text-[#29261F] flex items-center gap-1 font-serif-th cursor-pointer font-bold"
                      >
                        
                        <span>
                          {isEn
                            ? (item.userNote ? "Edit Note" : "+ Add Reflection")
                            : (item.userNote ? "แก้ไขโน้ต" : "+ จดบันทึกผล")}
                        </span>
                      </button>
                    </div>

                    {/* Private User Reflection Note Box */}
                    {item.userNote && !isEditingNote && (
                      <div className="p-2.5 rounded-xl bg-[#EAE7E0] border border-[#D5CEC2] text-[13px] text-[#29261F] font-serif-th italic">
                        <span className="font-semibold text-[#A58A5C]">
                          {isEn ? "Real-Life Manifestation:" : "บันทึกผลจริง:"}
                        </span>{" "}
                        {item.userNote}
                      </div>
                    )}

                    {/* Edit Note Input */}
                    {isEditingNote && (
                      <div
                        className="p-3 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] space-y-2 shadow-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <textarea
                          rows={2}
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder={
                            isEn
                              ? "Record real-world events and reflections that unfolded after this reading..."
                              : "จดบันทึกเหตุการณ์จริงที่เกิดขึ้นหลังจากเปิดไพ่ใบนี้..."
                          }
                          className="w-full bg-[#FFFFFF] border border-[#D5CEC2] rounded-lg p-2 text-xs text-[#29261F] placeholder:text-[#635B4E] focus:outline-none focus:border-[#A58A5C]"
                        />
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-1 rounded-full text-[#635B4E] hover:text-[#29261F] cursor-pointer font-serif-th"
                          >
                            {isEn ? "Cancel" : "ยกเลิก"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSaveNote(e, item.id, item.outcome)}
                            className="px-4 py-1 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] font-bold font-serif-th cursor-pointer shadow-xs"
                          >
                            {isEn ? "Save Reflection" : "บันทึกโน้ต"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expanded Advice & Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pt-2 border-t border-[#D5CEC2]/40 space-y-2 text-xs"
                      >
                        {item.advice && item.advice.length > 0 && (
                          <div>
                            <span className="text-[13px] text-[#A58A5C] font-bold block font-serif-th">
                              {isEn ? "Guidance & Action Steps:" : "คำแนะนำและสิ่งที่ควรทำ:"}
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-[#29261F] text-[13px] pt-1 font-serif-th">
                              {item.advice.map((adv, idx) => (
                                <li key={idx}>{adv}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.timing && (
                          <div className="text-[13px] text-[#635B4E] font-serif-th">
                            {isEn ? "⏳ Timing: " : "⏳ ช่วงเวลา: "}
                            <span className="text-[#29261F] font-bold">{item.timing}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
