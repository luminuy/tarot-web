"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { QueueTicket } from "@/lib/marketplace/queue.repo";

export const dynamic = "force-dynamic";

interface ConsoleState {
  reader: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    specialties: string[];
    lineUrl: string;
    commissionPct: number;
  };
  isLiveOpen: boolean;
  tickets: QueueTicket[];
  totalWaiting: number;
}

function ReaderConsoleInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const readerId = searchParams.get("id") || searchParams.get("readerId");

  const [data, setData] = useState<ConsoleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchConsoleData = useCallback(async () => {
    try {
      let url = "/api/marketplace/console/queue";
      const params = new URLSearchParams();
      if (token) params.set("token", token);
      if (readerId) params.set("readerId", readerId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = (await res.json()) as ConsoleState;
        setData(json);
        setError(null);
      } else {
        const json = await res.json();
        setError(json.error || "ไม่สามารถเข้าสู่ระบบแผงควบคุมแม่หมอได้");
      }
    } catch {
      // transient failure
    } finally {
      setLoading(false);
    }
  }, [token, readerId]);

  useEffect(() => {
    fetchConsoleData();
    const interval = setInterval(fetchConsoleData, 5000);
    return () => clearInterval(interval);
  }, [fetchConsoleData]);

  const handleToggleLive = async () => {
    if (!data) return;
    const nextState = !data.isLiveOpen;
    setActionLoading("toggle");
    try {
      const res = await fetch("/api/marketplace/console/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLiveOpen: nextState }),
      });
      if (res.ok) {
        fetchConsoleData();
      } else {
        alert("ไม่สามารถเปลี่ยนสถานะรับคิวสดได้");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleTicketAction = async (ticketId: string, action: "accept" | "handoff" | "cancel") => {
    setActionLoading(ticketId);
    try {
      const res = await fetch("/api/marketplace/console/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, action }),
      });
      if (res.ok) {
        fetchConsoleData();
      } else {
        const d = await res.json();
        alert(d.error || "ดำเนินการไม่สำเร็จ");
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-[#F6F1E9] text-[#2E211A] flex items-center justify-center p-4">
        <div className="altar-panel rounded-2xl p-8 text-center space-y-3 z-10">
          <div className="h-8 w-8 mx-auto border-2 border-[#8F5C1A] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#635B4E]">กำลังเชื่อมต่อแผงควบคุมแม่หมอ…</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#F6F1E9] text-[#2E211A] flex items-center justify-center p-4">
        <div className="altar-panel rounded-2xl p-8 text-center space-y-4 max-w-md z-10 border border-[#A6392C]/40">
          <h2 className="text-base font-bold text-[#A6392C]">ไม่สามารถเข้าใช้งานได้</h2>
          <p className="text-xs text-[#635B4E]">{error || "โปรดใช้ลิงก์เข้าสู่ระบบเฉพาะบุคคลจากผู้ดูแลระบบ"}</p>
          <Link href="/" className="inline-block text-xs text-[#8F5C1A] underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </main>
    );
  }

  const { reader, isLiveOpen, tickets, totalWaiting } = data;

  return (
    <main className="min-h-screen bg-[#F6F1E9] text-[#2E211A] p-4 sm:p-8 font-sans relative overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        {/* Header Console Bar */}
        <div className="altar-panel rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#e5c07b]/30 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="h-16 w-16 rounded-full border-2 border-[#ffd700]/60 bg-[#21163b] overflow-hidden flex items-center justify-center text-2xl font-bold text-[#ffd700] shrink-0">
              {reader.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={reader.avatarUrl} alt={reader.displayName} className="h-full w-full object-cover" />
              ) : (
                reader.displayName.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="font-serif-th text-xl font-bold text-[#f5deaa]">{reader.displayName}</h1>
                <span className="text-[13px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  ✦ แผงแม่หมอ
                </span>
              </div>
              <p className="text-xs text-[#9c93b8] mt-0.5">LINE: {reader.lineUrl}</p>
            </div>
          </div>

          {/* Live Queue Switch */}
          <div className="flex items-center gap-3 bg-[#130d24] p-3 rounded-2xl border border-[#e5c07b]/20">
            <div className="text-right">
              <p className="text-xs font-semibold text-[#f5deaa]">
                {isLiveOpen ? "🟢 เปิดรับคิวสดอยู่" : "⚪ ปิดรับคิวสด"}
              </p>
              <p className="text-[13px] text-[#9c93b8]">
                {isLiveOpen ? "ลูกค้าสามารถกดรับคิวได้ทันที" : "รับเฉพาะคิวที่นัดล่วงหน้า"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleLive}
              disabled={actionLoading === "toggle"}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isLiveOpen ? "bg-[#10b981]" : "bg-white/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isLiveOpen ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Queue Board Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif-th font-bold text-lg text-[#f5deaa]">
              ✦ รายการคิวรอรับคำปรึกษา
            </h2>
            <span className="rounded-full bg-[#e5c07b]/20 px-2.5 py-0.5 text-xs font-bold text-[#ffd700] border border-[#e5c07b]/30">
              {totalWaiting} คิว
            </span>
          </div>

          <button
            type="button"
            onClick={fetchConsoleData}
            className="text-xs text-[#9c93b8] hover:text-[#f5deaa] transition-colors"
          >
            🔄 รีเฟรช
          </button>
        </div>

        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <div className="altar-panel rounded-3xl p-12 text-center space-y-3 border border-[#e5c07b]/20">
            <p className="text-3xl">🔮</p>
            <h3 className="font-serif-th font-bold text-base text-[#f5deaa]">ยังไม่มีคิวที่รอดำเนินการ</h3>
            <p className="text-xs text-[#9c93b8]">
              {isLiveOpen
                ? "ระบบเปิดรับคิวสดอยู่ เมื่อมีลูกค้าเข้ามาจะปรากฏที่นี่ทันที"
                : "เปิดรับคิวสดด้านบนเพื่อเริ่มรับลูกดวง"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tickets.map((ticket) => {
              const isReady = ticket.status === "ready";
              return (
                <div
                  key={ticket.id}
                  className={`altar-panel rounded-3xl p-5 space-y-4 border transition-all ${
                    isReady
                      ? "border-emerald-500/50 bg-gradient-to-b from-[#12241c] to-[#0e1713]"
                      : "border-[#e5c07b]/30 hover:border-[#ffd700]/50"
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e5c07b]/20 text-xs font-bold text-[#ffd700]">
                        #{ticket.position || 1}
                      </span>
                      <span className="font-serif-th font-bold text-sm text-[#f5deaa]">
                        คุณ{ticket.nickname || "ลูกดวง"}
                      </span>
                    </div>

                    <span
                      className={`text-[13px] px-2 py-0.5 rounded-full font-semibold ${
                        isReady
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {isReady ? "✦ กำลังรอเชื่อมต่อ LINE" : "⏳ กำลังรอคิว"}
                    </span>
                  </div>

                  {/* AI Pre-Screening Summary Card */}
                  {ticket.screening && (
                    <div className="rounded-2xl bg-[#140e26] border border-[#e5c07b]/20 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[#ffd700] uppercase tracking-wider">
                          ✦ สรุปประเด็นโดย AI
                        </span>
                        <div className="flex gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-[#2d1f4d] text-[13px] text-[#e5c07b]">
                            {ticket.screening.category}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[13px] ${
                              ticket.screening.urgency === "high"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-white/10 text-[#9c93b8]"
                            }`}
                          >
                            ด่วน: {ticket.screening.urgency}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#c3bdd8] font-serif-th leading-relaxed whitespace-pre-line">
                        {ticket.screening.brief}
                      </p>

                      {ticket.screening.suggestedSpread && (
                        <p className="text-[13px] text-[#9c93b8]">
                          ผังแนะนำ:{" "}
                          <span className="text-[#f5deaa] font-medium">
                            {ticket.screening.suggestedSpread}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    {!isReady ? (
                      <Button
                        variant="gold"
                        size="sm"
                        className="flex-1 text-xs"
                        disabled={actionLoading === ticket.id}
                        onClick={() => handleTicketAction(ticket.id, "accept")}
                      >
                        ✦ เรียกคิวนี้ (Ready)
                      </Button>
                    ) : (
                      <Button
                        variant="gold"
                        size="sm"
                        className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                        disabled={actionLoading === ticket.id}
                        onClick={() => handleTicketAction(ticket.id, "handoff")}
                      >
                        ✨ ส่งต่อ LINE แล้ว (เสร็จสิ้น)
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[#f0a0a0]"
                      disabled={actionLoading === ticket.id}
                      onClick={() => handleTicketAction(ticket.id, "cancel")}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ReaderConsolePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F6F1E9] text-[#2E211A] flex items-center justify-center p-4">
          <div className="altar-panel rounded-2xl p-8 text-center space-y-3 z-10">
            <div className="h-8 w-8 mx-auto border-2 border-[#8F5C1A] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#635B4E]">กำลังโหลดแผงควบคุมแม่หมอ…</p>
          </div>
        </main>
      }
    >
      <ReaderConsoleInner />
    </Suspense>
  );
}
