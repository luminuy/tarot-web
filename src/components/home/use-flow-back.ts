"use client";

import { useEffect, useRef } from "react";

import type { RitualStep } from "@/components/home/ritual-step";

/**
 * ✦ ปุ่มย้อนกลับของเบราว์เซอร์ในพิธีเปิดไพ่
 * ---------------------------------------------------------------------------
 * ทุกขั้นของพิธีอยู่ใน URL เดียวกัน (`/` หรือ `/read/<ผัง>`) ประวัติของเบราว์เซอร์จึงไม่มีอะไร
 * ให้ย้อน — ผู้ใช้กดย้อนกลับจากขั้นตั้งคำถามแล้ว "ไม่เกิดอะไร" หรือหลุดออกจากเว็บไปเลย
 *
 * วิธีแก้: ตอนอยู่ในขั้นที่ย้อนได้โดยไม่เสียอะไร (ยังไม่เปิดไพ่) ให้มีรายการประวัติ "กันชน" ไว้หนึ่งอัน
 * กดย้อนกลับ = กินกันชนนั้น ➔ เราถอยขั้นเอง ➔ ถ้าขั้นใหม่ยังย้อนได้อีก ก็วางกันชนใหม่
 * กันชนมีไม่เกินหนึ่งอันเสมอ ประวัติจึงไม่บวมและไม่มีการกดย้อนกลับที่ "ไม่เกิดอะไร"
 *
 * ⚠️ พ้นขั้นเลือกไพ่แล้ว (READING / SUMMARY) ห้ามย้อน — สิทธิ์ถูกหักและไพ่ถูกตรึงแล้ว
 *    ตอนเข้าขั้นนั้นเราถอนกันชนทิ้งเงียบ ๆ กดย้อนกลับครั้งถัดไปจึงออกจากหน้าตามปกติ
 */

const MARK = "tarotFlowBack";

/**
 * ขั้นนี้ควรมีกันชนไหม — ตรรกะล้วน (ด่าน test-flow-state เฝ้าอยู่)
 * @param hasSpreadSelect หน้านี้มีขั้นเลือกผังไหม (หน้าแรก = มี · `/read/<ผัง>` = ไม่มี ขั้นแรกคือตั้งคำถาม)
 */
export function wantsBackEntry(step: RitualStep, hasSpreadSelect: boolean): boolean {
  if (step === "SHUFFLE" || step === "PICK_CARDS") return true;
  return step === "INTENTION_SELECT" && hasSpreadSelect;
}

export function useFlowBackButton(step: RitualStep, hasSpreadSelect: boolean, onBack: () => void): void {
  const hasEntryRef = useRef(false);
  /** เราเรียก `history.back()` เองเพื่อถอนกันชน — popstate รอบนั้นห้ามนับเป็นการกดของผู้ใช้ */
  const ignorePopRef = useRef(false);
  const onBackRef = useRef(onBack);
  const wantRef = useRef(false);

  useEffect(() => {
    onBackRef.current = onBack;
    wantRef.current = wantsBackEntry(step, hasSpreadSelect);
  });

  useEffect(() => {
    // รีเฟรชหน้าตอนยืนอยู่บนกันชน = กันชนยังอยู่ ไม่ต้องวางซ้ำ
    hasEntryRef.current = Boolean((window.history.state as Record<string, unknown> | null)?.[MARK]);
    const onPop = (e: PopStateEvent) => {
      if (ignorePopRef.current) {
        ignorePopRef.current = false;
        return;
      }
      // กดไปข้างหน้ากลับมาที่กันชน — ขั้นปัจจุบันไม่ต้องการกันชนแล้ว (เช่นย้อนมาเลือกผังแล้ว)
      // ให้ถอยกลับเงียบ ๆ ไม่งั้นกดย้อนกลับครั้งถัดไปจะ "ไม่เกิดอะไร"
      if ((e.state as Record<string, unknown> | null)?.[MARK]) {
        if (wantRef.current) {
          hasEntryRef.current = true;
        } else {
          ignorePopRef.current = true;
          window.history.back();
        }
        return;
      }
      if (!hasEntryRef.current) return;
      hasEntryRef.current = false;
      onBackRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const want = wantsBackEntry(step, hasSpreadSelect);
    if (want && !hasEntryRef.current) {
      const state = (window.history.state as Record<string, unknown> | null) ?? {};
      window.history.pushState({ ...state, [MARK]: true }, "");
      hasEntryRef.current = true;
    } else if (!want && hasEntryRef.current) {
      hasEntryRef.current = false;
      ignorePopRef.current = true;
      window.history.back();
    }
  }, [step, hasSpreadSelect]);
}
