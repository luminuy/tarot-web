import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { noindexAlternates } from "@/lib/config/site";

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
      {children}
      <SiteFooter spacing="tight" />
    </>
  );
}
