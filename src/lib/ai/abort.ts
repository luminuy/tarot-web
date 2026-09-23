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

/** ไม่มี chunk ใหม่นานเท่านี้ = ผู้ให้บริการค้างกลางสตรีม ➔ ตัดทิ้งแล้วลองโมเดลถัดไป */
export const STREAM_IDLE_TIMEOUT_MS = 20_000;

export class StreamIdleTimeoutError extends Error {
  constructor(idleMs: number) {
    super(`สตรีมไม่มีข้อมูลใหม่นาน ${idleMs} ms`);
    this.name = "StreamIdleTimeoutError";
  }
}

/**
 * อ่านสตรีมทีละก้อน **พร้อมเพดานเวลาระหว่างก้อน** และยกเลิกตามลูกค้า (A2-15)
 * ---------------------------------------------------------------------------
 * ตัวจับเวลาของ Groq/Gemini ถูกเคลียร์ทันทีที่ได้ headers (ตั้งใจ — ไม่งั้นตัดคำอ่านยาวกลางคัน)
 * แต่ไม่มีอะไรคุมช่วงอ่าน body เลย ผู้ให้บริการส่ง headers แล้วหยุดกลางทาง (เกิดจริงกับ LLM)
 * `reader.read()` จะรอไม่มีกำหนด ➔ หน้าหมุนค้าง · สล็อต `maxConcurrent: 1` ค้าง ผู้ใช้กดใหม่ได้ 429
 * · ไม่ failover ไปโมเดลถัดไป · และฝั่ง Gemini ปิดแท็บแล้วโมเดลยังผลิตโทเคนต่อ
 *
 * หมดเวลา ➔ `reader.cancel()` แล้วโยน `StreamIdleTimeoutError` (ให้ตัวเรียกลองโมเดลถัดไป)
 * ลูกค้ายกเลิก ➔ `reader.cancel()` แล้วโยน AbortError (ตัวเรียกเช็ก `abortSignal.aborted` อยู่แล้ว)
 */
export async function readWithIdleTimeout<T>(
  reader: ReadableStreamDefaultReader<T>,
  opts: { idleMs?: number; signal?: AbortSignal | null } = {},
): Promise<ReadableStreamReadResult<T>> {
  const idleMs = opts.idleMs ?? STREAM_IDLE_TIMEOUT_MS;
  const abortError = () => Object.assign(new Error("ลูกค้ายกเลิกคำขอ"), { name: "AbortError" });
  if (opts.signal?.aborted) {
    await reader.cancel().catch(() => undefined);
    throw abortError();
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const guard = new Promise<never>((_, reject) => {
    // ⚠️ ต้อง reject ก่อน cancel — `cancel()` ปิดคำขออ่านที่ค้างอยู่ด้วย `{ done: true }` ทันที
    //    ถ้าสลับลำดับ race จะได้ "จบสตรีมปกติ" แทนความผิดพลาด แล้วตัวเรียกตีความเป็นคำอ่านไม่ครบ
    timer = setTimeout(() => {
      reject(new StreamIdleTimeoutError(idleMs));
      void reader.cancel().catch(() => undefined);
    }, idleMs);
    if (opts.signal) {
      onAbort = () => {
        reject(abortError());
        void reader.cancel().catch(() => undefined);
      };
      opts.signal.addEventListener("abort", onAbort, { once: true });
    }
  });

  try {
    return await Promise.race([reader.read(), guard]);
  } finally {
    if (timer) clearTimeout(timer);
    if (onAbort) opts.signal?.removeEventListener("abort", onAbort);
  }
}
