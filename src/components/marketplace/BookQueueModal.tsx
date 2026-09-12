"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface BookQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  readerId: string;
  readerName: string;
  isLiveOpen: boolean;
  initialQuestion?: string;
  readingSnapshot?: string;
}

export const BookQueueModal: React.FC<BookQueueModalProps> = ({
  isOpen,
  onClose,
  readerId,
  readerName,
  isLiveOpen,
  initialQuestion = "",
  readingSnapshot,
}) => {
  const router = useRouter();
  const [kind, setKind] = useState<"walkup" | "booking">(isLiveOpen ? "walkup" : "booking");
  const [nickname, setNickname] = useState("");
  const [question, setQuestion] = useState(initialQuestion);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate or retrieve persistent customerRef from localStorage
  const getCustomerRef = (): string => {
    if (typeof window === "undefined") return "cust_anon";
    let ref = localStorage.getItem("tarot_customer_ref");
    if (!ref) {
      ref = `cust_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      localStorage.setItem("tarot_customer_ref", ref);
    }
    return ref;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("กรุณากดยินยอมข้อกำหนด PDPA ก่อนเข้าคิว");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const customerRef = getCustomerRef();
      const res = await fetch("/api/marketplace/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readerId,
          kind,
          customerRef,
          nickname: nickname.trim(),
          question: question.trim(),
          readingSnapshot: readingSnapshot || undefined,
          consent: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการเข้าคิว");
        setSubmitting(false);
        return;
      }

      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`ขอคำปรึกษากับ ${readerName}`}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 font-serif-th">
        {error && (
          <div className="rounded-lg border border-line-warm bg-err-wash p-3 text-xs text-err ">{error}</div>
        )}

        {/* Live Availability Status */}
        <div className="flex items-center justify-between rounded-lg bg-surface border border-line-warm p-3 text-xs ">
          <span className="text-muted">สถานะการเปิดรับคิวสด:</span>
          {isLiveOpen ? (
            <span className="inline-flex items-center gap-1 font-semibold text-ok">
              <span className="h-2 w-2 rounded-full bg-ok animate-pulse" />
              เปิดรับคิวสดทันที
            </span>
          ) : (
            <span className="text-gold-ink font-bold">จองคิวล่วงหน้า</span>
          )}
        </div>

        {/* Mode Selector */}
        {isLiveOpen && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKind("walkup")}
              className={`rounded-lg py-2 text-xs font-semibold border transition cursor-pointer ${
                kind === "walkup"
                  ? "bg-gold-ink border-line-warm text-surface"
                  : "bg-surface border-line-warm text-muted hover:text-ink-deep"
              }`}
            >
              รับคิวสดทันที
            </button>
            <button
              type="button"
              onClick={() => setKind("booking")}
              className={`rounded-lg py-2 text-xs font-semibold border transition cursor-pointer ${
                kind === "booking"
                  ? "bg-gold-ink border-line-warm text-surface"
                  : "bg-surface border-line-warm text-muted hover:text-ink-deep"
              }`}
            >
              จองคิวล่วงหน้า
            </button>
          </div>
        )}

        {/* Service Fee Display */}
        <div className="flex items-center justify-between rounded-lg bg-surface border border-line-warm p-3 text-xs ">
          <div className="flex items-center gap-2">
            <span className="text-gold-ink font-bold text-sm">ค่าบริการ / บูชาครู</span>
            <span className="text-[13px] text-muted">(30 นาที)</span>
          </div>
          <span className="font-bold text-gold-ink text-sm">299 บาท</span>
        </div>

        <Field label="ชื่อเล่นของคุณ (Nickname) *">
          {(field) => (
            <Input
              {...field}
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="เช่น บีม, พลอย, บอส"
              maxLength={40}
            />
          )}
        </Field>

        <Field label="เรื่องหรือคำถามที่ต้องการปรึกษา *">
          {(field) => (
            <Textarea
              {...field}
              required
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="ระบุสิ่งที่ต้องการถามหรือสถานการณ์เบื้องต้น เพื่อให้ AI ช่วยสรุปบรีฟให้แม่หมอ…"
              maxLength={1000}
            />
          )}
        </Field>

        {/* PDPA Consent Checkbox */}
        <div className="rounded-lg bg-inset-warm border border-line-warm p-3.5 space-y-2 ">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-ink-deep select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 rounded border-line-warm accent-gold-ink focus:ring-0"
            />
            <span className="leading-relaxed">
              ข้าพเจ้ายินยอมให้ส่งต่อข้อมูลชื่อเล่น คำถาม และสรุปไพ่ไปยังแม่หมอ โดยข้อมูลจะถูกลบอัตโนมัติภายใน 30
              วันตามมาตรฐาน PDPA
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-line-warm/30">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="gold" disabled={submitting || !consent}>
            {submitting ? "กำลังส่งข้อมูล…" : "ยืนยันการเข้าคิว"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
