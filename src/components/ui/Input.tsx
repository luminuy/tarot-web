"use client";

import React, { forwardRef } from "react";

const base =
  "w-full rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] px-3.5 py-2.5 text-sm text-[#2E211A] " +
  "placeholder:text-[#6F5B4A]/60 transition-colors duration-[var(--dur-fast)] " +
  "focus-visible:outline-none focus-visible:border-[#D9C8AC] focus-visible:ring-2 focus-visible:ring-[#8F5C1A]/30 shadow-xs " +
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
