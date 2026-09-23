import type { Metadata } from "next";
import { noindexAlternates } from "@/lib/config/site";

import "./admin-theme.css";

export const metadata: Metadata = {
  title: "แผงแอดมิน",
  robots: { index: false, follow: false, nocache: true },
  // A6-01: หน้า noindex ห้ามสืบทอด canonical/hreflang ของหน้าแรก (สัญญาณขัดกัน) — ตัดทิ้ง
  alternates: noindexAlternates(),
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * ธีมขาวมาตรฐานของแผงแอดมิน (admin-theme.css) ผูกกับคลาส `admin-shell`
     * ⚠️ ห้ามเป็น <main> — หน้าลูก (page.tsx · login) มี <main> ของตัวเองอยู่แล้ว
     *    เดิมเป็น <main> ซ้อน <main> ซึ่งผิดหลัก landmark ของ screen reader
     */
    <div className="admin-shell min-h-screen text-ink font-sans antialiased">{children}</div>
  );
}
