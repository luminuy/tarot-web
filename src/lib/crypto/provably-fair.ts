import { createHash, randomBytes } from "crypto";

/**
 * Provably-Fair Cryptographic Deck Shuffler
 * Uses SHA-256 HMAC / Hash-based commitment scheme
 */

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function computeHash(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function combineSeeds(serverSeed: string, clientSeed: string): string {
  return computeHash(`${serverSeed}:${clientSeed}`);
}

/**
 * Deterministic Fisher-Yates shuffle using combined cryptographic seed
 */
export function shuffleDeckWithSeed<T>(deck: T[], combinedSeed: string): T[] {
  const result = [...deck];
  let currentHash = combinedSeed;

  for (let i = result.length - 1; i > 0; i--) {
    currentHash = computeHash(currentHash);
    const hexSlice = currentHash.slice(0, 8);
    const intVal = parseInt(hexSlice, 16);
    const j = intVal % (i + 1);

    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result;
}

export function verifyShuffle(serverSeed: string, clientSeed: string, expectedCombinedHash: string): boolean {
  const actualHash = combineSeeds(serverSeed, clientSeed);
  return actualHash.toLowerCase() === expectedCombinedHash.toLowerCase();
}
