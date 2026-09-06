"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useLocale } from "@/lib/i18n";
import { localeHref } from "@/lib/i18n/paths";

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

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
  return <Link href={localeHref(href, locale)} {...rest} />;
}

export default LocaleLink;
