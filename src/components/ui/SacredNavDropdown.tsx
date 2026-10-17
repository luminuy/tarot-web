"use client";

import React, { useState, useRef, useEffect } from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { CardImage } from "@/components/card/CardImage";
import { soundManager } from "@/lib/utils/audio";
import { headerNav } from "@/components/layout/header-nav";
import { useLocale } from "@/lib/i18n";
import { stripLocalePrefix } from "@/lib/i18n/paths";
import { useDialogBehavior } from "@/lib/use-dialog-behavior";
import { useCurrentPath } from "@/components/layout/current-path";
import { ArrowIcon, ChevronIcon, PersonIcon } from "@/components/ui/LineIcons";

interface SacredNavDropdownProps {
  onOpenHistory?: () => void;
  onReset?: () => void;
  canReset?: boolean;
  /**
   * เรนเดอร์รายการในลิ้นชักตั้งแต่แรก (ปกติรอจนเปิดครั้งแรก)
   * ⚠️ หัวเว็บ static ของหน้า Astro ต้องส่งเสมอ — หน้านั้นไม่ hydrate `hasOpened` จึงไม่มีวันเป็นจริง
   *    (ลืมส่ง = ลิ้นชักว่างเปล่าทุกหน้ายกเว้นหน้าแรก) · ด่าน test-en-thai-leak ก็ใช้
   */
  eagerBody?: boolean;
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
  onReset,
  canReset = false,
  eagerBody = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  /*
   * รายการในลิ้นชักเรนเดอร์หลังเปิดครั้งแรกเท่านั้น (งบ DOM หน้าแรก ≤ 1,500 · INC-0247)
   * ลิ้นชักปิดอยู่ = มองไม่เห็นและ aria-hidden อยู่แล้ว แต่เดิมแถวไพ่ ~13 แถวอยู่ใน HTML ของทุกหน้า
   * ลิงก์ชุดเดียวกันยังอยู่ใน HTML ผ่านแผงเมนูใหญ่บนคอม (SiteHeader) และฟุตเตอร์ — บอทค้นหายังเห็นครบ
   */
  const [hasOpened, setHasOpened] = useState(eagerBody);
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
    if (willOpen) setHasOpened(true);
    setIsOpen(willOpen);
  };

  /* หัวข้อหลักชุดเดียวกับแถบเมนูบนคอม (header-nav.ts) — มือถือเห็นหมวดเดียวกัน หาง่ายเหมือนกัน */
  const nav = headerNav(isEnglish);

  const close = () => {
    soundManager.playMenuTapSound();
    setIsOpen(false);
  };
  const isActivePath = (href?: string) =>
    !!href && (currentPath === href || (href !== "/" && currentPath.startsWith(href + "/")));

  /*
   * ลิ้นชัก UI 2.0 (เจ้าของ 2026-10-17 "ต้องปรับปรุง อัปเกรดเมนูบาร์ในมือถือให้ใช้ง่าย เข้าใจง่าย")
   * เดิม: 17 แถวยาวเหยียด ภาพไพ่ทุกแถว ต้องเลื่อน 3 จอกว่าจะเจอ "ความหมายไพ่" / "ราคา"
   * ใหม่: (1) ดูดวงยอดนิยม 4 กล่องภาพไพ่ (2) เมนูหลักแถวใหญ่ (3) ดูดวงแบบอื่นพับเป็นหมวด (<details> ไม่ต้องใช้ JS)
   * สไตล์ `nv-*` อยู่ใน globals.css · ⚠️ ลิ้นชักอยู่ใน HTML ทุกหน้า Astro — ภาพไพ่เหลือแค่ 4 กล่อง (เดิม 17 ภาพ = งบ HTML)
   */
  const renderRow = (item: NavItem, idx: number, sub = true) => {
    const isActive = isActivePath(item.href);
    const body = (
      <>
        <span className="nv-row-t">
          <b>{item.label}</b>
          {sub && <small>{item.sublabel}</small>}
        </span>
        <ChevronIcon direction="right" className="nv-chev" />
      </>
    );
    return item.onClick ? (
      <button
        key={`action-${idx}`}
        type="button"
        onClick={() => {
          close();
          item.onClick?.();
        }}
        className="nv-row"
      >
        {body}
      </button>
    ) : (
      <Link
        key={item.href}
        href={item.href || "#"}
        // ⛔ ห้ามเปิด prefetch — บทเรียน INC-0106
        prefetch={false}
        aria-current={isActive ? "page" : undefined}
        onClick={close}
        className="nv-row"
      >
        {body}
      </Link>
    );
  };

  const renderTile = (item: { label: string; href: string; cardId: string }) => (
    <Link
      key={item.href}
      href={item.href}
      prefetch={false}
      aria-current={isActivePath(item.href) ? "page" : undefined}
      onClick={close}
      className="nv-tile"
    >
      <span className="nv-tile-img">
        <CardImage cardId={item.cardId} alt="" sizes="40px" thumb loading="lazy" />
      </span>
      <b>{item.label}</b>
    </Link>
  );

  return (
    /* เดสก์ท็อป (lg+) มีเมนูเรียงกลางแถบแล้ว — ปุ่มแฮมเบอร์เกอร์มีเฉพาะจอเล็ก (แบบ Kazumi) */
    <div className="select-none lg:hidden" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`tap-overlay w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
          isOpen ? "bg-inset text-ink" : "text-ink hover:bg-inset hover:text-gold-ink"
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
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[22px] h-[22px]"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
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
        aria-label={isEnglish ? "Site menu" : "เมนูเว็บไซต์"}
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        className={`nav-drawer-panel-base nv-panel z-[calc(var(--z-dropdown)+1)] ${
          isOpen ? "nav-drawer-panel-entering" : "nav-drawer-panel-exiting"
        }`}
      >
        {/* Drawer Header: โลโก้ + ชื่อแบรนด์ชุดเดียวกับหัวเว็บ (SEERTAROT) & Close Button */}
        <div className="nv-head">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <img
              src="/logo.webp"
              alt="SeerTarot"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full border border-line object-cover"
              loading="lazy"
            />
            {/*
              ชื่อแบรนด์ชุดเดียวกับหัวเว็บ (`SiteHeader`) — เดิมเขียน "วิหารพยากรณ์ · 1909 RWS" ซึ่งเป็นชื่อเก่า
              ⛔ ห้ามใส่ `truncate` (INC-0200 ➜ INC-0209 ➜ INC-0252 · iOS Safari เฉือนบรรทัดทิ้งทั้งบรรทัด)
              ข้อความเป็นค่าคงที่สั้นกว่าลิ้นชักมาก ใช้ `whitespace-nowrap` พอ ไม่ต้องมีกล่องตัด
            */}
            <span className="flex flex-col whitespace-nowrap leading-none">
              <span className="font-serif-th text-[15px] tracking-[0.18em] text-ink">SEERTAROT</span>
              <span className="mt-1.5 font-serif-th text-[11px] tracking-[0.12em] text-muted">
                {isEnglish ? "1909 RIDER-WAITE" : "ดูดวงไพ่ทาโรต์"}
              </span>
            </span>
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

        {/* Scrollable Navigation Body — เรนเดอร์เมื่อเปิดครั้งแรก (ดู hasOpened) */}
        <div className="nv-body no-scrollbar">
          {hasOpened && (
          <>
          {/* 1. ดูดวงยอดนิยม — 4 กล่องภาพไพ่ แตะครั้งเดียวถึงหน้า */}
          <p className="nv-k">{isEnglish ? "Popular readings" : "ดูดวงยอดนิยม"}</p>
          <div className="nv-tiles">
            {nav.reading.groups[0].links.map(renderTile)}
            {renderTile({ label: nav.reading.all.label, href: nav.reading.all.href, cardId: "major-21" })}
          </div>

          {/* 2. เมนูหลัก — ชื่อตรงกับแถบเมนูบนคอมทุกคำ */}
          <p className="nv-k">{isEnglish ? "Menu" : "เมนูหลัก"}</p>
          <div className="nv-list">{nav.links.map((item, idx) => renderRow(item, idx + 10))}</div>

          {/* 3. ดูดวงแบบอื่น — พับเป็นหมวด แตะหัวหมวดเพื่อกาง */}
          <p className="nv-k">{isEnglish ? "More readings" : "ดูดวงแบบอื่น"}</p>
          <div className="nv-list">
            {nav.reading.groups.slice(1).map((group) => (
              <details key={group.title} className="nv-acc">
                <summary className="nv-row">
                  <span className="nv-row-t">
                    <b>{group.title}</b>
                    <small>{group.links.map((l) => l.label).join(" · ")}</small>
                  </span>
                  <ChevronIcon className="nv-chev nv-acc-chev" />
                </summary>
                <div className="nv-acc-body">{group.links.map((item, idx) => renderRow(item, idx + 20, false))}</div>
              </details>
            ))}
          </div>

          {onOpenHistory && (
            <div className="nv-list">
              {renderRow(
                {
                  label: isEnglish ? "Reading history" : "ประวัติการดูดวง",
                  sublabel: isEnglish ? "Revisit your past cards and readings" : "ย้อนดูไพ่และคำทำนายที่คุณเคยเปิดไว้",
                  onClick: onOpenHistory,
                  cardId: "major-14",
                },
                99,
              )}
            </div>
          )}
          </>
          )}
        </div>

        {/* Drawer Footer: Account · Reset (if available) + Quiet Luxury Tagline */}
        <div className="nv-foot">
          {/*
            🧭 ทางเข้าหน้าบัญชีที่ "มีอยู่ทุกหน้า"
            ปุ่มไอคอนบัญชีบนหัวเว็บมีเฉพาะหน้าดูดวงหลัก (variant="app") เท่านั้น
            คนที่อยู่หน้าไพ่ บทความ หรือหน้าบัญชีเอง จึงเคยไม่มีทางกลับไปจัดการบัญชีเลย
            ลิงก์นี้ไม่ต้องรู้สถานะเซสชัน — หน้า /account จัดการทั้งสถานะสมาชิกและผู้เยี่ยมชมให้เอง
          */}
          <Link href="/account" prefetch={false} onClick={close} className="nv-account">
            <PersonIcon className="nv-account-ico" />
            <span>{isEnglish ? "My account" : "บัญชีของฉัน"}</span>
            <ArrowIcon className="nv-account-go" />
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
          <p className="nv-tag">
            {isEnglish ? "1909 Rider-Waite deck · verifiable shuffle" : "ไพ่ 1909 Rider-Waite แท้ · สุ่มจริง ตรวจสอบได้"}
          </p>
        </div>
      </nav>
    </div>
  );
};
