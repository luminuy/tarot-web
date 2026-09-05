import Link from "next/link";
import type { TarotCard } from "@/data/cards/types";
import { SPREADS } from "@/data/spreads";
import { ARTICLES } from "@/data/articles";

interface CardSpreadLinksProps {
  card: TarotCard;
}

function getCardPrimaryCategory(card: TarotCard): { spreadCat: string; articleCat: string } {
  if (card.suit === "cups" || card.id === "major-06") {
    return { spreadCat: "love", articleCat: "love" };
  }
  if (card.suit === "wands" || card.id === "major-04" || card.id === "major-07") {
    return { spreadCat: "work", articleCat: "career" };
  }
  if (card.suit === "pentacles") {
    return { spreadCat: "money", articleCat: "career" };
  }
  if (card.suit === "swords") {
    return { spreadCat: "general", articleCat: "wisdom" };
  }
  return { spreadCat: "self", articleCat: "cards" };
}

export function CardSpreadLinks({ card }: CardSpreadLinksProps) {
  const { spreadCat, articleCat } = getCardPrimaryCategory(card);

  // 1. Spreads related to this card's theme or classic general spreads
  const categorySpreads = SPREADS.filter(
    (s) => s.defaultCategory === spreadCat && s.id !== "celtic-cross" && s.id !== "three-card"
  ).slice(0, 2);

  const classicSpreads = SPREADS.filter(
    (s) => s.id === "three-card" || s.id === "celtic-cross" || s.id === "daily"
  ).slice(0, 2);

  const targetSpreads = [...categorySpreads, ...classicSpreads].slice(0, 4);

  // 2. Articles featuring this specific card or related to this category
  const directArticles = ARTICLES.filter((a) => a.targetCardId === card.id);
  const categoryArticles = ARTICLES.filter(
    (a) => a.category === articleCat || a.category === "cards"
  ).slice(0, 3 - directArticles.length);

  const relatedArticles = [...directArticles, ...categoryArticles].slice(0, 3);

  return (
    <div className="space-y-8 pt-8 border-t border-[#D5CEC2]/40">
      {/* Spread Links */}
      <section aria-label="ผังพยากรณ์ที่แนะนำสำหรับไพ่ใบนี้" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-th text-sm font-bold text-[#8F5C1A]">
            เปิดไพ่ใบนี้ในผังพยากรณ์จริง
          </h2>
          <Link
            href="/spreads"
            className="text-xs font-serif-th text-[#635B4E] hover:text-[#8F5C1A] transition-colors"
          >
            ดูผังทั้งหมด →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {targetSpreads.map((spread) => (
            <Link
              key={spread.id}
              href={`/spreads/${spread.id}`}
              className="p-3.5 rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] hover:border-[#8F5C1A] hover:bg-[#FAF7F2] transition-colors flex flex-col justify-between group shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8F5C1A]"
            >
              <div>
                <span className="text-[11px] font-mono font-bold text-[#8F5C1A] block mb-1">
                  {spread.positions.length} ใบ · {spread.defaultCategory}
                </span>
                <span className="font-serif-th text-xs sm:text-sm font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors block">
                  {spread.nameTh}
                </span>
                <p className="font-serif-th text-[11px] text-[#635B4E] mt-1 line-clamp-2">
                  {spread.tagline}
                </p>
              </div>
              <div className="pt-2 mt-2 border-t border-[#D5CEC2]/40 text-right">
                <span className="text-[11px] font-serif-th text-[#8F5C1A] group-hover:underline">
                  เริ่มเปิดไพ่ผังนี้ →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Related Blog Articles */}
      {relatedArticles.length > 0 && (
        <section aria-label="บทความคู่มือที่เกี่ยวข้อง" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif-th text-sm font-bold text-[#8F5C1A]">
              บทความและคู่มือการอ่านไพ่ที่เกี่ยวข้อง
            </h2>
            <Link
              href="/blog"
              className="text-xs font-serif-th text-[#635B4E] hover:text-[#8F5C1A] transition-colors"
            >
              คลังบทความทั้งหมด →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {relatedArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="p-3.5 rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] hover:border-[#8F5C1A] hover:bg-[#FAF7F2] transition-colors flex flex-col justify-between group shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8F5C1A]"
              >
                <div>
                  <span className="text-[11px] font-serif-th text-[#8F5C1A] block mb-1">
                    {article.categoryTh} · อ่าน {article.readTime}
                  </span>
                  <h3 className="font-serif-th text-xs sm:text-sm font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="font-serif-th text-[11px] text-[#635B4E] mt-1 line-clamp-2">
                    {article.description}
                  </p>
                </div>
                <div className="pt-2 mt-2 border-t border-[#D5CEC2]/40 text-right">
                  <span className="text-[11px] font-serif-th text-[#8F5C1A] group-hover:underline">
                    อ่านบทความ →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
