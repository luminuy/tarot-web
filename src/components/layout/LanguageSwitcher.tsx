"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useLocale } from "@/lib/i18n";
import { hasEnglishTwin, stripLocalePrefix } from "@/lib/i18n/paths";
import { soundManager } from "@/lib/utils/audio";

interface LanguageSwitcherProps {
  className?: string;
}

/**
 * 🌐 ปุ่มสลับภาษา — ต้อง "พาไปยัง URL ฝาแฝด" ไม่ใช่แค่สลับ state ในหน่วยความจำ
 * ---------------------------------------------------------------------------
 * ตั้งแต่แยกเส้นทางเป็น `/` (ไทย) และ `/en/...` (อังกฤษ) การเปลี่ยนแค่ state
 * จะทำให้เนื้อหาไม่ตรงกับ URL ที่ผู้ใช้ยืนอยู่ · canonical ของหน้าจะขัดกับสิ่งที่เห็น
 * และปุ่มย้อนกลับของเบราว์เซอร์จะพาไปผิดที่
 *
 * หน้าที่ยังไม่มีฝาแฝด (เช่น `/blog`) จะกลับไปใช้กลไกเดิม (สลับด้วย cookie ฝั่ง client)
 * ซึ่งดีกว่าพาผู้ใช้ไปชน 404
 */
export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, pendingLocale, isSwitchingLocale } = useLocale();
  const router = useRouter();
  const pathname = usePathname() || "/";

  // ภาษาที่ควรแสดงว่า "เลือกอยู่" — ใช้ค่าที่ผู้ใช้เพิ่งกดถ้ามี (ISSUE-025)
  const shownLocale = pendingLocale ?? locale;
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // แตะนอกรายการ / กด Esc ➔ พับรายการ (<details> ไม่ปิดเองเมื่อแตะที่อื่น)
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const el = detailsRef.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && detailsRef.current?.open) detailsRef.current.open = false;
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleSelect = (nextLocale: "th" | "en") => {
    if (detailsRef.current) detailsRef.current.open = false;
    if (nextLocale === shownLocale) return;
    try {
      soundManager.playMenuTapSound();
    } catch {
      // Audio optional
    }
    // เขียน cookie เสมอ เพื่อให้หน้าที่ไม่มีฝาแฝดจำภาษาที่เลือกไว้ได้
    setLocale(nextLocale);

    const basePath = stripLocalePrefix(pathname);
    if (!hasEnglishTwin(basePath)) return;

    const target =
      nextLocale === "en" ? (basePath === "/" ? "/en" : `/en${basePath}`) : basePath;
    if (target !== pathname) router.push(target);
  };

  const label = shownLocale === "en" ? "Language" : "ภาษา";

  /*
   * 🌐 ไอคอนลูกโลกแบบ Kazumi — แตะแล้วกางรายการ "ไทย / English"
   * ใช้ <details> ของเบราว์เซอร์ (เปิด/ปิดได้เองโดยไม่ต้องมี JS) เพราะหัวเว็บของหน้า Astro
   * เป็น HTML นิ่งไม่ hydrate · ปุ่ม `data-locale-switch` ยังเป็นตัวเดิมที่ `astro/scripts/site-header.ts` ผูกไว้
   * แตะนอกรายการแล้วปิด: React (หน้าแรก) ปิดในเอฟเฟกต์ด้านบน · หน้า Astro ปิดใน site-header.ts
   */
  return (
    <details ref={detailsRef} data-locale-menu="" className={`group/lang relative ${className}`}>
      <summary
        aria-label={label}
        title={label}
        aria-busy={isSwitchingLocale}
        className={`tap-overlay flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-ink transition-colors hover:bg-inset hover:text-gold-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold group-open/lang:bg-inset [&::-webkit-details-marker]:hidden ${
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
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      </summary>
      {/*
        ⚠️ ชื่อของตัวสลับภาษาต้องเป็น "ภาษาของหน้าที่กำลังอ่านอยู่" ไม่ใช่สองภาษาปนกัน (UX-17)
        ป้ายในรายการ "ไทย / English" เป็นชื่อภาษาตัวเอง (endonym) ตามมาตรฐานสากล — ไม่นับว่าปนภาษา
      */}
      <div
        role="group"
        aria-label={shownLocale === "en" ? "Language selector" : "สลับภาษา"}
        className="absolute right-0 top-full z-50 mt-1.5 flex min-w-[132px] flex-col rounded-xl border border-line bg-surface py-1.5 shadow-[0_12px_32px_-12px_rgba(42,38,31,0.35)]"
      >
        <button
          type="button"
          data-locale-switch="th"
          onClick={() => handleSelect("th")}
          aria-pressed={shownLocale === "th"}
          lang="th"
          className={`tap-overlay-y px-4 py-2 text-left font-serif-th text-sm transition-colors hover:bg-inset cursor-pointer ${
            shownLocale === "th" ? "font-bold text-gold-ink" : "text-ink"
          }`}
        >
          ไทย
        </button>
        <button
          type="button"
          data-locale-switch="en"
          onClick={() => handleSelect("en")}
          aria-pressed={shownLocale === "en"}
          lang="en"
          className={`tap-overlay-y px-4 py-2 text-left font-serif-th text-sm transition-colors hover:bg-inset cursor-pointer ${
            shownLocale === "en" ? "font-bold text-gold-ink" : "text-ink"
          }`}
        >
          English
        </button>
      </div>
    </details>
  );
}
