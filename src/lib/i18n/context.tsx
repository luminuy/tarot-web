"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
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

    // 4. Browser language fallback
    if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en")) {
      return "en";
    }
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
  const [, startTransition] = useTransition();

  const setLocale = (nextLocale: Locale) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale)) return;

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
  };

  useEffect(() => {
    // Synchronize HTML lang attribute on mount or change
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value: LocaleContextValue = {
    locale,
    setLocale,
    t: dictionaries[locale] || th,
    isThai: locale === "th",
    isEnglish: locale === "en",
  };

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
    };
  }
  return context;
}

export function useDictionary(): Dictionary {
  return useLocale().t;
}
