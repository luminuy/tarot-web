import { useSyncExternalStore } from "react";

/**
 * 🧭 `next/navigation` ฉบับ Astro — อ่านจาก `window.location` ตรง ๆ
 * ===========================================================================
 * เสียบแทนด้วย `vite.resolve.alias` เฉพาะตอนบิลด์ด้วย Astro
 *
 * ทำไมต้องใช้ `useSyncExternalStore` ไม่ใช่อ่าน `location` ตอน render
 * ---------------------------------------------------------------
 * island ถูกเรนเดอร์เป็น HTML ตั้งแต่ตอนบิลด์ (ไม่มี `window`) แล้วค่อย hydrate
 * ถ้า render รอบแรกฝั่งไคลเอนต์อ่านค่าจริงทันที ต้นไม้จะไม่ตรงกับ HTML ที่ส่งมา
 * = hydration mismatch ทั้ง island
 *
 * `useSyncExternalStore` ให้ประกาศ "ค่าฝั่งเซิร์ฟเวอร์" แยกไว้ได้ React จึงใช้ค่านั้น
 * ตอน hydrate แล้วค่อยเรนเดอร์ซ้ำด้วยค่าจริงในเฟรมถัดมาอย่างถูกต้อง
 *
 * ⚠️ `push`/`replace` ต้องแยกสองกรณีให้ขาด — ห้ามโหลดหน้าใหม่ทุกครั้ง
 * ---------------------------------------------------------------------------
 * โค้ดในเว็บนี้ใช้ router สองแบบที่ต่างกันโดยสิ้นเชิง:
 *
 *   1. **เปลี่ยนหน้า** เช่น `router.replace("/admin/login")` ➔ ต้องโหลดหน้าใหม่จริง
 *   2. **เปลี่ยนแค่ query ของหน้าเดิม** เช่นแท็บในแผงแอดมิน
 *      `router.replace(\`/admin?\${params}\`, { scroll: false })` ➔ **ห้ามโหลดหน้าใหม่เด็ดขาด**
 *      ไม่งั้นทุกครั้งที่กดสลับแท็บ หน้าจะรีโหลดทั้งหน้าและสถานะที่ค้างอยู่หายหมด
 *
 * ตัวตัดสินคือ "pathname เดิมหรือไม่" — เหมือนกันก็ใช้ History API เฉย ๆ
 * แล้วปลุกตัวที่ subscribe ไว้ให้เรนเดอร์ใหม่ (`popstate` ไม่ยิงเองเมื่อเรียก pushState)
 */

/** เหตุการณ์ภายในของ shim — ยิงเองหลังเรียก History API เพราะเบราว์เซอร์ไม่ยิงให้ */
const URL_CHANGED = "astro-shim:urlchange";

function notifyUrlChanged(): void {
  window.dispatchEvent(new Event(URL_CHANGED));
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", onChange);
  window.addEventListener(URL_CHANGED, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(URL_CHANGED, onChange);
  };
}

export function usePathname(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => "",
  );
}

export function useSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  return new URLSearchParams(search);
}

/** เปลี่ยนแค่ query/hash ของหน้าเดิมหรือเปล่า (ไม่ใช่การเปลี่ยนหน้า) */
function isSameDocument(href: string): boolean {
  try {
    const target = new URL(href, window.location.href);
    return target.origin === window.location.origin && target.pathname === window.location.pathname;
  } catch {
    return false;
  }
}

export interface AstroRouter {
  push: (href: string, options?: { scroll?: boolean }) => void;
  replace: (href: string, options?: { scroll?: boolean }) => void;
  refresh: () => void;
  back: () => void;
  forward: () => void;
  prefetch: (href: string) => void;
}

const router: AstroRouter = {
  push: (href) => {
    if (isSameDocument(href)) {
      window.history.pushState(null, "", href);
      notifyUrlChanged();
      return;
    }
    window.location.assign(href);
  },
  replace: (href) => {
    if (isSameDocument(href)) {
      window.history.replaceState(null, "", href);
      notifyUrlChanged();
      return;
    }
    window.location.replace(href);
  },
  refresh: () => {
    window.location.reload();
  },
  back: () => {
    window.history.back();
  },
  forward: () => {
    window.history.forward();
  },
  /* Speculation Rules ใน <head> อุ่นหน้าให้อยู่แล้ว — ที่นี่จึงไม่ต้องทำอะไร */
  prefetch: () => {},
};

export function useRouter(): AstroRouter {
  return router;
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return {} as T;
}

/** หน้า Astro ทุกหน้าถูกสร้างจาก `getStaticPaths` ที่รู้เส้นทางที่มีจริงอยู่แล้ว */
export function notFound(): never {
  throw new Error("notFound() ถูกเรียกในหน้าที่เรนเดอร์ด้วย Astro — ตรวจ getStaticPaths");
}

export function redirect(href: string): never {
  if (typeof window !== "undefined") window.location.replace(href);
  throw new Error(`redirect(${href}) ถูกเรียกฝั่งเซิร์ฟเวอร์ในหน้า Astro`);
}
