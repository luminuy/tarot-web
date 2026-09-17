/**
 * 🕗 วันที่ "วันนี้ที่กรุงเทพฯ" — **แหล่งความจริงเดียวของทั้งระบบ**
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้ (บทเรียน R-25)
 *
 * รอบตรวจ 2026-09-17 พบว่าเส้นแบ่งวันถูกเขียนซ้ำ **6 ที่ 3 วิธี**:
 *
 * | ที่ | วิธี |
 * | :--- | :--- |
 * | `entitlement/daily.ts` | บวก 7 ชั่วโมงเองแล้วอ่าน `getUTC*` ทีละส่วน |
 * | `entitlement/week.ts` | บวก 7 ชั่วโมงเองแล้ว `toISOString().slice(0, 10)` |
 * | `admin/RedeemCodesManager.tsx` · `admin/DailyStatsTable.tsx` · `admin/EntitlementAdmin.tsx` | `Intl` + locale `en-CA` |
 * | `api/admin/marketing/route.ts` | `Intl` + locale `sv-SE` |
 *
 * สอง locale นั้นถูกเลือกมาเพราะ **บังเอิญ** ให้ผลเป็น `YYYY-MM-DD` เหมือนกัน
 * และมีฟังก์ชันชื่อ `todayISO` อยู่สามไฟล์โดยไม่ใช่ฟังก์ชันเดียวกัน
 *
 * ## ทำไมเรื่องนี้ถึงสำคัญกว่าที่เห็น
 *
 * ค่านี้ **ไม่ใช่การจัดรูปแบบวันที่ แต่เป็นคีย์ของโควตาและคีย์ของสตรีค**
 * เส้นแบ่งวันจึงเป็นกฎทางธุรกิจ — คนที่มาแก้บั๊กเส้นแบ่งวันจะแก้ไปหนึ่งหรือสองที่แล้วเชื่อว่าเสร็จ
 * อาการที่ผู้ใช้เจอคือ **"สิทธิ์ฟรีไม่รีเซ็ต"** ซึ่งมาถึงเราในรูปตั๋วซัพพอร์ต ไม่ใช่ stack trace
 *
 * ## กติกา
 *
 * ทุกที่ที่ต้องการ "วันนี้ที่กรุงเทพฯ" ต้องเรียกจากไฟล์นี้เท่านั้น
 * ด่าน `scripts/qa/test-bangkok-day.ts` ห้ามไม่ให้มีใครเขียนวิธีที่ 4 ขึ้นมาอีก
 *
 * ⚠️ ไทยเป็น UTC+7 คงที่ ไม่มี DST — แต่ **อย่าเอาข้อเท็จจริงนั้นไปเขียนสูตรเองที่อื่น**
 * ประเด็นไม่ใช่ว่าสูตรไหนถูก (ทั้งสามวิธีให้ผลตรงกันวันนี้) ประเด็นคือมีสำเนาให้เลื่อนออกจากกันได้
 */

/** เขตเวลาเดียวที่ระบบนี้ใช้ตัดสินเส้นแบ่งวัน */
export const APP_TIME_ZONE = "Asia/Bangkok" as const;

/**
 * ตัวจัดรูปแบบตัวเดียวที่ใช้ซ้ำทั้งกระบวนการ
 *
 * ใช้ `en-CA` เพราะให้ `YYYY-MM-DD` ตรงตามที่ต้องการ — แต่ **ไม่ได้พึ่งความบังเอิญนั้น**
 * `formatToParts()` ข้างล่างประกอบสตริงเองจากส่วนประกอบที่ระบุชื่อ ผลจึงไม่ขึ้นกับ locale
 * (locale เปลี่ยนรูปแบบเมื่อไหร่ ค่าที่คืนออกมายังคงเดิม)
 */
const PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** คืนวันที่ของ `now` ตามเวลากรุงเทพฯ ในรูปแบบ `YYYY-MM-DD` */
export function bangkokDayKey(now: Date = new Date()): string {
  const parts = PARTS_FORMATTER.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  if (!year || !month || !day) {
    // ไม่ควรเกิดขึ้นเลยกับ Intl ที่รองรับ IANA time zone — แต่ถ้าเกิด ห้ามคืนคีย์ที่ผิด
    throw new Error("[bangkokDayKey] ประกอบวันที่จาก Intl ไม่สำเร็จ");
  }
  return `${year}-${month}-${day}`;
}

/** คืนวันที่ของ "เมื่อวาน" ตามเวลากรุงเทพฯ */
export function bangkokYesterdayKey(now: Date = new Date()): string {
  return bangkokDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
}

/**
 * คืนวันจันทร์ต้นสัปดาห์ของ `now` ตามเวลากรุงเทพฯ
 *
 * ไม่ใช้เลขสัปดาห์ ISO เพราะมีกับดักคาบปีและไลบรารีคำนวณไม่ตรงกัน
 * ตัดสัปดาห์แบบ "ปฏิทิน เริ่มจันทร์ 00:00 เวลาไทย" (ENTITLEMENT_PLAN ข้อ 2)
 */
export function bangkokWeekKey(now: Date = new Date()): string {
  const today = bangkokDayKey(now);
  // เที่ยงวันกันปัญหาปัดเศษข้ามวัน — เราสนใจแค่ "วันไหนในสัปดาห์"
  const noonUtc = new Date(`${today}T12:00:00Z`);
  const daysSinceMonday = (noonUtc.getUTCDay() + 6) % 7; // อาทิตย์=0 ➔ 6 · จันทร์=1 ➔ 0
  noonUtc.setUTCDate(noonUtc.getUTCDate() - daysSinceMonday);
  return noonUtc.toISOString().slice(0, 10);
}

/** เวลาที่โควตารายวันจะรีเซ็ต = เที่ยงคืนถัดไป 00:00 เวลาไทย (ISO string สำหรับส่งให้ UI) */
export function bangkokNextMidnightISO(now: Date = new Date()): string {
  const today = bangkokDayKey(now);
  const tomorrow = new Date(new Date(`${today}T00:00:00+07:00`).getTime() + 24 * 60 * 60 * 1000);
  return tomorrow.toISOString();
}
