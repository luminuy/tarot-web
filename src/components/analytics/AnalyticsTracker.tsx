"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getGaMeasurementId,
  getMetaPixelId,
  isValidGaId,
  isValidMetaPixelId,
  trackPageView,
} from "@/lib/analytics";

/**
 * ติดตาม PageView สำหรับ Single Page Application (SPA)
 * เมื่อมีการเปลี่ยนหน้าใน Next.js App Router (เช่น / -> /spreads -> /cards -> /blog)
 */
function PageViewTracker({
  gaId,
  metaPixelId,
}: {
  gaId?: string | null;
  metaPixelId?: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const lastTrackedUrl = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;

    const queryString = searchParams?.toString();
    const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // ข้ามการยิงซ้ำในรอบแรก เพราะสคริปต์ gtag('config') ตอนโหลดเริ่มแรกยิงให้แล้ว
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastTrackedUrl.current = currentUrl;
      return;
    }

    // ถ้า URL ไม่ได้เปลี่ยนจริง (เช่น re-render ทั่วไป) ให้ข้าม
    if (lastTrackedUrl.current === currentUrl) return;

    lastTrackedUrl.current = currentUrl;
    trackPageView(currentUrl);
  }, [pathname, searchParams, gaId, metaPixelId]);

  return null;
}

export function AnalyticsTracker() {
  const [gaId, setGaId] = useState<string | undefined>(() => getGaMeasurementId());
  const [metaPixelId, setMetaPixelId] = useState<string | undefined>(() => getMetaPixelId());

  // ดึง configuration จาก runtime endpoint หากยังไม่ได้ตั้งค่าตอน build
  useEffect(() => {
    if (gaId && metaPixelId) return;

    let isMounted = true;
    fetch("/api/config/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        if (!gaId && data.gaId && isValidGaId(data.gaId)) {
          setGaId(data.gaId);
        }
        if (!metaPixelId && data.metaPixelId && isValidMetaPixelId(data.metaPixelId)) {
          setMetaPixelId(data.metaPixelId);
        }
      })
      .catch(() => {
        // เงียบไว้หากเรียกไม่สำเร็จ — analytics เป็น optional
      });

    return () => {
      isMounted = false;
    };
  }, [gaId, metaPixelId]);

  return (
    <>
      {/* ======================================================== */}
      {/* 📊 Google Analytics 4 (GA4)                                */}
      {/* ======================================================== */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'analytics_storage': 'granted',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
              });
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
                anonymize_ip: true,
                send_page_view: true
              });
            `}
          </Script>
        </>
      )}

      {/* ======================================================== */}
      {/* 🎯 Meta Pixel (Facebook & Instagram)                     */}
      {/* ======================================================== */}
      {metaPixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* ======================================================== */}
      {/* 🧭 Client-Side SPA Route Change Listener                  */}
      {/* ======================================================== */}
      <Suspense fallback={null}>
        <PageViewTracker gaId={gaId} metaPixelId={metaPixelId} />
      </Suspense>
    </>
  );
}
