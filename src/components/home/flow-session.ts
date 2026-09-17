"use client";

/**
 * 🔐 เซสชันดูดวงหนึ่งรอบ (ครึ่งหนึ่งของคำมั่น Provably-Fair) — ตัวลดเดียว (R-26 ขั้นที่ 2)
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้
 *
 * ของเดิมเก็บเซสชันไว้เป็น `useState` อิสระ **5 ตัว**:
 * `readingId` · `sessionToken` · `commitment` · `clientSeed` · `proof`
 * ทั้งห้าตัวคือ "ของชิ้นเดียวกัน" — เกิดพร้อมกันตอน `/api/reading/start` ตอบกลับ
 * และต้องตายพร้อมกันตอนผู้ใช้เริ่มรอบใหม่ แต่ของเดิมไม่มีอะไรผูกไว้เลย
 *
 * ## บั๊กสองแบบที่ตัวลดนี้ปิดโดยโครงสร้าง
 *
 * 1. **โทเคนถูกทับด้วยค่าว่าง** — โทเคนเซสชันหมุนใหม่ทุกครั้งที่ยิง `/shuffle`
 *    ของเดิมจึงต้องเขียน `if (data.sessionToken) setSessionToken(...)` ซ้ำ **4 จุด**
 *    ลืมจุดใดจุดหนึ่ง = โทเคนที่ใช้ได้ถูกเขียนทับด้วย `""` แล้วคำขอถัดไปถูกปฏิเสธ
 *    ที่นี่เขียนกฎ "ค่าว่างไม่ทับของเดิม" ไว้ในตัวลดจุดเดียว จุดเรียกลืมไม่ได้อีก
 *
 * 2. **หลักฐานของรอบที่ถูกทิ้งไปแล้วไหลเข้ารอบใหม่** — ผู้ใช้กด "เริ่มดูดวงใหม่"
 *    ระหว่างที่สตรีมเก่ายังวิ่ง เฟรม `done` ที่มาถึงทีหลังจะพก `proof` ของรอบเก่ามาด้วย
 *    ของเดิม `setProof(...)` รับทันทีโดยไม่ดูว่ายังมีเซสชันอยู่ไหม → แผงตรวจสอบ
 *    ความโปร่งใสจะโชว์หลักฐานของไพ่ชุดที่ผู้ใช้ไม่ได้เห็นแล้ว (ผิดกฎเหล็กข้อ 14 โดยปริยาย)
 *    ที่นี่ `proven` ถูกทิ้งเสมอถ้าไม่มี `readingId` อยู่
 *
 * ⚠️ ไฟล์นี้ **ไม่มี I/O และไม่พึ่ง React** จึงทดสอบได้ตรง ๆ
 * ด่าน `scripts/qa/test-flow-state.ts` ยิงลำดับการกระทำจริงใส่ตัวลดนี้
 */

/** หลักฐานที่เซิร์ฟเวอร์เปิดเผยหลังอ่านจบ — ผู้ใช้เอาไปตรวจซ้ำเองได้ */
export interface FairnessProof {
  serverSeed?: string;
  clientSeed?: string;
  commitment?: string;
  pickedIndices?: number[];
  deckSize?: number;
}

export interface SessionState {
  readingId: string | null;
  /** โทเคนของเซสชัน — หมุนใหม่ได้ระหว่างทาง ห้ามถูกทับด้วยค่าว่าง */
  token: string | null;
  /** คำมั่นของเซิร์ฟเวอร์ (hash ของ serverSeed) ที่ประกาศไว้ก่อนจั่ว */
  commitment: string;
  /** เมล็ดฝั่งผู้ใช้ — ห้ามว่างระหว่างที่เซสชันยังมีชีวิต */
  clientSeed: string;
  proof: FairnessProof;
}

export type SessionAction =
  /** สุ่มเมล็ดฝั่งผู้ใช้ก่อนยิง `/start` (ต้องมีก่อนเสมอ ห้ามให้เซิร์ฟเวอร์สุ่มแทน) */
  | { type: "seed"; clientSeed: string }
  /** `/start` ตอบกลับสำเร็จ */
  | { type: "started"; readingId: string; token?: string | null; commitment?: string | null; clientSeed?: string | null }
  /** โทเคนหมุนใหม่จาก `/shuffle` หรือ `/read` */
  | { type: "rotateToken"; token?: string | null }
  /** เฟรม `done` เปิดเผยหลักฐานครบชุด */
  | { type: "proven"; proof?: FairnessProof | null }
  /** กู้คืนจาก sessionStorage */
  | { type: "restore"; readingId: string | null; token: string | null; commitment: string; clientSeed: string; proof?: FairnessProof | null }
  /** เริ่มรอบใหม่ — ล้างทุกอย่างพร้อมกัน */
  | { type: "reset" };

export const SESSION_INITIAL: SessionState = {
  readingId: null,
  token: null,
  commitment: "",
  clientSeed: "",
  proof: {},
};

/** ค่าที่ "มีของจริง" เท่านั้นถึงจะเขียนทับของเดิมได้ */
const keep = (next: string | null | undefined, current: string): string => (next ? next : current);

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "seed":
      if (!action.clientSeed) return state; // เมล็ดว่างไม่ใช่เมล็ด
      return { ...state, clientSeed: action.clientSeed };
    case "started":
      return {
        readingId: action.readingId,
        token: action.token ? action.token : state.token,
        commitment: action.commitment ?? "",
        // เซิร์ฟเวอร์ไม่คืนเมล็ดกลับมา = ใช้เมล็ดที่เราสุ่มไว้ก่อนยิง ห้ามปล่อยให้ว่าง
        clientSeed: keep(action.clientSeed, state.clientSeed),
        proof: {},
      };
    case "rotateToken":
      // โทเคนว่าง/หายไป = คำขอนั้นไม่ได้หมุนโทเคน ไม่ใช่คำสั่งให้ลืมของเดิม
      return action.token ? { ...state, token: action.token } : state;
    case "proven":
      // ไม่มีเซสชันอยู่ = เฟรมนี้เป็นของรอบที่ถูกทิ้งไปแล้ว ห้ามรับ
      if (!state.readingId) return state;
      return { ...state, proof: action.proof ?? {} };
    case "restore":
      return {
        readingId: action.readingId ?? null,
        token: action.token ?? null,
        commitment: action.commitment ?? "",
        clientSeed: action.clientSeed ?? "",
        proof: action.proof ?? {},
      };
    case "reset":
      return SESSION_INITIAL;
    default:
      return state;
  }
}
