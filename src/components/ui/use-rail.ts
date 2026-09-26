import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { smoothScrollBehavior } from "@/lib/use-motion-safe";

/**
 * ⬅️➡️ สถานะแถวปัดฝั่ง React (คู่กับ `RailArrows`) — ใช้ได้ทุกความกว้างจอ
 * ---------------------------------------------------------------------------
 * หน้าแรกจัดวางแบบเดียวกันทั้งมือถือและจอใหญ่ (คำสั่งเจ้าของ 2026-09-26): การ์ดเรียงเป็นแถวปัด
 * ลูกศรแบบ apple.com ชิดขวา · ความกว้างการ์ดต่างกันตามจอ จึงวัดจากการ์ดใบแรกจริง
 * ไม่เดาจาก `82vw` / `310px` แบบของเดิม (ของเดิมถูกเฉพาะมือถือ)
 *
 * - `activeIndex` = ใบที่อยู่ชิดซ้ายของแถวตอนนี้ (ใช้ตัดสินว่าจะวาดภาพใบไหนก่อน)
 * - `canPrev` / `canNext` มาจากตำแหน่งเลื่อนจริง — ถึงท้ายแถวแล้วปุ่มขวาจาง แม้ `activeIndex` ยังไม่ใช่ใบสุดท้าย
 *   (จอใหญ่เห็นหลายใบพร้อมกัน ใบสุดท้ายไม่มีวันชิดซ้ายได้)
 * - การ์ดพอดีแถว ไม่ต้องเลื่อน ➔ ทั้งสองปุ่มเป็น false · `RailArrows` ซ่อนตัวเอง
 */
export function useRail(ref: RefObject<HTMLElement | null>, count: number, paused = false) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(count > 1);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const stepOf = (el: HTMLElement): number => {
    const first = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 12;
    return first ? first.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
  };

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
    const idx = Math.round(el.scrollLeft / stepOf(el));
    setActiveIndex(Math.max(0, Math.min(idx, count - 1)));
  }, [ref, count]);

  /** ⚠️ หยุดฟังระหว่างที่มีป๊อปอัพเปิดอยู่ (INC-0137 — เรนเดอร์รัวกลางอนิเมชันขาเข้า = กระพริบ) */
  const onScroll = useCallback(() => {
    if (!pausedRef.current) sync();
  }, [sync]);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync, { passive: true });
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  const go = useCallback(
    (dir: -1 | 1) => {
      const el = ref.current;
      if (el) el.scrollBy({ left: dir * stepOf(el), behavior: smoothScrollBehavior() });
    },
    [ref]
  );

  return {
    activeIndex,
    canPrev,
    canNext,
    onScroll,
    sync,
    prev: () => go(-1),
    next: () => go(1),
  };
}
