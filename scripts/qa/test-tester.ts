/**
 * scripts/qa/test-tester.ts
 * QA — บัญชีผู้ทดสอบ (tarot_tester) ปลดล็อกการใช้งานไม่จำกัด โดยไม่ให้สิทธิ์แอดมิน
 * รันด้วย: npx tsx scripts/qa/test-tester.ts
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

async function main() {
  console.log("🧪 [QA] บัญชีผู้ทดสอบ\n");

  // ต้องตั้ง TESTER_PASSWORD ก่อน import (module อ่าน env ตอนเรียกฟังก์ชัน — ปลอดภัยที่จะ set ที่นี่)
  process.env.TESTER_PASSWORD = "test-pass-1234567890";
  process.env.TAROT_SESSION_SECRET = process.env.TAROT_SESSION_SECRET ?? "dev-session-secret-32-characters-min";

  const {
    isTesterConfigured,
    verifyTesterPassword,
    signTesterSession,
    verifyTesterSession,
  } = await import("../../src/lib/auth/tester-auth");
  const { verifyAdminSession } = await import("../../src/lib/auth/admin-auth");

  check("isTesterConfigured: รหัสยาวพอ → true", isTesterConfigured() === true);
  check("verifyTesterPassword: รหัสถูก → true", verifyTesterPassword("test-pass-1234567890") === true);
  check("verifyTesterPassword: รหัสผิด → false", verifyTesterPassword("wrong") === false);
  check("verifyTesterPassword: รหัสว่าง → false", verifyTesterPassword("") === false);

  const token = signTesterSession();
  check("sign→verify session คืน true", verifyTesterSession(token) === true);
  check("verify session: token ขยะ → false", verifyTesterSession("garbage") === false);
  check("verify session: token ถูกแก้ → false", verifyTesterSession(token.slice(0, -4) + "zzzz") === false);
  check("verify session: undefined → false", verifyTesterSession(undefined) === false);

  // ⚠️ สำคัญ: tester session ต้องไม่ผ่านการตรวจแบบ admin (คนละกลไก คนละ role)
  check("tester token ใช้เป็น admin session ไม่ได้", verifyAdminSession(token) === false);

  // เปลี่ยนรหัสผ่าน → session เดิมใช้ไม่ได้ (secret ผูกกับรหัส)
  process.env.TESTER_PASSWORD = "different-pass-1234567890";
  check("เปลี่ยน TESTER_PASSWORD → session เดิมถูกเตะทิ้ง", verifyTesterSession(token) === false);

  // ไม่ตั้งรหัส / รหัสสั้น → ปิดทั้งหมด
  process.env.TESTER_PASSWORD = "short";
  check("รหัสสั้นกว่า 12 → isTesterConfigured = false", isTesterConfigured() === false);
  check("รหัสสั้น → verifyTesterSession = false", verifyTesterSession(signTesterSession()) === false);

  console.log(`\n${pass}/${pass + fail} ผ่าน`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ test-tester ล้มเหลว:", err);
  process.exit(1);
});
