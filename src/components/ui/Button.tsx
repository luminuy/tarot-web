"use client";

import React, { forwardRef } from "react";
import { useLocale } from "@/lib/i18n";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "ghost" | "pill" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className = "", variant = "gold", size = "md", isLoading, disabled, ...props }, ref) => {
    /* ⚠️ ข้อความ loading เคยฮาร์ดโค้ดภาษาไทย — ปุ่มนี้ถูกใช้ในเส้นทาง /en ด้วย (UX-17) */
    const { isEnglish } = useLocale();
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface-warm active:scale-[0.97] touch-manipulation cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

    /*
     * 📏 ทุกขนาดต้องผ่านพื้นที่กดขั้นต่ำตั้งแต่ต้นทาง (UX-07 · UX-15)
     * ของเดิม `sm` สูงราว 33px เท่านั้น — ต่ำกว่าเกณฑ์ตั้งแต่ในคอมโพเนนต์กลาง
     * แปลว่าทุกที่ที่เรียกใช้ `size="sm"` ได้ปุ่มที่กดยากไปด้วยโดยไม่รู้ตัว
     *
     * ⚠️ ใช้ `min-h-11` (44px) ไม่ใช่ `h-11` — ปุ่มที่มีข้อความสองบรรทัด
     * ต้องสูงขึ้นได้เอง ไม่ใช่ถูกบีบจนตัวอักษรล้นออกนอกกรอบ
     */
    const sizeStyles = {
      sm: "min-h-11 px-3 py-1.5 text-xs rounded gap-1.5",
      md: "min-h-11 px-5 py-2.5 text-sm rounded gap-2",
      lg: "min-h-12 px-7 py-3.5 text-base rounded gap-2.5",
    }[size];

    const variantStyles = {
      gold: "bg-gold-ink hover:bg-gold-ink-deep text-surface font-bold",
      outline: "bg-surface text-ink-deep border border-line-warm hover:border-gold-ink",
      ghost: "bg-transparent text-muted hover:bg-gold-ink/8 hover:text-ink-deep",
      pill: "bg-inset-warm text-ink-deep border border-line-warm rounded-full hover:border-gold-ink",
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{isEnglish ? "Working…" : "กำลังดำเนินการ…"}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
