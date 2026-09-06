import type { Metadata } from "next";

import { buildHomeMetadata, HomePageBody } from "../../_shared/pages/home";

/**
 * 🏠 หน้าแรกฉบับภาษาอังกฤษ (`/en`)
 *
 * ⚠️ ห้ามเรียก `getServerLocale()` หรือ dynamic API ใด ๆ ที่นี่ (INC-0091)
 */
export const metadata: Metadata = buildHomeMetadata("en");

export default function Page() {
  return <HomePageBody locale="en" />;
}
