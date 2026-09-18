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
import { getSpread } from "@/data/spreads";
import type { UpgradeReason } from "@/lib/entitlement/copy";
import { useLocale } from "@/lib/i18n";
import { createClientSeed } from "@/lib/tarot/client-seed";

/** หลักฐาน Provably Fair ที่เซิร์ฟเวอร์เปิดเผยหลังอ่านจบ */
export interface ReadingProof {
  serverSeed?: string;
  clientSeed?: string;
  commitment?: string;
  pickedIndices?: number[];
  deckSize?: number;
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
}

/** ไพ่ที่เซิร์ฟเวอร์เปิดให้ ก่อนแปลงเป็นไพ่เต็มใบ */
export interface RawDrawnCard {
  order: number;
  cardIndex: number;
  isReversed: boolean;
}

export interface AiReadingController {
  /** สถานะคำอ่าน (ใช้ตัวลดตัวเดียวกับหน้าแรก จึงกันสถานะขัดแย้งในตัวเองให้แล้ว) */
  state: ReturnType<typeof readingReducer>;
  /** ไพ่ที่เปิดได้จริงจากเซิร์ฟเวอร์ — คว่ำหน้าอยู่เสมอตามกฎเหล็กข้อ 4 */
  cards: DrawnSlotCard[];
  /** ไพ่ดิบจากเซิร์ฟเวอร์ (มีเสมอ แม้ตอนสั่งไม่ให้แปลงเป็นไพ่เต็มใบ) */
  rawDrawn: RawDrawnCard[];
  readingId: string | null;
  proof: ReadingProof | null;
  /** ไม่ใช่ null = ถูกกำแพงสิทธิ์กั้น ให้หน้าเปิด `AccessDialog` ด้วยเหตุผลนี้ */
  gate: UpgradeReason | null;
  /** ข้อความสายด่วนเมื่อด่านความปลอดภัยจับสัญญาณวิกฤต (กฎเหล็กข้อ 6) */
  crisisMessage: string | null;
  isPreparing: boolean;
  run: (request: AiReadingRequest) => Promise<void>;
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
  const [readingId, setReadingId] = useState<string | null>(null);
  const [proof, setProof] = useState<ReadingProof | null>(null);
  const [gate, setGate] = useState<UpgradeReason | null>(null);
  const [crisisMessage, setCrisisMessage] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "reset" });
    setCards([]);
    setRawDrawn([]);
    setReadingId(null);
    setProof(null);
    setGate(null);
    setCrisisMessage(null);
    setIsPreparing(false);
  }, []);

  const clearGate = useCallback(() => setGate(null), []);

  const run = useCallback(
    async (request: AiReadingRequest) => {
      const spread = getSpread(request.spreadId);
      if (!spread) {
        dispatch({
          type: "fail",
          message: isEnglish
            ? "This spread is unavailable. Please reload and try again."
            : "ไม่พบผังนี้ กรุณากดโหลดใหม่อีกครั้ง",
        });
        return;
      }

      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      setGate(null);
      setCrisisMessage(null);
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
            spreadId: spread.id,
            question: request.question,
            personaId,
            nickname: request.nickname,
            category: request.category,
            intake: {},
            lang: locale,
            clientSeed: freshSeed,
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

        if (request.resolveCards === false) {
          setIsPreparing(false);
        } else {
        const { cardByIndex } = await import("@/data/cards");
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

        /* ── 3. ให้แม่หมออ่าน แล้วสตรีมกลับมาทีละก้อน ─────────────────────── */
        dispatch({ type: "start" });
        const readRes = await fetch(`/api/reading/${sessionId}/read`, {
          method: "POST",
          signal: abortController.signal,
          headers: {
            "Content-Type": "application/json",
            "x-reading-token": latestToken,
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
                dispatch({ type: "done", reading: (payload.reading ?? null) as never });
                if (payload.proof) setProof(payload.proof);
                break;
              default:
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setIsPreparing(false);
        dispatch({ type: "fail", message: (err as Error)?.message || failMessage });
      }
    },
    [isEnglish, locale]
  );

  return {
    state,
    cards,
    rawDrawn,
    readingId,
    proof,
    gate,
    crisisMessage,
    isPreparing,
    run,
    reset,
    clearGate,
  };
}
