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
 */

/** ไม่มีการเปลี่ยน URL ระหว่างหน้าเดียวกันใน MPA — subscribe จึงไม่ต้องทำอะไร */
function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
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

export interface AstroRouter {
  push: (href: string) => void;
  replace: (href: string) => void;
  refresh: () => void;
  back: () => void;
  forward: () => void;
  prefetch: (href: string) => void;
}

const router: AstroRouter = {
  push: (href) => {
    window.location.assign(href);
  },
  replace: (href) => {
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
