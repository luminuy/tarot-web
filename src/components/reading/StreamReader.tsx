"use client";

import { FallbackNotice } from "@/components/reading/FallbackNotice";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { motion } from "motion/react";
import { DUR, EASE } from "@/lib/motion";
import type { Reading } from "@/lib/schema/reading";
import { YES_NO_DISPLAY_EN } from "@/lib/schema/reading-display";
import type { Persona } from "@/data/personas";
import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import type { TarotCard } from "@/data/cards/types";
import { useCardResolver } from "@/data/cards/client-deck";
import { ElementalBalanceWidget } from "@/components/reading/ElementalBalanceWidget";
import { OracleMantraCard } from "@/components/reading/OracleMantraCard";
import { trackEvent } from "@/lib/analytics";
import { AccuracyRatingWidget } from "./AccuracyRatingWidget";
import { ProvablyFairPanel } from "./ProvablyFairPanel";
import { CollapsibleCard } from "./CollapsibleCard";
import { CardImage } from "@/components/card/CardImage";
import { TTSReaderButton } from "./TTSReaderButton";
import { useLocale } from "@/lib/i18n";
import { useMotionSafe } from "@/lib/use-motion-safe";
import { resolveDisplayKeywords } from "@/lib/tarot/keywords";
import type { ReadingBasis } from "@/lib/tarot/explain-types";
import { CardWhyPanel } from "./insight/CardWhyPanel";
import { ReadingBasisPanel } from "./insight/ReadingBasisPanel";
import { explainUrl } from "./insight/use-reading-explain";
import { SecondPerspectivePanel } from "./insight/SecondPerspectivePanel";

interface StreamReaderProps {
  reading?: Partial<Reading> | null;
  persona: Persona;
  isStreaming: boolean;
  activeCardIndex: number;
  onSelectCardIndex: (index: number) => void;
  drawnCards: DrawnSlotCard[];
  readingId?: string | null;
  proof?: {
    serverSeed?: string;
    clientSeed?: string;
    commitment?: string;
    pickedIndices?: number[];
    deckSize?: number;
  };
  errorMsg?: string | null;
  question?: string;
  nickname?: string;
  onRetry?: () => void;
  /** คำอ่านมาจากคลังความหมายไพ่ ไม่ใช่แม่หมอ AI — ขึ้น `FallbackNotice` ให้ผู้ใช้รู้และกดอ่านใหม่ได้ */
  isFallback?: boolean;
  /**
   * ✦ ผัง/หมวดของคำอ่านรอบนี้ + เฟรม `basis` — เปิดแผง "ทำไมแม่หมออ่านแบบนี้" และ "คำอ่านนี้ประกอบจาก"
   * (REFLECTION_JOURNAL_PLAN 1.2 · 1.6) · ไม่ส่ง `spreadId` = ไม่แสดงสองแผงนี้
   */
  spreadId?: string;
  category?: string;
  basis?: ReadingBasis | null;
}

/**
 * ✦ ข้อความคำทำนายที่ทยอยมาทีละก้อน — **หนึ่ง span ต่อหนึ่งก้อนที่สตรีมเข้ามา**
 * ---------------------------------------------------------------------------
 * ของเดิมทำ `reading.split(" ").map(...)` สร้าง `motion.span` หนึ่งตัวต่อหนึ่งคำ
 * ซึ่งมีปัญหาสามชั้นพร้อมกัน (T-03 · T-30 · T-32):
 *
 * 1. **ภาษาไทยไม่เว้นวรรคระหว่างคำ** `.split(" ")` จึงตัดได้เป็นก้อนใหญ่ไม่กี่ก้อน
 *    แอนิเมชันจริงคือ "ทีละวรรค" ไม่ใช่ "ทีละคำ" อย่างที่ออกแบบไว้ตั้งแต่แรก
 *    ส่วนฝั่งอังกฤษ (`/en`) ตัดได้ทีละคำจริง → `motion.span` หลักร้อยตัวพร้อมกัน
 *    คูณจำนวนไพ่ที่สตรีมพร้อมกัน (ผังใหญ่มีได้ถึง 10 ใบ) เป็นภาระเธรดหลักที่ด่านเดิม
 *    มองไม่เห็น เพราะมันตรวจ `animate={{}}` ทีละตัว ไม่ได้ตรวจ**จำนวน**
 * 2. ทุกคำที่เพิ่มเข้ามาคือการเปลี่ยนแปลงใน live region หนึ่งครั้ง
 * 3. ไม่มีเส้นทาง `prefers-reduced-motion` เลย
 *
 * วิธีใหม่: จำความยาวที่ "นิ่งแล้ว" ไว้ แล้วให้เฉพาะส่วนที่เพิ่งต่อท้ายเข้ามาเป็น span เดียว
 * พฤติกรรมไทยกับอังกฤษจึงเท่ากัน และจำนวนโหนดเท่ากับจำนวนครั้งที่สตรีมส่งของมา
 *
 * ต้องใส่ `key` ที่ผูกกับไพ่ใบที่กำลังแสดง เพื่อให้ตัวนับรีเซ็ตเมื่อสลับใบ
 */
const StreamingChunkText: React.FC<{ text: string; animate: boolean }> = ({ text, animate }) => {
  const settledRef = useRef(0);
  // ข้อความสั้นลงได้เมื่อผู้ให้บริการส่ง event `reset` แล้วเริ่มใหม่กับโมเดลถัดไป
  const settled = Math.min(settledRef.current, text.length);

  useEffect(() => {
    settledRef.current = text.length;
  }, [text]);

  if (!animate) return <>{text}</>;

  const fresh = text.slice(settled);
  if (!fresh) return <>{text}</>;

  return (
    <>
      {text.slice(0, settled)}
      <motion.span
        key={settled}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.fast, ease: EASE.out }}
      >
        {fresh}
      </motion.span>
    </>
  );
};

export const StreamReader: React.FC<StreamReaderProps> = ({
  reading,
  persona,
  isStreaming,
  activeCardIndex,
  onSelectCardIndex,
  drawnCards,
  readingId,
  proof,
  errorMsg,
  question,
  nickname,
  onRetry,
  isFallback,
  spreadId,
  category,
  basis,
}) => {
  const { isEnglish } = useLocale();
  // สำรับตามภาษาของหน้า — ไม่ลากคำทำนายอังกฤษมาให้ผู้ใช้ไทย (A8-02)
  const cardByIndex = useCardResolver(isEnglish);
  const [activeTab, setActiveTab] = useState<"card" | "summary">("card");
  // การอ่านออกเสียงย้ายไปอยู่ใน <TTSReaderButton /> ทั้งหมดแล้ว
  // (ของเดิมเหลือ state + handler ค้างไว้ที่นี่โดยไม่มีปุ่มไหนเรียกใช้)

  const activeDrawnCard = drawnCards.find((d) => d.order === activeCardIndex);
  // ไพ่เต็มจากสำรับมาก่อนเสมอ (มีฟิลด์ภาษาอังกฤษครบ) แล้วค่อยตกมาที่ก้อนย่อจากเซสชัน
  // ของเดิมสลับลำดับกัน ทำให้โหมด EN ได้ก้อนย่อที่มีแต่ภาษาไทย — ตรงกับ `allCards` ด้านล่างแล้ว
  const cardData =
    (activeDrawnCard && activeDrawnCard.cardIndex !== undefined
      ? cardByIndex(activeDrawnCard.cardIndex)
      : undefined) || activeDrawnCard?.card;
  const activeCardReading = reading?.cards?.find((c) => c.position === activeCardIndex);

  /*
   * ✦ ลิงก์หลักฐานของคำอ่าน — สร้างเฉพาะเมื่อไพ่ครบทุกใบและอ่านจบแล้ว (คำอ่านสำรองก็แสดงได้ เพราะหลักฐานมาจากสารานุกรม)
   * ไพ่ใบไหนไม่มีเลขในสำรับ = ไม่สร้างลิงก์เลย (กฎเหล็กข้อ 14 — ไม่ส่งไพ่ไม่ครบไปอธิบาย)
   */
  const insightUrl = useMemo(() => {
    if (!spreadId || isStreaming || drawnCards.length === 0) return null;
    if (drawnCards.some((d) => typeof d.cardIndex !== "number" || d.cardIndex < 0 || d.cardIndex > 77)) return null;
    // ผังที่สร้างเอง: เซิร์ฟเวอร์ไม่รู้ชื่อตำแหน่ง ➔ ส่งข้อความตำแหน่งที่หน้าเว็บถืออยู่ไปทาง fragment
    const customPositions =
      spreadId === "custom"
        ? [...drawnCards]
            .sort((a, b) => a.order - b.order)
            .map((d) => ({
              name: (isEnglish ? d.position.nameEn : d.position.nameTh) || d.position.nameTh,
              meaning: (isEnglish ? d.position.meaningEn : d.position.meaning) || d.position.meaning,
            }))
        : undefined;
    return explainUrl(spreadId, drawnCards, category || "general", isEnglish, customPositions);
  }, [spreadId, isStreaming, drawnCards, category, isEnglish]);

  /** ♿ ผู้ใช้ขอลดการเคลื่อนไหวหรือไม่ — ฮุกนี้ไม่ลาก `motion` เข้าบันเดิลสักไบต์ */
  const motionSafe = useMotionSafe();

  /**
   * ♿ ข้อความที่จะถูกประกาศ "ครั้งเดียว" เมื่อคำทำนายของไพ่ใบนี้จบแล้ว (T-03)
   * ต้องล้างเป็นค่าว่างก่อนเสมอ ไม่งั้นโปรแกรมอ่านหน้าจอที่เห็นสตริงเดิมจะไม่ประกาศซ้ำ
   */
  const [announcement, setAnnouncement] = useState("");
  const finishedReading = !isStreaming ? activeCardReading?.reading ?? "" : "";
  const finishedHeadline = !isStreaming ? activeCardReading?.headline ?? "" : "";

  useEffect(() => {
    if (!finishedReading) {
      setAnnouncement("");
      return;
    }
    setAnnouncement("");
    const timer = setTimeout(() => {
      setAnnouncement(`${finishedHeadline ? `${finishedHeadline}. ` : ""}${finishedReading}`);
    }, 120);
    return () => clearTimeout(timer);
  }, [finishedReading, finishedHeadline, activeCardIndex]);

  const allCards = useMemo(() => {
    try {
      return drawnCards
        .map((d) => (d.cardIndex !== undefined ? cardByIndex(d.cardIndex) : (d.card as unknown as TarotCard)))
        .filter((c): c is TarotCard => !!c);
    } catch {
      return [];
    }
  }, [drawnCards, cardByIndex]);

  const totalCards = drawnCards.length;

  const isQuotaError = errorMsg ? /สมัครสมาชิก|เติมรอบ|โควตา|สิทธิ์|quota|credit|member/i.test(errorMsg) : false;
  const keywords = resolveDisplayKeywords({
    cardId: cardData?.id,
    keywords: cardData?.keywords,
    keywordsEn: (cardData as any)?.keywordsEn,
    isReversed: activeDrawnCard?.isReversed,
    isEnglish,
  });
  const positionNames = [...drawnCards]
    .sort((a, b) => a.order - b.order)
    .map((d) => (isEnglish ? d.position.nameEn || d.position.nameTh : d.position.nameTh));

  /*
   * v2 (เจ้าของ 2026-10-16 "หน้านี้ออกแบบใหม่") — ห้องอ่านคำทำนาย
   * v1: หัวแม่หมอ + กล่องคำถามซ้ำ + ลิงก์แชทซ้ำ (มีอีก 2 ที่ในหน้า) + ปุ่มเม็ดยา 3 ชั้นก่อนถึงคำอ่าน
   * v2: แถบแม่หมอบาง ๆ ➔ สลับ "อ่านทีละใบ / ภาพรวม" ➔ หน้าคำอ่านแบบหน้าหนังสือ (ภาพไพ่ใหญ่ซ้าย คำอ่านขวา)
   */
  return (
    <div className="v2-sr">
      {/* แม่หมอ + สถานะ */}
      <div className="v2-sr-top">
        <span className="v2-sr-av">
          <CardImage
            image={`${persona.cardImage || (persona.id === "direct" ? "major-11.jpg" : persona.id === "mystic" ? "major-17.jpg" : "major-02.jpg")}`}
            /* ภาพประกอบล้วน — ชื่อแม่หมออยู่ข้าง ๆ แล้ว (INC-0125) */
            alt=""
            className="w-full h-full object-cover object-top"
            sizes="40px"
          />
        </span>
        <span className="v2-sr-who">
          <b>{isEnglish ? (persona.nameEn || persona.nameTh) : persona.nameTh}</b>
          <small>
            {nickname?.trim()
              ? isEnglish
                ? `Reading for ${nickname.trim()}`
                : `อ่านให้คุณ${nickname.trim()}`
              : isEnglish
                ? (persona.taglineEn || persona.tagline)
                : persona.tagline}
          </small>
        </span>
        {isStreaming ? (
          <span className="v2-sr-state is-live">
            <span className="v2-sr-state-dot" /> {isEnglish ? "Reading your cards..." : "แม่หมอกำลังอ่านคำทำนาย..."}
          </span>
        ) : errorMsg ? (
          /* A3-05: สตรีมล้มกลางทาง — ห้ามขึ้นป้าย "ครบถ้วน" คู่กับแบนเนอร์ให้โหลดใหม่ */
          <span className="v2-sr-state is-warn">
            <span className="v2-sr-state-dot" /> {isEnglish ? "Interpretation incomplete" : "คำทำนายยังไม่ครบ"}
          </span>
        ) : (
          <span className="v2-sr-state is-done">
            <span className="v2-sr-state-dot" /> {isEnglish ? "Interpretation complete" : "อ่านคำทำนายครบถ้วนแล้ว"}
          </span>
        )}
      </div>

      {/* Error / Recovery — โทนทองอุ่น ไม่ใช่แดงตกใจ · ซ่อนปุ่มลองใหม่เมื่อเป็นเรื่องโควตา */}
      {errorMsg && (
        <div role="alert" aria-live="assertive" className="v2-sr-alert">
          <span>{errorMsg}</span>
          {onRetry && !isQuotaError && (
            <button type="button" onClick={onRetry} className="v2-sr-btn is-gold">
              {isEnglish ? (/reload|not found/i.test(errorMsg) ? "Reload Reading" : "Retry Reading") : (/โหลดใหม่อีกครั้ง|ไม่พบข้อมูล/.test(errorMsg) ? "โหลดใหม่อีกครั้ง" : "ลองอ่านใหม่")}
            </button>
          )}
        </div>
      )}

      {/* คำอ่านจากคลังความหมายไพ่ (AI ไม่ว่าง) — บอกผู้ใช้ตรง ๆ พร้อมปุ่มให้แม่หมอ AI อ่านไพ่ชุดเดิมอีกรอบ */}
      {isFallback && !isStreaming && !errorMsg && <FallbackNotice isEn={isEnglish} onRetry={onRetry} />}

      {/* สลับ อ่านทีละใบ / ภาพรวม (แท็บ WAI-ARIA · A5-11) */}
      <div
        role="tablist"
        aria-label={isEnglish ? "Tarot interpretation sections" : "ส่วนแสดงผลคำทำนาย"}
        onKeyDown={(e) => {
          // A5-11: แพตเทิร์น tab ของ WAI-ARIA — ลูกศร/Home/End สลับแท็บแล้วย้ายโฟกัสตาม
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
          e.preventDefault();
          const next: "card" | "summary" =
            e.key === "Home" ? "card" : e.key === "End" ? "summary" : activeTab === "card" ? "summary" : "card";
          setActiveTab(next);
          document.getElementById(`chamber-tab-${next}`)?.focus();
        }}
        className="v2-sr-tabs"
      >
        <button
          type="button"
          role="tab"
          id="chamber-tab-card"
          aria-selected={activeTab === "card"}
          // A5-11: แผงถูกเรนเดอร์เฉพาะแท็บที่เลือก — ชี้ aria-controls เฉพาะตอนแผงมีอยู่จริง
          aria-controls={activeTab === "card" ? "chamber-panel-card" : undefined}
          tabIndex={activeTab === "card" ? 0 : -1}
          onClick={() => setActiveTab("card")}
          className="v2-sr-tab"
        >
          {isEnglish ? "Card by card" : "อ่านทีละใบ"}
          <small>
            {activeCardIndex + 1}/{totalCards}
          </small>
        </button>
        <button
          type="button"
          role="tab"
          id="chamber-tab-summary"
          aria-selected={activeTab === "summary"}
          aria-controls={activeTab === "summary" ? "chamber-panel-summary" : undefined}
          tabIndex={activeTab === "summary" ? 0 : -1}
          onClick={() => setActiveTab("summary")}
          className="v2-sr-tab"
        >
          {isEnglish ? "Overview" : "ภาพรวม"}
          <span className="v2-sr-tab-more">{isEnglish ? " & advice" : " & คำแนะนำ"}</span>
          {reading?.summary && <small className="is-ready">{isEnglish ? "ready" : "พร้อม"}</small>}
        </button>
      </div>

      {/* TAB 1: อ่านทีละใบ — หน้าหนังสือ */}
      {activeTab === "card" && (
        <div id="chamber-panel-card" role="tabpanel" aria-labelledby="chamber-tab-card" tabIndex={0} className="v2-sr-panel">
          <article key={activeCardIndex} className="v2-sr-page anim-page-transition">
            <div className="v2-sr-art">
              <div className={`v2-sr-art-img${activeDrawnCard?.isReversed ? " is-rev" : ""}`}>
                {cardData?.image ? (
                  <CardImage
                    image={cardData.image}
                    /* ภาพประกอบล้วน — ชื่อไพ่อยู่ใน <h3> ข้าง ๆ (INC-0125) */
                    alt=""
                    className="w-full h-full object-cover object-center tarot-hd-card-image"
                    sizes="(min-width: 640px) 168px, 120px"
                  />
                ) : (
                  <span className="v2-sr-art-none">{isEnglish ? "Not Found" : "ไม่พบข้อมูล"}</span>
                )}
              </div>
              <span className="v2-sr-orient">
                {activeDrawnCard?.isReversed ? (isEnglish ? "Reversed" : "ไพ่กลับหัว") : isEnglish ? "Upright" : "ไพ่หัวตั้ง"}
              </span>
            </div>

            <div className="v2-sr-copy">
              <p className="v2-sr-pos">
                {isEnglish
                  ? `Position ${activeCardIndex + 1} · ${(activeDrawnCard?.position.nameEn || activeDrawnCard?.position.nameTh || "Energy Point").replace(/^\d+\.\s*/, "")}`
                  : `ตำแหน่งที่ ${activeCardIndex + 1} · ${(activeDrawnCard?.position.nameTh || "ตำแหน่งพลังงาน").replace(/^\d+\.\s*/, "")}`}
              </p>
              <h3 className="v2-sr-name">
                {cardData ? (
                  <>
                    {isEnglish ? (cardData.nameEn || cardData.nameTh) : cardData.nameTh}
                    {!isEnglish && cardData.nameEn && <span>{cardData.nameEn}</span>}
                  </>
                ) : (
                  <span className="is-err">
                    {isEnglish ? "Card data not found (Please reload)" : "ไม่พบข้อมูลไพ่ (กรุณากดโหลดใหม่อีกครั้ง)"}
                  </span>
                )}
              </h3>
              {(activeDrawnCard?.position.meaningEn || activeDrawnCard?.position.meaning) && (
                <p className="v2-sr-asks">
                  {isEnglish
                    ? (activeDrawnCard.position.meaningEn || activeDrawnCard.position.meaning)
                    : (activeDrawnCard.position.meaning || activeDrawnCard.position.meaningEn)}
                </p>
              )}
              {keywords.length > 0 && (
                <ul className="v2-sr-kw" aria-label={isEnglish ? "Key themes" : "ความหมายหลัก"}>
                  {keywords.map((kw: string, idx: number) => (
                    <li key={idx}>{kw}</li>
                  ))}
                </ul>
              )}

              {/* ไม่พบข้อมูลไพ่ = ให้โหลดใหม่ ห้ามกุคำอ่าน (กฎเหล็กข้อ 14) */}
              {!cardData && (
                <div className="v2-sr-alert">
                  <span>
                    {isEnglish
                      ? "Card data for this position could not be found. Please reload."
                      : "ไม่พบข้อมูลไพ่สำหรับตำแหน่งนี้ กรุณากดโหลดใหม่อีกครั้ง"}
                  </span>
                  {onRetry && (
                    <button type="button" onClick={onRetry} className="v2-sr-btn is-gold">
                      {isEnglish ? "Reload Reading" : "โหลดใหม่อีกครั้ง"}
                    </button>
                  )}
                </div>
              )}

              <div className="v2-sr-read">
                {(activeCardReading?.headline || activeCardReading?.reading) && (
                  <div className="v2-sr-read-head">
                    {activeCardReading?.headline && <h4>{activeCardReading.headline}</h4>}
                    {activeCardReading?.reading && (
                      <TTSReaderButton
                        textToRead={`${activeCardReading.headline ? activeCardReading.headline + ". " : ""}${activeCardReading.reading}`}
                        personaId={persona.id}
                        className="ml-auto"
                      />
                    )}
                  </div>
                )}
                {activeCardReading?.visualAnchor && (
                  <p className="v2-sr-anchor">
                    {isEnglish ? "On the card: " : "ภาพบนหน้าไพ่: "}
                    {activeCardReading.visualAnchor}
                  </p>
                )}

                {/* P1-M3: คำทำนายทยอยโผล่ทีละก้อนที่สตรีมเข้ามา (ดู StreamingChunkText) */}
                {activeCardReading?.reading ? (
                  <p
                    key={`oracle-${activeCardIndex}`}
                    className="v2-sr-text"
                    /*
                     * ♿ ระหว่างสตรีมต้องเป็น "off" (T-03) — ประกาศครั้งเดียวตอนจบที่โหนดซ่อนด้านล่าง
                     */
                    aria-live="off"
                    aria-label={isEnglish ? "Oracle's interpretation" : "คำทำนายจากแม่หมอ"}
                  >
                    <StreamingChunkText
                      key={`chunk-${activeCardIndex}`}
                      text={activeCardReading.reading}
                      animate={isStreaming && motionSafe}
                    />
                  </p>
                ) : (
                  <p className="v2-sr-wait">
                    {isStreaming
                      ? (isEnglish
                          ? "The oracle is reading this card..."
                          : "แม่หมอกำลังเรียบเรียงคำทำนายของไพ่ใบนี้...")
                      : (isEnglish ? "Awaiting the reading" : "รอการเปิดม่านพยากรณ์")}
                  </p>
                )}

                {/* ♿ ประกาศคำทำนาย **ครั้งเดียว** ตอนสตรีมจบ (T-03) */}
                <p className="sr-only" aria-live="polite" aria-atomic="true">
                  {announcement}
                </p>
              </div>

              {activeCardReading?.reading && cardData && (
                <CardWhyPanel url={insightUrl} order={activeCardIndex} isEnglish={isEnglish} />
              )}
            </div>
          </article>

          {/* ใบก่อน / ใบถัดไป + จุดบอกตำแหน่ง */}
          <nav className="v2-sr-nav" aria-label={isEnglish ? "Cards" : "เลือกไพ่"}>
            <button
              type="button"
              onClick={() => onSelectCardIndex(Math.max(0, activeCardIndex - 1))}
              disabled={activeCardIndex === 0}
              className="v2-sr-btn"
            >
              {isEnglish ? "Previous" : "ใบก่อนหน้า"}
            </button>
            <span className="v2-sr-dots">
              {drawnCards.map((d, i) => {
                const card = d.card || (d.cardIndex !== undefined ? cardByIndex(d.cardIndex) : undefined);
                const label = `${isEnglish ? `Card ${i + 1}` : `ใบที่ ${i + 1}`}${card ? ` (${isEnglish ? card.nameEn || card.nameTh : card.nameTh})` : ""}`;
                return (
                  <button
                    key={d.order}
                    type="button"
                    aria-pressed={activeCardIndex === d.order}
                    aria-label={label}
                    title={label}
                    onClick={() => onSelectCardIndex(d.order)}
                    className="v2-sr-dot"
                  >
                    {i + 1}
                  </button>
                );
              })}
            </span>
            <button
              type="button"
              onClick={() => (activeCardIndex === totalCards - 1 ? setActiveTab("summary") : onSelectCardIndex(Math.min(totalCards - 1, activeCardIndex + 1)))}
              className="v2-sr-btn is-gold"
            >
              {activeCardIndex === totalCards - 1 ? (isEnglish ? "See overview" : "ดูภาพรวม") : isEnglish ? "Next card" : "ใบถัดไป"}
            </button>
          </nav>
        </div>
      )}

      {/* TAB 2: ภาพรวม & คำแนะนำ */}
      {activeTab === "summary" && (
        <div id="chamber-panel-summary" role="tabpanel" aria-labelledby="chamber-tab-summary" tabIndex={0} className="v2-sr-panel">
          {reading?.summary ? (
            <section className="v2-sr-answer">
              <div className="v2-sr-answer-top">
                <p className="v2-sr-answer-k">{isEnglish ? "In short" : "สรุปตรงใจ"}</p>
                {reading.yesNoAnswer && (
                  <span className="v2-sr-yes">
                    {isEnglish
                      ? `Answer: ${YES_NO_DISPLAY_EN[reading.yesNoAnswer] ?? reading.yesNoAnswer}`
                      : `คำตอบ: ${reading.yesNoAnswer}`}
                  </span>
                )}
                <TTSReaderButton
                  textToRead={`${isEnglish ? "Executive Summary and Guidance. " : "บทสรุปคำทำนายและแนวโน้ม. "}${reading.summary || ""}. ${
                    reading.advice ? (isEnglish ? "Actionable guidance: " : "คำแนะนำคือ ") + reading.advice.join(", ") : ""
                  }`}
                  personaId={persona.id}
                  className="ml-auto"
                />
              </div>
              <p className="v2-sr-answer-t">{reading.summary}</p>
              {reading.timing && (
                <p className="v2-sr-timing">
                  {isEnglish ? "Timing: " : "ช่วงเวลา: "}
                  {reading.timing}
                </p>
              )}
            </section>
          ) : (
            <p className="v2-sr-wait">
              {isStreaming
                ? isEnglish
                  ? "The overview appears once every card has been read..."
                  : "ภาพรวมจะขึ้นเมื่อแม่หมออ่านครบทุกใบ..."
                : isEnglish
                  ? "No overview yet"
                  : "ยังไม่มีภาพรวม"}
            </p>
          )}

          {reading?.opening && <blockquote className="v2-sr-quote">{reading.opening}</blockquote>}

          {reading?.connections && (
            <section className="v2-sr-block">
              <h4>{isEnglish ? "How the cards connect" : "ไพ่ทั้งชุดเชื่อมกันอย่างไร"}</h4>
              <p>{reading.connections}</p>
            </section>
          )}

          {reading?.advice && reading.advice.length > 0 && (
            <section className="v2-sr-block">
              <h4>{isEnglish ? "What to do next" : "สิ่งที่ควรทำต่อจากนี้"}</h4>
              <ol className="v2-sr-advice">
                {reading.advice.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ol>
            </section>
          )}

          {/* ✦ มุมที่สอง — ไพ่ชุดเดิมเป๊ะ อ่านโดยแม่หมออีกบุคลิก (ไม่ใช้กับคำอ่านสำรอง) */}
          {readingId && !isStreaming && !isFallback && reading?.summary && (
            <SecondPerspectivePanel
              readingId={readingId}
              original={reading}
              originalPersona={persona}
              positionNames={positionNames}
              isEnglish={isEnglish}
            />
          )}

          {/* ✦ คำอ่านนี้ประกอบจากอะไร + แผนที่ความเชื่อมโยง (ไม่มีตัวเลขความแม่น) */}
          {insightUrl && reading?.summary && (
            <ReadingBasisPanel
              url={insightUrl}
              cardCount={drawnCards.length}
              positionNames={positionNames}
              category={category || "general"}
              basis={basis ?? null}
              hasQuestion={Boolean(question?.trim())}
              isEnglish={isEnglish}
              layout={drawnCards.map((d) => ({ order: d.order, x: d.position.x, y: d.position.y }))}
            />
          )}

          {/* ── ส่วนรอง: ยุบไว้ ผู้ใช้แตะเปิดเอง ── */}
          {allCards.length > 0 && (
            <CollapsibleCard
              title={isEnglish ? "Sacred Oracle Wisdom" : "คำคมพลังใจศักดิ์สิทธิ์"}
              hint={isEnglish ? "Core guiding wisdom synthesized from the spread" : "ข้อคิดนำทางที่กลั่นจากไพ่ทั้งชุด"}
            >
              <OracleMantraCard cards={allCards} drawn={drawnCards} personaNameTh={isEnglish ? (persona.nameEn || persona.nameTh) : persona.nameTh} />
            </CollapsibleCard>
          )}
          {allCards.length > 0 && (
            <CollapsibleCard
              title={isEnglish ? "Elemental Balance Analysis" : "สมดุลพลังงาน 4 ธาตุในผัง"}
              hint={isEnglish ? "Energy current breakdown: Fire · Water · Air · Earth" : "วิเคราะห์คลื่นพลังงาน ไฟ · น้ำ · ลม · ดิน"}
            >
              <ElementalBalanceWidget cards={allCards} drawn={drawnCards} />
            </CollapsibleCard>
          )}

          {/* Provably-Fair Independent Mathematical Verification (ยุบในตัวเอง) */}
          <ProvablyFairPanel
            commitment={proof?.commitment ?? ""}
            proof={proof}
            drawn={drawnCards
              .filter(
                (c): c is typeof c & { cardIndex: number } =>
                  typeof c.cardIndex === "number" && c.cardIndex >= 0 && c.cardIndex < 78
              )
              .map((c) => ({
                order: c.order,
                cardIndex: c.cardIndex,
                isReversed: !!c.isReversed,
              }))}
          />

          {/* ปรึกษาแม่หมอตัวจริง */}
          <section className="v2-sr-human">
            <span>
              <b>{isEnglish ? "Want a human reader to go deeper?" : "อยากคุยเจาะลึกกับแม่หมอตัวจริง?"}</b>
              <small>
                {isEnglish
                  ? "Consult a tarot reader 1-on-1 and bring this spread with you."
                  : "ปรึกษาแม่หมอผู้เชี่ยวชาญแบบตัวต่อตัว พร้อมส่งต่อผลไพ่ชุดนี้ไปคุยต่อได้ทันที"}
              </small>
            </span>
            <Link
              href="/readers"
              onClick={() => trackEvent("reader_consult_click", { source: "stream_end" })}
              className="v2-sr-btn"
            >
              {isEnglish ? "Consult a reader" : "ปรึกษาแม่หมอตัวจริง"}
            </Link>
          </section>
        </div>
      )}

      {/* AI Disclosure Note & Accuracy Rating */}
      <div className="v2-sr-foot">
        <p>
          {isEnglish
            ? "This reading is synthesized with AI from your authentic drawn cards. Provided for reflection, introspection, and spiritual guidance."
            : "คำทำนายนี้ประมวลผลด้วยระบบ AI จากหน้าไพ่ที่คุณเปิดจริง จัดทำขึ้นเพื่อเป็นแนวทางและข้อคิดในการดำเนินชีวิต"}
        </p>
        {!isStreaming && reading?.summary && (
          <AccuracyRatingWidget personaId={persona.id} readingId={readingId || undefined} />
        )}
      </div>
    </div>
  );
};
