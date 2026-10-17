"use client";

import { useMemo, useState } from "react";

import { AdminSubTabs, useSubTab } from "@/components/admin/AdminLayout";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import DailyStatsTable from "@/components/admin/DailyStatsTable";
import DailySummary, { statDayKey } from "@/components/admin/DailySummary";
import { KeyValueList, Meter, SectionTitle, StatCard, fmt, fmtPct } from "@/components/admin/StatsWidgets";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { summarize } from "@/lib/stats/admin-metrics";
import { RefreshIcon } from "@/components/ui/LineIcons";

interface StatsSnapshot {
  allTime: Record<string, number>;
  range: Record<string, number>;
  rangeDays: number;
  daily: Record<string, Record<string, number>>;
  generatedAt: number;
}

interface AiUsage {
  usedToday: number;
  dailyCap: number;
  guestCap: number;
  memberCapReached: boolean;
  guestCapReached: boolean;
}

type SubView = "daily" | "trend" | "ai";

const TABS: { id: SubView; label: string; hint: string }[] = [
  { id: "daily", label: "สรุปรายวัน", hint: "เลือกวัน เทียบวันก่อน" },
  { id: "trend", label: "แนวโน้มและความนิยม", hint: "กราฟ ตารางย้อนหลัง CSV" },
  { id: "ai", label: "AI และระบบ", hint: "โควตา ความเสถียร ความเร็ว" },
];
const SUB_VIEWS = TABS.map((t) => t.id);

const RANGES = [7, 14, 30, 90] as const;

/**
 * แผงสถิติแอดมิน 3 หมวด
 * 1. สรุปรายวัน — เลือกวันได้ เทียบกับวันก่อน (`DailySummary` · `/api/admin/stats?day=`)
 * 2. แนวโน้ม & ความนิยม — ช่วง 7–90 วัน กราฟ ตาราง CSV (`DailyStatsTable`)
 * 3. AI & ระบบ — โควตา AI วันนี้ ผู้ให้บริการ ความเสถียร ความเร็ว สิทธิ์ที่กั้นผู้ใช้
 *
 * บันทึกการเข้าแอดมินอยู่ที่แผง "ภาพรวมวิหาร" ที่เดียว (เคยซ้ำอยู่ในแท็บ AI ของหน้านี้)
 */
export default function StatsDashboard() {
  const [subView, setSubView] = useSubTab<SubView>(SUB_VIEWS);
  const [days, setDays] = useState<number>(14);
  const [day, setDay] = useState<string>(() => statDayKey());

  /*
   * 🔴 R-28/R-31: โหลดผ่านฮุกกลางเท่านั้น — ล้มเหลวแล้วล้างของเดิม + แสดง AdminErrorBanner
   * แท็บ "สรุปรายวัน" โหลดของตัวเอง ช่วงวันจึงโหลดเฉพาะตอนเปิดสองแท็บที่เหลือ
   */
  const { data, loading, error, reload } = useAdminResource<{ stats: StatsSnapshot; ai: AiUsage }>(
    `/api/admin/stats?days=${days}`,
    { immediate: subView !== "daily" },
  );

  const total = useMemo(() => summarize(data?.stats.range), [data]);

  const openDay = (d: string) => {
    setDay(d);
    setSubView("daily");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ─── แถบควบคุม ─────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <AdminSubTabs label="หมวดสถิติ" tabs={TABS} active={subView} onChange={setSubView} />
        </div>

        {subView !== "daily" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden text-xs font-semibold text-muted sm:inline">ช่วงเวลา:</span>
            {RANGES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={`tap-overlay-y rounded-lg px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  days === d ? "btn-gold-glass" : "border border-line bg-white text-muted hover:bg-canvas hover:text-ink"
                }`}
              >
                {d} วัน
              </button>
            ))}
            <button
              type="button"
              onClick={() => void reload()}
              disabled={loading}
              className="altar-card-porcelain !rounded-lg tap-overlay-y inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-ink hover:bg-canvas transition-colors cursor-pointer disabled:opacity-50"
              title="โหลดตัวเลขล่าสุด"
            >
              <RefreshIcon className={loading ? "inline-block w-4 h-4 animate-spin" : "inline-block w-4 h-4"} />
              <span className="hidden sm:inline">โหลดล่าสุด</span>
            </button>
          </div>
        ) : null}
      </div>

      {subView === "daily" ? (
        <DailySummary day={day} onDayChange={setDay} />
      ) : error ? (
        <AdminErrorBanner error={error} onRetry={() => void reload()} />
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-16 text-center" aria-live="polite">
          <div className="mb-3 h-7 w-7 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-xs text-muted">กำลังประมวลผลสถิติ…</p>
        </div>
      ) : subView === "trend" ? (
        <DailyStatsTable
          daily={data.stats.daily}
          range={data.stats.range}
          rangeDays={days}
          today={statDayKey()}
          onSelectDay={openDay}
        />
      ) : (
        <div className="space-y-5">
          {/* ─── โควตา + ผู้ให้บริการ ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
            <StatCard
              label={`เรียก AI (${days} วัน)`}
              value={fmt(total.ai.calls)}
              sub={`Groq ${fmt(total.ai.groq)} · Gemini ${fmt(total.ai.gemini)} (Groq ${fmtPct(total.ai.groqPct)})`}
            />
            <StatCard
              label="เวลาเฉลี่ยต่อคำอ่าน"
              value={total.ai.avgLatencyMs == null ? "—" : `${(total.ai.avgLatencyMs / 1000).toFixed(1)} วิ`}
              sub={`จากคำอ่านที่จบ ${fmt(total.usage.completed)} ครั้ง`}
            />
            <StatCard
              label="Token ที่ใช้"
              value={fmt(total.ai.tokensIn + total.ai.tokensOut)}
              sub={
                total.usage.completed > 0
                  ? `เฉลี่ย ${fmt(Math.round((total.ai.tokensIn + total.ai.tokensOut) / total.usage.completed))} ต่อคำอ่าน`
                  : `เข้า ${fmt(total.ai.tokensIn)} · ออก ${fmt(total.ai.tokensOut)}`
              }
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="altar-card-porcelain space-y-3 p-5">
              <SectionTitle title="ความเสถียรของ AI" hint={`${days} วัน`} />
              <KeyValueList
                alertWhenPositive
                items={[
                  { label: "AI ผิดพลาด", value: total.ai.errors },
                  { label: "สลับจาก Groq ไป Gemini", value: total.ai.failover, hint: "Groq ทุกโมเดลตอบไม่จบ" },
                  { label: "โครงคำอ่านไม่ครบ (schema)", value: total.ai.schemaFails },
                  { label: "ตัดวงจรอักษรแปลกปน", value: total.ai.foreignTrips },
                  { label: "คำอ่านสำรอง (ไม่ใช่ AI)", value: total.ai.mockServed },
                  { label: "แชทตอบแบบออฟไลน์", value: total.ai.chatOffline },
                ]}
              />
            </div>

            <div className="altar-card-porcelain space-y-3 p-5">
              <SectionTitle title="ผลลัพธ์ของการเปิดไพ่" hint={`${days} วัน`} />
              <KeyValueList
                items={[
                  { label: "เริ่มเปิดไพ่", value: total.usage.started },
                  { label: "อ่านจบสมบูรณ์", value: total.usage.completed, hint: `${fmtPct(total.usage.completionPct)} ของที่เริ่ม` },
                  { label: "ล้มเหลว", value: total.usage.failed },
                  { label: "ผู้ใช้ยกเลิกกลางคัน", value: total.usage.cancelled },
                  { label: "บันทึกคำอ่านไม่สำเร็จ", value: total.usage.persistFailed },
                  { label: "แม่หมอถามกลับเพื่อความชัด", value: total.usage.clarify },
                ]}
              />
            </div>

            <div className="altar-card-porcelain space-y-3 p-5">
              <SectionTitle title="ถูกกั้นด้วยสิทธิ์/โควตา" hint={`รวม ${fmt(total.gating.total)}`} />
              <KeyValueList
                items={[
                  { label: "ชนเพดาน AI รายวัน", value: total.gating.aiCapHit },
                  { label: "เปิดไพ่เกินสิทธิ์", value: total.gating.blockedStart + total.gating.blockedRead },
                  { label: "ต้องล็อกอินก่อน", value: total.gating.blockedSignin },
                  { label: "ผัง/แม่หมอพรีเมียม", value: total.gating.blockedPremium },
                  { label: "แชทเกินสิทธิ์", value: total.gating.blockedChat },
                  { label: "ผู้เยี่ยมชมเกินเพดาน IP", value: total.gating.guestIpCapped },
                ]}
              />
            </div>
          </div>

          <p className="text-xs text-muted">
            ต้องการยิงทดสอบการเชื่อมต่อ AI จริง หรือดูว่าคีย์ใช้ได้ไหม ไปที่เมนู &quot;ตรวจสุขภาพระบบ&quot;
          </p>
        </div>
      )}
    </div>
  );
}
