/**
 * QA Test Suite for Password Hashing (PBKDF2-HMAC-SHA256) & User Repo Email Auth
 * Run with: npx tsx scripts/qa/test-password.ts
 */

import { hashPassword, isPasswordConfigError, verifyPassword } from "../../src/lib/auth/password";
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

  // ── 11. PASSWORD_PEPPER: กับดักที่ทำให้ "รหัสผ่านถูกแต่ล็อกอินไม่ได้" (INC-0045) ──
  // NODE_ENV ถูกประกาศเป็น read-only ใน type ของ Node — เข้าถึงผ่าน index signature เพื่อสลับค่าในเทสต์
  const env = process.env as Record<string, string | undefined>;
  const savedPepper = env.PASSWORD_PEPPER;
  const savedNodeEnv = env.NODE_ENV;
  try {
    const pw = "SacredTarotMaster2026!#";

    // 11.1 แฮชผูกกับ pepper — เปลี่ยน pepper แล้วแฮชใบเดิมต้องใช้ไม่ได้
    env.NODE_ENV = "development";
    env.PASSWORD_PEPPER = "pepper-one-".padEnd(40, "1");
    const hashWithPepperOne = await hashPassword(pw);
    if (!(await verifyPassword(pw, hashWithPepperOne))) {
      throw new Error("❌ แฮชที่เพิ่งสร้างตรวจกลับไม่ผ่านด้วย pepper เดิม");
    }

    env.PASSWORD_PEPPER = "pepper-two-".padEnd(40, "2");
    if (await verifyPassword(pw, hashWithPepperOne)) {
      throw new Error("❌ แฮชผ่านได้ทั้งที่ pepper คนละค่า — pepper ไม่ได้ถูกใช้จริง");
    }

    // 11.2 ⚠️ หัวใจของด่านนี้: ลืมตั้ง PASSWORD_PEPPER บน production
    //      ต้อง "โยน error ของการตั้งค่า" ไม่ใช่คืน false เงียบ ๆ
    //      ถ้าคืน false หน้าเว็บจะขึ้นว่า "อีเมลหรือรหัสผ่านไม่ถูกต้อง" ทั้งที่รหัสผ่านถูก
    //      ผู้ใช้ก็นั่งลองรหัสผ่านซ้ำ ๆ เจ้าของระบบก็ไล่หาสาเหตุผิดที่ (เกิดขึ้นจริงมาแล้ว)
    delete env.PASSWORD_PEPPER;
    env.NODE_ENV = "production";

    let threw = false;
    try {
      const silentResult = await verifyPassword(pw, hashWithPepperOne);
      throw new Error(
        `❌ production ที่ไม่ได้ตั้ง PASSWORD_PEPPER คืนค่า ${silentResult} เงียบ ๆ ` +
          "แทนที่จะโยน PasswordConfigError — บั๊กนี้ทำให้ทุกคนล็อกอินไม่ได้โดยหน้าเว็บโทษรหัสผ่านของผู้ใช้",
      );
    } catch (err) {
      if (!isPasswordConfigError(err)) throw err;
      threw = true;
    }
    if (!threw) throw new Error("❌ ไม่ได้โยน PasswordConfigError");

    // 11.3 error ของ "รหัสผ่านผิดจริง" ต้องไม่ถูกนับเป็น config error
    env.PASSWORD_PEPPER = "pepper-one-".padEnd(40, "1");
    if (await verifyPassword("รหัสผ่านผิดแน่นอน-9999", hashWithPepperOne)) {
      throw new Error("❌ รหัสผ่านผิดกลับผ่าน");
    }
  } finally {
    if (savedPepper === undefined) delete env.PASSWORD_PEPPER;
    else env.PASSWORD_PEPPER = savedPepper;
    if (savedNodeEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = savedNodeEnv;
  }
  console.log("  ✓ 11. PASSWORD_PEPPER: แฮชผูกกับ pepper · ลืมตั้งบน prod = โยน config error ไม่ใช่ 'รหัสผ่านผิด'");

  // Cleanup
  await softDeleteUser(createdUser.id);
  console.log("  ✓ 12. Soft delete ทำความสะอาดข้อมูลทดสอบเรียบร้อย");

  console.log("\n✨ [QA] Password Hashing & Email Auth Schema ผ่านครบทุกด่าน 100%!");
}

runPasswordTests().catch((err) => {
  console.error("\n❌ [QA Test Failed]", err);
  process.exit(1);
});
