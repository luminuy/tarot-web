/**
 * QA Test Suite for Password Hashing (PBKDF2-HMAC-SHA256) & User Repo Email Auth
 * Run with: npx tsx scripts/qa/test-password.ts
 */

import { hashPassword, verifyPassword } from "../../src/lib/auth/password";
import {
  createEmailUser,
  findUserIdByOAuth,
  getUserByEmail,
  getUserPasswordHash,
  linkOAuthIdentity,
  markEmailVerified,
  normalizeEmail,
  setPasswordHash,
  softDeleteUser,
} from "../../src/lib/users/users.repo";

async function runPasswordTests() {
  console.log("🔐 [QA] กำลังทดสอบ Password Hashing & Email Auth Schema...");

  // 1. Test basic hash and verify
  const rawPw = "SuperSecretPassword123!@#";
  const start = Date.now();
  const hash = await hashPassword(rawPw);
  const duration = Date.now() - start;

  console.log(`  ✓ 1. hashPassword สำเร็จ (เวลา: ${duration}ms, hash: ${hash.slice(0, 35)}...)`);

  if (!hash.startsWith("pbkdf2$sha256$150000$")) {
    throw new Error(`❌ Format ของ password hash ไม่ถูกต้อง: ${hash}`);
  }

  // 2. Test verify valid password
  const isValid = await verifyPassword(rawPw, hash);
  if (!isValid) {
    throw new Error("❌ verifyPassword คืนค่า false สำหรับรหัสผ่านที่ถูกต้อง");
  }
  console.log("  ✓ 2. verifyPassword ยืนยันรหัสผ่านถูกต้องสำเร็จ");

  // 3. Test verify invalid password
  const isInvalid = await verifyPassword("WrongPassword456", hash);
  if (isInvalid) {
    throw new Error("❌ verifyPassword คืนค่า true สำหรับรหัสผ่านที่ผิด");
  }
  console.log("  ✓ 3. verifyPassword ปฏิเสธรหัสผ่านที่ไม่ถูกต้องสำเร็จ");

  // 4. Test random salting (2 hashes must differ)
  const hash2 = await hashPassword(rawPw);
  if (hash === hash2) {
    throw new Error("❌ Salt ไม่สุ่ม: แฮช 2 ครั้งได้ผลลัพธ์เหมือนกัน");
  }
  console.log("  ✓ 4. Random Salting ทำงานสมบูรณ์ (แฮช 2 ครั้งได้ผลลัพธ์ไม่ซ้ำกัน)");

  // 5. Test User Repo Email Operations
  const testEmail = `test.user.${Date.now()}@example.com`;
  const createdUser = await createEmailUser({
    email: testEmail,
    name: "นักพยากรณ์ทดสอบ",
    passwordHash: hash,
  });

  if (createdUser.provider !== "email" || createdUser.emailVerified !== false) {
    throw new Error("❌ createEmailUser ข้อมูลเริ่มต้นไม่ถูกต้อง");
  }
  console.log(`  ✓ 5. createEmailUser สำเร็จ (ID: ${createdUser.id}, Email: ${createdUser.email})`);

  // 6. Test getUserByEmail (case-insensitive)
  const foundUser = await getUserByEmail(testEmail.toUpperCase());
  if (!foundUser || foundUser.id !== createdUser.id) {
    throw new Error("❌ getUserByEmail แบบ case-insensitive ล้มเหลว");
  }
  console.log("  ✓ 6. getUserByEmail ค้นหาแบบ case-insensitive สำเร็จ");

  // 7. Test verify password hash from DB
  const storedHash = await getUserPasswordHash(createdUser.id);
  if (!storedHash || !(await verifyPassword(rawPw, storedHash))) {
    throw new Error("❌ getUserPasswordHash ตรวจสอบกับรหัสผ่านไม่ผ่าน");
  }
  console.log("  ✓ 7. getUserPasswordHash ดึงค่าและตรวจสอบสำเร็จ");

  // 8. Test markEmailVerified
  await markEmailVerified(createdUser.id);
  const verifiedUser = await getUserByEmail(testEmail);
  if (!verifiedUser?.emailVerified) {
    throw new Error("❌ markEmailVerified ไม่ได้เปลี่ยนสถานะ emailVerified เป็น true");
  }
  console.log("  ✓ 8. markEmailVerified เปลี่ยนสถานะการยืนยันสำเร็จ");

  // 9. Test setPasswordHash & token_version bump
  const newPw = "BrandNewPassword456!@#";
  const newHash = await hashPassword(newPw);
  await setPasswordHash(createdUser.id, newHash);
  const updatedUser = await getUserByEmail(testEmail);
  if ((updatedUser?.tokenVersion || 0) <= (createdUser.tokenVersion || 0)) {
    throw new Error("❌ setPasswordHash ไม่ได้เพิ่ม token_version");
  }
  console.log("  ✓ 9. setPasswordHash อัปเดตรหัสและเพิ่ม token_version สำเร็จ");

  // 10. Test OAuth Identities Linking
  const googleSub = `google_sub_${Date.now()}`;
  await linkOAuthIdentity("google", googleSub, createdUser.id);
  const linkedUserId = await findUserIdByOAuth("google", googleSub);
  if (linkedUserId !== createdUser.id) {
    throw new Error("❌ linkOAuthIdentity / findUserIdByOAuth ล้มเหลว");
  }
  console.log("  ✓ 10. linkOAuthIdentity & findUserIdByOAuth ผูกบัญชีสำเร็จ");

  // Cleanup
  await softDeleteUser(createdUser.id);
  console.log("  ✓ 11. Soft delete ทำความสะอาดข้อมูลทดสอบเรียบร้อย");

  console.log("\n✨ [QA] Password Hashing & Email Auth Schema ผ่านครบทุกด่าน 100%!");
}

runPasswordTests().catch((err) => {
  console.error("\n❌ [QA Test Failed]", err);
  process.exit(1);
});
