"use client";

import { useRef } from "react";

import { BriefIcon, ClockIcon, ShieldIcon, VideoIcon } from "@/components/marketplace/ConsultIcons";
import { RailArrows } from "@/components/ui/RailArrows";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { useRail } from "@/components/ui/use-rail";
import { CONSULTATION_MINUTES } from "@/lib/marketplace/offer";

/**
 * ✦ "สบายใจตั้งแต่ก่อนเริ่มคุย" — แถวปัดแบบเดียวกับหน้าแรก (เจ้าของสั่ง 2026-10-02)
 * ใช้ `.home-rail` + `useRail` + `RailArrows` ชุดเดียวกับหน้าแรก: ทุกจอเป็นแถวปัด
 * เห็นใบถัดไปโผล่ขอบเป็นสัญญาณว่าปัดได้ · ลูกศรแบบ apple.com ชิดขวาใต้แถว
 */
const ITEMS = [
  { Icon: VideoIcon, title: "วิดีโอคอลในเว็บ", body: "กดเข้าห้องได้จากมือถือหรือคอม ไม่ต้องลงแอป ไม่ต้องแอด LINE" },
  { Icon: ShieldIcon, title: "ความเป็นส่วนตัวมาก่อน", body: "แม่หมอไม่เห็นเบอร์โทรและ IP ของคุณ เว็บไม่บันทึกภาพและเสียง" },
  { Icon: BriefIcon, title: "แม่หมอรู้เรื่องก่อนคุย", body: "AI สรุปคำถามให้แม่หมออ่านก่อน ไม่ต้องเล่าใหม่ตั้งแต่ต้น" },
  {
    Icon: ClockIcon,
    title: `${CONSULTATION_MINUTES} นาทีเต็ม`,
    body: "รู้ราคาก่อนจอง จ่ายครั้งเดียว ยกเลิกก่อนนัด 24 ชม. คืนเงินเต็ม",
  },
];

export function ReadersValueRail() {
  const trackRef = useRef<HTMLUListElement>(null);
  const rail = useRail(trackRef, ITEMS.length);

  return (
    <section aria-labelledby="readers-why" className="pt-20 sm:pt-24 space-y-6 sm:space-y-8">
      <div className="space-y-2 pb-4 border-b border-line-warm/50">
        <p className="text-[13px] font-bold text-gold-ink">ทำไมต้องปรึกษาที่นี่</p>
        <h2 id="readers-why" className="text-2xl sm:text-3xl font-bold text-ink-deep [text-wrap:balance]">
          <ThaiPhrases>สบายใจ ตั้งแต่ก่อนเริ่มคุย</ThaiPhrases>
        </h2>
      </div>

      <div className="space-y-3">
        <ul ref={trackRef} onScroll={rail.onScroll} className="home-rail">
          {ITEMS.map(({ Icon, title, body }) => (
            <li key={title} className="altar-card-porcelain !rounded-3xl p-6 flex flex-col gap-3">
              <span className="h-11 w-11 rounded-2xl bg-gold-ink/10 text-gold-ink grid place-items-center">
                <Icon />
              </span>
              <h3 className="font-bold text-ink-deep">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                <ThaiPhrases>{body}</ThaiPhrases>
              </p>
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <RailArrows isEnglish={false} canPrev={rail.canPrev} canNext={rail.canNext} onPrev={rail.prev} onNext={rail.next} />
        </div>
      </div>
    </section>
  );
}
