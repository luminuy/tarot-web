"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";

interface HealthData {
  overallStatus: "healthy" | "degraded" | "critical";
  passedCount: number;
  totalCount: number;
  summary: string;
  warnings?: string[];
  checkedAt: string;
  services: {
    entitlement?: {
      enforced: boolean | null;
      requireSignupToRead: boolean;
      dailyLimit: number;
      guestLimit: number;
      ok: boolean;
    };
    d1: {
      pingOk: boolean;
      latencyMs: number;
      metrics: {
        totalUsers: number;
        googleUsers: number;
        lineUsers: number;
        emailUsers: number;
        totalReadings: number;
        readingUsage: number;
      };
      error: string | null;
      ok: boolean;
    };
    kv: {
      pingOk: boolean;
      latencyMs: number;
      error: string | null;
      ok: boolean;
    };
    ai: {
      geminiConfigured: boolean;
      groqConfigured: boolean;
      ok: boolean;
    };
    cloudflareStack: {
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
  stats: {
    allTime: Record<string, number>;
    range: Record<string, number>;
  };
  audit: AuditEntry[];
}

interface AdminOverviewProps {
  onNavigateTab: (tabId: string) => void;
}

function formatAuditAction(action: string): { label: string; tagColor: string } {
  switch (action) {
    case "admin_login_success":
      return { label: "เข้าสู่ระบบแอดมินสำเร็จ", tagColor: "text-emerald-800 bg-emerald-50 border-emerald-200" };
    case "admin_login_fail":
      return { label: "ลองเข้ารหัสแอดมินผิด", tagColor: "text-rose-800 bg-rose-50 border-rose-200" };
    case "override_save":
      return { label: "บันทึกแก้ไขเนื้อหา / Prompt", tagColor: "text-amber-900 bg-amber-50 border-amber-200" };
    case "entitlement_flag":
      return { label: "ปรับสวิตช์ระบบสิทธิ์", tagColor: "text-purple-800 bg-purple-50 border-purple-200" };
    case "entitlement_init_db":
      return { label: "เตรียมโครงสร้างตารางสิทธิ์ D1", tagColor: "text-sky-800 bg-sky-50 border-sky-200" };
    case "entitlement_grandfather":
      return { label: "แจกโบนัสเปลี่ยนผ่านสมาชิก", tagColor: "text-indigo-800 bg-indigo-50 border-indigo-200" };
    case "vectorize_rebuild":
      return { label: "สร้าง Search Index ใหม่", tagColor: "text-teal-800 bg-teal-50 border-teal-200" };
    default:
      return { label: action, tagColor: "text-muted bg-canvas border-line" };
  }
}

function formatThaiTime(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return "เมื่อสักครู่";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว`;
  return new Intl.DateTimeFormat("th-TH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(ts));
}

export default function AdminOverview({ onNavigateTab }: AdminOverviewProps) {
  /*
   * 🔴 R-28: ของเดิม `r.ok ? r.json() : null` แล้ว `if (healthRes) setHealth(...)`
   * แปลว่า API ตอบ 500 ➔ ค่าเดิมค้างอยู่ (หรือว่างเปล่า) โดย **ไม่มีอะไรบอกผู้ดูแลเลย**
   * หน้าจอเฝ้าระบบที่ "ไม่มีข้อมูล" กับ "พัง" หน้าตาเหมือนกัน คือหน้าจอที่โกหกผู้ดูแล
   *
   * 🔴 R-31: ตอนนี้ทั้งสองเส้นใช้ฮุกกลาง — กฎ "ล้มเหลวแล้วล้างของเดิมทิ้ง" อยู่ที่เดียว
   * ส่วนที่แผงนี้ต้องตัดสินใจเองเหลือแค่ "รวมข้อความผิดพลาดของสองเส้นให้อ่านรวดเดียว"
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
  const [rebuildingIndex, setRebuildingIndex] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRebuildIndex = async () => {
    if (rebuildingIndex) return;
    setRebuildingIndex(true);
    showToast("กำลังสั่งรีบิลด์ Vector Search Index…");
    try {
      const res = await fetch("/api/admin/rebuild-index", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "สร้าง Index สำเร็จเรียบร้อย");
      } else {
        showToast(data.error || "สร้าง Index ไม่สำเร็จ");
      }
    } catch {
      showToast("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setRebuildingIndex(false);
    }
  };

  const totalUsers = health?.services?.d1?.metrics?.totalUsers ?? 0;
  const googleUsers = health?.services?.d1?.metrics?.googleUsers ?? 0;
  const emailUsers = health?.services?.d1?.metrics?.emailUsers ?? 0;
  const lineUsers = health?.services?.d1?.metrics?.lineUsers ?? 0;

  const totalReadings =
    health?.services?.d1?.metrics?.totalReadings ||
    stats?.stats?.allTime?.reading_completed ||
    stats?.stats?.allTime?.reading_started ||
    0;

  const readings7d = stats?.stats?.range?.reading_completed || stats?.stats?.range?.reading_started || 0;
  const blocked7d = (stats?.stats?.range?.reading_blocked ?? 0) + (stats?.stats?.range?.entitlement_blocked_read ?? 0);

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMsg && (
        <div className="altar-card-porcelain fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3">
          
          <span className="text-sm font-medium text-ink">{toastMsg}</span>
        </div>
      )}

      {/*
        * ⚠️ แถบเตือนเงื่อนไขที่ "มองข้ามไม่ได้" (ISSUE-038)
        *
        * สวิตช์ระบบสิทธิ์เปิดไพ่เคยถูกปิดค้างไว้บน production เป็นเวลานานโดยไม่มีใครรู้
        * เพราะสถานะของมันซ่อนอยู่ในแท็บ "สิทธิ์เปิดไพ่" ที่ต้องกดเข้าไปดูเองเท่านั้น
        * ส่วนหน้าแรกที่เจ้าของเปิดดูทุกวันกลับเงียบสนิท
        *
        * บทเรียน: สถานะที่ "ปิดอยู่แล้วเสียรายได้ทุกวัน" ต้องเด้งมาหาคน
        * ไม่ใช่รอให้คนไปหามัน · ปุ่มพาไปแท็บที่แก้ได้ทันทีในคลิกเดียว
        */}
      {health?.warnings && health.warnings.length > 0 && (
        <div className="anim-swap-rise-sm rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900">การแจ้งเตือนระบบ: ต้องดำเนินการ</p>
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
                className="shrink-0 border-transparent bg-amber-900 text-xs font-semibold text-white hover:bg-amber-950 transition"
              >
                ไปที่แท็บสิทธิ์เปิดไพ่
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="altar-card-porcelain p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="glass-chip inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-ink">
              
              <span>ศูนย์บัญชาการวิหารพยากรณ์ (Command Center)</span>
            </div>
            <h2 className="font-mystic-gold text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              ภาพรวมระบบและกิจกรรม
            </h2>
            <p className="text-sm text-muted max-w-xl leading-relaxed">
              ติดตามสถิติผู้ใช้งาน ความพร้อมของระบบคลาวด์บน Cloudflare Edge และจัดการข้อมูลวิหารทั้งหมดได้จากจุดเดียว
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="border-line bg-surface-warm text-xs font-medium text-ink hover:bg-white hover:border-gold transition"
            >
              {loading ? "กำลังซิงก์ข้อมูล…" : "รีเฟรชข้อมูลสด"}
            </Button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold-glass !rounded-xl inline-flex items-center gap-1.5 border-ink px-4 py-2 text-xs font-semibold hover:bg-dark"
            >
              <span>ดูหน้าเว็บจริง</span>
              <span className="text-[11px] opacity-75">↗</span>
            </a>
          </div>
        </div>
      </div>

      {loadError && <AdminErrorBanner error={loadError} onRetry={loadData} />}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Users */}
        <div className="altar-card-porcelain p-5 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">สมาชิกทั้งหมดใน D1</span>
            <span className="glass-chip px-2 py-0.5 text-[11px] font-mono text-ink">
              D1 Database
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold font-mono text-ink">
            {loading ? "…" : totalUsers.toLocaleString("th-TH")}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted border-t border-line-soft pt-2.5">
            <span>Google: <strong className="text-ink font-semibold">{googleUsers}</strong></span>
            <span>•</span>
            <span>LINE: <strong className="text-ink font-semibold">{lineUsers}</strong></span>
            <span>•</span>
            <span>อีเมล: <strong className="text-ink font-semibold">{emailUsers}</strong></span>
          </div>
        </div>

        {/* KPI 2: Total Readings */}
        <div className="altar-card-porcelain p-5 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">การเปิดไพ่สะสม</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-mono text-emerald-700 border border-emerald-200 font-semibold">
              7 วัน: {readings7d}
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold font-mono text-ink">
            {loading ? "…" : totalReadings.toLocaleString("th-TH")}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted border-t border-line-soft pt-2.5">
            <span>ผังพยากรณ์ 25 รูปแบบ</span>
            <button
              type="button"
              onClick={() => onNavigateTab("stats")}
              className="text-gold hover:text-gold-deep font-semibold cursor-pointer"
            >
              ดูรายละเอียด ➔
            </button>
          </div>
        </div>

        {/* KPI 3: System Health */}
        <div className="altar-card-porcelain p-5 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">สถานะระบบคลาวด์</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                health?.overallStatus === "healthy"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {health?.overallStatus === "healthy" ? "ปกติดี 100%" : "ตรวจพบคำเตือน"}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-ink">
            {loading ? "…" : `${health?.passedCount ?? 0} / ${health?.totalCount ?? 0} ด่าน`}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted border-t border-line-soft pt-2.5">
            <span>Cloudflare Edge Stack</span>
            <button
              type="button"
              onClick={() => onNavigateTab("health")}
              className="text-gold hover:text-gold-deep font-semibold cursor-pointer"
            >
              ดูผลตรวจ ➔
            </button>
          </div>
        </div>

        {/* KPI 4: Security & Safety */}
        <div className="altar-card-porcelain p-5 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">ความปลอดภัย & โควตา</span>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-mono text-rose-700 border border-rose-200 font-semibold">
              สายด่วน 1323
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-ink">
            {loading ? "…" : `${blocked7d.toLocaleString("th-TH")} ครั้ง`}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted border-t border-line-soft pt-2.5">
            <span>บล็อกคำถามเสี่ยง / สิทธิ์เต็ม</span>
            <button
              type="button"
              onClick={() => onNavigateTab("entitlement")}
              className="text-gold hover:text-gold-deep font-semibold cursor-pointer"
            >
              จัดการสิทธิ์ ➔
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Quick Actions & Live Infrastructure Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cloud Services Pulse */}
        <div className="altar-card-porcelain lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-ink font-mystic-gold flex items-center gap-2">
                
                <span>สัญญาณบริการคลาวด์สด (Cloud Infrastructure Pulse)</span>
              </h3>
              <p className="text-xs text-muted mt-0.5">
                สถานะการเชื่อมต่อบริการไร้เซิร์ฟเวอร์แบบเรียลไทม์บน Cloudflare Workers
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("health")}
              className="text-xs text-gold-ink hover:text-gold-deep font-semibold underline decoration-dotted cursor-pointer"
            >
              ดูเต็มรูปแบบ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* D1 Database */}
            <div className="altar-card-porcelain !rounded-xl flex items-center justify-between p-3.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold text-ink">Cloudflare D1 Database</span>
                </div>
                <p className="text-[11px] text-muted">
                  ฐานข้อมูลหลัก: {health?.services?.d1?.metrics?.totalReadings ?? 0} ประวัติดวง
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-700">
                {health?.services?.d1?.latencyMs ?? 0} ms
              </span>
            </div>

            {/* KV Cache */}
            <div className="altar-card-porcelain !rounded-xl flex items-center justify-between p-3.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span className="text-xs font-bold text-ink">KV Incremental Cache</span>
                </div>
                <p className="text-[11px] text-muted">แคชหน้าเว็บ SSG และ Feature Flags</p>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-700">
                {health?.services?.kv?.latencyMs ?? 0} ms
              </span>
            </div>

            {/* AI Models Dual Provider */}
            <div className="altar-card-porcelain !rounded-xl flex items-center justify-between p-3.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span className="text-xs font-bold text-ink">AI Providers (Groq & Gemini)</span>
                </div>
                <p className="text-[11px] text-muted">สตรีมคำอ่านไพ่ & ล่ามทาโรต์อัตโนมัติ</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700">พร้อมใช้งาน</span>
            </div>

            {/* Vectorize Semantic Search */}
            <div className="altar-card-porcelain !rounded-xl flex items-center justify-between p-3.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span className="text-xs font-bold text-ink">Vectorize Semantic Search</span>
                </div>
                <p className="text-[11px] text-muted">ค้นหาความหมายไพ่ 1024 มิติ</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700">Index Active</span>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions */}
        <div className="altar-card-porcelain p-6 space-y-4">
          <h3 className="text-base font-bold text-ink font-mystic-gold flex items-center gap-2">
            
            <span>คำสั่งด่วน (Quick Actions)</span>
          </h3>
          <p className="text-xs text-muted">ทางลัดสำหรับการดูแลรักษาระบบที่พบบ่อย</p>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab("stats")}
              className="altar-card-porcelain !rounded-xl flex items-center justify-between w-full p-3 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-bold text-ink">ดูสถิติการใช้งานรายวัน (วันต่อวัน)</p>
                  <p className="text-[11px] text-muted">ตารางวันต่อวัน กราฟแนวโน้ม และส่งออกรายงาน</p>
                </div>
              </div>
              <span className="text-xs text-muted">➔</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("content")}
              className="altar-card-porcelain !rounded-xl flex items-center justify-between w-full p-3 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-bold text-ink">ปรับแต่งคำทำนาย & ไพ่ 78 ใบ</p>
                  <p className="text-[11px] text-muted">ปรับปรุงบุคลิกแม่หมอและคำอ่านไพ่สด</p>
                </div>
              </div>
              <span className="text-xs text-muted">➔</span>
            </button>

            <button
              type="button"
              onClick={handleRebuildIndex}
              disabled={rebuildingIndex}
              className="altar-card-porcelain !rounded-xl flex items-center justify-between w-full p-3 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-bold text-ink">
                    {rebuildingIndex ? "กำลังอัปเดตระบบค้นหา…" : "อัปเดตระบบค้นหาความหมายไพ่ (Search Index)"}
                  </p>
                  <p className="text-[11px] text-muted">ซิงก์ดัชนีค้นหาไพ่ 78 ใบและบทความ</p>
                </div>
              </div>
              <span className="text-xs text-muted">↻</span>
            </button>

            <a
              href="/api/admin/marketing?format=csv"
              download
              className="altar-card-porcelain !rounded-xl flex items-center justify-between w-full p-3 text-left transition"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-bold text-ink">ดาวน์โหลดรายชื่อผู้รับข่าวสาร (CSV)</p>
                  <p className="text-[11px] text-muted">ส่งออกอีเมลสำหรับแจ้งข่าวสารและโปรโมชั่น</p>
                </div>
              </div>
              <span className="text-xs text-muted">⤓</span>
            </a>

            <button
              type="button"
              onClick={() => onNavigateTab("entitlement")}
              className="altar-card-porcelain !rounded-xl flex items-center justify-between w-full p-3 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-bold text-ink">ตรวจสอบความพร้อมระบบโควตา (D1)</p>
                  <p className="text-[11px] text-muted">ตรวจความสมบูรณ์ของระบบจำกัดสิทธิ์</p>
                </div>
              </div>
              <span className="text-xs text-muted">➔</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Log */}
      <div className="altar-card-porcelain p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-ink font-mystic-gold flex items-center gap-2">
              
              <span>บันทึกประวัติกิจกรรมล่าสุด (Audit Activity Log)</span>
            </h3>
            <p className="text-xs text-muted">
              ประวัติการเปลี่ยนแปลงการตั้งค่าและการเข้าใช้งานระบบโดยผู้ดูแล
            </p>
          </div>
          <span className="text-xs font-mono text-muted">
            ล่าสุด {stats?.audit?.length ?? 0} รายการ
          </span>
        </div>

        {(!stats?.audit || stats.audit.length === 0) ? (
          <p className="text-xs text-muted py-4 text-center">ยังไม่มีประวัติกิจกรรมที่บันทึกไว้</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-muted bg-surface-warm">
                  <th className="py-2.5 px-3 font-semibold rounded-l-lg">เวลา</th>
                  <th className="py-2.5 px-3 font-semibold">กิจกรรม / รายการ</th>
                  <th className="py-2.5 px-3 font-semibold rounded-r-lg">รายละเอียดเพิ่มเติม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {stats.audit.slice(0, 8).map((entry, idx) => {
                  const { label, tagColor } = formatAuditAction(entry.action);
                  return (
                    <tr key={idx} className="hover:bg-surface-warm transition-colors">
                      <td className="py-3 px-3 text-muted whitespace-nowrap font-mono">
                        {formatThaiTime(entry.ts)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block rounded-lg border px-2.5 py-1 text-[11px] font-medium ${tagColor}`}>
                          {label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-ink font-mono text-[11px] truncate max-w-md">
                        {entry.detail || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
