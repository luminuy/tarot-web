import React from "react";

import type { SpreadPosition } from "@/data/spreads";

/**
 * แผนผังตำแหน่งไพ่แบบ SSR ล้วน — วาดจากพิกัด x/y (0..1) ของแต่ละตำแหน่งในผัง
 * ใช้บนหน้า /spreads/[id] ซึ่งเป็นหน้า SEO ที่ต้องเรนเดอร์ฝั่งเซิร์ฟเวอร์ทั้งหมด
 * (renderSpreadIllustration เดิมอยู่ในโมดูล "use client" + ลาก motion/เสียงเข้ามา จึงใช้ที่นี่ไม่ได้)
 */
export function SpreadPositionMap({ positions }: { positions: SpreadPosition[] }) {
  const maxY = Math.max(...positions.map((p) => p.y), 0.5);
  // เผื่อขอบล่างเมื่อผังใช้พื้นที่แนวตั้งไม่เต็ม
  const heightRatio = Math.min(1, maxY + 0.18);

  return (
    <div
      className="relative w-full rounded-xl border border-[#D5CEC2] bg-[#EAE7E0]"
      style={{ paddingBottom: `${Math.round(heightRatio * 78)}%` }}
      role="img"
      aria-label={`แผนผังการวางไพ่ ${positions.length} ตำแหน่ง`}
    >
      {positions.map((pos, idx) => (
        <div
          key={idx}
          className="absolute flex items-center justify-center rounded-[4px] border border-[#A58A5C] bg-[#FFFFFF] text-[12px] font-bold text-[#29261F] shadow-sm"
          style={{
            left: `${pos.x * 100}%`,
            top: `${(pos.y / heightRatio) * 100}%`,
            width: "13%",
            minWidth: 26,
            aspectRatio: "2 / 3",
            transform: `translate(-50%, -50%) rotate(${pos.rotate ?? 0}deg)`,
          }}
        >
          {/* หมุนเลขกลับให้ตั้งตรงเสมอ แม้การ์ดจะวางขวาง (เช่นใบที่ 2 ของเซลติกครอส) */}
          <span style={{ transform: `rotate(${-(pos.rotate ?? 0)}deg)` }}>{idx + 1}</span>
        </div>
      ))}
    </div>
  );
}
