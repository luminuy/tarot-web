import NextLink from "next/link";
import type { ComponentProps } from "react";

import { isAstroRoute } from "@/lib/routing/astro-routes";

/**
 * 🔗 ลิงก์ภายในที่รู้ว่าปลายทางเรนเดอร์ด้วยเครื่องมือไหน
 * ===========================================================================
 *
 * เว็บนี้มีเครื่องมือเรนเดอร์สองตัวอยู่ร่วมกันระหว่างการย้าย (ดู `src/lib/routing/astro-routes.ts`)
 * หน้าที่ย้ายไป Astro แล้วเป็น **ไฟล์ HTML ที่ Cloudflare ตอบเองที่ขอบ ไม่เคยผ่าน Worker**
 * จึงไม่มีเพย์โหลด RSC ให้ router ของ Next ดึง
 *
 * ถ้าปล่อยให้ `next/link` จัดการปลายทางแบบนั้น ทุกคลิกจะ:
 *   1. ยิงขอ RSC ของหน้าปลายทาง ➔ ได้ HTML ธรรมดากลับมา
 *   2. ทิ้งคำตอบนั้นแล้วโหลดทั้งหน้าใหม่อยู่ดี
 * = เสียคำขอฟรี ๆ หนึ่งเส้นต่อการคลิกหนึ่งครั้ง และผู้ใช้รอนานขึ้นโดยไม่ได้อะไรเลย
 *
 * ความเร็วของการนำทางแบบ MPA มาจาก Speculation Rules ที่ประกาศไว้ใน `<head>` ทุกหน้าอยู่แล้ว
 *
 * ⚠️ ไฟล์นี้ **ไม่มี `"use client"` และห้ามใช้ hook ใด ๆ** — ต้องเรียกได้จากทั้ง
 *    Server Component ของ Next (เช่น `HomeSeoContent`) และจาก island ของ Astro
 *    ถ้าต้องการลิงก์ที่รู้ภาษาของหน้าด้วย ให้ใช้ `LocaleLink` ซึ่งเรียกตัวนี้ต่ออีกชั้น
 */
type RouteLinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & { href: string };

export function RouteLink({ href, ...rest }: RouteLinkProps) {
  if (isAstroRoute(href)) {
    const { prefetch: _prefetch, replace: _replace, scroll: _scroll, ...anchorProps } = rest;
    return <a href={href} {...anchorProps} />;
  }

  return <NextLink href={href} {...rest} />;
}

