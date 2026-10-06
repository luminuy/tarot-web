import React from "react";
import { layoutPoints, type LayoutId } from "@/lib/tarot/custom-spread";

/**
 * ✦ ภาพย่อแม่แบบผัง — สี่เหลี่ยมไพ่ตามพิกัดจริงของแม่แบบ (ไม่ใช่ภาพประกอบ ไม่ใช่หน้าไพ่ · กฎเหล็กข้อ 7 ใช้กับภาพไพ่เท่านั้น)
 * `active` = ไฮไลต์ใบที่กำลังแก้ · ภาพเป็นของตกแต่ง (aria-hidden) ข้อความบรรยายอยู่ที่ปุ่มแม่
 */
export const SpreadLayoutGlyph: React.FC<{
  layout: LayoutId;
  count: number;
  size?: number;
  active?: number | null;
  className?: string;
}> = ({ layout, count, size = 44, active = null, className }) => {
  const pts = layoutPoints(layout, count);
  if (!pts) return null;
  const w = 100;
  const h = 70;
  const cw = count >= 6 ? 11 : count >= 4 ? 13 : 15;
  const ch = cw * 1.55;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={size} height={(size * h) / w} aria-hidden="true" className={className}>
      {pts.map(([x, y], i) => (
        <rect
          key={i}
          x={x * w - cw / 2}
          y={y * h - ch / 2}
          width={cw}
          height={ch}
          rx={2}
          className={i === active ? "fill-gold-ink" : "fill-current opacity-60"}
        />
      ))}
    </svg>
  );
};
