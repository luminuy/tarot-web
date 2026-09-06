import type { Metadata, Viewport } from "next";
import { Noto_Serif_Thai, Sarabun } from "next/font/google";
import "./globals.css";
import { AssetWarmup } from "@/components/performance/AssetWarmup";
import { AppMotionProvider } from "@/components/providers/AppMotionProvider";
import { AntiTheftShield } from "@/components/security/AntiTheftShield";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { TikTokFloatingButton } from "@/components/ui/TikTokFloatingButton";
import { LocaleProvider } from "@/lib/i18n";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { buildAlternates, OG_IMAGE_ALT, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";

const notoSerifThai = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-noto-serif-thai",
  adjustFontFallback: true,
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-sarabun",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ ออนไลน์ ฟรี · เปิดไพ่กับแม่หมอ AI",
    template: "%s · SeerTarot",
  },
  description:
    "ดูดวงไพ่ยิปซี (ไพ่ทาโรต์) ออนไลน์ฟรี สับไพ่และหยิบไพ่ด้วยมือคุณเอง 78 ใบ ให้แม่หมอ AI ทำนายสดทีละใบ มีผังยอดนิยม 25 แบบ ทั้งรายวัน รายเดือน ความรัก การงาน การเงิน ตรวจสอบความยุติธรรมได้จริงด้วย SHA-256",
  keywords: [
    "ดูดวงไพ่ยิปซี",
    "ไพ่ยิปซี",
    "เปิดไพ่ยิปซี",
    "ดูดวงไพ่ยิปซีฟรี",
    "ไพ่ยิปซีรายวัน",
    "ไพ่ยิปซีรายเดือน",
    "ไพ่ยิปซีความรัก",
    "ดูดวงไพ่ทาโรต์",
    "ไพ่ทาโรต์",
    "ความหมายไพ่ยิปซี 78 ใบ",
    "แม่หมอ AI",
    "SeerTarot",
  ],
  authors: [{ name: "SeerTarot Sanctuary" }],
  creator: "SeerTarot Sanctuary",
  publisher: "SeerTarot Sanctuary",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google2c921e9d8c8c3a55",
  },
  alternates: buildAlternates("/"),
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "SeerTarot",
    title: "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ ออนไลน์ ฟรี · เปิดไพ่กับแม่หมอ AI",
    description:
      "สับไพ่และเลือกหยิบไพ่ 78 ใบด้วยมือคุณเอง ให้แม่หมอ AI พยากรณ์ลึกซึ้งทีละใบ พร้อมหลักฐานความโปร่งใส Provably-Fair",
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ ออนไลน์ ฟรี · เปิดไพ่กับแม่หมอ AI",
    description: "ดูดวงไพ่ทาโรต์ออนไลน์ สับไพ่และเลือกหยิบไพ่ด้วยมือคุณเอง พร้อมระบบ Provably-Fair",
    images: [OG_IMAGE_URL],
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

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
  sameAs: ["https://github.com/luminuy/tarot-web"],
  description:
    "วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์ระดับพรีเมียม 1909 Rider-Waite-Smith พร้อมระบบสุ่มที่พิสูจน์ความยุติธรรมได้ (Provably Fair) และแม่หมอ AI",
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SeerTarot",
  alternateName: "วิหารพยากรณ์ไพ่ทาโรต์",
  url: SITE_ORIGIN,
  inLanguage: "th",
};

/**
 * ⚠️ ห้ามเรียก `headers()` / `cookies()` (เช่น `getServerLocale()`) ใน layout นี้เด็ดขาด
 * -------------------------------------------------------------------------------
 * root layout ครอบทุกหน้าในเว็บ การแตะ dynamic API ที่นี่ทำให้ **ทุก route กลายเป็น
 * ƒ Dynamic ทั้งเว็บ** — วัดจริงเมื่อ 2026-09-06: static 3 route · dynamic 92 route
 * ทั้งที่ `/cards/[id]`, `/blog/[slug]`, `/spreads/[id]` มี `generateStaticParams()` อยู่แล้ว
 *
 * ผลที่ตามมาคือ Next ตอบ `cache-control: private, no-cache, no-store` ทุกหน้า
 * → `enableCacheInterception` ของ OpenNext ไม่มีหน้า prerender ให้ seed ลง KV เลย
 * → Worker ต้อง boot Next runtime เต็มรูปแบบทุกคำขอ (ต้นเหตุที่เฟส 1 ลด Worker ไม่ได้จริง)
 *
 * ภาษาจึงถูกตัดสินฝั่ง client แทน: `LocaleProvider` อ่านลำดับ query `?lang=` → cookie →
 * localStorage เองหลัง mount และอัปเดต `document.documentElement.lang` ให้ด้วย
 * ค่า `lang="th"` ที่นี่เป็นค่าเริ่มต้นของ HTML ที่ prerender ไว้ (ภาษาหลักของเว็บ)
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${notoSerifThai.variable} ${sarabun.variable}`}>
      <head>
        <meta charSet="utf-8" />
        {/* Preconnect & DNS-Prefetch ไปยัง AI Providers เพื่อลด Network Latency ทันที */}
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
        <link rel="preconnect" href="https://api.groq.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.groq.com" />

        {/* Speculation Rules API — Prerender หน้ายอดนิยมล่วงหน้าเมื่อ hover/touch (0ms transition) */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  source: "list",
                  urls: ["/", "/cards", "/spreads", "/blog", "/daily"],
                  eagerness: "moderate",
                },
                {
                  where: {
                    and: [
                      { href_matches: "/*" },
                      { not: { href_matches: "/api/*" } },
                      { not: { href_matches: "/admin/*" } },
                      { not: { href_matches: "/account/*" } },
                      { not: { href_matches: "/readers/console*" } },
                      { not: { href_matches: "/readers/queue/*" } },
                    ],
                  },
                  eagerness: "conservative",
                },
              ],
              prefetch: [
                {
                  where: {
                    and: [
                      { href_matches: "/*" },
                      { not: { href_matches: "/api/*" } },
                      { not: { href_matches: "/admin/*" } },
                      { not: { href_matches: "/account/*" } },
                    ],
                  },
                  eagerness: "moderate",
                },
              ],
            }),
          }}
        />

        {/* เฉพาะ schema ที่เป็นจริงกับ "ทุกหน้า" เท่านั้นที่อยู่ตรงนี้ได้
            WebApplication / FAQPage / HowTo เป็นความจริงเฉพาะหน้าแรก → ย้ายไป src/app/page.tsx */}
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
        <AppMotionProvider>
          <LocaleProvider>
            <AntiTheftShield />
            <AssetWarmup />
            <ServiceWorkerRegister />
            <AnalyticsTracker />
            {children}
            <TikTokFloatingButton />
          </LocaleProvider>
        </AppMotionProvider>
      </body>
    </html>
  );
}
