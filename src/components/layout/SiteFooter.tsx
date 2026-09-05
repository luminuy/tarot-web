"use client";

import Link from "next/link";
import { CardImage } from "@/components/card/CardImage";
import { getFooterColumns } from "@/components/layout/nav-links";
import { useLocale } from "@/lib/i18n";

export interface SiteFooterProps {
  /** "default" = pt-16 sm:pt-20 (หน้าเนื้อหา) · "tight" = pt-10 sm:pt-12 (หน้ากฎหมาย/บัญชี) */
  spacing?: "default" | "tight";
}

/**
 * 🏛️ Fat Footer สไตล์ Quiet Luxury สีเข้ม (#171512) กลางของทั้งวิหารพยากรณ์
 * บรรจุลิงก์ภายใน, คำเตือน AI Disclosure, สายด่วน 1323/1669 หรือ 988/911, และ PDPA
 */
export function SiteFooter({ spacing = "default" }: SiteFooterProps) {
  const { isEnglish, t } = useLocale();
  const footerColumns = getFooterColumns(isEnglish);

  const paddingClass =
    spacing === "tight"
      ? "pt-10 sm:pt-12 pb-10 sm:pb-12"
      : "pt-16 sm:pt-20 pb-12 sm:pb-16";

  return (
    <footer className={`w-full bg-[#171512] text-[#D5CEC2] ${paddingClass} border-t border-[#D5CEC2]/30 relative overflow-hidden`}>
      {/* Ambient Gold Accent Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#A58A5C]/40 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 relative z-10">
        {/* Brand & Mission Statement — Generous Breathing Room */}
        <div className="flex flex-col items-center justify-center gap-3.5 border-b border-[#D5CEC2]/20 pb-8 sm:pb-10 pt-2 sm:pt-4 text-center">
          <Link
            href="/"
            aria-label={isEnglish ? "SeerTarot — Home" : "SeerTarot — หน้าแรก"}
            className="inline-flex items-center gap-3 group rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A58A5C]"
          >
            <span className="w-11 h-11 rounded-full border border-[#A58A5C]/40 overflow-hidden bg-[#F3F0EA] flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.webp"
                alt="SeerTarot"
                width={44}
                height={44}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </span>
            <span className="font-serif-th text-xl sm:text-2xl font-bold tracking-wider text-[#FAF7F2]">
              SeerTarot
            </span>
          </Link>
          <p className="font-serif-th text-xs sm:text-sm text-[#D5CEC2]/85 max-w-md leading-relaxed">
            {t.footer.brandMission}
          </p>
        </div>

        {/* AI Disclosure Card */}
        <div className="flex items-start gap-4 p-5 rounded-xl bg-[#1F1C18] border border-[#D5CEC2]/20 shadow-sm">
          <div className="w-9 h-13 sm:w-10 sm:h-15 rounded-lg overflow-hidden border border-[#D5CEC2]/30 flex-shrink-0 bg-[#171512]">
            <CardImage
              image="major-02.jpg"
              alt={isEnglish ? "The High Priestess - Reading Notice" : "The High Priestess - ข้อควรทราบเกี่ยวกับการทำนาย"}
              className="w-full h-full object-cover"
              sizes="40px"
            />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-[13px] font-bold text-[#A58A5C] uppercase tracking-wider font-serif-th">
              {isEnglish ? "Ethical Reading Notice & AI Disclosure" : "ข้อควรทราบเกี่ยวกับการทำนาย"}
            </h3>
            <p className="text-[13px] text-[#D5CEC2] leading-[1.7] font-serif-th">
              {t.footer.ethicalDisclaimer}
            </p>
          </div>
        </div>

        {/* 4-Column Internal Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {footerColumns.map((col, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="font-serif-th font-bold text-sm text-[#FAF7F2] tracking-wider uppercase border-b border-[#D5CEC2]/20 pb-2">
                {col.title}
              </h3>
              {"links" in col && col.links ? (
                <ul className="space-y-2 text-xs font-serif-th text-[#D5CEC2]/80">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link href={link.href} className="hover:text-[#FAF7F2] transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : "items" in col && col.items ? (
                <ul className="space-y-2 text-xs font-serif-th text-[#D5CEC2]/80">
                  {col.items.map((item, iIdx) => (
                    <li key={iIdx} className={iIdx > 1 ? "pt-1" : undefined}>
                      {"href" in item && item.href ? (
                        <Link href={item.href} className="hover:text-[#FAF7F2] transition-colors">
                          {item.title}
                        </Link>
                      ) : (
                        <>
                          <span className={`${"color" in item ? item.color : "text-[#A58A5C]"} font-semibold`}>{item.title}</span>
                          {"description" in item && item.description && (
                            <p className="text-[11px] text-[#D5CEC2]/60">{item.description}</p>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        {/* Bottom Copyright & Disclaimer Strip */}
        <div className="pt-8 border-t border-[#D5CEC2]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-serif-th text-[#D5CEC2]/70">
          <div className="flex items-center gap-2">
            <div className="w-5 h-7 rounded overflow-hidden border border-[#D5CEC2]/30 flex-shrink-0 bg-[#171512]">
              <CardImage image="major-01.jpg" alt="The Magician" className="w-full h-full object-cover" sizes="20px" />
            </div>
            <span>{isEnglish ? "SeerTarot · 1909 Rider-Waite Online Tarot Sanctuary" : "SeerTarot · วิหารพยากรณ์ไพ่ทาโรต์ 1909 Rider-Waite ออนไลน์"}</span>
          </div>
          <p className="text-center sm:text-right">
            {isEnglish ? "© 2026 SeerTarot · All rights reserved · " : "© 2026 SeerTarot · สงวนลิขสิทธิ์ · "}
            <Link href="/privacy" className="hover:text-[#FAF7F2] transition-colors underline">
              {isEnglish ? "Privacy Policy" : "นโยบายความเป็นส่วนตัว"}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
