import type { Metadata } from "next";
import { noindexAlternates } from "@/lib/config/site";
import "@/styles/ui2-page.css";
import "@/styles/v3-consult.css";

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
  // UI 2.0 (เจ้าของ 2026-10-26): ท้องฟ้ากลางคืน + โทเคน `.ui2-pg` — หัวครีม/หน้าต่างครีมอยู่ในหน้า (ConsultUi2)
  return (
    <div className="ui2-pg" data-ui2-page-dark="">
      {children}
    </div>
  );
}
