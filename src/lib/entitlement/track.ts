"use client";

import { isAllowedEntitlementEvent } from "@/lib/stats/entitlement-events";

/**
 * ยิง event กรวยสมัครสมาชิกแบบ fire-and-forget
 * - ไม่ await · ล้มเหลวเงียบ (สถิติต้องไม่มีวันทำ UX พัง)
 * - กันชื่อมั่วตั้งแต่ฝั่ง client ด้วย allowlist ชุดเดียวกับฝั่ง server
 */
export function trackEntitlementEvent(name: string): void {
  if (typeof window === "undefined") return;
  if (!isAllowedEntitlementEvent(name)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[entitlement] event ไม่อยู่ใน allowlist: ${name}`);
    }
    return;
  }
  fetch("/api/stats/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    keepalive: true,
  }).catch(() => {});
}
