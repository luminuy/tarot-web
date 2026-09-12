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
      "inline-flex items-center justify-center font-semibold transition duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] active:scale-[0.97] touch-manipulation cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded gap-1.5",
      md: "px-5 py-2.5 text-sm rounded gap-2",
      lg: "px-7 py-3.5 text-base rounded gap-2.5",
    }[size];

    const variantStyles = {
      gold: "bg-gold-ink hover:bg-gold-ink-deep text-white font-bold",
      outline: "bg-white text-ink-deep border border-line-warm hover:border-gold-ink",
      ghost: "bg-transparent text-muted hover:bg-[rgba(143,92,26,0.08)] hover:text-ink-deep",
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
