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
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialClientLocale(initialLocale));
  const [isPending, startTransition] = useTransition();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale)) return;

    // ⚠️ ต้องตั้งค่านี้ "นอก" startTransition เท่านั้น (ISSUE-025)
    // นี่คือ urgent update ที่ทำให้ปุ่มไฮไลต์ทันทีในเฟรมถัดไป
    // ผู้ใช้ต้องเห็นว่าระบบรับคำสั่งแล้ว ไม่ใช่รอ 353ms+ แบบไม่มีสัญญาณอะไรเลย
    setPendingLocale(nextLocale);

    startTransition(() => {
      setLocaleState(nextLocale);
    });

    try {
      // 1. Write Cookie (1 year duration, Lax)
      document.cookie = `${LOCALE_COOKIE_KEY}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

      // 2. Write LocalStorage
      localStorage.setItem(LOCALE_COOKIE_KEY, nextLocale);

      // 3. Update HTML lang tag
      if (typeof document !== "undefined") {
        document.documentElement.lang = nextLocale;
      }
    } catch {
      // Ignore storage restrictions
    }
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

export function useDictionary(): Dictionary {
  return useLocale().t;
}
