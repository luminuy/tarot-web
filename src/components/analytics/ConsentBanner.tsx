"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
// ลิงก์ภายในต้องรู้ทั้งภาษาของหน้าและเครื่องมือเรนเดอร์ปลายทาง — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";

import { useLocale } from "@/lib/i18n";
import { applyConsentChoice } from "@/lib/analytics-bootstrap";

/**
 * ✦ แถบขอความยินยอมเก็บสถิติการใช้งาน (PDPA)
 *
 * แสดงครั้งเดียวต่อเครื่อง จนกว่าผู้ใช้จะเลือก · ก่อนเลือก GA4 อยู่ในสถานะ
 * `analytics_storage: 'denied'` และ Meta Pixel ยังไม่ถูก init เลย
 * (ดู `src/components/analytics/AnalyticsTracker.tsx`)
 *
 * ตั้งใจให้เรียบและไม่บังเนื้อหา — เป็นแถบเตี้ยยาวเต็มความกว้างที่ขอบล่าง
 * ไม่ใช่ม่านทึบกลางจอ เพราะหน้าแรกคือหน้าที่ผู้ใช้มาเพื่อเปิดไพ่ ไม่ใช่มาอ่านประกาศ
 * (เดิมเป็นกล่องเล็กมุมขวาล่าง · เจ้าของสั่งเปลี่ยนเป็นแถบเดียวยาว ๆ เมื่อ 2026-09-21)
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
/**
 * หน้ากลุ่มแม่หมอ (โปรไฟล์ · หน้าจอง · หน้าคิว · แผงแม่หมอ) — ใช้แถบย่อบรรทัดเดียวใต้หัวเว็บ
 * ลูกค้าที่มาจากลิงก์ในแอป LINE เห็นแถบนี้ทุกคน (เบราว์เซอร์ในแอปมีที่เก็บแยก) แถบเต็มที่ขอบล่างสูง ~170px
 * บังปุ่ม "เลือกเวลานัด" / "ชำระเงิน" ที่ติดขอบล่างพอดี (CONSULT_FLOW_UX_PLAN P8 · ข้อ 3.3)
 * หน้า Astro: shim ของ `usePathname` คืน "" ➔ ได้แถบเต็มแบบเดิมเสมอ
 */
const COMPACT_PATH = /^\/(?:en\/)?readers(?:\/|$)/;

export function ConsentBanner() {
  const { isEnglish } = useLocale();
  const pathname = usePathname() ?? "";
  const [decided, setDecided] = useState(false);

  if (decided) return null;

  const decide = (choice: "granted" | "denied") => {
    // ⚠️ ตรรกะอยู่ที่ `applyConsentChoice` ที่เดียว — สคริปต์ฝั่ง Astro เรียกตัวเดียวกันนี้
    // ห้ามเขียนซ้ำที่นี่ (ความยินยอม PDPA ที่อยู่สองที่จะหลุดจากกันเสมอ)
    applyConsentChoice(choice);
    setDecided(true);
  };

  if (COMPACT_PATH.test(pathname)) {
    return (
      <div
        data-consent-banner=""
        role="region"
        aria-label={isEnglish ? "Cookie and analytics consent" : "การขอความยินยอมเก็บสถิติการใช้งาน"}
        className="fixed inset-x-0 z-[var(--z-consent)] px-3"
        style={{ top: "calc(var(--site-header-h) + 8px)" }}
      >
        <div className="consent-bar mx-auto flex max-w-3xl items-center gap-2 py-1.5 pl-3.5 pr-1.5">
          <p className="min-w-0 flex-1 text-[12px] leading-snug text-ink">
            {isEnglish ? "Anonymous usage stats only · " : "เว็บเก็บสถิติแบบไม่ระบุตัวตน · "}
            <Link href="/privacy" prefetch={false} className="underline underline-offset-2 hover:text-gold-ink">
              {isEnglish ? "Policy" : "นโยบาย"}
            </Link>
          </p>
          <button
            type="button"
            data-consent-reject=""
            onClick={() => decide("denied")}
            className="btn-glass-ghost tap-target shrink-0 px-3 py-1.5 text-[12px] font-bold"
          >
            {isEnglish ? "Essential only" : "เฉพาะที่จำเป็น"}
          </button>
          <button
            type="button"
            data-consent-accept=""
            onClick={() => decide("granted")}
            className="btn-glass-primary tap-target shrink-0 px-4 py-1.5 text-[12px] font-bold"
          >
            {isEnglish ? "Allow" : "ยินยอม"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-consent-banner=""
      role="region"
      aria-label={isEnglish ? "Cookie and analytics consent" : "การขอความยินยอมเก็บสถิติการใช้งาน"}
      className="consent-dock fixed inset-x-0 bottom-0 z-[var(--z-consent)]"
    >
      {/*
        แถบเดียวยาวเต็มความกว้าง (คำสั่งเจ้าของ 2026-09-21) — เดิมเป็นกล่องเล็กมุมขวาล่าง
        เดสก์ท็อปได้เป็นแถวเดียวจริง: ข้อความซ้าย · ปุ่มขวา · ลิงก์นโยบายอยู่ในบรรทัดเดียวกับข้อความ
        จอแคบวางซ้อนเป็นสองชั้น (ข้อความบน · ปุ่มล่างเต็มความกว้าง) เพราะแถวเดียวจะบีบปุ่มจนกดยาก
      */}
      {/*
        📱 มือถือย่อเหลือข้อความ 1–2 บรรทัด + ปุ่มสองปุ่มแถวเดียว (SeerTarot UI 2.0 หัวข้อ 5.4)
        เดิมกินจอแรกราว 1 ใน 4 และบังส่วนเปิดไพ่ · ข้อความและตรรกะความยินยอมเหมือนเดิมทุกตัวอักษร
        (INC-0245 · ด่าน test-analytics-integrity) — ลิงก์นโยบายย้ายมาต่อท้ายข้อความบนจอแคบแทนการกินแถวของตัวเอง
      */}
      <div className="consent-bar mx-auto flex max-w-6xl flex-col gap-2 px-3.5 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3 lg:flex-row lg:items-center lg:gap-4 lg:py-2.5 lg:pl-5 lg:pr-3">
        <p className="min-w-0 flex-1 text-[12px] leading-snug text-ink sm:text-[13px] sm:leading-relaxed">
          <span className="font-bold text-gold-ink">
            {isEnglish ? "Before we begin" : "ก่อนเริ่มดูดวง"}
          </span>
          <span aria-hidden="true"> · </span>
          {isEnglish
            ? "We collect anonymous usage stats to improve the site. Your questions and readings are never sent to analytics."
            : "เราเก็บสถิติการใช้งานแบบไม่ระบุตัวตนเพื่อปรับปรุงเว็บ คำถามและคำทำนายของคุณไม่ถูกส่งเข้าระบบสถิติ"}
          <span className="lg:hidden">
            {" · "}
            <Link href="/privacy" prefetch={false} className="text-muted underline underline-offset-2 hover:text-gold-ink">
              {isEnglish ? "Privacy policy" : "นโยบายความเป็นส่วนตัว"}
            </Link>
          </span>
        </p>

        {/*
          จอกว้าง (≥1024px): ลิงก์นโยบายยืนอยู่ในแถวเดียวกับปุ่ม เพื่อให้ข้อความด้านซ้ายได้อยู่บรรทัดเดียวจริง
          จอแคบกว่านั้น: ลิงก์นี้ซ่อน แล้วใช้ลิงก์ที่ต่อท้ายข้อความแทน ปุ่มสองปุ่มจึงได้แถวเดียวเต็มความกว้าง (UI 2.0 หัวข้อ 5.4)
        */}
        <div /*
            `items-stretch` ตอนจอแคบ — ปุ่มที่ตัวหนังสือตัดสองบรรทัดจะสูงกว่าเพื่อน
            ถ้าใช้ `items-center` ปุ่มสองใบจะสูงไม่เท่ากันจนดูเบี้ยว (INC-0215)
          */
          className="flex shrink-0 flex-wrap items-stretch gap-2 lg:flex-nowrap lg:items-center lg:gap-3">
          {/*
            ⚠️ ต้องเป็น `LocaleLink` ไม่ใช่ `next/link` (ด่านที่ 44 จับได้เมื่อ 2026-09-21)
            `/privacy` ย้ายไป Astro แล้ว = ไฟล์ HTML ที่ตอบจากขอบ ไม่มีเพย์โหลด RSC ให้ router ดึง
            ถ้าใช้ `next/link` ทุกคลิกจะเสียคำขอฟรีหนึ่งเส้นก่อนโหลดหน้าจริงอยู่ดี
            และผู้ใช้หน้าอังกฤษจะถูกพากลับไปหน้านโยบายภาษาไทย (ของเดิมเป็นแบบนั้นจริง)
            `prefetch={false}` คงไว้เหมือนเดิม — แบนเนอร์นี้อยู่ในวิวพอร์ตตั้งแต่เฟรมแรกของทุกหน้า
            ถ้าปล่อยให้พรีเฟตช์ ทุกคนที่เปิดเว็บครั้งแรกจะดึง `/privacy` มา 3 คำขอ 14 KB ทิ้งไว้เฉย ๆ
            (วัดจาก Lighthouse network log 2026-09-14)
          */}
          <Link
            href="/privacy"
            prefetch={false}
            className="tap-overlay-y hidden whitespace-nowrap text-[12px] text-muted underline underline-offset-2 hover:text-gold-ink lg:inline"
          >
            {isEnglish ? "Privacy policy" : "นโยบายความเป็นส่วนตัว"}
          </Link>
          <button
            type="button"
            data-consent-reject=""
            onClick={() => decide("denied")}
            /*
              ⛔ ห้ามใส่ `whitespace-nowrap` คู่กับ `flex-1` ที่นี่ (INC-0215)
              `flex-1` = `flex-basis: 0` + ยอมให้หด ส่วน `nowrap` = ตัวหนังสือหดตามไม่ได้
              สองอย่างนี้ขัดกันเอง พอจอแคบ (320px) ปุ่มถูกหดเหลือ 122px แต่คำว่า
              "Only what's needed" ต้องการ 127px ตัวหนังสือจึงล้นออกนอกพื้นปุ่มไป 5px
              (`overflow: visible` ไม่มีอะไรมาตัด) — วัดจากการเรนเดอร์จริง
              ปล่อยให้ตัดบรรทัดในปุ่มได้แทน ปุ่มสูงขึ้นสองบรรทัดยังอ่านออก ดีกว่าตัวหนังสือหลุดกรอบ
            */
            className="btn-glass-ghost tap-target min-w-0 flex-1 px-3 py-1.5 text-[13px] font-bold sm:px-4 sm:py-2 lg:flex-none"
          >
            {isEnglish ? "Only what's needed" : "เฉพาะที่จำเป็น"}
          </button>
          <button
            type="button"
            data-consent-accept=""
            onClick={() => decide("granted")}
            /* เหตุผลเดียวกับปุ่มด้านบน (INC-0215) — `flex-1` กับ `nowrap` อยู่ด้วยกันไม่ได้ */
            className="btn-glass-primary tap-target min-w-0 flex-1 px-4 py-1.5 text-[13px] font-bold sm:px-5 sm:py-2 lg:flex-none"
          >
            {isEnglish ? "Allow" : "ยินยอม"}
          </button>
        </div>
      </div>
    </div>
  );
}
