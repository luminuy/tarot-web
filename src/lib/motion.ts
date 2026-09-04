import type { Transition, Variants } from "motion/react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

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

export const TWEEN = {
  fast: { duration: DUR.fast, ease: EASE.out } as Transition,
  base: { duration: DUR.base, ease: EASE.standard } as Transition,
  page: { duration: DUR.page, ease: EASE.out } as Transition,
  slow: { duration: DUR.slow, ease: EASE.out } as Transition,
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: TWEEN.base,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: TWEEN.fast,
  },
};

export const staggerContainer = (staggerDelta: number = STAGGER.base, delayChildren = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelta,
      delayChildren,
    },
  },
});

export const stepVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: TWEEN.page,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
    transition: TWEEN.fast,
  }),
};

/**
 * true ก็ต่อเมื่อคอมโพเนนต์ mount บนเบราว์เซอร์แล้ว (เรนเดอร์แรกคืน false เสมอ)
 *
 * ใช้กับ `initial` ของ motion component ที่ถูกเรนเดอร์ฝั่งเซิร์ฟเวอร์:
 *   `initial={hasMounted ? { opacity: 0, y: 12 } : false}`
 *
 * ทำไมต้องมี — motion เขียนค่า `initial` ลงเป็น inline style ตั้งแต่ใน HTML ฝั่งเซิร์ฟเวอร์
 * เนื้อหาหลักของหน้าจึงถูกส่งออกไปเป็น `opacity:0` (หน้า /blog เคยส่งการ์ดบทความ
 * ทั้ง 24 ใบออกไปแบบมองไม่เห็น) ซึ่งเสียทั้ง LCP และการอ่านของบอทค้นหา
 * และยังไม่ตรงกับฝั่งเบราว์เซอร์ของผู้ใช้ที่เปิด prefers-reduced-motion จนเกิด
 * hydration mismatch (ISSUE-008)
 *
 * เรนเดอร์แรกจึงต้องออกมาที่สถานะปลายทางเสมอ ส่วนการ mount รอบถัด ๆ ไป
 * (เปลี่ยนแท็บ/ตัวกรอง) ยังได้อนิเมชันครบเหมือนเดิม
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  return hasMounted;
}

/**
 * Helper hook to detect if user has requested reduced motion
 */
export function useMotionSafe(): boolean {
  const shouldReduceMotion = useReducedMotion();
  return !shouldReduceMotion;
}
