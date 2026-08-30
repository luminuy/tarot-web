"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPREADS, type Spread } from "@/data/spreads";
import { PERSONAS, type Persona } from "@/data/personas";
import type { Category } from "@/data/cards/types";
import { cardByIndex } from "@/data/cards";
import type { Reading } from "@/lib/schema/reading";
import { ShuffleRitual } from "@/components/deck/ShuffleRitual";
import { InteractiveCardFan } from "@/components/deck/InteractiveCardFan";
import { SpreadBoard, type DrawnSlotCard } from "@/components/spread/SpreadBoard";
import { SpreadCardSelector } from "@/components/spread/SpreadCardSelector";
import { PersonaCardSelector } from "@/components/reading/PersonaCardSelector";
import { IntentionAltarInput } from "@/components/reading/IntentionAltarInput";
import { RitualStepProgress, type RitualStep } from "@/components/ui/RitualStepProgress";
import { StreamReader } from "@/components/reading/StreamReader";
import { ShareModal } from "@/components/reading/ShareModal";
import { ReadingHistoryModal } from "@/components/history/ReadingHistoryModal";
import { TarotEncyclopediaModal } from "@/components/encyclopedia/TarotEncyclopediaModal";
import { CardZoomModal } from "@/components/card/CardZoomModal";
import { MysticAltarCanvas } from "@/components/ui/MysticAltarCanvas";
import { QuickStartWelcome } from "@/components/onboarding/QuickStartWelcome";
import { soundManager } from "@/lib/utils/audio";
import { saveReading } from "@/lib/utils/history";

export default function TarotPage() {
  // true เมื่อผ่านหน้าเริ่มต้นแบบเร็ว (QuickStartWelcome) แล้ว ไม่ว่าจะเลือกครบ
  // หรือกด "ข้าม" — ควบคุมแค่ว่าจะโชว์ welcome หรือ step tracker เดิม ไม่ใช่ RitualStep
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState<RitualStep>("SPREAD_SELECT");

  // Modals state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<DrawnSlotCard | null>(null);
  const [isSoundActive, setIsSoundActive] = useState(true);

  // Selection state
  const [selectedSpread, setSelectedSpread] = useState<Spread>(SPREADS[3]); // Default: 3-card
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]); // Default: warm
  const [selectedCategory, setSelectedCategory] = useState<Category>("general");
  const [question, setQuestion] = useState("");
  const [nickname, setNickname] = useState("");
  const [situation, setSituation] = useState("");

  // Reading session state
  const [readingId, setReadingId] = useState<string | null>(null);
  const [commitment, setCommitment] = useState<string>("");
  const [clientSeed, setClientSeed] = useState<string>("");
  const [proof, setProof] = useState<{ serverSeed?: string; clientSeed?: string; commitment?: string }>({});

  // Interactive Card Picking state
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnSlotCard[]>([]);
  const [revealedOrders, setRevealedOrders] = useState<number[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);

  // Streaming AI state
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [readingResult, setReadingResult] = useState<Partial<Reading> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsSoundActive(soundManager.isEnabled());
  }, []);

  // Step 1 -> Step 2: Start Reading Session
  const handleStartSession = async () => {
    const trimmedNickname = nickname.trim();
    const trimmedQuestion = question.trim();

    if (!trimmedNickname) {
      setErrorMsg("กรุณาระบุนามหรือชื่อเล่นของคุณก่อนเข้าสู่พิธี");
      return;
    }

    if (!trimmedQuestion) {
      setErrorMsg("กรุณาจารึกคำอธิษฐานหรือแตะเลือกไพ่คำถามก่อนเข้าสู่พิธี");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    soundManager.playCardSelectSound();

    try {
      const res = await fetch("/api/reading/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadId: selectedSpread.id,
          question: trimmedQuestion,
          personaId: selectedPersona.id,
          nickname: trimmedNickname,
          category: selectedCategory,
          intake: { situation: situation.trim() || undefined },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถเริ่มพิธีได้");

      const sessionReadingId = data.readingId || data.id;
      setReadingId(sessionReadingId);
      setCommitment(data.commitment || "");
      setClientSeed(data.clientSeed || "");
      setCurrentStep("SHUFFLE");
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเริ่มพิธี");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3: Shuffle Animation Finished
  const handleShuffleComplete = (finalClientSeed: string) => {
    if (finalClientSeed) setClientSeed(finalClientSeed);
    soundManager.playShuffleSound();
    setCurrentStep("PICK_CARDS");
  };

  // Step 3: Pick a Card from Fan (Self-Directed Card Picking)
  const handlePickCard = (fanIndex: number) => {
    if (pickedIndices.includes(fanIndex)) return;

    const newPicked = [...pickedIndices, fanIndex];
    setPickedIndices(newPicked);

    // If picked all required cards for this spread, submit to server
    if (newPicked.length >= selectedSpread.positions.length) {
      handleFinalizePickedCards(newPicked);
    }
  };

  // Submit picked indices to backend shuffle endpoint
  const handleFinalizePickedCards = async (finalIndices: number[]) => {
    const activeId = readingId;
    if (!activeId) {
      setErrorMsg("ไม่พบข้อมูลเซสชัน กรุณากดเริ่มใหม่");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // Gentle pause for pick animation
      await new Promise((r) => setTimeout(r, 450));

      const res = await fetch(`/api/reading/${activeId}/shuffle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientSeed,
          pickedIndices: finalIndices,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถจัดสำรับไพ่ได้");

      const enrichedCards: DrawnSlotCard[] = (data.drawn || []).map((d: any) => {
        const fullCard = cardByIndex(d.cardIndex);
        return {
          order: d.order,
          cardIndex: d.cardIndex,
          isReversed: d.isReversed,
          position: selectedSpread.positions[d.order] || {
            index: d.order,
            nameTh: `ตำแหน่งที่ ${d.order + 1}`,
            meaning: "",
          },
          card: {
            id: fullCard.id,
            nameTh: fullCard.nameTh,
            nameEn: fullCard.nameEn,
            image: fullCard.image,
            element: fullCard.element,
            keywords: d.isReversed ? fullCard.keywords.reversed : fullCard.keywords.upright,
          },
        };
      });

      setDrawnCards(enrichedCards);
      setRevealedOrders([0]);
      setActiveCardIndex(0);
      setCurrentStep("READING");

      // Auto start streaming AI interpretation
      startAIStreaming(activeId, enrichedCards);
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการประมวลผลไพ่");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Stream AI interpretation
  const startAIStreaming = async (id: string, cards: DrawnSlotCard[]) => {
    setIsStreaming(true);
    setReadingResult({});
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/reading/${id}/read`, {
        method: "POST",
      });

      if (!res.ok || !res.body) {
        throw new Error("ไม่สามารถเริ่มการอ่านไพ่ได้");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const eventMatch = line.match(/^event:\s*(\w+)/m);
          const dataMatch = line.match(/^data:\s*(.+)$/m);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            try {
              const data = JSON.parse(dataMatch[1]);

              if (eventType === "opening") {
                setReadingResult((prev) => ({ ...prev, opening: data.text }));
              } else if (eventType === "card") {
                setRevealedOrders((prev) => Array.from(new Set([...prev, data.position])));
                setActiveCardIndex(data.position);
                soundManager.playCardSelectSound();
                setReadingResult((prev) => {
                  const existing = prev?.cards || [];
                  const filtered = existing.filter((c) => c.position !== data.position);
                  return { ...prev, cards: [...filtered, data].sort((a, b) => a.position - b.position) };
                });
              } else if (eventType === "connections") {
                setReadingResult((prev) => ({ ...prev, connections: data.text }));
              } else if (eventType === "summary") {
                setReadingResult((prev) => ({ ...prev, summary: data.text }));
              } else if (eventType === "done") {
                setReadingResult(data.reading);
                setProof(data.proof || {});
                setRevealedOrders(cards.map((c) => c.order));
                setIsStreaming(false);
                setCurrentStep("SUMMARY");
                soundManager.playOracleRevealSound();

                // Auto-save to Reading Journal
                if (data.reading) {
                  saveReading({
                    nickname: nickname.trim() || undefined,
                    question: question.trim() || "ภาพรวมดวงชะตา",
                    spreadId: selectedSpread.id,
                    spreadName: selectedSpread.nameTh,
                    category: selectedCategory,
                    personaId: selectedPersona.id,
                    personaName: selectedPersona.nameTh,
                    cards: cards.map((c) => ({
                      order: c.order,
                      positionName: c.position.nameTh,
                      cardIndex: c.cardIndex,
                      cardNameTh: c.card?.nameTh || "",
                      cardNameEn: c.card?.nameEn || "",
                      isReversed: c.isReversed,
                      element: c.card?.element,
                    })),
                    summary: data.reading.summary || "",
                    advice: data.reading.advice || [],
                    timing: data.reading.timing || "",
                  });
                }
              } else if (eventType === "error") {
                setIsStreaming(false);
                setErrorMsg(data.message || "เกิดข้อผิดพลาดในการอ่านไพ่");
              }
            } catch (parseErr) {
              console.error("Parse event error", parseErr);
            }
          }
        }
      }
    } catch (err) {
      console.error("Stream reading failed", err);
      setIsStreaming(false);
    }
  };

  // Flip card manually
  const handleFlipCard = (order: number) => {
    setRevealedOrders((prev) =>
      prev.includes(order) ? prev.filter((o) => o !== order) : [...prev, order]
    );
    setActiveCardIndex(order);
  };

  // Reset to start new reading
  const handleReset = () => {
    soundManager.playCardSelectSound();
    setCurrentStep("SPREAD_SELECT");
    setReadingId(null);
    setPickedIndices([]);
    setDrawnCards([]);
    setRevealedOrders([]);
    setReadingResult(null);
    setErrorMsg(null);
  };

  return (
    <main className="min-h-screen pb-24 text-[#e2d9f3] relative overflow-hidden bg-[#05040a]">
      {/* Mystic Altar Floating Particles & Sacred Circles */}
      <MysticAltarCanvas />

      {/* Top Sacred Header */}
      <header className="w-full border-b border-[#e5c07b]/20 bg-[#07040f]/80 backdrop-blur-xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Luxury Brand Logo */}
          <div
            className="flex items-center gap-3.5 cursor-pointer group select-none"
            onClick={handleReset}
          >
            {/* World-Class Miniature 1909 Tarot Card Brand Logo */}
            <div className="w-8 h-12 sm:w-9 sm:h-13 rounded-lg border-2 border-[#e5c07b] overflow-hidden shadow-[0_0_20px_rgba(229,192,123,0.5)] relative flex-shrink-0 bg-[#07050d] group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(229,192,123,0.8)] transition-all duration-300">
              <img
                src="/cards/major-01.jpg"
                alt="The Magician Tarot Seal"
                className="w-full h-full object-cover object-top filter contrast-[1.05]"
              />
              <div className="gold-foil-sheen absolute inset-0 opacity-35 group-hover:opacity-70 transition-opacity" />
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="text-[#e5c07b] text-xs">✦</span>
                <h1 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold tracking-wide leading-snug py-0.5">
                  วิหารพยากรณ์ไพ่ทาโรต์
                </h1>
              </div>
              <span className="text-[9px] sm:text-[10px] tracking-[0.22em] text-[#c59b27] font-mono uppercase font-semibold pl-4">
                SACRED ORACLE TAROT
              </span>
            </div>
          </div>

          {/* Right Toolbar Controls (Sound, Encyclopedia, History & Reset) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Sound FX Toggle */}
            <button
              type="button"
              onClick={() => setIsSoundActive(soundManager.toggleSound())}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#100b20]/90 border border-[#e5c07b]/30 text-xs text-[#f5deaa] flex items-center justify-center hover:bg-[#191230] transition-all cursor-pointer shadow"
              title={isSoundActive ? "ปิดเสียงเอฟเฟกต์ (Mute)" : "เปิดเสียงเอฟเฟกต์ (Unmute)"}
            >
              {isSoundActive ? "🔊" : "🔇"}
            </button>

            {/* 78-Card Encyclopedia */}
            <button
              type="button"
              onClick={() => {
                soundManager.playCardSelectSound();
                setIsEncyclopediaOpen(true);
              }}
              className="text-xs text-[#e2d9f3] hover:text-[#f5deaa] border border-[#e5c07b]/25 hover:border-[#e5c07b]/60 px-3 py-1.5 rounded-full bg-[#100b20]/90 backdrop-blur transition-all cursor-pointer flex items-center gap-1.5 shadow"
            >
              <span>📖</span>
              <span className="hidden sm:inline font-medium">คัมภีร์ 78 ใบ</span>
            </button>

            {/* Reading History */}
            <button
              type="button"
              onClick={() => {
                soundManager.playCardSelectSound();
                setIsHistoryOpen(true);
              }}
              className="text-xs text-[#e2d9f3] hover:text-[#f5deaa] border border-[#e5c07b]/25 hover:border-[#e5c07b]/60 px-3 py-1.5 rounded-full bg-[#100b20]/90 backdrop-blur transition-all cursor-pointer flex items-center gap-1.5 shadow"
            >
              <span>📜</span>
              <span className="hidden sm:inline font-medium">ประวัติดวง</span>
            </button>

            {currentStep !== "SPREAD_SELECT" && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-[#05040a] font-bold bg-gradient-to-r from-[#c59b27] via-[#e5c07b] to-[#f5deaa] hover:opacity-90 px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(229,192,123,0.4)] transition-all cursor-pointer whitespace-nowrap"
              >
                ✦ เริ่มใหม่
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Sanctuary Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-12 sm:pb-16 relative z-10">
        {!hasStarted ? (
          // หน้าเริ่มต้นแบบเร็ว — เพิ่มก่อนกริดเลือกผังเดิม ไม่ได้แทนที่
          // เลือกครบ (หมวด+ความลึก) หรือกด "ข้าม" ก็ไปที่กริดเดิมทั้งคู่ ต่างกันแค่ว่า
          // เลือกครบจะข้ามกริดไปเข้า INTENTION_SELECT เลย (เร็วกว่าสำหรับคนใหม่)
          <QuickStartWelcome
            onComplete={(spread, category) => {
              setSelectedSpread(spread);
              setSelectedCategory(category);
              setCurrentStep("INTENTION_SELECT");
              setHasStarted(true);
            }}
            onSkip={() => setHasStarted(true)}
          />
        ) : (
          <>
            {/* Step Tracker Progress Bar */}
            <RitualStepProgress
              currentStep={currentStep}
              onStepClick={(step) => setCurrentStep(step)}
            />

            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-950/90 border border-rose-700 text-rose-200 text-xs sm:text-sm text-center shadow-2xl backdrop-blur">
                {errorMsg}
              </div>
            )}

            <AnimatePresence mode="wait">
          {/* STEP 1: SPREAD SELECTION */}
          {currentStep === "SPREAD_SELECT" && (
            <motion.div
              key="spread-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <div className="flex justify-center mb-1">
                  <div className="relative group cursor-pointer" onClick={() => soundManager.playCardSelectSound()}>
                    <div className="w-28 h-44 rounded-2xl border-2 border-[#e5c07b]/70 bg-gradient-to-b from-[#1c1236] via-[#0d071c] to-[#05030c] shadow-[0_0_40px_rgba(229,192,123,0.35)] flex items-center justify-center transform group-hover:scale-105 transition-all duration-500 overflow-hidden">
                      <div className="absolute inset-2 border border-[#e5c07b]/30 rounded-xl card-back-pattern" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-4xl font-serif-th font-bold font-mystic-gold tracking-wide">
                    เลือกผังแห่งชะตา (Sacred Spreads)
                  </h2>
                  <p className="text-xs sm:text-sm text-[#9c93b8] max-w-xl mx-auto">
                    เลือกรูปแบบการวางไพ่ที่ตรงกับคำถามในใจของคุณ จากนั้นตั้งจิตอธิษฐาน
                  </p>
                </div>
              </div>

              {/* Spread Selector Grid */}
              <SpreadCardSelector
                selectedSpread={selectedSpread}
                onSelectSpread={(sp) => {
                  soundManager.playCardSelectSound();
                  setSelectedSpread(sp);
                }}
                onProceed={() => {
                  soundManager.playCardSelectSound();
                  setCurrentStep("INTENTION_SELECT");
                }}
              />
            </motion.div>
          )}

          {/* STEP 2: INTENTION & PRAYER */}
          {currentStep === "INTENTION_SELECT" && (
            <motion.div
              key="intention"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-1">
                <h2 className="text-2xl sm:text-4xl font-serif-th font-bold font-mystic-gold">
                  ตั้งจิตอธิษฐาน & เลือกแม่หมอ
                </h2>
                <p className="text-xs sm:text-sm text-[#9c93b8]">
                  ระบุคำถามที่ค้างคาใจ พร้อมเลือกบุคลิกแม่หมอที่คุณต้องการปรึกษา
                </p>
              </div>

              {/* Persona Selector */}
              <PersonaCardSelector
                selectedPersona={selectedPersona}
                onSelectPersona={(p) => {
                  soundManager.playCardSelectSound();
                  setSelectedPersona(p);
                }}
              />

              {/* Input Form */}
              <IntentionAltarInput
                question={question}
                onQuestionChange={setQuestion}
                nickname={nickname}
                onNicknameChange={setNickname}
                situation={situation}
                onSituationChange={setSituation}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                persona={selectedPersona}
              />

              {/* Action Bar */}
              <div className="w-full max-w-2xl mx-auto p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-[#180f30] to-[#0d071a] border-2 border-[#e5c07b]/40 shadow-2xl flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCardSelectSound();
                    setCurrentStep("SPREAD_SELECT");
                  }}
                  className="py-3 px-5 rounded-xl bg-[#100b20] border border-[#e5c07b]/30 text-xs font-serif-th text-[#cfc8e2] hover:bg-[#191230] transition-all cursor-pointer"
                >
                  ← เปลี่ยนผัง ({selectedSpread.nameTh})
                </button>

                <button
                  type="button"
                  onClick={handleStartSession}
                  disabled={loading || !nickname.trim() || !question.trim()}
                  className={`py-3 px-7 rounded-xl text-xs sm:text-sm font-bold font-serif-th transition-all shadow-lg flex items-center gap-2 ${
                    !nickname.trim() || !question.trim()
                      ? "bg-[#1f1635] text-[#9c93b8]/60 border border-[#e5c07b]/20 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] hover:opacity-95 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(229,192,123,0.5)]"
                  }`}
                >
                  <span>✦</span>
                  <span>{loading ? "กำลังเชื่อมต่อ..." : "เข้าสู่พิธีสับไพ่ & เลือกไพ่ด้วยตนเอง"}</span>
                  <span>→</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SHUFFLE RITUAL */}
          {currentStep === "SHUFFLE" && (
            <motion.div
              key="shuffle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <ShuffleRitual
                commitment={commitment}
                spreadName={selectedSpread.nameTh}
                onShuffleComplete={handleShuffleComplete}
              />
            </motion.div>
          )}

          {/* STEP 4: INTERACTIVE CARD PICKING */}
          {currentStep === "PICK_CARDS" && (
            <motion.div
              key="picking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <InteractiveCardFan
                pickedIndices={pickedIndices}
                targetCount={selectedSpread.positions.length}
                currentPositionName={
                  selectedSpread.positions[pickedIndices.length]?.nameTh || "ตำแหน่งที่เหลือ"
                }
                onPickCard={handlePickCard}
                disabled={loading}
              />
            </motion.div>
          )}

          {/* STEP 5 & 6: DUAL-PANE SACRED SANCTUARY */}
          {(currentStep === "READING" || currentStep === "SUMMARY") && (
            <motion.div
              key="reading-summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT PANE: 3D Spread Board */}
                <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
                  <SpreadBoard
                    spread={selectedSpread}
                    drawnCards={drawnCards}
                    revealedOrders={revealedOrders}
                    currentReadingPosition={activeCardIndex}
                    onFlipCard={handleFlipCard}
                    onRevealAll={() => setRevealedOrders(drawnCards.map((c) => c.order))}
                    onZoomCard={(c) => setZoomedCard(c)}
                  />
                </div>

                {/* RIGHT PANE: Oracle Chamber */}
                <div className="lg:col-span-7 space-y-6">
                  <StreamReader
                    readingId={readingId}
                    persona={selectedPersona}
                    isStreaming={isStreaming}
                    reading={readingResult}
                    activeCardIndex={activeCardIndex}
                    onSelectCardIndex={setActiveCardIndex}
                    drawnCards={drawnCards}
                    proof={proof}
                  />
                </div>
              </div>

              {/* Bottom Quick Luxury Actions Deck */}
              <div className="p-5 sm:p-6 rounded-3xl altar-panel flex flex-wrap items-center justify-between gap-4 shadow-2xl border border-[#e5c07b]/30">
                <div className="flex items-center gap-2 text-xs text-[#9c93b8]">
                  <span>🔮</span>
                  <span>บันทึกหรือแบ่งปันคำพยากรณ์นี้เพื่อเตือนสติตนเอง</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playCardSelectSound();
                      setIsShareOpen(true);
                    }}
                    className="py-3 px-5 rounded-xl bg-[#100b20] border border-[#e5c07b]/40 text-[#f5deaa] font-serif-th text-xs hover:bg-[#191230] transition-all cursor-pointer flex items-center gap-2 shadow"
                  >
                    <span>📸</span> แชร์การ์ดคำทำนาย
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] font-bold font-serif-th text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✦</span> เปิดไพ่เรื่องอื่นต่อ
                  </button>
                </div>
              </div>
            </motion.div>
          )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Global Modals & Drawers */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        persona={selectedPersona}
        question={question}
        spreadName={selectedSpread.nameTh}
        cards={drawnCards}
        reading={readingResult}
      />

      <ReadingHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <TarotEncyclopediaModal
        isOpen={isEncyclopediaOpen}
        onClose={() => setIsEncyclopediaOpen(false)}
      />

      <CardZoomModal
        card={zoomedCard ? (cardByIndex(zoomedCard.cardIndex) || (zoomedCard.card as any)) : null}
        positionName={zoomedCard?.position.nameTh}
        isReversed={zoomedCard?.isReversed}
        isOpen={!!zoomedCard}
        onClose={() => setZoomedCard(null)}
      />

      {/* ═══════════════════════════════════════════════════════════════
          Site-Wide Sanctuary Footer — World-Class Luxury Design
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="w-full mt-16 relative overflow-hidden">
        {/* Ambient glow behind footer */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#e5c07b]/50 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[80px] bg-gradient-to-b from-[#e5c07b]/5 to-transparent blur-2xl" />
        </div>

        <div className="max-w-4xl mx-auto px-5 pt-10 pb-8 space-y-8 relative z-10">

          {/* Row 1: AI Disclosure Card */}
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-[#0f0a1e]/80 to-[#080510]/80 border border-[#e5c07b]/15 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1230] to-[#0d081a] border border-[#e5c07b]/25 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-base">🤖</span>
            </div>
            <div className="space-y-1.5 min-w-0">
              <h4 className="text-[11px] font-bold text-[#e5c07b] uppercase tracking-wider font-mono">
                AI-Generated Reading
              </h4>
              <p className="text-[11px] text-[#9c93b8] leading-[1.7] font-serif-th">
                คำทำนายทั้งหมดสร้างโดยปัญญาประดิษฐ์ (AI) จากไพ่ที่คุณเปิดจริง มีไว้เพื่อการใคร่ครวญและความบันเทิง
                ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน การตัดสินใจทุกอย่างยังเป็นของคุณเสมอ
              </p>
            </div>
          </div>

          {/* Row 2: Three-Column Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Privacy */}
            <a
              href="/privacy"
              className="group flex items-center gap-3 p-4 rounded-xl bg-[#0a0714]/60 border border-[#e5c07b]/10 hover:border-[#e5c07b]/40 transition-all duration-300 hover:bg-[#110a22]/60"
            >
              <div className="w-8 h-8 rounded-lg bg-[#e5c07b]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#e5c07b]/20 transition-colors">
                <span className="text-sm">🔒</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#e5c07b] uppercase tracking-wider font-mono block">
                  Privacy & PDPA
                </span>
                <span className="text-[10px] text-[#9c93b8] group-hover:text-[#cfc8e2] transition-colors">
                  นโยบายความเป็นส่วนตัว
                </span>
              </div>
            </a>

            {/* Mental Health Hotline */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0a0714]/60 border border-[#e5c07b]/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">💚</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono block">
                  สายด่วนสุขภาพจิต
                </span>
                <span className="text-sm font-bold text-[#f5deaa] font-mono tracking-widest">1323</span>
                <span className="text-[9px] text-[#9c93b8] ml-1.5">24 ชม.</span>
              </div>
            </div>

            {/* Emergency */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0a0714]/60 border border-[#e5c07b]/10">
              <div className="w-8 h-8 rounded-lg bg-rose-950/40 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🚑</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider font-mono block">
                  เหตุฉุกเฉิน
                </span>
                <span className="text-sm font-bold text-[#f5deaa] font-mono tracking-widest">1669</span>
              </div>
            </div>
          </div>

          {/* Row 3: Bottom Branding Strip */}
          <div className="flex flex-col items-center gap-2 pt-4 border-t border-[#e5c07b]/8">
            <div className="flex items-center gap-2">
              <div className="w-5 h-7 rounded-sm overflow-hidden border border-[#e5c07b]/40 flex-shrink-0">
                <img src="/cards/major-01.jpg" alt="The Magician" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#e5c07b]/60">
                Sacred Oracle Tarot · 1909
              </span>
              <div className="w-5 h-7 rounded-sm overflow-hidden border border-[#e5c07b]/40 flex-shrink-0">
                <img src="/cards/major-17.jpg" alt="The Star" className="w-full h-full object-cover" />
              </div>
            </div>
            <p className="text-[9px] text-[#9c93b8]/50 font-mono">
              Provably-Fair Cryptographic Shuffle · Rider-Waite-Smith 1909 · All readings AI-generated
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
