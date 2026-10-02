"use client";

import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { useCurrentPath } from "@/components/layout/current-path";
import { useLocale } from "@/lib/i18n";
import { hasEnglishTwin, stripLocalePrefix } from "@/lib/i18n/paths";
import { soundManager } from "@/lib/utils/audio";

interface LanguageSwitcherProps {
  className?: string;
}

/**
 * 🌐 ตัวเลือกภาษาแบบเว็บระดับโลก (เจ้าของสั่ง 2026-10-02)
 * ---------------------------------------------------------------------------
 * ปุ่ม: ลูกโลก + รหัสภาษาที่ใช้อยู่ (TH / EN) — เห็นทันทีว่าตอนนี้ภาษาอะไร โดยไม่ต้องกดเปิด
 * แผง: ชื่อภาษาด้วยภาษาของมันเอง (ภาษาไทย · English) + ชื่อในภาษาที่อ่านอยู่ + เครื่องหมายถูกที่ภาษาปัจจุบัน
 *
 * มาตรฐานที่ถือ:
 *  1. **ลิงก์จริงไปหน้าฝาแฝด** (`<a href hreflang lang>`) ไม่ใช่ปุ่มสลับ state — เปิดแท็บใหม่ได้ · บอทเห็นคู่ภาษา
 *     · ไม่ต้องรอ JS (หัวเว็บของหน้า Astro เป็น HTML นิ่ง) · หน้าที่ไม่มีฝาแฝดเป็นปุ่มจำภาษาแทน ไม่พาไปชน 404
 *  2. จำภาษาที่เลือกไว้ที่เครื่อง (คุกกี้ + localStorage) — ฝั่ง React ใช้ `setLocale` · หน้า Astro ใช้ site-header.ts
 *  3. คีย์บอร์ดครบ: เปิดแล้วโฟกัสภาษาปัจจุบัน · ↑ ↓ Home End เลื่อน · Esc ปิดแล้วคืนโฟกัสให้ปุ่ม · แตะนอกแผงปิด
 *  4. ชื่อปุ่มเป็นภาษาของหน้าที่อ่านอยู่ (UX-17) · ชื่อภาษาในแผงติด `lang` ของภาษานั้น โปรแกรมอ่านจอจึงออกเสียงถูก
 *
 * เปิด/ปิดด้วย <details> ของเบราว์เซอร์ จึงใช้ได้แม้ JS ยังไม่โหลด
 * ⚠️ ปุ่ม/ลิงก์ในแผงต้องมี `data-locale-switch` — `astro/scripts/site-header.ts` ผูกตัวจำภาษากับป้ายนี้
 */
export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, pendingLocale, isSwitchingLocale } = useLocale();
  const router = useRouter();
  const basePath = stripLocalePrefix(useCurrentPath());
  const hasTwin = hasEnglishTwin(basePath);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // ภาษาที่ควรแสดงว่า "เลือกอยู่" — ใช้ค่าที่ผู้ใช้เพิ่งกดถ้ามี (ISSUE-025)
  const shown = pendingLocale ?? locale;
  const isEn = shown === "en";

  const close = (refocus = false) => {
    const el = detailsRef.current;
    if (!el?.open) return;
    el.open = false;
    if (refocus) el.querySelector("summary")?.focus();
  };

  // แตะนอกแผง ➔ พับ (<details> ไม่ปิดเองเมื่อแตะที่อื่น)
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const el = detailsRef.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const options = [
    { code: "th" as const, native: "ภาษาไทย", translated: isEn ? "Thai" : null, href: basePath },
    {
      code: "en" as const,
      native: "English",
      translated: isEn ? null : "อังกฤษ",
      href: basePath === "/" ? "/en" : `/en${basePath}`,
    },
  ];

  const choose = (code: "th" | "en", e: MouseEvent) => {
    if (code === shown) {
      e.preventDefault();
      close(true);
      return;
    }
    try {
      soundManager.playMenuTapSound();
    } catch {
      // เสียงเป็นของเสริม
    }
    // เขียนคุกกี้เสมอ เพื่อให้หน้าที่ไม่มีฝาแฝดจำภาษาที่เลือกไว้ได้
    setLocale(code);
    close();
    if (!hasTwin) return;
    // คลิกปกติ ➔ เปลี่ยนหน้าแบบไม่โหลดใหม่ทั้งหน้า · กด ⌘/Ctrl/กลางเมาส์ ➔ ปล่อยให้เบราว์เซอร์เปิดแท็บใหม่ตามลิงก์
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    router.push(options.find((o) => o.code === code)!.href);
  };

  const onToggle = () => {
    const el = detailsRef.current;
    if (!el?.open) return;
    // เปิดแล้วโฟกัสภาษาปัจจุบัน (เมนูมาตรฐาน) — เฉพาะเปิดด้วยคีย์บอร์ด ไม่งั้นวงโฟกัสโผล่ตอนแตะด้วยนิ้ว
    if (el.querySelector("summary")?.matches(":focus-visible")) {
      el.querySelector<HTMLElement>('[data-locale-switch][aria-current="true"]')?.focus();
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDetailsElement>) => {
    const el = detailsRef.current;
    if (!el?.open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
      return;
    }
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-locale-switch]"));
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown" ? items[(i + 1) % items.length]
      : e.key === "ArrowUp" ? items[(i - 1 + items.length) % items.length]
      : e.key === "Home" ? items[0]
      : e.key === "End" ? items[items.length - 1]
      : null;
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };

  const triggerLabel = isEn ? "Language: English — change language" : "ภาษา: ไทย — เปลี่ยนภาษา";
  const rowClass =
    "group/opt tap-overlay-y flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 text-left transition-colors hover:bg-inset focus-visible:bg-inset focus-visible:outline-none cursor-pointer";

  return (
    <details
      ref={detailsRef}
      data-locale-menu=""
      onToggle={onToggle}
      onKeyDown={onKeyDown}
      className={`group/lang relative ${className}`}
    >
      <summary
        aria-label={triggerLabel}
        title={triggerLabel}
        aria-busy={isSwitchingLocale}
        className={`tap-overlay flex h-10 cursor-pointer list-none items-center gap-1 rounded-full px-2 text-ink transition-colors hover:bg-inset hover:text-gold-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold group-open/lang:bg-inset sm:px-2.5 [&::-webkit-details-marker]:hidden ${
          isSwitchingLocale ? "opacity-70" : ""
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 shrink-0"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        <span aria-hidden="true" className="font-mono text-[12px] font-bold tracking-wider">
          {isEn ? "EN" : "TH"}
        </span>
      </summary>

      <div
        role="group"
        aria-label={isEn ? "Choose a language" : "เลือกภาษา"}
        className="lang-pop absolute right-0 top-full z-50 mt-2 w-[248px] rounded-2xl border border-line bg-surface p-1.5 shadow-[0_18px_40px_-16px_rgba(42,38,31,0.4)]"
      >
        <p className="px-3 pb-1 pt-2 font-serif-th text-xs text-muted">{isEn ? "Language" : "ภาษา"}</p>
        {options.map((o) => {
          const current = o.code === shown;
          const body = (
            <>
              <span className="min-w-0 flex-1">
                <span lang={o.code} className={`block font-serif-th text-[15px] leading-snug ${current ? "font-bold text-ink" : "text-ink"}`}>
                  {o.native}
                </span>
                {o.translated && <span className="block font-serif-th text-xs text-muted">{o.translated}</span>}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="invisible h-[18px] w-[18px] shrink-0 text-gold-ink group-aria-[current=true]/opt:visible"
                aria-hidden="true"
              >
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </>
          );
          return hasTwin ? (
            // ⚠️ ลิงก์ข้ามภาษาโดยตั้งใจ — ห้ามเปลี่ยนเป็น LocaleLink (ตัวนั้นบังคับให้อยู่ในต้นไม้ภาษาเดิม)
            <a
              key={o.code}
              href={o.href}
              hrefLang={o.code}
              data-locale-switch={o.code}
              aria-current={current ? "true" : undefined}
              onClick={(e) => choose(o.code, e)}
              className={rowClass}
            >
              {body}
            </a>
          ) : (
            <button
              key={o.code}
              type="button"
              data-locale-switch={o.code}
              aria-current={current ? "true" : undefined}
              onClick={(e) => choose(o.code, e)}
              className={rowClass}
            >
              {body}
            </button>
          );
        })}
        {!hasTwin && (
          <p className="px-3 pb-2 pt-1 font-serif-th text-[11px] leading-relaxed text-muted">
            {isEn
              ? "This page is in Thai only — your choice applies to other pages."
              : "หน้านี้มีเฉพาะภาษาไทย — ภาษาที่เลือกจะใช้กับหน้าอื่น"}
          </p>
        )}
      </div>
    </details>
  );
}
