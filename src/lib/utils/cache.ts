import { getCardImageSrc } from "@/lib/tarot/card-image";

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
 */
export function warmupTarotAssets(): void {
  if (typeof window === "undefined" || isPreloaded) return;
  isPreloaded = true;

  const scheduleTask = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1000));

  scheduleTask(() => {
    // 1. Pre-decode Priority Major Arcana Cards using Canonical Path Resolver
    for (const cardFile of PRELOAD_MAJOR_CARDS) {
      try {
        const src = getCardImageSrc(cardFile);
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

/**
 * LRU In-Memory Cache สำหรับเก็บคำทำนายที่เพิ่งเปิด
 */
class LocalSessionCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttlMs = 3600 * 1000): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const tarotSessionCache = new LocalSessionCache<unknown>(30);
