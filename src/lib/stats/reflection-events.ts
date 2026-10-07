/**
 * 📊 event เชิงพฤติกรรมของแผนสะท้อนตัวเอง (REFLECTION_JOURNAL_PLAN หัวข้อ 5 · ตัวชี้วัด) — allowlist เดียวใช้ทั้งสองฝั่ง
 * ฝั่ง client กันยิงชื่อมั่ว · ฝั่ง `/api/stats/event` กัน abuse ทำตัวนับบวม
 * ⚠️ ห้ามใส่ PII/ข้อความผู้ใช้/ชื่อไพ่ลงในชื่อ event — นับพฤติกรรมเท่านั้น
 * ⚠️ ไฟล์นี้เบา (ไม่มี import) — ใช้ใน island ได้
 */
export const REFLECTION_EVENTS = [
  // หลักฐานคำอ่าน (1.2 · 1.6) — ตัวชี้วัด "อัตรากดแผงทำไมแม่หมออ่านแบบนี้ต่อคำอ่าน"
  "why_panel_opened",
  "relations_map_opened",
  "relations_line_tapped",
  // สมุดดวง (1.1) — มุมมองไหนถูกใช้จริง
  "journal_view:list",
  "journal_view:calendar",
  "journal_view:overview",
  "journal_view:stories",
  // PWA (1.10)
  "pwa_install_shown",
  "pwa_install_accepted",
  // หน้าคำถาม (1.11) — หน้า SEO พาคนไปเปิดไพ่จริงไหม
  "question_ask_now",
] as const;

export type ReflectionEvent = (typeof REFLECTION_EVENTS)[number];

const ALLOWED = new Set<string>(REFLECTION_EVENTS);

export function isAllowedReflectionEvent(name: string): boolean {
  return ALLOWED.has(name);
}

/** ยิงแบบ fire-and-forget — ล้มเหลวเงียบ (สถิติต้องไม่มีวันทำ UX พัง) */
export function trackReflectionEvent(name: ReflectionEvent): void {
  if (typeof window === "undefined" || !ALLOWED.has(name)) return;
  fetch("/api/stats/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    keepalive: true,
  }).catch(() => {});
}
