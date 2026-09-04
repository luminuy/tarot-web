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
    if (!confirm("คุณต้องการยกเลิกคิวนี้ใช่หรือไม่?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/marketplace/tickets/${ticketId}`, { method: "DELETE" });
      if (res.ok) {
        fetchTicketStatus();
      } else {
        alert("ไม่สามารถยกเลิกคิวได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการยกเลิกคิว");
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-[#F6F1E9] text-[#2E211A] flex items-center justify-center p-4">
        <div className="altar-panel rounded-2xl p-8 text-center space-y-3 z-10">
          <div className="h-8 w-8 mx-auto border-2 border-[#8F5C1A] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#635B4E]">กำลังตรวจสอบข้อมูลคิวของคุณ…</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#F6F1E9] text-[#2E211A] flex items-center justify-center p-4">
        <div className="altar-panel rounded-2xl p-8 text-center space-y-4 max-w-md z-10 border border-[#A6392C]/40">
          <p className="text-sm text-[#A6392C]">{error || "ไม่พบตั๋วคิว"}</p>
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
    <main className="min-h-screen bg-[#F6F1E9] text-[#2E211A] p-4 sm:p-8 font-sans relative overflow-hidden flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto space-y-6 relative z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-4">
          <Link
            href="/readers"
            className="inline-flex items-center gap-1.5 text-xs text-[#e5c07b] hover:text-[#ffd700] transition-colors py-1 px-3 rounded-xl bg-[#130d24]/60 border border-[#e5c07b]/20 font-serif-th"
          >
            <span>←</span> หน้ารวมแม่หมอ
          </Link>
          <span className="text-xs text-[#9c93b8] font-mono">ID: {ticket.id.slice(0, 12)}…</span>
        </div>

        {/* Main Status Board */}
        <div className="altar-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-[#e5c07b]/30 shadow-2xl">
          {/* Reader Profile Header */}
          <div className="flex items-center gap-4 bg-[#140e26]/80 p-4 rounded-2xl border border-[#e5c07b]/20">
            <div className="h-14 w-14 shrink-0 rounded-full border-2 border-[#ffd700]/50 bg-[#21163b] overflow-hidden flex items-center justify-center text-xl font-bold text-[#ffd700]">
              {reader.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={reader.avatarUrl} alt={reader.displayName} className="h-full w-full object-cover" />
              ) : (
                reader.displayName.charAt(0)
              )}
            </div>
            <div>
              <h2 className="font-serif-th font-bold text-[#f5deaa] text-base">{reader.displayName}</h2>
              <div className="flex flex-wrap gap-1 mt-1">
                {reader.specialties.slice(0, 3).map((s, idx) => (
                  <span key={idx} className="text-[13px] px-1.5 py-0.5 rounded bg-[#2d1f4d] text-[#e5c07b]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Queue Status Visuals */}
          {ticket.status === "screening" && (
            <div className="text-center py-8 space-y-3">
              <div className="h-10 w-10 mx-auto border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin" />
              <h3 className="font-serif-th font-bold text-lg text-[#f5deaa]">AI กำลังกลั่นกรองคำถาม…</h3>
              <p className="text-xs text-[#9c93b8]">
                ระบบกำลังจัดเตรียมสรุปใจความและประเด็นคำถามเพื่อให้แม่หมอพร้อมรับฟังทันที
              </p>
            </div>
          )}

          {ticket.status === "waiting" && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex flex-col items-center justify-center h-28 w-28 rounded-full border-2 border-[#ffd700]/60 bg-gradient-to-b from-[#2d1a4d] to-[#120b24] shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                <span className="text-[13px] text-[#9c93b8]">ลำดับคิว</span>
                <span className="text-4xl font-bold text-[#ffd700]">#{ticket.position || 1}</span>
              </div>

              <div className="space-y-1">
                <h3 className="font-serif-th font-bold text-lg text-[#f5deaa]">คุณกำลังอยู่ในคิวรอรับคำปรึกษา</h3>
                <p className="text-xs text-[#9c93b8]">
                  กรุณาเปิดหน้านี้ทิ้งไว้ เมื่อแม่หมอเรียกคิว ระบบจะแสดงปุ่มเปิด LINE เพื่อเริ่มสนทนาทันที
                </p>
              </div>

              {/* Polling Indicator */}
              <div className="inline-flex items-center gap-1.5 text-[13px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                กำลังอัปเดตสถานะคิวสดแบบ Real-Time
              </div>
            </div>
          )}

          {canAccessLine && (
            <div className="text-center py-6 space-y-5 bg-gradient-to-b from-[#162e24]/80 to-[#101e18]/80 p-6 rounded-2xl border border-emerald-500/40">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-400 text-3xl">
                ✨
              </div>

              <div className="space-y-1.5">
                <h3 className="font-serif-th font-bold text-xl text-emerald-300">ถึงคิวของคุณแล้ว!</h3>
                <p className="text-xs text-[#c3bdd8] leading-relaxed">
                  {reader.displayName} พร้อมให้คำปรึกษาแล้ว แตะปุ่มด้านล่างเพื่อเริ่มสนทนาผ่าน LINE
                </p>
              </div>

              {reader.lineUrl && (
                <a
                  href={reader.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#06c755] hover:bg-[#05b34c] text-white font-serif-th font-bold text-sm shadow-[0_0_25px_rgba(6,199,85,0.4)] transition-all"
                >
                  <span>✦ เปิดสนทนากับแม่หมอผ่าน LINE</span>
                  <span>→</span>
                </a>
              )}
            </div>
          )}

          {isBlocked && (
            <div className="text-center py-6 space-y-4 bg-red-500/10 border border-red-500/30 p-6 rounded-2xl">
              <div className="text-3xl">⚠️</div>
              <h3 className="font-serif-th font-bold text-lg text-[#f0a0a0]">คิวถูกยกเลิก หรือไม่ผ่านเกณฑ์</h3>
              <p className="text-xs text-[#c3bdd8] leading-relaxed">
                {ticket.screening?.brief || "คำถามหรือคิวนี้ได้รับการยกเลิกแล้ว"}
              </p>

              {isCrisis && (
                <div className="rounded-xl bg-[#231218] border border-red-500/40 p-4 text-xs space-y-2">
                  <p className="font-bold text-red-300">หากคุณหรือคนใกล้ชิดกำลังเผชิญช่วงเวลาที่ยากลำบาก:</p>
                  <p className="text-white">
                    สายด่วนสุขภาพจิต กรมสุขภาพจิต โทรฟรี 24 ชม.:{" "}
                    <a href="tel:1323" className="font-bold text-[#ffd700] underline">
                      1323
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Ticket Context Summary */}
          <div className="border-t border-white/10 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-[#9c93b8]">
              <span>ชื่อเล่น:</span>
              <span className="text-[#f5deaa] font-semibold">{ticket.nickname || "ผู้รับคำทำนาย"}</span>
            </div>
            <div className="flex justify-between text-[#9c93b8]">
              <span>ประเด็นคำถาม:</span>
              <span className="text-[#f5deaa] font-serif-th text-right max-w-[240px] truncate">
                {ticket.question}
              </span>
            </div>
            {ticket.screening?.category && (
              <div className="flex justify-between text-[#9c93b8]">
                <span>หมวดหมู่ AI:</span>
                <span className="text-[#ffd700] font-medium">✦ {ticket.screening.category}</span>
              </div>
            )}
            <div className="flex justify-between text-[#9c93b8]">
              <span>ค่าบริการ / บูชาครู:</span>
              <span className="text-emerald-300 font-semibold font-serif-th">✦ 299 บาท (30 นาที)</span>
            </div>
          </div>

          {/* Cancel Button */}
          {ticket.status === "waiting" && (
            <div className="border-t border-white/10 pt-4 text-center">
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="text-xs text-[#9c93b8] hover:text-[#f0a0a0] transition-colors"
              >
                {cancelling ? "กำลังยกเลิก…" : "ยกเลิกคิวนี้"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
