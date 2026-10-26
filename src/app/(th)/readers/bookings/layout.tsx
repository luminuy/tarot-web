import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { noindexAlternates } from "@/lib/config/site";
import "@/styles/ui2-page.css";
import "@/styles/v3-consult.css";

/** หน้าส่วนตัวของลูกค้า — noindex เสมอ (เหมือน /readers/queue) และต้องมีหัว/ท้ายเว็บ (INC-0112) */
export const metadata: Metadata = {
  title: "นัดของฉัน",
  robots: { index: false, follow: false },
  alternates: noindexAlternates(),
};

export default function MyBookingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {/* UI 2.0 (เจ้าของ 2026-10-26): ท้องฟ้ากลางคืน + โทเคน `.ui2-pg` — หัวครีม/หน้าต่างครีมอยู่ในหน้า (ConsultUi2) */}
      <div className="ui2-pg" data-ui2-page-dark="">
        {children}
      </div>
      <SiteFooter spacing="tight" />
    </>
  );
}
