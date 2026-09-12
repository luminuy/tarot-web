"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useLocale } from "@/lib/i18n";
import { readConsent, writeConsent } from "@/lib/analytics-consent";
import { setAnalyticsConsent } from "@/lib/analytics";

/**
 * ✦ แถบขอความยินยอมเก็บสถิติการใช้งาน (PDPA)
 *
 * แสดงครั้งเดียวต่อเครื่อง จนกว่าผู้ใช้จะเลือก · ก่อนเลือก GA4 อยู่ในสถานะ
 * `analytics_storage: 'denied'` และ Meta Pixel ยังไม่ถูก init เลย
 * (ดู `src/components/analytics/AnalyticsTracker.tsx`)
 *
 * ตั้งใจให้เรียบและไม่บังเนื้อหา — ลอยอยู่มุมล่าง ไม่ใช่ม่านทึบกลางจอ
 * เพราะหน้าแรกคือหน้าที่ผู้ใช้มาเพื่อเปิดไพ่ ไม่ใช่มาอ่านประกาศ
 */
export function ConsentBanner() {
  const { isEnglish } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // อ่านหลัง mount เท่านั้น — หน้านี้ prerender ไว้ ถ้าอ่านตอน render
    // HTML ที่บิลด์ไว้จะไม่ตรงกับสิ่งที่เบราว์เซอร์เห็น (hydration mismatch)
    if (readConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const decide = (choice: "granted" | "denied") => {
    writeConsent(choice); // จำไว้ต่อเครื่อง + ยิง event ให้ Meta Pixel เริ่มทำงาน
    setAnalyticsConsent(choice === "granted"); // Google Consent Mode v2
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label={isEnglish ? "Cookie and analytics consent" : "การขอความยินยอมเก็บสถิติการใช้งาน"}
      className="fixed bottom-3 left-3 right-[4.75rem] sm:right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-[var(--z-consent)] rounded-xl border border-line bg-surface shadow-[0_10px_30px_rgba(42,38,31,0.14)] p-4"
    >
      <p className="text-[13px] font-bold text-gold-ink mb-1.5">
        {isEnglish ? "✦ Before we begin" : "✦ ก่อนเริ่มดูดวง"}
      </p>
      <p className="text-[13px] leading-relaxed text-ink">
        {isEnglish
          ? "We'd like to collect anonymous usage statistics to improve the site. Your questions and readings are never sent to analytics."
          : "เราขอเก็บสถิติการใช้งานแบบไม่ระบุตัวตน เพื่อนำไปปรับปรุงเว็บให้ดีขึ้น คำถามและคำทำนายของคุณไม่ถูกส่งเข้าระบบสถิติแน่นอน"}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => decide("granted")}
          className="tap-target flex-1 min-w-[120px] rounded-lg bg-ink px-3 py-2 text-[13px] font-bold text-canvas hover:bg-[#3D382F] transition-colors"
        >
          {isEnglish ? "Allow" : "ยินยอม"}
        </button>
        <button
          type="button"
          onClick={() => decide("denied")}
          className="tap-target flex-1 min-w-[120px] rounded-lg border border-line px-3 py-2 text-[13px] font-bold text-ink hover:border-gold transition-colors"
        >
          {isEnglish ? "Only what's needed" : "เฉพาะที่จำเป็น"}
        </button>
      </div>
      <Link
        href={isEnglish ? "/privacy" : "/privacy"}
        className="tap-overlay-y mt-2.5 inline-block text-[12px] text-muted underline underline-offset-2 hover:text-gold-ink"
      >
        {isEnglish ? "Read our privacy policy" : "อ่านนโยบายความเป็นส่วนตัว"}
      </Link>
    </div>
  );
}

export default ConsentBanner;
