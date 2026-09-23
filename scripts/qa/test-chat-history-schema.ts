import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const BodySchema = z.object({
  message: z.string().min(1, "กรุณาระบุคำถามที่ต้องการถามเพิ่มเติม").max(2000, "คำถามยาวเกิน 2,000 ตัวอักษร"),
  history: z
    .array(
      z.object({
        sender: z.enum(["user", "bot"]),
        text: z.string().max(50000),
      })
    )
    .max(50)
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

  // Test 2: Long bot response (> 2,500 chars as in Celtic Cross) in history MUST PASS!
  const longBotResponse = "แกรรร มานั่งนี่เลย! ".repeat(200); // 4,000+ chars
  const subsequentQuestionRes = validateChatBody({
    message: "สรุปให้หน่อยเป็นข้อๆ",
    history: [
      { sender: "user", text: "ขออย่างความอย่างละเอียด" },
      { sender: "bot", text: longBotResponse },
    ],
  });
  if (!subsequentQuestionRes.success) {
    throw new Error(`Test 2 Failed: long bot response in history was rejected: ${subsequentQuestionRes.error}`);
  }
  console.log("  ✓ Test 2: In-depth Celtic Cross bot response (4,000+ chars) in history passes smoothly");

  // Test 3 (A2-02): แชทต้องไม่เชื่อ readingSnapshot จากไคลเอนต์ — เดิมใช้สร้างเรกคอร์ดทั้งก้อน
  // (ไพ่ที่ไม่ผ่าน PF · ปรมาจารย์ที่สงวนไว้ผู้จ่ายเงิน · summary ยาว 10,000 ตัวที่ไม่ผ่านด่านกันฉีด prompt)
  const chatRouteSrc = fs.readFileSync(path.join(process.cwd(), "src/app/api/reading/[id]/chat/route.ts"), "utf-8");
  if (/readingSnapshot:\s*z/.test(chatRouteSrc) || /clientSnapshot/.test(chatRouteSrc)) {
    throw new Error("Test 3 Failed (A2-02): chat/route.ts ยังรับ readingSnapshot จากไคลเอนต์มาสร้างเรกคอร์ด");
  }
  console.log("  ✓ Test 3: แชทไม่รับ readingSnapshot จากไคลเอนต์ (A2-02)");

  // Test 4: Provably Fair Guard - Ensure no fake card fallback exists in chat/route.ts
  const chatRouteContent = fs.readFileSync(path.join(process.cwd(), "src/app/api/reading/[id]/chat/route.ts"), "utf-8");
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
