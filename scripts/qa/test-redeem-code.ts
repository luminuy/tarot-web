import { getRedeemCodeInfo, redeemCodeForUser } from "../../src/lib/entitlement/redeem";
import { getEntitlement, consumeReading, purgeEntitlementData } from "../../src/lib/entitlement/entitlement";
import { getAppDB } from "../../src/lib/platform/db";

async function runTests() {
  console.log("🧪 เริ่มต้นการทดสอบระบบรหัสแลกสิทธิ์ (Redeem Code Tests)...\n");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  // 1. ตรวจสอบการอ่านข้อมูลรหัสเริ่มต้น
  const defaultCode = await getRedeemCodeInfo("VIP3-TAROT-2026");
  assert(defaultCode !== null, "พบรหัสเริ่มต้น 'VIP3-TAROT-2026' ในฐานข้อมูล");
  assert(defaultCode?.credits === 3, "รหัสเริ่มต้นมีโควตา 3 เครดิต");
  assert(defaultCode?.isActive === true, "รหัสเริ่มต้นมีสถานะใช้งานได้ (is_active = 1)");

  const invalidCode = await getRedeemCodeInfo("NON_EXISTENT_CODE");
  assert(invalidCode === null, "รหัสที่ไม่มีอยู่จริงคืนค่า null ถูกต้อง");

  // 2. ทดสอบการแลกรับสิทธิ์สำหรับผู้ใช้ทดสอบ
  const testUserId = `usr_test_redeem_${Date.now()}`;
  const db = await getAppDB();

  // สร้าง mock user ในตาราง users
  await db
    .prepare(
      `INSERT INTO users (id, provider, email, name, locale, created_at, last_seen_at)
       VALUES (?, 'test', ?, 'Test User', 'th', ?, ?)`,
    )
    .bind(testUserId, `${testUserId}@example.com`, Date.now(), Date.now())
    .run();

  // ก่อนแลก: ต้องยังไม่มีสิทธิ์พรีเมียม (hasPaidCredits = false)
  const entBefore = await getEntitlement({ kind: "member", userId: testUserId });
  assert(entBefore.hasPaidCredits === false, "ก่อนแลกรหัส: ผู้ใช้ยังไม่มีสิทธิ์พรีเมียม (hasPaidCredits: false)");

  // แลกรับสิทธิ์ครั้งแรก
  const redeemRes = await redeemCodeForUser(testUserId, "vip3-tarot-2026"); // ทดสอบ case-insensitive
  assert(redeemRes.ok === true, "แลกรับสิทธิ์สำเร็จด้วยตัวพิมพ์เล็ก (case-insensitive)");
  if (redeemRes.ok) {
    assert(redeemRes.credits === 3, "ได้รับสิทธิ์ 3 ครั้งถูกต้อง");
  }

  // หลังแลก: ต้องได้รับโควตาและมีสถานะ hasPaidCredits = true ทันที
  const entAfter = await getEntitlement({ kind: "member", userId: testUserId });
  assert(entAfter.hasPaidCredits === true, "หลังแลกรหัส: ปลดล็อกสิทธิ์พรีเมียมสำเร็จ (hasPaidCredits: true)");
  assert(entAfter.bonusRemaining === 3, "หลังแลกรหัส: ได้รับโควตาโบนัส 3 ครั้ง");

  // 3. ทดสอบการป้องกันการแลกซ้ำด้วยบัญชีเดิม
  const duplicateRes = await redeemCodeForUser(testUserId, "VIP3-TAROT-2026");
  assert(duplicateRes.ok === false, "ป้องกันการแลกซ้ำสำเร็จ (คืนค่า ok: false)");
  if (!duplicateRes.ok) {
    assert(duplicateRes.error.includes("เคยใช้"), "ข้อความ error ระบุว่าเคยใช้รหัสนี้ไปแล้ว");
  }

  // 4. ทดสอบการตัดสิทธิ์
  // ชั้นที่ 1: สมาชิกใช้โควตารายวันก่อน 3 ครั้ง (ยังคงมีสิทธิ์พรีเมียม hasPaidCredits = true)
  for (let i = 1; i <= 3; i++) {
    const r = await consumeReading({ kind: "member", userId: testUserId }, `read_daily_${i}_${Date.now()}`, "celtic-cross");
    assert(r === true, `ใช้สิทธิ์โควตารายวันครั้งที่ ${i} สำเร็จ`);
  }
  const entAfterDaily = await getEntitlement({ kind: "member", userId: testUserId });
  assert(entAfterDaily.dailyRemaining === 0, "โควตารายวัน 3 ครั้งหมดแล้ว");
  assert(entAfterDaily.hasPaidCredits === true, "ยังมีสิทธิ์พรีเมียมจากโบนัสที่แลกมา (hasPaidCredits: true)");
  assert(entAfterDaily.bonusRemaining === 3, "โควตาโบนัส 3 ครั้งยังอยู่ครบ");

  // ชั้นที่ 2: ใช้สิทธิ์พรีเมียมที่แลกมา (3 ครั้ง)
  // ครั้งที่ 1 ของโบนัส
  const b1 = await consumeReading({ kind: "member", userId: testUserId }, `read_bonus_1_${Date.now()}`, "celtic-cross");
  assert(b1 === true, "ใช้สิทธิ์พรีเมียมครั้งที่ 1 สำเร็จ");
  const entB1 = await getEntitlement({ kind: "member", userId: testUserId });
  assert(entB1.hasPaidCredits === true, "หลังใช้พรีเมียมครั้งที่ 1: ยังมีสิทธิ์เหลือ (hasPaidCredits: true)");
  assert(entB1.bonusRemaining === 2, "เหลือโบนัส 2 ครั้ง");

  // ครั้งที่ 2 ของโบนัส
  const b2 = await consumeReading({ kind: "member", userId: testUserId }, `read_bonus_2_${Date.now()}`, "celtic-cross");
  assert(b2 === true, "ใช้สิทธิ์พรีเมียมครั้งที่ 2 สำเร็จ");
  const entB2 = await getEntitlement({ kind: "member", userId: testUserId });
  assert(entB2.hasPaidCredits === true, "หลังใช้พรีเมียมครั้งที่ 2: ยังมีสิทธิ์เหลือ (hasPaidCredits: true)");
  assert(entB2.bonusRemaining === 1, "เหลือโบนัส 1 ครั้ง");

  // ครั้งที่ 3 ของโบนัส (ครั้งสุดท้าย)
  const b3 = await consumeReading({ kind: "member", userId: testUserId }, `read_bonus_3_${Date.now()}`, "celtic-cross");
  assert(b3 === true, "ใช้สิทธิ์พรีเมียมครั้งที่ 3 สำเร็จ");
  const entB3 = await getEntitlement({ kind: "member", userId: testUserId });
  assert(entB3.hasPaidCredits === false, "หลังใช้ครบ 3 ครั้ง: สิทธิ์พรีเมียมหมดลงอย่างถูกต้อง (hasPaidCredits: false)");
  assert(entB3.bonusRemaining === 0, "โบนัสเหลือ 0 ครั้ง");

  // Cleanup test user (ต้องลบตารางลูกที่อ้างอิง users ก่อนตามกฎ FK)
  await purgeEntitlementData(testUserId);
  await db.prepare(`DELETE FROM redeem_redemptions WHERE user_id = ?`).bind(testUserId).run();
  await db.prepare(`DELETE FROM users WHERE id = ?`).bind(testUserId).run();
  await db.prepare(`UPDATE redeem_codes SET used_count = 0 WHERE code = 'VIP3-TAROT-2026'`).run();

  console.log(`\n📊 สรุปผลการทดสอบ: ผ่าน ${passed}/${total} การทดสอบ`);
  if (passed === total) {
    console.log("🎉 ทุกการทดสอบของระบบ Redeem Code ผ่านเรียบร้อย 100%!");
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("❌ เกิดข้อผิดพลาดในการรันการทดสอบ:", err);
  process.exit(1);
});
