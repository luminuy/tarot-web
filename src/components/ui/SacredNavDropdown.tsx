"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  TarotSpreadNavIcon,
  TarotDeckNavIcon,
  JournalScrollNavIcon,
} from "@/components/ui/TarotArtIcons";

interface SacredNavDropdownProps {
  onOpenHistory?: () => void;
  onReset?: () => void;
  canReset?: boolean;
}

export const SacredNavDropdown: React.FC<SacredNavDropdownProps> = ({
  onOpenHistory,
  onReset,
  canReset = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    {
      label: "ผังการเปิดไพ่ (20 แบบ)",
      sublabel: "เลือกดูผังความรัก การงาน การเงิน และอื่นๆ",
      href: "/spreads",
      Icon: TarotSpreadNavIcon,
      badge: "20 ผัง",
    },
    {
      label: "ความหมายไพ่ (78 ใบ)",
      sublabel: "เปิดดูคำแปลและความหมายไพ่ทั้งหมด",
      href: "/cards",
      Icon: TarotDeckNavIcon,
      badge: "78 ใบ",
    },
  ];

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Dropdown Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs font-serif-th font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 border shadow ${
          isOpen
            ? "bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] border-[#fff6d6]/60 shadow-[0_0_20px_rgba(229,192,123,0.45)] scale-[1.02]"
            : "bg-[#100b20]/90 text-[#f5deaa] hover:text-[#ffd700] border-[#e5c07b]/25 hover:border-[#ffd700]/60 hover:bg-[#181033] hover:shadow-[0_0_15px_rgba(229,192,123,0.2)]"
        }`}
        aria-expanded={isOpen}
        aria-label="เมนูหลัก"
      >
        <TarotDeckNavIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${isOpen ? "text-[#0a0715]" : "text-[#ffd700]"}`} />
        <span className="tracking-wide">เมนู</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={`text-[9px] ${isOpen ? "text-[#0a0715]" : "text-[#e5c07b]"}`}
        >
          ▼
        </motion.span>
      </button>

      {/* Luxury Obsidian Gold Floating Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2.5 w-64 sm:w-72 rounded-2xl bg-[#0c071c]/98 backdrop-blur-2xl border border-[#e5c07b]/35 shadow-[0_18px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(229,192,123,0.2)] p-2 z-50 overflow-hidden space-y-1"
          >
            {/* Header Title inside Dropdown */}
            <div className="px-3 py-1.5 border-b border-[#e5c07b]/15 flex items-center justify-between text-[11px] font-serif-th font-semibold text-[#a99fc2]">
              <span>✦ เมนูไพ่ทาโรต์</span>
              <span className="text-[#ffd700] text-[10px] font-mono">1909 RWS</span>
            </div>

            {/* Navigation Links */}
            {navItems.map((item) => {
              const Icon = item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#1e1438] transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#140e28] border border-[#e5c07b]/30 flex items-center justify-center text-[#e5c07b] group-hover:text-[#ffd700] group-hover:border-[#ffd700]/70 group-hover:shadow-[0_0_12px_rgba(229,192,123,0.3)] transition-all flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-serif-th font-bold text-[#f5deaa] group-hover:text-[#ffd700] transition-colors">
                        {item.label}
                      </span>
                      <span className="text-[9px] font-serif-th text-[#8f85aa] bg-white/5 px-1.5 py-0.2 rounded-full border border-white/5">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#9c93b8] group-hover:text-[#c5bed8] transition-colors line-clamp-1 mt-0.5 leading-snug">
                      {item.sublabel}
                    </p>
                  </div>
                </Link>
              );
            })}

            {/* Reading Journal / History Trigger */}
            {onOpenHistory && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenHistory();
                }}
                className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#1e1438] transition-colors group cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#140e28] border border-[#e5c07b]/30 flex items-center justify-center text-[#e5c07b] group-hover:text-[#ffd700] group-hover:border-[#ffd700]/70 group-hover:shadow-[0_0_12px_rgba(229,192,123,0.3)] transition-all flex-shrink-0 mt-0.5">
                  <JournalScrollNavIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif-th font-bold text-[#f5deaa] group-hover:text-[#ffd700] transition-colors">
                      ประวัติการดูดวง
                    </span>
                    <span className="text-[9px] font-serif-th text-[#8f85aa] bg-white/5 px-1.5 py-0.2 rounded-full border border-white/5">
                      บันทึก
                    </span>
                  </div>
                  <p className="text-[10.5px] text-[#9c93b8] group-hover:text-[#c5bed8] transition-colors line-clamp-1 mt-0.5 leading-snug">
                    ย้อนดูไพ่และคำทำนายที่คุณเคยเปิดไว้
                  </p>
                </div>
              </button>
            )}

            {/* Reset Sanctuary Session Option */}
            {canReset && onReset && (
              <>
                <div className="border-t border-[#e5c07b]/15 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onReset();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#200e18] hover:bg-[#301222] border border-[#f43f5e]/30 text-[#fca5a5] hover:text-[#fecdd3] text-xs font-serif-th font-bold transition-all cursor-pointer"
                >
                  <span>✦</span> เริ่มดูดวงใหม่
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
