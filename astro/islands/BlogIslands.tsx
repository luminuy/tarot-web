import { ArticleReadingClient } from "@/components/blog/ArticleReadingClient";
import { BlogIndexClient } from "@/components/blog/BlogIndexClient";
import { blogCardItems } from "@/app/_shared/pages/blog-index";
import type { Article } from "@/data/articles";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 📚 ส่วนที่ต้องใช้ JS จริงของกลุ่มหน้าบทความ
 *
 * ⚠️ `blogCardItems()` ถูกเรียกในไฟล์นี้โดยตั้งใจ — มันตัดเหลือ 10 ฟิลด์ที่การ์ดใช้จริง
 *    (ISSUE-043) จึงเบาพอที่จะอยู่ในบันเดิล และไม่ต้องฝังลง HTML เป็น prop ทุกหน้า
 * ⚠️ ส่วนหน้าบทความรายเรื่อง **ต้องรับ `article` เป็น prop** ห้ามนำเข้าคลังบทความมาหาเอง
 *    ไม่งั้นบทความทั้ง 26 เรื่องพร้อมเนื้อหาเต็มจะถูกมัดลงบันเดิลของทุกหน้า
 */
export function BlogIndexRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <BlogIndexClient articles={blogCardItems()} />
    </LocaleProvider>
  );
}

export function ArticleReaderRoot({
  article,
  relatedArticles,
  locale,
}: {
  article: Article;
  relatedArticles: Article[];
  locale: Locale;
}) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <ArticleReadingClient article={article} relatedArticles={relatedArticles} />
    </LocaleProvider>
  );
}
