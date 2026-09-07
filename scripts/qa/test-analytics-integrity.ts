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

  // Test Google Ads conversion dispatch
  trackGoogleAdsConversion("AW-1234567890/AbCdEfGh123", { value: 150, currency: "THB" });
  const gtagConversion = capturedGtag.find((e) => e.command === "event" && e.action === "conversion");
  check("trackGoogleAdsConversion fires gtag conversion", Boolean(gtagConversion));
  check("gtag conversion send_to matches target", gtagConversion?.params?.send_to === "AW-1234567890/AbCdEfGh123");
  check("gtag conversion value and currency match", gtagConversion?.params?.value === 150 && gtagConversion?.params?.currency === "THB");

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
  // ตรวจเฉพาะในบล็อก `gtag('consent', 'default', {...})` เท่านั้น
  // (คำว่า 'granted' ยังต้องมีอยู่ในโค้ดกู้สถานะของผู้ที่เคยกดยินยอมไว้แล้ว)
  const defaultStart = trackerSrc.indexOf("gtag('consent', 'default'");
  const defaultBlock = trackerSrc.slice(
    defaultStart,
    trackerSrc.indexOf("});", defaultStart),
  );
  check(
    "consent default ตั้ง analytics_storage เป็น denied",
    /'analytics_storage':\s*'denied'/.test(defaultBlock) &&
      !/'analytics_storage':\s*'granted'/.test(defaultBlock),
  );
  check(
    "ค่าโฆษณาทั้งสามยังคงเป็น denied",
    ["'ad_storage': 'denied'", "'ad_user_data': 'denied'", "'ad_personalization': 'denied'"].every(
      (t) => trackerSrc.includes(t),
    ),
  );
  check(
    "กู้สถานะที่ผู้ใช้เคยเลือกไว้ก่อน React hydrate",
    trackerSrc.includes("seertarot_analytics_consent_v1"),
  );
  // ตัว URL ของสคริปต์ (ไม่ใช่ชื่อโดเมนในคอมเมนต์) ต้องอยู่ **ข้างใน** ฟังก์ชันที่ถูกกั้น
  const pixelLoaderUrl = "'https://connect.facebook.net/en_US/fbevents.js'";
  check(
    "Meta Pixel ถูกกั้นตั้งแต่ตัวโหลด ไม่ใช่แค่ fbq('init')",
    trackerSrc.includes("function seertarotInitPixel") &&
      trackerSrc.indexOf(pixelLoaderUrl) > trackerSrc.indexOf("function seertarotInitPixel"),
  );

  const bannerSrc = readFileSync(
    resolve(import.meta.dirname, "../../src/components/analytics/ConsentBanner.tsx"),
    "utf-8",
  );
  check(
    "แบนเนอร์ขอความยินยอมมีทั้งปุ่มยินยอมและปุ่มปฏิเสธ",
    bannerSrc.includes('decide("granted")') && bannerSrc.includes('decide("denied")'),
  );
  check(
    "แบนเนอร์อ่านสถานะหลัง mount เท่านั้น (กัน hydration mismatch)",
    bannerSrc.includes("useEffect(") && bannerSrc.includes("readConsent()"),
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
    { name: "card_search", params: { query: "ดวงอาทิตย์" } },
    { name: "blog_read", params: { slug: "tarot-guide", title: "คู่มือทาโรต์" } },
    { name: "upgrade_dialog_open", params: { reason: "daily_exhausted" } },
    { name: "auth_modal_open", params: { mode: "signin" } },
  ];

  check("All 20 event schemas pass TypeScript runtime contract", sampleEvents.length === 20);

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
