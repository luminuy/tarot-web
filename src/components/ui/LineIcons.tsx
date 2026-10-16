/**
 * ไอคอนเส้นสำหรับปุ่มที่ต้องมีไอคอนจริง ๆ (ปิด · ติ๊กสถานะ · ลูกศรพับ/กาง · ย้อน/ถัดไป · โหลดใหม่)
 * ===========================================================================
 * เจ้าของสั่ง (2026-10-16): "อีโมจิอื่น ๆ ด้วยก็ไม่เอา เอาออกทั้งหมดในเว็บ"
 * ➔ ห้ามพิมพ์ตัวอักษรสัญลักษณ์ (✕ ✓ → ← ➔ ▼ ▲ ▾ ↻ ↗ ★ •) ลงในหน้าเว็บอีก
 *    ทั้งเป็นปุ่ม เป็นเครื่องหมายหน้าข้อความ หรือของตกแต่ง (ด่าน A5-03 ใน test-code-debt เฝ้าอยู่)
 * ข้อความลิงก์ไม่ต้องมีลูกศรต่อท้าย — ปุ่มที่ไม่มีข้อความเลย (ปิด · ก่อน/ถัดไป) ใช้ไอคอนในไฟล์นี้
 * ห้ามเพิ่มรูปทรงตกแต่ง (ดาว · ประกาย · เพชร) ในไฟล์นี้
 */

interface LineIconProps {
  className?: string;
}

const base = (className: string) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true as const,
});

/** กากบาท — ปุ่มปิด/ลบ */
export function CloseIcon({ className = "w-4 h-4" }: LineIconProps) {
  return (
    <svg {...base(className)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/** ติ๊ก — สถานะเสร็จ/ผ่าน */
export function CheckIcon({ className = "w-4 h-4" }: LineIconProps) {
  return (
    <svg {...base(className)}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** หัวลูกศรพับ — หมุนด้วย `direction` (ลง = กาง · ขึ้น = พับ · ซ้าย/ขวา = ก่อน/ถัดไป) */
export function ChevronIcon({ className = "w-4 h-4", direction = "down" }: LineIconProps & { direction?: "down" | "up" | "left" | "right" }) {
  const d = { down: "M6 9l6 6 6-6", up: "M6 15l6-6 6 6", left: "M15 6l-6 6 6 6", right: "M9 6l6 6-6 6" }[direction];
  return (
    <svg {...base(className)}>
      <path d={d} />
    </svg>
  );
}

/** ลูกศรวน — โหลดใหม่ */
export function RefreshIcon({ className = "w-4 h-4" }: LineIconProps) {
  return (
    <svg {...base(className)}>
      <path d="M19.5 12a7.5 7.5 0 11-2.2-5.3M19.5 4.5v3.8h-3.8" />
    </svg>
  );
}

/** หมุดปัก — ปุ่มปักหมุดรายการ (`filled` = ปักอยู่) */
export function PinIcon({ className = "w-5 h-5", filled = false }: LineIconProps & { filled?: boolean }) {
  return (
    <svg {...base(className)} fill={filled ? "currentColor" : "none"}>
      <path d="M9 3.5h6l-1 5.5 3.5 3.5H6.5L10 9z" />
      <path d="M12 12.5V20.5" fill="none" />
    </svg>
  );
}

/** คน — ตำแหน่งรูปโปรไฟล์ที่ยังไม่มีภาพ */
export function PersonIcon({ className = "w-5 h-5" }: LineIconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19.5a6.5 6.5 0 0113 0" />
    </svg>
  );
}
