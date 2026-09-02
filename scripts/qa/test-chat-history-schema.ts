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
  readingSnapshot: z
    .object({
      question: z.string().max(1000).optional(),
      spreadId: z.string().max(100).optional(),
      summary: z.string().max(10000).optional(),
      personaId: z.string().max(100).optional(),
      drawn: z
        .array(
          z.object({
            order: z.number().int().min(0).max(77),
            cardIndex: z.number().int().min(0).max(77),
            isReversed: z.boolean(),
          })
        )
        .max(78)
        .optional(),
    })
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

  // Test 3: Very large reading summary in snapshot (5,000 chars) MUST PASS!
  const snapshotRes = validateChatBody({
    message: "เรื่องที่ต้องระวัง",
    history: [
      { sender: "user", text: "ขออย่างความอย่างละเอียด" },
      { sender: "bot", text: longBotResponse },
      { sender: "user", text: "สรุปให้หน่อยเป็นข้อๆ" },
      { sender: "bot", text: "1. สรุปข้อหนึ่ง\n2. สรุปข้อสอง" },
    ],
    readingSnapshot: {
      question: "ความรักในอนาคต",
      summary: "สรุปคำทำนายยาวๆ ".repeat(150),
    },
  });
  if (!snapshotRes.success) {
    throw new Error(`Test 3 Failed: long snapshot was rejected: ${snapshotRes.error}`);
  }
  console.log("  ✓ Test 3: Multi-turn chat with 4 turns and long snapshot passes smoothly");

  console.log("✨ All Chat BodySchema tests passed successfully!");
}

runChatSchemaTests();
