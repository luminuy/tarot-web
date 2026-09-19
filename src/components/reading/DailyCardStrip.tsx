"use client";

import { useEffect, useState } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";

import { CardImage } from "@/components/card/CardImage";
import { useLocale } from "@/lib/i18n";
import type { DailyCard } from "@/lib/tarot/daily-card";
import { bangkokDayKey } from "@/lib/time/bangkok";
import { STORAGE_KEYS } from "@/lib/storage/keys";

const DAILY_CARD_STORAGE_KEY = STORAGE_KEYS.dailyCard;
/** คีย์รุ่นเก่าสำหรับย้ายข้อมูลผู้ใช้ที่เคยแคชไว้เดิมอย่างราบรื่น */
const LEGACY_DAILY_CARD_STORAGE_KEY = "seer:daily-card";

/**
 * แถบ "ไพ่ประจำวันนี้" บนขั้นเลือกผัง — ไพ่ใบเดียวเหมือนกันทุกคนทั้งเว็บ
 * ดึงจาก /api/daily-card (deterministic จากวันที่ + แคช KV ที่ edge)
 *
 * ต่างจากการเปิดไพ่ส่วนตัว — อันนี้แค่ "พลังงานประจำวัน" ให้แตะดูเฉย ๆ ไม่กินโควตา
 * กันที่ว่างไว้ระหว่างโหลด ไม่ให้แถบแทรกเข้ามาแล้วดันทั้งหน้า
 */
export function DailyCardStrip() {
  const { isEnglish } = useLocale();
  const [daily, setDaily] = useState<DailyCard | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const today = bangkokDayKey();

    // 1. อ่านจากแคชในเครื่องทันทีก่อน (0ms — เร่ง LCP เหลือศูนย์สำหรับ repeat view)
    try {
      const cachedRaw =
        localStorage.getItem(DAILY_CARD_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_DAILY_CARD_STORAGE_KEY);
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

    // 2. ดึงจากเซิร์ฟเวอร์ทันที (ไม่หน่วง requestIdleCallback 2 วินาทีซึ่งทำลาย LCP)
    fetch("/api/daily-card", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: DailyCard) => {
        if (!alive) return;
        setDaily(d);
        try {
          localStorage.setItem(DAILY_CARD_STORAGE_KEY, JSON.stringify({ dateKey: today, card: d }));
          localStorage.removeItem(LEGACY_DAILY_CARD_STORAGE_KEY);
        } catch {
          // ignore quota exceeded
        }
      })
      .catch(() => {
        if (alive) setFailed(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (failed) return null;

  if (!daily) {
    return (
      <div
        aria-hidden="true"
        className="mx-auto mb-6 flex h-[96px] max-w-2xl items-center gap-4 rounded-lg border border-line-warm/40 bg-white/60 px-4 py-2.5 animate-pulse"
      >
        <div className="h-14 w-9 shrink-0 rounded border border-line-warm/30 bg-inset-warm/50" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-line-warm/30" />
          <div className="h-4 w-40 rounded bg-line-warm/40" />
          <div className="flex gap-1.5 overflow-hidden">
            <div className="h-5 w-14 rounded-full bg-line-warm/30 shrink-0" />
            <div className="h-5 w-16 rounded-full bg-line-warm/30 shrink-0" />
            <div className="hidden sm:block h-5 w-14 rounded-full bg-line-warm/30 shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  const displayKeywords: string[] = isEnglish
    ? (daily.keywordsEn && daily.keywordsEn.length > 0
        ? daily.keywordsEn
        : daily.keywords)
    : daily.keywords;

  return (
    <Link
      href={`/cards/${daily.cardId}`}
      /* ⚠️ `prefetch={false}` ห้ามถอด — แถบนี้อยู่เหนือพับของหน้าแรกตั้งแต่เฟรมแรก
         ค่าเริ่มต้นของ Next คือพรีเฟตช์ลิงก์ที่มองเห็น ทำให้ทุกคนที่เปิดหน้าแรกดึงหน้าไพ่
         ของ "ไพ่ประจำวัน" มา 15 KB ทิ้งไว้เฉย ๆ ทั้งที่ส่วนใหญ่ไม่ได้กด
         (วัดจาก Lighthouse network log 2026-09-14) */
      prefetch={false}
      className="group mx-auto mb-6 flex h-[96px] max-w-2xl items-center gap-4 rounded-lg border border-line-warm bg-white px-4 py-2.5 shadow-raised transition-colors hover:border-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
      title={isEnglish ? `Daily Card ${daily.dateKey} · SHA-256 ${daily.proof.slice(0, 16)}…` : `ไพ่ประจำวัน ${daily.dateKey} · SHA-256 ${daily.proof.slice(0, 16)}…`}
    >
      <div className="relative h-14 w-9 shrink-0 overflow-hidden rounded border border-line-warm bg-inset-warm shadow-xs">
        <CardImage
          image={daily.image}
          /* ภาพประกอบล้วน — ตัวหนังสือในลิงก์เดียวกันบอก "ไพ่ประจำวันนี้" และชื่อไพ่อยู่แล้ว (INC-0125) */
          alt=""
          className="h-full w-full object-cover"
          sizes="36px"
          loading="eager"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-serif-th text-xs font-bold text-gold-ink">
          {isEnglish ? "Card of the Day" : "ไพ่ประจำวันนี้"}
        </p>
        <p className="font-serif-th text-sm font-bold text-ink-deep truncate">
          {isEnglish ? (
            daily.nameEn
          ) : (
            <>
              {daily.nameTh}{" "}
              <span className="font-normal text-muted">· {daily.nameEn}</span>
            </>
          )}
        </p>
        <div className="flex flex-nowrap items-center gap-1.5 overflow-hidden">
          {displayKeywords.map((kw) => (
            <span
              key={kw}
              className="shrink-0 rounded-full border border-line-warm bg-inset-warm px-2 py-0.5 font-serif-th text-xs text-muted"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      <span className="hidden shrink-0 font-serif-th text-[13px] font-semibold text-gold-ink group-hover:underline sm:inline">
        {isEnglish ? "Read Full Archetype →" : "อ่านความหมายเต็ม →"}
      </span>
    </Link>
  );
}
