"use client";

import { Modal } from "@/components/ui/Modal";
import { getCrisisHotlines, getCrisisMessage } from "@/lib/safety/guardrails";
import { useLocale } from "@/lib/i18n";

/**
 * ✦ หน้าจอสายด่วนเมื่อระบบจับสัญญาณวิกฤต (กฎเหล็กข้อ 6)
 * ---------------------------------------------------------------------------
 * เซิร์ฟเวอร์บล็อกการเปิดไพ่แล้วส่งข้อความช่วยเหลือกลับมาใน `message`
 * หน้าที่ของคอมโพเนนต์นี้คือ "ทำให้ข้อความนั้นถึงตาผู้ถามจริง ๆ"
 *
 * ⚠️ บทเรียนที่ทำให้ต้องมีไฟล์นี้: ของเดิมเซิร์ฟเวอร์คืน `{ blocked: true, message }` ด้วย **สถานะ 200**
 * แต่ฝั่งไคลเอนต์เช็กแค่ `if (!res.ok)` ข้อความสายด่วนจึงถูกทิ้งเงียบ ๆ ทุกครั้ง
 * แล้วผู้ใช้ที่ส่งสัญญาณวิกฤตถูกพาไปหน้าสับไพ่ที่ไม่มีเซสชัน
 * → ทุกจุดที่เรียก `/api/reading/start` ต้องเช็ก `data.blocked` ก่อนใช้ `readingId` เสมอ
 *
 * ปุ่มโทรดึงเบอร์จาก `getCrisisHotlines()` แหล่งเดียวกับข้อความ ไม่พิมพ์เบอร์ซ้ำในไฟล์นี้
 */
export function CrisisNotice({ message, onClose }: { message: string | null; onClose: () => void }) {
  const { isEnglish } = useLocale();
  const lang = isEnglish ? "en" : "th";
  const hotlines = getCrisisHotlines(lang);
  const isOpen = message !== null;

  if (!isOpen) return null;

  /*
   * ถ้อยคำมาจากเซิร์ฟเวอร์เสมอ — ที่ต้องมีค่าสำรองเพราะห้ามให้หน้าต่างนี้ว่างเปล่าเด็ดขาด
   * ผู้ใช้ที่มาถึงจอนี้คือคนที่กำลังแย่ที่สุด จอเปล่าคือความล้มเหลวที่รับไม่ได้
   */
  const body = message || getCrisisMessage(lang);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      showCloseButton
      title={isEnglish ? "Let us pause here for a moment" : "ขอหยุดตรงนี้สักครู่นะ"}
    >
      <div className="space-y-5 text-ink-deep">
        <div className="space-y-3 font-serif-th text-sm leading-relaxed">
          {body
            .split(/\n\s*\n+/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((paragraph, idx) => (
              <p key={idx} className="whitespace-pre-line">
                {paragraph.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={i} className="font-bold text-gold-ink">
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
              </p>
            ))}
        </div>

        {/* ปุ่มโทรจริง — บนมือถือกดแล้วโทรออกทันที ไม่ต้องจดเบอร์ */}
        <ul className="grid gap-2.5">
          {hotlines.map((line) => (
            <li key={line.tel}>
              <a
                href={`tel:${line.tel}`}
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-line-warm bg-inset-warm px-4 py-3 transition hover:border-gold-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink"
              >
                <span className="font-serif-th text-sm font-bold text-ink-deep">{line.label}</span>
                <span className="font-serif-th text-xs text-muted">{line.note}</span>
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="min-h-11 w-full rounded-full border border-line-warm bg-surface px-5 py-2.5 font-serif-th text-sm font-bold text-ink-deep transition hover:bg-inset-warm"
        >
          {isEnglish ? "Back to the cards" : "กลับไปหน้าเลือกคำถาม"}
        </button>
      </div>
    </Modal>
  );
}
