/**
 * สัญญา response ของ route ที่แอปเรียก — ต้องตรงกับ `src/app/api/**` ของเว็บ
 * กติกา (แผน IOS_APP_PLAN 4.6): แอปเวอร์ชันเก่าอยู่ในมือผู้ใช้หลายเดือน
 * ฝั่งเว็บ **เพิ่มฟิลด์ได้อย่างเดียว ห้ามลบ/เปลี่ยนชื่อ** ฟิลด์ที่อยู่ในไฟล์นี้
 */

export interface StartResponse {
  id: string;
  readingId: string;
  commitment: string;
  clientSeed?: string;
  sessionToken: string;
  spread: {
    id: string;
    nameTh: string;
    nameEn: string;
    positions: { index: number; nameTh: string; nameEn?: string; meaning: string }[];
  };
}

/** `/start` ตอบ 200 พร้อม `blocked` เมื่อคำถามชนกฎความปลอดภัย (มีสายด่วนในข้อความ) */
export interface StartBlocked {
  blocked: true;
  message: string;
}

export interface DrawnCard {
  order: number;
  cardIndex: number;
  isReversed: boolean;
}

export interface ShuffleResponse {
  clientSeed?: string;
  drawn: DrawnCard[];
  sessionToken: string;
  cards: {
    id: string;
    nameTh: string;
    nameEn: string;
    image: string;
    element: string;
    keywords: string[];
  }[];
}

export interface ReadingCardText {
  position: number;
  headline: string;
  visualAnchor?: string;
  reading: string;
}

export interface ReadingResult {
  opening: string;
  cards: ReadingCardText[];
  connections: string;
  summary: string;
}

export interface ReadingProof {
  serverSeed: string;
  clientSeed?: string;
  commitment: string;
  pickedIndices?: number[];
  deckSize: number;
  derivation?: { kind: string };
}

/** เหตุการณ์ที่ `/read` สตรีมกลับมา (SSE) */
export type ReadEvent =
  | { type: "opening"; text: string }
  | ({ type: "card" } & ReadingCardText)
  | { type: "connections"; text: string }
  | { type: "summary"; text: string }
  | { type: "reset" }
  | {
      type: "done";
      reading: ReadingResult;
      disclosure: string;
      proof: ReadingProof;
      fallback?: boolean;
    }
  | { type: "error"; message: string; code?: string };

export interface ApiErrorBody {
  error?: string;
  reason?: string;
  code?: string;
  blocked?: boolean;
  message?: string;
}
