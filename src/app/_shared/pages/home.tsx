import type { Metadata } from "next";

import TarotFlow from "@/components/home/TarotFlow";
import { HomeSeoContent } from "@/components/seo/HomeSeoContent";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { generateFaqJsonLd, generateHowToJsonLd } from "@/data/home-seo";
import { getCardWebpSrcSet } from "@/lib/tarot/card-image";
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
  return {
    alternates: buildAlternates("/", { locale, englishTwin: true }),
  };
}

/**
 * พรีโหลดภาพไพ่ LCP ของหน้าแรก
 * ⚠️ ต้องเป็น `imageSrcSet` + `imageSizes` ไม่ใช่ `href` ของขนาดเดียว
 * ของเดิมพรีโหลดไฟล์ w128 ตายตัว ซึ่งตรงเฉพาะจอ DPR 1 · มือถือ (DPR 2 ขึ้นไป)
 * เบราว์เซอร์เลือก w256 ตาม srcSet จริง ไฟล์ที่พรีโหลดมาจึงถูกทิ้งแล้วโหลดใหม่
 */
const heroCardSrcSet = getCardWebpSrcSet("major-19.jpg");

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
      <link
        rel="preload"
        as="image"
        type="image/webp"
        fetchPriority="high"
        imageSrcSet={heroCardSrcSet ?? undefined}
        imageSizes="68px"
      />
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
