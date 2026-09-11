/**
 * 🛡️ ท่อโหลด Cloudflare Turnstile — แยกออกจากคอมโพเนนต์เพื่อ "อุ่นเครื่อง" ล่วงหน้าได้
 *
 * ⚠️ ทำไมต้องแยกไฟล์
 * เดิมทั้ง `fetchSiteKey()` และ `loadTurnstileScript()` อยู่ใน `TurnstileWidget.tsx`
 * ซึ่งอยู่ในก้อน chunk เดียวกับ `AuthModal` · โค้ดจึงเริ่มทำงานได้เร็วสุดคือ
 * "หลังหน้าต่างเข้าสู่ระบบเรนเดอร์เสร็จแล้ว" ➔ กล่องตรวจบอทโผล่ทีหลัง
 * แล้วดันเนื้อหาที่เหลือให้ขยับ (หน้าต่างจัดกึ่งกลางแนวตั้ง จึงเด้งทั้งขึ้นและลง)
 *
 * ไฟล์นี้ไม่มี React และไม่แตะ `motion` จึงให้เปลือกหน้าแรกเรียก
 * `prefetchTurnstile()` ตั้งแต่จังหวะ "ผู้ใช้กดปุ่มเข้าสู่ระบบ" ได้เลย —
 * วิ่งขนานไปกับการดาวน์โหลด chunk ของหน้าต่าง ไม่ต่อคิวกัน
 */

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact";
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

/** โหลดสคริปต์ Turnstile ครั้งเดียวต่อแท็บ (CSP ใน next.config.ts อนุญาตโดเมนนี้ไว้แล้ว) */
export function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("turnstile script failed")));
      if (window.turnstile) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * site key ดึงตอน runtime จาก `/api/config/turnstile` (ไม่ใช้ `NEXT_PUBLIC_*`
 * เพราะ pipeline deploy ของโปรเจกต์ไม่ส่ง env ตอน build — ดู route นั้น)
 * แคชผลทั้งแท็บ — ขอครั้งเดียวพอ
 */
let siteKeyPromise: Promise<string | null> | null = null;
export function fetchTurnstileSiteKey(): Promise<string | null> {
  if (siteKeyPromise) return siteKeyPromise;
  siteKeyPromise = fetch("/api/config/turnstile", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { siteKey?: string | null } | null) => d?.siteKey ?? null)
    .catch(() => null);
  return siteKeyPromise;
}

/**
 * อุ่นเครื่องทั้ง config และสคริปต์ล่วงหน้า — เรียกได้บ่อยเท่าไรก็ได้ (ผลถูกแคชไว้)
 * ห้าม throw ออกไปเด็ดขาด: นี่คืองานเสริม ถ้าล้มต้องเงียบแล้วให้ widget ลองใหม่เอง
 */
export function prefetchTurnstile(): void {
  if (typeof window === "undefined") return;
  void fetchTurnstileSiteKey()
    .then((key) => {
      if (key) return loadTurnstileScript();
    })
    .catch(() => {
      /* noop — widget จะจัดการเองตอนเปิดจริง */
    });
}
