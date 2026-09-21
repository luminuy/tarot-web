"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useVisibleInterval } from "@/lib/utils/use-visible-interval";
import type { QueueTicket } from "@/lib/marketplace/queue.repo";

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

  if (loading && !data) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-[70vh] bg-[#F6F1E9] text-ink flex items-center justify-center p-4">
        <div className="altar-card-porcelain p-8 text-center space-y-3 z-10">
          <div className="h-8 w-8 mx-auto border-2 border-gold-ink border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted font-serif-th">กำลังตรวจสอบข้อมูลคิวของคุณ…</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-[70vh] bg-[#F6F1E9] text-ink flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl p-8 text-center space-y-4 max-w-md z-10 border border-err/40 shadow-sm">
          <p className="text-sm text-err font-serif-th">{error || "ไม่พบตั๋วคิว"}</p>
          <Button variant="gold" onClick={() => router.push("/readers")}>
            กลับไปหน้ารวมแม่หมอ
          </Button>
        </div>
      </main>
    );
  }

  const { ticket, reader, canAccessLine } = data;
  const isBlocked = ticket.screening?.verdict === "block" || ticket.status === "cancelled";
  const isCrisis = ticket.screening?.flags.includes("self_harm") || ticket.screening?.flags.includes("crisis");

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] bg-[#F6F1E9] text-ink p-4 sm:p-8 font-sans relative overflow-hidden flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto space-y-6 relative z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <Link
            href="/readers"
            className="altar-card-porcelain !rounded-xl inline-flex items-center gap-1.5 text-xs text-gold-ink hover:text-gold-ink-deep transition-colors py-1.5 px-3 font-serif-th"
          >
            <span>←</span> หน้ารวมแม่หมอ
          </Link>
          <span className="text-xs text-muted font-mono">ID: {ticket.id.slice(0, 12)}…</span>
        </div>

        {/* Main Status Board */}
        <div className="altar-card-porcelain p-6 sm:p-8 space-y-6">
          {/* Reader Profile Header */}
          <div className="altar-card-porcelain flex items-center gap-4 p-4">
            <div className="glass-chip h-14 w-14 shrink-0 overflow-hidden flex items-center justify-center text-xl font-bold text-gold-ink">
              {reader.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={reader.avatarUrl} alt="" /* ภาพประกอบล้วน — <h2> ข้าง ๆ พิมพ์ชื่อแม่หมออยู่แล้ว (INC-0125) */ className="h-full w-full object-cover" />
              ) : (
                reader.displayName.charAt(0)
              )}
            </div>
            <div>
              <h2 className="font-serif-th font-bold text-ink text-base">{reader.displayName}</h2>
              <div className="flex flex-wrap gap-1 mt-1">
                {reader.specialties.slice(0, 3).map((s, idx) => (
                  <span key={idx} className="glass-chip text-[13px] px-2 py-0.5 text-muted">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Queue Status Visuals */}
          {ticket.status === "screening" && (
            <div className="text-center py-8 space-y-3">
              <div className="h-10 w-10 mx-auto border-2 border-gold-ink border-t-transparent rounded-full animate-spin" />
              <h3 className="font-serif-th font-bold text-lg text-ink">AI กำลังกลั่นกรองคำถาม…</h3>
              <p className="text-xs text-muted font-serif-th">
                ระบบกำลังจัดเตรียมสรุปใจความและประเด็นคำถามเพื่อให้แม่หมอพร้อมรับฟังทันที
              </p>
            </div>
          )}

          {ticket.status === "waiting" && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex flex-col items-center justify-center h-28 w-28 rounded-full border-2 border-gold-ink/40 bg-surface-warm shadow-inner">
                <span className="text-[13px] text-muted font-serif-th">ลำดับคิว</span>
                <span className="text-4xl font-bold text-gold-ink font-serif-th">#{ticket.position || 1}</span>
              </div>

              <div className="space-y-1">
                <h3 className="font-serif-th font-bold text-lg text-ink">คุณกำลังอยู่ในคิวรอรับคำปรึกษา</h3>
                <p className="text-xs text-muted font-serif-th">
                  กรุณาเปิดหน้านี้ทิ้งไว้ เมื่อแม่หมอเรียกคิว ระบบจะแสดงปุ่มเปิด LINE เพื่อเริ่มสนทนาทันที
                </p>
              </div>

              {/* Polling Indicator */}
              <div className="inline-flex items-center gap-1.5 text-[13px] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                กำลังอัปเดตสถานะคิวสดแบบ Real-Time
              </div>
            </div>
          )}

          {canAccessLine && (
            <div className="text-center py-6 space-y-5 bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 border border-emerald-300 text-3xl text-emerald-700 font-bold">
                ✓
              </div>

              <div className="space-y-1.5">
                <h3 className="font-serif-th font-bold text-xl text-emerald-900">ถึงคิวของคุณแล้ว</h3>
                <p className="text-xs text-emerald-800 font-serif-th leading-relaxed">
                  {reader.displayName} พร้อมให้คำปรึกษาแล้ว แตะปุ่มด้านล่างเพื่อเริ่มสนทนาผ่าน LINE
                </p>
              </div>

              {reader.lineUrl && (
                <a
                  href={reader.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#06c755] hover:bg-[#05b34c] text-white font-serif-th font-bold text-sm shadow-sm transition"
                >
                  <span>เปิดสนทนากับแม่หมอผ่าน LINE</span>
                  <span>→</span>
                </a>
              )}
            </div>
          )}

          {isBlocked && (
            <div className="text-center py-6 space-y-4 bg-rose-50/80 border border-rose-200 p-6 rounded-2xl">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-rose-100 text-rose-700 font-bold text-sm font-serif-th">
                !
              </div>
              <h3 className="font-serif-th font-bold text-lg text-rose-800">คิวถูกยกเลิก หรือไม่ผ่านเกณฑ์</h3>
              <p className="text-xs text-ink/80 font-serif-th leading-relaxed">
                {ticket.screening?.brief || "คำถามหรือคิวนี้ได้รับการยกเลิกแล้ว"}
              </p>

              {isCrisis && (
                <div className="rounded-xl bg-surface border border-rose-300 p-4 text-xs space-y-2 text-left">
                  <p className="font-bold text-rose-700 font-serif-th">หากคุณหรือคนใกล้ชิดกำลังเผชิญช่วงเวลาที่ยากลำบาก:</p>
                  <p className="text-ink font-serif-th">
                    สายด่วนสุขภาพจิต กรมสุขภาพจิต โทรฟรี 24 ชม.:{" "}
                    <a href="tel:1323" className="font-bold text-gold-ink hover:underline font-mono text-sm">
                      1323
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Ticket Context Summary */}
          <div className="border-t border-line pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>ชื่อเล่น:</span>
              <span className="text-ink font-semibold">{ticket.nickname || "ผู้รับคำทำนาย"}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>ประเด็นคำถาม:</span>
              <span className="text-ink font-serif-th text-right max-w-[240px] truncate">
                {ticket.question}
              </span>
            </div>
            {ticket.screening?.category && (
              <div className="flex justify-between text-muted">
                <span>หมวดหมู่ AI:</span>
                <span className="text-gold-ink font-medium">{ticket.screening.category}</span>
              </div>
            )}
            <div className="flex justify-between text-muted">
              <span>ค่าบริการ / บูชาครู:</span>
              <span className="text-emerald-700 font-semibold font-serif-th">299 บาท (30 นาที)</span>
            </div>
          </div>

          {/* Cancel Action Area */}
          {ticket.status === "waiting" && (
            <div className="border-t border-line pt-4 text-center space-y-2">
              {cancelError && (
                <p className="text-xs text-err font-serif-th">{cancelError}</p>
              )}

              {confirmCancel ? (
                <div className="space-y-2 py-1">
                  <p className="text-xs text-err font-serif-th">ยืนยันการยกเลิกคิวนี้หรือไม่?</p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="tap-overlay-y text-xs px-3 py-1.5 rounded-lg bg-err text-white hover:bg-err/90 font-serif-th transition-colors"
                    >
                      {cancelling ? "กำลังยกเลิก…" : "ยืนยันยกเลิก"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmCancel(false);
                        setCancelError(null);
                      }}
                      disabled={cancelling}
                      className="altar-card-porcelain !rounded-lg tap-overlay-y text-xs px-3 py-1.5 text-ink font-serif-th transition-colors"
                    >
                      ย้อนกลับ
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="tap-overlay-y text-xs text-muted hover:text-err transition-colors font-serif-th"
                >
                  ยกเลิกคิวนี้
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
