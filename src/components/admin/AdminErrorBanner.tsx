"use client";

/**
 * ♻️ แถบแจ้งข้อผิดพลาดของแผงแอดมิน — รูปเดียวกันทุกแผง (R-28)
 *
 * ⚠️ หน้าจอเฝ้าระบบที่ "ไม่มีข้อมูล" กับ "พัง" หน้าตาเหมือนกัน คือหน้าจอที่โกหกผู้ดูแล
 * ทุกแผงต้องเรนเดอร์ตัวนี้เมื่อโหลดไม่สำเร็จ ด่าน `test-code-debt.ts` เฝ้าอยู่
 */
export function AdminErrorBanner({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start justify-between gap-3"
    >
      <div className="space-y-1">
        <p className="font-bold">โหลดข้อมูลไม่สำเร็จ — ตัวเลขด้านล่างไม่ใช่ของปัจจุบัน</p>
        <p className="opacity-90">{error}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="tap-overlay-y shrink-0 rounded-lg border border-rose-300 px-3 py-1.5 font-bold cursor-pointer hover:bg-rose-100 transition"
        >
          ลองใหม่
        </button>
      )}
    </div>
  );
}
