/**
 * 🔌 ด่านกันการโหลดหน้าสองรอบของผู้ใช้ใหม่ (R-01)
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องมีด่านนี้
 *
 * `controllerchange` ยิงสองสถานการณ์ที่ต่างกันโดยสิ้นเชิง และโค้ดเดิมไม่แยกมัน:
 *   1. **ยึดครั้งแรก** (ผู้เข้าชมใหม่) — `sw.js` เรียก `clients.claim()` ตอน `activate`
 *      ไม่มีเวอร์ชันไหนเพี้ยน → **ห้ามโหลดใหม่**
 *   2. **เปลี่ยนตัวคุม** (มี SW อยู่แล้ว + ตัวใหม่เข้ามาแทน) → **ต้องโหลดใหม่หนึ่งครั้ง**
 *
 * ผลของการไม่แยก: ผู้ใช้ใหม่ · บอตค้นหา · คนที่กดมาจากลิงก์แชร์ **ทุกคน** โหลดทั้งหน้าสองรอบ
 * มองไม่เห็นจาก `curl` (ฝั่งไคลเอนต์ล้วน) และไม่โดนกับผู้ใช้ที่กลับมาซ้ำ
 * จึงรอดสายตามาตลอดจน Lighthouse รายงาน `redirects` 3,076–3,786 ms
 *
 * ## ด่านนี้ทดสอบอย่างไร
 *
 * **รันโค้ดเส้นเดียวกับที่ผู้ใช้จริงรัน** (`setupServiceWorker()` จาก `sw-register.ts`)
 * โดยป้อนสภาพแวดล้อมปลอมเข้าไป — ไม่ใช่ grep หาข้อความในไฟล์
 * พร้อมยืนยันว่าตรรกะไม่ถูกย้ายกลับเข้าไปฝังใน `useEffect` ของคอมโพเนนต์อีก
 */
import fs from "node:fs";
import path from "node:path";

import { isServiceWorkerAllowed, setupServiceWorker, type SwContainerLike } from "../../src/components/pwa/sw-register";

const ROOT = process.cwd();

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass++;
    console.log(`✅ ${label}`);
  } else {
    fail++;
    console.log(`❌ ${label}${detail ? `\n   ${detail}` : ""}`);
  }
}

/** สภาพแวดล้อมปลอมที่ทำตัวเหมือน `navigator.serviceWorker` จริง */
function makeEnv(opts: { hasController: boolean }) {
  const listeners: Array<() => void> = [];
  let reloadCount = 0;
  let registerCount = 0;

  const container: SwContainerLike = {
    controller: opts.hasController ? { scriptURL: "/sw.js" } : null,
    addEventListener: (_type, listener) => {
      listeners.push(listener);
    },
    removeEventListener: (_type, listener) => {
      const i = listeners.indexOf(listener);
      if (i >= 0) listeners.splice(i, 1);
    },
    register: async () => {
      registerCount++;
      return { installing: null, onupdatefound: null };
    },
  };

  const loadHandlers: Array<() => void> = [];

  const teardown = setupServiceWorker({
    container,
    reload: () => {
      reloadCount++;
    },
    isDocumentReady: () => true,
    onWindowLoad: (fn) => loadHandlers.push(fn),
    offWindowLoad: (fn) => {
      const i = loadHandlers.indexOf(fn);
      if (i >= 0) loadHandlers.splice(i, 1);
    },
  });

  return {
    /** จำลองว่า service worker เข้ายึดหน้านี้ (เหมือน `clients.claim()` ทำ) */
    fireControllerChange(newController: unknown = { scriptURL: "/sw.js" }) {
      container.controller = newController;
      for (const l of [...listeners]) l();
    },
    get reloadCount() {
      return reloadCount;
    },
    get registerCount() {
      return registerCount;
    },
    get listenerCount() {
      return listeners.length;
    },
    teardown,
  };
}

console.log("🔌 [QA] Service Worker ต้องไม่ทำให้ผู้ใช้ใหม่โหลดหน้าสองรอบ (R-01)\n");

// ── สถานการณ์ที่ 1: ผู้เข้าชมใหม่ (ยังไม่มีตัวคุม) ────────────────────────────
// นี่คือเคสที่บั๊กเดิมทำผิด — `clients.claim()` ยึดหน้าแล้วโค้ดเดิมสั่ง reload ทันที
{
  const env = makeEnv({ hasController: false });
  check("ผู้เข้าชมใหม่: ลงทะเบียน /sw.js จริง", env.registerCount === 1);
  env.fireControllerChange();
  check(
    "ผู้เข้าชมใหม่: service worker ยึดหน้าครั้งแรกแล้ว **ต้องไม่โหลดหน้าใหม่**",
    env.reloadCount === 0,
    `เรียก reload() ไป ${env.reloadCount} ครั้ง — นี่คือบั๊ก R-01 ที่ทำให้เอกสารถูกขอสองครั้ง`,
  );
  env.teardown();
  check("ผู้เข้าชมใหม่: ถอด listener ตอน unmount ครบ", env.listenerCount === 0);
}

// ── สถานการณ์ที่ 2: มีตัวคุมอยู่แล้วและมีตัวใหม่เข้ามาแทน ────────────────────
// เคสนี้ **ต้องยัง reload เหมือนเดิม** — เป็นเหตุผลที่โค้ดนี้มีอยู่ตั้งแต่ต้น
{
  const env = makeEnv({ hasController: true });
  env.fireControllerChange({ scriptURL: "/sw.js?v=2" });
  check(
    "ผู้ใช้เดิม: เปลี่ยนเวอร์ชัน service worker กลางคัน **ต้องโหลดหน้าใหม่**",
    env.reloadCount === 1,
    `เรียก reload() ไป ${env.reloadCount} ครั้ง — ถ้าเป็น 0 แปลว่าแก้จนเคสเดิมพัง`,
  );

  // ยิงซ้ำต้องไม่โหลดซ้ำ (กันลูปโหลดไม่รู้จบ)
  env.fireControllerChange({ scriptURL: "/sw.js?v=3" });
  check("ผู้ใช้เดิม: controllerchange ซ้ำไม่ทำให้โหลดซ้ำ", env.reloadCount === 1);
  env.teardown();
}

// ── เงื่อนไขความปลอดภัยของ origin ────────────────────────────────────────────
check("https ลงทะเบียนได้", isServiceWorkerAllowed("https:", "seertarot.net"));
check("localhost ลงทะเบียนได้", isServiceWorkerAllowed("http:", "localhost"));
check("127.0.0.1 ลงทะเบียนได้", isServiceWorkerAllowed("http:", "127.0.0.1"));
check("http บนโดเมนจริง ลงทะเบียนไม่ได้", !isServiceWorkerAllowed("http:", "seertarot.net"));

// ── ตรรกะต้องไม่ย้ายกลับเข้าไปฝังในคอมโพเนนต์ ───────────────────────────────
// ถ้าย้ายกลับไป ด่านนี้จะทดสอบโค้ดที่ไม่มีใครใช้ ซึ่งแย่กว่าไม่มีด่าน
{
  const componentPath = path.join(ROOT, "src/components/pwa/ServiceWorkerRegister.tsx");
  if (!fs.existsSync(componentPath)) {
    check("หาไฟล์คอมโพเนนต์ ServiceWorkerRegister.tsx เจอ", false);
  } else {
    const src = fs.readFileSync(componentPath, "utf-8");
    check(
      "คอมโพเนนต์เรียก setupServiceWorker() จากโมดูลที่ทดสอบได้",
      src.includes("setupServiceWorker("),
      "ตรรกะต้องอยู่ใน sw-register.ts เท่านั้น",
    );
    check(
      "คอมโพเนนต์ไม่ผูก controllerchange เองอีกแล้ว",
      !src.includes('addEventListener("controllerchange"'),
      "ตรรกะการตัดสินใจถูกย้ายกลับเข้าคอมโพเนนต์ = ด่านนี้ทดสอบโค้ดที่ไม่มีใครใช้",
    );
  }
}

// ── sw.js ยังต้อง claim อยู่ (ไม่ได้แก้บั๊กด้วยการถอด claim ทิ้ง) ────────────
// ถอด `clients.claim()` ออกก็หายโหลดสองรอบเหมือนกัน แต่แลกด้วยการที่ SW
// ไม่คุมหน้าแรกที่ผู้ใช้เปิด = ออฟไลน์ใช้ไม่ได้จนกว่าจะโหลดหน้าถัดไป
{
  const swPath = path.join(ROOT, "public/sw.js");
  if (!fs.existsSync(swPath)) {
    check("หาไฟล์ public/sw.js เจอ", false);
  } else {
    check(
      "sw.js ยังเรียก clients.claim() ตอน activate (ไม่ได้แก้บั๊กด้วยการถอดทิ้ง)",
      fs.readFileSync(swPath, "utf-8").includes("clients.claim()"),
    );
  }
}

console.log(`\n${pass}/${pass + fail} ผ่าน`);
if (fail > 0) process.exit(1);
