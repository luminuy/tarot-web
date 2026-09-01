/**
 * scripts/qa/test-email-auth.ts
 * QA Test Suite for Email & Password Authentication Routes & Security
 */

import { consumeToken, issueToken } from "../../src/lib/auth/auth-tokens.repo";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password";
import { validatePasswordPolicy } from "../../src/lib/auth/password-policy";
import {
  createEmailUser,
  getUserByEmail,
  getUserById,
  getUserPasswordHash,
  markEmailVerified,
  normalizeEmail,
  setPasswordHash,
  softDeleteUser,
} from "../../src/lib/users/users.repo";

async function runEmailAuthQATests() {
  console.log("📧 [QA] กำลังทดสอบ Email Authentication Flow & Security...");

  // 1. Password Policy Test
  const shortPw = validatePasswordPolicy("12345");
  if (shortPw.ok) throw new Error("❌ Password Policy ไม่บล็อกรหัสผ่านสั้น");

  const commonPw = validatePasswordPolicy("password123");
  if (commonPw.ok) throw new Error("❌ Password Policy ไม่บล็อกรหัสผ่านยอดฮิต");

  const emailMatchPw = validatePasswordPolicy("bankjack_pass123", "bankjack@example.com");
  if (emailMatchPw.ok) throw new Error("❌ Password Policy ไม่บล็อกรหัสที่ตรงกับอีเมล");

  const validPw = validatePasswordPolicy("SacredTarotMaster2026!#");
  if (!validPw.ok) throw new Error(`❌ Password Policy ปฏิเสธรหัสผ่านที่ถูกต้อง: ${validPw.reason}`);
  console.log("  ✓ 1. Password Policy: ตรวจสอบความปลอดภัยถูกต้อง 100%");

  // 2. Email Normalization
  if (normalizeEmail("  User.Test@Example.COM  ") !== "user.test@example.com") {
    throw new Error("❌ normalizeEmail ทำงานไม่ถูกต้อง");
  }
  console.log("  ✓ 2. Email Normalization: ตัดช่องว่างและแปลงเป็น lowercase สำเร็จ");

  // 3. User Signup & Hash Flow
  const testEmail = `oracle_${Date.now()}@example.com`;
  const rawPassword = "SacredTarotMaster2026!#";
  const passwordHash = await hashPassword(rawPassword);

  const newUser = await createEmailUser({
    email: testEmail,
    name: "จอมเวทพยากรณ์",
    passwordHash,
  });

  if (newUser.provider !== "email" || newUser.emailVerified !== false || newUser.tokenVersion !== 0) {
    throw new Error("❌ createEmailUser ค่าเริ่มต้นของฟิลด์ไม่ถูกต้อง");
  }
  console.log(`  ✓ 3. Signup Flow: สร้างบัญชีผู้ใช้ใหม่สำเร็จ (ID: ${newUser.id})`);

  // 4. Verification Token Lifecycle
  const verifyToken = await issueToken(newUser.id, "verify", 24 * 60 * 60 * 1000);
  if (!verifyToken || typeof verifyToken !== "string") {
    throw new Error("❌ issueToken verify ล้มเหลว");
  }

  // Consume verification token
  const consumeVerifyResult = await consumeToken(verifyToken, "verify");
  if (!consumeVerifyResult || consumeVerifyResult.userId !== newUser.id) {
    throw new Error("❌ consumeToken verify ล้มเหลว");
  }
  await markEmailVerified(newUser.id);

  const userAfterVerify = await getUserById(newUser.id);
  if (!userAfterVerify?.emailVerified) {
    throw new Error("❌ markEmailVerified ไม่เปลี่ยนสถานะ");
  }

  // Replay protection (Second consume must fail)
  const replayVerify = await consumeToken(verifyToken, "verify");
  if (replayVerify !== null) {
    throw new Error("❌ Replay Attack Protection ล้มเหลว: Token เดิมสามารถใช้ซ้ำได้");
  }
  console.log("  ✓ 4. Verification Token: ยืนยันอีเมลและป้องกันการใช้ Token ซ้ำสำเร็จ");

  // 5. Login Verification
  const storedHash = await getUserPasswordHash(newUser.id);
  if (!storedHash) throw new Error("❌ getUserPasswordHash คืนค่า null");

  const correctMatch = await verifyPassword(rawPassword, storedHash);
  if (!correctMatch) throw new Error("❌ รหัสผ่านถูกต้องแต่ verifyPassword คืนค่า false");

  const wrongMatch = await verifyPassword("WrongPassword123456", storedHash);
  if (wrongMatch) throw new Error("❌ รหัสผ่านผิดแต่ verifyPassword คืนค่า true");
  console.log("  ✓ 5. Login Flow: ตรวจสอบความถูกต้องของรหัสผ่านสำเร็จ");

  // 6. Forgot Password & Reset Flow
  const resetToken = await issueToken(newUser.id, "reset", 15 * 60 * 1000);
  const consumeResetResult = await consumeToken(resetToken, "reset");
  if (!consumeResetResult || consumeResetResult.userId !== newUser.id) {
    throw new Error("❌ consumeToken reset ล้มเหลว");
  }

  const newRawPassword = "BrandNewSacredPassword2026!#";
  const newPasswordHash = await hashPassword(newRawPassword);
  await setPasswordHash(newUser.id, newPasswordHash);

  const userAfterReset = await getUserById(newUser.id);
  if ((userAfterReset?.tokenVersion || 0) !== 1) {
    throw new Error("❌ token_version ไม่ได้ถูกเพิ่มหลังรีเซ็ตรหัสผ่าน");
  }

  const newStoredHash = await getUserPasswordHash(newUser.id);
  if (!newStoredHash || !(await verifyPassword(newRawPassword, newStoredHash))) {
    throw new Error("❌ รหัสผ่านใหม่ใช้งานไม่ได้หลังรีเซ็ต");
  }

  // Old password must fail
  const oldPwMatch = await verifyPassword(rawPassword, newStoredHash);
  if (oldPwMatch) throw new Error("❌ รหัสผ่านเก่าไม่ควรใช้งานได้หลังรีเซ็ต");
  console.log("  ✓ 6. Reset Password Flow: เปลี่ยนรหัสและเพิ่ม token_version สำเร็จ");

  // Cleanup
  await softDeleteUser(newUser.id);
  console.log("  ✓ 7. Cleanup: ทำความสะอาดข้อมูลทดสอบเรียบร้อย");

  console.log("\n✨ [QA] Email Auth Routes & Security ผ่านครบทุกด่าน 100%!");
}

runEmailAuthQATests().catch((err) => {
  console.error("\n❌ [QA Test Failed]", err);
  process.exit(1);
});
