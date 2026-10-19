"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { JOURNAL_CRISIS_EVENT } from "@/lib/utils/history";

const CrisisNotice = dynamic(() => import("@/components/safety/CrisisNotice").then((m) => m.CrisisNotice), { ssr: false });

/**
 * 🛟 หน้าต่างสายด่วนของสมุดดวง (กฎเหล็กข้อ 6 · A3-07)
 * ---------------------------------------------------------------------------
 * บันทึกที่ผู้ใช้เขียน (ผลจริง · โน้ตพิธีเช้าเย็น) ถูกส่งขึ้นเซิร์ฟเวอร์แบบไม่รอผล
 * ถ้าเซิร์ฟเวอร์ตรวจพบสัญญาณวิกฤต จะตอบ `crisisMessage` กลับมา และ `history.ts` ประกาศอีเวนต์
 * คอมโพเนนต์นี้ฟังอีเวนต์นั้นแล้วเปิดหน้าต่างสายด่วน (1323 · 1669) ทันที — วางไว้ในทุกหน้าที่ให้เขียนบันทึก
 */
export function JournalCrisisListener() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onCrisis = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      // ข้อความว่างก็ต้องเปิดหน้าต่าง — CrisisNotice มีถ้อยคำสำรองของตัวเอง
      setMessage(typeof detail?.message === "string" ? detail.message : "");
    };
    window.addEventListener(JOURNAL_CRISIS_EVENT, onCrisis);
    return () => window.removeEventListener(JOURNAL_CRISIS_EVENT, onCrisis);
  }, []);

  if (message === null) return null;
  return <CrisisNotice message={message} onClose={() => setMessage(null)} />;
}
