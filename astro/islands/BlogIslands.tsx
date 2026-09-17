import { BlogIndexClient } from "@/components/blog/BlogIndexClient";
import { blogCardItems } from "@/app/_shared/pages/blog-index";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 📚 ส่วนที่ต้องใช้ JS จริงของหน้ารวมบทความ (/blog)
 *
 * ⚠️ `blogCardItems()` ถูกเรียกในไฟล์นี้โดยตั้งใจ — มันตัดเหลือ 10 ฟิลด์ที่การ์ดใช้จริง
 *    (ISSUE-043) จึงเบาพอที่จะอยู่ในบันเดิล และไม่ต้องฝังลง HTML เป็น prop ทุกหน้า
 */
export function BlogIndexRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <BlogIndexClient articles={blogCardItems()} />
    </LocaleProvider>
  );
}
