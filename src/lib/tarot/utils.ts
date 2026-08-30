import { DECK, DECK_SIZE } from "@/data/cards";
import { SPREADS, getSpread } from "@/data/spreads";
import type { TarotCard } from "@/data/cards/types";
import type { Spread } from "@/data/spreads";

export function getAllCards(): readonly TarotCard[] {
  return DECK;
}

export function getTotalCardCount(): number {
  return DECK_SIZE;
}

export function getSpreadById(id: string): Spread | undefined {
  return getSpread(id);
}

export function getAllSpreads(): Spread[] {
  return SPREADS;
}

export function getCardById(id: string): TarotCard | undefined {
  return DECK.find((c: TarotCard) => c.id === id);
}
