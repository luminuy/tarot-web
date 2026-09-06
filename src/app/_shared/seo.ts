import { localizedUrl, OG_IMAGE_ALT, OG_IMAGE_URL } from "@/lib/config/site";
import type { Locale } from "@/lib/i18n/types";

/**
 * ตัวช่วย metadata ที่ใช้ร่วมกันทั้งสองภาษา — กันไม่ให้ OG/breadcrumb ของหน้าอังกฤษ
 * เผลอชี้กลับไปยัง URL ฝั่งไทย (ข้อผิดพลาดที่เกิดง่ายที่สุดตอนทำเว็บสองภาษา)
 */
export function buildOpenGraph(
  locale: Locale,
  { title, description, path }: { title: string; description: string; path: string },
) {
  return {
    title,
    description,
    url: localizedUrl(path, locale),
    siteName: "SeerTarot",
    type: "website" as const,
    locale: locale === "en" ? "en_US" : "th_TH",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  };
}

export interface Crumb {
  name: string;
  path: string;
}

/** BreadcrumbList JSON-LD ที่ทุกรายการชี้ไปยัง URL ของภาษาเดียวกันเสมอ */
export function buildBreadcrumbJsonLd(locale: Locale, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: localizedUrl(crumb.path, locale),
    })),
  };
}

/** ชื่อ "หน้าแรก" ของแต่ละภาษา — ใช้เป็นรายการแรกของ breadcrumb ทุกหน้า */
export function homeCrumb(locale: Locale): Crumb {
  return { name: locale === "en" ? "Home" : "หน้าแรก", path: "/" };
}
