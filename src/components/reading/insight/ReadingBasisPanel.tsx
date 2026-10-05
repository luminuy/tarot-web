"use client";

import React, { useId, useState } from "react";
import type { ReadingBasis } from "@/lib/tarot/explain-types";
import { useReadingExplain } from "./use-reading-explain";
import { RelationsConstellation } from "./RelationsConstellation";

/**
 * ✦ "คำอ่านนี้ประกอบจากอะไร" + แผนที่ความเชื่อมโยงของไพ่ (REFLECTION_JOURNAL_PLAN 1.1 · 1.6)
 * ---------------------------------------------------------------------------
 * ⚠️ ห้ามมีแถบ/ตัวเลขความมั่นใจหรือความแม่นทุกรูปแบบ — แถบที่ไม่มีหน่วยก็คือความแม่นปลอม
 *    แสดงเฉพาะสิ่งที่นับได้จริง และบอก "ไม่ได้ใช้" พร้อมเหตุผลตรง ๆ
 * ⚠️ แถวในส่วน "ประกอบจาก" ต้องตรงกับสิ่งที่ `buildReadingPrompt` ใส่เข้า prompt จริง
 *    แผนที่ความเชื่อมโยง (แก่นเรื่อง) ยังไม่ได้เข้า prompt — จึงแยกหัวข้อและไม่อ้างว่าแม่หมอใช้
 */

const CATEGORY_LABEL: Record<string, { th: string; en: string }> = {
  general: { th: "ภาพรวม", en: "general" },
  love: { th: "ความรัก", en: "love" },
  work: { th: "การงาน", en: "career" },
  money: { th: "การเงิน", en: "money" },
  self: { th: "ตัวเอง", en: "self" },
};

interface Props {
  url: string | null;
  cardCount: number;
  positionNames: string[];
  category: string;
  basis: ReadingBasis | null;
  /** มีคำถามที่ผู้ใช้พิมพ์เอง — ใช้แทนเมื่อไม่มีเฟรม basis (เช่นกู้คืนคำอ่านเดิม) */
  hasQuestion: boolean;
  isEnglish: boolean;
  /** พิกัดจริงของผัง (0–1) ต่อลำดับไพ่ — ใช้วาดแผนภาพความเชื่อมโยง */
  layout?: Array<{ order: number; x: number; y: number }>;
}

export const ReadingBasisPanel: React.FC<Props> = ({
  url,
  cardCount,
  positionNames,
  category,
  basis,
  hasQuestion,
  isEnglish,
  layout,
}) => {
  const [mapOpen, setMapOpen] = useState(false);
  const mapId = useId();
  const { data, error, loading, retry } = useReadingExplain(url, mapOpen);
  const cat = CATEGORY_LABEL[category] ?? CATEGORY_LABEL.general;

  const shownPositions =
    positionNames.length > 4
      ? `${positionNames.slice(0, 4).join(" · ")} ${isEnglish ? `+${positionNames.length - 4} more` : `และอีก ${positionNames.length - 4}`}`
      : positionNames.join(" · ");

  const rows: Array<{ used: boolean; label: string; detail: string }> = [
    {
      used: true,
      label: isEnglish ? "Card meanings" : "ความหมายไพ่",
      detail: isEnglish
        ? `${cardCount} ${cardCount === 1 ? "card" : "cards"} from the 78-card encyclopedia · ${cat.en} reading`
        : `${cardCount} ใบ จากสารานุกรม 78 ใบ · หมวด${cat.th}`,
    },
    {
      used: true,
      label: isEnglish ? "Imagery on the 1909 cards" : "ภาพบนหน้าไพ่ 1909",
      detail: isEnglish ? "Scenes and symbols of the original Rider-Waite art" : "ฉากและสัญลักษณ์จากภาพต้นฉบับ Rider-Waite",
    },
    {
      // ผังใบเดียวที่ไม่มีชื่อตำแหน่ง = ไพ่ตอบคำถามทั้งข้อ (ตำแหน่งเดียวของผังยังถูกส่งให้แม่หมอเสมอ)
      used: true,
      label: isEnglish ? "Spread positions" : "ตำแหน่งในผัง",
      detail:
        positionNames.length > 0
          ? shownPositions
          : isEnglish
            ? "A single card answering your whole question"
            : "ไพ่ใบเดียวตอบคำถามทั้งข้อ",
    },
    cardCount >= 2
      ? {
          used: true,
          label: isEnglish ? "Links between cards" : "ความเชื่อมโยงระหว่างไพ่",
          detail: isEnglish ? "Elements · gaze on the card faces · number rhythm" : "ธาตุ · ทิศสายตาบนหน้าไพ่ · จังหวะตัวเลข",
        }
      : {
          used: false,
          label: isEnglish ? "Links between cards" : "ความเชื่อมโยงระหว่างไพ่",
          detail: isEnglish ? "Single-card draw — no pairs to link" : "ผังใบเดียว ไม่มีคู่ไพ่ให้เชื่อม",
        },
    {
      used: basis ? basis.question : hasQuestion,
      label: isEnglish ? "Your question" : "คำถามของคุณ",
      detail: (basis ? basis.question : hasQuestion)
        ? basis?.intake
          ? isEnglish
            ? "Used, together with the details you shared"
            : "ใช้ พร้อมรายละเอียดที่คุณเล่า"
          : isEnglish
            ? "Used"
            : "ใช้"
        : isEnglish
          ? "No question typed — read as a general overview"
          : "ไม่ได้พิมพ์คำถาม — อ่านเป็นภาพรวม",
    },
  ];
  // ประวัติ: รู้ได้จากเฟรม basis เท่านั้น — ไม่มีเฟรม (กู้คืนคำอ่านเดิม) = ไม่แสดงแถวนี้ ดีกว่าเดา
  if (basis) {
    rows.push({
      used: basis.history,
      label: isEnglish ? "Your past readings" : "ประวัติของคุณ",
      detail: basis.history
        ? isEnglish
          ? "The reader remembered your recent saved readings"
          : "แม่หมอจำคำอ่านล่าสุดที่คุณบันทึกไว้"
        : basis.member
          ? isEnglish
            ? "Not used — no saved readings yet"
            : "ไม่ได้ใช้ — ยังไม่มีคำอ่านที่บันทึกไว้"
          : isEnglish
            ? "Not used — sign in so the reader can remember"
            : "ไม่ได้ใช้ — เข้าสู่ระบบเพื่อให้แม่หมอจำเรื่องของคุณได้",
    });
  }

  const nameAt = (pos: number) => data?.cards.find((c) => c.order === pos);
  const label = (pos: number) => {
    const c = nameAt(pos);
    return c ? `${c.position.name} (${c.name})` : "";
  };

  return (
    <section className="glass-tile !rounded-lg p-4 sm:p-5 space-y-3 font-serif-th text-ink-deep" aria-labelledby={`${mapId}-h`}>
      <h5 id={`${mapId}-h`} className="text-xs sm:text-sm font-bold">
        {isEnglish ? "What this reading is built from" : "คำอ่านนี้ประกอบจาก"}
      </h5>
      <ul className="space-y-1.5 list-none p-0 m-0 text-xs sm:text-[13px]">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[1.25rem_minmax(0,9rem)_1fr] gap-x-2 items-baseline">
            <span aria-hidden="true" className={r.used ? "text-gold-ink" : "text-muted"}>
              {r.used ? "✦" : "○"}
            </span>
            <span className={`font-semibold ${r.used ? "" : "text-muted"}`}>
              {r.label}
              <span className="sr-only">{r.used ? (isEnglish ? " (used)" : " (ใช้)") : isEnglish ? " (not used)" : " (ไม่ได้ใช้)"}</span>
            </span>
            <span className={r.used ? "" : "text-muted"}>{r.detail}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] sm:text-xs text-muted leading-relaxed">
        {isEnglish
          ? "These are the ingredients used to interpret your cards — not the probability that anything will happen."
          : "นี่คือองค์ประกอบที่ใช้ตีความไพ่ของคุณ ไม่ใช่โอกาสที่เหตุการณ์จะเกิดขึ้นจริง"}
      </p>

      {cardCount >= 2 && (
        <div className="border-t border-line-warm/40 pt-3">
          <button
            type="button"
            aria-expanded={mapOpen}
            aria-controls={mapId}
            onClick={() => setMapOpen((v) => !v)}
            className="tap-overlay-y w-full flex items-center justify-between gap-2 text-left text-xs sm:text-[13px] font-semibold text-gold-ink hover:text-gold-ink-deep cursor-pointer"
          >
            <span>✦ {isEnglish ? "See how your cards connect" : "ดูแผนที่ความเชื่อมโยงของไพ่"}</span>
            <span aria-hidden="true" className={`transition-transform ${mapOpen ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>

          {mapOpen && (
            <div id={mapId} className="mt-3 space-y-3 text-xs sm:text-[13px] leading-relaxed">
              {loading && (
                <p className="text-muted italic" role="status">
                  {isEnglish ? "Mapping the links…" : "กำลังวาดแผนที่ความเชื่อมโยง…"}
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
              {data && (
                <>
                  {layout && layout.length >= 2 && <RelationsConstellation data={data} layout={layout} isEnglish={isEnglish} />}
                  <p className="text-muted">
                    {isEnglish
                      ? "Calculated from the encyclopedia (elements and shared themes) — the same every time for these cards."
                      : "คำนวณจากสารานุกรม (ธาตุและแก่นเรื่องที่ตรงกัน) — ไพ่ชุดนี้ได้ผลเหมือนเดิมทุกครั้ง"}
                  </p>

                  {data.relations.signals.length > 0 && (
                    <ul className="space-y-1 list-none p-0 m-0">
                      {data.relations.signals.map((s, i) => (
                        <li key={`${s.id}-${i}`} className="pl-2 border-l-2 border-gold-ink">
                          {s.note}
                        </li>
                      ))}
                    </ul>
                  )}

                  {data.relations.clusters.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-semibold">{isEnglish ? "Cards pointing to the same theme" : "ไพ่ที่ชี้เรื่องเดียวกัน"}</p>
                      <ul className="space-y-1 list-none p-0 m-0">
                        {data.relations.clusters.map((c) => (
                          <li key={c.label}>
                            <span className="font-semibold">{c.label}</span>
                            {" — "}
                            {c.positions.map(label).filter(Boolean).join(" · ")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.relations.pairs.length > 0 ? (
                    <div className="space-y-1">
                      <p className="font-semibold">{isEnglish ? "Card pairs" : "คู่ไพ่ที่คุยกัน"}</p>
                      <ul className="space-y-1.5 list-none p-0 m-0">
                        {data.relations.pairs.map((p) => (
                          <li key={`${p.a}-${p.b}`} className={`pl-2 border-l-2 ${KIND_BORDER[p.kind]}`}>
                            <span className="font-semibold">
                              {label(p.a)} + {label(p.b)}
                            </span>
                            <span className="text-muted"> · {KIND_LABEL[p.kind][isEnglish ? "en" : "th"]}</span>
                            <br />
                            {p.note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-muted">
                      {isEnglish ? "No strong pairings in this spread." : "ผังนี้ไม่มีคู่ไพ่ที่เชื่อมกันเด่นชัด"}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const KIND_BORDER: Record<"support" | "tension" | "echo", string> = {
  support: "border-gold-ink",
  tension: "border-err",
  echo: "border-dashed border-muted",
};

const KIND_LABEL: Record<"support" | "tension" | "echo", { th: string; en: string }> = {
  support: { th: "เสริมกัน", en: "support each other" },
  tension: { th: "ดึงกันคนละทาง", en: "pull in different directions" },
  echo: { th: "สะท้อนกัน", en: "echo each other" },
};
