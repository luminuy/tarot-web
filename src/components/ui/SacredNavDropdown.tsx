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
        window.dispatchEvent(new CustomEvent("tarot:close-menus", { detail: { except: "sacred-nav" } }));
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
      label: "บทความดูดวง & ความรู้ไพ่ (24 เรื่อง)",
      sublabel: "ความรู้ไพ่ทาโรต์ ความรัก การงาน และผังยอดนิยม",
      href: "/blog",
      Icon: JournalScrollNavIcon,
      badge: "24 บทความ",
    },
    ...(onOpenPlans
      ? [
          {
            label: "แพ็กเกจเติมรอบ & สิทธิ์ใช้งาน",
            sublabel: "เปรียบเทียบสิทธิ์ ปลดล็อกผังใหญ่ 12 ภพ และเติมรอบดูดวง",
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
      badge: "นักพยากรณ์",
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
      {/* Refined Luxury Warm Minimalist Trigger Button — Hamburger Icon (Image 2) */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-150 cursor-pointer select-none shadow-xs active:scale-95 ${
          isOpen
            ? "bg-[#EAE7E0] border-[#D5CEC2] text-[#29261F]"
            : "bg-[#FFFFFF] text-[#29261F] hover:text-[#A58A5C] border-[#D5CEC2] hover:border-[#A58A5C]"
        }`}
        aria-expanded={isOpen}
        aria-label="เมนูหลัก"
        title="เมนูหลัก"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 sm:w-5 sm:h-5 transition-colors"
          aria-hidden="true"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
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
            className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] shadow-[0_10px_30px_rgba(42,38,31,0.12)] p-2.5 sm:p-3 z-50 overflow-x-hidden overflow-y-auto overscroll-contain max-h-[calc(100dvh-4.5rem)] space-y-1.5"
          >
            {/* Ambient Top Foil Glow */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#A58A5C]/35 to-transparent -mt-0.5 mb-1.5" />

            {/* Header Title inside Dropdown */}
            <div className="px-3 py-1.5 flex items-center justify-between text-[13px] font-serif-th font-semibold text-[#635B4E] border-b border-[#D5CEC2]/40 pb-2">
              <span className="flex items-center gap-1.5 text-[#A58A5C]">
                <span>✦</span>
                <span className="font-bold">วิหารพยากรณ์</span>
              </span>
              <span className="text-[#29261F] text-[13px] font-mono tracking-wider bg-[#EAE7E0] border border-[#D5CEC2] px-2 py-0.5 rounded-full font-bold">
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
                    <div className="w-9 h-9 rounded-lg bg-[#EAE7E0] border border-[#D5CEC2] flex items-center justify-center text-[#A58A5C] group-hover:text-[#29261F] group-hover:border-[#A58A5C] transition-all flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 transition-transform duration-150 group-hover:scale-105" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif-th font-bold text-[#29261F] group-hover:text-[#A58A5C] transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[12px] font-serif-th text-[#29261F] bg-[#EAE7E0] px-2 py-0.5 rounded-full border border-[#D5CEC2]">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[13px] font-serif-th text-[#635B4E] truncate mt-0.5">{item.sublabel}</p>
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
                        className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#EAE7E0]/60 border border-transparent hover:border-[#D5CEC2]/60 transition-all duration-150 group cursor-pointer text-left"
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
                        className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#EAE7E0]/60 border border-transparent hover:border-[#D5CEC2]/60 transition-all duration-150 group cursor-pointer"
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
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#EAE7E0]/60 border border-transparent hover:border-[#D5CEC2]/60 transition-all duration-150 group cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#EAE7E0] border border-[#D5CEC2] flex items-center justify-center text-[#A58A5C] group-hover:text-[#29261F] group-hover:border-[#A58A5C] transition-all flex-shrink-0 mt-0.5">
                      <JournalScrollNavIcon className="w-4 h-4 transition-transform duration-150 group-hover:scale-105" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif-th font-bold text-[#29261F] group-hover:text-[#A58A5C] transition-colors">
                          ประวัติการดูดวง
                        </span>
                        <span className="text-[12px] font-serif-th text-[#29261F] bg-[#EAE7E0] px-2 py-0.5 rounded-full border border-[#D5CEC2]">
                          บันทึก
                        </span>
                      </div>
                      <p className="text-[13px] font-serif-th text-[#635B4E] truncate mt-0.5">
                        ย้อนดูไพ่และคำทำนายที่คุณเคยเปิดไว้
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Reset Sanctuary Session Option */}
            {canReset && onReset && (
              <div className="pt-1 border-t border-[#D5CEC2]/40">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCardSelectSound();
                    setIsOpen(false);
                    onReset();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-[#FCEEEA] hover:bg-[#FCEEEA] border border-[#D5CEC2] text-[#A6392C] text-xs font-serif-th font-bold transition-all cursor-pointer active:scale-95"
                >
                  <span className="text-[#A6392C]">✦</span>
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
