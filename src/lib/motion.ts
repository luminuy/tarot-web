import type { Transition, Variants } from "motion/react";

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

// `useHasMounted` ย้ายไป `@/lib/use-has-mounted` แล้ว (โมดูลนั้นไม่แตะ motion)
// re-export ไว้เพื่อไม่ให้ผู้เรียกเดิมพัง
export { useHasMounted } from "@/lib/use-has-mounted";

/**
 * ♿ ตัวตรวจว่าผู้ใช้ขอลดการเคลื่อนไหวหรือไม่
 *
 * ⚠️ ตัวจริงย้ายไป `@/lib/use-motion-safe` แล้ว และ **ห้ามย้ายกลับมา**
 * ของเดิมเรียก `useReducedMotion()` ของ `motion` ซึ่งเป็น import แบบ runtime
 * ทำให้ไฟล์นี้ (ที่มีแต่ค่าคงที่กับ type) ลากไลบรารี 40 KB เข้าบันเดิลของทุกไฟล์ที่ import มัน
 * รวมถึงเปลือกหน้าแรก · re-export ไว้ตรงนี้เพื่อไม่ให้ผู้เรียกเดิมพัง
 *
 * 📌 ไฟล์นี้ต้องเหลือแต่ `import type` จาก `motion/react` เท่านั้น (type ถูกลบทิ้งตอน build)
 */
export { useMotionSafe } from "@/lib/use-motion-safe";
