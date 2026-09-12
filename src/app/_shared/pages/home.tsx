import type { Metadata } from "next";

import TarotFlow from "@/components/home/TarotFlow";
import { HomeSeoContent } from "@/components/seo/HomeSeoContent";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { generateFaqJsonLd, generateHowToJsonLd } from "@/data/home-seo";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🏠 เนื้อหน้าแรก — ใช้ร่วมกันทั้งสองภาษา (`/` และ `/en`)
 * ---------------------------------------------------------------------------
 * โมดูลนี้อยู่ใน `_shared/` ซึ่งขึ้นต้นด้วย `_` จึงเป็น **private folder** ของ Next
 * ไม่กลายเป็น route เอง · หน้าที่ของ `page.tsx` ทั้งสองฝั่งคือเรียกฟังก์ชันในนี้
 * พร้อมค่า `locale` ที่เขียนตรง ๆ เท่านั้น
 *
 * ⚠️ ห้ามรับ locale จาก `headers()`/`cookies()` เด็ดขาด — ภาษาต้องมาจากเส้นทาง
 * ที่เขียนไว้ในโค้ดตอน build เท่านั้น ไม่งั้นทุกหน้าจะกลายเป็น dynamic (INC-0091)
 */
export function buildHomeMetadata(locale: Locale): Metadata {
  const isEnglish = locale === "en";
  const title = isEnglish
    ? "Free Online Tarot Readings with AI Reader · SeerTarot"
    : "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ ออนไลน์ ฟรี · เปิดไพ่กับแม่หมอ AI";
  const description = isEnglish
    ? "Free online 1909 Rider-Waite tarot readings. Shuffle and draw cards yourself, with an AI tarot reader and provably fair SHA-256 randomness."
    : "สับไพ่และเลือกหยิบไพ่ 78 ใบด้วยมือคุณเอง ให้แม่หมอ AI พยากรณ์ลึกซึ้งทีละใบ พร้อมหลักฐานความโปร่งใส Provably-Fair";

  const ogImages = buildPageOgImage({
    title: isEnglish ? "Online Rider-Waite Tarot Sanctuary" : "วิหารพยากรณ์ไพ่ทาโรต์ 1909",
    eyebrow: isEnglish ? "SACRED ORACLE TAROT" : "เปิดไพ่กับแม่หมอ AI",
    cardImage: "major-19.jpg",
    alt: title,
  });

  return {
    alternates: buildAlternates("/", { locale, englishTwin: true }),
    openGraph: {
      title,
      description,
      type: "website",
      locale: isEnglish ? "en_US" : "th_TH",
      siteName: "SeerTarot",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImages[0].url],
    },
  };
}

function buildWebAppJsonLd(locale: Locale) {
  const isEnglish = locale === "en";
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: isEnglish ? "SeerTarot — Online Rider-Waite Tarot Sanctuary" : "วิหารพยากรณ์ไพ่ทาโรต์ (Sacred Oracle Tarot)",
    url: localizedUrl("/", locale),
    description: isEnglish
      ? "Free online 1909 Rider-Waite tarot readings. Shuffle and draw the cards yourself, with an AI tarot reader and provably fair SHA-256 randomness."
      : "เว็บดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite สับไพ่และเลือกจับไพ่ด้วยตนเอง พร้อมแม่หมอ AI และระบบความสุ่มโปร่งใส Provably-Fair SHA-256",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: isEnglish ? "USD" : "THB",
    },
    inLanguage: locale,
  };
}

export function HomePageBody({ locale }: { locale: Locale }) {
  const isEnglish = locale === "en";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebAppJsonLd(locale)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFaqJsonLd(isEnglish)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateHowToJsonLd(isEnglish)) }}
      />
      <TarotFlow seoContent={<HomeSeoContent isEnglish={isEnglish} />} />
    </>
  );
}
