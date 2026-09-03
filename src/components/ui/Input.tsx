"use client";

import React, { forwardRef } from "react";

const base =
  "w-full rounded-xl bg-[#FFFFFF] border border-[#D6B48D] px-3.5 py-2.5 text-sm text-[#5A432F] " +
  "placeholder:text-[#8C735D]/60 transition-colors duration-[var(--dur-fast)] " +
  "focus-visible:outline-none focus-visible:border-[#CD9F5B] focus-visible:ring-2 focus-visible:ring-[#CD9F5B]/30 shadow-xs " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`${base} ${className}`} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", rows = 4, ...props }, ref) => (
  <textarea ref={ref} rows={rows} className={`${base} resize-y leading-relaxed ${className}`} {...props} />
));
Textarea.displayName = "Textarea";
