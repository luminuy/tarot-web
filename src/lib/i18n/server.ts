import { cookies, headers } from "next/headers";
import type { Dictionary, Locale } from "./types";
import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY } from "./types";
import { th } from "./dictionaries/th";
import { en } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = {
  th,
  en,
};

/**
 * ดึงภาษาสำหรับ Server Components จาก Header (x-locale จาก middleware) หรือ Cookie
 */
export async function getServerLocale(): Promise<Locale> {
  // 1. ลองอ่านจาก Header x-locale ที่ middleware ฉีดเข้ามา (ครอบคลุมทั้ง ?lang= และ cookie)
  try {
    const headerStore = await headers();
    const xLocale = headerStore.get("x-locale");
    if (xLocale === "th" || xLocale === "en") {
      return xLocale;
    }
  } catch {
    // กรณีที่เรียกนอก Server Request Lifecycle (เช่น static build prerender)
  }

  // 2. ลองอ่านจาก CookieStore โดยตรง
  try {
    const cookieStore = await cookies();
    const langCookie =
      cookieStore.get(LOCALE_COOKIE_KEY)?.value ||
      cookieStore.get("locale")?.value;
    if (langCookie === "th" || langCookie === "en") {
      return langCookie;
    }
  } catch {
    // กรณีที่เรียกนอก Server Request Lifecycle
  }

  return DEFAULT_LOCALE;
}

/**
 * ดึง Dictionary สำหรับ Server Components
 */
export async function getServerDictionary(): Promise<Dictionary> {
  const locale = await getServerLocale();
  return dictionaries[locale] || th;
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || th;
}
