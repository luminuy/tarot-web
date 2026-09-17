import { ArticleReadingClient } from "@/components/blog/ArticleReadingClient";
import type { Article } from "@/data/articles";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 📖 ส่วนโต้ตอบสำหรับหน้าบทความรายเรื่อง (แชร์ลิงก์ · ปุ่มคัดลอก)
 * แยกเป็น island เฉพาะหน้า เพื่อไม่ให้ปนกับรายการบทความทั้งหมดของ /blog
 */
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
