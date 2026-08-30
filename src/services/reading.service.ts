import { ReadingRepository } from "@/server/repositories/reading.repository";
import { ShuffleService } from "./shuffle.service";
import { PickService } from "./pick.service";
import { SafetyService } from "./safety.service";
import type { ReadingSession, StartReadingPayload } from "@/types/reading";
import { randomUUID } from "crypto";

export class ReadingService {
  static async startReading(payload: StartReadingPayload): Promise<{ session?: ReadingSession; error?: string }> {
    const safetyCheck = SafetyService.inspectQuestion(payload.question);
    if (!safetyCheck.isSafe) {
      return { error: safetyCheck.reason || "คำถามไม่ผ่านการตรวจสอบความปลอดภัย" };
    }

    const serverSeed = ShuffleService.createServerSeed();
    const session: ReadingSession = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      step: 2,
      spreadId: payload.spreadId,
      question: payload.question,
      querentName: payload.querentName,
      context: payload.context,
      personaId: payload.personaId,
      serverSeed,
      pickedCards: [],
      revealedOrders: [],
      isComplete: false,
    };

    await ReadingRepository.save(session);
    return { session };
  }

  static async getSession(id: string): Promise<ReadingSession | null> {
    return ReadingRepository.findById(id);
  }

  static async shuffle(id: string, clientSeed: string): Promise<{ session?: ReadingSession; error?: string }> {
    const session = await ReadingRepository.findById(id);
    if (!session) {
      return { error: "Session not found" };
    }

    const { combinedHash } = ShuffleService.shuffleDeck(session.serverSeed, clientSeed);
    session.clientSeed = clientSeed;
    session.combinedHash = combinedHash;
    session.step = 4;

    await ReadingRepository.save(session);
    return { session };
  }

  static async pick(id: string, selectedIndices: number[]): Promise<{ session?: ReadingSession; error?: string }> {
    const session = await ReadingRepository.findById(id);
    if (!session) {
      return { error: "Session not found" };
    }

    const clientSeed = session.clientSeed || "default-client-seed";
    const { shuffledDeck } = ShuffleService.shuffleDeck(session.serverSeed, clientSeed);
    const { pickedCards, error } = PickService.pickCardsFromDeck(shuffledDeck, selectedIndices, session.spreadId);

    if (error) {
      return { error };
    }

    session.pickedCards = pickedCards;
    session.step = 5;
    await ReadingRepository.save(session);
    return { session };
  }

  static async revealCard(id: string, order: number): Promise<{ session?: ReadingSession; error?: string }> {
    const session = await ReadingRepository.findById(id);
    if (!session) {
      return { error: "Session not found" };
    }

    if (!session.revealedOrders.includes(order)) {
      session.revealedOrders.push(order);
    }

    const cardItem = session.pickedCards.find((c) => c.order === order);
    if (cardItem) {
      cardItem.revealed = true;
    }

    await ReadingRepository.save(session);
    return { session };
  }
}
