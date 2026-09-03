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

export const ReadingHistoryModal: React.FC<ReadingHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
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
    if (window.confirm("คุณต้องการล้างประวัติการดูดวงทั้งหมดใช่หรือไม่?")) {
      clearAllReadings();
      setReadings([]);
      soundManager.playCardSelectSound();
    }
  };

  const handleSetOutcome = (e: React.MouseEvent, id: string, outcome: ReadingOutcome) => {
    e.stopPropagation();
    soundManager.playCardSelectSound();
    updateReadingOutcome(id, outcome);
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
        throw new Error(data.error || "ไม่สามารถสรุปบทเรียนดวงได้");
      }

      setMonthlySummary(data);
    } catch (err: any) {
      setSummaryError(err.message || "เกิดข้อผิดพลาดในการสรุปบทเรียนดวง");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const filtered = readings.filter((r) => {
    const matchesSearch =
      r.question.toLowerCase().includes(search.toLowerCase()) ||
      r.spreadName.toLowerCase().includes(search.toLowerCase()) ||
      r.cards.some((c) => c.cardNameTh.toLowerCase().includes(search.toLowerCase())) ||
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
        aria-label="สมุดบันทึกดวงชะตา"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#5A432F]/40 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="w-full max-w-2xl max-h-[88vh] rounded-[1.618rem] bg-[#FDF7F0] border border-[#D6B48D] p-5 sm:p-7 shadow-2xl flex flex-col relative space-y-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D6B48D]/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-[#D6B48D] flex items-center justify-center text-xs text-[#CD9F5B] bg-[#FCF0E6] shadow-xs font-bold">
                ✦
              </div>
              <div>
                <h3 className="font-serif-th text-sm sm:text-base font-bold font-mystic-gold">
                  สมุดบันทึกดวงชะตา & ติดตามผลจริง
                </h3>
                <p className="text-[10px] text-[#8C735D] font-serif-th">
                  บันทึกคำทำนายและบันทึกผลลัพธ์ในชีวิต ({readings.length} รายการ)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {readings.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[10px] text-rose-700 hover:text-rose-900 border border-rose-200 bg-rose-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-serif-th shadow-xs"
                >
                  ลบทั้งหมด
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="ปิดสมุดบันทึกดวงชะตา"
                className="w-11 h-11 rounded-2xl bg-[#FCF0E6] border border-[#D6B48D] text-[#5A432F] hover:bg-[#CD9F5B] hover:text-[#FDF7F0] text-sm flex items-center justify-center transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* AI Monthly Synthesis Banner / Trigger */}
          {readings.length >= 1 && (
            <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#D6B48D] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-left">
                <span className="text-sm text-[#CD9F5B]">✨</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-serif-th font-bold text-[#5A432F]">
                    กระจกสะท้อนดวงรอบเดือน (AI Monthly Destiny Retrospective)
                  </h4>
                  <p className="text-[10px] text-[#8C735D]">
                    ให้ AI วิเคราะห์ Pattern ไพ่ที่ออกบ่อยและสรุปบทเรียนชีวิตจากบันทึกของคุณ
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isGeneratingSummary}
                onClick={handleGenerateMonthlySummary}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] font-serif-th font-bold text-xs shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                {isGeneratingSummary ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-[#FDF7F0] border-t-transparent animate-spin" />
                    <span>กำลังวิเคราะห์...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>สรุปบทเรียนดวง</span>
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
              className="p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#CD9F5B] space-y-2.5 shadow-md relative"
            >
              <button
                type="button"
                onClick={() => setMonthlySummary(null)}
                className="absolute top-3 right-3 text-[#8C735D] hover:text-[#5A432F] text-xs p-1 cursor-pointer"
                title="ปิดสรุป"
              >
                ✕
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#CD9F5B] text-[#FDF7F0] font-bold font-mono text-[10px] shadow-xs">
                  ธาตุ{monthlySummary.dominantElement}เด่น
                </span>
                <h4 className="font-serif-th text-xs sm:text-sm font-bold font-mystic-gold truncate">
                  ✦ {monthlySummary.title}
                </h4>
              </div>

              <p className="text-xs text-[#5A432F] font-serif-th leading-relaxed italic">
                “{monthlySummary.synthesis}”
              </p>

              {monthlySummary.lifeLessons && monthlySummary.lifeLessons.length > 0 && (
                <div className="pt-1 space-y-1">
                  <span className="text-[10px] text-[#CD9F5B] font-bold block font-serif-th">
                    ✦ บทเรียนสำคัญในรอบเดือน:
                  </span>
                  <ul className="space-y-1 text-[11px] text-[#5A432F]">
                    {monthlySummary.lifeLessons.map((lesson, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#CD9F5B]">✓</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {monthlySummary.empowermentQuote && (
                <div className="text-[10px] text-[#CD9F5B] pt-1 border-t border-[#D6B48D]/30 font-serif-th text-center font-bold">
                  ✨ {monthlySummary.empowermentQuote}
                </div>
              )}
            </motion.div>
          )}

          {summaryError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-serif-th text-center shadow-xs">
              {summaryError}
            </div>
          )}

          {/* Outcome Filter Tabs & Search Bar */}
          {readings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none text-[11px] font-serif-th">
                <button
                  type="button"
                  onClick={() => setOutcomeFilter("ALL")}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "ALL"
                      ? "bg-[#CD9F5B] text-[#FDF7F0] font-bold shadow-xs"
                      : "bg-[#FFFFFF] text-[#8C735D] hover:text-[#5A432F] border border-[#D6B48D]"
                  }`}
                >
                  ทั้งหมด ({readings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeFilter("ACCURATE")}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "ACCURATE"
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300"
                  }`}
                >
                  ✨ เกิดขึ้นจริง ({readings.filter((r) => r.outcome === "ACCURATE").length})
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeFilter("PARTIAL")}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "PARTIAL"
                      ? "bg-amber-600 text-white font-bold shadow-xs"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300"
                  }`}
                >
                  ✦ จริงบางส่วน ({readings.filter((r) => r.outcome === "PARTIAL").length})
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeFilter("PENDING")}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    outcomeFilter === "PENDING"
                      ? "bg-[#E4C09F] text-[#5A432F] font-bold shadow-xs"
                      : "bg-[#FDF7F0] text-[#8C735D] hover:text-[#5A432F] border border-[#D6B48D]"
                  }`}
                >
                  ⏳ รอผล ({readings.filter((r) => !r.outcome || r.outcome === "PENDING").length})
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 ค้นหาตามคำถาม, ผัง, ชื่อไพ่ หรือบันทึกโน้ต..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D6B48D] rounded-xl px-3.5 py-2 text-xs text-[#5A432F] placeholder:text-[#8C735D]/60 focus:outline-none focus:border-[#CD9F5B] shadow-xs"
                />
              </div>
            </div>
          )}

          {/* Reading List Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar min-h-[220px]">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 opacity-70">
                <span className="text-3xl">🔮</span>
                <p className="font-serif-th text-xs text-[#8C735D]">
                  {readings.length === 0
                    ? "ยังไม่มีประวัติการดูดวง เมื่อคุณดูดวงเสร็จจะถูกบันทึกไว้ที่นี่โดยอัตโนมัติ"
                    : "ไม่พบบันทึกที่ตรงกับเงื่อนไขการค้นหา"}
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const isExpanded = expandedId === item.id;
                const isEditingNote = editingNoteId === item.id;
                const formattedDate = new Date(item.date).toLocaleDateString("th-TH", {
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
                    className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#D6B48D] hover:border-[#CD9F5B] transition-all cursor-pointer space-y-2.5 shadow-xs"
                  >
                    {/* Top Row: Spread & Date */}
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-[#FCF0E6] text-[#CD9F5B] border border-[#D6B48D] px-2 py-0.5 rounded-full font-serif-th font-bold">
                          ผัง: {item.spreadName}
                        </span>
                        <span className="text-[#8C735D]">หมวด: {CATEGORY_MAP_TH[item.category] || item.category}</span>
                        <span className="text-[#CD9F5B]">· แม่หมอ {item.personaName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[#8C735D] font-mono">{formattedDate}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item.id)}
                          className="text-rose-600 hover:text-rose-800 p-1 text-xs transition-colors cursor-pointer"
                          title="ลบบันทึกนี้"
                          aria-label="ลบบันทึกนี้"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Question */}
                    <p className="font-serif-th text-xs sm:text-sm font-bold text-[#5A432F]">
                      "{item.question}"
                    </p>

                    {/* Miniature Cards Preview */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                      {item.cards.map((c, i) => (
                        <div
                          key={i}
                          className="px-2 py-1 rounded-lg bg-[#FCF0E6] border border-[#D6B48D] flex items-center gap-1.5 flex-shrink-0 text-[10px]"
                        >
                          <span>{c.element === "ไฟ" ? "🔥" : c.element === "น้ำ" ? "🌊" : c.element === "ลม" ? "🌪️" : "🌿"}</span>
                          <span className="font-serif-th text-[#5A432F] font-medium">
                            {c.cardNameTh}
                          </span>
                          {c.isReversed && (
                            <span className="text-[8px] text-rose-600 font-mono font-bold">(กลับหัว)</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Summary Quote */}
                    <p className="text-xs text-[#8C735D] font-serif-th leading-relaxed line-clamp-2">
                      “{item.summary}”
                    </p>

                    {/* Outcome Status Selector Tag Deck */}
                    <div
                      className="pt-2 border-t border-[#D6B48D]/30 flex flex-wrap items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-serif-th">
                        <span className="text-[#8C735D]">ผลจริงในชีวิต:</span>
                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "ACCURATE")}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            outcome === "ACCURATE"
                              ? "bg-emerald-600 text-white font-bold shadow-xs"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                          }`}
                        >
                          ✨ เกิดขึ้นจริง
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "PARTIAL")}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            outcome === "PARTIAL"
                              ? "bg-amber-600 text-white font-bold shadow-xs"
                              : "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                          }`}
                        >
                          ✦ จริงบางส่วน
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "PENDING")}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            outcome === "PENDING"
                              ? "bg-[#E4C09F] text-[#5A432F] font-bold shadow-xs"
                              : "bg-[#FDF7F0] text-[#8C735D] border border-[#D6B48D] hover:bg-[#FFFFFF]"
                          }`}
                        >
                          ⏳ รอผล
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleSetOutcome(e, item.id, "NOT_HAPPENED")}
                          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            outcome === "NOT_HAPPENED"
                              ? "bg-rose-600 text-white font-bold shadow-xs"
                              : "bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100"
                          }`}
                        >
                          ✕ ไม่เกิดขึ้น
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNoteId(isEditingNote ? null : item.id);
                          setNoteDraft(item.userNote || "");
                        }}
                        className="text-[10px] text-[#CD9F5B] hover:text-[#5A432F] flex items-center gap-1 font-serif-th cursor-pointer font-bold"
                      >
                        <span>📝</span>
                        <span>{item.userNote ? "แก้ไขโน้ต" : "+ จดบันทึกผล"}</span>
                      </button>
                    </div>

                    {/* Private User Reflection Note Box */}
                    {item.userNote && !isEditingNote && (
                      <div className="p-2.5 rounded-xl bg-[#FCF0E6] border border-[#D6B48D] text-[11px] text-[#5A432F] font-serif-th italic">
                        💬 <span className="font-semibold text-[#CD9F5B]">บันทึกผลจริง:</span> {item.userNote}
                      </div>
                    )}

                    {/* Edit Note Input */}
                    {isEditingNote && (
                      <div
                        className="p-3 rounded-xl bg-[#FDF7F0] border border-[#D6B48D] space-y-2 shadow-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <textarea
                          rows={2}
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="จดบันทึกเหตุการณ์จริงที่เกิดขึ้นหลังจากเปิดไพ่ใบนี้..."
                          className="w-full bg-[#FFFFFF] border border-[#D6B48D] rounded-lg p-2 text-xs text-[#5A432F] placeholder:text-[#8C735D]/60 focus:outline-none focus:border-[#CD9F5B]"
                        />
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-2.5 py-1 rounded-md text-[#8C735D] hover:text-[#5A432F] cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSaveNote(e, item.id, item.outcome)}
                            className="px-3 py-1 rounded-md bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] font-bold font-serif-th cursor-pointer shadow-xs"
                          >
                            บันทึกโน้ต
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expanded Advice & Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pt-2 border-t border-[#D6B48D]/30 space-y-2 text-xs"
                      >
                        {item.advice && item.advice.length > 0 && (
                          <div>
                            <span className="text-[10px] text-[#CD9F5B] font-bold block font-serif-th">
                              ✦ คำแนะนำและสิ่งที่ควรทำ:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-[#5A432F] text-[11px] pt-1">
                              {item.advice.map((adv, idx) => (
                                <li key={idx}>{adv}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.timing && (
                          <div className="text-[10px] text-[#8C735D]">
                            ⏳ ช่วงเวลา: <span className="text-[#5A432F] font-bold">{item.timing}</span>
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
