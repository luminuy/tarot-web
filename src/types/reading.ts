import type { TarotCard } from "./tarot";

export type ReadingStep = 1 | 2 | 3 | 4 | 5;

export interface PickedCardItem {
  order: number;
  card: TarotCard;
  isReversed: boolean;
  revealed: boolean;
}

export interface ReadingSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  step: ReadingStep;
  spreadId: string;
  question: string;
  querentName?: string;
  context?: string;
  personaId: string;
  serverSeed: string;
  clientSeed?: string;
  combinedHash?: string;
  pickedCards: PickedCardItem[];
  revealedOrders: number[];
  readingText?: string;
  isComplete: boolean;
}

export interface StartReadingPayload {
  spreadId: string;
  question: string;
  querentName?: string;
  context?: string;
  personaId: string;
}

export interface ShuffleReadingPayload {
  clientSeed: string;
  deckCutPoint?: number;
}

export interface PickCardsPayload {
  selectedIndices: number[];
}

export interface RevealCardPayload {
  order: number;
}

export interface VerificationResult {
  valid: boolean;
  serverSeed: string;
  clientSeed: string;
  combinedHash: string;
  deckOrder: string[];
}
