"use client";

import React, { useState, useRef, useEffect } from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { CardImage } from "@/components/card/CardImage";
import { soundManager } from "@/lib/utils/audio";
import { COUNTS } from "@/components/layout/nav-links";
import { useLocale } from "@/lib/i18n";
import { stripLocalePrefix } from "@/lib/i18n/paths";
import { useDialogBehavior } from "@/lib/use-dialog-behavior";
import { useCurrentPath } from "@/components/layout/current-path";

interface SacredNavDropdownProps {
  onOpenHistory?: () => void;
  onOpenPlans?: () => void;
  onReset?: () => void;
  canReset?: boolean;
}

interface NavItem {
  label: string;
  sublabel: string;
  href?: string;
  cardId: string;
  onClick?: () => void;
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
  const drawerRef = useRef<HTMLElement>(null);
  const { isEnglish } = useLocale();

  // A4-04: หน้า Astro ส่ง path มาทาง provider (หัวเว็บเรนเดอร์ static) · Next ใช้ router
  const currentPath = stripLocalePrefix(useCurrentPath());

  // 🪟 จัดการ Dialog Behavior ครบวงจร (Esc, Focus Trap, Body Scroll Lock, Return Focus)
  useDialogBehavior(isOpen, () => setIsOpen(false), drawerRef);

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

  // Close drawer when clicking outside (safety backstop for desktop/mobile)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
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

  const featuredItems: NavItem[] = [
    {
      label: isEnglish ? "Daily Tarot (1 Card)" : "ไพ่ยิปซีรายวัน (ไพ่ 1 ใบ)",
      sublabel: isEnglish ? "Check your daily energy, career & love guidance" : "เช็กพลังงานรายวัน การงาน การเงิน และความรัก",
      href: "/daily",
      cardId: "major-19",
    },
    {
      label: isEnglish ? "Love Tarot (1 Card)" : "ดูดวงความรัก (ไพ่ 1 ใบ)",
      sublabel: isEnglish ? "Clarity for singles, talking stages, couples & breakups" : "คนโสด คนคุย มีแฟน หรือเพิ่งเลิกรา ไขคำตอบหัวใจ",
      href: "/love/1-card",
      cardId: "major-06",
    },
    {
      label: isEnglish ? "Pick A Card (4 Piles)" : "Pick A Card เลือกกองไพ่ (4 กอง)",
      sublabel: isEnglish ? "Choose a sacred pile for love, career & cosmic guidance" : "เลือกกองไพ่พยากรณ์ความรัก การงาน และข้อคิดเตือนใจ",
      href: "/pick-a-card",
      cardId: "major-17",
    },
    {
      label: isEnglish ? "Tarot Birth Card" : "คำนวณไพ่ประจำตัว (Birth Card)",
      sublabel: isEnglish ? "Find your personality and soul cards from your birthday" : "คำนวณไพ่บุคลิกภาพและจิตวิญญาณจากวันเกิด",
      href: "/cards/birth-card",
      cardId: "major-10",
    },
    {
      label: isEnglish ? "Zodiac Tarot Cards" : "ไพ่ประจำราศี 12 ราศี",
      sublabel: isEnglish ? "Your sign's tarot card & birth decan" : "หาไพ่ทาโรต์ประจำราศีจากวันเกิด",
      href: "/cards/zodiac",
      cardId: "major-17",
    },
  ];

  const knowledgeItems: NavItem[] = [
    {
      label: isEnglish ? "Tarot Spreads (26 Spreads)" : "ผังการเปิดไพ่ (26 แบบ)",
      sublabel: isEnglish ? "Love, career, finance & destiny spreads" : "ความรัก การงาน การเงิน และดวงชะตา",
      href: "/spreads",
      cardId: "major-05",
    },
    {
      label: isEnglish ? "Card Meanings (78 Cards)" : "ความหมายไพ่ (78 ใบ)",
      sublabel: isEnglish ? "1909 Rider-Waite symbolism & meanings" : "เปิดดูคำแปลและสัญลักษณ์ 1909 RWS",
      href: "/cards",
      cardId: "major-01",
    },
    {
      label: isEnglish ? `Sanctuary Journal (${COUNTS.articles})` : `บทความดูดวง & ความรู้ไพ่ (${COUNTS.articles} เรื่อง)`,
      sublabel: isEnglish ? "Tarot guides, love and career advice" : "ความรู้ไพ่ทาโรต์ ความรัก การงาน และผังยอดนิยม",
      href: "/blog",
      cardId: "major-09",
    },
    ...(onOpenPlans
      ? [
          {
            label: isEnglish ? "Passes & Entitlements" : "แพ็กเกจเติมรอบ & สิทธิ์ใช้งาน",
            sublabel: isEnglish ? "Compare tiers, unlock 12-House spreads & replenish readings" : "เปรียบเทียบสิทธิ์ ปลดล็อกผังใหญ่ 12 ภพ และเติมรอบดูดวง",
            onClick: onOpenPlans,
            cardId: "pentacles-01",
          },
        ]
      : []),
    {
      label: isEnglish ? "Consult Live Readers" : "ปรึกษาแม่หมอตัวจริง",
      sublabel: isEnglish ? "Book in-depth consultations with seasoned readers" : "จองคิววิเคราะห์ดวงเชิงลึกกับนักพยากรณ์",
      href: "/readers",
      cardId: "major-02",
    },
  ];

  const renderNavCard = (item: NavItem, idx: number) => {
    const isAction = typeof item.onClick === "function";
    const isActive = item.href
      ? currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href + "/"))
      : false;

    const innerContent = (
      <>
        {/* Active Route Indicator Bar (GitHub Drawer Style) */}
        {isActive && (
          <span
            className="absolute left-0 top-2 bottom-2 w-1 bg-gold rounded-r-full"
            aria-hidden="true"
          />
        )}

        {/* 1909 Rider-Waite Authentic Mini Card Archetype */}
        <div className="relative w-[34px] h-[54px] rounded-[5px] overflow-hidden border border-line/80 shadow-xs shrink-0 bg-canvas group-hover:border-gold/60 transition-colors duration-150">
          <CardImage
            cardId={item.cardId}
            alt={item.label}
            sizes="34px"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text Details: Title & Subtitle */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[13px] font-serif-th leading-[1.7] truncate transition-colors ${
                isActive ? "font-bold text-gold-ink" : "font-semibold text-ink group-hover:text-gold-ink"
              }`}
            >
              {item.label}
            </span>
          </div>
          <p className="text-[11.5px] font-serif-th text-muted truncate mt-0.5 leading-[1.7]">
            {item.sublabel}
          </p>
        </div>

        {/* Subtle Luxury Affordance Chevron */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5 text-muted/30 group-hover:text-gold transition-colors shrink-0"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </>
    );

    const buttonClass = `tap-overlay-y relative w-full min-h-[44px] flex items-center gap-3 px-2.5 py-1.5 rounded-xl text-left transition-colors duration-150 group cursor-pointer border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
      isActive
        ? "bg-inset/90 border-line shadow-xs"
        : "hover:bg-inset/60 border-transparent hover:border-line/60"
    }`;

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
            className={buttonClass}
          >
            {innerContent}
          </button>
        ) : (
          <Link
            href={item.href || "#"}
            // ⛔ ห้ามเปิด prefetch — บทเรียน INC-0106
            prefetch={false}
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
              soundManager.playMenuTapSound();
              setIsOpen(false);
            }}
            className={buttonClass}
          >
            {innerContent}
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="select-none" ref={dropdownRef}>
      {/* Refined Luxury Minimalist Trigger Button — Hamburger Icon */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`tap-overlay w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-colors duration-150 cursor-pointer select-none shadow-xs ${
          isOpen
            ? "bg-inset border-line text-ink"
            : "bg-surface text-ink hover:text-gold border-line hover:border-gold"
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

      {/* Backdrop Scrim — Obsidian Semi-transparent Overlay */}
      <div
        /* ป้ายให้สคริปต์ของหน้าที่ Astro เรนเดอร์จับได้ (หน้านั้นไม่ hydrate React) */
        data-nav-scrim=""
        onClick={() => {
          soundManager.playMenuTapSound();
          setIsOpen(false);
        }}
        aria-hidden="true"
        className={`nav-drawer-scrim-base z-[var(--z-dropdown)] ${
          isOpen ? "nav-drawer-scrim-entering" : "nav-drawer-scrim-exiting"
        }`}
      />

      {/* Slide-out Navigation Drawer on the Right (GitHub Style) */}
      <nav
        id="sacred-nav-panel"
        ref={drawerRef}
        aria-label={isEnglish ? "Sanctuary navigation menu" : "เมนูวิหารพยากรณ์"}
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        className={`nav-drawer-panel-base w-full max-w-[340px] sm:max-w-[380px] bg-surface border-l border-line z-[calc(var(--z-dropdown)+1)] flex flex-col overflow-hidden ${
          isOpen ? "nav-drawer-panel-entering" : "nav-drawer-panel-exiting"
        }`}
      >
        {/* Ambient Top Gold Accent Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent shrink-0" />

        {/* Drawer Header: Brand, 1909 RWS Badge & Close Button */}
        <div className="px-4 py-3 sm:py-3.5 border-b border-line flex items-center justify-between gap-2 bg-surface shrink-0">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border border-line overflow-hidden relative flex-shrink-0 bg-canvas">
              <img
                src="/logo.webp"
                alt="SeerTarot"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/*
              ⛔ ห้ามใส่ `truncate` ให้สองบรรทัดนี้อีก (INC-0200 ➜ INC-0209 · หัวลิ้นชักหายบน iOS Safari)
              รอบแรกแก้ด้วยการเติม `flex-1` ให้คอลัมน์ — วัดจากภาพที่เจ้าของส่งมารอบสองแล้ว
              คอลัมน์กว้างถูกแล้วจริง (ป้าย 1909 RWS ถูกดันไปอยู่ตำแหน่งที่ควรเป็นเป๊ะ) แต่ตัวหนังสือยังหาย
              ตัวการ์จริงคือ `truncate` เอง — มันสร้าง `overflow: hidden` เป็นกล่องตัดของตัวเอง
              ที่ Safari คิดความกว้างแบบ shrink-to-fit ได้ 0 ตัวอักษรจึงถูกตัดทิ้งทั้งบรรทัด
              ทั้งที่มีที่ว่างให้วาง · ป้าย "1909 RWS" ไม่มี `truncate` จึงรอดมาใบเดียว — นั่นคือเบาะแสที่ชี้ตัวจริง

              ข้อความสองบรรทัดนี้เป็นค่าคงที่ ยาวสุด ~175px ในลิ้นชักที่กว้างอย่างน้อย 340px
              จึงไม่มีทางล้น ใช้ `whitespace-nowrap` พอ ไม่ต้องมีกล่องตัดให้ Safari ยุบ
            */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-serif-th text-sm font-bold text-ink whitespace-nowrap leading-[1.7]">
                  {isEnglish ? "Tarot Sanctuary" : "วิหารพยากรณ์"}
                </span>
                <span className="glass-chip text-ink text-[10px] font-mono tracking-wider px-1.5 py-0.2 font-bold shrink-0">
                  1909 RWS
                </span>
              </div>
              <span className="text-[10px] tracking-[0.16em] text-muted font-mono uppercase font-semibold whitespace-nowrap mt-0.5">
                RIDER-WAITE TAROT
              </span>
            </div>
          </div>

          <button
            type="button"
            data-nav-close=""
            onClick={() => {
              soundManager.playMenuTapSound();
              setIsOpen(false);
            }}
            className="tap-overlay w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-inset border border-transparent hover:border-line transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
            aria-label={isEnglish ? "Close navigation menu" : "ปิดเมนู"}
            title={isEnglish ? "Close" : "ปิดเมนู"}
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3 space-y-3 no-scrollbar">
          {/* Section 1: พิธีกรรมยอดนิยม */}
          <div>
            <div className="px-2.5 pb-1.5 text-xs font-serif-th font-semibold text-muted tracking-normal select-none">
              {isEnglish ? "Featured Rituals & Tools" : "พิธีกรรมยอดนิยม & เครื่องมือ"}
            </div>
            <div className="space-y-1">
              {featuredItems.map((item, idx) => renderNavCard(item, idx))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-[1px] w-full bg-line/40 my-1.5" />

          {/* Section 2: คลังความรู้ & ผังพยากรณ์ */}
          <div>
            <div className="px-2.5 pb-1.5 text-xs font-serif-th font-semibold text-muted tracking-normal select-none">
              {isEnglish ? "Knowledge & Spreads" : "คลังความรู้ & ผังพยากรณ์"}
            </div>
            <div className="space-y-1">
              {knowledgeItems.map((item, idx) => renderNavCard(item, idx + 10))}
            </div>
          </div>

          {/* Section 3: ประวัติการดูดวง (Reading Journal) */}
          {onOpenHistory && (
            <>
              <div className="h-[1px] w-full bg-line/40 my-1.5" />
              <div>
                <div className="px-2.5 pb-1.5 text-xs font-serif-th font-semibold text-muted tracking-normal select-none">
                  {isEnglish ? "Reading Journal" : "ประวัติ & บันทึกดวง"}
                </div>
                {renderNavCard(
                  {
                    label: isEnglish ? "Reading Journal" : "ประวัติการดูดวง",
                    sublabel: isEnglish ? "Revisit your past cards and oracle counsel" : "ย้อนดูไพ่และคำทำนายที่คุณเคยเปิดไว้",
                    onClick: onOpenHistory,
                    cardId: "major-14",
                  },
                  99
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer: Account · Reset (if available) + Quiet Luxury Tagline */}
        <div className="shrink-0 px-4 py-3 border-t border-line/50 bg-canvas/30 space-y-2.5">
          {/*
            🧭 ทางเข้าหน้าบัญชีที่ "มีอยู่ทุกหน้า"
            ปุ่มไอคอนบัญชีบนหัวเว็บมีเฉพาะหน้าดูดวงหลัก (variant="app") เท่านั้น
            คนที่อยู่หน้าไพ่ บทความ หรือหน้าบัญชีเอง จึงเคยไม่มีทางกลับไปจัดการบัญชีเลย
            ลิงก์นี้ไม่ต้องรู้สถานะเซสชัน — หน้า /account จัดการทั้งสถานะสมาชิกและผู้เยี่ยมชมให้เอง
          */}
          <Link
            href="/account"
            prefetch={false}
            onClick={() => {
              soundManager.playMenuTapSound();
              setIsOpen(false);
            }}
            className="altar-card-porcelain !rounded-xl tap-overlay-y flex min-h-[44px] w-full items-center justify-center gap-2 px-3 py-2.5 font-serif-th text-xs font-bold text-ink transition-colors hover:text-gold-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{isEnglish ? "My Account & Entitlements" : "บัญชีของฉันและสิทธิ์การใช้งาน"}</span>
          </Link>

          {canReset && onReset && (
            <button
              type="button"
              onClick={() => {
                soundManager.playCardSelectSound();
                setIsOpen(false);
                onReset();
              }}
              className="tap-overlay-y w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-err-wash hover:bg-err-wash border border-line text-err text-xs font-serif-th font-bold transition-colors duration-150 cursor-pointer active:scale-98 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-err"
            >
              <span>{isEnglish ? "Start New Reading" : "เริ่มดูดวงใหม่"}</span>
            </button>
          )}
          <div className="text-[10px] font-mono tracking-widest text-muted text-center uppercase">
            {isEnglish ? "1909 RIDER-WAITE TAROT · VERIFIABLE SHUFFLE" : "ไพ่ 1909 Rider-Waite แท้ · สุ่มจริง ตรวจสอบได้"}
          </div>
        </div>
      </nav>
    </div>
  );
};
