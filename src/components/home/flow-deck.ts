"use client";

/**
 * 🃏 สำรับไพ่ของรอบนี้ — ก้อนเดียว ตัวลดเดียว (R-26 ขั้นที่ 2)
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้
 *
 * ของเดิมใน `TarotFlow.tsx` เก็บสำรับไว้เป็น `useState` อิสระ **4 ตัว**:
 * `pickedIndices` · `drawnCards` · `revealedOrders` · `activeCardIndex`
 * ทั้งสี่ตัวต้องตรงกันตลอดเวลา แต่ไม่มีอะไรบังคับเลยสักอย่าง — สถานะที่ผิดกติกา
 * อย่าง "ไพ่ที่เปิดหน้าแล้วมี order 5 แต่ในสำรับมีแค่ 3 ใบ" เขียนออกมาได้โดยไม่มีใครห้าม
 *
 * ## กฎเหล็กสองข้อที่ไฟล์นี้บังคับให้เป็นจริงโดยโครงสร้าง
 *
 * - **ข้อ 4 (Manual Self-Reveal)** — จั่วไพ่ชุดใหม่เมื่อไหร่ `revealed` ต้องกลับเป็นว่างเสมอ
 *   ไพ่ทุกใบเริ่มคว่ำหน้า ให้ผู้ใช้แตะพลิกเอง · ที่นี่เขียนไว้ในตัวลดจุดเดียว
 *   ของเดิมต้องจำไปเรียก `setRevealedOrders([])` ให้ครบทุกจุดที่จั่วไพ่ (มีสองจุด)
 *
 * - **ข้อ 14 (Zero Fabricated Cards)** — พลิก/เพ่ง `order` ที่ไม่มีอยู่ในสำรับไม่ได้
 *   ของเดิม `setRevealedOrders` รับเลขอะไรก็ได้ · ถ้าเฟรมที่มาช้าหรือสถานะที่กู้คืนมาพัง
 *   ส่ง order ที่ไม่มีจริงเข้ามา หน้าจอจะพยายามแสดงไพ่ที่ไม่มีข้อมูล
 *   ตัวลดนี้ทิ้ง order ที่ไม่มีในสำรับเสมอ — ไม่กุขึ้นมาใหม่ และไม่ยอมรับของปลอม
 *
 * ⚠️ ไฟล์นี้ **ไม่มี I/O และไม่พึ่ง React** จึงทดสอบได้ตรง ๆ
 * ด่าน `scripts/qa/test-flow-state.ts` ยิงลำดับการกระทำจริงใส่ตัวลดนี้
 */

import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";

export interface DeckState {
  /** ลำดับใบที่ผู้ใช้แตะเลือกจากพัดไพ่ (เก็บ index ของพัด ไม่ใช่เลขไพ่) */
  picked: number[];
  /** ไพ่ที่เซิร์ฟเวอร์จั่วให้จริง — แหล่งความจริงเดียวของรอบนี้ */
  cards: DrawnSlotCard[];
  /** `order` ของไพ่ที่ผู้ใช้พลิกหงายแล้ว */
  revealed: number[];
  /** `order` ของไพ่ที่กำลังอ่านอยู่ */
  activeOrder: number;
}

export type DeckAction =
  /** ผู้ใช้แตะไพ่ในพัด — `capacity` คือจำนวนใบที่ผังนี้ต้องการ */
  | { type: "pick"; fanIndex: number; capacity: number }
  /** ถอยกลับหนึ่งใบ (ใช้ตอนส่งไพ่ให้เซิร์ฟเวอร์แล้วล้มเหลว) */
  | { type: "undoLastPick" }
  /** เซิร์ฟเวอร์คืนไพ่ที่จั่วแล้ว — เริ่มคว่ำหน้าทั้งหมดเสมอ (กฎเหล็กข้อ 4) */
  | { type: "deal"; cards: DrawnSlotCard[] }
  /** ผู้ใช้แตะพลิกไพ่หนึ่งใบ (พลิกกลับได้) */
  | { type: "toggleReveal"; order: number }
  /** เปิดทั้งหมดในครั้งเดียว (ปุ่ม "เปิดไพ่ทั้งหมด") */
  | { type: "revealAll" }
  /** เลื่อนสายตาไปที่ไพ่ใบหนึ่งโดยไม่พลิก */
  | { type: "focus"; order: number }
  /** กู้คืนจาก sessionStorage — ข้อมูลจากนอกโปรแกรม จึงต้องกรองก่อนเสมอ */
  | { type: "restore"; picked: number[]; cards: DrawnSlotCard[]; revealed: number[]; activeOrder: number }
  /** ย้อนกลับไปขั้นสับไพ่: ทิ้งไพ่ที่จับไว้ แต่ยังไม่เริ่มรอบใหม่ */
  | { type: "clearDraw" }
  /** เริ่มรอบใหม่ทั้งหมด */
  | { type: "reset" };

export const DECK_INITIAL: DeckState = { picked: [], cards: [], revealed: [], activeOrder: 0 };

/** `order` ที่มีไพ่จริงรองรับอยู่เท่านั้น — ใช้กรองทุกอย่างที่มาจากนอกตัวลด */
const hasOrder = (cards: DrawnSlotCard[], order: number): boolean =>
  cards.some((c) => c.order === order);

export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case "pick": {
      // แตะซ้ำใบเดิม หรือแตะเกินจำนวนที่ผังต้องการ = ไม่มีผล (ของเดิมเช็กที่จุดเรียก)
      if (state.picked.includes(action.fanIndex)) return state;
      if (state.picked.length >= action.capacity) return state;
      return { ...state, picked: [...state.picked, action.fanIndex] };
    }
    case "undoLastPick":
      return state.picked.length === 0 ? state : { ...state, picked: state.picked.slice(0, -1) };
    case "deal":
      /*
       * ⚠️ กฎเหล็กข้อ 4 — ไพ่ชุดใหม่ต้องคว่ำหน้าเสมอ
       * เขียนไว้ที่นี่จุดเดียว จุดเรียกจึงลืมไม่ได้อีก
       */
      return { ...state, cards: action.cards, revealed: [], activeOrder: 0 };
    case "toggleReveal": {
      // กฎเหล็กข้อ 14 — ไม่มีไพ่ใบนั้นจริง ก็พลิกไม่ได้
      if (!hasOrder(state.cards, action.order)) return state;
      const revealed = state.revealed.includes(action.order)
        ? state.revealed.filter((o) => o !== action.order)
        : [...state.revealed, action.order];
      return { ...state, revealed, activeOrder: action.order };
    }
    case "revealAll":
      return { ...state, revealed: state.cards.map((c) => c.order) };
    case "focus":
      if (!hasOrder(state.cards, action.order)) return state;
      return { ...state, activeOrder: action.order };
    case "restore": {
      /*
       * ของที่มาจาก sessionStorage ถือเป็นข้อมูลนอกโปรแกรม — กรองทุกฟิลด์
       * (ผู้ใช้แก้ sessionStorage เองได้ · ของเก่าจากเวอร์ชันก่อนหน้าอาจคนละรูป)
       */
      const cards = Array.isArray(action.cards) ? action.cards : [];
      const revealed = (Array.isArray(action.revealed) ? action.revealed : []).filter((o) =>
        hasOrder(cards, o),
      );
      const activeOrder = hasOrder(cards, action.activeOrder) ? action.activeOrder : 0;
      return {
        picked: Array.isArray(action.picked) ? action.picked : [],
        cards,
        revealed,
        activeOrder,
      };
    }
    case "clearDraw":
      // ถอยกลับไปขั้นสับไพ่ — เก็บ `activeOrder` ไว้เหมือนของเดิม (ไม่มีไพ่ให้เพ่งอยู่แล้ว)
      return { ...state, picked: [], cards: [], revealed: [] };
    case "reset":
      return DECK_INITIAL;
    default:
      return state;
  }
}
