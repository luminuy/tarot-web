import type { ReactNode } from "react";
import Link from "next/link";
import { SacredNavDropdown } from "@/components/ui/SacredNavDropdown";

export interface SiteHeaderProps {
  /**
   * "content" = หน้าเนื้อหาทั่วไป (โลโก้ + breadcrumb + เมนู) — ค่าเริ่มต้น
   * "app"     = หน้าดูดวงหลัก (มีช่อง toolbar สำหรับ UserProfileBadge / ปุ่มรีเซ็ต)
   */
  variant?: "content" | "app";
  /** breadcrumb ของหน้านั้น — ส่งเป็น ReactNode เพื่อให้แต่ละหน้าควบคุมเนื้อหาเอง */
  breadcrumb?: ReactNode;
  /** ปุ่มเพิ่มเติมฝั่งขวา (เฉพาะ variant="app" หรือหน้าที่ต้องการปุ่มพิเศษ) */
  toolbar?: ReactNode;
  /** เมนู dropdown — ส่งเข้ามาเพื่อให้หน้าแรกส่ง callback ได้ หน้าเนื้อหาส่ง <SacredNavDropdown /> เปล่า */
  nav?: ReactNode;
}

/**
 * 🏛️ Header กลางของทั้งวิหารพยากรณ์ (Server Component)
 * ยึดการแสดงผล โลโก้ และเมนูแบบสากล Sticky Top-0 เหมือนกันทั้ง 128 หน้า
 */
export function SiteHeader({
  variant = "content",
  breadcrumb,
  toolbar,
  nav,
}: SiteHeaderProps) {
  return (
    <header
      data-site-header=""
      data-variant={variant}
      className="w-full border-b border-[#D5CEC2] bg-[#FFFFFF] sticky top-0 z-50 shadow-[var(--shadow-raised)]"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Luxury Brand Logo & Return to Home */}
        <Link
          href="/"
          aria-label="ดูดวงไพ่ทาโรต์ — กลับหน้าแรก"
          className="flex min-w-0 shrink items-center gap-2.5 sm:gap-3.5 cursor-pointer group select-none rounded-lg p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A58A5C]"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#D5CEC2] overflow-hidden relative flex-shrink-0 bg-[#F3F0EA] group-hover:scale-105 transition-all duration-300">
            <img
              src="/logo.webp"
              alt="SeerTarot"
              width={44}
              height={44}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          <div className="hidden min-w-0 flex-col justify-center sm:flex">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="text-[#A58A5C] text-xs">✦</span>
              <span className="font-serif-th text-sm sm:text-lg font-bold text-[#29261F] tracking-wide leading-snug py-0.5 whitespace-nowrap">
                ดูดวงไพ่ทาโรต์
              </span>
            </div>
            <span className="hidden sm:block text-[13px] tracking-[0.22em] text-[#635B4E] font-mono uppercase font-semibold pl-4">
              1909 RIDER-WAITE TAROT
            </span>
          </div>
        </Link>

        {/* Right Toolbar & Navigation */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {toolbar}
          {nav ?? <SacredNavDropdown />}
        </div>
      </div>

      {breadcrumb ? (
        <div className="max-w-6xl mx-auto px-4 pb-2.5 -mt-0.5">{breadcrumb}</div>
      ) : null}
    </header>
  );
}
