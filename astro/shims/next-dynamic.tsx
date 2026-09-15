import { Suspense, lazy, useEffect, useState, type ComponentType, type ReactNode } from "react";

/**
 * 🧩 `next/dynamic` ฉบับ Astro — โหลดคอมโพเนนต์ตอนถึงเวลาจริง ๆ
 * ===========================================================================
 * เสียบแทนด้วย `vite.resolve.alias` เฉพาะตอนบิลด์ด้วย Astro
 *
 * ทำไมต้องมี ทั้งที่ `next/dynamic` ก็ทำงานได้เองนอก Next
 * ---------------------------------------------------------------
 * ได้ก็จริง แต่มันลากรันไทม์ฝั่ง Next ติดเข้ามาในบันเดิลของ island ด้วย
 * ทั้งที่ island ไม่มี Next อยู่ใกล้ ๆ เลยสักบรรทัด — เป็นน้ำหนักที่ไม่มีใครได้ใช้
 *
 * พฤติกรรมที่รักษาไว้เหมือนเดิมทุกข้อ
 * ---------------------------------
 *   • ตัว chunk ถูกโหลด **ตอน mount** ไม่ใช่ตอนบิลด์ (นั่นคือทั้งหมดของเรื่อง —
 *     ของหนักอย่าง `motion` 40 KB จึงไม่ติดไปในบันเดิลตั้งต้นของหน้า)
 *   • `loading` ถูกแสดงระหว่างรอ chunk
 *   • `ssr: false` = ไม่เรนเดอร์ฝั่งเซิร์ฟเวอร์
 *
 * ⚠️ ต่างจาก Next หนึ่งข้อ: กรณี `ssr: true` (ค่าเริ่มต้น) ฝั่งเซิร์ฟเวอร์จะเรนเดอร์
 *    `loading` แทนตัวจริง · ในเว็บนี้มีที่เดียวที่ไม่ได้ตั้ง `ssr: false`
 *    (ภาพไพ่ในผลลัพธ์ของเครื่องคำนวณไพ่ประจำตัว) ซึ่งกว่าจะโผล่ก็ต้องกดคำนวณก่อนอยู่แล้ว
 *    ถ้าวันหนึ่งมีคนใช้ `next/dynamic` กับของที่ต้องอยู่ใน HTML เพื่อ SEO
 *    **ให้เรนเดอร์ตรง ๆ ไปเลย อย่าใช้ dynamic** (ไม่งั้นบอตจะไม่เห็นเนื้อหานั้น)
 */
interface DynamicOptions {
  ssr?: boolean;
  loading?: (props: { error?: Error | null; isLoading?: boolean; pastDelay?: boolean }) => ReactNode;
}

type Loader<P> = () => Promise<ComponentType<P> | { default: ComponentType<P> }>;

export default function dynamic<P extends object>(
  loader: Loader<P>,
  options: DynamicOptions = {},
): ComponentType<P> {
  const LazyComponent = lazy(async () => {
    const loaded = await loader();
    const component = (loaded as { default?: ComponentType<P> }).default ?? (loaded as ComponentType<P>);
    return { default: component };
  });

  const fallback = () => (options.loading ? <>{options.loading({})}</> : null);

  function DynamicComponent(props: P) {
    /* ฝั่งเซิร์ฟเวอร์และเฟรมแรกของการ hydrate ต้องได้ผลเหมือนกันเป๊ะ ไม่งั้น hydration พัง */
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return fallback();

    return (
      <Suspense fallback={fallback()}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <LazyComponent {...(props as P & { key?: never })} />
      </Suspense>
    );
  }

  DynamicComponent.displayName = "AstroDynamic";
  return DynamicComponent;
}
