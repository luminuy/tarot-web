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
  isPassHolderOf,
} from "../../src/components/home/flow-access";
import { resolveEntryIntent } from "../../src/components/home/flow-entry";
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

// ทางเข้าทั้งสามใน TarotFlow ต้องเรียกตรรกะก้อนนี้ ห้ามคัดลอกเงื่อนไขไปเขียนเองอีก
if (!fs.existsSync(FLOW)) {
  check("หาไฟล์ TarotFlow.tsx เจอ (ตรวจทางเข้าสู่ขั้นตั้งจิต)", false, "ไฟล์ถูกย้าย/เปลี่ยนชื่อ — ด่านนี้ตรวจอะไรไม่ได้");
} else {
  const flowSrc = fs.readFileSync(FLOW, "utf-8");
  check("TarotFlow ใช้ `decideSpreadAccess` (ปุ่มหน้าแรก + ลิงก์ `?spread=`)", flowSrc.includes("decideSpreadAccess("));
  check("TarotFlow ใช้ `decideStartSessionAccess` ตอนยิงเซสชันจริง", flowSrc.includes("decideStartSessionAccess("));
  /**
   * ลิงก์ `/?spread=<id>` ต้อง "เริ่มพิธีให้เลย" — ผู้ใช้กดคำว่าเริ่มดูดวงมาแล้วหนึ่งที
   * ถ้าการเรียกนี้หายไป หน้าแรกจะกลับไปนิ่งอยู่ขั้นเลือกผังเหมือนเดิม
   */
  check(
    "ลิงก์ `?spread=` เริ่มพิธีให้อัตโนมัติ ไม่ใช่แค่เลือกผังค้างไว้",
    /\.get\("spread"\)/.test(flowSrc) && /void beginFromDeepLink\(/.test(flowSrc),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\n── 14. เปิดหน้าแรกครั้งนี้เพราะอะไร (flow-entry.ts) ──");
// ─────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ ยิงเคสจริงใส่ฟังก์ชัน ไม่ได้ค้นข้อความในซอร์ส
 *
 * ลำดับที่ต้องไม่สลับ: ปุ่มที่ผู้ใช้เพิ่งกด (`?spread=`) ชนะรอบที่ค้างอยู่ในแท็บเสมอ
 * ของเดิมสลับลำดับกัน คนที่เพิ่งเปิดไพ่ในแท็บนี้จึงกดผังใหม่ไม่ติดเลยสักครั้ง
 */
const known = (id: string) => ["daily", "celtic-cross", "three-card"].includes(id);
const intent = (spreadParam: string | null, savedStep: RitualStep | null) =>
  resolveEntryIntent({ spreadParam, isKnownSpread: known, savedStep });

check("กดปุ่มผังใหม่ ทั้งที่ยังไม่มีอะไรค้าง ➔ เริ่มผังนั้น", intent("celtic-cross", null).kind === "deepLink");
for (const step of ["INTENTION_SELECT", "SHUFFLE", "PICK_CARDS", "READING", "SUMMARY"] as RitualStep[]) {
  const got = intent("celtic-cross", step);
  check(
    `กดปุ่มผังใหม่ ขณะค้างอยู่ขั้น ${step} ➔ ผังที่กดต้องชนะ (ไม่ใช่ลากกลับรอบเก่า)`,
    got.kind === "deepLink" && got.spreadId === "celtic-cross",
  );
}
check("ไม่ได้กดอะไร แต่มีรอบค้างอยู่ ➔ กู้คืนรอบเดิม", intent(null, "READING").kind === "resume");
check("ไม่ได้กดอะไร และค้างที่ขั้นเลือกผัง ➔ ถือว่าไม่มีอะไรค้าง", intent(null, "SPREAD_SELECT").kind === "fresh");
check("ไม่ได้กดอะไร และไม่มีอะไรค้าง ➔ หน้าเปล่า", intent(null, null).kind === "fresh");
check(
  "`?spread=` ที่ไม่มีผังอยู่จริง ➔ ไม่ใช่คำสั่ง ห้ามทับรอบที่ค้างอยู่",
  intent("ผังมั่ว", "READING").kind === "resume" && intent("ผังมั่ว", null).kind === "fresh",
);

// URL ต้องถูกล้าง `?spread=` ทิ้งหลังรับคำสั่ง ไม่งั้นรีเฟรชระหว่างดูดวง = เริ่มใหม่ทับของเดิม
if (!fs.existsSync(FLOW)) {
  check("หาไฟล์ TarotFlow.tsx เจอ (ตรวจการล้าง ?spread= ออกจาก URL)", false, "ไฟล์ถูกย้าย/เปลี่ยนชื่อ");
} else {
  const flowSrc = fs.readFileSync(FLOW, "utf-8");
  check("TarotFlow ตัดสินทางเข้าด้วย `resolveEntryIntent`", flowSrc.includes("resolveEntryIntent("));
  check(
    "ล้าง `?spread=` ออกจาก URL หลังรับคำสั่งแล้ว (กันรีเฟรชแล้วเริ่มใหม่ทับรอบที่ค้าง)",
    /searchParams\.delete\("spread"\)/.test(flowSrc) && /history\.replaceState/.test(flowSrc),
  );
}

console.log(`\n📊 สรุป: ผ่าน ${pass} ข้อ | ล้มเหลว ${fail} ข้อ\n`);
if (fail > 0) process.exit(1);
