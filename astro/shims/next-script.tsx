import { useEffect } from "react";

/**
 * 📜 `next/script` ฉบับ Astro — ฉีด <script> เองหลังหน้าโหลดเสร็จ
 * ===========================================================================
 * เสียบแทนด้วย `vite.resolve.alias` เฉพาะตอนบิลด์ด้วย Astro
 *
 * ใช้ที่เดียวคือ `AnalyticsTracker` ซึ่งโหลด gtag กับ Meta Pixel ด้วย
 * `strategy="lazyOnload"` — พฤติกรรมที่ต้องรักษาไว้คือ **ห้ามแย่งทรัพยากร
 * ช่วงวาดหน้าแรกเด็ดขาด** (บทเรียน #473 · #474: หน้าแรก LCP เคยพุ่งเป็น 9.6 วินาที
 * เพราะของพวกนี้เข้าคิวก่อนสิ่งที่ผู้ใช้ต้องเห็น)
 *
 * ⚠️ ต้องกันฉีดซ้ำด้วย `id`/`src` — island อาจถูก mount ซ้ำได้ใน React Strict Mode
 */
type ScriptStrategy = "beforeInteractive" | "afterInteractive" | "lazyOnload" | "worker";

interface ScriptProps {
  src?: string;
  id?: string;
  strategy?: ScriptStrategy;
  async?: boolean;
  defer?: boolean;
  type?: string;
  children?: string;
  onLoad?: () => void;
  onError?: () => void;
  dangerouslySetInnerHTML?: { __html: string };
}

const MARK_ATTR = "data-astro-next-script";

function inject(props: ScriptProps): void {
  const key = props.id ?? props.src;
  if (key && document.querySelector(`[${MARK_ATTR}="${CSS.escape(key)}"]`)) return;

  const el = document.createElement("script");
  if (key) el.setAttribute(MARK_ATTR, key);
  if (props.id) el.id = props.id;
  if (props.type) el.type = props.type;

  const inlineCode = props.dangerouslySetInnerHTML?.__html ?? props.children;

  if (props.src) {
    el.src = props.src;
    el.async = props.async ?? true;
    if (props.onLoad) el.addEventListener("load", props.onLoad);
    if (props.onError) el.addEventListener("error", props.onError);
  } else if (typeof inlineCode === "string") {
    el.textContent = inlineCode;
  } else {
    return;
  }

  document.head.appendChild(el);
  if (!props.src) props.onLoad?.();
}

export default function Script(props: ScriptProps) {
  const { src, id, strategy = "afterInteractive" } = props;

  useEffect(() => {
    if (strategy === "lazyOnload") {
      const run = () => {
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(() => inject(props));
        } else {
          window.setTimeout(() => inject(props), 1);
        }
      };
      if (document.readyState === "complete") {
        run();
        return;
      }
      window.addEventListener("load", run, { once: true });
      return () => window.removeEventListener("load", run);
    }

    inject(props);
    return;
    /* ผูกกับ "ตัวตน" ของสคริปต์เท่านั้น — props ก้อนอื่นเปลี่ยนไม่ควรฉีดซ้ำ */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, id, strategy]);

  return null;
}
