"use client";

import { useEffect, useRef, Suspense } from "react";

import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { usePathname, useSearchParams } from "next/navigation";
import { bootstrapAnalytics } from "@/lib/analytics-bootstrap";
import { trackPageView } from "@/lib/analytics";

/**
 * 📊 เครื่องมือวัดผลฝั่งหน้าที่ **Next** เรนเดอร์
 * ---------------------------------------------------------------------------
 * ⚠️ **ตรรกะทั้งหมดอยู่ใน `@/lib/analytics-bootstrap` โดยตั้งใจ ห้ามย้ายกลับมาที่นี่**
 *
 * เดิมไฟล์นี้ฝังสคริปต์ gtag ทั้งก้อนไว้ในสตริงของ `<Script>` — หน้าที่ Astro เรนเดอร์
 * จึงต้อง hydrate React ทั้ง 184 KB เพียงเพื่อรันโค้ดไม่กี่สิบบรรทัดที่ไม่มี UI เลย
 * (วัดจริงบนหน้า `/spreads`: JS 278.7 KB ➔ 1.8 KB หลังถอด island ออกทั้งสองตัว)
 *
 * ตอนนี้ทั้งสองเครื่องเรนเดอร์เรียกโมดูลเดียวกัน:
 *   - หน้าที่ Next เรนเดอร์  ➔ ไฟล์นี้ (useEffect ด้านล่าง)
 *   - หน้าที่ Astro เรนเดอร์ ➔ `astro/scripts/site-chrome.ts`
 *
 * เหลือไว้ที่นี่เฉพาะสองอย่างที่เป็นของ React จริง ๆ:
 *   1. `PageViewTracker` — หน้าที่ Next เรนเดอร์เปลี่ยนเส้นทางแบบ SPA ได้ ต้องยิง page_view เอง
 *      (หน้าที่ Astro เรนเดอร์โหลดใหม่ทั้งหน้าทุกครั้ง `gtag('config')` จึงยิงให้เองอยู่แล้ว)
 *   2. `<ConsentBanner />` — แถบขอความยินยอมที่ต้องอยู่ในทุกหน้า
 */

/**
 * ติดตาม PageView เมื่อเปลี่ยนหน้าแบบ SPA ใน Next.js App Router
 * (เช่น /admin ➔ /admin?tab=redeem)
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const lastTrackedUrl = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;

    const queryString = searchParams?.toString();
    const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // ข้ามการยิงซ้ำในรอบแรก เพราะ `gtag('config')` ตอนโหลดเริ่มแรกยิงให้แล้ว
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastTrackedUrl.current = currentUrl;
      return;
    }

    // ถ้า URL ไม่ได้เปลี่ยนจริง (เช่น re-render ทั่วไป) ให้ข้าม
    if (lastTrackedUrl.current === currentUrl) return;

    lastTrackedUrl.current = currentUrl;
    trackPageView(currentUrl);
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsTracker() {
  useEffect(() => bootstrapAnalytics(), []);

  return (
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>

      {/* ประตูความยินยอมที่คุมสคริปต์ทั้งหมด — วางไว้ที่นี่แทนที่จะไปแขวนใน `RootHtml`
          เพราะ `RootHtml` เป็น server component การอ้างถึง client component จากที่นั่น
          ต้องถูก serialize ลง flight payload ของทุกหน้าที่ prerender (ทำให้
          `/cards/birth-card` ซึ่งชนเพดานงบ HTML พอดีอยู่แล้วล้นออกไป 1 KB) */}
      <ConsentBanner />
    </>
  );
}
