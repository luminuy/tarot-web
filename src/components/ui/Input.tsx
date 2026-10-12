"use client";

import React, { forwardRef } from "react";

/*
 * ⚠️ ทุกท่อนต้องลงท้ายด้วยช่องว่าง — เดิมท่อนแรกจบที่ `text-ink-deep` ไม่มีช่องว่าง ต่อกับท่อนถัดไปเป็นคลาสเดียว
 *    `text-ink-deepplaceholder:text-muted` ซึ่งไม่มีอยู่จริง ทุกช่องกรอกทั้งเว็บจึงไม่ได้ทั้งสีตัวอักษรและสี placeholder (ISSUE-057)
 *    ด่าน test-code-debt จับสตริงคลาสที่ต่อกันโดยไม่มีช่องว่างใน src/components/ui แล้ว
 */
const base =
  "altar-card-porcelain !rounded-lg w-full px-3.5 py-2.5 text-sm text-ink-deep " +
  "placeholder:text-muted transition-colors duration-[var(--dur-fast)] " +
  "focus-visible:outline-none focus-visible:border-line-warm focus-visible:ring-2 focus-visible:ring-gold-ink/30 shadow-xs " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => <input ref={ref} className={`${base} ${className}`} {...props} />
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", rows = 4, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={`${base} resize-y leading-relaxed ${className}`} {...props} />
  )
);
Textarea.displayName = "Textarea";
