"use client";

/**
 * ✦ ป้ายบอกผู้ใช้ว่าคำอ่านนี้มาจาก "คลังความหมายไพ่" ไม่ใช่แม่หมอ AI
 * ---------------------------------------------------------------------------
 * วันที่ AI ทุกเจ้าไม่ว่าง (โควตาหมด / ล่ม) ระบบเสิร์ฟคำอ่านสำรองจาก `mock-reading.ts`
 * ซึ่งประกอบจากสารานุกรม 78 ใบจริง และไม่หักสิทธิ์ผู้ใช้ — แต่เดิมหน้าเว็บ**ไม่บอกเลย**
 * ผู้ใช้จึงนึกว่าเป็นคำอ่านจากแม่หมอ AI (2026-09-23 วันเดียวเกิด 21 ครั้ง)
 *
 * ต้องพูดตรง ๆ และให้ทางไปต่อ: ปุ่มให้แม่หมอ AI อ่านไพ่ชุดเดิมอีกรอบ
 * (ผู้เรียกส่ง `onRetry` ที่ **อ่านไพ่ชุดเดิม** เท่านั้น ห้ามจั่วใหม่ — A3-10)
 */
export function FallbackNotice({ isEn, onRetry }: { isEn: boolean; onRetry?: () => void }) {
  return (
    <div
      role="status"
      className="altar-card-porcelain !rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <p className="text-xs sm:text-sm text-ink-deep font-serif-th leading-relaxed">
        {isEn
          ? "✦ The AI oracle is busy right now, so this reading comes from our library of card meanings. It did not use up your reading — you can ask the AI oracle again in a moment."
          : "✦ ตอนนี้แม่หมอ AI มีคนใช้งานเยอะ คำอ่านนี้จึงมาจากคลังความหมายไพ่ของเรา ระบบไม่ได้หักสิทธิ์ของคุณ รอสักครู่แล้วกดให้แม่หมอ AI อ่านใหม่ได้เลย"}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="tap-overlay-y self-end sm:self-auto px-5 py-2 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface text-xs font-bold font-serif-th cursor-pointer active:scale-95 transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
        >
          {isEn ? "Ask the AI oracle again" : "ให้แม่หมอ AI อ่านใหม่"}
        </button>
      )}
    </div>
  );
}
