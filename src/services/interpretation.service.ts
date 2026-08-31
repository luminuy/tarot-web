import { streamGeminiReading, streamMockGeminiReading } from "@/lib/ai/gemini";
import type { ReadingEvent } from "@/lib/ai/claude";
import { getSpread } from "@/data/spreads";
import type { TarotCard } from "@/data/cards/types";

export class InterpretationService {
  /**
   * Google Gemini 3.7 Flash Tarot Engine
   * Primary: Google Gemini 3.7 Flash (High-Speed Reasoning)
   * Fallback: Local Contextual Tarot Engine
   */
  static async *streamReading(params: {
    spreadId: string;
    personaId: string;
    question: string;
    nickname?: string;
    drawn: Array<{ order: number; cardIndex: number; isReversed: boolean }>;
    cards: TarotCard[];
  }): AsyncGenerator<ReadingEvent> {
    const spread = getSpread(params.spreadId);
    if (!spread) {
      throw new Error(`Spread ${params.spreadId} not found`);
    }

    const readingCtx = {
      personaId: params.personaId,
      spread,
      category: spread.defaultCategory,
      question: params.question,
      intake: {},
      nickname: params.nickname,
      drawn: params.drawn,
      cards: params.cards,
      safety: { flag: "none" as const, block: false },
    };

    // 1. Primary: Google Gemini 3.7 Flash
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      try {
        yield* streamGeminiReading(readingCtx);
        return;
      } catch (geminiError) {
        console.warn("⚠️ Google Gemini stream failed, falling back to mock generator...", geminiError);
      }
    }

    // 2. Fallback Local Simulator
    yield* streamMockGeminiReading(readingCtx);
  }
}
