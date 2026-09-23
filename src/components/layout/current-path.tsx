"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * path ของหน้าปัจจุบัน สำหรับไฮไลต์เมนู (A4-04)
 *
 * หน้าของ Astro เรนเดอร์หัวเว็บแบบ static — `usePathname()` ของ shim คืน "" ตอนเรนเดอร์
 * เมนูจึงไม่เคยรู้ว่าอยู่หน้าไหน · หน้า Astro ส่ง `Astro.url.pathname` ผ่าน provider นี้แทน
 * ฝั่ง Next ไม่มี provider ➔ ถอยไปใช้ `usePathname()` ตามเดิม
 */
const CurrentPathContext = createContext<string | null>(null);

export function CurrentPathProvider({ pathname, children }: { pathname?: string; children: ReactNode }) {
  return <CurrentPathContext.Provider value={pathname ?? null}>{children}</CurrentPathContext.Provider>;
}

export function useCurrentPath(): string {
  const fromProvider = useContext(CurrentPathContext);
  const fromRouter = usePathname();
  const raw = fromProvider || fromRouter || "/";
  // build.format "file" + trailingSlash "never" — กันไว้เผื่อได้ `/x/` หรือ `/x.html`
  const trimmed = raw.replace(/\.html$/, "").replace(/\/+$/, "");
  return trimmed || "/";
}
