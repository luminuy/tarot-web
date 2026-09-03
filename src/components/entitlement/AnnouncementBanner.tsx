"use client";

import { useEffect, useState } from "react";

import { DAILY_LIMIT, GUEST_LIMIT } from "@/lib/entitlement/copy";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * แบนเนอร์ประกาศล่วงหน้า: "ระบบสิทธิ์เปิดไพ่กำลังจะมา" (ENTITLEMENT_PLAN PR F / ข้อ 10)
 * แสดงเมื่อ admin เปิด flag `entitlement.announce` และยังไม่เปิดระบบจริง
 * ปิดได้ (จำใน localStorage) — เตือนล่วงหน้าอย่างน้อย 7 วันก่อนเปิดธง
 *
 * ⚠️ ตัวเลขสิทธิ์ต้องดึงจาก `@/lib/entitlement/copy` เสมอ ห้ามพิมพ์เอง
 * (ของเดิมค้างข้อความ "สัปดาห์ละ 3 ครั้ง" ไว้หลังระบบเปลี่ยนเป็นรายวันแล้ว)
 */
const DISMISS_KEY = "tarot_entitlement_announce_dismissed";

export function AnnouncementBanner() {
  const ent = useEntitlement();
  const [dismissed, setDismissed] = useState(true);

  const show = !!ent && ent.announce === true && !ent.enabled;

  useEffect(() => {
    if (!show) return;
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, [show]);

  if (!show || dismissed) return null;

  const when = ent!.announceResetDate?.trim();

  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] p-4 font-serif-th text-xs text-[#2E211A] sm:text-sm">
      <span className="flex-1">
        <span className="text-[#8F5C1A]">✦</span> เร็ว ๆ นี้ การเปิดไพ่จะปรับเป็น{" "}
        <strong>
          ผู้เยี่ยมชมทดลองฟรี {GUEST_LIMIT} ครั้ง · สมาชิกฟรีวันละ {DAILY_LIMIT} ครั้ง
        </strong>
        {when ? ` เริ่ม ${when}` : ""} — สมัครสมาชิกไว้ก่อนได้รับสิทธิ์เต็มทันที
      </span>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(DISMISS_KEY, "1");
          } catch {
            /* จำค่าไม่ได้ก็ยังปิดได้ในรอบนี้ */
          }
          setDismissed(true);
        }}
        aria-label="ปิดประกาศระบบสิทธิ์"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#635B4E] transition-colors hover:bg-[#F3EDE2] hover:text-[#2E211A] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
      >
        ✕
      </button>
    </div>
  );
}
