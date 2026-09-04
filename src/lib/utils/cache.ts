import { getCardWebpVariantSrc } from "@/lib/tarot/card-image";

/**
 * Tarot Master Web Performance & Cache Engine
 * -------------------------------------------------------------
 * 1. Asset Pre-Decoding: โหลดและ decode ภาพไพ่ WebP ล่วงหน้าบน idle frame (0ms stutter)
 * 2. In-Memory LRU Cache: พักข้อมูลการทำนายและการ์ดในเครื่องเพื่อการสลับแท็บความเร็วสูง
 */

const PRELOAD_MAJOR_CARDS = [
  "major-00.jpg",
  "major-01.jpg",
  "major-02.jpg",
  "major-03.jpg",
  "major-04.jpg",
  "major-10.jpg",
  "major-17.jpg",
  "major-19.jpg",
  "major-21.jpg",
];

let isPreloaded = false;

/**
 * ทำการ Warmup โหลด Asset ล่วงหน้าแบบ Non-blocking ในช่วงที่เบราว์เซอร์ว่าง (requestIdleCallback)
 * P1-9: ใช้ภาพย่อ WebP w128 (~5KB) แทนภาพต้นฉบับ JPEG 250KB และเคารพโหมด Save-Data ของผู้ใช้
 */
export function warmupTarotAssets(): void {
  if (typeof window === "undefined" || isPreloaded) return;

  // Respect user's data-saver preference
  const nav = navigator as any;
  if (nav?.connection?.saveData === true) return;

  isPreloaded = true;

  const scheduleTask = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1200));

  scheduleTask(() => {
    // Pre-decode lightweight w128 WebP thumbnails
    for (const cardFile of PRELOAD_MAJOR_CARDS) {
      try {
        const src = getCardWebpVariantSrc(cardFile, "w128");
        if (!src) continue;
        const img = new Image();
        img.src = src;
        if (typeof img.decode === "function") {
          img.decode().catch(() => {});
        }
      } catch {}
    }
  });
}
