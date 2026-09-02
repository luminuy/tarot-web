#!/usr/bin/env tsx
/**
 * scripts/auth-hash.ts — สร้างแฮชรหัสผ่านสำหรับใส่ลงฐานข้อมูลด้วยมือ
 * ---------------------------------------------------------------------------
 * มีไว้เพราะเจ้าของระบบต้องตั้งรหัสผ่านให้บัญชีหลังบ้านเป็นครั้งคราว
 * (เช่น สร้างบัญชีแม่หมอ หรือกู้บัญชีตอนระบบอีเมลยังไม่พร้อม)
 *
 * ⚠️ กับดักที่ทำให้เสียเวลามาแล้ว (INC-0045):
 * แฮชของระบบนี้ผูกกับ **`PASSWORD_PEPPER`** — แฮชที่สร้างตอน pepper เป็นค่าหนึ่ง
 * จะใช้ล็อกอินบนเครื่องที่ pepper เป็นอีกค่าหนึ่ง **ไม่ได้เด็ดขาด** ถึงจะพิมพ์รหัสผ่านถูกก็ตาม
 * สคริปต์นี้จึงบังคับให้ตั้ง `PASSWORD_PEPPER` ให้ตรงกับ production ก่อนเสมอ
 *
 * วิธีใช้:
 *   PASSWORD_PEPPER='<ค่าเดียวกับบน production>' npm run auth:hash -- --password '<รหัสผ่าน>'
 *   PASSWORD_PEPPER='...' npm run auth:hash -- --password '...' --email someone@example.com
 */

import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { validatePasswordPolicy } from "../src/lib/auth/password-policy";

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    out[key] = next && !next.startsWith("--") ? (i++, next) : "true";
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const password = args.password ?? args.pw ?? "";
  const email = args.email ?? "";

  if (!password) {
    console.error("\n❌ ต้องระบุรหัสผ่าน");
    console.error("   ใช้:  PASSWORD_PEPPER='<pepper ของ production>' npm run auth:hash -- --password '<รหัสผ่าน>'\n");
    process.exit(1);
  }

  const pepperValue = (process.env.PASSWORD_PEPPER ?? "").trim();
  if (pepperValue.length < 24) {
    console.error("\n❌ ยังไม่ได้ตั้ง PASSWORD_PEPPER (ต้องยาว ≥ 24 ตัวอักษร)");
    console.error("");
    console.error("   แฮชของระบบนี้ผูกกับ PASSWORD_PEPPER — ถ้าสร้างแฮชด้วย pepper คนละค่ากับบน production");
    console.error("   จะล็อกอินไม่ได้เลย ถึงจะพิมพ์รหัสผ่านถูกทุกตัวอักษรก็ตาม (INC-0045)");
    console.error("");
    console.error("   ถ้ายังไม่เคยตั้งบน production ให้ตั้งก่อน:");
    console.error("     openssl rand -hex 32");
    console.error("     npx wrangler secret put PASSWORD_PEPPER");
    console.error("");
    console.error("   แล้วค่อยรันสคริปต์นี้โดยส่งค่าเดียวกันเข้ามา:");
    console.error("     PASSWORD_PEPPER='<ค่าเดียวกัน>' npm run auth:hash -- --password '<รหัสผ่าน>'\n");
    process.exit(1);
  }

  const policy = validatePasswordPolicy(password, email || undefined);
  if (!policy.ok) {
    console.error(`\n❌ รหัสผ่านไม่ผ่านเกณฑ์: ${policy.reason}\n`);
    process.exit(1);
  }

  const hash = await hashPassword(password);

  // ตรวจซ้ำทันทีว่าแฮชที่เพิ่งสร้างใช้ล็อกอินได้จริงด้วย pepper ตัวนี้
  if (!(await verifyPassword(password, hash))) {
    console.error("\n❌ สร้างแฮชแล้วแต่ตรวจกลับไม่ผ่าน — มีบางอย่างผิดปกติ อย่านำไปใช้\n");
    process.exit(1);
  }

  console.log("\n✅ สร้างแฮชสำเร็จ (ตรวจกลับผ่านแล้วด้วย pepper ตัวนี้)\n");
  console.log(hash);
  console.log("");
  console.log(`   pepper ที่ใช้: ${pepperValue.slice(0, 4)}…${pepperValue.slice(-4)} (ยาว ${pepperValue.length} ตัวอักษร)`);
  console.log("   ⚠️ ต้องเป็นค่าเดียวกับ PASSWORD_PEPPER บน production ไม่งั้นล็อกอินไม่ผ่าน");

  if (email) {
    const safeEmail = email.trim().toLowerCase().replace(/'/g, "''");
    const safeHash = hash.replace(/'/g, "''");
    console.log("\n📋 คำสั่งอัปเดตบัญชีที่มีอยู่แล้ว (token_version +1 เพื่อเตะเซสชันเก่าออก):\n");
    console.log(
      `npx wrangler d1 execute tarot-app-db --remote --command "UPDATE users SET password_hash='${safeHash}', token_version=token_version+1 WHERE email_lower='${safeEmail}' AND deleted_at IS NULL;"`,
    );
  } else {
    console.log("\n   ใส่ --email <อีเมล> เพิ่ม เพื่อให้สคริปต์พิมพ์คำสั่ง wrangler d1 ให้พร้อมรัน");
  }
  console.log("");
}

main().catch((err) => {
  console.error("\n❌ ล้มเหลว:", err instanceof Error ? err.message : err, "\n");
  process.exit(1);
});
