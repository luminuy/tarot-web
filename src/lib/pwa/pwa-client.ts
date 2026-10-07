/**
 * 📱 ใช้เหมือนแอปจริง — ฝั่งเบราว์เซอร์ (REFLECTION_JOURNAL_PLAN 1.10)
 * ---------------------------------------------------------------------------
 *  • ปุ่มติดตั้ง: ขึ้น "หลังเห็นคุณค่าแล้ว" เท่านั้น — ทำพิธีเช้าครบ 2 วัน หรือบันทึกคำอ่านครั้งที่ 2
 *    ไม่ขึ้นตอนเข้าเว็บครั้งแรก · ปิดแล้วไม่ถามอีก 30 วัน (ตรรกะบริสุทธิ์ `shouldOfferInstall` ทดสอบได้)
 *  • สารานุกรมออฟไลน์: เติมเฉพาะเมื่อเครื่องว่าง + ไม่ประหยัดดาต้า + ไม่ใช่เน็ตมือถือช้า · หลังติดตั้งหรือผู้ใช้เปิดเอง
 *  • Web Push: ขอสิทธิ์เฉพาะตอนผู้ใช้กดเปิดเองเท่านั้น · iPhone ใช้ได้เมื่อติดตั้งบนหน้าจอโฮมแล้ว (iOS 16.4+)
 * ทุกการอ่าน/เขียน localStorage อยู่ใน try/catch (โหมดส่วนตัว/บล็อกที่เก็บข้อมูล)
 */
import { DECK_INDEX_META } from "@/data/cards/deck-index-meta";

const KEY = "tarot_pwa_state_v1";
const DAY = 86_400_000;

export interface PwaState {
  ritualDays: string[];
  readingsSaved: number;
  dismissedAt?: number;
  installed?: boolean;
  offlineOptIn?: boolean;
}

function read(): PwaState {
  try {
    const raw = window.localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Partial<PwaState>) : {};
    return {
      ritualDays: Array.isArray(s.ritualDays) ? s.ritualDays.slice(-10) : [],
      readingsSaved: typeof s.readingsSaved === "number" ? s.readingsSaved : 0,
      dismissedAt: s.dismissedAt,
      installed: s.installed,
      offlineOptIn: s.offlineOptIn,
    };
  } catch {
    return { ritualDays: [], readingsSaved: 0 };
  }
}

function write(s: PwaState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* โหมดส่วนตัว — ข้าม */
  }
}

export function getPwaState(): PwaState {
  if (typeof window === "undefined") return { ritualDays: [], readingsSaved: 0 };
  return read();
}

/** จังหวะที่ผู้ใช้ "เห็นคุณค่า" — ทำพิธีเช้า (นับเป็นวัน) / บันทึกคำอ่าน */
export function markPwaValueMoment(kind: "ritual" | "reading", dayKey?: string): void {
  if (typeof window === "undefined") return;
  const s = read();
  if (kind === "ritual" && dayKey && !s.ritualDays.includes(dayKey)) s.ritualDays = [...s.ritualDays, dayKey].slice(-10);
  if (kind === "reading") s.readingsSaved += 1;
  write(s);
}

export function dismissInstall(now = Date.now()): void {
  const s = read();
  s.dismissedAt = now;
  write(s);
}

export function markInstalled(): void {
  const s = read();
  s.installed = true;
  write(s);
}

/** ตรรกะบริสุทธิ์: ควรชวนติดตั้งตอนนี้ไหม */
export function shouldOfferInstall(s: PwaState, ctx: { standalone: boolean; now: number }): boolean {
  if (ctx.standalone || s.installed) return false;
  if (s.dismissedAt && ctx.now - s.dismissedAt < 30 * DAY) return false;
  return s.ritualDays.length >= 2 || s.readingsSaved >= 2;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** เครือข่ายเหมาะจะโหลดของล่วงหน้าไหม — ไม่รู้ = ถือว่าได้ (เดสก์ท็อปส่วนใหญ่ไม่มี API นี้) */
export function goodNetworkForPrefetch(conn?: { saveData?: boolean; effectiveType?: string; type?: string }): boolean {
  if (!conn) return true;
  if (conn.saveData) return false;
  if (conn.type === "cellular") return false;
  if (conn.effectiveType && /(^|-)2g$|^3g$/.test(conn.effectiveType)) return false;
  return true;
}

/** หน้าที่เก็บลงสารานุกรมออฟไลน์ — หน้าไพ่ 78 ใบ + หน้าหลักที่ใช้ทุกวัน (ภาษาเดียวกับที่ผู้ใช้อ่าน) */
export function encyclopediaPaths(isEnglish: boolean): string[] {
  const p = isEnglish ? "/en" : "";
  return [`${p}/cards`, `${p}/daily`, `${p}/journal`, ...DECK_INDEX_META.map((row) => `${p}/cards/${row[0]}`)];
}

export function setOfflineOptIn(on: boolean): void {
  const s = read();
  s.offlineOptIn = on;
  write(s);
}

/** สั่ง SW ให้เติมสารานุกรมออฟไลน์ตอนเครื่องว่าง — คืน false ถ้ายังไม่เหมาะจะโหลด */
export async function precacheEncyclopediaWhenIdle(isEnglish: boolean): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string; type?: string } }).connection;
  if (!goodNetworkForPrefetch(conn)) return false;
  const reg = await navigator.serviceWorker.ready;
  const send = () => reg.active?.postMessage({ type: "PRECACHE_ENCYCLOPEDIA", paths: encyclopediaPaths(isEnglish) });
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  if (ric) ric(send, { timeout: 15_000 });
  else window.setTimeout(send, 3000);
  return true;
}

// ── Web Push ──

function urlB64ToUint8(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export interface PushStatus {
  supported: boolean;
  enabledOnServer: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  morningHour: number | null;
  checkins: boolean;
  /** iPhone ที่ยังไม่ได้ติดตั้งบนหน้าจอโฮม — ต้องติดตั้งก่อนถึงจะเปิดได้ */
  needsInstallOnIos: boolean;
}

export async function getPushStatus(): Promise<PushStatus> {
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const base: PushStatus = {
    supported,
    enabledOnServer: false,
    permission: supported ? Notification.permission : "unsupported",
    subscribed: false,
    morningHour: null,
    checkins: true,
    needsInstallOnIos: isIos() && !isStandalone(),
  };
  try {
    const cfg = (await (await fetch("/api/push/public-key")).json()) as { enabled?: boolean };
    base.enabledOnServer = Boolean(cfg.enabled);
  } catch {
    return base;
  }
  if (!supported) return base;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return base;
  try {
    const res = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, { cache: "no-store" });
    const data = (await res.json()) as { subscribed?: boolean; morningHour?: number | null; checkins?: boolean };
    return { ...base, subscribed: Boolean(data.subscribed), morningHour: data.morningHour ?? null, checkins: data.checkins ?? true };
  } catch {
    return base;
  }
}

/** เปิด/อัปเดตแจ้งเตือน — ขอสิทธิ์ตรงนี้ (ต้องเรียกจากการแตะของผู้ใช้เท่านั้น) */
export async function enablePush(settings: { morningHour: number | null; checkins: boolean; lang: "th" | "en" }): Promise<{ ok: boolean; reason?: string }> {
  const cfg = (await (await fetch("/api/push/public-key")).json().catch(() => ({}))) as { enabled?: boolean; publicKey?: string };
  if (!cfg.enabled || !cfg.publicKey) return { ok: false, reason: "disabled" };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(cfg.publicKey) as BufferSource }));
  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: { endpoint: json.endpoint, keys: json.keys }, ...settings }),
  });
  return res.ok ? { ok: true } : { ok: false, reason: "server" };
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}
