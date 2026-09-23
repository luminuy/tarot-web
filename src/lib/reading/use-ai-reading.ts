"use client";

/**
 * 🔮 ท่อเปิดไพ่ด้วย AI ที่ทุกหน้าใช้ร่วมกัน
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้
 *
 * เดิมท่อ `start ➔ shuffle ➔ read` เขียนฝังอยู่ใน `TarotFlow.tsx` ที่เดียว หน้าอื่น
 * (`/daily` · `/love/1-card` · `/pick-a-card` · `/cards/birth-card`) จึงไม่ได้ต่อกับ AI เลย
 * และไม่มีกำแพงสมัครสมาชิกด้วย เพราะกำแพงอยู่ที่ API ซึ่งหน้าเหล่านั้นไม่เคยเรียก
 *
 * คำสั่งเจ้าของโปรเจกต์ (2026-09-18): **ทุกทางเข้าต้องใช้คำอ่านจาก AI และต้องเข้าสู่ระบบ**
 * วิธีที่ปลอดภัยที่สุดคือให้ทุกหน้าเดินท่อเดียวกันนี้ เพราะกำแพงสิทธิ์และโควตาถูกบังคับ
 * **ที่เซิร์ฟเวอร์** อยู่แล้ว (`/api/reading/start` ตอบ 403 `signup_required`)
 * ไม่ใช่กำแพงฝั่งเบราว์เซอร์ที่ปิด DevTools แล้วข้ามได้
 *
 * ## สิ่งที่ตัวนี้ไม่ทำ
 *
 * ไม่วาดหน้าจอให้ — คืนแต่สถานะ ให้แต่ละหน้าเอาไปวางในดีไซน์ของตัวเอง
 * (หน้าไพ่ประจำวันกับหน้าเลือกกองไพ่หน้าตาคนละแบบกันสิ้นเชิง)
 *
 * ## กฎเหล็กข้อ 14 ที่ยังบังคับอยู่ในนี้
 *
 * ถ้าเซิร์ฟเวอร์คืนไพ่ที่แปลงเป็นใบจริงไม่ได้ ตัวนี้ **โยน error ให้ผู้ใช้กดโหลดใหม่**
 * ห้ามเดาไพ่ใบใดขึ้นมาแทนเด็ดขาด
 */

import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { readingReducer, READING_INITIAL } from "@/components/home/flow-reading";
import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import type { Category } from "@/data/cards/types";
import type { UpgradeReason } from "@/lib/entitlement/copy";
import { useLocale } from "@/lib/i18n";
import { createClientSeed } from "@/lib/tarot/client-seed";
/*
 * ⚠️ **ต้องเป็น `import type` เท่านั้น** — `derived-draw.ts` เป็นโมดูลฝั่งเซิร์ฟเวอร์ที่ลาก
 * สำรับไพ่เต็มและคลังคำอ่าน Pick A Card มาด้วย · เปลี่ยนเป็น import ธรรมดาเมื่อไหร่
 * บันเดิลของทุกหน้าที่ใช้ท่อนี้จะพองขึ้นทันทีหลายร้อย KB (ชนิดข้อมูลถูกลบทิ้งตอนคอมไพล์ แต่ค่าไม่ถูกลบ)
 */
import type { DerivedDrawDetail, DerivedDrawInput } from "@/lib/reading/derived-draw";

/** หลักฐาน Provably Fair ที่เซิร์ฟเวอร์เปิดเผยหลังอ่านจบ */
export interface ReadingProof {
  serverSeed?: string;
  clientSeed?: string;
  commitment?: string;
  pickedIndices?: number[];
  deckSize?: number;
  /** ไม่ว่าง = ไพ่ชุดนี้คำนวณมา ไม่ได้จั่วมา — ห้ามเอาไปตรวจด้วยแผง Provably Fair ของการจั่ว */
  derivation?: { kind: string };
}

export interface AiReadingRequest {
  /** ผังที่ใช้ — ต้องมีอยู่จริงใน `src/data/spreads.ts` */
  spreadId: string;
  category: Category;
  question: string;
  personaId?: string;
  nickname?: string;
  /**
   * ตำแหน่ง **ในพัดไพ่** ที่ผู้ใช้แตะเลือกเอง (0-77) — ไม่ใช่เลขไพ่
   * เซิร์ฟเวอร์ยังเป็นผู้ตัดสินว่าไพ่ใบไหนอยู่ตำแหน่งไหนตามผลสับที่ผูกกับเมล็ดสุ่ม
   * ปล่อยว่าง = ให้เซิร์ฟเวอร์หยิบให้จากบนสุดของสำรับที่สับแล้ว
   */
  pickedIndices?: number[];
  /**
   * แปลง cardIndex เป็นไพ่เต็มใบให้ด้วยหรือไม่ (ค่าตั้งต้น: แปลงให้)
   *
   * ⚠️ ตั้งเป็น `false` บนหน้าที่หวงน้ำหนักบันเดิล (`/daily` · `/love/1-card`)
   * เพราะการแปลงต้องดึง `@/data/cards` ซึ่งพ่วงคำทำนายอังกฤษ ≈126 KB มาด้วย
   * หน้าพวกนั้นอ่าน `rawDrawn` แล้วเปิดสำรับ `deck-th` ของตัวเองแทน
   */
  resolveCards?: boolean;
  /**
   * ข้อมูลตั้งต้นของ "ไพ่ที่คำนวณได้" (วันเกิด · หัวข้อ+กองของ Pick A Card)
   *
   * ส่งค่านี้เมื่อไหร่ เซิร์ฟเวอร์จะ **คำนวณไพ่เอง** และไม่จั่วสุ่มเลย
   * `spreadId` ต้องเป็นผังภายในที่คู่กับ `kind` เสมอ ไม่งั้นเซิร์ฟเวอร์ปฏิเสธตั้งแต่ `/start`
   */
  derive?: DerivedDrawInput;
}

/** ไพ่ที่เซิร์ฟเวอร์เปิดให้ ก่อนแปลงเป็นไพ่เต็มใบ */
export interface RawDrawnCard {
  order: number;
  cardIndex: number;
  isReversed: boolean;
}

/**
 * ไพ่ที่เซิร์ฟเวอร์แปลงชื่อ/ภาพมาให้แล้วในคำตอบของ `/shuffle`
 *
 * หน้าที่ต้องการแค่ "ชื่อกับภาพ" ใช้ชุดนี้ได้เลย ไม่ต้องเปิดสำรับฝั่งเบราว์เซอร์
 * (ทั้ง `@/data/cards` และ `@/data/cards/deck-th` ล้วนเป็นก้อนใหญ่)
 */
export interface ServerDrawnCard {
  id: string;
  nameTh: string;
  nameEn: string;
  image: string;
  element: string;
  keywords: string[];
}

export interface AiReadingController {
  /** สถานะคำอ่าน (ใช้ตัวลดตัวเดียวกับหน้าแรก จึงกันสถานะขัดแย้งในตัวเองให้แล้ว) */
  state: ReturnType<typeof readingReducer>;
  /** ไพ่ที่เปิดได้จริงจากเซิร์ฟเวอร์ — คว่ำหน้าอยู่เสมอตามกฎเหล็กข้อ 4 */
  cards: DrawnSlotCard[];
  /** ไพ่ดิบจากเซิร์ฟเวอร์ (มีเสมอ แม้ตอนสั่งไม่ให้แปลงเป็นไพ่เต็มใบ) */
  rawDrawn: RawDrawnCard[];
  /** ชื่อ/ภาพไพ่ที่เซิร์ฟเวอร์แปลงมาให้แล้ว (มีเสมอ) — เบากว่าการเปิดสำรับเองในเบราว์เซอร์ */
  serverCards: ServerDrawnCard[];
  /** รายละเอียดการคำนวณไพ่ เมื่อรอบนี้เป็น "ไพ่ที่คำนวณได้" — ไม่งั้นเป็น null */
  derived: DerivedDrawDetail | null;
  readingId: string | null;
  proof: ReadingProof | null;
  /** ไม่ใช่ null = ถูกกำแพงสิทธิ์กั้น ให้หน้าเปิด `AccessDialog` ด้วยเหตุผลนี้ */
  gate: UpgradeReason | null;
  /** ข้อความสายด่วนเมื่อด่านความปลอดภัยจับสัญญาณวิกฤต (กฎเหล็กข้อ 6) */
  crisisMessage: string | null;
  isPreparing: boolean;
  run: (request: AiReadingRequest) => Promise<void>;
  /** อ่านไพ่ชุดเดิมซ้ำโดยไม่จั่วใหม่ — false = ยังไม่มีไพ่ให้อ่าน */
  retryRead: () => Promise<boolean>;
  reset: () => void;
  clearGate: () => void;
}

/** แปลง `reason` จาก API เป็นเหตุผลของกำแพงสิทธิ์ฝั่ง UI (ชุดเดียวกับหน้าแรก) */
function mapBlockedReason(reason?: string): UpgradeReason | null {
  if (reason === "signup_required") return "signup_required";
  if (reason === "guest_used") return "guest_used";
  if (reason === "daily_exhausted" || reason === "weekly_exhausted") return "daily_exhausted";
  if (reason === "members_only") return "members_only";
  return null;
}

export function useAiReading(): AiReadingController {
  const { locale, isEnglish } = useLocale();
  const [state, dispatch] = useReducer(readingReducer, READING_INITIAL);
  const [cards, setCards] = useState<DrawnSlotCard[]>([]);
  const [rawDrawn, setRawDrawn] = useState<RawDrawnCard[]>([]);
  const [serverCards, setServerCards] = useState<ServerDrawnCard[]>([]);
  const [derived, setDerived] = useState<DerivedDrawDetail | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [proof, setProof] = useState<ReadingProof | null>(null);
  const [gate, setGate] = useState<UpgradeReason | null>(null);
  const [crisisMessage, setCrisisMessage] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  /** เป้าของ /read รอบล่าสุด — ปุ่ม "ลองใหม่" อ่านไพ่ชุดเดิมซ้ำโดยไม่จั่วใหม่ (A3-10) */
  const readTargetRef = useRef<{ sessionId: string; token: string } | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    readTargetRef.current = null;
    dispatch({ type: "reset" });
    setCards([]);
    setRawDrawn([]);
    setServerCards([]);
    setDerived(null);
    setReadingId(null);
    setProof(null);
    setGate(null);
    setCrisisMessage(null);
    setIsPreparing(false);
  }, []);

  const clearGate = useCallback(() => setGate(null), []);

  /** ขั้นที่ 3: ให้แม่หมออ่านไพ่ที่จั่วแล้ว — โยน Error เมื่อเชื่อมไม่ติด ให้ผู้เรียกจัดการ */
  const streamRead = useCallback(
    async (sessionId: string, token: string, signal: AbortSignal) => {
      const failMessage = isEnglish
        ? "Oracle connection momentarily lost. Please reload and try again."
        : "แม่หมอเชื่อมสัญญาณไม่ติดสักครู่ กรุณากดโหลดใหม่อีกครั้ง";
      /* ── 3. ให้แม่หมออ่าน แล้วสตรีมกลับมาทีละก้อน ─────────────────────── */
      dispatch({ type: "start" });
      const readRes = await fetch(`/api/reading/${sessionId}/read`, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          "x-reading-token": token,
        },
      });

      if (!readRes.ok || !readRes.body) {
        const errData = await readRes.json().catch(() => ({}) as { reason?: string; error?: string });
        const blocked = mapBlockedReason(errData.reason);
        if (blocked) {
          dispatch({ type: "stop" });
          setGate(blocked);
          return;
        }
        throw new Error(errData.error || failMessage);
      }

      const reader = readRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // ได้ done หรือ error แล้วหรือยัง — สตรีมที่ปิดโดยไม่มีสองอย่างนี้ = ขาดกลางทาง (ห้ามค้าง streaming)
      let gotTerminal = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;
          const eventMatch = chunk.match(/^event:\s*(\w+)/m);
          const dataMatch = chunk.match(/^data:\s*(.+)$/m);
          if (!eventMatch || !dataMatch) continue;

          let payload: {
            text?: string;
            message?: string;
            reading?: unknown;
            proof?: ReadingProof;
            guestConsumeTicket?: string;
          };
          try {
            payload = JSON.parse(dataMatch[1]);
          } catch {
            continue;
          }

          switch (eventMatch[1]) {
            case "opening":
              dispatch({ type: "opening", text: payload.text ?? "" });
              break;
            case "card":
              dispatch({ type: "card", card: payload as never });
              break;
            case "connections":
              dispatch({ type: "connections", text: payload.text ?? "" });
              break;
            case "summary":
              dispatch({ type: "summary", text: payload.text ?? "" });
              break;
            case "reset":
              dispatch({ type: "clearPartial" });
              break;
            case "done":
              gotTerminal = true;
              dispatch({ type: "done", reading: (payload.reading ?? null) as never });
              if (payload.proof) setProof(payload.proof);
              break;
            case "error":
              gotTerminal = true;
              dispatch({ type: "fail", message: payload.message || failMessage });
              break;
            default:
              break;
          }
        }
      }

      if (!gotTerminal) {
        dispatch({
          type: "fail",
          message: isEnglish
            ? "The reading stream was interrupted. Please reload and try again."
            : "คำทำนายส่งมาไม่ครบ กรุณากดโหลดใหม่อีกครั้ง",
        });
      }
    },
    [isEnglish]
  );

  /**
   * อ่านไพ่ชุดเดิมซ้ำ (A3-10) — ห้ามเรียก run() ใหม่ เพราะ run() เปิดเซสชันและจั่วไพ่ใบใหม่
   * ผู้ใช้ที่เห็นไพ่ใบหนึ่งแล้วคำอ่านล้ม ต้องได้คำอ่านของใบเดิม ไม่ใช่สุ่มจนกว่าจะถูกใจ
   * คืน false เมื่อยังไม่มีไพ่ที่จั่วสำเร็จ (ผู้เรียกค่อยเริ่มใหม่ทั้งรอบ)
   */
  const retryRead = useCallback(async (): Promise<boolean> => {
    const target = readTargetRef.current;
    if (!target) return false;
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;
    setGate(null);
    dispatch({ type: "clearError" });
    try {
      await streamRead(target.sessionId, target.token, abortController.signal);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return true;
      dispatch({
        type: "fail",
        message:
          (err as Error)?.message ||
          (isEnglish
            ? "Oracle connection momentarily lost. Please reload and try again."
            : "แม่หมอเชื่อมสัญญาณไม่ติดสักครู่ กรุณากดโหลดใหม่อีกครั้ง"),
      });
    }
    return true;
  }, [isEnglish, streamRead]);

  const run = useCallback(
    async (request: AiReadingRequest) => {
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      readTargetRef.current = null;
      setGate(null);
      setCrisisMessage(null);
      /*
       * ⚠️ ล้างไพ่ของรอบก่อนทิ้งก่อนเสมอ — ไม่ใช่รอให้ไพ่ชุดใหม่มาทับ
       * ไม่งั้นระหว่างรอเซิร์ฟเวอร์ หน้าเว็บจะยังถือไพ่ของรอบที่แล้วอยู่ แล้วเอาไปเทียบ/แสดงผิดรอบ
       * (หน้าไพ่วันเกิดเทียบรหัสไพ่กับผลคำนวณรอบใหม่ ➔ จะฟ้องว่า "ยืนยันไพ่ไม่สำเร็จ" ทั้งที่ยังไม่ได้ไพ่)
       */
      setCards([]);
      setRawDrawn([]);
      setServerCards([]);
      setDerived(null);
      setProof(null);
      setIsPreparing(true);
      dispatch({ type: "clearError" });

      const personaId = request.personaId || "warm";
      const failMessage = isEnglish
        ? "Oracle connection momentarily lost. Please reload and try again."
        : "แม่หมอเชื่อมสัญญาณไม่ติดสักครู่ กรุณากดโหลดใหม่อีกครั้ง";
      const missingCardMessage = isEnglish
        ? "Card draw data missing. Please reload and try again."
        : "ไม่พบข้อมูลไพ่ที่เปิด กรุณากดโหลดใหม่อีกครั้ง";

      try {
        const freshSeed = createClientSeed();

        /* ── 1. เปิดเซสชัน — จุดที่กำแพงสมัครสมาชิกทำงาน ───────────────────── */
        const startRes = await fetch("/api/reading/start", {
          method: "POST",
          signal: abortController.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spreadId: request.spreadId,
            question: request.question,
            personaId,
            nickname: request.nickname,
            category: request.category,
            intake: {},
            lang: locale,
            clientSeed: freshSeed,
            derive: request.derive,
          }),
        });
        const startData = await startRes.json().catch(() => ({}));

        /*
         * ⚠️ ต้องเช็ก `blocked` ก่อนดู `res.ok` เสมอ — ด่านความปลอดภัยคืน **200**
         * พร้อม `{ blocked: true, message }` ไม่ใช่ 4xx ถ้าข้ามไปอ่าน readingId เลย
         * ข้อความสายด่วนจะหายเงียบ (บทเรียนเดียวกับ `TarotFlow`)
         */
        if (startData.blocked) {
          setCrisisMessage(typeof startData.message === "string" ? startData.message : "");
          setIsPreparing(false);
          return;
        }
        if (!startRes.ok) {
          const blocked = mapBlockedReason(startData.reason);
          if (blocked) {
            setGate(blocked);
            setIsPreparing(false);
            return;
          }
          throw new Error(startData.error || failMessage);
        }

        const sessionId: string = startData.readingId || startData.id;
        const sessionToken: string = startData.sessionToken || "";
        setReadingId(sessionId);

        /* ── 2. จั่วไพ่ (หรือส่งไพ่ที่ถูกกำหนดไว้แล้วให้เซิร์ฟเวอร์ยืนยัน) ────── */
        const shuffleRes = await fetch(`/api/reading/${sessionId}/shuffle`, {
          method: "POST",
          signal: abortController.signal,
          headers: {
            "Content-Type": "application/json",
            "x-reading-token": sessionToken,
          },
          body: JSON.stringify({
            clientSeed: freshSeed,
            sessionToken: sessionToken || undefined,
            pickedIndices: request.pickedIndices,
          }),
        });
        const shuffleData = await shuffleRes.json().catch(() => ({}));
        if (!shuffleRes.ok) {
          if (shuffleRes.status === 410 || shuffleData.code === "SESSION_SEED_LOST") {
            throw new Error(
              isEnglish
                ? "Session expired during shuffle. Please start again."
                : "เซสชันหมดอายุระหว่างการสับไพ่ กรุณาเริ่มดูดวงใหม่อีกครั้ง"
            );
          }
          throw new Error(shuffleData.error || failMessage);
        }

        const latestToken: string = shuffleData.sessionToken || sessionToken;

        if (!Array.isArray(shuffleData.drawn) || shuffleData.drawn.length === 0) {
          throw new Error(missingCardMessage);
        }

        // ไพ่ดิบเก็บไว้ก่อนเสมอ — หน้าเบาใช้ชุดนี้แล้วไม่ต้องโหลดสำรับเต็ม
        const raw: RawDrawnCard[] = shuffleData.drawn.map(
          (d: { order?: number; cardIndex?: number | null; isReversed?: boolean }) => {
            // 🃏 กฎเหล็กข้อ 14 — ไม่มีเลขไพ่ = ให้ผู้ใช้โหลดใหม่ ห้ามเดาใบแทน
            if (d.cardIndex === undefined || d.cardIndex === null) throw new Error(missingCardMessage);
            return { order: d.order ?? 0, cardIndex: d.cardIndex, isReversed: !!d.isReversed };
          }
        );
        setRawDrawn(raw);
        setServerCards(Array.isArray(shuffleData.cards) ? (shuffleData.cards as ServerDrawnCard[]) : []);
        setDerived((shuffleData.derived as DerivedDrawDetail | undefined) ?? null);

        if (request.resolveCards === false) {
          setIsPreparing(false);
        } else {
        /*
         * ⚠️ ทั้งสำรับไพ่และคลังผังถูกโหลด **ตรงนี้เท่านั้น** ไม่ใช่ตอนเปิดหน้า
         * ข้อมูลผังทั้งก้อนหนักราว 17 KB gzip · หน้าที่ใช้ `resolveCards: false`
         * (ไพ่ใบเดียว · Pick A Card · ไพ่วันเกิด) จึงไม่ต้องจ่ายน้ำหนักนี้เลยสักไบต์
         * ความถูกต้องของรหัสผังยังถูกตรวจที่เซิร์ฟเวอร์อยู่แล้ว (`/start` ตอบ 404 ถ้าไม่มีผังนั้น)
         */
        const [cardByIndex, { getSpread }] = await Promise.all([
          // สำรับตามภาษาของหน้า — ไม่ลากคำทำนายอังกฤษมาให้ผู้ใช้ไทย (A8-02)
          import("@/data/cards/client-deck").then((m) => m.loadCardResolver(isEnglish)),
          import("@/data/spreads"),
        ]);
        const spread = getSpread(request.spreadId);
        if (!spread) throw new Error(missingCardMessage);
        const drawn: DrawnSlotCard[] = shuffleData.drawn.map(
          (d: { order?: number; cardIndex?: number | null; isReversed?: boolean }) => {
            // 🃏 กฎเหล็กข้อ 14 — หาไพ่ไม่เจอให้ผู้ใช้โหลดใหม่ ห้ามเดาใบแทนเด็ดขาด
            if (d.cardIndex === undefined || d.cardIndex === null) throw new Error(missingCardMessage);
            const fullCard = cardByIndex(d.cardIndex);
            if (!fullCard) throw new Error(missingCardMessage);

            const kw = fullCard.keywords;
            const keywords = Array.isArray(kw)
              ? kw
              : d.isReversed
                ? (kw?.reversed ?? [])
                : (kw?.upright ?? []);
            const order = d.order ?? 0;

            return {
              order,
              cardIndex: d.cardIndex,
              isReversed: !!d.isReversed,
              position: spread.positions?.[order] ?? {
                index: order,
                nameTh: "คำตอบต่อเรื่องนี้",
                nameEn: "Answer to your inquiry",
                meaning: "คำตอบตรงต่อคำถามที่ผู้ถามตั้งจิตถาม",
                meaningEn: "Direct answer to the querent's question",
              },
              card: {
                id: fullCard.id,
                nameTh: fullCard.nameTh,
                nameEn: fullCard.nameEn,
                image: fullCard.image,
                element: fullCard.element,
                keywords,
              },
            };
          }
        );
        setCards(drawn);
        setIsPreparing(false);
        }

        readTargetRef.current = { sessionId, token: latestToken };
        await streamRead(sessionId, latestToken, abortController.signal);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setIsPreparing(false);
        dispatch({ type: "fail", message: (err as Error)?.message || failMessage });
      }
    },
    [isEnglish, locale, streamRead]
  );

  return {
    state,
    cards,
    rawDrawn,
    serverCards,
    derived,
    readingId,
    proof,
    gate,
    crisisMessage,
    isPreparing,
    run,
    retryRead,
    reset,
    clearGate,
  };
}
