"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useLocale } from "@/lib/i18n";
import { localeHref } from "@/lib/i18n/paths";
import { isAstroRoute } from "@/lib/routing/astro-routes";

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
  const target = localeHref(href, locale);

  /*
   * 🚧 ปลายทางที่เรนเดอร์ด้วย Astro ต้องใช้ `<a>` ธรรมดาเท่านั้น
   * -------------------------------------------------------------------------
   * หน้าเหล่านั้นเป็นไฟล์ HTML ที่ Cloudflare ตอบเองที่ขอบ ไม่เคยผ่าน Worker
   * จึง **ไม่มีเพย์โหลด RSC** ให้ router ของ Next ดึง · ถ้าปล่อยให้ `next/link`
   * จัดการ มันจะยิงขอ RSC ก่อนทุกครั้งแล้วค่อยถอยไปโหลดทั้งหน้า = ช้าลงและ
   * เปลืองคำขอฟรี ๆ หนึ่งเส้นต่อการคลิกหนึ่งครั้ง
   *
   * ความเร็วของการนำทางแบบนี้มาจาก Speculation Rules ที่ประกาศไว้ใน <head>
   * ของทุกหน้าอยู่แล้ว (อุ่นหน้าปลายทางตอนผู้ใช้กดเมาส์ลง)
   *
   * ⚠️ ตัวตัดสินอยู่ที่ `src/lib/routing/astro-routes.ts` ที่เดียว ห้ามเช็ก path เอง
   */
  if (isAstroRoute(target)) {
    const { prefetch: _prefetch, replace: _replace, scroll: _scroll, ...anchorProps } = rest;
    return <a href={target} {...anchorProps} />;
  }

  return <Link href={target} {...rest} />;
}

export default LocaleLink;
