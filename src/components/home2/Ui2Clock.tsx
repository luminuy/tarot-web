/**
 * ⏳ นาฬิกานับถอยหลังไพ่ประจำวัน (UI 2.0 หัวข้อ 6.2 · 6.8) — มาร์กอัปล้วน ไม่มี state
 * ===========================================================================
 * ใช้ได้ทั้งใน island (หัวหน้า) และ HTML นิ่ง (ส่วนปิดท้าย) · ตัวเลขเติมโดย `astro/scripts/ui2-home.ts`
 *
 * ⚠️ เซิร์ฟเวอร์ส่ง `--` เสมอ — ห้ามเรนเดอร์เลขจริงตอนบิลด์ (เลขค้างจากตอนบิลด์ + hydration ไม่ตรง · กับดักข้อ 10)
 *    ช่องตัวเลขใส่ `suppressHydrationWarning` เพราะสคริปต์อาจเติมเลขก่อน island hydrate เสร็จ
 * ⚠️ โปรแกรมอ่านหน้าจออ่านประโยคเดียว (sr-only) ห้าม aria-live ทุกวินาที — ตัวเลขทั้งหมด aria-hidden
 * ⚠️ ตัวเลขใช้ `.ui2-num` (Anuphan ตัวตรง + tabular-nums) — ห้ามตัวเอียง (เจ้าของสั่ง 2026-10-12)
 */
const UNITS = [
  { u: "h", th: "ชั่วโมง", en: "hours" },
  { u: "m", th: "นาที", en: "min" },
  { u: "s", th: "วินาที", en: "sec" },
] as const;

/** กล่อง 3 ช่อง (หัวหน้า · ส่วนปิดท้าย) — แบบชิปบรรทัดเดียวเลิกใช้แล้ว 2026-10-13 (ภาพต้นแบบ D+ ใช้กล่องทุกจอ) */
export function Ui2Clock({ isEnglish }: { isEnglish: boolean }) {
  const label = isEnglish ? "New daily card in" : "ไพ่ประจำวันใบใหม่จะมาในอีก";
  const sr = isEnglish
    ? "A new card of the day arrives at midnight, Thailand time."
    : "ไพ่ประจำวันใบใหม่มาทุกเที่ยงคืนตามเวลาไทย";
  const done = isEnglish ? "The new card is here" : "ไพ่ใบใหม่มาแล้ว";

  return (
    <div className="ui2-clock" data-ui2-clock>
      <p className="ui2-clock-label">
        <span className="sr-only">{sr}</span>
        <span className="ui2-clock-wait" aria-hidden="true">
          {label}
        </span>
        <a className="ui2-clock-done" href={isEnglish ? "/en/daily" : "/daily"}>
          {done}
        </a>
      </p>
      <div className="ui2-clock-cells" aria-hidden="true">
        {UNITS.map((unit, i) => (
          <div key={unit.u} className="ui2-clock-group">
            {i > 0 && <span className="ui2-clock-sep">:</span>}
            <div className="ui2-clock-cell">
              <span className="ui2-num" data-u={unit.u} suppressHydrationWarning>
                --
              </span>
              <span className="ui2-clock-unit">{isEnglish ? unit.en : unit.th}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
