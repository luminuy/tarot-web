"use client";

import { usePathname } from "next/navigation";

/**
 * ✦ TikTok Floating Action Button (FAB)
 *
 * แสดงปุ่มลอยมุมขวาล่างสำหรับเชื่อมต่อไปยังบัญชีทางการของแม่หมอ:
 * https://www.tiktok.com/@seerada.tarot
 *
 * - ใช้โลโก้แท้ทางการของ TikTok (3-Layer Chromatic Vector: Cyan #00F2EA / Red #FF004F / White #FFFFFF)
 * - รองรับทั้ง Desktop และ Mobile พร้อม Safe Area Inset สำหรับ iPhone
 * - มี Tooltip ขยายทางซ้ายอย่างนุ่มนวลเมื่อ Hover บนหน้าจอคอม
 * - Accessible: aria-label, rel="noopener noreferrer", focus-visible ring
 */
export function TikTokFloatingButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <aside
      data-floating="true"
      aria-label="ช่องทางติดตาม TikTok"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none print:hidden pointer-events-auto"
      style={{
        position: "fixed",
        bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
        right: "calc(1.25rem + env(safe-area-inset-right, 0px))",
        zIndex: 40,
      }}
    >
      <a
        href="https://www.tiktok.com/@seerada.tarot"
        target="_blank"
        rel="noopener noreferrer"
        title="ติดตามแม่หมอ Seerada บน TikTok (@seerada.tarot)"
        aria-label="ติดตามแม่หมอ Seerada บน TikTok (@seerada.tarot)"
        className="group flex items-center gap-2.5 rounded-full p-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F2EA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2]"
      >
        {/* Tooltip Pill บน Desktop (จะเลื่อนโผล่มาเมื่อ Hover) */}
        <span
          aria-hidden="true"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#110E1B]/90 backdrop-blur-md border border-white/15 text-[#F3F0EA] text-xs font-serif-th font-semibold shadow-lg opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap"
        >
          <span className="text-[#00F2EA]">✦</span>
          <span>ติดตามแม่หมอ</span>
          <span className="text-white/70">@seerada.tarot</span>
        </span>

        {/* ปุ่มวงกลมหลักสีดำพรีเมียม พร้อมเงาลึกและเส้นขอบ */}
        <div className="relative w-[52px] h-[52px] sm:w-14 sm:h-14 rounded-full bg-[#050507] border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.5)] group-hover:shadow-[0_10px_30px_rgba(0,242,234,0.3)] group-hover:border-[#00F2EA]/60 group-hover:scale-108 active:scale-95 transition-all duration-300 flex items-center justify-center shrink-0">
          {/* Subtle Outer Ambient Glow */}
          <div
            aria-hidden="true"
            className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-[#FF004F]/20 to-[#00F2EA]/20 blur-xs opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none"
          />

          {/* Official TikTok Vector Logo (Layered Anaglyph Glyph) */}
          <svg
            className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:rotate-6"
            viewBox="0 0 258 292"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Red / Magenta Glitch Layer */}
            <path
              fill="#FF004F"
              d="M191.102,105.182c18.814,13.442,41.862,21.351,66.755,21.351V78.656c-4.711,0.001-9.41-0.49-14.019-1.466v37.686c-24.891,0-47.936-7.909-66.755-21.35v97.703c0,48.876-39.642,88.495-88.54,88.495c-18.245,0-35.203-5.513-49.29-14.968c16.078,16.431,38.5,26.624,63.306,26.624c48.901,0,88.545-39.619,88.545-88.497v-97.701H191.102z M208.396,56.88c-9.615-10.499-15.928-24.067-17.294-39.067v-6.158h-13.285C181.161,30.72,192.567,47.008,208.396,56.88L208.396,56.88z M70.181,227.25c-5.372-7.04-8.275-15.652-8.262-24.507c0-22.354,18.132-40.479,40.502-40.479c4.169-0.001,8.313,0.637,12.286,1.897v-48.947c-4.643-0.636-9.329-0.906-14.013-0.807v38.098c-3.976-1.26-8.122-1.9-12.292-1.896c-22.37,0-40.501,18.123-40.501,40.48C47.901,206.897,56.964,220.583,70.181,227.25z"
            />
            {/* Cyan / Turquoise Glitch Layer */}
            <path
              fill="#00F2EA"
              d="M243.838,77.189V66.999c-12.529,0.019-24.812-3.488-35.442-10.12C217.806,67.176,230.197,74.276,243.838,77.189z M177.817,11.655c-0.319-1.822-0.564-3.656-0.734-5.497V0h-48.182v191.228c-0.077,22.29-18.177,40.341-40.501,40.341c-6.554,0-12.742-1.555-18.222-4.318c7.401,9.707,19.087,15.973,32.241,15.973c22.32,0,40.424-18.049,40.502-40.342V11.655H177.817z M100.694,114.408V103.56c-4.026-0.55-8.085-0.826-12.149-0.824C39.642,102.735,0,142.356,0,191.228c0,30.64,15.58,57.643,39.255,73.527c-15.615-15.953-25.236-37.789-25.236-61.874C14.019,154.632,52.653,115.4,100.694,114.408z"
            />
            {/* White Silhouette Layer */}
            <path
              fill="#FFFFFF"
              d="M177.083,93.525c18.819,13.441,41.864,21.35,66.755,21.35V77.189c-13.894-2.958-26.194-10.215-35.442-20.309c-15.83-9.873-27.235-26.161-30.579-45.225h-34.896v191.226c-0.079,22.293-18.18,40.344-40.502,40.344c-13.154,0-24.84-6.267-32.241-15.975c-13.216-6.667-22.279-20.354-22.279-36.16c0-22.355,18.131-40.48,40.501-40.48c4.286,0,8.417,0.667,12.292,1.896v-38.098c-48.039,0.992-86.674,40.224-86.674,88.474c0,24.086,9.621,45.921,25.236,61.875c14.087,9.454,31.045,14.968,49.29,14.968c48.899,0,88.54-39.621,88.54-88.496V93.525L177.083,93.525z"
            />
          </svg>
        </div>
      </a>
    </aside>
  );
}
