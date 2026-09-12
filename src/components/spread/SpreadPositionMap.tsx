import type { SpreadPosition } from "@/data/spreads";
import { mapLayout, MAP_CARD_ASPECT, MAP_CARD_MIN_PX } from "@/lib/tarot/spread-map-geometry";

/**
 * แผนผังตำแหน่งไพ่แบบ SSR ล้วน — วาดจากพิกัด x/y (0..1) ของแต่ละตำแหน่งในผัง
 * ใช้บนหน้า /spreads/[id] ซึ่งเป็นหน้า SEO ที่ต้องเรนเดอร์ฝั่งเซิร์ฟเวอร์ทั้งหมด
 * (renderSpreadIllustration เดิมอยู่ในโมดูล "use client" + ลาก motion/เสียงเข้ามา จึงใช้ที่นี่ไม่ได้)
 *
 * ⚠️ ตัวเลขเรขาคณิตทั้งหมดอยู่ที่ `@/lib/tarot/spread-map-geometry` ที่เดียว
 * ห้ามเขียนค่าคงที่ (ความกว้างการ์ด · สเกลแกน y · ความสูงกรอบ) ซ้ำลงในไฟล์นี้เด็ดขาด
 * ISSUE-034 เกิดขึ้นเพราะค่าชุดนี้เคยอยู่สองที่แล้วเลื่อนออกจากกันเงียบ ๆ
 * ด่าน `scripts/qa/test-spreads.ts` ตรวจว่าไม่มีไพ่คู่ไหนทับกันโดยใช้โมดูลเดียวกันนี้
 */
/*
 * ⚠️ ไฟล์นี้เป็น server component โดยเจตนา (ไม่มี "use client") จึงใช้ hook `useLocale` ไม่ได้
 * ภาษาจึงต้องรับมาเป็น prop จากผู้เรียกแทน — ของเดิม `aria-label` เป็นไทยล้วน
 * ทำให้หน้า /en/spreads/[id] มีชื่อภาพเป็นภาษาไทย (UX-17)
 */
export function SpreadPositionMap({
  positions,
  isEnglish = false,
}: {
  positions: SpreadPosition[];
  isEnglish?: boolean;
}) {
  const layout = mapLayout(positions);

  return (
    <div
      className="relative w-full rounded-xl border border-line bg-inset"
      style={{ paddingBottom: `${(layout.boxHeight * 100).toFixed(2)}%` }}
      role="img"
      aria-label={
        isEnglish
          ? `Card layout diagram with ${positions.length} positions`
          : `แผนผังการวางไพ่ ${positions.length} ตำแหน่ง`
      }
    >
      {positions.map((pos, idx) => (
        <div
          key={idx}
          className="absolute flex items-center justify-center rounded-[4px] border border-gold bg-surface text-[12px] font-bold text-ink shadow-sm"
          style={{
            left: `${pos.x * 100}%`,
            // แกน y วัดเป็นหน่วยเดียวกับแกน x (เทียบความกว้างกรอบ) แล้วหารด้วยความสูงกรอบ
            // เพื่อแปลงเป็นเปอร์เซ็นต์ของกรอบ ซึ่งเป็นหน่วยที่ `top` ใช้
            top: `${(((pos.y * layout.yScale + layout.offsetY) / layout.boxHeight) * 100).toFixed(3)}%`,
            width: `${(layout.cardW * 100).toFixed(2)}%`,
            minWidth: MAP_CARD_MIN_PX,
            aspectRatio: `1 / ${MAP_CARD_ASPECT}`,
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
