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
  WEEKLY_LIMIT,
  GUEST_LIMIT,
  SIGNUP_BONUS,
  type Viewer,
} from "../../src/lib/entitlement/entitlement";
import { upsertUserOnLogin, softDeleteUser } from "../../src/lib/users/users.repo";
import { getAppDB } from "../../src/lib/platform/db";

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

  const em0 = await getEntitlement(member);
  check("สมาชิกใหม่ (ยังไม่โบนัส): weeklyRemaining = 3", em0.weeklyRemaining === WEEKLY_LIMIT);
  check("สมาชิกใหม่: remaining = 3, canStart = true", em0.remaining === WEEKLY_LIMIT && em0.canStartReading);
  check("สมาชิก: canChat = true", em0.canChat === true);
  check("สมาชิก: resetAt ไม่ใช่ null", em0.resetAt !== null);

  // grantSignupBonus + idempotent (เกณฑ์: ให้ซ้ำไม่ได้)
  await grantSignupBonus(uid);
  await grantSignupBonus(uid); // เรียกซ้ำ
  await grantBonus(uid, 99, "signup"); // reason เดิม — ต้องไม่เพิ่ม
  const em1 = await getEntitlement(member);
  check("grantSignupBonus idempotent: bonusRemaining = 3 (ไม่ใช่ 6 หรือ 105)", em1.bonusRemaining === SIGNUP_BONUS);
  check("สมาชิกหลังโบนัส: remaining = 6", em1.remaining === WEEKLY_LIMIT + SIGNUP_BONUS);

  // ── 4. ลำดับการหัก: weekly ก่อน bonus (เกณฑ์ข้อ 5) ──
  check("หัก #1", (await consumeReading(member, `r_${uid}_1`)) === true);
  check("หัก #2", (await consumeReading(member, `r_${uid}_2`)) === true);
  check("หัก #3", (await consumeReading(member, `r_${uid}_3`)) === true);
  check("หัก #4 (ควรเป็น bonus)", (await consumeReading(member, `r_${uid}_4`)) === true);

  const db = await getAppDB();
  const wk = weekKey();
  const weeklyRows = await db
    .prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ? AND week_key = ? AND source = 'weekly'`)
    .bind(uid, wk)
    .first<{ n: number }>();
  const bonusRows = await db
    .prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ? AND source = 'bonus'`)
    .bind(uid)
    .first<{ n: number }>();
  check("มี weekly 3 แถว", Number(weeklyRows?.n) === 3);
  check("มี bonus 1 แถว", Number(bonusRows?.n) === 1);

  const em2 = await getEntitlement(member);
  check("หลังหัก 4: weeklyRemaining = 0, bonusRemaining = 2", em2.weeklyRemaining === 0 && em2.bonusRemaining === 2);

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
  await consumeReading(member, `r_${uid}_7`); // ตอนนี้ใช้ครบ 3 weekly + 3 bonus = 6
  const em4 = await getEntitlement(member);
  check("ใช้ครบ 6: canStartReading = false, reason = weekly_exhausted", !em4.canStartReading && em4.reason === "weekly_exhausted");
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

  // ── 9b. โบนัสเปลี่ยนผ่าน (grandfather) — เพิ่มบน signup, idempotent ต่อ reason ──
  const gfUid = `test_gf_${Date.now()}`;
  await upsertUserOnLogin({ id: gfUid, provider: "google", email: `${gfUid}@e.com`, name: "ผู้ใช้เก่า" });
  await grantSignupBonus(gfUid);
  await grantBonus(gfUid, 10, "grandfather");
  await grantBonus(gfUid, 10, "grandfather"); // ซ้ำ — ต้องไม่เพิ่ม
  const gfEnt = await getEntitlement({ kind: "member", userId: gfUid });
  check("grandfather + signup: bonusRemaining = 13 (3+10, ไม่ใช่ 23)", gfEnt.bonusRemaining === 13);
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

  // ── 12. ไพ่ประจำวันฟรี 1 ครั้ง/วัน ไม่กินโควตารายสัปดาห์ (Daily Habit Loop) ──
  const { todayDateKey, isDailyFreeReadingUsed, getDailyStreak } = await import(
    "../../src/lib/entitlement/daily"
  );
  const dailyUser = `test_daily_${Date.now()}`;
  await upsertUserOnLogin({ id: dailyUser, provider: "google", email: `${dailyUser}@test.com`, name: "คนเปิดรายวัน" });
  const dailyViewer: Viewer = { kind: "member", userId: dailyUser };

  const dEnt1 = await getEntitlement(dailyViewer);
  check("ก่อนเปิดรายวัน: dailyFreeAvailable = true", dEnt1.dailyFreeAvailable === true);
  check("เปิดไพ่ประจำวันครั้งแรกของวัน → consumeReading คืน true", (await consumeReading(dailyViewer, `r_daily_1`, "daily")) === true);
  
  const dEnt2 = await getEntitlement(dailyViewer);
  check("หลังเปิดรายวัน: weeklyRemaining ยังเต็ม 3 (ไม่กินโควตาสัปดาห์)", dEnt2.weeklyRemaining === 3);
  check("หลังเปิดรายวัน: dailyFreeAvailable = false", dEnt2.dailyFreeAvailable === false);
  check("streak ถูกบันทึกเป็น 1 วัน", (await getDailyStreak(dailyUser)) >= 1);
  await softDeleteUser(dailyUser);

  console.log(`\n${pass}/${pass + fail} ผ่าน`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ test-entitlement ล้มเหลว:", err);
  process.exit(1);
});
