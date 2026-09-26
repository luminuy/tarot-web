/**
 * ⬅️➡️ ลูกศรใต้สไลด์การ์ด (ฝั่ง React) — หน้าตาเดียวกับ `HomeRailNav` (ฝั่ง HTML นิ่ง)
 * วงกลมเทาอ่อนชิดขวาแบบ apple.com · ถึงหัว/ท้ายแถวปุ่มฝั่งนั้นจาง · ขนาดกดจริง 44px ด้วย `tap-overlay`
 * การ์ดพอดีแถว ไม่ต้องเลื่อน (สองปุ่มกดไม่ได้ทั้งคู่) ➔ ไม่วาดปุ่มเลย · สถานะมาจาก `useRail`
 *
 * `overlay` = แบบจอใหญ่ (apple.com Store): ลอยทับกลางแถว ชิดขอบจอซ้าย/ขวา — CSS `.rail-nav-overlay`
 * ซ่อนเองบนมือถือ · ใช้คู่กับแบบปกติที่ใส่ `sm:hidden` ไว้ใต้แถว และห่อแถว+ลูกศรด้วย `.rail-wrap`
 */
export function RailArrows({
  isEnglish,
  canPrev,
  canNext,
  onPrev,
  onNext,
  overlay = false,
}: {
  isEnglish: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  overlay?: boolean;
}) {
  if (!canPrev && !canNext) return null;
  const arrow = (d: string) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d={d} />
    </svg>
  );
  return (
    <div className={overlay ? "rail-nav-overlay" : "flex items-center gap-3"}>
      <button type="button" onClick={onPrev} disabled={!canPrev} className="home-rail-btn tap-overlay" aria-label={isEnglish ? "Previous" : "ก่อนหน้า"}>
        {arrow("M12.5 4.5 7 10l5.5 5.5")}
      </button>
      <button type="button" onClick={onNext} disabled={!canNext} className="home-rail-btn tap-overlay" aria-label={isEnglish ? "Next" : "ถัดไป"}>
        {arrow("M7.5 4.5 13 10l-5.5 5.5")}
      </button>
    </div>
  );
}
