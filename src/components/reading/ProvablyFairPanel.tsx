"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { verifyReading, type VerificationResult } from "@/lib/tarot/verify-client";
import { SPRING } from "@/lib/motion";
import { trackEvent } from "@/lib/analytics";

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
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      trackEvent("provably_fair_verify", { action: "copy_hash" });
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore
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
      });
      setResult(res);
    } catch (err: any) {
      setResult({
        commitmentOk: false,
        drawMatches: false,
        expectedDraw: [],
        mismatchDetail: err?.message || "เกิดข้อผิดพลาดในการคำนวณซ้ำ",
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
      aria-label="ตรวจสอบความโปร่งใส Provably-Fair"
      className="my-4 rounded-lg border border-[#D9C8AC] bg-[#F3EDE2] transition-all overflow-hidden"
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
        className="flex w-full items-center justify-between gap-2 p-4 sm:p-5 text-left transition-colors hover:bg-[#FFFFFF] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 flex-shrink-0 rounded-full border border-[#D9C8AC] flex items-center justify-center text-xs text-[#8F5C1A] bg-[#FFFFFF] ">
            ✦
          </div>
          <div className="min-w-0">
            <h4 className="font-serif-th text-xs sm:text-sm font-bold text-[#2E211A]">
              ความโปร่งใสทางคณิตศาสตร์ (Provably-Fair Verification)
            </h4>
            <p className="text-[13px] text-[#635B4E] font-serif-th">
              {isPanelOpen
                ? "พิสูจน์ได้ว่าผลไพ่ถูกกำหนดจาก Seed ล่วงหน้า ไม่มีการเลือกไพ่ทีหลัง"
                : "แตะเพื่อดูวิธีตรวจสอบว่าผลไพ่ยุติธรรม 100%"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline-block rounded-full border border-[#D9C8AC] bg-[#FFFFFF] px-2.5 py-0.5 text-[13px] font-mono font-bold text-[#2E211A]">
            SHA-256 Commit-Reveal
          </span>
          <span
            className={`font-mono text-xs text-[#635B4E] transition-transform duration-200 ${
              isPanelOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            ▼
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isPanelOpen && (
          <motion.div
            key="pf-body"
            id="provably-fair-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING.snappy}
            className="overflow-hidden"
          >
            <div className="border-t border-[#D9C8AC]/30 p-5 sm:p-6 space-y-4">
              {/* State 1: Before Reveal (No serverSeed yet) */}
              {!isRevealed && (
                <div className="space-y-3 p-4 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] ">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="text-[#2E211A] font-serif-th font-bold flex items-center gap-1.5">
                      <span className="text-[#8F5C1A]">✦</span> คำมั่นความสุ่มที่เซิร์ฟเวอร์ผูกมัดไว้ (Commitment):
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(effectiveCommitment, "comm_pre")}
                      className="text-[13px] text-[#8F5C1A] hover:underline cursor-pointer font-mono font-semibold"
                    >
                      {copiedKey === "comm_pre" ? "✓ คัดลอกแล้ว" : "คัดลอก Hash"}
                    </button>
                  </div>
                  <p className="font-mono text-[13px] text-[#2E211A] break-all bg-[#FFFFFF] p-2.5 rounded-lg border border-[#D9C8AC] select-all ">
                    {effectiveCommitment || "กำลังสร้างคำมั่นความสุ่ม…"}
                  </p>
                  <p className="text-[13px] text-[#635B4E] font-serif-th leading-relaxed">
                    เซิร์ฟเวอร์ผูกมัดกับผลไพ่นี้แล้วตั้งแต่ก่อนคุณสับไพ่ — ค่า{" "}
                    <code className="text-[#8F5C1A] font-bold">serverSeed</code> จะถูกเฉลยหลังอ่านไพ่เสร็จสมบูรณ์
                    ให้คุณตรวจย้อนหลังได้
                  </p>
                </div>
              )}

              {/* State 2 & 3: Revealed (serverSeed available) */}
              {isRevealed && (
                <div className="space-y-4">
                  {/* Seeds Display Grid */}
                  <div className="grid grid-cols-1 gap-2.5 text-xs font-mono">
                    {/* Commitment */}
                    <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] space-y-1 ">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#635B4E] font-serif-th">1. คำมั่นความสุ่มดั้งเดิม (Commitment):</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(effectiveCommitment, "comm")}
                          className="text-[13px] text-[#8F5C1A] font-bold hover:underline cursor-pointer"
                        >
                          {copiedKey === "comm" ? "✓ คัดลอกแล้ว" : "คัดลอก"}
                        </button>
                      </div>
                      <p className="text-[13px] text-[#2E211A] break-all select-all font-mono">{effectiveCommitment}</p>
                    </div>

                    {/* Server Seed */}
                    <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] space-y-1 ">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#635B4E] font-serif-th">
                          2. ซี้ดของเซิร์ฟเวอร์ที่เฉลย (Server Seed):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(serverSeed || "", "server")}
                          className="text-[13px] text-[#8F5C1A] font-bold hover:underline cursor-pointer"
                        >
                          {copiedKey === "server" ? "✓ คัดลอกแล้ว" : "คัดลอก"}
                        </button>
                      </div>
                      <p className="text-[13px] text-[#2E211A] break-all select-all font-mono">{serverSeed}</p>
                    </div>

                    {/* Client Seed */}
                    <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] space-y-1 ">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-[#635B4E] font-serif-th">3. ซี้ดของคุณจากการขยับมือ (Client Seed):</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(clientSeed || "", "client")}
                          className="text-[13px] text-[#8F5C1A] font-bold hover:underline cursor-pointer"
                        >
                          {copiedKey === "client" ? "✓ คัดลอกแล้ว" : "คัดลอก"}
                        </button>
                      </div>
                      <p className="text-[13px] text-[#2E211A] break-all select-all font-mono">{clientSeed}</p>
                    </div>
                  </div>

                  {/* Verification Action Button */}
                  {!result && (
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={isVerifying}
                      aria-busy={isVerifying}
                      className="w-full py-3 px-4 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] font-serif-th font-bold text-xs sm:text-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
                    >
                      <span>{isVerifying ? "✦" : "✨"}</span>
                      <span>
                        {isVerifying ? "กำลังคำนวณซ้ำในเบราว์เซอร์ของคุณ…" : "ตรวจสอบความโปร่งใสด้วยตนเองเดี๋ยวนี้"}
                      </span>
                    </button>
                  )}

                  {/* Verification Results Panel */}
                  <AnimatePresence mode="wait">
                    {result && (
                      <motion.div
                        key="verify-result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={SPRING.snappy}
                        aria-live="polite"
                        className="space-y-3"
                      >
                        {result.commitmentOk && result.drawMatches ? (
                          /* Success Box */
                          <div className="p-4 rounded-lg bg-[#EBF3ED] border border-[#3A7044]/50 space-y-2 ">
                            <div className="flex items-center gap-2 text-[#3A7044] font-serif-th font-bold text-xs sm:text-sm">
                              <span className="w-5 h-5 rounded-full bg-[#EBF3ED] text-[#3A7044] flex items-center justify-center text-xs">
                                ✓
                              </span>
                              <span>✦ การเปิดไพ่นี้พิสูจน์แล้วว่าโปร่งใสสมบูรณ์แบบ</span>
                            </div>
                            <ul className="space-y-1 text-xs text-[#3A7044] font-serif-th pl-7">
                              <li className="flex items-center gap-1.5">
                                <span>✓</span>
                                <span>
                                  <strong>คำมั่นตรงกับ Seed:</strong>{" "}
                                  <code className="font-mono text-[13px]">SHA256(serverSeed) === commitment</code>
                                </span>
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span>✓</span>
                                <span>
                                  <strong>ไพ่ตรงกับการคำนวณซ้ำ:</strong> สำรับ 78 ใบสับด้วย Fisher-Yates จาก Seed
                                  ได้ไพ่ตรงทุกใบทุกตำแหน่ง
                                </span>
                              </li>
                            </ul>
                          </div>
                        ) : (
                          /* Mismatch Warning Box */
                          <div className="p-4 rounded-lg bg-[#FCEEEA] border border-[#D9C8AC] space-y-2 ">
                            <div className="flex items-center gap-2 text-[#A6392C] font-serif-th font-bold text-xs sm:text-sm">
                              <span className="w-5 h-5 rounded-full bg-[#FCEEEA] text-[#A6392C] flex items-center justify-center text-xs">
                                ✕
                              </span>
                              <span>พบข้อแตกต่างในการตรวจสอบความสอดคล้อง</span>
                            </div>
                            <p className="text-xs text-[#A6392C] pl-7 font-serif-th">
                              {result.mismatchDetail || "คำมั่นหรือผลลัพธ์การจั่วไพ่ไม่ตรงกับข้อมูลที่บันทึกไว้"}
                            </p>
                          </div>
                        )}

                        {/* Re-verify Button */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleVerify}
                            className="text-[13px] text-[#8F5C1A] hover:text-[#74490F] font-serif-th hover:underline cursor-pointer font-semibold"
                          >
                            ✦ รันการคำนวณซ้ำอีกครั้ง
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Independent Verification Accordion */}
                  <div className="pt-2 border-t border-[#D9C8AC]/30">
                    <button
                      type="button"
                      onClick={() => setShowIndependentGuide((prev) => !prev)}
                      className="w-full flex items-center justify-between text-left text-xs text-[#2E211A] hover:text-[#8F5C1A] py-1 cursor-pointer font-serif-th"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-[#8F5C1A]">✦</span>
                        <span className="font-bold">วิธีตรวจสอบด้วยตนเองแบบอิสระ (Independent Verification)</span>
                      </span>
                      <span className="text-xs font-mono">{showIndependentGuide ? "▲ ปิด" : "▼ ดูวิธีคำนวณ"}</span>
                    </button>

                    {showIndependentGuide && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-4 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] space-y-3 text-xs "
                      >
                        <p className="text-[#635B4E] font-serif-th leading-relaxed">
                          คุณสามารถคัดลอกชุดข้อมูล JSON นี้ไปรันผ่าน Node.js, Python หรือเครื่องมือภายนอกใด ๆ
                          เพื่อยืนยันว่าผลลัพธ์มาจากสูตรคณิตศาสตร์จริง โดยไม่ต้องพึ่งพาหน้าเว็บของเรา:
                        </p>

                        <div className="relative">
                          <pre className="p-3 rounded-lg bg-[#FFFFFF] border border-[#D9C8AC] text-[13px] text-[#2E211A] font-mono overflow-x-auto max-h-48 ">
                            {verificationPayloadJson}
                          </pre>
                          <button
                            type="button"
                            onClick={() => handleCopy(verificationPayloadJson, "payload")}
                            className="absolute top-2 right-2 px-2.5 py-1 rounded bg-[#F3EDE2] border border-[#D9C8AC] text-[#2E211A] text-[13px] font-serif-th hover:bg-[#FFFFFF] hover:border-[#8F5C1A] cursor-pointer "
                          >
                            {copiedKey === "payload" ? "✓ คัดลอกแล้ว" : "คัดลอก JSON"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
