"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * 🛡️ กล่อง Cloudflare Turnstile สำหรับฟอร์มเข้าสู่ระบบ / สมัคร / ลืมรหัสผ่าน
 *
 * site key ดึงตอน runtime จาก `/api/config/turnstile` (ไม่ใช้ `NEXT_PUBLIC_*`
 * เพราะ pipeline deploy ของโปรเจกต์ไม่ส่ง env ตอน build — ดู route นั้น)
 *
 * onToken:
 *   - `null` = ด่านปิด (ยังไม่ตั้งค่า หรือ config โหลดไม่ได้) → ฟอร์มส่งได้เลย
 *   - `""`   = ด่านเปิด แต่ยังไม่ผ่าน → ฟอร์มต้อง disable ปุ่มส่ง
 *   - token  = ผ่านแล้ว
 *
 * สคริปต์โหลดจาก challenges.cloudflare.com ซึ่ง CSP ใน next.config.ts อนุญาตไว้แล้ว
 */

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact";
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("turnstile script failed")));
      if (window.turnstile) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// แคชผล config ทั้งแท็บ — ขอครั้งเดียวพอ
let siteKeyPromise: Promise<string | null> | null = null;
function fetchSiteKey(): Promise<string | null> {
  if (siteKeyPromise) return siteKeyPromise;
  siteKeyPromise = fetch("/api/config/turnstile", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { siteKey?: string | null } | null) => d?.siteKey ?? null)
    .catch(() => null);
  return siteKeyPromise;
}

interface TurnstileWidgetProps {
  /** ดูความหมายของ null / "" / token ในหัวไฟล์ */
  onToken: (token: string | null) => void;
  /** รีเซ็ต widget เมื่อค่านี้เปลี่ยน (เช่นสลับ signin/signup) */
  resetKey?: string | number;
}

export function TurnstileWidget({ onToken, resetKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const reactId = useId();
  const [siteKey, setSiteKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchSiteKey().then((key) => {
      if (cancelled) return;
      if (!key) {
        // ด่านปิด → ฟอร์มไม่ถูกบล็อก
        onTokenRef.current(null);
        return;
      }
      setSiteKey(key);
      onTokenRef.current(""); // ด่านเปิด รอผู้ใช้ผ่าน widget

      loadTurnstileScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return;
          if (widgetIdRef.current) {
            try {
              window.turnstile.remove(widgetIdRef.current);
            } catch {
              /* noop */
            }
            widgetIdRef.current = null;
          }
          containerRef.current.innerHTML = "";
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: key,
            size: "flexible",
            theme: "auto",
            callback: (token: string) => onTokenRef.current(token),
            "expired-callback": () => onTokenRef.current(""),
            "error-callback": () => onTokenRef.current(""),
          });
        })
        .catch(() => {
          // สคริปต์โหลดไม่ได้ → อย่าล็อกผู้ใช้ (ด่าน server fail-safe จะรับต่อ)
          if (!cancelled) onTokenRef.current(null);
        });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* noop */
        }
        widgetIdRef.current = null;
      }
    };
  }, [reactId, resetKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="min-h-[65px]" aria-label="ตรวจสอบว่าคุณไม่ใช่บอต" />;
}
