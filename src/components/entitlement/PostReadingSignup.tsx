"use client";

import { useEffect, useState } from "react";

import { CheckMarkIcon, SparkSealIcon } from "@/components/entitlement/EntitlementIcons";
import { DAILY_LIMIT, MEMBER_BENEFITS, describeEntitlement } from "@/lib/entitlement/copy";
import { trackEntitlementEvent } from "@/lib/entitlement/track";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * การ์ดชวนสมัครหลังอ่านไพ่จบ (ENTITLEMENT_PLAN PR E)
 * ------------------------------------------------------------------
 * จังหวะนี้คือจุดที่ผู้ใช้ประทับใจที่สุด — เพิ่งอ่านคำทำนายของตัวเองจบ
 * จึงเป็นที่ที่ควรบอกตรง ๆ ว่าใช้สิทธิ์ทดลองไปแล้ว และสมัครแล้วได้อะไรต่อ
 *
 * กติกา: ไม่ป๊อปอัปทับหน้าจอ · ปิดได้ · จำการปิดไว้ 7 วัน (ไม่ตื๊อ)
 */
const DISMISS_KEY = "tarot_signup_card_dismissed_until";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export function PostReadingSignup({ onOpenAuth }: { onOpenAuth: () => void }) {
  const ent = useEntitlement();
  const view = describeEntitlement(ent);
  const [dismissed, setDismissed] = useState(true);

  const show = !!view && view.isGuest;

  useEffect(() => {
    if (!show) return;
    let hidden = false;
    try {
      hidden = Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now();
    } catch {
      /* โหมดส่วนตัวบางเบราว์เซอร์อ่านไม่ได้ — ถือว่ายังไม่เคยปิด */
    }
    setDismissed(hidden);
    if (!hidden) trackEntitlementEvent("signup_card_shown");
  }, [show]);

  if (!show || dismissed || !view) return null;

  const usedUpTrial = view.remaining === 0;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    } catch {
      /* ปิดได้เสมอแม้จำค่าไม่ได้ */
    }
    setDismissed(true);
    trackEntitlementEvent("signup_card_dismissed");
  };

  return (
    <section
      className={`mx-auto mt-6 max-w-2xl overflow-hidden rounded-lg p-5 sm:p-6 bg-[#FFFFFF] border ${
        usedUpTrial ? "border-2 border-[#E4D8C4]" : "border border-[#E4D8C4]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E4D8C4] bg-[#F0E8DB] text-[#8F5C1A] sm:flex">
            <SparkSealIcon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <h3 className="font-serif-th text-base font-bold text-[#2E211A]">
              {usedUpTrial ? "นี่คือการเปิดไพ่ทดลองฟรีของคุณ" : "เก็บดวงนี้ไว้ และเปิดไพ่ต่อได้อีก"}
            </h3>
            <p className="font-serif-th text-sm leading-relaxed text-[#6F5B4A]">
              {usedUpTrial
                ? `สมัครสมาชิกฟรีเพื่อเปิดไพ่ต่อวันละ ${DAILY_LIMIT} ครั้ง คุยถามแม่หมอต่อจากไพ่ชุดนี้ และเก็บคำทำนายไว้ดูย้อนหลังได้ทุกเครื่อง`
                : `สมัครสมาชิกฟรี — เปิดไพ่วันละ ${DAILY_LIMIT} ครั้ง คุยถามแม่หมอต่อได้ และเก็บประวัติดูดวงไว้ทุกเครื่อง`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="ปิดคำชวนสมัครสมาชิก"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm text-[#6F5B4A] transition-colors hover:bg-[#F0E8DB] hover:text-[#2E211A] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
        >
          ✕
        </button>
      </div>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {MEMBER_BENEFITS.map((b) => (
          <li key={b.title} className="flex items-start gap-2 font-serif-th text-[11px] text-[#2E211A]">
            <CheckMarkIcon className="mt-0.5 h-3 w-3 shrink-0 text-[#8F5C1A]" />
            {b.title}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => {
          trackEntitlementEvent("signup_card_clicked");
          onOpenAuth();
        }}
        className="mt-4 w-full rounded-full bg-[#8F5C1A] hover:bg-[#74490F] px-6 py-3.5 font-serif-th text-sm font-bold text-[#FFFFFF] transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
      >
        <span className="mr-1.5">✦</span> สมัครสมาชิกฟรี (ใช้เวลาไม่ถึงนาที)
      </button>

      <p className="mt-2.5 text-center font-serif-th text-[11px] text-[#6F5B4A]">
        ไม่ต้องผูกบัตร · คำทำนายที่เพิ่งอ่านจะถูกย้ายเข้าบัญชีให้อัตโนมัติ
      </p>
    </section>
  );
}
