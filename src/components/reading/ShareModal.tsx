"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Persona } from "@/data/personas";
import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import type { Reading } from "@/lib/schema/reading";
import { soundManager } from "@/lib/utils/audio";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona;
  question: string;
  spreadName: string;
  cards: DrawnSlotCard[];
  reading?: Partial<Reading> | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  persona,
  question,
  spreadName,
  cards,
  reading,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const shareText = `✨ คำทำนายไพ่ทาโรต์ 1909 Rider-Waite จากวิหารออราเคิล
✦ ผังการวางไพ่: ${spreadName}
✦ คำถามอธิษฐาน: "${question || "ภาพรวมดวงชะตา"}"
✦ ไพ่ที่เปิดได้: ${cards.map((c) => `${c.position.nameTh}: ${c.card?.nameTh || "ไพ่"}${c.isReversed ? " (กลับหัว)" : ""}`).join(", ")}
✦ คำทำนายจากแม่หมอ ${persona.nameTh}: "${reading?.summary || "จงเชื่อมั่นในตนเองและก้าวต่อไปอย่างมีสติ"}"
✦ สัมผัสวิหารไพ่ทาโรต์ออนไลน์: ${typeof window !== "undefined" ? window.location.origin : ""}`;

  const handleCopyText = async () => {
    soundManager.playCardSelectSound();
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("คัดลอกข้อความสำเร็จ!");
    }
  };

  const handleNativeShare = async () => {
    soundManager.playCardSelectSound();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `คำทำนายไพ่ทาโรต์ (${spreadName})`,
          text: shareText,
          url: window.location.origin,
        });
      } catch {}
    } else {
      handleCopyText();
    }
  };

  // Direct HD PNG Image Generation using HTML5 Canvas
  const handleDownloadImage = async (format: "post" | "story" = "post") => {
    soundManager.playCardSelectSound();
    setIsGenerating(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      const width = 1080;
      const height = format === "story" ? 1920 : 1350;
      canvas.width = width;
      canvas.height = height;

      // Background Luxury Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#190e38");
      grad.addColorStop(0.5, "#0d071d");
      grad.addColorStop(1, "#05030a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Starry Sparkles
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < (format === "story" ? 140 : 90); i++) {
        const sx = Math.random() * width;
        const sy = Math.random() * height;
        const sr = Math.random() * 2 + 0.5;
        const sa = Math.random() * 0.7 + 0.2;
        ctx.globalAlpha = sa;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Outer Gold Double Border
      ctx.strokeStyle = "#e5c07b";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, width - 80, height - 80);
      ctx.strokeStyle = "rgba(229, 192, 123, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(52, 52, width - 104, height - 104);

      // Header: Brand & Spread
      const headerY = format === "story" ? 160 : 110;
      ctx.fillStyle = "#f5deaa";
      ctx.font = "bold 38px 'Noto Serif Thai', serif, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("✦ วิหารพยากรณ์ไพ่ทาโรต์", 80, headerY);

      ctx.fillStyle = "#e5c07b";
      ctx.font = "bold 26px 'Noto Sans Thai', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`ผัง: ${spreadName}`, width - 80, headerY);

      // Divider Line
      ctx.strokeStyle = "rgba(229, 192, 123, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, headerY + 30);
      ctx.lineTo(width - 80, headerY + 30);
      ctx.stroke();

      // Question Box
      const questionY = headerY + 60;
      if (question) {
        ctx.fillStyle = "rgba(10, 5, 20, 0.85)";
        ctx.strokeStyle = "rgba(229, 192, 123, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(80, questionY, width - 160, 110, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#e5c07b";
        ctx.font = "bold 20px 'Noto Sans Thai', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("✦ คำถามอธิษฐาน:", 105, questionY + 35);

        ctx.fillStyle = "#f5deaa";
        ctx.font = "bold 28px 'Noto Serif Thai', serif, sans-serif";
        ctx.fillText(`"${question.slice(0, 45)}${question.length > 45 ? "..." : ""}"`, 105, questionY + 75);
      }

      // Draw Tarot Cards Showcase
      const cardY = question ? 305 : 200;
      const displayCards = cards.slice(0, 5);
      const totalDisplay = displayCards.length;
      const cardW = 165;
      const cardH = 260;
      const gap = 20;
      const totalWidth = totalDisplay * cardW + (totalDisplay - 1) * gap;
      const startX = (width - totalWidth) / 2;

      // Preload real 1909 card images
      const loadedImages = await Promise.all(
        displayCards.map((c) => {
          return new Promise<HTMLImageElement | null>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = `/cards/${c.card?.image || c.card?.id + ".jpg"}`;
          });
        })
      );

      displayCards.forEach((c, idx) => {
        const cx = startX + idx * (cardW + gap);
        const cardImg = loadedImages[idx];

        // Card Background
        ctx.fillStyle = "#090614";
        ctx.beginPath();
        ctx.roundRect(cx, cardY, cardW, cardH, 18);
        ctx.fill();

        // Draw Real 1909 Rider-Waite Card Artwork if available
        if (cardImg) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(cx, cardY, cardW, cardH, 18);
          ctx.clip();

          if (c.isReversed) {
            ctx.translate(cx + cardW / 2, cardY + cardH / 2);
            ctx.rotate(Math.PI);
            ctx.drawImage(cardImg, -cardW / 2, -cardH / 2, cardW, cardH);
          } else {
            ctx.drawImage(cardImg, cx, cardY, cardW, cardH);
          }

          // Dark overlay gradient top & bottom
          const ovGrad = ctx.createLinearGradient(cx, cardY, cx, cardY + cardH);
          ovGrad.addColorStop(0, "rgba(0,0,0,0.85)");
          ovGrad.addColorStop(0.2, "rgba(0,0,0,0.2)");
          ovGrad.addColorStop(0.8, "rgba(0,0,0,0.3)");
          ovGrad.addColorStop(1, "rgba(0,0,0,0.9)");
          ctx.fillStyle = ovGrad;
          ctx.fillRect(cx, cardY, cardW, cardH);
          ctx.restore();
        }

        // Card Gold Border
        ctx.strokeStyle = "#e5c07b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(cx, cardY, cardW, cardH, 18);
        ctx.stroke();

        // Position Label
        ctx.fillStyle = "#f5deaa";
        ctx.font = "bold 17px 'Noto Sans Thai', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(c.position.nameTh.slice(0, 10), cx + cardW / 2, cardY + 28);

        // Card Name
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px 'Noto Serif Thai', serif, sans-serif";
        ctx.fillText(c.card?.nameTh || "ไพ่ทาโรต์", cx + cardW / 2, cardY + cardH - 35);

        // Orientation Status
        ctx.fillStyle = c.isReversed ? "#fda4af" : "#86efac";
        ctx.font = "bold 15px 'Noto Sans Thai', sans-serif";
        ctx.fillText(c.isReversed ? "กลับหัว ↷" : "หัวตั้ง ✦", cx + cardW / 2, cardY + cardH - 12);
      });

      // Oracle Summary Box
      const summaryY = cardY + cardH + 40;
      const summaryH = height - summaryY - 140;

      ctx.fillStyle = "rgba(10, 5, 20, 0.92)";
      ctx.strokeStyle = "rgba(229, 192, 123, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(80, summaryY, width - 160, summaryH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#e5c07b";
      ctx.font = "bold 24px 'Noto Serif Thai', serif, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`✨ คำพยากรณ์จากแม่หมอ ${persona.nameTh}:`, 110, summaryY + 45);

      // Multi-line wrap summary
      ctx.fillStyle = "#e2dcf2";
      ctx.font = "italic 24px 'Noto Serif Thai', serif, sans-serif";
      const words = (reading?.summary || "จงเชื่อมั่นในสัจธรรมแห่งไพ่และก้าวต่อไปอย่างมีสติ").split("");
      let line = "";
      let lineY = summaryY + 90;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 240 && n > 0) {
          ctx.fillText(line, 110, lineY);
          line = words[n];
          lineY += 40;
          if (lineY > summaryY + summaryH - 30) break;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 110, lineY);

      // Footer Watermark
      ctx.fillStyle = "#c59b27";
      ctx.font = "bold 20px 'Noto Sans Thai', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SACRED ORACLE TAROT · วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์", width / 2, height - 70);

      // Convert Canvas to Blob & Trigger Download
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Canvas to Blob failed");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `Tarot-Reading-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setIsGenerating(false);
      }, "image/png");
    } catch (err) {
      console.error("Generate image error", err);
      alert("เกิดข้อผิดพลาดในการสร้างรูปภาพ กรุณาลองใหม่อีกครั้ง");
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-3xl bg-[#0b0617]/98 border-2 border-[#e5c07b]/60 p-5 sm:p-7 shadow-[0_0_80px_rgba(229,192,123,0.3)] flex flex-col space-y-4 max-h-[95vh] overflow-y-auto no-scrollbar"
        >
          {/* Header Title */}
          <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📸</span>
              <div>
                <h3 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
                  แชร์การ์ดคำทำนายศักดิ์สิทธิ์
                </h3>
                <p className="text-[11px] text-[#9c93b8]">
                  บันทึกรูปภาพหรือคัดลอกข้อความเพื่อส่งต่อพลังงาน
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1b1230] border border-[#e5c07b]/30 text-[#e5c07b] hover:bg-[#e5c07b] hover:text-[#05040a] text-sm flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Social Share Preview Card */}
          <div
            ref={cardRef}
            className="w-full rounded-2xl bg-gradient-to-b from-[#1c123a] via-[#0d071c] to-[#06040d] border-2 border-[#e5c07b]/50 p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden"
          >
            {/* Background Geometric Light Aura */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#e5c07b]/15 via-transparent to-transparent pointer-events-none blur-2xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-radial from-[#8b5cf6]/15 via-transparent to-transparent pointer-events-none blur-2xl" />

            {/* Header / Brand & Spread Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e5c07b]/20 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-[#e5c07b] flex items-center justify-center bg-[#07050d] text-xs text-[#e5c07b]">
                  🔮
                </div>
                <span className="font-serif-th text-xs sm:text-sm font-bold font-mystic-gold">
                  วิหารทาโรต์ออราเคิล
                </span>
              </div>

              <span className="text-[10px] sm:text-xs text-[#05040a] font-serif-th font-bold bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] px-3 py-0.5 rounded-full shadow">
                ผัง: {spreadName}
              </span>
            </div>

            {/* Querent Question Banner */}
            {question && (
              <div className="p-3 rounded-xl bg-[#090514]/90 border border-[#e5c07b]/25 space-y-0.5 relative z-10 shadow-inner">
                <span className="text-[9px] uppercase tracking-widest text-[#e5c07b] font-mono block font-semibold">
                  ✦ คำถามอธิษฐาน:
                </span>
                <p className="font-serif-th text-xs sm:text-sm font-bold text-[#f5deaa] leading-relaxed">
                  "{question}"
                </p>
              </div>
            )}

            {/* Dedicated Exquisite Miniature Tarot Cards with 1909 Rider-Waite Artwork */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-2 relative z-10">
              {cards.slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  className="w-24 sm:w-28 rounded-2xl border-2 border-[#e5c07b]/50 bg-[#090614] p-1.5 shadow-xl flex flex-col items-center justify-between text-center space-y-1.5 relative overflow-hidden transition-transform hover:scale-105"
                  style={{ minHeight: "155px" }}
                >
                  <div className="w-full pb-0.5 border-b border-[#e5c07b]/20">
                    <span className="text-[8.5px] text-[#e5c07b] font-mono block uppercase truncate">
                      {c.position.nameTh}
                    </span>
                  </div>

                  <div className={`w-full h-22 rounded-lg overflow-hidden relative border border-[#e5c07b]/30 ${c.isReversed ? "rotate-180" : ""}`}>
                    <img
                      src={"/cards/" + (c.card?.image || c.card?.id + ".jpg")}
                      alt={c.card?.nameTh || "Tarot"}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  <div className="w-full pt-0.5 border-t border-[#e5c07b]/15 space-y-0.5">
                    <h5 className="font-serif-th text-[10.5px] sm:text-[11px] font-bold text-[#f5deaa] truncate leading-tight">
                      {c.card?.nameTh || `ใบที่ ${i + 1}`}
                    </h5>
                    <span
                      className={`text-[8px] px-1.5 py-0.2 rounded-full font-mono block ${
                        c.isReversed
                          ? "bg-rose-950/80 text-rose-300 border border-rose-500/40"
                          : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {c.isReversed ? "กลับหัว ↷" : "หัวตั้ง ✦"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Oracle Wisdom Summary Quote */}
            {reading?.summary && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#090514]/95 border border-[#e5c07b]/30 space-y-1.5 relative z-10 shadow-inner">
                <div className="flex items-center gap-1.5 text-[10px] text-[#e5c07b] font-serif-th font-bold">
                  <span>✨</span>
                  <span>คำพยากรณ์จากแม่หมอ {persona.nameTh}:</span>
                </div>
                <p className="font-serif-th text-xs sm:text-sm text-[#e2dcf2] italic leading-relaxed">
                  "{reading.summary}"
                </p>
              </div>
            )}

            {/* Watermark Tagline */}
            <div className="text-center pt-1 border-t border-[#e5c07b]/15">
              <span className="text-[9px] text-[#c59b27] font-mono tracking-widest uppercase">
                SACRED ORACLE TAROT
              </span>
            </div>
          </div>

          {/* Action Buttons Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
            <button
              onClick={() => handleDownloadImage("post")}
              disabled={isGenerating}
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] font-serif-th font-bold text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>{isGenerating ? "⏳" : "💾"}</span>
              <span>{isGenerating ? "กำลังสร้าง..." : "บันทึกภาพ (4:5)"}</span>
            </button>

            <button
              onClick={() => handleDownloadImage("story")}
              disabled={isGenerating}
              className="py-3 px-3 rounded-xl bg-[#22133c] hover:bg-[#341b5c] border border-[#e5c07b]/70 text-[#f5deaa] font-serif-th font-bold text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>📱</span>
              <span>บันทึก IG Story (9:16)</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-3 px-3 rounded-xl bg-[#170e28] border border-[#e5c07b]/40 text-[#f5deaa] font-serif-th font-semibold text-xs hover:bg-[#25183f] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <span>{copied ? "✓" : "📋"}</span>
              <span>{copied ? "คัดลอกแล้ว!" : "คัดลอกข้อความ"}</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="py-3 px-3 rounded-xl bg-[#170e28] border border-[#e5c07b]/40 text-[#f5deaa] font-serif-th font-semibold text-xs hover:bg-[#25183f] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <span>📲</span>
              <span>แชร์ให้เพื่อน</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
