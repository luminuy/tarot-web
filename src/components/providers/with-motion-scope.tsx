"use client";

import React from "react";
import dynamic from "next/dynamic";

/**
 * ✦ `withMotionScope()` — พา `MotionConfig` ไปอยู่ใน chunk ที่โหลดทีหลัง
 * ---------------------------------------------------------------------------
 * **ปัญหาที่ตัวช่วยนี้แก้**
 *
 * เดิม `TarotFlow` ครอบทั้งต้นไม้ด้วย `<AppMotionProvider>` ซึ่ง
 * `import { MotionConfig } from "motion/react"` แบบ static · ผลคือไลบรารี `motion`
 * ทั้งก้อน (40 KB gzip · chunk `6928-*`) ติดอยู่ใน **บันเดิลตั้งต้น** ของ `/` และ `/en`
 * ทั้งที่คอมโพเนนต์ที่ใช้แอนิเมชันจริงทั้ง 15 ตัวอยู่หลัง `next/dynamic` หมดแล้ว
 *
 * **ทางที่ใช้ไม่ได้** — ทำ `AppMotionProvider` ให้เป็น dynamic แล้วครอบเหมือนเดิม
 * เพราะ provider ต้องครอบลูก ตัวที่ยังโหลดไม่เสร็จจึงบังลูกไม่ให้เรนเดอร์
 * ผู้ใช้จะเห็นพิธีกรรมหายไปแวบหนึ่งทุกครั้งที่เปลี่ยนขั้น
 *
 * **ทางที่ถูก** — โหลด `MotionConfig` มา **พร้อมกัน** กับตัวคอมโพเนนต์ในคำสั่ง
 * `dynamic()` เดียวกัน แล้วประกอบร่างให้เสร็จก่อนคืนออกไป · chunk ที่ได้จึงมีทั้งสองอย่าง
 * และ import ฝั่ง static ไม่แตะ `motion/react` เลยสักบรรทัด
 *
 * ⚠️ ค่าที่ส่งให้ `MotionConfig` ต้องตรงกับ `AppMotionProvider` เป๊ะ ๆ
 *    (`reducedMotion="user"` + จังหวะกลาง 0.24s / cubic-bezier(0.4, 0, 0.2, 1))
 *    ถ้าแก้ที่ไหน ต้องแก้ให้ตรงกันทั้งสองที่ ไม่งั้นแอนิเมชันจะจังหวะไม่เท่ากันเงียบ ๆ
 *
 * ⚠️ `reducedMotion="user"` คือสิ่งเดียวที่ทำให้แอนิเมชันฝั่ง JS เคารพ
 *    `prefers-reduced-motion` — กฎ CSS รวมใน `globals.css` หยุด transform ที่ JS
 *    เขียนลง inline style ไม่ได้ · ห้ามถอดออกโดยไม่มีอะไรมาแทน
 */
export function withMotionScope<P extends object>(
  load: () => Promise<React.ComponentType<P>>
): React.ComponentType<P> {
  return dynamic(
    async () => {
      const [Component, { MotionConfig }] = await Promise.all([load(), import("motion/react")]);

      function MotionScoped(props: P) {
        return (
          <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}>
            <Component {...props} />
          </MotionConfig>
        );
      }

      // ช่วยให้ React DevTools ยังบอกได้ว่าอันไหนคืออันไหนหลังห่อ
      MotionScoped.displayName = `MotionScoped(${Component.displayName || Component.name || "Anonymous"})`;

      return MotionScoped;
    },
    { ssr: false }
  ) as React.ComponentType<P>;
}
