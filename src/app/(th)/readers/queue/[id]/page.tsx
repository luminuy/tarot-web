"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { VideoCallRoom } from "@/components/marketplace/VideoCallRoom";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { useVisibleInterval } from "@/lib/utils/use-visible-interval";
import type { QueueTicket } from "@/lib/marketplace/queue.repo";
import { CONSULTATION_MINUTES, CONSULTATION_PRICE_THB, questionCategoryLabel } from "@/lib/marketplace/offer";
import {
  BookingConfirmedPanel,
  ConsultLinkPanel,
  InAppBrowserNotice,
  ManageBooking,
  PaymentPendingPanel,
  ReviewPanel,
  type BookingView,
} from "@/components/marketplace/QueueBookingParts";
import { formatSlotRange } from "@/lib/marketplace/booking-policy";
import { detectInAppBrowser, type InAppBrowser } from "@/lib/marketplace/in-app-browser";
import { CheckIcon } from "@/components/ui/LineIcons";
import { trackPurchase } from "@/lib/analytics";

interface PollResponse {
  ticket: QueueTicket;
  reader: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    specialties: string[];
    lineUrl: string | null;
    /** ค่าปรึกษาของแม่หมอคนนี้ (บาท) */
    priceThb?: number;
  };
  canAccessLine: boolean;
  /** แม่หมอเรียกคิวแล้ว + ระบบวิดีโอคอลพร้อม (ตั้งค่า TURN แล้ว) */
  videoCallAvailable?: boolean;
  /** ระบบวิดีโอคอลเปิดใช้อยู่ (ไม่ขึ้นกับสถานะคิว) — ไม่เปิด = คุยทาง LINE อย่างเดียว */
  videoCallEnabled?: boolean;
  /** การจอง/การจ่ายเงินของตั๋ว (เฉพาะเจ้าของตั๋ว) — null สำหรับตั๋วยุคก่อนระบบจ่ายก่อนคุย */
  booking?: BookingView | null;
  /** ลิงก์นัดส่วนตัว เปิดได้ทุกเบราว์เซอร์ (เฉพาะเจ้าของตั๋ว) — CONSULT_FLOW P6 */
  accessUrl?: string | null;
  /** มาจากลิงก์ห้องส่วนตัวที่แม่หมอส่งให้ (migrations/0032) — พูดว่า "รอแม่หมอรับเข้าห้อง" แทน "รอคิว" */
  privateRoom?: boolean;
}

/** ตั๋วยุคก่อนระบบจ่ายก่อนคุย (ไม่มีใบจอง) — ยังยกเลิกได้ตามเดิม ไม่มีเงินให้คืน */
const LEGACY_FREE_TICKET: BookingView = {
  id: "legacy",
  kind: "walkup",
  status: "confirmed",
  slotStart: null,
  slotEnd: null,
  holdExpiresAt: null,
  rescheduleCount: 0,
  cancelledBy: null,
  refundStatus: null,
  paid: false,
  amountSatang: null,
  cancel: { allowed: true, refund: false, reason: "unpaid" },
  canReschedule: false,
};

export default function CustomerQueuePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ticketId = params.id;

  const [data, setData] = useState<PollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  /** เปิดอยู่ในเบราว์เซอร์ของแอป (LINE · Facebook · IG · TikTok) — อ่านหลัง mount เท่านั้น (HTML ฝั่งเซิร์ฟเวอร์ต้องตรงกัน) */
  const [inApp, setInApp] = useState<InAppBrowser | null>(null);
  useEffect(() => {
    setInApp(detectInAppBrowser(navigator.userAgent));
  }, []);

  const fetchTicketStatus = useCallback(async () => {
    if (!ticketId) return;
    try {
      const res = await fetch(`/api/marketplace/tickets/${ticketId}`, { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as PollResponse;
        setData(json);
        setNow(Date.now());
        setError(null);
        if (json.ticket.status !== "pending_payment") setConfirming(false);
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

  /*
   * กลับจากหน้าจ่ายเงิน Stripe (`?paid=1`) ➔ ให้เซิร์ฟเวอร์ถาม Stripe เองว่าจ่ายจริงไหม
   * (ไม่เชื่อ query string) แล้วล้าง query ออกจาก URL — รีเฟรชหน้าจะได้ไม่ยิงซ้ำ
   */
  useEffect(() => {
    if (!ticketId || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") !== "1") return;
    setConfirming(true);
    window.history.replaceState(null, "", window.location.pathname);
    void (async () => {
      try {
        const res = await fetch("/api/marketplace/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId, testChargeId: params.get("test_charge_id") || undefined }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          status?: string;
          purchase?: { valueThb: number; countable: boolean };
        };
        if (json.status === "confirmed" && json.purchase?.countable) {
          trackPurchase({
            transactionId: ticketId,
            valueThb: json.purchase.valueThb,
            itemId: "consultation",
            itemName: "ปรึกษาแม่หมอ",
            category: "consultation",
          });
        }
        if (json.status === "refunded") {
          setNotice("เวลานี้ถูกจองไปก่อนที่การชำระเงินจะเสร็จ ระบบคืนเงินเต็มจำนวนให้แล้ว");
        }
        if (json.status !== "pending") setConfirming(false);
      } catch {
        setConfirming(false);
      }
      void fetchTicketStatus();
    })();
  }, [ticketId, fetchTicketStatus]);

  // ถึงคิวแล้วให้ชื่อแท็บเปลี่ยน — คนที่สลับไปแท็บอื่นระหว่างรอจะเห็นทันที
  const isReady = data?.ticket.status === "ready";
  const isPrivateRoom = data?.privateRoom === true;
  useEffect(() => {
    if (!isReady) return;
    const previous = document.title;
    document.title = isPrivateRoom ? "แม่หมอรับคุณเข้าห้องแล้ว · SeerTarot" : "ถึงคิวของคุณแล้ว · SeerTarot";
    return () => {
      document.title = previous;
    };
  }, [isReady, isPrivateRoom]);

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
    /*
     * เซิร์ฟเวอร์ตอบ "ไม่พบ" ทั้งตอนไม่มีตั๋วจริงและตอนเบราว์เซอร์นี้ไม่ใช่เจ้าของ (ไม่ยืนยันว่ามีตั๋ว — PDPA)
     * กรณีหลังคือคนจองในแอป LINE แล้วมาเปิดใน Safari/ปฏิทิน (CONSULT_FLOW P6) — เดิมเจอแค่ "ไม่พบตั๋วคิว"
     * แล้วติดทางตัน ➔ บอกทางกลับเข้านัดให้ครบโดยไม่บอกว่าตั๋วนี้มีอยู่จริงหรือไม่
     */
    return (
      <main id="main-content" tabIndex={-1} className="min-h-[70vh] text-ink flex items-center justify-center p-4 font-serif-th">
        <div className="altar-card-porcelain !rounded-3xl max-w-md w-full z-10 space-y-4 p-6 text-left sm:p-8">
          <h1 className="text-lg font-bold text-ink-deep">
            <ThaiPhrases>เปิดนัดนี้จากที่นี่ไม่ได้</ThaiPhrases>
          </h1>
          <p className="text-sm leading-relaxed text-ink">
            ลิงก์หน้าคิวเปิดได้เฉพาะคนที่จองไว้ ถ้าเป็นนัดของคุณ ลองทางใดทางหนึ่งนี้:
          </p>
          <ul className="space-y-2 text-[13px] leading-relaxed text-ink">
            {[
              'เปิด "ลิงก์นัดของคุณ" หรือปุ่ม "ดูนัดของฉัน" ในอีเมลยืนยันการจอง (เปิดได้ทุกเครื่อง)',
              "กลับไปเปิดในแอปหรือเบราว์เซอร์ที่ใช้ตอนจอง (เช่น ในแอป LINE)",
              'เข้าสู่ระบบด้วยบัญชีที่ใช้ตอนจอง แล้วดูที่ "นัดของฉัน"',
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold-ink" />
                {line}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="gold" className="flex-1" onClick={() => router.push("/readers/bookings")}>
              นัดของฉัน
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => router.push("/readers")}>
              แม่หมอทั้งหมด
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const { ticket, reader, canAccessLine, videoCallAvailable, videoCallEnabled, booking, accessUrl, privateRoom } = data;
  // ชวนออกจากเบราว์เซอร์ในแอปเฉพาะตอนที่จะคุยผ่านวิดีโอคอล — ถ้าคุยทาง LINE อยู่ในแอป LINE ดีกว่าอยู่แล้ว
  const suggestExternal = Boolean(inApp && accessUrl && videoCallEnabled);
  const priceThb = reader.priceThb ?? CONSULTATION_PRICE_THB;
  const paidThb = booking?.amountSatang ? booking.amountSatang / 100 : priceThb;
  const isBlocked = ticket.screening?.verdict === "block" || ticket.status === "cancelled" || ticket.status === "expired";
  const isCrisis = ticket.screening?.flags.includes("self_harm") || ticket.screening?.flags.includes("crisis");
  const isDone = ticket.status === "handed_off";
  const isScheduled = booking?.kind === "scheduled" && booking.slotStart !== null;
  const categoryLabel = questionCategoryLabel(ticket.screening?.category);
  const stepIndex =
    { pending_payment: 0, screening: 0, waiting: 1, ready: 2, handed_off: 3 }[ticket.status as string] ?? -1;
  const steps = ["ชำระเงิน", isScheduled ? "รอถึงเวลานัด" : privateRoom ? "รอเข้าห้อง" : "รอคิว", "คุยกับแม่หมอ", "เสร็จสิ้น"];
  const blockedTitle =
    ticket.screening?.verdict === "block"
      ? "คิวนี้ถูกยกเลิกแล้ว"
      : booking?.status === "no_show"
        ? "คุณไม่ได้เข้าร่วมตามนัด"
        : booking?.status === "expired" && !booking.paid
          ? "หมดเวลาชำระเงิน"
          : booking?.cancelledBy === "reader"
            ? "แม่หมอยกเลิกนัดนี้"
            : isScheduled
              ? "ยกเลิกนัดแล้ว"
              : "คิวนี้ถูกยกเลิกแล้ว";
  const blockedBody =
    ticket.screening?.verdict === "block" && ticket.screening.brief
      ? ticket.screening.brief
      : booking?.refundStatus === "refunded"
        ? "คืนเงินเต็มจำนวนแล้ว เงินจะกลับเข้าช่องทางที่ชำระภายใน 5–10 วันทำการ (ขึ้นกับธนาคาร)"
        : booking?.refundStatus === "failed"
          ? "ระบบคืนเงินขัดข้องชั่วคราว ทีมงานจะคืนเงินให้ภายใน 3 วันทำการ"
          : booking?.status === "no_show"
            ? "แม่หมอรอแล้วแต่ไม่พบคุณในเวลานัด ตามนโยบายจะไม่มีการคืนเงิน"
            : booking?.refundStatus === "none"
              ? `ยกเลิกน้อยกว่า 24 ชั่วโมงก่อนนัด จึงไม่มีการคืนเงิน`
              : booking?.status === "expired" && !booking.paid
                ? "ไม่มีการตัดเงิน ระบบปล่อยเวลานี้ให้คนอื่นแล้ว ถ้ายังอยากปรึกษา จองใหม่ได้เลย"
                : "ถ้ายังอยากปรึกษา เลือกแม่หมอแล้วจองใหม่ได้เลย";

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] text-ink px-4 py-6 sm:py-10 font-serif-th">
      <div className="max-w-xl w-full mx-auto space-y-5">
        <h1 className="sr-only">สถานะคิวปรึกษาแม่หมอ</h1>

        <div className="flex items-center justify-between">
          <Link
            href="/readers"
            className="tap-overlay-y inline-flex items-center gap-1.5 text-sm text-gold-ink hover:text-gold-ink-deep transition-colors"
          > แม่หมอทั้งหมด
          </Link>
          <Link
            href="/readers/bookings"
            className="tap-overlay-y inline-flex items-center gap-1.5 text-sm font-semibold text-gold-ink hover:text-gold-ink-deep transition-colors"
          >
            นัดของฉัน
          </Link>
        </div>

        <section className="rounded-[28px] border border-line bg-surface overflow-hidden shadow-[0_20px_40px_-28px_rgba(46,33,26,0.45)]">
          {/* แถบกำมะหยี่ — ภาษาภาพเดียวกับการ์ดแม่หมอในหน้ารวม */}
          <div className="consult-stage h-20 !rounded-none !border-0 !shadow-none" aria-hidden="true" />
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
              <p className="text-[13px] text-muted">{privateRoom ? "ห้องคุยส่วนตัวกับ" : "คิวปรึกษากับ"}</p>
              <h2 className="font-bold text-ink text-lg leading-snug break-words">{reader.displayName}</h2>
              {reader.specialties.length > 0 && (
                <p className="text-[13px] text-muted truncate">{reader.specialties.slice(0, 4).join(" · ")}</p>
              )}
            </div>
          </div>

          {/* ความคืบหน้า 4 ขั้น — ผู้ใช้รู้ทันทีว่าอยู่ตรงไหน และต่อไปจะเกิดอะไร */}
          {!isBlocked && stepIndex >= 0 && (
            <ol className="flex items-start px-4 sm:px-6 pt-5" aria-label="ความคืบหน้าคิว">
              {steps.map((label, i) => {
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
                      {done ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
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

            {notice && !isBlocked && (
              <p role="status" className="rounded-xl border border-gold-ink/30 bg-inset-warm p-3 text-[13px] text-ink">
                {notice}
              </p>
            )}

            {ticket.status === "pending_payment" && booking && (
              <PaymentPendingPanel ticketId={ticket.id} booking={booking} nowMs={now} confirming={confirming} priceThb={priceThb} />
            )}

            {ticket.status === "waiting" && isScheduled && booking && (
              <BookingConfirmedPanel
                booking={booking}
                readerName={reader.displayName}
                ticketId={ticket.id}
                nowMs={now}
                accessUrl={accessUrl}
              />
            )}

            {ticket.status === "waiting" && !isScheduled && (
              <div className="text-center py-4 space-y-4">
                <div className="relative mx-auto h-36 w-36">
                  <span aria-hidden="true" className="absolute -inset-3 rounded-full bg-gold-ink/10 animate-pulse" />
                  <div className="consult-stage relative h-full w-full rounded-full flex flex-col items-center justify-center">
                    <span className="text-[13px] text-gold-on-dark">คิวที่</span>
                    <span className="text-5xl font-bold text-surface leading-none mt-1">{ticket.position || 1}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-lg text-ink">{privateRoom ? "จ่ายแล้ว รอแม่หมอรับเข้าห้อง" : "คุณอยู่ในคิวแล้ว"}</h3>
                  <p className="text-sm text-muted leading-relaxed max-w-sm mx-auto">
                    <ThaiPhrases>
                      {privateRoom
                        ? `${reader.displayName} เห็นคุณในรายการแล้ว เปิดหน้านี้ทิ้งไว้ได้เลย แม่หมอกดรับเมื่อไร ปุ่มเข้าห้องวิดีโอคอลจะขึ้นที่นี่ทันที`
                        : "เปิดหน้านี้ทิ้งไว้ได้เลย เมื่อแม่หมอเรียกคิว ปุ่มเข้าห้องวิดีโอคอลจะขึ้นที่นี่ทันที"}
                    </ThaiPhrases>
                  </p>
                </div>
                <p className="inline-flex items-center gap-2 text-[13px] text-ok font-semibold" role="status">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ok animate-pulse" />
                  อัปเดตสถานะอัตโนมัติ
                </p>
              </div>
            )}

            {/* เปิดอยู่ในแอป LINE/Facebook/IG/TikTok ➔ พาไป Safari/Chrome พร้อมนัด ก่อนถึงเวลาคุย (P6 · P7)
                วางใต้ข้อความยืนยัน — สิ่งแรกที่ลูกค้าเห็นหลังจ่ายต้องเป็น "ยืนยันแล้ว" ไม่ใช่คำเตือน */}
            {suggestExternal && inApp && accessUrl && ticket.status === "waiting" && (
              <InAppBrowserNotice app={inApp} accessUrl={accessUrl} />
            )}

            {ticket.status === "ready" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl bg-ok/10 border border-ok/30 p-4" role="status">
                  <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-ok text-white grid place-items-center font-bold">
                    <CheckIcon />
                  </span>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-lg text-ink">{privateRoom ? "แม่หมอรับคุณเข้าห้องแล้ว" : "ถึงคิวของคุณแล้ว"}</h3>
                    <p className="text-sm text-ink leading-relaxed">
                      <ThaiPhrases>
                        {videoCallAvailable
                          ? `${reader.displayName} พร้อมแล้ว กดเข้าห้องวิดีโอคอล เพื่อเริ่มคุย`
                          : `${reader.displayName} พร้อมแล้ว กดปุ่มด้านล่าง เพื่อเริ่มคุยทาง LINE`}
                      </ThaiPhrases>
                    </p>
                  </div>
                </div>

                {suggestExternal && videoCallAvailable && inApp && accessUrl && (
                  <InAppBrowserNotice app={inApp} accessUrl={accessUrl} />
                )}

                {/* 📹 วิดีโอคอลตัวต่อตัว — ผ่าน TURN เสมอ (ซ่อน IP ทั้งสองฝั่ง) · ทางหลักเมื่อพร้อม */}
                {videoCallAvailable && (
                  <VideoCallRoom
                    ticketId={ticket.id}
                    role="customer"
                    peerName={reader.displayName}
                    peerAvatarUrl={reader.avatarUrl}
                    embedded
                    mediaHelp={
                      inApp && accessUrl ? (
                        <p className="text-[13px] leading-relaxed text-ink">
                          กำลังเปิดในแอป — กดปุ่ม &quot;เปิดใน Safari / Chrome&quot; ด้านบน แล้วเข้าห้องจากที่นั่น
                        </p>
                      ) : accessUrl ? (
                        <p className="text-[13px] leading-relaxed text-ink">
                          ลองเปิด &quot;ลิงก์นัดของคุณ&quot; ด้านล่างใน Safari หรือ Chrome แล้วกดเข้าห้องอีกครั้ง
                        </p>
                      ) : null
                    }
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
                      /* เขียวโทเคน ok (ตัวขาว 5.9:1) — เดิมเขียว LINE สด #06c755 กับตัวขาวได้แค่ 2.26:1 อ่านยากบนปุ่มหลัก */
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-ok hover:opacity-90 text-white font-bold text-sm transition"
                    >
                      เริ่มคุยกับแม่หมอทาง LINE
                    </a>
                  )
                )}
              </div>
            )}

            {isDone && (
              <div className="text-center py-4 space-y-4">
                <div className="h-14 w-14 mx-auto rounded-full bg-ok text-white grid place-items-center text-2xl font-bold" aria-hidden="true">
                  <CheckIcon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-ink">ปรึกษาเสร็จเรียบร้อย</h3>
                  <p className="text-sm text-muted"><ThaiPhrases>ขอบคุณที่ใช้บริการ ขอให้เรื่องที่ถามคลี่คลายไปในทางที่ดี</ThaiPhrases></p>
                </div>
                {booking && (booking.canReview || booking.reviewRating) && (
                  <ReviewPanel ticketId={ticket.id} readerName={reader.displayName} existingRating={booking.reviewRating ?? null} />
                )}
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
                <h3 className="font-bold text-lg text-err">{blockedTitle}</h3>
                <p className="text-sm text-ink leading-relaxed">{blockedBody}</p>

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

                <Link
                  href={ticket.screening?.verdict === "block" ? "/readers" : `/readers/${reader.id}`}
                  className="btn-gold-glass inline-flex items-center justify-center px-5 py-3 text-sm font-bold"
                >
                  {ticket.screening?.verdict === "block" ? "เลือกแม่หมอ" : "จองใหม่"}
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
                {ticket.question || <span className="text-muted">ไม่ได้เขียนไว้ — เล่าให้แม่หมอฟังในห้องได้เลย</span>}
              </dd>
            </div>
            {categoryLabel && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted shrink-0">หมวด</dt>
                <dd className="text-ink text-right">{categoryLabel}</dd>
              </div>
            )}
            {isScheduled && booking?.slotStart && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted shrink-0">เวลานัด</dt>
                <dd className="text-ink font-semibold text-right">{formatSlotRange(booking.slotStart, true)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 pt-2.5 border-t border-line">
              <dt className="text-muted shrink-0">ค่าบริการ</dt>
              <dd className="text-ink font-bold text-right">{paidThb} บาท · {CONSULTATION_MINUTES} นาที</dd>
            </div>
            {booking && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted shrink-0">การชำระเงิน</dt>
                <dd className="text-right font-semibold">
                  {booking.refundStatus === "refunded" ? (
                    <span className="text-ink">คืนเงินแล้ว {paidThb} บาท</span>
                  ) : booking.paid ? (
                    <span className="text-ok">ชำระแล้ว {paidThb} บาท</span>
                  ) : (
                    <span className="text-muted">ยังไม่ชำระ</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* ลิงก์นัดส่วนตัว — เปิดได้ทุกเบราว์เซอร์ทุกเครื่อง (เดิมเปิดได้แค่เบราว์เซอร์ที่ใช้จอง · P6) */}
        {accessUrl && booking?.paid && (ticket.status === "waiting" || ticket.status === "ready") && (
          <ConsultLinkPanel accessUrl={accessUrl} />
        )}

        {/* จัดการนัด/คิว — เลื่อน · ยกเลิก (นโยบายคืนเงินคำนวณฝั่งเซิร์ฟเวอร์)
            เรียกคิวแล้วโผล่เฉพาะตอนเซิร์ฟเวอร์ยอมให้ยกเลิก (รอในห้องครบเวลาแล้วแม่หมอไม่เคยเข้า) */}
        {!confirming &&
          (ticket.status === "waiting" ||
            ticket.status === "pending_payment" ||
            (ticket.status === "ready" && booking?.cancel.allowed === true)) && (
          <ManageBooking
            key={`${booking?.slotStart}-${ticket.status}`}
            ticketId={ticket.id}
            readerId={reader.id}
            booking={booking ?? LEGACY_FREE_TICKET}
            onChanged={(message) => {
              setNotice(message);
              void fetchTicketStatus();
            }}
          />
        )}
      </div>
    </main>
  );
}
