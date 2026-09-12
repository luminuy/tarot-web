/**
 * scripts/qa/test-entitlement.ts
 * QA — แกนสิทธิ์การเปิดไพ่ (ENTITLEMENT_PLAN ข้อ 5 · เกณฑ์ผ่านข้อ 2,4,5,8)
 * รันด้วย: npx tsx scripts/qa/test-entitlement.ts
 */

import { weekKey, nextResetAt } from "../../src/lib/entitlement/week";
import {
  getEntitlement,
  consumeReading,
  refundReading,
  grantBonus,
  grantSignupBonus,
  purgeEntitlementData,
  DAILY_LIMIT,
  GUEST_LIMIT,
  REQUIRE_SIGNUP_TO_READ,
  SIGNUP_BONUS,
  type Viewer,
} from "../../src/lib/entitlement/entitlement";
import { upsertUserOnLogin, softDeleteUser } from "../../src/lib/users/users.repo";
import { getAppDB } from "../../src/lib/platform/db";
import { todayDateKey, getDailyStreak } from "../../src/lib/entitlement/daily";

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
  console.log("🧪 [QA] แกนสิทธิ์การเปิดไพ่\n");

  // ── 1. weekKey คร่อมวันอาทิตย์/จันทร์ เวลาไทย (เกณฑ์ข้อ 4) ──
  const sun = weekKey(new Date("2026-08-30T16:30:00Z")); // อา 23:30 ไทย
  const mon = weekKey(new Date("2026-08-30T17:30:00Z")); // จ 00:30 ไทย
  check("weekKey: อาทิตย์ 23:30 กับ จันทร์ 00:30 ไทย → คนละสัปดาห์", sun !== mon);
  check("weekKey: คืนวันจันทร์ต้นสัปดาห์", mon === "2026-08-31");
  check("nextResetAt: เป็น ISO string อนาคต", new Date(nextResetAt()).getTime() > Date.now());

  // ── 2. ผู้เยี่ยมชม — นโยบาย "เล่นฟรีได้ แต่ต้องสมัครสมาชิกก่อน" (2026-09-09) ──
  // ด่านนี้คือตัวกันไม่ให้ใครเผลอเปิดสิทธิ์ทดลองแบบไม่ล็อกอินกลับมาเงียบ ๆ
  check("นโยบายสมัครก่อนเล่น: GUEST_LIMIT = 0", GUEST_LIMIT === 0);
  check("นโยบายสมัครก่อนเล่น: REQUIRE_SIGNUP_TO_READ = true", REQUIRE_SIGNUP_TO_READ === true);

  const guestFresh: Viewer = { kind: "guest", gid: "g1", guestUsed: 0 };
  const guestUsed: Viewer = { kind: "guest", gid: "g1", guestUsed: 1 };
  const eg1 = await getEntitlement(guestFresh);
  check("guest ใหม่: canStartReading = false (ต้องสมัครก่อน)", eg1.canStartReading === false);
  check("guest ใหม่: remaining = 0", eg1.remaining === 0);
  // ถ้อยคำคนละเรื่องกัน — คนที่ยังไม่เคยเล่นต้องไม่โดนบอกว่า "ใช้สิทธิ์ทดลองครบแล้ว"
  check("guest ใหม่: reason = signup_required (ไม่ใช่ guest_used)", eg1.reason === "signup_required");
  check("guest ใหม่: canChat = false", eg1.canChat === false);
  const eg2 = await getEntitlement(guestUsed);
  check("guest ที่มีคุกกี้เก่า: ยังถูกกั้นด้วย signup_required", !eg2.canStartReading && eg2.reason === "signup_required");
  check("consumeReading(guest ใหม่) = false (หักสิทธิ์ให้ผู้ไม่ล็อกอินไม่ได้)", (await consumeReading(guestFresh, "r_g_1")) === false);
  check("consumeReading(guest คุกกี้เก่า) = false", (await consumeReading(guestUsed, "r_g_2")) === false);

  // ── 3. สมาชิก — ตั้งผู้ใช้ทดสอบ ──
  const uid = `test_ent_${Date.now()}`;
  await upsertUserOnLogin({ id: uid, provider: "google", email: `${uid}@example.com`, name: "ทดสอบสิทธิ์" });
  const member: Viewer = { kind: "member", userId: uid };
  /** จำนวนรอบที่จำลองว่าเติมมาจากการซื้อแพ็กเกจ (แทนโบนัสสมัครใหม่ที่ยกเลิกไปแล้ว) */
  const TOPUP_ROUNDS = 3;

  const em0 = await getEntitlement(member);
  check(`สมาชิกใหม่ (ยังไม่โบนัส): dailyRemaining = ${DAILY_LIMIT}`, em0.dailyRemaining === DAILY_LIMIT);
  check(`สมาชิกใหม่: remaining = ${DAILY_LIMIT}, canStart = true`, em0.remaining === DAILY_LIMIT && em0.canStartReading);
  check("สมาชิก: canChat = true", em0.canChat === true);
  check("สมาชิก: resetAt ไม่ใช่ null", em0.resetAt !== null);

  // นโยบาย 2026-09-02: เลิกแจกโบนัสสมัครใหม่ — grantSignupBonus ต้องไม่เพิ่มสิทธิ์ให้ใครอีก
  check("ปิดโบนัสแจกฟรี: SIGNUP_BONUS = 0", SIGNUP_BONUS === 0);
  await grantSignupBonus(uid);
  await grantSignupBonus(uid); // เรียกซ้ำ
  const emNoBonus = await getEntitlement(member);
  check("สมัครใหม่ไม่ได้โบนัส: bonusRemaining = 0", emNoBonus.bonusRemaining === 0);

  // "รอบที่เติมไว้" จากการซื้อแพ็กเกจยังต้องทำงานเหมือนเดิม (idempotent ต่อ reason)
  await grantBonus(uid, TOPUP_ROUNDS, "purchase_test_topup");
  await grantBonus(uid, 99, "purchase_test_topup"); // reason เดิม — ต้องไม่เพิ่ม
  const em1 = await getEntitlement(member);
  check("เติมรอบ idempotent: bonusRemaining = 3 (ไม่ใช่ 6 หรือ 102)", em1.bonusRemaining === TOPUP_ROUNDS);
  check(`สมาชิกหลังเติมรอบ: remaining = ${DAILY_LIMIT + TOPUP_ROUNDS}`, em1.remaining === DAILY_LIMIT + TOPUP_ROUNDS);

  // ── 4. ลำดับการหัก: daily ก่อน bonus (เกณฑ์ข้อ 5) ──
  // ⚠️ จำนวนครั้งต้องผูกกับ `DAILY_LIMIT` ห้ามพิมพ์เลขลงไปตรง ๆ
  // (ของเดิมพิมพ์ 3 ไว้ พอเจ้าของเปลี่ยนเพดานเป็น 1 ด่านนี้ตกทั้งที่ระบบถูกต้อง)
  for (let i = 1; i <= DAILY_LIMIT; i++) {
    check(`หักโควตารายวันครั้งที่ ${i}/${DAILY_LIMIT}`, (await consumeReading(member, `r_${uid}_${i}`)) === true);
  }
  const firstBonusId = `r_${uid}_b1`;
  check("หักครั้งถัดจากโควตารายวัน (ควรกินโบนัส)", (await consumeReading(member, firstBonusId)) === true);

  const db = await getAppDB();
  const dk = todayDateKey();
  const dailyRows = await db
    .prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ? AND (week_key = ? OR source = 'daily') AND source != 'bonus'`)
    .bind(uid, dk)
    .first<{ n: number }>();
  const bonusRows = await db
    .prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ? AND source = 'bonus'`)
    .bind(uid)
    .first<{ n: number }>();
  check(`มี daily ${DAILY_LIMIT} แถว`, Number(dailyRows?.n) === DAILY_LIMIT);
  check("มี bonus 1 แถว", Number(bonusRows?.n) === 1);

  const em2 = await getEntitlement(member);
  check(
    `หลังหักครบรายวัน + โบนัส 1: dailyRemaining = 0, bonusRemaining = ${TOPUP_ROUNDS - 1}`,
    em2.dailyRemaining === 0 && em2.bonusRemaining === TOPUP_ROUNDS - 1,
  );

  // ── 5. หักซ้ำ readingId เดิมไม่ได้ (เกณฑ์ข้อ 2) ──
  const before = (await db.prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ?`).bind(uid).first<{ n: number }>())?.n;
  // r_1 ถูกหักไปแล้วด้านบน — ยิงซ้ำอีก 3 ครั้งพร้อมกัน ต้องไม่เพิ่มแถว
  await Promise.all([
    consumeReading(member, `r_${uid}_1`),
    consumeReading(member, `r_${uid}_1`),
    consumeReading(member, `r_${uid}_1`),
  ]);
  const after = (await db.prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ?`).bind(uid).first<{ n: number }>())?.n;
  check("หัก readingId เดิม 3 ครั้งพร้อมกัน → จำนวนแถวไม่เพิ่ม", Number(before) === Number(after));
  check("มี reading_usage แถวเดียวสำหรับ r_1", Number((await db.prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE reading_id = ?`).bind(`r_${uid}_1`).first<{ n: number }>())?.n) === 1);

  // ── 6. refundReading คืนสิทธิ์ ──
  await refundReading(firstBonusId); // คืน bonus
  const em3 = await getEntitlement(member);
  check(`refund: bonusRemaining กลับเป็น ${TOPUP_ROUNDS}`, em3.bonusRemaining === TOPUP_ROUNDS);
  await refundReading("r_nonexistent"); // no-op ปลอดภัย
  check("refund readingId ที่ไม่มี → ไม่ throw", true);

  // ── 7. สิทธิ์หมด → consumeReading = false ──
  // โควตารายวันหมดไปแล้วจากข้อ 4 — ไล่กินโบนัสที่เหลือให้ครบ
  for (let i = 0; i < TOPUP_ROUNDS; i++) {
    await consumeReading(member, `r_${uid}_x${i}`);
  }
  const em4 = await getEntitlement(member);
  check(
    `ใช้ครบ ${DAILY_LIMIT + TOPUP_ROUNDS}: canStartReading = false`,
    !em4.canStartReading && (em4.reason === "daily_exhausted" || em4.reason === "weekly_exhausted"),
  );
  check("consumeReading เมื่อสิทธิ์หมด = false", (await consumeReading(member, `r_${uid}_8`)) === false);

  // ── 7b. ป้องกัน Double-Spend เมื่อยิงคำขอเปิดไพ่ขนาน (ISSUE-017) ──
  const concUid = `test_conc_${Date.now()}`;
  await upsertUserOnLogin({ id: concUid, provider: "google", email: `${concUid}@example.com`, name: "ทดสอบ Double Spend" });
  const concMember: Viewer = { kind: "member", userId: concUid };

  // 1) ใช้จนเหลือ daily อีก 1 ครั้งพอดี (เพดานเท่าไรก็ตาม)
  for (let i = 1; i < DAILY_LIMIT; i++) {
    await consumeReading(concMember, `r_setup_${i}`);
  }
  const concEntBefore = await getEntitlement(concMember);
  check("เหลือโควตารายวัน 1 ครั้งพอดี", concEntBefore.dailyRemaining === 1 && concEntBefore.remaining === 1);

  // ยิงขนาน 5 คำขอด้วย readingId ต่างกัน
  const concDailyResults = await Promise.all([
    consumeReading(concMember, `r_parallel_d1`),
    consumeReading(concMember, `r_parallel_d2`),
    consumeReading(concMember, `r_parallel_d3`),
    consumeReading(concMember, `r_parallel_d4`),
    consumeReading(concMember, `r_parallel_d5`),
  ]);
  const dailySuccesses = concDailyResults.filter((r) => r === true).length;
  const dailyFailures = concDailyResults.filter((r) => r === false).length;
  check("Double-Spend Daily: ยิงขนาน 5 ครั้งเมื่อเหลือ 1 สิทธิ์ → สำเร็จเพียง 1 ครั้งเท่านั้น", dailySuccesses === 1);
  check("Double-Spend Daily: อีก 4 ครั้งล้มเหลวถูกต้อง", dailyFailures === 4);

  // 2) ทดสอบโควตาโบนัส: เติม 1 ครั้ง (daily หมดแล้ว) แล้วยิงขนาน 5 ครั้ง
  await grantBonus(concUid, 1, "purchase_conc_test");
  const concBonusEnt = await getEntitlement(concMember);
  check("เหลือโควตาโบนัส 1 ครั้งพอดี (daily = 0)", concBonusEnt.dailyRemaining === 0 && concBonusEnt.bonusRemaining === 1);

  const concBonusResults = await Promise.all([
    consumeReading(concMember, `r_parallel_b1`),
    consumeReading(concMember, `r_parallel_b2`),
    consumeReading(concMember, `r_parallel_b3`),
    consumeReading(concMember, `r_parallel_b4`),
    consumeReading(concMember, `r_parallel_b5`),
  ]);
  const bonusSuccesses = concBonusResults.filter((r) => r === true).length;
  const bonusFailures = concBonusResults.filter((r) => r === false).length;
  check("Double-Spend Bonus: ยิงขนาน 5 ครั้งเมื่อเหลือ 1 สิทธิ์โบนัส → สำเร็จเพียง 1 ครั้งเท่านั้น", bonusSuccesses === 1);
  check("Double-Spend Bonus: อีก 4 ครั้งล้มเหลวถูกต้อง", bonusFailures === 4);

  await softDeleteUser(concUid);

  // ── 8. PDPA: ลบบัญชี → ข้อมูลสิทธิ์หายตาม (เกณฑ์ข้อ 8) ──
  await softDeleteUser(uid);
  const ruLeft = (await db.prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ?`).bind(uid).first<{ n: number }>())?.n;
  const ubLeft = (await db.prepare(`SELECT COUNT(*) AS n FROM user_bonus WHERE user_id = ?`).bind(uid).first<{ n: number }>())?.n;
  check("ลบบัญชี → reading_usage ของ user นี้ = 0", Number(ruLeft) === 0);
  check("ลบบัญชี → user_bonus ของ user นี้ = 0", Number(ubLeft) === 0);

  // purge ตรง ๆ ปลอดภัยเมื่อไม่มีข้อมูล
  await purgeEntitlementData(uid);
  check("purgeEntitlementData ซ้ำ → ไม่ throw", true);

  // ── 9. คุกกี้ผู้เยี่ยมชม: เซ็น/ตรวจด้วยกลไก edge-auth (PR C) ──
  const { signPayload, verifyPayload } = await import("../../src/lib/auth/edge-auth");
  const gtoken = await signPayload({ gid: "g_abc123", used: 1, iat: 111 });
  const gback = await verifyPayload<{ gid: string; used: number }>(gtoken);
  check("guest cookie: sign→verify คืนค่าเดิม", gback?.gid === "g_abc123" && gback?.used === 1);
  check("guest cookie: token ที่ถูกแก้ → verify = null", (await verifyPayload(gtoken.slice(0, -3) + "xxx")) === null);
  check("guest cookie: token ขยะ → verify = null", (await verifyPayload("not.a.token")) === null);

  // ── 9c. guest-consume ticket: ออกเฉพาะตอนอ่านจบจริง → AI ล้ม = ไม่เสียสิทธิ์ (ENTITLEMENT_PLAN ข้อ 4) ──
  const { signGuestConsumeTicket, verifyGuestConsumeTicket } = await import(
    "../../src/lib/entitlement/guest"
  );
  const goodTicket = await signGuestConsumeTicket("reading_xyz");
  check("ticket ถูกต้อง → verify คืน readingId เดิม", (await verifyGuestConsumeTicket(goodTicket)) === "reading_xyz");
  check("ticket ว่าง → null", (await verifyGuestConsumeTicket("")) === null);
  check("ticket ขยะ → null", (await verifyGuestConsumeTicket("not.a.ticket")) === null);
  check(
    "ticket ถูกแก้ → null",
    (await verifyGuestConsumeTicket(goodTicket.slice(0, -3) + "zzz")) === null,
  );
  const wrongPurpose = await signPayload({ rid: "r1", purpose: "something-else", iat: Date.now() });
  check("ticket purpose ผิด → null", (await verifyGuestConsumeTicket(wrongPurpose)) === null);
  const stale = await signPayload({
    rid: "r1",
    purpose: "guest-consume",
    iat: Date.now() - 11 * 60 * 1000,
  });
  check("ticket เก่าเกิน 10 นาที → null", (await verifyGuestConsumeTicket(stale)) === null);
  const future = await signPayload({
    rid: "r1",
    purpose: "guest-consume",
    iat: Date.now() + 5 * 60 * 1000,
  });
  check("ticket iat อนาคตเกิน skew → null", (await verifyGuestConsumeTicket(future)) === null);

  // ── 9d. server-authoritative guest marker (ปิดช่อง client บล็อก guest-consume) ──
  const { isGuestUsedOnServer, markGuestUsedOnServer, newGid } = await import(
    "../../src/lib/entitlement/guest"
  );
  const testGid = newGid();
  check("guest marker: gid ใหม่ → ยังไม่ใช้", (await isGuestUsedOnServer(testGid)) === false);
  await markGuestUsedOnServer(testGid);
  check("guest marker: หลัง mark → used", (await isGuestUsedOnServer(testGid)) === true);
  check("guest marker: gid ว่าง/anon → false เสมอ", (await isGuestUsedOnServer("anon")) === false);

  // ── 9e. เพดานผู้เยี่ยมชมต่อ IP/ซับเน็ต (P1: กันล้างคุกกี้ซ้ำเผางบ AI) ──
  const { isGuestReadQuotaReached, recordGuestRead, subnetPrefix } = await import(
    "../../src/lib/security/ai-budget"
  );
  check("subnetPrefix: IPv4 → /24", subnetPrefix("203.0.113.44") === "203.0.113.0/24");
  check("subnetPrefix: IPv6 → /64", subnetPrefix("2001:db8:1:2:3:4:5:6") === "2001:db8:1:2::/64");
  const qip = `198.51.100.${Math.floor(Date.now() % 200) + 1}`;
  check("guest IP quota: เริ่มต้นยังไม่ถึงเพดาน", (await isGuestReadQuotaReached(qip)) === false);
  for (let i = 0; i < 5; i++) await recordGuestRead(qip);
  check("guest IP quota: หลังเปิด 5 ครั้ง → ถึงเพดาน (default GUEST_IP_DAILY=5)", (await isGuestReadQuotaReached(qip)) === true);

  // ── 9b. โบนัสเปลี่ยนผ่าน (grandfather) — เพิ่มบน signup, idempotent ต่อ reason ──
  const gfUid = `test_gf_${Date.now()}`;
  await upsertUserOnLogin({ id: gfUid, provider: "google", email: `${gfUid}@e.com`, name: "ผู้ใช้เก่า" });
  await grantSignupBonus(gfUid); // ไม่แจกแล้ว — ต้องไม่บวกเพิ่ม
  await grantBonus(gfUid, 10, "grandfather");
  await grantBonus(gfUid, 10, "grandfather"); // ซ้ำ — ต้องไม่เพิ่ม
  const gfEnt = await getEntitlement({ kind: "member", userId: gfUid });
  check("grandfather: bonusRemaining = 10 (ไม่ใช่ 13 หรือ 20)", gfEnt.bonusRemaining === 10);
  await softDeleteUser(gfUid);

  // ── 11. เติมแพ็กเกจโควตา (AI Reading Credit Packages) ──
  const { CREDIT_PACKAGES, getCreditPackageById } = await import(
    "../../src/lib/entitlement/packages"
  );
  check("มีแพ็กเกจเครดิตครบ 3 ระดับ", CREDIT_PACKAGES.length === 3);
  check("คำนวณราคาเป็น integer satang (pack_10 = 14900 satang)", getCreditPackageById("pack_10")?.amountSatang === 14900);
  
  const buyerId = `test_buyer_${Date.now()}`;
  await upsertUserOnLogin({ id: buyerId, provider: "email", email: `${buyerId}@test.com`, name: "ผู้ซื้อ" });
  await grantBonus(buyerId, 10, "purchase_ord_test123");
  const buyerEnt = await getEntitlement({ kind: "member", userId: buyerId });
  check("ซื้อแพ็กเกจ 10 ครั้ง → bonusRemaining = 10", buyerEnt.bonusRemaining === 10);
  await softDeleteUser(buyerId);

  // ── 12. โควตาสมาชิกรายวัน — ผัง daily นับเข้าโควตารายวันและบันทึก streak ──
  const dailyUser = `test_daily_${Date.now()}`;
  await upsertUserOnLogin({ id: dailyUser, provider: "google", email: `${dailyUser}@test.com`, name: "คนเปิดรายวัน" });
  const dailyViewer: Viewer = { kind: "member", userId: dailyUser };

  const dEnt1 = await getEntitlement(dailyViewer);
  check(`สมาชิกก่อนเปิด: dailyRemaining = ${DAILY_LIMIT}`, dEnt1.dailyRemaining === DAILY_LIMIT);
  check("เปิดไพ่ครั้งที่ 1 (ผัง daily) → consumeReading คืน true", (await consumeReading(dailyViewer, `r_daily_1`, "daily")) === true);
  
  const dEnt2 = await getEntitlement(dailyViewer);
  check(
    `หลังเปิด 1 ครั้ง: dailyRemaining = ${DAILY_LIMIT - 1} (หักจากโควตารายวัน ${DAILY_LIMIT} ครั้ง)`,
    dEnt2.dailyRemaining === DAILY_LIMIT - 1,
  );
  check("streak ถูกบันทึกเป็น 1 วัน", (await getDailyStreak(dailyUser)) >= 1);
  await softDeleteUser(dailyUser);

  // ── 9. ตรวจสอบธงระบบสิทธิ์เปิดใช้งานโดยค่าเริ่มต้น (Fail-Closed Enforcement) ──
  const { isEntitlementEnabled } = await import("../../src/lib/entitlement/flag");
  check("ระบบสิทธิ์เปิดทำงานโดยค่าเริ่มต้น (isEntitlementEnabled = true)", (await isEntitlementEnabled()) === true);

  // ── 10. เส้นทาง "ธงปิด" (แอดมินปิดระบบสิทธิ์ช่วงเปิดฟรี 3 เดือน — INC-0083) ──
  const { KEY, kvPutJSON, kvDelete } = await import("../../src/lib/platform/kv-store");
  await kvPutJSON(KEY.flag("entitlement.enforced"), { value: false });
  check("หลังปิดธง: isEntitlementEnabled คืนค่า false", (await isEntitlementEnabled()) === false);

  // จำลองตรรกะฝั่ง UI (TarotFlow: isPassHolder = ... || !entitlement.enabled)
  const dummyDisabledEnt = { enabled: false, hasPaidCredits: false };
  const isPassHolderWhenDisabled = Boolean(dummyDisabledEnt && !dummyDisabledEnt.enabled);
  check("เมื่อระบบสิทธิ์ปิด: isPassHolder ใน UI ต้องเป็น true (ไม่บล็อกผังใหญ่/ปรมาจารย์ลับ)", isPassHolderWhenDisabled === true);

  // คืนค่า flag สู่สถานะ default
  await kvDelete(KEY.flag("entitlement.enforced"));
  check("หลังล้าง flag: isEntitlementEnabled กลับมาเป็น true (default on)", (await isEntitlementEnabled()) === true);

  // ── 13. รหัสแลกสิทธิ์ (โค้ดแจก / โค้ด VIP) ──
  // รวมไว้ในด่านนี้แทนการเพิ่มด่านใหม่ — `test-redeem-code.ts` เคยเป็นเทสต์กำพร้าที่ไม่มีใครรัน
  // จึงพังเงียบตอนเพดานโควตาเปลี่ยนเป็น 1 ครั้ง/วัน โดยไม่มีด่านไหนจับได้
  console.log("\n🎟 รหัสแลกสิทธิ์:");
  const { runRedeemTests } = await import("./test-redeem-code");
  const redeem = await runRedeemTests();
  pass += redeem.passed;
  fail += redeem.total - redeem.passed;

  console.log(`\n${pass}/${pass + fail} ผ่าน`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ test-entitlement ล้มเหลว:", err);
  process.exit(1);
});
