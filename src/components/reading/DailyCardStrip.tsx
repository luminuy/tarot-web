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
        className="mx-auto mb-6 h-[92px] max-w-2xl animate-pulse rounded-lg border border-[#D9C8AC]/40 bg-white/60"
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
      prefetch={false}
      className="group mx-auto mb-6 flex max-w-2xl items-center gap-4 rounded-lg border border-[#D9C8AC] bg-white px-4 py-3 shadow-[var(--shadow-raised)] transition-colors hover:border-[#8F5C1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
      title={isEnglish ? `Daily Card ${daily.dateKey} · SHA-256 ${daily.proof.slice(0, 16)}…` : `ไพ่ประจำวัน ${daily.dateKey} · SHA-256 ${daily.proof.slice(0, 16)}…`}
    >
      <div className="relative h-14 w-9 shrink-0 overflow-hidden rounded border border-[#D9C8AC] bg-[#F3EDE2] shadow-xs">
        <CardImage
          image={daily.image}
          alt={isEnglish ? `${daily.nameEn} — Card of the Day` : `${daily.nameTh} — ไพ่ประจำวันนี้`}
          className="h-full w-full object-cover"
          sizes="36px"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-serif-th text-xs font-bold text-[#8F5C1A]">
          ✦ {isEnglish ? "Card of the Day" : "ไพ่ประจำวันนี้"}
        </p>
        <p className="font-serif-th text-sm font-bold text-[#2E211A]">
          {isEnglish ? (
            daily.nameEn
          ) : (
            <>
              {daily.nameTh}{" "}
              <span className="font-normal text-[#635B4E]">· {daily.nameEn}</span>
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {displayKeywords.map((kw) => (
            <span
              key={kw}
              className="rounded-full border border-[#D9C8AC] bg-[#F3EDE2] px-2 py-0.5 font-serif-th text-xs text-[#635B4E]"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      <span className="hidden shrink-0 font-serif-th text-[13px] font-semibold text-[#8F5C1A] group-hover:underline sm:inline">
        {isEnglish ? "Read Full Archetype →" : "อ่านความหมายเต็ม →"}
      </span>
    </Link>
  );
}
