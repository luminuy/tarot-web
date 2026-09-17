/**
 * 🎛️ ด่านตัวลดสถานะหน้าต่างลอยของ TarotFlow (R-26 ขั้นที่ 1)
 * ===========================================================================
 *
 * ยิงลำดับการกระทำจริงใส่ `overlayReducer` — ไม่ได้ค้นข้อความในซอร์ส
 * เพราะสิ่งที่ต้องพิสูจน์คือ **พฤติกรรม** ไม่ใช่หน้าตาของโค้ด
 *
 * และตรึงจำนวน `useState` ใน `TarotFlow.tsx` เป็น **ratchet** — ลดได้ ห้ามเพิ่ม
 * (ไฟล์นี้โตจาก 1,717 เป็น 1,901 บรรทัดระหว่างรอบตรวจสองรอบ ถ้าไม่ตรึงไว้มันจะโตต่อ)
 */

import fs from "node:fs";
import path from "node:path";
import {
  overlayReducer,
  OVERLAY_INITIAL,
  isOverlay,
  type OverlayState,
  type OverlayAction,
} from "../../src/components/home/flow-overlay";

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}${detail ? `\n      ${detail}` : ""}`);
  }
}

/** เล่นลำดับการกระทำแล้วคืนสถานะสุดท้าย */
function play(...actions: OverlayAction[]): OverlayState {
  return actions.reduce<OverlayState>(overlayReducer, OVERLAY_INITIAL);
}

console.log("\n🎛️ [QA] สถานะหน้าต่างลอยของ TarotFlow\n");

console.log("── 1. เริ่มต้นและเปิดทีละบาน ──");
check("เริ่มต้นไม่มีหน้าต่างไหนเปิด", OVERLAY_INITIAL === null);
check('เปิดหน้าต่างแชร์ได้', isOverlay(play({ type: "openShare" }), "share"));
check('เปิดประวัติได้', isOverlay(play({ type: "openHistory" }), "history"));
check('เปิดหน้าต่างเติมสิทธิ์ได้', isOverlay(play({ type: "openBuyCredits" }), "buyCredits"));

const auth = play({ type: "openAuth", mode: "signup", fromWall: true });
check(
  "เปิดหน้าต่างเข้าสู่ระบบพร้อมโหมดและที่มา",
  isOverlay(auth, "auth") && auth.mode === "signup" && auth.fromWall === true,
);

console.log("\n── 2. เปิดสองบานพร้อมกันไม่ได้ (เหตุผลหลักของการยุบเป็น union) ──");
const stacked = play({ type: "openShare" }, { type: "openHistory" });
check(
  "เปิดบานใหม่ทับ = บานเก่าปิดเอง ไม่มีทางเปิดค้างสองบาน",
  isOverlay(stacked, "history") && !isOverlay(stacked, "share"),
);

console.log("\n── 3. ปิดแบบระบุชนิด — กันปิดบานที่เพิ่งถูกเปิดทับ ──");
/*
 * เคสจริง: ผู้ใช้กด "เติมสิทธิ์" จากในหน้าต่างอัปเกรด ➔ หน้าต่างเติมสิทธิ์เปิดทับ
 * แล้ว `onClose` ของหน้าต่างอัปเกรดยิงตามมาทีหลัง
 * ถ้าปิดแบบไม่ดูชนิด หน้าต่างที่ผู้ใช้เพิ่งเปิดจะถูกปิดทิ้งทันที
 */
const afterLateClose = play(
  { type: "openUpgrade", reason: "daily_exhausted" },
  { type: "openBuyCredits" },
  { type: "close", kind: "upgrade" },
);
check(
  "ปิดบานที่ไม่ได้เปิดอยู่ = ไม่มีผล (หน้าต่างเติมสิทธิ์ยังเปิดอยู่)",
  isOverlay(afterLateClose, "buyCredits"),
  `ได้สถานะ ${JSON.stringify(afterLateClose)}`,
);
check(
  "ปิดบานที่เปิดอยู่จริง = ปิด",
  play({ type: "openShare" }, { type: "close", kind: "share" }) === null,
);
check(
  "closeAll ปิดทุกอย่างเสมอ",
  play({ type: "openZoomCard", card: { order: 0 } as never }, { type: "closeAll" }) === null,
);

console.log("\n── 4. การ์ดที่ซูมอยู่ต้องพกข้อมูลไพ่มาด้วย (กฎเหล็กข้อ 14) ──");
const card = { order: 3, cardIndex: 21 } as never;
const zoomed = play({ type: "openZoomCard", card });
check(
  "เปิดซูมแล้วได้ไพ่ใบเดิมกลับมา ไม่ใช่ค่าที่ประกอบขึ้นใหม่",
  isOverlay(zoomed, "zoomCard") && zoomed.card === card,
);

console.log("\n── 5. TarotFlow.tsx ต้องไม่กลับไปมีสถานะอิสระเพิ่มอีก ──");
const FLOW = path.join(process.cwd(), "src/components/home/TarotFlow.tsx");
if (!fs.existsSync(FLOW)) {
  check("หาไฟล์ TarotFlow.tsx เจอ", false, "ไฟล์ถูกย้าย/เปลี่ยนชื่อ — ด่านนี้ตรวจอะไรไม่ได้");
} else {
  const flowSrc = fs.readFileSync(FLOW, "utf-8");
  const useStateCount = (flowSrc.match(/const \[[^\]]*\]\s*=\s*useState/g) ?? []).length;

  /**
   * 🔒 ratchet — **ลดได้ ห้ามเพิ่ม**
   * เริ่มต้นที่ 37 (รอบตรวจ 2026-09-17) · ยุบกลุ่มหน้าต่างลอยแล้วเหลือ 28 (R-26 ขั้นที่ 1)
   * ยุบกลุ่มสำรับ · เซสชัน provably-fair · สตรีมคำอ่าน แล้วเหลือ 16 (R-26 ขั้นที่ 2)
   * พฤติกรรมของสามก้อนหลังมีด่านของตัวเองที่ `scripts/qa/test-flow-state.ts`
   */
  const USE_STATE_BUDGET = 16;
  check(
    `จำนวน useState ไม่เพิ่มขึ้น (${useStateCount} / เพดาน ${USE_STATE_BUDGET})`,
    useStateCount <= USE_STATE_BUDGET,
    "สถานะอิสระที่เพิ่มขึ้นหนึ่งตัว = สถานะที่เป็นไปได้เพิ่มขึ้นเท่าตัว\n" +
      "      ➔ ยุบเข้ากลุ่มที่มีอยู่ หรือสร้าง reducer ใหม่ที่ทดสอบได้แบบ flow-overlay.ts",
  );

  check(
    "หน้าต่างลอยใช้ตัวลดกลาง ไม่ได้กลับไปใช้ useState",
    flowSrc.includes("overlayReducer") && !/useState\(false\);\s*\n\s*const \[isHistoryOpen/.test(flowSrc),
  );
}

console.log(`\n📊 สรุป: ผ่าน ${pass} ข้อ | ล้มเหลว ${fail} ข้อ\n`);
if (fail > 0) process.exit(1);
