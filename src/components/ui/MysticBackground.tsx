"use client";

import React, { useEffect, useState } from "react";
import { MysticAltarCanvas } from "@/components/ui/MysticAltarCanvas";
import { GalaxyCanvas } from "@/components/ui/GalaxyCanvas";

/**
 * พื้นหลังปรับตามอุปกรณ์:
 *  - เดสก์ท็อป (จอ ≥ 1024px + มีเมาส์)  → <GalaxyCanvas />  เต็มรูปแบบ (ดาว/เนบิวลา/ดาวตก/พารัลแลกซ์)
 *  - มือถือ / แท็บเล็ต / จอเล็ก           → <MysticAltarCanvas />  เบา (อนุภาคทอง 12–30)
 *
 * เริ่มด้วย MysticAltarCanvas เสมอ (SSR-safe + ปลอดภัยสำหรับ 85% ที่เป็นมือถือ)
 * แล้ว upgrade เป็น GalaxyCanvas บน client ถ้าเข้าเงื่อนไขเดสก์ท็อป
 */
export const MysticBackground: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop ? <GalaxyCanvas /> : <MysticAltarCanvas />;
};
