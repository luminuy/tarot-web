"use client";

import { useEffect, useState } from "react";

import type { EntitlementView } from "@/lib/entitlement/copy";
import type { ClientEntitlement } from "@/lib/entitlement/use-entitlement";
import { getReadings, type SavedReadingItem } from "@/lib/utils/history";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";

/**
 * 👋 แถบต้อนรับคนที่กลับมา (แผนหน้าแรก ข้อ 2) — เห็นเฉพาะสมาชิกที่ล็อกอินอยู่
 * ===========================================================================
 * รวมสามอย่างที่เดิมกระจายอยู่คนละหน้า: เปิดไพ่ต่อเนื่องกี่วัน · สิทธิ์ที่เหลือวันนี้ · คำทำนายครั้งล่าสุด
 * ทุกค่าอ่านจากของที่หน้านี้มีอยู่แล้ว (สิทธิ์จาก `useEntitlement` · ประวัติจาก localStorage) ไม่ยิงคำขอเพิ่ม
 *
 * ⚠️ CLS 0: ช่องนี้สูงคงที่ (`h-[68px]`) และถูกจองที่ตั้งแต่ HTML แรกด้วยคลาส `has-session` บน <html>
 *    ที่สคริปต์ inline ใน `astro/pages/index.astro` ตั้งจากคุกกี้ใบ้ก่อนวาดเฟรมแรก (ดู `.home-welcome-slot` ใน globals.css)
 *    คนที่ไม่เคยล็อกอิน = ช่องเป็น display:none ตั้งแต่แรก ไม่มีอะไรกระโดด
 * ⚠️ ห้ามแสดงคำถามที่ผู้ใช้พิมพ์ — แถบนี้อยู่บนสุดของหน้า เห็นได้ง่ายเวลาแชร์จอ
 */
export function HomeWelcomeBar({
  isEnglish,
  entitlement,
  view,
  name,
  onOpenHistory,
}: {
  isEnglish: boolean;
  /** ค่าดิบจากเซิร์ฟเวอร์ — `null` = ยังโหลดไม่เสร็จ */
  entitlement: ClientEntitlement | null;
  /** ข้อความสิทธิ์ที่แปลแล้ว (`describeEntitlement`) — `null` ได้ถ้าระบบสิทธิ์ปิดอยู่ */
  view: EntitlementView | null;
  name?: string;
  onOpenHistory: () => void;
}) {
  const [latest, setLatest] = useState<SavedReadingItem | null>(null);

  useEffect(() => {
    try {
      const first = getReadings().find((r) => !r.corrupted);
      setLatest(first ?? null);
    } catch {
      setLatest(null);
    }
  }, []);

  // ยังไม่รู้สิทธิ์ = โครงว่างสูงเท่าของจริง · รู้แล้วว่าไม่ใช่สมาชิก (คุกกี้ใบ้ค้าง) = ไม่แสดงอะไรเลย
  if (!entitlement) {
    return <div aria-hidden="true" className="home-welcome-slot altar-cloth mx-auto max-w-2xl animate-pulse" />;
  }
  if (entitlement.kind === "guest") return null;

  // บัญชีไม่จำกัดสิทธิ์ได้ `dailyStreak: 99` ตายตัวจาก snapshot (ไม่ใช่ยอดจริง) — ห้ามโชว์เป็นวันต่อเนื่อง
  const streak = entitlement.role === "unlimited" ? 0 : (entitlement.dailyStreak ?? 0);
  const firstName = name?.trim().split(/\s+/)[0];
  const headline =
    streak >= 2
      ? isEnglish
        ? `${streak} days in a row — welcome back${firstName ? `, ${firstName}` : ""}`
        : `เปิดไพ่ต่อเนื่อง ${streak} วันแล้ว${firstName ? ` ยินดีต้อนรับกลับ คุณ${firstName}` : ""}`
      : isEnglish
        ? `Welcome back${firstName ? `, ${firstName}` : ""}`
        : `ยินดีต้อนรับกลับ${firstName ? ` คุณ${firstName}` : ""}`;

  const latestLine = latest
    ? `${isEnglish ? "Last reading" : "ครั้งล่าสุด"}: ${latest.spreadName} · ${formatDay(latest.date, isEnglish)}`
    : "";
  const statusLine = view?.statusLine ?? "";

  return (
    <div className="home-welcome-slot altar-card-porcelain mx-auto flex max-w-2xl items-center gap-3 px-4">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-warm bg-inset-warm text-gold-ink"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v6l4 2" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif-th text-sm font-bold text-ink">{headline}</p>
        {/* มือถือแสดงแค่สิทธิ์ที่เหลือ (ยาวสองอย่างรวมกันโดนตัดกลางคำ) · จอใหญ่ต่อด้วยคำทำนายครั้งล่าสุด */}
        <p className="truncate font-serif-th text-xs text-muted">
          {statusLine}
          {latestLine && (
            <span className={statusLine ? "hidden sm:inline" : undefined}>
              {statusLine ? " · " : ""}
              {latestLine}
            </span>
          )}
        </p>
      </div>
      <button
        type="button"
        data-home-target="welcome:journal"
        onClick={onOpenHistory}
        className="glass-chip shrink-0 px-3 py-1.5 font-serif-th text-xs font-semibold text-gold-ink tap-overlay"
      >
        {isEnglish ? "My journal" : "สมุดบันทึก"}
      </button>
    </div>
  );
}

function formatDay(iso: string, isEnglish: boolean): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(isEnglish ? "en-US" : "th-TH", {
    day: "numeric",
    month: "short",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}
