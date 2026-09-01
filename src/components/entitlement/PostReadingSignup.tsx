"use client";

import { useEffect, useState } from "react";

import { useEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * การ์ดชวนสมัครหลังอ่านไพ่จบ (ENTITLEMENT_PLAN PR E)
 * - โผล่ท้ายขั้น 5 หลังสตรีมจบ · ปิดได้ · ไม่ใช่ป๊อปอัปทับ
 * - แสดงเฉพาะผู้เยี่ยมชม (kind === "guest") เมื่อธงเปิด
 * - จำการปิดไว้ใน localStorage 7 วัน (ไม่ตื๊อ)
 */
const DISMISS_KEY = "tarot_signup_card_dismissed_until";

function track(name: string) {
  fetch("/api/stats/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    keepalive: true,
  }).catch(() => {});
}

export function PostReadingSignup({ onOpenAuth }: { onOpenAuth: () => void }) {
  const ent = useEntitlement();
  const [dismissed, setDismissed] = useState(true);

  const show = !!ent && ent.enabled && ent.kind === "guest";

  useEffect(() => {
    if (!show) return;
    let hidden = false;
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
      hidden = until > Date.now();
    } catch {
      /* ignore */
    }
    setDismissed(hidden);
    if (!hidden) track("signup_card_shown");
  }, [show]);

  if (!show || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    } catch {
      /* ignore */
    }
    setDismissed(true);
    track("signup_card_dismissed");
  };

  return (
    <div className="altar-panel mx-auto mt-6 max-w-2xl rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-serif-th text-base font-bold font-mystic-gold">
            ✦ เก็บดวงนี้ไว้ และเปิดไพ่ต่อได้อีก
          </h3>
          <p className="font-serif-th text-sm leading-relaxed text-[#cfc8e2]">
            สมัครสมาชิกฟรี — เปิดไพ่สัปดาห์ละ 3 ครั้ง ถามแม่หมอต่อได้ไม่จำกัด
            และเก็บประวัติดูดวงไว้ดูย้อนหลังทุกเครื่อง
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="ปิด"
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-[#9c93b8] hover:text-[#f5deaa]"
        >
          ✕
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          track("signup_card_clicked");
          onOpenAuth();
        }}
        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] px-6 py-3 font-serif-th text-sm font-bold text-[#05040a] shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all hover:opacity-95 active:scale-[0.98]"
      >
        สมัคร / เข้าสู่ระบบ
      </button>
    </div>
  );
}
