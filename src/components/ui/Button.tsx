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
      "inline-flex items-center justify-center font-semibold transition-all duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F1E9] active:scale-[0.97] touch-manipulation cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
      md: "px-5 py-2.5 text-sm rounded-md gap-2",
      lg: "px-7 py-3.5 text-base rounded-md gap-2.5",
    }[size];

    const variantStyles = {
      gold: "bg-[#8F5C1A] hover:bg-[#74490F] text-white font-bold",
      outline: "bg-white text-[#2E211A] border border-[#E4D8C4] hover:border-[#8F5C1A]",
      ghost: "bg-transparent text-[#6F5B4A] hover:bg-[rgba(143,92,26,0.08)] hover:text-[#2E211A]",
      pill: "bg-[#F0E8DB] text-[#2E211A] border border-[#E4D8C4] rounded-full hover:border-[#8F5C1A]",
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
