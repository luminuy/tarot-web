"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLocale } from "@/lib/i18n";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import {
  PICK_A_CARD_TOPICS,
  type PickACardSlot,
} from "@/data/pick-a-card";
import { TarotCard } from "@/components/card/TarotCard";
import { CardImage } from "@/components/card/CardImage";
import { soundManager } from "@/lib/utils/audio";
import { copyToClipboard } from "@/lib/utils/clipboard";
// ป้ายวันของสำรับประจำวัน — วันนี้ทั้งเว็บเห็นชุดเดียวกัน พรุ่งนี้เปลี่ยนใหม่
import { dayLabel } from "@/lib/pick-a-card/daily";
/*
 * 🔮 ทุกการเปิดไพ่เดินผ่านท่อ AI ท่อเดียวกับทั้งเว็บ (คำสั่งเจ้าของโปรเจกต์ 2026-09-18)
 * กำแพงสมัครสมาชิกและโควตาจึงถูกบังคับ **ที่เซิร์ฟเวอร์** ไม่ใช่ที่เบราว์เซอร์
 */
import { useAiReading } from "@/lib/reading/use-ai-reading";
import { AiReadingPanel } from "@/components/reading/ai/AiReadingPanel";
import { smoothScrollBehavior } from "@/lib/use-motion-safe";
/* 💤 กล่องสิทธิ์/กล่องสมัครสมาชิกโหลดตอนถูกเรียกใช้จริงเท่านั้น (บทเรียนงบบันเดิลของ `/daily`) */
const AccessDialog = React.lazy(() =>
  import("@/components/entitlement/AccessDialog").then((m) => ({ default: m.AccessDialog }))
);
const AuthModal = React.lazy(() =>
  import("@/components/auth/AuthModal").then((m) => ({ default: m.AuthModal }))
);

/** หมวดคำถามที่ส่งให้แม่หมอ — แปลงจากหมวดของหัวข้อ Pick A Card */
const CATEGORY_BY_TOPIC = {
  love: "love",
  career: "work",
  spiritual: "self",
} as const;

export function PickACardClient({ initialTopicSlug }: { initialTopicSlug?: string } = {}) {
  const { isEnglish } = useLocale();

  // Active topic — หน้า `/pick-a-card/<slug>` ส่ง slug มาเพื่อเปิดหัวข้อนั้นตั้งแต่เฟรมแรก
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    () =>
      PICK_A_CARD_TOPICS.find((t) => t.slug === initialTopicSlug)?.id ?? PICK_A_CARD_TOPICS[0].id
  );
  /** อยู่บนหน้าหัวข้อเดี่ยวหรือไม่ — ถ้าใช่ การ์ดหัวข้ออื่นจะเป็นลิงก์ไปหน้าของมันเอง */
  const isTopicPage = Boolean(
    initialTopicSlug && PICK_A_CARD_TOPICS.some((t) => t.slug === initialTopicSlug)
  );
  const activeTopic =
    PICK_A_CARD_TOPICS.find((t) => t.id === selectedTopicId) || PICK_A_CARD_TOPICS[0];

  /*
   * ท่อเปิดไพ่ของรอบนี้ — ไพ่ทั้งสามใบมาจากเซิร์ฟเวอร์เสมอ ไม่มีการจั่วในเบราว์เซอร์อีกแล้ว
   * (เดิมหน้านี้จั่วเองแล้วโชว์คำอ่านที่เขียนไว้ จึงเปิดไพ่ได้โดยไม่ต้องล็อกอินและไม่มี AI เลย)
   */
  const oracle = useAiReading();
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);

  // Selected pile within topic — เก็บ "ช่อง" ที่ผู้ใช้เลือก (ตัวตนของกอง/คริสตัล)
  const [selectedPileId, setSelectedPileId] = useState<string | null>(null);
  const slotIndex = activeTopic.slots.findIndex((p) => p.id === selectedPileId);

  /** ตัวตนของกองที่เลือก (เลข · ชื่อคริสตัล) — เป็นของช่องนี้เสมอ ไม่หมุนตามการจั่ว */
  const selectedSlot: PickACardSlot | null = slotIndex >= 0 ? activeTopic.slots[slotIndex] : null;

  /** ไพ่ที่ "เปิดออกมาจริง" ตามที่เซิร์ฟเวอร์คำนวณ — แหล่งความจริงเดียวของหน้านี้ */
  const drawnCards = oracle.serverCards;

  /** วันของสำรับที่เซิร์ฟเวอร์ใช้จริง (ว่างจนกว่าจะเปิดกองแรกของรอบ) */
  const derivedDetail = oracle.derived?.kind === "pick-a-card" ? oracle.derived : null;

  /**
   * บทเสริมที่เขียนไว้ล่วงหน้าของรอบนี้ — **เซิร์ฟเวอร์ประกอบมาให้แล้ว** ใต้คำอ่านของแม่หมอ
   *
   * เดิมหน้านี้ประกอบเอง จึงต้องแบกคลังคำอ่านทั้ง 8 หัวข้อไว้ในบันเดิลตั้งแต่ไบต์แรก
   * ทั้งที่ผู้ใช้เห็นก็ต่อเมื่อเปิดกองแล้ว (ISSUE-050) ตอนนี้มากับคำตอบของ `/shuffle` แทน
   *
   * ⚠️ ยังต้องเทียบรหัสไพ่ทั้งสามใบกับไพ่ที่เปิดจริงก่อนแสดงเสมอ — ถ้าคลังถูกแก้คนละรอบกับ
   * ตัวคำนวณ ย่อหน้าจะพูดถึงไพ่ที่ไม่ได้อยู่ตรงหน้า = กุไพ่ ผิดกฎเหล็กข้อ 14
   */
  const composed = derivedDetail?.script ?? null;
  const scriptMatchesCards = Boolean(
    composed &&
      drawnCards.length === composed.cards.length &&
      composed.cards.every((item, i) => item.cardId === drawnCards[i]?.id)
  );
  const script = scriptMatchesCards ? composed : null;

  /** ชื่อตำแหน่งของไพ่แต่ละใบ — ใช้ชื่อเฉพาะหัวข้อเมื่อเนื้อหาตรงกับไพ่จริง ไม่งั้นใช้ชื่อกลาง */
  const positionLabels: string[] = script
    ? script.cards.map((item) => (isEnglish ? item.positionEn : item.positionTh))
    : isEnglish
      ? ["Where Things Stand", "What Stays Hidden", "Guidance & Direction"]
      : ["สภาพตอนนี้", "สิ่งที่ซ่อนอยู่", "คำแนะนำและแนวโน้ม"];

  /**
   * 🫱 แถบหัวข้อแบบปัดนิ้ว (มือถือ) — ใช้แพตเทิร์นเดียวกับ "เปิดไพ่ด่วน" บนหน้าแรก
   * บนจอเล็กเป็นแถวเลื่อนที่มี scroll-snap · บน sm ขึ้นไปกลายเป็นตารางเหมือนเดิม
   * จุดบอกตำแหน่งข้างล่างมีเฉพาะจอเล็ก เพราะจอใหญ่เห็นครบทุกใบอยู่แล้ว
   */
  const topicRailRef = useRef<HTMLDivElement | null>(null);
  const [topicIndex, setTopicIndex] = useState(0);

  const handleTopicRailScroll = () => {
    const rail = topicRailRef.current;
    if (!rail) return;
    const cards = rail.querySelectorAll<HTMLElement>("[data-topic-index]");
    if (!cards.length) return;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });
    if (nearest !== topicIndex) setTopicIndex(nearest);
  };

  const scrollTopicIntoView = (index: number, behavior: ScrollBehavior = smoothScrollBehavior()) => {
    const rail = topicRailRef.current;
    if (!rail) return;
    const cards = rail.querySelectorAll<HTMLElement>("[data-topic-index]");
    const card = cards[index];
    if (!card) return;
    // ⚠️ ห้ามใช้ scrollIntoView ตรง ๆ — มันจะเลื่อนหน้าทั้งหน้าตามแนวตั้งด้วยบน iOS
    rail.scrollTo({ left: card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2, behavior });
    setTopicIndex(index);
  };

  /** เปิดหน้ามาให้หัวข้อที่กำลังอ่านอยู่ตรงกลางแถบเสมอ (สำคัญกับหน้าหัวข้อเดี่ยว) */
  useEffect(() => {
    const index = PICK_A_CARD_TOPICS.findIndex((t) => t.id === activeTopic.id);
    if (index >= 0) scrollTopicIntoView(index, "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTopic.id]);

  /*
   * ⛔ เดิมตรงนี้มีตัวจั่วฝั่งเบราว์เซอร์ (`reshuffle` + สำรับประจำวันใน `useEffect`)
   * ถอดออกทั้งหมดในคลื่นที่ 2 — เซิร์ฟเวอร์เป็นผู้คำนวณสำรับประจำวันของแต่ละกองแล้ว
   * (`src/lib/reading/derived-draw.ts`) **ห้ามเอากลับมา** เพราะไพ่ที่เบราว์เซอร์จั่วเอง
   * จะไม่ใช่ไพ่ใบเดียวกับที่แม่หมอกำลังอ่านอยู่ · ผู้ใช้จะเห็นไพ่ชุดหนึ่งแต่ได้ยินคำอ่านของอีกชุด
   */

  // Revealed card indices in current pile (0, 1, 2)
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  // Sync with URL query parameter if provided on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const topicParam = params.get("topic");
      if (topicParam) {
        const matched = PICK_A_CARD_TOPICS.find(
          (t) => t.id === topicParam || t.slug === topicParam
        );
        if (matched) {
          setSelectedTopicId(matched.id);
        }
      }
    }
  }, []);

  const handleSelectTopic = (topicId: string) => {
    soundManager.playCardSelectSound();
    setSelectedTopicId(topicId);
    setSelectedPileId(null);
    setRevealedIndices(new Set());
    oracle.reset();
  };

  /**
   * แตะเลือกกอง ➔ ขอไพ่กับเซิร์ฟเวอร์ แล้วให้แม่หมออ่านสด
   *
   * ไพ่มาจากสำรับประจำวันของกองนั้นซึ่งเซิร์ฟเวอร์คำนวณเอง — หน้าเว็บส่งไปแค่
   * "หัวข้อไหน กองที่เท่าไร" เท่านั้น (`derive`) ไม่ได้ส่งเลขไพ่ และส่งไม่ได้ด้วย
   */
  const runPile = async (topicId: string, slot: number) => {
    const topic = PICK_A_CARD_TOPICS.find((t) => t.id === topicId) ?? activeTopic;
    const pile = topic.slots[slot];
    const crystal = isEnglish ? pile?.crystalEn : pile?.crystalTh;
    const question = isEnglish
      ? `Pick A Card — ${topic.titleEn} (Pile ${pile?.number ?? slot + 1}${crystal ? `: ${crystal}` : ""})`
      : `เลือกกองไพ่ — ${topic.titleTh} (กองที่ ${pile?.number ?? slot + 1}${crystal ? ` · ${crystal}` : ""})`;

    await oracle.run({
      spreadId: "pick-a-card",
      category: CATEGORY_BY_TOPIC[topic.category],
      question,
      /*
       * ⚠️ `resolveCards: false` — หน้านี้ใช้ชื่อ/ภาพไพ่ที่เซิร์ฟเวอร์แปลงมาให้ใน `serverCards`
       * อยู่แล้ว การให้ท่อแปลงให้อีกทีจะลาก `@/data/cards` (พ่วงคำทำนายอังกฤษ ≈126 KB) เข้ามาเปล่า ๆ
       */
      resolveCards: false,
      derive: { kind: "pick-a-card", topicId: topic.id, slotIndex: slot },
    });
  };

  const handleSelectPile = (pile: PickACardSlot) => {
    soundManager.playCardSelectSound();
    setSelectedPileId(pile.id);
    setRevealedIndices(new Set());
    const slot = activeTopic.slots.findIndex((p) => p.id === pile.id);
    if (slot >= 0) void runPile(activeTopic.id, slot);
  };

  const handleRevealCard = (index: number) => {
    soundManager.playCardFlipSound();
    setRevealedIndices((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  const handleRevealAll = () => {
    soundManager.playCardFlipSound();
    setRevealedIndices(new Set([0, 1, 2]));
  };

  const handleResetPile = () => {
    soundManager.playCardSelectSound();
    setSelectedPileId(null);
    setRevealedIndices(new Set());
    // ยกเลิกสตรีมของกองเดิมด้วย ไม่งั้นคำอ่านของกองก่อนหน้าจะไหลมาทับกองใหม่
    oracle.reset();
  };

  const handleCopyReading = async () => {
    if (!selectedSlot || drawnCards.length === 0) return;
    const crystal = isEnglish ? selectedSlot.crystalEn : selectedSlot.crystalTh;
    const topic = isEnglish ? activeTopic.titleEn : activeTopic.titleTh;
    const pileLabel = isEnglish ? `Pile ${selectedSlot.number}` : `กองที่ ${selectedSlot.number}`;

    /*
     * คัดลอก "ของจริงที่อยู่บนหน้าจอ" — ชื่อไพ่ที่เซิร์ฟเวอร์เปิด + คำอ่านของแม่หมอเท่าที่มาถึงแล้ว
     * (เดิมคัดลอกคำอ่านที่เขียนไว้ล่วงหน้า ซึ่งตอนนี้เป็นแค่บทเสริม ไม่ใช่คำอ่านหลักอีกแล้ว)
     */
    const cardLines = drawnCards
      .map((card, i) => `${positionLabels[i] ?? i + 1}: ${isEnglish ? card.nameEn : `${card.nameTh} (${card.nameEn})`}`)
      .join("\n");
    const oracleText = [oracle.state.reading?.opening, oracle.state.reading?.summary]
      .filter(Boolean)
      .join("\n\n");
    const closing = isEnglish
      ? "Open your own cards: https://seertarot.net/en/pick-a-card"
      : "เปิดไพ่พยากรณ์: https://seertarot.net/pick-a-card";

    const textToCopy = `SeerTarot · Pick A Card (${topic})\n${pileLabel}: ${crystal}\n\n${cardLines}${
      oracleText ? `\n\n${oracleText}` : ""
    }\n\n${closing}`;

    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const crystalColorMap: Record<number, { bg: string; border: string; text: string; dot: string }> = {
    1: { bg: "bg-rose-950/20", border: "border-rose-300/40", text: "text-rose-200", dot: "bg-rose-300" },
    2: { bg: "bg-purple-950/20", border: "border-purple-300/40", text: "text-purple-200", dot: "bg-purple-300" },
    3: { bg: "bg-amber-950/20", border: "border-amber-300/40", text: "text-amber-200", dot: "bg-amber-300" },
    4: { bg: "bg-blue-950/20", border: "border-blue-300/40", text: "text-blue-200", dot: "bg-blue-300" },
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* ── 1. Topic Navigation Tabs ── */}
      <nav aria-label={isEnglish ? "Pick A Card Topics" : "หัวข้อเลือกกองไพ่"} className="space-y-3">
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line" />
          <span className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-muted whitespace-nowrap">
            {isEnglish ? "Select Sacred Topic" : "เลือกหัวข้อพยากรณ์"}
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line" />
        </div>

        {/*
          การ์ดหัวข้อพร้อมภาพไพ่ 1909 RWS ประจำหัวข้อ
          จอเล็ก = แถวปัดนิ้วที่มี scroll-snap (เห็นใบถัดไปโผล่ขอบเป็นสัญญาณว่าปัดได้)
          จอ sm ขึ้นไป = ตารางเหมือนเดิม ไม่มีการเลื่อนแนวนอน
        */}
        <div
          ref={topicRailRef}
          onScroll={handleTopicRailScroll}
          className="flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth px-4 -mx-4 pb-1 sm:grid sm:grid-cols-4 sm:gap-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible"
        >
          {PICK_A_CARD_TOPICS.map((topic, topicCardIndex) => {
            const isActive = topic.id === activeTopic.id;
            /**
             * การ์ดหัวข้อเป็น "แนวตั้ง" ตามสัดส่วนไพ่ (ภาพบน ชื่อล่าง)
             * ของเดิมเป็นแถบนอนยาวที่ภาพเล็กนิดเดียว เจ้าของบอกว่าดูยาวและไม่ได้สัดส่วน
             */
            const cardClass = `group relative flex flex-col w-[36vw] max-w-[136px] shrink-0 snap-center sm:w-full sm:max-w-[140px] sm:mx-auto p-2 rounded-xl border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
              isActive
                ? "altar-panel-active"
                : "glass-tile"
            }`;

            /**
             * บนหน้าหัวข้อเดี่ยว การ์ดอื่นเป็น "ลิงก์จริง" ไปหน้าของหัวข้อนั้น
             * (ลิงก์ภายในช่วยให้ Google เดินครบทุกหน้า และผู้ใช้แชร์ URL ตรงหัวข้อได้)
             * บนหน้ารวม การ์ดยังเป็นปุ่มสลับในที่เดิมเพื่อความไวเหมือนเดิม
             */
            const inner = (
              <>
                {/* ภาพไพ่ประจำหัวข้อ เต็มความกว้างการ์ดตามสัดส่วนไพ่จริง 2:3 */}
                <span
                  className={`relative block w-full aspect-[2/3] rounded-lg overflow-hidden border bg-canvas transition-colors ${
                    isActive ? "border-gold/70" : "border-line/60 group-hover:border-gold/50"
                  }`}
                >
                  <CardImage
                    cardId={topic.coverCardId}
                    alt=""
                    sizes="(min-width: 640px) 132px, 33vw"
                    loading="lazy"
                    className={`w-full h-full object-cover transition-[filter,opacity] duration-200 ${
                      isActive ? "" : "opacity-75 saturate-[0.9] group-hover:opacity-100"
                    }`}
                  />
                </span>

                <span className="block px-0.5 pt-1.5 pb-0.5 text-center">
                  {/* ⚠️ ห้ามใส่ `block` คู่กับ `line-clamp-*` — ทั้งคู่สั่ง display ชนกัน แล้วการตัดบรรทัดจะไม่ทำงาน */}
                  <span
                    className={`text-[11.5px] font-serif-th leading-[1.65] line-clamp-2 min-h-[38px] transition-colors ${
                      isActive ? "font-bold text-gold-ink" : "font-semibold text-ink group-hover:text-gold-ink"
                    }`}
                  >
                    {isEnglish ? topic.titleEn : topic.titleTh}
                  </span>
                  <span className="block text-[9.5px] font-mono uppercase tracking-[0.12em] text-muted mt-0.5">
                    {isEnglish ? `${topic.slots.length} Piles` : `${topic.slots.length} กองไพ่`}
                  </span>
                </span>

                {isActive && (
                  <span
                    className="absolute -bottom-px left-1/2 -translate-x-1/2 h-[2px] w-10 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent"
                    aria-hidden="true"
                  />
                )}
              </>
            );

            if (isTopicPage) {
              return (
                <Link
                  key={topic.id}
                  data-topic-index={topicCardIndex}
                  href={`/pick-a-card/${topic.slug}`}
                  // ⛔ ห้ามเปิด prefetch — บทเรียน INC-0106
                  prefetch={false}
                  className={cardClass}
                  aria-current={isActive ? "page" : undefined}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <button
                key={topic.id}
                data-topic-index={topicCardIndex}
                onClick={() => {
                  scrollTopicIntoView(topicCardIndex);
                  handleSelectTopic(topic.id);
                }}
                className={cardClass}
                aria-pressed={isActive}
              >
                {inner}
              </button>
            );
          })}
        </div>

        {/*
          จุดบอกตำแหน่งของแถบหัวข้อ — เฉพาะจอเล็กที่เห็นทีละใบ
          ⚠️ ห่อจุดด้วยปุ่มขนาด 24px แล้วไม่ใส่ gap (แพตเทิร์นเดียวกับหน้าแรก)
          เพื่อให้พื้นที่กดผ่านเกณฑ์โดยที่ตัวจุดยังเล็กเท่าเดิม
        */}
        <div className="flex sm:hidden items-center justify-center">
          {PICK_A_CARD_TOPICS.map((topic, index) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => scrollTopicIntoView(index)}
              aria-label={
                isEnglish
                  ? `Show topic: ${topic.titleEn}`
                  : `เลื่อนไปที่หัวข้อ ${topic.titleTh}`
              }
              className="grid h-6 min-w-6 place-items-center focus:outline-none"
            >
              <span
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                  topicIndex === index ? "w-5 bg-gold-ink" : "w-1.5 bg-line"
                }`}
              />
            </button>
          ))}
        </div>
      </nav>

      {/* ── 2. Current Topic Header ── */}
      <header className="text-center max-w-2xl mx-auto space-y-2.5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif-th font-bold text-ink leading-tight">
          {isEnglish ? activeTopic.titleEn : activeTopic.titleTh}
        </h1>
        <p className="text-sm sm:text-base font-serif-th text-muted leading-relaxed">
          {isEnglish ? activeTopic.descriptionEn : activeTopic.descriptionTh}
        </p>
      </header>

      {/* ── 3. Main Altar: 4 Piles View vs. Revealed Pile View ── */}
      {!selectedSlot ? (
        <section
          aria-label={isEnglish ? "Card Piles Altar" : "แท่นบูชาเลือกกองไพ่"}
          className="space-y-6 pt-2"
        >
          <div className="text-center">
            <div className="glass-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-serif-th text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" aria-hidden="true" />
              <span>
                {isEnglish
                  ? "Choose 1 of 4 piles that resonates strongest with you"
                  : "เลือก 1 ใน 4 กองไพ่ที่ดึงดูดสายตาและจิตใจคุณมากที่สุด"}
              </span>
            </div>
            <p className="mt-2 text-[11.5px] font-serif-th text-muted leading-[1.7]">
              {/*
                สำรับของแต่ละวันคำนวณฝั่งเซิร์ฟเวอร์ (เวลาไทย) หน้าเว็บจึงไม่รู้ว่าวันนี้ได้ชุดไหน
                จนกว่าจะเปิดกองแรก — ข้อความตรงนี้ต้องเป็นข้อความเดียวทั้งก่อนและหลัง hydration
                ไม่งั้น HTML ที่เสิร์ฟจากขอบกับรอบแรกของ hydration จะไม่ตรงกัน
              */}
              {isEnglish
                ? "Every pile holds a different spread, and the whole set changes at midnight Thai time."
                : "ทุกกองให้ไพ่คนละชุด และสำรับทั้งหมดเปลี่ยนใหม่ทุกเที่ยงคืนตามเวลาไทย"}
            </p>
          </div>

          {/*
            แท่นกองไพ่ 4 กอง — จอเล็กเป็นแถวปัดนิ้วแบบเดียวกับแถบหัวข้อและหน้าแรก
            ได้การ์ดใหญ่ขึ้นเต็มตา และเห็นกองถัดไปโผล่ขอบเป็นสัญญาณว่าปัดต่อได้
          */}
          <div className="flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth px-4 -mx-4 pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible">
            {activeTopic.slots.map((pile) => {
              const styling = crystalColorMap[pile.number] || crystalColorMap[1];
              return (
                <div
                  key={pile.id}
                  onClick={() => handleSelectPile(pile)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectPile(pile);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="altar-card-porcelain group relative flex flex-col items-center text-center w-[62vw] max-w-[240px] shrink-0 snap-center sm:w-auto sm:max-w-none p-4 sm:p-5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label={
                    isEnglish
                      ? `Select Pile ${pile.number}: ${pile.crystalEn}`
                      : `เลือกกองที่ ${pile.number}: ${pile.crystalTh}`
                  }
                >
                  {/* Number & Crystal Badge */}
                  <div className="glass-chip flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium text-ink mb-4">
                    <span className={`w-1.5 h-1.5 rounded-full ${styling.dot}`} aria-hidden="true" />
                    <span>{isEnglish ? `Pile ${pile.number}` : `กองที่ ${pile.number}`}</span>
                  </div>

                  {/*
                    3D Stacked Deck — ใช้หลังไพ่ชุดเดียวกับทั้งเว็บ (`.card-back-pattern`)
                    ⛔ ห้ามวาดหลังไพ่ขึ้นมาใหม่เอง: เดิมกองนี้ใช้ `bg-[#1e1b18]` + ตัวหนังสือ
                    "SEER 1909 / TAROT" ซึ่งไม่ใช่หลังไพ่ของบ้านนี้ (เจ้าของทักว่า "หลังไพ่ไม่เหมือนเรา")
                    ลายจริงอยู่ที่ `.card-back-pattern` ใน globals.css — ตัวเดียวกับ TarotCard.tsx
                  */}
                  <div className="relative w-28 h-44 sm:w-32 sm:h-48 my-2 flex items-center justify-center">
                    {/* Background Stack Layers */}
                    <div
                      className="absolute inset-0 rounded-lg card-back-pattern border-2 border-line-warm/40 transform translate-x-2 translate-y-2 opacity-45"
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-0 rounded-lg card-back-pattern border-2 border-line-warm/50 transform translate-x-1 translate-y-1 opacity-70"
                      aria-hidden="true"
                    />
                    {/* Top Card Back — ลายเดียวกับไพ่คว่ำหน้าทุกใบในเว็บ */}
                    <div className="relative w-full h-full rounded-lg card-back-pattern border-2 border-line-warm/60 p-3 flex flex-col items-center justify-between shadow-md group-hover:scale-105 transition-transform duration-200">
                      <div className="w-full flex justify-center items-center opacity-85">
                        <span className="text-[9px] sm:text-[10px] font-serif-th text-surface tracking-[0.18em] uppercase font-bold whitespace-nowrap">
                          Sacred Oracle
                        </span>
                      </div>
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-line-warm bg-ink-deep/90 flex items-center justify-center text-sm font-serif-th font-bold text-surface">
                        {pile.number}
                      </div>
                      <div className="w-full flex justify-center items-center opacity-60">
                        <div className="w-12 h-0.5 bg-inset-warm/60 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Crystal Title & Meaning */}
                  <div className="mt-3 space-y-1 w-full">
                    <h2 className="text-sm sm:text-base font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors line-clamp-1">
                      {isEnglish ? pile.crystalEn : pile.crystalTh}
                    </h2>
                    <p className="text-xs font-serif-th text-muted leading-relaxed line-clamp-2">
                      {isEnglish ? pile.crystalDescEn : pile.crystalDescTh}
                    </p>
                  </div>

                  {/* Tap affordance */}
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono text-gold-ink group-hover:underline">
                    <span>{isEnglish ? "TAP TO REVEAL" : "แตะเพื่อเปิดคำทำนาย"}</span>
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* ── 4. Selected Pile & 3-Card Reveal Altar ── */
        <section
          aria-label={isEnglish ? "Revealed Pile Altar" : "แท่นเปิดไพ่ประจำกอง"}
          className="space-y-8"
        >
          {/* Top Bar for Selected Pile */}
          <div className="altar-panel flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="glass-tile w-10 h-10 !rounded-xl flex items-center justify-center text-base font-bold font-serif-th text-gold-ink">
                {selectedSlot?.number}
              </div>
              <div>
                <div className="text-xs font-mono text-muted uppercase tracking-wider">
                  {isEnglish ? `PILE ${selectedSlot?.number}` : `กองที่ ${selectedSlot?.number}`}
                </div>
                <div className="text-base font-serif-th font-bold text-ink leading-[1.7]">
                  {isEnglish ? selectedSlot?.crystalEn : selectedSlot?.crystalTh}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleRevealAll}
                className="glass-tile flex-1 sm:flex-initial min-h-[44px] px-4 py-2 !rounded-xl text-xs font-serif-th text-ink cursor-pointer"
              >
                {isEnglish ? "Reveal All Cards" : "เปิดไพ่ทั้งหมด"}
              </button>
              <button
                onClick={handleResetPile}
                className="glass-tile flex-1 sm:flex-initial min-h-[44px] px-4 py-2 !rounded-xl text-xs font-serif-th text-muted hover:text-ink cursor-pointer"
              >
                {isEnglish ? "Choose Another Pile" : "เลือกกองอื่น"}
              </button>
            </div>
          </div>

          {/*
            ยังไม่ได้ไพ่จากเซิร์ฟเวอร์ — อาจกำลังรอ หรือถูกกำแพงสมาชิกกั้นไว้
            ⚠️ ห้ามวาดไพ่สำรองขึ้นมาระหว่างรอเด็ดขาด (กฎเหล็กข้อ 14) หน้าจอนี้จึงมีแต่ข้อความ
          */}
          {drawnCards.length === 0 ? (
            <div className="altar-card-porcelain p-6 sm:p-8 text-center space-y-4">
              <p className="text-sm sm:text-base font-serif-th text-ink leading-relaxed">
                {oracle.isPreparing
                  ? isEnglish
                    ? "Connecting to the Oracle…"
                    : "กำลังเชื่อมสัญญาณกับแม่หมอ…"
                  : oracle.state.error
                    ? oracle.state.error
                    : isEnglish
                      ? "Sign in to open this pile — the Oracle reads every pile personally."
                      : "เข้าสู่ระบบก่อนเปิดกองนี้ แม่หมอจะอ่านไพ่ให้สดทุกกอง"}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (slotIndex >= 0) void runPile(activeTopic.id, slotIndex);
                  }}
                  disabled={oracle.isPreparing}
                  className="btn-gold-glass w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-serif-th font-semibold disabled:opacity-60 disabled:cursor-wait cursor-pointer"
                >
                  {isEnglish ? "Try again" : "ลองอีกครั้ง"}
                </button>
                <button
                  type="button"
                  onClick={handleResetPile}
                  className="glass-tile w-full sm:w-auto min-h-[44px] px-5 py-2.5 !rounded-xl text-xs font-serif-th text-muted hover:text-ink cursor-pointer"
                >
                  {isEnglish ? "Choose Another Pile" : "เลือกกองอื่น"}
                </button>
              </div>
            </div>
          ) : (
            <>
          {/* 3 Authentic Rider-Waite Cards (Manual Reveal) */}
          <div className="space-y-3">
            <div className="text-center text-xs font-serif-th text-muted">
              {isEnglish
                ? "Tap each card to flip it — swipe sideways for the next card"
                : "แตะที่ตัวไพ่เพื่อพลิกดูหน้าไพ่ และปัดไปด้านข้างเพื่อดูใบถัดไป"}
            </div>

            {/*
              ไพ่ 3 ใบของรอบนี้ — จอเล็กเป็นแถวปัดนิ้วแบบเดียวกับแถบหัวข้อและแท่นกองไพ่
              เดิมเรียงลงล่างทีละใบ ต้องเลื่อนยาวกว่าจะครบสามใบ

              ⚠️ ไพ่พลิกด้วย 3D (perspective + rotateY) จึงต้องเผื่อช่องว่างบน/ล่าง (pt/pb)
              ให้เงาและมุมไพ่ตอนพลิกไม่ถูกขอบกล่องเลื่อนเฉือน — ห้ามลด padding ชุดนี้ลง
            */}
            <div className="flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth px-4 -mx-4 pt-1 pb-3 sm:grid sm:grid-cols-3 sm:gap-5 sm:justify-items-center sm:mx-0 sm:px-0 sm:pt-0 sm:pb-0 sm:overflow-visible">
              {drawnCards.map((card, idx) => {
                const isFlipped = revealedIndices.has(idx);
                const positionLabel = positionLabels[idx] ?? "";
                const isReversed = Boolean(oracle.rawDrawn[idx]?.isReversed);

                return (
                  <div
                    key={`${selectedSlot.id}-card-${idx}-${card.id}`}
                    /*
                      แต่ละใบมี "ช่องของตัวเอง" — กรอบบาง ๆ พร้อมพื้นหลังอ่อน
                      ทำให้ไพ่ดูเป็นสัดเป็นส่วนแทนที่จะลอยติดกันเป็นพืด
                    */
                    className="glass-tile flex flex-col items-center space-y-2.5 w-[66vw] max-w-[212px] shrink-0 snap-center sm:w-full p-3 !rounded-2xl"
                  >
                    {/* Position Label Tag */}
                    <div className="glass-chip px-3 py-1 text-[11.5px] font-serif-th text-muted font-medium text-center truncate w-full">
                      {positionLabel}
                    </div>

                    {/* 3D Tarot Card */}
                    <div className="w-[140px] h-[238px] sm:w-[150px] sm:h-[255px]">
                      <TarotCard
                        card={{ id: card.id }}
                        isReversed={isReversed}
                        isRevealed={isFlipped}
                        onClick={() => handleRevealCard(idx)}
                        size="responsive"
                        className="w-full h-full"
                        imageSizes="(min-width: 640px) 150px, 140px"
                      />
                    </div>

                    {/* Hint text if not flipped */}
                    {!isFlipped && (
                      <span className="text-[11px] font-mono text-muted animate-pulse">
                        {isEnglish ? "TAP TO FLIP" : "แตะเพื่อเปิด"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ป้ายสำรับประจำวันที่เซิร์ฟเวอร์ใช้จริง */}
            {derivedDetail && (
              <p className="text-center text-[11.5px] font-serif-th text-muted leading-[1.7]">
                {isEnglish
                  ? `Today's deck for ${dayLabel(derivedDetail.dayKey, true)} — every pile changes at midnight Thai time.`
                  : `สำรับประจำวันที่ ${dayLabel(derivedDetail.dayKey, false)} ทุกกองเปลี่ยนใหม่เที่ยงคืนตามเวลาไทย`}
              </p>
            )}
          </div>

          {/* ── 5. Detailed Reading Interpretation ── */}
          {revealedIndices.size > 0 && (
            <article
              aria-label={isEnglish ? "Card Pile Reading" : "คำทำนายประจำกองไพ่"}
              className="altar-panel p-5 sm:p-8 space-y-6"
            >
              {/*
                คำอ่านหลักมาจากแม่หมอ AI เสมอ — ขึ้นเมื่อผู้ใช้พลิกครบทั้งสามใบ
                (กฎเหล็กข้อ 4: ไพ่ต้องถูกเปิดด้วยมือผู้ใช้ก่อน ถึงจะเฉลยคำอ่านของใบนั้นได้)
              */}
              {revealedIndices.size < drawnCards.length ? (
                <p className="text-sm font-serif-th text-muted text-center leading-relaxed">
                  {isEnglish
                    ? "Flip all three cards to hear the Oracle's full reading."
                    : "พลิกไพ่ให้ครบทั้งสามใบ เพื่อฟังคำอ่านเต็มจากแม่หมอ"}
                </p>
              ) : (
                <AiReadingPanel
                  state={oracle.state}
                  isEn={isEnglish}
                  onRetry={() => {
                    // A3-10: อ่านกองเดิมซ้ำโดยไม่เปิดเซสชันใหม่ (ไม่หักสิทธิ์ซ้ำ)
                    void oracle.retryRead().then((ok) => {
                      if (!ok && slotIndex >= 0) void runPile(activeTopic.id, slotIndex);
                    });
                  }}
                  cardLabels={positionLabels}
                  title={isEnglish ? "The Oracle Reads Your Pile" : "คำอ่านจากแม่หมอ"}
                />
              )}

              {/*
                บทเสริมที่เขียนไว้ล่วงหน้าของกองนี้ — อยู่ "ใต้" คำอ่านของแม่หมอเสมอ
                และแสดงได้เฉพาะเมื่อรหัสไพ่ตรงกับไพ่ที่เซิร์ฟเวอร์เปิดจริงทั้งสามใบ (ดู `script`)
              */}
              {script && (
                <div className="space-y-6 pt-2 border-t border-line">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-gold-ink uppercase tracking-wider">
                      {isEnglish ? "CORE ENERGY" : "พลังงานหลักประจำกอง"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-serif-th font-bold text-ink leading-snug">
                      {script.theme}
                    </h2>
                    <p className="text-sm sm:text-base font-serif-th text-muted leading-relaxed pt-1">
                      {script.overview}
                    </p>
                  </div>

                  {/* คำอธิบายรายใบ — เดินตามไพ่ที่เปิดจริงของรอบนี้ */}
                  <div className="space-y-4">
                    {script.cards.map((item, idx) =>
                      revealedIndices.has(idx) ? (
                        <div
                          key={`${item.cardId}-body-${idx}`}
                          className="glass-tile p-4 !rounded-xl space-y-1"
                        >
                          <h3 className="text-xs font-mono text-gold-ink uppercase tracking-wider">
                            {`${idx + 1}. ${isEnglish ? item.positionEn : item.positionTh}`}
                          </h3>
                          <p className="text-xs sm:text-sm font-serif-th text-ink leading-relaxed">
                            {script.bodies[idx]}
                          </p>
                        </div>
                      ) : null
                    )}
                  </div>

                  {/* Affirmation Frame */}
                  {revealedIndices.size === drawnCards.length && (
                    <div className="altar-card-porcelain p-4 sm:p-5 text-center space-y-1.5">
                      <div className="text-[10.5px] font-mono text-gold-ink uppercase tracking-[0.18em]">
                        {isEnglish ? "AFFIRMATION FOR YOUR SOUL" : "ข้อคิดเตือนใจประจำกองไพ่"}
                      </div>
                      <p className="text-sm sm:text-base font-serif-th italic font-medium text-ink">
                        “{script.affirmation}”
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons & Deep Link CTA */}
              <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={handleCopyReading}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-inset hover:bg-inset/80 border border-line text-xs font-serif-th text-ink transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-muted"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>
                    {copied
                      ? isEnglish
                        ? "Copied to Clipboard!"
                        : "คัดลอกคำทำนายแล้ว"
                      : isEnglish
                        ? "Copy Reading"
                        : "คัดลอกคำทำนาย"}
                  </span>
                </button>

                <Link
                  href={`/read/${script?.targetSpreadId ?? "three-card"}`}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-surface-dark text-canvas border border-line text-xs sm:text-sm font-serif-th font-semibold hover:border-gold transition-colors flex items-center justify-center gap-2"
                >
                  <span>
                    {isEnglish
                      ? "Consult AI Oracle for Deep Spread"
                      : "เปิดไพ่เจาะลึกเต็มรูปแบบกับแม่หมอ AI"}
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          )}
            </>
          )}
        </section>
      )}

      {/* ด่านความปลอดภัย: สัญญาณวิกฤต ➔ สายด่วน (กฎเหล็กข้อ 6) */}
      {oracle.crisisMessage && (
        <div className="rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-ink whitespace-pre-line">
          {oracle.crisisMessage}
        </div>
      )}

      {/* กำแพงสิทธิ์ — เซิร์ฟเวอร์เป็นผู้ตัดสิน หน้าเว็บแค่เล่าให้ฟัง */}
      {(oracle.gate !== null || authMode !== null) && (
        <React.Suspense fallback={null}>
          <AccessDialog
            reason={oracle.gate}
            onClose={oracle.clearGate}
            onSignup={() => {
              oracle.clearGate();
              setAuthMode("signup");
            }}
            onSignin={() => {
              oracle.clearGate();
              setAuthMode("signin");
            }}
            onBuyCredits={() => {
              oracle.clearGate();
              window.location.href = "/account";
            }}
          />
          <AuthModal
            isOpen={authMode !== null}
            onClose={() => setAuthMode(null)}
            initialMode={authMode ?? "signin"}
            fromEntitlementWall
          />
        </React.Suspense>
      )}
    </div>
  );
}
