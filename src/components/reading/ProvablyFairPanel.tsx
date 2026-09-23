"use client";

import React, { useState } from "react";
import { verifyReading, type VerificationResult } from "@/lib/tarot/verify-client";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/utils/clipboard";

export interface ProvablyFairPanelProps {
  commitment: string;
  proof?: {
    serverSeed?: string;
    clientSeed?: string;
    commitment?: string;
    pickedIndices?: number[];
    deckSize?: number;
  } | null;
  drawn: {
    order: number;
    cardIndex: number;
    isReversed: boolean;
  }[];
}

export const ProvablyFairPanel: React.FC<ProvablyFairPanelProps> = ({ commitment, proof, drawn }) => {
  const { isEnglish } = useLocale();
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showIndependentGuide, setShowIndependentGuide] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const effectiveCommitment = proof?.commitment || commitment;
  const serverSeed = proof?.serverSeed;
  const clientSeed = proof?.clientSeed;
  const pickedIndices = proof?.pickedIndices;
  const deckSize = proof?.deckSize ?? 78;

  const isRevealed = Boolean(serverSeed && clientSeed && effectiveCommitment);

  const handleCopy = async (text: string, key: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      trackEvent("provably_fair_verify", { action: "copy_hash" });
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleVerify = async () => {
    if (!serverSeed || !clientSeed || !effectiveCommitment) return;
    setIsVerifying(true);
    trackEvent("provably_fair_verify", { action: "external_verify" });

    try {
      // Small intentional delay for smooth UI feedback animation
      await new Promise((r) => setTimeout(r, 220));
      const res = await verifyReading({
        serverSeed,
        clientSeed,
        commitment: effectiveCommitment,
        drawn,
        pickedIndices,
        deckSize,
        lang: isEnglish ? "en" : "th",
      });
      setResult(res);
    } catch (err: any) {
      setResult({
        commitmentOk: false,
        drawMatches: false,
        expectedDraw: [],
        mismatchDetail: err?.message || (isEnglish ? "An error occurred during re-verification." : "เกิดข้อผิดพลาดในการคำนวณซ้ำ"),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const verificationPayloadJson = JSON.stringify(
    {
      algorithm: "SHA-256 Stream PRNG + Fisher-Yates + Rejection Sampling (REVERSAL_RATE 0.4)",
      serverSeed: serverSeed || "",
      clientSeed: clientSeed || "",
      commitment: effectiveCommitment || "",
      deckSize,
      pickedIndices: pickedIndices || null,
      drawnCards: drawn,
    },
    null,
    2
  );

  return (
    <section
      aria-label={isEnglish ? "Provably-Fair Cryptographic Transparency Verification" : "ตรวจสอบความโปร่งใส Provably-Fair"}
      className="glass-tile !rounded-lg my-4 transition overflow-hidden"
    >
      {/* Header — แตะเพื่อยุบ/ขยาย (เริ่มต้นยุบไว้ ไม่ให้หน้ายาว) */}
      <button
        type="button"
        aria-expanded={isPanelOpen}
        aria-controls="provably-fair-body"
        onClick={() => {
          setIsPanelOpen((v) => {
            const next = !v;
            if (next) {
              trackEvent("provably_fair_verify", { action: "open_modal" });
            }
            return next;
          });
        }}
        className="flex w-full items-center justify-between gap-2 p-4 sm:p-5 text-left transition-colors hover:bg-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="glass-chip w-8 h-8 flex-shrink-0 flex items-center justify-center text-xs text-gold-ink">
            ✓
          </div>
          <div className="min-w-0">
            <h4 className="font-serif-th text-xs sm:text-sm font-bold text-ink-deep">
              {isEnglish
                ? "Mathematical Transparency (Provably-Fair Verification)"
                : "ความโปร่งใสทางคณิตศาสตร์ (Provably-Fair Verification)"}
            </h4>
            <p className="text-[13px] text-muted font-serif-th">
              {isPanelOpen
                ? isEnglish
                  ? "Cryptographically verifiable: cards are predetermined by seeds with zero post-selection bias."
                  : "พิสูจน์ได้ว่าผลไพ่ถูกกำหนดจาก Seed ล่วงหน้า ไม่มีการเลือกไพ่ทีหลัง"
                : isEnglish
                  ? "Tap to inspect 100% provably fair cryptographic proof"
                  : "แตะเพื่อดูวิธีตรวจสอบว่าผลไพ่ยุติธรรม 100%"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="glass-chip hidden sm:inline-block px-2.5 py-0.5 text-[13px] font-mono font-bold text-ink-deep">
            SHA-256 Commit-Reveal
          </span>
          <span
            className={`font-mono text-xs text-muted transition-transform duration-200 ${
              isPanelOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            ▼
          </span>
        </div>
      </button>

      {/*
        * ⚠️ ห้ามกลับไปอนิเมต `height: "auto"` ด้วย motion
        * การไล่ค่า height บังคับให้เบราว์เซอร์คำนวณ layout ใหม่ "ทุกเฟรม"
        * และไม่ใช่แค่กล่องนี้ — ทุกอย่างที่อยู่ใต้มันบนหน้าต้องขยับตามไปด้วย
        * แถบยุบ/ขยายเปิดครั้งเดียว = ~60 รอบ layout ซ้อนกันใน 240ms
        *
        * `.anim-swap-rise-sm` ให้กล่องกางเต็มความสูงทันที (layout รอบเดียว)
        * แล้วเลื่อนเนื้อหาขึ้นมา + จางเข้าด้วย transform/opacity ซึ่ง compositor ทำเอง
        * ตาเห็นใกล้เคียงของเดิมมากแต่ไวกว่า — แลกกับไม่มีอนิเมชันขาออก
        * ซึ่งเป็นข้อแลกเปลี่ยนชุดเดียวกับที่บ้านนี้ตัดสินใจไว้แล้วใน INC-0103
        */}
      {isPanelOpen && (
        <div id="provably-fair-body" className="overflow-hidden">
          <div className="anim-swap-rise-sm border-t border-line-warm/30 p-5 sm:p-6 space-y-4">
              {/* State 1: Before Reveal (No serverSeed yet) */}
              {!isRevealed && (
                <div className="altar-card-porcelain !rounded-lg space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="text-ink-deep font-serif-th font-bold flex items-center gap-1.5">
                      {" "}
                      {isEnglish ? "Server Randomness Commitment:" : "คำมั่นความสุ่มที่เซิร์ฟเวอร์ผูกมัดไว้ (Commitment):"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(effectiveCommitment, "comm_pre")}
                      className="text-[13px] text-gold-ink hover:underline cursor-pointer font-mono font-semibold"
                    >
                      {copiedKey === "comm_pre"
                        ? isEnglish
                          ? "✓ Copied"
                          : "✓ คัดลอกแล้ว"
                        : isEnglish
                          ? "Copy Hash"
                          : "คัดลอก Hash"}
                    </button>
                  </div>
                  <p className="altar-card-porcelain !rounded-lg font-mono text-[13px] text-ink-deep break-all p-2.5 select-all">
                    {effectiveCommitment || (isEnglish ? "Generating randomness commitment…" : "กำลังสร้างคำมั่นความสุ่ม…")}
                  </p>
                  <p className="text-[13px] text-muted font-serif-th leading-relaxed">
                    {isEnglish ? (
                      <>
                        The server committed to this deck order prior to your shuffle. The{" "}
                        <code className="text-gold-ink font-bold">serverSeed</code> will be disclosed once the reading finishes so you can audit independently.
                      </>
                    ) : (
                      <>
                        เซิร์ฟเวอร์ผูกมัดกับผลไพ่นี้แล้วตั้งแต่ก่อนคุณสับไพ่ — ค่า{" "}
                        <code className="text-gold-ink font-bold">serverSeed</code> จะถูกเฉลยหลังอ่านไพ่เสร็จสมบูรณ์
                        ให้คุณตรวจย้อนหลังได้
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* State 2 & 3: Revealed (serverSeed available) */}
              {isRevealed && (
                <div className="space-y-4">
                  {/* Seeds Display Grid */}
                  <div className="grid grid-cols-1 gap-2.5 text-xs font-mono">
                    {/* Commitment */}
                    <div className="altar-card-porcelain !rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-muted font-serif-th">
                          {isEnglish ? "1. Original Randomness Commitment:" : "1. คำมั่นความสุ่มดั้งเดิม (Commitment):"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(effectiveCommitment, "comm")}
                          className="text-[13px] text-gold-ink font-bold hover:underline cursor-pointer"
                        >
                          {copiedKey === "comm" ? (isEnglish ? "✓ Copied" : "✓ คัดลอกแล้ว") : isEnglish ? "Copy" : "คัดลอก"}
                        </button>
                      </div>
                      <p className="text-[13px] text-ink-deep break-all select-all font-mono">{effectiveCommitment}</p>
                    </div>

                    {/* Server Seed */}
                    <div className="altar-card-porcelain !rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-muted font-serif-th">
                          {isEnglish ? "2. Revealed Server Seed:" : "2. ซี้ดของเซิร์ฟเวอร์ที่เฉลย (Server Seed):"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(serverSeed || "", "server")}
                          className="text-[13px] text-gold-ink font-bold hover:underline cursor-pointer"
                        >
                          {copiedKey === "server" ? (isEnglish ? "✓ Copied" : "✓ คัดลอกแล้ว") : isEnglish ? "Copy" : "คัดลอก"}
                        </button>
                      </div>
                      <p className="text-[13px] text-ink-deep break-all select-all font-mono">{serverSeed}</p>
                    </div>

                    {/* Client Seed */}
                    <div className="altar-card-porcelain !rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-muted font-serif-th">
                          {isEnglish ? "3. Your Entropy from Hand Movement (Client Seed):" : "3. ซี้ดของคุณจากการขยับมือ (Client Seed):"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(clientSeed || "", "client")}
                          className="text-[13px] text-gold-ink font-bold hover:underline cursor-pointer"
                        >
                          {copiedKey === "client" ? (isEnglish ? "✓ Copied" : "✓ คัดลอกแล้ว") : isEnglish ? "Copy" : "คัดลอก"}
                        </button>
                      </div>
                      <p className="text-[13px] text-ink-deep break-all select-all font-mono">{clientSeed}</p>
                    </div>
                  </div>

                  {/* Verification Action Button */}
                  {!result && (
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={isVerifying}
                      aria-busy={isVerifying}
                      className="w-full py-3 px-4 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface font-serif-th font-bold text-xs sm:text-sm active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
                    >
                      
                      <span>
                        {isVerifying
                          ? isEnglish
                            ? "Recomputing in your browser…"
                            : "กำลังคำนวณซ้ำในเบราว์เซอร์ของคุณ…"
                          : isEnglish
                            ? "Verify Cryptographic Fairness Now"
                            : "ตรวจสอบความโปร่งใสด้วยตนเองเดี๋ยวนี้"}
                      </span>
                    </button>
                  )}

                  {/* Verification Results Panel */}
                  {/*
                    * ⚠️ เดิมเป็น `<AnimatePresence mode="wait">` ที่ **ไม่มี `exit` เลยสักตัว**
                    * `mode="wait"` มีหน้าที่เดียวคือ "รอตัวเก่าเล่นอนิเมชันขาออกให้จบก่อน"
                    * เมื่อไม่มีขาออก มันจึงไม่ได้ทำอะไรเลย นอกจากแบกความเสี่ยงเดิมมาด้วย —
                    * `AnimatePresence mode="wait"` คือสาเหตุรากของ INC-0015 ที่ทำให้พิธีดูดวง
                    * ค้างตายทั้งขั้นตอน (exit-transition deadlock กับ motion@13 + React 19.2)
                    * ผลลัพธ์การตรวจสอบก็เป็นกล่องที่โผล่มาครั้งเดียวแล้วอยู่ยาว ไม่มีการสลับไปมา
                    */}
                  {result && (
                      <div
                        aria-live="polite"
                        className="anim-swap-rise-sm space-y-3"
                      >
                        {result.commitmentOk && result.drawMatches ? (
                          /* Success Box */
                          <div className="p-4 rounded-lg bg-[#EBF3ED] border border-ok/50 space-y-2 ">
                            <div className="flex items-center gap-2 text-ok font-serif-th font-bold text-xs sm:text-sm">
                              <span className="w-5 h-5 rounded-full bg-ok text-white flex items-center justify-center text-xs">
                                ✓
                              </span>
                              <span>
                                {isEnglish
                                  ? "This reading is cryptographically verified and 100% fair"
                                  : "การเปิดไพ่นี้พิสูจน์แล้วว่าโปร่งใสสมบูรณ์แบบ"}
                              </span>
                            </div>
                            <ul className="space-y-1 text-xs text-ok font-serif-th pl-7">
                              <li className="flex items-center gap-1.5">
                                <span>✓</span>
                                <span>
                                  <strong>
                                    {isEnglish ? "Commitment matches Seed:" : "คำมั่นตรงกับ Seed:"}
                                  </strong>{" "}
                                  <code className="font-mono text-[13px]">SHA256(serverSeed) === commitment</code>
                                </span>
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span>✓</span>
                                <span>
                                  {isEnglish ? (
                                    <>
                                      <strong>Cards match deterministic shuffle:</strong> 78-card deck shuffled via Fisher-Yates with seeds matches all positions exactly
                                    </>
                                  ) : (
                                    <>
                                      <strong>ไพ่ตรงกับการคำนวณซ้ำ:</strong> สำรับ 78 ใบสับด้วย Fisher-Yates จาก Seed
                                      ได้ไพ่ตรงทุกใบทุกตำแหน่ง
                                    </>
                                  )}
                                </span>
                              </li>
                            </ul>
                          </div>
                        ) : (
                          /* Mismatch Warning Box */
                          <div className="p-4 rounded-lg bg-err-wash border border-line-warm space-y-2 ">
                            <div className="flex items-center gap-2 text-err font-serif-th font-bold text-xs sm:text-sm">
                              <span className="w-5 h-5 rounded-full bg-err text-white flex items-center justify-center text-xs">
                                ✕
                              </span>
                              <span>
                                {isEnglish
                                  ? "Discrepancy detected during verification"
                                  : "พบข้อแตกต่างในการตรวจสอบความสอดคล้อง"}
                              </span>
                            </div>
                            <p className="text-xs text-err pl-7 font-serif-th">
                              {result.mismatchDetail ||
                                (isEnglish
                                  ? "Commitment or card drawing does not match recorded state."
                                  : "คำมั่นหรือผลลัพธ์การจั่วไพ่ไม่ตรงกับข้อมูลที่บันทึกไว้")}
                            </p>
                          </div>
                        )}

                        {/* Re-verify Button */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleVerify}
                            className="text-[13px] text-gold-ink hover:text-gold-ink-deep font-serif-th hover:underline cursor-pointer font-semibold"
                          >
                            {isEnglish ? "Re-run calculation" : "รันการคำนวณซ้ำอีกครั้ง"}
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Independent Verification Accordion */}
                  <div className="pt-2 border-t border-line-warm/30">
                    <button
                      type="button"
                      onClick={() => setShowIndependentGuide((prev) => !prev)}
                      // A5-20: บอกสถานะกาง/หุบ + ชี้แผงที่กาง
                      aria-expanded={showIndependentGuide}
                      aria-controls={showIndependentGuide ? "pf-independent-guide" : undefined}
                      className="tap-overlay-y w-full flex items-center justify-between text-left text-xs text-ink-deep hover:text-gold-ink py-1 cursor-pointer font-serif-th"
                    >
                      <span className="flex items-center gap-1.5">
                        
                        <span className="font-bold">
                          {isEnglish
                            ? "Independent Offline Verification Guide"
                            : "วิธีตรวจสอบด้วยตนเองแบบอิสระ (Independent Verification)"}
                        </span>
                      </span>
                      <span className="text-xs font-mono">
                        <span aria-hidden="true">{showIndependentGuide ? "▲ " : "▼ "}</span>
                        {showIndependentGuide
                          ? isEnglish
                            ? "Close"
                            : "ปิด"
                          : isEnglish
                            ? "View audit instructions"
                            : "ดูวิธีคำนวณ"}
                      </span>
                    </button>

                    {showIndependentGuide && (
                      <div
                        id="pf-independent-guide"
                        className="altar-card-porcelain !rounded-lg anim-swap-rise-sm mt-3 p-4 space-y-3 text-xs"
                      >
                        <p className="text-muted font-serif-th leading-relaxed">
                          {isEnglish
                            ? "You can copy this JSON audit payload and verify it using Node.js, Python, or any third-party tool to confirm the deterministic mathematical outcome without relying on our web interface:"
                            : "คุณสามารถคัดลอกชุดข้อมูล JSON นี้ไปรันผ่าน Node.js, Python หรือเครื่องมือภายนอกใด ๆ เพื่อยืนยันว่าผลลัพธ์มาจากสูตรคณิตศาสตร์จริง โดยไม่ต้องพึ่งพาหน้าเว็บของเรา:"}
                        </p>

                        <div className="relative">
                          <pre className="altar-card-porcelain !rounded-lg p-3 text-[13px] text-ink-deep font-mono overflow-x-auto max-h-48">
                            {verificationPayloadJson}
                          </pre>
                          <button
                            type="button"
                            onClick={() => handleCopy(verificationPayloadJson, "payload")}
                            className="glass-tile !rounded tap-overlay-y absolute top-2 right-2 px-2.5 py-1 text-ink-deep text-[13px] font-serif-th cursor-pointer"
                          >
                            {copiedKey === "payload"
                              ? isEnglish
                                ? "✓ Copied"
                                : "✓ คัดลอกแล้ว"
                              : isEnglish
                                ? "Copy JSON"
                                : "คัดลอก JSON"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
        </div>
      )}
    </section>
  );
};
