"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RouteLink as Link } from "@/components/ui/RouteLink";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { CONSULTATION_MINUTES, CONSULTATION_PRICE_THB } from "@/lib/marketplace/offer";

interface BookQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  readerId: string;
  readerName: string;
  readerAvatarUrl?: string | null;
  isLiveOpen: boolean;
  initialQuestion?: string;
  readingSnapshot?: string;
}

const QUESTION_MAX = 1000;

/**
 * ✦ หน้าต่างเข้าคิวปรึกษา — ขั้นตอนเดียว แบบหน้าจองของเว็บระดับโลก (เจ้าของสั่ง 2026-10-03)
 * ---------------------------------------------------------------------------
 * สรุปการจองบนสุด (แม่หมอ · ราคา · สถานะ) ➔ กรอกสองช่อง ➔ ยินยอมหนึ่งบรรทัด ➔ ปุ่มหลักปุ่มเดียว
 *
 * ตัดความซ้ำซ้อนของเดิม:
 *   - กล่อง "สถานะการเปิดรับคิวสด" + ปุ่มเลือก "คิวสด / จองล่วงหน้า" ➔ ระบบเลือกให้เองตามสถานะจริง
 *     (จองล่วงหน้าไม่มีให้เลือกเวลา = คิวรอแบบเดียวกัน ให้เลือกเองจึงเป็นแค่คำถามที่ผู้ใช้ตอบไม่ได้)
 *   - ปุ่ม "ยกเลิก" ซ้ำกับปุ่มปิด (X) ของหน้าต่าง
 *   - ข้อความ PDPA ที่เคยซ้ำ 3 ที่ (การ์ด · หน้าต่าง · ท้ายหน้า) เหลือที่นี่ที่เดียว ตรงจุดที่ผู้ใช้ยินยอมจริง
 */
export const BookQueueModal: React.FC<BookQueueModalProps> = ({
  isOpen,
  onClose,
  readerId,
  readerName,
  readerAvatarUrl,
  isLiveOpen,
  initialQuestion = "",
  readingSnapshot,
}) => {
  const router = useRouter();
  const kind: "walkup" | "booking" = isLiveOpen ? "walkup" : "booking";
  const [nickname, setNickname] = useState("");
  const [question, setQuestion] = useState(initialQuestion);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("กรุณากดยินยอมการส่งข้อมูลให้แม่หมอก่อนเข้าคิว");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // ตัวตนลูกค้า (customerRef) เซิร์ฟเวอร์ออกให้เองผ่านคุกกี้ HttpOnly — ไคลเอนต์ไม่ต้องรู้ค่า (A2-13)
      const res = await fetch("/api/marketplace/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readerId,
          kind,
          nickname: nickname.trim(),
          question: question.trim(),
          readingSnapshot: readingSnapshot || undefined,
          consent: true,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; redirectUrl?: string };
      if (!res.ok) {
        setError(data.error || "เข้าคิวไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        setSubmitting(false);
        return;
      }

      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      }
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={isLiveOpen ? "เข้าคิวปรึกษา" : "ฝากคิวปรึกษา"}
      description={
        isLiveOpen ? "กรอกสองช่องแล้วเข้าคิวได้ทันที" : "แม่หมอยังไม่เปิดรับคิว ระบบจะเก็บคิวไว้ให้ แม่หมอจะเรียกเมื่อเปิดรับ"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-1 font-serif-th">
        {/* สรุปการจอง — ใคร · กี่นาที · เท่าไร (แบบหัวใบเสร็จของหน้าจองทั่วโลก) */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-line-warm bg-inset-warm/70 p-3.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-canvas text-lg font-bold text-gold-ink ring-2 ring-surface">
            {readerAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={readerAvatarUrl} alt="" /* ชื่อแม่หมออยู่ข้าง ๆ แล้ว (INC-0125) */ className="h-full w-full object-cover" />
            ) : (
              readerName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-bold text-ink-deep">{readerName}</p>
            <p className="text-[13px] text-muted">ตัวต่อตัว {CONSULTATION_MINUTES} นาที · วิดีโอคอลหรือ LINE</p>
          </div>
          <p className="shrink-0 text-right">
            <span className="block text-lg font-bold leading-none text-ink-deep">{CONSULTATION_PRICE_THB}</span>
            <span className="text-[13px] text-muted">บาท</span>
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-err/30 bg-err-wash p-3 text-[13px] text-err">
            {error}
          </div>
        )}

        <Field label="ชื่อเล่นของคุณ" hint="แม่หมอจะเรียกคุณด้วยชื่อนี้">
          {(field) => (
            <Input
              {...field}
              required
              autoComplete="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="เช่น บีม, พลอย, บอส"
              maxLength={40}
            />
          )}
        </Field>

        <div className="space-y-1">
          <Field label="อยากปรึกษาเรื่องอะไร" hint="เล่าสั้น ๆ ก็พอ AI จะสรุปให้แม่หมออ่านก่อนเริ่มคุย">
            {(field) => (
              <Textarea
                {...field}
                required
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="เช่น ความสัมพันธ์กับแฟนช่วงนี้ไม่ค่อยดี อยากรู้ว่าควรไปต่อหรือพอแค่นี้"
                maxLength={QUESTION_MAX}
              />
            )}
          </Field>
          <p className="text-right font-mono text-[11px] text-muted" aria-hidden="true">
            {question.length}/{QUESTION_MAX}
          </p>
        </div>

        <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-line-warm p-3.5 text-[13px] leading-relaxed text-ink">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-interactive-warm accent-gold-ink"
          />
          <span>
            ยินยอมส่งชื่อเล่นและคำถามให้แม่หมอ ข้อมูลจะถูกลบอัตโนมัติใน 30 วัน{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-gold-ink underline underline-offset-2">
              (PDPA)
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting || !consent || !nickname.trim() || question.trim().length < 3}
          className="btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 text-base font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
        >
          {submitting ? "กำลังเข้าคิว…" : isLiveOpen ? "เข้าคิวตอนนี้" : "ฝากคิวไว้"}
        </button>
        <p className="-mt-2 text-center text-[13px] text-muted">ยกเลิกคิวได้ตลอดระหว่างรอ</p>
      </form>
    </Modal>
  );
};
