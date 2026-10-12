"use client";

import React, { useId, useState } from "react";
import { trackReflectionEvent } from "@/lib/stats/reflection-events";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useReadingExplain } from "./use-reading-explain";

/**
 * ✦ "ทำไมแม่หมออ่านแบบนี้?" — แผงพับได้ใต้คำอ่านรายใบ (REFLECTION_JOURNAL_PLAN 1.2)
 * ---------------------------------------------------------------------------
 * แสดง **หลักฐานชุดเดียวกับที่แม่หมอ AI ได้รับ** แยกเป็นชั้น ไม่สร้างคำอธิบายใหม่ด้วย AI
 * (ให้ AI อธิบายตัวเอง = แต่งเหตุผลย้อนหลังได้) · ข้อมูลโหลดตอนกดเปิดครั้งแรกเท่านั้น
 *   1. ความหมายของไพ่จากสารานุกรม (ตามหมวดคำถามและทิศของไพ่)
 *   2. ตำแหน่งนี้ถามว่าอะไร
 *   3. ความเชื่อมโยงกับไพ่ใบอื่นในผัง (คำนวณจากธาตุ + แก่นเรื่อง)
 *   4. ส่วนไหนคือ "การตีความ" ของแม่หมอ AI
 */
export const CardWhyPanel: React.FC<{
  url: string | null;
  order: number;
  isEnglish: boolean;
}> = ({ url, order, isEnglish }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { data, error, loading, retry } = useReadingExplain(url, open);
  const card = data?.cards.find((c) => c.order === order);
  const nameAt = (pos: number) => data?.cards.find((c) => c.order === pos);
  const pairs = data?.relations.pairs.filter((p) => p.a === order || p.b === order) ?? [];

  if (!url) return null;

  return (
    <div className="border-t border-line-warm/40 pt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (!open) trackReflectionEvent("why_panel_opened");
          setOpen((v) => !v);
        }}
        className="tap-overlay-y w-full flex items-center justify-between gap-2 text-left text-xs sm:text-[13px] font-serif-th font-semibold text-gold-ink hover:text-gold-ink-deep cursor-pointer"
      >
        <span>{isEnglish ? "Why did the reader read it this way?" : "ทำไมแม่หมออ่านแบบนี้?"}</span>
        <span aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div id={panelId} className="mt-3 space-y-3 text-xs sm:text-[13px] font-serif-th text-ink-deep leading-relaxed">
          {loading && (
            <p className="text-muted italic" role="status">
              {isEnglish ? "Gathering the evidence behind this card…" : "กำลังรวบรวมหลักฐานของไพ่ใบนี้…"}
            </p>
          )}

          {error && (
            <div className="rounded-lg bg-err-wash border border-line-warm p-3 space-y-2">
              <p className="text-err">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="tap-overlay-y px-3 py-1 rounded-full border border-line-warm bg-surface text-ink-deep text-xs cursor-pointer"
              >
                {isEnglish ? "Try again" : "ลองอีกครั้ง"}
              </button>
            </div>
          )}

          {card && (
            <ol className="space-y-3 list-none p-0 m-0">
              <Layer n={1} title={isEnglish ? "What the card means" : "ความหมายของไพ่"} source={isEnglish ? "From the 78-card encyclopedia" : "จากสารานุกรมไพ่ 78 ใบ"}>
                <p>{card.meaning}</p>
                {card.keywords.length > 0 && <p className="text-muted mt-1">{card.keywords.join(" · ")}</p>}
                <Link href={`/cards/${card.cardId}`} className="inline-block mt-1 text-gold-ink underline underline-offset-2">
                  {isEnglish ? `Read more about ${card.name}` : `อ่านเรื่อง${card.name}เพิ่ม`}
                </Link>
              </Layer>

              <Layer n={2} title={isEnglish ? "What this position asks" : "ตำแหน่งนี้ถามว่า"} source={card.position.name}>
                <p>{card.position.meaning}</p>
              </Layer>

              <Layer n={3} title={isEnglish ? "How it links to the other cards" : "ความเชื่อมโยงกับไพ่ใบอื่น"} source={isEnglish ? "Calculated, not generated" : "คำนวณจากธาตุและแก่นเรื่อง ไม่ได้ให้ AI แต่ง"}>
                {card.themes.length > 0 && (
                  <p>
                    {isEnglish ? "Themes: " : "แก่นเรื่อง: "}
                    {card.themes.join(" · ")}
                  </p>
                )}
                {pairs.length > 0 ? (
                  <ul className="mt-1 space-y-1 list-none p-0">
                    {pairs.map((p) => {
                      const other = nameAt(p.a === order ? p.b : p.a);
                      return (
                        <li key={`${p.a}-${p.b}`} className={`pl-2 border-l-2 ${KIND_BORDER[p.kind]}`}>
                          <span className="font-semibold">
                            {other ? `${other.position.name} (${other.name})` : ""}
                          </span>
                          {" — "}
                          {p.note}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-muted">
                    {isEnglish ? "No strong link to another card in this spread." : "ไม่มีความเชื่อมโยงเด่นกับใบอื่นในผังนี้"}
                  </p>
                )}
              </Layer>

              <Layer n={4} title={isEnglish ? "What is interpretation" : "ส่วนที่เป็นการตีความ"} source={isEnglish ? "AI reader" : "แม่หมอ AI"}>
                <p>
                  {isEnglish
                    ? "The reading above is the AI reader weaving layers 1–3 together with your question. The card does not fix your future — it is a symbol to help you think."
                    : "คำอ่านด้านบนคือแม่หมอ AI เรียบเรียงชั้นที่ 1–3 เข้ากับคำถามของคุณ ไพ่ไม่ได้กำหนดอนาคตที่ตายตัว — เป็นสัญลักษณ์ช่วยให้คุณคิด"}
                </p>
              </Layer>
            </ol>
          )}
        </div>
      )}
    </div>
  );
};

const KIND_BORDER: Record<"support" | "tension" | "echo", string> = {
  support: "border-gold-ink",
  tension: "border-err",
  echo: "border-dashed border-muted",
};

const Layer: React.FC<{ n: number; title: string; source: string; children: React.ReactNode }> = ({
  n,
  title,
  source,
  children,
}) => (
  <li className={`glass-tile !rounded-lg p-3 ${n === 4 ? "border-l-4 border-gold-ink" : ""}`}>
    <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
      <span className="font-bold">
        {n}. {title}
      </span>
      <span className="text-[11px] text-muted">{source}</span>
    </div>
    {children}
  </li>
);
