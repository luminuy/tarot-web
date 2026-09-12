/**
 * scripts/qa/test-redeem-code.ts
 * QA — ระบบรหัสแลกสิทธิ์ (Redeem Codes)
 *
 * รันเดี่ยว: npx tsx scripts/qa/test-redeem-code.ts
 * และถูกเรียกจาก `scripts/qa/test-entitlement.ts` ด้วย เพื่อให้ด่าน CI ที่มีอยู่แล้ว
 * ("🎟 แกนสิทธิ์การเปิดไพ่") ครอบคลุมรหัสแลกสิทธิ์ไปในตัว — ไม่ต้องเพิ่มจำนวนด่าน
 *
 * ⚠️ บทเรียน: ไฟล์นี้เคยเป็นเทสต์กำพร้า (มีอยู่แต่ไม่มีใครรัน) จึงไม่มีใครรู้ว่ามันพัง
 * ตอนเพดานโควตาเปลี่ยนจาก 3 เป็น 1 — เทสต์ที่ CI ไม่รัน มีค่าเท่ากับไม่มี
 */

import { pathToFileURL } from "node:url";

import {
  getRedeemCodeInfo,
  normalizeReasonPrefix,
  redeemCodeForUser,
  redeemKindOf,
  GIFT_REASON_PREFIX,
  PREMIUM_REASON_PREFIX,
} from "../../src/lib/entitlement/redeem";
import {
  getEntitlement,
  consumeReading,
  purgeEntitlementData,
  DAILY_LIMIT,
} from "../../src/lib/entitlement/entitlement";
import {
  createRedeemCode,
  listRedeemCodes,
  listRedemptions,
  updateRedeemCode,
} from "../../src/lib/entitlement/redeem-admin.repo";
import { getAppDB } from "../../src/lib/platform/db";

type AppDB = Awaited<ReturnType<typeof getAppDB>>;

const DAY_MS = 24 * 60 * 60 * 1000;

async function makeUser(db: AppDB, id: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (id, provider, email, name, locale, created_at, last_seen_at)
       VALUES (?, 'test', ?, 'Test User', 'th', ?, ?)`,
    )
    .bind(id, `${id}@example.com`, Date.now(), Date.now())
    .run();
}

async function dropUser(db: AppDB, id: string): Promise<void> {
  await purgeEntitlementData(id);
  await db.prepare(`DELETE FROM redeem_redemptions WHERE user_id = ?`).bind(id).run();
  await db.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
}

async function makeCode(
  db: AppDB,
  opts: { code: string; prefix: string; credits: number; maxUses: number; expiresAt: number | null; isActive?: boolean },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO redeem_codes (code, title, credits, max_uses, used_count, reason_prefix, expires_at, is_active, created_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    )
    .bind(
      opts.code,
      `QA ${opts.code}`,
      opts.credits,
      opts.maxUses,
      opts.prefix,
      opts.expiresAt,
      opts.isActive === false ? 0 : 1,
      Date.now(),
    )
    .run();
}

async function dropCode(db: AppDB, code: string): Promise<void> {
  await db.prepare(`DELETE FROM redeem_redemptions WHERE code = ?`).bind(code).run();
  await db.prepare(`DELETE FROM redeem_codes WHERE code = ?`).bind(code).run();
}

/**
 * รันชุดทดสอบรหัสแลกสิทธิ์ · คืนผลรวมให้ผู้เรียก (ด่านสิทธิ์) นับต่อได้
 * @param log ปิดเสียงได้เมื่อถูกเรียกซ้อนจากด่านอื่น
 */
export async function runRedeemTests(): Promise<{ passed: number; total: number }> {
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ ${desc}`);
    } else {
      console.log(`  ❌ ${desc}`);
    }
  }

  const db = await getAppDB();
  const stamp = Date.now();

  // ── 1. อ่านข้อมูลรหัส + ชนิดของรหัส ──
  const defaultCode = await getRedeemCodeInfo("VIP3-TAROT-2026");
  assert(defaultCode !== null, "พบรหัสเริ่มต้น 'VIP3-TAROT-2026' ในฐานข้อมูล");
  assert(defaultCode?.credits === 3, "รหัสเริ่มต้นมีโควตา 3 เครดิต");
  assert(defaultCode?.isActive === true, "รหัสเริ่มต้นมีสถานะใช้งานได้ (is_active = 1)");
  assert(defaultCode?.kind === "premium", "รหัสเริ่มต้นเป็นชนิด premium (purchase_*)");
  // ช่องโหว่ที่ปิดไปแล้ว: รหัสที่ seed ไว้ในรีโปต้องไม่ใช่ "ใครก็แลกได้ไม่จำกัดคน"
  assert(defaultCode?.maxUses !== -1, "รหัสที่ seed ไว้ในรีโปต้องมีเพดานจำนวนคน (ไม่ใช่ -1)");
  assert(defaultCode?.expiresAt !== null, "รหัสที่ seed ไว้ในรีโปต้องมีวันหมดอายุ");

  assert((await getRedeemCodeInfo("NON_EXISTENT_CODE")) === null, "รหัสที่ไม่มีอยู่จริงคืนค่า null");

  // ── 2. กติกาแปลง reason_prefix (ตัวตัดสินว่าเป็นสิทธิ์ที่ซื้อหรือของแจก) ──
  assert(redeemKindOf(PREMIUM_REASON_PREFIX) === "premium", "prefix purchase_* ➔ premium");
  assert(redeemKindOf(GIFT_REASON_PREFIX) === "gift", "prefix gift_* ➔ gift");
  assert(normalizeReasonPrefix("  Purchase_Redeem ") === "purchase_redeem", "ตัดช่องว่าง/ตัวพิมพ์ใหญ่ก่อนตัดสิน");
  assert(normalizeReasonPrefix("") === GIFT_REASON_PREFIX, "prefix ว่าง ➔ ตกไปทาง gift (สิทธิ์น้อยสุด)");
  assert(normalizeReasonPrefix("promo!!2026") === "promo2026", "prefix promo_* ผ่านตามเดิม (ชื่อที่แผงแอดมินใช้)");
  assert(normalizeReasonPrefix("weird!!thing") === "gift_weirdthing", "prefix แปลกที่ไม่รู้จัก ➔ บังคับเป็น gift_");
  assert(
    redeemKindOf(normalizeReasonPrefix("PURCHASE_ ANYTHING")) === "premium",
    "prefix purchase_ ที่มีอักขระแปลกยังคงเป็น premium หลังล้าง",
  );

  // ── 3. แลกรหัส premium: ได้รอบ + ปลดสิทธิ์พรีเมียม ──
  const premiumUser = `usr_test_redeem_${stamp}`;
  await makeUser(db, premiumUser);

  const entBefore = await getEntitlement({ kind: "member", userId: premiumUser });
  assert(entBefore.hasPaidCredits === false, "ก่อนแลกรหัส: ยังไม่มีสิทธิ์พรีเมียม");

  const redeemRes = await redeemCodeForUser(premiumUser, "vip3-tarot-2026"); // ตัวพิมพ์เล็ก
  assert(redeemRes.ok === true, "แลกรับสิทธิ์สำเร็จด้วยตัวพิมพ์เล็ก (case-insensitive)");
  if (redeemRes.ok) {
    assert(redeemRes.credits === 3, "ได้รับสิทธิ์ 3 ครั้งถูกต้อง");
    assert(redeemRes.kind === "premium", "ผลลัพธ์บอกชนิดรหัสเป็น premium");
  }

  const entAfter = await getEntitlement({ kind: "member", userId: premiumUser });
  assert(entAfter.hasPaidCredits === true, "หลังแลกรหัส VIP: ปลดล็อกสิทธิ์พรีเมียมสำเร็จ");
  assert(entAfter.bonusRemaining === 3, "หลังแลกรหัส: ได้รับโควตาโบนัส 3 ครั้ง");

  const duplicateRes = await redeemCodeForUser(premiumUser, "VIP3-TAROT-2026");
  assert(duplicateRes.ok === false, "ป้องกันการแลกซ้ำสำเร็จ");
  if (!duplicateRes.ok) {
    assert(duplicateRes.error.includes("เคยใช้"), "ข้อความ error ระบุว่าเคยใช้รหัสนี้ไปแล้ว");
  }

  // ── 4. ลำดับการตัดสิทธิ์: โควตารายวันก่อน แล้วค่อยกินโบนัสที่แลกมา ──
  for (let i = 1; i <= DAILY_LIMIT; i++) {
    const r = await consumeReading({ kind: "member", userId: premiumUser }, `read_daily_${i}_${stamp}`, "celtic-cross");
    assert(r === true, `ใช้สิทธิ์โควตารายวันครั้งที่ ${i}/${DAILY_LIMIT} สำเร็จ`);
  }
  const entAfterDaily = await getEntitlement({ kind: "member", userId: premiumUser });
  assert(entAfterDaily.dailyRemaining === 0, `โควตารายวัน ${DAILY_LIMIT} ครั้งหมดแล้ว`);
  assert(entAfterDaily.hasPaidCredits === true, "ยังมีสิทธิ์พรีเมียมจากโบนัสที่แลกมา");
  assert(entAfterDaily.bonusRemaining === 3, "โควตาโบนัส 3 ครั้งยังอยู่ครบ (โควตารายวันไม่กินโบนัส)");

  for (let i = 1; i <= 3; i++) {
    const ok = await consumeReading({ kind: "member", userId: premiumUser }, `read_bonus_${i}_${stamp}`, "celtic-cross");
    assert(ok === true, `ใช้สิทธิ์พรีเมียมครั้งที่ ${i} สำเร็จ`);
    const ent = await getEntitlement({ kind: "member", userId: premiumUser });
    assert(ent.bonusRemaining === 3 - i, `เหลือโบนัส ${3 - i} ครั้ง`);
    assert(
      ent.hasPaidCredits === i < 3,
      i < 3 ? `หลังใช้ครั้งที่ ${i}: ยังมีสิทธิ์พรีเมียม` : "ใช้ครบ 3 ครั้ง: สิทธิ์พรีเมียมหมดลงถูกต้อง",
    );
  }

  await dropUser(db, premiumUser);
  await db.prepare(`UPDATE redeem_codes SET used_count = 0 WHERE code = 'VIP3-TAROT-2026'`).run();

  // ── 5. รหัสแจก (gift) ต้องไม่ปลดฟีเจอร์พรีเมียม ──
  const giftCode = `GIFT-QA-${stamp}`;
  const giftUser = `usr_test_gift_${stamp}`;
  await makeCode(db, { code: giftCode, prefix: GIFT_REASON_PREFIX, credits: 2, maxUses: 1, expiresAt: Date.now() + DAY_MS });
  await makeUser(db, giftUser);

  const giftRes = await redeemCodeForUser(giftUser, giftCode);
  assert(giftRes.ok === true, "แลกรหัสแจกสำเร็จ");
  if (giftRes.ok) assert(giftRes.kind === "gift", "ผลลัพธ์บอกชนิดรหัสเป็น gift");

  const giftEnt = await getEntitlement({ kind: "member", userId: giftUser });
  assert(giftEnt.bonusRemaining === 2, "รหัสแจกให้รอบเปิดไพ่ 2 ครั้ง");
  assert(giftEnt.hasPaidCredits === false, "รหัสแจก **ไม่** ปลดผังใหญ่/ปรมาจารย์ลับ (hasPaidCredits = false)");

  // ── 6. เพดานจำนวนคน (max_uses) ต้องบังคับได้จริง ──
  const secondUser = `usr_test_gift2_${stamp}`;
  await makeUser(db, secondUser);
  const overLimit = await redeemCodeForUser(secondUser, giftCode);
  assert(overLimit.ok === false, "คนที่ 2 แลกรหัสที่เพดาน 1 สิทธิ์ไม่ได้");

  // ── 7. ยิงขนานแย่งสิทธิ์ใบสุดท้าย — ต้องสำเร็จคนเดียว (กัน TOCTOU) ──
  const raceCode = `RACE-QA-${stamp}`;
  await makeCode(db, { code: raceCode, prefix: GIFT_REASON_PREFIX, credits: 1, maxUses: 1, expiresAt: Date.now() + DAY_MS });
  const racers = [`usr_race_a_${stamp}`, `usr_race_b_${stamp}`, `usr_race_c_${stamp}`];
  for (const id of racers) await makeUser(db, id);

  const raceResults = await Promise.all(racers.map((id) => redeemCodeForUser(id, raceCode)));
  assert(raceResults.filter((r) => r.ok).length === 1, "ยิงขนาน 3 คนบนรหัสที่เหลือ 1 สิทธิ์ ➔ สำเร็จคนเดียว");
  const raceRow = await getRedeemCodeInfo(raceCode);
  assert(raceRow?.usedCount === 1, "ยอดแลกของรหัสถูกนับเพียง 1 ไม่เกินเพดาน");

  // ── 8. รหัสหมดอายุ / ถูกปิด ──
  const expiredCode = `EXP-QA-${stamp}`;
  const offCode = `OFF-QA-${stamp}`;
  const lateUser = `usr_late_${stamp}`;
  await makeCode(db, { code: expiredCode, prefix: GIFT_REASON_PREFIX, credits: 1, maxUses: 10, expiresAt: Date.now() - DAY_MS });
  await makeCode(db, { code: offCode, prefix: GIFT_REASON_PREFIX, credits: 1, maxUses: 10, expiresAt: null, isActive: false });
  await makeUser(db, lateUser);

  const expiredRes = await redeemCodeForUser(lateUser, expiredCode);
  assert(expiredRes.ok === false, "รหัสหมดอายุแลกไม่ได้");
  if (!expiredRes.ok) assert(expiredRes.error.includes("หมดอายุ"), "ข้อความ error บอกว่าหมดอายุ");

  const offRes = await redeemCodeForUser(lateUser, offCode);
  assert(offRes.ok === false, "รหัสที่ถูกปิดแลกไม่ได้");
  if (!offRes.ok) assert(offRes.error.includes("ปิดใช้งาน"), "ข้อความ error บอกว่าถูกปิดใช้งาน");

  // ── 9. ชั้นออกรหัสของแอดมิน (redeem-admin.repo) ──
  // กติกาสำคัญ: ทุกใบต้องมีเพดานจำนวนคนและวันหมดอายุ — ห้ามมี "ไม่จำกัด" อีก (INC-0134)
  const adminCode = `ADMIN-QA-${stamp}`;
  const futureExp = Date.now() + 7 * DAY_MS;

  const rejectUnlimited = await createRedeemCode({
    code: `${adminCode}-U`,
    title: "QA ไม่จำกัดคน",
    credits: 1,
    kind: "quota",
    maxUses: -1,
    expiresAt: futureExp,
  }).then(() => null).catch((e: Error) => e);
  assert(rejectUnlimited instanceof Error, "แอดมินสร้างรหัส 'ไม่จำกัดคน' (max_uses = -1) ไม่ได้");

  const rejectNoExpiry = await createRedeemCode({
    code: `${adminCode}-N`,
    title: "QA ไม่มีวันหมดอายุ",
    credits: 1,
    kind: "quota",
    maxUses: 10,
    expiresAt: null,
  }).then(() => null).catch((e: Error) => e);
  assert(rejectNoExpiry instanceof Error, "แอดมินสร้างรหัสที่ไม่มีวันหมดอายุไม่ได้");

  const created = await createRedeemCode({
    code: adminCode,
    title: "QA แคมเปญทดสอบ",
    credits: 2,
    kind: "quota",
    maxUses: 5,
    expiresAt: futureExp,
  });
  assert(created.code === adminCode.toUpperCase(), "สร้างรหัสผ่านชั้นแอดมินสำเร็จ (เก็บเป็นตัวพิมพ์ใหญ่)");
  assert(created.reasonPrefix === "promo_redeem", "ชนิด quota ➔ reason_prefix = promo_redeem");

  // รหัสที่ออกจากแผงแอดมินแบบ quota ต้องไม่ปลดพรีเมียมเมื่อผู้ใช้แลกจริง
  const promoUser = `usr_promo_${stamp}`;
  await makeUser(db, promoUser);
  const promoRes = await redeemCodeForUser(promoUser, adminCode);
  assert(promoRes.ok === true, "ผู้ใช้แลกรหัสที่แอดมินออกให้ได้");
  if (promoRes.ok) assert(promoRes.kind === "gift", "รหัส promo_redeem ถูกจัดเป็นชนิด gift");
  const promoEnt = await getEntitlement({ kind: "member", userId: promoUser });
  assert(promoEnt.bonusRemaining === 2, "ได้รอบเปิดไพ่ 2 ครั้งจากรหัสแอดมิน");
  assert(promoEnt.hasPaidCredits === false, "รหัส promo_redeem **ไม่** ปลดฟีเจอร์พรีเมียม");

  // ยอดผู้แลกต้องอ่านกลับมาได้ (หน้าจอ "ดูคนที่แลก")
  const redemptions = await listRedemptions(adminCode);
  assert(redemptions.length === 1 && redemptions[0].userId === promoUser, "listRedemptions คืนผู้แลกถูกคน");
  const listed = (await listRedeemCodes()).find((c) => c.code === adminCode.toUpperCase());
  assert(listed?.actualRedeemedCount === 1, "รายการรหัสรายงานยอดแลกจริง 1 ครั้ง");

  // แก้ชื่อแคมเปญได้ แต่แก้ย้อนกลับไปเป็นไม่จำกัด/ไม่มีวันหมดอายุไม่ได้
  const renamed = await updateRedeemCode(adminCode, { title: "QA เปลี่ยนชื่อแล้ว" });
  assert(renamed.title === "QA เปลี่ยนชื่อแล้ว", "แก้ชื่อแคมเปญได้");
  const rejectBackToUnlimited = await updateRedeemCode(adminCode, { maxUses: -1 })
    .then(() => null)
    .catch((e: Error) => e);
  assert(rejectBackToUnlimited instanceof Error, "แก้เพดานกลับไปเป็น -1 ไม่ได้");
  const rejectClearExpiry = await updateRedeemCode(adminCode, { expiresAt: null })
    .then(() => null)
    .catch((e: Error) => e);
  assert(rejectClearExpiry instanceof Error, "ลบวันหมดอายุออกไม่ได้");

  // ── เก็บกวาด ──
  for (const id of [giftUser, secondUser, lateUser, promoUser, ...racers]) await dropUser(db, id);
  for (const c of [giftCode, raceCode, expiredCode, offCode, adminCode.toUpperCase()]) await dropCode(db, c);

  return { passed, total };
}

async function main() {
  console.log("🧪 [QA] ระบบรหัสแลกสิทธิ์ (Redeem Codes)\n");
  const { passed, total } = await runRedeemTests();
  console.log(`\n📊 สรุปผลการทดสอบ: ผ่าน ${passed}/${total} การทดสอบ`);
  if (passed !== total) process.exit(1);
  console.log("🎉 ทุกการทดสอบของระบบ Redeem Code ผ่านเรียบร้อย 100%!");
}

// รันเฉพาะตอนถูกเรียกตรง ๆ — ถูก import จากด่านสิทธิ์ได้โดยไม่รันซ้ำ
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error("❌ เกิดข้อผิดพลาดในการรันการทดสอบ:", err);
    process.exit(1);
  });
}
