import type { Metadata } from "next";
import { noindexAlternates } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "แผงแอดมิน",
  robots: { index: false, follow: false, nocache: true },
  // A6-01: หน้า noindex ห้ามสืบทอด canonical/hreflang ของหน้าแรก (สัญญาณขัดกัน) — ตัดทิ้ง
  alternates: noindexAlternates(),
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink font-sans selection:bg-gold/25 antialiased">
      {children}
    </main>
  );
}
