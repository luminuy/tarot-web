"use client";

import React from "react";
import type { Spread } from "@/data/spreads";
import { mapLayout, MAP_CARD_ASPECT } from "@/lib/tarot/spread-map-geometry";
// import แบบ static เท่านั้น — import() ทำให้ชังก์ clipboard ผูกตัวช่วยจากชังก์ React ➔ หน้าบทความ 60 หน้าโหลด React ติดไป (A8-08)
import { copyToClipboard } from "@/lib/utils/clipboard";

/**
 * 🧭 ชิ้นส่วนกลางของหน้าขั้นตอนดูดวง v2 (`/read/<ผัง>` · หน้าแรกเมื่อเข้าพิธี)
 * เจ้าของ 2026-10-16: "ออกแบบใหม่ทั้งหมด หน้าขั้นตอนดูไพ่" + "ลดขั้นตอน ทำให้ใช้ง่ายกว่านี้ และสวย"
 *
 * v1 มี 4 จังหวะที่ผู้ใช้ต้องกดเอง (ตั้งคำถาม ➔ กดสับ ➔ เลือกไพ่ ➔ อ่าน) และไม่มีอะไรบอกว่าอยู่ตรงไหน
 * v2 เหลือ 3 ขั้นที่ผู้ใช้เห็น — การสับไพ่เล่นเองอัตโนมัติเป็นส่วนหนึ่งของขั้น "เลือกไพ่"
 */

const STEPS_TH = ["ตั้งคำถาม", "เลือกไพ่", "อ่านคำทำนาย"] as const;
const STEPS_EN = ["Ask", "Pick cards", "Your reading"] as const;

export function RitualRail({ step, isEnglish }: { step: 1 | 2 | 3; isEnglish: boolean }) {
  const labels = isEnglish ? STEPS_EN : STEPS_TH;
  return (
    <ol className="v2-rail" aria-label={isEnglish ? "Reading steps" : "ขั้นตอนดูดวง"}>
      {labels.map((label, i) => {
        const n = i + 1;
        const state = n < step ? "is-done" : n === step ? "is-now" : "";
        return (
          <li key={label} className={state} aria-current={n === step ? "step" : undefined}>
            <span className="v2-rail-n" aria-hidden="true">
              {n}
            </span>
            <span className="v2-rail-t">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** ผังที่เลือก — แผนผังย่อจากพิกัดจริงของผัง (สูตรเดียวกับหน้า /spreads) + ชื่อตำแหน่ง */
export function SpreadSummaryCard({
  spread,
  isEnglish,
  onChange,
}: {
  spread: Spread;
  isEnglish: boolean;
  onChange?: () => void;
}) {
  const map = mapLayout(spread.positions);
  const name = isEnglish ? spread.nameEn || spread.nameTh : spread.nameTh;
  return (
    <section className="v2-ss" aria-label={isEnglish ? "Chosen spread" : "ผังที่เลือก"}>
      <div className="v2-ss-top">
        <span className="v2-ss-map" aria-hidden="true">
          <span className="v2-ss-map-area" style={{ paddingBottom: `${(map.boxHeight * 100).toFixed(2)}%` }}>
            {spread.positions.map((pos, j) => (
              <span
                key={j}
                style={{
                  left: `${pos.x * 100}%`,
                  top: `${(((pos.y * map.yScale + map.offsetY) / map.boxHeight) * 100).toFixed(3)}%`,
                  width: `${(map.cardW * 100).toFixed(2)}%`,
                  aspectRatio: `1 / ${MAP_CARD_ASPECT}`,
                  transform: `translate(-50%, -50%) rotate(${pos.rotate ?? 0}deg)`,
                }}
              />
            ))}
          </span>
        </span>
        <div className="v2-ss-txt">
          <p className="v2-ss-k">{isEnglish ? "Your spread" : "ผังที่เลือก"}</p>
          <p className="v2-ss-name">{name}</p>
          <p className="v2-ss-n">
            {spread.positions.length} {isEnglish ? "cards" : "ใบ"}
          </p>
          {onChange && (
            <button type="button" className="v2-ss-change" onClick={onChange}>
              {isEnglish ? "Change spread" : "เปลี่ยนผัง"}
            </button>
          )}
        </div>
      </div>
      <details className="v2-ss-pos">
        <summary>{isEnglish ? "What each card answers" : "แต่ละใบตอบเรื่องอะไร"}</summary>
        <ol>
          {spread.positions.map((pos, j) => (
            <li key={j}>
              <span aria-hidden="true">{j + 1}</span>
              {(isEnglish ? pos.nameEn || pos.nameTh : pos.nameTh).replace(/^\d+\.\s*/, "")}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

/**
 * 🔒 รหัสล็อกลำดับไพ่ (commitment) — หลักฐานว่าเซิร์ฟเวอร์ล็อกสำรับไว้ก่อนผู้ใช้เลือก
 * v1 อยู่ในหน้าสับไพ่เป็นตัวอักษรโมโนเล็ก ๆ ไม่มีใครเข้าใจ · v2 บอกเป็นประโยคคน + คัดลอกได้
 */
export function SealChip({ commitment, isEnglish }: { commitment: string; isEnglish: boolean }) {
  const [copied, setCopied] = React.useState(false);
  if (!commitment) return null;
  return (
    <p className="v2-seal">
      <span className="v2-seal-dot" aria-hidden="true" />
      <span className="v2-seal-t">
        {isEnglish ? "Deck order locked before you pick" : "ลำดับไพ่ถูกล็อกไว้ก่อนคุณเลือก"}
        <code>
          {commitment.slice(0, 10)}…{commitment.slice(-6)}
        </code>
      </span>
      <button
        type="button"
        className="v2-seal-copy"
        onClick={async () => {
          if (await copyToClipboard(commitment)) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }
        }}
        aria-label={isEnglish ? "Copy verification commitment" : "คัดลอกรหัสยืนยันความโปร่งใส"}
      >
        {copied ? (isEnglish ? "Copied" : "คัดลอกแล้ว") : isEnglish ? "Copy" : "คัดลอก"}
      </button>
    </p>
  );
}
