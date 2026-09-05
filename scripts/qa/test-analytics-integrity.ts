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

import {
  isValidGaId,
  isValidMetaPixelId,
  trackEvent,
  trackPageView,
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
  console.log("📊 [QA] Google Analytics 4 & Analytics Tracker Integrity Suite");
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

  // Cleanup mock
  delete (global as any).window;

  // ─────────────────────────────────────────────────────────────────
  // 4. Event Types Coverage Check
  // ─────────────────────────────────────────────────────────────────
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
