"use client";

import { stripLocalePrefix } from "@/lib/i18n/paths";
import { useLocale } from "@/lib/i18n";
import { BRAND_SOCIAL_PROFILES } from "@/lib/config/site";
import { usePathname } from "next/navigation";
import { SOCIAL_BADGE_STYLE, SocialGlyph } from "@/components/ui/SocialIcons";

/**
 * ปุ่มลอยช่องทางทางการ (LINE · Facebook · TikTok) — มุมขวาล่าง
 *
 * ปุ่มหลักอันเดียว กดแล้วค่อยกางช่องทางขึ้นด้านบน (เจ้าของขอ 2026-10-01: โชว์ 3 อันพร้อมกันบังจอมือถือ)
 * ใช้ `<details>/<summary>` ของเบราว์เซอร์เอง — กาง/หุบได้โดยไม่ต้องมี JS
 * (หน้า Astro เรนเดอร์ปุ่มนี้เป็น HTML ล้วน ไม่ hydrate) · หน้าตา/แอนิเมชันอยู่ที่ `.social-fab` ใน globals.css
 *
 * ⚠️ URL มาจาก `BRAND_SOCIAL_PROFILES` ใน `lib/config/site.ts` ที่เดียว
 * เพราะค่าเดียวกันนี้ถูกใช้เป็น `Organization.sameAs` ใน JSON-LD ด้วย
 * ถ้าแยกกันเขียนสองที่ วันหนึ่งจะหลุดกันแล้วสัญญาณตัวตนที่ส่งให้ Google จะผิด
 *
 * - เดิมเป็นปุ่ม TikTok เดี่ยว (`SocialFloatingButtons`) — เจ้าของขอให้มี LINE/Facebook ด้วย (2026-09-30)
 * - โลโก้ทางการจาก `SocialIcons.tsx` (ชุดเดียวกับหน้าติดต่อ)
 * - ⚠️ หน้าแรกมีงบ DOM ≤ 1,500 (INC-0247) — ทั้งกล่องใช้แค่ details + summary + a + svg + path
 *   ห้ามเติม tooltip / กล่องเงา / span ประดับ (ใช้ `title` แทน tooltip)
 * - สีแบรนด์อยู่ใน `fill` ของ SVG ไม่ใช่คลาส `[#hex]` (ด่านพาเลตนับเฉพาะคลาส)
 * - Accessible: aria-label ต่อปุ่ม, rel="noopener noreferrer", focus-visible ring
 */
const LINE_URL = BRAND_SOCIAL_PROFILES.find((u) => u.includes("line.me"));
const FACEBOOK_URL = BRAND_SOCIAL_PROFILES.find((u) => u.includes("facebook.com"));
const TIKTOK_URL = BRAND_SOCIAL_PROFILES.find((u) => u.includes("tiktok.com"));

/**
 * ขนาดตามมาตรฐานปุ่มลอย (Material FAB / Apple HIG): ปุ่มหลัก 56px · ปุ่มช่องทาง 48px (เกินขั้นต่ำ 44px)
 * หน้าตา เงา ป้ายชื่อ และแอนิเมชันอยู่ที่ `.social-fab` ใน globals.css
 */
const BUTTON = "social-fab__item absolute right-1 flex items-center justify-center w-12 h-12 rounded-full";
const SUMMARY = "social-fab__main relative flex items-center justify-center w-14 h-14 rounded-full cursor-pointer list-none";

export function SocialFloatingButtons({ pathname: pathnameProp }: { pathname?: string } = {}) {
  const { isEnglish } = useLocale();
  const hookPathname = usePathname();
  /*
   * ⚠️ หน้า Astro เรนเดอร์ปุ่มนี้เป็น HTML ครั้งเดียวตอนบิลด์ (ไม่ hydrate) และ shim `usePathname()`
   *    คืน "" เสมอ เงื่อนไขซ่อนจึงไม่เคยจริง ปุ่มลอยทับช่องพิมพ์ของ /reading/chat (A4-02)
   *    ➔ หน้า Astro ส่ง `Astro.url.pathname` เข้ามาเอง · ตัด `/en` ก่อนเทียบ ให้ซ่อนทั้งสองภาษา
   */
  const pathname = stripLocalePrefix(pathnameProp ?? hookPathname ?? "");
  // ซ่อนบนหน้าแอดมิน และหน้าห้องแชท/ผลพยากรณ์ (/reading/chat ฯลฯ) เพื่อไม่ให้ลอยบังปุ่มส่งข้อความหรือแผงสนทนาบนมือถือ
  if (pathname.startsWith("/admin") || pathname.startsWith("/reading")) return null;

  return (
    <details
      data-floating="true"
      className="social-fab fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 select-none print:hidden pointer-events-auto"
      style={{
        position: "fixed",
        bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
        right: "calc(1.25rem + env(safe-area-inset-right, 0px))",
        zIndex: 30,
      }}
    >
      {/* ปุ่มหลัก — ไอคอนวาดด้วย ::before ใน globals.css (`.social-fab`) ไม่เพิ่ม element (งบ DOM หน้าแรก) */}
      <summary
        aria-label={isEnglish ? "Contact & follow SeerTarot" : "ติดต่อและติดตาม SeerTarot"}
        title={isEnglish ? "Contact & follow SeerTarot" : "ติดต่อและติดตาม SeerTarot"}
        className={SUMMARY}
      />
      {LINE_URL && (
        <a
          href={LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={isEnglish ? "Add SeerTarot on LINE" : "เพิ่มเพื่อน SeerTarot ใน LINE"}
          aria-label={isEnglish ? "Add SeerTarot on LINE" : "เพิ่มเพื่อน SeerTarot ใน LINE"}
          className={`${BUTTON} bottom-[188px]`}
          data-label="LINE"
          style={SOCIAL_BADGE_STYLE.LINE}
        >
          <SocialGlyph name="LINE" />
        </a>
      )}

      {FACEBOOK_URL && (
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={isEnglish ? "SeerTarot on Facebook" : "เพจ SeerTarot บน Facebook"}
          aria-label={isEnglish ? "SeerTarot on Facebook" : "เพจ SeerTarot บน Facebook"}
          className={`${BUTTON} bottom-32`}
          data-label="Facebook"
          style={SOCIAL_BADGE_STYLE.Facebook}
        >
          <SocialGlyph name="Facebook" />
        </a>
      )}

      {TIKTOK_URL && (
        <a
          href={TIKTOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={isEnglish ? "Follow Seerada on TikTok (@seerada.tarot)" : "ติดตามแม่หมอ Seerada บน TikTok (@seerada.tarot)"}
          aria-label={isEnglish ? "Follow Seerada on TikTok (@seerada.tarot)" : "ติดตามแม่หมอ Seerada บน TikTok (@seerada.tarot)"}
          className={`${BUTTON} bottom-[68px]`}
          data-label="TikTok"
          style={SOCIAL_BADGE_STYLE.TikTok}
        >
          <SocialGlyph name="TikTok" />
        </a>
      )}
    </details>
  );
}
