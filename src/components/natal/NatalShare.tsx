"use client";

import { useEffect, useRef, useState } from "react";
import { renderShareCard, type ShareCardItem } from "@/lib/share/share-card";
import { SIGN_TEXT, type Lang } from "@/data/natal/content";
import { ZODIAC_SIGNS } from "@/data/zodiac";
import { cardsFor } from "@/lib/astro/natal-text";
import type { BodyPosition, NatalChart } from "@/lib/astro/natal";
import type { NatalCardItem } from "./NatalChartApp";

/**
 * 📸 ภาพแชร์ Big Three (อาทิตย์ · จันทร์ · ลัคนา) — เจ้าของสั่งทำเป็นงานสุดท้ายของผังดวง
 * - วาดในเบราว์เซอร์ด้วย `renderShareCard` ตัวเดียวกับภาพคำทำนาย · ไม่อัปโหลดขึ้นเซิร์ฟเวอร์
 * - ในภาพมีแค่ราศีและไพ่ประจำราศี **ไม่มีชื่อ วันเวลา หรือสถานที่เกิด**
 * - คอมโพเนนต์นี้โผล่หลังผู้ใช้กดสร้างภาพ ซึ่งพลิกไพ่ประจำราศีบนหน้าเว็บไปพร้อมกัน (กฎเหล็กข้อ 4)
 * - ไพ่ที่หารหัสไม่เจอ = ไม่ใส่ในภาพ ห้ามหยิบใบอื่นแทน (กฎเหล็กข้อ 14)
 */
export default function NatalShare({ chart, lang, cards }: { chart: NatalChart; lang: Lang; cards: readonly NatalCardItem[] }) {
  const isTh = lang === "th";
  const fileRef = useRef<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let url: string | null = null;
    const get = (id: string) => chart.bodies.find((b) => b.id === id);
    const points = [
      { b: get("sun"), th: "อาทิตย์", en: "Sun" },
      { b: get("moon"), th: "จันทร์", en: "Moon" },
      { b: get("asc"), th: "ลัคนา", en: "Rising" },
    ].filter((p): p is { b: BodyPosition; th: string; en: string } => !!p.b);
    const items: ShareCardItem[] = [];
    for (const p of points) {
      const card = cards.find((c) => c.id === cardsFor(p.b).sign);
      if (!card) continue;
      const s = ZODIAC_SIGNS[p.b.sign];
      items.push({ id: card.id, image: card.image, name: isTh ? s.nameTh.replace("ราศี", "") : s.nameEn, position: isTh ? p.th : p.en, isReversed: false });
    }
    const kw = (b: BodyPosition) => SIGN_TEXT[b.sign].keywords[lang];
    const sign = (b: BodyPosition) => (isTh ? ZODIAC_SIGNS[b.sign].nameTh.replace("ราศี", "") : ZODIAC_SIGNS[b.sign].nameEn);
    const summary = points
      .map((p) =>
        isTh
          ? `${p.th === "อาทิตย์" ? "ตัวตน" : p.th === "จันทร์" ? "หัวใจ" : "ภาพแรกที่คนเห็น"}แบบ${sign(p.b)} ${kw(p.b)}`
          : `${sign(p.b)} ${p.en}, ${kw(p.b)}.`,
      )
      .join(isTh ? " · " : " ");
    const sidereal = chart.input.zodiac === "lahiri";
    renderShareCard({
      format: "story",
      mime: "image/jpeg",
      isEnglish: !isTh,
      spreadName: isTh ? `Big Three ของฉัน${sidereal ? " · ราศีนิรายนะ" : ""}` : `My Big Three${sidereal ? " · sidereal" : ""}`,
      personaName: "",
      summary,
      cards: items,
      copy: isTh
        ? { tagline: "ผังดวงกำเนิด พร้อมไพ่ทาโรต์ 1909", from: "อาทิตย์ จันทร์ ลัคนา", cta: "คำนวณผังดวงฟรีที่ seertarot.net", fair: "ตำแหน่งดาวจริง เทียบข้อมูล NASA JPL" }
        : { tagline: "Natal chart with 1909 tarot cards", from: "Sun, Moon and Rising", cta: "Calculate your chart free at seertarot.net", fair: "Real planet positions, checked against NASA JPL" },
    })
      .then((blob) => {
        if (!alive) return;
        fileRef.current = new File([blob], "seertarot-big-three.jpg", { type: "image/jpeg" });
        url = URL.createObjectURL(blob);
        setPreview(url);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      fileRef.current = null;
      if (url) URL.revokeObjectURL(url);
    };
  }, [chart, lang, cards, isTh]);

  function save(): boolean {
    const f = fileRef.current;
    if (!f) return false;
    const u = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = u;
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
    return true;
  }

  /** ต้องเรียก share ทันทีในจังหวะที่แตะ (ไฟล์เตรียมไว้แล้ว) — ห้าม await อะไรก่อน */
  function share() {
    const f = fileRef.current;
    if (f && navigator.canShare?.({ files: [f] })) {
      navigator.share({ files: [f] }).catch((err: unknown) => {
        if ((err as { name?: string })?.name !== "AbortError" && save()) setNote(isTh ? "บันทึกรูปแล้ว เปิดแอปแล้วเลือกรูปจากคลังภาพได้เลย" : "Image saved. Post it from your gallery.");
      });
      return;
    }
    if (save()) setNote(isTh ? "บันทึกรูปแล้ว นำไปโพสต์ได้เลย" : "Image saved. You can post it now.");
  }

  if (failed) {
    return (
      <p role="alert" className="text-sm text-err">
        {isTh ? "สร้างภาพไม่สำเร็จ กรุณาโหลดหน้าใหม่อีกครั้ง" : "Could not create the image. Please reload the page."}
      </p>
    );
  }
  return (
    <div className="space-y-3 text-center">
      {preview ? (
        // ภาพที่เพิ่งวาดในเครื่อง (blob:) ไม่ใช่ภาพไพ่จาก /cards — ไม่ต้องผ่าน CardImage
        <img src={preview} alt={isTh ? "ภาพแชร์ Big Three พร้อมไพ่ประจำราศี" : "Big Three share image with sign cards"} className="mx-auto w-[220px] sm:w-[260px] rounded-xl border border-line-warm shadow-xs" />
      ) : (
        <p className="text-sm text-muted">{isTh ? "กำลังสร้างภาพ..." : "Creating the image..."}</p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={share} disabled={!preview} className="rounded-full btn-gold-glass px-5 min-h-[44px] text-sm font-bold disabled:opacity-50">
          {isTh ? "แชร์รูปนี้" : "Share this image"}
        </button>
        <button type="button" onClick={() => save() && setNote(isTh ? "บันทึกรูปแล้ว" : "Image saved")} disabled={!preview} className="rounded-full border border-line-warm bg-surface px-5 min-h-[44px] text-sm text-ink disabled:opacity-50">
          {isTh ? "บันทึกรูป" : "Save image"}
        </button>
      </div>
      {note && (
        <p className="text-xs text-muted" aria-live="polite">
          {note}
        </p>
      )}
      <p className="text-xs text-muted">{isTh ? "ในภาพไม่มีชื่อ วันเวลา หรือสถานที่เกิด และภาพไม่ถูกส่งขึ้นเซิร์ฟเวอร์" : "The image has no name, birth date, time or place, and is never uploaded."}</p>
    </div>
  );
}
