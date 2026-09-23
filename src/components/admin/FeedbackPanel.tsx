"use client";

import { useMemo, useState } from "react";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { StatCard, fmt } from "@/components/admin/StatsWidgets";
import { Button } from "@/components/ui/Button";
import { PERSONAS } from "@/data/personas";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";

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

export default function FeedbackPanel() {
  const { data, loading, error, reload } = useAdminResource<{ count: number; items: FeedbackItem[] }>("/api/feedback");
  const [filter, setFilter] = useState<string>("all");

  const items = useMemo(() => data?.items ?? [], [data]);
  const shown = filter === "all" ? items : items.filter((i) => i.category === filter);
  const rated = items.filter((i) => typeof i.rating === "number");
  const avg = rated.length ? rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length : null;
  const low = rated.filter((i) => (i.rating ?? 5) <= 2).length;
  const bugs = items.filter((i) => i.category === "bug").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="ความเห็นล่าสุด" value={fmt(data ? items.length : null)} sub="แสดง 50 รายการล่าสุด" />
        <StatCard
          label="คะแนนเฉลี่ย"
          value={avg == null ? "—" : `${avg.toFixed(1)} / 5`}
          sub={rated.length ? `จาก ${fmt(rated.length)} คนที่ให้ดาว · 1–2 ดาว ${fmt(low)} คน` : "ยังไม่มีคนให้ดาว"}
        />
        <StatCard label="แจ้งปัญหา" value={fmt(data ? bugs : null)} sub="หมวด “แจ้งปัญหา”" />
      </div>

      <section className="altar-card-porcelain space-y-4 p-5" aria-labelledby="fb-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 id="fb-title" className="text-sm font-bold text-ink">
            ข้อความจากผู้ใช้
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            {[["all", "ทั้งหมด"], ...Object.entries(CATEGORY)].map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={`tap-overlay-y rounded-lg px-3 py-1 text-xs font-medium ${
                  filter === id ? "btn-gold-glass" : "border border-line bg-white text-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
            <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading} className="text-xs">
              {loading ? "กำลังโหลด…" : "โหลดล่าสุด"}
            </Button>
          </div>
        </div>

        {error ? <AdminErrorBanner error={error} onRetry={() => void reload()} /> : null}

        {!data ? (
          loading ? (
            <p className="text-sm text-muted" aria-live="polite">
              กำลังโหลด…
            </p>
          ) : null
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">ยังไม่มีความเห็นในหมวดนี้</p>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((f) => (
              <li key={f.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="font-semibold text-ink">{CATEGORY[f.category] ?? f.category}</span>
                  {typeof f.rating === "number" ? (
                    <span className={f.rating <= 2 ? "font-semibold text-rose-700" : "text-ink"}>
                      {f.rating} / 5 ดาว
                    </span>
                  ) : null}
                  {f.persona_id ? <span>แม่หมอ: {PERSONA_NAME[f.persona_id] ?? f.persona_id}</span> : null}
                  <span>{when(f.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">{f.comment?.trim() || "— (ให้ดาวอย่างเดียว)"}</p>
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
      </section>
    </div>
  );
}
