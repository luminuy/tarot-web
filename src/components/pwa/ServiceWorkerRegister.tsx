"use client";

import { useEffect } from "react";

/**
 * คอมโพเนนต์ลงทะเบียน Service Worker ฝั่งไคลเอนต์ (Progressive Enhancement)
 * -------------------------------------------------------------
 * 1. รันหลัง window.load เสมอเพื่อไม่ให้แย่งทรัพยากรในช่วง Initial Page Load
 * 2. ตรวจจับการรองรับ 'serviceWorker' ใน navigator
 * 3. ตรวจสอบเงื่อนไขความปลอดภัย HTTPS หรือ Localhost
 * 4. ขนาดเบาพิเศษ (<0.2 KB) ไม่เพิ่มภาระให้กับ JavaScript Bundle
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    // ทำงานเฉพาะ HTTPS หรือ Local development
    const isLocalhost = Boolean(
      window.location.hostname === "localhost" ||
        window.location.hostname === "[::1]" ||
        window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    );

    if (window.location.protocol !== "https:" && !isLocalhost) {
      return;
    }

    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          // ฟังการอัปเดต Service Worker ใหม่
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  // มีเวอร์ชันใหม่พร้อมใช้งาน
                  console.info("SeerTarot: New content available; please refresh.");
                } else {
                  // แคชสำเร็จสำหรับการใช้งานออฟไลน์ครั้งแรก
                  console.info("SeerTarot: Content cached for offline use.");
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn("SeerTarot: Service Worker registration failed:", error);
        });
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW, { once: true });
    }
  }, []);

  return null;
}
