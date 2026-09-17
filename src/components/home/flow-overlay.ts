"use client";

/**
 * 🎛️ สถานะของหน้าต่างลอยทั้งหมดใน `TarotFlow` — ก้อนเดียว ตัวลดเดียว (R-26 ขั้นที่ 1)
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้
 *
 * รอบตรวจ 2026-09-17: `TarotFlow` เป็นฟังก์ชันเดียว **1,910 บรรทัด** มี `useState` **37 ตัว**
 * สถานะอิสระ 37 ตัวแปลว่าการแก้อะไรสักอย่างต้องคิดเผื่อสถานะที่เป็นไปได้จำนวนมหาศาล
 * ซึ่งไม่มีใครทำจริง — การแก้ที่นั่นจึงทำด้วยความหวัง
 *
 * ผู้ตรวจแนะนำให้ **"ทำแค่ขั้นยุบเป็น reducer ขั้นเดียวก่อน อย่าเพิ่งแยกคอมโพเนนต์"**
 * ไฟล์นี้คือขั้นแรกนั้น เริ่มจากกลุ่มที่พิสูจน์ความถูกต้องได้ชัดที่สุด: **หน้าต่างลอย 8 ตัว**
 *
 * ## ทำไมเริ่มที่กลุ่มนี้
 *
 * หน้าต่างลอยทุกบานเป็น **modal ที่กินทั้งจอ** — โดยความหมายแล้วเปิดพร้อมกันไม่ได้
 * แต่ของเดิมเก็บเป็น boolean อิสระ 6 ตัว + อีก 2 ตัวที่เป็น object
 * ซึ่งแปลว่าสถานะ "เปิดสองบานพร้อมกัน" **เป็นไปได้ในโค้ด** และไม่มีอะไรห้ามไว้
 *
 * ยุบเป็น union ตัวเดียวแล้ว สถานะนั้นหายไปจากประเภทข้อมูลเลย ไม่ใช่แค่ "ไม่ค่อยเกิด"
 *
 * ⚠️ ไฟล์นี้ **ไม่มี I/O และไม่พึ่ง React** นอกจาก type ของ reducer จึงทดสอบได้ตรง ๆ
 * ด่าน `scripts/qa/test-flow-overlay.ts` ยิงลำดับการกระทำจริงใส่ตัวลดนี้
 */

import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import type { UpgradeReason } from "@/lib/entitlement/copy";

/** หน้าต่างลอยที่เปิดอยู่ — `null` แปลว่าไม่มีบานไหนเปิดเลย */
export type OverlayState =
  | null
  | { kind: "share" }
  | { kind: "history" }
  | { kind: "auth"; mode: "signin" | "signup"; fromWall: boolean }
  | { kind: "buyCredits" }
  | { kind: "upgrade"; reason: UpgradeReason }
  | { kind: "zoomCard"; card: DrawnSlotCard };

export type OverlayAction =
  | { type: "closeAll" }
  | { type: "openShare" }
  | { type: "openHistory" }
  | { type: "openAuth"; mode: "signin" | "signup"; fromWall: boolean }
  | { type: "openBuyCredits" }
  | { type: "openUpgrade"; reason: UpgradeReason }
  | { type: "openZoomCard"; card: DrawnSlotCard }
  /** ปิดเฉพาะบานที่ระบุ — กันการปิดบานที่เพิ่งถูกเปิดทับไปแล้ว */
  | { type: "close"; kind: NonNullable<OverlayState>["kind"] };

export const OVERLAY_INITIAL: OverlayState = null;

export function overlayReducer(state: OverlayState, action: OverlayAction): OverlayState {
  switch (action.type) {
    case "closeAll":
      return null;
    case "openShare":
      return { kind: "share" };
    case "openHistory":
      return { kind: "history" };
    case "openAuth":
      return { kind: "auth", mode: action.mode, fromWall: action.fromWall };
    case "openBuyCredits":
      return { kind: "buyCredits" };
    case "openUpgrade":
      return { kind: "upgrade", reason: action.reason };
    case "openZoomCard":
      return { kind: "zoomCard", card: action.card };
    case "close":
      /*
       * ⚠️ ต้องเทียบชนิดก่อนปิดเสมอ
       * เคสจริงที่เกิดได้: ผู้ใช้กด "เติมสิทธิ์" จากในหน้าต่างอัปเกรด ➔ เปิดหน้าต่างเติมสิทธิ์ทับ
       * แล้ว `onClose` ของหน้าต่างอัปเกรดยิงตามมาทีหลัง — ถ้าปิดแบบไม่ดูชนิด
       * หน้าต่างเติมสิทธิ์ที่เพิ่งเปิดจะถูกปิดทิ้งทันทีโดยที่ผู้ใช้ไม่ได้สั่ง
       */
      return state?.kind === action.kind ? null : state;
    default:
      return state;
  }
}

/* ── ตัวช่วยอ่านสถานะ ให้จุดเรียกอ่านง่ายเท่าเดิม ── */
export const isOverlay = <K extends NonNullable<OverlayState>["kind"]>(
  state: OverlayState,
  kind: K,
): state is Extract<NonNullable<OverlayState>, { kind: K }> => state?.kind === kind;
