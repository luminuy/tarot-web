import type { Metadata, Viewport } from "next";

import "../globals.css";
import { RootHtml } from "../_shared/RootHtml";
import {
  ROOT_ALTERNATES,
  ROOT_DESCRIPTION,
  ROOT_KEYWORDS,
  ROOT_OPEN_GRAPH,
  ROOT_SHARED_METADATA,
  ROOT_TITLE_DEFAULT,
  ROOT_TWITTER,
  SITE_ICONS,
  SITE_VIEWPORT,
  TITLE_TEMPLATE,
} from "../_shared/root-metadata";
import { SITE_ORIGIN } from "@/lib/config/site";

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
    default: ROOT_TITLE_DEFAULT.en,
    template: TITLE_TEMPLATE,
  },
  description: ROOT_DESCRIPTION.en,
  keywords: ROOT_KEYWORDS.en,
  ...ROOT_SHARED_METADATA,
  icons: SITE_ICONS,
  alternates: ROOT_ALTERNATES.en,
  openGraph: ROOT_OPEN_GRAPH.en,
  twitter: ROOT_TWITTER.en,
};

export const viewport: Viewport = SITE_VIEWPORT;

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  // pinLocale = true — ทุกหน้าในต้นไม้นี้เป็นภาษาอังกฤษตามเส้นทาง ห้าม client สลับเอง
  // การกดปุ่มสลับภาษาจะพาไปยัง URL ฝาแฝดฝั่งไทยแทน (ดู LanguageSwitcher)
  return (
    <RootHtml locale="en" pinLocale>
      {children}
    </RootHtml>
  );
}
