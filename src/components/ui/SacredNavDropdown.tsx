"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  TarotSpreadNavIcon,
  TarotDeckNavIcon,
  JournalScrollNavIcon,
  MarketplaceReaderNavIcon,
  DailyTarotNavIcon,
  LoveTarotNavIcon,
  BirthCardNavIcon,
} from "@/components/ui/TarotArtIcons";
import { CoinSealIcon } from "@/components/entitlement/EntitlementIcons";
import { soundManager } from "@/lib/utils/audio";
import { COUNTS } from "@/components/layout/nav-links";
import { useLocale } from "@/lib/i18n";

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
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isEnglish } = useLocale();

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

    // ⚠️ ห้ามยิง event / side effect ใด ๆ ข้างใน setState updater (ISSUE-028)
    // updater ต้องเป็น pure function — React เรียกซ้ำได้หลายครั้ง
    // อ่านค่าปัจจุบันจาก ref แล้วตัดสินใจตรงนี้แทน
    const willOpen = !isOpenRef.current;
    if (willOpen) {
      window.dispatchEvent(new CustomEvent("tarot:close-menus", { detail: { except: "sacred-nav" } }));
    }
    setIsOpen(willOpen);
  };

  const featuredItems = [
    {
      label: isEnglish ? "Daily Tarot (1 Card)" : "ไพ่ยิปซีรายวัน (ไพ่ 1 ใบ)",
      sublabel: isEnglish ? "Check your daily energy, career & love guidance" : "เช็กพลังงานรายวัน การงาน การเงิน และความรัก",
      href: "/daily",
      Icon: DailyTarotNavIcon,
      badge: isEnglish ? "Daily Free" : "เปิดฟรี",
    },
    {
      label: isEnglish ? "Love Tarot (1 Card)" : "ดูดวงความรัก (ไพ่ 1 ใบ)",
      sublabel: isEnglish ? "Clarity for singles, talking stages, couples & breakups" : "คนโสด คนคุย มีแฟน หรือเพิ่งเลิกรา ไขคำตอบหัวใจ",
      href: "/love/1-card",
      Icon: LoveTarotNavIcon,
      badge: isEnglish ? "Love" : "ความรัก",
    },
    {
      label: isEnglish ? "Tarot Birth Card" : "คำนวณไพ่ประจำตัว (Birth Card)",
      sublabel: isEnglish ? "Calculate your personality & soul tarot archetypes" : "คำนวณไพ่บุคลิกภาพและจิตวิญญาณจากวันเกิด",
      href: "/cards/birth-card",
      Icon: BirthCardNavIcon,
      badge: isEnglish ? "Birthday" : "วันเกิด",
    },
  ];

  const knowledgeItems = [
    {
      label: isEnglish ? "Tarot Spreads (25 Spreads)" : "ผังการเปิดไพ่ (25 แบบ)",
      sublabel: isEnglish ? "Love, career, finance & destiny spreads" : "ความรัก การงาน การเงิน และดวงชะตา",
      href: "/spreads",
      Icon: TarotSpreadNavIcon,
      badge: isEnglish ? "25 Spreads" : "25 ผัง",
    },
    {
      label: isEnglish ? "Card Meanings (78 Cards)" : "ความหมายไพ่ (78 ใบ)",
      sublabel: isEnglish ? "1909 Rider-Waite symbolism & meanings" : "เปิดดูคำแปลและสัญลักษณ์ 1909 RWS",
      href: "/cards",
      Icon: TarotDeckNavIcon,
      badge: isEnglish ? "78 Cards" : "78 ใบ",
    },
    {
      label: isEnglish ? `Sanctuary Journal (${COUNTS.articles})` : `บทความดูดวง & ความรู้ไพ่ (${COUNTS.articles} เรื่อง)`,
      sublabel: isEnglish ? "Tarot insights, archetypes, love & career guidance" : "ความรู้ไพ่ทาโรต์ ความรัก การงาน และผังยอดนิยม",
      href: "/blog",
      Icon: JournalScrollNavIcon,
      badge: isEnglish ? `${COUNTS.articles} Articles` : `${COUNTS.articles} บทความ`,
    },
    ...(onOpenPlans
      ? [
          {
            label: isEnglish ? "Passes & Entitlements" : "แพ็กเกจเติมรอบ & สิทธิ์ใช้งาน",
            sublabel: isEnglish ? "Compare tiers, unlock 12-House spreads & replenish readings" : "เปรียบเทียบสิทธิ์ ปลดล็อกผังใหญ่ 12 ภพ และเติมรอบดูดวง",
            onClick: onOpenPlans,
            Icon: CoinSealIcon,
            badge: isEnglish ? "Plans" : "สิทธิ์/แพลน",
          },
        ]
      : []),
    {
      label: isEnglish ? "Consult Live Readers" : "ปรึกษาแม่หมอตัวจริง",
      sublabel: isEnglish ? "Book in-depth consultations with seasoned readers" : "จองคิววิเคราะห์ดวงเชิงลึกกับนักพยากรณ์",
      href: "/readers",
      Icon: MarketplaceReaderNavIcon,
      badge: isEnglish ? "Live Readers" : "นักพยากรณ์",
    },
  ];

  const renderNavCard = (
    item: {
      label: string;
      sublabel: string;
      href?: string;
      Icon: React.ComponentType<{ className?: string }>;
      badge: string;
      onClick?: () => void;
    },
    idx: number
  ) => {
    const Icon = item.Icon;
    const isAction = typeof item.onClick === "function";

    const content = (
      <>
        <div className="w-8.5 h-8.5 rounded-lg bg-[#EAE7E0] border border-[#D5CEC2] flex items-center justify-center text-[#A58A5C] group-hover:text-[#29261F] group-hover:border-[#A58A5C] transition-colors duration-150 flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 transition-transform duration-150 group-hover:scale-105" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif-th font-bold text-[#29261F] group-hover:text-[#A58A5C] transition-colors">
              {item.label}
            </span>
            <span className="text-[11px] font-serif-th text-[#29261F] bg-[#EAE7E0] px-2 py-0.5 rounded-full border border-[#D5CEC2]">
              {item.badge}
            </span>
          </div>
          <p className="text-[12px] font-serif-th text-[#635B4E] truncate mt-0.5">{item.sublabel}</p>
        </div>
      </>
    );

    return (
      <div key={item.href ? item.href : `action-${idx}`}>
        {isAction ? (
          <button
            type="button"
            onClick={() => {
              soundManager.playMenuTapSound();
              setIsOpen(false);
              item.onClick?.();
            }}
            className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#EAE7E0]/60 border border-transparent hover:border-[#D5CEC2]/60 transition-colors duration-150 group cursor-pointer text-left"
          >
            {content}
          </button>
        ) : (
          <Link
            href={item.href || "#"}
            prefetch={false}
            onClick={() => {
              soundManager.playMenuTapSound();
              setIsOpen(false);
            }}
            className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#EAE7E0]/60 border border-transparent hover:border-[#D5CEC2]/60 transition-colors duration-150 group cursor-pointer"
          >
            {content}
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Refined Luxury Warm Minimalist Trigger Button — Hamburger Icon */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-colors duration-150 cursor-pointer select-none shadow-xs ${
          isOpen
            ? "bg-[#EAE7E0] border-[#D5CEC2] text-[#29261F]"
            : "bg-[#FFFFFF] text-[#29261F] hover:text-[#A58A5C] border-[#D5CEC2] hover:border-[#A58A5C]"
        }`}
        aria-expanded={isOpen}
        aria-controls="sacred-nav-panel"
        aria-label={isEnglish ? "Main navigation menu" : "เมนูหลัก"}
        title={isEnglish ? "Menu" : "เมนูหลัก"}
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

      {/* World-Class Warm Milk Cream Floating Sanctuary Menu — Hardware-Accelerated Zero-Stutter Layer */}
      <div
        id="sacred-nav-panel"
        role="region"
        aria-label={isEnglish ? "Sanctuary navigation menu" : "เมนูวิหารพยากรณ์"}
        aria-hidden={!isOpen}
        className={`absolute right-0 top-full mt-2 w-72 sm:w-84 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] shadow-[0_10px_30px_rgba(42,38,31,0.12)] p-2.5 sm:p-3 z-50 overflow-x-hidden overflow-y-auto overscroll-contain max-h-[calc(100dvh-4.5rem)] space-y-1 no-scrollbar dropdown-panel-base ${
          isOpen ? "dropdown-panel-entering" : "dropdown-panel-exiting"
        }`}
      >
        {/* Ambient Top Foil Glow */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#A58A5C]/35 to-transparent -mt-0.5 mb-1.5" />

        {/* Header Title inside Dropdown */}
        <div className="px-3 py-1 flex items-center justify-between text-[13px] font-serif-th font-semibold text-[#635B4E] border-b border-[#D5CEC2]/40 pb-1.5">
          <span className="flex items-center gap-1.5 text-[#A58A5C]">
            <span className="font-bold">{isEnglish ? "Tarot Sanctuary" : "วิหารพยากรณ์"}</span>
          </span>
          <span className="text-[#29261F] text-[12px] font-mono tracking-wider bg-[#EAE7E0] border border-[#D5CEC2] px-2 py-0.5 rounded-full font-bold">
            1909 RWS
          </span>
        </div>

        {/* Section 1: พิธีกรรมยอดนิยม */}
        <div className="pt-1">
          <div className="px-2 py-1 text-[11px] font-serif-th font-bold text-[#8F5C1A] uppercase tracking-wider">
            {isEnglish ? "Featured Rituals & Tools" : "พิธีกรรมยอดนิยม & เครื่องมือ"}
          </div>
          <div className="space-y-0.5">
            {featuredItems.map((item, idx) => renderNavCard(item, idx))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-[#D5CEC2]/40 my-1" />

        {/* Section 2: คลังความรู้ & ผังพยากรณ์ */}
        <div>
          <div className="px-2 py-1 text-[11px] font-serif-th font-bold text-[#8F5C1A] uppercase tracking-wider">
            {isEnglish ? "Knowledge & Spreads" : "คลังความรู้ & ผังพยากรณ์"}
          </div>
          <div className="space-y-0.5">
            {knowledgeItems.map((item, idx) => renderNavCard(item, idx + 10))}
          </div>
        </div>

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
                className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#EAE7E0]/60 border border-transparent hover:border-[#D5CEC2]/60 transition-colors duration-150 group cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAE7E0] border border-[#D5CEC2] flex items-center justify-center text-[#A58A5C] group-hover:text-[#29261F] group-hover:border-[#A58A5C] transition-colors duration-150 flex-shrink-0 mt-0.5">
                  <JournalScrollNavIcon className="w-4 h-4 transition-transform duration-150 group-hover:scale-105" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif-th font-bold text-[#29261F] group-hover:text-[#A58A5C] transition-colors">
                      {isEnglish ? "Reading Journal" : "ประวัติการดูดวง"}
                    </span>
                    <span className="text-[12px] font-serif-th text-[#29261F] bg-[#EAE7E0] px-2 py-0.5 rounded-full border border-[#D5CEC2]">
                      {isEnglish ? "History" : "บันทึก"}
                    </span>
                  </div>
                  <p className="text-[13px] font-serif-th text-[#635B4E] truncate mt-0.5">
                    {isEnglish ? "Revisit your past cards and oracle counsel" : "ย้อนดูไพ่และคำทำนายที่คุณเคยเปิดไว้"}
                  </p>
                </div>
              </button>
            </div>
          )}

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
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-[#FCEEEA] hover:bg-[#FCEEEA] border border-[#D5CEC2] text-[#A6392C] text-xs font-serif-th font-bold transition-colors duration-150 cursor-pointer active:scale-98"
            >
              
              <span>{isEnglish ? "Start New Reading" : "เริ่มดูดวงใหม่"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
