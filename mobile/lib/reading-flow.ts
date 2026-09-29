import type { ReadEvent, ReadingCardText, ReadingProof, ReadingResult, ShuffleResponse, StartResponse } from "@/lib/api/types";

/**
 * 🔮 state machine ของ "พิธีเปิดไพ่" 5 ขั้น (ดู mobile/DESIGN.md ข้อ 3)
 * ฟังก์ชันล้วน ไม่แตะเครือข่าย/หน้าจอ — เรียก API อยู่ที่ `useReadingFlow`
 *
 * กฎที่บังคับที่นี่ (มีเทสต์ใน __tests__/reading-flow.test.ts):
 *  - เลือกไพ่ได้ไม่เกินจำนวนตำแหน่งของผัง · แตะซ้ำ = ยกเลิก
 *  - ขั้นเปิดไพ่: ปลดล็อก "ให้แม่หมออ่าน" ได้เมื่อ "ผู้ใช้พลิกครบทุกใบเอง" เท่านั้น (กฎเหล็กข้อ 4)
 *  - คำอ่านที่สตรีมขาดก่อน `done` ไม่เคยกลายเป็นผลลัพธ์ (กฎเหล็กข้อ 14)
 */
export type Step = "ask" | "reader" | "ritual" | "reveal" | "result";
export const STEPS: Step[] = ["ask", "reader", "ritual", "reveal", "result"];
export const STEP_LABEL: Record<Step, string> = {
  ask: "ถาม",
  reader: "แม่หมอ",
  ritual: "เลือกไพ่",
  reveal: "เปิดไพ่",
  result: "คำอ่าน",
};

export type Topic = "general" | "love" | "work" | "money" | "self";

export interface PartialReading {
  opening?: string;
  cards: ReadingCardText[];
  connections?: string;
  summary?: string;
}

export interface FlowState {
  step: Step;
  /** ขั้นเลือกไพ่มีสองจังหวะ: ตั้งจิต (focus) → เลือกจากสำรับ (pick) */
  ritualPhase: "focus" | "pick";
  topic: Topic;
  question: string;
  personaId: string;
  session: StartResponse | null;
  picked: number[];
  shuffle: ShuffleResponse | null;
  flipped: number[];
  streaming: boolean;
  partial: PartialReading;
  result: ReadingResult | null;
  proof: ReadingProof | null;
  blockedMessage: string | null;
  error: string | null;
}

export const initialState = (init?: Partial<Pick<FlowState, "topic" | "question" | "personaId">>): FlowState => ({
  step: "ask",
  ritualPhase: "focus",
  topic: init?.topic ?? "general",
  question: init?.question ?? "",
  personaId: init?.personaId ?? "warm",
  session: null,
  picked: [],
  shuffle: null,
  flipped: [],
  streaming: false,
  partial: { cards: [] },
  result: null,
  proof: null,
  blockedMessage: null,
  error: null,
});

export type Action =
  | { type: "topic"; topic: Topic }
  | { type: "question"; text: string }
  | { type: "persona"; id: string }
  | { type: "goto"; step: Step }
  | { type: "started"; session: StartResponse }
  | { type: "blocked"; message: string }
  | { type: "focusDone" }
  | { type: "togglePick"; index: number; need: number }
  | { type: "shuffled"; shuffle: ShuffleResponse }
  | { type: "flip"; index: number }
  | { type: "readStart" }
  | { type: "stream"; event: ReadEvent }
  | { type: "readFailed"; message: string }
  | { type: "error"; message: string }
  | { type: "clearError" };

export function reducer(state: FlowState, action: Action): FlowState {
  switch (action.type) {
    case "topic":
      return { ...state, topic: action.topic };
    case "question":
      return { ...state, question: action.text };
    case "persona":
      return { ...state, personaId: action.id };
    case "goto":
      return { ...state, step: action.step, error: null };
    case "started":
      return { ...state, session: action.session, step: "ritual", ritualPhase: "focus", picked: [], error: null, blockedMessage: null };
    case "blocked":
      return { ...state, blockedMessage: action.message, step: "ask" };
    case "focusDone":
      return { ...state, ritualPhase: "pick" };
    case "togglePick": {
      if (state.picked.includes(action.index)) {
        return { ...state, picked: state.picked.filter((i) => i !== action.index) };
      }
      if (state.picked.length >= action.need) return state;
      return { ...state, picked: [...state.picked, action.index] };
    }
    case "shuffled":
      return {
        ...state,
        shuffle: action.shuffle,
        session: state.session ? { ...state.session, sessionToken: action.shuffle.sessionToken } : state.session,
        flipped: [],
        step: "reveal",
        error: null,
      };
    case "flip":
      return state.flipped.includes(action.index) ? state : { ...state, flipped: [...state.flipped, action.index] };
    case "readStart":
      return { ...state, streaming: true, partial: { cards: [] }, error: null };
    case "stream": {
      const ev = action.event;
      switch (ev.type) {
        case "reset":
          return { ...state, partial: { cards: [] } };
        case "opening":
          return { ...state, partial: { ...state.partial, opening: ev.text } };
        case "card": {
          const { type: _t, ...card } = ev;
          return { ...state, partial: { ...state.partial, cards: [...state.partial.cards, card] } };
        }
        case "connections":
          return { ...state, partial: { ...state.partial, connections: ev.text } };
        case "summary":
          return { ...state, partial: { ...state.partial, summary: ev.text } };
        case "done":
          // มีแต่ `done` เท่านั้นที่ทำให้เป็นผลลัพธ์จริง
          return { ...state, streaming: false, result: ev.reading, proof: ev.proof, step: "result" };
        default:
          return state;
      }
    }
    case "readFailed":
      // สตรีมล้ม/ขาดตอน — ทิ้งข้อความครึ่งเดียว กลับไปขั้นเปิดไพ่ให้กดอ่านใหม่ (หลังบ้านคืนสิทธิ์ให้เอง)
      return { ...state, streaming: false, partial: { cards: [] }, error: action.message, step: "reveal" };
    case "error":
      return { ...state, error: action.message };
    case "clearError":
      return { ...state, error: null };
  }
}

/** เลือกไพ่ครบตามจำนวนตำแหน่งแล้วหรือยัง */
export const canConfirmPick = (s: FlowState, need: number) => s.picked.length === need;

/** พลิกครบทุกใบ (ด้วยมือผู้ใช้เอง) แล้วหรือยัง */
export const allFlipped = (s: FlowState) => !!s.shuffle && s.flipped.length === s.shuffle.cards.length;

/** ปิดพิธีกลางทางแล้วเสียของไหม — ขั้น 1–2 ยังไม่มีอะไรเสีย จึงไม่ต้องยืนยัน */
export const needsExitConfirm = (s: FlowState) => s.step !== "ask" && s.step !== "reader" && s.step !== "result";

/** คำถามแนะนำตามหัวข้อ — เจ้าของแก้ข้อความได้ที่นี่ที่เดียว */
export const SUGGESTED_QUESTIONS: Record<Topic, string[]> = {
  general: ["ช่วงนี้ฉันควรใส่ใจเรื่องอะไรมากที่สุด", "พลังงานของสัปดาห์นี้เป็นอย่างไร"],
  love: ["ความสัมพันธ์ตอนนี้กำลังไปทางไหน", "ฉันควรทำอย่างไรกับเรื่องหัวใจ"],
  work: ["งานตอนนี้ควรเดินต่อไปทางไหน", "โอกาสด้านการงานในช่วงถัดไปเป็นอย่างไร"],
  money: ["สถานการณ์การเงินของฉันช่วงนี้เป็นอย่างไร", "ฉันควรระวังหรือเริ่มทำอะไรเรื่องเงิน"],
  self: ["ตอนนี้ใจฉันต้องการอะไรจริง ๆ", "ฉันควรปล่อยวางเรื่องอะไร"],
};

export const TOPIC_LABEL: Record<Topic, string> = {
  general: "ทั่วไป",
  love: "ความรัก",
  work: "การงาน",
  money: "การเงิน",
  self: "ตัวเอง",
};

/** ผังที่แนะนำของแต่ละหัวข้อ (ต้องเป็น id ที่มีจริงใน `PUBLIC_SPREADS` — มีเทสต์ตรวจ) */
export const TOPIC_SPREAD: Record<Topic, string> = {
  general: "three-card",
  love: "love",
  work: "career",
  money: "money",
  self: "mind-body-spirit",
};

/**
 * ชื่อตำแหน่งในข้อมูลผังมีเลขนำหน้าและวงเล็บอธิบาย เช่น "1. อดีต (ที่มาของเรื่องนี้)"
 * — แอปแสดงเลขเองและแยกคำอธิบายไว้บรรทัดรอง จึงต้องแกะออกเป็นสองส่วน (ไม่แก้ข้อมูลกลางของเว็บ)
 */
export function splitPositionName(nameTh: string): { short: string; hint?: string } {
  const bare = nameTh.replace(/^\s*\d+\.\s*/, "").trim();
  const m = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(bare);
  return m && m[1] ? { short: m[1], hint: m[2] } : { short: bare };
}
