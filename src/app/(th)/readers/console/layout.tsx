import type { Metadata } from "next";
import { noindexAlternates } from "@/lib/config/site";

/**
 * หน้าในกลุ่มนี้เป็น Client Component จึง `export const metadata` เองไม่ได้
 * จึงต้องประกาศผ่าน layout — และต้องประกาศจริง ไม่ใช่พึ่ง robots.txt อย่างเดียว
 * เพราะ URL ที่ถูกกันไม่ให้คลาน บอตจะ "มองไม่เห็น" คำสั่ง noindex แล้วยังโผล่ใน SERP ได้
 */
export const metadata: Metadata = {
  title: "แผงคิวของแม่หมอ",
  robots: { index: false, follow: false },
  // A6-01: หน้า noindex ห้ามสืบทอด canonical/hreflang ของหน้าแรก (สัญญาณขัดกัน) — ตัดทิ้ง
  alternates: noindexAlternates(),
};

export default function ReaderConsoleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
