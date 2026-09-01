/**
 * รายชื่อ event ของกรวยสมัครสมาชิก (entitlement funnel) — allowlist เดียวใช้ทั้งสองฝั่ง
 * ------------------------------------------------------------------------------------
 * ฝั่ง client ใช้กันยิงชื่อมั่ว · ฝั่ง route `/api/stats/event` ใช้กัน abuse ทำ KV counter บวม
 * ห้ามใส่ PII หรือค่าอิสระจากผู้ใช้ลงในชื่อ metric เด็ดขาด (กฎเดียวกับ `recordEvent`)
 */

const REASONS = ["guest_used", "daily_exhausted", "members_only", "explore"] as const;

const DIALOG_STAGES = ["shown", "primary", "secondary"] as const;

/** event ที่ไม่มีตัวแปรต่อท้าย */
const FLAT_EVENTS = [
  "signup_card_shown",
  "signup_card_clicked",
  "signup_card_dismissed",
  "free_trial_notice_shown",
  "quota_meter_opened",
  "gate_blocked_shown:guest_used",
  "gate_blocked_shown:daily_exhausted",
] as const;

export const ENTITLEMENT_EVENTS: readonly string[] = [
  ...FLAT_EVENTS,
  ...DIALOG_STAGES.flatMap((stage) => REASONS.map((r) => `access_dialog_${stage}:${r}`)),
];

const ALLOWED = new Set(ENTITLEMENT_EVENTS);

export function isAllowedEntitlementEvent(name: string): boolean {
  return ALLOWED.has(name);
}
