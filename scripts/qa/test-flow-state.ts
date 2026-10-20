/**
 * 🧭 ด่านตัวลดสถานะการดูดวงของ TarotFlow (R-26 ขั้นที่ 2)
 * ===========================================================================
 *
 * ครอบสามก้อนที่ยุบใหม่ในรอบนี้:
 *   - `flow-deck.ts`    สำรับไพ่ (กฎเหล็กข้อ 4 · ข้อ 14)
 *   - `flow-session.ts` เซสชัน provably-fair (โทเคน · เมล็ด · หลักฐาน)
 *   - `flow-reading.ts` คำอ่านที่ไหลเข้ามา (สตรีม · ข้อความผิดพลาด)
 *
 * ⚠️ ด่านนี้ **ยิงลำดับการกระทำจริงใส่ตัวลด** ไม่ได้ค้นข้อความในซอร์ส
 * เพราะสิ่งที่ต้องพิสูจน์คือพฤติกรรม ไม่ใช่หน้าตาของโค้ด
 * (บทเรียนเดียวกับ `test-flow-overlay.ts` — ด่านที่ค้นข้อความผ่านได้ทั้งที่ของจริงพัง)
 */

import fs from "node:fs";
import path from "node:path";
import { deckReducer, DECK_INITIAL, type DeckState, type DeckAction } from "../../src/components/home/flow-deck";
import {
  sessionReducer,
  SESSION_INITIAL,
  type SessionState,
  type SessionAction,
} from "../../src/components/home/flow-session";
import {
  readingReducer,
  READING_INITIAL,
  type ReadingState,
  type ReadingAction,
} from "../../src/components/home/flow-reading";
import type { DrawnSlotCard } from "../../src/components/spread/SpreadBoard";
import type { RitualStep } from "../../src/components/home/ritual-step";
import {
  decideSpreadAccess,
  decideStartSessionAccess,
  hasPremiumTrialOf,
  isPassHolderOf,
} from "../../src/components/home/flow-access";
import { resolveEntryIntent, isCrossLanguageFlow, needsFinalizeOnResume } from "../../src/components/home/flow-entry";
import { authDetourMatches } from "../../src/lib/utils/flow-persistence";
import { createRunGuard } from "../../src/components/home/flow-run-guard";
import { friendlyError, NETWORK_ERROR_EN, NETWORK_ERROR_TH } from "../../src/lib/reading/friendly-error";
import { orientedMeaning, orientedTone } from "../../src/lib/reading/orientation";
import { START_SITUATION_MAX, CLARIFY_ANSWER_MAX } from "../../src/lib/reading/start-limits";
import { yesNoWeight } from "../../src/data/cards/yes-no";
import { loadMyAndMigrate } from "../../src/components/spread/custom/load-mine";
import { wantsBackEntry } from "../../src/components/home/use-flow-back";
import { PUBLIC_SPREADS } from "../../src/data/spreads";
import { readSpreadMetadata } from "../../src/app/_shared/pages/read-spread";
import { assertNonEmptyCorpus } from "./lib/corpus";
import type { ClientEntitlement } from "../../src/lib/entitlement/use-entitlement";

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}${detail ? `\n      ${detail}` : ""}`);
  }
}

/** ไพ่ปลอมสำหรับทดสอบ — มีแค่ฟิลด์ที่ตัวลดสนใจ (`order`) */
const card = (order: number, cardIndex = order + 10): DrawnSlotCard =>
  ({ order, cardIndex, isReversed: false, position: { index: order } }) as unknown as DrawnSlotCard;

const playDeck = (...actions: DeckAction[]): DeckState => actions.reduce(deckReducer, DECK_INITIAL);
const playSession = (...actions: SessionAction[]): SessionState =>
  actions.reduce(sessionReducer, SESSION_INITIAL);
const playReading = (...actions: ReadingAction[]): ReadingState =>
  actions.reduce(readingReducer, READING_INITIAL);

const THREE = [card(0), card(1), card(2)];

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n🃏 [QA] สำรับไพ่ (flow-deck.ts)\n");
// ─────────────────────────────────────────────────────────────────────────────

console.log("── 1. จับไพ่จากพัด ──");
check(
  "จับได้ตามลำดับที่แตะ",
  JSON.stringify(
    playDeck(
      { type: "pick", fanIndex: 7, capacity: 3 },
      { type: "pick", fanIndex: 2, capacity: 3 },
    ).picked,
  ) === "[7,2]",
);
check(
  "แตะใบเดิมซ้ำไม่นับเพิ่ม",
  playDeck({ type: "pick", fanIndex: 7, capacity: 3 }, { type: "pick", fanIndex: 7, capacity: 3 }).picked
    .length === 1,
);
check(
  "แตะเกินจำนวนที่ผังต้องการไม่ได้",
  playDeck(
    { type: "pick", fanIndex: 1, capacity: 2 },
    { type: "pick", fanIndex: 2, capacity: 2 },
    { type: "pick", fanIndex: 3, capacity: 2 },
  ).picked.length === 2,
);
check(
  "ถอยกลับหนึ่งใบตอนส่งให้เซิร์ฟเวอร์แล้วล้มเหลว",
  JSON.stringify(
    playDeck(
      { type: "pick", fanIndex: 1, capacity: 3 },
      { type: "pick", fanIndex: 5, capacity: 3 },
      { type: "undoLastPick" },
    ).picked,
  ) === "[1]",
);

console.log("\n── 2. กฎเหล็กข้อ 4 — ไพ่ชุดใหม่ต้องคว่ำหน้าเสมอ ──");
const dealtAfterReveal = playDeck(
  { type: "deal", cards: THREE },
  { type: "toggleReveal", order: 1 },
  { type: "deal", cards: [card(0), card(1)] }, // จั่วรอบใหม่ทับ
);
check(
  "จั่วชุดใหม่แล้วไพ่ที่เคยหงายกลับมาคว่ำทั้งหมด",
  dealtAfterReveal.revealed.length === 0 && dealtAfterReveal.activeOrder === 0,
  `ได้ revealed=${JSON.stringify(dealtAfterReveal.revealed)} activeOrder=${dealtAfterReveal.activeOrder}`,
);

console.log("\n── 3. กฎเหล็กข้อ 14 — แตะไพ่ที่ไม่มีอยู่จริงไม่ได้ ──");
check(
  "พลิก order ที่ไม่มีในสำรับ = ไม่มีผล (ไม่กุไพ่ขึ้นมาให้)",
  playDeck({ type: "deal", cards: THREE }, { type: "toggleReveal", order: 9 }).revealed.length === 0,
);
check(
  "เพ่ง order ที่ไม่มีในสำรับ = ไม่ขยับสายตา",
  playDeck({ type: "deal", cards: THREE }, { type: "focus", order: 9 }).activeOrder === 0,
);
const restored = playDeck({
  type: "restore",
  picked: [3],
  cards: THREE,
  revealed: [0, 99], // 99 = ของเสียจาก sessionStorage ที่ถูกแก้มา
  activeOrder: 42,
});
check(
  "กู้คืนจากที่เก็บชั่วคราวแล้วกรองไพ่ผีทิ้ง",
  JSON.stringify(restored.revealed) === "[0]" && restored.activeOrder === 0,
  `ได้ revealed=${JSON.stringify(restored.revealed)} activeOrder=${restored.activeOrder}`,
);

console.log("\n── 4. พลิก/เปิดทั้งหมด/ล้าง ──");
const flipped = playDeck({ type: "deal", cards: THREE }, { type: "toggleReveal", order: 2 });
check("พลิกแล้วสายตาเลื่อนไปที่ใบนั้นด้วย", flipped.revealed[0] === 2 && flipped.activeOrder === 2);
check(
  "พลิกซ้ำ = คว่ำกลับ",
  playDeck({ type: "deal", cards: THREE }, { type: "toggleReveal", order: 2 }, { type: "toggleReveal", order: 2 })
    .revealed.length === 0,
);
check(
  "เปิดทั้งหมดได้ครบทุกใบในสำรับ",
  JSON.stringify(playDeck({ type: "deal", cards: THREE }, { type: "revealAll" }).revealed) === "[0,1,2]",
);
const cleared = playDeck(
  { type: "deal", cards: THREE },
  { type: "pick", fanIndex: 4, capacity: 3 },
  { type: "clearDraw" },
);
check(
  "ย้อนกลับไปขั้นสับไพ่ = ทิ้งทั้งไพ่ที่จับและไพ่ที่จั่ว",
  cleared.picked.length === 0 && cleared.cards.length === 0 && cleared.revealed.length === 0,
);
check(
  "เริ่มรอบใหม่ = ว่างเปล่าเหมือนเพิ่งเปิดหน้า",
  JSON.stringify(playDeck({ type: "deal", cards: THREE }, { type: "reset" })) ===
    JSON.stringify(DECK_INITIAL),
);

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n🔐 [QA] เซสชัน Provably-Fair (flow-session.ts)\n");
// ─────────────────────────────────────────────────────────────────────────────

console.log("── 5. เมล็ดฝั่งผู้ใช้ต้องไม่หายและไม่ถูกทับด้วยค่าว่าง ──");
check(
  "สุ่มเมล็ดก่อนเริ่มเซสชันแล้วค่าติดอยู่",
  playSession({ type: "seed", clientSeed: "abc123" }).clientSeed === "abc123",
);
check(
  "เมล็ดว่างไม่ทับเมล็ดจริง (ห้ามปล่อยให้เซิร์ฟเวอร์สุ่มแทน)",
  playSession({ type: "seed", clientSeed: "abc123" }, { type: "seed", clientSeed: "" }).clientSeed === "abc123",
);
check(
  "เซิร์ฟเวอร์ไม่คืนเมล็ดกลับมา = ใช้เมล็ดที่เราสุ่มไว้ก่อนยิง",
  playSession({ type: "seed", clientSeed: "abc123" }, { type: "started", readingId: "r1" }).clientSeed ===
    "abc123",
);

console.log("\n── 6. โทเคนเซสชันหมุนใหม่ได้ แต่ถูกลบด้วยค่าว่างไม่ได้ ──");
const rotated = playSession(
  { type: "started", readingId: "r1", token: "t1" },
  { type: "rotateToken", token: "t2" },
);
check("โทเคนใหม่ทับของเดิมได้", rotated.token === "t2");
check(
  "โทเคนว่าง/หายไปไม่ลบของเดิม (บั๊กที่เคยต้องจำเขียน `if (data.sessionToken)` ทุกจุด)",
  playSession(
    { type: "started", readingId: "r1", token: "t1" },
    { type: "rotateToken", token: "" },
    { type: "rotateToken", token: null },
    { type: "rotateToken" },
  ).token === "t1",
);

console.log("\n── 7. หลักฐานความโปร่งใสผูกกับเซสชันที่ยังมีชีวิตเท่านั้น ──");
const proofOk = playSession(
  { type: "started", readingId: "r1", token: "t1" },
  { type: "proven", proof: { serverSeed: "s", commitment: "c" } },
);
check("อ่านจบแล้วรับหลักฐานได้", proofOk.proof.serverSeed === "s");
const proofLate = playSession(
  { type: "started", readingId: "r1", token: "t1" },
  { type: "reset" }, // ผู้ใช้กด "เริ่มดูดวงใหม่"
  { type: "proven", proof: { serverSeed: "ของรอบเก่า" } }, // เฟรม done ที่มาถึงทีหลัง
);
check(
  "หลักฐานของรอบที่ทิ้งไปแล้วไหลเข้ารอบใหม่ไม่ได้",
  proofLate.proof.serverSeed === undefined,
  `ได้ ${JSON.stringify(proofLate.proof)}`,
);
check(
  "เริ่มเซสชันใหม่ = หลักฐานของรอบก่อนถูกล้าง",
  Object.keys(
    playSession(
      { type: "started", readingId: "r1" },
      { type: "proven", proof: { serverSeed: "s" } },
      { type: "started", readingId: "r2" },
    ).proof,
  ).length === 0,
);
check(
  "เริ่มรอบใหม่ = ล้างครบทั้งห้าค่าในคำสั่งเดียว",
  JSON.stringify(
    playSession(
      { type: "started", readingId: "r1", token: "t1", commitment: "c", clientSeed: "s" },
      { type: "reset" },
    ),
  ) === JSON.stringify(SESSION_INITIAL),
);

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n📜 [QA] คำอ่านที่ไหลเข้ามา (flow-reading.ts)\n");
// ─────────────────────────────────────────────────────────────────────────────

console.log("── 8. สถานะที่ขัดแย้งกันในตัวเองต้องเขียนออกมาไม่ได้ ──");
const streamingAfterError = playReading(
  { type: "fail", message: "พัง" },
  { type: "start" },
);
check(
  "เริ่มสตรีมใหม่ = ข้อความผิดพลาดเก่าหายไปเสมอ (กำลังสตรีม ⇒ ไม่มี error)",
  streamingAfterError.status === "streaming" && streamingAfterError.error === null,
);
const failedMidStream = playReading(
  { type: "start" },
  { type: "opening", text: "สวัสดีค่ะ" },
  { type: "fail", message: "สัญญาณสะดุด" },
);
check(
  "สตรีมสะดุด = หยุดสตรีม แต่ยังเก็บย่อหน้าที่มาถึงแล้วไว้ให้ผู้ใช้อ่าน",
  failedMidStream.status === "idle" &&
    failedMidStream.error === "สัญญาณสะดุด" &&
    failedMidStream.reading?.opening === "สวัสดีค่ะ",
);

console.log("\n── 9. เฟรมที่มาช้าเขียนทับคำอ่านไม่ได้ ──");
const lateFrames = playReading(
  { type: "start" },
  { type: "summary", text: "บทสรุปของรอบเก่า" },
  { type: "reset" }, // ผู้ใช้กด "เริ่มดูดวงใหม่"
  { type: "opening", text: "เศษของรอบเก่า" },
  { type: "summary", text: "บทสรุปที่ไม่ควรโผล่" },
  { type: "done", reading: { summary: "ของรอบเก่า" } },
);
check(
  "เฟรม opening/summary/done ที่มาถึงหลังเริ่มรอบใหม่ถูกทิ้งทั้งหมด",
  lateFrames.status === "idle" && lateFrames.reading === null,
  `ได้ ${JSON.stringify(lateFrames)}`,
);

console.log("\n── 10. คำอ่านรายใบต้องไม่ซ้ำตำแหน่งและเรียงเสมอ ──");
const cards = playReading(
  { type: "start" },
  { type: "card", card: { position: 2, reading: "ใบที่สาม" } as never },
  { type: "card", card: { position: 0, reading: "ใบแรก" } as never },
  { type: "card", card: { position: 2, reading: "ใบที่สาม (แก้ไข)" } as never },
).reading?.cards;
check(
  "ตำแหน่งซ้ำถูกแทนที่ ไม่ใช่ต่อท้าย",
  cards?.length === 2,
  `ได้ ${JSON.stringify(cards)}`,
);
check("เรียงตามตำแหน่งจากน้อยไปมาก", cards?.[0]?.position === 0 && cards?.[1]?.position === 2);
check(
  "ใบที่มาทีหลังของตำแหน่งเดิมคือใบที่ผู้ใช้เห็น",
  (cards?.[1] as { reading?: string })?.reading === "ใบที่สาม (แก้ไข)",
);

console.log("\n── 11. จบสตรีม · หยุดแบบไม่มีข้อความ · กู้คืน ──");
check(
  "เฟรม done = ได้คำอ่านครบและไม่มีข้อความผิดพลาดค้าง",
  (() => {
    const s = playReading({ type: "start" }, { type: "done", reading: { summary: "จบแล้ว" } });
    return s.status === "done" && s.reading?.summary === "จบแล้ว" && s.error === null;
  })(),
);
check(
  "ถูกกำแพงสิทธิ์กั้น = หยุดสตรีมเงียบ ๆ ไม่ขึ้นแถบแดงซ้อนหน้าต่างสิทธิ์",
  (() => {
    const s = playReading({ type: "start" }, { type: "stop" });
    return s.status === "idle" && s.error === null;
  })(),
);
check(
  "กู้คืนคำอ่านที่อ่านจบไปแล้วจาก sessionStorage",
  playReading({ type: "restore", reading: { summary: "ของเดิม" } }).status === "done",
);
check(
  "กู้คืนตอนไม่มีคำอ่านค้าง = ว่างเปล่า",
  playReading({ type: "restore", reading: null }).status === "idle",
);
check(
  "เฟรม reset ระหว่างสตรีม = ล้างเฉพาะคำอ่าน ยังสตรีมต่อ",
  (() => {
    const s = playReading({ type: "start" }, { type: "summary", text: "x" }, { type: "clearPartial" });
    return s.status === "streaming" && JSON.stringify(s.reading) === "{}";
  })(),
);

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n── 12. TarotFlow.tsx ต้องใช้ตัวลดกลางจริง ไม่ได้แอบเก็บสถานะคู่ขนาน ──");
// ─────────────────────────────────────────────────────────────────────────────
const FLOW = path.join(process.cwd(), "src/components/home/TarotFlow.tsx");
if (!fs.existsSync(FLOW)) {
  check("หาไฟล์ TarotFlow.tsx เจอ", false, "ไฟล์ถูกย้าย/เปลี่ยนชื่อ — ด่านนี้ตรวจอะไรไม่ได้");
} else {
  const flowSrc = fs.readFileSync(FLOW, "utf-8");
  for (const reducer of ["deckReducer", "sessionReducer", "readingReducer"]) {
    check(`เรียกใช้ ${reducer}`, flowSrc.includes(reducer));
  }
  /**
   * ตัวตั้งค่าของเดิมต้องไม่กลับมา — ถ้ามีใครเพิ่ม `useState` คู่ขนานกับตัวลด
   * สถานะจะแตกเป็นสองแหล่งความจริงอีกครั้ง ซึ่งคือปัญหาที่รอบนี้แก้ไปพอดี
   */
  const forbidden = [
    "setDrawnCards",
    "setRevealedOrders",
    "setActiveCardIndex",
    "setPickedIndices",
    "setReadingId",
    "setSessionToken",
    "setClientSeed",
    "setProof",
    "setIsStreaming",
    "setReadingResult",
    "setErrorMsg",
  ].filter((name) => new RegExp(`\\b${name}\\s*\\(`).test(flowSrc));
  check(
    "ไม่มีตัวตั้งค่าแบบเดิมหลงเหลือ",
    forbidden.length === 0,
    `พบ: ${forbidden.join(", ")}\n      ➔ ใช้ dispatchDeck / dispatchSession / dispatchRead แทน`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n── 13. ด่านสิทธิ์ก่อนเริ่มพิธี (flow-access.ts) ──");
// ─────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ ยิงเคสจริงใส่ฟังก์ชัน ไม่ได้ค้นข้อความในซอร์ส
 *
 * ทางเข้าสู่ขั้นตั้งจิตมีสามทาง (ปุ่มหน้าแรก · ลิงก์ `/?spread=` · ตอนยิงเซสชันจริง)
 * ทั้งสามต้องตัดสินด้วยตรรกะก้อนเดียวกัน ไม่งั้นผังใหญ่หลุดฟรีทางใดทางหนึ่งได้
 */
const ent = (over: Partial<ClientEntitlement> = {}): ClientEntitlement => ({
  enabled: true,
  canStartReading: true,
  canChat: true,
  remaining: 1,
  limit: 1,
  weeklyRemaining: null,
  bonusRemaining: 0,
  resetAt: null,
  kind: "member",
  ...over,
});

const MEMBER = ent();
const MEMBER_OUT = ent({ remaining: 0, canStartReading: false });
const GUEST = ent({ kind: "guest", remaining: 0, limit: 0, canStartReading: false });
const PAID = ent({ hasPaidCredits: true });
const UNLIMITED = ent({ role: "unlimited" });
const SYSTEM_OFF = ent({ enabled: false });

/** `celtic-cross` = ผังใหญ่ (ไม่อยู่ใน STANDARD_SPREAD_IDS) · `daily` = ผังมาตรฐาน */
check("สมาชิกที่ยังมีสิทธิ์ ➔ เข้าผังมาตรฐานได้", decideSpreadAccess(MEMBER, "daily").allowed === true);
check(
  "สมาชิกที่ยังมีสิทธิ์แต่ไม่ได้จ่ายเงิน ➔ ผังใหญ่ติดกำแพง `grand_spread`",
  (() => {
    const d = decideSpreadAccess(MEMBER, "celtic-cross");
    return !d.allowed && d.reason === "grand_spread";
  })(),
);
check(
  "โควตาหมด ➔ ติดกำแพงตั้งแต่ชั้นแรก ไม่ใช่ชั้นผังใหญ่",
  (() => {
    const d = decideSpreadAccess(MEMBER_OUT, "celtic-cross");
    return !d.allowed && d.reason !== "grand_spread";
  })(),
);
check("ผู้ชมที่ยังไม่ล็อกอินและไม่มีสิทธิ์ฟรี ➔ ติดกำแพง", decideSpreadAccess(GUEST, "daily").allowed === false);
check("คนที่ซื้อเครดิตแล้ว ➔ เปิดผังใหญ่ได้", decideSpreadAccess(PAID, "celtic-cross").allowed === true);
check("บัญชีไม่จำกัดสิทธิ์ ➔ เปิดผังใหญ่ได้", decideSpreadAccess(UNLIMITED, "celtic-cross").allowed === true);
check(
  "แอดมินปิดระบบสิทธิ์ทั้งเว็บ ➔ ไม่มีกำแพงให้ใครเลย แม้แต่ผังใหญ่",
  decideSpreadAccess(SYSTEM_OFF, "celtic-cross").allowed === true && isPassHolderOf(SYSTEM_OFF),
);
check(
  "ยังไม่รู้สิทธิ์ (null) ➔ ผังมาตรฐานผ่าน แต่ผังใหญ่ยังกั้นไว้ก่อน",
  decideSpreadAccess(null, "daily").allowed === true && decideSpreadAccess(null, "celtic-cross").allowed === false,
);
check(
  "ชั้นที่ 3: แม่หมอปรมาจารย์สงวนไว้ให้ผู้ถือสิทธิ์เต็มเท่านั้น",
  (() => {
    const blocked = decideStartSessionAccess(MEMBER, "daily", "master");
    return !blocked.allowed && blocked.reason === "master_persona" && decideStartSessionAccess(PAID, "daily", "master").allowed === true;
  })(),
);
check(
  "ชั้นผังใหญ่มาก่อนชั้นแม่หมอเสมอ (ผู้ใช้เห็นกำแพงเดียว ไม่สลับไปมา)",
  (() => {
    const d = decideStartSessionAccess(MEMBER, "celtic-cross", "master");
    return !d.allowed && d.reason === "grand_spread";
  })(),
);

// ✦ สิทธิ์ลองผังใหญ่ / แม่หมอพิเศษฟรี 1 ครั้ง — เซิร์ฟเวอร์ตัดสินซ้ำที่ /start เสมอ
const TRIAL = ent({ premiumTrialAvailable: true });
const TRIAL_OUT = ent({ premiumTrialAvailable: true, remaining: 0, canStartReading: false, reason: "daily_exhausted" });
check("มีสิทธิ์ลอง ➔ ผังใหญ่ผ่าน", decideSpreadAccess(TRIAL, "celtic-cross").allowed === true);
check("มีสิทธิ์ลอง ➔ แม่หมอปรมาจารย์ผ่าน", decideStartSessionAccess(TRIAL, "daily", "master").allowed === true);
check("มีสิทธิ์ลอง + โควตาวันนี้หมด ➔ ผังใหญ่ยังผ่าน (สิทธิ์ลองไม่หักโควตา)", decideSpreadAccess(TRIAL_OUT, "celtic-cross").allowed === true);
check(
  "มีสิทธิ์ลอง + โควตาหมด ➔ ผังมาตรฐานยังติดกำแพง (สิทธิ์ลองใช้กับผังใหญ่เท่านั้น)",
  decideSpreadAccess(TRIAL_OUT, "daily").allowed === false,
);
check(
  "ผู้ไม่ล็อกอิน / ผู้ถือสิทธิ์เต็ม ➔ ไม่นับว่ามีสิทธิ์ลอง",
  !hasPremiumTrialOf(ent({ kind: "guest", premiumTrialAvailable: true })) && !hasPremiumTrialOf(ent({ hasPaidCredits: true, premiumTrialAvailable: true })),
);

// ✦ ปุ่มย้อนกลับของเบราว์เซอร์ — กันชนมีเฉพาะขั้นที่ย้อนได้โดยไม่เสียอะไร (ยังไม่เปิดไพ่)
check("หน้าแรก: ขั้นตั้งคำถามกดย้อนกลับไปเลือกผังได้", wantsBackEntry("INTENTION_SELECT", true));
check("หน้า /read/<ผัง>: ขั้นตั้งคำถามคือขั้นแรก ย้อนกลับ = ออกจากหน้าตามปกติ", !wantsBackEntry("INTENTION_SELECT", false));
check("ขั้นสับไพ่ / เลือกไพ่ ย้อนได้ทั้งสองหน้า", ["SHUFFLE", "PICK_CARDS"].every((s) => wantsBackEntry(s as RitualStep, true) && wantsBackEntry(s as RitualStep, false)));
check(
  "เลือกผัง / อ่านคำทำนาย / สรุป ห้ามมีกันชน (เปิดไพ่แล้วย้อนไม่ได้)",
  (["SPREAD_SELECT", "READING", "SUMMARY"] as RitualStep[]).every((s) => !wantsBackEntry(s, true)),
);

// ทางเข้าทั้งสามใน TarotFlow ต้องเรียกตรรกะก้อนนี้ ห้ามคัดลอกเงื่อนไขไปเขียนเองอีก
if (!fs.existsSync(FLOW)) {
  check("หาไฟล์ TarotFlow.tsx เจอ (ตรวจทางเข้าสู่ขั้นตั้งจิต)", false, "ไฟล์ถูกย้าย/เปลี่ยนชื่อ — ด่านนี้ตรวจอะไรไม่ได้");
} else {
  const flowSrc = fs.readFileSync(FLOW, "utf-8");
  check("TarotFlow ใช้ `decideSpreadAccess` (ปุ่มหน้าแรก + หน้า `/read/<ผัง>`)", flowSrc.includes("decideSpreadAccess("));
  check("TarotFlow ใช้ `decideStartSessionAccess` ตอนยิงเซสชันจริง", flowSrc.includes("decideStartSessionAccess("));
  /**
   * หน้า `/read/<ผัง>` ต้องเปิดมาที่ขั้นตั้งคำถาม **ตั้งแต่ค่าเริ่มต้นของ state** (HTML ที่บิลด์ไว้)
   * ไม่ใช่เลื่อนขั้นใน effect — ไม่งั้นผู้ใช้เห็นหน้าแรกแวบหนึ่งก่อน = อาการ "เด้งกลับหน้าแรก" เดิม
   * และต้องตรวจสิทธิ์ทันทีที่เปิด ไม่ใช่ปล่อยให้พิมพ์คำถามจนเสร็จแล้วค่อยเจอกำแพง
   */
  check(
    "หน้า `/read/<ผัง>` เริ่มที่ขั้นตั้งคำถามตั้งแต่ค่าเริ่มต้นของ state",
    /useState<RitualStep>\(routeSpread \? "INTENTION_SELECT" : "SPREAD_SELECT"\)/.test(flowSrc) &&
      /useState<Spread>\(routeSpread \?\?/.test(flowSrc),
  );
  check("หน้า `/read/<ผัง>` ตรวจสิทธิ์ทันทีที่เปิด", /void checkRouteAccess\(routeSpread,/.test(flowSrc));
  /**
   * หน้า `/read/<ผัง>` ไม่มีขั้นเลือกผัง — "เปลี่ยนผัง"/"เริ่มดูดวงใหม่" ต้องออกไปหน้าแรก
   * และต้องกั้นตัวบันทึกไว้ ไม่งั้น `pagehide` เขียนรอบที่เพิ่งล้างคืน หน้าแรกกู้กลับมาเป็นผังเดิม
   */
  check(
    "หน้า `/read/<ผัง>` ไปขั้นเลือกผัง = ออกไปหน้าแรก พร้อมกั้นตัวบันทึก",
    /next === "SPREAD_SELECT" && routeSpread/.test(flowSrc) &&
      /leavingRef\.current = true/.test(flowSrc) &&
      (flowSrc.match(/!leavingRef\.current/g) ?? []).length >= 3,
    "ตัวบันทึกทั้งสามจุด (หน่วง 400 ms · cleanup · pagehide) ต้องเช็ก leavingRef",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n── 14. เปิดพิธีดูดวงครั้งนี้เพราะอะไร (flow-entry.ts) ──");
// ─────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ ยิงเคสจริงใส่ฟังก์ชัน ไม่ได้ค้นข้อความในซอร์ส
 *
 * ลำดับที่ต้องไม่สลับ: หน้า `/read/<ผัง>` ที่ผู้ใช้เพิ่งกดเข้ามา ชนะรอบที่ค้างอยู่ในแท็บเสมอ
 * ของเดิมสลับลำดับกัน คนที่เพิ่งเปิดไพ่ในแท็บนี้จึงกดผังใหม่ไม่ติดเลยสักครั้ง (รอบ 132)
 * ยกเว้น "รีเฟรช/ย้อนกลับมา" หน้าเดิมผังเดิม = กู้คืน ไม่งั้นรีเฟรชกลางพิธีล้างไพ่ทิ้ง
 */
const known = (id: string) => ["daily", "celtic-cross", "three-card"].includes(id);
const intent = (
  routeSpread: string | null,
  savedStep: RitualStep | null,
  opts: { returning?: boolean; savedSpread?: string | null } = {},
) => resolveEntryIntent({ routeSpread, isKnownSpread: known, savedStep, ...opts });

check("เปิดหน้า `/read/<ผัง>` ทั้งที่ยังไม่มีอะไรค้าง ➔ เริ่มผังนั้น", intent("celtic-cross", null).kind === "deepLink");
for (const step of ["INTENTION_SELECT", "SHUFFLE", "PICK_CARDS", "READING", "SUMMARY"] as RitualStep[]) {
  const got = intent("celtic-cross", step, { savedSpread: "daily" });
  check(
    `กดเข้าผังใหม่ ขณะค้างอยู่ขั้น ${step} ของอีกผัง ➔ ผังที่กดต้องชนะ (ไม่ใช่ลากกลับรอบเก่า)`,
    got.kind === "deepLink" && got.spreadId === "celtic-cross",
  );
}
check(
  "กดลิงก์เข้าผังเดิมใหม่อีกครั้ง (ไม่ใช่รีเฟรช) ➔ เริ่มรอบใหม่ ไม่ลากกลับหน้าสรุปรอบเก่า",
  intent("celtic-cross", "SUMMARY", { savedSpread: "celtic-cross" }).kind === "deepLink",
);
for (const step of ["INTENTION_SELECT", "SHUFFLE", "PICK_CARDS", "READING", "SUMMARY"] as RitualStep[]) {
  check(
    `รีเฟรช/ย้อนกลับมาหน้าเดิมขณะอยู่ขั้น ${step} ➔ กู้คืนรอบเดิม (ไม่ล้างไพ่ที่เปิดอยู่)`,
    intent("celtic-cross", step, { returning: true, savedSpread: "celtic-cross" }).kind === "resume",
  );
}
check(
  "ย้อนกลับมาหน้าผังหนึ่ง แต่รอบที่ค้างเป็นอีกผัง ➔ เริ่มผังของหน้านี้",
  intent("celtic-cross", "READING", { returning: true, savedSpread: "daily" }).kind === "deepLink",
);
check("หน้าแรก: มีรอบค้างอยู่ ➔ กู้คืนรอบเดิม", intent(null, "READING").kind === "resume");
check("หน้าแรก: ค้างที่ขั้นเลือกผัง ➔ ถือว่าไม่มีอะไรค้าง", intent(null, "SPREAD_SELECT").kind === "fresh");
check("หน้าแรก: ไม่มีอะไรค้าง ➔ หน้าเปล่า", intent(null, null).kind === "fresh");
check(
  "ผังที่ไม่มีอยู่จริง ➔ ไม่ใช่คำสั่ง ห้ามทับรอบที่ค้างอยู่",
  intent("ผังมั่ว", "READING").kind === "resume" && intent("ผังมั่ว", null).kind === "fresh",
);

if (!fs.existsSync(FLOW)) {
  check("หาไฟล์ TarotFlow.tsx เจอ (ตรวจการตัดสินทางเข้า)", false, "ไฟล์ถูกย้าย/เปลี่ยนชื่อ");
} else {
  const flowSrc = fs.readFileSync(FLOW, "utf-8");
  check("TarotFlow ตัดสินทางเข้าด้วย `resolveEntryIntent`", flowSrc.includes("resolveEntryIntent("));
  check(
    "TarotFlow แยก \"รีเฟรช/ย้อนกลับ\" ออกจาก \"กดเข้ามาใหม่\" (กันรีเฟรชกลางพิธีแล้วล้างไพ่ทิ้ง)",
    /returning:\s*isReturnVisit\(\)/.test(flowSrc) && /"reload"/.test(flowSrc) && /"back_forward"/.test(flowSrc),
  );
  /*
   * เจ้าของแจ้ง 2026-10-18: พิมพ์คำถาม ➔ เด้งหน้าลงชื่อ ➔ ลงชื่อเสร็จ คำถามหาย
   * ทุกทางลงชื่อโหลดหน้า `/read/<ผัง>` ใหม่แบบ navigate (ไม่ใช่ reload) จึงต้องมีเครื่องหมาย "ออกไปลงชื่อ"
   */
  check(
    "เปิดหน้าลงชื่อจากหน้าผัง ➔ จดว่าออกไปลงชื่อ (กลับมาแล้วคำถามต้องไม่หาย)",
    /markAuthDetour\(routeSpread\.id\)/.test(flowSrc),
  );
  check(
    "กลับมาจากหน้าลงชื่อ ➔ นับเป็น \"กลับมาหน้าเดิม\" (ใช้ `takeAuthDetour`)",
    /returning:\s*isReturnVisit\(\)\s*\|\|\s*\(routeSpread \? takeAuthDetour\(routeSpread\.id\)/.test(flowSrc),
  );
}

{
  const now = 1_800_000_000_000;
  const mark = (spreadId: string, at: number) => JSON.stringify({ spreadId, at });
  check("ลงชื่อแล้วกลับมาผังเดิมภายใน 30 นาที ➔ กู้คืน", authDetourMatches(mark("celtic-cross", now - 60_000), "celtic-cross", now));
  check("กลับมาคนละผัง ➔ ไม่นับ (ผังที่กดต้องชนะ)", !authDetourMatches(mark("daily", now - 60_000), "celtic-cross", now));
  check("เครื่องหมายเก่าเกิน 30 นาที ➔ ไม่นับ", !authDetourMatches(mark("celtic-cross", now - 31 * 60_000), "celtic-cross", now));
  check("ไม่มีเครื่องหมาย / ค่าพัง ➔ ไม่นับ", !authDetourMatches(null, "celtic-cross", now) && !authDetourMatches("{พัง", "celtic-cross", now));
  check(
    "กลับมาจากหน้าลงชื่อ + รอบค้างผังเดียวกันที่ขั้นตั้งคำถาม ➔ กู้คืนคำถาม",
    intent("celtic-cross", "INTENTION_SELECT", { returning: true, savedSpread: "celtic-cross" }).kind === "resume",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n── 15. ปุ่ม \"เริ่มดูดวงด้วยผังนี้\" ทุกปุ่มชี้หน้า `/read/<ผัง>` ──");
// ─────────────────────────────────────────────────────────────────────────────
/**
 * อาการที่เจ้าของเจอ 2026-09-23: กดปุ่มที่หน้าผังแล้ว "เด้งกลับหน้าแรก" ทุกครั้ง
 * เพราะทุกปุ่มชี้ `/?spread=<id>` = โหลดหน้าแรกทั้งหน้าก่อนแล้วค่อยกระโดดข้ามขั้น
 * ปุ่มใหม่ที่ใครเพิ่มทีหลังแล้วลอกลิงก์แบบเก่ามาใช้ = อาการเดิมกลับมาทันที
 */
{
  const ROOT = process.cwd();
  const offenders: string[] = [];
  const scanned: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|astro)$/.test(entry.name)) {
        scanned.push(full);
        const src = fs.readFileSync(full, "utf-8");
        // ลิงก์ (ไม่ใช่คอมเมนต์) ที่ชี้หน้าแรกพร้อม ?spread=
        if (/(href=|["'`])\/(en)?\?spread=/.test(src.replace(/^\s*(\*|\/\/).*$/gm, ""))) {
          offenders.push(path.relative(ROOT, full));
        }
      }
    }
  };
  for (const dir of ["src", "astro"]) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) {
      check(`หาโฟลเดอร์ ${dir}/ เจอ (สแกนลิงก์ \`?spread=\`)`, false, "โฟลเดอร์ถูกย้าย — ด่านนี้ตรวจอะไรไม่ได้");
      continue;
    }
    walk(abs);
  }
  assertNonEmptyCorpus("ไฟล์ .ts/.tsx/.astro ที่สแกนหาลิงก์ `?spread=`", scanned);
  check(
    "ไม่มีลิงก์ `/?spread=` เหลือในโค้ด (ต้องชี้ `/read/<ผัง>`)",
    offenders.length === 0,
    offenders.length ? `พบใน ${offenders.join(", ")}` : undefined,
  );

  // หน้า `/read/<ผัง>` มีเฉพาะผังสาธารณะ — ปลายทางที่ไม่มีหน้า = 404 ทันทีที่กด
  const publicIds = new Set(PUBLIC_SPREADS.map((s) => s.id));
  const targets = new Set<string>();
  const collectTargets = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collectTargets(full);
      else if (/\.(tsx?)$/.test(entry.name)) {
        const src = fs.readFileSync(full, "utf-8");
        for (const m of src.matchAll(/["'`]\/read\/([a-z0-9-]+)["'`]/g)) targets.add(m[1]);
        for (const m of src.matchAll(/targetSpreadId:\s*"([a-z0-9-]+)"/g)) targets.add(m[1]);
      }
    }
  };
  collectTargets(path.join(ROOT, "src"));
  const missing = [...targets].filter((id) => !publicIds.has(id));
  check(
    `ปลายทาง \`/read/<ผัง>\` ทุกตัวในโค้ด (${targets.size} ผัง) มีหน้าจริง`,
    targets.size > 0 && missing.length === 0,
    missing.length ? `ไม่มีหน้า: ${missing.join(", ")}` : undefined,
  );

  // หน้า `/read/<ผัง>` ต้อง noindex และไม่มี canonical (เคาะกับเจ้าของแล้ว — ห้ามแย่งอันดับหน้าคู่มือผัง)
  const allNoindex = [...publicIds].every((id) =>
    (["th", "en"] as const).every((locale) => {
      const meta = readSpreadMetadata(id, locale);
      const robots = meta.robots as { index?: boolean; follow?: boolean } | undefined;
      return robots?.index === false && robots?.follow === true && !meta.alternates?.canonical;
    }),
  );
  check("หน้า `/read/<ผัง>` ทุกหน้าทั้งสองภาษาเป็น noindex, follow และไม่มี canonical", allNoindex);

  for (const page of ["astro/pages/read/[id].astro", "astro/pages/en/read/[id].astro"]) {
    const abs = path.join(ROOT, page);
    const src = fs.existsSync(abs) ? fs.readFileSync(abs, "utf-8") : "";
    check(`${page} ส่งผังเข้า TarotFlow`, /initialSpreadId=\{spreadId\}/.test(src), src ? undefined : "ไม่พบไฟล์");
  }
  for (const page of ["astro/pages/index.astro", "astro/pages/en/index.astro"]) {
    const abs = path.join(ROOT, page);
    const src = fs.existsSync(abs) ? fs.readFileSync(abs, "utf-8") : "";
    check(`${page} เด้งลิงก์เก่า \`?spread=\` ไปหน้า \`/read/<ผัง>\``, /location\.replace\(readPrefix/.test(src));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n── 16. รีเฟรชตอน /shuffle ยังบินอยู่ (A4-02) · ทิ้งรอบกลางทาง (A4-03) · ข้ามภาษา (A4-05) ──");
// ─────────────────────────────────────────────────────────────────────────────
/**
 * A4-02: เลือกไพ่ครบแต่ไพ่ยังไม่มา แล้วรีเฟรช ➔ เคยค้าง "กำลังวางไพ่ลงผัง" ตลอดกาล ไม่มีคำขอวิ่งอยู่
 * A4-03: กดแก้คำถาม/ย้อนกลับ/เริ่มใหม่ระหว่างรอ /shuffle ➔ เคยถูกลากเข้าขั้นอ่านเองและหักโควตา
 * A4-05: สลับ TH ↔ EN กลางพิธีบนหน้าแรก ➔ เคยเห็นรอบภาษาเดิมครอบหน้าภาษาใหม่
 */
const resumeOk = { step: "PICK_CARDS" as RitualStep, pickedCount: 3, drawnCount: 0, capacity: 3, hasSession: true };
check("A4-02: เลือกครบ ไม่มีไพ่ ขั้นเลือกไพ่ ➔ ต้องส่งซ้ำ", needsFinalizeOnResume(resumeOk));
check("A4-02: เลือกยังไม่ครบ ➔ ไม่ส่ง (ผู้ใช้เลือกต่อเอง)", !needsFinalizeOnResume({ ...resumeOk, pickedCount: 2 }));
check("A4-02: มีไพ่แล้ว ➔ ไม่ส่งซ้ำ (ไม่แตะรอบที่ไพ่มาแล้ว)", !needsFinalizeOnResume({ ...resumeOk, drawnCount: 3 }));
check("A4-02: ขั้นอื่นไม่ส่งซ้ำ", (["SPREAD_SELECT", "INTENTION_SELECT", "SHUFFLE", "READING", "SUMMARY"] as RitualStep[]).every((step) => !needsFinalizeOnResume({ ...resumeOk, step })));
check("A4-02: ไม่มีเซสชันเดิม/ไม่รู้จำนวนใบของผัง ➔ ไม่ส่ง", !needsFinalizeOnResume({ ...resumeOk, hasSession: false }) && !needsFinalizeOnResume({ ...resumeOk, capacity: 0 }));

// A4-03 — ตัวคุมรอบ: ยิงลำดับจริง
{
  const guard = createRunGuard();
  const r1 = guard.begin();
  check("A4-03: รอบที่เพิ่งเริ่มยังไม่เป็นของเก่า", !r1.isStale() && !r1.signal.aborted);
  check("A4-03: ยกเลิกระหว่างบิน ➔ รอบกลายเป็นของเก่า + ตัดคำขอ + บอกผู้เรียกว่ามีรอบบินอยู่", guard.cancel() === true && r1.isStale() && r1.signal.aborted);
  check("A4-03: ยกเลิกซ้ำตอนไม่มีรอบบิน ➔ คืน false (ไม่ปล่อย loading ซ้ำ)", guard.cancel() === false);
  const r2 = guard.begin();
  const r3 = guard.begin();
  check("A4-03: รอบใหม่ทับรอบเก่า (เก่ากลายเป็นของเก่า + ถูกตัดคำขอ)", r2.isStale() && r2.signal.aborted && !r3.isStale());
  r3.release();
  check("A4-03: จบตามปกติแล้วปล่อยตัวยกเลิก ➔ ตัวรอบไม่เป็นของเก่า · cancel ภายหลังไม่ถือว่ามีรอบบิน", !r3.isStale() && guard.cancel() === false);
}
// จำลองลำดับของ handleFinalizePickedCards: ผู้ใช้ยกเลิกระหว่าง await ➔ ห้ามแจกไพ่/เข้าขั้นอ่าน/ยิง /read
{
  const guard = createRunGuard();
  const log: string[] = [];
  const finalize = async (delay: Promise<void>) => {
    const run = guard.begin();
    try {
      await delay;
      if (run.isStale()) return;
      log.push("deal", "READING", "read");
      run.release();
    } finally {
      if (!run.isStale()) log.push("loading:false");
    }
  };
  let resolveShuffle!: () => void;
  const pending = new Promise<void>((r) => (resolveShuffle = r));
  const inflight = finalize(pending);
  guard.cancel(); // ผู้ใช้กด "แก้คำถาม"
  resolveShuffle(); // /shuffle ตอบมาทีหลัง
  await inflight;
  check("A4-03: คำตอบ /shuffle ที่มาหลังผู้ใช้ยกเลิก ไม่แจกไพ่ ไม่เข้าขั้นอ่าน ไม่ยิง /read ไม่แตะ loading", log.length === 0, `log=${JSON.stringify(log)}`);

  const log2: string[] = [];
  const guard2 = createRunGuard();
  const finalizeOk = async () => {
    const run = guard2.begin();
    try {
      await Promise.resolve();
      if (run.isStale()) return;
      log2.push("deal", "READING", "read");
      run.release();
    } finally {
      if (!run.isStale()) log2.push("loading:false");
    }
  };
  await finalizeOk();
  check("A4-03: รอบที่ไม่ถูกยกเลิกยังทำงานครบเหมือนเดิม", log2.join(",") === "deal,READING,read,loading:false");
}

// A4-05 — ไม่กู้คืนข้ามภาษา
check("A4-05: ภาษาเดียวกัน/รอบเก่าไม่มีฟิลด์ lang ➔ กู้ได้", !isCrossLanguageFlow("th", "th") && !isCrossLanguageFlow(undefined, "en") && !isCrossLanguageFlow(null, "th"));
check("A4-05: ภาษาต่างกัน ➔ ข้ามภาษา", isCrossLanguageFlow("th", "en") && isCrossLanguageFlow("en", "th"));
for (const step of ["INTENTION_SELECT", "SHUFFLE", "PICK_CARDS", "READING", "SUMMARY"] as RitualStep[]) {
  check(
    `A4-05: หน้าแรก EN ค้างรอบ TH ขั้น ${step} ➔ เริ่มหน้าเปล่า ไม่กู้คืนข้ามภาษา`,
    intent(null, step, {}).kind === "resume" &&
      resolveEntryIntent({ routeSpread: null, isKnownSpread: known, savedStep: step, savedLang: "th", pageLang: "en" }).kind === "fresh",
  );
}
check(
  "A4-05: หน้าแรกภาษาเดียวกันยังกู้คืนรอบค้างได้ (ปุ่มกลับไปหน้าคำทำนายของแชทพึ่งอยู่)",
  resolveEntryIntent({ routeSpread: null, isKnownSpread: known, savedStep: "SUMMARY", savedLang: "en", pageLang: "en" }).kind === "resume",
);
check(
  "A4-05: รีเฟรชหน้า /read/<ผัง> ที่ภาษาเดียวกันยังกู้คืน · ข้ามภาษา ➔ เริ่มผังของหน้า",
  resolveEntryIntent({ routeSpread: "celtic-cross", isKnownSpread: known, savedStep: "READING", returning: true, savedSpread: "celtic-cross", savedLang: "th", pageLang: "th" }).kind === "resume" &&
    resolveEntryIntent({ routeSpread: "celtic-cross", isKnownSpread: known, savedStep: "READING", returning: true, savedSpread: "celtic-cross", savedLang: "th", pageLang: "en" }).kind === "deepLink",
);

if (!fs.existsSync(FLOW)) {
  check("หาไฟล์ TarotFlow.tsx เจอ (ส่วน A4-02/03/05)", false, "ไฟล์ถูกย้าย/เปลี่ยนชื่อ — ด่านนี้ตรวจอะไรไม่ได้");
} else {
  const flowSrc = fs.readFileSync(FLOW, "utf-8");
  const body = (startMarker: string, endMarker: string): string => {
    const a = flowSrc.indexOf(startMarker);
    const b = flowSrc.indexOf(endMarker, a + startMarker.length);
    return a >= 0 && b > a ? flowSrc.slice(a, b) : "";
  };
  const finalizeBody = body("const handleFinalizePickedCards = async", "// Step 4: Stream AI interpretation");
  check("A4-03: handleFinalizePickedCards เริ่มรอบผ่านตัวคุมรอบ + ส่ง signal ให้ /shuffle", /finalizeGuard\.begin\(\)/.test(finalizeBody) && /signal:\s*run\.signal/.test(finalizeBody));
  check(
    "A4-03: handleFinalizePickedCards ตรวจ isStale() ก่อนแจกไพ่ทุกจุดหลัง await (หลังหน่วง · หลัง /shuffle · หลังสำรับ)",
    (finalizeBody.match(/if \(isStale\(\)\) return;/g) ?? []).length >= 3 &&
      finalizeBody.indexOf("if (isStale()) return;", finalizeBody.indexOf("await deckReady")) < finalizeBody.indexOf('type: "deal"'),
  );
  for (const [name, marker, end] of [
    ["handleBackToQuestion", "const handleBackToQuestion = () => {", "// ✦ ปุ่มย้อนกลับของเบราว์เซอร์"],
    ["handleStepBack", "const handleStepBack = () => {", "// v2: ทางกลับไปแก้คำถาม"],
    ["handleReset", "const handleReset = () => {", "// P1-U1: ย้อนกลับทีละขั้น"],
  ] as const) {
    check(`A4-03: ${name} ยกเลิกรอบ /shuffle ที่ยังบินอยู่ (cancelFinalize)`, /cancelFinalize\(\)/.test(body(marker, end)));
  }
  check("A4-03: ถอดหน้าแล้วยกเลิกรอบที่บินอยู่", /finalizeGuard\.cancel\(\);\s*\n\s*\};\s*\n\s*\}, \[finalizeGuard\]\)/.test(flowSrc));
  check(
    "A4-02: ตัวกู้คืนตัดสินด้วย needsFinalizeOnResume แล้วส่งซ้ำ handleFinalizePickedCards(pickedIndices) เมื่อสถานะถึงจอ",
    /needsFinalizeOnResume\(/.test(flowSrc) &&
      /resumeFinalizePendingRef\.current[\s\S]{0,400}handleFinalizePickedCards\(pickedIndices\)/.test(flowSrc),
  );
  check("A4-05: ตัวกู้คืนเทียบภาษาของรอบที่ค้างกับภาษาของหน้า และล้างรอบข้ามภาษา", /isCrossLanguageFlow\(saved\.lang, pageLang\)\) clearFlowState\(\)/.test(flowSrc) && /savedLang:\s*saved\?\.lang/.test(flowSrc) && /pageLang,/.test(flowSrc));
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n── 17. ข้อความผิดพลาดเครือข่าย (A4-04) · เพดานข้อความที่ส่ง /start (A4-07) ──");
// ─────────────────────────────────────────────────────────────────────────────
const FB = "ข้อความสำรอง";
check("A4-04: fetch ล้ม (Chrome) ➔ ข้อความไทยของหน้า ไม่ใช่ 'Failed to fetch'", friendlyError(new TypeError("Failed to fetch"), false, FB) === NETWORK_ERROR_TH);
check("A4-04: fetch ล้ม (Safari iOS 'Load failed') บนหน้า EN ➔ ข้อความอังกฤษของหน้า", friendlyError(new TypeError("Load failed"), true, FB) === NETWORK_ERROR_EN);
check("A4-04: Firefox 'NetworkError when attempting to fetch resource.' ➔ ข้อความของหน้า", friendlyError(new Error("NetworkError when attempting to fetch resource."), false, FB) === NETWORK_ERROR_TH);
check("A4-04: สตรีมขาดกลางทาง (TypeError: network error) ➔ ข้อความของหน้า", friendlyError(new TypeError("network error"), true, FB) === NETWORK_ERROR_EN);
check("A4-04: ข้อความที่เซิร์ฟเวอร์ส่งมาเอง (data.error) ผ่านตรง ๆ", friendlyError(new Error("คุณใช้สิทธิ์ฟรีวันนี้ครบแล้ว"), false, FB) === "คุณใช้สิทธิ์ฟรีวันนี้ครบแล้ว");
check("A4-04: ข้อความว่าง ➔ ใช้ข้อความสำรอง", friendlyError(new Error("  "), false, FB) === FB && friendlyError(undefined, false, FB) === FB);
check("A4-04: ผู้ใช้ยกเลิกเอง (AbortError) ไม่ขึ้นข้อความดิบ", friendlyError(Object.assign(new Error("The user aborted a request."), { name: "AbortError" }), false, FB) === FB);
for (const file of ["src/components/home/TarotFlow.tsx", "src/lib/reading/use-ai-reading.ts"]) {
  const src = fs.existsSync(path.join(process.cwd(), file)) ? fs.readFileSync(path.join(process.cwd(), file), "utf-8") : "";
  check(`A4-04: ${file} ไม่เอา err.message ดิบขึ้นจออีก (ใช้ friendlyError)`, src.length > 0 && !/\(err as Error\)\?\.message\s*\|\|/.test(src) && !/message:\s*err\.message\s*\|\|/.test(src) && /friendlyError\(/.test(src));
}

{
  const startRoute = path.join(process.cwd(), "src/app/api/reading/start/route.ts");
  const m = fs.readFileSync(startRoute, "utf-8").match(/situation:\s*noInjection\([^)]*\)\.max\((\d+)\)/);
  check("A4-07: START_SITUATION_MAX ตรงกับเพดาน intake.situation ใน /start จริง", Boolean(m) && Number(m![1]) === START_SITUATION_MAX, m ? `route=${m[1]} client=${START_SITUATION_MAX}` : "ไม่พบ .max(N) ของ situation ใน route");
  const card = fs.readFileSync(path.join(process.cwd(), "src/components/reading/ClarificationCard.tsx"), "utf-8");
  check("A4-07: ช่องตอบของแม่หมอจำกัดความยาว (maxLength) ไม่เกินเพดานของเซิร์ฟเวอร์", CLARIFY_ANSWER_MAX <= START_SITUATION_MAX && /maxLength=\{CLARIFY_ANSWER_MAX\}/.test(card));
  const flowSrc2 = fs.readFileSync(FLOW, "utf-8");
  check(
    "A4-07: ตัด situation ให้พอดีเพดานก่อนเก็บลง state และก่อนส่ง /start",
    /\.slice\(0,\s*START_SITUATION_MAX\);\s*\n\s*if \(ans\)/.test(flowSrc2) && /\.trim\(\)\.slice\(0,\s*START_SITUATION_MAX\)/.test(flowSrc2),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n── 18. ไพ่ใบเดียว: แผงเสริมต้องอ่านตามทิศที่เซิร์ฟเวอร์จั่วจริง (A4-01) ──");
// ─────────────────────────────────────────────────────────────────────────────
{
  const fake = {
    meanings: {
      general: { upright: "TH-up", reversed: "TH-rev" },
      work: { upright: "w-up", reversed: "w-rev" },
      money: { upright: "m-up", reversed: "m-rev" },
      love: { upright: "l-up", reversed: "l-rev" },
      self: { upright: "s-up", reversed: "s-rev" },
    },
    meaningsEn: {
      general: { upright: "EN-up", reversed: "EN-rev" },
      work: { upright: "", reversed: "" },
      money: { upright: "", reversed: "" },
      love: { upright: "", reversed: "" },
      self: { upright: "", reversed: "" },
    },
  };
  check("A4-01: หัวตั้ง ➔ ความหมายหัวตั้ง", orientedMeaning(fake, "general", false, false) === "TH-up");
  check("A4-01: กลับหัว ➔ ความหมายกลับหัว (ไม่ใช่หัวตั้งตายตัว)", orientedMeaning(fake, "general", true, false) === "TH-rev" && orientedMeaning(fake, "love", true, false) === "l-rev");
  check("A4-01: อังกฤษใช้ meaningsEn ตามทิศ · ถ้าว่างถอยไปภาษาไทยทิศเดิม", orientedMeaning(fake, "general", true, true) === "EN-rev" && orientedMeaning(fake, "work", true, true) === "w-rev");
  let parity = true;
  for (const yn of ["yes", "no", "maybe"] as const) {
    for (const rev of [false, true]) {
      const w = yesNoWeight({ yesNo: yn }, rev);
      const expected = w >= 1 ? "positive" : w <= -1 ? "negative" : "neutral";
      if (orientedTone(yn, rev) !== expected) parity = false;
    }
  }
  check("A4-01: ขั้ว ใช่/ไม่ใช่ ตรงกับ yesNoWeight ของหน้าสารานุกรมทุกชุด (กลับหัวไม่กลับขั้ว แรงลดครึ่ง)", parity);
  check("A4-01: ไพ่ yes กลับหัวไม่ใช่ 'บวก' อีกต่อไป (เดิมคำแนะนำอ่านเหมือนหัวตั้ง)", orientedTone("yes", false) === "positive" && orientedTone("yes", true) === "neutral");

  for (const file of ["src/components/daily/DailyClient.tsx", "src/components/love/LoveOneCardClient.tsx"]) {
    const src = fs.readFileSync(path.join(process.cwd(), file), "utf-8");
    const a = src.indexOf("renderReading={");
    const b = src.indexOf("recommendations={", a);
    const block = a >= 0 && b > a ? src.slice(a, b) : "";
    check(`A4-01: ${file} renderReading รับทิศ (card, isReversed)`, /renderReading=\{\(card, isReversed\)/.test(block));
    check(
      `A4-01: ${file} renderReading ไม่อ่านความหมายหัวตั้งตายตัว (.upright} / .yesNo)`,
      // คีย์เวิร์ดที่เลือกด้วยเงื่อนไข isReversed อยู่ในบล็อกนี้ได้ — ห้ามเฉพาะความหมายรายหมวด/ขั้ว ใช่-ไม่ใช่ ที่ตายตัวหัวตั้ง
      block.length > 0 && !/meanings(En)?\??\.\w+\??\.upright/.test(block) && !/card\.yesNo/.test(block),
    );
  }
  const loveSrc = fs.readFileSync(path.join(process.cwd(), "src/components/love/LoveOneCardClient.tsx"), "utf-8");
  check("A4-01: คำแนะนำตามสถานะหัวใจไม่ใช้ card.yesNo ของหัวตั้งตรง ๆ (ใช้ orientedTone)", !/card\.yesNo\s*===/.test(loveSrc) && /orientedTone\(card\.yesNo,\s*isReversed\)/.test(loveSrc));
  const ritualSrc = fs.readFileSync(path.join(process.cwd(), "src/components/reading/one-card/OneCardRitual.tsx"), "utf-8");
  check("A4-01: OneCardRitual ส่งทิศจริง (drawnReversed) ให้ renderReading", /renderReading\?\.\(drawnCard,\s*drawnReversed\)/.test(ritualSrc));
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n── 19. ผังของฉันในเครื่อง ย้ายขึ้นบัญชีหลังล็อกอิน (A4-06) ──");
// ─────────────────────────────────────────────────────────────────────────────
{
  const store = new Map<string, string>();
  const g = globalThis as unknown as Record<string, unknown>;
  const prevLs = g.localStorage;
  const prevFetch = g.fetch;
  g.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  const LS_KEY = "tarot_custom_spreads_v1";
  const mkLocal = (id: string, name: string, updatedAt: number) => ({
    id,
    name,
    layout: "row",
    positions: [{ nameTh: "ก", nameEn: "a", meaning: "m", meaningEn: "m" }],
    updatedAt,
    local: true,
  });
  const seed = () => store.set(LS_KEY, JSON.stringify([mkLocal("local_a", "ผัง A", 2), mkLocal("local_b", "ผัง B", 1)]));
  const localCount = () => (JSON.parse(store.get(LS_KEY) ?? "[]") as unknown[]).length;

  let signedIn = true;
  let acceptPosts = true;
  const remote: Array<Record<string, unknown>> = [];
  let posts = 0;
  g.fetch = async (_url: string, init?: { method?: string; body?: string }) => {
    const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });
    if (!signedIn) return json(401, { spreads: [] });
    if (init?.method === "POST") {
      posts++;
      if (!acceptPosts) return json(409, { error: "เก็บผังได้สูงสุดแล้ว" });
      const spread = { ...(JSON.parse(init.body ?? "{}").spread as object), id: `cs_${remote.length}`, shareSlug: null, useCount: 0, updatedAt: Date.now() };
      remote.push(spread);
      return json(201, { spread });
    }
    return json(200, { spreads: remote });
  };

  try {
    // ผู้เยี่ยมชม: เห็นผังในเครื่อง ไม่อัปโหลดอะไร
    seed();
    signedIn = false;
    const guest = await loadMyAndMigrate("th");
    check("A4-06: ผู้เยี่ยมชมเห็นผังในเครื่อง ไม่ยิงอัปโหลด", !guest.member && guest.spreads.length === 2 && posts === 0);

    // ล็อกอินแล้ว: ผังในเครื่องขึ้นบัญชีครบ + ล้างออกจากเครื่อง
    signedIn = true;
    const member = await loadMyAndMigrate("th");
    check(
      "A4-06: ล็อกอินแล้วผังในเครื่องขึ้นบัญชีครบทุกผัง ไม่หายจากรายการ",
      member.member && member.spreads.length === 2 && posts === 2 && remote.length === 2 && member.spreads.every((s) => !s.local),
      `member=${member.member} spreads=${member.spreads.length} posts=${posts}`,
    );
    check("A4-06: ล้างผังที่ขึ้นสำเร็จออกจากเครื่อง (ไม่ค้างเป็นกำพร้า)", localCount() === 0);
    const again = await loadMyAndMigrate("th");
    check("A4-06: โหลดซ้ำไม่อัปโหลดซ้ำ (ผังในบัญชีไม่ซ้ำ)", again.spreads.length === 2 && posts === 2);

    // ขึ้นบัญชีไม่ได้ (เต็ม/ไม่ผ่านด่าน): ผังค้างอยู่ในเครื่องและยังมองเห็น ไม่ยิงซ้ำรัว ๆ
    remote.length = 0;
    posts = 0;
    seed();
    acceptPosts = false;
    const blocked = await loadMyAndMigrate("th");
    check(
      "A4-06: ขึ้นบัญชีไม่ได้ ➔ ผังไม่ถูกลบ และยังแสดงต่อท้ายรายการ (ลบเองได้)",
      blocked.member && blocked.spreads.length === 2 && blocked.spreads.every((s) => s.local) && localCount() === 2,
    );
    const postsAfterFirst = posts;
    await loadMyAndMigrate("th");
    check("A4-06: ผังที่ขึ้นไม่ได้ไม่ถูกยิงซ้ำทุกครั้งที่รีเฟรชรายการ", posts === postsAfterFirst);
  } finally {
    g.localStorage = prevLs;
    g.fetch = prevFetch;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n── 20. ไพ่ต้องไม่ถูกเฉลยก่อนผู้ใช้พลิก + ปุ่มเปิดไพ่ใบเดียวกดซ้ำไม่จั่วใหม่ (ตรวจรอบ 2026-10-20) ──");
// ─────────────────────────────────────────────────────────────────────────────
{
  const read = (f: string) => fs.readFileSync(path.join(process.cwd(), f), "utf-8");
  const sr = read("src/components/reading/StreamReader.tsx");
  check(
    "กฎข้อ 4: แผงคำอ่านรับ revealedOrders และแยกหน้าไพ่ที่ยังคว่ำ (ไม่แสดงภาพ/ชื่อ/คำอ่าน)",
    /revealedOrders\?: number\[\]/.test(sr) && /!activeRevealed \? \(/.test(sr),
  );
  check(
    "กฎข้อ 4: ภาพรวม/Provably Fair ขึ้นเมื่อพลิกครบเท่านั้น · จุดเลือกไพ่ไม่บอกชื่อใบที่ยังคว่ำ",
    /!allRevealed \? \(/.test(sr) && /card && isOrderRevealed\(d\.order\)/.test(sr),
  );
  check(
    "กฎข้อ 4: ประกาศคำอ่านให้โปรแกรมอ่านจอเฉพาะใบที่พลิกแล้ว",
    /const finishedReading = !isStreaming && activeRevealed/.test(sr),
  );
  const flow = read("src/components/home/TarotFlow.tsx");
  check(
    "กฎข้อ 4: TarotFlow ส่ง revealedOrders ให้ StreamReader และกั้นคำอ่านด่วนจนกว่าจะพลิก",
    /<StreamReader[\s\S]{0,800}?revealedOrders=\{revealedOrders\}/.test(flow) &&
      /resultStyle === "quick" &&\s*!drawnCards\.every\(\(c\) => revealedOrders\.includes\(c\.order\)\)/.test(flow),
  );
  const card = read("src/components/card/TarotCard.tsx");
  check(
    "กฎข้อ 4: หน้าไพ่ที่ยังคว่ำซ่อนจากโปรแกรมอ่านจอ (alt ชื่อไพ่ไม่หลุด)",
    /aria-hidden=\{isRevealed \? undefined : true\}\s*className=\{`card-face card-face--back/.test(card),
  );
  const pac = read("src/components/pick-a-card/PickACardClient.tsx");
  check(
    "กฎข้อ 4: Pick A Card คัดลอกเฉพาะใบที่พลิกแล้ว",
    /revealedIndices\.has\(i\)\s*\?/.test(pac),
  );
  const ritual = read("src/components/reading/one-card/OneCardRitual.tsx");
  check(
    "ไพ่ใบเดียว: กดเปิดไพ่ซ้ำ/กดระหว่างรอไพ่ขึ้นจอ ไม่จั่วใบใหม่ (ไม่เสียสิทธิ์ซ้ำ)",
    /if \(drawLockRef\.current \|\| oracle\.rawDrawn\.length > 0\) return;/.test(ritual) &&
      /onClick=\{awaitingCard \? retryDeckLoad : handleDraw\}/.test(ritual) &&
      /disabled=\{drawBusy\}/.test(ritual),
  );
}

console.log(`\n📊 สรุป: ผ่าน ${pass} ข้อ | ล้มเหลว ${fail} ข้อ\n`);
if (fail > 0) process.exit(1);
