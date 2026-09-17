"use client";

import React from "react";
import Link from "next/link";
import { useSessionUser } from "@/lib/auth/use-session";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";

export interface UserProfileBadgeProps {
  onOpenAuthModal: () => void;
  /** อุ่นเครื่อง chunk ของหน้าต่างเข้าสู่ระบบตั้งแต่เมาส์/โฟกัสแตะปุ่ม (ยังไม่ต้องกด) */
  onPrefetchAuth?: () => void;
}

/**
 * 👤 ปุ่มบัญชีผู้ใช้บนหัวเว็บ — "ไอคอนกลมใบเดียว" เท่านั้น
 * ---------------------------------------------------------------------------
 * กติกาของปุ่มนี้ (คำสั่งเจ้าของโปรเจกต์ 2026-09-17):
 *
 *  1. **เป็นไอคอนเสมอ ทั้งตอนล็อกอินแล้วและยังไม่ล็อกอิน** — ห้ามเป็นปุ่มยาวมีตัวหนังสือ
 *     ("เข้าสู่ระบบ" แบบเม็ดยาว) เพราะหัวเว็บมีพื้นที่จำกัดและความสูงถูกตรึงไว้ที่
 *     `--site-header-h` (INC-0109) ปุ่มที่กว้างไม่เท่ากันสองสถานะทำให้หัวเว็บขยับตอนเซสชันโหลดเสร็จ
 *  2. **ห้ามมีป้ายแจ้งเตือนตัวเลขคาไว้บนไอคอน** — ป้าย "9+" สีแดงบนหัวเว็บทุกหน้า
 *     เป็นเสียงรบกวนถาวรที่ผู้ใช้ปิดไม่ได้ · จำนวนคำทำนายที่รอติดตามผลไปอยู่บน
 *     การ์ด "บันทึกคำทำนาย" ในหน้า `/account` ซึ่งเป็นที่ที่กดต่อได้จริง
 *  3. ห้ามยิง `fetch` ใด ๆ จากคอมโพเนนต์นี้ — มันอยู่บนหัวเว็บของหน้าดูดวงหลัก
 *     คำขอทุกเส้นที่เพิ่มตรงนี้คือคำขอที่ผู้ใช้ทุกคนต้องจ่ายทุกครั้งที่เปิดหน้า
 *     (ด่าน `test-request-budget` เฝ้าอยู่)
 *
 * แตะแล้วไปหน้า `/account` ตรง ๆ ไม่มีแผงลอยซ้อน — แผงลอยเดิมถูกถอดไปแล้วใน #513
 */
export const UserProfileBadge: React.FC<UserProfileBadgeProps> = ({
  onOpenAuthModal,
  onPrefetchAuth,
}) => {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const { user, loading } = useSessionUser();

  /* ไอคอนคนเดียวกันทั้งสามสถานะ — ขนาดกรอบเท่ากันเป๊ะ หัวเว็บจึงไม่ขยับตอนสลับสถานะ */
  const personIcon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 sm:w-5 sm:h-5 transition-colors"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const frame =
    "w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-line bg-surface flex items-center justify-center flex-shrink-0 select-none";

  if (loading) {
    return (
      <div className={`${frame} text-muted opacity-60 pointer-events-none`}>
        {personIcon}
        <span className="sr-only">{isEn ? "Loading profile…" : "กำลังโหลดข้อมูลบัญชี…"}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onPointerEnter={onPrefetchAuth}
        onFocus={onPrefetchAuth}
        onClick={() => {
          soundManager.playMenuTapSound();
          onOpenAuthModal();
        }}
        className={`tap-overlay ${frame} text-ink hover:text-gold hover:border-gold transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold`}
        aria-label={isEn ? "Sign In" : "เข้าสู่ระบบ"}
        title={isEn ? "Sign In" : "เข้าสู่ระบบ"}
      >
        {personIcon}
      </button>
    );
  }

  return (
    <Link
      href="/account"
      onClick={() => soundManager.playMenuTapSound()}
      className={`tap-overlay ${frame} relative text-ink hover:text-gold hover:border-gold transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold`}
      aria-label={
        user.name
          ? isEn
            ? `Member account (${user.name})`
            : `บัญชีสมาชิก (${user.name})`
          : isEn
            ? "Member account"
            : "บัญชีสมาชิก"
      }
      title={user.name || (isEn ? "Member account" : "บัญชีสมาชิก")}
    >
      {personIcon}
      {/* จุดทองบอกว่า "ล็อกอินอยู่" — ของประดับจุดเดียวที่เหลือ ห้ามใส่ตัวเลขทับ */}
      <span
        aria-hidden="true"
        className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-gold ring-2 ring-surface"
      />
    </Link>
  );
};
