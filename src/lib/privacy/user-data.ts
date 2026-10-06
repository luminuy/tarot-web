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
];

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

/** ฟีเจอร์ที่โหลดทีหลังลงทะเบียนเพิ่มได้ (ต้องเรียกตอน import โมดูล ไม่ใช่ระหว่างคำขอ) */
export function registerUserDataSource(src: UserDataSource): void {
  if (!SOURCES.some((s) => s.key === src.key)) SOURCES.push(src);
}
