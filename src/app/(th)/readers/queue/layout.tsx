import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * หน้าในกลุ่มนี้เป็น Client Component จึง `export const metadata` เองไม่ได้
 * จึงต้องประกาศผ่าน layout — และต้องประกาศจริง ไม่ใช่พึ่ง robots.txt อย่างเดียว
 * เพราะ URL ที่ถูกกันไม่ให้คลาน บอตจะ "มองไม่เห็น" คำสั่ง noindex แล้วยังโผล่ใน SERP ได้
 *
 * ⚠️ ต้องมี <SiteHeader /> และ <SiteFooter /> ด้วยเสมอ (INC-0112)
 * นี่คือหน้าของ "ลูกค้า" ที่รอคิวแม่หมอ ไม่ใช่หน้าหลังบ้านของแม่หมอ (`/readers/console`)
 * ผู้ใช้เปิดค้างไว้นานระหว่างรอคิว จึงต้องมีทางกลับเข้าเว็บให้ครบเหมือนหน้าอื่น
 */
export const metadata: Metadata = {
  title: "สถานะคิวของคุณ",
  robots: { index: false, follow: false },
};

export default function ReaderQueueLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter spacing="tight" />
    </>
  );
}
