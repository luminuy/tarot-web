import type { Metadata, Viewport } from "next";

import "../globals.css";
import { RootHtml } from "../_shared/RootHtml";
import { buildAlternates, OG_IMAGE_ALT, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";

/**
 * 🇬🇧 root layout ของต้นไม้ภาษาอังกฤษ — ครอบทุก URL ใต้ `/en`
 *
 * เหตุผลที่ต้องเป็น root layout ตัวที่สอง (ไม่ใช่ layout ซ้อนธรรมดา):
 * มีแต่ root layout เท่านั้นที่ render `<html>` ได้ จึงเป็นทางเดียวที่จะได้
 * `<html lang="en">` ใน **HTML ดิบ** ตั้งแต่ไบต์แรก โดยไม่ต้องรอ JavaScript มาแก้ทีหลัง
 *
 * ⚠️ ห้ามเรียก `headers()` / `cookies()` / `getServerLocale()` ที่นี่เด็ดขาด (INC-0091)
 * ภาษามาจาก **path segment ตอน build** (`"en"` ที่เขียนตรง ๆ ข้างล่าง) ไม่ใช่จากคำขอ
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Free Online Tarot Reading With an AI Tarot Reader",
    template: "%s · SeerTarot",
  },
  description:
    "Free online tarot reading with the original 1909 Rider-Waite deck. Shuffle and draw all 78 cards yourself, then read a live AI interpretation.",
  keywords: [
    "free tarot reading",
    "online tarot",
    "tarot card meanings",
    "rider waite tarot",
    "AI tarot reader",
    "tarot spreads",
    "daily tarot",
    "love tarot reading",
    "78 tarot cards",
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
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
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
  alternates: buildAlternates("/", { locale: "en", englishTwin: true }),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SeerTarot",
    title: "Free Online Tarot Reading · Shuffle & Draw With an AI Tarot Reader",
    description:
      "Shuffle and draw all 78 Rider-Waite cards with your own hand, then read a live card-by-card interpretation — provably fair with SHA-256.",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online Tarot Reading · Shuffle & Draw With an AI Tarot Reader",
    description: "Draw all 78 Rider-Waite cards yourself and read a live, provably fair interpretation.",
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

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  // pinLocale = true — ทุกหน้าในต้นไม้นี้เป็นภาษาอังกฤษตามเส้นทาง ห้าม client สลับเอง
  // การกดปุ่มสลับภาษาจะพาไปยัง URL ฝาแฝดฝั่งไทยแทน (ดู LanguageSwitcher)
  return (
    <RootHtml locale="en" pinLocale>
      {children}
    </RootHtml>
  );
}
