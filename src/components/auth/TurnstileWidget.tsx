"use client";

import { useEffect, useId, useRef, useState } from "react";
import { fetchTurnstileSiteKey, loadTurnstileScript } from "@/lib/auth/turnstile";

/**
 * 🛡️ กล่อง Cloudflare Turnstile สำหรับฟอร์มเข้าสู่ระบบ / สมัคร / ลืมรหัสผ่าน
 *
 * onToken:
 *   - `null` = ด่านปิด (ยังไม่ตั้งค่า หรือ config โหลดไม่ได้) → ฟอร์มส่งได้เลย
 *   - `""`   = ด่านเปิด แต่ยังไม่ผ่าน → ฟอร์มต้อง disable ปุ่มส่ง
 *   - token  = ผ่านแล้ว
 *
 * ⚠️ **ห้ามคืน `null` ระหว่างที่ยังไม่รู้ว่าด่านเปิดหรือปิด** (บทเรียนรอบ "หน้าต่างเข้าสู่ระบบไม่สมูท")
 * ของเดิมคืน `null` จนกว่า `/api/config/turnstile` จะตอบ แล้วค่อยแทรกกล่องสูง ~65px เข้าไป
 * หน้าต่างจัดกึ่งกลางแนวตั้ง ➔ ความสูงที่เพิ่มมาดันเนื้อหาเด้ง**ทั้งขึ้นและลง**อย่างละครึ่ง
 * ทุกปุ่มในฟอร์มจึงขยับหลังหน้าต่างเปิดไปแล้ว (กดพลาดได้ด้วย) · ตอนนี้จองที่ไว้ตั้งแต่แรก
 * แล้วยุบทิ้งเฉพาะเมื่อ**รู้แน่**ว่าด่านปิด
 */

interface TurnstileWidgetProps {
  /** ดูความหมายของ null / "" / token ในหัวไฟล์ */
  onToken: (token: string | null) => void;
  /** รีเซ็ต widget เมื่อค่านี้เปลี่ยน (เช่นสลับ signin/signup) */
  resetKey?: string | number;
  /** โหมดภาษาอังกฤษ — ป้ายกำกับต้องเปลี่ยนตาม ไม่งั้นด่าน test-en-thai-leak ตก (กล่องนี้มีที่จองไว้เสมอ จึงถูกเรนเดอร์จริงทุกภาษา) */
  isEn?: boolean;
}

export function TurnstileWidget({ onToken, resetKey, isEn = false }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const reactId = useId();
  // "unknown" = ยังไม่รู้ว่าด่านเปิดหรือปิด (จองที่ไว้ก่อน) · "off" = ด่านปิด (ยุบทิ้งได้)
  const [status, setStatus] = useState<"unknown" | "on" | "off">("unknown");

  useEffect(() => {
    let cancelled = false;

    fetchTurnstileSiteKey().then((key) => {
      if (cancelled) return;
      if (!key) {
        // ด่านปิด → ฟอร์มไม่ถูกบล็อก และคืนพื้นที่ที่จองไว้
        setStatus("off");
        onTokenRef.current(null);
        return;
      }
      setStatus("on");
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

  if (status === "off") return null;

  return (
    <div
      ref={containerRef}
      className="min-h-[65px]"
      aria-label={isEn ? "Verify that you are not a bot" : "ตรวจสอบว่าคุณไม่ใช่บอต"}
    />
  );
}
