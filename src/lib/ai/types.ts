import type { Reading } from "@/lib/schema/reading";

/**
 * 📡 สัญญาของสตรีมคำอ่านไพ่ — ใช้ร่วมกันทุกผู้ให้บริการ AI
 * ---------------------------------------------------------------------------
 * เดิมชนิดข้อมูลสองตัวนี้อยู่ใน `src/lib/ai/claude.ts` ซึ่งเป็นไฟล์ที่เลิกใช้แล้ว
 * (ระบบย้ายไปใช้ Groq เป็นทัพหน้าและ Gemini เป็นตัวสำรองตั้งแต่ PR #224)
 * แต่ `groq.ts` / `gemini.ts` / `read/route.ts` ยัง `import type` จากไฟล์นั้นอยู่
 * ไฟล์ที่ตายแล้วจึงลบไม่ได้ และ `@anthropic-ai/sdk` (~13 MB) ยังถูกล็อกไว้ใน
 * package.json ทั้งที่ไม่มีโค้ดไหนเรียกใช้จริงเลยสักบรรทัด
 *
 * ชนิดข้อมูลที่ผู้ให้บริการหลายเจ้าใช้ร่วมกันต้องอยู่ในไฟล์ที่เป็นกลาง
 * ไม่ผูกกับผู้ให้บริการรายใดรายหนึ่ง
 */
export type ReadingEvent =
  | { type: "opening"; text: string }
  | { type: "card"; position: number; headline: string; reading: string }
  | { type: "connections"; text: string }
  | { type: "summary"; text: string }
  | { type: "done"; reading: Reading; usage: UsageInfo }
  | { type: "error"; message: string };

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}
