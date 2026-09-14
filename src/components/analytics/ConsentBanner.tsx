"use client";

import { useState } from "react";
import Link from "next/link";

import { useLocale } from "@/lib/i18n";
import { writeConsent } from "@/lib/analytics-consent";
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
 *
 * ⚠️ markup ของแถบนี้ต้องอยู่ใน HTML ตั้งแต่แรกเสมอ ห้ามกลับไปเรนเดอร์หลัง mount
 * ---------------------------------------------------------------------------
 * ของเดิมเริ่มด้วย `useState(false)` แล้วค่อยเปิดใน `useEffect` แถบจึงโผล่ก็ต่อเมื่อ
 * React hydrate ทั้งหน้าเสร็จ · กล่องข้อความของมันกว้างเกือบเต็มจอมือถือ พื้นที่จึง
 * ใหญ่กว่าภาพไพ่ใบแรกของหน้าแรก (17,703 px² เทียบกับ 13,463 px²) กลายเป็น **ตัว LCP
 * ของหน้าแรก** ที่วาดหลัง FCP หลายวินาที — วัดจริงบน production 2026-09-14 ได้ LCP 9.6s
 * ขณะที่ FCP อยู่ที่ 1.4s
 *
 * ตอนนี้ทั้งก้อนถูกเรนเดอร์ฝั่งเซิร์ฟเวอร์เสมอ แล้วซ่อนด้วย `display:none` ใน
 * `globals.css` · สคริปต์สั้น ๆ ใน `<head>` (ดู `RootHtml.tsx`) ตั้ง `data-consent-ask`
 * บน `<html>` ให้ก่อนเฟรมแรกจะวาด เฉพาะเครื่องที่ยังไม่เคยตัดสินใจเท่านั้น
 * จึงไม่มีทั้งการกะพริบของเครื่องที่ตอบไปแล้ว และไม่มี hydration mismatch
 * (สถานะความยินยอมไม่ได้อยู่ใน React state อีกต่อไป)
 */
export function ConsentBanner() {
  const { isEnglish } = useLocale();
  const [decided, setDecided] = useState(false);

  if (decided) return null;

  const decide = (choice: "granted" | "denied") => {
    writeConsent(choice); // จำไว้ต่อเครื่อง + ยิง event ให้ Meta Pixel เริ่มทำงาน
    setAnalyticsConsent(choice === "granted"); // Google Consent Mode v2
    // ถอดสวิตช์ CSS ทิ้งด้วย ไม่ใช่แค่ถอด markup — กันแถบกะพริบกลับมาหนึ่งเฟรม
    // ถ้าวันหน้ามีใครเรนเดอร์คอมโพเนนต์นี้ซ้ำในหน้าเดียวกัน
    document.documentElement.removeAttribute("data-consent-ask");
    setDecided(true);
  };

  return (
    <div
      data-consent-banner=""
      role="region"
      aria-label={isEnglish ? "Cookie and analytics consent" : "การขอความยินยอมเก็บสถิติการใช้งาน"}
      className="fixed bottom-3 left-3 right-[4.75rem] sm:right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-[var(--z-consent)] rounded-xl border border-line bg-surface shadow-[0_10px_30px_rgba(42,38,31,0.14)] p-4"
    >
      <p className="text-[13px] font-bold text-gold-ink mb-1.5">
        {isEnglish ? "Before we begin" : "ก่อนเริ่มดูดวง"}
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
      {/*
        ⚠️ `prefetch={false}` ห้ามถอดออก — แบนเนอร์นี้อยู่ในวิวพอร์ตตั้งแต่เฟรมแรกของทุกหน้า
        ตั้งแต่ย้ายมาเรนเดอร์ฝั่งเซิร์ฟเวอร์ · ค่าเริ่มต้นของ Next คือพรีเฟตช์ลิงก์ที่มองเห็น
        ทำให้ทุกคนที่เปิดเว็บครั้งแรกดึง `/privacy` มา **3 คำขอ 14 KB** ทิ้งไว้เฉย ๆ
        แย่งแบนด์วิดท์จากไฟล์ที่ใช้วาดหน้าจริง (วัดจาก Lighthouse network log 2026-09-14)
      */}
      <Link
        href={isEnglish ? "/privacy" : "/privacy"}
        prefetch={false}
        className="tap-overlay-y mt-2.5 inline-block text-[12px] text-muted underline underline-offset-2 hover:text-gold-ink"
      >
        {isEnglish ? "Read our privacy policy" : "อ่านนโยบายความเป็นส่วนตัว"}
      </Link>
    </div>
  );
}

export default ConsentBanner;
