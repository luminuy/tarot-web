import type { Metadata, Viewport } from "next";
import { Noto_Serif_Thai, Sarabun } from "next/font/google";
import "./globals.css";
import { AssetWarmup } from "@/components/performance/AssetWarmup";
import { AppMotionProvider } from "@/components/providers/AppMotionProvider";
import { AntiTheftShield } from "@/components/security/AntiTheftShield";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { SITE_ORIGIN } from "@/lib/config/site";

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
    default: "SeerTarot ✦ ดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite กับแม่หมอ AI",
    template: "%s · SeerTarot",
  },
  description:
    "ดูดวงไพ่ทาโรต์ออนไลน์ สับไพ่และเลือกหยิบไพ่ด้วยมือคุณเอง 78 ใบ แล้วให้แม่หมอ AI พยากรณ์ลึกซึ้งทีละใบ พร้อมหลักฐานความโปร่งใส Provably-Fair SHA-256",
  keywords: [
    "SeerTarot",
    "ไพ่ทาโรต์",
    "ดูดวงออนไลน์",
    "เปิดไพ่",
    "ทาโรต์ฟรี",
    "แม่หมอ AI",
    "ดูดวงความรัก",
    "ดูดวงการงาน",
    "ไพ่ยิปซี",
    "1909 Rider-Waite",
    "Provably Fair Tarot",
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
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "SeerTarot",
    title: "SeerTarot ✦ ดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite กับแม่หมอ AI",
    description:
      "สับไพ่และเลือกหยิบไพ่ 78 ใบด้วยมือคุณเอง ให้แม่หมอ AI พยากรณ์ลึกซึ้งทีละใบ พร้อมหลักฐานความโปร่งใส Provably-Fair",
    url: SITE_ORIGIN,
    images: [
      {
        url: "/cards/major-01.jpg",
        width: 825,
        height: 1429,
        alt: "SeerTarot 1909 Rider-Waite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SeerTarot ✦ ดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite กับแม่หมอ AI",
    description: "ดูดวงไพ่ทาโรต์ออนไลน์ สับไพ่และเลือกหยิบไพ่ด้วยมือคุณเอง พร้อมระบบ Provably-Fair",
    images: ["/cards/major-01.jpg"],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "วิหารพยากรณ์ไพ่ทาโรต์ (Sacred Oracle Tarot)",
  url: SITE_ORIGIN,
  description: "เว็บดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite สับไพ่และเลือกจับไพ่ด้วยตนเอง พร้อมแม่หมอ AI และระบบความสุ่มโปร่งใส Provably-Fair SHA-256",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "THB",
  },
  inLanguage: "th",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SeerTarot Sanctuary",
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/cards/major-01.jpg`,
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${notoSerifThai.variable} ${sarabun.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
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
          <AntiTheftShield />
          <AssetWarmup />
          <AnalyticsTracker />
          {children}
        </AppMotionProvider>
      </body>
    </html>
  );
}
