import type { ReactNode } from "react";

import { AssetWarmup } from "@/components/performance/AssetWarmup";
import { AntiTheftShield } from "@/components/security/AntiTheftShield";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { TikTokFloatingButton } from "@/components/ui/TikTokFloatingButton";
import { LocaleProvider } from "@/lib/i18n";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { BRAND_SOCIAL_PROFILES, DEFAULT_SUPPORT_EMAIL, SITE_ORIGIN } from "@/lib/config/site";
import type { Locale } from "@/lib/i18n/types";

import { fontVariables } from "./fonts";
import { buildSpeculationRules } from "./speculation-rules";
import { SkipToContent } from "@/components/layout/SkipToContent";

/**
 * 🏛️ โครง `<html>` ของทั้งเว็บ — ใช้ร่วมกันโดย root layout ทั้งสองภาษา
 * ---------------------------------------------------------------------------
 * `src/app/(th)/layout.tsx` เรียกด้วย `locale="th"` · `src/app/(en)/layout.tsx` เรียกด้วย `locale="en"`
 * ทั้งสองค่าเป็น **ค่าคงที่ที่เขียนตรง ๆ ในโค้ด** ไม่ได้มาจากคำขอ จึง prerender ได้ทั้งคู่
 *
 * ⚠️ ห้ามเรียก `headers()` / `cookies()` / `getServerLocale()` ในไฟล์นี้เด็ดขาด (INC-0091)
 * -------------------------------------------------------------------------------
 * ไฟล์นี้ถูก render โดย root layout ซึ่งครอบทุกหน้าในเว็บ การแตะ dynamic API ที่นี่
 * ทำให้ **ทุก route กลายเป็น ƒ Dynamic ทั้งเว็บ** — วัดจริงเมื่อ 2026-09-06:
 * prerender ได้ 0 หน้า และ Next ตอบ `cache-control: private, no-cache, no-store` ทุกหน้า
 * → `enableCacheInterception` ของ OpenNext ไม่มีหน้า prerender ให้ seed ลง KV เลย
 *
 * ภาษาถูกตัดสินจาก **path segment ตอน build** (`/` = ไทย · `/en/...` = อังกฤษ)
 * ไม่ใช่จาก request — จึงได้ทั้ง SEO สองภาษาและ SSG 100% พร้อมกัน
 */
export function RootHtml({
  locale,
  pinLocale = false,
  children,
}: {
  locale: Locale;
  /**
   * `true` = ภาษาถูกตรึงด้วย URL ห้าม client สลับเอง (ใช้กับต้นไม้ `/en/**`)
   * `false` = HTML ที่ prerender เป็นภาษานี้ แต่ผู้ใช้ยังสลับด้วย cookie ได้เหมือนเดิม
   *           (ใช้กับต้นไม้ไทย เพราะหลายหน้ายังไม่มีฝาแฝดอังกฤษ เช่น `/blog` `/privacy`)
   */
  pinLocale?: boolean;
  children: ReactNode;
}) {
  const isEnglish = locale === "en";

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SeerTarot Sanctuary",
    url: SITE_ORIGIN,
    // ต้องเป็นตราสัญลักษณ์จริง ไม่ใช่ภาพหน้าไพ่ (Google ใช้ช่องนี้แสดงโลโก้แบรนด์ใน Knowledge Panel)
    logo: {
      "@type": "ImageObject",
      url: `${SITE_ORIGIN}/icons/icon-512x512.png`,
      width: 512,
      height: 512,
    },
    /* sameAs = ช่องที่ Google/AI ใช้ผูก "เว็บนี้" เข้ากับ "บัญชีนั้น" ว่าเป็นเจ้าเดียวกัน
       เดิมมีแต่ลิงก์ repo บน GitHub ซึ่งไม่ได้บอกตัวตนของแบรนด์เลย
       เติมโปรไฟล์โซเชียลจริงจาก `BRAND_SOCIAL_PROFILES` (แหล่งความจริงเดียวกับปุ่มลอย TikTok) */
    sameAs: [...BRAND_SOCIAL_PROFILES, "https://github.com/luminuy/tarot-web"],
    /* ช่องทางติดต่อที่ใช้ได้จริง — Quality Rater Guidelines มองหา "ติดต่อใครได้"
       เป็นสัญญาณความน่าเชื่อถือหลักของเว็บที่ให้คำแนะนำเกี่ยวกับชีวิต
       ⚠️ ใส่ได้เฉพาะช่องทางที่ตรวจแล้วว่าส่งถึงจริง ห้ามใส่ที่อยู่/เบอร์ที่ไม่มีอยู่จริง */
    email: DEFAULT_SUPPORT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: DEFAULT_SUPPORT_EMAIL,
      availableLanguage: ["th", "en"],
    },
    description: isEnglish
      ? "A premium online 1909 Rider-Waite-Smith tarot sanctuary with a provably fair SHA-256 shuffle and an AI tarot reader."
      : "วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์ระดับพรีเมียม 1909 Rider-Waite-Smith พร้อมระบบสุ่มที่พิสูจน์ความยุติธรรมได้ (Provably Fair) และแม่หมอ AI",
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SeerTarot",
    alternateName: isEnglish ? "SeerTarot Sanctuary" : "วิหารพยากรณ์ไพ่ทาโรต์",
    url: isEnglish ? `${SITE_ORIGIN}/en` : SITE_ORIGIN,
    inLanguage: locale,
  };

  return (
    <html lang={locale} className={fontVariables}>
      <head>
        <meta charSet="utf-8" />
        {/* Preconnect & DNS-Prefetch ไปยัง AI Providers เพื่อลด Network Latency ทันที */}
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
        <link rel="preconnect" href="https://api.groq.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.groq.com" />

        {/* Speculation Rules API — อุ่นหน้าล่วงหน้าในเบราว์เซอร์
            ⚠️ กฎอยู่ที่ ./speculation-rules.ts ห้ามเขียนออบเจ็กต์ดิบตรงนี้ (ด่านที่ 38 บังคับ)
            ชั้นนี้ไม่สนใจ `prefetch={false}` ของ Next เลย จึงเป็นจุดที่คำขอรั่วได้เงียบที่สุด */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildSpeculationRules(isEnglish)),
          }}
        />

        {/* เฉพาะ schema ที่เป็นจริงกับ "ทุกหน้า" เท่านั้นที่อยู่ตรงนี้ได้
            WebApplication / FAQPage / HowTo เป็นความจริงเฉพาะหน้าแรก → อยู่ในหน้าแรกของแต่ละภาษา */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <LocaleProvider forcedLocale={pinLocale ? locale : undefined}>
          {/*
            ⏭️ ต้องเป็น element แรกสุดใน <body> เสมอ — ห้ามแทรกอะไรไว้ข้างหน้า
            ถ้าไปอยู่หลังสิ่งที่โฟกัสได้ มันก็ไม่ใช่ทางลัดอีกต่อไป (WCAG SC 2.4.1)
          */}
          <SkipToContent />
          <AntiTheftShield />
          <AssetWarmup />
          <ServiceWorkerRegister />
          <AnalyticsTracker />
          {children}
          <TikTokFloatingButton />
        </LocaleProvider>
      </body>
    </html>
  );
}
