import { looksLikePromptInjection } from "@/lib/ai/prompt-guard";
import { bumpEdgeCounter, edgeRateLimitKey, peekEdgeCounter } from "@/lib/security/edge-ratelimit";
import { recordEvent } from "@/lib/stats/record";

/**
 * 🛡️ จับการพยายามฉีดคำสั่งซ้ำ (REFLECTION_JOURNAL_PLAN 1.14 · แทร็ก S)
 * ---------------------------------------------------------------------------
 * โดนด่านคำสั่งแฝงครบ 3 ครั้งใน 1 ชม. ➔ พักการเรียก AI ของตัวตนนั้น 1 ชม. (นับทั้ง IP และบัญชี)
 *  • ใช้ที่เก็บ atomic เดียวกับเพดานถี่ (`edge_rate_buckets`) — ข้าม isolate ได้ · คีย์ถูกแฮช (ไม่เก็บ IP ดิบ)
 *  • ไม่บอกเหตุผลละเอียดกับผู้ถูกพัก (ไม่สอนวิธีเลี่ยง) — ข้อความกลาง ๆ ว่า "พักชั่วคราว"
 *  • ครั้งที่ 1–2 ยังได้ข้อความปกติ "มีข้อความที่ไม่อนุญาต" (คนพิมพ์พลาดไม่ควรโดนพักทันที)
 */
export const INJECTION_STRIKES = 3;
export const INJECTION_WINDOW_SEC = 3600;
export const INJECTION_COOLDOWN_SEC = 3600;

const strikeKey = (id: string) => edgeRateLimitKey("inj_strike", id);
const coolKey = (id: string) => edgeRateLimitKey("inj_cool", id);

function identities(ip: string, userId?: string | null): string[] {
  return [ip ? `ip:${ip}` : null, userId ? `u:${userId}` : null].filter(Boolean) as string[];
}

/** มีข้อความใดในคำขอที่โดนด่านคำสั่งแฝงไหม (ตรวจทุกค่าสตริงในอ็อบเจกต์ ลึกไม่เกิน 4 ชั้น) */
export function bodyHasInjection(value: unknown, depth = 0): boolean {
  if (typeof value === "string") return looksLikePromptInjection(value);
  if (depth > 4 || !value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).some((v) => bodyHasInjection(v, depth + 1));
}

/** นับ 1 ครั้ง — ครบเพดานแล้วเปิดช่วงพัก · คืน true เมื่อครั้งนี้ทำให้ถูกพัก */
export async function noteInjectionAttempt(ip: string, userId?: string | null, scope = "unknown"): Promise<boolean> {
  recordEvent(`ai_injection_blocked:${scope}`);
  let tripped = false;
  for (const id of identities(ip, userId)) {
    try {
      const n = await bumpEdgeCounter(strikeKey(id), INJECTION_WINDOW_SEC);
      if (n >= INJECTION_STRIKES) {
        await bumpEdgeCounter(coolKey(id), INJECTION_COOLDOWN_SEC);
        tripped = true;
      }
    } catch {
      /* ที่เก็บล่ม — ไม่พักใคร (fail-open) ด่านขาเข้ายังปฏิเสธข้อความอยู่แล้ว */
    }
  }
  if (tripped) recordEvent("ai_injection_cooldown");
  return tripped;
}

export async function isInInjectionCooldown(ip: string, userId?: string | null): Promise<boolean> {
  for (const id of identities(ip, userId)) {
    try {
      if ((await peekEdgeCounter(coolKey(id), INJECTION_COOLDOWN_SEC)) > 0) return true;
    } catch {
      /* fail-open */
    }
  }
  return false;
}

export function cooldownMessage(lang: "th" | "en"): string {
  return lang === "en"
    ? "Readings are paused for this connection for a while. Please try again later."
    : "ระบบขอพักการเปิดไพ่จากการเชื่อมต่อนี้ชั่วคราว กรุณาลองใหม่ภายหลัง";
}
