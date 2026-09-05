import { cookies } from "next/headers";
import type { Dictionary, Locale } from "./types";
import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY } from "./types";
import { th } from "./dictionaries/th";
import { en } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = {
  th,
  en,
};

/**
 * ดึงภาษาสำหรับ Server Components จาก Cookie
 */
export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
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
