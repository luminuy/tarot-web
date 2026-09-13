export type ArticleTitleLike = { title: string; titleEn?: string };
export type ArticleDescriptionLike = { description: string; descriptionEn?: string };
export type ArticleCategoryLike = {
  category: "love" | "career" | "spreads" | "cards" | "wisdom";
  categoryTh: string;
  categoryEn?: string;
};
export type ArticleAuthorLike = { author: string; authorEn?: string };

export function getArticleTitle(
  article: ArticleTitleLike,
  localeOrIsEnglish: string | boolean,
): string {
  const isEnglish = typeof localeOrIsEnglish === "boolean" ? localeOrIsEnglish : localeOrIsEnglish === "en";
  if (isEnglish && article.titleEn) {
    return article.titleEn;
  }
  return article.title;
}

export function getArticleDescription(
  article: ArticleDescriptionLike,
  localeOrIsEnglish: string | boolean,
): string {
  const isEnglish = typeof localeOrIsEnglish === "boolean" ? localeOrIsEnglish : localeOrIsEnglish === "en";
  if (isEnglish && article.descriptionEn) {
    return article.descriptionEn;
  }
  return article.description;
}

export function getArticleCategory(
  article: ArticleCategoryLike,
  localeOrIsEnglish: string | boolean,
): string {
  const isEnglish = typeof localeOrIsEnglish === "boolean" ? localeOrIsEnglish : localeOrIsEnglish === "en";
  if (isEnglish) {
    if (article.categoryEn) return article.categoryEn;
    switch (article.category) {
      case "love":
        return "Love & Soulmates";
      case "career":
        return "Career & Abundance";
      case "spreads":
        return "Tarot Spreads";
      case "cards":
        return "Card Meanings";
      case "wisdom":
        return "Psychology & AI";
      default:
        return "Wisdom";
    }
  }
  return article.categoryTh;
}

export function getArticleAuthor(
  article: ArticleAuthorLike,
  localeOrIsEnglish: string | boolean,
): string {
  const isEnglish = typeof localeOrIsEnglish === "boolean" ? localeOrIsEnglish : localeOrIsEnglish === "en";
  if (isEnglish) return article.authorEn || "SeerTarot Oracle Sanctuary";
  return article.author;
}
