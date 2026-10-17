"use client";

/**
 * 💳 แท็บ "รายการชำระเงิน" — ทุกการจ่ายเงินทุกสินค้าในที่เดียว (แบบหน้า Orders ของร้านค้าออนไลน์)
 * ตัวกรองแถวเดียวบนสุด · ค้นด้วยเลขคำสั่งซื้อ/รหัสผู้ใช้/รหัส Stripe · หน้าละ 50 · เปิดรายการใน Stripe ได้ทันที
 * ค่าเริ่มต้นเห็นเฉพาะเงินจริง — รายการทดสอบต้องเลือกดูเอง
 */

import { useState } from "react";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { PRODUCT_NAME, type Product } from "@/lib/admin/executive-report";
import type { AdminPaymentRow } from "@/lib/admin/payments-admin";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";
import { AdminSubTabs, useSubTab } from "@/components/admin/AdminLayout";

const STATUS: Record<string, { label: string; cls: string }> = {
  paid: { label: "จ่ายแล้ว", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  pending: { label: "รอจ่าย", cls: "border-line bg-canvas text-ink" },
  failed: { label: "ไม่สำเร็จ", cls: "border-rose-200 bg-rose-50 text-rose-800" },
  refunded: { label: "คืนเงินแล้ว", cls: "border-amber-200 bg-amber-50 text-amber-900" },
};

const when = (ms: number) =>
  new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE }).format(ms);

const baht = (n: number) => `${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท`;

type Resp = { rows: AdminPaymentRow[]; hasMore: boolean };
const STATUS_TABS = ["all", "paid", "pending", "failed", "refunded"] as const;
const select = (b: Record<string, unknown>) => ({ rows: (b.rows as AdminPaymentRow[]) ?? [], hasMore: b.hasMore === true });

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-9 rounded-lg border border-line-interactive bg-white px-2 text-xs text-ink"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function PaymentsPanel() {
  const [statusTab, setStatusTab] = useSubTab(STATUS_TABS);
  const status = statusTab === "all" ? "" : statusTab;
  const [product, setProduct] = useState("");
  const [mode, setMode] = useState("real");
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [before, setBefore] = useState<number[]>([]); // กองเคอร์เซอร์ไว้ย้อนกลับหน้าก่อน

  const cursor = before[before.length - 1];
  const params = new URLSearchParams({ mode, ...(status && { status }), ...(product && { product }), ...(q && { q }), ...(cursor && { before: String(cursor) }) });
  const { data, loading, error, reload } = useAdminResource<Resp>(`/api/admin/payments?${params}`, { select });

  const resetPaging = () => setBefore([]);
  const rows = data?.rows ?? [];
  const sum = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amountThb, 0);

  return (
    <div className="space-y-4">
      <AdminSubTabs
        label="สถานะการจ่ายเงิน"
        active={statusTab}
        onChange={(id) => {
          resetPaging();
          setStatusTab(id);
        }}
        tabs={[
          { id: "all", label: "ทั้งหมด" },
          { id: "paid", label: "จ่ายแล้ว", hint: "นับเป็นรายได้" },
          { id: "pending", label: "รอจ่าย", hint: "เปิดหน้าจ่ายแต่ยังไม่จ่าย" },
          { id: "failed", label: "ไม่สำเร็จ" },
          { id: "refunded", label: "คืนเงินแล้ว" },
        ]}
      />
      <form
        className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-3"
        onSubmit={(e) => {
          e.preventDefault();
          resetPaging();
          setQ(query.trim());
        }}
      >
        <Select label="สินค้า" value={product} onChange={(v) => { resetPaging(); setProduct(v); }} options={[["", "ทุกสินค้า"], ...(Object.entries(PRODUCT_NAME) as [Product, string][])]} />
        <Select label="ประเภทเงิน" value={mode} onChange={(v) => { resetPaging(); setMode(v); }} options={[["real", "เงินจริงเท่านั้น"], ["test", "รายการทดสอบ"], ["all", "ทั้งหมด"]]} />
        <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-[11px] text-muted">
          ค้นหา (เลขคำสั่งซื้อ · รหัสผู้ใช้ · รหัส Stripe)
          <span className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="เช่น ord_1a2b… หรือ cs_live_…"
              className="min-h-9 w-full rounded-lg border border-line-interactive bg-white px-3 text-xs text-ink"
            />
            <button type="submit" className="tap-overlay-y min-h-9 shrink-0 rounded-lg border border-line bg-white px-3 text-xs text-ink hover:bg-canvas">
              ค้นหา
            </button>
          </span>
        </label>
      </form>

      {error ? <AdminErrorBanner error={error} onRetry={() => void reload()} /> : null}

      <section className={`altar-card-porcelain p-0 transition-opacity ${loading && data ? "opacity-60" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 text-xs text-muted">
          <span>
            {loading && !data ? "กำลังโหลด…" : `${rows.length.toLocaleString("th-TH")} รายการในหน้านี้`}
            {rows.length > 0 ? ` · จ่ายแล้วรวม ${baht(sum)}` : ""}
          </span>
          <span>เรียงจากใหม่ไปเก่า · เวลาไทย</span>
        </div>
        {rows.length === 0 && !loading ? (
          <p className="px-4 py-10 text-center text-xs text-muted">ไม่พบรายการตามตัวกรองนี้</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-xs">
              <thead className="bg-canvas text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left font-semibold">เวลา</th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">สินค้า</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">ยอด</th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">สถานะ</th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">อ้างอิง</th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold">Stripe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink">{when(r.createdAt)}</td>
                    <td className="px-3 py-2.5 text-ink">
                      {PRODUCT_NAME[r.product]}
                      {r.test ? <span className="ml-1.5 rounded border border-amber-300 px-1 text-[10px] text-amber-900">ทดสอบ</span> : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-ink">{baht(r.amountThb)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block rounded border px-1.5 py-px text-[11px] font-semibold ${STATUS[r.status]?.cls ?? "border-line text-ink"}`}>
                        {STATUS[r.status]?.label ?? r.status}
                      </span>
                      {r.refundDue ? <span className="mt-1 block text-[11px] font-semibold text-rose-700">ต้องคืนเงิน</span> : null}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted">
                      <span className="block break-all text-ink">{r.ref ?? r.id}</span>
                      {r.userId ? (
                        <button type="button" onClick={() => { resetPaging(); setQuery(r.userId!); setQ(r.userId!); }} className="mt-0.5 text-left underline-offset-2 hover:underline" title="ดูรายการทั้งหมดของผู้ใช้นี้">
                          ผู้ใช้ {r.userId.slice(0, 14)}…
                        </button>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      {r.stripeUrl ? (
                        <a href={r.stripeUrl} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">
                          เปิดใน Stripe
                        </a>
                      ) : (
                        <span className="text-muted">{r.provider === "simulator" ? "ตัวจำลอง" : "—"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            disabled={before.length === 0 || loading}
            onClick={() => setBefore((b) => b.slice(0, -1))}
            className="tap-overlay-y rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-ink hover:bg-canvas disabled:opacity-50"
          >
            หน้าก่อน
          </button>
          <span className="text-[11px] text-muted">หน้า {before.length + 1}</span>
          <button
            type="button"
            disabled={!data?.hasMore || loading}
            onClick={() => rows.length && setBefore((b) => [...b, rows[rows.length - 1].createdAt])}
            className="tap-overlay-y rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-ink hover:bg-canvas disabled:opacity-50"
          >
            หน้าถัดไป
          </button>
        </div>
      </section>
      <p className="text-[11px] text-muted">
        คืนเงินหรือดูรายละเอียดบัตร ทำในแดชบอร์ด Stripe ผ่านปุ่ม "เปิดใน Stripe" · หลังคืนเงินใน Stripe ให้กดตรวจที่แท็บ "การจองและการเงิน" ถ้าสิทธิ์ยังไม่ถูกหัก
      </p>
    </div>
  );
}
