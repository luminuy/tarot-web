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
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const shareText = `✨ คำทำนายไพ่ทาโรต์ 1909 Rider-Waite จาก SeerTarot
✦ ผังการวางไพ่: ${spreadName}
✦ คำถามอธิษฐาน: "${question || "ภาพรวมดวงชะตา"}"
✦ ไพ่ที่เปิดได้: ${cards
    .map((c) => {
      const card = c.card || (c.cardIndex !== undefined ? cardByIndex(c.cardIndex) : null);
      return `${c.position.nameTh}: ${card?.nameTh || "ไพ่"}${c.isReversed ? " (กลับหัว)" : ""}`;
    })
    .join(", ")}
✦ คำทำนายจากแม่หมอ ${persona.nameTh}: "${reading?.summary || "จงเชื่อมั่นในตนเองและก้าวต่อไปอย่างมีสติ"}"
✦ สัมผัสวิหารไพ่ทาโรต์ออนไลน์: ${typeof window !== "undefined" ? window.location.origin : "https://seertarot.net"}`;

  // Direct HD PNG Image Generation using HTML5 Canvas (returns Promise<Blob>)
  const createReadingImageBlob = async (format: "post" | "story" = "story"): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");

        const width = 1080;
        const height = format === "story" ? 1920 : 1350;
        canvas.width = width;
        canvas.height = height;

        // 1. พื้นหลัง — ผ้าลินินครีมอุ่นตามระบบดีไซน์ V2 (canvas → inset)
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "#FFFDF9");
        grad.addColorStop(0.55, "#F6F1E9");
        grad.addColorStop(1, "#F0E8DB");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. กรอบเส้นเดี่ยวบาง ๆ (ไม่มีเงา ไม่มีดาวระยิบ)
        ctx.strokeStyle = "#E4D8C4";
        ctx.lineWidth = 2;
        ctx.strokeRect(48, 48, width - 96, height - 96);

        // 4. Header: Brand & Spread
        const headerY = format === "story" ? 150 : 110;
        ctx.fillStyle = "#8F5C1A";
        ctx.font = "bold 40px 'Noto Serif Thai', serif, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("✦ SEERTAROT · วิหารพยากรณ์ ✦", width / 2, headerY);

        ctx.fillStyle = "#6F5B4A";
        ctx.font = "bold 24px 'Noto Sans Thai', sans-serif";
        ctx.fillText(`ผังการวางไพ่: ${spreadName}`, width / 2, headerY + 45);

        // Divider
        ctx.strokeStyle = "#E4D8C4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(120, headerY + 70);
        ctx.lineTo(width - 120, headerY + 70);
        ctx.stroke();

        // 5. Question Quote
        let nextY = headerY + 110;
        if (question) {
          ctx.fillStyle = "#2E211A";
          ctx.font = "italic 28px 'Noto Serif Thai', serif, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`“${question.slice(0, 48)}${question.length > 48 ? "..." : ""}”`, width / 2, nextY);
          nextY += 45;
        }

        // 6. Draw Tarot Cards Showcase
        const displayCards = cards.slice(0, 5);
        const totalDisplay = displayCards.length;
        const isSingle = totalDisplay === 1;

        const cardW = isSingle ? 260 : 165;
        const cardH = isSingle ? 410 : 260;
        const gap = isSingle ? 0 : 22;
        const totalWidth = totalDisplay * cardW + (totalDisplay - 1) * gap;
        const startX = (width - totalWidth) / 2;
        const cardY = nextY + 46; // เว้นที่ให้ป้ายตำแหน่งเหนือไพ่

        // Preload card images
        const loadedImages = await Promise.all(
          displayCards.map((c) => {
            return new Promise<HTMLImageElement | null>((res) => {
              const cardObj = c.card || (c.cardIndex !== undefined ? cardByIndex(c.cardIndex) : null);
              const imgSrc = getCardImageSrc(cardObj?.image, cardObj?.id);
              if (!imgSrc) {
                res(null);
                return;
              }
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => res(img);
              img.onerror = () => res(null);
              img.src = imgSrc;
            });
          })
        );

        displayCards.forEach((c, idx) => {
          const cx = startX + idx * (cardW + gap);
          const cardImg = loadedImages[idx];
          const cardObj = c.card || (c.cardIndex !== undefined ? cardByIndex(c.cardIndex) : null);

          // พื้นรองไพ่
          ctx.fillStyle = "#F0E8DB";
          ctx.beginPath();
          ctx.roundRect(cx, cardY, cardW, cardH, 8);
          ctx.fill();

          // Draw Artwork
          if (cardImg) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(cx, cardY, cardW, cardH, 8);
            ctx.clip();

            if (c.isReversed) {
              ctx.translate(cx + cardW / 2, cardY + cardH / 2);
              ctx.rotate(Math.PI);
              ctx.drawImage(cardImg, -cardW / 2, -cardH / 2, cardW, cardH);
            } else {
              ctx.drawImage(cardImg, cx, cardY, cardW, cardH);
            }
            ctx.restore();
          }

          // เส้นขอบไพ่ 1px (ไม่มีเงา)
          ctx.strokeStyle = "#E4D8C4";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(cx, cardY, cardW, cardH, 8);
          ctx.stroke();

          // ป้ายตำแหน่ง — เหนือไพ่ ไม่ทับงานศิลป์
          ctx.fillStyle = "#8F5C1A";
          ctx.font = `bold ${isSingle ? "22px" : "16px"} 'Noto Sans Thai', sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(c.position.nameTh.slice(0, 14), cx + cardW / 2, cardY - 16);

          // ชื่อไพ่ — ใต้ไพ่
          ctx.fillStyle = "#2E211A";
          ctx.font = `bold ${isSingle ? "26px" : "19px"} 'Noto Serif Thai', serif, sans-serif`;
          ctx.fillText(cardObj?.nameTh || "ไพ่ทาโรต์", cx + cardW / 2, cardY + cardH + 30);

          // สถานะหัวตั้ง/กลับหัว
          ctx.fillStyle = c.isReversed ? "#A6392C" : "#3A7044";
          ctx.font = `bold ${isSingle ? "18px" : "14px"} 'Noto Sans Thai', sans-serif`;
          ctx.fillText(c.isReversed ? "กลับหัว ↷" : "หัวตั้ง ✦", cx + cardW / 2, cardY + cardH + 56);
        });

        // 7. Oracle Summary Block
        const summaryY = cardY + cardH + 82;
        const summaryH = height - summaryY - 120;

        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#E4D8C4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(80, summaryY, width - 160, summaryH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#8F5C1A";
        ctx.font = "bold 26px 'Noto Serif Thai', serif, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`✦ สารพยากรณ์จากแม่หมอ ${persona.nameTh} ✦`, width / 2, summaryY + 50);

        // Multi-line wrap summary
        ctx.fillStyle = "#2E211A";
        ctx.font = "italic 25px 'Noto Serif Thai', serif, sans-serif";
        ctx.textAlign = "left";
        const words = (reading?.summary || "จงเชื่อมั่นในตนเองและก้าวต่อไปอย่างมีสติ").split("");
        let line = "";
        let lineY = summaryY + 105;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > width - 240 && n > 0) {
            ctx.fillText(line, 120, lineY);
            line = words[n];
            lineY += 42;
            if (lineY > summaryY + summaryH - 35) break;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 120, lineY);

        // 8. Footer Watermark
        ctx.fillStyle = "#6F5B4A";
        ctx.font = "bold 20px 'Noto Sans Thai', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("PROVABLY-FAIR SHA-256 · SEERTAROT.NET", width / 2, height - 65);

        // Resolve Blob
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas to Blob failed"));
        }, "image/png");
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleShareToBrand = async (brand: "facebook" | "instagram" | "tiktok" | "twitter" | "threads") => {
    soundManager.playCardSelectSound();
    trackEvent("share_click", { platform: brand, spread_id: spreadName });
    const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://seertarot.net";

    // Twitter / X
    if (brand === "twitter") {
      const tweetText = `✨ ดูดวงไพ่ทาโรต์ 1909 Rider-Waite จาก SeerTarot\nผัง: ${spreadName}\nคำถาม: "${question || "ภาพรวมดวงชะตา"}"\nคำทำนายจากแม่หมอ ${persona.nameTh}: "${reading?.summary ? reading.summary.slice(0, 90) + "..." : ""}"\n\n#ไพ่ทาโรต์ #ดูดวง #SeerTarot`;
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`,
        "_blank",
        "noopener,noreferrer,width=600,height=550"
      );
      return;
    }

    // Threads
    if (brand === "threads") {
      const threadsText = `✨ คำทำนายไพ่ทาโรต์ 1909 Rider-Waite จาก SeerTarot\nผัง: ${spreadName}\nคำถาม: "${question || "ภาพรวมดวงชะตา"}"\nคำทำนาย: "${reading?.summary || ""}"\n${shareUrl}`;
      window.open(
        `https://www.threads.net/intent/post?text=${encodeURIComponent(threadsText)}`,
        "_blank",
        "noopener,noreferrer,width=600,height=550"
      );
      return;
    }

    // Facebook
    if (brand === "facebook") {
      // On mobile: try native share sheet first with image if supported
      if (typeof navigator !== "undefined" && navigator.canShare) {
        try {
          const blob = await createReadingImageBlob("story");
          const file = new File([blob], "seertarot-reading.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `คำทำนายไพ่ทาโรต์ SeerTarot (${spreadName})`,
              text: shareText,
            });
            return;
          }
        } catch {
          // User cancelled or share failed, fallback to web
        }
      }
      // Web fallback
      await navigator.clipboard.writeText(shareText).catch(() => {});
      showToast("คัดลอกข้อความแล้ว! กำลังเปิดหน้าแชร์ Facebook...");
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        "_blank",
        "noopener,noreferrer,width=600,height=550"
      );
      return;
    }

    // Instagram & TikTok
    if (brand === "instagram" || brand === "tiktok") {
      setIsGenerating(true);
      try {
        const blob = await createReadingImageBlob("story");
        const file = new File([blob], `SeerTarot-${brand.toUpperCase()}-Story.png`, { type: "image/png" });

        // If Web Share API with files is supported (iOS Safari, Android Chrome)
        if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
          setIsGenerating(false);
          await navigator.share({
            files: [file],
            title: `คำทำนายไพ่ทาโรต์ SeerTarot (${spreadName})`,
            text: shareText,
          });
          showToast(`เปิดหน้าแชร์ไปยัง ${brand === "instagram" ? "Instagram" : "TikTok"} แล้ว ✨`);
          return;
        }

        // Desktop fallback: Download image file & copy text
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SeerTarot-${brand.toUpperCase()}-Story.png`;
        a.click();
        URL.revokeObjectURL(url);
        await navigator.clipboard.writeText(shareText).catch(() => {});
        showToast(
          `บันทึกการ์ดรูปภาพ (9:16) และคัดลอกแคปชันแล้ว! นำไปโพสต์ใน ${brand === "instagram" ? "Instagram" : "TikTok"} ได้ทันที ✦`
        );
      } catch (err) {
        console.error("Share error", err);
        showToast("ไม่สามารถเปิดแอปได้ กรุณากดปุ่มบันทึกรูปภาพแทน");
      } finally {
        setIsGenerating(false);
      }
      return;
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="แชร์ผลคำทำนาย"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2E211A]/50 backdrop-blur-[3px] overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-lg bg-[#FFFFFF] border border-[#E4D8C4] p-4 sm:p-6 shadow-[var(--shadow-overlay)] space-y-4 my-auto relative text-[#2E211A]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E4D8C4]/30">
            <div className="flex items-center gap-2">
              <span className="text-[#8F5C1A] text-sm">✦</span>
              <div>
                <h3 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">แชร์ผลคำทำนาย</h3>
                <p className="text-[11px] text-[#6F5B4A] font-serif-th">
                  บันทึกรูปภาพพรีเมียมหรือแชร์ตรงสู่โซเชียลมีเดีย
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่างแชร์ผลคำทำนาย"
              className="w-10 h-10 rounded-full bg-[#F0E8DB] border border-[#E4D8C4] text-[#2E211A] hover:bg-[#8F5C1A] hover:text-[#FFFFFF] text-sm flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
            >
              ✕
            </button>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E4D8C4] text-center text-xs text-[#2E211A] font-serif-th "
            >
              <span className="text-[#8F5C1A]">✨ </span>
              {toastMessage}
            </motion.div>
          )}

          {/* Social Share Preview Card (Redesigned Layout) */}
          <div
            ref={cardRef}
            className="w-full rounded-lg bg-[#FFFFFF] border-2 border-[#E4D8C4] p-5 sm:p-6 space-y-4 relative overflow-hidden text-center"
          >
            {/* Ornate Corner Accents */}
            <span className="absolute top-2.5 left-3 text-[#8F5C1A] text-xs select-none">✦</span>
            <span className="absolute top-2.5 right-3 text-[#8F5C1A] text-xs select-none">✦</span>
            <span className="absolute bottom-2.5 left-3 text-[#8F5C1A] text-xs select-none">✦</span>
            <span className="absolute bottom-2.5 right-3 text-[#8F5C1A] text-xs select-none">✦</span>

            {/* Background Glow Lights */}

            {/* 1. Brand & Spread Title */}
            <div className="space-y-1 relative z-10">
              <div className="flex items-center justify-center gap-2">
                <span className="h-px w-6 sm:w-10 bg-gradient-to-r from-transparent to-[#6F5B4A]" />
                <span className="text-[11px] sm:text-xs font-serif-th tracking-[0.2em] uppercase text-[#8F5C1A] font-bold">
                  SEERTAROT · วิหารพยากรณ์
                </span>
                <span className="h-px w-6 sm:w-10 bg-gradient-to-l from-transparent to-[#6F5B4A]" />
              </div>
              <div className="inline-block px-3 py-0.5 rounded-full bg-[#F0E8DB] border border-[#E4D8C4]">
                <span className="text-[11px] sm:text-xs text-[#2E211A] font-serif-th font-semibold">
                  ผัง: {spreadName}
                </span>
              </div>
            </div>

            {/* 2. Querent's Sacred Inquiry (คำถาม) */}
            {question && (
              <div className="max-w-md mx-auto py-0.5 px-3 relative z-10">
                <p className="font-serif-th text-xs sm:text-sm text-[#2E211A] italic leading-relaxed">“{question}”</p>
              </div>
            )}

            {/* 3. Hero Tarot Cards Showcase */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-2 relative z-10">
              {cards.slice(0, 5).map((c, i) => {
                const isSingle = cards.length === 1;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center text-center space-y-1.5 transition-transform hover:scale-105 ${
                      isSingle ? "w-32 sm:w-40" : "w-24 sm:w-28"
                    }`}
                  >
                    {/* Position Name */}
                    <span className="text-[10.5px] sm:text-xs text-[#8F5C1A] font-serif-th tracking-wide block font-bold whitespace-nowrap">
                      {c.position.nameTh}
                    </span>

                    {/* Card Frame */}
                    <div
                      className={`w-full rounded-lg overflow-hidden relative border-2 border-[#E4D8C4] bg-[#F0E8DB] ${
                        isSingle ? "h-48 sm:h-60" : "h-32 sm:h-38"
                      } ${c.isReversed ? "rotate-180" : ""}`}
                    >
                      <CardImage
                        image={c.card?.image}
                        cardId={c.card?.id}
                        alt={c.card?.nameTh || "Tarot"}
                        className="w-full h-full object-cover object-center tarot-card-enhance tarot-hd-card-image"
                        sizes={isSingle ? "256px" : "128px"}
                      />
                    </div>

                    {/* Card Title & State */}
                    <div className="space-y-0.5">
                      <h5 className="font-serif-th text-xs sm:text-sm font-bold text-[#2E211A] leading-tight">
                        {c.card?.nameTh || `ใบที่ ${i + 1}`}
                      </h5>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-serif-th inline-block font-semibold ${
                          c.isReversed
                            ? "bg-[#FCEEEA] text-[#A6392C] border border-[#E4D8C4]"
                            : "bg-[#EBF3ED] text-[#3A7044] border border-[#E4D8C4]"
                        }`}
                      >
                        {c.isReversed ? "กลับหัว ↷" : "หัวตั้ง ✦"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. Oracle Prophecy / Interpretation */}
            {reading?.summary && (
              <div className="max-w-lg mx-auto pt-2.5 pb-1 px-3 relative z-10 space-y-1 border-t border-[#E4D8C4]/30">
                <span className="text-[10px] sm:text-[11px] text-[#8F5C1A] font-serif-th tracking-wider uppercase block font-bold">
                  ✦ สารพยากรณ์จากแม่หมอ {persona.nameTh} ✦
                </span>
                <p className="font-serif-th text-xs sm:text-[13px] text-[#2E211A] leading-relaxed italic">
                  “{reading.summary}”
                </p>
              </div>
            )}

            {/* 5. Footer Watermark */}
            <div className="pt-2 border-t border-[#E4D8C4]/20 relative z-10 flex items-center justify-between px-2 text-[9px] text-[#6F5B4A] font-mono tracking-widest uppercase font-bold">
              <span>PROVABLY-FAIR SHA-256</span>
              <span>SEERTAROT.NET</span>
            </div>
          </div>

          {/* Social Sharing Control Bar (5 Official Brand Icons, Perfectly Centered, Zero Clipping) */}
          <div className="py-3 px-4 rounded-lg bg-[#FFFFFF] border border-[#E4D8C4] flex items-center justify-center gap-3.5 sm:gap-6 ">
            {/* Facebook (#1877F2) */}
            <button
              type="button"
              title="แชร์ไปยัง Facebook"
              aria-label="แชร์ไปยัง Facebook"
              onClick={() => handleShareToBrand("facebook")}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            {/* Instagram (Official Gradient) */}
            <button
              type="button"
              title="แชร์ไปยัง Instagram"
              aria-label="แชร์ไปยัง Instagram"
              onClick={() => handleShareToBrand("instagram")}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#8F5C1A] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </button>

            {/* TikTok (#000000) */}
            <button
              type="button"
              title="แชร์ไปยัง TikTok"
              aria-label="แชร์ไปยัง TikTok"
              onClick={() => handleShareToBrand("tiktok")}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#000000] border border-white/20 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </button>

            {/* X / Twitter (#000000) */}
            <button
              type="button"
              title="แชร์ไปยัง X (Twitter)"
              aria-label="แชร์ไปยัง X (Twitter)"
              onClick={() => handleShareToBrand("twitter")}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#000000] border border-white/20 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>

            {/* Threads (#000000) with Official Meta Threads SVG Path */}
            <button
              type="button"
              title="แชร์ไปยัง Threads"
              aria-label="แชร์ไปยัง Threads"
              onClick={() => handleShareToBrand("threads")}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#000000] border border-white/20 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 192 192" fill="currentColor">
                <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
              </svg>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
