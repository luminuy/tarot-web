import { PUBLIC_SPREADS } from "../../src/data/spreads";
import {
  STEPS,
  TOPIC_SPREAD,
  allFlipped,
  canConfirmPick,
  initialState,
  needsExitConfirm,
  reducer,
  splitPositionName,
  type Action,
  type FlowState,
} from "../lib/reading-flow";
import type { ShuffleResponse, StartResponse } from "../lib/api/types";

const session = { id: "r1", readingId: "r1", commitment: "c", sessionToken: "t1", spread: { id: "three-card" } } as unknown as StartResponse;
const shuffle = {
  drawn: [0, 1, 2].map((i) => ({ order: i, cardIndex: i, isReversed: false })),
  sessionToken: "t2",
  cards: [0, 1, 2].map((i) => ({ id: `major-0${i}`, nameTh: "", nameEn: "", image: "", element: "", keywords: [] })),
} as unknown as ShuffleResponse;

const run = (actions: Action[], from: FlowState = initialState()) => actions.reduce(reducer, from);

describe("พิธีเปิดไพ่ — state machine", () => {
  it("เริ่มที่ขั้นถาม และมี 5 ขั้นตามลำดับ", () => {
    expect(initialState().step).toBe("ask");
    expect(STEPS).toEqual(["ask", "reader", "ritual", "reveal", "result"]);
  });

  it("เลือกไพ่ได้ไม่เกินจำนวนตำแหน่ง แตะซ้ำคือยกเลิก", () => {
    const s = run([
      { type: "started", session },
      { type: "togglePick", index: 5, need: 2 },
      { type: "togglePick", index: 9, need: 2 },
      { type: "togglePick", index: 11, need: 2 },
    ]);
    expect(s.picked).toEqual([5, 9]);
    expect(canConfirmPick(s, 2)).toBe(true);
    const undone = reducer(s, { type: "togglePick", index: 5, need: 2 });
    expect(undone.picked).toEqual([9]);
    expect(canConfirmPick(undone, 2)).toBe(false);
  });

  it("ปลดล็อกให้แม่หมออ่านได้เมื่อผู้ใช้พลิกครบทุกใบเองเท่านั้น (กฎเหล็กข้อ 4)", () => {
    let s = run([{ type: "started", session }, { type: "shuffled", shuffle }]);
    expect(s.step).toBe("reveal");
    expect(s.flipped).toEqual([]); // เริ่มคว่ำเสมอ
    expect(allFlipped(s)).toBe(false);
    s = run([{ type: "flip", index: 0 }, { type: "flip", index: 0 }, { type: "flip", index: 1 }], s);
    expect(s.flipped).toEqual([0, 1]); // พลิกซ้ำไม่นับซ้ำ
    expect(allFlipped(s)).toBe(false);
    s = reducer(s, { type: "flip", index: 2 });
    expect(allFlipped(s)).toBe(true);
    expect(s.session?.sessionToken).toBe("t2"); // ใช้โทเคนใหม่จาก /shuffle
  });

  it("สตรีมขาดก่อน done ไม่เคยกลายเป็นผลลัพธ์ · ล้มแล้วกลับขั้นเปิดไพ่ (กฎเหล็กข้อ 14)", () => {
    let s = run([
      { type: "started", session },
      { type: "shuffled", shuffle },
      { type: "readStart" },
      { type: "stream", event: { type: "opening", text: "สวัสดี" } },
      { type: "stream", event: { type: "card", position: 0, headline: "ใบแรก", reading: "..." } },
    ]);
    expect(s.partial.cards).toHaveLength(1);
    expect(s.result).toBeNull();
    s = reducer(s, { type: "readFailed", message: "คำอ่านขาดตอน" });
    expect(s.result).toBeNull();
    expect(s.partial).toEqual({ cards: [] });
    expect(s.step).toBe("reveal");
    expect(s.error).toBe("คำอ่านขาดตอน");
  });

  it("done เท่านั้นที่พาไปขั้นผลลัพธ์ และ reset ล้างข้อความครึ่งเดียว", () => {
    const reading = { opening: "a", cards: [], connections: "b", summary: "c" };
    const proof = { serverSeed: "s", commitment: "c", deckSize: 78 };
    let s = run([
      { type: "readStart" },
      { type: "stream", event: { type: "opening", text: "x" } },
      { type: "stream", event: { type: "reset" } },
    ]);
    expect(s.partial).toEqual({ cards: [] });
    s = reducer(s, { type: "stream", event: { type: "done", reading, disclosure: "", proof } });
    expect(s.step).toBe("result");
    expect(s.result).toEqual(reading);
    expect(s.streaming).toBe(false);
  });

  it("ขอยืนยันก่อนปิดเฉพาะขั้นที่มีของเสีย", () => {
    const at = (step: FlowState["step"]) => needsExitConfirm({ ...initialState(), step });
    expect([at("ask"), at("reader"), at("ritual"), at("reveal"), at("result")]).toEqual([false, false, true, true, false]);
  });

  it("คำถามอันตรายพากลับขั้นถามพร้อมข้อความสายด่วน", () => {
    const s = run([{ type: "started", session }, { type: "blocked", message: "โทร 1323" }]);
    expect(s.step).toBe("ask");
    expect(s.blockedMessage).toBe("โทร 1323");
  });
});

describe("ผังแนะนำตามหัวข้อ", () => {
  it("ทุกหัวข้อชี้ไปผังสาธารณะที่มีจริง", () => {
    const ids = new Set(PUBLIC_SPREADS.map((s) => s.id));
    for (const [topic, id] of Object.entries(TOPIC_SPREAD)) {
      expect({ topic, exists: ids.has(id) }).toEqual({ topic, exists: true });
    }
  });
});

describe("ชื่อตำแหน่ง", () => {
  it("ตัดเลขนำหน้าและแยกวงเล็บเป็นคำอธิบาย", () => {
    expect(splitPositionName("1. อดีต (ที่มาของเรื่องนี้)")).toEqual({ short: "อดีต", hint: "ที่มาของเรื่องนี้" });
    expect(splitPositionName("อนาคต")).toEqual({ short: "อนาคต" });
    expect(splitPositionName("10. ผลลัพธ์")).toEqual({ short: "ผลลัพธ์" });
  });

  it("ทุกตำแหน่งของทุกผังสาธารณะแกะได้ชื่อสั้นไม่ว่าง", () => {
    for (const spread of PUBLIC_SPREADS) {
      for (const pos of spread.positions) {
        expect({ id: spread.id, i: pos.index, ok: splitPositionName(pos.nameTh).short.length > 0 }).toEqual({ id: spread.id, i: pos.index, ok: true });
      }
    }
  });
});
