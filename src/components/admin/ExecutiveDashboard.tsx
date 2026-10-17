"use client";

/**
 * 📈 แดชบอร์ดผู้บริหาร — หน้าเดียวที่ CMO / COO เปิดแล้วรู้เรื่องใน 30 วินาที
 * ---------------------------------------------------------------------------
 * โครงแบบรายงาน Power BI: ตัวกรองช่วงเวลาแถวเดียวบนสุด (มีผลกับทุกกราฟ) ➔ หน้ารายงาน 3 หน้า
 * (ภาพรวม · การตลาด · การดำเนินงาน) ➔ การ์ดตัวเลขเทียบช่วงก่อนหน้า ➔ "สิ่งที่ต้องดู" ➔ กราฟ
 *
 * ข้อมูลมาจาก `GET /api/admin/executive` ที่เดียว — ตัวเลขทุกจุดในหน้านี้จึงตรงกันเสมอ
 * โหลดใหม่ระหว่างเปลี่ยนช่วง: คงภาพเดิมไว้แบบจาง ไม่กระพริบ (แนวทาง dataviz)
 */

import { useState } from "react";

import { AdminSubTabs, useSubTab } from "@/components/admin/AdminLayout";
import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { ChartCard, DailyBars, FunnelChart, Sparkline, TrendChart } from "@/components/admin/ExecCharts";
import { BarList, Delta, KeyValueList, StatCard, fmt, fmtPct, thaiDay } from "@/components/admin/StatsWidgets";
import { RefreshIcon } from "@/components/ui/LineIcons";
import { SPREADS } from "@/data/spreads";
import { EXECUTIVE_RANGES, type ExecutiveRange, type ExecutiveReport, type Insight, type Pair } from "@/lib/admin/executive-report";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import type { StripeAdminSummary } from "@/lib/marketplace/payment-gateway";
import { CATEGORY_NAME } from "@/lib/stats/admin-metrics";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";

type Report = ExecutiveReport & { stripe: StripeAdminSummary };
type View = "summary" | "marketing" | "operations";

const SPREAD_NAME = Object.fromEntries(SPREADS.map((s) => [s.id, s.nameTh]));
const selectReport = (b: Record<string, unknown>) => b.report as Report;

const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: "summary", label: "ภาพรวม", hint: "ตัวเลขหลักและสิ่งที่ต้องดู" },
  { id: "marketing", label: "การตลาด (CMO)", hint: "คนเข้า · อ่านจบ · ซื้อ · กลับมาใช้" },
  { id: "operations", label: "การดำเนินงาน (COO)", hint: "เงิน · Stripe · AI · ความเสถียร" },
];
const VIEW_IDS = VIEWS.map((v) => v.id);

const baht = (n: number | null | undefined) =>
  n == null ? "—" : `${n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท`;

function thaiTime(ms: number) {
  return new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE }).format(ms);
}

/** การ์ดตัวเลขหนึ่งใบ: ค่า · เทียบช่วงก่อน · เส้นแนวโน้มเล็ก */
function Kpi({
  label,
  value,
  pair,
  goodWhen = "up",
  spark,
  note,
}: {
  label: string;
  value: string;
  pair?: Pair | null;
  goodWhen?: "up" | "down" | "none";
  spark?: number[];
  note?: string;
}) {
  return (
    <StatCard
      label={label}
      value={value}
      sub={
        pair && pair.prev != null ? (
          <Delta cur={pair.cur} prev={pair.prev} goodWhen={goodWhen} prevLabel="ช่วงก่อน" />
        ) : (
          note ?? "ไม่มีตัวเลขช่วงก่อนให้เทียบ"
        )
      }
    >
      {spark ? <Sparkline values={spark} /> : null}
    </StatCard>
  );
}

/** การ์ดอัตรา (%) — เทียบเป็น "จุด" ไม่ใช่ % ของ % */
function RateKpi({ label, pair, note }: { label: string; pair: Pair<number | null>; note: string }) {
  const diff = pair.cur != null && pair.prev != null ? pair.cur - pair.prev : null;
  return (
    <StatCard
      label={label}
      value={fmtPct(pair.cur)}
      sub={
        <>
          {diff == null ? (
            <span className="text-muted">ไม่มีตัวเลขช่วงก่อนให้เทียบ</span>
          ) : diff === 0 ? (
            <span className="text-muted">เท่ากับช่วงก่อน</span>
          ) : (
            <span>
              <span className={`font-semibold ${diff > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {diff > 0 ? "เพิ่ม" : "ลด"} {Math.abs(diff)} จุด
              </span>
              <span className="text-muted"> จากช่วงก่อน ({fmtPct(pair.prev)})</span>
            </span>
          )}
          <span className="mt-0.5 block text-[11px] text-muted">{note}</span>
        </>
      }
    />
  );
}

const LEVEL_STYLE: Record<Insight["level"], { label: string; cls: string }> = {
  alert: { label: "ด่วน", cls: "border-rose-200 bg-rose-50 text-rose-800" },
  watch: { label: "ต้องดู", cls: "border-amber-200 bg-amber-50 text-amber-900" },
  good: { label: "ดีขึ้น", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  info: { label: "ปกติ", cls: "border-line bg-canvas text-ink" },
};

function Insights({ items, owner }: { items: Insight[]; owner?: Insight["owner"] }) {
  const shown = owner ? items.filter((i) => i.owner === owner) : items;
  return (
    <section className="altar-card-porcelain p-5">
      <h3 className="text-sm font-bold text-ink">สิ่งที่ต้องดู</h3>
      <p className="mt-0.5 text-xs text-muted">คำนวณจากตัวเลขในช่วงนี้อัตโนมัติ · เรียงจากเรื่องด่วนก่อน</p>
      {shown.length === 0 ? (
        <p className="mt-3 text-xs text-muted">ไม่มีเรื่องที่ต้องดูในหมวดนี้</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {shown.map((it) => (
            <li key={it.title} className={`rounded-lg border px-3 py-2 text-xs ${LEVEL_STYLE[it.level].cls}`}>
              <p className="font-semibold">
                <span className="mr-2 rounded border border-current px-1.5 py-px text-[11px]">{LEVEL_STYLE[it.level].label}</span>
                {it.title}
                <span className="ml-2 text-[11px] font-normal opacity-80">{it.owner.toUpperCase()}</span>
              </p>
              <p className="mt-0.5 opacity-90">{it.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function downloadCsv(r: Report) {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ["วัน (UTC)", "เริ่มเปิดไพ่", "อ่านจบ", "ชนโควตาฟรี", "สมาชิกใหม่", "รายได้ (บาท)", "เรียก AI", "เปิดไพ่ไม่สำเร็จ"];
  const lines = r.series.map((p) => [p.day, p.started, p.completed, p.quotaHits, p.signups, p.revenueThb, p.aiCalls, p.failed]);
  // BOM นำหน้า ไม่งั้น Excel เปิดภาษาไทยเป็นตัวต่างดาว
  const csv = "﻿" + [head.map(q).join(","), ...lines.map((l) => l.map(q).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `seertarot-executive-${r.days}d-${r.range.to}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function SummaryView({ r }: { r: Report }) {
  const days = r.series.map((p) => p.day);
  const k = r.kpi;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="รายได้สุทธิ (เงินจริง)" value={baht(k.netRevenueThb.cur)} pair={k.netRevenueThb} spark={r.series.map((p) => p.revenueThb)} note={r.revenue.available ? undefined : "อ่านตารางการจ่ายเงินไม่ได้"} />
        <Kpi label="ครั้งที่เริ่มเปิดไพ่" value={fmt(k.started.cur)} pair={k.started} spark={r.series.map((p) => p.started)} />
        <Kpi label="ครั้งที่อ่านคำทำนายจบ" value={fmt(k.completed.cur)} pair={k.completed} spark={r.series.map((p) => p.completed)} />
        <Kpi label="สมาชิกใหม่" value={k.signups ? fmt(k.signups.cur) : "—"} pair={k.signups} spark={r.series.map((p) => p.signups)} note="อ่านตารางสมาชิกไม่ได้" />
      </div>
      <Insights items={r.insights} />
      <ChartCard
        title="การเปิดไพ่รายวัน"
        hint="นับเป็นจำนวนครั้ง · ชี้หรือกดลูกศรซ้ายขวาเพื่อดูแต่ละวัน"
        table={{
          headers: ["วัน", "เริ่ม", "อ่านจบ", "ชนโควตาฟรี"],
          rows: r.series.map((p) => [thaiDay(p.day).short, p.started, p.completed, p.quotaHits]),
        }}
      >
        <TrendChart
          days={days}
          series={[
            { key: "started", label: "เริ่มเปิดไพ่", color: "var(--viz-1)", values: r.series.map((p) => p.started) },
            { key: "completed", label: "อ่านจบ", color: "var(--viz-2)", values: r.series.map((p) => p.completed) },
            { key: "quota", label: "ชนโควตาฟรี", color: "var(--viz-3)", values: r.series.map((p) => p.quotaHits) },
          ]}
        />
      </ChartCard>
      <ChartCard
        title="รายได้รายวัน (บาท)"
        hint="เฉพาะเงินจริงที่จ่ายสำเร็จ · ไม่นับรายการทดสอบ"
        table={{ headers: ["วัน", "รายได้ (บาท)"], rows: r.series.map((p) => [thaiDay(p.day).short, p.revenueThb]) }}
      >
        <DailyBars days={days} values={r.series.map((p) => p.revenueThb)} label="รายได้" format={(n) => baht(n)} />
      </ChartCard>
    </div>
  );
}

function MarketingView({ r }: { r: Report }) {
  const k = r.kpi;
  const days = r.series.map((p) => p.day);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <RateKpi label="อัตราอ่านจบ" pair={k.completionPct} note="อ่านจบ ÷ เริ่มเปิดไพ่" />
        <RateKpi label="ซื้อแพ็กต่อการชนโควตา" pair={k.quotaToPurchasePct} note="แพ็กที่ขายได้ ÷ ครั้งที่ชนโควตาฟรี (นับครั้ง ไม่ใช่คน)" />
        <Kpi
          label="สมาชิกที่กลับมาใช้ในช่วงนี้"
          value={r.members ? fmt(r.members.returning) : "—"}
          note={r.members ? `สมัครก่อนช่วงนี้ แล้วกลับมาเข้าเว็บ · เข้ามาทั้งหมด ${fmt(r.members.active)} คน จากสมาชิก ${fmt(r.members.total)} คน` : "อ่านตารางสมาชิกไม่ได้"}
        />
        <Kpi label="เปิดไพ่ประจำวัน" value={fmt(k.dailyCheckin.cur)} pair={k.dailyCheckin} spark={undefined} />
        <Kpi label="แชทถามแม่หมอต่อ" value={fmt(k.chat.cur)} pair={k.chat} />
        <Kpi
          label="คะแนนความพอใจ (เต็ม 5)"
          value={k.feedbackAvg?.cur != null ? `${k.feedbackAvg.cur}/5` : "—"}
          note={k.feedbackCount ? `จาก ${fmt(k.feedbackCount.cur)} ความเห็น · ช่วงก่อน ${k.feedbackAvg?.prev != null ? `${k.feedbackAvg.prev}/5` : "—"}` : "อ่านตารางความเห็นไม่ได้"}
        />
      </div>
      <Insights items={r.insights} owner="cmo" />
      <ChartCard title="จากเปิดไพ่ถึงซื้อแพ็ก" hint="นับเป็นครั้งในช่วงนี้ · ผู้ใช้บางคนอาจชนโควตาโดยไม่ได้อ่านจบในช่วงเดียวกัน ตัวเลขจึงเป็นทิศทาง">
        <FunnelChart
          steps={[
            { label: "เริ่มเปิดไพ่", value: k.started.cur },
            { label: "อ่านคำทำนายจบ", value: k.completed.cur },
            { label: "ชนโควตาฟรี", value: k.quotaHits.cur, hint: "อยากใช้ต่อ = โอกาสขาย" },
            { label: "ซื้อแพ็กเติมรอบ", value: k.packOrders.cur },
          ]}
        />
      </ChartCard>
      <ChartCard
        title="สมาชิกใหม่รายวัน"
        table={{ headers: ["วัน", "สมาชิกใหม่"], rows: r.series.map((p) => [thaiDay(p.day).short, p.signups]) }}
      >
        <DailyBars days={days} values={r.series.map((p) => p.signups)} label="สมาชิกใหม่" />
      </ChartCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="หัวข้อที่คนถามมากที่สุด" rows={r.top.categories} nameMap={CATEGORY_NAME} limit={6} />
        <BarList title="ผังไพ่ที่ถูกเลือกมากที่สุด" rows={r.top.spreads} nameMap={SPREAD_NAME} limit={8} />
      </div>
      <p className="text-xs text-muted">
        คนมาจากช่องทางไหน (Google · โซเชียล · เข้าตรง) อยู่ในรายงาน Google Search Console และ GA4 รายสัปดาห์บน GitHub Actions
        (workflow "SEO รายสัปดาห์" และ "GA4 รายสัปดาห์")
      </p>
    </div>
  );
}

function StripeCard({ s }: { s: StripeAdminSummary }) {
  if (!s.configured) {
    return (
      <section className="altar-card-porcelain p-5">
        <h3 className="text-sm font-bold text-ink">Stripe</h3>
        <p className="mt-2 text-xs text-muted">ยังไม่ได้ตั้งคีย์ Stripe — ระบบจ่ายเงินใช้ตัวจำลอง ไม่มีเงินจริง</p>
      </section>
    );
  }
  const p = s.period;
  return (
    <section className="altar-card-porcelain p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">Stripe</h3>
        <span
          className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${
            s.mode === "live" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {s.mode === "live" ? "ใช้งานจริง" : "โหมดทดสอบ — ยังไม่ใช่เงินจริง"}
        </span>
      </div>
      {s.error ? <p className="mt-2 text-xs text-rose-700">{s.error}</p> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs text-muted">พร้อมโอนเข้าบัญชีธนาคาร</p>
          <p className="font-mono text-lg font-bold tabular-nums text-ink">{baht(s.balance?.availableThb)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">รอ Stripe เคลียร์</p>
          <p className="font-mono text-lg font-bold tabular-nums text-ink">{baht(s.balance?.pendingThb)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">ยอดรับในช่วงนี้ (ก่อนหักค่าธรรมเนียม)</p>
          <p className="font-mono text-lg font-bold tabular-nums text-ink">{baht(p?.grossThb)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">ยอดสุทธิหลังหักค่าธรรมเนียมและเงินคืน</p>
          <p className="font-mono text-lg font-bold tabular-nums text-ink">{baht(p?.netThb)}</p>
        </div>
      </div>
      {p ? (
        <div className="mt-4">
          <KeyValueList
            items={[
              { label: "จำนวนรายการรับเงิน", value: p.charges },
              { label: "ค่าธรรมเนียม Stripe (บาท)", value: p.feeThb },
              { label: "คืนเงินลูกค้า (บาท)", value: p.refundThb, hint: `${fmt(p.refunds)} รายการ` },
            ]}
          />
          <div className="mt-2 border-t border-line pt-2">
            <KeyValueList items={[{ label: "ข้อพิพาท / ลูกค้าปฏิเสธการจ่าย", value: p.disputes }]} alertWhenPositive />
          </div>
          {p.truncated ? <p className="mt-2 text-[11px] text-amber-900">มีรายการเกิน 1,000 รายการ ตัวเลขช่วงนี้ยังไม่ครบ</p> : null}
        </div>
      ) : null}
      {s.payouts && s.payouts.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted">โอนเข้าบัญชีธนาคารล่าสุด</p>
          <ul className="mt-1 divide-y divide-line text-xs">
            {s.payouts.map((po) => (
              <li key={`${po.arrivalDate}-${po.amountThb}`} className="flex justify-between gap-3 py-1.5">
                <span className="text-ink">
                  {thaiDay(po.arrivalDate).label}
                  <span className="ml-2 text-muted">{PAYOUT_STATUS[po.status] ?? po.status}</span>
                </span>
                <span className="font-mono tabular-nums text-ink">{baht(po.amountThb)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-3 text-[11px] text-muted">ตัวเลขจาก Stripe โดยตรง · ยอดในระบบของเว็บ (ด้านล่าง) ควรใกล้เคียงกัน ถ้าต่างกันมากให้ตรวจ webhook</p>
    </section>
  );
}

const PAYOUT_STATUS: Record<string, string> = {
  paid: "โอนแล้ว",
  pending: "รอโอน",
  in_transit: "กำลังโอน",
  canceled: "ยกเลิก",
  failed: "โอนไม่สำเร็จ",
};

function OperationsView({ r }: { r: Report }) {
  const o = r.ops;
  const k = r.kpi;
  const days = r.series.map((p) => p.day);
  return (
    <div className="space-y-6">
      <Insights items={r.insights} owner="coo" />
      <StripeCard s={r.stripe} />
      <ChartCard
        title="รายได้แยกตามสินค้า (ระบบของเว็บ)"
        hint={`เงินจริงที่จ่ายสำเร็จ${r.revenue.testExcluded > 0 ? ` · ตัดรายการทดสอบออก ${fmt(r.revenue.testExcluded)} รายการ` : ""}`}
        table={{
          headers: ["สินค้า", "รายได้ (บาท)", "ช่วงก่อน (บาท)", "จำนวนรายการ"],
          rows: r.revenue.byProduct.map((p) => [p.label, p.thb.cur, p.thb.prev ?? "—", p.orders.cur]),
        }}
      >
        {!r.revenue.available ? (
          <p className="text-xs text-muted">อ่านตารางการจ่ายเงินไม่ได้</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {r.revenue.byProduct.map((p) => (
              <Kpi key={p.product} label={p.label} value={baht(p.thb.cur)} pair={p.thb} note={`${fmt(p.orders.cur)} รายการ`} />
            ))}
          </div>
        )}
        <div className="mt-4">
          <KeyValueList
            items={[
              { label: "ลูกค้าที่จ่ายเงิน (คน)", value: k.payers?.cur ?? null },
              { label: "คืนเงินแล้วในช่วงนี้ (บาท)", value: r.revenue.refundedThb.cur },
              { label: "รายการรอจ่าย (ยังไม่สำเร็จ)", value: r.revenue.pending },
            ]}
          />
          <div className="mt-2 border-t border-line pt-2">
            <KeyValueList
              items={[{ label: "เงินที่ต้องคืนลูกค้าแต่ยังไม่ได้คืน (รายการ)", value: r.revenue.refundDue?.count ?? null, hint: r.revenue.refundDue ? baht(r.revenue.refundDue.thb) : undefined }]}
              alertWhenPositive
            />
          </div>
        </div>
      </ChartCard>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi label="เรียก AI" value={fmt(o.aiCalls.cur)} pair={o.aiCalls} goodWhen="none" spark={r.series.map((p) => p.aiCalls)} />
        <Kpi label="เวลาเฉลี่ยต่อคำอ่าน (มิลลิวินาที)" value={fmt(o.avgLatencyMs.cur)} pair={o.avgLatencyMs.prev == null || o.avgLatencyMs.cur == null ? null : { cur: o.avgLatencyMs.cur, prev: o.avgLatencyMs.prev }} goodWhen="down" />
        <RateKpi label="สลับไป AI ตัวสำรอง" pair={o.failoverPct} note="ยิ่งต่ำยิ่งดี · สูง = ตัวหลักล่มบ่อย" />
        <Kpi label="โทเคน AI ที่ใช้" value={fmt(o.tokens.cur)} pair={o.tokens} goodWhen="none" note="ต้นทุน AI แปรตามตัวเลขนี้" />
        <Kpi label="AI ตอบผิดพลาด" value={fmt(o.aiErrors.cur)} pair={o.aiErrors} goodWhen="down" />
        <Kpi label="ชนเพดานงบ AI ของวัน" value={fmt(o.aiCapHit.cur)} pair={o.aiCapHit} goodWhen="down" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="altar-card-porcelain p-5">
          <h3 className="text-sm font-bold text-ink">ความเสถียร</h3>
          <p className="mb-3 mt-0.5 text-xs text-muted">ควรเป็น 0 ทั้งหมด · มีตัวเลข = ส่งให้ทีมเทคนิค (cto) ตรวจ</p>
          <KeyValueList
            alertWhenPositive
            items={[
              { label: "เปิดไพ่ไม่สำเร็จ", value: o.readingFailed.cur },
              { label: "เปิดหน้าจ่ายเงินไม่สำเร็จ", value: o.checkoutFailed.cur },
              { label: "จ่ายแล้วแต่ให้สิทธิ์ไม่สำเร็จ", value: o.purchaseGrantFailed.cur },
              { label: "ใช้คำตอบสำรองแทน AI", value: o.mockServed.cur },
            ]}
          />
          <div className="mt-3">
            <KeyValueList items={[{ label: "คำถามที่ถูกกรองเพื่อความปลอดภัย", value: o.safetyBlocked.cur, hint: "ระบบกันเรื่องวิกฤต สุขภาพ กฎหมาย การพนัน — ทำงานตามปกติ" }]} />
          </div>
        </section>
        <ChartCard
          title="การเรียก AI รายวัน"
          table={{ headers: ["วัน", "เรียก AI", "เปิดไพ่ไม่สำเร็จ"], rows: r.series.map((p) => [thaiDay(p.day).short, p.aiCalls, p.failed]) }}
        >
          <DailyBars days={days} values={r.series.map((p) => p.aiCalls)} label="เรียก AI" />
        </ChartCard>
      </div>
    </div>
  );
}

export default function ExecutiveDashboard() {
  const [days, setDays] = useState<ExecutiveRange>(28);
  const [view, setView] = useSubTab<View>(VIEW_IDS);
  const { data, loading, error, reload } = useAdminResource<Report>(`/api/admin/executive?days=${days}`, { select: selectReport });

  return (
    <div className="space-y-6">
      {/* ตัวกรองแถวเดียวบนสุด — มีผลกับทุกตัวเลขในหน้านี้ */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="ช่วงเวลา" className="flex items-center gap-1 rounded-lg border border-line bg-canvas p-1 text-xs">
            {EXECUTIVE_RANGES.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={days === d}
                onClick={() => setDays(d)}
                className={`tap-overlay-y rounded-md px-3 py-1 font-medium ${days === d ? "border border-line bg-white font-semibold text-ink" : "text-muted hover:text-ink"}`}
              >
                {d} วัน
              </button>
            ))}
          </div>
          {data ? (
            <p className="text-xs text-muted">
              {thaiDay(data.range.from).label} ถึง {thaiDay(data.range.to).label} · เทียบ {thaiDay(data.prevRange.from).short} ถึง{" "}
              {thaiDay(data.prevRange.to).short}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {data ? <span className="text-[11px] text-muted">อัปเดต {thaiTime(data.generatedAt)} น.</span> : null}
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            className="tap-overlay-y inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs text-ink hover:bg-canvas disabled:opacity-60"
          >
            <RefreshIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            โหลดใหม่
          </button>
          <button
            type="button"
            onClick={() => data && downloadCsv(data)}
            disabled={!data}
            className="tap-overlay-y inline-flex min-h-9 items-center rounded-lg border border-line bg-white px-3 text-xs text-ink hover:bg-canvas disabled:opacity-60"
          >
            ส่งออก CSV
          </button>
        </div>
      </div>

      {/* หน้ารายงาน */}
      <AdminSubTabs label="หน้ารายงาน" tabs={VIEWS} active={view} onChange={setView} />

      {error ? <AdminErrorBanner error={error} onRetry={() => void reload()} /> : null}

      {!data && loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 h-7 w-7 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-xs text-muted">กำลังรวมตัวเลข…</p>
        </div>
      ) : null}

      {data ? (
        <div className={`transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
          {view === "summary" && <SummaryView r={data} />}
          {view === "marketing" && <MarketingView r={data} />}
          {view === "operations" && <OperationsView r={data} />}
          <p className="mt-6 text-[11px] text-muted">
            วันของระบบสถิติตัดรอบ 07:00 น. เวลาไทย (วัน UTC) · ตัวเลขการใช้งานนับเป็นจำนวนครั้ง ไม่ใช่จำนวนคน · ไม่มีข้อมูลส่วนบุคคลในหน้านี้
          </p>
        </div>
      ) : null}
    </div>
  );
}
