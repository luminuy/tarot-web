import { BlogIndexClient, type BlogCardItem } from "@/components/blog/BlogIndexClient";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 📚 ส่วนที่ต้องใช้ JS จริงของหน้ารวมบทความ (/blog)
 *
 * ⚠️ ห้าม import `@/data/articles` (หรือไฟล์ที่ import มัน) ในไฟล์นี้เด็ดขาด — กติกา island ข้อ 1
 *    เดิมเรียก `blogCardItems()` ตรงนี้ คิดว่าตัดเหลือ 10 ฟิลด์แล้ว "เบาพอ" แต่ตัดตอนรันไทม์
 *    ตัวโมดูลบทความเต็ม 26 เรื่องสองภาษาจึงถูกมัดทั้งก้อน = 57 KB gzip (ผลตรวจ A8-01)
 *    ➔ หน้า .astro เรียก `blogCardItems()` ตอนบิลด์แล้วส่งเข้ามาเป็น prop แทน
 */
export function BlogIndexRoot({ locale, articles }: { locale: Locale; articles: BlogCardItem[] }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <BlogIndexClient articles={articles} />
    </LocaleProvider>
  );
}
