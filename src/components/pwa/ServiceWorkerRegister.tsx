"use client";

import { useEffect } from "react";

import {
  isServiceWorkerAllowed,
  setupServiceWorker,
  type SwContainerLike,
} from "./sw-register";

/**
 * คอมโพเนนต์ลงทะเบียน Service Worker ฝั่งไคลเอนต์ (Progressive Enhancement)
 * -------------------------------------------------------------
 * ⚠️ **ตรรกะทั้งหมดอยู่ใน `sw-register.ts` โดยตั้งใจ ห้ามย้ายกลับมาที่นี่**
 *
 * บทเรียน R-01: บั๊กที่ทำให้ผู้ใช้ใหม่ทุกคนโหลดทั้งหน้าสองรอบ อยู่ในตรรกะ 5 บรรทัด
 * ที่เคยฝังอยู่ใน `useEffect` ของไฟล์นี้ — ทดสอบไม่ได้เลยถ้าไม่มี jsdom ทั้งชุด
 * จึงรอดสายตามาตลอดจนมีคนยิง Lighthouse แล้วเห็นว่าเอกสารถูกขอสองครั้ง
 *
 * ไฟล์นี้จึงเหลือหน้าที่เดียว: ต่อสภาพแวดล้อมจริงของเบราว์เซอร์เข้ากับตรรกะที่ทดสอบได้
 * ด่าน `scripts/qa/test-sw-reload.ts` เฝ้าอยู่ว่าตรรกะไม่ย้ายกลับมา
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (!isServiceWorkerAllowed(window.location.protocol, window.location.hostname)) return;

    return setupServiceWorker({
      container: navigator.serviceWorker as unknown as SwContainerLike,
      reload: () => window.location.reload(),
      isDocumentReady: () => document.readyState === "complete",
      onWindowLoad: (fn) => window.addEventListener("load", fn, { once: true }),
      offWindowLoad: (fn) => window.removeEventListener("load", fn),
      log: (level, message, detail) => {
        if (level === "warn") console.warn(message, detail);
        else console.info(message);
      },
    });
  }, []);

  return null;
}
