"use client";

import type { ReadingState } from "@/components/home/flow-reading";
import { FallbackNotice } from "@/components/reading/FallbackNotice";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import type { ReadingBasis } from "@/lib/tarot/explain-types";
import { CardWhyPanel } from "@/components/reading/insight/CardWhyPanel";
import { ReadingBasisPanel } from "@/components/reading/insight/ReadingBasisPanel";
import { explainUrl } from "@/components/reading/insight/use-reading-explain";

/**
 * ✦ คำอ่านของแม่หมอบนหน้าเฉพาะทาง (1–3 ใบ)
 * ===========================================================================
 *
 * หน้าที่ไม่ได้ใช้แท่นไพ่เต็มของหน้าแรก (`/daily` · `/love/1-card` · `/pick-a-card` ·
 * `/cards/birth-card`) ใช้ตัวนี้แทน `StreamReader` เพราะตัวนั้นมาพร้อมแท่นไพ่ · แถบสลับใบ ·
 * แผงหลักฐาน Provably Fair ซึ่งเกินความจำเป็นและหนักเกินไปสำหรับผังไม่กี่ใบ
 *
 * ⚠️ **ห้ามเติมแผง/ป้าย Provably Fair ลงในตัวนี้** — สองหน้าที่ใช้ตัวนี้ในคลื่นที่ 2
 * เป็น "ไพ่ที่คำนวณได้" ไม่ใช่ไพ่ที่จั่ว (ดู `src/lib/reading/derived-draw.ts`)
 * ผู้ใช้กดตรวจแล้วคำนวณซ้ำไม่ตรงแน่นอน เพราะมันคนละกลไกกัน
 * (ด่าน `scripts/qa/test-derived-draw.ts` เฝ้าข้อนี้อยู่)
 *
 * รับสถานะจากตัวลดตัวเดียวกับหน้าแรก (`readingReducer`) จึงไม่มีสถานะขัดแย้งในตัวเอง
 */
export function AiReadingPanel({
  state,
  isEn,
  onRetry,
  cardLabels,
  title,
  insight,
}: {
  state: ReadingState;
  isEn: boolean;
  onRetry: () => void;
  /** ชื่อตำแหน่งของไพ่แต่ละใบตามลำดับ — ไม่ส่งมาก็ได้ (ผังใบเดียวไม่ต้องมีป้ายตำแหน่ง) */
  cardLabels?: readonly string[];
  title?: string;
  /**
   * ✦ ส่ง controller ของ `useAiReading` มา = เปิดแผง "ทำไมแม่หมออ่านแบบนี้" ใต้แต่ละใบ + "คำอ่านนี้ประกอบจาก"
   * (REFLECTION_JOURNAL_PLAN 1.2 · 1.6) — ไม่เรียก AI เพิ่ม · ไพ่ไม่ครบ/นอกสำรับ = ไม่แสดง (กฎเหล็กข้อ 14)
   */
  insight?: {
    rawDrawn: ReadonlyArray<{ order: number; cardIndex: number; isReversed: boolean }>;
    basis: ReadingBasis | null;
    lastRequest: { spreadId: string; category: string } | null;
  };
}) {
  const reading = state.reading;
  const cardReadings = reading?.cards ?? [];
  const insightUrl =
    insight?.lastRequest &&
    state.status === "done" &&
    insight.rawDrawn.length > 0 &&
    insight.rawDrawn.every((d) => Number.isInteger(d.cardIndex) && d.cardIndex >= 0 && d.cardIndex <= 77)
      ? explainUrl(insight.lastRequest.spreadId, insight.rawDrawn, insight.lastRequest.category, isEn)
      : null;

  /* สตรีมสะดุด — ของที่มาถึงแล้วยังอยู่ ผู้ใช้กดอ่านใหม่ได้ */
  if (state.error) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5 space-y-3">
        <p className="text-sm text-ink">{state.error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="tap-target px-5 py-2.5 rounded-full bg-ink text-surface-warm text-xs font-serif-th font-semibold shadow-raised hover:bg-gold transition cursor-pointer"
        >
          {isEn ? "Reload and try again" : "โหลดใหม่อีกครั้ง"}
        </button>
      </div>
    );
  }

  if (state.status === "idle" && !reading) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-base sm:text-lg font-serif-th font-bold text-ink"><ThaiPhrases>
          {title ?? (isEn ? "The Oracle Reads Your Card" : "คำอ่านจากแม่หมอ")}
        </ThaiPhrases></h3>
        {state.status === "streaming" && (
          <span className="text-xs font-serif-th text-gold-ink">
            {isEn ? "reading…" : "กำลังอ่าน…"}
          </span>
        )}
      </div>

      {/* คำอ่านจากคลังความหมายไพ่ (AI ไม่ว่าง) — บอกตรง ๆ และให้แม่หมอ AI อ่านไพ่ชุดเดิมใหม่ได้ */}
      {state.fallback && state.status === "done" && <FallbackNotice isEn={isEn} onRetry={onRetry} />}

      {reading?.opening && (
        <p className="text-sm sm:text-base leading-relaxed text-ink whitespace-pre-line">
          {reading.opening}
        </p>
      )}

      {/*
        คำอ่านรายใบ — ตัวลดเรียงตาม `position` ให้แล้ว จึงตรงกับลำดับไพ่บนหน้าจอเสมอ
        ป้ายตำแหน่งหยิบจาก `cardLabels` ตาม `position` ของใบนั้น ไม่ใช่ตามลำดับที่มาถึง
        (เฟรมของใบที่ 3 มาถึงก่อนใบที่ 2 ได้ถ้าโมเดลตอบสลับ)
      */}
      {cardReadings.map((card) => {
        const label = cardLabels?.[card.position];
        return (
          <div key={card.position} className="space-y-1.5">
            {label && (
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                {`${card.position + 1}. ${label}`}
              </p>
            )}
            {card.headline && (
              <p className="text-sm sm:text-base font-serif-th font-semibold text-gold-ink">
                {card.headline}
              </p>
            )}
            {card.reading && (
              <p className="text-sm sm:text-base leading-relaxed text-ink whitespace-pre-line">
                {card.reading}
              </p>
            )}
            {insightUrl && card.reading && <CardWhyPanel url={insightUrl} order={card.position} isEnglish={isEn} />}
          </div>
        );
      })}

      {reading?.connections && cardReadings.length > 1 && (
        <p className="text-sm sm:text-base leading-relaxed text-ink whitespace-pre-line">
          {reading.connections}
        </p>
      )}

      {reading?.summary && (
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-serif-th font-semibold tracking-wide text-gold-ink mb-2">
            {isEn ? "In Summary" : "สรุปใจความ"}
          </p>
          <p className="text-sm sm:text-base leading-relaxed text-ink whitespace-pre-line">
            {reading.summary}
          </p>
        </div>
      )}

      {insightUrl && insight && (
        <ReadingBasisPanel
          url={insightUrl}
          cardCount={insight.rawDrawn.length}
          positionNames={cardLabels ? insight.rawDrawn.map((d) => cardLabels[d.order]).filter((x): x is string => Boolean(x)) : []}
          category={insight.lastRequest?.category ?? "general"}
          basis={insight.basis}
          hasQuestion
          isEnglish={isEn}
        />
      )}

      {reading?.advice && reading.advice.length > 0 && (
        <ul className="space-y-2">
          {reading.advice.map((line, i) => (
            <li key={i} className="text-sm sm:text-base leading-relaxed text-ink pl-5 relative">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 bg-gold rotate-45" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
