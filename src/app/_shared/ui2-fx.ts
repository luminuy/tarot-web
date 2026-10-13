/**
 * 🎨 SeerTarot UI 2.0 — ระดับเอฟเฟกต์ `<html data-fx="full | lite | off">` (แผน UI_2_0 หัวข้อ 3)
 * ===========================================================================
 *
 * สคริปต์บรรทัดเดียวที่ต้องรันใน `<head>` **ก่อนวาดเฟรมแรก** ทั้งสองแม่พิมพ์
 * (`astro/layouts/BaseLayout.astro` และ `src/app/_shared/RootHtml.tsx`) — ด่าน `test-ui2-fx` ตรวจทุกหน้าใน dist/
 *
 *   full = คอม · แท็บเล็ต/iPad (จอ ≥ 768px) ที่ไม่ใช่เครื่องสเปกต่ำ — เอฟเฟกต์ตามภาพต้นแบบ D+ ครบ
 *   lite = มือถือ · จอสัมผัสด้านสั้น < 600px · RAM ≤ 4GB · โหมดประหยัดข้อมูล · เครื่องที่ตกเกณฑ์ FPS
 *   off  = ผู้ใช้ตั้งลดการเคลื่อนไหว (`prefers-reduced-motion: reduce`)
 *
 * ⚠️ ห้ามย้ายไปตั้งใน React หลัง hydrate — หน้าแวบเป็น full แล้วค่อยลด = กระตุก + CLS (กับดักข้อ 3)
 * ⚠️ ห้ามใช้ `navigator.hardwareConcurrency` — Safari บน iPad รายงานค่าไม่ตรง iPad จะโดนลดเป็น lite ผิด ๆ
 *    ทั้งที่เจ้าของสั่งให้ iPad ได้เต็ม (กับดักข้อ 4)
 * ⚠️ ไม่มี JS / สคริปต์พัง = ไม่มี `data-fx` ➔ CSS ตั้งต้นทุกตัวต้องได้หน้าตา lite (ค่าปลอดภัย)
 *    ของหนักทุกชิ้นจึงอยู่ใน `src/styles/ui2-fx-full.css` ใต้ `[data-fx="full"]` เท่านั้น
 *
 * `STORAGE_KEYS.ui2Fx` ใน sessionStorage = ตัวกันพัง FPS เคยลดเครื่องนี้เป็น lite ไปแล้วในแท็บนี้ (ดู `astro/scripts/ui2-home.ts`)
 */
import { STORAGE_KEYS } from "@/lib/storage/keys";

export const UI2_FX_STORAGE_KEY = STORAGE_KEYS.ui2Fx;

export const UI2_FX_SCRIPT =
  "(function(){var d=document.documentElement,f='full';try{var m=function(q){return window.matchMedia(q).matches},n=navigator,c=n.connection;" +
  "if(m('(prefers-reduced-motion: reduce)'))f='off';" +
  `else if(sessionStorage.getItem(${JSON.stringify(UI2_FX_STORAGE_KEY)})==='lite')f='lite';` +
  "else if(m('(max-width: 767px)')||(m('(pointer: coarse)')&&Math.min(screen.width,screen.height)<600))f='lite';" +
  "else if((n.deviceMemory&&n.deviceMemory<=4)||(c&&c.saveData))f='lite'" +
  "}catch(e){f='lite'}d.setAttribute('data-fx',f)})()";
