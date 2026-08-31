"use client";

import React from "react";
import { MotionConfig } from "motion/react";

/**
 * FDN-1: Global Motion Config Provider
 * Enforces reduced-motion="user" and consistent base transition curve across the app
 */
export function AppMotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </MotionConfig>
  );
}
