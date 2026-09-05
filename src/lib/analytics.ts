/**
 * 📊 Analytics Event Tracking (Google Analytics 4 & Meta Pixel)
 * ---------------------------------------------------------------------------
 * ออกแบบตามมาตรฐาน Privacy-First, PDPA-Compliant, และ Type-Safe 100%
 * ทำงานได้ปลอดภัยแม้ไม่มีการตั้งค่า ID, บล็อกเกอร์โฆษณาทำงาน, หรือรันบน SSR
 */

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js" | "consent",
      action: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
    fbq?: (
      action: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/** ตรวจสอบรูปแบบ Measurement ID ของ Google Analytics 4 (ต้องขึ้นต้นด้วย G-) */
export function isValidGaId(id?: string | null): boolean {
  if (!id) return false;
  return /^G-[A-Z0-9]+$/i.test(id.trim());
}

/** ตรวจสอบรูปแบบ Meta Pixel ID (ตัวเลขล้วน 12-17 หลัก) */
export function isValidMetaPixelId(id?: string | null): boolean {
  if (!id) return false;
  return /^\d{12,17}$/.test(id.trim());
}

/** ตรวจสอบรูปแบบ Measurement ID ของ Google Ads (ต้องขึ้นต้นด้วย AW- ตามด้วยตัวเลข 7-15 หลัก) */
export function isValidGoogleAdsId(id?: string | null): boolean {
  if (!id) return false;
  return /^AW-\d{7,15}$/i.test(id.trim());
}

/** ตรวจสอบรูปแบบ Conversion Label ของ Google Ads */
export function isValidGoogleAdsConversionLabel(label?: string | null): boolean {
  if (!label) return false;
  return /^[A-Za-z0-9_-]{10,35}$/.test(label.trim());
}

/** ดึง GA Measurement ID จาก Environment Variable */
export function getGaMeasurementId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GA_ID?.trim();
  return isValidGaId(id) ? id : undefined;
}

/** ดึง Meta Pixel ID จาก Environment Variable */
export function getMetaPixelId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  return isValidMetaPixelId(id) ? id : undefined;
}

/** ดึง Google Ads ID จาก Environment Variable */
export function getGoogleAdsId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
  return isValidGoogleAdsId(id) ? id : undefined;
}

/** ดึง Google Ads Conversion Label จาก Environment Variable (ถ้ามี) */
export function getGoogleAdsConversionLabel(): string | undefined {
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL?.trim();
  return isValidGoogleAdsConversionLabel(label) ? label : undefined;
}

export type TarotAnalyticsEvent =
  | {
      name: "page_view";
      params: {
        page_path: string;
        page_location?: string;
        page_title?: string;
      };
    }
  | {
      name: "spread_select";
      params: {
        spread_id: string;
        spread_name: string;
        card_count: number;
        category?: string;
      };
    }
  | {
      name: "persona_select";
      params: {
        persona_id: string;
        persona_name: string;
      };
    }
  | {
      name: "tarot_session_start";
      params: {
        spread_id: string;
        persona_id: string;
        category: string;
        has_situation?: boolean;
      };
    }
  | {
      name: "tarot_shuffle";
      params: {
        spread_id: string;
        card_count: number;
      };
    }
  | {
      name: "tarot_draw";
      params: {
        spread_id: string;
        picked_order: number;
        picked_total: number;
        required_total: number;
      };
    }
  | {
      name: "card_reveal";
      params: {
        spread_id: string;
        position_order: number;
        card_id: string;
        card_name: string;
        is_reversed: boolean;
      };
    }
  | {
      name: "reading_complete";
      params: {
        spread_id: string;
        persona_id: string;
        card_count: number;
        elapsed_ms?: number;
      };
    }
  | {
      name: "reading_feedback";
      params: {
        reading_id: string;
        outcome: "ACCURATE" | "PARTIAL" | "NOT_HAPPENED";
        spread_id?: string;
      };
    }
  | {
      name: "follow_up_ask";
      params: {
        reading_id: string;
        persona_id: string;
        question_length?: number;
      };
    }
  | {
      name: "tts_play";
      params: {
        persona_id: string;
        position?: number;
      };
    }
  | {
      name: "tts_stop";
      params: {
        persona_id: string;
      };
    }
  | {
      name: "share_click";
      params: {
        platform:
          | "facebook"
          | "instagram"
          | "twitter"
          | "threads"
          | "tiktok"
          | "copy"
          | "native"
          | "story_download"
          | "post_download";
        spread_id?: string;
      };
    }
  | {
      name: "provably_fair_verify";
      params: {
        reading_id?: string;
        action?: "open_modal" | "copy_hash" | "external_verify";
      };
    }
  | {
      name: "reader_consult_click";
      params?: {
        reader_id?: string;
        source: "stream_end" | "directory" | "profile";
      };
    }
  | {
      name: "card_detail_view";
      params: {
        card_id: string;
        card_name: string;
        category?: string;
      };
    }
  | {
      name: "card_search";
      params: {
        query: string;
        results_count?: number;
      };
    }
  | {
      name: "blog_read";
      params: {
        slug: string;
        title: string;
        category?: string;
      };
    }
  | {
      name: "upgrade_dialog_open";
      params: {
        reason: string;
      };
    }
  | {
      name: "auth_modal_open";
      params: {
        mode: "signin" | "signup";
        source?: string;
      };
    };

/**
 * ส่ง Event ไปยัง Google Analytics 4 (GA4) และ Meta Pixel
 */
export function trackEvent<T extends TarotAnalyticsEvent>(
  name: T["name"],
  params?: T["params"]
) {
  if (typeof window === "undefined") return;

  try {
    const payload = (params || {}) as Record<string, unknown>;

    // 1. Google Analytics 4
    if (typeof window.gtag === "function") {
      window.gtag("event", name, payload);
    }

    // 2. Meta Pixel
    if (typeof window.fbq === "function") {
      if (name === "reading_complete") {
        window.fbq("track", "ViewContent", {
          content_name: "Tarot Reading Completed",
          ...payload,
        });
      } else if (name === "reader_consult_click") {
        window.fbq("track", "Contact", {
          content_name: "Human Reader Consultation",
          ...payload,
        });
      } else if (name === "tarot_session_start") {
        window.fbq("trackCustom", "TarotSessionStart", payload);
      } else if (name === "share_click") {
        window.fbq("trackCustom", "ShareTarotReading", payload);
      } else {
        window.fbq("trackCustom", name, payload);
      }
    }

    // 3. Google Ads Conversion (ส่งอัตโนมัติเมื่อระบุ GOOGLE_ADS_ID และ CONVERSION_LABEL)
    if (typeof window.gtag === "function") {
      const googleAdsId = getGoogleAdsId();
      const defaultLabel = getGoogleAdsConversionLabel();
      if (googleAdsId && defaultLabel && name === "reading_complete") {
        window.gtag("event", "conversion", {
          send_to: `${googleAdsId}/${defaultLabel}`,
          value: 1.0,
          currency: "THB",
        });
      }
    }
  } catch (err) {
    // ป้องกันไม่ให้ข้อผิดพลาดจาก Analytics ส่งผลกระทบต่อ UX ของผู้ใช้
    if (process.env.NODE_ENV !== "production") {
      console.debug("[Analytics] Error sending event:", err);
    }
  }
}

/**
 * ส่ง Conversion โดยตรงไปยัง Google Ads
 * @param sendTo รูปแบบ 'AW-XXXXXXXXX/AbCdEfGhIjK' หรือรหัส label เดี่ยวๆ เมื่อมี NEXT_PUBLIC_GOOGLE_ADS_ID
 */
export function trackGoogleAdsConversion(
  sendTo: string,
  params?: {
    value?: number;
    currency?: string;
    transaction_id?: string;
  }
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  try {
    const googleAdsId = getGoogleAdsId();
    const target = sendTo.includes("/")
      ? sendTo
      : googleAdsId
      ? `${googleAdsId}/${sendTo}`
      : sendTo;

    window.gtag("event", "conversion", {
      send_to: target,
      value: params?.value ?? 1.0,
      currency: params?.currency || "THB",
      ...(params?.transaction_id ? { transaction_id: params.transaction_id } : {}),
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[Analytics] Error sending Google Ads conversion:", err);
    }
  }
}

/**
 * ส่ง PageView ไปยัง Google Analytics 4 และ Meta Pixel
 * ใช้เมื่อมีการเปลี่ยนเส้นทางใน Single Page Application (Next.js App Router)
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  if (typeof window === "undefined") return;

  try {
    const title = pageTitle || (typeof document !== "undefined" ? document.title : "");
    const url = typeof window !== "undefined" ? window.location.href : "";

    // 1. GA4
    if (typeof window.gtag === "function") {
      const gaId = getGaMeasurementId();
      if (gaId) {
        window.gtag("config", gaId, {
          page_path: pagePath,
          page_location: url,
          page_title: title,
        });
      }
      window.gtag("event", "page_view", {
        page_path: pagePath,
        page_location: url,
        page_title: title,
      });
    }

    // 2. Meta Pixel
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[Analytics] Error sending pageview:", err);
    }
  }
}

/**
 * ตั้งค่า Google Consent Mode v2 (PDPA-Compliant)
 */
export function setAnalyticsConsent(granted: boolean) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  const state = granted ? "granted" : "denied";
  window.gtag("consent", "update", {
    analytics_storage: state,
    ad_storage: "denied", // Privacy-first: ไม่เปิด ad storage
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

