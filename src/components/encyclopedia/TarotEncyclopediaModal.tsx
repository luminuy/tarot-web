"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DECK, type TarotCard } from "@/data/cards";
import { TarotCard as TarotCardComponent } from "@/components/card/TarotCard";
import { soundManager } from "@/lib/utils/audio";
import { useDialogBehavior } from "@/lib/use-dialog-behavior";

interface TarotEncyclopediaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SuitFilter = "all" | "major" | "wands" | "cups" | "swords" | "pentacles";

export const TarotEncyclopediaModal: React.FC<TarotEncyclopediaModalProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<SuitFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [activeMeaningCategory, setActiveMeaningCategory] = useState<"general" | "work" | "money" | "love" | "self">(
    "general"
  );
  const [viewOrientation, setViewOrientation] = useState<"upright" | "reversed">("upright");
  const listPanelRef = useRef<HTMLDivElement>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  /*
   * 🪟 หน้าต่างซ้อนสองชั้น — ต้องจัดลำดับ Esc ให้ถูก (UX-08)
   * ---------------------------------------------------------------------------
   * เดิมแผงรายการไพ่ไม่มีแม้แต่ `role="dialog"` ส่วนแผงรายละเอียดประกาศ
   * `aria-modal="true"` ไว้ทั้งที่ไม่ได้กักโฟกัสจริง ทั้งคู่ปิดด้วย Esc ไม่ได้เลย
   *
   * ⚠️ ทั้งสองชั้นฟัง keydown ที่ `window` เหมือนกัน ถ้าปล่อยให้ทำงานอิสระ
   * กด Esc ครั้งเดียวจะปิดทั้งสองชั้นพร้อมกัน ซึ่งไม่ใช่สิ่งที่ผู้ใช้คาดหวัง
   * (คาดว่ากดครั้งแรกปิดรายละเอียด กลับมาที่รายการ · กดอีกครั้งถึงปิดทั้งหมด)
   *
   * แก้ด้วยการให้ชั้นนอก "ไม่ทำอะไร" ถ้าชั้นในยังเปิดอยู่ — อ่านค่า `selectedCard`
   * สด ๆ ได้เพราะ hook เก็บ onClose ล่าสุดไว้ใน ref และอัปเดตทุกเรนเดอร์
   */
  useDialogBehavior(
    isOpen,
    () => {
      if (selectedCard) return; // ให้ชั้นในจัดการก่อน
      onClose();
    },
    listPanelRef
  );

  // ชั้นใน — ไม่ต้องล็อกสกรอลล์ซ้ำ ชั้นนอกล็อกไว้ให้แล้ว
  useDialogBehavior(Boolean(selectedCard), () => setSelectedCard(null), detailPanelRef, {
    lockScroll: false,
  });

  const handleSelectCard = (card: TarotCard) => {
    setSelectedCard(card);
    soundManager.playCardSelectSound();
  };

  const filteredCards = DECK.filter((c) => {
    // Suit match
    if (filter === "major" && c.arcana !== "major") return false;
    if (filter === "wands" && c.suit !== "wands") return false;
    if (filter === "cups" && c.suit !== "cups") return false;
    if (filter === "swords" && c.suit !== "swords") return false;
    if (filter === "pentacles" && c.suit !== "pentacles") return false;

    // Search match
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.nameTh.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.keywords.upright.some((k) => k.toLowerCase().includes(q)) ||
      c.keywords.reversed.some((k) => k.toLowerCase().includes(q))
    );
  });

  return (
    <AnimatePresence>
      {/* ⚠️ เงื่อนไข `isOpen` ต้องอยู่ **ข้างใน** `AnimatePresence` เท่านั้น (INC-0126 · กฎข้อ 9 ของด่าน test-motion-quality)
          ถ้าเขียน `if (!isOpen) return null` ไว้ข้างบน ตัว AnimatePresence จะหายไปพร้อมลูกในเฟรมเดียวกัน
          `exit` ที่เขียนไว้ข้างล่างจึงไม่มีวันทำงาน — หน้าต่างดับหายวับแทนที่จะค่อย ๆ จางไป */}
      {isOpen && (
      <motion.div
        key="encyclopedia-modal-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        aria-label="สารานุกรมความหมายไพ่ทาโรต์"
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
          ref={listPanelRef}
          className="w-full max-w-4xl max-h-[90svh] rounded-lg bg-surface border border-line-warm p-5 sm:p-7 shadow-overlay flex flex-col relative space-y-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line-warm/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-line-warm flex items-center justify-center text-xs text-gold-ink bg-inset-warm font-bold">·</div>
              <div>
                <h3 className="font-serif-th text-sm sm:text-base font-bold font-mystic-gold">
                  ความหมายไพ่ทาโรต์ 78 ใบ
                </h3>
                <p className="text-[13px] text-muted font-serif-th">
                  ดูคำแปลและความหมายของไพ่ทาโรต์ทั้ง 78 ใบ (ความรัก การงาน การเงิน)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดความหมายไพ่ทาโรต์"
              className="w-11 h-11 rounded-full bg-inset-warm border border-line-warm text-ink-deep hover:bg-gold-ink hover:text-surface text-sm flex items-center justify-center transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
            >
              ✕
            </button>
          </div>

          {/* Filter Bar & Search */}
          <div className="space-y-2">
            <div
              role="tablist"
              aria-label="ชุดไพ่ทาโรต์"
              className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
            >
              {[
                { id: "all", label: "ทั้งหมด (78)" },
                { id: "major", label: "ชุดหลัก Major (22)" },
                { id: "wands", label: "ไม้เท้า Wands" },
                { id: "cups", label: "ถ้วย Cups" },
                { id: "swords", label: "ดาบ Swords" },
                { id: "pentacles", label: "เหรียญ Pentacles" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  id={`encyclopedia-tab-${tab.id}`}
                  aria-controls="encyclopedia-panel"
                  aria-selected={filter === tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id as SuitFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-serif-th font-semibold whitespace-nowrap transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
                    filter === tab.id
                      ? "bg-gold-ink text-surface font-bold"
                      : "bg-surface text-muted hover:text-ink-deep border border-line-warm"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              aria-label="ค้นหาไพ่ตามชื่อหรือความหมาย"
              type="text"
              placeholder="ค้นหาตามชื่อไพ่ (เช่น The Fool, ราชินีถ้วย, ความรัก, การเงิน)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-line-warm rounded-lg px-3.5 py-2 text-xs text-ink-deep placeholder:text-muted focus:outline-none focus:border-gold-ink "
            />
          </div>

          {/* Content Area: Grid of Cards */}
          {/*
            🔗 ปลายทางของแท็บด้านบน (UX-11) — แผงนี้มีใบเดียวและเปลี่ยนเนื้อหาตามแท็บ
            จึงใช้ `id` คงที่ แล้วให้ `aria-labelledby` ชี้ไปที่แท็บที่ active อยู่ตอนนั้น
          */}
          <div
            role="tabpanel"
            id="encyclopedia-panel"
            aria-labelledby={`encyclopedia-tab-${filter}`}
            className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-[300px]"
          >
            {filteredCards.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filteredCards.map((c) => (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`ดูความหมาย ${c.nameTh} (${c.nameEn})`}
                    onClick={() => handleSelectCard(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectCard(c);
                      }
                    }}
                    className="p-2 rounded-lg bg-surface border border-line-warm hover:border-gold-ink transition cursor-pointer flex flex-col items-center text-center space-y-1.5 hover:scale-105 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
                  >
                    <div className="w-16 h-[108px] sm:w-18 sm:h-[122px] rounded-lg overflow-hidden flex-shrink-0 bg-inset-warm">
                      <TarotCardComponent
                        card={c}
                        isRevealed={true}
                        size="sm"
                        imageSizes="(min-width: 640px) 72px, 64px"
                        className="w-full h-full"
                      />
                    </div>
                    <span className="text-[13px] font-serif-th font-bold text-ink-deep truncate max-w-full block leading-tight">
                      {c.nameTh}
                    </span>
                    <span className="text-[12px] text-muted font-mono truncate max-w-full block">{c.nameEn}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="text-sm text-gold-ink font-serif-th">SeerTarot</div>
                <h4 className="font-serif-th text-sm font-bold text-ink-deep">
                  ไม่พบไพ่ที่ตรงกับ &ldquo;{search}&rdquo;
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-serif-th font-bold bg-gold-ink hover:bg-gold-ink-deep text-surface transition cursor-pointer "
                >
                  ล้างการค้นหา
                </button>
              </div>
            )}
          </div>

          {/* Selected Card Deep Wisdom Detail Modal Layer
              ⚠️ ต้องมี `AnimatePresence` ของตัวเองครอบไว้ (INC-0126) — ของเดิมเป็น `{selectedCard && ...}`
              เปล่า ๆ `exit` ของแผงข้างในจึงไม่เคยเล่น และฉากหลังชั้นที่สองก็ทาทึบทันทีในเฟรมเดียว */}
          <AnimatePresence>
          {selectedCard && (
            <motion.div
              key="card-detail-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-label={`ความหมายไพ่ ${selectedCard.nameTh}`}
              className="fixed inset-0 z-60 flex items-center justify-center p-3 modal-scrim"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                ref={detailPanelRef}
                className="w-full max-w-2xl max-h-[90svh] rounded-lg bg-surface border-2 border-line-warm p-5 sm:p-7 shadow-overlay flex flex-col relative space-y-4 overflow-y-auto text-ink-deep"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  aria-label="ปิดหน้ารายละเอียดไพ่"
                  className="absolute top-4 right-4 w-11 h-11 rounded-full bg-inset-warm border border-line-warm text-ink-deep hover:bg-gold-ink hover:text-surface text-sm flex items-center justify-center transition cursor-pointer z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
                >
                  ✕
                </button>

                {/* Card Title & Meta */}
                <div className="flex items-start gap-4 pb-3 border-b border-line-warm/30">
                  <div className="w-24 h-[163px] flex-shrink-0 bg-inset-warm rounded-lg overflow-hidden ">
                    <TarotCardComponent
                      card={selectedCard}
                      isRevealed={true}
                      isReversed={viewOrientation === "reversed"}
                      size="sm"
                      imageSizes="96px"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
                        {selectedCard.nameTh}
                      </h3>
                      <span className="text-xs text-muted font-mono">({selectedCard.nameEn})</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[13px] text-ink-deep">
                      <span className="px-2 py-0.5 rounded-full bg-surface border border-line-warm text-gold-ink font-semibold">
                        ธาตุ: {selectedCard.element}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface border border-line-warm">
                        โหราศาสตร์: {selectedCard.astrology}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface border border-line-warm">
                        ตัวเลข: {selectedCard.numerology}
                      </span>
                    </div>

                    {/* Orientation Switcher */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setViewOrientation("upright")}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                          viewOrientation === "upright"
                            ? "bg-[#EBF3ED] text-ok border border-line-warm"
                            : "bg-surface text-muted border border-line-warm"
                        }`}
                      >
                        หัวตั้ง (Upright)
                      </button>
                      <button
                        onClick={() => setViewOrientation("reversed")}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                          viewOrientation === "reversed"
                            ? "bg-err-wash text-err border border-line-warm"
                            : "bg-surface text-muted border border-line-warm"
                        }`}
                      >
                        ↷ กลับหัว (Reversed)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Keywords List */}
                <div className="p-3 rounded-lg bg-surface border border-line-warm space-y-1 ">
                  <span className="text-[13px] text-gold-ink font-bold block">คำสำคัญ (Keywords):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCard.keywords[viewOrientation].map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded bg-inset-warm border border-line-warm text-xs font-serif-th text-ink-deep font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 5-Category Deep Meanings */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { id: "general", label: "ภาพรวมทั่วไป" },
                      { id: "work", label: "การงาน" },
                      { id: "money", label: "การเงิน" },
                      { id: "love", label: "❤️ ความรัก" },
                      { id: "self", label: "จิตวิญญาณ" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveMeaningCategory(cat.id as typeof activeMeaningCategory)}
                        className={`px-3 py-1 rounded-lg text-xs font-serif-th font-semibold transition cursor-pointer whitespace-nowrap ${
                          activeMeaningCategory === cat.id
                            ? "bg-gold-ink text-surface font-bold"
                            : "bg-surface text-muted hover:text-ink-deep border border-line-warm"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg bg-surface border border-line-warm text-xs text-ink-deep font-serif-th leading-relaxed min-h-[90px]">
                    {selectedCard.meanings[activeMeaningCategory][viewOrientation]}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
