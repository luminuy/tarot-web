import type { Transition } from "motion/react";

/**
 * 🔮 Motion Token System — วิหารทาโรต์ออราเคิล
 * Single source of truth for duration, easing, spring physics, and shared variants
 */

export const DUR = {
  instant: 0.08,
  fast: 0.14,
  base: 0.24,
  slow: 0.42,
  page: 0.28,
  ritual: 0.52,
} as const;

export const EASE = {
  standard: [0.4, 0, 0.2, 1] as const,
  out: [0.22, 1, 0.36, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  emphasis: [0.2, 0, 0, 1] as const,
} as const;

export const SPRING = {
  card: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 } as Transition,
  modal: { type: "spring", stiffness: 300, damping: 30 } as Transition,
  snappy: { type: "spring", stiffness: 420, damping: 32 } as Transition,
  follow: { type: "spring", stiffness: 280, damping: 26 } as Transition,
} as const;

export const STAGGER = {
  tight: 0.03,
  base: 0.05,
  loose: 0.08,
  fanStep: 0.012,
} as const;

/*
 * A7-04: `TWEEN` · `stepVariants` · re-export `useMotionSafe` ถูกลบแล้ว (ไม่มีผู้เรียก)
 * ♿ ตัวตรวจ reduced-motion อยู่ที่ `@/lib/use-motion-safe` เท่านั้น — ห้ามย้ายกลับมาที่นี่
 *    ไฟล์นี้ต้องเหลือแต่ `import type` จาก `motion/react` (runtime import = ลาก 40 KB เข้าเปลือกหน้าแรก)
 */
