"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { VideoCallRoom } from "@/components/marketplace/VideoCallRoom";
import { useVisibleInterval } from "@/lib/utils/use-visible-interval";
import type { QueueTicket } from "@/lib/marketplace/queue.repo";
import type { ScheduleRule } from "@/lib/marketplace/booking-policy";
import {
  ReaderBookingSettings,
  ReaderScheduleEditor,
  ShareBookingLinkCard,
  UpcomingBookings,
  type ReaderSettingsState,
} from "@/components/marketplace/ConsoleBookingParts";
import {
  LIVE_PRESENCE_TIMEOUT_MINUTES,
  NO_SHOW_GRACE_MINUTES,
  bkkDateKey,
  canMarkNoShow,
  formatTime,
  relativeDayLabel,
} from "@/lib/marketplace/booking-policy";
import { questionCategoryLabel, questionUrgencyLabel, suggestedSpreadLabel } from "@/lib/marketplace/offer";
import { PrivateRoomCard } from "@/components/marketplace/PrivateRoomCard";
import { ConsultHero, ConsultWindow } from "@/components/marketplace/ConsultUi2";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { InviteView } from "@/lib/marketplace/invites.repo";

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
  /** ลิงก์หน้าจองที่แม่หมอส่งให้ลูกค้า (โดเมนหลักเสมอ) */
  bookingUrl?: string;
  /** เวลาว่างใกล้สุดที่ลูกค้าจองได้ตอนนี้ — null = ไม่มีใน 14 วัน */
  nextSlot?: number | null;
  /**
   * `paid` = ลูกค้าจ่ายแล้ว — ยังไม่จ่าย (ตั๋วยุคก่อนระบบจ่ายเงิน) เรียกคิวไม่ได้
   * `privateRoom` = ลูกค้าจากลิงก์ห้องส่วนตัวของแม่หมอเอง (migrations/0032)
   */
  tickets: (QueueTicket & { paid?: boolean; privateRoom?: boolean })[];
  /** ลิงก์ห้องส่วนตัวที่ยังใช้ได้ (รอเปิด · กำลังจ่าย · จ่ายแล้ว · คุยเสร็จ) */
  invites?: InviteView[];
  totalWaiting: number;
  /** ตั้งค่า TURN แล้ว = แม่หมอเปิดวิดีโอคอลกับคิวที่เรียกแล้วได้ */
  videoCallEnabled?: boolean;
  /** สตูดิโอทำคำอ่านให้ลูกค้าของตัวเอง (REFLECTION_JOURNAL_PLAN 1.13) */
  studioEnabled?: boolean;
  /** ตารางรับนัดประจำสัปดาห์ (migrations/0020) */
  schedule?: ScheduleRule[];
  /** ตั้งค่าการรับนัด (migrations/0021) */
  settings?: ReaderSettingsState;
}

/** เวลาหมดอายุของลิงก์แผง — อ่านจาก token เอง (ส่วนแรกคือ JSON ที่ไม่ได้เข้ารหัส มีแค่รหัสแม่หมอ + เวลาหมดอายุ) */
function tokenExpiry(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** ข้อความที่แม่หมออ่านเข้าใจ — เดิมโชว์ข้อความจาก API ตรง ๆ เช่น "Token หมดอายุหรือไม่ถูกต้อง" */
function consoleAccessError(status: number): string {
  if (status === 401) return "ลิงก์นี้หมดอายุ ถูกยกเลิก หรือคัดลอกมาไม่ครบ — ขอลิงก์ใหม่จากแอดมิน SeerTarot ได้เลย";
  if (status === 403) return "บัญชีแม่หมอนี้ยังรออนุมัติ หรือถูกพักงานไว้ — ติดต่อแอดมิน SeerTarot";
  if (status === 404) return "ไม่พบบัญชีแม่หมอนี้ — ติดต่อแอดมิน SeerTarot";
  return "เข้าแผงไม่สำเร็จ — ลองรีเฟรชหน้านี้อีกครั้ง";
}

const LINK_WARN_MS = 3 * 60 * 60 * 1000;

/** ที่เก็บโทเคนของแท็บนี้ — ใช้คีย์เดียวกับสตูดิโอ (เป็นโทเคนแม่หมอตัวเดียวกัน) */
const TOKEN_KEY = STORAGE_KEYS.studioReaderToken;

function ReaderConsoleInner() {
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token");
  const readerId = searchParams.get("id") || searchParams.get("readerId");
  /*
   * โทเคนแม่หมอเป็นรหัสผ่านเข้าแผง — รับจากลิงก์ครั้งเดียว ย้ายไปเก็บใน sessionStorage ของแท็บนี้
   * แล้วลบออกจาก URL ทันที (แบบเดียวกับสตูดิโอ) ลิงก์ในแถบที่อยู่/ประวัติ/ระบบวัดผลจึงไม่มีโทเคน
   * ยังไม่ย้ายเสร็จ (`tokenReady`) = ยังไม่ดึงข้อมูล กันขึ้น "ลิงก์หมดอายุ" แวบตอนรีเฟรชหน้า
   */
  const [token, setToken] = useState<string | null>(queryToken);
  const [tokenReady, setTokenReady] = useState(false);
  useEffect(() => {
    let t = queryToken;
    try {
      if (t) sessionStorage.setItem(TOKEN_KEY, t);
      else t = sessionStorage.getItem(TOKEN_KEY);
    } catch {
      // โหมดส่วนตัว/บล็อกที่เก็บ — ใช้โทเคนที่ได้จาก URL ในหน่วยความจำของหน้านี้ต่อ
    }
    if (queryToken) {
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
    setToken((prev) => t ?? prev);
    setTokenReady(true);
  }, [queryToken]);

  const [data, setData] = useState<ConsoleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  /** ลิงก์หมดอายุระหว่างเปิดแผงค้างไว้ — แจ้งเป็นแถบด้านบน ไม่ล้างหน้าทิ้ง (ห้องวิดีโอที่คุยอยู่ต้องไม่ดับ) */
  const [linkExpired, setLinkExpired] = useState(false);
  /** ถามคิวรอบล่าสุดล้มชั่วคราว (เน็ต/5xx/429) — แถบเล็ก ไม่ล้างแผง (B4-09) */
  const [unstable, setUnstable] = useState(false);
  const hasData = useRef(false);
  const linkExpiresAt = useMemo(() => tokenExpiry(token), [token]);

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
    if (!tokenReady) return;
    try {
      let url = "/api/marketplace/console/queue";
      // โทเคนไปทางหัว Authorization เท่านั้น — ไม่ต่อท้าย URL (URL ค้างอยู่ใน log)
      const params = new URLSearchParams();
      if (readerId) params.set("readerId", readerId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = (await res.json()) as ConsoleState;
        setData(json);
        setNow(Date.now());
        setError(null);
        setLinkExpired(false);
        setUnstable(false);
        hasData.current = true;
      } else if (res.status === 401 && hasData.current) {
        // เดิม: ลิงก์หมดอายุกลางคิว ➔ ทั้งหน้ากลายเป็นหน้า error ห้องวิดีโอที่กำลังคุยดับไปด้วย
        setLinkExpired(true);
        setNow(Date.now());
      } else if ((res.status >= 500 || res.status === 429) && hasData.current) {
        // B4-09: เซิร์ฟเวอร์สะดุดชั่วคราวกลางคิว ➔ เก็บแผงเดิม (ห้องวิดีโอที่คุยอยู่ไม่ถูกถอด) แล้วลองรอบถัดไป
        setUnstable(true);
      } else {
        setError(consoleAccessError(res.status));
      }
    } catch {
      // เน็ตสะดุดชั่วคราว — เก็บแผงเดิม รอรอบถัดไป
      if (hasData.current) setUnstable(true);
    } finally {
      setLoading(false);
    }
  }, [tokenReady, readerId, getAuthHeaders]);

  useVisibleInterval(fetchConsoleData, 5000);
  // รอบแรกของตัวจับเวลาข้างบนเกิดก่อนย้ายโทเคนเสร็จ (ข้ามไป) — ย้ายเสร็จแล้วดึงทันที ไม่ต้องรอรอบ 5 วินาที
  useEffect(() => {
    if (tokenReady) void fetchConsoleData();
  }, [tokenReady, fetchConsoleData]);

  /*
   * ✦ คิวสดเปิดจริงเฉพาะตอนแม่หมออยู่ (เห็นแผงภายใน 15 นาที — migrations/0031 · แผน CONSULT_FLOW ข้อ 3.2)
   * แท็บถูกซ่อน (สลับไปแท็บอื่นบนคอม) แผงหยุดถามทุก 5 วินาที แต่ยังส่งสัญญาณ "ยังอยู่" นาทีละครั้ง
   * มือถือล็อกจอ/สลับแอป JS หยุดทั้งหมด ➔ ไม่มีสัญญาณ ➔ เกิน 15 นาทีระบบถือว่าปิดคิวสดเอง
   */
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "hidden") void fetchConsoleData();
    }, 60_000);
    return () => clearInterval(timer);
  }, [fetchConsoleData]);

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

  const handleTicketAction = async (
    ticketId: string,
    action: "accept" | "handoff" | "cancel" | "no_show",
    opts?: { openRoom?: boolean },
  ) => {
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
        // ลูกค้าจากลิงก์ห้องส่วนตัว: รับเข้าห้อง = เปิดห้องวิดีโอให้เลย ไม่ต้องหาปุ่ม "เข้าห้องวิดีโอ" อีกรอบ
        if (action === "accept" && opts?.openRoom) {
          setActiveCallId(ticketId);
          setNotice("รับลูกค้าเข้าห้องแล้ว — กดเปิดกล้องในห้องวิดีโอได้เลย");
        } else if (action === "accept") setNotice("เรียกคิวเรียบร้อยแล้ว");
        else if (action === "handoff") setNotice("ปิดคิวเรียบร้อยแล้ว");
        else if (action === "no_show") setNotice("บันทึกว่าลูกค้าไม่เข้าห้องตามนัดแล้ว ระบบส่งอีเมลแจ้งลูกค้าแล้ว");
        else setNotice("ยกเลิกแล้ว ระบบคืนเงินลูกค้าเต็มจำนวนให้อัตโนมัติ");
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
      <main id="main-content" tabIndex={-1} className="min-h-screen text-ink-deep flex items-center justify-center p-4">
        <div className="page-band-tint v3-cs-win text-center space-y-3 z-10">
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
      <main id="main-content" tabIndex={-1} className="min-h-screen text-ink-deep flex items-center justify-center p-4">
        <div className="page-band-tint v3-cs-win text-center space-y-4 max-w-md z-10">
          <h1 className="sr-only">แผงควบคุมแม่หมอ</h1>
          <h2 className="text-base font-bold text-err">เข้าแผงแม่หมอไม่ได้</h2>
          <p className="text-sm text-ink">{error || "เปิดแผงนี้จากลิงก์ที่แอดมินส่งให้"}</p>
          <p className="text-xs text-muted">คิวและนัดของคุณยังอยู่ครบ — เปิดลิงก์ใหม่แล้วจะเห็นเหมือนเดิม</p>
          <Link href="/" className="inline-block text-xs text-gold-ink underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </main>
    );
  }

  const { reader, isLiveOpen, tickets: allTickets, totalWaiting, videoCallEnabled, schedule = [] } = data;
  // นัดล่วงหน้าที่ยังไม่ถึงเวลาแยกไปอยู่ "นัดที่จะถึง" — กริดคิวด้านล่างคือคิวสด + นัดที่เริ่มแล้ว
  const upcomingBookings = allTickets.filter((t) => t.kind === "booking" && t.status === "waiting");
  const tickets = allTickets.filter((t) => !(t.kind === "booking" && t.status === "waiting"));
  const bookedDates: Record<string, number> = {};
  for (const t of upcomingBookings) {
    if (t.slotStart && t.paid !== false) {
      const key = bkkDateKey(t.slotStart);
      bookedDates[key] = (bookedDates[key] ?? 0) + 1;
    }
  }
  // ห้องวิดีโอแสดงเฉพาะตอนคิวนั้นยังอยู่สถานะ "เรียกแล้ว" — ปิดคิว = ห้องหายและกล้องดับเอง
  const activeCallTicket = activeCallId
    ? tickets.find((t) => t.id === activeCallId && t.status === "ready") ?? null
    : null;

  return (
    <main id="main-content" tabIndex={-1} className="v3-cs text-ink-deep font-sans">
      {/* v3 UI 2.0 (เจ้าของ 2026-10-26): หัวหน้าแถบครีม (ชื่อแม่หมอ | สวิตช์คิวสด) ➔ งานทั้งหมดในหน้าต่างครีม */}
      <ConsultHero
        compact
        kicker="แผงแม่หมอ"
        title={reader.displayName}
        lede={<>LINE: {reader.lineUrl}</>}
        aside={
          <div className="v3-cs-card is-row">
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 shrink-0 rounded-full ${isLiveOpen ? "bg-ok" : "bg-muted"}`} />
                {isLiveOpen ? "เปิดรับคิวสดอยู่" : "ปิดรับคิวสด"}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted">
                {isLiveOpen
                  ? `ลูกค้ากด "คุยตอนนี้" ได้ · ไม่ได้เปิดหน้านี้เกิน ${LIVE_PRESENCE_TIMEOUT_MINUTES} นาที ระบบปิดให้เอง`
                  : "รับเฉพาะคิวที่นัดล่วงหน้า"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleLive}
              disabled={actionLoading === "toggle"}
              role="switch"
              aria-checked={isLiveOpen}
              aria-label="เปิดรับคิวสด"
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
                isLiveOpen ? "bg-emerald-700" : "bg-[#CFC3B2]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isLiveOpen ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        }
      >
        {data.studioEnabled && token && (
          <a href={`/readers/studio?token=${encodeURIComponent(token)}`} className="v3-cs-back">
            สตูดิโอคำอ่าน — ทำคำอ่านให้ลูกค้าของคุณเอง
          </a>
        )}
      </ConsultHero>

      <ConsultWindow label="งานของแม่หมอ">
      <div className="space-y-6">
        {/* ลิงก์แผงมีวันหมดอายุ (1–30 วันตามที่แอดมินเลือก) — เตือนก่อนหมด 3 ชม. แม่หมอจะได้ขอลิงก์ใหม่ทันก่อนนัด */}
        {unstable && !linkExpired && (
          <p role="status" className="rounded-xl border border-line-warm bg-inset-warm px-4 py-3 text-sm leading-relaxed text-ink">
            เชื่อมต่อไม่เสถียร กำลังลองใหม่อัตโนมัติ — ห้องวิดีโอที่คุยอยู่ยังต่ออยู่ ไม่ต้องรีเฟรชหน้า
          </p>
        )}
        {(linkExpired || (linkExpiresAt !== null && linkExpiresAt - now < LINK_WARN_MS)) && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
              linkExpired || (linkExpiresAt ?? 0) <= now ? "border-err/30 bg-err-wash text-err" : "border-gold-ink/30 bg-inset-warm text-ink"
            }`}
          >
            {linkExpired || (linkExpiresAt ?? 0) <= now ? (
              <>
                <strong className="font-bold">ลิงก์เข้าแผงนี้ใช้ไม่ได้แล้ว</strong> (หมดอายุหรือแอดมินยกเลิก) — กดปุ่มในหน้านี้จะไม่ได้ผล
                ขอลิงก์ใหม่จากแอดมินแล้วเปิดลิงก์นั้นแทน (คิวและนัดยังอยู่ครบ)
              </>
            ) : (
              <>
                <strong className="font-bold">
                  ลิงก์เข้าแผงนี้ใช้ได้ถึง {relativeDayLabel(linkExpiresAt as number, now)} {formatTime(linkExpiresAt as number)} น.
                </strong>{" "}
                — ถ้ามีนัดหลังเวลานี้ ขอลิงก์ใหม่จากแอดมินไว้ก่อน
              </>
            )}
          </div>
        )}

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

        {/* ✦ ห้องคุยส่วนตัว — ลิงก์ให้ลูกค้าคนเดียว จ่ายแล้วรอแม่หมอรับเข้าห้อง (แผน CONSULT_FLOW คลื่น 7) */}
        <PrivateRoomCard
          invites={data.invites ?? []}
          readerName={reader.displayName}
          priceThb={data.settings?.priceThb ?? null}
          nowMs={now}
          authHeaders={getAuthHeaders}
          onChanged={(message) => {
            setNotice(message);
            void fetchConsoleData();
          }}
        />

        {/* ส่งลิงก์ให้ลูกค้า — เห็นก่อนส่งว่าลูกค้าที่เปิดลิงก์ตอนนี้จะคุยได้เลยหรือได้แค่นัด (CONSULT_FLOW P3) */}
        {data.bookingUrl && (
          <ShareBookingLinkCard
            bookingUrl={data.bookingUrl}
            readerName={reader.displayName}
            isLiveOpen={isLiveOpen}
            nextSlot={data.nextSlot ?? null}
            nowMs={now}
            toggling={actionLoading === "toggle"}
            onOpenLive={() => void handleToggleLive()}
          />
        )}

        <UpcomingBookings
          tickets={upcomingBookings}
          nowMs={now}
          busyId={actionLoading}
          onAction={(id, action) => void handleTicketAction(id, action)}
        />

        {/* Queue Board Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif-th font-bold text-lg text-ink">
              คิวสดและนัดที่กำลังคุย
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

        {/* 📹 ห้องวิดีโอคอลของคิวที่กำลังคุย */}
        {videoCallEnabled && activeCallTicket && (
          <VideoCallRoom
            key={activeCallTicket.id}
            ticketId={activeCallTicket.id}
            role="reader"
            peerName={`คุณ${activeCallTicket.nickname || "ลูกดวง"}`}
            authToken={token}
            onClose={() => setActiveCallId(null)}
          />
        )}

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
                : "เปิดรับคิวสดด้านบน หรือส่งลิงก์ห้องส่วนตัวให้ลูกค้า แล้วลูกค้าที่จ่ายแล้วจะปรากฏที่นี่"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tickets.map((ticket) => {
              const isReady = ticket.status === "ready";
              const unpaid = ticket.paid === false;
              // ค่าจาก AI คัดกรองเก็บเป็นรหัสอังกฤษ (love · medium · love-two-hearts) ➔ แปลงเป็นคำไทยก่อนโชว์แม่หมอ
              const categoryLabel = questionCategoryLabel(ticket.screening?.category);
              const urgencyLabel = questionUrgencyLabel(ticket.screening?.urgency);
              const spreadLabel = suggestedSpreadLabel(ticket.screening?.suggestedSpread);
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
                        {ticket.kind === "booking" ? "นัด" : `#${ticket.position || 1}`}
                      </span>
                      <span className="font-serif-th font-bold text-sm text-ink">
                        คุณ{ticket.nickname || "ลูกดวง"}
                      </span>
                      {ticket.privateRoom && (
                        <span className="whitespace-nowrap rounded-full border border-gold-ink/30 bg-inset-warm px-2 py-0.5 text-[13px] font-semibold text-gold-ink">
                          ห้องส่วนตัว
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[13px] px-2 py-0.5 rounded-full font-semibold ${
                        isReady
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {isReady
                        ? ticket.privateRoom
                          ? "รับเข้าห้องแล้ว"
                          : "เรียกคิวแล้ว"
                        : unpaid
                          ? "ยังไม่ชำระเงิน"
                          : ticket.privateRoom
                            ? "ชำระแล้ว · รอรับเข้าห้อง"
                            : "ชำระแล้ว · รอคิว"}
                    </span>
                  </div>

                  {/* ม.26: บอกแม่หมอว่าลูกค้ายินยอมเรื่องข้อมูลอ่อนไหวหรือไม่ (migrations/0029) */}
                  <p className="text-[13px] leading-relaxed text-muted">
                    {ticket.sensitiveConsentAt
                      ? "ลูกค้ายินยอมให้ใช้เรื่องสุขภาพ เพศวิถี หรือความเชื่อในคำถามเพื่อดูดวงครั้งนี้"
                      : "ลูกค้าไม่ได้ยินยอมเรื่องข้อมูลอ่อนไหว — อย่าถามหรือจดเรื่องสุขภาพ เพศวิถี หรือความเชื่อ"}
                  </p>

                  {/* ลูกค้าจากลิงก์ห้องส่วนตัวเว้นคำถามได้ (คุยกันใน LINE มาแล้ว) — บอกแม่หมอตรง ๆ แทนการ์ดว่าง */}
                  {ticket.privateRoom && !ticket.question && (
                    <p className="text-[13px] leading-relaxed text-muted">ลูกค้าไม่ได้เขียนคำถามไว้ — เริ่มถามในห้องได้เลย</p>
                  )}

                  {/* AI Pre-Screening Summary Card */}
                  {ticket.screening && (
                    <div className="altar-card-porcelain p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-gold-ink font-serif-th">
                          สรุปประเด็นโดย AI
                        </span>
                        <div className="flex gap-1.5">
                          {categoryLabel && (
                            <span className="altar-card-porcelain !rounded px-1.5 py-0.5 text-[13px] text-ink">
                              {categoryLabel}
                            </span>
                          )}
                          {urgencyLabel && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[13px] ${
                                ticket.screening.urgency === "high"
                                  ? "bg-err-wash text-err border border-err/30"
                                  : "bg-surface border border-line text-muted"
                              }`}
                            >
                              {urgencyLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-ink font-serif-th leading-relaxed whitespace-pre-line">
                        {ticket.screening.brief}
                      </p>

                      {spreadLabel && (
                        <p className="text-[13px] text-muted">
                          ผังแนะนำ:{" "}
                          <span className="text-ink font-medium">
                            {spreadLabel}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-line">
                    {!isReady && unpaid ? (
                      <p className="flex-1 self-center text-xs text-muted">
                        ลูกค้ายังไม่ชำระเงิน — เรียกคิวได้หลังชำระแล้วเท่านั้น
                      </p>
                    ) : !isReady ? (
                      <Button
                        variant="gold"
                        size="sm"
                        className="flex-1 text-xs"
                        disabled={actionLoading === ticket.id}
                        onClick={() =>
                          handleTicketAction(ticket.id, "accept", { openRoom: Boolean(ticket.privateRoom && videoCallEnabled) })
                        }
                      >
                        {ticket.privateRoom ? "รับเข้าห้อง" : "เรียกคิวนี้"}
                      </Button>
                    ) : (
                      <>
                        {videoCallEnabled && activeCallId !== ticket.id && (
                          <Button
                            variant="gold"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => setActiveCallId(ticket.id)}
                          >
                            เข้าห้องวิดีโอ
                          </Button>
                        )}
                        <Button
                          variant="gold"
                          size="sm"
                          className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                          disabled={actionLoading === ticket.id}
                          onClick={() => handleTicketAction(ticket.id, "handoff")}
                        >
                          เสร็จสิ้นคิวนี้
                        </Button>
                        {/* นัดล่วงหน้าที่เริ่มแล้ว เลยเวลานัด 15 นาที — เซิร์ฟเวอร์ยอมเฉพาะเมื่อเปิดห้องรอครบเวลาแล้วลูกค้าไม่เข้า */}
                        {ticket.kind === "booking" && videoCallEnabled && canMarkNoShow(ticket.slotStart, now) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            disabled={actionLoading === ticket.id}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `แจ้งว่าลูกค้าไม่เข้าห้องตามนัด? ใช้ได้เมื่อคุณเปิดห้องวิดีโอรอครบ ${NO_SHOW_GRACE_MINUTES} นาทีแล้วลูกค้ายังไม่เข้า · ไม่มีการคืนเงิน และระบบส่งอีเมลแจ้งลูกค้า`
                                )
                              )
                                void handleTicketAction(ticket.id, "no_show");
                            }}
                          >
                            ลูกค้าไม่เข้าห้อง
                          </Button>
                        )}
                      </>
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

        {data.settings && (
          <ReaderBookingSettings
            key={JSON.stringify(data.settings)}
            settings={data.settings}
            bookedDates={bookedDates}
            nowMs={now}
            authHeaders={getAuthHeaders}
            onSaved={(message) => {
              setNotice(message);
              void fetchConsoleData();
            }}
          />
        )}

        <ReaderScheduleEditor
          key={JSON.stringify(schedule)}
          schedule={schedule}
          authHeaders={getAuthHeaders}
          onSaved={(message) => {
            setNotice(message);
            void fetchConsoleData();
          }}
        />
      </div>
      </ConsultWindow>
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
          className="min-h-screen text-ink-deep flex items-center justify-center p-4"
        >
        {/*
          ⚠️ fallback ของ Suspense คือ **HTML ที่ถูก prerender ออกมาจริง**
          ไม่ใช่แค่ของชั่วคราวที่ผู้ใช้เห็นเสี้ยววินาที — มันคือสิ่งที่บอตค้นหาและ
          ผู้ใช้เห็นตอน first paint จึงต้องมีโครงครบเหมือนหน้าจริง: <main> + <h1>

          ตรวจเจอตอนขยายด่าน a11y ให้ครอบทั้งเว็บ: หน้านี้มี <h1> ศูนย์อันใน HTML ที่ build
          เพราะเนื้อหาจริงอยู่หลัง Suspense ส่วนที่ prerender คือ fallback นี้เท่านั้น
          ⚠️ ห้ามลบ h1 — ด่าน `test-a11y-critical` ตรวจทั้ง 309 หน้าแล้ว
        */}
          <div className="page-band-tint v3-cs-win text-center space-y-3 z-10">
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
