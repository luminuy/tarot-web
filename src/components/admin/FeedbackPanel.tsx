"use client";

import { useMemo } from "react";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { StatCard, fmt } from "@/components/admin/StatsWidgets";
import { Button } from "@/components/ui/Button";
import { PERSONAS } from "@/data/personas";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";
import { AdminSection, AdminSubTabs, EmptyState, KpiGrid, useSubTab } from "@/components/admin/AdminLayout";

/**
 * 💬 ความเห็นจากผู้ใช้ — อ่านจาก `GET /api/feedback` (แอดมินเท่านั้น · 50 รายการล่าสุด)
 * เดิม API นี้มีอยู่แล้วแต่ไม่มีหน้าจอให้อ่านเลย ความเห็นที่ผู้ใช้ส่งมาจึงไม่เคยมีใครเห็น
 */

interface FeedbackItem {
  id: string;
  rating: number | null;
  category: string;
  comment: string | null;
  reading_id: string | null;
  persona_id: string | null;
  page_url: string | null;
  created_at: number;
}

const CATEGORY: Record<string, string> = {
  accuracy: "ความแม่นยำ",
  feature_request: "ขอฟีเจอร์",
  bug: "แจ้งปัญหา",
  general: "ทั่วไป",
};

const PERSONA_NAME = Object.fromEntries(PERSONAS.map((p) => [p.id, p.nameTh]));

function when(ts: number): string {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(ts));
}

type FbTab = "all" | "low" | keyof typeof CATEGORY;
const FB_TABS = ["all", "low", ...Object.keys(CATEGORY)] as FbTab[];

export default function FeedbackPanel() {
  const { data, loading, error, reload } = useAdminResource<{ count: number; items: FeedbackItem[] }>("/api/feedback");
  const [tab, setTab] = useSubTab<FbTab>(FB_TABS);

  const items = useMemo(() => data?.items ?? [], [data]);
  const rated = items.filter((i) => typeof i.rating === "number");
  const avg = rated.length ? rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length : null;
  const isLow = (i: FeedbackItem) => typeof i.rating === "number" && i.rating <= 2;
  const low = items.filter(isLow).length;
  const bugs = items.filter((i) => i.category === "bug").length;
  const shown = tab === "all" ? items : tab === "low" ? items.filter(isLow) : items.filter((i) => i.category === tab);
  const countOf = (c: string) => items.filter((i) => i.category === c).length;

  return (
    <div className="space-y-6">
      <KpiGrid>
        <StatCard label="ความเห็นล่าสุด" value={fmt(data ? items.length : null)} sub="50 รายการล่าสุด" />
        <StatCard
          label="คะแนนเฉลี่ย"
          value={avg == null ? "—" : `${avg.toFixed(1)}/5`}
          sub={rated.length ? `จาก ${fmt(rated.length)} คนที่ให้คะแนน` : "ยังไม่มีคนให้คะแนน"}
        />
        <StatCard label="คะแนนต่ำ (1–2)" value={fmt(data ? low : null)} sub="ควรอ่านก่อน" />
        <StatCard label="แจ้งปัญหา" value={fmt(data ? bugs : null)} sub="ส่งต่อให้ทีมเทคนิค" />
      </KpiGrid>

      <AdminSubTabs
        label="หมวดความเห็น"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "all", label: "ทั้งหมด", count: items.length },
          { id: "low", label: "คะแนนต่ำ", count: low, tone: "alert" },
          ...(Object.entries(CATEGORY) as [FbTab, string][]).map(([id, label]) => ({
            id,
            label,
            count: countOf(id),
            tone: id === "bug" ? ("alert" as const) : undefined,
          })),
        ]}
      />

      <AdminSection
        title="ข้อความจากผู้ใช้"
        hint="เรียงจากใหม่ไปเก่า · คำอ่านที่อ้างถึงค้นต่อได้ด้วยรหัสคำอ่าน"
        actions={
          <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading} className="text-xs">
            {loading ? "กำลังโหลด…" : "โหลดล่าสุด"}
          </Button>
        }
      >
        {error ? <AdminErrorBanner error={error} onRetry={() => void reload()} /> : null}

        {!data ? (
          loading ? (
            <p className="text-sm text-muted" aria-live="polite">
              กำลังโหลด…
            </p>
          ) : null
        ) : shown.length === 0 ? (
          <EmptyState title="ยังไม่มีความเห็นในหมวดนี้" />
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((f) => (
              <li key={f.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="rounded-md border border-line bg-white px-2 py-0.5 font-medium text-ink-soft">
                    {CATEGORY[f.category] ?? f.category}
                  </span>
                  {typeof f.rating === "number" ? (
                    <span
                      className={`rounded-md px-2 py-0.5 font-semibold tabular-nums ${
                        f.rating <= 2 ? "bg-rose-50 text-rose-800" : f.rating >= 4 ? "bg-emerald-50 text-emerald-800" : "bg-inset text-ink"
                      }`}
                    >
                      คะแนน {f.rating}/5
                    </span>
                  ) : null}
                  {f.persona_id ? <span>แม่หมอ: {PERSONA_NAME[f.persona_id] ?? f.persona_id}</span> : null}
                  <span>{when(f.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{f.comment?.trim() || "— (ให้คะแนนอย่างเดียว)"}</p>
                {f.page_url || f.reading_id ? (
                  <p className="mt-1 break-all text-[11px] text-muted">
                    {f.page_url ? `หน้า: ${f.page_url}` : ""}
                    {f.page_url && f.reading_id ? " · " : ""}
                    {f.reading_id ? `คำอ่าน: ${f.reading_id}` : ""}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </div>
  );
}
