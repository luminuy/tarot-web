/**
 * 🔐 Client-side Provably-Fair Verifier (Web Crypto)
 * -----------------------------------------------------------------------------
 * พอร์ตอัลกอริทึม SeededStream + drawCards + verifyCommitment จาก shuffle.ts
 * ให้ทำงานบน Web Crypto API (crypto.subtle) ในเบราว์เซอร์โดยตรง ปราศจากการเรียก node:crypto
 *
 * Output รับประกัน byte-identical กับ shuffle.ts (Fisher-Yates + Rejection Sampling + REVERSAL_RATE 0.4)
 */

const REVERSAL_RATE = 0.4;
const POOL_BLOCKS = 48; // 48 * 32B = 1536B ≈ 384 uint32 (ครอบคลุม rejection sampling สำรับ 78 ใบ)

async function sha256Bytes(input: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return new Uint8Array(buf);
}

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

class ClientSeededStream {
  private view: DataView;
  private offset = 0;
  private readonly len: number;

  constructor(pool: Uint8Array) {
    this.view = new DataView(pool.buffer, pool.byteOffset, pool.byteLength);
    this.len = pool.byteLength;
  }

  private nextUint32(): number {
    if (this.offset + 4 > this.len) {
      throw new Error("VERIFY_POOL_EXHAUSTED");
    }
    const val = this.view.getUint32(this.offset, false); // false = big-endian (ตรงกับ readUInt32BE)
    this.offset += 4;
    return val;
  }

  nextInt(maxInclusive: number): number {
    if (maxInclusive <= 0) return 0;
    const range = maxInclusive + 1;
    const limit = Math.floor(0x1_0000_0000 / range) * range;
    let value: number;
    do {
      value = this.nextUint32();
    } while (value >= limit);
    return value % range;
  }

  nextFloat(): number {
    return this.nextUint32() / 0x1_0000_0000;
  }
}

async function buildPool(streamSeedHex: string): Promise<Uint8Array> {
  const out = new Uint8Array(POOL_BLOCKS * 32);
  for (let i = 0; i < POOL_BLOCKS; i++) {
    const block = await sha256Bytes(`${streamSeedHex}:${i}`);
    out.set(block, i * 32);
  }
  return out;
}

export interface ClientDrawnCard {
  order: number;
  cardIndex: number;
  isReversed: boolean;
}

/**
 * คำนวณผลการจั่วไพ่ซ้ำในเบราว์เซอร์จาก Seeds
 */
export async function drawCardsClient(params: {
  serverSeed: string;
  clientSeed: string;
  count: number;
  pickedIndices?: number[];
  deckSize?: number;
}): Promise<ClientDrawnCard[]> {
  const { serverSeed, clientSeed, count, pickedIndices, deckSize = 78 } = params;

  if (count < 1 || count > deckSize) {
    throw new Error(`จำนวนไพ่ที่จั่วต้องอยู่ระหว่าง 1 ถึง ${deckSize} (ได้รับ ${count})`);
  }

  if (pickedIndices) {
    if (pickedIndices.length !== count) {
      throw new Error(`จำนวนไพ่ที่เลือก (${pickedIndices.length}) ไม่ตรงกับที่ต้องการ (${count})`);
    }
    const unique = new Set(pickedIndices);
    if (unique.size !== count) {
      throw new Error("ไม่สามารถเลือกไพ่ใบเดิมซ้ำกันในรอบเดียวกันได้");
    }
    for (const idx of pickedIndices) {
      if (idx < 0 || idx >= deckSize) {
        throw new Error(`index ของไพ่ที่เลือก (${idx}) อยู่นอกช่วง 0 ถึง ${deckSize - 1}`);
      }
    }
  }

  const streamSeedHex = toHex(await sha256Bytes(`${serverSeed}|${clientSeed}`));
  const stream = new ClientSeededStream(await buildPool(streamSeedHex));

  const deck = Array.from({ length: deckSize }, (_, i) => i);
  for (let i = deckSize - 1; i > 0; i--) {
    const j = stream.nextInt(i);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const chosenCardIndices = pickedIndices
    ? pickedIndices.map((fanIndex) => deck[fanIndex])
    : deck.slice(0, count);

  return chosenCardIndices.map((cardIndex, order) => ({
    order,
    cardIndex,
    isReversed: stream.nextFloat() < REVERSAL_RATE,
  }));
}

/**
 * ตรวจสอบว่า serverSeed ที่เฉลยมา เมื่อคำนวณ SHA-256 แล้วตรงกับ commitment ที่ให้ไว้ล่วงหน้าหรือไม่
 */
export async function verifyCommitmentClient(serverSeed: string, commitment: string): Promise<boolean> {
  if (!serverSeed || !commitment) return false;
  const expected = toHex(await sha256Bytes(serverSeed));
  if (expected.length !== commitment.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ commitment.charCodeAt(i);
  }
  return diff === 0;
}

export interface VerificationResult {
  commitmentOk: boolean;
  drawMatches: boolean;
  expectedDraw: ClientDrawnCard[];
  mismatchDetail?: string;
}

/**
 * ตรวจสอบความถูกต้องสมบูรณ์แบบครบวงจรของคำทำนาย (Commitment Match + Re-derived Deck Match)
 */
export async function verifyReading(params: {
  serverSeed: string;
  clientSeed: string;
  commitment: string;
  drawn: { order: number; cardIndex: number; isReversed: boolean }[];
  pickedIndices?: number[];
  deckSize?: number;
}): Promise<VerificationResult> {
  const commitmentOk = await verifyCommitmentClient(params.serverSeed, params.commitment);
  const expectedDraw = await drawCardsClient({
    serverSeed: params.serverSeed,
    clientSeed: params.clientSeed,
    count: params.drawn.length,
    pickedIndices: params.pickedIndices,
    deckSize: params.deckSize,
  });

  const sortByOrder = <T extends { order: number }>(arr: T[]) => [...arr].sort((a, b) => a.order - b.order);
  const A = sortByOrder(expectedDraw);
  const B = sortByOrder(params.drawn);

  let drawMatches = A.length === B.length;
  let mismatchDetail: string | undefined;

  for (let i = 0; i < A.length && drawMatches; i++) {
    if (A[i].cardIndex !== B[i].cardIndex || A[i].isReversed !== B[i].isReversed) {
      drawMatches = false;
      mismatchDetail = `ตำแหน่งที่ ${i + 1}: คาดว่า #${A[i].cardIndex}${A[i].isReversed ? " (กลับหัว)" : ""} แต่ได้รับ #${B[i].cardIndex}${B[i].isReversed ? " (กลับหัว)" : ""}`;
    }
  }

  return { commitmentOk, drawMatches, expectedDraw, mismatchDetail };
}
