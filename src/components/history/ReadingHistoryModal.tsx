"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getReadings, deleteReading, clearAllReadings, type SavedReadingItem } from "@/lib/utils/history";
import { soundManager } from "@/lib/utils/audio";

interface ReadingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReading?: (reading: SavedReadingItem) => void;
}

export const ReadingHistoryModal: React.FC<ReadingHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectReading,
}) => {
  const [readings, setReadings] = useState<SavedReadingItem[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReadings(getReadings());
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

  const filtered = readings.filter(
    (r) =>
      r.question.toLowerCase().includes(search.toLowerCase()) ||
      r.spreadName.toLowerCase().includes(search.toLowerCase()) ||
      r.cards.some((c) => c.cardNameTh.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-[#0e081e]/98 border border-[#e5c07b]/40 p-5 sm:p-7 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col relative space-y-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-[#e5c07b] flex items-center justify-center text-sm bg-[#0a0812]">
                📜
              </div>
              <div>
                <h3 className="font-serif-th text-sm sm:text-base font-bold font-mystic-gold">
                  ประวัติการดูดวงของคุณ
                </h3>
                <p className="text-[10px] text-[#9c93b8] font-serif-th">
                  บันทึกประวัติการทำนายในเครื่องของคุณ ({readings.length} รายการ)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {readings.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[10px] text-rose-400 hover:text-rose-300 border border-rose-500/30 bg-rose-950/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-serif-th"
                >
                  ลบทั้งหมด
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#1b1230] border border-[#e5c07b]/30 text-[#e5c07b] hover:bg-[#e5c07b] hover:text-[#05040a] text-sm flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Search Box */}
          {readings.length > 0 && (
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 ค้นหาตามคำถาม, ชื่อผัง, หรือชื่อไพ่..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#140b24] border border-[#e5c07b]/30 rounded-xl px-3.5 py-2 text-xs text-[#f5deaa] placeholder:text-[#9c93b8]/60 focus:outline-none focus:border-[#e5c07b]"
              />
            </div>
          )}

          {/* Reading List Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar min-h-[220px]">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 opacity-60">
                <span className="text-3xl">🔮</span>
                <p className="font-serif-th text-xs text-[#cfc8e2]">
                  {readings.length === 0
                    ? "ยังไม่มีประวัติการดูดวง เมื่อคุณดูดวงเสร็จจะถูกบันทึกไว้ที่นี่โดยอัตโนมัติ"
                    : "ไม่พบบันทึกที่ตรงกับคำค้นหา"}
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const isExpanded = expandedId === item.id;
                const formattedDate = new Date(item.date).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={item.id}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-4 rounded-2xl bg-gradient-to-b from-[#180f30] to-[#0d071a] border border-[#e5c07b]/25 hover:border-[#e5c07b]/60 transition-all cursor-pointer space-y-2.5 shadow-lg"
                  >
                    {/* Top Row: Spread & Date */}
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-[#e5c07b]/15 text-[#f5deaa] border border-[#e5c07b]/30 px-2 py-0.5 rounded-full font-serif-th font-semibold">
                          ผัง: {item.spreadName}
                        </span>
                        <span className="text-[#9c93b8]">หมวด{item.category}</span>
                        <span className="text-[#e5c07b]/80">· แม่หมอ {item.personaName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[#9c93b8] font-mono">{formattedDate}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, item.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 text-xs"
                          title="ลบบันทึกนี้"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Question */}
                    <p className="font-serif-th text-xs sm:text-sm font-bold text-[#f5deaa]">
                      "{item.question}"
                    </p>

                    {/* Miniature Cards Preview */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                      {item.cards.map((c, i) => (
                        <div
                          key={i}
                          className="px-2 py-1 rounded-lg bg-[#090514] border border-[#e5c07b]/30 flex items-center gap-1.5 flex-shrink-0 text-[10px]"
                        >
                          <span>{c.element === "ไฟ" ? "🔥" : c.element === "น้ำ" ? "🌊" : c.element === "ลม" ? "🌪️" : "🌿"}</span>
                          <span className="font-serif-th text-[#f5deaa] font-medium">
                            {c.cardNameTh}
                          </span>
                          {c.isReversed && (
                            <span className="text-[8px] text-rose-300 font-mono">(กลับหัว)</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Summary Quote */}
                    <p className="text-xs text-[#cfc8e2] font-serif-th leading-relaxed line-clamp-2">
                      “{item.summary}”
                    </p>

                    {/* Expanded Advice & Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pt-2 border-t border-[#e5c07b]/15 space-y-2 text-xs"
                      >
                        {item.advice && item.advice.length > 0 && (
                          <div>
                            <span className="text-[10px] text-[#e5c07b] font-semibold block font-serif-th">
                              ✦ คำแนะนำและสิ่งที่ควรทำ:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-[#cfc8e2] text-[11px] pt-1">
                              {item.advice.map((adv, idx) => (
                                <li key={idx}>{adv}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.timing && (
                          <div className="text-[10px] text-[#9c93b8]">
                            ⏳ ช่วงเวลา: <span className="text-[#f5deaa]">{item.timing}</span>
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
