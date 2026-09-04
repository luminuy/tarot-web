import type { Metadata } from "next";

import TarotFlow from "./TarotFlow";
import { HomeSeoContent } from "@/components/seo/HomeSeoContent";
import { SITE_ORIGIN } from "@/lib/config/site";
import { generateFaqJsonLd, generateHowToJsonLd } from "@/data/home-seo";
import { getCardWebpSrcSet } from "@/lib/tarot/card-image";

/**
 * 🏠 เปลือกฝั่งเซิร์ฟเวอร์ของหน้าแรก
 * ---------------------------------------------------------------------------
 * มีไว้ 3 เหตุผล ซึ่งทำในไฟล์ "use client" ไม่ได้เลย:
 *
 * 1. **canonical ของหน้าแรก** — เดิม `alternates.canonical: "/"` ถูกวางไว้ที่ root layout
 *    Next.js สืบทอด metadata ลงทุกเส้นทางที่ไม่ได้ประกาศทับ ทำให้ /privacy /readers
 *    /account /reading/chat ทั้งหมดประกาศ canonical ชี้กลับหน้าแรก
 *    = บอก Google ว่าหน้าเหล่านั้นเป็นสำเนาของหน้าแรก ไม่ต้อง index (ยืนยันด้วย curl แล้ว)
 *
 * 2. **JSON-LD ที่เป็นความจริงเฉพาะหน้าแรก** — WebApplication / FAQPage / HowTo
 *    เคยถูกยิงจาก root layout ลงทุกหน้ารวมถึง /cards/major-00 และ /blog/*
 *    ซึ่งไม่มีคำถาม-คำตอบชุดนั้นอยู่บนหน้าจริง (schema ไม่ตรงเนื้อหา = โดนลดความน่าเชื่อถือ)
 *    และยังซ้อนกับ FAQPage/HowTo ของหน้า blog กับ spreads ที่ประกาศของตัวเองอยู่แล้ว
 *
 * 3. **`HomeSeoContent` ได้เป็น Server Component** — บทความ SEO 800+ บรรทัด
 *    จึงไม่ถูกส่งไปเป็น JavaScript ให้เบราว์เซอร์ hydrate อีกต่อไป
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const faqJsonLd = generateFaqJsonLd();
const howToJsonLd = generateHowToJsonLd();

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "วิหารพยากรณ์ไพ่ทาโรต์ (Sacred Oracle Tarot)",
  url: SITE_ORIGIN,
  description:
    "เว็บดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite สับไพ่และเลือกจับไพ่ด้วยตนเอง พร้อมแม่หมอ AI และระบบความสุ่มโปร่งใส Provably-Fair SHA-256",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "THB",
  },
  inLanguage: "th",
};

/**
 * พรีโหลดภาพไพ่ LCP ของหน้าแรก
 * ⚠️ ต้องเป็น `imageSrcSet` + `imageSizes` ไม่ใช่ `href` ของขนาดเดียว
 * ของเดิมพรีโหลดไฟล์ w128 ตายตัว ซึ่งตรงเฉพาะจอ DPR 1 · มือถือ (DPR 2 ขึ้นไป)
 * เบราว์เซอร์เลือก w256 ตาม srcSet จริง ไฟล์ที่พรีโหลดมาจึงถูกทิ้งแล้วโหลดใหม่
 * และเดิมอยู่ที่ root layout จึงยิงบนทุกหน้า (/blog /cards /privacy) ที่ไม่มีภาพนี้เลย
 */
const heroCardSrcSet = getCardWebpSrcSet("major-19.jpg");

export default function Page() {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <TarotFlow seoContent={<HomeSeoContent />} />
    </>
  );
}
