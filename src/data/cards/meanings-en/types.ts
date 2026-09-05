import type { Category, Interpretation } from "../types";

export interface CardMeaningEn {
  /** Golden Dawn / Classical astrological correspondence in English */
  astrology: string;
  /** Sacred numerological essence in English */
  numerology: string;
  /** Deep 5-dimensional archetypal interpretations (upright and reversed) */
  meanings: Record<Category, Interpretation>;
}
