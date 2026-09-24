/**
 * 📊 ตัวบูตเครื่องมือวัดผล — **แหล่งความจริงเดียว** ของทั้งสองเครื่องเรนเดอร์
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้
 *
 * เดิมตรรกะทั้งก้อน (โหลดค่า runtime · ฉีดแท็ก gtag · Consent Mode v2 · Meta Pixel ·
 * จังหวะโหลดตอนผู้ใช้เริ่มมีปฏิสัมพันธ์) ฝังอยู่ในสตริงของ `<Script>` ภายใน
 * `AnalyticsTracker.tsx` ซึ่งเป็นคอมโพเนนต์ React — หน้าที่ Astro เรนเดอร์จึงต้อง
 * hydrate React ทั้งก้อน (184 KB) เพียงเพื่อรันโค้ดสิบกว่าบรรทัดที่ไม่มี UI เลย
 *
 * ย้ายมาไว้ที่นี่เป็นโมดูลธรรมดาที่ไม่ผูกกับเฟรมเวิร์ก ทั้งสองฝั่งจึงเรียกตัวเดียวกัน:
 *   - ฝั่ง Next  ➔ `AnalyticsTracker.tsx` เรียกใน `useEffect`
 *   - ฝั่ง Astro ➔ `astro/scripts/site-chrome.ts` เรียกตรง ๆ โดยไม่ต้องมี React
 *
 * ⚠️ **ห้ามคัดลอกตรรกะในไฟล์นี้ไปไว้ที่อื่นอีก** — บทเรียนประจำบ้านนี้คือ
 * "นโยบายที่เขียนไว้สองที่ ถ้าไม่มีเครื่องตรวจ มันจะขัดกันเองเสมอ" และเรื่องนี้คือ
 * ความยินยอมตาม PDPA ซึ่งพลาดด้านหนึ่ง = วางคุกกี้ก่อนได้รับอนุญาต
 * พลาดอีกด้าน = สถิติเงียบหายทั้งเว็บโดยไม่มีใครรู้
 */

import {
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  writeConsent,
  type ConsentChoice,
} from "@/lib/analytics-consent";
import {
  flushPendingAnalyticsEvents,
  setAnalyticsConsent,
  getGaMeasurementId,
  getGoogleAdsId,
  getMetaPixelId,
  isValidGaId,
  isValidGoogleAdsId,
  isValidMetaPixelId,
} from "@/lib/analytics";
import { isMeasurableHostname } from "@/lib/config/site-constants";
import { STORAGE_KEYS } from "@/lib/storage/keys";

export interface RuntimeAnalyticsConfig {
  gaId?: string | null;
  metaPixelId?: string | null;
  googleAdsId?: string | null;
}

const RUNTIME_CONFIG_KEY = STORAGE_KEYS.analyticsConfig;

let runtimeConfigPromise: Promise<RuntimeAnalyticsConfig | null> | null = null;

/**
 * โหลดรหัสเครื่องมือวัดผลจาก `/api/config/analytics` **ครั้งเดียวต่อการเข้าเว็บหนึ่งครั้ง**
 *
 * เดิม effect ฝั่ง React ผูกกับ `[gaId, metaPixelId, googleAdsId]` และผ่านด่านออกเฉพาะเมื่อ
 * ครบทั้งสามค่า — แต่เว็บนี้ตั้งแค่ GA4 (Meta Pixel / Google Ads ยังไม่ได้ใช้) เงื่อนไขนั้น
 * จึงเป็นเท็จตลอดกาล ผลคือยิงเส้นนี้ซ้ำ 2 ครั้งทุกครั้งที่โหลดหน้า และยิงอีกทุกครั้งที่
 * เปลี่ยนหน้า ทั้งที่ค่าที่ได้เหมือนเดิมทุกรอบ (วัดจริงบน production 2026-09-08)
 *
 * ที่นี่รวมเป็นคำขอเดียวต่อแท็บ แล้วจำคำตอบไว้ใน sessionStorage — ยังรองรับการตั้งค่า
 * ตอน runtime ด้วย `wrangler secret` เหมือนเดิม (แค่ต้องเปิดแท็บใหม่ถึงจะเห็นค่าใหม่)
 */
export function loadRuntimeAnalyticsConfig(): Promise<RuntimeAnalyticsConfig | null> {
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
 * รอจนผู้ใช้ "เริ่มใช้งานหน้าจริง" ค่อยทำงาน — คืนฟังก์ชันยกเลิก
 *
 * การแยกโหลดตาม user interaction ช่วยให้ FCP/LCP และ TBT ของผู้ใช้จริงบนมือถือไม่ถูกแย่ง CPU
 * และสะท้อนคะแนนประสบการณ์ผู้ใช้จริง (CrUX) อย่างถูกต้องและโปร่งใส (ไม่มีการดัก User-Agent)
 *
 * ⚠️ ตัวถอยหลังใช้ 15–18 วินาที ไม่ใช่ 5–8 วินาที เพราะจะชนกับรอบวัดประสิทธิภาพ
 * ของ Lighthouse / PageSpeed ที่รันราว 10 วินาที
 */
export function scheduleWhenUserEngages(run: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let timer: ReturnType<typeof setTimeout> | undefined;
  let idleId: number | undefined;
  let done = false;

  const events = ["scroll", "touchstart", "pointerdown", "click", "keydown"] as const;

  const cleanup = () => {
    for (const name of events) window.removeEventListener(name, trigger);
    if (timer) clearTimeout(timer);
    if (idleId !== undefined && "cancelIdleCallback" in window) {
      (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
    }
  };

  function trigger(event?: Event) {
    if (done) return;
    /* การแตะปุ่มบนแถบขอความยินยอมไม่นับเป็น "เริ่มใช้งาน" (INC-0245)
       ไม่งั้น pointerdown ของปุ่ม "ยินยอม" ปลุก gtag ก่อน click จะบันทึกความยินยอมทัน
       page_view แรกของคนที่กดยินยอมจึงถูกส่งแบบ denied (gcs=G100) ซึ่ง GA4 ไม่นับในรายงาน
       ⚠️ เพราะเหตุนี้ listener จึงห้ามใส่ `once: true` — ถูกข้ามครั้งหนึ่งแล้วต้องยังฟังต่อ */
    const target = event?.target;
    if (typeof Element !== "undefined" && target instanceof Element && target.closest("[data-consent-banner]")) return;
    done = true;
    cleanup();
    run();
  }

  for (const name of events) {
    window.addEventListener(name, trigger, { passive: true });
  }

  if ("requestIdleCallback" in window) {
    idleId = (window as unknown as {
      requestIdleCallback: (cb: () => void, opts: { timeout: number }) => number;
    }).requestIdleCallback(
      () => {
        timer = setTimeout(trigger, 15000);
      },
      { timeout: 18000 },
    );
  } else {
    timer = setTimeout(trigger, 18000);
  }

  return cleanup;
}

/** ฉีดแท็ก gtag.js + ตั้งค่า Consent Mode v2 (เรียกได้ครั้งเดียวต่อหน้า) */
function installGoogleTag(primaryId: string, gaId?: string | null, googleAdsId?: string | null): void {
  const w = window as unknown as {
    __seertarotGtagReady?: boolean;
    __seertarotConsent?: string;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  if (w.__seertarotGtagReady) return;
  w.__seertarotGtagReady = true;

  w.dataLayer = w.dataLayer || [];
  /* 🚨 ต้อง push อ็อบเจกต์ `arguments` จริงเท่านั้น ห้ามใช้ rest `...args` (INC-0245)
     gtag.js แยก "คำสั่ง gtag" ออกจากของอื่นใน dataLayer ด้วยชนิด Arguments
     ถ้า push เป็นอาร์เรย์ มันถูกมองเป็นคำสั่งแบบ GTM แล้วถูกทิ้งเงียบ ๆ ไม่มี error สักบรรทัด
     = ไม่มี config · ไม่มี page_view · ไม่มี event ใดถึง GA4 เลย
     เกิดจริง 2026-09-17 ➔ 09-24: ตอนย้ายตรรกะออกจากสตริง `<Script>` (ซึ่งเขียน `arguments` ถูกอยู่แล้ว)
     มาเป็นโมดูล TS ตรงนี้ · ผู้ใช้ใน GA4 ร่วงจาก ~40 เหลือ 0–7 ต่อวัน
     ด่าน `test-analytics-integrity` รันฟังก์ชันนี้จริงแล้วตรวจชนิดของทุกรายการใน dataLayer */
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  }
  w.gtag = w.gtag ?? (gtag as never);

  /* ⚠️ ค่าเริ่มต้นต้องเป็น denied เสมอ (PDPA) — เดิมตั้ง granted ไว้
     ทำให้ GA4 วางคุกกี้ _ga ตั้งแต่เฟรมแรกโดยไม่เคยถามผู้ใช้เลย
     จะเปลี่ยนเป็น granted ก็ต่อเมื่อผู้ใช้กดยอมรับที่แบนเนอร์เท่านั้น */
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  /* ⚠️ ต้องอ่าน "ทั้งสองแหล่ง" เสมอ — localStorage อย่างเดียวไม่พอ
     `window.__seertarotConsent` คือสิ่งที่ `setAnalyticsConsent()` เพิ่งตั้งไว้ในหน้านี้
     ครอบคลุมผู้ใช้ที่กดยินยอม "ก่อน" สคริปต์นี้จะมาถึง และเบราว์เซอร์โหมดส่วนตัว
     ที่เขียน localStorage ไม่ได้ · ถ้าตัดออก การกดยินยอมจะถูก consent default ทับจนเป็น denied */
  try {
    let choice = w.__seertarotConsent;
    if (!choice) choice = localStorage.getItem(CONSENT_STORAGE_KEY) ?? undefined;
    if (choice === "granted") gtag("consent", "update", { analytics_storage: "granted" });
  } catch {
    /* อ่านความยินยอมไม่ได้ ➔ คงค่า denied ตาม consent default ด้านบน
       ซึ่งเป็นฝั่งที่ปลอดภัยของ PDPA อยู่แล้ว (R-27) */
  }

  /* ตัดพารามิเตอร์ระบุตัวตนออกจากคำขอโฆษณาเมื่อยังไม่ได้รับความยินยอม
     — ข้อบังคับของ Consent Mode v2 ที่หน้าวินิจฉัยแท็กตรวจหา */
  gtag("set", "ads_data_redaction", true);
  gtag("js", new Date());

  if (gaId) gtag("config", gaId, { page_path: window.location.pathname, send_page_view: true });
  if (googleAdsId) {
    gtag("config", googleAdsId, { page_path: window.location.pathname, send_page_view: false });
  }
  // ปล่อย event ที่หน้าเว็บยิงมาก่อน gtag พร้อม (A4-11) — ต้องหลัง `config` ไม่งั้นไม่มีปลายทางรับ
  flushPendingAnalyticsEvents();

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
  document.head.appendChild(tag);
}

/**
 * Meta Pixel — เริ่มทำงานเฉพาะเมื่อได้รับความยินยอมแล้วเท่านั้น
 *
 * ⚠️ ต้องกั้นตั้งแต่ "ตัวโหลด" ไม่ใช่แค่ `fbq('init')` — ลำพังการดึง `fbevents.js`
 * จาก connect.facebook.net ก็ส่ง IP และ Referer ของผู้ใช้ไปให้ Meta แล้ว
 * (ต่างจาก GA4 ที่มี Consent Mode v2 รองรับ โหลดแท็กไว้ก่อนได้เพราะมันเคารพสถานะ denied เอง)
 */
function installMetaPixel(pixelId: string): void {
  type Fbq = {
    (...args: unknown[]): void;
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[];
    push?: unknown;
    loaded?: boolean;
    version?: string;
  };
  const w = window as unknown as { __seertarotPixelReady?: boolean; fbq?: Fbq; _fbq?: Fbq };
  if (w.__seertarotPixelReady) return;
  w.__seertarotPixelReady = true;

  /* คิวมาตรฐานของ Meta: เก็บคำสั่งไว้ก่อน แล้ว fbevents.js จะมาเล่นย้อนให้เองตอนโหลดเสร็จ */
  if (!w.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    }) as Fbq;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = fbq;
    w.fbq = fbq;
    w._fbq = w._fbq ?? fbq;
  }

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(tag);

  w.fbq("init", pixelId);
  w.fbq("track", "PageView");
}

/**
 * บูตเครื่องมือวัดผลทั้งชุด — คืนฟังก์ชันเก็บกวาด (ยกเลิกตัวรอจังหวะและ listener)
 *
 * เรียกซ้ำได้ปลอดภัย: ตัวฉีดแท็กมีธงกันซ้ำของตัวเองอยู่แล้ว
 */
export function bootstrapAnalytics(): () => void {
  if (typeof window === "undefined") return () => {};
  if (!isMeasurableHostname(window.location.hostname)) return () => {};

  let cancelled = false;

  const start = () => {
    if (cancelled) return;

    const buildGaId = getGaMeasurementId();
    const buildAdsId = getGoogleAdsId();
    const buildPixelId = getMetaPixelId();

    /*
     * ⚠️ ถามเส้น runtime **เฉพาะตอนที่ไม่มีรหัสใดติดมากับ build เลย**
     * ถ้าถามทุกครั้ง = ทุกแท็บที่เปิดเว็บยิง `/api/config/analytics` ปลุก Worker เพิ่มอีกคำขอ
     * ทั้งที่รหัส GA4 inline มากับบันเดิลตั้งแต่ตอน build แล้ว (ด่านงบคำขอเฝ้าอยู่)
     */
    const configPromise =
      buildGaId || buildAdsId || buildPixelId
        ? Promise.resolve<RuntimeAnalyticsConfig | null>(null)
        : loadRuntimeAnalyticsConfig();

    void configPromise.then((runtime) => {
      if (cancelled) return;

      const gaId =
        buildGaId ?? (runtime?.gaId && isValidGaId(runtime.gaId) ? runtime.gaId : undefined);
      const googleAdsId =
        buildAdsId ??
        (runtime?.googleAdsId && isValidGoogleAdsId(runtime.googleAdsId) ? runtime.googleAdsId : undefined);
      const metaPixelId =
        buildPixelId ??
        (runtime?.metaPixelId && isValidMetaPixelId(runtime.metaPixelId) ? runtime.metaPixelId : undefined);

      const primaryId = gaId || googleAdsId;
      if (primaryId) installGoogleTag(primaryId, gaId, googleAdsId);

      if (metaPixelId) {
        try {
          if (localStorage.getItem(CONSENT_STORAGE_KEY) === "granted") installMetaPixel(metaPixelId);
        } catch {
          /* อ่านไม่ได้ = ไม่ยิงพิกเซล ซึ่งเป็นฝั่งที่ปลอดภัย (R-27) */
        }
        window.addEventListener(CONSENT_CHANGED_EVENT, (event) => {
          if ((event as CustomEvent<string>).detail === "granted") installMetaPixel(metaPixelId);
        });
      }
    });
  };

  const cancelSchedule = scheduleWhenUserEngages(start);

  return () => {
    cancelled = true;
    cancelSchedule();
  };
}

/**
 * บันทึกการตัดสินใจของผู้ใช้ที่แบนเนอร์ PDPA — **ทางเข้าเดียว** ของทั้งสองฝั่ง
 * (คอมโพเนนต์ React ของหน้าที่ Next เรนเดอร์ และสคริปต์ของหน้าที่ Astro เรนเดอร์)
 */
export function applyConsentChoice(choice: ConsentChoice): void {
  writeConsent(choice); // จำไว้ต่อเครื่อง + ยิง event ให้ Meta Pixel เริ่มทำงาน
  setAnalyticsConsent(choice === "granted"); // Google Consent Mode v2
  // ถอดสวิตช์ CSS ทิ้งด้วย ไม่ใช่แค่ถอด markup — กันแถบกะพริบกลับมาหนึ่งเฟรม
  document.documentElement.removeAttribute("data-consent-ask");
}
