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
import { CoinSealIcon } from "@/components/entitlement/EntitlementIcons";
import { soundManager } from "@/lib/utils/audio";

const EASE = {
  enter: [0.16, 1, 0.3, 1] as [number, number, number, number],
  exit: [0.4, 0, 1, 1] as [number, number, number, number],
};

interface SacredNavDropdownProps {
  onOpenHistory?: () => void;
  onOpenPlans?: () => void;
  onReset?: () => void;
  canReset?: boolean;
}

export const SacredNavDropdown: React.FC<SacredNavDropdownProps> = ({
  onOpenHistory,
  onOpenPlans,
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
      label: "คัมภีร์บทความ (20 เรื่อง)",
      sublabel: "ความรู้ไพ่ทาโรต์ ความรัก การงาน และผังยอดนิยม",
      href: "/blog",
      Icon: JournalScrollNavIcon,
      badge: "20 บทความ",
    },
    ...(onOpenPlans
      ? [
          {
            label: "แพ็กเกจญาณพยากรณ์พิเศษ",
            sublabel: "เปรียบเทียบสิทธิ์ ปลดล็อกผังใหญ่ 12 ภพ และเติมรอบ",
            onClick: onOpenPlans,
            Icon: CoinSealIcon,
            badge: "✦ สิทธิ์/แพลน",
          },
        ]
      : []),
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
        duration: 0.15,
        ease: EASE.enter,
      },
    },
    exit: {
      opacity: 0,
      y: -6,
      transition: {
        duration: 0.1,
        ease: EASE.exit,
      },
    },
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Refined Luxury Warm Minimalist Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`min-h-[38px] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs font-serif-th font-bold transition-colors duration-150 cursor-pointer flex items-center gap-2 border shadow-xs select-none ${
          isOpen
            ? "bg-[#E4C09F]/35 border-[#CD9F5B] text-[#5A432F] shadow-[0_0_15px_rgba(205,159,91,0.25)]"
            : "bg-[#FDF7F0] text-[#5A432F] hover:text-[#CD9F5B] border-[#D6B48D] hover:border-[#CD9F5B] hover:bg-[#FCF0E6] hover:shadow-xs"
        }`}
        aria-expanded={isOpen}
        aria-label="เมนูหลักวิหารพยากรณ์"
      >
        <TarotDeckNavIcon className={`w-4 h-4 flex-shrink-0 transition-colors ${isOpen ? "text-[#CD9F5B]" : "text-[#8C735D]"}`} />
        <span className="tracking-wide">เมนู</span>
        <motion.svg
          viewBox="0 0 20 20"
          fill="currentColor"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "50% 48%" }}
          className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isOpen ? "text-[#CD9F5B]" : "text-[#8C735D]"}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </motion.svg>
      </button>

      {/* World-Class Warm Milk Cream Floating Sanctuary Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sacred-nav-panel"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
            }}
            className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-[1.618rem] bg-[#FDF7F0] border border-[#D6B48D] shadow-[0_15px_40px_rgba(90,67,47,0.12)] p-2.5 sm:p-3 z-50 overflow-hidden space-y-1.5"
          >
            {/* Ambient Top Foil Glow */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#CD9F5B]/35 to-transparent -mt-0.5 mb-1.5" />

            {/* Header Title inside Dropdown */}
            <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-serif-th font-semibold text-[#8C735D] border-b border-[#D6B48D]/25 pb-2">
              <span className="flex items-center gap-1.5 text-[#CD9F5B]">
                <span>✦</span>
                <span className="font-bold">วิหารพยากรณ์</span>
              </span>
              <span className="text-[#5A432F] text-[10px] font-mono tracking-wider bg-[#E4C09F]/25 border border-[#D6B48D] px-2 py-0.5 rounded-full font-bold">
                1909 RWS
              </span>
            </div>

            {/* Navigation Portals */}
            <div className="space-y-1 pt-0.5">
              {navItems.map((item, idx) => {
                const Icon = item.Icon;
                const isAction = "onClick" in item && typeof item.onClick === "function";

                const content = (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-[#FCF0E6] border border-[#D6B48D] flex items-center justify-center text-[#CD9F5B] group-hover:text-[#5A432F] group-hover:border-[#CD9F5B] group-hover:shadow-xs transition-all flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 transition-transform duration-150 group-hover:scale-105" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif-th font-bold text-[#5A432F] group-hover:text-[#CD9F5B] transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[9px] font-serif-th text-[#5A432F] bg-[#E4C09F]/20 px-2 py-0.5 rounded-full border border-[#D6B48D]">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[10px] font-serif-th text-[#8C735D] truncate mt-0.5">
                        {item.sublabel}
                      </p>
                    </div>
                  </>
                );

                return (
                  <div key={"href" in item && item.href ? item.href : `action-${idx}`}>
                    {isAction ? (
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.playMenuTapSound();
                          setIsOpen(false);
                          item.onClick();
                        }}
                        className="w-full flex items-start gap-3 p-2.5 rounded-2xl hover:bg-[#E4C09F]/25 border border-transparent hover:border-[#D6B48D]/60 transition-all duration-150 group cursor-pointer text-left"
                      >
                        {content}
                      </button>
                    ) : (
                      <Link
                        href={"href" in item ? (item.href as string) : "#"}
                        onClick={() => {
                          soundManager.playMenuTapSound();
                          setIsOpen(false);
                        }}
                        className="w-full flex items-start gap-3 p-2.5 rounded-2xl hover:bg-[#E4C09F]/25 border border-transparent hover:border-[#D6B48D]/60 transition-all duration-150 group cursor-pointer"
                      >
                        {content}
                      </Link>
                    )}
                  </div>
                );
              })}

              {/* Reading Journal / History Trigger */}
              {onOpenHistory && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playMenuTapSound();
                      setIsOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full flex items-start gap-3 p-2.5 rounded-2xl hover:bg-[#E4C09F]/25 border border-transparent hover:border-[#D6B48D]/60 transition-all duration-150 group cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#FCF0E6] border border-[#D6B48D] flex items-center justify-center text-[#CD9F5B] group-hover:text-[#5A432F] group-hover:border-[#CD9F5B] transition-all flex-shrink-0 mt-0.5">
                      <JournalScrollNavIcon className="w-4 h-4 transition-transform duration-150 group-hover:scale-105" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif-th font-bold text-[#5A432F] group-hover:text-[#CD9F5B] transition-colors">
                          ประวัติการดูดวง
                        </span>
                        <span className="text-[9px] font-serif-th text-[#5A432F] bg-[#E4C09F]/20 px-2 py-0.5 rounded-full border border-[#D6B48D]">
                          บันทึก
                        </span>
                      </div>
                      <p className="text-[10px] font-serif-th text-[#8C735D] truncate mt-0.5">
                        ย้อนดูไพ่และคำทำนายที่คุณเคยเปิดไว้
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Reset Sanctuary Session Option */}
            {canReset && onReset && (
              <div className="pt-1 border-t border-[#D6B48D]/25">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCardSelectSound();
                    setIsOpen(false);
                    onReset();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-serif-th font-bold transition-all cursor-pointer active:scale-95"
                >
                  <span className="text-rose-600">✦</span>
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
