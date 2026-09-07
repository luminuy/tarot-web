"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getGaMeasurementId,
  getMetaPixelId,
  getGoogleAdsId,
  isValidGaId,
  isValidMetaPixelId,
  isValidGoogleAdsId,
  trackPageView,
} from "@/lib/analytics";

/**
 * ติดตาม PageView สำหรับ Single Page Application (SPA)
 * เมื่อมีการเปลี่ยนหน้าใน Next.js App Router (เช่น / -> /spreads -> /cards -> /blog)
 */
function PageViewTracker({
  gaId,
  metaPixelId,
  googleAdsId,
}: {
  gaId?: string | null;
  metaPixelId?: string | null;
  googleAdsId?: string | null;
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
  }, [pathname, searchParams, gaId, metaPixelId, googleAdsId]);

  return null;
}

export function AnalyticsTracker() {
  const [gaId, setGaId] = useState<string | undefined>(() => getGaMeasurementId());
  const [metaPixelId, setMetaPixelId] = useState<string | undefined>(() => getMetaPixelId());
  const [googleAdsId, setGoogleAdsId] = useState<string | undefined>(() => getGoogleAdsId());

  // ดึง configuration จาก runtime endpoint หากยังไม่ได้ตั้งค่าตอน build
  useEffect(() => {
    if (gaId && metaPixelId && googleAdsId) return;

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
        if (!googleAdsId && data.googleAdsId && isValidGoogleAdsId(data.googleAdsId)) {
          setGoogleAdsId(data.googleAdsId);
        }
      })
      .catch(() => {
        // เงียบไว้หากเรียกไม่สำเร็จ — analytics เป็น optional
      });

    return () => {
      isMounted = false;
    };
  }, [gaId, metaPixelId, googleAdsId]);

  // ซิงก์ Google Ads Config เมื่อได้รับ ID มาภายหลัง (Runtime)
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.gtag === "function" && googleAdsId) {
      window.gtag("config", googleAdsId, {
        page_path: window.location.pathname,
        send_page_view: false,
      });
    }
  }, [googleAdsId]);

  const primaryGtagId = gaId || googleAdsId;

  return (
    <>
      {/* ======================================================== */}
      {/* 📊 Google Tag (GA4 & Google Ads)                         */}
      {/* ======================================================== */}
      {primaryGtagId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${primaryGtagId}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              /* ⚠️ ค่าเริ่มต้นต้องเป็น denied เสมอ (PDPA) — เดิมตั้ง granted ไว้
                 ทำให้ GA4 วางคุกกี้ _ga ตั้งแต่เฟรมแรกโดยไม่เคยถามผู้ใช้เลย
                 จะเปลี่ยนเป็น granted ก็ต่อเมื่อผู้ใช้กดยอมรับที่แบนเนอร์เท่านั้น */
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
              });
              try {
                if (localStorage.getItem('seertarot_analytics_consent_v1') === 'granted') {
                  gtag('consent', 'update', { 'analytics_storage': 'granted' });
                }
              } catch (e) {}
              /* การเปลี่ยนใจระหว่างเซสชันจัดการโดย setAnalyticsConsent() ใน src/lib/analytics.ts
                 ที่แบนเนอร์เรียกตอนผู้ใช้กด — ตรงนี้ทำหน้าที่แค่กู้สถานะของผู้ที่เคยเลือกไว้แล้ว
                 ให้ทันก่อน React hydrate เท่านั้น */
              gtag('js', new Date());
              ${
                gaId
                  ? `gtag('config', '${gaId}', {
                page_path: window.location.pathname,
                anonymize_ip: true,
                send_page_view: true
              });`
                  : ""
              }
              ${
                googleAdsId
                  ? `gtag('config', '${googleAdsId}', {
                page_path: window.location.pathname,
                send_page_view: false
              });`
                  : ""
              }
            `}
          </Script>
        </>
      )}


      {/* ======================================================== */}
      {/* 🎯 Meta Pixel (Facebook & Instagram)                     */}
      {/* ======================================================== */}
      {metaPixelId && (
        <Script id="meta-pixel-init" strategy="lazyOnload">
          {`
            /* ⚠️ ต้องกั้นตั้งแต่ "ตัวโหลด" ไม่ใช่แค่ fbq('init')
               ลำพังการดึง fbevents.js จาก connect.facebook.net ก็ส่ง IP และ Referer
               ของผู้ใช้ไปให้ Meta แล้ว ซึ่งเป็นการส่งข้อมูลออกนอกเว็บก่อนได้รับความยินยอม
               (ต่างจาก GA4 ที่มี Consent Mode v2 รองรับ โหลดแท็กไว้ก่อนได้เพราะมันเคารพ
               สถานะ denied เอง ไม่วางคุกกี้และไม่ส่งตัวระบุตัวตน) */
            function seertarotInitPixel() {
              if (window.__seertarotPixelReady) return;
              window.__seertarotPixelReady = true;
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
            }
            try {
              if (localStorage.getItem('seertarot_analytics_consent_v1') === 'granted') {
                seertarotInitPixel();
              }
            } catch (e) {}
            window.addEventListener('seertarot:consent-changed', function (ev) {
              if (ev.detail === 'granted') seertarotInitPixel();
            });
          `}
        </Script>
      )}

      {/* ======================================================== */}
      {/* 🧭 Client-Side SPA Route Change Listener                  */}
      {/* ======================================================== */}
      <Suspense fallback={null}>
        <PageViewTracker gaId={gaId} metaPixelId={metaPixelId} googleAdsId={googleAdsId} />
      </Suspense>
    </>

  );
}
