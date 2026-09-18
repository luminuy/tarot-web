"use client";

import type { ReadingState } from "@/components/home/flow-reading";

/**
 * ✦ คำอ่านของแม่หมอบนหน้าไพ่ใบเดียว
 * ===========================================================================
 * หน้าไพ่ใบเดียว (`/daily` · `/love/1-card`) ไม่ได้ใช้ `StreamReader` ตัวเต็ม
 * เพราะตัวนั้นออกแบบมาสำหรับผังหลายใบ (แท่นไพ่ · แถบสลับใบ · หลักฐาน Provably Fair)
 * ซึ่งเกินความจำเป็นและหนักเกินไปสำหรับหน้าที่มีไพ่ใบเดียว
 *
 * ตัวนี้จึงแสดงเฉพาะสามก้อนที่หน้าไพ่ใบเดียวต้องการ: คำเปิด · คำอ่านของไพ่ · บทสรุป
 * โดยอ่านจากสถานะตัวเดียวกับหน้าแรก (`readingReducer`) จึงไม่มีสถานะขัดแย้งในตัวเอง
 */
export function OneCardAiReading({
  state,
  isEn,
  onRetry,
}: {
  state: ReadingState;
  isEn: boolean;
  onRetry: () => void;
}) {
  const reading = state.reading;
  const cardReading = reading?.cards?.[0];

  /* สตรีมสะดุด — ของที่มาถึงแล้วยังอยู่ ผู้ใช้กดอ่านใหม่ได้ */
  if (state.error) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5 space-y-3">
        <p className="text-sm text-ink">{state.error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-full bg-ink text-surface-warm text-xs font-serif-th font-semibold shadow-raised hover:bg-gold transition cursor-pointer"
        >
          {isEn ? "Reload and try again" : "โหลดใหม่อีกครั้ง"}
        </button>
      </div>
    );
  }

  if (state.status === "idle" && !reading) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-base sm:text-lg font-serif-th font-bold text-ink">
          {isEn ? "The Oracle Reads Your Card" : "คำอ่านจากแม่หมอ"}
        </h3>
        {state.status === "streaming" && (
          <span className="text-xs font-serif-th text-gold-ink">
            {isEn ? "reading…" : "กำลังอ่าน…"}
          </span>
        )}
      </div>

      {reading?.opening && (
        <p className="text-sm sm:text-base leading-relaxed text-ink whitespace-pre-line">
          {reading.opening}
        </p>
      )}

      {cardReading?.headline && (
        <p className="text-sm sm:text-base font-serif-th font-semibold text-gold-ink">
          {cardReading.headline}
        </p>
      )}

      {cardReading?.reading && (
        <p className="text-sm sm:text-base leading-relaxed text-ink whitespace-pre-line">
          {cardReading.reading}
        </p>
      )}

      {reading?.summary && (
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-serif-th font-semibold tracking-wide text-gold-ink mb-2">
            {isEn ? "In Summary" : "สรุปใจความ"}
          </p>
          <p className="text-sm sm:text-base leading-relaxed text-ink whitespace-pre-line">
            {reading.summary}
          </p>
        </div>
      )}

      {reading?.advice && reading.advice.length > 0 && (
        <ul className="space-y-2">
          {reading.advice.map((line, i) => (
            <li key={i} className="text-sm sm:text-base leading-relaxed text-ink pl-5 relative">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-gold rotate-45" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
