import type { Metadata, Viewport } from "next";

import "../globals.css";
import { RootHtml } from "../_shared/RootHtml";
import {
  GOOGLE_SITE_VERIFICATION,
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
 * 🇹🇭 root layout ของต้นไม้ภาษาไทย — ครอบทุก URL ที่ไม่ได้ขึ้นต้นด้วย `/en`
 *
 * `(th)` เป็น route group จึง **ไม่ปรากฏใน URL** — `/cards` ยังคงเป็น `/cards` เหมือนเดิม
 * ทุกเส้นทางไทยที่ติดอันดับอยู่แล้วจึงไม่ขยับแม้แต่เส้นเดียว ไม่ต้อง redirect อะไรทั้งสิ้น
 *
 * ⚠️ ห้ามเรียก `headers()` / `cookies()` / `getServerLocale()` ที่นี่เด็ดขาด (INC-0091)
 * เหตุผลเต็มอยู่ใน `src/app/_shared/RootHtml.tsx`
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: ROOT_TITLE_DEFAULT.th,
    template: TITLE_TEMPLATE,
  },
  description: ROOT_DESCRIPTION.th,
  keywords: ROOT_KEYWORDS.th,
  ...ROOT_SHARED_METADATA,
  icons: SITE_ICONS,
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
  },
  alternates: ROOT_ALTERNATES.th,
  openGraph: ROOT_OPEN_GRAPH.th,
  twitter: ROOT_TWITTER.th,
};

export const viewport: Viewport = SITE_VIEWPORT;

export default function ThaiRootLayout({ children }: { children: React.ReactNode }) {
  // pinLocale = false โดยตั้งใจ — หลายหน้าในต้นไม้นี้ยังไม่มีฝาแฝดอังกฤษ (`/blog`, `/privacy`)
  // ผู้ใช้จึงต้องสลับภาษาด้วย cookie ที่หน้าเหล่านั้นได้เหมือนเดิม
  return <RootHtml locale="th">{children}</RootHtml>;
}
