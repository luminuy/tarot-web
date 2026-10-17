"use client";

import React from "react";
import { PUBLIC_SPREADS, type Spread } from "@/data/spreads";
import { SPREAD_SHELVES, type ShelfKey } from "@/data/spread-shelves";
import { mapLayout, MAP_CARD_ASPECT } from "@/lib/tarot/spread-map-geometry";
import { CloseIcon } from "@/components/ui/LineIcons";
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

/** แผนผังย่อจากพิกัดจริงของผัง (สูตรเดียวกับหน้า /spreads) — ใช้ทั้งกล่องผังที่เลือกและหน้าต่างเปลี่ยนผัง */
function MiniMap({ spread, className }: { spread: Spread; className: string }) {
  const map = mapLayout(spread.positions);
  return (
    <span className={className} aria-hidden="true">
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
  const name = isEnglish ? spread.nameEn || spread.nameTh : spread.nameTh;
  return (
    <section className="v2-ss" aria-label={isEnglish ? "Chosen spread" : "ผังที่เลือก"}>
      <div className="v2-ss-top">
        <MiniMap spread={spread} className="v2-ss-map" />
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

/**
 * 🔄 เปลี่ยนผังในหน้านี้เลย — เจ้าของ 2026-10-17 "กดเปลี่ยนผังทำไมไปหน้าแรก ทำให้เปลี่ยนได้ที่หน้านี้เลย"
 * เดิมปุ่ม "เปลี่ยนผัง" พาออกไปหน้าแรก (ล้างคำถามที่พิมพ์ไว้ แล้วต้องหาผังใหม่ในรายการยาว)
 * ตอนนี้: หน้าต่างเลือกผัง 6 หมวดชุดเดียวกับหน้า /spreads · แตะผัง = เปลี่ยนทันที คำถามที่พิมพ์ไว้อยู่ครบ
 * ด่านสิทธิ์ยังอยู่ที่ผู้เรียก (`onPick` ใน TarotFlow ใช้ decideSpreadAccess ชุดเดิม)
 */
export function SpreadSwitcher({
  open,
  current,
  isEnglish,
  lockedIds,
  onPick,
  onClose,
}: {
  open: boolean;
  current: Spread;
  isEnglish: boolean;
  /** ผังที่ต้องใช้รอบเติม (ป้ายบอกก่อนแตะ — ตัดสินจริงตอนแตะ) */
  lockedIds: ReadonlySet<string>;
  onPick: (spread: Spread) => void;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const homeShelf = SPREAD_SHELVES.find((sh) => sh.ids.includes(current.id))?.key ?? SPREAD_SHELVES[0].key;
  const [shelf, setShelf] = React.useState<ShelfKey>(homeShelf);

  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setShelf(homeShelf);
      d.showModal();
    } else if (!open && d.open) d.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- เปิดใหม่ทุกครั้งให้เริ่มที่หมวดของผังปัจจุบัน
  }, [open]);

  const active = SPREAD_SHELVES.find((sh) => sh.key === shelf) ?? SPREAD_SHELVES[0];
  const list = active.ids
    .map((id) => PUBLIC_SPREADS.find((sp) => sp.id === id))
    .filter((sp): sp is Spread => Boolean(sp));

  return (
    <dialog
      ref={ref}
      className="v2-sw"
      aria-labelledby="v2-sw-title"
      onClose={onClose}
      onClick={(e) => {
        // แตะพื้นมืดนอกกล่อง = ปิด
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="v2-sw-box">
        <header className="v2-sw-head">
          <h2 id="v2-sw-title">{isEnglish ? "Choose a spread" : "เลือกผัง"}</h2>
          <button type="button" className="v2-sw-x" onClick={onClose} aria-label={isEnglish ? "Close" : "ปิด"}>
            <CloseIcon className="w-[18px] h-[18px]" />
          </button>
        </header>

        <div className="v2-sw-tabs" role="tablist" aria-label={isEnglish ? "Spread categories" : "หมวดผัง"}>
          {SPREAD_SHELVES.map((sh) => (
            <button
              key={sh.key}
              type="button"
              role="tab"
              aria-selected={sh.key === shelf}
              className={sh.key === shelf ? "is-on" : ""}
              onClick={() => setShelf(sh.key)}
            >
              {isEnglish ? sh.nameEn : sh.nameTh}
            </button>
          ))}
        </div>

        <ul className="v2-sw-grid" role="tabpanel" aria-label={isEnglish ? active.nameEn : active.nameTh}>
          {list.map((sp) => {
            const isNow = sp.id === current.id;
            const locked = !isNow && lockedIds.has(sp.id);
            return (
              <li key={sp.id}>
                <button
                  type="button"
                  className={`v2-sw-tile${isNow ? " is-now" : ""}`}
                  aria-current={isNow ? "true" : undefined}
                  onClick={() => (isNow ? onClose() : onPick(sp))}
                >
                  <MiniMap spread={sp} className="v2-sw-map" />
                  <span className="v2-sw-t">
                    <b>{isEnglish ? sp.nameEn || sp.nameTh : sp.nameTh}</b>
                    <span>
                      {sp.positions.length} {isEnglish ? "cards" : "ใบ"}
                      {isNow && <em className="is-now">{isEnglish ? "Current" : "ใช้อยู่"}</em>}
                      {locked && <em>{isEnglish ? "Top-up" : "ใช้รอบเติม"}</em>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}
