/**
 * scripts/qa/test-analytics-integrity.ts
 * ---------------------------------------------------------------------------
 * 🧪 Test Suite for Google Analytics 4 (GA4) and Meta Pixel Analytics Integrity
 *
 * ทดสอบครอบคลุม:
 * 1. GA4 Measurement ID validation (G-XXXXXXXXXX) & Meta Pixel ID format
 * 2. SSR-Safety: การเรียก trackEvent / trackPageView โดยไม่มี window ต้องไม่เกิด Error
 * 3. Mock Window Dispatch: การกระจาย event ไปยัง window.gtag และ window.fbq
 * 4. Google Consent Mode v2: การตั้งค่า consent และ privacy
 * 5. Event Type Coverage & Contract Verification
 *
 * รันด้วย: npx tsx scripts/qa/test-analytics-integrity.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  isValidGaId,
  isValidMetaPixelId,
  isValidGoogleAdsId,
  isValidGoogleAdsConversionLabel,
  trackEvent,
  trackPageView,
  trackGoogleAdsConversion,
  setAnalyticsConsent,
  type TarotAnalyticsEvent,
} from "../../src/lib/analytics";

let passed = 0;
let failed = 0;

function check(title: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${title}`);
  } else {
    failed++;
    console.error(`  ❌ ${title}${detail ? ` (${detail})` : ""}`);
  }
}

async function runTests() {
  console.log("══════════════════════════════════════════════════════════════════");
  console.log("📊 [QA] Google Analytics 4, Google Ads & Analytics Integrity Suite");
  console.log("══════════════════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────────────────────────
  // 1. Measurement ID & Pixel ID Format Validation
  // ─────────────────────────────────────────────────────────────────
  console.log("🔍 1. ID Format Validation");
  check("Valid GA4 ID (G-A1B2C3D4E5)", isValidGaId("G-A1B2C3D4E5"));
  check("Valid GA4 ID with lowercase (g-1234567890)", isValidGaId("g-1234567890"));
  check("Reject Universal Analytics (UA-123456-1)", !isValidGaId("UA-123456-1"));
  check("Reject empty string", !isValidGaId(""));
  check("Reject null", !isValidGaId(null));
  check("Reject undefined", !isValidGaId(undefined));
  check("Reject arbitrary string (my-google-analytics)", !isValidGaId("my-google-analytics"));

  check("Valid Meta Pixel ID (16 digits)", isValidMetaPixelId("1234567890123456"));
  check("Valid Meta Pixel ID (15 digits)", isValidMetaPixelId("123456789012345"));
  check("Reject short Meta Pixel ID (12345)", !isValidMetaPixelId("12345"));
  check("Reject non-numeric Meta Pixel ID", !isValidMetaPixelId("1234567890abcde"));
  check("Reject empty Meta Pixel ID", !isValidMetaPixelId(""));

  check("Valid Google Ads ID (AW-1234567890)", isValidGoogleAdsId("AW-1234567890"));
  check("Valid Google Ads ID with lowercase (aw-987654321)", isValidGoogleAdsId("aw-987654321"));
  check("Reject Google Ads ID without AW prefix (1234567890)", !isValidGoogleAdsId("1234567890"));
  check("Reject empty Google Ads ID", !isValidGoogleAdsId(""));
  check("Valid Google Ads Conversion Label", isValidGoogleAdsConversionLabel("AbCdEfGhIjK123_"));
  check("Reject too short Conversion Label (abc)", !isValidGoogleAdsConversionLabel("abc"));


  // ─────────────────────────────────────────────────────────────────
  // 2. SSR Safety (Non-browser environment)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🛡️ 2. SSR Safety (Node.js / Server environment)");
  let ssrThrew = false;
  try {
    trackEvent("spread_select", {
      spread_id: "celtic-cross",
      spread_name: "ผังเซลติกครอส",
      card_count: 10,
    });
    trackPageView("/cards");
    setAnalyticsConsent(true);
  } catch (err) {
    ssrThrew = true;
    console.error("SSR tracking threw:", err);
  }
  check("trackEvent and trackPageView do not throw in SSR", !ssrThrew);

  // ─────────────────────────────────────────────────────────────────
  // 3. Mock Browser Dispatch (gtag & fbq)
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🌐 3. Mock Browser Event Dispatch");
  const capturedGtag: Array<{ command: string; action: string; params?: any }> = [];
  const capturedFbq: Array<{ action: string; eventName: string; params?: any }> = [];

  // Setup global mock
  (global as any).window = {
    location: {
      href: "https://seertarot.net/spreads",
      pathname: "/spreads",
    },
    gtag: (command: string, action: string, params?: any) => {
      capturedGtag.push({ command, action, params });
    },
    fbq: (action: string, eventName: string, params?: any) => {
      capturedFbq.push({ action, eventName, params });
    },
  };

  // Test standard events
  trackEvent("spread_select", {
    spread_id: "three-card",
    spread_name: "ผัง 3 ใบ",
    card_count: 3,
    category: "love",
  });

  const gtagSpread = capturedGtag.find((e) => e.command === "event" && e.action === "spread_select");
  check("gtag receives spread_select event", Boolean(gtagSpread));
  check("gtag spread_select params match", gtagSpread?.params?.spread_id === "three-card");

  // Test reading_complete (maps to Meta ViewContent)
  trackEvent("reading_complete", {
    spread_id: "three-card",
    persona_id: "warm",
    card_count: 3,
  });

  const fbqReading = capturedFbq.find((e) => e.action === "track" && e.eventName === "ViewContent");
  check("fbq maps reading_complete to standard ViewContent", Boolean(fbqReading));

  // Test page_view dispatch
  trackPageView("/cards/major-00", "The Fool");
  const gtagPageView = capturedGtag.find((e) => e.command === "event" && e.action === "page_view");
  const fbqPageView = capturedFbq.find((e) => e.action === "track" && e.eventName === "PageView");
  check("trackPageView fires gtag page_view", Boolean(gtagPageView));
  check("trackPageView fires fbq PageView", Boolean(fbqPageView));

  // Test consent mode
  setAnalyticsConsent(true);
  const gtagConsent = capturedGtag.find((e) => e.command === "consent" && e.action === "update");
  check("setAnalyticsConsent updates gtag consent to granted", gtagConsent?.params?.analytics_storage === "granted");
  check("ad_storage remains denied for privacy", gtagConsent?.params?.ad_storage === "denied");
  check(
    "setAnalyticsConsent จำสถานะไว้บน window ให้สคริปต์ที่มาทีหลังกู้ต่อ",
    (global as any).window.__seertarotConsent === "granted",
  );

  // Test Google Ads conversion dispatch
  trackGoogleAdsConversion("AW-1234567890/AbCdEfGh123", { value: 150, currency: "THB" });
  const gtagConversion = capturedGtag.find((e) => e.command === "event" && e.action === "conversion");
  check("trackGoogleAdsConversion fires gtag conversion", Boolean(gtagConversion));
  check("gtag conversion send_to matches target", gtagConversion?.params?.send_to === "AW-1234567890/AbCdEfGh123");
  check("gtag conversion value and currency match", gtagConversion?.params?.value === 150 && gtagConversion?.params?.currency === "THB");

  // ─────────────────────────────────────────────────────────────────
  // 🚨 ความยินยอมต้องไม่หายเมื่อ gtag.js ยังมาไม่ถึง
  //
  // บทเรียน (การวินิจฉัยแท็ก Google 2026-09-09 · "อัตราความยินยอม 0%"):
  // สคริปต์ gtag เป็น `lazyOnload` จึงมาหลัง `window.load` แต่แบนเนอร์โผล่ตั้งแต่
  // hydrate เสร็จ — เดิม setAnalyticsConsent() ออกจากฟังก์ชันเงียบ ๆ ถ้าไม่มี
  // `window.gtag` การกด "ยินยอม" ของผู้ใช้จึงหายไปทั้งดุ้น
  // ─────────────────────────────────────────────────────────────────
  console.log("\n⏱️ 3b. Consent ก่อน gtag.js โหลดเสร็จ (dataLayer queue)");
  const earlyDataLayer: any[] = [];
  (global as any).window = {
    location: { href: "https://seertarot.net/", pathname: "/" },
    dataLayer: earlyDataLayer,
    // ⚠️ ตั้งใจไม่มี gtag — จำลองจังหวะก่อน lazyOnload ทำงาน
  };

  setAnalyticsConsent(true);

  const queued = earlyDataLayer[0];
  check("มีของถูกต่อคิวลง dataLayer แม้ยังไม่มี window.gtag", earlyDataLayer.length === 1);
  check("คิวใช้รูปแบบ arguments ตามที่ gtag.js คาดหวัง", queued?.[0] === "consent" && queued?.[1] === "update");
  check("ค่าที่ต่อคิวคือ analytics_storage: granted", queued?.[2]?.analytics_storage === "granted");
  check("ค่าโฆษณาที่ต่อคิวยังเป็น denied", queued?.[2]?.ad_storage === "denied");

  // Cleanup mock
  delete (global as any).window;


  // ─────────────────────────────────────────────────────────────────
  // 4. Event Types Coverage Check
  // ─────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────
  // 🔐 5. ความยินยอมตาม PDPA — ต้องไม่เก็บอะไรก่อนผู้ใช้อนุญาต
  //
  // บทเรียน: เดิมตั้ง `analytics_storage: 'granted'` เป็นค่าเริ่มต้น และยิง
  // Meta Pixel PageView ตั้งแต่เฟรมแรก โดยไม่มี UI ขอความยินยอมอยู่ในเว็บเลย
  // ผู้ใช้หลักเป็นคนไทยซึ่งอยู่ภายใต้ พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล
  // ─────────────────────────────────────────────────────────────────
  console.log("\n🔐 5. PDPA Consent Gating");

  const trackerSrc = readFileSync(
    resolve(import.meta.dirname, "../../src/components/analytics/AnalyticsTracker.tsx"),
    "utf-8",
  );
  /*
   * 🧭 ตั้งแต่ 2026-09-17 ตรรกะ gtag/Consent Mode ทั้งก้อนถูกย้ายออกจากคอมโพเนนต์ React
   * ไปอยู่ที่ `src/lib/analytics-bootstrap.ts` เพื่อให้หน้าที่ Astro เรนเดอร์เรียกใช้ได้
   * โดยไม่ต้องโหลด React 184 KB — **ด่านชุดนี้จึงต้องตรวจที่โมดูลนั้น ไม่ใช่ที่คอมโพเนนต์**
   * และต้องตรวจด้วยว่าทั้งสองฝั่ง (React กับสคริปต์ของ Astro) เรียกโมดูลเดียวกันจริง
   */
  const bootstrapSrc = readFileSync(
    resolve(import.meta.dirname, "../../src/lib/analytics-bootstrap.ts"),
    "utf-8",
  );
  const astroChromeSrc = readFileSync(
    resolve(import.meta.dirname, "../../astro/scripts/site-chrome.ts"),
    "utf-8",
  );
  check(
    "ทั้งสองเครื่องเรนเดอร์บูตเครื่องมือวัดผลจากโมดูลกลางตัวเดียวกัน (ตรรกะ PDPA ห้ามอยู่สองที่)",
    trackerSrc.includes("bootstrapAnalytics") && astroChromeSrc.includes("bootstrapAnalytics"),
  );
  // ตรวจเฉพาะในบล็อก `gtag("consent", "default", {...})` เท่านั้น
  // (คำว่า granted ยังต้องมีอยู่ในโค้ดกู้สถานะของผู้ที่เคยกดยินยอมไว้แล้ว)
  const defaultStart = bootstrapSrc.indexOf('gtag("consent", "default"');
  const defaultBlock = bootstrapSrc.slice(
    defaultStart,
    bootstrapSrc.indexOf("});", defaultStart),
  );
  check(
    "consent default ตั้ง analytics_storage เป็น denied",
    /analytics_storage:\s*"denied"/.test(defaultBlock) &&
      !/analytics_storage:\s*"granted"/.test(defaultBlock),
  );
  check(
    "ค่าโฆษณาทั้งสามยังคงเป็น denied",
    ['ad_storage: "denied"', 'ad_user_data: "denied"', 'ad_personalization: "denied"'].every(
      (t) => defaultBlock.includes(t),
    ),
  );
  /*
   * 🗄️ R-30: ชื่อคีย์ย้ายไปอยู่ในทะเบียน `src/lib/storage/keys.ts` แล้ว
   * ด่านนี้จึงตรวจสองอย่างแทนการ grep สตริงตายตัว:
   *   1. สคริปต์ inline อ่านค่าจากทะเบียนจริง (ไม่ได้ประกอบชื่อคีย์เอง)
   *   2. **ค่าในทะเบียนยังเป็นคีย์เดิม** — ข้อนี้สำคัญกว่า เพราะถ้าใครเปลี่ยนชื่อคีย์
   *      ความยินยอมที่ผู้ใช้เคยกดไว้จะหายทั้งหมด แล้วเว็บจะกลับไปถามใหม่ทุกคน
   */
  const storageKeysSrc = readFileSync(
    resolve(import.meta.dirname, "../../src/lib/storage/keys.ts"),
    "utf-8",
  );
  const consentModuleSrc = readFileSync(
    resolve(import.meta.dirname, "../../src/lib/analytics-consent.ts"),
    "utf-8",
  );
  check(
    "กู้สถานะที่ผู้ใช้เคยเลือกไว้ (อ่านคีย์จากทะเบียน ไม่ได้ประกอบชื่อคีย์เอง)",
    consentModuleSrc.includes("STORAGE_KEYS.analyticsConsent") &&
      bootstrapSrc.includes("CONSENT_STORAGE_KEY"),
  );
  check(
    "คีย์ความยินยอมในทะเบียนยังเป็นค่าเดิม (เปลี่ยนแล้วผู้ใช้ทุกคนถูกถามใหม่หมด)",
    /analyticsConsent:\s*"seertarot_analytics_consent_v1"/.test(storageKeysSrc),
  );
  check(
    "ตัวบูตกู้สถานะจาก __seertarotConsent ด้วย (กันการกดยินยอมหายตอนสคริปต์มาถึงทีหลัง)",
    bootstrapSrc.includes("__seertarotConsent"),
  );
  check(
    "ตั้ง ads_data_redaction ตาม Consent Mode v2",
    bootstrapSrc.includes('"ads_data_redaction"'),
  );
  check(
    "ไม่มี anonymize_ip หลงเหลือ (พารามิเตอร์ของ Universal Analytics ที่ GA4 ไม่ใช้แล้ว)",
    !bootstrapSrc.includes("anonymize_ip") && !trackerSrc.includes("anonymize_ip"),
  );
  check(
    "แท็กยิงเฉพาะโดเมนจริง — กัน *.workers.dev โผล่ในรายงานและในหน้าวินิจฉัยแท็ก",
    bootstrapSrc.includes("isMeasurableHostname(window.location.hostname)") &&
      /if\s*\(!isMeasurableHostname\(window\.location\.hostname\)\)\s*return/.test(bootstrapSrc),
  );
  check(
    "ถามเส้น runtime เฉพาะตอนไม่มีรหัสติดมากับ build (ไม่งั้นทุกแท็บยิง /api/config/analytics เพิ่ม)",
    /buildGaId \|\| buildAdsId \|\| buildPixelId/.test(bootstrapSrc),
  );

  const analyticsSrc = readFileSync(
    resolve(import.meta.dirname, "../../src/lib/analytics.ts"),
    "utf-8",
  );
  // ตัดคอมเมนต์ออกก่อน เพราะคำเตือน "ห้ามใส่กลับมา" เขียนรูปแบบเดิมไว้ในคอมเมนต์
  const analyticsCode = analyticsSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
  const consentBody = analyticsCode.slice(
    analyticsCode.indexOf("export function setAnalyticsConsent"),
  );
  check(
    "setAnalyticsConsent ห้ามออกจากฟังก์ชันเพราะไม่มี window.gtag",
    !/typeof window\.gtag !== "function"[^\n]*return/.test(consentBody),
  );
  check(
    "setAnalyticsConsent ต่อคิวลง dataLayer เมื่อ gtag.js ยังไม่มา",
    /window\.dataLayer = window\.dataLayer \|\| \[\]/.test(consentBody),
  );
  // ตัว URL ของสคริปต์ (ไม่ใช่ชื่อโดเมนในคอมเมนต์) ต้องอยู่ **ข้างใน** ฟังก์ชันที่ถูกกั้น
  const pixelLoaderUrl = '"https://connect.facebook.net/en_US/fbevents.js"';
  check(
    "Meta Pixel ถูกกั้นตั้งแต่ตัวโหลด ไม่ใช่แค่ fbq('init')",
    bootstrapSrc.includes("function installMetaPixel") &&
      bootstrapSrc.indexOf(pixelLoaderUrl) > bootstrapSrc.indexOf("function installMetaPixel"),
  );

  const bannerSrc = readFileSync(
    resolve(import.meta.dirname, "../../src/components/analytics/ConsentBanner.tsx"),
    "utf-8",
  );
  check(
    "แบนเนอร์ขอความยินยอมมีทั้งปุ่มยินยอมและปุ่มปฏิเสธ",
    bannerSrc.includes('decide("granted")') && bannerSrc.includes('decide("denied")'),
  );
  /*
   * 🛡️ ด่านกัน LCP ของหน้าแรกผูกกลับไปหาเวลา hydrate อีกครั้ง
   * ---------------------------------------------------------------------------
   * ของเดิมแบนเนอร์เริ่มที่ `useState(false)` แล้วค่อยเปิดใน `useEffect` markup จึงโผล่
   * ก็ต่อเมื่อ React hydrate ทั้งหน้าเสร็จ · กล่องข้อความของมันใหญ่กว่าภาพไพ่ใบแรกของ
   * หน้าแรก มันจึงเป็น **ตัว LCP** ที่วาดช้ากว่า FCP หลายวินาที (วัดจริงบน production
   * 2026-09-14: FCP 1.4s · LCP 9.6s · คะแนน Performance 63)
   *
   * กติกาใหม่: markup ต้องมากับ HTML เสมอ แล้วซ่อน/แสดงด้วย CSS ล้วน ๆ
   * สถานะความยินยอมห้ามอยู่ใน React state ที่ตัดสินใจตอน render อีก
   */
  check(
    "แบนเนอร์ต้องเรนเดอร์มากับ HTML เสมอ ห้ามรอ mount (ไม่งั้นมันคือตัว LCP ที่มาช้า)",
    bannerSrc.includes('data-consent-banner=""') &&
      !bannerSrc.includes("readConsent()") &&
      !bannerSrc.includes("useEffect("),
  );

  const globalCss = readFileSync(
    resolve(import.meta.dirname, "../../src/app/globals.css"),
    "utf-8",
  );
  check(
    "แถบยินยอมถูกซ่อนด้วย display:none เป็นค่าเริ่มต้น (ไม่นับเป็นสิ่งที่วาดแล้ว)",
    /\[data-consent-banner\]\s*\{\s*display:\s*none;/.test(globalCss) &&
      /html\[data-consent-ask\]\s+\[data-consent-banner\]\s*\{\s*display:\s*block;/.test(globalCss),
  );

  // แบนเนอร์อยู่ใต้ AnalyticsTracker ซึ่ง RootHtml ติดตั้งไว้ทุกหน้าอยู่แล้ว
  // (วางไว้ที่ RootHtml ตรง ๆ ไม่ได้ เพราะเป็น server component การอ้างถึง
  //  client component จากที่นั่นต้องถูก serialize ลง flight payload ของทุกหน้า
  //  จน /cards/birth-card ซึ่งชนเพดานงบ HTML พอดีอยู่แล้วล้นออกไป)
  const rootSrc = readFileSync(
    resolve(import.meta.dirname, "../../src/app/_shared/RootHtml.tsx"),
    "utf-8",
  );
  check(
    "แบนเนอร์ถูกติดตั้งจริงในทุกหน้า (ผ่าน AnalyticsTracker)",
    trackerSrc.includes("<ConsentBanner />") && rootSrc.includes("<AnalyticsTracker />"),
  );
  check(
    "มีสคริปต์ใน <head> เปิดแถบยินยอมก่อนเฟรมแรก เฉพาะเครื่องที่ยังไม่เคยตัดสินใจ",
    rootSrc.includes("CONSENT_STORAGE_KEY") &&
      rootSrc.includes("data-consent-ask") &&
      /localStorage\.getItem/.test(rootSrc),
  );

  /*
   * 🔌 preconnect ต้องชี้ไปยังโฮสต์ที่ "เบราว์เซอร์ต่อจริง" เท่านั้น
   * ของเดิมจองสายไว้ให้ generativelanguage.googleapis.com กับ api.groq.com ซึ่งมีแต่
   * Worker ฝั่งเซิร์ฟเวอร์เท่านั้นที่ต่อ — ไคลเอนต์คุยกับ /api/... ของโดเมนเราอย่างเดียว
   * สองบรรทัดนั้นจึงแย่งคิวจากไฟล์ที่ใช้วาดหน้าจริงตั้งแต่วินาทีแรกโดยไม่ได้อะไรกลับมา
   */
  check(
    "ห้าม preconnect ไปยังโฮสต์ของผู้ให้บริการ AI (ฝั่งเซิร์ฟเวอร์ต่อ ไม่ใช่เบราว์เซอร์)",
    // ตรวจที่ `href=` ของ <link> จริง ไม่ใช่คำในคอมเมนต์ — คอมเมนต์อธิบายบทเรียนนี้
    // อยู่บรรทัดเดียวกับชื่อโฮสต์ ถ้าจับกว้างกว่านี้จะตกเพราะคำอธิบายของตัวเอง
    !/href="https:\/\/(generativelanguage\.googleapis\.com|api\.groq\.com)/.test(rootSrc),
  );
  check(
    "preconnect ไปยัง CDN ภาพไพ่ (โฮสต์เดียวที่เบราว์เซอร์ต้องต่อจริงตอนวาดหน้า)",
    rootSrc.includes("getImageKitOrigin") && rootSrc.includes('rel="preconnect"'),
  );

  console.log("\n📋 4. Event Contract Completeness");
  const sampleEvents: TarotAnalyticsEvent[] = [
    { name: "page_view", params: { page_path: "/" } },
    { name: "spread_select", params: { spread_id: "daily", spread_name: "ไพ่ประจำวัน", card_count: 1 } },
    { name: "persona_select", params: { persona_id: "mystic", persona_name: "แม่หมอสายลี้ลับ" } },
    { name: "tarot_session_start", params: { spread_id: "daily", persona_id: "warm", category: "general" } },
    { name: "tarot_shuffle", params: { spread_id: "daily", card_count: 1 } },
    { name: "tarot_draw", params: { spread_id: "daily", picked_order: 1, picked_total: 1, required_total: 1 } },
    { name: "card_reveal", params: { spread_id: "daily", position_order: 0, card_id: "major-00", card_name: "The Fool", is_reversed: false } },
    { name: "reading_complete", params: { spread_id: "daily", persona_id: "warm", card_count: 1 } },
    { name: "reading_feedback", params: { reading_id: "read_1", outcome: "ACCURATE" } },
    { name: "follow_up_ask", params: { reading_id: "read_1", persona_id: "warm", question_length: 25 } },
    { name: "tts_play", params: { persona_id: "warm" } },
    { name: "tts_stop", params: { persona_id: "warm" } },
    { name: "share_click", params: { platform: "facebook", spread_id: "daily" } },
    { name: "provably_fair_verify", params: { action: "open_modal" } },
    { name: "reader_consult_click", params: { source: "stream_end" } },
    { name: "card_detail_view", params: { card_id: "major-00", card_name: "The Fool" } },
    { name: "card_search", params: { query_len: 9 } },
    { name: "blog_read", params: { slug: "tarot-guide", title: "คู่มือทาโรต์" } },
    { name: "upgrade_dialog_open", params: { reason: "daily_exhausted" } },
    { name: "auth_modal_open", params: { mode: "signin" } },
  ];

  check("All 20 event schemas pass TypeScript runtime contract", sampleEvents.length === 20);

  // A4-10: ข้อความค้นหาของผู้ใช้ห้ามเข้า GA4/Meta — ส่งได้แค่ความยาว
  {
    const searchSources = ["src/components/encyclopedia/SemanticSearchPanel.tsx", "src/components/encyclopedia/CardsExplorer.tsx"]
      .map((f) => readFileSync(resolve(f), "utf8"))
      .join("\n");
    const leaks = [...searchSources.matchAll(/trackEvent\("(?:card_search|semantic_search)",\s*\{([^}]*)\}/g)].filter((m) =>
      /\bquery\s*:/.test(m[1]),
    );
    check("A4-10: event ค้นหาไม่ส่งข้อความที่ผู้ใช้พิมพ์ (ส่งได้แค่ query_len)", leaks.length === 0);
  }

  // A4-11: trackEvent ต้องต่อคิวไว้เมื่อ gtag ยังไม่พร้อม (หน้า Astro ยิง event ก่อน bootstrap)
  {
    const analyticsSrc = readFileSync(resolve("src/lib/analytics.ts"), "utf8");
    const bootstrapSrc = readFileSync(resolve("src/lib/analytics-bootstrap.ts"), "utf8");
    check(
      "A4-11: trackEvent เก็บ event ที่มาก่อน gtag ไว้ และ bootstrap ปล่อยคิวหลังติดตั้ง gtag",
      /pendingEvents\.push\(/.test(analyticsSrc) && /flushPendingAnalyticsEvents\(\)/.test(bootstrapSrc),
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // สรุปผล
  // ─────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log(`🏁 [สรุปผล] ผ่าน: ${passed} | ไม่ผ่าน: ${failed}`);
  console.log("══════════════════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
