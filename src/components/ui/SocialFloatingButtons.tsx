"use client";

import { stripLocalePrefix } from "@/lib/i18n/paths";
import { useLocale } from "@/lib/i18n";
import { BRAND_SOCIAL_PROFILES } from "@/lib/config/site";
import { usePathname } from "next/navigation";

/**
 * ปุ่มลอยช่องทางทางการ (LINE · Facebook · TikTok) — มุมขวาล่าง เรียงแนวตั้ง
 *
 * ⚠️ URL มาจาก `BRAND_SOCIAL_PROFILES` ใน `lib/config/site.ts` ที่เดียว
 * เพราะค่าเดียวกันนี้ถูกใช้เป็น `Organization.sameAs` ใน JSON-LD ด้วย
 * ถ้าแยกกันเขียนสองที่ วันหนึ่งจะหลุดกันแล้วสัญญาณตัวตนที่ส่งให้ Google จะผิด
 *
 * - เดิมเป็นปุ่ม TikTok เดี่ยว (`SocialFloatingButtons`) — เจ้าของขอให้มี LINE/Facebook ด้วย (2026-09-30)
 * - โลโก้ทางการของแต่ละแบรนด์ (LINE/Facebook จาก Simple Icons · TikTok เวกเตอร์ 3 ชั้นเดิม)
 * - ⚠️ หน้าแรกมีงบ DOM ≤ 1,500 (INC-0247) — ทั้งกล่องใช้แค่ aside + a + svg + path
 *   ห้ามเติม tooltip / กล่องเงา / span ประดับ (ใช้ `title` แทน tooltip)
 * - สีแบรนด์อยู่ใน `fill` ของ SVG ไม่ใช่คลาส `[#hex]` (ด่านพาเลตนับเฉพาะคลาส)
 * - Accessible: aria-label ต่อปุ่ม, rel="noopener noreferrer", focus-visible ring
 */
const LINE_URL = BRAND_SOCIAL_PROFILES.find((u) => u.includes("line.me"));
const FACEBOOK_URL = BRAND_SOCIAL_PROFILES.find((u) => u.includes("facebook.com"));
const TIKTOK_URL = BRAND_SOCIAL_PROFILES.find((u) => u.includes("tiktok.com"));

const BUTTON =
  "relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-[0_6px_18px_rgba(40,28,14,0.28)] hover:scale-105 active:scale-95 transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

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
    <aside
      data-floating="true"
      aria-label={isEnglish ? "SeerTarot official channels" : "ช่องทางทางการของ SeerTarot"}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 flex flex-col items-center gap-2 select-none print:hidden pointer-events-auto"
      style={{
        position: "fixed",
        bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
        right: "calc(1.25rem + env(safe-area-inset-right, 0px))",
        zIndex: 30,
      }}
    >
      {LINE_URL && (
        <a
          href={LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={isEnglish ? "Add SeerTarot on LINE" : "เพิ่มเพื่อน SeerTarot ใน LINE"}
          aria-label={isEnglish ? "Add SeerTarot on LINE" : "เพิ่มเพื่อน SeerTarot ใน LINE"}
          className={BUTTON}
          style={{ backgroundColor: "#06C755" }}
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#FFFFFF"
              d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
            />
          </svg>
        </a>
      )}

      {FACEBOOK_URL && (
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={isEnglish ? "SeerTarot on Facebook" : "เพจ SeerTarot บน Facebook"}
          aria-label={isEnglish ? "SeerTarot on Facebook" : "เพจ SeerTarot บน Facebook"}
          className={BUTTON}
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <svg className="w-full h-full" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#0866FF"
              d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
            />
          </svg>
        </a>
      )}

      {TIKTOK_URL && (
        <a
          href={TIKTOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={isEnglish ? "Follow Seerada on TikTok (@seerada.tarot)" : "ติดตามแม่หมอ Seerada บน TikTok (@seerada.tarot)"}
          aria-label={isEnglish ? "Follow Seerada on TikTok (@seerada.tarot)" : "ติดตามแม่หมอ Seerada บน TikTok (@seerada.tarot)"}
          className={BUTTON}
          style={{ backgroundColor: "#050507" }}
        >
          {/* โลโก้ TikTok ทางการ 3 ชั้น (แดง · ฟ้า · ขาว) */}
          <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 258 292" aria-hidden="true">
            <path
              fill="#FF004F"
              d="M191.102,105.182c18.814,13.442,41.862,21.351,66.755,21.351V78.656c-4.711,0.001-9.41-0.49-14.019-1.466v37.686c-24.891,0-47.936-7.909-66.755-21.35v97.703c0,48.876-39.642,88.495-88.54,88.495c-18.245,0-35.203-5.513-49.29-14.968c16.078,16.431,38.5,26.624,63.306,26.624c48.901,0,88.545-39.619,88.545-88.497v-97.701H191.102z M208.396,56.88c-9.615-10.499-15.928-24.067-17.294-39.067v-6.158h-13.285C181.161,30.72,192.567,47.008,208.396,56.88L208.396,56.88z M70.181,227.25c-5.372-7.04-8.275-15.652-8.262-24.507c0-22.354,18.132-40.479,40.502-40.479c4.169-0.001,8.313,0.637,12.286,1.897v-48.947c-4.643-0.636-9.329-0.906-14.013-0.807v38.098c-3.976-1.26-8.122-1.9-12.292-1.896c-22.37,0-40.501,18.123-40.501,40.48C47.901,206.897,56.964,220.583,70.181,227.25z"
            />
            <path
              fill="#00F2EA"
              d="M243.838,77.189V66.999c-12.529,0.019-24.812-3.488-35.442-10.12C217.806,67.176,230.197,74.276,243.838,77.189z M177.817,11.655c-0.319-1.822-0.564-3.656-0.734-5.497V0h-48.182v191.228c-0.077,22.29-18.177,40.341-40.501,40.341c-6.554,0-12.742-1.555-18.222-4.318c7.401,9.707,19.087,15.973,32.241,15.973c22.32,0,40.424-18.049,40.502-40.342V11.655H177.817z M100.694,114.408V103.56c-4.026-0.55-8.085-0.826-12.149-0.824C39.642,102.735,0,142.356,0,191.228c0,30.64,15.58,57.643,39.255,73.527c-15.615-15.953-25.236-37.789-25.236-61.874C14.019,154.632,52.653,115.4,100.694,114.408z"
            />
            <path
              fill="#FFFFFF"
              d="M177.083,93.525c18.819,13.441,41.864,21.35,66.755,21.35V77.189c-13.894-2.958-26.194-10.215-35.442-20.309c-15.83-9.873-27.235-26.161-30.579-45.225h-34.896v191.226c-0.079,22.293-18.18,40.344-40.502,40.344c-13.154,0-24.84-6.267-32.241-15.975c-13.216-6.667-22.279-20.354-22.279-36.16c0-22.355,18.131-40.48,40.501-40.48c4.286,0,8.417,0.667,12.292,1.896v-38.098c-48.039,0.992-86.674,40.224-86.674,88.474c0,24.086,9.621,45.921,25.236,61.875c14.087,9.454,31.045,14.968,49.29,14.968c48.899,0,88.54-39.621,88.54-88.496V93.525L177.083,93.525z"
            />
          </svg>
        </a>
      )}
    </aside>
  );
}
