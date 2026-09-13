import { getAppDB } from "@/lib/platform/db";

/**
 * คลังข้อมูลของ "ดวงประจำวันทางอีเมล" (Daily Digest Repository)
 * ------------------------------------------------------------
 * กติกาความเป็นส่วนตัวของบ้านนี้ (PDPA) — ทุก query ในไฟล์นี้ต้องครบ **สี่เงื่อนไข**:
 *   digest_email = 1  ·  marketing_consent = 1  ·  deleted_at IS NULL  ·  email_verified = 1
 *
 * ทำไมต้องมี `digest_email` แยกจาก `marketing_consent`:
 * ความยินยอม "รับข่าวสาร" ที่ผู้ใช้เคยกดไว้ ไม่ใช่ความยินยอม "ให้ส่งอีเมลทุกเช้า"
 * การเหมารวมสองอย่างเป็นอันเดียว = ส่งอีเมลรายวันหาคนที่ไม่เคยขอ ซึ่งผิดทั้งกฎหมายและมารยาท
 */

export type DigestChannel = "email";
export type DigestStatus = "sending" | "sent" | "skipped" | "failed";

export interface DigestRecipient {
  id: string;
  email: string;
  name: string;
  locale: string;
}

/**
 * คนที่ต้องส่งวันนี้ — ตัดคนที่มีแถวใน `digest_log` ของวันนี้ออกตั้งแต่ระดับ SQL
 * (กันยิงซ้ำชั้นแรก · ชั้นที่กันจริงจังคือ `claimDigestSlot()` ด้านล่าง)
 */
export async function listDigestRecipients(sendDate: string, limit: number): Promise<DigestRecipient[]> {
  const db = await getAppDB();
  const rows = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.locale
         FROM users u
        WHERE u.digest_email = 1
          AND u.marketing_consent = 1
          AND u.deleted_at IS NULL
          AND u.email_verified = 1
          AND u.email IS NOT NULL
          AND NOT EXISTS (
                SELECT 1 FROM digest_log d
                 WHERE d.user_id = u.id AND d.send_date = ? AND d.channel = 'email'
              )
        ORDER BY u.created_at ASC
        LIMIT ?`,
    )
    .bind(sendDate, limit)
    .all<{ id: string; email: string; name: string; locale: string | null }>();

  return (rows?.results || []).map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    locale: r.locale || "th",
  }));
}

/**
 * จองสิทธิ์ส่งของผู้ใช้คนนี้ในวันนี้ — คืน true เฉพาะผู้ที่จองได้เป็นคนแรก
 *
 * ⚠️ ต้องเรียก **ก่อน** ส่งอีเมลเสมอ ไม่ใช่หลังส่ง: ถ้าจองทีหลัง สองรอบที่ทำงานพร้อมกัน
 * จะส่งอีเมลซ้ำให้คนเดียวกันก่อนที่ใครจะเขียน log ลงไปได้ (double-spend แบบเดียวกับ ISSUE-017)
 * `ON CONFLICT DO NOTHING` + PRIMARY KEY สามช่อง ทำให้มีผู้ชนะได้คนเดียวเสมอ
 */
export async function claimDigestSlot(userId: string, sendDate: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(
      `INSERT INTO digest_log (user_id, send_date, channel, status, reason, created_at)
       VALUES (?, ?, 'email', 'sending', NULL, ?)
       ON CONFLICT(user_id, send_date, channel) DO NOTHING`,
    )
    .bind(userId, sendDate, Date.now())
    .run();
  return Number(res?.meta?.changes ?? 0) > 0;
}

/** ปิดผลของรอบนี้ — เรียกทุกเส้นทางหลังจองแล้ว ไม่ว่าจะสำเร็จหรือไม่ */
export async function finishDigestSlot(
  userId: string,
  sendDate: string,
  status: Exclude<DigestStatus, "sending">,
  reason?: string,
): Promise<void> {
  const db = await getAppDB();
  await db
    .prepare(`UPDATE digest_log SET status = ?, reason = ? WHERE user_id = ? AND send_date = ? AND channel = 'email'`)
    .bind(status, reason ?? null, userId, sendDate)
    .run();

  if (status === "sent") {
    await db
      .prepare(`UPDATE users SET digest_last_sent_at = ? WHERE id = ?`)
      .bind(Date.now(), userId)
      .run();
  }
}

/** เปิด/ปิดการรับดวงประจำวันทางอีเมล — ใช้ทั้งสวิตช์ในหน้าบัญชีและลิงก์ยกเลิกในอีเมล */
export async function setDigestEmail(userId: string, enabled: boolean): Promise<void> {
  const db = await getAppDB();
  await db
    .prepare(`UPDATE users SET digest_email = ? WHERE id = ? AND deleted_at IS NULL`)
    .bind(enabled ? 1 : 0, userId)
    .run();
}

/** สรุปผลรอบล่าสุดของวันนั้น — ใช้ตอบกลับ cron และโชว์ในแผงแอดมิน */
export async function summarizeDigestDay(sendDate: string): Promise<Record<string, number>> {
  const db = await getAppDB();
  const rows = await db
    .prepare(`SELECT status, COUNT(*) AS n FROM digest_log WHERE send_date = ? AND channel = 'email' GROUP BY status`)
    .bind(sendDate)
    .all<{ status: string; n: number }>();

  const out: Record<string, number> = {};
  for (const r of rows?.results || []) out[r.status] = Number(r.n);
  return out;
}
