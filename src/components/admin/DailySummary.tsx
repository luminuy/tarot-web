"use client";

import { useMemo } from "react";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import {
  BarList,
  Delta,
  KeyValueList,
  Meter,
  SectionTitle,
  StatCard,
  fmt,
  fmtPct,
  thaiDay,
} from "@/components/admin/StatsWidgets";
import { PERSONAS } from "@/data/personas";
import { SPREADS } from "@/data/spreads";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { CATEGORY_NAME, FLAG_NAME, summarize } from "@/lib/stats/admin-metrics";

const SPREAD_NAME = Object.fromEntries(SPREADS.map((s) => [s.id, s.nameTh]));
const PERSONA_NAME = Object.fromEntries(PERSONAS.map((p) => [p.id, p.nameTh]));

/** ย้อนดูได้ไกลสุดเท่าอายุก้อนตัวนับรายวัน — ตรงกับ `MAX_LOOKBACK_DAYS` ใน /api/admin/stats */
const MAX_LOOKBACK_DAYS = 400;

interface Activity {
  newUsers: number | null;
  feedback: number | null;
  avgRating: number | null;
}

interface DayPayload {
  day: string;
  prevDay: string;
  today: string;
  isToday: boolean;
  current: Record<string, number>;
  previous: Record<string, number>;
  activity: Activity;
  prevActivity: Activity;
  ai: { usedToday: number; dailyCap: number; guestCap: number; guestCapReached: boolean; memberCapReached: boolean } | null;
}

/** คีย์วันแบบเดียวกับตัวนับฝั่งเซิร์ฟเวอร์ (วัน UTC) */
export function statDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function shiftDay(day: string, by: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + by);
  return statDayKey(d);
}

export default function DailySummary({ day, onDayChange }: { day: string; onDayChange: (day: string) => void }) {
  const today = statDayKey();
  const minDay = shiftDay(today, -MAX_LOOKBACK_DAYS);
  const res = useAdminResource<DayPayload>(`/api/admin/stats?day=${day}`);
  const { loading, error, reload } = res;
  // ระหว่างโหลดวันใหม่ ห้ามโชว์ตัวเลขของวันเก่าใต้หัวข้อวันใหม่
  const data = res.data?.day === day ? res.data : null;

  const cur = useMemo(() => summarize(data?.current), [data]);
  const prev = useMemo(() => summarize(data?.previous), [data]);
  const { label, weekday } = thaiDay(day);
  const isToday = day === today;
  const prevLabel = isToday ? "เมื่อวาน" : "วันก่อน";

  const go = (next: string) => {
    if (next < minDay || next > today) return;
    onDayChange(next);
  };

  return (
    <div className="space-y-5">
      {/* ─── ตัวเลือกวัน ─────────────────────────────────────────────── */}
      <div className="altar-card-porcelain flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mystic-gold text-base font-bold text-ink">
              สรุปประจำ{weekday}ที่ {label}
            </h2>
            {isToday ? (
              <span className="btn-gold-glass px-2 py-0.5 text-[10px] font-bold">วันนี้ · ข้อมูลสด</span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted">รอบวันของระบบสถิติตัดตอน 07:00 น. เวลาไทย (ตามเวลา UTC)</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => go(shiftDay(day, -1))}
            disabled={day <= minDay}
            className="tap-overlay-y rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas disabled:opacity-40 cursor-pointer"
            aria-label="ดูวันก่อนหน้า"
          >
            ‹ วันก่อน
          </button>
          <label className="sr-only" htmlFor="stats-day-picker">
            เลือกวันที่ต้องการดูสรุป
          </label>
          <input
            id="stats-day-picker"
            type="date"
            value={day}
            min={minDay}
            max={today}
            onChange={(e) => e.target.value && go(e.target.value)}
            className="min-h-11 rounded-lg border border-line-interactive bg-white px-3 text-xs font-medium text-ink"
          />
          <button
            type="button"
            onClick={() => go(shiftDay(day, 1))}
            disabled={day >= today}
            className="tap-overlay-y rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas disabled:opacity-40 cursor-pointer"
            aria-label="ดูวันถัดไป"
          >
            วันถัดไป ›
          </button>
          <button
            type="button"
            onClick={() => go(today)}
            disabled={isToday}
            className={`tap-overlay-y rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              isToday ? "btn-gold-glass" : "border border-line bg-white text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            วันนี้
          </button>
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            className="tap-overlay-y rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas disabled:opacity-50 cursor-pointer"
            title="โหลดตัวเลขล่าสุด"
          >
            <span className={loading ? "inline-block animate-spin" : "inline-block"}>↻</span>
            <span className="ml-1 hidden sm:inline">โหลดล่าสุด</span>
          </button>
        </div>
      </div>

      {error ? <AdminErrorBanner error={error} onRetry={() => void reload()} /> : null}

      {!data ? (
        loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" aria-live="polite">
            <div className="mb-3 h-7 w-7 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="text-xs text-muted">กำลังสรุปตัวเลขของวันที่เลือก…</p>
          </div>
        ) : null
      ) : (
        <>
          {/* ─── ประโยคสรุป ─────────────────────────────────────────── */}
          <p className="rounded-2xl border border-line bg-canvas p-4 text-sm leading-relaxed text-ink">
            {cur.usage.started === 0 ? (
              <>
                {isToday
                  ? "วันนี้ยังไม่มีการเปิดไพ่ — ตัวเลขจะขึ้นทันทีที่มีผู้ใช้เริ่มดูดวง"
                  : "วันนั้นไม่มีการเปิดไพ่ที่ถูกบันทึกไว้"}
              </>
            ) : (
              <>
                เปิดไพ่ <strong>{fmt(cur.usage.started)} ครั้ง</strong> อ่านจบ{" "}
                <strong>{fmt(cur.usage.completed)} ครั้ง ({fmtPct(cur.usage.completionPct)})</strong> · แชทถามต่อ{" "}
                <strong>{fmt(cur.usage.chat)} ข้อความ</strong>
                {cur.top.categories[0] ? (
                  <>
                    {" "}
                    · เรื่องที่ถามมากสุด{" "}
                    <strong>{CATEGORY_NAME[cur.top.categories[0].key] ?? cur.top.categories[0].key}</strong>
                  </>
                ) : null}
                {cur.top.spreads[0] ? (
                  <>
                    {" "}
                    · ผังยอดนิยม <strong>{SPREAD_NAME[cur.top.spreads[0].key] ?? cur.top.spreads[0].key}</strong>
                  </>
                ) : null}
                {cur.safety.total > 0 ? (
                  <>
                    {" "}
                    · <strong className="text-rose-700">บล็อกความปลอดภัย {fmt(cur.safety.total)} ครั้ง</strong>
                  </>
                ) : null}
              </>
            )}
          </p>

          {/* ─── ตัวเลขหลักของวัน ───────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="เริ่มเปิดไพ่"
              value={fmt(cur.usage.started)}
              sub={<Delta cur={cur.usage.started} prev={prev.usage.started} prevLabel={prevLabel} />}
            />
            <StatCard
              label="อ่านจบสมบูรณ์"
              value={fmt(cur.usage.completed)}
              sub={
                <>
                  {fmtPct(cur.usage.completionPct)} ของที่เริ่ม ·{" "}
                  <Delta cur={cur.usage.completed} prev={prev.usage.completed} prevLabel={prevLabel} />
                </>
              }
            />
            <StatCard
              label="แชทถามต่อกับแม่หมอ"
              value={fmt(cur.usage.chat)}
              sub={<Delta cur={cur.usage.chat} prev={prev.usage.chat} prevLabel={prevLabel} />}
            />
            <StatCard
              label="สมาชิกใหม่"
              value={fmt(data.activity.newUsers)}
              sub={
                data.activity.newUsers == null ? (
                  "อ่านตารางสมาชิกไม่ได้"
                ) : (
                  <Delta cur={data.activity.newUsers} prev={data.prevActivity.newUsers ?? 0} prevLabel={prevLabel} />
                )
              }
            />
          </div>

          {/* ─── AI ของวัน ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {data.ai ? (
              <StatCard
                label="โควตา AI วันนี้"
                value={`${fmt(data.ai.usedToday)} / ${fmt(data.ai.dailyCap)}`}
                sub={
                  data.ai.memberCapReached
                    ? "เต็มเพดานแล้ว — ทุกคนได้คำตอบสำรอง"
                    : data.ai.guestCapReached
                      ? `ผู้เยี่ยมชมเต็มเพดาน (${fmt(data.ai.guestCap)}) · สมาชิกยังใช้ได้`
                      : `เหลือ ${fmt(data.ai.dailyCap - data.ai.usedToday)} ครั้ง · ผู้เยี่ยมชมตัดที่ ${fmt(data.ai.guestCap)}`
                }
              >
                <Meter value={data.ai.usedToday} max={data.ai.dailyCap} marker={data.ai.guestCap} />
              </StatCard>
            ) : (
              <StatCard
                label="เรียก AI ทั้งวัน"
                value={fmt(cur.ai.calls)}
                sub={<Delta cur={cur.ai.calls} prev={prev.ai.calls} prevLabel={prevLabel} goodWhen="none" />}
              />
            )}
            <StatCard
              label="เรียก AI (Groq / Gemini)"
              value={`${fmt(cur.ai.groq)} / ${fmt(cur.ai.gemini)}`}
              sub={`Groq ${fmtPct(cur.ai.groqPct)} · สลับไป Gemini ${fmt(cur.ai.failover)} ครั้ง`}
            />
            <StatCard
              label="เวลาเฉลี่ยต่อคำอ่าน"
              value={cur.ai.avgLatencyMs == null ? "—" : `${(cur.ai.avgLatencyMs / 1000).toFixed(1)} วิ`}
              sub={
                prev.ai.avgLatencyMs == null
                  ? "ไม่มีข้อมูลวันก่อนให้เทียบ"
                  : `${prevLabel} ${(prev.ai.avgLatencyMs / 1000).toFixed(1)} วิ`
              }
            />
            <StatCard
              label="Token ที่ใช้"
              value={fmt(cur.ai.tokensIn + cur.ai.tokensOut)}
              sub={`เข้า ${fmt(cur.ai.tokensIn)} · ออก ${fmt(cur.ai.tokensOut)}`}
            />
          </div>

          {/* ─── ความนิยมของวัน ─────────────────────────────────────── */}
          <div className="grid gap-3 lg:grid-cols-3">
            <BarList title="หมวดคำถาม" rows={cur.top.categories} nameMap={CATEGORY_NAME} empty="ไม่มีข้อมูลในวันที่เลือก" />
            <BarList title="ผังไพ่" rows={cur.top.spreads} nameMap={SPREAD_NAME} limit={6} empty="ไม่มีข้อมูลในวันที่เลือก" />
            <BarList title="แม่หมอ" rows={cur.top.personas} nameMap={PERSONA_NAME} limit={6} empty="ไม่มีข้อมูลในวันที่เลือก" />
          </div>

          {/* ─── ปัญหา · ความปลอดภัย · สิทธิ์ · การมีส่วนร่วม ───────────── */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="altar-card-porcelain space-y-3 p-5">
              <SectionTitle title="ปัญหาที่ผู้ใช้เจอ" />
              <KeyValueList
                alertWhenPositive
                items={[
                  { label: "คำอ่านล้มเหลว", value: cur.usage.failed },
                  { label: "AI ผิดพลาด", value: cur.ai.errors },
                  { label: "ได้คำตอบสำรอง (ไม่ใช่ AI)", value: cur.ai.mockServed + cur.ai.chatOffline },
                  { label: "โครงคำอ่านไม่ครบ (schema)", value: cur.ai.schemaFails },
                  { label: "บันทึกคำอ่านไม่สำเร็จ", value: cur.usage.persistFailed },
                  { label: "ชำระเงิน/มอบสิทธิ์ไม่สำเร็จ", value: cur.business.checkoutFailed + cur.business.purchaseGrantFailed },
                ]}
              />
            </div>

            <div className="altar-card-porcelain space-y-3 p-5">
              <SectionTitle title="ความปลอดภัย" />
              <KeyValueList
                items={[
                  { label: "บล็อกคำถามเปิดไพ่", value: cur.safety.readingBlocked },
                  { label: "บล็อกข้อความแชท", value: cur.safety.chatBlocked },
                ]}
              />
              {cur.safety.flags.length === 0 ? (
                <p className="text-xs text-emerald-700">ไม่พบสัญญาณเสี่ยง</p>
              ) : (
                <ul className="space-y-1 border-t border-line pt-2 text-xs">
                  {cur.safety.flags.map((f) => (
                    <li key={f.key} className="flex justify-between gap-2 text-rose-700">
                      <span>{FLAG_NAME[f.key] ?? f.key}</span>
                      <span className="font-mono font-semibold">{fmt(f.count)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="altar-card-porcelain space-y-3 p-5">
              <SectionTitle title="ถูกกั้นด้วยสิทธิ์/โควตา" hint={`รวม ${fmt(cur.gating.total)}`} />
              <KeyValueList
                items={[
                  { label: "เปิดไพ่เกินสิทธิ์", value: cur.gating.blockedStart + cur.gating.blockedRead },
                  { label: "ต้องล็อกอินก่อน", value: cur.gating.blockedSignin },
                  { label: "ผัง/แม่หมอพรีเมียม", value: cur.gating.blockedPremium },
                  { label: "แชทเกินสิทธิ์", value: cur.gating.blockedChat },
                  { label: "ผู้เยี่ยมชมเกินเพดาน IP", value: cur.gating.guestIpCapped },
                  { label: "ชนเพดาน AI รายวัน", value: cur.gating.aiCapHit },
                ]}
              />
            </div>

            <div className="altar-card-porcelain space-y-3 p-5">
              <SectionTitle title="การกลับมาใช้ & ความเห็น" />
              <KeyValueList
                items={[
                  { label: "เช็กอินไพ่รายวัน", value: cur.usage.dailyCheckin },
                  { label: "ส่งอีเมลสรุปดวง", value: cur.business.digestSent },
                  { label: "แม่หมอถามกลับเพื่อความชัด", value: cur.usage.clarify },
                  { label: "ยกเลิกกลางคัน", value: cur.usage.cancelled },
                  {
                    label: "ความเห็นจากผู้ใช้",
                    value: data.activity.feedback,
                    hint:
                      data.activity.avgRating == null ? undefined : `คะแนนเฉลี่ย ${data.activity.avgRating} / 5`,
                  },
                ]}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
