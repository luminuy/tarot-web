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
  /* หัวลูกศรวาดด้วย `.rail-arrow-prev/next::after` ใน globals.css (mask) ไม่ใช่ <svg><path>
     ปุ่มละ 1 element แทน 3 — หน้าแรกมีลูกศรชุดนี้ 4 ชุด (งบ DOM หน้าแรก · INC-0247)
     ⚠️ `::before` ของปุ่มเป็นของ `.tap-overlay` (พื้นที่กด 44px) */
  return (
    <div className={overlay ? "rail-nav-overlay" : "flex items-center gap-3"}>
      <button type="button" onClick={onPrev} disabled={!canPrev} className="home-rail-btn rail-arrow-prev tap-overlay" aria-label={isEnglish ? "Previous" : "ก่อนหน้า"} />
      <button type="button" onClick={onNext} disabled={!canNext} className="home-rail-btn rail-arrow-next tap-overlay" aria-label={isEnglish ? "Next" : "ถัดไป"} />
    </div>
  );
}
