"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Persona } from "@/data/personas";
import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import type { Reading } from "@/lib/schema/reading";
import { soundManager } from "@/lib/utils/audio";
import { sliceThaiSafe } from "@/lib/text/thai-truncate";
import { renderShareCard, type ShareCardItem } from "@/lib/share/share-card";
import { cardSummaryByIndex as cardByIndex } from "@/data/cards/summary";
import { trackEvent } from "@/lib/analytics";
import { useDialogBehavior } from "@/lib/use-dialog-behavior";
import { useLocale } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/utils/clipboard";

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
  const { isEnglish } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);

  /*
   * 🪟 เดิมประกาศ `aria-modal="true"` ไว้ทั้งที่ไม่ได้กักโฟกัสจริง (UX-08)
   * ปิดด้วย Esc ไม่ได้ · หน้าหลังฉากยังเลื่อนได้ · ปิดแล้วโฟกัสไม่กลับที่เดิม
   */
  useDialogBehavior(isOpen, onClose, panelRef);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const personaName = isEnglish ? (persona.nameEn || persona.nameTh) : persona.nameTh;
  const defaultQuestion = isEnglish ? "General Life & Archetypal Overview" : "ภาพรวมดวงชะตา";
  const defaultSummary = isEnglish ? "Trust your inner wisdom and proceed with mindful intention." : "จงเชื่อมั่นในตนเองและก้าวต่อไปอย่างมีสติ";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const shareText = isEnglish
    ? `1909 Rider-Waite Tarot Reading by SeerTarot
Spread: ${spreadName}
Sacred Question: "${question || defaultQuestion}"
Cards Drawn: ${cards
        .map((c) => {
          const card = c.card || (c.cardIndex !== undefined ? cardByIndex(c.cardIndex) : null);
          const posName = c.position.nameEn || c.position.nameTh;
          const cardName = card?.nameEn || card?.nameTh || "Tarot Card";
          return `${posName}: ${cardName}${c.isReversed ? " (Reversed)" : ""}`;
        })
        .join(", ")}
Oracle Insight from ${personaName}: "${reading?.summary || defaultSummary}"
Explore the Sanctuary: ${typeof window !== "undefined" ? window.location.origin : "https://seertarot.net"}`
    : `คำทำนายไพ่ทาโรต์ 1909 Rider-Waite จาก SeerTarot
ผังการวางไพ่: ${spreadName}
คำถามอธิษฐาน: "${question || "ภาพรวมดวงชะตา"}"
ไพ่ที่เปิดได้: ${cards
        .map((c) => {
          const card = c.card || (c.cardIndex !== undefined ? cardByIndex(c.cardIndex) : null);
          return `${c.position.nameTh}: ${card?.nameTh || "ไพ่"}${c.isReversed ? " (กลับหัว)" : ""}`;
        })
        .join(", ")}
คำทำนายจากแม่หมอ ${persona.nameTh}: "${reading?.summary || "จงเชื่อมั่นในตนเองและก้าวต่อไปอย่างมีสติ"}"
สัมผัสวิหารไพ่ทาโรต์ออนไลน์: ${typeof window !== "undefined" ? window.location.origin : "https://seertarot.net"}`;

  /*
   * ✦ ภาพการ์ดแชร์ — ดีไซน์/เหตุผลทั้งหมดอยู่ใน `src/lib/share/share-card.ts`
   * (ของเดิมวาดใน component นี้เอง: ข้อความเยื้อง · ตัดคำไทยกลางคำ · กล่องว่างครึ่งภาพ)
   */
  const shareCardItems = (): ShareCardItem[] =>
    cards.slice(0, 5).map((c) => {
      const card = c.card || (c.cardIndex !== undefined ? cardByIndex(c.cardIndex) : null);
      return {
        image: card?.image,
        id: card?.id,
        // 🃏 กฎข้อ 14: ไม่มีข้อมูลไพ่ = ชื่อกลาง ๆ ไม่ใช่ชื่อไพ่ใบอื่น (ภาพก็เป็นกรอบเปล่า)
        name: (isEnglish ? card?.nameEn || card?.nameTh : card?.nameTh) || (isEnglish ? "Tarot card" : "ไพ่ทาโรต์"),
        subName: isEnglish ? undefined : card?.nameEn,
        position: isEnglish ? c.position.nameEn || c.position.nameTh : c.position.nameTh,
        isReversed: Boolean(c.isReversed),
      };
    });

  const createReadingImageBlob = (format: "post" | "story" = "story"): Promise<Blob> =>
    renderShareCard({
      format,
      isEnglish,
      spreadName,
      question,
      personaName,
      summary: reading?.summary || "",
      cards: shareCardItems(),
    });

  /*
   * 📲 สร้างภาพรอไว้ตั้งแต่เปิดหน้าต่าง — หัวใจของ "แชร์แล้วเด้งเข้าแอปได้"
   * `navigator.share()` ต้องถูกเรียก *ทันที* ในจังหวะที่ผู้ใช้แตะ (user activation)
   * ของเดิมแตะปุ่มแล้วค่อยไปโหลดภาพไพ่ + วาด canvas ก่อน กว่าจะเรียก share สิทธิ์นั้นหมดอายุแล้ว
   * iOS Safari / Android จึงปฏิเสธเงียบ ๆ หน้าต่างแชร์ของเครื่องไม่เด้ง (เจ้าของ: "แชร์ได้ยากมาก")
   * ตอนนี้ไฟล์พร้อมก่อนผู้ใช้แตะ ปุ่มแชร์เรียก share ได้ในจังหวะเดียวกับการแตะเลย
   */
  const storyFileRef = useRef<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    let url: string | null = null;
    setImageError(false);
    createReadingImageBlob("story")
      .then((blob) => {
        if (!alive) return;
        storyFileRef.current = new File([blob], "seertarot-reading.png", { type: "image/png" });
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch(() => {
        if (alive) setImageError(true);
      });
    return () => {
      alive = false;
      storyFileRef.current = null;
      setPreviewUrl(null);
      if (url) URL.revokeObjectURL(url);
    };
    // วาดใหม่เมื่อเปิดหน้าต่าง หรือคำทำนาย/ไพ่เปลี่ยน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reading?.summary, cards.length, question, isEnglish]);

  /** แคปชันสั้นที่แนบไปกับภาพ — ข้อความยาวเต็มอยู่ใน `shareText` (ใช้คัดลอก/Threads) */
  const shortCaption = isEnglish
    ? `My tarot reading on SeerTarot ✨ Draw your free card: ${typeof window !== "undefined" ? window.location.origin : "https://seertarot.net"}`
    : `คำทำนายไพ่ทาโรต์ของฉันจาก SeerTarot ✨ เปิดไพ่ฟรีที่ ${typeof window !== "undefined" ? window.location.origin : "https://seertarot.net"}`;

  const downloadStory = () => {
    const file = storyFileRef.current;
    if (!file) return false;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  };

  /** แชร์ภาพผ่านหน้าต่างแชร์ของเครื่อง (เลือก LINE / IG / FB / TikTok ได้ในนั้น) — ต้องเรียกตรงจาก onClick */
  const handleNativeShare = (source: "native" | "instagram" | "tiktok" | "facebook") => {
    soundManager.playCardSelectSound();
    trackEvent("share_click", { platform: source, spread_id: spreadName });
    const file = storyFileRef.current;
    const canShareFile = !!file && typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files: [file] });
    if (file && canShareFile) {
      navigator.share({ files: [file], text: shortCaption }).catch((err) => {
        if (!isUserAbort(err)) {
          downloadStory();
          showToast(isEnglish ? "Image saved — post it from your gallery" : "บันทึกรูปแล้ว — เปิดแอปแล้วเลือกรูปจากคลังภาพได้เลย");
        }
      });
      return;
    }
    // เครื่องที่แชร์ไฟล์ไม่ได้ (ส่วนใหญ่คือคอมพิวเตอร์) ➔ บันทึกรูป + คัดลอกแคปชัน
    if (downloadStory()) {
      void copyToClipboard(shortCaption);
      showToast(isEnglish ? "Image saved and caption copied" : "บันทึกรูปและคัดลอกแคปชันแล้ว นำไปโพสต์ได้เลย");
    } else {
      showToast(isEnglish ? "The image is still being prepared…" : "กำลังเตรียมรูป รอสักครู่แล้วลองอีกครั้ง");
    }
  };

  const handleShareLine = () => {
    soundManager.playCardSelectSound();
    trackEvent("share_click", { platform: "line", spread_id: spreadName });
    // line.me/R/share เปิดแอป LINE บนมือถือโดยตรง (บนคอมเปิดหน้าเว็บ LINE)
    window.open(`https://line.me/R/share?text=${encodeURIComponent(shortCaption)}`, "_blank", "noopener,noreferrer");
  };

  /**
   * อัปโหลดการ์ดภาพขึ้น R2 → คืนลิงก์ /s/<id> ที่มี OG image (ลิงก์แชร์ขึ้นรูปพรีวิว)
   * ล้มเหลว/ยังไม่พร้อม → คืน origin หน้าแรกแบบเดิม
   */
  const buildShareLink = async (): Promise<string> => {
    const fallback = typeof window !== "undefined" ? window.location.origin : "https://seertarot.net";
    try {
      const blob = await createReadingImageBlob("post");
      const titleText = isEnglish
        ? `Tarot Reading "${question || defaultQuestion}" — SeerTarot`
        : `คำทำนายไพ่ทาโรต์ "${question || "ภาพรวมดวงชะตา"}" — SeerTarot`;
      const qs = new URLSearchParams({
        title: titleText,
        spread: spreadName,
      });
      const res = await fetch(`/api/share/image?${qs}`, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        credentials: "same-origin",
        body: blob,
      });
      if (!res.ok) return fallback;
      const data = (await res.json()) as { url?: string };
      return data.url || fallback;
    } catch {
      return fallback;
    }
  };

  const isUserAbort = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

  const handleShareToBrand = async (brand: "facebook" | "instagram" | "tiktok" | "twitter" | "threads") => {
    // ⚠️ IG / TikTok ต้องเรียก share ทันทีก่อน await ใด ๆ (ดูเหตุผลที่ `storyFileRef`)
    if (brand === "instagram" || brand === "tiktok") {
      handleNativeShare(brand);
      return;
    }
    soundManager.playCardSelectSound();
    trackEvent("share_click", { platform: brand, spread_id: spreadName });

    // Facebook บนมือถือ: ภาพพร้อมแล้ว ➔ หน้าต่างแชร์ของเครื่องทันที (เลือกแอป Facebook ได้ในนั้น)
    if (brand === "facebook") {
      const file = storyFileRef.current;
      if (file && typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: shortCaption }).catch(() => {});
        return;
      }
    }

    // ⚠️ ต้องเปิดแท็บเปล่าไว้ "ทันทีแบบ sync" ในนี้ก่อน await ใด ๆ ทั้งสิ้น
    const needsPopup = brand === "twitter" || brand === "facebook" || brand === "threads";
    /*
     * ⚠️ ห้ามใส่ `noopener` ตอนจองแท็บ (A3-09) — ตามสเปก HTML `window.open(..., "noopener")`
     * คืน `null` เสมอ (แต่ยังเปิดแท็บว่างจริง) ตัวแปรนี้จึงเป็น null ทุกครั้ง แล้วไปเปิดแท็บจริง
     * หลัง `await` ซึ่งหมด user activation แล้ว ➔ โดนตัวบล็อกป็อปอัป + เหลือแท็บขาวค้าง
     * จองแบบไม่มี noopener แล้วตัด `opener` เองทันที ได้ความปลอดภัยเท่ากันและได้ reference กลับมา
     */
    const pendingPopup =
      needsPopup && typeof window !== "undefined" ? window.open("", "_blank", "width=600,height=550") : null;
    if (pendingPopup) {
      try {
        pendingPopup.opener = null;
      } catch {
        // บางเบราว์เซอร์ไม่ให้ตั้งค่า — แท็บยังเป็นหน้าว่างของเราเอง ไม่มีอะไรรั่ว
      }
    }
    const openOrRedirect = (target: string) => {
      if (pendingPopup && !pendingPopup.closed) {
        pendingPopup.location.href = target;
      } else {
        window.open(target, "_blank", "noopener,noreferrer,width=600,height=550");
      }
    };

    const shareUrl = needsPopup
      ? await buildShareLink()
      : typeof window !== "undefined"
        ? window.location.origin
        : "https://seertarot.net";

    // Twitter / X
    if (brand === "twitter") {
      /*
       * ย่อคำทำนายก่อนยัดลงทวีต — เดิมใช้ `slice(0, 90)` ดิบ ๆ ซึ่งตัดกลางคลัสเตอร์ไทย
       * จนสระ/วรรณยุกต์ลอยไปโผล่บนไทม์ไลน์คนอื่น (INC-0213)
       */
      const rawSummary = reading?.summary ?? "";
      const tweetSummary = rawSummary ? `${sliceThaiSafe(rawSummary, 90)}…` : "";
      const tweetText = isEnglish
        ? `1909 Rider-Waite Tarot Reading by SeerTarot\nSpread: ${spreadName}\nQuestion: "${question || defaultQuestion}"\nOracle insight from ${personaName}: "${tweetSummary}"\n\n#tarot #oracle #archetypes #SeerTarot`
        : `ดูดวงไพ่ทาโรต์ 1909 Rider-Waite จาก SeerTarot\nผัง: ${spreadName}\nคำถาม: "${question || "ภาพรวมดวงชะตา"}"\nคำทำนายจากแม่หมอ ${persona.nameTh}: "${tweetSummary}"\n\n#ไพ่ทาโรต์ #ดูดวง #SeerTarot`;
      openOrRedirect(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`
      );
      return;
    }

    // Threads
    if (brand === "threads") {
      const threadsText = isEnglish
        ? `1909 Rider-Waite Tarot Reading by SeerTarot\nSpread: ${spreadName}\nQuestion: "${question || defaultQuestion}"\nInsight: "${reading?.summary || ""}"\n${shareUrl}`
        : `คำทำนายไพ่ทาโรต์ 1909 Rider-Waite จาก SeerTarot\nผัง: ${spreadName}\nคำถาม: "${question || "ภาพรวมดวงชะตา"}"\nคำทำนาย: "${reading?.summary || ""}"\n${shareUrl}`;
      openOrRedirect(`https://www.threads.net/intent/post?text=${encodeURIComponent(threadsText)}`);
      return;
    }

    // Facebook
    if (brand === "facebook") {
      // Web fallback
      await copyToClipboard(shareText);
      showToast(isEnglish ? "Caption copied! Opening Facebook share window..." : "คัดลอกข้อความแล้ว! กำลังเปิดหน้าแชร์ Facebook...");
      openOrRedirect(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
      return;
    }

    // Instagram & TikTok ไม่มีลิงก์แชร์ทางเว็บ — ทางเดียวที่เด้งเข้าแอปได้คือหน้าต่างแชร์ของเครื่อง
    if (brand === "instagram" || brand === "tiktok") {
      handleNativeShare(brand);
      return;
    }
  };

  return (
    <AnimatePresence>
      {/* ⚠️ เงื่อนไข `isOpen` ต้องอยู่ **ข้างใน** `AnimatePresence` เท่านั้น (INC-0126 · กฎข้อ 9 ของด่าน test-motion-quality)
          ถ้าเขียน `if (!isOpen) return null` ไว้ข้างบน ตัว AnimatePresence จะหายไปพร้อมลูกในเฟรมเดียวกัน
          `exit` ที่เขียนไว้ข้างล่างจึงไม่มีวันทำงาน — หน้าต่างดับหายวับแทนที่จะค่อย ๆ จางไป */}
      {isOpen && (
      <motion.div
        key="share-modal-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        aria-label={isEnglish ? "Share Reading" : "แชร์ผลคำทำนาย"}
        onClick={onClose}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-3 sm:p-4 modal-scrim overflow-y-auto"
      >
        <motion.div
          /*
           * ⚠️ **ห้ามใส่ `scale` ให้แผงโมดัลใบใหญ่** (INC-0128 · กฎเดียวกับที่ `ui/Modal.tsx` เขียนเตือนไว้)
           * การย่อ/ขยายบังคับให้เบราว์เซอร์ raster ตัวอักษรทั้งใบใหม่ทุกเฟรม
           * บนมือถือ (CPU ช้ากว่าเดสก์ท็อปหลายเท่า) เห็นเป็นอาการ "กระพริบ/กระตุก" ตอนเปิด
           * เลื่อนขึ้น + จาง ให้ผลทางสายตาใกล้เคียงกันแต่เบากว่ามาก
           */
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className="altar-modal !rounded-lg w-full max-w-xl p-4 sm:p-6 space-y-4 my-auto relative text-ink-deep"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-line-warm/30">
            <div className="flex items-center gap-2">
              
              <div>
                <h3 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
                  {isEnglish ? "Share Reading" : "แชร์ผลคำทำนาย"}
                </h3>
                <p className="text-[13px] text-muted font-serif-th">
                  {isEnglish
                    ? "Save the image or send it to any app"
                    : "บันทึกรูป หรือส่งเข้าแอปที่ชอบได้เลย"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={isEnglish ? "Close share dialog" : "ปิดหน้าต่างแชร์ผลคำทำนาย"}
              className="glass-chip w-10 h-10 text-ink-deep hover:text-surface text-sm flex items-center justify-center transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
            >
              ✕
            </button>
          </div>

          {/* Toast Notification Banner — A5-16: live region อยู่ใน DOM ตลอด ข้อความที่ใส่ทีหลังจึงถูกประกาศ */}
          <div role="status" aria-live="polite">
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="altar-card-porcelain !rounded-lg p-2.5 text-center text-xs text-ink-deep font-serif-th"
              >
                {toastMessage}
              </motion.div>
            )}
          </div>

          {/* ภาพตัวอย่าง = ภาพจริงที่จะถูกแชร์ (เดิมเป็น HTML อีกชุดที่หน้าตาไม่ตรงกับภาพที่ส่งออกไป) */}
          <div className="mx-auto w-full max-w-[260px] sm:max-w-[280px] aspect-[9/16] rounded-2xl overflow-hidden border border-line-warm bg-dark grid place-items-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- blob: URL ของภาพที่เพิ่งวาด ไม่ใช่ภาพไพ่ (กฎข้อ 8 ครอบภาพไพ่จาก /cards/)
              <img
                src={previewUrl}
                alt={isEnglish ? "Your reading image to share" : "ภาพคำทำนายที่จะแชร์"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="px-6 text-center font-serif-th text-xs text-surface/70">
                {imageError
                  ? isEnglish
                    ? "Could not create the image. You can still share the link below."
                    : "สร้างรูปไม่สำเร็จ ยังแชร์ลิงก์จากปุ่มด้านล่างได้"
                  : isEnglish
                    ? "Preparing your image…"
                    : "กำลังเตรียมรูป…"}
              </span>
            )}
          </div>

          {/* ปุ่มหลัก: แชร์ภาพผ่านหน้าต่างแชร์ของเครื่อง (เลือกแอปได้ทุกแอป) · บันทึกรูป */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleNativeShare("native")}
              disabled={!previewUrl}
              className="btn-gold-glass px-4 py-3 font-serif-th text-sm font-bold disabled:opacity-50 disabled:cursor-wait cursor-pointer"
            >
              {isEnglish ? "Share image" : "แชร์รูปนี้"}
            </button>
            <button
              type="button"
              onClick={() => {
                trackEvent("share_click", { platform: "story_download", spread_id: spreadName });
                if (downloadStory()) showToast(isEnglish ? "Image saved" : "บันทึกรูปแล้ว");
              }}
              disabled={!previewUrl}
              className="glass-chip px-4 py-3 font-serif-th text-sm font-semibold text-ink-deep disabled:opacity-50 disabled:cursor-wait cursor-pointer"
            >
              {isEnglish ? "Save image" : "บันทึกรูป"}
            </button>
          </div>

          <p className="text-center font-serif-th text-[13px] text-muted">
            {isEnglish ? "Or share straight to" : "หรือแชร์ตรงไปที่"}
          </p>

          {/* ปุ่มแชร์ตรงรายแอป (6 แอป) — LINE เปิดแอปผ่าน line.me · IG/TikTok/FB ใช้หน้าต่างแชร์ของเครื่อง · X/Threads ผ่านหน้าโพสต์ของเว็บนั้น */}
          <div className="altar-card-porcelain !rounded-lg py-3 px-2 flex items-center justify-center gap-2 sm:gap-5">
            {/* LINE (#06C755) — คนไทยแชร์ผ่าน LINE มากที่สุด · line.me/R/share เปิดแอปตรง */}
            <button
              type="button"
              title={isEnglish ? "Share to LINE" : "แชร์ไปยัง LINE"}
              aria-label={isEnglish ? "Share to LINE" : "แชร์ไปยัง LINE"}
              onClick={handleShareLine}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#06C755] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition cursor-pointer shrink-0"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            </button>

            {/* Facebook (#1877F2) */}
            <button
              type="button"
              title={isEnglish ? "Share to Facebook" : "แชร์ไปยัง Facebook"}
              aria-label={isEnglish ? "Share to Facebook" : "แชร์ไปยัง Facebook"}
              onClick={() => handleShareToBrand("facebook")}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition cursor-pointer shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            {/* Instagram (Official Gradient) */}
            <button
              type="button"
              title={isEnglish ? "Share to Instagram" : "แชร์ไปยัง Instagram"}
              aria-label={isEnglish ? "Share to Instagram" : "แชร์ไปยัง Instagram"}
              onClick={() => handleShareToBrand("instagram")}
              disabled={!previewUrl}
              aria-busy={!previewUrl}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-gold-ink via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition cursor-pointer shrink-0 ${!previewUrl ? "opacity-50 cursor-wait" : ""}`}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </button>

            {/* TikTok (#000000) */}
            <button
              type="button"
              title={isEnglish ? "Share to TikTok" : "แชร์ไปยัง TikTok"}
              aria-label={isEnglish ? "Share to TikTok" : "แชร์ไปยัง TikTok"}
              onClick={() => handleShareToBrand("tiktok")}
              disabled={!previewUrl}
              aria-busy={!previewUrl}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#000000] border border-white/20 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition cursor-pointer shrink-0 ${!previewUrl ? "opacity-50 cursor-wait" : ""}`}
            >
              <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </button>

            {/* X / Twitter (#000000) */}
            <button
              type="button"
              title={isEnglish ? "Share to X (Twitter)" : "แชร์ไปยัง X (Twitter)"}
              aria-label={isEnglish ? "Share to X (Twitter)" : "แชร์ไปยัง X (Twitter)"}
              onClick={() => handleShareToBrand("twitter")}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#000000] border border-white/20 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition cursor-pointer shrink-0"
            >
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>

            {/* Threads (#000000) with Official Meta Threads SVG Path */}
            <button
              type="button"
              title={isEnglish ? "Share to Threads" : "แชร์ไปยัง Threads"}
              aria-label={isEnglish ? "Share to Threads" : "แชร์ไปยัง Threads"}
              onClick={() => handleShareToBrand("threads")}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#000000] border border-white/20 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition cursor-pointer shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 192 192" fill="currentColor">
                <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
              </svg>
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
