import { isMeasurableHostname } from "@/lib/config/site-constants";

/**
 * โหลดตัวเก็บ INP (`inp-reporter.ts`) เป็นก้อนแยกตอนเบราว์เซอร์ว่างหลังหน้าโหลดเสร็จ — คืนฟังก์ชันเลิกฟัง
 *
 * ทำไมไม่ import ตรง ๆ: ตัวเก็บหนัก ~1.5 KB gzip และอยู่ทุกหน้า — ดันงบ JS ตอนเปิดหน้า (`test-bundle-budget`)
 * เกิน 4 เส้นทาง ทั้งที่ไม่มีอะไรต้องทำก่อนผู้ใช้แตะเลย
 * ไม่พลาดการแตะก่อนโหลดเสร็จ: Event Timing เก็บ entry ที่ยาว ≥ 104 ms ไว้ในบัฟเฟอร์ให้ observer ที่มาทีหลัง
 * (`buffered: true`) · เกณฑ์ส่งคือ 200 ms จึงได้ครบ · ปิดแท็บก่อนก้อนนี้มาถึง = ไม่ส่ง (ยอมได้)
 */
export function loadInpReporter(): () => void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return () => {};
  if (!isMeasurableHostname(window.location.hostname)) return () => {};
  if (!(PerformanceObserver.supportedEntryTypes ?? []).includes("event")) return () => {};

  let stop: (() => void) | undefined;
  let cancelled = false;
  const start = () => {
    void import("./inp-reporter")
      .then((m) => {
        if (!cancelled) stop = m.installInpReporter();
      })
      .catch(() => {
        // โหลดก้อนไม่สำเร็จ (เน็ตหลุด/deploy ใหม่) — สถิติไม่ใช่เส้นทางหลัก ข้ามได้
      });
  };
  /* Safari ไม่มี requestIdleCallback แต่ก็ไม่ผ่านด่าน "event" ข้างบนอยู่แล้ว — สาขา setTimeout เผื่อเบราว์เซอร์อื่น */
  const whenIdle = () => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(start, { timeout: 5000 });
    else setTimeout(start, 1000);
  };

  if (document.readyState === "complete") whenIdle();
  else window.addEventListener("load", whenIdle, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", whenIdle);
    stop?.();
  };
}
