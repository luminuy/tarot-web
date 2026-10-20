"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { AdminSection, AdminSubTabs, EmptyState, KpiGrid, useSubTab } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatsWidgets";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { formatSlotRange } from "@/lib/marketplace/booking-policy";
import { bangkokParts } from "@/lib/time/bangkok";

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
  /** บันทึกว่าโอนแล้วในงวดนี้ */
  paidOutSatang: number;
  /** ยังต้องโอน = net − ที่โอนแล้ว */
  outstandingSatang: number;
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

/** งวด YYYY-MM ย้อนหลัง `count` เดือน (นับเดือนนี้ตามเวลาไทยเป็นเดือนแรก) — ตัวเลือกงวดของแท็บยอดโอน */
function recentPeriods(count = 6): string[] {
  const now = bangkokParts(Date.now());
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(now.year, now.month - i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** "2026-10" ➔ "ตุลาคม 2569" */
function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("th-TH", { month: "long", year: "numeric", timeZone: "UTC" });
}

const BOOKING_TABS = ["todo", "bookings", "payouts", "reviews"] as const;

/**
 * ✦ แท็บ "การจอง & การเงิน" — สิ่งที่แอดมินต้องตามทุกวัน
 * 1. เงินที่ต้องคืนแต่ยังคืนไม่สำเร็จ (ขึ้นบนสุด สีแดง) + ปุ่มลองคืนอีกครั้ง
 * 2. รายการจองล่าสุด · 3. ยอดรายได้/ส่วนแบ่งต่อแม่หมอ (ใช้โอนเงินให้แม่หมอ) · 4. รีวิวล่าสุด + ซ่อนรีวิวไม่เหมาะสม
 * ไม่มีคำถามของลูกค้าในแท็บนี้ (PDPA: เท่าที่จำเป็น)
 */
export default function BookingsAdmin() {
  // งวดของยอดโอน (null = เดือนนี้ตามเวลาไทย ที่เซิร์ฟเวอร์ตัดสินให้)
  const [period, setPeriod] = useState<string | null>(null);
  // โหลดผ่าน useAdminResource ตามกติกาแผงแอดมิน (R-28): ล้มเหลว = ล้างข้อมูลเก่า + แสดงแถบข้อผิดพลาด
  const { data, error, reload } = useAdminResource<{
    bookings: AdminBooking[];
    refundDueCount: number;
    period: string;
    earnings: Earning[];
    reviews: Review[];
  }>(period ? `/api/admin/bookings?period=${period}` : "/api/admin/bookings");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const load = reload;
  const [tab, setTab] = useSubTab(BOOKING_TABS);

  const act = async (key: string, body: Record<string, unknown>, okMsg: string | ((json: Record<string, unknown>) => string)) => {
    setBusy(key);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      setNotice(res.ok ? (typeof okMsg === "function" ? okMsg(json) : okMsg) : json.error || "ดำเนินการไม่สำเร็จ");
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  };

  if (error) return <AdminErrorBanner error={error} onRetry={() => void reload()} />;
  if (!data) return <p className="py-16 text-center text-xs text-muted">กำลังโหลดการจอง…</p>;

  const due = data.bookings.filter((b) => b.refundDue);

  // ยอดค้างโอนของงวดที่เลือก — นัดที่จบแล้ว หักส่วนแบ่งเว็บ ไม่รวมเงินที่ต้องคืนลูกค้า และหักที่บันทึกว่าโอนแล้ว
  const toPay = data.earnings.reduce((n, e) => n + e.outstandingSatang, 0);
  const shownPeriod = data.period ?? period ?? recentPeriods(1)[0];
  const visibleReviews = data.reviews.filter((r) => !r.hidden);
  const avgRating = visibleReviews.length ? visibleReviews.reduce((n, r) => n + r.rating, 0) / visibleReviews.length : null;

  return (
    <div className="space-y-6 font-sans">
      <KpiGrid>
        <StatCard label="เงินต้องคืนค้าง" value={String(due.length)} sub={due.length ? "ต้องจัดการวันนี้" : "ไม่มีค้าง"} />
        <StatCard label="การจองล่าสุด" value={String(data.bookings.length)} sub="รายการในแท็บการจอง" />
        <StatCard
          label="ยอดค้างโอนให้แม่หมอ"
          value={`${baht(toPay)} บาท`}
          sub={`งวด${periodLabel(shownPeriod)} · เฉพาะนัดที่จบแล้ว หักส่วนแบ่งเว็บและที่โอนแล้ว`}
        />
        <StatCard
          label="คะแนนรีวิวเฉลี่ย"
          value={avgRating == null ? "—" : `${avgRating.toFixed(1)}/5`}
          sub={`จาก ${visibleReviews.length} รีวิวที่แสดงอยู่`}
        />
      </KpiGrid>

      <AdminSubTabs
        label="หมวดการจองและการเงิน"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "todo", label: "ต้องทำ", hint: "เงินที่ต้องคืน", count: due.length, tone: "alert" },
          { id: "bookings", label: "การจอง", hint: "รายการล่าสุด", count: data.bookings.length },
          { id: "payouts", label: "ยอดโอนให้แม่หมอ", hint: "แยกรายคน" },
          { id: "reviews", label: "รีวิว", hint: "ซ่อนรีวิวไม่เหมาะสม", count: data.reviews.length },
        ]}
      />

      {notice && <p className="rounded-xl border border-gold-ink/30 bg-gold-ink/10 px-4 py-2.5 text-xs text-ink">{notice}</p>}

      {tab === "todo" ? (
        <div className="space-y-6">
          <AdminSection
            title={`เงินที่ต้องคืนแต่ยังคืนไม่สำเร็จ (${due.length})`}
            hint="ระบบลองคืนอัตโนมัติไม่สำเร็จ — กดลองอีกครั้ง หรือคืนเองในแดชบอร์ด Stripe"
            tone={due.length ? "alert" : "default"}
          >
            {due.length === 0 ? (
              <EmptyState title="ไม่มีรายการค้าง" hint="ระบบคืนเงินครบทุกรายการแล้ว" />
            ) : (
              <ul className="divide-y divide-line rounded-lg border border-line">
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
          </AdminSection>

          <AdminSection
            title="คืนเงินในแดชบอร์ด Stripe เอง?"
            hint="กดตรวจเพื่อให้เว็บหักรอบดูดวงที่ซื้อ / ยกเลิกนัดของรายการที่คืนเงินแล้วให้ตรงกัน (ปกติ webhook charge.refunded ทำให้เองอัตโนมัติ)"
            actions={
              <Button
                size="sm"
                variant="gold"
                disabled={busy === "sync"}
                onClick={() =>
                  void act("sync", { action: "sync_refunds" }, (j) =>
                    `ตรวจ ${j.checked ?? 0} รายการ · ปรับตามการคืนเงินแล้ว ${j.applied ?? 0} รายการ` +
                    (Number(j.partial ?? 0) > 0 ? ` · คืนบางส่วน ${j.partial} รายการ (ต้องปรับเอง)` : "") +
                    (Number(j.unreachable ?? 0) > 0 ? ` · ถาม Stripe ไม่ได้ ${j.unreachable} รายการ` : "")
                  )
                }
              >
                {busy === "sync" ? "กำลังตรวจกับ Stripe…" : "ตรวจรายการคืนเงินจาก Stripe"}
              </Button>
            }
          />
        </div>
      ) : null}

      {tab === "payouts" ? (
        <AdminSection
          title={`รายได้และส่วนแบ่งต่อแม่หมอ · งวด${periodLabel(shownPeriod)}`}
          hint="นับเฉพาะนัดที่คุยจบแล้ว ลูกค้าไม่มา หรือยกเลิกช้าแบบไม่คืนเงิน · ไม่รวมเงินที่ค้างคืนลูกค้า · โอนแล้วกดบันทึก ยอดค้างจะหักออกทันที"
          actions={
            <label className="flex items-center gap-2 text-xs text-muted">
              งวด
              <select
                value={shownPeriod}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-lg border border-line-interactive bg-surface px-2 py-1.5 text-xs text-ink"
              >
                {recentPeriods().map((p) => (
                  <option key={p} value={p}>
                    {periodLabel(p)}
                  </option>
                ))}
              </select>
            </label>
          }
          padded={false}
        >
          {data.earnings.length === 0 ? (
            <div className="p-5">
              <EmptyState title="ยังไม่มีรายได้จากการปรึกษาแม่หมอในงวดนี้" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-canvas text-left text-muted">
                  <tr>
                    <th className="p-2.5 pl-5">แม่หมอ</th>
                    <th className="p-2.5 text-right">ครั้ง</th>
                    <th className="p-2.5 text-right">ยอดรวม (บาท)</th>
                    <th className="p-2.5 text-right">ส่วนแบ่งเว็บ</th>
                    <th className="p-2.5 text-right">ส่วนของแม่หมอ</th>
                    <th className="p-2.5 text-right">โอนแล้ว</th>
                    <th className="p-2.5 text-right">ค้างโอน</th>
                    <th className="p-2.5 pr-5 text-right">
                      <span className="sr-only">บันทึกการโอน</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.earnings.map((e) => {
                    const key = `payout_${e.readerId}`;
                    return (
                      <tr key={e.readerId}>
                        <td className="p-2.5 pl-5 font-semibold text-ink">{e.displayName}</td>
                        <td className="p-2.5 text-right">{e.totalBookings}</td>
                        <td className="p-2.5 text-right">{baht(e.grossSatang)}</td>
                        <td className="p-2.5 text-right">{baht(e.commissionSatang)}</td>
                        <td className="p-2.5 text-right">{baht(e.netSatang)}</td>
                        <td className="p-2.5 text-right">{baht(e.paidOutSatang)}</td>
                        <td className="p-2.5 text-right font-bold text-ink">{baht(e.outstandingSatang)}</td>
                        <td className="p-2.5 pr-5 text-right">
                          {e.outstandingSatang > 0 && (
                            <Button
                              size="sm"
                              variant="gold"
                              disabled={busy === key}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    `บันทึกว่าโอนให้ ${e.displayName} แล้ว ${baht(e.outstandingSatang)} บาท (งวด${periodLabel(shownPeriod)})?`
                                  )
                                )
                                  return;
                                void act(
                                  key,
                                  { action: "record_payout", readerId: e.readerId, period: shownPeriod },
                                  `บันทึกการโอนให้ ${e.displayName} แล้ว`
                                );
                              }}
                            >
                              บันทึกว่าโอนแล้ว
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AdminSection>
      ) : null}

      {tab === "bookings" ? (
        <AdminSection title="การจองล่าสุด" hint="นัดล่วงหน้าแสดงช่วงเวลา · คิวสดแสดงว่า คิวสด" padded={false}>
          {data.bookings.length === 0 ? (
            <div className="p-5">
              <EmptyState title="ยังไม่มีการจอง" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-canvas text-left text-muted">
                  <tr>
                    <th className="p-2.5 pl-5">เวลา</th>
                    <th className="p-2.5">แม่หมอ</th>
                    <th className="p-2.5">ลูกค้า</th>
                    <th className="p-2.5">สถานะ</th>
                    <th className="p-2.5 pr-5 text-right">เงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.bookings.map((b) => (
                    <tr key={b.bookingId}>
                      <td className="p-2.5 pl-5">{b.slotStart ? formatSlotRange(b.slotStart) : "คิวสด"}</td>
                      <td className="p-2.5">{b.readerName}</td>
                      <td className="p-2.5">คุณ{b.nickname || "-"}</td>
                      <td className="p-2.5">
                        {STATUS_TH[b.status] ?? b.status}
                        {b.refundDue ? <span className="ml-1 font-semibold text-rose-700">ต้องคืนเงิน</span> : null}
                      </td>
                      <td className="p-2.5 pr-5 text-right">
                        {b.amountThb ? `${b.amountThb} บาท` : "-"}
                        {b.refundStatus === "refunded" ? " · คืนแล้ว" : b.paymentStatus === "paid" ? " · จ่ายแล้ว" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminSection>
      ) : null}

      {tab === "reviews" ? (
        <AdminSection title="รีวิวล่าสุด" hint="รีวิวที่ซ่อนจะไม่ขึ้นหน้าโปรไฟล์แม่หมอ และไม่นับในคะแนน">
          {data.reviews.length === 0 ? (
            <EmptyState title="ยังไม่มีรีวิว" />
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {data.reviews.map((r) => (
                <li key={r.id} className={`flex flex-wrap items-start justify-between gap-3 p-3 text-xs ${r.hidden ? "opacity-60" : ""}`}>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block">
                      <span className="text-gold-ink">{r.rating}/5</span> <strong>{r.readerName}</strong> · คุณ
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
        </AdminSection>
      ) : null}
    </div>
  );
}
