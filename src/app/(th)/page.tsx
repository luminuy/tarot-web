import type { Metadata } from "next";

import { buildHomeMetadata, HomePageBody } from "../_shared/pages/home";

/**
 * 🏠 หน้าแรกฉบับภาษาไทย (`/`)
 *
 * เนื้อหน้าอยู่ใน `src/app/_shared/pages/home.tsx` เพื่อให้ `/en` ใช้ร่วมกันได้
 * ไฟล์นี้มีหน้าที่เดียวคือ "บอกว่าเส้นทางนี้คือภาษาอะไร" ด้วยค่าคงที่ที่เขียนตรง ๆ
 *
 * ⚠️ ห้ามเรียก `getServerLocale()` หรือ dynamic API ใด ๆ ที่นี่ (INC-0091)
 * หน้าแรกต้อง prerender ได้เสมอ
 */
export const metadata: Metadata = buildHomeMetadata("th");

export default function Page() {
  return <HomePageBody locale="th" />;
}
