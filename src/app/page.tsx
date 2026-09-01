"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { stepVariants, useMotionSafe } from "@/lib/motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SPREADS, getSpread, type Spread } from "@/data/spreads";
import { PERSONAS, getPersona, type Persona } from "@/data/personas";
import type { Category } from "@/data/cards/types";
import { CardImage } from "@/components/card/CardImage";
import type { Reading } from "@/lib/schema/reading";
import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import { SpreadCardSelector } from "@/components/spread/SpreadCardSelector";
import { PersonaCardSelector } from "@/components/reading/PersonaCardSelector";
import { IntentionAltarInput } from "@/components/reading/IntentionAltarInput";
import { RitualStepProgress, type RitualStep } from "@/components/ui/RitualStepProgress";
import { MysticBackground } from "@/components/ui/MysticBackground";
import { OracleEyeIcon, LockTabIcon, CareLineIcon, EmergencyTabIcon } from "@/components/ui/TarotArtIcons";
import { SacredNavDropdown } from "@/components/ui/SacredNavDropdown";
import { soundManager } from "@/lib/utils/audio";
import { saveReading } from "@/lib/utils/history";
import { saveFlowState, loadFlowState, clearFlowState } from "@/lib/utils/flow-persistence";
import { UserProfileBadge } from "@/components/auth/UserProfileBadge";
import { QuotaBadge } from "@/components/entitlement/QuotaBadge";
import { EntitlementGate } from "@/components/entitlement/EntitlementGate";
import { refreshEntitlement } from "@/lib/entitlement/use-entitlement";

// Dynamic Code-Splitting for 60% smaller initial JS bundle
const ShuffleRitual = dynamic(
  () => import("@/components/deck/ShuffleRitual").then((m) => m.ShuffleRitual),
  { ssr: false }
);
const InteractiveCardFan = dynamic(
  () => import("@/components/deck/InteractiveCardFan").then((m) => m.InteractiveCardFan),
  { ssr: false }
);
const SpreadBoard = dynamic(
  () => import("@/components/spread/SpreadBoard").then((m) => m.SpreadBoard),
  { ssr: false }
);
const StreamReader = dynamic(
  () => import("@/components/reading/StreamReader").then((m) => m.StreamReader),
  { ssr: false }
);
const ShareModal = dynamic(
  () => import("@/components/reading/ShareModal").then((m) => m.ShareModal),
  { ssr: false }
);
const ReadingHistoryModal = dynamic(
  () => import("@/components/history/ReadingHistoryModal").then((m) => m.ReadingHistoryModal),
  { ssr: false }
);
const TarotEncyclopediaModal = dynamic(
  () => import("@/components/encyclopedia/TarotEncyclopediaModal").then((m) => m.TarotEncyclopediaModal),
  { ssr: false }
);
const AuthModal = dynamic(
  () => import("@/components/auth/AuthModal").then((m) => m.AuthModal),
  { ssr: false }
);
const CardZoomModal = dynamic(
  () => import("@/components/card/CardZoomModal").then((m) => m.CardZoomModal),
  { ssr: false }
);

// P1-U1: ปุ่มย้อนกลับทีละขั้น — ใช้ร่วมในขั้นสับไพ่และเลือกไพ่
function StepBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#100b20] border border-[#e5c07b]/30 text-[11px] font-serif-th text-[#cfc8e2] hover:bg-[#191230] transition-colors duration-150 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05040a]"
    >
      <span aria-hidden="true">←</span> ย้อนกลับ
    </button>
  );
}

export default function TarotPage() {
  const [currentStep, setCurrentStep] = useState<RitualStep>("SPREAD_SELECT");
  const motionSafe = useMotionSafe();

  // Direction tracking for AnimatePresence transitions (+1 = forward, -1 = back)
  const STEP_ORDER: RitualStep[] = ["SPREAD_SELECT", "INTENTION_SELECT", "SHUFFLE", "PICK_CARDS", "READING", "SUMMARY"];
  const stepDirectionRef = useRef<number>(1);
  const navigateStep = (next: RitualStep) => {
    const curIdx = STEP_ORDER.indexOf(currentStep);
    const nxtIdx = STEP_ORDER.indexOf(next);
    stepDirectionRef.current = nxtIdx >= curIdx ? 1 : -1;
    setCurrentStep(next);
  };


  // Modals state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<DrawnSlotCard | null>(null);

  // Selection state
  const [selectedSpread, setSelectedSpread] = useState<Spread>(SPREADS[3]); // Default: 3-card
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]); // Default: warm
  const [selectedCategory, setSelectedCategory] = useState<Category>("general");
  const [question, setQuestion] = useState("");
  const [nickname, setNickname] = useState("");
  const [situation, setSituation] = useState("");

  // Reading session state
  const [readingId, setReadingId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [commitment, setCommitment] = useState<string>("");
  const [clientSeed, setClientSeed] = useState<string>("");
  const [proof, setProof] = useState<{
    serverSeed?: string;
    clientSeed?: string;
    commitment?: string;
    pickedIndices?: number[];
    deckSize?: number;
  }>({});

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
  const [authBanner, setAuthBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Instant Hardware Scroll Reset with Multi-Frame Paint Guarantee
  const scrollToSanctuaryTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      const anchor = document.getElementById("sanctuary-top-anchor");
      if (anchor) {
        anchor.scrollIntoView({ behavior: "auto", block: "start" });
      }
    });
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 40);
  };

  useEffect(() => {
    scrollToSanctuaryTop();
  }, [currentStep]);

  // ── P1-U4: กู้คืน flow ที่ค้างไว้ + P1-U5: รับผัง `?spread=` จากคลังผัง ──────
  // ก่อนหน้านี้ refresh / back / สลับแท็บ = เด้งกลับขั้น 1 ทั้งที่ server session ยังอยู่ ~60 นาที
  const resumeDoneRef = useRef(false);
  useEffect(() => {
    if (resumeDoneRef.current) return; // กัน StrictMode รันซ้ำ
    resumeDoneRef.current = true;

    const saved = loadFlowState();
    // กู้คืนเฉพาะเมื่อผู้ใช้ "เริ่มดูดวงไปแล้วจริง ๆ" (พ้นขั้นเลือกผัง) — ถ้ายังอยู่ขั้น 1
    // ให้ถือว่าไม่มีอะไรค้าง แล้วเปิดทางให้ `?spread=` ทำงานแทน
    if (saved && saved.currentStep !== "SPREAD_SELECT") {
      const spread = getSpread(saved.spreadId);
      if (spread) setSelectedSpread(spread);
      setSelectedPersona(getPersona(saved.personaId));
      setSelectedCategory(saved.category);
      setQuestion(saved.question);
      setNickname(saved.nickname);
      setSituation(saved.situation);
      setReadingId(saved.readingId);
      setSessionToken(saved.sessionToken);
      setCommitment(saved.commitment);
      setClientSeed(saved.clientSeed);
      setProof(saved.proof || {});
      setPickedIndices(saved.pickedIndices || []);
      setDrawnCards(saved.drawnCards || []);
      setRevealedOrders(saved.revealedOrders || []);
      setActiveCardIndex(saved.activeCardIndex || 0);
      setReadingResult(saved.readingResult);
      setCurrentStep(saved.currentStep);
      // สตรีม AI ตายไปแล้วหลัง refresh — ถ้าค้างที่ขั้นอ่านไพ่โดยยังไม่ได้บทสรุป
      // ให้ขึ้นปุ่มลองใหม่แทนที่จะค้างหน้าเปล่า
      if (saved.currentStep === "READING" && !saved.readingResult?.summary) {
        setErrorMsg("การอ่านไพ่ค้างไว้ตอนหน้าเว็บรีเฟรช กดลองใหม่อีกครั้งเพื่ออ่านคำทำนายต่อ");
      }
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      const spreadParam = searchParams.get("spread");
      if (spreadParam) {
        const match = getSpread(spreadParam);
        if (match) setSelectedSpread(match);
      }
    }

    // Auto-sync anonymous history to server upon login or app mount & handle Auth query toasts
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const isAuthSuccess = searchParams.get("auth_success") === "1";
      const isVerified = searchParams.get("verified") === "1";
      const isPwReset = searchParams.get("pw_reset") === "1";
      const verifyError = searchParams.get("verify_error");
      const authError = searchParams.get("auth_error");

      if (isVerified) {
        setAuthBanner({ type: "success", text: "ยินดีด้วย! คุณได้ยืนยันที่อยู่อีเมลเรียบร้อยแล้ว ✦" });
      } else if (isPwReset) {
        setAuthBanner({ type: "success", text: "ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว เข้าสู่วิหารศักดิ์สิทธิ์ได้ทันที ✦" });
      } else if (verifyError === "expired") {
        setAuthBanner({ type: "error", text: "ลิงก์ยืนยันอีเมลหมดอายุ กรุณาขอลิงก์ใหม่จากเมนูโปรไฟล์" });
      } else if (verifyError) {
        setAuthBanner({ type: "error", text: "ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือถูกใช้งานไปแล้ว" });
      } else if (authError) {
        setAuthBanner({ type: "error", text: authError });
      }

      if (isAuthSuccess || isVerified || isPwReset) {
        // เพิ่งล็อกอิน/ยืนยัน → รีเฟรชสิทธิ์ (guest → member)
        refreshEntitlement();
      }

      import("@/lib/utils/history").then((m) => {
        if (isAuthSuccess || isVerified || isPwReset) {
          m.syncAnonymousHistoryToServer().then(({ merged }) => {
            if (merged > 0) {
              console.log(`[Journal Sync] ซิงก์ประวัติ ${merged} รายการเข้าสู่บัญชีสำเร็จ ✦`);
            }
          });
        } else {
          m.fetchServerReadings();
        }
      });
    }
  }, []);

  // เปิด AuthModal จากคอมโพเนนต์ลึก (เช่นช่องแชทที่ล็อกใน FollowUpChat) ผ่าน event bus
  useEffect(() => {
    const openAuth = () => setIsAuthOpen(true);
    window.addEventListener("tarot:open-auth", openAuth);
    return () => window.removeEventListener("tarot:open-auth", openAuth);
  }, []);

  // เขียน flow state ลง sessionStorage ทุกครั้งที่มีการเปลี่ยนแปลง (หลัง resume จบแล้วเท่านั้น)
  // debounce 400ms กันเขียนถี่ ๆ ตอน readingResult อัปเดตรัว ๆ ระหว่าง stream คำทำนาย
  useEffect(() => {
    if (!resumeDoneRef.current) return;
    const t = setTimeout(() => {
      saveFlowState({
        currentStep,
        spreadId: selectedSpread.id,
        personaId: selectedPersona.id,
        category: selectedCategory,
        question,
        nickname,
        situation,
        readingId,
        sessionToken,
        commitment,
        clientSeed,
        pickedIndices,
        drawnCards,
        revealedOrders,
        activeCardIndex,
        readingResult,
        proof,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [
    currentStep, selectedSpread, selectedPersona, selectedCategory, question, nickname,
    situation, readingId, sessionToken, commitment, clientSeed, pickedIndices, drawnCards,
    revealedOrders, activeCardIndex, readingResult, proof,
  ]);

  // Step 1 -> Step 2: Start Reading Session
  const handleStartSession = async () => {
    const trimmedNickname = nickname.trim();
    const trimmedQuestion = question.trim();

    if (!trimmedNickname) {
      setErrorMsg("กรุณากรอกชื่อเล่นของคุณก่อนเริ่มดูดวง");
      return;
    }

    if (!trimmedQuestion) {
      setErrorMsg("กรุณาพิมพ์คำถามหรือเลือกหัวข้อคำถามก่อนเริ่มดูดวง");
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "ไม่สามารถเริ่มดูดวงได้");

      const sessionReadingId = data.readingId || data.id;
      setReadingId(sessionReadingId);
      if (data.sessionToken) setSessionToken(data.sessionToken);
      setCommitment(data.commitment || "");
      setClientSeed(data.clientSeed || "");
      navigateStep("SHUFFLE");
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเริ่มดูดวง");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3: Shuffle Animation Finished
  const handleShuffleComplete = (finalClientSeed: string) => {
    if (finalClientSeed) setClientSeed(finalClientSeed);
    soundManager.playShuffleSound();
    navigateStep("PICK_CARDS");
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
        headers: {
          "Content-Type": "application/json",
          "x-reading-token": sessionToken || "",
        },
        body: JSON.stringify({
          clientSeed,
          pickedIndices: finalIndices,
          sessionToken: sessionToken || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 410 || data.code === "SESSION_SEED_LOST") {
          throw new Error("เซสชันหมดอายุระหว่างการสับไพ่ กรุณาเริ่มดูดวงใหม่อีกครั้ง");
        }
        throw new Error(data.error || "ไม่สามารถจัดสำรับไพ่ได้");
      }
      if (data.sessionToken) setSessionToken(data.sessionToken);

      const { cardByIndex } = await import("@/data/cards");

      const enrichedCards: DrawnSlotCard[] = (data.drawn || []).map((d: any) => {
        const fullCard = cardByIndex(d.cardIndex);
        const kw = fullCard?.keywords;
        const extractedKeywords = Array.isArray(kw)
          ? kw
          : d.isReversed
          ? kw?.reversed ?? []
          : kw?.upright ?? [];

        return {
          order: d.order ?? 0,
          cardIndex: d.cardIndex ?? 0,
          isReversed: !!d.isReversed,
          position: selectedSpread?.positions?.[d.order] || {
            index: d.order ?? 0,
            nameTh: `ตำแหน่งที่ ${(d.order ?? 0) + 1}`,
            meaning: "",
          },
          card: {
            id: fullCard.id,
            nameTh: fullCard.nameTh,
            nameEn: fullCard.nameEn,
            image: fullCard.image,
            element: fullCard.element,
            keywords: extractedKeywords,
          },
        };
      });

      setDrawnCards(enrichedCards);
      setRevealedOrders([]);
      setActiveCardIndex(0);
      navigateStep("READING");

      // Auto start streaming AI interpretation in background
      startAIStreaming(activeId, enrichedCards, data.sessionToken || sessionToken);
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการประมวลผลไพ่");
      // P2-5: ถอยกลับแค่ไพ่ใบสุดท้าย ให้เลือกใหม่ได้ทันทีโดยไม่ต้องเริ่มจับใหม่ทั้งหมด
      setPickedIndices((p) => p.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Stream AI interpretation
  const startAIStreaming = async (id: string, cards: DrawnSlotCard[], currentToken?: string | null) => {
    setIsStreaming(true);
    setReadingResult({});
    setErrorMsg(null);
    let streamCompleted = false;

    try {
      const res = await fetch(`/api/reading/${id}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-reading-token": currentToken || sessionToken || "",
        },
      });

      if (!res.ok || !res.body) {
        throw new Error("ไม่สามารถเริ่มการอ่านไพ่ได้ กรุณาลองใหม่อีกครั้ง");
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
                streamCompleted = true;
                setReadingResult(data.reading);
                setProof(data.proof || {});
                setIsStreaming(false);
                navigateStep("SUMMARY");
                soundManager.playOracleRevealSound();
                refreshEntitlement(); // อ่านจบ → สิทธิ์อาจลดลง อัปเดต badge

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
                streamCompleted = true;
                setIsStreaming(false);
                setErrorMsg(data.message || "เกิดข้อผิดพลาดในการอ่านไพ่");
              }
            } catch (parseErr) {
              console.error("Parse event error", parseErr);
            }
          }
        }
      }

      // P1-4 Guard: If stream ended without 'done' event
      if (!streamCompleted) {
        setIsStreaming(false);
        setErrorMsg("สัญญาณการอ่านไพ่ขาดหายไปชั่วคราว กรุณากดลองใหม่อีกครั้ง");
      }
    } catch (err: any) {
      console.error("Stream reading failed", err);
      setIsStreaming(false);
      setErrorMsg(err.message || "การเชื่อมต่อเพื่ออ่านคำทำนายขัดข้อง กรุณากดลองใหม่อีกครั้ง");
    }
  };

  // Flip card manually
  const handleFlipCard = (order: number) => {
    setRevealedOrders((prev) =>
      prev.includes(order) ? prev.filter((o) => o !== order) : [...prev, order]
    );
    setActiveCardIndex(order);
  };

  // Reset to start new reading (P1-10: Complete session state purge)
  // P1-U2: ยืนยันก่อนล้าง ถ้ากำลังดูดวงค้างอยู่และยังไม่ได้บทสรุป (กันเผลอกดทิ้งทั้งรอบ)
  const handleReset = () => {
    const midFlow = currentStep !== "SPREAD_SELECT" && currentStep !== "SUMMARY";
    if (
      midFlow &&
      typeof window !== "undefined" &&
      !window.confirm("ต้องการเริ่มดูดวงใหม่หรือไม่? คำถาม ชื่อเล่น และไพ่ที่เลือกไว้ในรอบนี้จะถูกล้างทั้งหมด")
    ) {
      return;
    }
    clearFlowState();
    soundManager.playCardSelectSound();
    navigateStep("SPREAD_SELECT");
    setReadingId(null);
    setSessionToken(null);
    setCommitment("");
    setClientSeed("");
    setProof({});
    setActiveCardIndex(0);
    setIsStreaming(false);
    setZoomedCard(null);
    setPickedIndices([]);
    setDrawnCards([]);
    setRevealedOrders([]);
    setReadingResult(null);
    setErrorMsg(null);
  };

  // P1-U1: ย้อนกลับทีละขั้นจากขั้นสับไพ่/เลือกไพ่ (เดิมทางออกเดียวคือ "เริ่มดูดวงใหม่" ที่ล้างทุกอย่าง)
  const handleStepBack = () => {
    soundManager.playCardSelectSound();
    if (currentStep === "SHUFFLE") {
      navigateStep("INTENTION_SELECT"); // เก็บคำถาม/ชื่อเล่น/ผัง/แม่หมอไว้ครบ
    } else if (currentStep === "PICK_CARDS") {
      setPickedIndices([]);
      setDrawnCards([]);
      setRevealedOrders([]);
      setErrorMsg(null);
      navigateStep("SHUFFLE");
    }
  };

  return (
    <main className="min-h-screen pb-24 text-[#e2d9f3] relative overflow-hidden bg-[#05040a]">
      {/* Hardware Anchor for Immediate Viewport Alignment */}
      <div id="sanctuary-top-anchor" className="absolute top-0 left-0 w-0 h-0 pointer-events-none" />

      {/* Mystic Altar Floating Particles & Sacred Circles */}
      <MysticBackground />

      {/* Top Sacred Header */}
      <header className="w-full border-b border-[#e5c07b]/20 bg-[#07040f]/80 backdrop-blur-xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Luxury Brand Logo — P1-U2: กลับหน้าแรก ไม่ล้าง state (ปุ่ม "เริ่มดูดวงใหม่" ทำหน้าที่นั้น) */}
          <Link
            href="/"
            aria-label="ดูดวงไพ่ทาโรต์ — กลับหน้าแรก"
            className="flex items-center gap-3.5 cursor-pointer group select-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05040a]"
          >
            {/* World-Class Miniature 1909 Tarot Card Brand Logo */}
            <div className="w-8.5 h-[50px] sm:w-9.5 sm:h-[56px] rounded-lg border-2 border-[#e5c07b] overflow-hidden shadow-[0_0_20px_rgba(229,192,123,0.5)] relative flex-shrink-0 bg-[#07050d] group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(229,192,123,0.8)] transition-all duration-300">
              <CardImage
                image="major-01.jpg"
                alt="The Magician Tarot Seal"
                className="w-full h-full object-cover object-[50%_12%] filter contrast-[1.12] saturate-[1.15] brightness-[1.05] tarot-hd-card-image"
                sizes="64px"
                loading="eager"
              />
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="text-[#e5c07b] text-xs">✦</span>
                <h1 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold tracking-wide leading-snug py-0.5">
                  ดูดวงไพ่ทาโรต์
                </h1>
              </div>
              <span className="text-[9px] sm:text-[10px] tracking-[0.22em] text-[#c59b27] font-mono uppercase font-semibold pl-4">
                1909 RIDER-WAITE TAROT
              </span>
            </div>
          </Link>

          {/* Right Toolbar Controls (UserProfileBadge, Sacred Dropdown & Reset Button) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <QuotaBadge />
            <UserProfileBadge onOpenAuthModal={() => setIsAuthOpen(true)} />

            <SacredNavDropdown
              onOpenHistory={() => {
                soundManager.playCardSelectSound();
                setIsHistoryOpen(true);
              }}
              onReset={handleReset}
              canReset={currentStep !== "SPREAD_SELECT"}
            />

            {currentStep !== "SPREAD_SELECT" && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-[#05040a] font-bold bg-gradient-to-r from-[#c59b27] via-[#e5c07b] to-[#f5deaa] hover:opacity-90 px-3.5 py-1.5 sm:py-2 rounded-2xl shadow-[0_0_15px_rgba(229,192,123,0.4)] transition-all cursor-pointer whitespace-nowrap hidden sm:flex items-center gap-1 font-serif-th"
              >
                <span>✦</span> เริ่มดูดวงใหม่
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Sanctuary Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-12 sm:pb-16 relative z-10">
        {/* Auth Toast Notification Banner */}
        {authBanner && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs sm:text-sm text-center shadow-2xl backdrop-blur flex items-center justify-between gap-3 ${
              authBanner.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : "bg-rose-950/90 border-rose-600/50 text-rose-200"
            }`}
          >
            <span className="flex-1 font-serif-th">{authBanner.text}</span>
            <button
              type="button"
              onClick={() => setAuthBanner(null)}
              className="text-xs opacity-75 hover:opacity-100 px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Step Tracker Progress Bar */}
        <RitualStepProgress
          currentStep={currentStep}
          onStepClick={(step) => navigateStep(step)}
        />

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/90 border border-rose-700 text-rose-200 text-xs sm:text-sm text-center shadow-2xl backdrop-blur">
            {errorMsg}
          </div>
        )}

        {/* ── Directional Step Transitions (P1-M1) ─────────────────────── */}
        <AnimatePresence mode="wait" custom={stepDirectionRef.current}>
          {currentStep === "SPREAD_SELECT" && (
            <motion.div
              key="spread-select"
              custom={motionSafe ? stepDirectionRef.current : 0}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-8"
            >
              <EntitlementGate active={currentStep === "SPREAD_SELECT"} onOpenAuth={() => setIsAuthOpen(true)}>
              <div className="text-center space-y-3 relative">
                {/* 3D Floating Tarot Stage with Sacred Geometric Aura (Matching Step 3 Shuffle) */}
                <div className="h-60 sm:h-72 w-full flex items-center justify-center relative my-2 select-none" style={{ perspective: 1200 }}>
                  {/* Background Sacred Geometric Aura */}
                  <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-30 pointer-events-none">
                    <div className="w-64 h-64 sm:w-[400px] sm:h-[400px] rounded-full border border-dashed border-[#e5c07b]/60 animate-[spin_80s_linear_infinite]" />
                    <div className="absolute w-48 h-48 sm:w-[280px] sm:h-[280px] rounded-full border border-[#8b5cf6]/40 animate-[spin_50s_linear_infinite_reverse]" />
                    <div className="absolute w-full h-full bg-radial from-[#e5c07b]/10 via-transparent to-transparent blur-xl sm:blur-2xl" />
                  </div>

                  {/* Idle Floating Deck with CSS Animation */}
                  <div
                    onClick={() => soundManager.playCardSelectSound()}
                    className="w-36 h-54 sm:w-44 sm:h-64 rounded-2xl border-2 border-[#e5c07b] card-back-pattern shadow-[0_0_35px_rgba(229,192,123,0.35)] flex flex-col items-center justify-between p-4 cursor-pointer overflow-hidden group relative anim-tarot-idle gpu-layer transition-transform duration-150 active:scale-95 hover:scale-105"
                  >
                    <div className="w-full flex justify-center items-center opacity-75">
                      <span className="text-[9px] font-serif-th text-[#f5deaa] tracking-[0.2em] uppercase font-bold">
                        SACRED ORACLE
                      </span>
                    </div>

                    {/* Clean Center */}
                    <div className="my-auto" />

                    <span className="text-xs font-serif-th font-bold font-mystic-gold tracking-wide">
                      ไพ่ทาโรต์ 1909
                    </span>

                    {/* Dynamic Gold Sheen */}
                    <div className="gold-foil-sheen absolute inset-0 opacity-30 group-hover:opacity-65 transition-opacity" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-4xl font-serif-th font-bold font-mystic-gold tracking-wide">
                    เลือกผังการเปิดไพ่
                  </h2>
                  <p className="text-xs sm:text-sm text-[#9c93b8] max-w-xl mx-auto">
                    เลือกรูปแบบการเปิดไพ่ที่เหมาะกับเรื่องที่คุณต้องการคำตอบ
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
                  scrollToSanctuaryTop();
                  navigateStep("INTENTION_SELECT");
                }}
              />
              </EntitlementGate>
            </motion.div>
          )}

          {/* STEP 2: INTENTION & PRAYER */}
          {currentStep === "INTENTION_SELECT" && (
            <motion.div
              key="intention"
              custom={motionSafe ? stepDirectionRef.current : 0}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center space-y-1">
                <h2 className="text-2xl sm:text-4xl font-serif-th font-bold font-mystic-gold">
                  ตั้งคำถาม &amp; เลือกแม่หมอ
                </h2>
                <p className="text-xs sm:text-sm text-[#9c93b8]">
                  พิมพ์เรื่องที่อยากรู้ พร้อมเลือกสไตล์แม่หมอที่คุณต้องการคุยด้วย
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
                    scrollToSanctuaryTop();
                    navigateStep("SPREAD_SELECT");
                  }}
                  className="py-3 px-5 rounded-xl bg-[#100b20] border border-[#e5c07b]/30 text-xs font-serif-th text-[#cfc8e2] hover:bg-[#191230] transition-colors duration-150 cursor-pointer"
                >
                  ← เปลี่ยนผัง ({selectedSpread.nameTh})
                </button>

                <button
                  type="button"
                  onClick={handleStartSession}
                  disabled={loading || !nickname.trim() || !question.trim()}
                  className={`py-3 px-7 rounded-xl text-xs sm:text-sm font-bold font-serif-th transition-transform duration-150 shadow-lg flex items-center gap-2 ${
                    !nickname.trim() || !question.trim()
                      ? "bg-[#1f1635] text-[#9c93b8]/60 border border-[#e5c07b]/20 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] hover:opacity-95 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(229,192,123,0.5)]"
                  }`}
                >
                  <span>✦</span>
                  <span>{loading ? "กำลังโหลด..." : "ต่อไป: สับไพ่และเลือกไพ่ด้วยตัวเอง"}</span>
                  <span>→</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SHUFFLE RITUAL */}
          {currentStep === "SHUFFLE" && (
            <motion.div
              key="shuffle"
              custom={motionSafe ? stepDirectionRef.current : 0}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6"
            >
              <ShuffleRitual
                commitment={commitment}
                spreadName={selectedSpread.nameTh}
                onShuffleComplete={handleShuffleComplete}
              />
              <StepBackButton onClick={handleStepBack} />
            </motion.div>
          )}

          {/* STEP 4: INTERACTIVE CARD PICKING */}
          {currentStep === "PICK_CARDS" && (
            <motion.div
              key="picking"
              custom={motionSafe ? stepDirectionRef.current : 0}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-3.5 sm:space-y-6"
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
              <StepBackButton onClick={handleStepBack} />
            </motion.div>
          )}

          {/* STEP 5 & 6: DUAL-PANE SACRED SANCTUARY */}
          {(currentStep === "READING" || currentStep === "SUMMARY") && (
            <motion.div
              key="reading-summary"
              custom={motionSafe ? stepDirectionRef.current : 0}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
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
                    sessionToken={sessionToken}
                    persona={selectedPersona}
                    isStreaming={isStreaming}
                    reading={readingResult}
                    activeCardIndex={activeCardIndex}
                    onSelectCardIndex={setActiveCardIndex}
                    drawnCards={drawnCards}
                    proof={proof}
                    errorMsg={errorMsg}
                    onRetry={() => {
                      if (readingId && drawnCards.length > 0) {
                        setErrorMsg(null);
                        startAIStreaming(readingId, drawnCards);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Bottom Quick Luxury Actions Deck */}
              <div className="p-5 sm:p-6 rounded-3xl altar-panel flex flex-wrap items-center justify-between gap-4 shadow-2xl border border-[#e5c07b]/30">
                <div className="flex items-center gap-2 text-xs text-[#9c93b8] font-serif-th">
                  <span className="text-[#e5c07b]">✦</span>
                  <span>บันทึกหรือแชร์คำทำนายนี้เก็บไว้ดูย้อนหลังได้</span>
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
                    <span className="text-[#e5c07b]">✨</span> แชร์ผลคำทำนาย
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] font-bold font-serif-th text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✦</span> ดูดวงเรื่องอื่นต่อ
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <TarotEncyclopediaModal
        isOpen={isEncyclopediaOpen}
        onClose={() => setIsEncyclopediaOpen(false)}
      />

      <CardZoomModal
        card={zoomedCard ? (zoomedCard.card as any) : null}
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1230] to-[#0d081a] border border-[#e5c07b]/25 flex items-center justify-center flex-shrink-0 shadow-lg text-[#e5c07b]">
              <OracleEyeIcon className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h4 translate="no" className="text-[11px] font-bold text-[#e5c07b] uppercase tracking-wider font-mono">
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
              className="group flex items-center gap-3 p-4 rounded-xl bg-[#0a0714]/60 border border-[#e5c07b]/10 hover:border-[#e5c07b]/40 transition-all duration-300 hover:bg-[#110a22]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700]"
            >
              <div className="w-8 h-8 rounded-lg bg-[#e5c07b]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#e5c07b]/20 transition-colors text-[#e5c07b]">
                <LockTabIcon className="w-4 h-4" />
              </div>
              <div>
                <span translate="no" className="text-[10px] font-bold text-[#e5c07b] uppercase tracking-wider font-mono block">
                  Privacy & PDPA
                </span>
                <span className="text-[10px] text-[#9c93b8] group-hover:text-[#cfc8e2] transition-colors font-serif-th">
                  นโยบายความเป็นส่วนตัว
                </span>
              </div>
            </a>

            {/* Mental Health Hotline */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0a0714]/60 border border-[#e5c07b]/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/40 flex items-center justify-center flex-shrink-0 text-emerald-400">
                <CareLineIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono block font-serif-th">
                  สายด่วนสุขภาพจิต
                </span>
                <span className="text-sm font-bold text-[#f5deaa] font-mono tracking-widest">1323</span>
                <span className="text-[9px] text-[#9c93b8] ml-1.5 font-serif-th">24 ชม.</span>
              </div>
            </div>

            {/* Emergency */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0a0714]/60 border border-[#e5c07b]/10">
              <div className="w-8 h-8 rounded-lg bg-rose-950/40 flex items-center justify-center flex-shrink-0 text-rose-400">
                <EmergencyTabIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider font-mono block font-serif-th">
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
                <CardImage image="major-01.jpg" alt="The Magician" className="w-full h-full object-cover" sizes="24px" />
              </div>
              <span translate="no" className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#e5c07b]/60">
                Sacred Oracle Tarot · 1909
              </span>
              <div className="w-5 h-7 rounded-sm overflow-hidden border border-[#e5c07b]/40 flex-shrink-0">
                <CardImage image="major-17.jpg" alt="The Star" className="w-full h-full object-cover" sizes="24px" />
              </div>
            </div>
            <p translate="no" className="text-[9px] text-[#9c93b8]/50 font-mono text-center">
              Provably-Fair Cryptographic Shuffle · Rider-Waite-Smith 1909 · All readings AI-generated
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
