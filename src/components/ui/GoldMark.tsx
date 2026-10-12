/**
 * เครื่องหมายทองรูปข้าวหลามตัด — วาดด้วย CSS ล้วน ใช้แทน ✦ ที่เคยพิมพ์เป็นตัวอักษร
 * ===========================================================================
 *
 * เจ้าของสั่ง (2026-10-07): หน้าเว็บห้ามมีอิโมจิ/สัญลักษณ์ที่เป็นตัวอักษร รวมถึง ✦ ✨
 * ตัวอักษรพวกนี้หน้าตาเปลี่ยนตามฟอนต์ของเครื่อง (บางเครื่องขึ้นเป็นอิโมจิสี)
 * ส่วนรูปทรงนี้หน้าตาเหมือนกันทุกเครื่อง และสีตาม `color` ของตัวเอง (`bg-current`)
 * ใส่ `text-gold-ink` / `text-muted` ที่ `className` เพื่อเปลี่ยนสี
 *
 * ด่าน `test-code-debt` (A5-03) จับ ✦ ✨ ในโค้ดหน้าเว็บ — ของตกแต่งให้ใช้ตัวนี้แทน
 */
export function GoldMark({
  size = "sm",
  hollow = false,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  /** โปร่งกลาง = สถานะ "ไม่ได้ใช้ / ยังไม่เลือก" */
  hollow?: boolean;
  className?: string;
}) {
  const dim = size === "lg" ? "w-3 h-3" : size === "md" ? "w-2 h-2" : "w-1.5 h-1.5";
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rotate-45 align-middle ${dim} ${hollow ? "border border-current" : "bg-current"} ${className}`}
    />
  );
}
