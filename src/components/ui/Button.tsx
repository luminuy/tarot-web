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
      "inline-flex items-center justify-center font-semibold transition-all duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FCF0E6] active:scale-[0.97] touch-manipulation cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
      md: "px-5 py-2.5 text-sm rounded-2xl gap-2",
      lg: "px-7 py-3.5 text-base rounded-2xl gap-2.5",
    }[size];

    const variantStyles = {
      gold: "bg-gradient-to-r from-[#CD9F5B] via-[#E4C09F] to-[#CD9F5B] text-[#5A432F] font-bold shadow-[0_4px_16px_rgba(205,159,91,0.28)] hover:shadow-[0_6px_22px_rgba(205,159,91,0.4)] border border-[#FDF7F0]/60",
      ghost: "bg-transparent text-[#5A432F] hover:bg-[#E4C09F]/25 hover:text-[#CD9F5B] border border-transparent",
      pill: "bg-[#FDF7F0] text-[#5A432F] border border-[#D6B48D] hover:border-[#CD9F5B] hover:bg-[#FCF0E6] rounded-full shadow-sm",
      outline: "bg-transparent text-[#5A432F] border border-[#D6B48D] hover:bg-[#E4C09F]/20 hover:border-[#CD9F5B] hover:text-[#CD9F5B]",
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
