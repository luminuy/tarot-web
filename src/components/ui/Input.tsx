"use client";

import React, { forwardRef } from "react";

const base =
  "w-full rounded-xl bg-[#0c0818]/80 border border-[#e5c07b]/25 px-3.5 py-2.5 text-sm text-[#f5deaa] " +
  "placeholder:text-[#9c93b8]/60 transition-colors duration-[var(--dur-fast)] " +
  "focus-visible:outline-none focus-visible:border-[#ffd700]/70 focus-visible:ring-2 focus-visible:ring-[#ffd700]/25 " +
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
