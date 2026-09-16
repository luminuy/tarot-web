/**
 * 🔌 ต่อสัญญาณยกเลิกของ "ลูกค้า" เข้ากับตัวจับเวลาของผู้ให้บริการ AI
 * ---------------------------------------------------------------------------
 * บทเรียน (T-06): ทั้ง Groq และ Gemini สร้าง `AbortController` ของตัวเองเพื่อคุมเวลา
 * แต่ไม่มีใครส่ง `request.signal` ของคำขอจริงเข้าไปเลย ผลคือผู้ใช้ปิดแท็บตอนวินาทีที่ 2
 * ของสตรีม 20 วินาที เรายังดูดคำตอบจากโมเดลต่อจนจบและจ่ายค่าโทเคนเต็มจำนวน
 *
 * ฟังก์ชันนี้ผูกสัญญาณภายนอกเข้ากับ controller ภายใน แล้วคืนฟังก์ชันถอดสาย
 * **ต้องเรียกฟังก์ชันถอดสายเสมอ** ไม่งั้น listener จะค้างอยู่กับ signal ของคำขอ
 */
export function linkAbortSignal(
  controller: AbortController,
  external?: AbortSignal | null,
): () => void {
  if (!external) return () => {};
  if (external.aborted) {
    controller.abort();
    return () => {};
  }
  const onAbort = () => controller.abort();
  external.addEventListener("abort", onAbort, { once: true });
  return () => external.removeEventListener("abort", onAbort);
}
