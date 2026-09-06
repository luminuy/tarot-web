import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * หน้าส่วนตัวของผู้ใช้ — ต้อง noindex ระดับ layout เพื่อไม่ให้ sub-routes ใดๆ หลุดเข้าสู่ search engine
 * และต้องประกาศจริง ไม่ใช่พึ่ง robots.txt อย่างเดียว (S-03)
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter spacing="tight" />
    </>
  );
}
