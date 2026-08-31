"use client";

import React, { forwardRef } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "ghost" | "pill" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className = "", variant = "gold", size = "md", isLoading, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05040a] active:scale-[0.97] touch-manipulation cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
      md: "px-5 py-2.5 text-sm rounded-2xl gap-2",
      lg: "px-7 py-3.5 text-base rounded-2xl gap-2.5",
    }[size];

    const variantStyles = {
      gold: "bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] text-[#05040a] font-bold shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] border border-[#fff0d4]/30",
      ghost: "bg-transparent text-[#e2d9f3] hover:bg-[#191230]/60 hover:text-[#ffd700] border border-transparent",
      pill: "bg-[#100b20]/80 text-[#e2d9f3] border border-[#e5c07b]/30 hover:border-[#ffd700]/70 hover:bg-[#191230] rounded-full",
      outline: "bg-transparent text-[#e5c07b] border border-[#e5c07b]/50 hover:bg-[#e5c07b]/10 hover:border-[#ffd700]",
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
            <span>กำลังดำเนินการ…</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
