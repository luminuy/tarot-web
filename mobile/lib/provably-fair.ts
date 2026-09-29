import * as Crypto from "expo-crypto";

/**
 * 🔐 ตรวจ Provably Fair ในเครื่อง — พอร์ตจาก `src/lib/tarot/verify-client.ts` ของเว็บ
 * ใช้ `expo-crypto` แทน `crypto.subtle` (แผน IOS_APP_PLAN ข้อ 3.5)
 *
 * ⚠️ ผลต้อง byte-identical กับ `shuffle.ts` ฝั่งเซิร์ฟเวอร์ (Fisher-Yates + rejection sampling + REVERSAL_RATE 0.4)
 * ห้ามแก้อัลกอริทึมที่นี่โดยไม่แก้ทั้งสามที่พร้อมกัน — เทสต์ `__tests__/provably-fair.test.ts`
 * เทียบกับเวกเตอร์ที่สร้างจากโค้ดเว็บ
 */
const REVERSAL_RATE = 0.4;
const POOL_BLOCKS = 48;

async function sha256Bytes(input: string): Promise<Uint8Array> {
  const buf = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new TextEncoder().encode(input));
  return new Uint8Array(buf);
}

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

class SeededStream {
  private view: DataView;
  private offset = 0;

  constructor(private readonly pool: Uint8Array) {
    this.view = new DataView(pool.buffer, pool.byteOffset, pool.byteLength);
  }

  private nextUint32(): number {
    if (this.offset + 4 > this.pool.byteLength) throw new Error("VERIFY_POOL_EXHAUSTED");
    const value = this.view.getUint32(this.offset, false);
    this.offset += 4;
    return value;
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
    out.set(await sha256Bytes(`${streamSeedHex}:${i}`), i * 32);
  }
  return out;
}

export interface DrawnCard {
  order: number;
  cardIndex: number;
  isReversed: boolean;
}

export async function drawCardsLocal(params: {
  serverSeed: string;
  clientSeed: string;
  count: number;
  pickedIndices?: number[];
  deckSize?: number;
}): Promise<DrawnCard[]> {
  const { serverSeed, clientSeed, count, pickedIndices, deckSize = 78 } = params;
  if (count < 1 || count > deckSize) throw new Error(`จำนวนไพ่ที่จั่วต้องอยู่ระหว่าง 1 ถึง ${deckSize}`);
  if (pickedIndices) {
    if (pickedIndices.length !== count || new Set(pickedIndices).size !== count) {
      throw new Error("ไพ่ที่เลือกไม่ครบหรือซ้ำกัน");
    }
    if (pickedIndices.some((i) => i < 0 || i >= deckSize)) throw new Error("ตำแหน่งไพ่ที่เลือกอยู่นอกสำรับ");
  }

  const streamSeedHex = toHex(await sha256Bytes(`${serverSeed}|${clientSeed}`));
  const stream = new SeededStream(await buildPool(streamSeedHex));

  const deck = Array.from({ length: deckSize }, (_, i) => i);
  for (let i = deckSize - 1; i > 0; i--) {
    const j = stream.nextInt(i);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const chosen = pickedIndices ? pickedIndices.map((fan) => deck[fan]) : deck.slice(0, count);
  return chosen.map((cardIndex, order) => ({
    order,
    cardIndex,
    isReversed: stream.nextFloat() < REVERSAL_RATE,
  }));
}

export async function verifyCommitmentLocal(serverSeed: string, commitment: string): Promise<boolean> {
  if (!serverSeed || !commitment) return false;
  const expected = toHex(await sha256Bytes(serverSeed));
  if (expected.length !== commitment.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ commitment.charCodeAt(i);
  return diff === 0;
}

export interface VerificationResult {
  commitmentOk: boolean;
  drawMatches: boolean;
}

/** ตรวจว่าเฉลย serverSeed ตรงคำมั่นที่ให้ไว้ก่อนสับ และไพ่ที่ได้คำนวณซ้ำแล้วตรงกันทุกใบ */
export async function verifyReadingLocal(params: {
  serverSeed: string;
  clientSeed: string;
  commitment: string;
  drawn: DrawnCard[];
  pickedIndices?: number[];
}): Promise<VerificationResult> {
  const commitmentOk = await verifyCommitmentLocal(params.serverSeed, params.commitment);
  const expected = await drawCardsLocal({
    serverSeed: params.serverSeed,
    clientSeed: params.clientSeed,
    count: params.drawn.length,
    pickedIndices: params.pickedIndices,
  });
  const byOrder = <T extends { order: number }>(a: T[]) => [...a].sort((x, y) => x.order - y.order);
  const A = byOrder(expected);
  const B = byOrder(params.drawn);
  const drawMatches =
    A.length === B.length && A.every((c, i) => c.cardIndex === B[i].cardIndex && c.isReversed === B[i].isReversed);
  return { commitmentOk, drawMatches };
}
