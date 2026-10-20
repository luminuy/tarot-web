import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  CHAT_MESSAGE_MAX,
  CHAT_HISTORY_TURN_MAX,
  CHAT_HISTORY_MAX_TURNS,
  CHAT_HISTORY_REPLAY_TURNS,
  clampChatHistory,
} from "../../src/lib/reading/chat-limits";

const CHAT_ROUTE = path.join(process.cwd(), "src/app/api/reading/[id]/chat/route.ts");
const chatRouteSrc = fs.readFileSync(CHAT_ROUTE, "utf-8");

/** อ่านเพดานจริงจาก route (ไม่เก็บสำเนาค่าไว้ที่นี่ — A4-08: สำเนาเก่าเคยทำให้ด่านเขียวทั้งที่ไคลเอนต์กับเซิร์ฟเวอร์ไม่ตรงกัน) */
function readRouteConst(name: string): number {
  const m = chatRouteSrc.match(new RegExp(`const ${name}\\s*=\\s*(\\d+)`));
  if (!m) throw new Error(`ไม่พบค่าคงที่ ${name} ใน chat/route.ts — ด่านนี้ต้องอ่านเพดานจากของจริง`);
  return Number(m[1]);
}
const routeHistoryMaxTurns = (() => {
  // history: z.array(...).max(N) — บล็อก `history:` ตัวแรกใน BodySchema
  const m = chatRouteSrc.match(/history:\s*z\s*\.array\([\s\S]*?\)\s*\.max\((\d+)\)/);
  if (!m) throw new Error("ไม่พบ .max(N) ของ history[] ใน chat/route.ts");
  return Number(m[1]);
})();
const LIMITS = {
  message: readRouteConst("CHAT_MESSAGE_MAX"),
  turn: readRouteConst("CHAT_HISTORY_TURN_MAX"),
  replay: readRouteConst("CHAT_HISTORY_REPLAY_TURNS"),
  turns: routeHistoryMaxTurns,
};

// schema สร้างจากเพดานจริงของ route (รูปทรงเดียวกับ BodySchema ใน route)
const BodySchema = z.object({
  message: z.string().min(1, "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม").max(LIMITS.message, `คำถามยาวเกิน ${LIMITS.message} ตัวอักษร`),
  history: z
    .array(
      z.object({
        sender: z.enum(["user", "bot"]),
        text: z.string().max(LIMITS.turn),
      })
    )
    .max(LIMITS.turns)
    .optional(),
});

function validateChatBody(body: unknown): { success: boolean; error?: string } {
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const errorMessage =
      firstIssue?.path[0] === "message"
        ? (firstIssue.message || "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม")
        : "ข้อมูลการสนทนาไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง";
    return { success: false, error: errorMessage };
  }
  return { success: true };
}

export function runChatSchemaTests() {
  console.log("🧪 Testing Chat BodySchema Resiliency...");

  // Test 1: Empty message should return "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม"
  const emptyRes = validateChatBody({ message: "" });
  if (emptyRes.success || emptyRes.error !== "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม") {
    throw new Error(`Test 1 Failed: expected "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม", got ${emptyRes.error}`);
  }
  console.log("  ✓ Test 1: Empty message returns 'กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม'");

  // Test 2 (A4-08): ค่าคงที่ฝั่งไคลเอนต์ต้องตรงกับเพดานจริงของ route ทุกตัว
  const pairs: Array<[string, number, number]> = [
    ["CHAT_MESSAGE_MAX", CHAT_MESSAGE_MAX, LIMITS.message],
    ["CHAT_HISTORY_TURN_MAX", CHAT_HISTORY_TURN_MAX, LIMITS.turn],
    ["CHAT_HISTORY_REPLAY_TURNS", CHAT_HISTORY_REPLAY_TURNS, LIMITS.replay],
    ["CHAT_HISTORY_MAX_TURNS", CHAT_HISTORY_MAX_TURNS, LIMITS.turns],
  ];
  for (const [name, client, server] of pairs) {
    if (client !== server) {
      throw new Error(`Test 2 Failed (A4-08): ${name} ฝั่งไคลเอนต์ = ${client} แต่ route จริง = ${server} — แก้ src/lib/reading/chat-limits.ts ให้ตรง`);
    }
  }
  console.log(`  ✓ Test 2: เพดานไคลเอนต์ตรงกับ route จริง (ข้อความ ${LIMITS.message} · ต่อตา ${LIMITS.turn} · ${LIMITS.turns} ตา · replay ${LIMITS.replay} ตา)`);

  // Test 2b (A4-08): คำตอบแม่หมอยาว (ผัง 3 ใบขึ้นไปยาวเกินเพดานได้ปกติ) ที่ผ่าน clampChatHistory ต้องผ่าน schema
  // — ดิบ ๆ ต้องถูกปฏิเสธ (พิสูจน์ว่าด่านนี้ใช้เพดานจริง ไม่ใช่สำเนาหลวม)
  const longBotResponse = "แกรรร มานั่งนี่เลย! ".repeat(200); // 4,000+ chars
  const rawHistory = [
    { sender: "user" as const, text: "ขออย่างความอย่างละเอียด" },
    { sender: "bot" as const, text: longBotResponse },
  ];
  const rawRes = validateChatBody({ message: "สรุปให้หน่อยเป็นข้อๆ", history: rawHistory });
  if (rawRes.success) {
    throw new Error("Test 2b Failed: ประวัติดิบที่มีตายาวเกินเพดานควรถูกปฏิเสธ — ด่านนี้อาจไม่ได้ใช้เพดานจริง");
  }
  const clampedRes = validateChatBody({ message: "สรุปให้หน่อยเป็นข้อๆ", history: clampChatHistory(rawHistory) });
  if (!clampedRes.success) {
    throw new Error(`Test 2b Failed: long bot response ผ่าน clampChatHistory แล้วยังถูกปฏิเสธ: ${clampedRes.error}`);
  }
  console.log("  ✓ Test 2b: คำตอบแม่หมอยาว 4,000+ ตัว ผ่านเมื่อไคลเอนต์ตัดตามเพดาน (ดิบ ๆ ถูกปฏิเสธตามคาด)");

  // Test 2c (A4-08): ห้องแชทที่ยาวเกิน 50 ตา ต้องไม่ทำให้ขอไม่ผ่าน
  const manyTurns = Array.from({ length: 80 }, (_, i) => ({
    sender: (i % 2 === 0 ? "user" : "bot") as "user" | "bot",
    text: `ตาที่ ${i}`,
  }));
  const manyRes = validateChatBody({ message: "ถามต่อ", history: clampChatHistory(manyTurns) });
  if (!manyRes.success) {
    throw new Error(`Test 2c Failed: ประวัติ 80 ตาถูกปฏิเสธหลังตัด: ${manyRes.error}`);
  }
  const keptTurns = clampChatHistory(manyTurns);
  if (keptTurns.length !== LIMITS.replay || keptTurns[keptTurns.length - 1].text !== "ตาที่ 79") {
    throw new Error("Test 2c Failed: clampChatHistory ต้องเก็บตาท้ายสุดตามจำนวนที่ replay จริง");
  }
  console.log("  ✓ Test 2c: ประวัติ 80 ตาถูกตัดเหลือตาท้ายสุดตามเพดาน replay และผ่าน schema");

  // Test 2d (A4-08): FollowUpChat ต้องส่งประวัติผ่าน clampChatHistory และจำกัดช่องพิมพ์ — ห้ามกลับไปตัดเลขเอง
  const followUpSrc = fs.readFileSync(path.join(process.cwd(), "src/components/reading/FollowUpChat.tsx"), "utf-8");
  if (!/clampChatHistory\(/.test(followUpSrc) || !/maxLength=\{CHAT_MESSAGE_MAX\}/.test(followUpSrc)) {
    throw new Error("Test 2d Failed (A4-08): FollowUpChat ต้องใช้ clampChatHistory และ maxLength={CHAT_MESSAGE_MAX}");
  }
  if (/\.slice\(0,\s*4000\)/.test(followUpSrc)) {
    throw new Error("Test 2d Failed (A4-08): FollowUpChat ตัดประวัติที่ 4,000 ตัวอีก — เกินเพดาน 800 ของเซิร์ฟเวอร์");
  }
  console.log("  ✓ Test 2d: FollowUpChat ตัดประวัติด้วย clampChatHistory + จำกัดความยาวช่องพิมพ์");

  // Test 3 (A2-02): แชทต้องไม่เชื่อ readingSnapshot จากไคลเอนต์ — เดิมใช้สร้างเรกคอร์ดทั้งก้อน
  // (ไพ่ที่ไม่ผ่าน PF · ปรมาจารย์ที่สงวนไว้ผู้จ่ายเงิน · summary ยาว 10,000 ตัวที่ไม่ผ่านด่านกันฉีด prompt)
  if (/readingSnapshot:\s*z/.test(chatRouteSrc) || /clientSnapshot/.test(chatRouteSrc)) {
    throw new Error("Test 3 Failed (A2-02): chat/route.ts ยังรับ readingSnapshot จากไคลเอนต์มาสร้างเรกคอร์ด");
  }
  console.log("  ✓ Test 3: แชทไม่รับ readingSnapshot จากไคลเอนต์ (A2-02)");

  // Test 4: Provably Fair Guard - Ensure no fake card fallback exists in chat/route.ts
  const chatRouteContent = chatRouteSrc;
  if (chatRouteContent.includes("order: 0, cardIndex: 0, isReversed: false") || chatRouteContent.includes("Safe default reading context fallback")) {
    throw new Error("Test 4 Failed: Fake card fallback (The Fool) was detected in chat/route.ts! Provably Fair violation.");
  }
  if (!chatRouteContent.includes("reading_not_found")) {
    throw new Error("Test 4 Failed: chat/route.ts must return reading_not_found when cards are missing!");
  }
  console.log("  ✓ Test 4: Provably Fair Guard - No fake card fallback (The Fool) in chat route, 404 returned on missing cards");

  console.log("✨ All Chat BodySchema tests passed successfully!");
}

runChatSchemaTests();
