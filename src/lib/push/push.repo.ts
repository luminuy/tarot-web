import { getAppDB } from "@/lib/platform/db";
import type { PushSubscriptionData } from "@/lib/push/webpush";

/** 🔔 subscription ของ Web Push (migrations/0025) — ทุกคำสั่งที่ผู้ใช้เรียกกรองด้วย user_id */

export interface StoredSubscription extends PushSubscriptionData {
  id: string;
  userId: string;
  lang: "th" | "en";
  morningHour: number | null;
  checkins: boolean;
}

interface Row {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  lang: string;
  morning_hour: number | null;
  checkins: number;
}

const map = (r: Row): StoredSubscription => ({
  id: r.id,
  userId: r.user_id,
  endpoint: r.endpoint,
  p256dh: r.p256dh,
  auth: r.auth,
  lang: r.lang === "en" ? "en" : "th",
  morningHour: r.morning_hour,
  checkins: r.checkins === 1,
});

/** สมัคร/อัปเดต — endpoint เดิมของอีกบัญชี (เครื่องเดียวกันสลับบัญชี) ถูกย้ายมาเป็นของบัญชีปัจจุบัน */
export async function upsertPushSubscription(
  userId: string,
  sub: PushSubscriptionData,
  settings: { lang: "th" | "en"; morningHour: number | null; checkins: boolean },
): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, lang, morning_hour, checkins, fail_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
         lang = excluded.lang, morning_hour = excluded.morning_hour, checkins = excluded.checkins, fail_count = 0, updated_at = excluded.updated_at`
    )
    .bind(`ps_${crypto.randomUUID()}`, userId, sub.endpoint, sub.p256dh, sub.auth, settings.lang, settings.morningHour, settings.checkins ? 1 : 0, now, now)
    .run();
}

export async function deletePushSubscription(userId: string, endpoint: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db.prepare(`DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`).bind(userId, endpoint).run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function getPushSubscription(userId: string, endpoint: string): Promise<StoredSubscription | null> {
  const db = await getAppDB();
  const row = await db.prepare(`SELECT * FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`).bind(userId, endpoint).first<Row>();
  return row ? map(row) : null;
}

export async function listUserSubscriptions(userId: string): Promise<StoredSubscription[]> {
  const db = await getAppDB();
  const { results } = await db.prepare(`SELECT * FROM push_subscriptions WHERE user_id = ?`).bind(userId).all<Row>();
  return (results || []).map(map);
}

/** ผู้ที่ตั้งเตือนพิธีเช้าตรงชั่วโมงนี้ และยังไม่ได้รับเตือนของวันนี้ */
export async function listMorningDue(hour: number, dayKey: string, limit: number): Promise<StoredSubscription[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(
      `SELECT * FROM push_subscriptions WHERE morning_hour = ? AND (last_morning_day IS NULL OR last_morning_day <> ?) LIMIT ?`
    )
    .bind(hour, dayKey, limit)
    .all<Row>();
  return (results || []).map(map);
}

/** จองการส่งเตือนพิธีเช้าของวันนี้ — true = รอบนี้เป็นคนส่ง */
export async function claimMorning(id: string, dayKey: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(`UPDATE push_subscriptions SET last_morning_day = ? WHERE id = ? AND (last_morning_day IS NULL OR last_morning_day <> ?)`)
    .bind(dayKey, id, dayKey)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/** ผลการส่ง: gone = ลบทันที · ล้มเหลว 5 ครั้งติด = ลบ · สำเร็จ = รีเซ็ตตัวนับ */
export async function recordPushResult(id: string, result: { ok: boolean; gone: boolean }): Promise<void> {
  const db = await getAppDB();
  if (result.gone) {
    await db.prepare(`DELETE FROM push_subscriptions WHERE id = ?`).bind(id).run();
    return;
  }
  if (result.ok) {
    await db.prepare(`UPDATE push_subscriptions SET fail_count = 0 WHERE id = ?`).bind(id).run();
    return;
  }
  await db.prepare(`UPDATE push_subscriptions SET fail_count = fail_count + 1 WHERE id = ?`).bind(id).run();
  await db.prepare(`DELETE FROM push_subscriptions WHERE id = ? AND fail_count >= 5`).bind(id).run();
}

export async function exportPushSettings(userId: string): Promise<Array<{ lang: string; morningHour: number | null; checkins: boolean; pushService: string }>> {
  return (await listUserSubscriptions(userId)).map((s) => ({
    lang: s.lang,
    morningHour: s.morningHour,
    checkins: s.checkins,
    pushService: (() => {
      try {
        return new URL(s.endpoint).hostname;
      } catch {
        return "unknown";
      }
    })(),
  }));
}

export async function deleteAllPushSubscriptions(userId: string): Promise<number> {
  const db = await getAppDB();
  const res = await db.prepare(`DELETE FROM push_subscriptions WHERE user_id = ?`).bind(userId).run();
  return res.meta?.changes ?? 0;
}
