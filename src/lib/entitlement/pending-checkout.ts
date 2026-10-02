/**
 * 🧷 จำแพ็กที่ผู้ใช้กดซื้อไว้ตอนยังไม่ล็อกอิน — ล็อกอินเสร็จแล้วพาไปจ่ายเงินต่อได้ทันที
 * ===========================================================================
 * บั๊กที่เจ้าของเจอ: กดซื้อ ➔ ระบบให้ล็อกอิน ➔ ล็อกอินเสร็จ ➔ **หน้าเว็บโหลดใหม่และลืมไปแล้ว
 * ว่ากำลังจะซื้ออะไร** (ล็อกอิน Google/LINE พาออกไปนอกเว็บ · ล็อกอินอีเมลก็เปลี่ยนหน้า)
 * ผู้ใช้ต้องกลับไปหาปุ่มซื้อเองอีกรอบ = ทิ้งตะกร้ากลางทาง
 *
 * ทางแก้: จำแพ็กไว้ก่อนเปิดหน้าต่างล็อกอิน ➔ `AuthModal` เห็นว่ามีแพ็กค้างจึงพากลับมาที่ `/pricing`
 * (แทนหน้าเดิม) ➔ `PricingPlans` เห็น `auth_success=1` + แพ็กค้าง ➔ ไปหน้าจ่ายเงินของ Stripe ต่อทันที
 *
 * ⚠️ ห้ามย้ายตัวทำต่อไปไว้ใน `astro/scripts/site-chrome.ts` (สคริปต์ของทุกหน้า) — ลองแล้ว
 *    งบ JS หน้าเนื้อหา (/privacy · /cards/<ใบ>) เพดาน 8 KB เกินทันที (+1.2 KB · import() ลาก preload-helper อีก 1 KB)
 */

import { STORAGE_KEYS } from "@/lib/storage/keys";

const KEY = STORAGE_KEYS.pendingCheckout;
/** เกินนี้ถือว่าผู้ใช้เปลี่ยนใจแล้ว — ห้ามเด้งไปหน้าจ่ายเงินเองตอนเขากลับมาวันหลัง */
const TTL_MS = 30 * 60 * 1000;
const PACKAGE_ID = /^pack_\d{1,3}$/;

export function rememberPendingCheckout(packageId: string): void {
  if (!PACKAGE_ID.test(packageId)) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ packageId, at: Date.now() }));
  } catch {
    // โหมดส่วนตัว/บล็อกที่เก็บข้อมูล — ล็อกอินเสร็จผู้ใช้กดซื้อเองอีกครั้งได้ ไม่เสียหาย
  }
}

export function hasPendingCheckout(): boolean {
  try {
    return sessionStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

/** อ่านแล้วลบทิ้งทันที (ใช้ได้ครั้งเดียว — กันวนเด้งไปหน้าจ่ายเงินซ้ำ) · หมดอายุ/ผิดรูป = null */
export function takePendingCheckout(now: number = Date.now()): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw === null) return null;
    sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as { packageId?: unknown; at?: unknown };
    if (typeof parsed.packageId !== "string" || !PACKAGE_ID.test(parsed.packageId)) return null;
    if (typeof parsed.at !== "number" || now - parsed.at > TTL_MS || parsed.at > now) return null;
    return parsed.packageId;
  } catch {
    return null;
  }
}

/** หน้าราคาในภาษาของหน้าปัจจุบัน — ปลายทางหลังล็อกอินเมื่อมีแพ็กค้าง */
export function pricingPathFor(pathname: string): string {
  return pathname === "/en" || pathname.startsWith("/en/") ? "/en/pricing" : "/pricing";
}
