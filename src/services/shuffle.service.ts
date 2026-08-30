import { generateServerSeed, combineSeeds, shuffleDeckWithSeed, verifyShuffle } from "@/lib/crypto/provably-fair";
import { DECK } from "@/data/cards";
import type { TarotCard } from "@/data/cards/types";

export class ShuffleService {
  static createServerSeed(): string {
    return generateServerSeed();
  }

  static shuffleDeck(serverSeed: string, clientSeed: string): { shuffledDeck: TarotCard[]; combinedHash: string } {
    const combinedHash = combineSeeds(serverSeed, clientSeed);
    const shuffledDeck = shuffleDeckWithSeed([...DECK], combinedHash) as TarotCard[];
    return { shuffledDeck, combinedHash };
  }

  static verifyCommitment(serverSeed: string, clientSeed: string, expectedHash: string): boolean {
    return verifyShuffle(serverSeed, clientSeed, expectedHash);
  }
}
