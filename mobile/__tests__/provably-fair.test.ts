/**
 * ด่าน "Provably Fair แอป = เซิร์ฟเวอร์" (แผน IOS_APP_PLAN ข้อ 8 ด่านที่ 2)
 * เทียบผลของ `lib/provably-fair.ts` (expo-crypto) กับ `src/lib/tarot/shuffle.ts` (node:crypto) ตัวจริงของเว็บ
 * ถ้าอัลกอริทึมสองฝั่งเพี้ยนกันแม้ไพ่ใบเดียว ผู้ใช้จะเห็น "ตรวจไม่ผ่าน" กับคำอ่านที่ถูกต้อง
 */
import nodeCrypto from "node:crypto";

import { createCommitment, drawCards } from "../../src/lib/tarot/shuffle";
import { drawCardsLocal, verifyCommitmentLocal, verifyReadingLocal } from "../lib/provably-fair";

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  digest: async (_algo: string, data: Uint8Array) => {
    // jest.mock ถูกยกขึ้นบนสุด จึงต้อง require ในฟังก์ชัน ไม่อ้างตัวแปรนอกขอบเขต
    const out = require("node:crypto").createHash("sha256").update(data).digest();
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
  },
}));

const CASES = [
  { count: 1, picked: undefined },
  { count: 3, picked: [5, 40, 77] },
  { count: 10, picked: undefined },
  { count: 10, picked: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { count: 78, picked: undefined },
];

describe("Provably Fair ของแอปตรงกับเซิร์ฟเวอร์", () => {
  it.each(CASES)("จั่ว $count ใบ (เลือกเอง: $picked) ได้ไพ่และการกลับหัวตรงกันทุกใบ", async ({ count, picked }) => {
    for (let round = 0; round < 25; round++) {
      const { serverSeed } = createCommitment();
      const clientSeed = nodeCrypto.randomBytes(32).toString("hex");
      const server = drawCards({ serverSeed, clientSeed, count, pickedIndices: picked, deckSize: 78 });
      const local = await drawCardsLocal({ serverSeed, clientSeed, count, pickedIndices: picked });
      expect(local).toEqual(server.map((d) => ({ order: d.order, cardIndex: d.cardIndex, isReversed: d.isReversed })));
    }
  });

  it("ตรวจคำมั่น: เมล็ดจริงผ่าน เมล็ดปลอมไม่ผ่าน", async () => {
    const { serverSeed, commitment } = createCommitment();
    expect(await verifyCommitmentLocal(serverSeed, commitment)).toBe(true);
    expect(await verifyCommitmentLocal(`${serverSeed}x`, commitment)).toBe(false);
    expect(await verifyCommitmentLocal("", commitment)).toBe(false);
  });

  it("verifyReadingLocal จับไพ่ที่ถูกสลับได้", async () => {
    const { serverSeed, commitment } = createCommitment();
    const clientSeed = "a".repeat(64);
    const drawn = await drawCardsLocal({ serverSeed, clientSeed, count: 3 });
    const ok = await verifyReadingLocal({ serverSeed, clientSeed, commitment, drawn });
    expect(ok).toEqual({ commitmentOk: true, drawMatches: true });

    const tampered = drawn.map((d, i) => (i === 0 ? { ...d, cardIndex: (d.cardIndex + 1) % 78 } : d));
    const bad = await verifyReadingLocal({ serverSeed, clientSeed, commitment, drawn: tampered });
    expect(bad.drawMatches).toBe(false);
  });
});
