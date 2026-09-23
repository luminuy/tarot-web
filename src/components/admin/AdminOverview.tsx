"use client";

import { useCallback, useState } from "react";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { Meter, StatCard, fmt, fmtPct } from "@/components/admin/StatsWidgets";
import { Button } from "@/components/ui/Button";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { summarize } from "@/lib/stats/admin-metrics";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";

interface ServiceCheck {
  ok: boolean;
  error?: string | null;
  latencyMs?: number;
}

interface HealthData {
  overallStatus: "healthy" | "degraded" | "critical";
  passedCount: number;
  totalCount: number;
  summary: string;
  warnings?: string[];
  checkedAt: string;
  services: {
    entitlement?: { enforced: boolean | null; ok: boolean };
    d1: ServiceCheck & {
      metrics: { totalUsers: number; googleUsers: number; lineUsers: number; emailUsers: number; totalReadings: number };
    };
    kv: ServiceCheck;
    ai: { geminiConfigured: boolean; groqConfigured: boolean; ok: boolean };
    email?: ServiceCheck;
    google?: ServiceCheck;
    line?: ServiceCheck;
    cloudflareStack: {
      upstashRedis?: { enabled: boolean; reachable: boolean };
      aiGateway: { enabled: boolean };
      turnstile: { enabled: boolean };
      workersAi: { bindingAvailable: boolean };
      vectorize: { bindingAvailable: boolean };
    };
  };
}

interface AuditEntry {
  ts: number;
  action: string;
  detail?: string;
}

interface StatsData {
  stats: { allTime: Record<string, number>; range: Record<string, number> };
  audit: AuditEntry[];
  ai: { usedToday: number; dailyCap: number; guestCap: number; memberCapReached: boolean; guestCapReached: boolean };
}

/** ชื่อไทยของทุก action ที่ `recordAudit()` บันทึกจริง — action ที่ไม่มีในนี้จะโชว์ชื่อดิบ */
const AUDIT_LABEL: Record<string, string> = {
  admin_login_success: "เข้าสู่ระบบแอดมิน",
  admin_login_fail: "ใส่รหัสแอดมินผิด",
  content_update: "แก้เนื้อหา / คำสั่งแม่หมอ",
  create_reader: "เพิ่มหมอดูพาร์ทเนอร์",
  update_reader: "แก้ข้อมูลหมอดูพาร์ทเนอร์",
  delete_reader: "ลบหมอดูพาร์ทเนอร์",
  entitlement_flag: "เปิด/ปิดระบบสิทธิ์",
  entitlement_announce: "เปิด/ปิดแบนเนอร์ประกาศ",
  entitlement_init_db: "เตรียมตารางสิทธิ์",
  entitlement_grandfather: "แจกโบนัสผู้ใช้เดิม",
  redeem_code_create: "สร้างรหัสแลกสิทธิ์",
  redeem_code_toggle: "เปิด/ปิดรหัสแลกสิทธิ์",
  redeem_code_update: "แก้รหัสแลกสิทธิ์",
  marketing_audience_export: "ส่งออกรายชื่อผู้รับข่าวสาร",
  member_bonus_grant: "ให้สิทธิ์เปิดไพ่เพิ่มแก่สมาชิก",
  search_index_rebuild: "อัปเดตระบบค้นหา",
};

/** action ที่ควรสะดุดตา (อาจเป็นการพยายามบุกรุก) */
const AUDIT_ALERT = new Set(["admin_login_fail"]);

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(ts));
}

type Tone = "ok" | "bad" | "off";

function StatusRow({ name, tone, text }: { name: string; tone: Tone; text: string }) {
  const dot = tone === "ok" ? "bg-emerald-600" : tone === "bad" ? "bg-rose-600" : "bg-line-interactive";
  const label = tone === "ok" ? "ปกติ" : tone === "bad" ? "ผิดปกติ" : "ไม่ได้เปิดใช้";
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <span className="flex items-center gap-2 text-sm text-ink">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
        {name}
        <span className="sr-only">: {label}</span>
      </span>
      <span className={`text-right text-xs ${tone === "bad" ? "font-semibold text-rose-700" : "text-muted"}`}>{text}</span>
    </li>
  );
}

export default function AdminOverview({ onNavigateTab }: { onNavigateTab: (tabId: string) => void }) {
  /*
   * 🔴 R-28/R-31: โหลดผ่านฮุกกลาง — API ล้ม ➔ ล้างของเก่า + แสดง AdminErrorBanner
   * หน้าจอเฝ้าระบบที่ "ไม่มีข้อมูล" กับ "พัง" หน้าตาเหมือนกัน คือหน้าจอที่โกหกผู้ดูแล
   */
  const healthRes = useAdminResource<HealthData>("/api/admin/system-health");
  const statsRes = useAdminResource<StatsData>("/api/admin/stats?days=7");
  const health = healthRes.data;
  const stats = statsRes.data;
  const loading = healthRes.loading || statsRes.loading;
  const loadError =
    [
      healthRes.error ? `สุขภาพระบบ: ${healthRes.error}` : null,
      statsRes.error ? `สถิติ 7 วัน: ${statsRes.error}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || null;
  const reloadHealth = healthRes.reload;
  const reloadStats = statsRes.reload;
  const loadData = useCallback(() => {
    void reloadHealth();
    void reloadStats();
  }, [reloadHealth, reloadStats]);

  const [rebuilding, setRebuilding] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const rebuildIndex = async () => {
    if (rebuilding) return;
    setRebuilding(true);
    setActionMsg("กำลังอัปเดตระบบค้นหา…");
    try {
      const res = await fetch("/api/admin/rebuild-search-index", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setActionMsg(res.ok ? data.message || "อัปเดตระบบค้นหาสำเร็จ" : data.error || "อัปเดตระบบค้นหาไม่สำเร็จ");
    } catch {
      setActionMsg("ติดต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setRebuilding(false);
    }
  };

  const week = summarize(stats?.stats.range);
  const d1 = health?.services.d1;
  const cf = health?.services.cloudflareStack;

  return (
    <div className="space-y-6">
      {/*
        ⚠️ แถบเตือนเงื่อนไขที่ "มองข้ามไม่ได้" (ISSUE-038)
        สวิตช์ระบบสิทธิ์เคยถูกปิดค้างบน production โดยไม่มีใครรู้ เพราะสถานะซ่อนอยู่ในแท็บอื่น
        สถานะที่ "ปิดอยู่แล้วเสียรายได้ทุกวัน" ต้องเด้งมาหาคน ไม่ใช่รอให้คนไปหามัน
      */}
      {health?.warnings && health.warnings.length > 0 && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900">ต้องดำเนินการ</p>
              <ul className="space-y-1 text-xs leading-relaxed text-amber-900">
                {health.warnings.map((w) => (
                  <li key={w}>• {w}</li>
                ))}
              </ul>
            </div>
            {health.services?.entitlement?.enforced !== true && (
              <Button
                size="sm"
                onClick={() => onNavigateTab("entitlement")}
                className="shrink-0 border-transparent bg-amber-900 text-xs font-semibold text-white hover:bg-amber-950"
              >
                ไปที่สิทธิ์ & โควตา
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {health?.checkedAt
            ? `ตรวจล่าสุด ${formatTime(Date.parse(health.checkedAt))} · ตัวเลขใช้งานย้อนหลัง 7 วัน`
            : "ตัวเลขใช้งานย้อนหลัง 7 วัน"}
        </p>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="text-xs">
          {loading ? "กำลังโหลด…" : "โหลดล่าสุด"}
        </Button>
      </div>

      {loadError && <AdminErrorBanner error={loadError} onRetry={loadData} />}

      {/* ─── ตัวเลขหลัก ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="สมาชิกทั้งหมด"
          value={loading && !d1 ? "…" : fmt(d1?.metrics.totalUsers ?? null)}
          sub={
            d1
              ? `Google ${fmt(d1.metrics.googleUsers)} · LINE ${fmt(d1.metrics.lineUsers)} · อีเมล ${fmt(d1.metrics.emailUsers)}`
              : undefined
          }
        />
        <StatCard
          label="เปิดไพ่ 7 วัน"
          value={loading && !stats ? "…" : fmt(stats ? week.usage.started : null)}
          sub={
            stats
              ? `อ่านจบ ${fmt(week.usage.completed)} (${fmtPct(week.usage.completionPct)}) · แชท ${fmt(week.usage.chat)}`
              : undefined
          }
        />
        <StatCard
          label="โควตา AI วันนี้"
          value={stats ? `${fmt(stats.ai.usedToday)} / ${fmt(stats.ai.dailyCap)}` : loading ? "…" : "—"}
          sub={
            stats
              ? stats.ai.memberCapReached
                ? "เต็มเพดานแล้ว"
                : `เหลือ ${fmt(stats.ai.dailyCap - stats.ai.usedToday)} ครั้ง`
              : undefined
          }
        >
          {stats ? <Meter value={stats.ai.usedToday} max={stats.ai.dailyCap} marker={stats.ai.guestCap} /> : null}
        </StatCard>
        <StatCard
          label="สถานะระบบ"
          value={health ? `${health.passedCount} / ${health.totalCount}` : loading ? "…" : "—"}
          sub={health ? health.summary : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ─── สถานะบริการ (ค่าจริงจาก /api/admin/system-health) ─────────── */}
        <section className="altar-card-porcelain p-5 lg:col-span-2" aria-labelledby="ov-services">
          <div className="mb-3 flex items-center justify-between">
            <h3 id="ov-services" className="text-sm font-bold text-ink">
              สถานะบริการ
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("health")}
              className="tap-overlay-y text-xs font-semibold text-ink underline underline-offset-2"
            >
              ดูผลตรวจเต็ม
            </button>
          </div>
          {!health ? (
            <p className="text-xs text-muted">{loading ? "กำลังตรวจ…" : "ยังไม่มีผลตรวจ"}</p>
          ) : (
            <ul className="divide-y divide-line">
              <StatusRow
                name="ฐานข้อมูล D1"
                tone={health.services.d1.ok ? "ok" : "bad"}
                text={health.services.d1.ok ? `${health.services.d1.latencyMs ?? 0} ms` : health.services.d1.error || "เชื่อมต่อไม่ได้"}
              />
              <StatusRow
                name="Cloudflare KV"
                tone={health.services.kv.ok ? "ok" : "bad"}
                text={health.services.kv.ok ? `${health.services.kv.latencyMs ?? 0} ms` : health.services.kv.error || "เชื่อมต่อไม่ได้"}
              />
              {cf?.upstashRedis ? (
                <StatusRow
                  name="Upstash Redis (ตัวนับ)"
                  tone={!cf.upstashRedis.enabled ? "off" : cf.upstashRedis.reachable ? "ok" : "bad"}
                  text={!cf.upstashRedis.enabled ? "ใช้ KV แทน" : cf.upstashRedis.reachable ? "ตอบสนอง" : "ติดต่อไม่ได้"}
                />
              ) : null}
              <StatusRow
                name="คีย์ AI (Groq / Gemini)"
                tone={health.services.ai.ok ? "ok" : "bad"}
                text={`Groq ${health.services.ai.groqConfigured ? "มี" : "ไม่มี"} · Gemini ${health.services.ai.geminiConfigured ? "มี" : "ไม่มี"}`}
              />
              {health.services.email ? (
                <StatusRow
                  name="ส่งอีเมล (Resend)"
                  tone={health.services.email.ok ? "ok" : "bad"}
                  text={health.services.email.ok ? "ตั้งค่าแล้ว" : health.services.email.error || "ยังไม่พร้อม"}
                />
              ) : null}
              <StatusRow
                name="ค้นหาความหมาย (Vectorize)"
                tone={cf?.vectorize.bindingAvailable ? "ok" : "off"}
                text={cf?.vectorize.bindingAvailable ? "เชื่อมแล้ว" : "ไม่มี binding"}
              />
              <StatusRow
                name="กันบอท (Turnstile)"
                tone={cf?.turnstile.enabled ? "ok" : "off"}
                text={cf?.turnstile.enabled ? "เปิดอยู่" : "ปิดอยู่"}
              />
            </ul>
          )}
        </section>

        {/* ─── ทางลัด ────────────────────────────────────────────── */}
        <section className="altar-card-porcelain space-y-2 p-5" aria-labelledby="ov-actions">
          <h3 id="ov-actions" className="mb-1 text-sm font-bold text-ink">
            ทางลัด
          </h3>
          {(
            [
              ["สรุปการใช้งานรายวัน", () => onNavigateTab("stats")],
              ["ค้นหาสมาชิก / ให้สิทธิ์เพิ่ม", () => onNavigateTab("members")],
              ["อ่านความเห็นจากผู้ใช้", () => onNavigateTab("feedback")],
            ] as const
          ).map(([label, go]) => (
            <button
              key={label}
              type="button"
              onClick={go}
              className="flex min-h-11 w-full items-center justify-between rounded-lg border border-line bg-white px-3 text-left text-sm text-ink hover:bg-canvas"
            >
              {label}
              <span aria-hidden className="text-muted">›</span>
            </button>
          ))}
          <button
            type="button"
            onClick={rebuildIndex}
            disabled={rebuilding}
            className="flex min-h-11 w-full items-center justify-between rounded-lg border border-line bg-white px-3 text-left text-sm text-ink hover:bg-canvas disabled:opacity-50"
          >
            {rebuilding ? "กำลังอัปเดตระบบค้นหา…" : "อัปเดตระบบค้นหาไพ่ (Search Index)"}
            <span aria-hidden className="text-muted">↻</span>
          </button>
          {actionMsg ? (
            <p className="text-xs text-muted" aria-live="polite">
              {actionMsg}
            </p>
          ) : null}
        </section>
      </div>

      {/* ─── สัญญาณที่ควรดู 7 วัน ───────────────────────────────────── */}
      {stats ? (
        <section className="altar-card-porcelain p-5" aria-labelledby="ov-signals">
          <h3 id="ov-signals" className="mb-3 text-sm font-bold text-ink">
            สัญญาณที่ควรดู (7 วัน)
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {(
              [
                ["บล็อกความปลอดภัย", week.safety.total],
                ["ถูกกั้นด้วยสิทธิ์/โควตา", week.gating.total],
                ["คำอ่านล้มเหลว", week.usage.failed],
                ["AI ผิดพลาด", week.ai.errors],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="rounded-lg border border-line p-3">
                <p className="text-xs text-muted">{label}</p>
                <p className={`mt-1 font-mono text-lg font-bold ${v > 0 && label !== "ถูกกั้นด้วยสิทธิ์/โควตา" ? "text-rose-700" : "text-ink"}`}>
                  {fmt(v)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ─── บันทึกกิจกรรมแอดมิน ───────────────────────────────────── */}
      <section className="altar-card-porcelain p-5" aria-labelledby="ov-audit">
        <div className="mb-3 flex items-center justify-between">
          <h3 id="ov-audit" className="text-sm font-bold text-ink">
            กิจกรรมแอดมินล่าสุด
          </h3>
          <span className="text-xs text-muted">{stats?.audit.length ? `${Math.min(15, stats.audit.length)} รายการล่าสุด` : ""}</span>
        </div>
        {!stats?.audit || stats.audit.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted">ยังไม่มีกิจกรรมที่บันทึกไว้</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3 font-semibold">เวลา</th>
                <th className="py-2 pr-3 font-semibold">กิจกรรม</th>
                <th className="hidden py-2 font-semibold sm:table-cell">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {stats.audit.slice(0, 15).map((entry, idx) => (
                <tr key={`${entry.ts}-${idx}`}>
                  <td className="whitespace-nowrap py-2.5 pr-3 font-mono text-muted">{formatTime(entry.ts)}</td>
                  <td className={`py-2.5 pr-3 ${AUDIT_ALERT.has(entry.action) ? "font-semibold text-rose-700" : "text-ink"}`}>
                    {AUDIT_LABEL[entry.action] ?? entry.action}
                  </td>
                  <td className="hidden max-w-md truncate py-2.5 text-muted sm:table-cell">{entry.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
