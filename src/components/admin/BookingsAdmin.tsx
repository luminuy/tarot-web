"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { formatSlotRange } from "@/lib/marketplace/booking-policy";

interface AdminBooking {
  bookingId: string;
  ticketId: string;
  readerName: string;
  nickname: string | null;
  kind: "scheduled" | "walkup";
  slotStart: number | null;
  status: string;
  ticketStatus: string;
  amountThb: number | null;
  paymentStatus: string | null;
  refundStatus: string | null;
  refundDue: boolean;
  paymentId: string | null;
  createdAt: number;
}

interface Earning {
  readerId: string;
  displayName: string;
  totalBookings: number;
  grossSatang: number;
  commissionSatang: number;
  netSatang: number;
}

interface Review {
  id: string;
  readerName: string;
  rating: number;
  comment: string | null;
  nickname: string | null;
  hidden: boolean;
  createdAt: number;
}

const STATUS_TH: Record<string, string> = {
  reserved: "กันที่รอจ่าย",
  confirmed: "ยืนยันแล้ว",
  done: "คุยจบแล้ว",
  cancelled: "ยกเลิก",
  no_show: "ลูกค้าไม่มา",
  expired: "หมดเวลา",
  paid: "จ่ายแล้ว (ยุคเก่า)",
};

const baht = (satang: number) => (satang / 100).toLocaleString("th-TH");

/**
 * ✦ แท็บ "การจอง & การเงิน" — สิ่งที่แอดมินต้องตามทุกวัน
 * 1. เงินที่ต้องคืนแต่ยังคืนไม่สำเร็จ (ขึ้นบนสุด สีแดง) + ปุ่มลองคืนอีกครั้ง
 * 2. รายการจองล่าสุด · 3. ยอดรายได้/ส่วนแบ่งต่อแม่หมอ (ใช้โอนเงินให้แม่หมอ) · 4. รีวิวล่าสุด + ซ่อนรีวิวไม่เหมาะสม
 * ไม่มีคำถามของลูกค้าในแท็บนี้ (PDPA: เท่าที่จำเป็น)
 */
export default function BookingsAdmin() {
  // โหลดผ่าน useAdminResource ตามกติกาแผงแอดมิน (R-28): ล้มเหลว = ล้างข้อมูลเก่า + แสดงแถบข้อผิดพลาด
  const { data, error, reload } = useAdminResource<{
    bookings: AdminBooking[];
    refundDueCount: number;
    earnings: Earning[];
    reviews: Review[];
  }>("/api/admin/bookings");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const load = reload;

  const act = async (key: string, body: Record<string, unknown>, okMsg: string) => {
    setBusy(key);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      setNotice(res.ok ? okMsg : json.error || "ดำเนินการไม่สำเร็จ");
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  };

  if (error) return <AdminErrorBanner error={error} onRetry={() => void reload()} />;
  if (!data) return <p className="py-16 text-center text-xs text-muted">กำลังโหลดการจอง…</p>;

  const due = data.bookings.filter((b) => b.refundDue);

  return (
    <div className="space-y-8 font-sans">
      {notice && <p className="rounded-xl border border-gold-ink/30 bg-gold-ink/10 px-4 py-2.5 text-xs text-ink">{notice}</p>}

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-ink">เงินที่ต้องคืนแต่ยังคืนไม่สำเร็จ ({due.length})</h3>
        {due.length === 0 ? (
          <p className="rounded-xl border border-ok/30 bg-ok/10 p-3 text-xs text-ink">ไม่มีรายการค้าง — ระบบคืนเงินครบทุกรายการ</p>
        ) : (
          <ul className="divide-y divide-err/20 rounded-xl border border-err/30 bg-err-wash">
            {due.map((b) => (
              <li key={b.bookingId} className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs text-ink">
                <span>
                  <strong>{b.readerName}</strong> · คุณ{b.nickname || "-"} · {b.amountThb} บาท ·{" "}
                  {b.slotStart ? formatSlotRange(b.slotStart) : "คิวสด"}
                </span>
                <Button
                  size="sm"
                  variant="gold"
                  disabled={busy === b.paymentId || !b.paymentId}
                  onClick={() => void act(b.paymentId as string, { action: "retry_refund", paymentId: b.paymentId }, "คืนเงินสำเร็จแล้ว")}
                >
                  ลองคืนเงินอีกครั้ง
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-ink">รายได้และส่วนแบ่งต่อแม่หมอ (ยอดที่จ่ายแล้ว หักคืนเงิน)</h3>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-xs">
            <thead className="bg-inset text-left text-muted">
              <tr>
                <th className="p-2.5">แม่หมอ</th>
                <th className="p-2.5 text-right">ครั้ง</th>
                <th className="p-2.5 text-right">ยอดรวม (บาท)</th>
                <th className="p-2.5 text-right">ส่วนแบ่งเว็บ</th>
                <th className="p-2.5 text-right">ต้องโอนให้แม่หมอ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.earnings.map((e) => (
                <tr key={e.readerId}>
                  <td className="p-2.5 font-semibold text-ink">{e.displayName}</td>
                  <td className="p-2.5 text-right">{e.totalBookings}</td>
                  <td className="p-2.5 text-right">{baht(e.grossSatang)}</td>
                  <td className="p-2.5 text-right">{baht(e.commissionSatang)}</td>
                  <td className="p-2.5 text-right font-bold text-ink">{baht(e.netSatang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-ink">การจองล่าสุด</h3>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-xs">
            <thead className="bg-inset text-left text-muted">
              <tr>
                <th className="p-2.5">เวลา</th>
                <th className="p-2.5">แม่หมอ</th>
                <th className="p-2.5">ลูกค้า</th>
                <th className="p-2.5">สถานะ</th>
                <th className="p-2.5 text-right">เงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.bookings.map((b) => (
                <tr key={b.bookingId}>
                  <td className="p-2.5">{b.slotStart ? formatSlotRange(b.slotStart) : "คิวสด"}</td>
                  <td className="p-2.5">{b.readerName}</td>
                  <td className="p-2.5">คุณ{b.nickname || "-"}</td>
                  <td className="p-2.5">{STATUS_TH[b.status] ?? b.status}</td>
                  <td className="p-2.5 text-right">
                    {b.amountThb ? `${b.amountThb} บาท` : "-"}
                    {b.refundStatus === "refunded" ? " · คืนแล้ว" : b.paymentStatus === "paid" ? " · จ่ายแล้ว" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-ink">รีวิวล่าสุด</h3>
        {data.reviews.length === 0 ? (
          <p className="text-xs text-muted">ยังไม่มีรีวิว</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {data.reviews.map((r) => (
              <li key={r.id} className={`flex flex-wrap items-start justify-between gap-3 p-3 text-xs ${r.hidden ? "opacity-60" : ""}`}>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="block">
                    <span className="text-gold-ink">{"★".repeat(r.rating)}</span> <strong>{r.readerName}</strong> · คุณ
                    {r.nickname || "-"} {r.hidden && <span className="text-err">(ซ่อนอยู่)</span>}
                  </span>
                  {r.comment && <span className="block whitespace-pre-line text-ink">{r.comment}</span>}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === r.id}
                  onClick={() =>
                    void act(r.id, { action: "hide_review", reviewId: r.id, hidden: !r.hidden }, r.hidden ? "แสดงรีวิวแล้ว" : "ซ่อนรีวิวแล้ว")
                  }
                >
                  {r.hidden ? "แสดง" : "ซ่อน"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
