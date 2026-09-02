"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Persona } from "@/data/personas";
import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import type { Reading } from "@/lib/schema/reading";
import { soundManager } from "@/lib/utils/audio";
import { CardImage } from "@/components/card/CardImage";
import { getCardImageSrc } from "@/lib/tarot/card-image";
import { cardByIndex } from "@/data/cards";
import { trackEvent } from "@/lib/analytics";

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
✦ ไพ่ที่เปิดได้: ${cards.map((c) => {
    const card = c.card || (c.cardIndex !== undefined ? cardByIndex(c.cardIndex) : null);
    return `${c.position.nameTh}: ${card?.nameTh || "ไพ่"}${c.isReversed ? " (กลับหัว)" : ""}`;
  }).join(", ")}
✦ คำทำนายจากแม่หมอ ${persona.nameTh}: "${reading?.summary || "จงเชื่อมั่นในตนเองและก้าวต่อไปอย่างมีสติ"}"
✦ สัมผัสวิหารไพ่ทาโรต์ออนไลน์: ${typeof window !== "undefined" ? window.location.origin : ""}`;

  const handleCopyText = async () => {
    soundManager.playCardSelectSound();
    trackEvent("share_click", { platform: "copy", spread_id: spreadName });
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    soundManager.playCardSelectSound();
    trackEvent("share_click", { platform: "native", spread_id: spreadName });
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

  const handleShareFacebook = () => {
    soundManager.playCardSelectSound();
    trackEvent("share_click", { platform: "facebook", spread_id: spreadName });
    const url = typeof window !== "undefined" ? window.location.origin : "https://seertarot.net";
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, "_blank", "noopener,noreferrer,width=600,height=550");
  };

  const handleShareInstagram = async () => {
    soundManager.playCardSelectSound();
    trackEvent("share_click", { platform: "instagram", spread_id: spreadName });
    await handleDownloadImage("story");
    await handleCopyText();
    alert("✨ บันทึกการ์ดรูปภาพสตอรี่ (9:16) และคัดลอกแคปชันเรียบร้อยแล้ว!\nเปิด Instagram แล้วเลือกรูปภาพนี้ลง Story หรือโพสต์ได้ทันที ✦");
    if (typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      window.location.href = "instagram://story-camera";
    }
  };

  const handleShareTwitter = () => {
    soundManager.playCardSelectSound();
    trackEvent("share_click", { platform: "twitter", spread_id: spreadName });
    const url = typeof window !== "undefined" ? window.location.origin : "https://seertarot.net";
    const text = `✨ ดูดวงไพ่ทาโรต์ 1909 Rider-Waite จากวิหารออราเคิล\nผัง: ${spreadName}\nคำถาม: "${question || "ภาพรวมดวงชะตา"}"\nคำทำนายจากแม่หมอ ${persona.nameTh}: "${reading?.summary ? reading.summary.slice(0, 100) + '...' : ''}"\n\n#ไพ่ทาโรต์ #ดูดวง #SeerTarot`;
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twUrl, "_blank", "noopener,noreferrer,width=600,height=550");
  };

  const handleShareThreads = () => {
    soundManager.playCardSelectSound();
    trackEvent("share_click", { platform: "threads", spread_id: spreadName });
    const url = typeof window !== "undefined" ? window.location.origin : "https://seertarot.net";
    const text = `✨ คำทำนายไพ่ทาโรต์ 1909 Rider-Waite จากวิหารออราเคิล\nผัง: ${spreadName}\nคำถาม: "${question || "ภาพรวมดวงชะตา"}"\nคำทำนาย: "${reading?.summary || ""}"\n${url}`;
    const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
    window.open(threadsUrl, "_blank", "noopener,noreferrer,width=600,height=550");
  };

  const handleShareTikTok = async () => {
    soundManager.playCardSelectSound();
    trackEvent("share_click", { platform: "tiktok", spread_id: spreadName });
    await handleDownloadImage("story");
    await handleCopyText();
    alert("✨ บันทึกการ์ดรูปภาพสตอรี่ (9:16) และคัดลอกแคปชันเรียบร้อยแล้ว!\nเปิดแอป TikTok แล้วเลือกรูปภาพนี้โพสต์ลง Story หรือวิดีโอได้ทันที ✦");
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
            const cardObj = c.card || (c.cardIndex !== undefined ? cardByIndex(c.cardIndex) : null);
            const imgSrc = getCardImageSrc(cardObj?.image, cardObj?.id);
            if (!imgSrc) {
              resolve(null);
              return;
            }
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = imgSrc;
          });
        })
      );

      displayCards.forEach((c, idx) => {
        const cx = startX + idx * (cardW + gap);
        const cardImg = loadedImages[idx];
        const cardObj = c.card || (c.cardIndex !== undefined ? cardByIndex(c.cardIndex) : null);

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
        ctx.fillText(cardObj?.nameTh || "ไพ่ทาโรต์", cx + cardW / 2, cardY + cardH - 35);

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
        role="dialog"
        aria-modal="true"
        aria-label="แชร์ผลคำทำนาย"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/93-xl"
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
              <span className="text-base text-[#ffd700]">✦</span>
              <div>
                <h3 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
                  แชร์ผลคำทำนาย
                </h3>
                <p className="text-[11px] text-[#9c93b8] font-serif-th">
                  บันทึกรูปภาพหรือคัดลอกข้อความเพื่อส่งต่อ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่างแชร์ผลคำทำนาย"
              className="w-11 h-11 rounded-2xl bg-[#1b1230] border border-[#e5c07b]/30 text-[#e5c07b] hover:bg-[#e5c07b] hover:text-[#05040a] text-sm flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700]"
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
                  ✦
                </div>
                <span className="font-serif-th text-xs sm:text-sm font-bold font-mystic-gold">
                  ดูดวงไพ่ทาโรต์
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
                  ✦ คำถามของคุณ:
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
                    <CardImage
                      image={c.card?.image}
                      cardId={c.card?.id}
                      alt={c.card?.nameTh || "Tarot"}
                      className="w-full h-full object-cover object-center tarot-card-enhance tarot-hd-card-image"
                      sizes="128px"
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
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] font-serif-th font-bold text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>{isGenerating ? "✦" : "✦"}</span>
              <span>{isGenerating ? "กำลังสร้าง..." : "โหลดรูปภาพ (โพสต์)"}</span>
            </button>

            <button
              onClick={() => handleDownloadImage("story")}
              disabled={isGenerating}
              className="py-3 px-3 rounded-xl bg-[#22133c] hover:bg-[#341b5c] border border-[#e5c07b]/70 text-[#f5deaa] font-serif-th font-bold text-xs shadow-lg hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span className="text-[#e5c07b]">✦</span>
              <span>โหลดรูปภาพ (สตอรี่)</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-3 px-3 rounded-xl bg-[#170e28] border border-[#e5c07b]/40 text-[#f5deaa] font-serif-th font-semibold text-xs hover:bg-[#25183f] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <span className="text-[#e5c07b]">{copied ? "✓" : "✦"}</span>
              <span>{copied ? "คัดลอกแล้ว!" : "คัดลอกข้อความ"}</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="py-3 px-3 rounded-xl bg-[#170e28] border border-[#e5c07b]/40 text-[#f5deaa] font-serif-th font-semibold text-xs hover:bg-[#25183f] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <span className="text-[#e5c07b]">✨</span>
              <span>แชร์ให้เพื่อน</span>
            </button>
          </div>

          {/* Direct 1-Click Social Media Platforms */}
          <div className="pt-3 border-t border-[#e5c07b]/20 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-serif-th text-[#e5c07b]/90 px-1">
              <span className="flex items-center gap-1.5 font-bold">
                <span>✨</span>
                <span>แชร์ตรงสู่โซเชียลมีเดีย:</span>
              </span>
              <span className="text-[10px] text-[#9c93b8]">1-Click Share</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {/* Facebook */}
              <button
                onClick={handleShareFacebook}
                className="py-2.5 px-2 rounded-xl bg-[#1877f2]/15 hover:bg-[#1877f2]/25 border border-[#1877f2]/40 text-blue-200 font-serif-th font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow hover:scale-[1.02] active:scale-95"
              >
                <svg className="w-4 h-4 text-[#1877f2] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>

              {/* Instagram */}
              <button
                onClick={handleShareInstagram}
                className="py-2.5 px-2 rounded-xl bg-gradient-to-tr from-[#fd1d1d]/15 via-[#e1306c]/15 to-[#833ab4]/15 hover:from-[#fd1d1d]/25 hover:via-[#e1306c]/25 hover:to-[#833ab4]/25 border border-[#e1306c]/40 text-pink-200 font-serif-th font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow hover:scale-[1.02] active:scale-95"
              >
                <svg className="w-4 h-4 text-[#e1306c] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>Instagram</span>
              </button>

              {/* TikTok */}
              <button
                onClick={handleShareTikTok}
                className="py-2.5 px-2 rounded-xl bg-[#fe2c55]/15 hover:bg-[#fe2c55]/25 border border-[#fe2c55]/40 text-rose-200 font-serif-th font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow hover:scale-[1.02] active:scale-95"
              >
                <svg className="w-4 h-4 text-[#fe2c55] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
                <span>TikTok</span>
              </button>

              {/* X (Twitter) */}
              <button
                onClick={handleShareTwitter}
                className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/25 text-slate-100 font-serif-th font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow hover:scale-[1.02] active:scale-95"
              >
                <svg className="w-3.5 h-3.5 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X</span>
              </button>

              {/* Threads */}
              <button
                onClick={handleShareThreads}
                className="py-2.5 px-2 rounded-xl bg-[#7852ff]/15 hover:bg-[#7852ff]/25 border border-[#7852ff]/40 text-purple-200 font-serif-th font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow hover:scale-[1.02] active:scale-95"
              >
                <svg className="w-4 h-4 text-purple-300 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.186 24c-3.784 0-6.787-1.325-8.683-3.83-1.89-2.5-2.61-5.99-2.14-10.37.49-4.57 2.45-8.22 5.82-10.87C9.97 1.13 13.9 0 18.89 0c3.34 0 6.25.68 8.65 2.02l-1.75 3.39c-1.95-1.09-4.32-1.64-7.05-1.64-3.9 0-6.99.88-9.19 2.61-2.2 1.73-3.48 4.2-3.8 7.34-.34 3.36.21 6.04 1.63 7.96 1.43 1.93 3.68 2.91 6.7 2.91 3.51 0 6.37-1.23 8.5-3.66l2.84 2.63C22.61 22.18 18.3 24 12.186 24zm2.14-8.85c-1.73 0-3.1-.48-4.08-1.44-.98-.95-1.44-2.27-1.37-3.92.08-1.68.7-3.03 1.84-4.01 1.15-.99 2.67-1.49 4.52-1.49 1.64 0 3.01.41 4.07 1.22l-1.73 3.35c-.71-.52-1.57-.78-2.58-.78-1.02 0-1.85.27-2.47.81-.62.55-.95 1.32-.99 2.31-.04.99.23 1.76.81 2.3.58.55 1.39.82 2.42.82 1.2 0 2.22-.39 3.06-1.17v3.91c-1.02.72-2.19 1.09-3.5 1.09z" />
                </svg>
                <span>Threads</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
