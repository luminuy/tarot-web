"use client";

import type { ComponentProps } from "react";

import { RouteLink } from "@/components/ui/RouteLink";

import { useLocale } from "@/lib/i18n";
import { localeHref } from "@/lib/i18n/paths";

type LocaleLinkProps = Omit<ComponentProps<typeof RouteLink>, "href"> & { href: string };

/**
 * 🔗 ลิงก์ภายในที่รู้จักภาษาของหน้าที่มันอยู่
 * ---------------------------------------------------------------------------
 * ปัญหาที่แก้: ในหน้า `/en/**` ถ้าเขียน `<Link href="/cards">` ตรง ๆ ผู้ใช้จะถูกพา
 * ออกจากต้นไม้ภาษาอังกฤษกลับไปหน้าไทยกลางคัน (และบอตก็เดินตามไปด้วย)
 *
 * ใช้แทน `next/link` **ทุกจุดที่เป็นลิงก์ภายในและปรากฏบนหน้าอังกฤษ**
 * ลิงก์ที่ไม่มีฝาแฝดอังกฤษ (เช่น `/blog`) จะถูกปล่อยไว้เหมือนเดิมโดยอัตโนมัติ
 */
export function LocaleLink({ href, ...rest }: LocaleLinkProps) {
  const { locale } = useLocale();
  /*
   * `RouteLink` เป็นคนตัดสินว่าปลายทางเรนเดอร์ด้วยเครื่องมือไหน แล้วเลือกให้เองว่าจะใช้
   * `<a>` ธรรมดาหรือ `next/link` — ที่นี่รับผิดชอบแค่เรื่องภาษาอย่างเดียว (แยกหน้าที่กันชัด)
   */
  return <RouteLink href={localeHref(href, locale)} {...rest} />;
}

export default LocaleLink;
