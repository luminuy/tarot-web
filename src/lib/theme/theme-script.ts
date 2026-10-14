/**
 * 🌙 โหมดมืด / โหมดสว่าง — สคริปต์เดียวใน `<head>` ของทั้งสองแม่พิมพ์
 * ===========================================================================
 *
 * ใช้ที่ `astro/layouts/BaseLayout.astro` และ `src/app/_shared/RootHtml.tsx` (ต้องตรงกันทุกตัวอักษร)
 *
 * ทำงานสามอย่าง:
 *   1. ตั้ง `<html data-theme="dark | light">` **ก่อนวาดเฟรมแรก** — ค่าที่ผู้ใช้กดเลือกไว้ (localStorage)
 *      มาก่อน · ไม่เคยเลือก = ตามที่ตั้งไว้ในเครื่อง (`prefers-color-scheme`)
 *   2. ฟังการเปลี่ยนโหมดของเครื่อง (ระหว่างเปิดหน้าอยู่) — เฉพาะคนที่ยังไม่เคยกดเลือกเอง
 *   3. ปุ่มสลับโหมดทุกปุ่ม (`[data-theme-toggle]`) ทำงานผ่านตัวฟังคลิกตัวเดียวที่ `document`
 *      หัวเว็บของหน้า Astro เป็น HTML นิ่งที่ไม่ hydrate React จึงผูก onClick ไม่ได้
 *
 * ⚠️ ห้ามย้ายไปตั้งค่าใน React หลัง hydrate — หน้าจะแวบเป็นสีสว่างก่อนแล้วค่อยมืด
 * ⚠️ ห้ามใส่ defer / async — ต้องรันก่อน `<body>` ถูกวาด
 * ⚠️ อ่าน localStorage ไม่ได้ (โหมดส่วนตัวบางเบราว์เซอร์) = ใช้ค่าของเครื่องต่อไป ไม่ล้ม
 * ⚠️ ปุ่มสลับมี `aria-pressed` — สคริปต์ปรับให้ตรงกับโหมดจริงตอนหน้าโหลดเสร็จและทุกครั้งที่สลับ
 *
 * สีของแถบเบราว์เซอร์ (`<meta name="theme-color">`) ถูกปรับตามโหมดด้วย
 * HTML จากเซิร์ฟเวอร์ยังเป็นค่าโหมดสว่าง (`SITE_THEME_COLOR`) เหมือนเดิม — ด่าน render-parity ตรวจค่านั้น
 */
import { SITE_THEME_COLOR } from "@/app/_shared/root-metadata";
import { STORAGE_KEYS } from "@/lib/storage/keys";

/** สีพื้นของโหมดมืด — ต้องตรงกับ `--color-canvas` ใน `src/app/theme-dark.css` */
export const SITE_THEME_COLOR_DARK = "#15110D";

export const THEME_STORAGE_KEY = STORAGE_KEYS.theme;

export const THEME_SCRIPT =
  "(function(){var d=document.documentElement,k=" +
  JSON.stringify(THEME_STORAGE_KEY) +
  ",m=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;" +
  "function saved(){try{var v=localStorage.getItem(k);return v==='dark'||v==='light'?v:null}catch(e){return null}}" +
  "function sync(t){var c=t==='dark'?" +
  JSON.stringify(SITE_THEME_COLOR_DARK) +
  ":" +
  JSON.stringify(SITE_THEME_COLOR) +
  ",q=document.querySelectorAll('meta[name=\"theme-color\"]'),i;for(i=0;i<q.length;i++)q[i].setAttribute('content',c);" +
  "q=document.querySelectorAll('[data-theme-toggle]');for(i=0;i<q.length;i++)q[i].setAttribute('aria-pressed',t==='dark'?'true':'false')}" +
  "function apply(t){d.setAttribute('data-theme',t);sync(t)}" +
  // เขียนไม่ได้ (โหมดส่วนตัว / ปิดคุกกี้) = โหมดยังสลับในหน้านี้ แค่ไม่จำข้ามหน้า
  "function save(t){try{localStorage.setItem(k,t);return true}catch(x){return false}}" +
  "apply(saved()||(m&&m.matches?'dark':'light'));" +
  "document.addEventListener('DOMContentLoaded',function(){sync(d.getAttribute('data-theme'))});" +
  "if(m){var f=function(e){if(!saved())apply(e.matches?'dark':'light')};if(m.addEventListener)m.addEventListener('change',f);else if(m.addListener)m.addListener(f)}" +
  "document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-theme-toggle]'):null;if(!b)return;" +
  "var t=d.getAttribute('data-theme')==='dark'?'light':'dark';apply(t);save(t)})" +
  "})()";
