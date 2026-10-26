"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSlotRange, formatCountdown } from "@/lib/marketplace/booking-policy";
import { ConsultHero, ConsultWindow } from "@/components/marketplace/ConsultUi2";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { ChevronIcon } from "@/components/ui/LineIcons";

interface MyBookingItem {
  ticketId: string;
  readerId: string;
  readerName: string;
  readerAvatarUrl: string | null;
  kind: "scheduled" | "walkup";
  slotStart: number | null;
  createdAt: number;
  ticketStatus: string;
  bookingStatus: string;
  refundStatus: string | null;
}

/** สถานะที่ผู้ใช้อ่านเข้าใจ — แปลจากสถานะตั๋ว + ใบจอง */
function statusOf(item: MyBookingItem): { label: string; tone: "ok" | "gold" | "muted" | "err" } {
  if (item.ticketStatus === "pending_payment") return { label: "รอชำระเงิน", tone: "gold" };
  if (item.ticketStatus === "ready") return { label: "ถึงคิวแล้ว · เข้าห้องได้เลย", tone: "ok" };
  if (item.ticketStatus === "waiting") return { label: item.kind === "scheduled" ? "นัดยืนยันแล้ว" : "อยู่ในคิว", tone: "ok" };
  if (item.ticketStatus === "handed_off") return { label: "ปรึกษาเสร็จแล้ว", tone: "muted" };
  if (item.bookingStatus === "no_show") return { label: "ไม่ได้เข้าร่วมตามนัด", tone: "err" };
  if (item.refundStatus === "refunded") return { label: "ยกเลิกแล้ว · คืนเงินแล้ว", tone: "muted" };
  return { label: "ยกเลิกแล้ว", tone: "muted" };
}

const TONE: Record<string, string> = {
  ok: "border-ok/30 bg-ok/10 text-ok",
  gold: "border-gold-ink/30 bg-inset-warm text-gold-ink",
  muted: "border-line-warm bg-inset-warm/60 text-muted",
  err: "border-err/30 bg-err-wash text-err",
};

/**
 * ✦ นัดของฉัน — ทุกคิว/นัดของลูกค้าในหน้าเดียว (แบบ "My trips" ของเว็บจองระดับโลก)
 * ---------------------------------------------------------------------------
 * เห็นได้สองทาง: เบราว์เซอร์ที่ใช้จอง (คุกกี้) หรือบัญชีที่ล็อกอินตอนจอง (ทุกเครื่อง)
 * เปลี่ยนเครื่องแต่ไม่ได้ล็อกอิน ➔ บอกให้กดลิงก์ในอีเมลยืนยัน (ลิงก์นั้นเปิดนัดได้ทุกเครื่อง)
 * ⚠️ ไม่มีคำถาม/สรุป AI ในหน้านี้ — กดเข้าไปดูที่หน้าคิวซึ่งตรวจความเป็นเจ้าของอีกชั้น
 */
export default function MyBookingsPage() {
  const [items, setItems] = useState<MyBookingItem[] | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/marketplace/my-bookings", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { items?: MyBookingItem[]; signedIn?: boolean; error?: string };
        if (!res.ok) {
          setError(data.error || "โหลดนัดของคุณไม่สำเร็จ");
          setItems([]);
          return;
        }
        setItems(data.items ?? []);
        setSignedIn(Boolean(data.signedIn));
        setNow(Date.now());
      } catch {
        setError("เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต");
        setItems([]);
      }
    })();
  }, []);

  const active = (items ?? []).filter((i) => ["pending_payment", "waiting", "ready", "screening"].includes(i.ticketStatus));
  const past = (items ?? []).filter((i) => !active.includes(i));

  return (
    <main id="main-content" tabIndex={-1} className="v3-cs is-narrow font-sans text-ink">
      {/* v3 UI 2.0 (เจ้าของ 2026-10-26): หัวหน้าแถบครีมเตี้ย ➔ รายการนัดในหน้าต่างครีม */}
      <ConsultHero
        compact
        kicker="ปรึกษาแม่หมอ"
        title={<span className="tp">นัดของฉัน</span>}
        lede={<ThaiPhrases>คิวและนัดปรึกษาแม่หมอทั้งหมดของคุณ</ThaiPhrases>}
      >
        <Link href="/readers" className="v3-cs-back">
          แม่หมอทั้งหมด
        </Link>
      </ConsultHero>
      <ConsultWindow narrow label="รายการนัด">
      <div className="w-full space-y-6">

        {items === null ? (
          <div className="space-y-3" aria-busy="true">
            <span className="sr-only">กำลังโหลดนัดของคุณ…</span>
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-inset-warm" />
            ))}
          </div>
        ) : error ? (
          <p role="alert" className="rounded-2xl border border-err/30 bg-err-wash p-4 text-sm text-err">
            {error}
          </p>
        ) : items.length === 0 ? (
          <div className="altar-card-porcelain !rounded-3xl space-y-3 p-6 text-center">
            <h2 className="text-lg font-bold text-ink-deep">ยังไม่มีนัดในเครื่องนี้</h2>
            <p className="text-sm leading-relaxed text-muted">
              {signedIn
                ? "บัญชีนี้ยังไม่มีคิวหรือนัด เลือกแม่หมอแล้วจองได้เลย"
                : "จองจากเครื่องอื่นไว้? กดปุ่ม \"ดูนัดของฉัน\" ในอีเมลยืนยันการจอง หรือเข้าสู่ระบบบัญชีที่ใช้ตอนจอง"}
            </p>
            <Link href="/readers" className="btn-gold-glass inline-flex items-center justify-center px-6 py-3 text-sm font-bold">
              เลือกแม่หมอ
            </Link>
          </div>
        ) : (
          <>
            {[
              { title: "กำลังจะถึง", list: active },
              { title: "ที่ผ่านมา", list: past },
            ].map(
              (group) =>
                group.list.length > 0 && (
                  <section key={group.title} aria-label={group.title} className="space-y-2.5">
                    <h2 className="px-1 text-sm font-bold text-ink-deep">{group.title}</h2>
                    <ul className="altar-card-porcelain !rounded-2xl divide-y divide-line-warm/60">
                      {group.list.map((item) => {
                        const status = statusOf(item);
                        return (
                          <li key={item.ticketId}>
                            {/* <a> ธรรมดา ไม่ใช่ <Link> — หน้าคิวต้องโหลดเอกสารใหม่ทั้งหน้า สิทธิ์กล้อง/ไมค์
                                (Permissions-Policy) ผูกกับเอกสารที่โหลด การเปลี่ยนหน้าฝั่ง client จะติดสิทธิ์ของหน้านี้ไป */}
                            <a
                              href={`/readers/queue/${item.ticketId}`}
                              className="flex items-center gap-3.5 p-4 transition-colors hover:bg-inset/50 sm:px-5"
                            >
                              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-canvas text-lg font-bold text-gold-ink">
                                {item.readerAvatarUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.readerAvatarUrl} alt="" /* ชื่อแม่หมออยู่ข้าง ๆ แล้ว (INC-0125) */ className="h-full w-full object-cover" />
                                ) : (
                                  item.readerName.charAt(0).toUpperCase()
                                )}
                              </span>
                              <span className="min-w-0 flex-1 space-y-1">
                                <span className="block break-words text-sm font-bold text-ink-deep">{item.readerName}</span>
                                <span className="block text-[13px] text-ink">
                                  {item.slotStart ? formatSlotRange(item.slotStart) : "คิวสด"}
                                  {item.slotStart && status.tone === "ok" && now > 0 && (
                                    <span className="text-muted"> · {formatCountdown(item.slotStart, now)}</span>
                                  )}
                                </span>
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[12px] font-semibold ${TONE[status.tone]}`}>
                                  {status.label}
                                </span>
                              </span>
                              <ChevronIcon direction="right" className="h-4 w-4 shrink-0 text-muted" />
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )
            )}
            {!signedIn && (
              <p className="text-center text-[13px] text-muted">
                เข้าสู่ระบบตอนจองครั้งหน้า เพื่อเห็นนัดทั้งหมดได้ทุกเครื่อง
              </p>
            )}
          </>
        )}
      </div>
      </ConsultWindow>
    </main>
  );
}
