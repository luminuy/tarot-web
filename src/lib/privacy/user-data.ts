/**
 * 🔐 ทะเบียนข้อมูลส่วนบุคคลของฟีเจอร์ใหม่ (PDPA — สิทธิ์ขอสำเนา + สิทธิ์ขอลบ)
 * ---------------------------------------------------------------------------
 * ทุกตารางใหม่ที่มี user_id ต้องลงทะเบียนที่นี่ "ที่เดียว" แล้ว `/api/account/export` กับ `DELETE /api/account`
 * จะครอบคลุมเอง — เดิมแต่ละฟีเจอร์ต้องไปแก้สองเส้นนั้นเอง และลืมได้ (กติกาความเป็นส่วนตัวข้อ 6 ของ REFLECTION_JOURNAL_PLAN)
 *
 * แต่ละรายการ: export = ข้อมูลที่จะใส่ในไฟล์ส่งออก · erase = ลบทิ้งทั้งหมดของผู้ใช้คนนั้น
 * ⚠️ ห้ามโยน error ออกไปทั้งก้อน — ตารางหนึ่งพัง (เช่นยังไม่ migrate) ต้องไม่ทำให้ส่วนอื่นหยุด
 *    แต่ต้องรายงานว่าส่วนไหนพัง (ส่งออกไม่ครบต้องบอก ไม่ใช่เงียบ)
 */

interface UserDataSource {
  key: string;
  export: (userId: string) => Promise<unknown>;
  erase: (userId: string) => Promise<unknown>;
}

const SOURCES: UserDataSource[] = [
  {
    key: "journalThreads",
    export: async (userId) => (await import("@/lib/journal/threads.repo")).listThreads(userId),
    erase: async (userId) => (await import("@/lib/journal/threads.repo")).deleteAllThreads(userId),
  },
  {
    // ข้อสังเกตที่เคยสร้างไว้ — เป็นข้อความที่อนุมานจากสมุดของผู้ใช้ จึงเป็นข้อมูลส่วนบุคคลด้วย
    key: "reflections",
    export: async (userId) => (await import("@/lib/journal/reflection.repo")).listReflections(userId),
    erase: async (userId) => (await import("@/lib/journal/reflection.repo")).deleteReflections(userId),
  },
  {
    // ไม่ส่งออก endpoint/กุญแจเต็ม — บอกแค่ว่าเปิดแจ้งเตือนไว้กี่เครื่องและตั้งค่าอะไร (ข้อมูลที่ผู้ใช้เข้าใจได้)
    key: "pushReminders",
    export: async (userId) => (await import("@/lib/push/push.repo")).exportPushSettings(userId),
    erase: async (userId) => (await import("@/lib/push/push.repo")).deleteAllPushSubscriptions(userId),
  },
  {
    // ผังที่ออกแบบเอง — ชื่อ/ตำแหน่งที่ผู้ใช้เขียนเอง (ลิงก์แบ่งปันหายไปพร้อมกันเมื่อลบ)
    key: "customSpreads",
    export: async (userId) => (await import("@/lib/tarot/custom-spread.repo")).listCustomSpreads(userId),
    erase: async (userId) => (await import("@/lib/tarot/custom-spread.repo")).deleteAllCustomSpreads(userId),
  },
  {
    // บัญชีต้นทุน AI รายวัน (แทร็ก S) — แค่จำนวนครั้ง/โทเคน ไม่มีเนื้อหาคำถาม
    key: "aiUsage",
    export: async (userId) => (await import("@/lib/security/cost-ledger")).exportAiUsage(userId),
    erase: async (userId) => (await import("@/lib/security/cost-ledger")).deleteAiUsage(userId),
  },
  {
    // วันที่เปิดไพ่ประจำวัน (ฐานของ streak) — พฤติกรรมรายวันของสมาชิก · `user_key` ของสมาชิกคือ user id ดิบ (A1-05)
    key: "dailyReadings",
    export: async (userId) =>
      (
        await (await db())
          .prepare(`SELECT date_key, created_at FROM daily_readings WHERE user_key = ? ORDER BY date_key DESC`)
          .bind(userId)
          .all<{ date_key: string; created_at: number }>()
      ).results.map((r) => ({ date: r.date_key, at: r.created_at })),
    erase: async (userId) => (await db()).prepare(`DELETE FROM daily_readings WHERE user_key = ?`).bind(userId).run(),
  },
  {
    // บันทึกการส่งอีเมลดวงประจำวัน — วันที่ส่งถึงคนนี้ + ผลการส่ง (A1-05)
    key: "digestLog",
    export: async (userId) =>
      (
        await (await db())
          .prepare(`SELECT send_date, channel, status FROM digest_log WHERE user_id = ? ORDER BY send_date DESC`)
          .bind(userId)
          .all<{ send_date: string; channel: string; status: string }>()
      ).results,
    erase: async (userId) => (await db()).prepare(`DELETE FROM digest_log WHERE user_id = ?`).bind(userId).run(),
  },
  {
    // คิว/นัดปรึกษาแม่หมอที่จองด้วยบัญชีนี้ (A2-01) — ชื่อเล่น · คำถาม (อาจเป็นข้อมูลอ่อนไหว) · คำอ่านที่แนบ · อีเมลติดต่อ
    key: "marketplaceBookings",
    export: exportMarketplaceBookings,
    erase: eraseMarketplaceBookings,
  },
];

async function db() {
  return (await import("@/lib/platform/db")).getAppDB();
}

/** ตั๋วทั้งหมดที่ผูกกับบัญชี (เลือกด้วย subquery เดียวกันทุกคำสั่ง จะได้ไม่ต้องดึง id ออกมาทีละแถว) */
const TICKETS_OF_USER = `SELECT id FROM queue_tickets WHERE user_id = ?`;

async function exportMarketplaceBookings(userId: string): Promise<unknown> {
  const { results } = await (await db())
    .prepare(
      `SELECT t.id, t.reader_id, t.kind, t.status, t.slot_start, t.nickname, t.question, t.reading_snapshot,
              t.created_at, b.slot_end, b.status AS booking_status, b.contact_email, b.cancelled_at, b.refund_status,
              rv.rating AS review_rating, rv.comment AS review_comment
         FROM queue_tickets t
         LEFT JOIN bookings b ON b.ticket_id = t.id
         LEFT JOIN reader_reviews rv ON rv.ticket_id = t.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC`,
    )
    .bind(userId)
    .all<Record<string, unknown>>();
  return results;
}

/**
 * ลบข้อมูลส่วนบุคคลในคิว/นัดของบัญชีนี้ — **ล้างคอลัมน์ ไม่ลบแถว**
 * แถวตั๋ว/ใบจอง/การชำระเงินเป็นหลักฐานทางบัญชีและฐานคำนวณยอดโอนให้แม่หมอ จึงเก็บไว้
 * ส่วนที่ระบุตัวบุคคลหรือเป็นเนื้อหาที่ผู้ใช้เขียน (ชื่อเล่น · คำถาม · คำอ่าน · อีเมล · ผลคัดกรอง AI ·
 * ข้อมูลเชื่อมต่อวิดีโอคอล · ข้อความรีวิว · ชื่อที่แม่หมอตั้งให้ลิงก์ห้อง) ถูกล้างทั้งหมด
 * แล้วตัดการผูกกับบัญชี (`user_id = NULL`) — บัญชีที่คืนชีพด้วย id เดิมจะไม่เห็นนัดเก่าอีก
 * ⚠️ ขั้นตัดการผูกต้องทำเป็นขั้นสุดท้าย เพราะขั้นก่อนหน้าเลือกตั๋วด้วย user_id
 */
async function eraseMarketplaceBookings(userId: string): Promise<void> {
  const conn = await db();
  // ตารางที่มาทีหลัง (0019 · 0021 · 0032) อาจยังไม่มีในฐานข้อมูลเก่า — แยก try ให้ขั้นอื่นทำต่อได้
  const optional = async (sql: string) => {
    try {
      await conn.prepare(sql).bind(userId).run();
    } catch (err) {
      console.warn("[PDPA erase] marketplaceBookings ข้ามขั้นหนึ่ง:", err);
    }
  };
  await optional(`UPDATE bookings SET contact_email = NULL WHERE ticket_id IN (${TICKETS_OF_USER})`);
  await optional(
    `UPDATE call_sessions SET offer_sdp = NULL, answer_sdp = NULL, customer_turn_user = NULL WHERE ticket_id IN (${TICKETS_OF_USER})`,
  );
  await optional(`UPDATE reader_reviews SET comment = NULL, nickname = NULL WHERE ticket_id IN (${TICKETS_OF_USER})`);
  await optional(`UPDATE reader_invites SET label = NULL WHERE ticket_id IN (${TICKETS_OF_USER})`);
  // ปลดการอ้างอิงผลคัดกรองก่อนลบ (กรณีเปิด PRAGMA foreign_keys)
  await conn.prepare(`UPDATE queue_tickets SET ai_screen_id = NULL WHERE user_id = ?`).bind(userId).run();
  await conn.prepare(`DELETE FROM ai_screening WHERE ticket_id IN (${TICKETS_OF_USER})`).bind(userId).run();
  await conn
    .prepare(
      `UPDATE queue_tickets
          SET nickname = NULL, question = NULL, reading_snapshot = NULL, user_id = NULL
        WHERE user_id = ?`,
    )
    .bind(userId)
    .run();
}

export async function exportExtraUserData(userId: string): Promise<{ data: Record<string, unknown>; failed: string[] }> {
  const data: Record<string, unknown> = {};
  const failed: string[] = [];
  for (const src of SOURCES) {
    try {
      data[src.key] = await src.export(userId);
    } catch (err) {
      console.error(`[PDPA export] ${src.key} ล้มเหลว:`, err);
      failed.push(src.key);
    }
  }
  return { data, failed };
}

export async function eraseExtraUserData(userId: string): Promise<{ failed: string[] }> {
  const failed: string[] = [];
  for (const src of SOURCES) {
    try {
      await src.erase(userId);
    } catch (err) {
      console.error(`[PDPA erase] ${src.key} ล้มเหลว:`, err);
      failed.push(src.key);
    }
  }
  return { failed };
}

/** สำหรับด่านทดสอบ — รายชื่อแหล่งข้อมูลที่ลงทะเบียนไว้ */
export function registeredUserDataKeys(): string[] {
  return SOURCES.map((s) => s.key);
}
