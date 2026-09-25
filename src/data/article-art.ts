/**
 * 🖼️ ภาพหน้าไพ่ประจำบทความ — ใช้ร่วมกันระหว่างหน้า /blog และบทความเด่นในหน้าแรก
 * ---------------------------------------------------------------------------
 * ลำดับการเลือก: ภาพที่จับคู่ไว้เองรายบทความ ➔ ไพ่ที่บทความพูดถึง (`targetCardId`) ➔ ภาพประจำหมวด
 * ไฟล์นี้เบา (ไม่มีเนื้อหาบทความ) จึง import ใน island ได้โดยบันเดิลไม่โต
 */
const ARTICLE_CARD_MAP: Record<string, string> = {
  "how-to-read-tarot-for-beginners": "major-01.jpg",
  "tarot-love-reading-guide": "major-06.jpg",
  "tarot-love-3-cards-feelings": "cups-02.jpg",
  "tarot-ex-return-signs": "cups-06.jpg",
  "top-10-soulmate-tarot-cards": "major-06.jpg",
  "tarot-single-timing-love": "cups-01.jpg",
  "tarot-career-change-spread": "major-07.jpg",
  "tarot-job-interview-one-card": "wands-01.jpg",
  "tarot-wealth-money-cards": "pentacles-01.jpg",
  "tarot-business-elements-spread": "major-04.jpg",
  "celtic-cross-spread-guide": "major-10.jpg",
  "tarot-daily-card-guide": "major-19.jpg",
  "tarot-7-chakras-spread": "major-14.jpg",
  "how-to-ask-tarot-questions": "major-02.jpg",
  "the-lovers-card-meaning": "major-06.jpg",
  "the-tower-and-death-meaning": "major-16.jpg",
  "the-fool-journey-meaning": "major-00.jpg",
  "the-wheel-of-fortune-meaning": "major-10.jpg",
  "reversed-tarot-cards-guide": "major-12.jpg",
  "provably-fair-tarot-guide": "major-11.jpg",
  "tarot-and-carl-jung-psychology": "major-09.jpg",
  "ai-tarot-oracle-vs-human-reader": "major-17.jpg",
  "tarot-history-1909-rider-waite": "major-01.jpg",
  "major-arcana-22-cards-complete-guide": "major-21.jpg",
  "minor-arcana-4-suits-guide": "wands-04.jpg",
  "tarot-yes-no-spread-guide": "swords-01.jpg",
};

/* คืนเฉพาะชื่อไฟล์ภาพ — ไม่คืน alt เพราะภาพไพ่ประจำบทความเป็นภาพประกอบล้วน
   หัวข้อบทความที่พิมพ์อยู่ข้าง ๆ ทำหน้าที่บอกชื่อให้แล้ว (INC-0125) */
export function getArticleCardArt(article: { slug: string; category: string; targetCardId?: string }): { image: string } {
  const image =
    ARTICLE_CARD_MAP[article.slug] ||
    (article.targetCardId ? `${article.targetCardId}.jpg` : "") ||
    (article.category === "love"
      ? "major-06.jpg"
      : article.category === "career"
        ? "pentacles-01.jpg"
        : article.category === "spreads"
          ? "major-10.jpg"
          : article.category === "cards"
            ? "major-01.jpg"
            : "major-09.jpg");

  return { image };
}
