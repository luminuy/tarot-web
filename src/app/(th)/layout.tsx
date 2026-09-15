import type { Metadata, Viewport } from "next";

import "../globals.css";
import { RootHtml } from "../_shared/RootHtml";
import {
  GOOGLE_SITE_VERIFICATION,
  ROOT_KEYWORDS,
  ROOT_SHARED_METADATA,
  SITE_ICONS,
  SITE_VIEWPORT,
  TITLE_TEMPLATE,
} from "../_shared/root-metadata";
import { buildAlternates, OG_IMAGE_ALT, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";

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
    default: "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ ออนไลน์ ฟรี · เปิดไพ่กับแม่หมอ AI",
    template: TITLE_TEMPLATE,
  },
  description:
    "ดูดวงไพ่ยิปซี (ไพ่ทาโรต์) ออนไลน์ฟรี สับไพ่และหยิบไพ่ด้วยมือคุณเอง 78 ใบ ให้แม่หมอ AI ทำนายสดทีละใบ มีผัง 25 แบบ ทั้งรายวัน ความรัก การงาน การเงิน",
  keywords: ROOT_KEYWORDS.th,
  ...ROOT_SHARED_METADATA,
  icons: SITE_ICONS,
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
  },
  alternates: buildAlternates("/", { locale: "th", englishTwin: true }),
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "SeerTarot",
    title: "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ ออนไลน์ ฟรี · เปิดไพ่กับแม่หมอ AI",
    description:
      "สับไพ่และเลือกหยิบไพ่ 78 ใบด้วยมือคุณเอง ให้แม่หมอ AI พยากรณ์ลึกซึ้งทีละใบ พร้อมหลักฐานความโปร่งใส Provably-Fair",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ ออนไลน์ ฟรี · เปิดไพ่กับแม่หมอ AI",
    description: "ดูดวงไพ่ทาโรต์ออนไลน์ สับไพ่และเลือกหยิบไพ่ด้วยมือคุณเอง พร้อมระบบ Provably-Fair",
    images: [OG_IMAGE_URL],
  },
};

export const viewport: Viewport = SITE_VIEWPORT;

export default function ThaiRootLayout({ children }: { children: React.ReactNode }) {
  // pinLocale = false โดยตั้งใจ — หลายหน้าในต้นไม้นี้ยังไม่มีฝาแฝดอังกฤษ (`/blog`, `/privacy`)
  // ผู้ใช้จึงต้องสลับภาษาด้วย cookie ที่หน้าเหล่านั้นได้เหมือนเดิม
  return <RootHtml locale="th">{children}</RootHtml>;
}
