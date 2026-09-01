"use client";

import { useEffect, useState } from "react";

import { useEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * แบนเนอร์ประกาศล่วงหน้า: "ระบบสิทธิ์เปิดไพ่กำลังจะมา" (ENTITLEMENT_PLAN PR F / ข้อ 10)
 * แสดงเมื่อ admin เปิด flag `entitlement.announce` และยังไม่เปิดระบบจริง
 * ปิดได้ (จำใน localStorage) — เตือนล่วงหน้าอย่างน้อย 7 วันก่อนเปิดธง
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
    <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-[#e5c07b]/40 bg-[#100b20]/90 p-4 text-xs sm:text-sm text-[#f5deaa] shadow-xl backdrop-blur font-serif-th">
      <span className="flex-1">
        <span className="text-[#e5c07b]">✦</span> เร็ว ๆ นี้ การเปิดไพ่จะปรับเป็น{" "}
        <strong>ผู้เยี่ยมชม 1 ครั้ง · สมาชิกฟรีสัปดาห์ละ 3 ครั้ง</strong>
        {when ? ` เริ่ม ${when}` : ""} — สมัครสมาชิกไว้ก่อนได้รับสิทธิ์เต็มทันที
      </span>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(DISMISS_KEY, "1");
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
        aria-label="ปิด"
        className="shrink-0 px-2 py-1 text-[#9c93b8] hover:text-[#f5deaa]"
      >
        ✕
      </button>
    </div>
  );
}
