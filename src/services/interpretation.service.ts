import { streamGeminiReading, streamMockGeminiReading } from "@/lib/ai/gemini";
import { streamReading as streamClaudeReading, type ReadingEvent } from "@/lib/ai/claude";
import { getSpread } from "@/data/spreads";
import type { TarotCard } from "@/data/cards/types";

export class InterpretationService {
  /**
   * Dual-Engine AI Streamer with Auto-Failover
   * Primary: Anthropic Claude 3.5/3.7 Sonnet (if ANTHROPIC_API_KEY is present)
   * Secondary: Google Gemini (if GEMINI_API_KEY is present)
   * Fallback: Local Mock Engine
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

    // 1. Try Anthropic Claude first if Key exists
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        yield* streamClaudeReading(readingCtx);
        return;
      } catch (claudeError) {
        console.warn("⚠️ Anthropic Claude stream failed, auto-failing over to Gemini...", claudeError);
      }
    }

    // 2. Try Google Gemini if Key exists or as primary
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      try {
        yield* streamGeminiReading(readingCtx);
        return;
      } catch (geminiError) {
        console.warn("⚠️ Google Gemini stream failed, falling back to mock generator...", geminiError);
      }
    }

    // 3. Fallback Local Simulator
    yield* streamMockGeminiReading(readingCtx);
  }
}
