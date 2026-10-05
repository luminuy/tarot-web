import { NextResponse } from "next/server";

import { SITE_ORIGIN } from "@/lib/config/site";
import { cardByIndex } from "@/data/cards";
import { checkinHtml, checkinText } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { claimCheckin, listDueCheckins } from "@/lib/journal/journal.repo";
import { getThread } from "@/lib/journal/threads.repo";
import { getUserById } from "@/lib/users/users.repo";
import { recordEvent } from "@/lib/stats/record";

export const runtime = "nodejs";

/**
 * POST /api/cron/checkins — ส่งเตือน "นัดกลับมาเช็ก" ที่ถึงเวลาแล้ว (REFLECTION_JOURNAL_PLAN 1.4)
 * ---------------------------------------------------------------------------
 * ตัวจับเวลา: ขั้นที่สองของ `.github/workflows/daily-digest.yml` (08:00 น. เวลาไทย) — เหตุผลเดียวกับ digest
 * ที่ไม่ใช้ Cloudflare Cron Trigger · ความลับ `CRON_SECRET` ชุดเดียวกัน · fail-closed
 *
 *  • ส่งเฉพาะนัดที่ผู้ใช้ตั้งเอง และผลจริงยังเป็น PENDING (บันทึกแล้ว = ไม่ต้องเตือน)
 *  • จองก่อนส่ง (`claimCheckin`) กันรอบที่ทำงานซ้อนส่งซ้ำ · ส่งไม่สำเร็จไม่ลองซ้ำอัตโนมัติ (ไม่ถล่มกล่องจดหมาย)
 *  • อีเมลมีแค่ชื่อเรื่องที่ผู้ใช้ตั้งเอง + ชื่อไพ่ใบหลัก — ไม่มีคำถามเต็ม/บันทึก (กติกาความเป็นส่วนตัวข้อ 5)
 *  • เพดานต่อรอบ 15 ฉบับ — แบ่งโควตา Resend ฟรี 100/วัน กับ digest (80) และอีเมลระบบ
 *  • ผู้ใช้ที่ไม่มีอีเมลที่ยืนยันแล้ว = ข้าม (Push จะมาแทนเมื่อเปิดใช้ Web Push)
 */

const MAX_PER_RUN = 15;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const presented = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!secret || !presented || !timingSafeEqual(presented, secret)) {
    return new NextResponse(null, { status: 401 });
  }

  const now = Date.now();
  const due = await listDueCheckins(now, MAX_PER_RUN * 2);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of due) {
    if (sent >= MAX_PER_RUN) break;
    if (!(await claimCheckin(item.id, now).catch(() => false))) {
      skipped++;
      continue;
    }
    try {
      const user = await getUserById(item.userId);
      const verified = user?.email && (user.provider !== "email" || user.emailVerified);
      if (!user || !verified) {
        skipped++;
        continue;
      }
      const lang: "th" | "en" = user.locale === "en" ? "en" : "th";
      const thread = item.threadId ? await getThread(item.userId, item.threadId).catch(() => null) : null;
      // 🃏 กฎเหล็กข้อ 14 — ชื่อไพ่อ่านจากสำรับด้วยเลขไพ่ หาไม่เจอ = ไม่พูดถึงไพ่ ไม่เดาแทน
      let cardName: string | undefined;
      try {
        const cards = JSON.parse(item.cardsJson) as Array<{ order: number; cardIndex: number }>;
        const first = [...cards].sort((a, b) => a.order - b.order)[0];
        const card = cardByIndex(first?.cardIndex);
        cardName = card ? (lang === "en" ? card.nameEn : card.nameTh) : undefined;
      } catch {
        cardName = undefined;
      }
      const params = {
        name: user.name,
        threadTitle: thread?.title,
        daysAgo: Math.max(1, Math.round((now - item.createdAt) / 86_400_000)),
        cardName,
        link: `${SITE_ORIGIN}${lang === "en" ? "/en" : ""}/journal?entry=${encodeURIComponent(item.id)}&utm_source=checkin&utm_medium=email`,
        lang,
      };
      const res = await sendEmail(
        user.email!,
        lang === "en" ? "How did it turn out?" : "เรื่องนั้นเป็นอย่างไรบ้าง",
        checkinHtml(params),
        checkinText(params),
      );
      if (res.success) sent++;
      else failed++;
    } catch (err) {
      console.error("[Checkin] ส่งไม่สำเร็จ:", err);
      failed++;
    }
  }

  recordEvent("checkin_run");
  if (sent > 0) recordEvent("checkin_sent", sent);
  return NextResponse.json({ ok: true, scanned: due.length, sent, skipped, failed });
}
