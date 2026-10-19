/**
 * scripts/qa/test-email-auth.ts
 * QA Test Suite for Email & Password Authentication Routes & Security
 */

import { consumeToken, issueToken } from "../../src/lib/auth/auth-tokens.repo";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password";
import { validatePasswordPolicy } from "../../src/lib/auth/password-policy";
import {
  createEmailUser,
  findUserIdByOAuth,
  getUserById,
  getUserPasswordHash,
  linkOAuthIdentity,
  markEmailVerified,
  normalizeEmail,
  reviveOAuthUser,
  setPasswordHash,
  softDeleteUser,
  upsertUserOnLogin,
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

  // 7. OAuth Account Linking Flow
  const oauthGoogleSub = `g_sub_${Date.now()}`;
  await linkOAuthIdentity("google", oauthGoogleSub, newUser.id);

  const foundUserId = await findUserIdByOAuth("google", oauthGoogleSub);
  if (foundUserId !== newUser.id) {
    throw new Error("❌ findUserIdByOAuth คืนค่าไม่ตรงกับบัญชีที่ผูกไว้");
  }
  console.log("  ✓ 7. OAuth Account Linking: ผูกและค้นหาบัญชีข้าม Identity สำเร็จ");

  // 8. Malformed & Empty JSON Body Resilience Guard
  const { POST: loginPost } = await import("../../src/app/api/auth/email/login/route");
  const { POST: signupPost } = await import("../../src/app/api/auth/email/signup/route");
  const { POST: forgotPost } = await import("../../src/app/api/auth/email/forgot/route");
  const { POST: resetPost } = await import("../../src/app/api/auth/email/reset/route");

  for (const [name, handler, url] of [
    ["login", loginPost, "https://seertarot.net/api/auth/email/login"],
    ["signup", signupPost, "https://seertarot.net/api/auth/email/signup"],
    ["forgot", forgotPost, "https://seertarot.net/api/auth/email/forgot"],
    ["reset", resetPost, "https://seertarot.net/api/auth/email/reset"],
  ] as const) {
    const brokenRes = await handler(
      new Request(url, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://seertarot.net" },
        body: "invalid{json",
      })
    );
    if (brokenRes.status !== 400) {
      throw new Error(`❌ ${name} ไม่ตอบ HTTP 400 เมื่อได้รับ JSON เสีย (ตอบ ${brokenRes.status})`);
    }

    const emptyRes = await handler(
      new Request(url, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://seertarot.net" },
        body: "",
      })
    );
    if (emptyRes.status !== 400) {
      throw new Error(`❌ ${name} ไม่ตอบ HTTP 400 เมื่อได้รับ empty body (ตอบ ${emptyRes.status})`);
    }
  }
  console.log("  ✓ 8. Malformed & Empty JSON Resilience: ตอบ HTTP 400 ป้องกัน 500 error ทุกเส้นทาง");

  // 10. (A1-05) ผู้ใช้ Google/LINE ที่ลบบัญชีแล้วกลับมาล็อกอินใหม่ต้องเข้าได้
  //     softDelete แตะแค่ deleted_at แถว oauth_identities ยังชี้ id เดิม ➔ callback ต้องคืนชีพ
  const oauthId = `google_revive_${Date.now()}`;
  const oauthSub = `g_sub_revive_${Date.now()}`;
  const oauthUser = await upsertUserOnLogin({ id: oauthId, provider: "google", name: "ผู้ใช้กลับมา" });
  await linkOAuthIdentity("google", oauthSub, oauthId);
  await softDeleteUser(oauthId);
  if (await getUserById(oauthId)) throw new Error("❌ softDeleteUser ไม่ได้ลบบัญชี");
  // A1-06: ลบบัญชี = ล้างข้อมูลส่วนบุคคล + ถอดการผูก OAuth (ไม่ใช่แค่ตั้ง deleted_at)
  if ((await findUserIdByOAuth("google", oauthSub)) !== null) {
    throw new Error("❌ A1-06: ลบบัญชีแล้วการผูก Google ยังค้างอยู่");
  }
  {
    const { getAppDB } = await import("../../src/lib/platform/db");
    const row = await (await getAppDB())
      .prepare(`SELECT name, avatar_url, password_hash, marketing_consent FROM users WHERE id = ?`)
      .bind(oauthId)
      .first<{ name: string; avatar_url: string | null; password_hash: string | null; marketing_consent: number }>();
    if (!row || row.name !== "" || row.avatar_url !== null || row.password_hash !== null || row.marketing_consent !== 0) {
      throw new Error(`❌ A1-06: ลบบัญชีแล้วข้อมูลส่วนบุคคลยังค้าง (${JSON.stringify(row)})`);
    }
  }
  const revived = await reviveOAuthUser({ id: oauthId, provider: "google", name: "ผู้ใช้กลับมา" });
  if (!(await getUserById(oauthId))) throw new Error("❌ A1-05: reviveOAuthUser ไม่คืนชีพบัญชี");
  if (revived.tokenVersion <= oauthUser.tokenVersion) {
    throw new Error("❌ A1-05: คืนชีพแล้วต้องขึ้น token_version (คุกกี้ก่อนลบบัญชีห้ามฟื้น)");
  }
  const fs = await import("node:fs");
  const callbackSrc = fs.readFileSync("src/app/api/auth/[provider]/callback/route.ts", "utf8");
  if (!/getUserById\(existingLinkedUserId\)\)\s*\?\?\s*\(await reviveOAuthUser/.test(callbackSrc)) {
    throw new Error("❌ A1-05: OAuth callback ไม่คืนชีพบัญชีที่ถูกลบในกิ่ง 'ผูกไว้แล้ว'");
  }
  await softDeleteUser(oauthId);
  console.log("  ✓ 10. ลบบัญชีล้างข้อมูลส่วนบุคคลจริง (A1-06) · OAuth ที่เคยลบบัญชีล็อกอินกลับได้ + ขึ้น token_version (A1-05)");

  // IP ต่างกันทุกรอบ — ถังกันเดารหัสอยู่ใน D1 (.dev-marketplace.db) และค้างข้ามรอบรันในเครื่อง
  const runOctet = Math.floor(Math.random() * 250);
  const runIp = (n: number) => `198.51.${runOctet}.${n}`;

  // 11. (A1-01) รหัสผ่านใหม่ไม่ผ่านเกณฑ์ ➔ ลิงก์รีเซ็ตต้องยังใช้ได้ (ห้ามเผา token ก่อนตรวจนโยบาย)
  {
    const { POST: resetRoute } = await import("../../src/app/api/auth/email/reset/route");
    const policyToken = await issueToken(newUser.id, "reset", 15 * 60 * 1000);
    const call = (password: string) =>
      resetRoute(
        new Request("https://seertarot.net/api/auth/email/reset", {
          method: "POST",
          headers: { "content-type": "application/json", origin: "https://seertarot.net", "cf-connecting-ip": runIp(77) },
          body: JSON.stringify({ token: policyToken, password }),
        }),
      );
    const weak = await call(`${testEmail.split("@")[0]}_pass123`); // มีอีเมลอยู่ในรหัส = ไม่ผ่านเกณฑ์
    if (weak.status !== 400) throw new Error(`❌ A1-01: รหัสยอดนิยมควรได้ 400 (ได้ ${weak.status})`);
    const retry = await call("AnotherSacredPassword2026!#");
    if (retry.status !== 200) {
      throw new Error(`❌ A1-01: กรอกรหัสไม่ผ่านเกณฑ์ครั้งเดียวแล้วลิงก์รีเซ็ตตาย (ครั้งที่สองได้ ${retry.status})`);
    }
    const replay = await call("YetAnotherSacredPassword2026!#");
    if (replay.status !== 400) throw new Error("❌ A1-01: ลิงก์รีเซ็ตต้องใช้ได้ครั้งเดียว");
    console.log("  ✓ 11. รีเซ็ตรหัสผ่าน: ตรวจนโยบายก่อนเผาลิงก์ · ลิงก์ยังใช้ได้ครั้งเดียว (A1-01)");
  }

  // 12. (A1-03) ลิงก์ยืนยันอีเมลต้องไม่ออกคุกกี้เซสชัน (login CSRF)
  {
    const { GET: verifyRoute } = await import("../../src/app/api/auth/email/verify/route");
    const { AUTH_COOKIE_NAME } = await import("../../src/lib/auth/cookie-names");
    const vToken = await issueToken(newUser.id, "verify", 60 * 60 * 1000);
    const res = await verifyRoute(
      new Request(`https://seertarot.net/api/auth/email/verify?token=${encodeURIComponent(vToken)}`, {
        headers: { "cf-connecting-ip": runIp(78) },
      }),
    );
    if ((res.headers.get("set-cookie") ?? "").includes(`${AUTH_COOKIE_NAME}=`)) {
      throw new Error("❌ A1-03: ลิงก์ยืนยันอีเมล (GET) ยังออกคุกกี้เซสชันให้คนที่กด");
    }
    // ตัวสแกนลิงก์เปิดไปแล้ว ➔ ผู้ใช้กดซ้ำต้องเห็น "สำเร็จ" ไม่ใช่ "หมดอายุ"
    const again = await verifyRoute(
      new Request(`https://seertarot.net/api/auth/email/verify?token=${encodeURIComponent(vToken)}`, {
        headers: { "cf-connecting-ip": runIp(78) },
      }),
    );
    if (!(again.headers.get("location") ?? "").includes("verified=1")) {
      throw new Error("❌ A1-03: ลิงก์ที่ถูกตัวสแกนเปิดไปแล้วแสดงเป็นหมดอายุ ทั้งที่อีเมลยืนยันแล้ว");
    }
    console.log("  ✓ 12. ยืนยันอีเมล: ไม่ออกคุกกี้เซสชันจากลิงก์ · กดซ้ำหลังสแกนเนอร์ยังเห็นสำเร็จ (A1-03)");
  }

  // 13. (A1-07 · A1-11) ด่านโค้ดที่ทดสอบผ่าน route จริงไม่ได้ (ต้องมี Google/คุกกี้จริง)
  {
    const fs = await import("node:fs");
    const cb = fs.readFileSync("src/app/api/auth/[provider]/callback/route.ts", "utf8");
    if (!/catch \(dbErr\)[\s\S]{0,600}?return fail\(origin, "server_error"/.test(cb)) {
      throw new Error("❌ A1-07: OAuth callback ยังกลืน error ของ D1 แล้วออกคุกกี้ต่อ");
    }
    if (!/getUserByEmailIncludingDeleted\(profile\.email\)/.test(cb)) {
      throw new Error("❌ A1-07: OAuth callback ไม่คืนชีพแถวที่ถูกลบซึ่งจองอีเมลนี้ไว้ (ชน UNIQUE)");
    }
    const priv = fs.readFileSync("src/lib/security/privileged.ts", "utf8");
    if (!/isUnlimitedEmail\(user\.email\)\s*&&\s*\(await ownsVerifiedEmail\(/.test(priv)) {
      throw new Error("❌ A1-11: สิทธิ์ไม่จำกัดให้ตามอีเมลในคุกกี้โดยไม่ตรวจว่ายืนยันอีเมลแล้ว");
    }
    console.log("  ✓ 13. OAuth ไม่ออกคุกกี้เมื่อ D1 ล้ม + คืนชีพอีเมลที่ถูกลบ (A1-07) · สิทธิ์ไม่จำกัดต้องยืนยันอีเมล (A1-11)");
  }

  // 14. (A1-10) บันทึกแอดมินต้องได้ของใหม่สุดก่อนเสมอ
  {
    const { recordAudit, listAudit } = await import("../../src/lib/admin/audit");
    const marker = `qa_audit_${Date.now()}`;
    await recordAudit(`${marker}_old`);
    await new Promise((r) => setTimeout(r, 5));
    await recordAudit(`${marker}_new`);
    const recent = await listAudit(5);
    if (recent[0]?.action !== `${marker}_new`) {
      throw new Error(`❌ A1-10: listAudit ไม่ได้คืนเหตุการณ์ใหม่สุดก่อน (ได้ ${recent[0]?.action})`);
    }
    console.log("  ✓ 14. บันทึกแอดมินเรียงใหม่สุดก่อน (A1-10)");
  }

  // 15. (A1-04) สมัครด้วยอีเมลของบัญชีที่ถูกลบ ➔ ห้ามออกเซสชันของ id เดิมก่อนยืนยันอีเมล
  {
    const { AUTH_COOKIE_NAME } = await import("../../src/lib/auth/cookie-names");
    const goneEmail = `gone_${Date.now()}@example.com`;
    const gone = await createEmailUser({
      email: goneEmail,
      name: "บัญชีที่ลบไปแล้ว",
      passwordHash: await hashPassword("GoneAccountPassword2026!#"),
    });
    await softDeleteUser(gone.id);
    const res = await signupPost(
      new Request("https://seertarot.net/api/auth/email/signup", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://seertarot.net", "cf-connecting-ip": runIp(79) },
        body: JSON.stringify({ email: goneEmail, password: "SomeoneElsePassword2026!#", name: "คนสมัครใหม่" }),
      }),
    );
    const body = (await res.json()) as { ok?: boolean; user?: unknown };
    if ((res.headers.get("set-cookie") ?? "").includes(`${AUTH_COOKIE_NAME}=`) || body.user) {
      throw new Error("❌ A1-04: สมัครด้วยอีเมลของบัญชีที่ถูกลบแล้วได้เซสชันของ id เดิมทันทีโดยไม่ต้องยืนยันอีเมล");
    }
    if (res.status !== 200 || !body.ok) {
      throw new Error(`❌ A1-04: กิ่งรอยืนยันต้องตอบข้อความกลาง 200 (ได้ ${res.status})`);
    }
    if (await getUserById(gone.id)) {
      throw new Error("❌ A1-04: บัญชีที่ถูกลบกลับมาใช้งานได้ก่อนเจ้าของอีเมลกดยืนยัน");
    }
    // เจ้าของอีเมลกดลิงก์ยืนยัน ➔ คืนชีพ id เดิม (ยังไม่ออกคุกกี้จากลิงก์ ตามข้อ 12)
    const { GET: verifyRoute } = await import("../../src/app/api/auth/email/verify/route");
    const revivalToken = await issueToken(gone.id, "verify", 60 * 60 * 1000);
    const verified = await verifyRoute(
      new Request(`https://seertarot.net/api/auth/email/verify?token=${encodeURIComponent(revivalToken)}`, {
        headers: { "cf-connecting-ip": runIp(80) },
      }),
    );
    const back = await getUserById(gone.id);
    if (!back?.emailVerified || (verified.headers.get("set-cookie") ?? "").includes(`${AUTH_COOKIE_NAME}=`)) {
      throw new Error("❌ A1-04: กดลิงก์ยืนยันแล้วบัญชีที่รอคืนชีพไม่กลับมา (หรือออกคุกกี้จากลิงก์)");
    }
    await softDeleteUser(gone.id);
    console.log("  ✓ 15. สมัครด้วยอีเมลของบัญชีที่ถูกลบ: ไม่ออกเซสชัน · รอยืนยันอีเมลก่อนคืนชีพ (A1-04)");
  }

  // 16. (A1-05 · A2-01) ลบบัญชีต้องลบ/ล้างประวัติไพ่ประจำวัน · บันทึกอีเมลดวง · ข้อมูลส่วนบุคคลในนัดแม่หมอ
  {
    const { getAppDB } = await import("../../src/lib/platform/db");
    const { eraseExtraUserData, exportExtraUserData } = await import("../../src/lib/privacy/user-data");
    const conn = await getAppDB();
    const uid = `email_pdpa_${Date.now()}`;
    const ticketId = `qt_pdpa_${Date.now()}`;
    await conn
      .prepare(`INSERT INTO daily_readings (id, user_key, date_key, reading_id, created_at) VALUES (?, ?, '2026-10-01', 'r1', ?)`)
      .bind(`dr_${uid}`, uid, Date.now())
      .run();
    await conn
      .prepare(`INSERT INTO digest_log (user_id, send_date, channel, status, reason, created_at) VALUES (?, '2026-10-01', 'email', 'sent', NULL, ?)`)
      .bind(uid, Date.now())
      .run();
    // แม่หมอจำลองสถานะ pending (ไม่โผล่หน้ารวมแม่หมอ) — ตั๋วอ้าง FK ถึงตาราง readers
    await conn
      .prepare(
        `INSERT OR IGNORE INTO readers (id, display_name, line_url, status, session_secret, created_at, updated_at)
         VALUES ('reader_pdpa', 'แม่หมอทดสอบ PDPA', 'https://line.me/ti/p/test', 'pending', 'qa-secret', ?, ?)`,
      )
      .bind(Date.now(), Date.now())
      .run();
    await conn
      .prepare(
        `INSERT INTO queue_tickets (id, reader_id, kind, status, customer_ref, nickname, question, reading_snapshot, created_at, expires_at, user_id)
         VALUES (?, 'reader_pdpa', 'scheduled', 'done', 'cref_pdpa', 'ชื่อเล่นทดสอบ', 'คำถามส่วนตัวทดสอบ', '{}', ?, ?, ?)`,
      )
      .bind(ticketId, Date.now(), Date.now() + 86_400_000, uid)
      .run();
    await conn
      .prepare(`INSERT INTO bookings (id, ticket_id, reader_id, slot_start, slot_end, status, created_at, contact_email) VALUES (?, ?, 'reader_pdpa', 1, 2, 'done', ?, 'pdpa@example.com')`)
      .bind(`bk_${uid}`, ticketId, Date.now())
      .run();

    const exported = await exportExtraUserData(uid);
    const bookingsOut = exported.data.marketplaceBookings as Array<{ question?: string }> | undefined;
    if (!Array.isArray(exported.data.dailyReadings) || !Array.isArray(exported.data.digestLog) || bookingsOut?.[0]?.question !== "คำถามส่วนตัวทดสอบ") {
      throw new Error(`❌ A1-05/A2-01: ไฟล์ส่งออก PDPA ไม่มีประวัติไพ่ประจำวัน/อีเมลดวง/นัดแม่หมอ (${JSON.stringify(exported.failed)})`);
    }

    const erased = await eraseExtraUserData(uid);
    if (erased.failed.length > 0) throw new Error(`❌ ลบข้อมูลบางส่วนไม่สำเร็จ: ${erased.failed.join(", ")}`);
    const left = await conn
      .prepare(
        `SELECT (SELECT COUNT(*) FROM daily_readings WHERE user_key = ?) AS daily,
                (SELECT COUNT(*) FROM digest_log WHERE user_id = ?) AS digest`,
      )
      .bind(uid, uid)
      .first<{ daily: number; digest: number }>();
    if (Number(left?.daily) !== 0 || Number(left?.digest) !== 0) {
      throw new Error(`❌ A1-05: ลบบัญชีแล้ว daily_readings/digest_log ยังค้าง (${JSON.stringify(left)})`);
    }
    const ticket = await conn
      .prepare(
        `SELECT t.user_id, t.nickname, t.question, t.reading_snapshot, b.contact_email
           FROM queue_tickets t LEFT JOIN bookings b ON b.ticket_id = t.id WHERE t.id = ?`,
      )
      .bind(ticketId)
      .first<Record<string, unknown>>();
    if (!ticket) throw new Error("❌ A2-01: ลบบัญชีแล้วแถวตั๋วหายทั้งแถว — แถวการเงิน/ใบจองต้องเก็บไว้ ล้างแค่ข้อมูลส่วนบุคคล");
    if (ticket.user_id !== null || ticket.nickname !== null || ticket.question !== null || ticket.reading_snapshot !== null || ticket.contact_email !== null) {
      throw new Error(`❌ A2-01: ลบบัญชีแล้วข้อมูลส่วนบุคคลในนัดแม่หมอยังค้าง (${JSON.stringify(ticket)})`);
    }
    await conn.prepare(`DELETE FROM bookings WHERE ticket_id = ?`).bind(ticketId).run();
    await conn.prepare(`DELETE FROM queue_tickets WHERE id = ?`).bind(ticketId).run();
    await conn.prepare(`DELETE FROM readers WHERE id = 'reader_pdpa'`).run();
    console.log("  ✓ 16. ลบบัญชี: ประวัติไพ่ประจำวัน + อีเมลดวงถูกลบ (A1-05) · นัดแม่หมอล้างข้อมูลส่วนบุคคล เก็บแถวการเงิน (A2-01) · ส่งออกครบ");
  }

  // Cleanup
  await softDeleteUser(newUser.id);
  console.log("  ✓ 9. Cleanup: ทำความสะอาดข้อมูลทดสอบเรียบร้อย");

  console.log("\n✨ [QA] Email Auth Routes & Security ผ่านครบทุกด่าน 100%!");
}

runEmailAuthQATests().catch((err) => {
  console.error("\n❌ [QA Test Failed]", err);
  process.exit(1);
});
