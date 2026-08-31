import {
  applyCardOverride,
  resolvePersona,
  resolveSystemCore,
  type CardOverride,
} from "../../src/lib/content/overrides";
import { DECK, cardById } from "../../src/data/cards";
import { getPersona } from "../../src/data/personas";
import { SYSTEM_CORE_KNOWLEDGE } from "../../src/lib/ai/prompt";

/**
 * QA — ยืนยันว่าชั้น "แก้เนื้อหา live" (M3) ปลอดภัย:
 *   1. override เปลี่ยนได้แค่ข้อความ (meanings/keywords/yesNo) — โครงสร้างไพ่คงเดิม 100%
 *   2. ค่าว่าง / ช่องว่าง → ตกกลับไปใช้ default ไม่ทำให้ prompt พัง
 *   3. keywords/yesNo ที่ผิดรูป → ใช้ default
 * รันด้วย: npx tsx scripts/qa/test-overrides-safety.ts
 */

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`✅ ${name}`);
  } else {
    fail++;
    console.log(`❌ ${name}`);
  }
}

const base = cardById("major-00")!;

// 1. โครงสร้างต้องไม่เปลี่ยนไม่ว่า override จะพยายามยัดฟิลด์โครงสร้างมา (จำลอง payload อันตราย)
const maliciousPayload = {
  meanings: { love: { upright: "ทดสอบข้อความใหม่" } },
  keywords: { upright: ["คำใหม่"] },
  yesNo: "no",
  id: "HACKED",
  element: "ไฟ",
  number: 99,
} as unknown as CardOverride;
const hacked = applyCardOverride(base, maliciousPayload);
check("id ไม่เปลี่ยน", hacked.id === base.id);
check("number ไม่เปลี่ยน", hacked.number === base.number);
check("element ไม่เปลี่ยน", hacked.element === base.element);
check("arcana/suit ไม่เปลี่ยน", hacked.arcana === base.arcana && hacked.suit === base.suit);
check("image ไม่เปลี่ยน", hacked.image === base.image);
check("ข้อความ love.upright ถูก override", hacked.meanings.love.upright === "ทดสอบข้อความใหม่");
check("หมวดอื่นยังเป็น default", hacked.meanings.work.upright === base.meanings.work.upright);
check("keywords.upright ถูก override", hacked.keywords.upright.join() === "คำใหม่");
check("keywords.reversed ยัง default", hacked.keywords.reversed.join() === base.keywords.reversed.join());
check("yesNo ถูก override", hacked.yesNo === "no");

// 2. ค่าว่าง → default
const empties = applyCardOverride(base, {
  meanings: { love: { upright: "   ", reversed: "" } },
  keywords: { upright: ["", "  "] },
});
check("meaning ว่าง → default", empties.meanings.love.upright === base.meanings.love.upright);
check("keywords ว่างล้วน → default", empties.keywords.upright.join() === base.keywords.upright.join());

// 3. yesNo ผิดรูป → default
const badYesNo = applyCardOverride(base, { yesNo: "definitely" } as unknown as CardOverride);
check("yesNo ผิดรูป → default", badYesNo.yesNo === base.yesNo);

// 4. override undefined → คืนไพ่เดิมทุก field
check("override ว่าง → ไพ่เดิม", applyCardOverride(base, undefined) === base);

// 5. ทุกใบใน DECK ผ่าน applyCardOverride แบบ no-op ได้โดยไม่ throw และ meanings ครบ 5 หมวด
let deckOk = true;
for (const c of DECK) {
  const r = applyCardOverride(c, undefined);
  if (Object.keys(r.meanings).length !== 5) deckOk = false;
}
check("DECK 78 ใบ meanings ครบ 5 หมวดหลัง resolve", deckOk);

// 6. resolveSystemCore: ว่าง → default, มีค่า → ใช้ค่าใหม่
check("systemCore ว่าง → default", resolveSystemCore({}) === SYSTEM_CORE_KNOWLEDGE);
check("systemCore มีค่า → ใช้ค่าใหม่", resolveSystemCore({ systemPrompt: "กฎใหม่" }) === "กฎใหม่");
check("systemCore ช่องว่างล้วน → default", resolveSystemCore({ systemPrompt: "   " }) === SYSTEM_CORE_KNOWLEDGE);

// 7. resolvePersona: merge เฉพาะ field ที่ override, id คงเดิม
const warm = getPersona("warm");
const merged = resolvePersona({ personas: { warm: { voice: "เสียงใหม่" } } }, "warm");
check("persona voice ถูก override", merged.voice === "เสียงใหม่");
check("persona nameTh/tagline ยัง default", merged.nameTh === warm.nameTh && merged.tagline === warm.tagline);
check("persona id ไม่มีทางเปลี่ยน", merged.id === warm.id);
check("persona ไม่มี override → object เดิม", resolvePersona({}, "warm") === warm);

console.log(`\n${pass}/${pass + fail} ผ่าน`);
if (fail > 0) process.exit(1);
