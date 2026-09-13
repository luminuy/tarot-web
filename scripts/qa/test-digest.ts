/**
 * scripts/qa/test-digest.ts
 * QA — ดวงประจำวันทางอีเมล (Daily Digest · opt-in · PDPA · กันส่งซ้ำ · ห้ามกุไพ่)
 * รันด้วย: npx tsx scripts/qa/test-digest.ts
 *
 * ⚠️ ทำไมด่านนี้ต้องมี:
 * งานนี้ "ส่งของจริงออกนอกระบบ" ไปหาคนจริง ผิดพลาดแล้วเรียกคืนไม่ได้เหมือนบั๊กบนหน้าจอ
 * สามเรื่องที่พังแล้วแก้ไม่ได้คือ ส่งหาคนที่ไม่ได้สมัคร · ส่งซ้ำ · ส่งไพ่ที่ระบบกุขึ้นเอง
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getAppDB } from "../../src/lib/platform/db";
import { upsertUserOnLogin, softDeleteUser, setMarketingConsent, markEmailVerified } from "../../src/lib/users/users.repo";
import {
  claimDigestSlot,
  finishDigestSlot,
  listDigestRecipients,
  setDigestEmail,
  summarizeDigestDay,
} from "../../src/lib/digest/digest.repo";
import { signDigestUnsubToken, verifyDigestUnsubToken } from "../../src/lib/digest/unsubscribe-token";
import { dailyDigestHtml, dailyDigestText } from "../../src/lib/email/templates";
import { computeDailyCard } from "../../src/lib/tarot/daily-card";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const readSrc = (rel: string) => {
  try {
    return fs.readFileSync(path.join(ROOT, rel), "utf-8");
  } catch {
    return "";
  }
};

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`✅ ${name}`);
  } else {
    fail++;
    console.error(`❌ ${name}`);
  }
}

async function makeUser(suffix: string, opts: { marketing: boolean; digest: boolean; verified: boolean }) {
  const id = `digest_${suffix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  await upsertUserOnLogin({
    id,
    provider: "google",
    email: `${id}@test.com`,
    name: "ผู้รับดวงประจำวัน",
  });
  await setMarketingConsent(id, opts.marketing);
  await setDigestEmail(id, opts.digest);
  // ⚠️ `upsertUserOnLogin()` ตั้ง `email_verified = 1` ให้เสมอ เพราะเป็นเส้นทาง OAuth
  // (Google/LINE ยืนยันอีเมลมาแล้ว) — จะทดสอบเส้น "ยังไม่ยืนยัน" ต้องเขียนค่าลงตรง ๆ
  if (opts.verified) {
    await markEmailVerified(id);
  } else {
    const db = await getAppDB();
    await db.prepare(`UPDATE users SET email_verified = 0 WHERE id = ?`).bind(id).run();
  }
  return id;
}

async function main() {
  console.log("📬 ดวงประจำวันทางอีเมล (Daily Digest)\n");
  const sendDate = "2026-01-15"; // วันที่คงที่ ไม่ผูกกับนาฬิกาเครื่องที่รันเทสต์

  // ── 1. โทเคนยกเลิก ──
  console.log("🔓 ลิงก์ยกเลิกในอีเมล:");
  const token = await signDigestUnsubToken("user_abc");
  check("เซ็นแล้วถอดกลับได้เป็น user id เดิม", (await verifyDigestUnsubToken(token)) === "user_abc");
  check("โทเคนว่าง → null", (await verifyDigestUnsubToken("")) === null);
  check("โทเคนขยะ → null", (await verifyDigestUnsubToken("ไม่ใช่โทเคน")) === null);
  check(
    "โทเคนถูกแก้มือ → null (ปลอมเพื่อยกเลิกแทนคนอื่นไม่ได้)",
    (await verifyDigestUnsubToken(`${token}x`)) === null,
  );
  const otherPurpose = await (await import("../../src/lib/auth/edge-auth")).signPayload({
    uid: "user_abc",
    purpose: "guest-consume",
  });
  check("โทเคนคนละวัตถุประสงค์ → null (เอา ticket อื่นมาใช้แทนไม่ได้)", (await verifyDigestUnsubToken(otherPurpose)) === null);

  // ── 2. คิวผู้รับ — ต้องครบสี่เงื่อนไขเท่านั้น ──
  console.log("\n🔒 ใครบ้างที่ระบบยอมส่งให้ (PDPA):");
  const full = await makeUser("full", { marketing: true, digest: true, verified: true });
  const noDigest = await makeUser("nodigest", { marketing: true, digest: false, verified: true });
  const noMarketing = await makeUser("nomkt", { marketing: false, digest: true, verified: true });
  const unverified = await makeUser("unverified", { marketing: true, digest: true, verified: false });
  const deleted = await makeUser("deleted", { marketing: true, digest: true, verified: true });
  await softDeleteUser(deleted);

  const queue = await listDigestRecipients(sendDate, 100);
  const ids = new Set(queue.map((r) => r.id));
  check("คนที่สมัครครบทุกเงื่อนไข → อยู่ในคิว", ids.has(full));
  check("ไม่ได้กดรับดวงประจำวัน (digest_email = 0) → ไม่อยู่ในคิว", !ids.has(noDigest));
  check("ถอนความยินยอมรับข่าวสาร (marketing_consent = 0) → ไม่อยู่ในคิว", !ids.has(noMarketing));
  check("ยังไม่ยืนยันอีเมล → ไม่อยู่ในคิว (กันส่งเข้ากล่องคนอื่นที่ถูกพิมพ์ผิด)", !ids.has(unverified));
  check("บัญชีที่ลบไปแล้ว → ไม่อยู่ในคิว", !ids.has(deleted));

  // ── 3. กันส่งซ้ำ ──
  console.log("\n🔁 กันส่งซ้ำเมื่อรอบทำงานซ้อน:");
  check("จองสิทธิ์ครั้งแรก → สำเร็จ", (await claimDigestSlot(full, sendDate)) === true);
  check("จองซ้ำวันเดียวกัน → ถูกปฏิเสธ (ไม่มีใครได้อีเมลสองฉบับ)", (await claimDigestSlot(full, sendDate)) === false);

  const claims = await Promise.all([1, 2, 3, 4, 5].map(() => claimDigestSlot(noDigest, sendDate)));
  check(
    "ยิงจองขนาน 5 ครั้งพร้อมกัน → สำเร็จเพียงครั้งเดียว",
    claims.filter(Boolean).length === 1,
  );

  const requeued = await listDigestRecipients(sendDate, 100);
  check("คนที่จองไปแล้ว → หลุดออกจากคิวรอบถัดไปทันที", !requeued.some((r) => r.id === full));

  await finishDigestSlot(full, sendDate, "sent");
  const db = await getAppDB();
  const logRow = await db
    .prepare(`SELECT status FROM digest_log WHERE user_id = ? AND send_date = ? AND channel = 'email'`)
    .bind(full, sendDate)
    .first<{ status: string }>();
  check("ปิดรอบแล้วสถานะเป็น 'sent'", logRow?.status === "sent");

  const stampRow = await db
    .prepare(`SELECT digest_last_sent_at AS t FROM users WHERE id = ?`)
    .bind(full)
    .first<{ t: number | null }>();
  check("ส่งสำเร็จแล้วประทับเวลาไว้ที่ผู้ใช้", typeof stampRow?.t === "number" && Number(stampRow.t) > 0);

  const totals = await summarizeDigestDay(sendDate);
  check("สรุปรายวันนับสถานะได้ถูกต้อง", Number(totals["sent"] ?? 0) >= 1);

  // ── 4. ยกเลิกแล้วต้องเงียบสนิท ──
  console.log("\n🤫 ยกเลิกแล้วต้องเงียบ:");
  const tomorrow = "2026-01-16";
  const stillIn = (await listDigestRecipients(tomorrow, 100)).some((r) => r.id === full);
  check("วันถัดไปกลับเข้าคิวตามปกติ", stillIn);
  await setDigestEmail(full, false);
  const afterUnsub = (await listDigestRecipients(tomorrow, 100)).some((r) => r.id === full);
  check("กดยกเลิกแล้ว → หายจากคิวทันที", !afterUnsub);

  for (const id of [full, noDigest, noMarketing, unverified]) await softDeleteUser(id);

  // ── 5. เนื้อหาอีเมล ──
  console.log("\n✉️ เนื้อหาอีเมล:");
  const card = await computeDailyCard(sendDate);
  const payload = {
    name: "ทดสอบ",
    cardNameTh: card.nameTh,
    cardNameEn: card.nameEn,
    keywords: card.keywords,
    message: card.message,
    proof: card.proof,
    dateLabel: "15 มกราคม 2569",
    readUrl: "https://seertarot.net/daily",
    unsubUrl: "https://seertarot.net/api/digest/unsubscribe?t=TOKEN",
  };
  const html = dailyDigestHtml(payload);
  const text = dailyDigestText(payload);

  check("HTML มีรหัสตรวจสอบ SHA-256 (Provably Fair ต้องไม่กลืนน้ำลายตัวเอง)", html.includes(card.proof));
  check("HTML มีลิงก์ยกเลิก", html.includes(payload.unsubUrl));
  check("HTML บอกชื่อไพ่ของวันนั้นจริง", html.includes(card.nameTh));
  check("เวอร์ชันข้อความล้วนมีรหัสตรวจสอบและลิงก์ยกเลิกครบ", text.includes(card.proof) && text.includes(payload.unsubUrl));
  check(
    "อีเมลไม่ฝังภาพไพ่เอง (กฎเหล็กข้อ 8 — ภาพไพ่ต้องผ่าน <CardImage /> เท่านั้น)",
    !/<img[^>]+\/cards\//i.test(html),
  );
  check("ไม่มีสระ แ ที่พิมพ์ด้วย เ สองตัวหลุดในอีเมล", !html.includes("เเ") && !text.includes("เเ"));

  // ── 6. ด่านต่อสาย (ของที่ตรรกะถูกแต่ไม่มีใครเรียก = ไม่มีอยู่จริง) ──
  console.log("\n🔌 การต่อสายของระบบ:");
  const cronRoute = readSrc("src/app/api/cron/daily-digest/route.ts");
  check("มีเส้น cron ของ digest", cronRoute.length > 0);
  check("เส้น cron ตรวจความลับก่อนทำอย่างอื่น", cronRoute.includes("CRON_SECRET"));
  check("เทียบความลับแบบเวลาคงที่ ไม่ใช่ === เปล่า ๆ", cronRoute.includes("timingSafeEqual"));
  check(
    "🃏 กฎเหล็กข้อ 14: เส้น cron ต้องไม่สุ่มไพ่เอง (ห้าม Math.random)",
    !cronRoute.includes("Math.random"),
  );
  check(
    "🃏 กฎเหล็กข้อ 14: ไพ่ในอีเมลมาจาก computeDailyCard ซึ่งตรวจสอบย้อนหลังได้",
    cronRoute.includes("computeDailyCard"),
  );
  check("มีเพดานจำนวนฉบับต่อรอบ (กันโควตา Resend แตกจนอีเมลทั้งระบบล่ม)", cronRoute.includes("MAX_DIGEST_PER_RUN"));
  check("จองสิทธิ์ก่อนส่งเสมอ", cronRoute.indexOf("claimDigestSlot") < cronRoute.indexOf("sendEmail("));

  const unsubRoute = readSrc("src/app/api/digest/unsubscribe/route.ts");
  check("มีเส้นยกเลิกที่กดจากอีเมลได้", unsubRoute.length > 0);
  check(
    "เส้นยกเลิกไม่บังคับล็อกอิน (ห้ามเรียก getSessionUser)",
    unsubRoute.length > 0 && !unsubRoute.includes("getSessionUser"),
  );

  const workflow = readSrc(".github/workflows/daily-digest.yml");
  check("มีตัวจับเวลาจริง (workflow มี schedule)", workflow.includes("schedule:") && workflow.includes("cron:"));
  // ดูที่บรรทัด `uses:` จริง ไม่ใช่ชื่อที่ถูกเอ่ยในคอมเมนต์เตือน ไม่งั้นคอมเมนต์จะทำให้ด่านตก
  check(
    "workflow ไม่ใช้ setup-node พร้อม cache (บทเรียน pnpm-lock ที่ไม่มีในเรโปนี้)",
    !/uses:\s*actions\/setup-node/.test(workflow),
  );

  const badge = readSrc("src/components/auth/UserProfileBadge.tsx");
  check("มีสวิตช์ให้ผู้ใช้กดสมัคร/ยกเลิกเองในหน้าบัญชี", badge.includes("handleUpdateDigest"));

  const migration = readSrc("migrations/0014_digest_prefs.sql");
  check(
    "คอลัมน์ digest_email ตั้งค่าเริ่มต้นเป็น 0 (opt-in เท่านั้น ห้าม backfill เป็น 1)",
    /digest_email\s+INTEGER NOT NULL DEFAULT 0/.test(migration),
  );

  console.log(`\n${pass}/${pass + fail} ผ่าน`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ test-digest ล้มเหลว:", err);
  process.exit(1);
});
