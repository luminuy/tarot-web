"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useVisibleInterval } from "@/lib/utils/use-visible-interval";
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
  const [notice, setNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const fetchConsoleData = useCallback(async () => {
    try {
      let url = "/api/marketplace/console/queue";
      const params = new URLSearchParams();
      if (token) params.set("token", token);
      if (readerId) params.set("readerId", readerId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
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
  }, [token, readerId, getAuthHeaders]);

  useVisibleInterval(fetchConsoleData, 5000);

  const handleToggleLive = async () => {
    if (!data) return;
    const nextState = !data.isLiveOpen;
    setActionLoading("toggle");
    setNotice(null);
    try {
      const res = await fetch("/api/marketplace/console/queue", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isLiveOpen: nextState }),
      });
      if (res.ok) {
        fetchConsoleData();
        setNotice(nextState ? "เปิดรับคิวสดเรียบร้อยแล้ว" : "ปิดรับคิวสดเรียบร้อยแล้ว");
      } else {
        const d = await res.json().catch(() => ({}));
        setNotice(d.error || "ไม่สามารถเปลี่ยนสถานะรับคิวสดได้");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleTicketAction = async (ticketId: string, action: "accept" | "handoff" | "cancel") => {
    setActionLoading(ticketId);
    setNotice(null);
    try {
      const res = await fetch("/api/marketplace/console/queue", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ticketId, action }),
      });
      if (res.ok) {
        fetchConsoleData();
        if (action === "accept") setNotice("เรียกคิวเรียบร้อยแล้ว");
        else if (action === "handoff") setNotice("ส่งต่องานเรียบร้อยแล้ว");
        else setNotice("ยกเลิกคิวเรียบร้อยแล้ว");
      } else {
        const d = await res.json().catch(() => ({}));
        setNotice(d.error || "ดำเนินการไม่สำเร็จ");
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#F6F1E9] text-ink-deep flex items-center justify-center p-4">
        <div className="altar-panel rounded-2xl p-8 text-center space-y-3 z-10">
          {/*
        ⚠️ ทุกหน้าต้องมี <h1> หนึ่งอันเสมอ — มันคือ "ชื่อของหน้า" ที่ screen reader
        ใช้บอกผู้ใช้ว่าตอนนี้อยู่หน้าไหน และเป็นรากของสารบัญหัวข้อทั้งหน้า
        หน้านี้เคยมี <h1> ศูนย์อัน (ตรวจเจอตอนขยายด่าน a11y ให้ครอบทั้งเว็บ)
        ⚠️ ห้ามลบ แม้จะมองไม่เห็นบนจอ — ด่าน `test-a11y-critical` ตรวจทั้ง 309 หน้าแล้ว
      */}
          <h1 className="sr-only">แผงควบคุมแม่หมอ</h1>
          <div className="h-8 w-8 mx-auto border-2 border-gold-ink border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted">กำลังเชื่อมต่อแผงควบคุมแม่หมอ…</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#F6F1E9] text-ink-deep flex items-center justify-center p-4">
        <div className="altar-panel rounded-2xl p-8 text-center space-y-4 max-w-md z-10 border border-err/40">
          <h1 className="sr-only">แผงควบคุมแม่หมอ</h1>
          <h2 className="text-base font-bold text-err">ไม่สามารถเข้าใช้งานได้</h2>
          <p className="text-xs text-muted">{error || "โปรดใช้ลิงก์เข้าสู่ระบบเฉพาะบุคคลจากผู้ดูแลระบบ"}</p>
          <Link href="/" className="inline-block text-xs text-gold-ink underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </main>
    );
  }

  const { reader, isLiveOpen, tickets, totalWaiting } = data;

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#F6F1E9] text-ink-deep p-4 sm:p-8 font-sans relative overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        {notice && (
          <div className="rounded-xl border border-gold-ink/30 bg-gold-ink/10 px-4 py-2.5 text-xs text-ink flex items-center justify-between">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-muted hover:text-ink text-xs ml-2 cursor-pointer"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Header Console Bar */}
        <div className="altar-card-porcelain altar-panel p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="h-16 w-16 rounded-full border-2 border-gold-ink/40 bg-surface-warm overflow-hidden flex items-center justify-center text-2xl font-bold text-gold-ink shrink-0">
              {reader.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={reader.avatarUrl} alt="" /* ภาพประกอบล้วน — <h1> ข้าง ๆ พิมพ์ชื่อแม่หมออยู่แล้ว (INC-0125) */ className="h-full w-full object-cover" />
              ) : (
                reader.displayName.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="font-serif-th text-xl font-bold text-ink">{reader.displayName}</h1>
                <span className="text-[13px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  แผงแม่หมอ
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">LINE: {reader.lineUrl}</p>
            </div>
          </div>

          {/* Live Queue Switch */}
          <div className="altar-card-porcelain flex items-center gap-3 p-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-ink flex items-center justify-end gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${isLiveOpen ? "bg-emerald-500" : "bg-muted"}`} />
                {isLiveOpen ? "เปิดรับคิวสดอยู่" : "ปิดรับคิวสด"}
              </p>
              <p className="text-[13px] text-muted">
                {isLiveOpen ? "ลูกค้าสามารถกดรับคิวได้ทันที" : "รับเฉพาะคิวที่นัดล่วงหน้า"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleLive}
              disabled={actionLoading === "toggle"}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isLiveOpen ? "bg-emerald-600" : "bg-line"
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
            <h2 className="font-serif-th font-bold text-lg text-ink">
              รายการคิวรอรับคำปรึกษา
            </h2>
            <span className="rounded-full bg-gold-ink/10 px-2.5 py-0.5 text-xs font-bold text-gold-ink border border-gold-ink/20">
              {totalWaiting} คิว
            </span>
          </div>

          <button
            type="button"
            onClick={fetchConsoleData}
            className="text-xs text-muted hover:text-gold-ink transition-colors cursor-pointer"
          >
            รีเฟรช
          </button>
        </div>

        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <div className="altar-card-porcelain altar-panel p-12 text-center space-y-3">
            <div className="glass-chip w-10 h-10 mx-auto flex items-center justify-center text-gold-ink font-serif text-sm">
              ST
            </div>
            <h3 className="font-serif-th font-bold text-base text-ink">ยังไม่มีคิวที่รอดำเนินการ</h3>
            <p className="text-xs text-muted">
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
                  className={`altar-panel rounded-3xl p-5 space-y-4 border transition bg-surface ${
                    isReady
                      ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                      : "border-line hover:border-gold-ink/40"
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-ink/10 text-xs font-bold text-gold-ink">
                        #{ticket.position || 1}
                      </span>
                      <span className="font-serif-th font-bold text-sm text-ink">
                        คุณ{ticket.nickname || "ลูกดวง"}
                      </span>
                    </div>

                    <span
                      className={`text-[13px] px-2 py-0.5 rounded-full font-semibold ${
                        isReady
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {isReady ? "กำลังรอเชื่อมต่อ LINE" : "กำลังรอคิว"}
                    </span>
                  </div>

                  {/* AI Pre-Screening Summary Card */}
                  {ticket.screening && (
                    <div className="altar-card-porcelain p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-gold-ink font-serif-th">
                          สรุปประเด็นโดย AI
                        </span>
                        <div className="flex gap-1.5">
                          <span className="altar-card-porcelain !rounded px-1.5 py-0.5 text-[13px] text-ink">
                            {ticket.screening.category}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[13px] ${
                              ticket.screening.urgency === "high"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-surface border border-line text-muted"
                            }`}
                          >
                            ด่วน: {ticket.screening.urgency}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-ink font-serif-th leading-relaxed whitespace-pre-line">
                        {ticket.screening.brief}
                      </p>

                      {ticket.screening.suggestedSpread && (
                        <p className="text-[13px] text-muted">
                          ผังแนะนำ:{" "}
                          <span className="text-ink font-medium">
                            {ticket.screening.suggestedSpread}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-line">
                    {!isReady ? (
                      <Button
                        variant="gold"
                        size="sm"
                        className="flex-1 text-xs"
                        disabled={actionLoading === ticket.id}
                        onClick={() => handleTicketAction(ticket.id, "accept")}
                      >
                        เรียกคิวนี้
                      </Button>
                    ) : (
                      <Button
                        variant="gold"
                        size="sm"
                        className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                        disabled={actionLoading === ticket.id}
                        onClick={() => handleTicketAction(ticket.id, "handoff")}
                      >
                        ส่งต่อทาง LINE เรียบร้อย
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-err hover:bg-err/10"
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
        <main
          id="main-content"
          tabIndex={-1}
          role="status"
          aria-busy="true"
          className="min-h-screen bg-[#F6F1E9] text-ink-deep flex items-center justify-center p-4"
        >
        {/*
          ⚠️ fallback ของ Suspense คือ **HTML ที่ถูก prerender ออกมาจริง**
          ไม่ใช่แค่ของชั่วคราวที่ผู้ใช้เห็นเสี้ยววินาที — มันคือสิ่งที่บอตค้นหาและ
          ผู้ใช้เห็นตอน first paint จึงต้องมีโครงครบเหมือนหน้าจริง: <main> + <h1>

          ตรวจเจอตอนขยายด่าน a11y ให้ครอบทั้งเว็บ: หน้านี้มี <h1> ศูนย์อันใน HTML ที่ build
          เพราะเนื้อหาจริงอยู่หลัง Suspense ส่วนที่ prerender คือ fallback นี้เท่านั้น
          ⚠️ ห้ามลบ h1 — ด่าน `test-a11y-critical` ตรวจทั้ง 309 หน้าแล้ว
        */}
          <div className="altar-panel rounded-2xl p-8 text-center space-y-3 z-10">
            <h1 className="sr-only">แผงควบคุมแม่หมอ</h1>
            <div className="h-8 w-8 mx-auto border-2 border-gold-ink border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted">กำลังโหลดแผงควบคุมแม่หมอ…</p>
          </div>
        </main>
      }
    >
      <ReaderConsoleInner />
    </Suspense>
  );
}
