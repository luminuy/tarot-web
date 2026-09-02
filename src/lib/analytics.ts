/**
 * 📊 Analytics Event Tracking (Google Analytics 4 & Meta Pixel)
 * ---------------------------------------------------------------------------
 * ออกแบบตามมาตรฐาน Privacy-First และ Type-Safe
 * ทำงานได้ปลอดภัยแม้ไม่มีการตั้งค่า ID หรือบล็อกเกอร์โฆษณาทำงาน
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

export type TarotAnalyticsEvent =
  | {
      name: "tarot_shuffle";
      params?: { spread_id?: string; card_count?: number };
    }
  | {
      name: "tarot_draw";
      params?: { spread_id?: string; picked_count?: number };
    }
  | {
      name: "reading_complete";
      params?: { spread_id?: string; persona_id?: string };
    }
  | {
      name: "share_click";
      params: {
        platform: "facebook" | "twitter" | "threads" | "tiktok" | "copy" | "native" | "story_download" | "post_download";
        spread_id?: string;
      };
    }
  | {
      name: "reader_consult_click";
      params?: { reader_id?: string; source: "stream_end" | "directory" | "profile" };
    }
  | {
      name: "blog_read";
      params: { slug: string; title: string };
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
    // 1. Google Analytics 4
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }

    // 2. Meta Pixel
    if (typeof window.fbq === "function") {
      // Map event names to standard Meta events where appropriate
      if (name === "reading_complete") {
        window.fbq("track", "ViewContent", {
          content_name: "Tarot Reading",
          ...params,
        });
      } else if (name === "reader_consult_click") {
        window.fbq("track", "Contact", {
          content_name: "Human Reader Consultation",
          ...params,
        });
      } else {
        window.fbq("trackCustom", name, params || {});
      }
    }
  } catch (err) {
    // ป้องกันไม่ให้ข้อผิดพลาดจาก Analytics ส่งผลกระทบต่อ UX ของผู้ใช้
    console.debug("[Analytics] Error sending event:", err);
  }
}
