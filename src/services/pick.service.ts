import { getSpread } from "@/data/spreads";
import type { TarotCard } from "@/types/tarot";
import type { PickedCardItem } from "@/types/reading";

export class PickService {
  static pickCardsFromDeck(
    deck: TarotCard[],
    selectedIndices: number[],
    spreadId: string
  ): { pickedCards: PickedCardItem[]; error?: string } {
    const spread = getSpread(spreadId);
    if (!spread) {
      return { pickedCards: [], error: `Spread ${spreadId} not found` };
    }

    if (selectedIndices.length !== spread.positions.length) {
      return {
        pickedCards: [],
        error: `Expected ${spread.positions.length} cards, but received ${selectedIndices.length}`,
      };
    }

    const pickedCards: PickedCardItem[] = selectedIndices.map((idx, order) => {
      const card = deck[idx % deck.length];
      // Deterministic reverse chance based on index
      const isReversed = (idx + order * 7) % 5 === 0;
      return {
        order,
        card,
        isReversed,
        revealed: false,
      };
    });

    return { pickedCards };
  }
}
