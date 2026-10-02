"use client";

import React, { useState, useRef, useEffect } from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { soundManager } from "@/lib/utils/audio";
import { headerNav, isActiveNavPath, type HeaderNavLink } from "@/components/layout/header-nav";
import { useLocale } from "@/lib/i18n";
import { stripLocalePrefix } from "@/lib/i18n/paths";
import { useDialogBehavior } from "@/lib/use-dialog-behavior";
import { useCurrentPath } from "@/components/layout/current-path";

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

  const nav = headerNav(isEnglish);
  const close = () => {
    soundManager.playMenuTapSound();
    setIsOpen(false);
  };

  /** แถวลิงก์ในลิ้นชัก — ตัวหนังสือล้วน ไม่มีภาพไพ่ (แบบ Kazumi · ลิ้นชักอยู่ใน HTML ทุกหน้า ภาพไพ่ 10 ใบกิน DOM ~130 ชิ้น) */
  const renderLink = (item: HeaderNavLink, sub = false) => {
    const isActive = isActiveNavPath(currentPath, item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          // ⛔ ห้ามเปิด prefetch — บทเรียน INC-0106
          prefetch={false}
          aria-current={isActive ? "page" : undefined}
          onClick={close}
          className={`tap-overlay-y flex min-h-[44px] items-center rounded-lg px-3 font-serif-th transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
            sub ? "text-[15px]" : "text-base"
          } ${isActive ? "font-bold text-gold-ink" : "text-ink hover:bg-inset hover:text-gold-ink"}`}
        >
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    /* เดสก์ท็อป (lg+) มีเมนูเรียงบนแถบแล้ว — ปุ่มแฮมเบอร์เกอร์มีเฉพาะจอเล็ก (แบบ Kazumi) */
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

      <div
        /* ป้ายให้สคริปต์ของหน้าที่ Astro เรนเดอร์จับได้ (หน้านั้นไม่ hydrate React) */
        data-nav-scrim=""
        onClick={close}
        aria-hidden="true"
        className={`nav-drawer-scrim-base z-[var(--z-dropdown)] ${
          isOpen ? "nav-drawer-scrim-entering" : "nav-drawer-scrim-exiting"
        }`}
      />

      {/* ลิ้นชักขวา — ตัวหนังสือล้วนแบบ Kazumi: ชื่อแบรนด์ · กลุ่ม "ดูดวง" ย่อหน้าเข้า · ลิงก์ที่เหลือ · ปุ่มหลักท้ายลิ้นชัก */}
      <nav
        id="sacred-nav-panel"
        ref={drawerRef}
        aria-label={isEnglish ? "Site navigation" : "เมนูเว็บไซต์"}
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        className={`nav-drawer-panel-base w-full max-w-[340px] sm:max-w-[380px] bg-surface border-l border-line z-[calc(var(--z-dropdown)+1)] flex flex-col overflow-hidden ${
          isOpen ? "nav-drawer-panel-entering" : "nav-drawer-panel-exiting"
        }`}
      >
        {/* Drawer Header: ชื่อแบรนด์ + ปุ่มปิด (ด่าน test-sticky-header หาบล็อกนี้จากป้าย "Drawer Header:") */}
        {/*
          ⛔ ห้ามใส่ `truncate` ให้ชื่อแบรนด์ในหัวลิ้นชัก (INC-0200 ➜ INC-0209 · หัวลิ้นชักหายบน iOS Safari)
          `truncate` สร้างกล่องตัดที่ Safari คิดความกว้างได้ 0 แล้วเฉือนตัวอักษรทิ้งทั้งบรรทัด
          ชื่อเป็นค่าคงที่สั้นกว่าลิ้นชักมาก ใช้ `whitespace-nowrap` พอ
        */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-5 pb-3 pt-4">
          <span className="font-serif text-lg tracking-[0.2em] text-ink whitespace-nowrap">SEERTAROT</span>
          <button
            type="button"
            data-nav-close=""
            onClick={close}
            className="tap-overlay w-10 h-10 rounded-xl bg-inset flex items-center justify-center text-ink hover:text-gold-ink transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
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
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-4 pt-2 no-scrollbar">
          <p className="px-3 pb-1 pt-2 font-serif-th text-base text-ink">{nav.reading.label}</p>
          <div className="ml-3 space-y-3 border-l border-line pl-2">
            {nav.reading.groups.map((group) => (
              <div key={group.title}>
                <p className="px-3 pt-2 font-serif-th text-xs text-muted">{group.title}</p>
                <ul>{group.links.map((link) => renderLink(link, true))}</ul>
              </div>
            ))}
            <ul>{renderLink(nav.reading.all, true)}</ul>
          </div>

          <ul className="mt-3">
            {nav.links.map((link) => renderLink(link))}
            {onOpenHistory && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onOpenHistory();
                  }}
                  className="tap-overlay-y flex min-h-[44px] w-full items-center rounded-lg px-3 text-left font-serif-th text-base text-ink transition-colors hover:bg-inset hover:text-gold-ink cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                >
                  {isEnglish ? "Reading journal" : "ประวัติการดูดวง"}
                </button>
              </li>
            )}
          </ul>
        </div>

        {/*
          🧭 ท้ายลิ้นชัก: ปุ่มหลัก "เริ่มดูดวง" (ตำแหน่งเดียวกับปุ่มจองคิวของ Kazumi) + ทางเข้าหน้าบัญชีที่มีทุกหน้า
          ลิงก์บัญชีไม่ต้องรู้สถานะเซสชัน — หน้า /account จัดการทั้งสถานะสมาชิกและผู้เยี่ยมชมให้เอง
        */}
        <div className="shrink-0 space-y-2 border-t border-line px-4 py-3">
          {canReset && onReset ? (
            <button
              type="button"
              onClick={() => {
                soundManager.playCardSelectSound();
                setIsOpen(false);
                onReset();
              }}
              className="btn-gold-glass tap-overlay-y flex min-h-[48px] w-full items-center justify-center font-serif-th text-sm font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
            >
              {isEnglish ? "Start a new reading" : "เริ่มดูดวงใหม่"}
            </button>
          ) : (
            <Link
              href="/"
              prefetch={false}
              onClick={close}
              className="btn-gold-glass tap-overlay-y flex min-h-[48px] w-full items-center justify-center font-serif-th text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
            >
              {isEnglish ? "Start a reading" : "เริ่มดูดวง"}
            </Link>
          )}
          <Link
            href="/account"
            prefetch={false}
            onClick={close}
            className="tap-overlay-y flex min-h-[44px] w-full items-center justify-center font-serif-th text-sm text-ink transition-colors hover:text-gold-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            {isEnglish ? "My account & credits" : "บัญชีของฉันและสิทธิ์การใช้งาน"}
          </Link>
        </div>
      </nav>
    </div>
  );
};
