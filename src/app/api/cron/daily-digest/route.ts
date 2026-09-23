import { NextResponse } from "next/server";

import { SITE_ORIGIN } from "@/lib/config/site";
import {
  claimDigestSlot,
  finishDigestSlot,
  countPendingDigestRecipients,
  listDigestRecipients,
  summarizeDigestDay,
} from "@/lib/digest/digest.repo";
import { signDigestUnsubToken } from "@/lib/digest/unsubscribe-token";
import { sendEmail } from "@/lib/email/send";
import { dailyDigestHtml, dailyDigestText } from "@/lib/email/templates";
import { todayDateKey } from "@/lib/entitlement/daily";
import { recordEvent } from "@/lib/stats/record";
import { computeDailyCard } from "@/lib/tarot/daily-card";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";

export const runtime = "nodejs";

/**
 * POST /api/cron/daily-digest — ส่ง "ดวงประจำวัน" ทางอีเมลให้คนที่สมัครไว้เอง
 * ---------------------------------------------------------------------------
 * ตัวจับเวลาอยู่ที่ `.github/workflows/daily-digest.yml` ไม่ใช่ Cloudflare Cron Trigger
 * เพราะ `wrangler.jsonc` ชี้ `main` ไปที่ `.open-next/worker.js` ซึ่ง OpenNext สร้างใหม่ทุก build
 * และ export แค่ `fetch` — จะใส่ `scheduled` handler ต้องเขียน wrapper ครอบไฟล์ที่ deploy
 * pipeline ทั้งสายพึ่งอยู่ ความเสี่ยงไม่คุ้มกับงานส่งอีเมลวันละครั้ง
 *
 * เพดานต่อรอบ 80 ฉบับ: Resend แผนฟรีส่งได้ 100 ฉบับ/วัน · ยิงทะลุโควตาแล้วบัญชีโดนระงับ
 * จะเสียอีเมลยืนยันตัวตนและรีเซ็ตรหัสผ่านไปด้วยทั้งระบบ ไม่ใช่แค่ digest
 */

/** เพดานต่อรอบ — ต่ำกว่าโควตา Resend แผนฟรี (100/วัน) เผื่ออีเมลธุรกรรมของระบบ */
const MAX_DIGEST_PER_RUN = 80;

/** เทียบความลับแบบเวลาคงที่ — เทียบด้วย `===` เฉย ๆ รั่วความยาวและตำแหน่งที่ต่างออกไป */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const presented = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");

  // ไม่ได้ตั้งความลับไว้ = ปิดเส้นนี้ทิ้ง ไม่ใช่เปิดให้ใครก็ได้ยิง (fail-closed)
  // ตอบ 401 เปล่า ๆ ทุกกรณีที่ไม่ผ่าน ไม่บอกว่าพลาดเพราะอะไร
  if (!secret || !presented || !timingSafeEqual(presented, secret)) {
    return new NextResponse(null, { status: 401 });
  }

  const sendDate = todayDateKey();

  // 🃏 กฎเหล็กข้อ 14 — ไพ่ในอีเมลต้องมาจากไปป์ไลน์เดิมที่ตรวจสอบได้เท่านั้น
  // `computeDailyCard()` โยน error เมื่อข้อมูลไม่สมบูรณ์ · ห้าม catch แล้วใส่ไพ่สำรองเด็ดขาด
  // ดึงไม่ได้ = ไม่ส่งอีเมลสักฉบับในรอบนี้ ดีกว่าส่งไพ่ที่ระบบกุขึ้นเองออกไป
  let daily;
  try {
    daily = await computeDailyCard(sendDate);
  } catch (err) {
    console.error("[Daily Digest] คำนวณไพ่ประจำวันไม่สำเร็จ — ยกเลิกทั้งรอบ ไม่ส่งอีเมลใด ๆ:", err);
    return NextResponse.json(
      { ok: false, reason: "daily_card_unavailable", sendDate, scanned: 0, sent: 0, skipped: 0, failed: 0 },
      { status: 503 },
    );
  }

  const dateLabel = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(`${sendDate}T00:00:00+07:00`));

  const readUrl = `${SITE_ORIGIN}/daily?utm_source=digest&utm_medium=email&utm_campaign=daily`;

  const recipients = await listDigestRecipients(sendDate, MAX_DIGEST_PER_RUN);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const person of recipients) {
    // จองก่อนส่งเสมอ — ผู้แพ้ในการจองคือรอบที่ทำงานซ้อน ต้องข้ามไปเฉย ๆ
    const claimed = await claimDigestSlot(person.id, sendDate).catch(() => false);
    if (!claimed) {
      skipped++;
      continue;
    }

    try {
      const unsubUrl = `${SITE_ORIGIN}/api/digest/unsubscribe?t=${encodeURIComponent(
        await signDigestUnsubToken(person.id),
      )}`;
      const payload = {
        name: person.name,
        cardNameTh: daily.nameTh,
        cardNameEn: daily.nameEn,
        keywords: daily.keywords,
        message: daily.message,
        proof: daily.proof,
        dateLabel,
        readUrl,
        unsubUrl,
      };

      const res = await sendEmail(
        person.email,
        `ไพ่นำทางวันนี้: ${daily.nameTh}`,
        dailyDigestHtml(payload),
        dailyDigestText(payload),
        // one-click unsubscribe ตามกติกาผู้ส่งจำนวนมากของ Gmail/Yahoo (RFC 8058 · A2-11)
        {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      );

      if (res.success) {
        await finishDigestSlot(person.id, sendDate, "sent");
        sent++;
      } else {
        await finishDigestSlot(person.id, sendDate, "failed", "send_failed");
        failed++;
      }
    } catch (err) {
      console.error("[Daily Digest] ส่งไม่สำเร็จ:", err);
      await finishDigestSlot(person.id, sendDate, "failed", "exception").catch(() => {});
      failed++;
    }
  }

  recordEvent("digest_run");
  if (sent > 0) recordEvent("digest_sent", sent);
  // คิวค้างเพราะชนเพดานต่อรอบ — ต้องเห็นได้บน /admin ไม่ใช่เงียบ (A2-10)
  const remaining = await countPendingDigestRecipients(sendDate).catch(() => 0);
  if (remaining > 0) recordEvent("digest_over_cap", remaining);

  return NextResponse.json({
    ok: true,
    sendDate,
    card: daily.cardId,
    scanned: recipients.length,
    sent,
    skipped,
    failed,
    remaining,
    dayTotals: await summarizeDigestDay(sendDate).catch(() => ({})),
  });
}
