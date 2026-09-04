"use client";

import { useEffect, useRef } from "react";

/**
 * เรียก `callback` เป็นรอบ ๆ เฉพาะตอนที่แท็บถูกมองเห็นอยู่เท่านั้น (document.visibilityState === "visible")
 * แท็บที่ถูกซ่อนไม่ควรยิงคำขอต่อ เพื่อประหยัดโควตา Cloudflare D1
 * และยิงทันที 1 ครั้งตอนผู้ใช้กลับมาที่แท็บ เพื่อให้ข้อมูลสดทันทีที่เห็นหน้าจอ
 */
export function useVisibleInterval(callback: () => void, ms: number) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      cbRef.current();
      timer = setInterval(() => cbRef.current(), ms);
    };

    const onVisibility = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    };

    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [ms]);
}
