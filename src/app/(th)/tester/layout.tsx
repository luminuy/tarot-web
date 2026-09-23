import type { Metadata } from "next";
import { noindexAlternates } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "โหมดผู้ทดสอบ",
  robots: { index: false, follow: false, nocache: true },
  // A6-01: หน้า noindex ห้ามสืบทอด canonical/hreflang ของหน้าแรก (สัญญาณขัดกัน) — ตัดทิ้ง
  alternates: noindexAlternates(),
};

export default function TesterLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#05040a] text-[#f5deaa] font-sans selection:bg-[#ffd700]/30">
      {children}
    </main>
  );
}
