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

  // ── 2. ผู้เยี่ยมชม ──
  const guestFresh: Viewer = { kind: "guest", gid: "g1", guestUsed: 0 };
  const guestUsed: Viewer = { kind: "guest", gid: "g1", guestUsed: 1 };
  const eg1 = await getEntitlement(guestFresh);
  check("guest ใหม่: canStartReading = true, remaining = 1", eg1.canStartReading && eg1.remaining === GUEST_LIMIT);
  check("guest ใหม่: canChat = false", eg1.canChat === false);
  const eg2 = await getEntitlement(guestUsed);
  check("guest ใช้หมด: canStartReading = false, reason = guest_used", !eg2.canStartReading && eg2.reason === "guest_used");
  check("consumeReading(guest ใหม่) = true", (await consumeReading(guestFresh, "r_g_1")) === true);
  check("consumeReading(guest ใช้หมด) = false", (await consumeReading(guestUsed, "r_g_2")) === false);

  // ── 3. สมาชิก — ตั้งผู้ใช้ทดสอบ ──
  const uid = `test_ent_${Date.now()}`;
  await upsertUserOnLogin({ id: uid, provider: "google", email: `${uid}@example.com`, name: "ทดสอบสิทธิ์" });
  const member: Viewer = { kind: "member", userId: uid };
  /** จำนวนรอบที่จำลองว่าเติมมาจากการซื้อแพ็กเกจ (แทนโบนัสสมัครใหม่ที่ยกเลิกไปแล้ว) */
  const TOPUP_ROUNDS = 3;

  const em0 = await getEntitlement(member);
  check("สมาชิกใหม่ (ยังไม่โบนัส): dailyRemaining = 3", em0.dailyRemaining === DAILY_LIMIT);
  check("สมาชิกใหม่: remaining = 3, canStart = true", em0.remaining === DAILY_LIMIT && em0.canStartReading);
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
  check("สมาชิกหลังเติมรอบ: remaining = 6", em1.remaining === DAILY_LIMIT + TOPUP_ROUNDS);

  // ── 4. ลำดับการหัก: daily ก่อน bonus (เกณฑ์ข้อ 5) ──
  check("หัก #1", (await consumeReading(member, `r_${uid}_1`)) === true);
  check("หัก #2", (await consumeReading(member, `r_${uid}_2`)) === true);
  check("หัก #3", (await consumeReading(member, `r_${uid}_3`)) === true);
  check("หัก #4 (ควรเป็น bonus)", (await consumeReading(member, `r_${uid}_4`)) === true);

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
  check("มี daily 3 แถว", Number(dailyRows?.n) === 3);
  check("มี bonus 1 แถว", Number(bonusRows?.n) === 1);

  const em2 = await getEntitlement(member);
  check("หลังหัก 4: dailyRemaining = 0, bonusRemaining = 2", em2.dailyRemaining === 0 && em2.bonusRemaining === 2);

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
  await refundReading(`r_${uid}_4`); // คืน bonus
  const em3 = await getEntitlement(member);
  check("refund: bonusRemaining กลับเป็น 3", em3.bonusRemaining === 3);
  await refundReading("r_nonexistent"); // no-op ปลอดภัย
  check("refund readingId ที่ไม่มี → ไม่ throw", true);

  // ── 7. สิทธิ์หมด → consumeReading = false ──
  await consumeReading(member, `r_${uid}_5`);
  await consumeReading(member, `r_${uid}_6`);
  await consumeReading(member, `r_${uid}_7`); // ตอนนี้ใช้ครบ 3 daily + 3 bonus = 6
  const em4 = await getEntitlement(member);
  check("ใช้ครบ 6: canStartReading = false", !em4.canStartReading && (em4.reason === "daily_exhausted" || em4.reason === "weekly_exhausted"));
  check("consumeReading เมื่อสิทธิ์หมด = false", (await consumeReading(member, `r_${uid}_8`)) === false);

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

  // ── 12. โควตาสมาชิก 3 ครั้ง/วัน — ผัง daily นับเข้าโควตารายวันและบันทึก streak ──
  const dailyUser = `test_daily_${Date.now()}`;
  await upsertUserOnLogin({ id: dailyUser, provider: "google", email: `${dailyUser}@test.com`, name: "คนเปิดรายวัน" });
  const dailyViewer: Viewer = { kind: "member", userId: dailyUser };

  const dEnt1 = await getEntitlement(dailyViewer);
  check("สมาชิกก่อนเปิด: dailyRemaining = 3", dEnt1.dailyRemaining === 3);
  check("เปิดไพ่ครั้งที่ 1 (ผัง daily) → consumeReading คืน true", (await consumeReading(dailyViewer, `r_daily_1`, "daily")) === true);
  
  const dEnt2 = await getEntitlement(dailyViewer);
  check("หลังเปิด 1 ครั้ง: dailyRemaining = 2 (หักจากโควตารายวัน 3 ครั้ง)", dEnt2.dailyRemaining === 2);
  check("streak ถูกบันทึกเป็น 1 วัน", (await getDailyStreak(dailyUser)) >= 1);
  await softDeleteUser(dailyUser);

  // ── 9. ตรวจสอบธงระบบสิทธิ์เปิดใช้งานโดยค่าเริ่มต้น (Fail-Closed Enforcement) ──
  const { isEntitlementEnabled } = await import("../../src/lib/entitlement/flag");
  check("ระบบสิทธิ์เปิดทำงานโดยค่าเริ่มต้น (isEntitlementEnabled = true)", (await isEntitlementEnabled()) === true);

  console.log(`\n${pass}/${pass + fail} ผ่าน`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ test-entitlement ล้มเหลว:", err);
  process.exit(1);
});
