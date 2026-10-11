"use client";

// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { getFooterColumns } from "@/components/layout/nav-links";
import { useLocale } from "@/lib/i18n";
import { useEffect } from "react";
import { BRAND_SOCIAL_LINKS } from "@/lib/config/site";
import { installFooterAccordion } from "@/components/layout/footer-accordion";

export interface SiteFooterProps {
  /** "default" = pt-16 sm:pt-20 (หน้าเนื้อหา) · "tight" = pt-10 sm:pt-12 (หน้ากฎหมาย/บัญชี) */
  spacing?: "default" | "tight";
}

/**
 * 🏛️ Fat Footer สไตล์ Quiet Luxury สีเข้ม (#171512) กลางของทั้งวิหารพยากรณ์
 * บรรจุลิงก์ภายใน, ช่องทางทางการ, คำเตือน AI Disclosure, สายด่วน 1323/1669 หรือ 988/911, และ PDPA
 */
export function SiteFooter({ spacing = "default" }: SiteFooterProps) {
  const { isEnglish, t } = useLocale();
  const footerColumns = getFooterColumns(isEnglish);
  // หน้า Next / island ผูกตัวพับคอลัมน์เอง · หน้า Astro ที่ไม่ hydrate ใช้ `astro/scripts/site-chrome.ts` (ตัวเดียวกัน)
  useEffect(() => installFooterAccordion(), []);

  const paddingClass =
    spacing === "tight"
      ? "pt-10 sm:pt-12 pb-10 sm:pb-12"
      : "pt-16 sm:pt-20 pb-12 sm:pb-16";

  return (
    <footer
      className={`w-full bg-dark text-line ${paddingClass} border-t border-line/30 relative overflow-hidden`}
    >
      {/*
        ✦ ท้ายเว็บแบบมาตรฐาน (เจ้าของสั่ง 2026-10-10 "สวยและได้มาตรฐาน") — 4 ชั้นจากบนลงล่าง:
          1) แบรนด์ (ชิดซ้าย) + ช่องทางทางการเป็นไอคอน (ขวา)
          2) ลิงก์ 4 คอลัมน์ ตัวอักษรใหญ่ขึ้น (14px) ระยะบรรทัดโปร่ง
          3) ข้อควรทราบเป็นตัวพิมพ์เล็กบรรทัดเดียว (เดิมเป็นกล่องใหญ่มีภาพไพ่ แย่งสายตาจากลิงก์)
          4) แถบล่าง: ลิขสิทธิ์ซ้าย · ลิงก์นโยบายขวา (เรียงด้วย gap ไม่ใช้จุดคั่นที่ตัดบรรทัดแล้วค้างหัวบรรทัด)
        ⚠️ ท้ายเว็บอยู่ใน HTML ของทุกหน้า — งบ HTML (`/spreads/topic/love` ≤ 21 KB · `/cards/major-00` ≤ 18 KB) และงบ DOM หน้าแรก ≤ 1,500 ตึงมาก
           ไอคอนโซเชียลจึงเป็นไฟล์ SVG แยก (`public/icons/social/*` · แคชครั้งเดียว) วาดด้วยพื้นหลัง CSS ไม่ฝัง path ลงทุกหน้า · ถอดภาพไพ่ประดับ 2 ภาพออก
      */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12 relative z-10">
        {/* 1) แบรนด์ + ช่องทางทางการ */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-line/15 pb-8 sm:pb-10">
          <div className="space-y-3 max-w-md">
            <Link
              href="/"
              prefetch={false}
              aria-label={isEnglish ? "SeerTarot — Home" : "SeerTarot — หน้าแรก"}
              className="inline-flex items-center gap-3 group rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
            >
              <img
                src="/logo.webp"
                alt="SeerTarot"
                width={44}
                height={44}
                className="w-11 h-11 rounded-full border border-gold/40 bg-canvas object-cover flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <span className="font-serif-th text-xl sm:text-2xl font-bold tracking-wider text-surface-warm">SeerTarot</span>
            </Link>
            <p className="font-serif-th text-sm text-line/80 leading-relaxed">{t.footer.brandMission}</p>
          </div>
          {/* ช่องทางทางการ — ไอคอนวาดด้วย CSS (`.footer-social--*` ใน globals.css) · ชื่อช่องทางอยู่ใน aria-label/title */}
          <div className="flex items-center gap-3">
            <span className="font-serif-th text-xs text-line/60">{isEnglish ? "Follow us" : "ติดตามเรา"}</span>
            {BRAND_SOCIAL_LINKS.map((social) => {
              // หน้าอังกฤษใช้ชื่อช่องทางล้วน — ชื่อเพจ Facebook เป็นภาษาไทย (ด่าน test-en-thai-leak ตรวจแอตทริบิวต์ด้วย)
              const label = isEnglish ? social.name : `${social.name} ${social.handle}`;
              return (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className={`footer-social footer-social--${social.name.toLowerCase()} tap-overlay`}
              />
              );
            })}
          </div>
        </div>

        {/*
          🧭 แต่ละคอลัมน์ต้องเป็น <nav> ของตัวเอง (UX-05)
          ---------------------------------------------------------------------
          ลิงก์ภายในท้ายเว็บคือทางเดินต่อของผู้ใช้ที่มาจากผลค้นหา แต่เดิมเป็น <div>
          เปล่า ๆ ผู้ใช้ screen reader จึงกระโดดมาที่นี่ด้วยคำสั่ง navigation ไม่ได้

          ⚠️ ต้องตั้งชื่อ `aria-label` ให้ **ไม่ซ้ำกัน** ทุกอัน — landmark ชื่อซ้ำกันหลายอัน
          ในหน้าเดียวทำให้รายการ landmark ของ screen reader อ่านแล้วแยกไม่ออกว่าอันไหนคืออันไหน
          ใช้ `col.title` ซึ่งเป็นหัวข้อคอลัมน์ที่ไม่ซ้ำกันอยู่แล้วเป็นชื่อ

          ⚠️ คอลัมน์สุดท้ายเป็น "สายด่วน/คำเตือน" ที่บางรายการไม่มีลิงก์เลย
          ถึงอย่างนั้นก็ยังควรเป็น nav เพราะรายการที่มีลิงก์ปนอยู่ด้วย
        */}
        {/*
          🪗 มือถือ: คอลัมน์ที่เป็นลิงก์ล้วนพับได้ (แตะชื่อคอลัมน์เพื่อกาง) — ดู `footer-accordion.ts`
          ⚠️ คอลัมน์ "ปลอดภัย & โปร่งใส" ไม่พับเด็ดขาด — มีสายด่วน 1323/1669 ต้องเห็นทันที (กฎเหล็กข้อ 6)
          ⚠️ ไม่มีสคริปต์ = ปุ่มพับไม่แสดง ลิงก์กางครบเหมือนเดิม (CSS ผูกกับคลาส `footer-collapsible` บน <html>)
        */}
        {/* 2) ลิงก์ 4 คอลัมน์ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-6 sm:gap-y-10">
          {footerColumns.map((col, idx) => {
            const collapsible = "links" in col && Boolean(col.links);
            const listId = `footer-col-${idx}`;
            return (
              <nav
                key={idx}
                aria-label={col.title}
                className="space-y-4"
                {...(collapsible ? { "data-footer-col": "" } : {})}
              >
                {collapsible && (
                  <button
                    type="button"
                    data-footer-toggle
                    aria-expanded="false"
                    aria-controls={listId}
                    className={`footer-col-toggle w-full items-center justify-between gap-3 border-b border-line/15 pb-2.5 font-serif-th text-sm font-bold text-surface-warm text-left ${isEnglish ? "uppercase tracking-wider" : ""}`}
                  >
                    <span>{col.title}</span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="footer-col-chevron h-4 w-4 shrink-0 text-line/70"
                    >
                      <path d="M5 7.5 10 12.5 15 7.5" />
                    </svg>
                  </button>
                )}
                {/* ⚠️ ห้ามเป็น <h*> — ป้ายกลุ่มลิงก์ไม่ใช่หัวข้อเอกสาร (โผล่ในสารบัญทุกหน้า · ลำดับ h1 ➔ h3 ข้ามขั้น) ด่าน `test-a11y-critical` ตรวจอยู่ */}
                <div className={`footer-col-title font-serif-th font-bold text-sm text-gold-on-dark ${isEnglish ? "uppercase tracking-wider" : "tracking-wide"}`}>
                  {col.title}
                </div>
                {"links" in col && col.links ? (
                  <ul id={listId} className="footer-col-list space-y-2.5 text-sm font-serif-th text-line/75 leading-snug">
                    {col.links.map((link, lIdx) => {
                      return (
                        <li key={lIdx}>
                          <Link href={link.href} prefetch={false} className="hover:text-surface-warm transition-colors">
                            {link.label}
                          </Link>
                        </li>
                    );
                  })}
                </ul>
              ) : "items" in col && col.items ? (
                <ul className="space-y-3 text-sm font-serif-th text-line/75 leading-snug">
                  {col.items.map((item, iIdx) => {
                    const hasHref = "href" in item && Boolean(item.href);
                    const href = hasHref ? (item as any).href : "";
                    return (
                      <li key={iIdx}>
                        {hasHref ? (
                          <Link href={href} prefetch={false} className="hover:text-surface-warm transition-colors">
                            {item.title}
                          </Link>
                        ) : (
                          <>
                            <span className={`${"color" in item ? item.color : "text-gold-on-dark"} font-semibold`}>{item.title}</span>
                            {"description" in item && item.description && (
                              <p className="text-xs text-line/60 mt-0.5">{item.description}</p>
                            )}
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </nav>
            );
          })}
        </div>

        {/* 3) ข้อควรทราบ — ⚠️ ป้ายห้ามเป็น <h*> (เหตุผลเดียวกับชื่อคอลัมน์) */}
        <p className="border-t border-line/15 pt-6 font-serif-th text-xs text-line/60 leading-relaxed">
          <span className="font-bold text-gold-on-dark">
            {isEnglish ? "Ethical Reading Notice & AI Disclosure: " : "ข้อควรทราบเกี่ยวกับการทำนาย: "}
          </span>
          {t.footer.ethicalDisclaimer}
        </p>

        {/* 4) แถบล่าง — ลิขสิทธิ์ · ลิงก์นโยบาย */}
        <div className="-mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between font-serif-th text-xs text-line/60">
          <p>
            {isEnglish
              ? "© 2026 SeerTarot · 1909 Rider-Waite online tarot · All rights reserved"
              : "© 2026 SeerTarot · ดูดวงไพ่ทาโรต์ 1909 Rider-Waite ออนไลน์ · สงวนลิขสิทธิ์"}
          </p>
          {/* ลิงก์ "เกี่ยวกับเรา/ติดต่อ" ต้องอยู่ทุกหน้า — สัญญาณความน่าเชื่อถือที่ Google มองหาโดยตรง (หน้าไทยล้วน)
              หน้าราคาต้องหาเจอจากทุกหน้า (เจ้าของขอ "หาง่าย") */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {!isEnglish && (
              <>
                <Link href="/about" prefetch={false} className="hover:text-surface-warm transition-colors">
                  เกี่ยวกับเรา
                </Link>
                <Link href="/contact" prefetch={false} className="hover:text-surface-warm transition-colors">
                  ติดต่อเรา
                </Link>
              </>
            )}
            <Link href="/pricing" prefetch={false} className="hover:text-surface-warm transition-colors">
              {isEnglish ? "Pricing" : "ราคาและแพ็กเกจ"}
            </Link>
            <Link href="/privacy" prefetch={false} className="hover:text-surface-warm transition-colors">
              {isEnglish ? "Privacy Policy" : "นโยบายความเป็นส่วนตัว"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
