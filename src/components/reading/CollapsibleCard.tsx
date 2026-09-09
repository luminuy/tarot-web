"use client";

import React, { useId, useState } from "react";

export interface CollapsibleCardProps {
  /** หัวข้อสั้น ๆ ที่แสดงบนแถบให้กด */
  title: string;
  /** คำอธิบายบรรทัดเดียวใต้หัวข้อ (ไม่บังคับ) */
  hint?: string;
  /** ไอคอนนำหน้า */
  icon?: React.ReactNode;
  /** ป้ายกำกับด้านขวา เช่นจำนวนหรือสถานะ */
  badge?: React.ReactNode;
  /** เปิดค้างไว้ตั้งแต่แรกหรือไม่ (ค่าเริ่มต้น: ปิด) */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * แถบยุบ/ขยายสไตล์วิหารทองคำ — ใช้ห่อ "ส่วนรอง" ของหน้าผลคำทำนาย
 * เพื่อไม่ให้หน้ายาวเกินไป ผู้ใช้แตะเองเมื่อต้องการดูรายละเอียด
 */
export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  hint,
  icon = null,
  badge,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="my-4 overflow-hidden rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] ">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FFFFFF] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#D9C8AC] bg-[#F3EDE2] text-xs text-[#8F5C1A]">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif-th text-xs font-bold text-[#2E211A] sm:text-sm">{title}</span>
          {hint && <span className="mt-0.5 block truncate font-serif-th text-[13px] text-[#635B4E]">{hint}</span>}
        </span>
        {badge && (
          <span className="flex-shrink-0 rounded-full border border-[#D9C8AC] bg-[#F3EDE2] px-2 py-0.5 text-[13px] font-semibold text-[#2E211A]">
            {badge}
          </span>
        )}
        <span
          className={`flex-shrink-0 font-mono text-xs text-[#635B4E] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {/*
        * ⚠️ ห้ามกลับไปอนิเมต `height: "auto"` ด้วย motion
        * การไล่ค่า height บังคับให้เบราว์เซอร์คำนวณ layout ใหม่ "ทุกเฟรม"
        * และไม่ใช่แค่กล่องนี้ — ทุกอย่างที่อยู่ใต้มันบนหน้าต้องขยับตามไปด้วย
        * แถบยุบ/ขยายเปิดครั้งเดียว = ~60 รอบ layout ซ้อนกันใน 240ms
        *
        * `.anim-swap-rise-sm` ให้กล่องกางเต็มความสูงทันที (layout รอบเดียว)
        * แล้วเลื่อนเนื้อหาขึ้นมา + จางเข้าด้วย transform/opacity ซึ่ง compositor ทำเอง
        * ตาเห็นใกล้เคียงของเดิมมากแต่ไวกว่า — แลกกับไม่มีอนิเมชันขาออก
        * ซึ่งเป็นข้อแลกเปลี่ยนชุดเดียวกับที่บ้านนี้ตัดสินใจไว้แล้วใน INC-0103
        */}
      {open && (
        <div id={panelId} className="overflow-hidden">
          <div className="anim-swap-rise-sm border-t border-[#D9C8AC]/30 px-3 pb-3 pt-1 [&>*]:!my-0">
            {children}
          </div>
        </div>
      )}
    </section>
  );
};
