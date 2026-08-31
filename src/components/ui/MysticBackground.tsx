"use client";

import React, { useEffect, useState } from "react";
import { MysticAltarCanvas } from "@/components/ui/MysticAltarCanvas";
import { GalaxyCanvas } from "@/components/ui/GalaxyCanvas";

/**
 * พื้นหลังปรับตามอุปกรณ์:
 *  - เดสก์ท็อป & แท็บเล็ต (จอ ≥ 768px เช่น iPad, Android Tablet, Mac/PC) → <GalaxyCanvas /> เต็มรูปแบบ (ดาวขยับ/เนบิวลา/ดาวตก/วงเวทย์หมุนวน)
 *  - มือถือ (จอ < 768px เช่น สมาร์ตโฟน)                                    → <MysticAltarCanvas /> เบา ประหยัดแบตเตอรี่ ลื่นไหล 60fps
 */
export const MysticBackground: React.FC = () => {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsLargeScreen(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isLargeScreen ? <GalaxyCanvas /> : <MysticAltarCanvas />;
};
