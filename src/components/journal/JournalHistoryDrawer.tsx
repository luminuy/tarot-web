"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface JournalEntryItem {
  id: string;
  date: string;
  spreadName: string;
  rating: number;
  outcome: string;
}

interface JournalHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JournalHistoryDrawer: React.FC<JournalHistoryDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [entries, setEntries] = useState<JournalEntryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const data = JSON.parse(localStorage.getItem("tarot_journal") || "[]");
        setEntries(data);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md h-full bg-[#120e1f] border-l border-[#e0c088]/30 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e0c088]/20 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <h3 className="font-serif-th text-base font-semibold text-[#f0dcb4]">
                  ประวัติสมุดดวงชะตา
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-[#9c93b8] hover:text-[#f0dcb4] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List */}
            {entries.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#9c93b8] space-y-2">
                <span className="text-3xl block">🔮</span>
                <p>ยังไม่มีบันทึกดวงชะตา</p>
                <p className="text-[10px]">เมื่อเปิดไพ่เสร็จ สามารถกดบันทึกลงสมุดดวงได้ทันที</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#1b1530]/80 border border-[#e0c088]/20 space-y-2 text-left shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif-th text-xs font-semibold text-[#f0dcb4]">
                        {item.spreadName}
                      </span>
                      <span className="text-[10px] text-[#e0c088]">
                        {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                      </span>
                    </div>
                    {item.outcome && (
                      <p className="text-xs text-[#cfc8e2] leading-relaxed">
                        "{item.outcome}"
                      </p>
                    )}
                    <span className="text-[9px] text-[#9c93b8] block pt-1 border-t border-[#e0c088]/10">
                      {new Date(item.date).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#e0c088]/20">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#1b1530] text-xs text-[#cfc8e2] hover:text-[#f0dcb4] border border-[#e0c088]/30 cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
