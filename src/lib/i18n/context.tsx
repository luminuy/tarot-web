"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import type { Dictionary, Locale } from "./types";
import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, SUPPORTED_LOCALES } from "./types";
import { th } from "./dictionaries/th";
import { en } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = {
  th,
  en,
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  isThai: boolean;
  isEnglish: boolean;
  /** ภาษาที่ผู้ใช้เพิ่งกดเลือก — มีค่าทันทีที่กด ไม่ต้องรอ React render เสร็จ */
  pendingLocale: Locale | null;
  /** React กำลัง render ต้นไม้ภาษาใหม่อยู่หรือไม่ */
  isSwitchingLocale: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialClientLocale(initialLocale?: Locale): Locale {
  if (initialLocale && SUPPORTED_LOCALES.includes(initialLocale)) {
    return initialLocale;
  }

  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  try {
    // 1. Check URL query param e.g. ?lang=en
    const urlParams = new URLSearchParams(window.location.search);
    const queryLang = urlParams.get("lang");
    if (queryLang && (queryLang === "th" || queryLang === "en")) {
      return queryLang;
    }

    // 2. Check Cookie
    const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_KEY}=([^;]*)`));
    if (match && (match[1] === "th" || match[1] === "en")) {
      return match[1];
    }

    // 3. Check LocalStorage
    const saved = localStorage.getItem(LOCALE_COOKIE_KEY);
    if (saved && (saved === "th" || saved === "en")) {
      return saved;
    }

    // หมายเหตุ: ห้ามเดาภาษาจาก navigator.language แล้วสลับเป็นอังกฤษเองเด็ดขาด (INC-00xx)
    // ผู้ใช้ไทยจำนวนมากตั้งค่าเบราว์เซอร์/ระบบปฏิบัติการเป็น "en-US" อยู่แล้วทั้งที่อ่านไทย
    // การ fallback ตาม navigator.language ทำให้เว็บสลับเป็นอังกฤษเองโดยผู้ใช้ไม่ได้กด
    // ค่าเริ่มต้นต้องเป็นภาษาไทยเสมอ จนกว่าผู้ใช้จะเลือกเปลี่ยนเองอย่างชัดเจน (query/cookie/localStorage เท่านั้น)
  } catch {
    // Fallback on any error (e.g. storage disabled in strict private mode)
  }

  return DEFAULT_LOCALE;
}

export function LocaleProvider({
  children,
  forcedLocale,
}: {
  children: React.ReactNode;
  /**
   * ภาษาที่ถูก "ตรึง" ด้วยเส้นทาง URL — ส่งมาจาก root layout ของกลุ่ม `(en)` เท่านั้น
   *
   * ⚠️ ต้องเป็นค่าคงที่ที่เขียนตรง ๆ ในโค้ดเสมอ (`"en"`) ห้ามคำนวณจากคำขอเด็ดขาด
   * ถ้าค่านี้มาจาก `headers()`/`cookies()` เมื่อไร ทุกหน้าจะกลายเป็น dynamic ทันที (INC-0091)
   *
   * เมื่อถูกตรึง: ไม่ตรวจ cookie/localStorage/`?lang=` เลย และการกดปุ่มสลับภาษา
   * จะ **ไม่เปลี่ยน state ในหน้านี้** — `LanguageSwitcher` มีหน้าที่พาไปยัง URL ฝาแฝดแทน
   */
  forcedLocale?: Locale;
}) {
  // ⚠️ ต้องเริ่มที่ค่าเดียวกับที่ฝั่งเซิร์ฟเวอร์ prerender ไว้เสมอ (ไทย) ห้ามตรวจ cookie
  // ตั้งแต่ initializer เด็ดขาด — เพราะ root layout เป็น static แล้ว (ดูหมายเหตุใน
  // `src/app/layout.tsx`) HTML ที่ส่งมาจึงเป็นภาษาไทยเสมอ ถ้า client render รอบแรก
  // ออกมาเป็นอังกฤษจะเกิด hydration mismatch ทั้งหน้า
  // การตรวจภาษาจริงย้ายไปทำใน useEffect ด้านล่าง (หลัง mount) แทน
  const [detectedLocale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const locale: Locale = forcedLocale ?? detectedLocale;
  const [isPending, startTransition] = useTransition();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale)) return;

    // ⚠️ ต้องตั้งค่านี้ "นอก" startTransition เท่านั้น (ISSUE-025)
    // นี่คือ urgent update ที่ทำให้ปุ่มไฮไลต์ทันทีในเฟรมถัดไป
    // ผู้ใช้ต้องเห็นว่าระบบรับคำสั่งแล้ว ไม่ใช่รอ 353ms+ แบบไม่มีสัญญาณอะไรเลย
    setPendingLocale(nextLocale);

    // เมื่อภาษาถูกตรึงด้วย URL (`/en/**`) การเปลี่ยน state ที่นี่จะทำให้เนื้อหาไม่ตรงกับ
    // เส้นทางที่ผู้ใช้ยืนอยู่ · หน้าที่พาไปยัง URL ฝาแฝดเป็นของ `LanguageSwitcher`
    if (!forcedLocale) {
      startTransition(() => {
        setLocaleState(nextLocale);
      });
    }

    try {
      // 1. Write Cookie (1 year duration, Lax)
      document.cookie = `${LOCALE_COOKIE_KEY}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

      // 2. Write LocalStorage
      localStorage.setItem(LOCALE_COOKIE_KEY, nextLocale);

      // 3. Update HTML lang tag
      if (typeof document !== "undefined") {
        document.documentElement.lang = nextLocale;
      }
    } catch {
      // Ignore storage restrictions
    }
  }, [forcedLocale]);

  // ตรวจภาษาที่ผู้ใช้เลือกไว้ "หลัง mount" (query `?lang=` → cookie → localStorage)
  // แล้วค่อยสลับ — รอบแรกจึงตรงกับ HTML ที่ prerender มาเสมอ ไม่เกิด hydration mismatch
  // ผู้ใช้ภาษาอังกฤษจะเห็นไทยแวบหนึ่งก่อนสลับ ซึ่งเป็นราคาที่จ่ายเพื่อให้ทั้งเว็บเป็น
  // static prerender ได้ (แลกมากับการที่ทุกหน้าแคชที่ edge ได้จริง)
  useEffect(() => {
    if (forcedLocale) return;
    const detected = getInitialClientLocale();
    if (detected !== locale) {
      setLocaleState(detected);
    }

    // จำภาษาที่มากับ `?lang=` ลง cookie/localStorage ให้ด้วย
    // เดิมงานนี้เป็นของ `src/proxy.ts` (middleware) ซึ่งถูกถอดออกแล้ว เพราะมันทำให้
    // ทุกหน้าเสียโอกาส prerender และไม่มีใครอ่าน header `x-locale` ที่มันฉีดอีกต่อไป
    // ถ้าไม่จำไว้ ผู้ใช้ที่เข้ามาด้วย `?lang=en` จะกลับเป็นไทยทันทีที่กดไปหน้าถัดไป
    try {
      const queryLang = new URLSearchParams(window.location.search).get("lang");
      if (queryLang === "th" || queryLang === "en") {
        document.cookie = `${LOCALE_COOKIE_KEY}=${queryLang}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `locale=${queryLang}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem(LOCALE_COOKIE_KEY, queryLang);
      }
    } catch {
      // เบราว์เซอร์บล็อกที่เก็บข้อมูล (โหมดส่วนตัวแบบเข้ม) — ข้ามไป ไม่ใช่เรื่องคอขาดบาดตาย
    }
    // ตั้งใจให้รันครั้งเดียวตอน mount — ไม่ผูกกับ locale เพื่อไม่ให้ย้อนค่าที่ผู้ใช้เพิ่งกดเลือก
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เคลียร์สถานะรอเมื่อ locale จริงตามมาทันแล้ว
  useEffect(() => {
    if (pendingLocale === locale) {
      setPendingLocale(null);
    }
  }, [pendingLocale, locale]);

  useEffect(() => {
    // Synchronize HTML lang attribute on mount or change
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale] || th,
      isThai: locale === "th",
      isEnglish: locale === "en",
      pendingLocale,
      isSwitchingLocale: isPending,
    }),
    [locale, setLocale, pendingLocale, isPending]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    // Return a graceful default if used outside Provider
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: th,
      isThai: true,
      isEnglish: false,
      pendingLocale: null,
      isSwitchingLocale: false,
    };
  }
  return context;
}

/**
 * @public (D-02)
 * Hook to retrieve the current dictionary directly.
 * Convenient shorthand for `useLocale().t` for client components.
 */
export function useDictionary(): Dictionary {
  return useLocale().t;
}

