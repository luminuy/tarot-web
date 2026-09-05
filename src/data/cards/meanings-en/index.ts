import type { CardMeaningEn } from "./types";
import { MAJOR_MEANINGS_EN } from "./major";
import { WANDS_MEANINGS_EN } from "./wands";
import { CUPS_MEANINGS_EN } from "./cups";
import { SWORDS_MEANINGS_EN } from "./swords";
import { PENTACLES_MEANINGS_EN } from "./pentacles";

export * from "./types";

/**
 * Unified English 78-Card Interpretations Dictionary
 * --------------------------------------------------
 * Complete 5-dimensional archetypal interpretations (General, Love, Work, Money, Self)
 * for all 78 Tarot cards in both Upright and Reversed orientations,
 * including authentic Golden Dawn astrology and sacred numerology.
 */
export const CARD_MEANINGS_EN: Record<string, CardMeaningEn> = {
  ...MAJOR_MEANINGS_EN,
  ...WANDS_MEANINGS_EN,
  ...CUPS_MEANINGS_EN,
  ...SWORDS_MEANINGS_EN,
  ...PENTACLES_MEANINGS_EN,
};
