"use client";

import { useEffect, useState } from "react";

import type { DailyCard } from "@/lib/tarot/daily-card";
import { bangkokDayKey } from "@/lib/time/bangkok";
import { STORAGE_KEYS } from "@/lib/storage/keys";

const DAILY_CARD_STORAGE_KEY = STORAGE_KEYS.dailyCard;
/** คีย์รุ่นเก่าสำหรับย้ายข้อมูลผู้ใช้ที่เคยแคชไว้เดิมอย่างราบรื่น */
const LEGACY_DAILY_CARD_STORAGE_KEY = STORAGE_KEYS.legacyDailyCard;

/**
 * 🌅 ไพ่ประจำวันของทั้งเว็บ (ใบเดียวกันทุกคน) — ดึงจาก `/api/daily-card` (คำนวณจากวันที่ + แคช KV ที่ขอบ)
 * ย้ายมาจาก `DailyCardStrip` เดิม (UI 2.0 ใช้แค่ชื่อไพ่ในปุ่มรองของหัวหน้า) — ตรรกะเดิมทุกบรรทัด:
 *   1. อ่านแคชในเครื่องก่อน (0ms) ถ้าเป็นของ "วันนี้" ตามเวลาไทยและมี proof
 *   2. ไม่งั้นยิงเซิร์ฟเวอร์ทันที · ข้อมูลต้องเป็นของวันนี้จริง (A2-06) ไม่ตรงยิงใหม่แบบข้ามแคช
 *   3. จำลงเครื่องตาม dateKey ของข้อมูลเท่านั้น
 * คืน `null` ระหว่างโหลดหรือเมื่อโหลดไม่ได้ — ผู้เรียกต้องแสดงแบบไม่มีชื่อไพ่ได้เสมอ (ห้ามเดาไพ่ · กฎเหล็ก 14)
 */
export function useDailyCard(): DailyCard | null {
  const [daily, setDaily] = useState<DailyCard | null>(null);

  useEffect(() => {
    let alive = true;
    const today = bangkokDayKey();

    try {
      const cachedRaw =
        localStorage.getItem(DAILY_CARD_STORAGE_KEY) || localStorage.getItem(LEGACY_DAILY_CARD_STORAGE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { dateKey?: string; card?: DailyCard };
        if (cached?.dateKey === today && cached.card?.proof) {
          setDaily(cached.card);
          return;
        }
      }
    } catch {
      // localStorage ไม่พร้อมหรือโดนบล็อก (เช่น private mode)
    }

    const load = (bypass: boolean): Promise<DailyCard> =>
      fetch(bypass ? `/api/daily-card?d=${today}` : "/api/daily-card", {
        // ไม่แนบคุกกี้ — เส้นนี้เหมือนกันทุกคน และแคชที่ขอบเก็บเฉพาะคำขอที่ไม่มีคุกกี้ (withEdgeCache · A9-02)
        credentials: "omit",
        ...(bypass ? { cache: "no-store" as const } : {}),
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));

    load(false)
      .then((d) => (d.dateKey === today ? d : load(true)))
      .then((d: DailyCard) => {
        if (!alive) return;
        setDaily(d);
        if (d.dateKey !== today) return; // เครื่องกับเซิร์ฟเวอร์เห็นคนละวัน — แสดงได้ แต่ไม่จำ
        try {
          localStorage.setItem(DAILY_CARD_STORAGE_KEY, JSON.stringify({ dateKey: d.dateKey, card: d }));
          localStorage.removeItem(LEGACY_DAILY_CARD_STORAGE_KEY);
        } catch {
          // ignore quota exceeded
        }
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  return daily;
}
