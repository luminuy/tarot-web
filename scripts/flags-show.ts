/**
 * 🚩 อ่านค่าธงเปิด/ปิดระบบบน production ตรงจาก KV — `npm run flags:show`
 * ===========================================================================
 *
 * ## ทำไมต้องมีสคริปต์นี้ (ข้อ 9 ของผลตรวจรอบ 2)
 *
 * ผลตรวจตั้งคำถามว่า "`entitlement.enforced` บน production เป็น `false` อยู่หรือเปล่า"
 * แล้วปิดท้ายว่า **ตัดสินจากโค้ดไม่ได้** เพราะค่าเริ่มต้นในโค้ดคือ "เปิด"
 * ส่วนค่าที่เป็นปัญหาได้มีทางเดียวคือมีคนตั้ง `false` ไว้ใน KV
 *
 * คำตอบเดิมคือ "ให้เจ้าของเปิด `/admin` แล้วอ่านเอง" ซึ่งแปลว่า **ทุกครั้งที่สงสัย
 * ต้องรบกวนคนที่ล็อกอินแอดมินได้** · สคริปต์นี้ทำให้ใครก็ตามที่มีสิทธิ์ `wrangler`
 * ตอบคำถามเดียวกันได้ใน 5 วินาที และพิมพ์ผลลัพธ์ที่แปะลงเอกสาร/PR ได้ทันที
 *
 * ## ข้อควรรู้
 *
 * - **อ่านอย่างเดียว** ไม่มีคำสั่งเขียนในไฟล์นี้เลย (แก้ค่าธงทำที่ `/admin` เท่านั้น)
 * - ต้องล็อกอิน `wrangler` ไว้ก่อน (`npx wrangler login`) และมีสิทธิ์อ่าน Workers KV
 * - namespace id อ่านจาก `wrangler.jsonc` เสมอ ไม่ได้ฝังไว้ในสคริปต์
 *   (ย้าย namespace เมื่อไหร่ สคริปต์นี้ตามไปเอง)
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/** ธงที่ระบบอ่านจริง — ชื่อต้องตรงกับที่โค้ดเรียก `KEY.flag(...)` */
const KNOWN_FLAGS: { name: string; meaning: string; fallback: string }[] = [
  {
    name: "entitlement.enforced",
    meaning: "บังคับโควตา/สิทธิ์การเปิดไพ่ทั้งเว็บ",
    fallback: "เปิด (คีย์หาย/KV ล่ม = ยังบังคับสิทธิ์ต่อ — ดู src/lib/entitlement/flag.ts)",
  },
];

function namespaceId(): string {
  const raw = fs.readFileSync(path.join(ROOT, "wrangler.jsonc"), "utf-8");
  // ตัดคอมเมนต์สไตล์ // ออกก่อน แล้วค่อย parse (wrangler.jsonc มีคอมเมนต์เยอะมาก)
  const stripped = raw.replace(/^\s*\/\/.*$/gm, "");
  const cfg = JSON.parse(stripped) as { kv_namespaces?: { binding: string; id: string }[] };
  const ns = cfg.kv_namespaces?.[0];
  if (!ns?.id) throw new Error("ไม่พบ kv_namespaces ใน wrangler.jsonc");
  return ns.id;
}

function readKey(id: string, key: string): string | null {
  try {
    return execFileSync(
      "npx",
      ["wrangler", "kv", "key", "get", key, "--namespace-id", id, "--remote"],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch {
    return null; // ไม่มีคีย์นี้ใน KV = ระบบใช้ค่าเริ่มต้นในโค้ด
  }
}

/** แปลค่าดิบจาก KV เป็นคำตอบเดียว — รองรับทั้ง `false` และ `{ "value": false }` */
function interpret(raw: string | null): string {
  if (raw === null || raw === "") return "— ไม่มีคีย์นี้ใน KV —";
  try {
    const parsed = JSON.parse(raw) as boolean | { value?: boolean; enabled?: boolean };
    if (parsed === false) return "ปิด (false)";
    if (parsed === true) return "เปิด (true)";
    if (parsed && typeof parsed === "object") {
      if (parsed.value === false || parsed.enabled === false) return "ปิด (object)";
      if (parsed.value === true || parsed.enabled === true) return "เปิด (object)";
    }
  } catch {
    /* ค่าไม่ใช่ JSON — แสดงดิบ ๆ ให้คนอ่านตัดสิน */
  }
  return `อ่านไม่ออก: ${raw}`;
}

const id = namespaceId();
console.log(`\n🚩 ธงระบบบน production (KV namespace ${id})\n`);

for (const flag of KNOWN_FLAGS) {
  const raw = readKey(id, `app:flag:${flag.name}`);
  console.log(`  ${flag.name}`);
  console.log(`    ความหมาย  : ${flag.meaning}`);
  console.log(`    ค่าใน KV   : ${raw ?? "(ไม่มีคีย์)"}`);
  console.log(`    ผลที่ใช้จริง: ${interpret(raw)}`);
  if (raw === null) console.log(`    ค่าเริ่มต้น : ${flag.fallback}`);
  console.log("");
}

console.log("📌 แก้ค่าธงได้ที่ /admin ➔ แท็บระบบสิทธิ์ เท่านั้น (สคริปต์นี้อ่านอย่างเดียว)\n");
