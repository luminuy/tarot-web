import * as Crypto from "expo-crypto";
import { useCallback, useReducer, useRef, useState } from "react";

import { ApiError, apiJson, streamReading } from "@/lib/api/client";
import type { ReadingResult, ShuffleResponse, StartBlocked, StartResponse } from "@/lib/api/types";
import { getToken } from "@/lib/auth/session";
import { verifyReadingLocal } from "@/lib/provably-fair";
import { initialState, reducer, type FlowState, type Topic } from "@/lib/reading-flow";
import { PERSONAS } from "@core/data/personas";
import type { Spread } from "@core/data/spreads";

export type Verification = "pending" | "ok" | "fail" | null;

const newClientSeed = (): string =>
  Array.from(Crypto.getRandomBytes(32), (b) => b.toString(16).padStart(2, "0")).join("");

/** เหตุผลที่หลังบ้านบอกว่า "ต้องล็อกอินก่อน" — ใช้พาผู้ใช้ไปหน้าเข้าสู่ระบบโดยไม่ทิ้งคำถาม */
const isSignInReason = (e: unknown) =>
  e instanceof ApiError && (e.status === 401 || /signin|sign_in|guest/i.test(e.body.reason ?? ""));

/**
 * ตัวขับพิธีเปิดไพ่: ต่อ state machine (`reading-flow.ts`) เข้ากับหลังบ้านเดิมของเว็บ
 * เซิร์ฟเวอร์เป็นผู้สับเสมอ — แอปส่งแค่ `clientSeed` + `pickedIndices` แบบเดียวกับเว็บ
 */
export function useReadingFlow(spread: Spread, init?: { topic?: Topic; question?: string }) {
  const [state, dispatch] = useReducer(reducer, initialState(init));
  const [busy, setBusy] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [verified, setVerified] = useState<Verification>(null);
  const clientSeed = useRef(newClientSeed());
  const stateRef = useRef<FlowState>(state);
  stateRef.current = state;

  const fail = useCallback((e: unknown, fallback = "เกิดข้อผิดพลาด โหลดใหม่อีกครั้งนะ") => {
    setNeedsSignIn(isSignInReason(e));
    dispatch({ type: "error", message: e instanceof Error ? e.message : fallback });
  }, []);

  /** ขั้น 2 → 3: เปิดเซสชัน (เซิร์ฟเวอร์ประกาศคำมั่นก่อนผู้ใช้เลือกไพ่) */
  const start = useCallback(async () => {
    const s = stateRef.current;
    setBusy(true);
    setNeedsSignIn(false);
    try {
      const res = await apiJson<StartResponse | StartBlocked>("/api/reading/start", {
        method: "POST",
        body: {
          spreadId: spread.id,
          question: s.question,
          personaId: s.personaId,
          category: s.topic,
          lang: "th",
          clientSeed: clientSeed.current,
        },
      });
      if ("blocked" in res && res.blocked) dispatch({ type: "blocked", message: res.message });
      else dispatch({ type: "started", session: res as StartResponse });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }, [spread.id, fail]);

  /** ขั้น 3 → 4: ส่งไพ่ที่ผู้ใช้เลือก ให้เซิร์ฟเวอร์สับ/เรียงตามตำแหน่ง */
  const confirmPick = useCallback(async () => {
    const s = stateRef.current;
    if (!s.session) return;
    setBusy(true);
    try {
      const res = await apiJson<ShuffleResponse>(`/api/reading/${s.session.id}/shuffle`, {
        method: "POST",
        body: { clientSeed: clientSeed.current, pickedIndices: s.picked, sessionToken: s.session.sessionToken },
      });
      // กฎเหล็กข้อ 14: จำนวนไพ่ที่ได้ไม่ครบผัง = ห้ามเดา ให้โหลดใหม่
      if (res.cards.length !== spread.positions.length) throw new Error("ข้อมูลไพ่ไม่ครบ กรุณาโหลดใหม่อีกครั้ง");
      dispatch({ type: "shuffled", shuffle: res });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }, [spread.positions.length, fail]);

  const saveJournal = useCallback(
    async (result: ReadingResult) => {
      const s = stateRef.current;
      if (!getToken() || !s.shuffle) return;
      const persona = PERSONAS.find((p) => p.id === s.personaId);
      // บันทึกสมุดเป็นงานเสริม — ล้มเหลวต้องไม่กระทบคำอ่านที่ผู้ใช้เห็นอยู่
      await apiJson("/api/journal", {
        method: "POST",
        body: {
          question: s.question.trim() || "ไม่ได้ระบุคำถาม",
          spreadId: spread.id,
          spreadName: spread.nameTh,
          category: spread.defaultCategory,
          personaId: s.personaId,
          personaName: persona?.nameTh ?? s.personaId,
          cards: s.shuffle.drawn.map((d, i) => ({
            order: d.order,
            positionName: spread.positions[i]?.nameTh ?? `ตำแหน่งที่ ${i + 1}`,
            cardIndex: d.cardIndex,
            cardNameTh: s.shuffle?.cards[i]?.nameTh ?? "",
            cardNameEn: s.shuffle?.cards[i]?.nameEn,
            isReversed: d.isReversed,
            element: s.shuffle?.cards[i]?.element,
          })),
          summary: result.summary,
        },
      }).catch(() => undefined);
    },
    [spread],
  );

  /** ขั้น 4 → 5: ให้แม่หมออ่าน (SSE) แล้วตรวจ Provably Fair ในเครื่อง */
  const read = useCallback(async () => {
    const s = stateRef.current;
    if (!s.session || !s.shuffle) return;
    dispatch({ type: "readStart" });
    setVerified(null);
    let done = false;
    try {
      for await (const ev of streamReading(s.session.id, s.session.sessionToken)) {
        if (ev.type === "error") throw new Error(ev.message);
        dispatch({ type: "stream", event: ev });
        if (ev.type === "done") {
          done = true;
          const { proof, reading } = ev;
          void saveJournal(reading);
          setVerified("pending");
          const drawn = s.shuffle.drawn;
          if (!proof.clientSeed) setVerified("fail");
          else
            verifyReadingLocal({
              serverSeed: proof.serverSeed,
              clientSeed: proof.clientSeed,
              commitment: proof.commitment,
              drawn,
              pickedIndices: proof.pickedIndices,
            })
              .then((r) => setVerified(r.commitmentOk && r.drawMatches ? "ok" : "fail"))
              .catch(() => setVerified("fail"));
        }
      }
      // สตรีมขาดก่อน `done` = ไม่มีคำอ่านที่สมบูรณ์ ห้ามแสดงครึ่ง ๆ กลาง ๆ เป็นคำทำนาย
      if (!done) throw new Error("คำอ่านขาดตอน กรุณาลองอีกครั้ง");
    } catch (e) {
      setNeedsSignIn(isSignInReason(e));
      dispatch({ type: "readFailed", message: e instanceof Error ? e.message : "อ่านไพ่ไม่สำเร็จ ลองใหม่อีกครั้งนะ" });
    }
  }, [saveJournal]);

  return { state, dispatch, busy, needsSignIn, verified, start, confirmPick, read };
}
