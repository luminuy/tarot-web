"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { VideoCallRoom } from "@/components/marketplace/VideoCallRoom";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { useVisibleInterval } from "@/lib/utils/use-visible-interval";
import type { QueueTicket } from "@/lib/marketplace/queue.repo";
import { CONSULTATION_PRICE_LABEL, questionCategoryLabel } from "@/lib/marketplace/offer";

interface PollResponse {
  ticket: QueueTicket;
  reader: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    specialties: string[];
    lineUrl: string | null;
  };
  canAccessLine: boolean;
  /** แม่หมอเรียกคิวแล้ว + ระบบวิดีโอคอลพร้อม (ตั้งค่า TURN แล้ว) */
  videoCallAvailable?: boolean;
}

export default function CustomerQueuePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ticketId = params.id;

  const [data, setData] = useState<PollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchTicketStatus = useCallback(async () => {
    if (!ticketId) return;
    try {
      const res = await fetch(`/api/marketplace/tickets/${ticketId}`);
      if (res.ok) {
        const json = (await res.json()) as PollResponse;
        setData(json);
        setError(null);
      } else {
        const json = await res.json();
        setError(json.error || "ไม่พบข้อมูลคิว");
      }
    } catch {
      // Network hiccup - ignore transient polling failure
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useVisibleInterval(fetchTicketStatus, 4000);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/marketplace/tickets/${ticketId}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmCancel(false);
        fetchTicketStatus();
      } else {
        setCancelError("ไม่สามารถยกเลิกคิวได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch {
      setCancelError("เกิดข้อผิดพลาดในการยกเลิกคิว กรุณาตรวจสอบการเชื่อมต่อ");
    } finally {
      setCancelling(false);
    }
  };

  // ถึงคิวแล้วให้ชื่อแท็บเปลี่ยน — คนที่สลับไปแท็บอื่นระหว่างรอจะเห็นทันที
  const isReady = data?.ticket.status === "ready";
  useEffect(() => {
    if (!isReady) return;
    const previous = document.title;
    document.title = "ถึงคิวของคุณแล้ว · SeerTarot";
    return () => {
      document.title = previous;
    };
  }, [isReady]);

  if (loading && !data) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-[70vh] text-ink flex items-center justify-center p-4">
        <div className="altar-card-porcelain p-8 text-center space-y-3 z-10">
          <div className="h-8 w-8 mx-auto border-2 border-gold-ink border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted font-serif-th">กำลังตรวจสอบข้อมูลคิวของคุณ…</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-[70vh] text-ink flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl p-8 text-center space-y-4 max-w-md z-10 border border-err/40 shadow-sm">
          <p className="text-sm text-err font-serif-th">{error || "ไม่พบตั๋วคิว"}</p>
          <Button variant="gold" onClick={() => router.push("/readers")}>
            กลับไปหน้ารวมแม่หมอ
          </Button>
        </div>
      </main>
    );
  }

  const { ticket, reader, canAccessLine, videoCallAvailable } = data;
  const isBlocked = ticket.screening?.verdict === "block" || ticket.status === "cancelled" || ticket.status === "expired";
  const isCrisis = ticket.screening?.flags.includes("self_harm") || ticket.screening?.flags.includes("crisis");
  const isDone = ticket.status === "handed_off";
  const categoryLabel = questionCategoryLabel(ticket.screening?.category);
  const stepIndex = { screening: 0, waiting: 1, ready: 2, handed_off: 3 }[ticket.status as string] ?? -1;

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] text-ink px-4 py-6 sm:py-10 font-serif-th">
      <div className="max-w-xl w-full mx-auto space-y-5">
        <h1 className="sr-only">สถานะคิวปรึกษาแม่หมอ</h1>

        <Link
          href="/readers"
          className="tap-overlay-y inline-flex items-center gap-1.5 text-sm text-gold-ink hover:text-gold-ink-deep transition-colors"
        >
          <span aria-hidden="true">←</span> แม่หมอทั้งหมด
        </Link>

        <section className="rounded-[28px] border border-line bg-surface overflow-hidden shadow-[0_20px_40px_-28px_rgba(46,33,26,0.45)]">
          {/* แถบกำมะหยี่ — ภาษาภาพเดียวกับการ์ดแม่หมอในหน้ารวม */}
          <div className="consult-stage h-20 !rounded-none !border-0" aria-hidden="true" />
          {/* แม่หมอที่คุณจองไว้ */}
          <div className="flex items-end gap-4 px-5 sm:px-6 pb-5 border-b border-line">
            <div className="-mt-9 h-[72px] w-[72px] shrink-0 rounded-full bg-canvas ring-4 ring-surface overflow-hidden grid place-items-center text-2xl font-bold text-gold-ink shadow-md">
              {reader.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={reader.avatarUrl} alt="" /* ภาพประกอบล้วน — <h2> ข้าง ๆ พิมพ์ชื่อแม่หมออยู่แล้ว (INC-0125) */ className="h-full w-full object-cover" />
              ) : (
                reader.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 pt-3">
              <p className="text-[13px] text-muted">คิวปรึกษากับ</p>
              <h2 className="font-bold text-ink text-lg leading-snug break-words">{reader.displayName}</h2>
              {reader.specialties.length > 0 && (
                <p className="text-[13px] text-muted truncate">{reader.specialties.slice(0, 4).join(" · ")}</p>
              )}
            </div>
          </div>

          {/* ความคืบหน้า 4 ขั้น — ผู้ใช้รู้ทันทีว่าอยู่ตรงไหน และต่อไปจะเกิดอะไร */}
          {!isBlocked && stepIndex >= 0 && (
            <ol className="flex items-start px-4 sm:px-6 pt-5" aria-label="ความคืบหน้าคิว">
              {["ส่งคำถาม", "รอคิว", "คุยกับแม่หมอ", "เสร็จสิ้น"].map((label, i) => {
                const done = i < stepIndex || (isDone && i === stepIndex);
                const current = i === stepIndex && !isDone;
                return (
                  <li
                    key={label}
                    aria-current={current ? "step" : undefined}
                    className="relative flex-1 flex flex-col items-center gap-1.5 text-center"
                  >
                    {i > 0 && (
                      <span
                        aria-hidden="true"
                        className={`absolute top-3.5 right-1/2 w-full h-0.5 -translate-y-1/2 ${i <= stepIndex ? "bg-ok" : "bg-line"}`}
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={`relative z-10 h-7 w-7 rounded-full grid place-items-center text-[13px] font-bold ${
                        done
                          ? "bg-ok text-white"
                          : current
                            ? "bg-gold-ink text-surface ring-4 ring-gold-ink/20"
                            : "bg-surface border border-line text-muted"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={`text-[13px] leading-tight ${current ? "font-bold text-ink" : "text-muted"}`}>
                      {label}
                      {done && <span className="sr-only"> (เสร็จแล้ว)</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="p-5 sm:p-6 space-y-5">
            {ticket.status === "screening" && (
              <div className="text-center py-6 space-y-3" role="status">
                <div className="h-10 w-10 mx-auto border-2 border-gold-ink border-t-transparent rounded-full animate-spin" />
                <h3 className="font-bold text-lg text-ink">กำลังสรุปคำถามของคุณ…</h3>
                <p className="text-sm text-muted"><ThaiPhrases>AI กำลังเตรียมสรุปเรื่องที่คุณถาม ให้แม่หมออ่านก่อนเริ่มคุย</ThaiPhrases></p>
              </div>
            )}

            {ticket.status === "waiting" && (
              <div className="text-center py-4 space-y-4">
                <div className="relative mx-auto h-36 w-36">
                  <span aria-hidden="true" className="absolute -inset-3 rounded-full bg-gold-ink/10 animate-pulse" />
                  <div className="consult-stage relative h-full w-full rounded-full flex flex-col items-center justify-center">
                    <span className="text-[13px] text-gold-on-dark">คิวที่</span>
                    <span className="text-5xl font-bold text-surface leading-none mt-1">{ticket.position || 1}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-lg text-ink">คุณอยู่ในคิวแล้ว</h3>
                  <p className="text-sm text-muted leading-relaxed max-w-sm mx-auto">
                    <ThaiPhrases>เปิดหน้านี้ทิ้งไว้ได้เลย เมื่อแม่หมอเรียกคิว ปุ่มเข้าห้องวิดีโอคอลจะขึ้นที่นี่ทันที</ThaiPhrases>
                  </p>
                </div>
                <p className="inline-flex items-center gap-2 text-[13px] text-ok font-semibold" role="status">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ok animate-pulse" />
                  อัปเดตสถานะอัตโนมัติ
                </p>
              </div>
            )}

            {ticket.status === "ready" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl bg-ok/10 border border-ok/30 p-4" role="status">
                  <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-ok text-white grid place-items-center font-bold">
                    ✓
                  </span>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-lg text-ink">ถึงคิวของคุณแล้ว</h3>
                    <p className="text-sm text-ink leading-relaxed">
                      <ThaiPhrases>
                        {videoCallAvailable
                          ? `${reader.displayName} พร้อมแล้ว กดเข้าห้องวิดีโอคอล เพื่อเริ่มคุย`
                          : `${reader.displayName} พร้อมแล้ว กดปุ่มด้านล่าง เพื่อเริ่มคุยทาง LINE`}
                      </ThaiPhrases>
                    </p>
                  </div>
                </div>

                {/* 📹 วิดีโอคอลตัวต่อตัว — ผ่าน TURN เสมอ (ซ่อน IP ทั้งสองฝั่ง) · ทางหลักเมื่อพร้อม */}
                {videoCallAvailable && (
                  <VideoCallRoom
                    ticketId={ticket.id}
                    role="customer"
                    peerName={reader.displayName}
                    peerAvatarUrl={reader.avatarUrl}
                    embedded
                  />
                )}

                {canAccessLine && reader.lineUrl && (
                  videoCallAvailable ? (
                    <p className="text-center text-[13px] text-muted">
                      ภาพหรือเสียงมีปัญหา?{" "}
                      <a
                        href={reader.lineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gold-ink underline underline-offset-2"
                      >
                        คุยผ่าน LINE แทน
                      </a>
                    </p>
                  ) : (
                    <a
                      href={reader.lineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#06c755] hover:bg-[#05b34c] text-white font-bold text-sm transition"
                    >
                      เริ่มคุยกับแม่หมอทาง LINE <span aria-hidden="true">→</span>
                    </a>
                  )
                )}
              </div>
            )}

            {isDone && (
              <div className="text-center py-4 space-y-4">
                <div className="h-14 w-14 mx-auto rounded-full bg-ok text-white grid place-items-center text-2xl font-bold" aria-hidden="true">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-ink">ปรึกษาเสร็จเรียบร้อย</h3>
                  <p className="text-sm text-muted"><ThaiPhrases>ขอบคุณที่ใช้บริการ ขอให้เรื่องที่ถามคลี่คลายไปในทางที่ดี</ThaiPhrases></p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link href="/" className="btn-gold-glass inline-flex items-center justify-center px-5 py-3 text-sm font-bold">
                    ดูดวงกับแม่หมอ AI
                  </Link>
                  <Link
                    href="/readers"
                    className="inline-flex items-center justify-center px-5 py-3 rounded-full border border-line bg-surface text-sm font-semibold text-ink hover:border-gold transition"
                  >
                    ดูแม่หมอท่านอื่น
                  </Link>
                </div>
                {reader.lineUrl && (
                  <p className="text-[13px] text-muted">
                    อยากคุยต่อ?{" "}
                    <a href={reader.lineUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-ink underline underline-offset-2">
                      ติดต่อแม่หมอทาง LINE
                    </a>
                  </p>
                )}
              </div>
            )}

            {isBlocked && (
              <div className="text-center py-4 space-y-3 rounded-2xl bg-err-wash border border-err/30 p-5">
                <h3 className="font-bold text-lg text-err">คิวนี้ถูกยกเลิกแล้ว</h3>
                <p className="text-sm text-ink leading-relaxed">
                  {ticket.screening?.verdict === "block" && ticket.screening.brief
                    ? ticket.screening.brief
                    : "ถ้ายังอยากปรึกษา เลือกแม่หมอแล้วเข้าคิวใหม่ได้เลย"}
                </p>

                {isCrisis && (
                  <div className="rounded-xl bg-surface border border-err/30 p-4 text-sm space-y-1 text-left">
                    <p className="font-bold text-err">หากคุณหรือคนใกล้ชิดกำลังเผชิญช่วงเวลาที่ยากลำบาก:</p>
                    <p className="text-ink">
                      สายด่วนสุขภาพจิต กรมสุขภาพจิต โทรฟรี 24 ชม.:{" "}
                      <a href="tel:1323" className="font-bold text-gold-ink hover:underline font-mono">
                        1323
                      </a>
                    </p>
                  </div>
                )}

                <Link href="/readers" className="btn-gold-glass inline-flex items-center justify-center px-5 py-3 text-sm font-bold">
                  เลือกแม่หมอ
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ข้อมูลที่ส่งให้แม่หมอ — แสดงเต็มไม่ตัดคำ ให้ตรวจได้ว่าส่งอะไรไป */}
        <section className="altar-card-porcelain !rounded-3xl p-5 sm:p-6 space-y-3" aria-labelledby="ticket-details-heading">
          <h2 id="ticket-details-heading" className="font-bold text-ink">ข้อมูลที่แม่หมอเห็น</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted shrink-0">ชื่อเล่น</dt>
              <dd className="text-ink font-semibold text-right break-words">{ticket.nickname || "ผู้รับคำทำนาย"}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted">เรื่องที่ถาม</dt>
              <dd className="text-ink leading-relaxed whitespace-pre-line break-words rounded-xl bg-surface border border-line p-3">
                {ticket.question}
              </dd>
            </div>
            {categoryLabel && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted shrink-0">หมวด</dt>
                <dd className="text-ink text-right">{categoryLabel}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 pt-2.5 border-t border-line">
              <dt className="text-muted shrink-0">ค่าบริการ</dt>
              <dd className="text-ink font-bold text-right">{CONSULTATION_PRICE_LABEL}</dd>
            </div>
          </dl>
        </section>

        {/* ยกเลิกคิว — เฉพาะตอนยังรอคิว */}
        {ticket.status === "waiting" && (
          <div className="text-center space-y-2">
            {cancelError && <p className="text-sm text-err">{cancelError}</p>}
            {confirmCancel ? (
              <div className="space-y-2">
                <p className="text-sm text-err">ยืนยันยกเลิกคิวนี้ใช่ไหม?</p>
                <div className="flex justify-center gap-2">
                  <Button variant="gold" className="!bg-err !text-white" onClick={handleCancel} disabled={cancelling}>
                    {cancelling ? "กำลังยกเลิก…" : "ยกเลิกคิว"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setConfirmCancel(false);
                      setCancelError(null);
                    }}
                    disabled={cancelling}
                  >
                    ไม่ยกเลิก
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="tap-overlay-y text-sm text-muted hover:text-err transition-colors underline underline-offset-2"
              >
                ยกเลิกคิวนี้
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
