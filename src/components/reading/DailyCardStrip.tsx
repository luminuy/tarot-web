"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { CardImage } from "@/components/card/CardImage";
import { useLocale } from "@/lib/i18n";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";
import type { DailyCard } from "@/lib/tarot/daily-card";

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
    fetch("/api/daily-card", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: DailyCard) => {
        if (alive) setDaily(d);
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
        className="mx-auto mb-6 h-[92px] max-w-2xl animate-pulse rounded-lg border border-line-warm/40 bg-white/60"
      />
    );
  }

  const displayKeywords = isEnglish
    ? (daily.keywordsEn && daily.keywordsEn.length > 0
        ? daily.keywordsEn
        : CARD_KEYWORDS_EN[daily.cardId]?.upright.slice(0, 4) || daily.keywords)
    : daily.keywords;

  return (
    <Link
      href={`/cards/${daily.cardId}`}
      className="group mx-auto mb-6 flex max-w-2xl items-center gap-4 rounded-lg border border-line-warm bg-white px-4 py-3 shadow-raised transition-colors hover:border-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
      title={isEnglish ? `Daily Card ${daily.dateKey} · SHA-256 ${daily.proof.slice(0, 16)}…` : `ไพ่ประจำวัน ${daily.dateKey} · SHA-256 ${daily.proof.slice(0, 16)}…`}
    >
      <div className="relative h-14 w-9 shrink-0 overflow-hidden rounded border border-line-warm bg-inset-warm shadow-xs">
        <CardImage
          image={daily.image}
          /* ภาพประกอบล้วน — ตัวหนังสือในลิงก์เดียวกันบอก "ไพ่ประจำวันนี้" และชื่อไพ่อยู่แล้ว (INC-0125) */
          alt=""
          className="h-full w-full object-cover"
          sizes="36px"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-serif-th text-xs font-bold text-gold-ink">
          {isEnglish ? "Card of the Day" : "ไพ่ประจำวันนี้"}
        </p>
        <p className="font-serif-th text-sm font-bold text-ink-deep">
          {isEnglish ? (
            daily.nameEn
          ) : (
            <>
              {daily.nameTh}{" "}
              <span className="font-normal text-muted">· {daily.nameEn}</span>
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {displayKeywords.map((kw) => (
            <span
              key={kw}
              className="rounded-full border border-line-warm bg-inset-warm px-2 py-0.5 font-serif-th text-xs text-muted"
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
