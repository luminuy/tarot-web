"use client";

/**
 * ป้าย "เปิดไพ่ต่อเนื่องกี่วันแล้ว" (Daily Streak Ribbon)
 * ------------------------------------------------------
 * ระบบนับวันต่อเนื่องมีโค้ดครบมาตั้งแต่ `migrations/0008_daily_readings.sql`
 * แต่ไม่เคยมีที่ไหนบนหน้าเว็บแสดงค่านี้เลยสักจุด (ค้นทั้งเรโปแล้ว `.tsx` = 0 ผลลัพธ์)
 * ตัวเลขที่ผู้ใช้ไม่เห็น ไม่ทำให้ใครอยากกลับมา — ป้ายนี้คือส่วนที่หายไปของ habit loop
 *
 * กฎเหล็กข้อ 2: ห้ามใช้อิโมจิหรือสัญลักษณ์ดวงดาวแฟนซี (✦, ✨, ✧, ฯลฯ)
 */
export function DailyStreakRibbon({ streak, isEnglish }: { streak: number; isEnglish: boolean }) {
  // 0 = ยังไม่เคยเช็กอิน หรือขาดช่วงไปแล้ว — ไม่ต้องทวงให้รู้สึกผิด เงียบไว้ดีกว่า
  if (!streak || streak < 1) return null;

  const isFirstDay = streak === 1;

  const headline = isEnglish
    ? isFirstDay
      ? "Day 1 of your streak"
      : `${streak} days in a row`
    : isFirstDay
      ? "วันแรกของการเปิดไพ่ต่อเนื่อง"
      : `เปิดไพ่ต่อเนื่องมา ${streak} วันแล้ว`;

  const subline = isEnglish
    ? isFirstDay
      ? "Come back tomorrow to keep it going."
      : "Drop by tomorrow and the count keeps climbing."
    : isFirstDay
      ? "พรุ่งนี้แวะมาเปิดอีกใบ แล้วนับต่อไปเรื่อย ๆ ได้เลย"
      : "พรุ่งนี้มาต่อได้อีก ไม่ต้องรีบ แค่แวะมาทักทายไพ่สักใบก็พอ";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line-warm bg-inset-warm px-4 py-3">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-warm bg-surface text-gold-ink"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v6l4 2" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="font-serif-th text-sm font-bold text-ink">{headline}</p>
        <p className="mt-0.5 font-sans text-xs text-muted">{subline}</p>
      </div>
    </div>
  );
}
