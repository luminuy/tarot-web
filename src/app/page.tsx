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
import { DailyCardStrip } from "@/components/reading/DailyCardStrip";
import type { RitualStep } from "@/components/ui/RitualStepProgress";
import { SacredNavDropdown } from "@/components/ui/SacredNavDropdown";
import { soundManager } from "@/lib/utils/audio";
import { saveReading } from "@/lib/utils/history";
import { saveFlowState, loadFlowState, clearFlowState } from "@/lib/utils/flow-persistence";
import { UserProfileBadge } from "@/components/auth/UserProfileBadge";
import { describeAuthError, fetchSessionUser, invalidateSessionCache } from "@/lib/auth/use-session";
import { EntitlementGate } from "@/components/entitlement/EntitlementGate";
import { PostReadingSignup } from "@/components/entitlement/PostReadingSignup";
import { AnnouncementBanner } from "@/components/entitlement/AnnouncementBanner";
import { ToastNotification, type ToastData } from "@/components/ui/ToastNotification";
import {
  DAILY_LIMIT,
  describeEntitlement,
  type UpgradeReason,
  isStandardSpread,
  isMasterPersona,
} from "@/lib/entitlement/copy";
import { onUpgradeRequest } from "@/lib/entitlement/upgrade-bus";
import { refreshEntitlement, useEntitlement } from "@/lib/entitlement/use-entitlement";

// Dynamic Code-Splitting for 60% smaller initial JS bundle
const ShuffleRitual = dynamic(() => import("@/components/deck/ShuffleRitual").then((m) => m.ShuffleRitual), {
  ssr: false,
});
const InteractiveCardFan = dynamic(
  () => import("@/components/deck/InteractiveCardFan").then((m) => m.InteractiveCardFan),
  { ssr: false }
);
const SpreadBoard = dynamic(() => import("@/components/spread/SpreadBoard").then((m) => m.SpreadBoard), { ssr: false });
const StreamReader = dynamic(() => import("@/components/reading/StreamReader").then((m) => m.StreamReader), {
  ssr: false,
});
const ShareModal = dynamic(() => import("@/components/reading/ShareModal").then((m) => m.ShareModal), { ssr: false });
const ReadingHistoryModal = dynamic(
  () => import("@/components/history/ReadingHistoryModal").then((m) => m.ReadingHistoryModal),
  { ssr: false }
);
const TarotEncyclopediaModal = dynamic(
  () => import("@/components/encyclopedia/TarotEncyclopediaModal").then((m) => m.TarotEncyclopediaModal),
  { ssr: false }
);
const AuthModal = dynamic(() => import("@/components/auth/AuthModal").then((m) => m.AuthModal), { ssr: false });
const CardZoomModal = dynamic(() => import("@/components/card/CardZoomModal").then((m) => m.CardZoomModal), {
  ssr: false,
});
const BuyCreditsModal = dynamic(
  () => import("@/components/entitlement/BuyCreditsModal").then((m) => m.BuyCreditsModal),
  { ssr: false }
);
const AccessDialog = dynamic(() => import("@/components/entitlement/AccessDialog").then((m) => m.AccessDialog), {
  ssr: false,
});
const PersonaCardSelector = dynamic(
  () => import("@/components/reading/PersonaCardSelector").then((m) => m.PersonaCardSelector),
  { ssr: false }
);
const IntentionAltarInput = dynamic(
  () => import("@/components/reading/IntentionAltarInput").then((m) => m.IntentionAltarInput),
  { ssr: false }
);

// P1-U1: ปุ่มย้อนกลับทีละขั้น — ใช้ร่วมในขั้นสับไพ่และเลือกไพ่
function StepBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] text-xs font-serif-th text-[#2E211A] hover:bg-[#FAF7F2] hover:border-[#8F5C1A] transition-colors duration-150 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3EDE2]"
    >
      <span aria-hidden="true">←</span> ย้อนกลับ
    </button>
  );
}

/**
 * แปลง `reason` ที่ API ส่งกลับมาเป็นเหตุผลของกำแพงสิทธิ์ฝั่ง UI
 * คืน null ถ้าไม่ใช่เรื่องสิทธิ์ (เช่น AI ล่ม) — กรณีนั้นให้แสดง error ตามปกติ
 */
function mapBlockedReason(reason?: string): UpgradeReason | null {
  if (reason === "guest_used") return "guest_used";
  if (reason === "daily_exhausted" || reason === "weekly_exhausted") return "daily_exhausted";
  if (reason === "members_only") return "members_only";
  return null;
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
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authFromWall, setAuthFromWall] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  // เหตุผลที่เปิดหน้าต่างสิทธิ์ — null = ปิดอยู่ (จุดเดียวที่คุมกำแพงสิทธิ์ทั้งเว็บ)
  const [accessReason, setAccessReason] = useState<UpgradeReason | null>(null);
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<DrawnSlotCard | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; email?: string } | null>(null);
  const entitlement = useEntitlement();
  const entitlementView = describeEntitlement(entitlement);
  const isPassHolder = Boolean(entitlementView?.isUnlimited || entitlement?.hasPaidCredits);

  /**
   * ทางเข้าเดียวของกำแพงสิทธิ์ — ทุกจุดที่ผู้ใช้ถูกกั้นต้องเรียกผ่านนี้
   * ห้ามเปิด AuthModal หรือ BuyCreditsModal ตรง ๆ พร้อมกับขึ้นแถบ error อีก
   * (ของเดิมทำสองอย่างพร้อมกัน ผู้ใช้เลยเจอข้อความซ้อนกันสองชั้น)
   */
  const openAccessDialog = (reason: UpgradeReason) => setAccessReason(reason);

  const openAuth = (mode: "signin" | "signup" = "signin", fromWall = false) => {
    setAuthMode(mode);
    setAuthFromWall(fromWall);
    setIsAuthOpen(true);
  };

  // ดึงสถานะล็อกอินผ่านแคชกลาง — ยิง /api/auth/me ครั้งเดียวต่อหน้า ไม่ใช่ทุกครั้งที่
  // เปิด/ปิดหน้าต่างเข้าสู่ระบบ (ของเดิมยิงซ้ำทุกครั้ง = อ่าน D1 ฟรี ๆ รอบละครั้ง)
  const authWasOpenRef = useRef(false);
  useEffect(() => {
    let alive = true;
    // อ่านใหม่จริง ๆ เฉพาะจังหวะ "เพิ่งปิดหน้าต่างเข้าสู่ระบบ" (อาจเพิ่งล็อกอินสำเร็จ)
    // ไม่ใช่ทุกครั้งที่ effect ทำงาน ไม่งั้นจะไปล้างแคชที่คอมโพเนนต์ลูกเพิ่งเติมไว้
    if (authWasOpenRef.current && !isAuthOpen) invalidateSessionCache();
    authWasOpenRef.current = isAuthOpen;

    fetchSessionUser().then((user) => {
      if (alive && user) setCurrentUser(user);
    });
    return () => {
      alive = false;
    };
  }, [isAuthOpen]);

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
  const [toast, setToast] = useState<ToastData | null>(null);

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
      // ตรวจสอบความสมบูรณ์ของไพ่ที่กู้คืน — ถ้าไพ่สูญหายหรือข้อมูลไม่สมบูรณ์ ห้ามกุ The Fool
      const isCorrupted =
        saved.drawnCards && saved.drawnCards.some((d) => !d || d.cardIndex === undefined || !d.card?.nameTh);
      if (isCorrupted) {
        setErrorMsg("ไม่พบข้อมูลไพ่ที่เปิด กรุณากดโหลดใหม่อีกครั้ง");
      } else if (saved.currentStep === "READING" && !saved.readingResult?.summary) {
        setErrorMsg("การอ่านไพ่ค้างไว้ตอนหน้าเว็บรีเฟรช กรุณากดโหลดใหม่อีกครั้งเพื่ออ่านคำทำนายต่อ");
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
      const isNewUser = searchParams.get("new_user") === "1";
      const isVerified = searchParams.get("verified") === "1";
      const isPwReset = searchParams.get("pw_reset") === "1";
      const verifyError = searchParams.get("verify_error");
      const authError = searchParams.get("auth_error");

      // 🧹 ล้าง auth query parameters ออกจาก URL ทันที
      // ป้องกันไม่ให้ query string ค้างใน address bar ของเบราว์เซอร์ ซึ่งทำให้ผู้ใช้เห็นแบนเนอร์ซ้ำตอนรีเฟรช
      if (isAuthSuccess || isVerified || isPwReset || verifyError || authError) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("auth_success");
        cleanUrl.searchParams.delete("new_user");
        cleanUrl.searchParams.delete("verified");
        cleanUrl.searchParams.delete("pw_reset");
        cleanUrl.searchParams.delete("verify_error");
        cleanUrl.searchParams.delete("auth_error");
        window.history.replaceState(
          {},
          "",
          cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : "") + cleanUrl.hash
        );
      }

      if (isVerified) {
        setToast({
          type: "success",
          title: "ยืนยันอีเมลสำเร็จ ✦",
          subtitle: `รับสิทธิ์เปิดไพ่ฟรีวันละ ${DAILY_LIMIT} ครั้งเรียบร้อยแล้ว`,
          duration: 4500,
        });
        refreshEntitlement();
      } else if (isAuthSuccess) {
        // ตรวจสอบเซสชันจริงก่อนแสดงการแจ้งเตือน
        import("@/lib/auth/use-session").then(({ fetchSessionUser }) => {
          fetchSessionUser({ force: true }).then((currentUser) => {
            if (currentUser) {
              refreshEntitlement();
              const welcomeKey = `tarot_welcomed_${currentUser.id}`;
              const hasBeenWelcomed = typeof window !== "undefined" && localStorage.getItem(welcomeKey) === "1";
              const isRecentAccount =
                currentUser.createdAt && Date.now() - new Date(currentUser.createdAt).getTime() < 10 * 60 * 1000;
              const isFirstTimeUser = isNewUser || (isRecentAccount && !hasBeenWelcomed);

              if (isFirstTimeUser && !hasBeenWelcomed) {
                // สมัครครั้งแรก (First-Time Signup Onboarding): แสดงสิทธิ์โควตาต้อนรับเพียงครั้งเดียว
                try {
                  localStorage.setItem(welcomeKey, "1");
                } catch {}

                setToast({
                  type: "welcome",
                  title: "ยินดีต้อนรับสู่วิหารศักดิ์สิทธิ์ ✦",
                  subtitle: `คุณได้รับสิทธิ์เปิดไพ่ฟรีวันละ ${DAILY_LIMIT} ครั้งเรียบร้อยแล้ว`,
                  duration: 4800,
                });
              } else {
                // ผู้ใช้เดิมเข้าสู่ระบบ (Returning User Login): ไม่แสดงข้อความสิทธิ์ซ้ำซาก ทักทายกระชับ 2.8 วินาทีแล้วจางหาย
                setToast({
                  type: "success",
                  title: "เข้าสู่วิหารเรียบร้อย ✦",
                  subtitle: `ยินดีต้อนรับกลับสู่ห้วงชะตา คุณ ${currentUser.name || "ผู้แสวงหาคำตอบ"}`,
                  duration: 2800,
                });
              }

              import("@/lib/utils/history").then((m) => {
                m.syncAnonymousHistoryToServer().then(({ merged }) => {
                  if (merged > 0) {
                    console.log(`[Journal Sync] ซิงก์ประวัติ ${merged} รายการเข้าสู่บัญชีสำเร็จ ✦`);
                  }
                });
              });
            }
          });
        });
      } else if (isPwReset) {
        setToast({
          type: "success",
          title: "ตั้งรหัสผ่านใหม่เรียบร้อย ✦",
          subtitle: "เข้าสู่วิหารศักดิ์สิทธิ์ได้ทันที",
          duration: 3500,
        });
        refreshEntitlement();
      } else if (verifyError === "expired") {
        setToast({
          type: "error",
          title: "ลิงก์ยืนยันอีเมลหมดอายุ",
          subtitle: "กรุณาขอลิงก์ใหม่จากเมนูโปรไฟล์ของคุณ",
          duration: 5000,
        });
      } else if (verifyError) {
        setToast({
          type: "error",
          title: "การยืนยันอีเมลไม่สำเร็จ",
          subtitle: "ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือถูกใช้งานไปแล้ว",
          duration: 5000,
        });
      } else if (authError) {
        setToast({
          type: "error",
          title: "เข้าสู่ระบบไม่สำเร็จ",
          subtitle: describeAuthError(authError),
          duration: 5000,
        });
      }

      if (!isAuthSuccess) {
        import("@/lib/utils/history").then((m) => {
          if (isVerified || isPwReset) {
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
    }
  }, []);

  // คอมโพเนนต์ลึก (เช่นช่องแชทที่ล็อกใน FollowUpChat) ขอเปิดหน้าต่างสิทธิ์พร้อม "เหตุผล"
  // จึงเลือกถ้อยคำและปุ่มให้ตรงสถานการณ์ได้ ไม่ใช่เด้งหน้าเข้าสู่ระบบเหมือนกันหมด
  useEffect(() => onUpgradeRequest((reason) => setAccessReason(reason)), []);

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
    currentStep,
    selectedSpread,
    selectedPersona,
    selectedCategory,
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
  ]);

  // Step 1 -> Step 2: Start Reading Session
  const handleStartSession = async () => {
    // สิทธิ์หมดตั้งแต่ยังไม่ยิง API — อธิบายด้วยหน้าต่างเดียว ไม่ต้องมีแถบแดงซ้อน
    if (entitlementView?.blocked) {
      openAccessDialog(entitlementView.blockedReason ?? "guest_used");
      return;
    }

    if (!isPassHolder && !isStandardSpread(selectedSpread.id)) {
      openAccessDialog("grand_spread");
      return;
    }

    if (!isPassHolder && isMasterPersona(selectedPersona.id)) {
      openAccessDialog("master_persona");
      return;
    }

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
      if (!res.ok) {
        // server เป็นผู้ตัดสินสิทธิ์เสมอ — ถ้าโดนกั้นที่นี่ ให้หน้าต่างสิทธิ์อธิบายแทนแถบ error
        const blockedReason = mapBlockedReason(data.reason);
        if (blockedReason) {
          refreshEntitlement();
          openAccessDialog(blockedReason);
          return;
        }
        throw new Error(data.error || "ไม่สามารถเริ่มดูดวงได้");
      }

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

      if (!data.drawn || !Array.isArray(data.drawn) || data.drawn.length === 0) {
        throw new Error("ไม่พบข้อมูลไพ่ที่เปิด กรุณากดโหลดใหม่อีกครั้ง");
      }

      const enrichedCards: DrawnSlotCard[] = data.drawn.map((d: any) => {
        if (d.cardIndex === undefined || d.cardIndex === null) {
          throw new Error("ไม่พบข้อมูลไพ่ที่เปิด กรุณากดโหลดใหม่อีกครั้ง");
        }
        const fullCard = cardByIndex(d.cardIndex);
        if (!fullCard) {
          throw new Error("ไม่พบข้อมูลไพ่ที่เปิด กรุณากดโหลดใหม่อีกครั้ง");
        }
        const kw = fullCard.keywords;
        const extractedKeywords = Array.isArray(kw) ? kw : d.isReversed ? (kw?.reversed ?? []) : (kw?.upright ?? []);

        return {
          order: d.order ?? 0,
          cardIndex: d.cardIndex,
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
        const errData = await res.json().catch(() => ({}) as { reason?: string; error?: string });
        const blockedReason = mapBlockedReason(errData.reason);
        if (blockedReason) {
          setIsStreaming(false);
          refreshEntitlement();
          openAccessDialog(blockedReason);
          return;
        }
        throw new Error(errData.error || "แม่หมอเชื่อมสัญญาณไม่ติดสักครู่ กรุณากดโหลดใหม่อีกครั้งค่ะ");
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
                // ผู้เยี่ยมชม: หักสิทธิ์ฟรี "หลัง" อ่านจบจริงเท่านั้น (server ออก ticket เฉพาะตอนนี้)
                // AI ล้ม = ไม่มี ticket = ไม่เสียสิทธิ์ · ยิงเสร็จค่อย refresh badge ให้ค่าตรง
                void (async () => {
                  if (data.guestConsumeTicket) {
                    await fetch("/api/entitlement/guest-consume", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ticket: data.guestConsumeTicket }),
                    }).catch(() => {});
                  }
                  refreshEntitlement(); // อ่านจบ → สิทธิ์อาจลดลง อัปเดต badge
                })();

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
                setErrorMsg(data.message || "ไม่พบข้อมูลไพ่ที่เปิด กรุณาโหลดใหม่อีกครั้ง");
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
        setErrorMsg("คำทำนายส่งมาไม่ครบสักนิดค่ะ กรุณากดโหลดใหม่อีกครั้ง แม่หมอพร้อมเปิดไพ่ให้ทันที");
      }
    } catch (err: any) {
      console.error("Stream reading failed", err);
      setIsStreaming(false);
      setErrorMsg(err.message || "สัญญาณระหว่างอ่านไพ่สะดุดชั่วคราวค่ะ กรุณากดโหลดใหม่อีกครั้ง");
    }
  };

  // Flip card manually
  const handleFlipCard = (order: number) => {
    setRevealedOrders((prev) => (prev.includes(order) ? prev.filter((o) => o !== order) : [...prev, order]));
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

  // overflow-x-clip (ไม่ใช่ overflow-hidden) — overflow-hidden ทำให้ <main> กลายเป็น scroll
  // container ทำให้ position: sticky ของ <header> ข้างในพัง หัวเว็บเลื่อนหลุดตามหน้า พอเปิดเมนู
  // dropdown แล้วเลื่อน แผงที่ composite อยู่ (เงา + ไล่สี) ถูกวาดใหม่ทุกเฟรม → กระพริบ
  // overflow-x: clip กันล้นแนวนอนได้เหมือนเดิมแต่ไม่สร้าง scroll container จึง sticky ทำงานปกติ
  return (
    <main className="min-h-screen text-[#29261F] relative overflow-x-clip bg-[#F3F0EA]">
      {/* Hardware Anchor for Immediate Viewport Alignment */}
      <div id="sanctuary-top-anchor" className="absolute top-0 left-0 w-0 h-0 pointer-events-none" />

      {/* Top Sacred Header — Solid White with Clean Dividing Line */}
      <header className="w-full border-b border-[#D5CEC2] bg-[#FFFFFF] sticky top-0 z-50 shadow-[var(--shadow-raised)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Luxury Brand Logo — P1-U2: กลับหน้าแรก ไม่ล้าง state (ปุ่ม "เริ่มดูดวงใหม่" ทำหน้าที่นั้น) */}
          <Link
            href="/"
            aria-label="ดูดวงไพ่ทาโรต์ — กลับหน้าแรก"
            className="flex min-w-0 shrink items-center gap-2.5 sm:gap-3.5 cursor-pointer group select-none rounded-lg p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A58A5C]"
          >
            {/* Seer Brand Logo */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#D5CEC2] overflow-hidden relative flex-shrink-0 bg-[#F3F0EA] group-hover:scale-105 transition-all duration-300">
              <img
                src="/logo.webp"
                alt="Seer Tarot Brand Logo"
                width={44}
                height={44}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>

            {/* แถบหัวมี 3 ปุ่มตั้งแต่มี QuotaMeter โผล่บนมือถือ — จอเล็กเหลือแค่ตราไพ่
                (ชื่อแบรนด์ที่ตัดคำหรือล้นทับปุ่มแย่กว่าการซ่อนชื่อไว้ก่อน) */}
            <div className="hidden min-w-0 flex-col justify-center sm:flex">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="text-[#A58A5C] text-xs">✦</span>
                <h1 className="font-serif-th text-sm sm:text-lg font-bold text-[#29261F] tracking-wide leading-snug py-0.5 whitespace-nowrap">
                  ดูดวงไพ่ทาโรต์
                </h1>
              </div>
              <span className="hidden sm:block text-[13px] tracking-[0.22em] text-[#635B4E] font-mono uppercase font-semibold pl-4">
                1909 RIDER-WAITE TAROT
              </span>
            </div>
          </Link>

          {/* Right Toolbar Controls (UserProfileBadge, Sacred Dropdown & Reset Button) */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <UserProfileBadge
              onOpenAuthModal={() => openAuth("signin")}
              onOpenPlans={() => openAccessDialog("explore")}
              onBuyCredits={() => setIsBuyCreditsOpen(true)}
            />

            <SacredNavDropdown
              onOpenHistory={() => {
                soundManager.playCardSelectSound();
                setIsHistoryOpen(true);
              }}
              onOpenPlans={() => openAccessDialog("explore")}
              onReset={handleReset}
              canReset={currentStep !== "SPREAD_SELECT"}
            />

            {currentStep !== "SPREAD_SELECT" && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-[#F3F0EA] font-bold bg-[#29261F] hover:bg-[#A58A5C] px-4 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer whitespace-nowrap hidden sm:flex items-center gap-1.5 font-serif-th shadow-xs"
              >
                <span>✦</span> เริ่มดูดวงใหม่
              </button>
            )}
          </div>
        </div>
      </header>

      {/* World-Class Sacred Floating Toast Notification HUD */}
      <AnimatePresence>{toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Main Sanctuary Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-12 sm:pb-16 relative z-10">
        <AnnouncementBanner />

        {/* ขั้น SUMMARY มีแบนเนอร์ error ในตัว StreamReader อยู่แล้ว — ไม่ต้องซ้ำด้านบน */}
        {errorMsg && currentStep !== "SUMMARY" && (
          <div className="mb-6 p-4 rounded-xl bg-[#FCEEEA] border border-[#D5CEC2] text-[#A6392C] text-xs sm:text-sm text-center flex flex-col sm:flex-row items-center justify-center gap-3 shadow-xs">
            <span>{errorMsg}</span>
            {readingId && drawnCards.length > 0 && !/โควตา|สิทธิ์|สมาชิก|เติมรอบ/.test(errorMsg) && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  startAIStreaming(readingId, drawnCards);
                }}
                className="px-4 py-1.5 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] font-serif-th font-bold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1 shadow-xs"
              >
                <span>✦</span> โหลดใหม่อีกครั้ง
              </button>
            )}
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
              className="space-y-10"
            >
              <EntitlementGate active={currentStep === "SPREAD_SELECT"} onRequestUpgrade={openAccessDialog}>
                <DailyCardStrip />
                <div className="text-center space-y-6 relative">
                  {/* 3D Floating Tarot Stage with Stacked Deck & Radiant Solar Halo */}
                  <div
                    className="h-56 sm:h-72 w-full flex items-center justify-center relative select-none"
                    style={{ perspective: 1200 }}
                  >
                    {/* แสงเทียนนุ่ม ๆ รอบสำรับ — นิ่งสนิท ไม่เต้น ไม่หมุน */}
                    <div
                      aria-hidden="true"
                      className="absolute w-72 h-72 sm:w-[400px] sm:h-[400px] rounded-full -z-10 pointer-events-none blur-2xl bg-radial from-[#A58A5C]/18 via-[#A58A5C]/06 to-transparent"
                    />

                    {/* 3D Realistic 78-Card Stacked Deck Container */}
                    <div className="relative group cursor-pointer" onClick={() => soundManager.playCardSelectSound()}>
                      {/* Layer 3: Deep Stack Base (Gold Gilded Edge) */}
                      <div className="absolute inset-0 w-36 h-54 sm:w-44 sm:h-64 rounded-xl bg-[#5A3E26] border border-[#D5CEC2]/60 translate-x-[6px] translate-y-[6px] shadow-[var(--shadow-overlay)]" />
                      {/* Layer 2: Middle Stack Deck */}
                      <div className="absolute inset-0 w-36 h-54 sm:w-44 sm:h-64 rounded-xl bg-[#4A3320] border border-[#D5CEC2]/70 translate-x-[3px] translate-y-[3px]" />

                      {/* Layer 1: Top Floating Hero Card */}
                      <div className="w-36 h-54 sm:w-44 sm:h-64 rounded-xl border-2 border-[#D5CEC2] card-back-pattern shadow-[var(--shadow-overlay)] flex flex-col items-center justify-between p-4 relative overflow-hidden anim-tarot-idle gpu-layer transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                        <div className="w-full flex justify-center items-center opacity-90">
                          <span className="text-[12px] font-serif-th text-[#FFFFFF] tracking-[0.25em] uppercase font-bold">
                            ✦ SACRED ORACLE ✦
                          </span>
                        </div>

                        {/* Clean Center */}
                        <div className="my-auto" />

                        <span className="text-xs font-serif-th font-bold text-[#FFFFFF]">
                          ไพ่ทาโรต์ 1909
                        </span>

                        {/* Dynamic Gold Sheen Sweep */}
                        <div className="gold-foil-sheen absolute inset-0 opacity-35 group-hover:opacity-75 transition-opacity duration-500" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-2xl sm:text-4xl font-serif-th font-bold text-[#29261F] tracking-wide">
                      เลือกผังการเปิดไพ่
                    </h2>
                    <p className="text-xs sm:text-sm text-[#635B4E] max-w-xl mx-auto font-serif-th">
                      เลือกรูปแบบการเปิดไพ่ที่เหมาะกับเรื่องที่คุณต้องการค้นหาคำตอบในจิตใจ
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
                  isPassHolder={isPassHolder}
                  proceedLabel={
                    entitlementView?.blocked
                      ? entitlementView.blockedReason === "daily_exhausted"
                        ? "เติมรอบเพื่อเปิดไพ่ต่อ"
                        : "สมัครสมาชิกฟรีเพื่อเปิดไพ่"
                      : !isPassHolder && !isStandardSpread(selectedSpread.id)
                        ? "ปลดล็อกผังนี้เพื่อเปิดไพ่"
                        : undefined
                  }
                  onRequireUpgrade={() => {
                    openAccessDialog("grand_spread");
                  }}
                  onProceed={() => {
                    if (entitlementView?.blocked) {
                      openAccessDialog(entitlementView.blockedReason ?? "guest_used");
                      return;
                    }
                    if (!isPassHolder && !isStandardSpread(selectedSpread.id)) {
                      openAccessDialog("grand_spread");
                      return;
                    }
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
              className="space-y-10"
            >
              <div className="text-center space-y-1">
                <h2 className="text-2xl sm:text-4xl font-serif-th font-bold text-[#29261F]">
                  ตั้งคำถาม &amp; เลือกแม่หมอ
                </h2>
                <p className="text-xs sm:text-sm text-[#635B4E] font-serif-th">
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
                isPassHolder={isPassHolder}
                onRequireUpgrade={() => {
                  openAccessDialog("master_persona");
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
              <div className="w-full max-w-2xl mx-auto p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] flex flex-nowrap items-center justify-between gap-2.5 sm:gap-3 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCardSelectSound();
                    scrollToSanctuaryTop();
                    navigateStep("SPREAD_SELECT");
                  }}
                  aria-label={`เปลี่ยนผัง (ตอนนี้เลือก ${selectedSpread.nameTh})`}
                  className="shrink-0 max-w-[42%] py-3 px-3.5 sm:px-5 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] text-xs font-serif-th text-[#29261F] hover:border-[#A58A5C] hover:text-[#A58A5C] transition-colors duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap overflow-hidden"
                >
                  <span aria-hidden="true">←</span>
                  <span>เปลี่ยนผัง</span>
                  <span className="hidden lg:inline truncate text-[#635B4E]">({selectedSpread.nameTh})</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartSession}
                  disabled={loading || !nickname.trim() || !question.trim()}
                  aria-label="ต่อไป: สับไพ่และเลือกไพ่ด้วยตัวเอง"
                  className={`flex-1 min-w-0 py-3 px-3 sm:px-7 rounded-full text-xs sm:text-sm font-bold font-serif-th transition-transform duration-150 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap shadow-sm ${
                    !nickname.trim() || !question.trim()
                      ? "bg-[#EAE7E0] text-[#635B4E] border border-[#D5CEC2] cursor-not-allowed"
                      : "bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] active:scale-95 cursor-pointer"
                  }`}
                >
                  <span aria-hidden="true">✦</span>
                  {loading ? (
                    <span className="truncate">กำลังโหลด...</span>
                  ) : (
                    <>
                      <span className="truncate sm:hidden">ต่อไป: สับไพ่</span>
                      <span className="truncate hidden sm:inline">ต่อไป: สับไพ่และเลือกไพ่ด้วยตัวเอง</span>
                    </>
                  )}
                  <span aria-hidden="true">→</span>
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
                currentPositionName={selectedSpread.positions[pickedIndices.length]?.nameTh || "ตำแหน่งที่เหลือ"}
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
              className="space-y-10"
            >
              {/* HERO ROW: Centered 3D Sacred Spread Altar (รูปที่ 2: ผังไพ่อันเดียวตรงกลางสง่างาม) */}
              <section aria-label="แท่นผังไพ่พยากรณ์" className="w-full max-w-5xl mx-auto">
                <SpreadBoard
                  spread={selectedSpread}
                  drawnCards={drawnCards}
                  revealedOrders={revealedOrders}
                  currentReadingPosition={activeCardIndex}
                  onFlipCard={handleFlipCard}
                  onRevealAll={() => setRevealedOrders(drawnCards.map((c) => c.order))}
                  onZoomCard={(c) => setZoomedCard(c)}
                />
              </section>

              {/* TWO-COLUMN ROW: คำทำนายไพ่ (ซ้าย ~75%) + การ์ดเข้าห้องแชทแม่หมอ (ขวา ~25% ติดหนึบ)
                  จอเล็กเรียงบนลงล่าง · จอ lg ขึ้นไปแบ่ง 3:1 */}
              <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-4 lg:items-start">
                <section aria-label="คำทำนายไพ่ทาโรต์" className="w-full lg:col-span-3">
                  <StreamReader
                    readingId={readingId}
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
                </section>

                {/* การ์ดเข้าห้องแชทกับแม่หมอ — จัดวางแนวตั้งให้พอดีคอลัมน์แคบ กดแล้วไปหน้าแชทเต็มจอ */}
                {readingId && (
                  <aside className="w-full lg:col-span-1 lg:sticky lg:top-24">
                    <Link
                      href="/reading/chat"
                      onClick={() => soundManager.playCardSelectSound()}
                      aria-label={`แชทออนไลน์กับ${selectedPersona.nameTh}`}
                      className="group flex flex-col gap-3 rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs transition-all hover:border-[#A58A5C] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A58A5C]"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="relative flex h-14 w-11 shrink-0 overflow-hidden rounded-lg border-2 border-[#D5CEC2] bg-[#F3EDE2]">
                          <CardImage
                            image={selectedPersona.cardImage}
                            alt={selectedPersona.nameTh}
                            className="h-full w-full object-cover object-top"
                            sizes="44px"
                          />
                        </span>
                        <span className="flex items-center gap-1 rounded-full border border-[#D5CEC2] bg-[#EBF3ED] px-2 py-0.5 text-[13px] font-medium text-[#3A7044]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#3A7044] animate-pulse" /> ออนไลน์
                        </span>
                      </span>
                      <span className="block font-serif-th text-sm font-bold text-[#29261F]">
                        แชทออนไลน์กับ{selectedPersona.nameTh}
                      </span>
                      <span className="block font-serif-th text-[13px] leading-relaxed text-[#635B4E]">
                        เปิดห้องแชทเต็มจอ พิมพ์ถามเจาะลึกต่อจากไพ่ชุดนี้ได้ทันที
                      </span>
                      <span className="mt-1 flex items-center justify-center gap-2 rounded-full bg-[#29261F] px-4 py-2.5 font-serif-th text-xs font-bold text-[#F3F0EA] transition-colors group-hover:bg-[#A58A5C]">
                        เปิดห้องแชท
                        <span className="transition-transform group-hover:translate-x-0.5">→</span>
                      </span>
                    </Link>
                  </aside>
                )}
              </div>

              {/* Bottom Quick Luxury Actions Deck */}
              <div className="p-5 sm:p-6 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-[#635B4E] font-serif-th">
                  <span className="text-[#A58A5C]">✦</span>
                  <span>บันทึกหรือแชร์คำทำนายนี้เก็บไว้ดูย้อนหลังได้</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playCardSelectSound();
                      setIsShareOpen(true);
                    }}
                    className="py-3 px-5 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] text-[#29261F] hover:border-[#A58A5C] hover:text-[#A58A5C] font-serif-th text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <span className="text-[#A58A5C]">✨</span> แชร์ผลคำทำนาย
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-3 px-6 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] font-bold font-serif-th text-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>✦</span> ดูดวงเรื่องอื่นต่อ
                  </button>
                </div>
              </div>

              {currentStep === "SUMMARY" && !isStreaming && (
                <PostReadingSignup onOpenAuth={() => openAuth("signup", true)} />
              )}
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

      <ReadingHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          refreshEntitlement(); // ปิดหน้าต่างแล้วสิทธิ์อาจเปลี่ยน (เพิ่งสมัคร/เข้าสู่ระบบ)
        }}
        initialMode={authMode}
        fromEntitlementWall={authFromWall}
      />

      <BuyCreditsModal
        isOpen={isBuyCreditsOpen}
        onClose={() => setIsBuyCreditsOpen(false)}
        user={currentUser}
        onRequireAuth={() => openAuth("signup", true)}
      />

      {/* หน้าต่างสิทธิ์การใช้งาน — จุดเดียวที่อธิบายเรื่องสิทธิ์ทั้งหมด */}
      <AccessDialog
        reason={accessReason}
        onClose={() => setAccessReason(null)}
        onSignup={() => openAuth("signup", true)}
        onSignin={() => openAuth("signin", true)}
        onBuyCredits={() => setIsBuyCreditsOpen(true)}
      />

      <TarotEncyclopediaModal isOpen={isEncyclopediaOpen} onClose={() => setIsEncyclopediaOpen(false)} />

      <CardZoomModal
        card={zoomedCard ? (zoomedCard.card as any) : null}
        positionName={zoomedCard?.position.nameTh}
        isReversed={zoomedCard?.isReversed}
        isOpen={!!zoomedCard}
        onClose={() => setZoomedCard(null)}
      />

      {/* ═══════════════════════════════════════════════════════════════
          Site-Wide Sanctuary Footer — Dark Editorial Quiet Luxury (#171512)
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="w-full relative overflow-hidden border-t border-[#D5CEC2]/30 bg-[#171512] text-[#F3F0EA]">
        {/* Ambient gold line above footer */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#A58A5C]/40 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto px-5 pt-12 pb-10 space-y-8 relative z-10">
          {/* Brand & Mission Statement — โลโก้เว็บ + ประโยคภารกิจ (ไม่มีแถบลิงก์) */}
          <div className="flex flex-col items-center justify-center gap-3 border-b border-[#D5CEC2]/20 pb-6 text-center">
            <Link
              href="/"
              aria-label="SeerTarot — หน้าแรก"
              className="inline-flex items-center gap-3 group rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A58A5C]"
            >
              <span className="w-11 h-11 rounded-full border border-[#A58A5C]/40 overflow-hidden bg-[#F3F0EA] flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                <img
                  src="/logo.webp"
                  alt="SeerTarot"
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </span>
              <span className="font-serif-th text-lg font-bold tracking-wide text-[#F3F0EA]">
                SeerTarot
              </span>
            </Link>
            <p className="font-serif-th text-sm text-[#E4DECF]">
              พื้นที่สงบสำหรับหยุด คิด ถาม และอ่านความหมายของตัวเอง
            </p>
          </div>

          {/* Row 1: AI Disclosure Card */}
          <div className="flex items-start gap-4 p-5 rounded-xl bg-[#1F1C18] border border-[#D5CEC2]/20 shadow-sm">
            <div className="w-9 h-13 sm:w-10 sm:h-15 rounded-lg overflow-hidden border border-[#D5CEC2]/30 flex-shrink-0 bg-[#171512]">
              <CardImage
                image="major-02.jpg"
                alt="The High Priestess - ข้อควรทราบเกี่ยวกับการทำนาย"
                className="w-full h-full object-cover"
                sizes="40px"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="text-[13px] font-bold text-[#A58A5C] uppercase tracking-wider font-serif-th">
                ข้อควรทราบเกี่ยวกับการทำนาย
              </h4>
              <p className="text-[13px] text-[#D5CEC2] leading-[1.7] font-serif-th">
                คำทำนายทั้งหมดประมวลผลด้วยระบบ AI จากหน้าไพ่ที่คุณเลือกและเปิดจริง จัดทำขึ้นเพื่อเป็นแนวทางและข้อคิดในการดำเนินชีวิต ไม่สามารถใช้แทนคำปรึกษาทางการแพทย์ กฎหมาย หรือการเงินได้ การตัดสินใจทุกอย่างยังคงเป็นของคุณเสมอ
              </p>
            </div>
          </div>

          {/* Row 2: Three-Column Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Privacy */}
            <a
              href="/privacy"
              className="group flex items-center gap-3 p-4 rounded-xl bg-[#1F1C18] border border-[#D5CEC2]/20 hover:border-[#A58A5C] transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A58A5C]"
            >
              <div className="w-8 h-12 rounded-lg overflow-hidden border border-[#D5CEC2]/30 group-hover:border-[#A58A5C] transition-colors flex-shrink-0 bg-[#171512]">
                <CardImage
                  image="major-11.jpg"
                  alt="Justice - นโยบายความเป็นส่วนตัว PDPA"
                  className="w-full h-full object-cover"
                  sizes="32px"
                />
              </div>
              <div>
                <span className="text-[13px] font-bold text-[#A58A5C] block font-serif-th">
                  นโยบายความเป็นส่วนตัว
                </span>
                <span className="text-[13px] text-[#D5CEC2] group-hover:text-[#F3F0EA] transition-colors font-serif-th">
                  คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                </span>
              </div>
            </a>

            {/* Mental Health Hotline */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1F1C18] border border-[#D5CEC2]/20">
              <div className="w-8 h-12 rounded-lg overflow-hidden border border-[#D5CEC2]/30 flex-shrink-0 bg-[#171512]">
                <CardImage
                  image="major-17.jpg"
                  alt="The Star - สายด่วนสุขภาพจิต 1323"
                  className="w-full h-full object-cover"
                  sizes="32px"
                />
              </div>
              <div>
                <span className="text-[13px] font-bold text-[#3A7044] block font-serif-th">
                  สายด่วนสุขภาพจิต
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-[#F3F0EA] font-mono tracking-wider">1323</span>
                  <span className="text-[12px] text-[#D5CEC2] font-serif-th">โทรฟรี 24 ชม.</span>
                </div>
              </div>
            </div>

            {/* Emergency */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#1F1C18] border border-[#D5CEC2]/20">
              <div className="w-8 h-12 rounded-lg overflow-hidden border border-[#D5CEC2]/30 flex-shrink-0 bg-[#171512]">
                <CardImage
                  image="major-08.jpg"
                  alt="Strength - แจ้งเหตุเจ็บป่วยฉุกเฉิน 1669"
                  className="w-full h-full object-cover"
                  sizes="32px"
                />
              </div>
              <div>
                <span className="text-[13px] font-bold text-[#A6392C] block font-serif-th">
                  แจ้งเหตุเจ็บป่วยฉุกเฉิน
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-[#F3F0EA] font-mono tracking-wider">1669</span>
                  <span className="text-[12px] text-[#D5CEC2] font-serif-th">โทรฟรี 24 ชม.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Bottom Branding Strip */}
          <div className="flex flex-col items-center gap-2 pt-4 border-t border-[#D5CEC2]/20">
            <div className="flex items-center gap-2">
              <div className="w-5 h-7 rounded overflow-hidden border border-[#D5CEC2]/30 flex-shrink-0 bg-[#171512]">
                <CardImage
                  image="major-01.jpg"
                  alt="The Magician"
                  className="w-full h-full object-cover"
                  sizes="20px"
                />
              </div>
              <span className="text-[13px] font-serif-th font-semibold text-[#D5CEC2]">
                SeerTarot · ไพ่ทาโรต์ 1909 Rider-Waite
              </span>
              <div className="w-5 h-7 rounded overflow-hidden border border-[#D5CEC2]/30 flex-shrink-0 bg-[#171512]">
                <CardImage image="major-21.jpg" alt="The World" className="w-full h-full object-cover" sizes="20px" />
              </div>
            </div>
            <p className="text-[13px] text-[#D5CEC2] font-serif-th text-center">
              ระบบสับไพ่โปร่งใสตรวจสอบได้ (Provably Fair) · สำรับดั้งเดิม 1909 Rider-Waite · คำทำนายประมวลผลด้วย AI
            </p>
            <p className="text-[13px] text-[#D5CEC2] font-serif-th text-center">
              © 2026 SeerTarot · สงวนลิขสิทธิ์ ·{" "}
              <Link href="/privacy" className="hover:text-[#A58A5C] transition-colors">
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
