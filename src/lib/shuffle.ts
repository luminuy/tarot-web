import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * การสับไพ่ที่พิสูจน์ได้ (commit–reveal)
 * -------------------------------------------------
 * กฎเหล็กของโปรเจกต์นี้: **AI ไม่เคยเป็นคนจั่วไพ่**
 * ถ้าให้โมเดลจั่วเอง มันจะมโนไพ่ที่ไม่มีในสำรับ เอนไปหาไพ่ดัง ๆ
 * และไม่มีทางตรวจสอบย้อนหลังได้เลย
 *
 * ลำดับการทำงาน:
 *  1. ก่อนผู้ใช้แตะอะไร เซิร์ฟเวอร์สร้าง serverSeed แล้วโชว์ commitment (แฮชของมัน)
 *  2. ผู้ใช้สับ/ตัดไพ่ → ได้ clientSeed จากการขยับจริงของผู้ใช้
 *  3. ผลไพ่ถูกคำนวณจาก serverSeed + clientSeed แบบกำหนดตายตัว
 *  4. หลังเปิดไพ่ เซิร์ฟเวอร์เฉลย serverSeed → ผู้ใช้ตรวจเองได้ว่าแฮชตรง
 *     และคำนวณซ้ำแล้วได้ไพ่ชุดเดิม แปลว่าไม่มีการเลือกไพ่ทีหลัง
 */

export interface ShuffleCommitment {
  /** เก็บฝั่งเซิร์ฟเวอร์ ห้ามส่งให้ client จนกว่าจะเปิดไพ่ครบ */
  serverSeed: string;
  /** ส่งให้ client ได้ทันที */
  commitment: string;
}

export interface DrawnCard {
  /** ลำดับที่จั่ว เริ่มที่ 0 */
  order: number;
  /** index ของไพ่ในสำรับ 0-77 */
  cardIndex: number;
  isReversed: boolean;
}

/** โอกาสที่ไพ่จะออกหัวกลับ — แม่หมอส่วนใหญ่ใช้ราว 30-50% */
const REVERSAL_RATE = 0.4;

const sha256 = (input: string) => createHash("sha256").update(input, "utf8").digest();

/** ขั้นที่ 1 — สร้าง seed และคำมั่นก่อนผู้ใช้เริ่มสับ */
export function createCommitment(): ShuffleCommitment {
  const serverSeed = randomBytes(32).toString("hex");
  return { serverSeed, commitment: sha256(serverSeed).toString("hex") };
}

/** ขั้นที่ 4 — ให้ผู้ใช้ (หรือเรา) ตรวจว่า seed ที่เฉลยตรงกับคำมั่นเดิมจริง */
export function verifyCommitment(serverSeed: string, commitment: string): boolean {
  const expected = sha256(serverSeed);
  let given: Buffer;
  try {
    given = Buffer.from(commitment, "hex");
  } catch {
    return false;
  }
  // ความยาวต่างกัน timingSafeEqual จะโยน error จึงต้องกันก่อน
  if (given.length !== expected.length) return false;
  return timingSafeEqual(expected, given);
}

/**
 * สายเลขสุ่มแบบกำหนดตายตัวจาก seed
 * ใช้ sha256(seed ‖ counter) เป็น keystream — ผลลัพธ์เดิมทุกครั้งที่ seed เดิม
 * จึงคำนวณซ้ำเพื่อตรวจสอบได้ แต่เดาไม่ได้ถ้าไม่รู้ serverSeed
 */
class SeededStream {
  private counter = 0;
  private buffer = Buffer.alloc(0);
  private offset = 0;

  constructor(private readonly seed: string) {}

  private refill() {
    this.buffer = sha256(`${this.seed}:${this.counter++}`);
    this.offset = 0;
  }

  /** ดึงเลขสุ่ม 32 บิต */
  nextUint32(): number {
    if (this.offset + 4 > this.buffer.length) this.refill();
    const value = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  /**
   * เลขจำนวนเต็มในช่วง [0, maxInclusive] แบบไม่เอนเอียง
   * ใช้ rejection sampling — ถ้าใช้ % เฉย ๆ ไพ่ใบต้น ๆ จะออกบ่อยกว่าใบท้าย
   */
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

  /** ตัวเลขทศนิยมใน [0, 1) */
  nextFloat(): number {
    return this.nextUint32() / 0x1_0000_0000;
  }
}

/**
 * จั่วไพ่แบบกำหนดตายตัว — seed เดิมให้ผลเดิมเสมอ
 * ใช้ Fisher–Yates สับทั้งสำรับก่อน แล้วค่อยหยิบตาม index ที่ผู้ใช้เลือกด้วยตัวเอง (หรือหยิบจากบนสุดหากไม่ได้ระบุ)
 * เหมือนการสับไพ่จริงมากกว่าการสุ่มทีละใบ และกันไพ่ซ้ำโดยธรรมชาติ
 */
export function drawCards(params: {
  serverSeed: string;
  clientSeed: string;
  /** จำนวนไพ่ที่ spread ต้องการ */
  count: number;
  /** ตำแหน่งไพ่ที่ผู้ใช้เลือกเองจากสำรับพัด 0-77 (ความยาวต้องเท่ากับ count) */
  pickedIndices?: number[];
  /** ขนาดสำรับ ปกติ 78 */
  deckSize?: number;
}): DrawnCard[] {
  const { serverSeed, clientSeed, count, pickedIndices, deckSize = 78 } = params;

  if (count < 1 || count > deckSize) {
    throw new Error(`จำนวนไพ่ที่จั่วต้องอยู่ระหว่าง 1 ถึง ${deckSize} (ได้รับ ${count})`);
  }

  if (pickedIndices) {
    if (pickedIndices.length !== count) {
      throw new Error(`จำนวนไพ่ที่เลือก (${pickedIndices.length}) ไม่ตรงกับที่ spread ต้องการ (${count})`);
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

  const stream = new SeededStream(sha256(`${serverSeed}|${clientSeed}`).toString("hex"));

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
 * สร้าง clientSeed จากการขยับจริงของผู้ใช้ตอนสับไพ่
 * ไม่ได้ต้องการความปลอดภัยเชิงเข้ารหัส — แค่ต้องการให้ผู้ใช้มีส่วนร่วม
 * ในการกำหนดผล เพื่อให้เซิร์ฟเวอร์ฝ่ายเดียวกำหนดผลล่วงหน้าไม่ได้
 */
export function normalizeClientSeed(raw: unknown): string {
  const text = typeof raw === "string" && raw.length > 0 ? raw : randomBytes(16).toString("hex");
  return sha256(text.slice(0, 4096)).toString("hex");
}
