import type { Article, ArticleSummary } from "./articles";

export function getArticleTitle(
  article: Article | ArticleSummary,
  localeOrIsEnglish: string | boolean,
): string {
  const isEnglish = typeof localeOrIsEnglish === "boolean" ? localeOrIsEnglish : localeOrIsEnglish === "en";
  if (isEnglish && article.titleEn) {
    return article.titleEn;
  }
  return article.title;
}

export function getArticleDescription(
  article: Article | ArticleSummary,
  localeOrIsEnglish: string | boolean,
): string {
  const isEnglish = typeof localeOrIsEnglish === "boolean" ? localeOrIsEnglish : localeOrIsEnglish === "en";
  if (isEnglish && article.descriptionEn) {
    return article.descriptionEn;
  }
  return article.description;
}

export function getArticleCategory(
  article: Article | ArticleSummary,
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
  article: Article | ArticleSummary,
  localeOrIsEnglish: string | boolean,
): string {
  const isEnglish = typeof localeOrIsEnglish === "boolean" ? localeOrIsEnglish : localeOrIsEnglish === "en";
  if (isEnglish) return article.authorEn || "SeerTarot Oracle Sanctuary";
  return article.author;
}
