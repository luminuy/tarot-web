"use client";

import { useEffect, useState, useRef, Suspense } from "react";

import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { isMeasurableHostname } from "@/lib/config/site";
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

interface RuntimeAnalyticsConfig {
  gaId?: string | null;
  metaPixelId?: string | null;
  googleAdsId?: string | null;
}

const RUNTIME_CONFIG_KEY = "tarot_analytics_config";

/**
 * โหลดรหัสเครื่องมือวัดผลจาก `/api/config/analytics` **ครั้งเดียวต่อการเข้าเว็บหนึ่งครั้ง**
 * ---------------------------------------------------------------------------
 * เดิม effect ด้านล่างผูกกับ `[gaId, metaPixelId, googleAdsId]` และผ่านด่านออกเฉพาะเมื่อ
 * ครบทั้งสามค่า — แต่เว็บนี้ตั้งแค่ GA4 (Meta Pixel / Google Ads ยังไม่ได้ใช้) เงื่อนไขนั้น
 * จึงเป็นเท็จตลอดกาล ผลคือยิงเส้นนี้ซ้ำ 2 ครั้งทุกครั้งที่โหลดหน้า และยิงอีกทุกครั้งที่
 * เปลี่ยนหน้า ทั้งที่ค่าที่ได้เหมือนเดิมทุกรอบ (วัดจริงบน production 2026-09-08)
 *
 * ที่นี่รวมเป็นคำขอเดียวต่อแท็บ แล้วจำคำตอบไว้ใน sessionStorage — ยังรองรับการตั้งค่า
 * ตอน runtime ด้วย `wrangler secret` เหมือนเดิม (แค่ต้องเปิดแท็บใหม่ถึงจะเห็นค่าใหม่)
 */
let runtimeConfigPromise: Promise<RuntimeAnalyticsConfig | null> | null = null;

function loadRuntimeAnalyticsConfig(): Promise<RuntimeAnalyticsConfig | null> {
  if (runtimeConfigPromise) return runtimeConfigPromise;

  try {
    const cached = window.sessionStorage.getItem(RUNTIME_CONFIG_KEY);
    if (cached) {
      runtimeConfigPromise = Promise.resolve(JSON.parse(cached) as RuntimeAnalyticsConfig);
      return runtimeConfigPromise;
    }
  } catch {
    // อ่าน sessionStorage ไม่ได้ (โหมดส่วนตัว) — ยิงถามตามปกติ
  }

  runtimeConfigPromise = fetch("/api/config/analytics")
    .then((res) => (res.ok ? (res.json() as Promise<RuntimeAnalyticsConfig>) : null))
    .then((data) => {
      if (data) {
        try {
          window.sessionStorage.setItem(RUNTIME_CONFIG_KEY, JSON.stringify(data));
        } catch {
          // เขียนไม่ได้ก็ยังมีแคชระดับโมดูลคุมไม่ให้ยิงซ้ำในหน้านี้อยู่ดี
        }
      }
      return data;
    })
    .catch(() => null);

  return runtimeConfigPromise;
}

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
  /**
   * 🌐 ยิงแท็กเฉพาะบนโดเมนจริงเท่านั้น
   * -------------------------------------------------------------------------
   * `tarot-web.bankjack10452.workers.dev` (โดเมน preview ของ Cloudflare) เป็นสำเนา
   * ของเว็บที่ตอบ 200 และยิงแท็ก GA4 ตัวเดียวกัน — Google จึงนับเป็นอีกโดเมนหนึ่งและขึ้น
   * "ตรวจพบโดเมนเพิ่มเติมสำหรับการกำหนดค่า" ในหน้าวินิจฉัยแท็ก (ตรวจจริง 2026-09-09)
   *
   * ต้องอ่านหลัง mount เพราะหน้าเว็บ prerender ไว้ — host รู้ได้ที่เบราว์เซอร์เท่านั้น
   * ไม่ใช่ตอน build (ห้ามเรียก `headers()` ใน RootHtml เด็ดขาด ดู INC-0091)
   */
  const [isMeasurableHost, setIsMeasurableHost] = useState(false);
  useEffect(() => {
    setIsMeasurableHost(isMeasurableHostname(window.location.hostname));
  }, []);

  const [gaId, setGaId] = useState<string | undefined>(() => getGaMeasurementId());
  const [metaPixelId, setMetaPixelId] = useState<string | undefined>(() => getMetaPixelId());
  const [googleAdsId, setGoogleAdsId] = useState<string | undefined>(() => getGoogleAdsId());

  // ดึง configuration จาก runtime endpoint เฉพาะตอนที่ "ไม่มีรหัสสักตัวเดียว" ติดมากับ build
  // ⚠️ dependency ต้องว่างเสมอ — ใส่ id ทั้งสามเป็น dependency เมื่อไร จะกลับไปยิงซ้ำ
  //    ทุกครั้งที่ setState สำเร็จ (บทเรียนเดิม: 2 คำขอต่อการโหลดหนึ่งหน้า)
  //
  // ⚠️ เงื่อนไขเดิมคือ `gaId && metaPixelId && googleAdsId` ซึ่งเป็นเท็จตลอดกาลบน production
  //    เพราะเว็บนี้ตั้งแค่ GA4 (Meta Pixel / Google Ads ยังไม่ได้ใช้ และอาจไม่ได้ใช้อีกนาน)
  //    ผลคือทุกแท็บที่เปิดเว็บยังยิง `/api/config/analytics` ปลุก Worker อีก 1 คำขอเสมอ
  //    ทั้งที่รหัส GA4 inline มากับบันเดิลตั้งแต่ตอน build แล้ว (NEXT_PUBLIC_GA_ID ใน deploy.yml)
  //    เปลี่ยนเป็น `||` = ถ้ามีรหัสใดติดมากับ build ถือว่าตั้งค่าผ่านทางที่เป็นทางการแล้ว ไม่ต้องถามซ้ำ
  //
  // 📌 ผลข้างเคียงที่ยอมรับ: ถ้าวันหน้าจะเพิ่ม Meta Pixel / Google Ads ต้องตั้งเป็น
  //    NEXT_PUBLIC_* ตอน build (GitHub Actions) เหมือน GA4 — ตั้งด้วย `wrangler secret`
  //    อย่างเดียวจะไม่ถูกหยิบมาใช้ เพราะเส้น runtime นี้จะไม่ถูกยิงอีกแล้ว
  useEffect(() => {
    if (gaId || metaPixelId || googleAdsId) return;

    let isMounted = true;
    loadRuntimeAnalyticsConfig().then((data) => {
      if (!isMounted || !data) return;
      if (data.gaId && isValidGaId(data.gaId)) setGaId((prev) => prev ?? data.gaId!);
      if (data.metaPixelId && isValidMetaPixelId(data.metaPixelId)) {
        setMetaPixelId((prev) => prev ?? data.metaPixelId!);
      }
      if (data.googleAdsId && isValidGoogleAdsId(data.googleAdsId)) {
        setGoogleAdsId((prev) => prev ?? data.googleAdsId!);
      }
    });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ซิงก์ Google Ads Config เมื่อได้รับ ID มาภายหลัง (Runtime)
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.gtag === "function" && googleAdsId) {
      window.gtag("config", googleAdsId, {
        page_path: window.location.pathname,
        send_page_view: false,
      });
    }
  }, [googleAdsId]);

  const primaryGtagId = isMeasurableHost ? gaId || googleAdsId : undefined;

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
              /* ⚠️ ต้องอ่าน "ทั้งสองแหล่ง" เสมอ — localStorage อย่างเดียวไม่พอ
                 window.__seertarotConsent คือสิ่งที่ setAnalyticsConsent() เพิ่งตั้งไว้
                 ในหน้านี้ ครอบคลุมผู้ใช้ที่กดยินยอม "ก่อน" สคริปต์นี้จะมาถึง (lazyOnload)
                 และเบราว์เซอร์โหมดส่วนตัวที่เขียน localStorage ไม่ได้
                 ถ้าตัดออก การกดยินยอมจะถูก consent default ด้านบนทับจนเป็น denied ทั้งหมด */
              try {
                var seertarotChoice = window.__seertarotConsent;
                if (!seertarotChoice) {
                  seertarotChoice = localStorage.getItem('seertarot_analytics_consent_v1');
                }
                if (seertarotChoice === 'granted') {
                  gtag('consent', 'update', { 'analytics_storage': 'granted' });
                }
              } catch (e) {}
              /* ตัดพารามิเตอร์ระบุตัวตนออกจากคำขอโฆษณาเมื่อยังไม่ได้รับความยินยอม
                 — ข้อบังคับของ Consent Mode v2 ที่หน้าวินิจฉัยแท็กตรวจหา */
              gtag('set', 'ads_data_redaction', true);
              /* การเปลี่ยนใจระหว่างเซสชันจัดการโดย setAnalyticsConsent() ใน src/lib/analytics.ts
                 ที่แบนเนอร์เรียกตอนผู้ใช้กด — ตรงนี้ทำหน้าที่แค่กู้สถานะของผู้ที่เคยเลือกไว้แล้ว
                 ให้ทันก่อน React hydrate เท่านั้น */
              gtag('js', new Date());
              ${
                gaId
                  ? `gtag('config', '${gaId}', {
                page_path: window.location.pathname,
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
      {isMeasurableHost && metaPixelId && (
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

      {/* ประตูความยินยอมที่คุมสคริปต์ด้านบนทั้งหมด — วางไว้ที่นี่แทนที่จะไปแขวนใน
          RootHtml เพราะ RootHtml เป็น server component การอ้างถึง client component
          จากที่นั่นต้องถูก serialize ลง flight payload ของทุกหน้าที่ prerender
          (ทำให้ /cards/birth-card ซึ่งชนเพดานงบ HTML พอดีอยู่แล้วล้นออกไป 1 KB) */}
      <ConsentBanner />
    </>

  );
}
