import type { ReactNode } from "react";

import { CardImage } from "@/components/card/CardImage";
import { RouteLink } from "@/components/ui/RouteLink";

/**
 * ✦ วงล้อจักรราศี 12 ราศี (ภาพไพ่ประจำราศีวางรอบวง + ช่องกลางวงใส่อะไรก็ได้)
 * ===========================================================================
 * ใช้สองที่: หัวหน้า `/cards/zodiac` (`ZodiacFinder` — island มีสถานะ) และหน้าแรก
 * (`HomeZodiacSection` — HTML นิ่ง ไม่ hydrate) · เจ้าของขอให้หน้าแรกใช้วงล้อเดียวกันเป๊ะ (2026-09-26)
 *
 * ⚠️ ห้ามใช้ hook / `"use client"` ในไฟล์นี้ — ต้องเรนเดอร์ได้จากทั้ง island และ HTML นิ่ง
 *    (ลิงก์ใช้ `RouteLink` ซึ่งไม่มี hook · ผู้เรียกส่ง `hrefFor` ที่เติมภาษามาเอง)
 */
export interface ZodiacWheelSign {
  id: string;
  nameTh: string;
  nameEn: string;
  major: { id: string; image: string; nameEn: string };
}

/**
 * ตำแหน่งบนวงล้อ (%) — เริ่มที่เมษ (ขวาของจุดบนสุด) แล้ววนตามเข็มนาฬิกา
 *
 * ⚠️ ทำไมเป็นวงรีในกล่อง 4:5 และเยื้องมุมครึ่งช่อง (15°) — วัดจากจอจริง 390px:
 *   วงกลมในกล่องจัตุรัสทำให้ไพ่ด้านซ้าย/ขวา (ที่วางซ้อนกันแนวตั้ง) ทับกันและทับชื่อราศี
 *   ระยะห่างแนวตั้งของคู่ด้านข้าง = 2·sin15°·Ry ต้อง ≥ สูงไพ่ + ชื่อ (~81px ที่ 390px · ~121px ที่ 560px)
 *   Ry = 39% ของความสูง (5/4 ของกว้าง) ให้ 90px / 142px · คู่แนวทแยงห่างแนวนอน ≥ ความกว้างไพ่ 11%
 *   ถ้าจะขยายไพ่หรือหดกล่อง ต้องคิดสองค่านี้ใหม่ ไม่งั้นไพ่ด้านข้างกลับมาทับกัน
 */
function wheelPoint(index: number): { left: string; top: string } {
  const angle = ((index + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
  return { left: `${50 + Math.cos(angle) * 39}%`, top: `${50 + Math.sin(angle) * 39}%` };
}

export function ZodiacWheel({
  signs,
  isEnglish,
  hrefFor,
  markTropical,
  markThai,
  seasonId,
  children,
}: {
  signs: readonly ZodiacWheelSign[];
  isEnglish: boolean;
  /** ลิงก์ไปหน้าราศี (เติมภาษาแล้ว) */
  hrefFor: (signId: string) => string;
  /** ราศีสากลของผู้ใช้ — วงทองทึบ */
  markTropical?: string;
  /** ราศีไทยของผู้ใช้ — วงประ */
  markThai?: string;
  /** ฤดูราศีตอนนี้ — ป้าย "ฤดูนี้" (หน้าแรกบิลด์ครั้งเดียว จึงไม่ส่งค่านี้ ป้ายจะค้างผิดเดือน) */
  seasonId?: string;
  /** ช่องกลางวง: กลางวง (sm+) / ใต้วง (มือถือ) */
  children?: ReactNode;
}) {
  const shortName = (s: ZodiacWheelSign) => (isEnglish ? s.nameEn : s.nameTh.replace("ราศี", ""));
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="relative w-full aspect-[4/5]">
        <div aria-hidden="true" className="absolute inset-[4%] rounded-[50%] border border-line-warm/70 bg-surface/40" />
        <div aria-hidden="true" className="absolute inset-[22%] rounded-[50%] border border-dashed border-line-warm/60" />
        <ul className="contents">
          {signs.map((s, i) => {
            const isMine = markTropical === s.id;
            const isThai = markThai === s.id && !isMine;
            const isSeason = seasonId === s.id;
            return (
              <li key={s.id} className="absolute w-[11%] -translate-x-1/2 -translate-y-1/2" style={wheelPoint(i)}>
                <RouteLink
                  href={hrefFor(s.id)}
                  prefetch={false}
                  className="group flex flex-col items-center gap-0.5 text-center"
                  aria-label={`${isEnglish ? s.nameEn : s.nameTh} · ${s.major.nameEn}${
                    isSeason ? (isEnglish ? " · current sun season" : " · ฤดูราศีตอนนี้") : ""
                  }`}
                >
                  <span
                    className={`relative block w-full rounded-md transition-transform duration-300 group-hover:-translate-y-0.5 ${
                      isMine
                        ? "ring-2 ring-gold-ink ring-offset-2 ring-offset-surface"
                        : isThai
                          ? "outline-2 outline-dashed outline-gold-ink outline-offset-2"
                          : ""
                    }`}
                  >
                    <CardImage
                      image={s.major.image}
                      cardId={s.major.id}
                      alt=""
                      sizes="(min-width: 640px) 62px, 11vw"
                      className="w-full aspect-[1/1.7] rounded-md border border-line-warm shadow-xs object-cover"
                    />
                    {isSeason && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gold-ink px-1.5 text-[10px] leading-4 font-bold text-surface whitespace-nowrap">
                        {isEnglish ? "Now" : "ฤดูนี้"}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[11px] sm:text-[13px] font-serif-th font-bold leading-tight whitespace-nowrap mt-1 ${
                      isMine || isThai ? "text-gold-ink" : "text-ink group-hover:text-gold-ink"
                    }`}
                  >
                    {shortName(s)}
                  </span>
                </RouteLink>
              </li>
            );
          })}
        </ul>
      </div>
      {children && (
        <div className="mt-4 sm:mt-0 sm:absolute sm:left-1/2 sm:top-1/2 sm:w-[42%] sm:-translate-x-1/2 sm:-translate-y-1/2">
          {children}
        </div>
      )}
    </div>
  );
}
