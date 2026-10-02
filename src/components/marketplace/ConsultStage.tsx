import { CardImage } from "@/components/card/CardImage";
import { MicIcon, PhoneDownIcon, VideoIcon } from "@/components/marketplace/ConsultIcons";
import { CONSULTATION_MINUTES } from "@/lib/marketplace/offer";

/**
 * 🎴 เวทีปรึกษา (ภาพประกอบหัวหน้ารวมแม่หมอ)
 * ---------------------------------------------------------------------------
 * เล่าในภาพเดียวว่า "ได้คุยตัวต่อตัวผ่านวิดีโอคอล บนโต๊ะไพ่จริง" — ไพ่ 1909 Rider-Waite สามใบ
 * วางพัดบนผืนกำมะหยี่ + แถบควบคุมการโทร · ทั้งก้อนเป็นภาพประกอบ จึงซ่อนจากโปรแกรมอ่านจอ
 * ⚠️ ไม่ใส่ชื่อ/รีวิว/ตัวเลขของแม่หมอคนใดลงภาพนี้ — ห้ามกุข้อมูลที่ดูเหมือนของจริง
 */

const FAN = [
  { image: "major-02.jpg", rotate: "-rotate-[14deg]", shift: "-translate-x-[62%] translate-y-3" },
  { image: "major-17.jpg", rotate: "rotate-0", shift: "-translate-x-1/2 -translate-y-2" },
  { image: "major-21.jpg", rotate: "rotate-[14deg]", shift: "-translate-x-[38%] translate-y-3" },
] as const;

export function ConsultHeroStage() {
  return (
    <div aria-hidden="true" className="consult-stage relative w-full aspect-[5/6] sm:aspect-[4/3] lg:aspect-[5/6] rounded-[28px] overflow-hidden">
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between text-[13px] font-serif-th">
        <span className="consult-stage-bar inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-surface">
          <span className="h-2 w-2 rounded-full bg-ok-on-dark animate-pulse" />
          แม่หมอพร้อมคุย
        </span>
        <span className="consult-stage-bar inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-gold-on-dark">
          <VideoIcon width={16} height={16} />
          วิดีโอคอลส่วนตัว
        </span>
      </div>

      {/* พัดไพ่สามใบกลางเวที */}
      <div className="absolute inset-x-0 top-[18%] bottom-[26%]">
        {FAN.map((card, i) => (
          <div
            key={card.image}
            className={`absolute left-1/2 top-0 h-full aspect-[1/1.72] ${card.shift} ${card.rotate} origin-bottom rounded-xl overflow-hidden ring-1 ring-gold-on-dark/50 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)]`}
            style={{ zIndex: i === 1 ? 2 : 1 }}
          >
            <CardImage image={card.image} alt="" sizes="(min-width: 1024px) 160px, 120px" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      {/* แถบการโทร */}
      <div className="absolute bottom-5 left-5 right-5 consult-stage-bar rounded-2xl p-3 flex items-center gap-3 font-serif-th">
        <span className="h-10 w-10 shrink-0 rounded-full bg-gold-on-dark/20 ring-1 ring-gold-on-dark/50 grid place-items-center text-gold-on-dark font-bold">
          ✦
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-sm font-bold text-surface">แม่หมอของคุณ</span>
          <span className="block text-[13px] text-surface opacity-80">คุยตัวต่อตัว · {CONSULTATION_MINUTES} นาที</span>
        </span>
        <span className="h-9 w-9 rounded-full consult-stage-bar grid place-items-center text-surface">
          <MicIcon width={18} height={18} />
        </span>
        <span className="h-9 w-9 rounded-full bg-err grid place-items-center text-surface">
          <PhoneDownIcon width={18} height={18} />
        </span>
      </div>
    </div>
  );
}
