import { randomBytes, createHash } from "node:crypto";
import { drawCards, verifyCommitment } from "../src/lib/tarot/shuffle.js";
import { drawCardsClient, verifyCommitmentClient, verifyReading } from "../src/lib/tarot/verify-client.js";

async function runParityTest() {
  console.log("🎲 [Parity Test] กำลังตรวจสอบความสอดคล้องระหว่าง Server Shuffle กับ Client Verifier (1,000 เคส)...");

  const SPREAD_SIZES = [1, 3, 4, 5, 7, 10, 12, 21];
  const TOTAL_CASES = 1000;
  let passed = 0;

  for (let i = 0; i < TOTAL_CASES; i++) {
    const serverSeed = randomBytes(32).toString("hex");
    const clientSeed = randomBytes(16).toString("hex");
    const count = SPREAD_SIZES[i % SPREAD_SIZES.length];

    // Case type A: without pickedIndices (first `count` cards from deck)
    // Case type B: with randomized unique pickedIndices
    const usePicked = i % 2 === 0;
    let pickedIndices: number[] | undefined;

    if (usePicked) {
      const allPool = Array.from({ length: 78 }, (_, k) => k);
      for (let k = 77; k > 0; k--) {
        const swapIdx = Math.floor(Math.random() * (k + 1));
        [allPool[k], allPool[swapIdx]] = [allPool[swapIdx], allPool[k]];
      }
      pickedIndices = allPool.slice(0, count);
    }

    const serverDrawn = drawCards({
      serverSeed,
      clientSeed,
      count,
      pickedIndices,
      deckSize: 78,
    });

    const clientDrawn = await drawCardsClient({
      serverSeed,
      clientSeed,
      count,
      pickedIndices,
      deckSize: 78,
    });

    const serverJson = JSON.stringify(serverDrawn);
    const clientJson = JSON.stringify(clientDrawn);

    if (serverJson !== clientJson) {
      console.error(`❌ Parity Mismatch ที่เคส #${i + 1}:`);
      console.error(`- Server:`, serverJson);
      console.error(`- Client:`, clientJson);
      process.exit(1);
    }

    // Verify commitment check parity
    const commitment = createHash("sha256").update(serverSeed).digest("hex");
    const serverCommOk = verifyCommitment(serverSeed, commitment);
    const clientCommOk = await verifyCommitmentClient(serverSeed, commitment);

    if (!serverCommOk || !clientCommOk) {
      console.error(`❌ Commitment Check Mismatch ที่เคส #${i + 1}`);
      process.exit(1);
    }

    // Verify negative commitment check
    const badCommitment = createHash("sha256").update(serverSeed + "tampered").digest("hex");
    const clientBadCommOk = await verifyCommitmentClient(serverSeed, badCommitment);
    if (clientBadCommOk) {
      console.error(`❌ Negative Commitment Check Failed ที่เคส #${i + 1}`);
      process.exit(1);
    }

    // Verify complete verifyReading helper
    const fullVerify = await verifyReading({
      serverSeed,
      clientSeed,
      commitment,
      drawn: serverDrawn,
      pickedIndices,
      deckSize: 78,
    });

    if (!fullVerify.commitmentOk || !fullVerify.drawMatches) {
      console.error(`❌ verifyReading Helper Failed ที่เคส #${i + 1}:`, fullVerify);
      process.exit(1);
    }

    passed++;
  }

  console.log(`✅ [Parity ผ่านสมบูรณ์แบบ] ตรวจครบ 1,000/1,000 เคส (100% Byte-Identical Matching)`);
}

runParityTest().catch((err) => {
  console.error("Parity test error:", err);
  process.exit(1);
});
