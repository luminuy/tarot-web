"use client";

import { useEffect, useId, useRef } from "react";

/**
 * 🛡️ กล่อง Cloudflare Turnstile สำหรับฟอร์มเข้าสู่ระบบ / สมัคร / ลืมรหัสผ่าน
 *
 * ไม่ได้ตั้ง `NEXT_PUBLIC_TURNSTILE_SITE_KEY` → คอมโพเนนต์นี้ไม่เรนเดอร์อะไร
 * และเรียก `onVerify("")` ทันที เพื่อให้ฟอร์มไม่ถูกบล็อก (ด่านฝั่ง server ก็ปล่อยผ่านเช่นกัน)
 *
 * สคริปต์โหลดจาก challenges.cloudflare.com ซึ่ง CSP ใน next.config.ts อนุญาตไว้แล้ว
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
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

interface TurnstileWidgetProps {
  /** ได้ token เมื่อผ่าน · ได้ "" เมื่อยังไม่ผ่าน/หมดอายุ/ยังไม่เปิดใช้ */
  onVerify: (token: string) => void;
  /** รีเซ็ต widget เมื่อค่านี้เปลี่ยน (เช่นสลับ signin/signup) */
  resetKey?: string | number;
}

export function TurnstileWidget({ onVerify, resetKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;
  const reactId = useId();

  useEffect(() => {
    // ยังไม่ตั้ง site key → ด่านปิดอยู่ ปล่อยฟอร์มผ่าน
    if (!SITE_KEY) {
      onVerifyRef.current("");
      return;
    }

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        // เคลียร์ของเดิมก่อน render ใหม่ (StrictMode mount ซ้ำ / เปลี่ยน resetKey)
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
          sitekey: SITE_KEY,
          size: "flexible",
          theme: "auto",
          callback: (token: string) => onVerifyRef.current(token),
          "expired-callback": () => onVerifyRef.current(""),
          "error-callback": () => onVerifyRef.current(""),
        });
      })
      .catch(() => {
        // สคริปต์โหลดไม่ได้ → อย่าล็อกผู้ใช้ ให้ฟอร์มส่งได้ (ด่าน server fail-safe จะรับต่อ)
        if (!cancelled) onVerifyRef.current("");
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
    // reactId คงที่ต่อ instance · resetKey เปลี่ยน = สร้าง widget ใหม่
  }, [reactId, resetKey]);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className="min-h-[65px]" aria-label="ตรวจสอบว่าคุณไม่ใช่บอต" />;
}

/** true เมื่อเปิดใช้ Turnstile ฝั่ง client (ต้องกรอกก่อนส่งฟอร์ม) */
export const turnstileEnabledClient = Boolean(SITE_KEY);
