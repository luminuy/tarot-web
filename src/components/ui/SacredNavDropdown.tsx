"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "motion/react";
import {
  TarotSpreadNavIcon,
  TarotDeckNavIcon,
  JournalScrollNavIcon,
  MarketplaceReaderNavIcon,
} from "@/components/ui/TarotArtIcons";
import { soundManager } from "@/lib/utils/audio";

const EASE = {
  enter: [0.16, 1, 0.3, 1] as [number, number, number, number],
  exit: [0.4, 0, 1, 1] as [number, number, number, number],
};

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

  // Close when receiving close event from another open menu
  useEffect(() => {
    const handleClose = (e: Event) => {
      const customEvent = e as CustomEvent<{ except?: string }>;
      if (customEvent.detail?.except !== "sacred-nav") {
        setIsOpen(false);
      }
    };
    window.addEventListener("tarot:close-menus", handleClose);
    return () => window.removeEventListener("tarot:close-menus", handleClose);
  }, []);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    soundManager.playMenuTapSound();
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        window.dispatchEvent(
          new CustomEvent("tarot:close-menus", { detail: { except: "sacred-nav" } })
        );
      }
      return next;
    });
  };

  const navItems = [
    {
      label: "ผังการเปิดไพ่ (20 แบบ)",
      sublabel: "ความรัก การงาน การเงิน และดวงชะตา",
      href: "/spreads",
      Icon: TarotSpreadNavIcon,
      badge: "20 ผัง",
    },
    {
      label: "ความหมายไพ่ (78 ใบ)",
      sublabel: "เปิดดูคำแปลและสัญลักษณ์ 1909 RWS",
      href: "/cards",
      Icon: TarotDeckNavIcon,
      badge: "78 ใบ",
    },
    {
      label: "ปรึกษาแม่หมอตัวจริง",
      sublabel: "จองคิววิเคราะห์ดวงเชิงลึกกับนักพยากรณ์",
      href: "/readers",
      Icon: MarketplaceReaderNavIcon,
      badge: "Marketplace",
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: -8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.16,
        ease: EASE.enter,
        staggerChildren: 0.025,
        delayChildren: 0.01,
      },
    },
    exit: {
      opacity: 0,
      y: -6,
      transition: {
        duration: 0.09,
        ease: EASE.exit,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: -4 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.14, ease: EASE.enter },
    },
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Refined Luxury Obsidian-Gold Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`min-h-[38px] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs font-serif-th font-bold transition-colors duration-150 cursor-pointer flex items-center gap-2 border shadow-sm select-none ${
          isOpen
            ? "bg-[#201138] border-[#ffd700] text-[#ffd700] shadow-[0_0_18px_rgba(229,192,123,0.32),inset_0_1px_1px_rgba(255,215,0,0.3)]"
            : "bg-[#100b20]/90 text-[#f5deaa] hover:text-[#ffd700] border-[#e5c07b]/25 hover:border-[#ffd700]/60 hover:bg-[#181033] hover:shadow-[0_0_15px_rgba(229,192,123,0.2)]"
        }`}
        aria-expanded={isOpen}
        aria-label="เมนูหลักวิหารพยากรณ์"
      >
        <TarotDeckNavIcon className={`w-4 h-4 flex-shrink-0 transition-colors ${isOpen ? "text-[#ffd700]" : "text-[#e5c07b]"}`} />
        <span className="tracking-wide">เมนู</span>
        <motion.svg
          viewBox="0 0 20 20"
          fill="currentColor"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "50% 48%" }}
          className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isOpen ? "text-[#ffd700]" : "text-[#c59b27]"}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </motion.svg>
      </button>

      {/* World-Class Obsidian Gold Floating Sanctuary Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sacred-nav-panel"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ willChange: "transform, opacity" }}
            className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-3xl bg-[#0c071a] border border-[#e5c07b]/40 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.15)] p-2.5 sm:p-3 z-50 overflow-hidden space-y-1.5"
          >
            {/* Ambient Top Foil Glow */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#ffd700]/40 to-transparent -mt-0.5 mb-1.5" />

            {/* Header Title inside Dropdown */}
            <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-serif-th font-semibold text-[#a99fc2] border-b border-[#e5c07b]/15 pb-2">
              <span className="flex items-center gap-1.5 text-[#e5c07b]">
                <span>✦</span>
                <span>วิหารพยากรณ์</span>
              </span>
              <span className="text-[#ffd700] text-[10px] font-mono tracking-wider bg-[#ffd700]/10 border border-[#ffd700]/25 px-2 py-0.5 rounded-full">
                1909 RWS
              </span>
            </div>

            {/* Navigation Portals */}
            <div className="space-y-1 pt-0.5">
              {navItems.map((item) => {
                const Icon = item.Icon;
                return (
                  <motion.div key={item.href} variants={itemVariants}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        soundManager.playMenuTapSound();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-2xl hover:bg-gradient-to-r hover:from-[#201238] hover:to-[#140b26] border border-transparent hover:border-[#ffd700]/30 hover:shadow-[0_0_15px_rgba(229,192,123,0.12)] transition-all duration-150 group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1c1033] to-[#120a22] border border-[#e5c07b]/30 flex items-center justify-center text-[#e5c07b] group-hover:text-[#ffd700] group-hover:border-[#ffd700]/80 group-hover:shadow-[0_0_14px_rgba(229,192,123,0.35)] transition-all flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 transition-transform duration-150 group-hover:scale-105" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-serif-th font-bold text-[#f5deaa] group-hover:text-[#ffd700] transition-colors">
                            {item.label}
                          </span>
                          <span className="text-[9px] font-serif-th text-[#d4af37] bg-[#ffd700]/10 px-2 py-0.5 rounded-full border border-[#ffd700]/25">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9c93b8] group-hover:text-[#c5bed8] transition-colors line-clamp-1 mt-0.5 leading-snug">
                          {item.sublabel}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Reading Journal / History Trigger */}
              {onOpenHistory && (
                <motion.div variants={itemVariants}>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playMenuTapSound();
                      setIsOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full flex items-start gap-3 p-2.5 rounded-2xl hover:bg-gradient-to-r hover:from-[#201238] hover:to-[#140b26] border border-transparent hover:border-[#ffd700]/30 hover:shadow-[0_0_15px_rgba(229,192,123,0.12)] transition-all duration-150 group cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1c1033] to-[#120a22] border border-[#e5c07b]/30 flex items-center justify-center text-[#e5c07b] group-hover:text-[#ffd700] group-hover:border-[#ffd700]/80 group-hover:shadow-[0_0_14px_rgba(229,192,123,0.35)] transition-all flex-shrink-0 mt-0.5">
                      <JournalScrollNavIcon className="w-4 h-4 transition-transform duration-150 group-hover:scale-105" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif-th font-bold text-[#f5deaa] group-hover:text-[#ffd700] transition-colors">
                          ประวัติการดูดวง
                        </span>
                        <span className="text-[9px] font-serif-th text-[#d4af37] bg-[#ffd700]/10 px-2 py-0.5 rounded-full border border-[#ffd700]/25">
                          บันทึก
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9c93b8] group-hover:text-[#c5bed8] transition-colors line-clamp-1 mt-0.5 leading-snug">
                        ย้อนดูไพ่และคำทำนายที่คุณเคยเปิดไว้
                      </p>
                    </div>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Reset Sanctuary Session Option */}
            {canReset && onReset && (
              <div className="pt-1 border-t border-[#e5c07b]/15">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCardSelectSound();
                    setIsOpen(false);
                    onReset();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-[#240e1b] hover:bg-[#341226] border border-[#f43f5e]/35 text-[#fca5a5] hover:text-[#fecdd3] text-xs font-serif-th font-bold shadow-[0_0_12px_rgba(244,63,94,0.15)] transition-all cursor-pointer active:scale-95"
                >
                  <span className="text-rose-400">✦</span>
                  <span>เริ่มดูดวงใหม่</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
