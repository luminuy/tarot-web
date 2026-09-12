import React, { useState, useEffect, useRef } from "react";
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
import { useDialogBehavior } from "@/lib/use-dialog-behavior";

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
  const panelRef = useRef<HTMLDivElement>(null);

  /*
   * 🪟 เดิมประกาศ `aria-modal="true"` ไว้ทั้งที่ไม่ได้กักโฟกัสจริง (UX-08)
   * ปิดด้วย Esc ไม่ได้ · หน้าหลังฉากยังเลื่อนได้ · ปิดแล้วโฟกัสไม่กลับที่เดิม
   */
  useDialogBehavior(isOpen, onClose, panelRef);
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

  // ⚠️ ต้องมีตัวนับรุ่น — `fetchServerReadings()` ที่ยิงไปตอนเปิดโมดัลใช้เวลาเดินทาง
  // ถ้าระหว่างนั้นผู้ใช้กด "ลบทั้งหมด" หรือลบทีละรายการ คำตอบเก่าที่กลับมาทีหลัง
  // จะ setReadings ทับ **และ** เขียนรายการที่เพิ่งลบกลับลง localStorage
  // (fetchServerReadings เขียน STORAGE_KEY เอง) ผู้ใช้จึงเห็นประวัติที่ลบไปแล้วโผล่กลับมา
  const mutationRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setReadings(getReadings());
      setMonthlySummary(null);
      setSummaryError(null);
      // Dual-mode server sync refresh
      const generation = mutationRef.current;
      import("@/lib/utils/history").then((m) => {
        m.fetchServerReadings().then((serverItems) => {
          if (generation !== mutationRef.current) return; // ผู้ใช้แก้ไขรายการไปแล้ว — ทิ้งคำตอบนี้
          if (serverItems && serverItems.length > 0) {
            setReadings(serverItems);
          }
        });
      });
    }
  }, [isOpen]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    mutationRef.current += 1;
    deleteReading(id);
    setReadings(getReadings());
    soundManager.playCardSelectSound();
  };

  const handleClearAll = () => {
    const confirmMsg = isEn
      ? "Are you sure you want to clear your entire reading history?"
      : "คุณต้องการล้างประวัติการดูดวงทั้งหมดใช่หรือไม่?";
    if (window.confirm(confirmMsg)) {
      mutationRef.current += 1;
      clearAllReadings();
      setReadings([]);
      soundManager.playCardSelectSound();
    }
  };

  const handleSetOutcome = (e: React.MouseEvent, id: string, outcome: ReadingOutcome) => {
    e.stopPropagation();
    soundManager.playCardSelectSound();
    mutationRef.current += 1;
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
      {/* ⚠️ เงื่อนไข `isOpen` ต้องอยู่ **ข้างใน** `AnimatePresence` เท่านั้น (INC-0126 · กฎข้อ 9 ของด่าน test-motion-quality)
          ถ้าเขียน `if (!isOpen) return null` ไว้ข้างบน ตัว AnimatePresence จะหายไปพร้อมลูกในเฟรมเดียวกัน
          `exit` ที่เขียนไว้ข้างล่างจึงไม่มีวันทำงาน — หน้าต่างดับหายวับแทนที่จะค่อย ๆ จางไป */}
      {isOpen && (
      <motion.div
        key="history-modal-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        aria-label={isEn ? "Tarot Reading Journal" : "สมุดบันทึกดวงชะตา"}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-scrim"
      >
        <motion.div
          /*
           * ⚠️ **ห้ามใส่ `scale` ให้แผงโมดัลใบใหญ่** (INC-0128 · กฎเดียวกับที่ `ui/Modal.tsx` เขียนเตือนไว้)
           * การย่อ/ขยายบังคับให้เบราว์เซอร์ raster ตัวอักษรทั้งใบใหม่ทุกเฟรม
           * บนมือถือ (CPU ช้ากว่าเดสก์ท็อปหลายเท่า) เห็นเป็นอาการ "กระพริบ/กระตุก" ตอนเปิด
           * เลื่อนขึ้น + จาง ให้ผลทางสายตาใกล้เคียงกันแต่เบากว่ามาก
           */
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          ref={panelRef}
          className="w-full max-w-2xl max-h-[88svh] rounded-xl bg-surface border border-line p-5 sm:p-7 shadow-[0_20px_50px_rgba(42,38,31,0.18)] flex flex-col relative space-y-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line/40 pb-3">
            <div className="flex items-center gap-2.5">
              
              <div>
                <h3 className="font-serif-th text-sm sm:text-base font-bold text-ink">
                  {isEn ? "Reading History & Outcome Log" : "ประวัติการดูดวง & บันทึกผลลัพธ์จริง"}
                </h3>
                <p className="text-[13px] text-muted font-serif-th">
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
                  className="text-[13px] text-err hover:text-err border border-line bg-err-wash px-3 py-1 rounded-full transition cursor-pointer font-serif-th"
                >
                  {isEn ? "Clear All" : "ลบทั้งหมด"}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label={isEn ? "Close reading history" : "ปิดประวัติการดูดวง"}
                className="w-9 h-9 rounded-full bg-inset border border-line text-ink hover:bg-ink hover:text-canvas text-sm flex items-center justify-center transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* AI Monthly Synthesis Banner / Trigger */}
          {readings.length >= 1 && (
            <div className="p-4 rounded-xl bg-surface border border-line flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-left">
                
                <div>
                  <h4 className="text-xs sm:text-sm font-serif-th font-bold text-ink">
                    {isEn ? "Monthly AI Synthesis & Insights" : "สรุปภาพรวมดวงประจำเดือนด้วย AI"}
                  </h4>
                  <p className="text-[13px] text-muted">
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
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-ink hover:bg-gold text-canvas font-serif-th font-bold text-xs hover:opacity-95 active:scale-95 transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 flex-shrink-0 shadow-xs"
              >
                {isGeneratingSummary ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-line border-t-transparent animate-spin" />
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
              className="p-4 rounded-xl bg-surface border-2 border-line space-y-2.5 relative shadow-xs"
            >
              <button
                type="button"
                onClick={() => setMonthlySummary(null)}
                className="absolute top-3 right-3 text-muted hover:text-ink text-xs p-1 cursor-pointer"
                title={isEn ? "Close summary" : "ปิดสรุป"}
              >
                ✕
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-ink text-canvas font-bold font-mono text-[13px]">
                  {isEn ? `Dominant: ${monthlySummary.dominantElement}` : `ธาตุ${monthlySummary.dominantElement}เด่น`}
                </span>
                <h4 className="font-serif-th text-xs sm:text-sm font-bold text-ink truncate">
                  {monthlySummary.title}
                </h4>
              </div>

              <p className="text-xs text-ink font-serif-th leading-relaxed italic">
                “{monthlySummary.synthesis}”
              </p>

              {monthlySummary.lifeLessons && monthlySummary.lifeLessons.length > 0 && (
                <div className="pt-1 space-y-1">
                  <span className="text-[13px] text-gold-ink font-bold block font-serif-th">
                    {isEn ? "Key Monthly Lessons:" : "บทเรียนสำคัญในรอบเดือน:"}
                  </span>
                  <ul className="space-y-1 text-[13px] text-ink">
                    {monthlySummary.lifeLessons.map((lesson, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-gold">✓</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {monthlySummary.empowermentQuote && (
                <div className="text-[13px] text-gold-ink pt-1 border-t border-line/40 font-serif-th text-center font-bold">
                  {monthlySummary.empowermentQuote}
                </div>
              )}
            </motion.div>
          )}

          {summaryError && (
            <div className="p-3 rounded-xl bg-err-wash border border-line text-err text-xs font-serif-th text-center">
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
                  className={`px-3.5 py-1 rounded-full transition cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "ALL"
                      ? "bg-ink text-canvas font-bold shadow-xs"
                      : "bg-inset text-muted hover:text-ink border border-line"
                  }`}
                >
                  {isEn ? `All (${readings.length})` : `ทั้งหมด (${readings.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeFilter("ACCURATE")}
                  className={`px-3.5 py-1 rounded-full transition cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "ACCURATE"
                      ? "bg-ok text-white font-bold"
                      : "bg-[#EBF3ED] text-ok border border-line"
                  }`}
                >
                  {isEn
                    ? `Manifested (${readings.filter((r) => r.outcome === "ACCURATE").length})`
                    : `เกิดขึ้นจริง (${readings.filter((r) => r.outcome === "ACCURATE").length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeFilter("PARTIAL")}
                  className={`px-3.5 py-1 rounded-full transition cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "PARTIAL"
                      ? "bg-gold text-white font-bold"
                      : "bg-inset text-gold border border-line"
                  }`}
                >
                  {isEn
                    ? `Partially (${readings.filter((r) => r.outcome === "PARTIAL").length})`
                    : `จริงบางส่วน (${readings.filter((r) => r.outcome === "PARTIAL").length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeFilter("PENDING")}
                  className={`px-3.5 py-1 rounded-full transition cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "PENDING"
                      ? "bg-ink text-canvas font-bold"
                      : "bg-surface text-muted hover:text-ink border border-line"
                  }`}
                >
                  {isEn
                    ? `⏳ In Progress (${readings.filter((r) => !r.outcome || r.outcome === "PENDING").length})`
                    : `⏳ รอผล (${readings.filter((r) => !r.outcome || r.outcome === "PENDING").length})`}
                </button>
              </div>

              <div className="relative">
                <input
              aria-label={isEn ? "Search your reading journal" : "ค้นหาในสมุดบันทึกดวงชะตา"}
                  type="text"
                  placeholder={isEn ? "Search questions, spreads, cards, or notes..." : "ค้นหาตามคำถาม, ผัง, ชื่อไพ่ หรือบันทึกโน้ต..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface border border-line rounded-xl px-3.5 py-2 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          )}

          {/* Reading List Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar min-h-[220px]">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 opacity-70">
                
                <p className="font-serif-th text-xs text-muted">
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
                    className="p-4 rounded-xl bg-surface border border-line hover:border-gold transition cursor-pointer space-y-2.5 shadow-xs"
                  >
                    {/* Top Row: Spread & Date */}
                    <div className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-inset text-ink border border-line px-2.5 py-0.5 rounded-full font-serif-th font-bold">
                          {isEn ? `Spread: ${item.spreadName}` : `ผัง: ${item.spreadName}`}
                        </span>
                        <span className="text-muted">
                          {isEn ? `Topic: ${CATEGORY_MAP_EN[item.category] || item.category}` : `หมวด: ${CATEGORY_MAP_TH[item.category] || item.category}`}
                        </span>
                        <span className="text-gold">
                          {isEn ? `· Reader: ${item.personaName}` : `· แม่หมอ ${item.personaName}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted font-mono">{formattedDate}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item.id)}
                          className="text-err hover:text-err p-1 text-xs transition-colors cursor-pointer"
                          title={isEn ? "Delete entry" : "ลบบันทึกนี้"}
                          aria-label={isEn ? "Delete entry" : "ลบบันทึกนี้"}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Question */}
                    <p className="font-serif-th text-xs sm:text-sm font-bold text-ink">"{item.question}"</p>

                    {/* Miniature Cards Preview */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                      {item.cards.map((c, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1 rounded-full bg-inset border border-line flex items-center gap-1.5 flex-shrink-0 text-[13px]"
                        >
                          
                          <span className="font-serif-th text-ink font-medium">
                            {(isEn && c.cardNameEn) ? c.cardNameEn : c.cardNameTh}
                          </span>
                          {c.isReversed && (
                            <span className="text-[12px] text-err font-mono font-bold">
                              {isEn ? "(Reversed)" : "(กลับหัว)"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Summary Quote */}
                    <p className="text-xs text-muted font-serif-th leading-relaxed line-clamp-2">
                      “{item.summary}”
                    </p>

                    {/* Outcome Status Selector Tag Deck */}
                    <div
                      className="pt-2 border-t border-line/40 flex flex-wrap items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap text-[13px] font-serif-th">
                        <span className="text-muted">{isEn ? "Outcome:" : "ผลจริงในชีวิต:"}</span>
                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "ACCURATE")}
                          className={`px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                            outcome === "ACCURATE"
                              ? "bg-ok text-white font-bold"
                              : "bg-[#EBF3ED] text-ok border border-line"
                          }`}
                        >
                          {isEn ? "Manifested" : "เกิดขึ้นจริง"}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "PARTIAL")}
                          className={`px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                            outcome === "PARTIAL"
                              ? "bg-gold text-white font-bold"
                              : "bg-inset text-gold border border-line"
                          }`}
                        >
                          {isEn ? "Partially" : "จริงบางส่วน"}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "PENDING")}
                          className={`px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                            outcome === "PENDING"
                              ? "bg-ink text-canvas font-bold"
                              : "bg-surface text-muted border border-line"
                          }`}
                        >
                          {isEn ? "⏳ In Progress" : "⏳ รอผล"}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "NOT_HAPPENED")}
                          className={`px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                            outcome === "NOT_HAPPENED"
                              ? "bg-err text-white font-bold"
                              : "bg-err-wash text-err border border-line"
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
                        className="text-[13px] text-gold-ink hover:text-ink flex items-center gap-1 font-serif-th cursor-pointer font-bold"
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
                      <div className="p-2.5 rounded-xl bg-inset border border-line text-[13px] text-ink font-serif-th italic">
                        <span className="font-semibold text-gold">
                          {isEn ? "Real-Life Manifestation:" : "บันทึกผลจริง:"}
                        </span>{" "}
                        {item.userNote}
                      </div>
                    )}

                    {/* Edit Note Input */}
                    {isEditingNote && (
                      <div
                        className="p-3 rounded-xl bg-surface border border-line space-y-2 shadow-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <textarea
                        aria-label={isEn ? "Your note for this reading" : "บันทึกของคุณสำหรับคำทำนายนี้"}
                          rows={2}
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder={
                            isEn
                              ? "Record real-world events and reflections that unfolded after this reading..."
                              : "จดบันทึกเหตุการณ์จริงที่เกิดขึ้นหลังจากเปิดไพ่ใบนี้..."
                          }
                          className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-gold"
                        />
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-1 rounded-full text-muted hover:text-ink cursor-pointer font-serif-th"
                          >
                            {isEn ? "Cancel" : "ยกเลิก"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSaveNote(e, item.id, item.outcome)}
                            className="px-4 py-1 rounded-full bg-ink hover:bg-gold text-canvas font-bold font-serif-th cursor-pointer shadow-xs"
                          >
                            {isEn ? "Save Reflection" : "บันทึกโน้ต"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expanded Advice & Details */}
                    {isExpanded && (
                      <div className="anim-swap-rise-sm pt-2 border-t border-line/40 space-y-2 text-xs">
                        {item.advice && item.advice.length > 0 && (
                          <div>
                            <span className="text-[13px] text-gold-ink font-bold block font-serif-th">
                              {isEn ? "Guidance & Action Steps:" : "คำแนะนำและสิ่งที่ควรทำ:"}
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-ink text-[13px] pt-1 font-serif-th">
                              {item.advice.map((adv, idx) => (
                                <li key={idx}>{adv}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.timing && (
                          <div className="text-[13px] text-muted font-serif-th">
                            {isEn ? "⏳ Timing: " : "⏳ ช่วงเวลา: "}
                            <span className="text-ink font-bold">{item.timing}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
