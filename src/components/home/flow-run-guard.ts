/**
 * 🚦 ตัวคุมรอบงาน async ของพิธีดูดวง — ตรรกะล้วน ไม่มี React ไม่มี I/O (A4-03)
 * ===========================================================================
 *
 * รอบ "ส่งไพ่ที่เลือกให้เซิร์ฟเวอร์" เป็น async หลายจังหวะ (หน่วง ➔ `/shuffle` ➔ รอสำรับ) แล้วค่อยแจกไพ่ + เข้าขั้นอ่าน + ยิง `/read`
 * ถ้าผู้ใช้ทิ้งรอบนี้ไปกลางทาง (แก้คำถาม · ย้อนกลับ · เริ่มใหม่ · ถอดหน้า) แต่ตัวรอบไม่รู้ตัว
 * คำตอบที่มาทีหลังจะลากผู้ใช้กลับเข้าขั้นอ่านเองและหักโควตากับคำอ่านที่ยกเลิกไปแล้ว
 *
 * วิธีใช้: `begin()` ตอนเริ่มรอบ ตรวจ `run.isStale()` หลังทุก `await` ก่อนแตะ state · ผู้ที่ทิ้งรอบเรียก `cancel()`
 * รอบใหม่ทับรอบเก่าเสมอ (รอบเก่าจึงกลายเป็นของเก่าโดยอัตโนมัติ)
 *
 * ด่าน `scripts/qa/test-flow-state.ts` ยิงลำดับการกระทำจริงใส่ตัวนี้
 */

export interface FlowRun {
  /** รอบนี้ถูกยกเลิก หรือถูกรอบใหม่ทับไปแล้ว — ห้ามแตะ state/ขั้น/โควตาอีก */
  isStale: () => boolean;
  /** ส่งให้ `fetch` เพื่อตัดคำขอที่บินอยู่ตอนถูกยกเลิก */
  signal: AbortSignal;
  /** รอบจบตามปกติ — ปล่อยตัวยกเลิก (ไม่ทำให้ตัวรอบเองกลายเป็นของเก่า) */
  release: () => void;
}

export interface RunGuard {
  begin: () => FlowRun;
  /** ยกเลิกรอบที่บินอยู่ — คืน `true` ถ้ามีรอบบินอยู่จริง (ผู้เรียกจะได้รู้ว่าต้องปล่อย `loading` แทนรอบนั้น) */
  cancel: () => boolean;
}

export function createRunGuard(): RunGuard {
  let current = 0;
  let controller: AbortController | null = null;

  return {
    begin() {
      controller?.abort(); // รอบใหม่ทับรอบเก่า
      const id = ++current;
      const own = new AbortController();
      controller = own;
      return {
        isStale: () => id !== current,
        signal: own.signal,
        release: () => {
          if (id === current && controller === own) controller = null;
        },
      };
    },
    cancel() {
      current += 1;
      const inFlight = controller !== null;
      controller?.abort();
      controller = null;
      return inFlight;
    },
  };
}
