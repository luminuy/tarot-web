"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  readingId: string;
  spreadName: string;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  onClose,
  readingId,
  spreadName,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [outcome, setOutcome] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // บันทึกลง LocalStorage
    try {
      const existing = JSON.parse(localStorage.getItem("tarot_journal") || "[]");
      existing.unshift({
        id: readingId,
        date: new Date().toISOString(),
        spreadName,
        rating,
        outcome,
      });
      localStorage.setItem("tarot_journal", JSON.stringify(existing));
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-3xl bg-[#120e1f] border border-[#e0c088]/40 p-6 shadow-2xl space-y-4 text-center relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#9c93b8] hover:text-[#f0dcb4] cursor-pointer"
          >
            ✕
          </button>

          <div className="w-12 h-12 rounded-full border border-[#e0c088]/60 flex items-center justify-center mx-auto text-xl bg-[#1b1530]">
            📖
          </div>

          <h3 className="font-serif-th text-lg font-semibold text-[#f0dcb4]">
            บันทึกสมุดดวงชะตา (Tarot Journal)
          </h3>
          <p className="text-xs text-[#9c93b8]">
            บันทึกความรู้สึกและผลการทำนายไว้ เพื่อกลับมาดูว่าเรื่องราวคลี่คลายไปอย่างไร
          </p>

          {/* Star Rating */}
          <div className="space-y-1">
            <span className="text-xs text-[#e0c088] font-medium block">
              ความรู้สึกตรงกับสถานการณ์ของคุณ:
            </span>
            <div className="flex justify-center gap-2 text-2xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`cursor-pointer transition-transform hover:scale-125 ${
                    star <= rating ? "text-[#e0c088]" : "text-[#9c93b8]/30"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="text-left space-y-1">
            <label className="text-xs text-[#f0dcb4] block">
              บันทึกสิ่งที่เกิดขึ้น หรือความรู้สึกหลังเปิดไพ่:
            </label>
            <textarea
              rows={3}
              placeholder="จดบันทึกเรื่องราวหรือสิ่งที่คุณตั้งใจจะทำหลังจากนี้..."
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full bg-[#1b1530] border border-[#e0c088]/30 rounded-xl p-3 text-xs text-[#f0dcb4] placeholder-[#9c93b8]/50 focus:outline-none focus:border-[#e0c088]"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saved}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c9a25e] to-[#e0c088] text-[#0a0812] text-xs font-semibold font-serif-th shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            {saved ? "✓ บันทึกสำเร็จแล้ว" : "บันทึกลงสมุดดวง"}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
