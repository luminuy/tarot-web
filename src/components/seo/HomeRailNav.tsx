/**
 * ⬅️➡️ ปุ่มลูกศรใต้สไลด์การ์ดบนมือถือ — แบบเดียวกับ apple.com (วงกลมเทาอ่อน ชิดขวา)
 * ---------------------------------------------------------------------------
 * ใช้คู่กับคลาส `.home-rail` (globals.css) — ห่อทั้งคู่ด้วย `<div data-rail>` แล้วใส่
 * `data-rail-track` ที่ตัวแถวการ์ด · สคริปต์ `astro/scripts/home-rails.ts` ผูกปุ่มกับแถวให้
 * (ส่วนที่ใช้เป็น HTML นิ่ง ไม่ hydrate จึงผูกด้วยสคริปต์ธรรมดา ไม่ใช่ React)
 *
 * ปุ่ม "ก่อนหน้า" เริ่มแบบ disabled เพราะแถวเริ่มที่ใบแรกเสมอ · ปุ่มเห็นเฉพาะมือถือ (จอใหญ่เป็นกริด)
 */
export function HomeRailNav({ isEnglish, className = "" }: { isEnglish: boolean; className?: string }) {
  const arrow = (d: string) => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
  return (
    <div className={`flex sm:hidden justify-end gap-3 -mt-1 ${className}`}>
      <button
        type="button"
        data-rail-prev
        disabled
        className="home-rail-btn tap-overlay"
        aria-label={isEnglish ? "Previous" : "ก่อนหน้า"}
      >
        {arrow("M12.5 4.5 7 10l5.5 5.5")}
      </button>
      <button
        type="button"
        data-rail-next
        className="home-rail-btn tap-overlay"
        aria-label={isEnglish ? "Next" : "ถัดไป"}
      >
        {arrow("M7.5 4.5 13 10l-5.5 5.5")}
      </button>
    </div>
  );
}
