"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface HealthData {
  overallStatus: "healthy" | "degraded" | "critical";
  passedCount: number;
  totalCount: number;
  summary: string;
  checkedAt: string;
  services: {
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
      return { label: "เข้าสู่ระบบแอดมินสำเร็จ", tagColor: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30" };
    case "admin_login_fail":
      return { label: "ลองเข้ารหัสแอดมินผิด", tagColor: "text-rose-400 bg-rose-950/40 border-rose-500/30" };
    case "override_save":
      return { label: "บันทึกแก้ไขเนื้อหา / Prompt", tagColor: "text-[#ffd700] bg-[#e5c07b]/10 border-[#e5c07b]/30" };
    case "entitlement_flag":
      return { label: "ปรับสวิตช์ระบบสิทธิ์", tagColor: "text-purple-400 bg-purple-950/40 border-purple-500/30" };
    case "entitlement_init_db":
      return { label: "เตรียมโครงสร้างตารางสิทธิ์ D1", tagColor: "text-sky-400 bg-sky-950/40 border-sky-500/30" };
    case "entitlement_grandfather":
      return { label: "แจกโบนัสเปลี่ยนผ่านสมาชิก", tagColor: "text-amber-400 bg-amber-950/40 border-amber-500/30" };
    case "vectorize_rebuild":
      return { label: "สร้าง Search Index ใหม่", tagColor: "text-teal-400 bg-teal-950/40 border-teal-500/30" };
    default:
      return { label: action, tagColor: "text-[#9c93b8] bg-[#1a1428] border-[#9c93b8]/20" };
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
    timeZone: "Asia/Bangkok",
  }).format(new Date(ts));
}

export default function AdminOverview({ onNavigateTab }: AdminOverviewProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuildingIndex, setRebuildingIndex] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, sRes] = await Promise.all([
        fetch("/api/admin/system-health", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/admin/stats?days=7", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      ]);
      setHealth(hRes);
      setStats(sRes);
    } catch {
      showToast("เกิดข้อผิดพลาดในการโหลดข้อมูลภาพรวม");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRebuildIndex = async () => {
    setRebuildingIndex(true);
    try {
      const res = await fetch("/api/admin/rebuild-search-index", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`✦ สร้าง Search Index สำเร็จ (${data.indexed ?? 102} รายการ)`);
      } else {
        showToast(data.error || "สร้าง Index ไม่สำเร็จ");
      }
    } catch {
      showToast("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[#ffd700]/40 bg-[#170e28] px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <span className="text-[#ffd700]">✦</span>
          <span className="text-sm font-medium text-[#f5deaa]">{toastMsg}</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#e5c07b]/25 bg-gradient-to-br from-[#1b1233] via-[#100b20] to-[#07050e] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e5c07b]/30 bg-[#241740]/60 px-3 py-1 text-xs font-semibold text-[#ffd700]">
              <span>✦</span>
              <span>ศูนย์บัญชาการวิหารพยากรณ์ (Command Center)</span>
            </div>
            <h2 className="font-mystic-gold text-2xl sm:text-3xl font-bold tracking-wide text-white">
              ภาพรวมระบบและกิจกรรม
            </h2>
            <p className="text-sm text-[#9c93b8] font-serif-th max-w-xl">
              ติดตามสถิติผู้ใช้งาน ความพร้อมของระบบคลาวด์บน Cloudflare Edge และจัดการข้อมูลวิหารทั้งหมดได้จากจุดเดียว
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="border-[#e5c07b]/30 text-xs text-[#e5c07b] hover:border-[#ffd700] hover:text-[#ffd700]"
            >
              {loading ? "กำลังซิงก์ข้อมูล…" : "✦ รีเฟรชข้อมูลสด"}
            </Button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ffd700]/40 bg-gradient-to-r from-[#e5c07b]/20 to-[#ffd700]/10 px-4 py-2 text-xs font-semibold text-[#ffd700] hover:border-[#ffd700] hover:brightness-110 transition-all shadow-[0_0_15px_rgba(229,192,123,0.15)]"
            >
              <span>✦ ดูหน้าเว็บจริง</span>
              <span className="text-[11px]">↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Users */}
        <div className="altar-panel rounded-2xl p-5 border border-[#e5c07b]/20 hover:border-[#ffd700]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9c93b8]">สมาชิกทั้งหมดใน D1</span>
            <span className="rounded-full bg-[#201438] px-2 py-0.5 text-[11px] font-mono text-[#ffd700] border border-[#e5c07b]/20">
              D1 Database
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold font-mono text-[#f5deaa]">
            {loading ? "…" : totalUsers.toLocaleString("th-TH")}
          </p>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-[#9c93b8] border-t border-[#e5c07b]/10 pt-2">
            <span>Google: <strong className="text-white">{googleUsers}</strong></span>
            <span>•</span>
            <span>LINE: <strong className="text-white">{lineUsers}</strong></span>
            <span>•</span>
            <span>อีเมล: <strong className="text-white">{emailUsers}</strong></span>
          </div>
        </div>

        {/* KPI 2: Total Readings */}
        <div className="altar-panel rounded-2xl p-5 border border-[#e5c07b]/20 hover:border-[#ffd700]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9c93b8]">การเปิดไพ่สะสม</span>
            <span className="rounded-full bg-[#1b2a1e] px-2 py-0.5 text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
              7 วัน: {readings7d}
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold font-mono text-white">
            {loading ? "…" : totalReadings.toLocaleString("th-TH")}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#9c93b8] border-t border-[#e5c07b]/10 pt-2">
            <span>ผังพยากรณ์ 20 รูปแบบ</span>
            <button
              onClick={() => onNavigateTab("stats")}
              className="text-[#e5c07b] hover:text-[#ffd700] cursor-pointer"
            >
              ดูรายละเอียด ➔
            </button>
          </div>
        </div>

        {/* KPI 3: System Health */}
        <div className="altar-panel rounded-2xl p-5 border border-[#e5c07b]/20 hover:border-[#ffd700]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9c93b8]">สถานะระบบคลาวด์</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                health?.overallStatus === "healthy"
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-950/60 text-amber-400 border-amber-500/30"
              }`}
            >
              {health?.overallStatus === "healthy" ? "✦ ปกติดี 100%" : "ตรวจพบคำเตือน"}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-[#f5deaa]">
            {loading ? "…" : `${health?.passedCount ?? 0} / ${health?.totalCount ?? 0} ด่าน`}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#9c93b8] border-t border-[#e5c07b]/10 pt-2">
            <span>Cloudflare Edge Stack</span>
            <button
              onClick={() => onNavigateTab("health")}
              className="text-[#e5c07b] hover:text-[#ffd700] cursor-pointer"
            >
              ดูผลตรวจ ➔
            </button>
          </div>
        </div>

        {/* KPI 4: Security & Safety */}
        <div className="altar-panel rounded-2xl p-5 border border-[#e5c07b]/20 hover:border-[#ffd700]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9c93b8]">ความปลอดภัย & โควตา</span>
            <span className="rounded-full bg-[#2a1b1b] px-2 py-0.5 text-[11px] font-mono text-rose-300 border border-rose-500/30">
              สายด่วน 1323
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-white">
            {loading ? "…" : `${blocked7d.toLocaleString("th-TH")} ครั้ง`}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#9c93b8] border-t border-[#e5c07b]/10 pt-2">
            <span>บล็อกคำถามเสี่ยง / สิทธิ์เต็ม</span>
            <button
              onClick={() => onNavigateTab("entitlement")}
              className="text-[#e5c07b] hover:text-[#ffd700] cursor-pointer"
            >
              จัดการสิทธิ์ ➔
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Quick Actions & Live Infrastructure Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cloud Services Pulse */}
        <div className="lg:col-span-2 altar-panel rounded-3xl p-6 border border-[#e5c07b]/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white font-mystic-gold flex items-center gap-2">
                <span className="text-[#ffd700]">✦</span>
                <span>สัญญาณบริการคลาวด์สด (Cloud Infrastructure Pulse)</span>
              </h3>
              <p className="text-xs text-[#9c93b8] mt-0.5">
                สถานะการเชื่อมต่อบริการไร้เซิร์ฟเวอร์แบบเรียลไทม์บน Cloudflare Workers
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("health")}
              className="text-xs text-[#e5c07b] hover:text-[#ffd700] underline decoration-dotted cursor-pointer"
            >
              ดูเต็มรูปแบบ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* D1 Database */}
            <div className="flex items-center justify-between rounded-2xl bg-[#0e0a1b] p-4 border border-[#e5c07b]/15">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-[#e2d9f3]">Cloudflare D1 Database</span>
                </div>
                <p className="text-[11px] text-[#9c93b8]">
                  ฐานข้อมูลหลัก: {health?.services?.d1?.metrics?.totalReadings ?? 0} ประวัติดวง
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                {health?.services?.d1?.latencyMs ?? 0} ms
              </span>
            </div>

            {/* KV Cache */}
            <div className="flex items-center justify-between rounded-2xl bg-[#0e0a1b] p-4 border border-[#e5c07b]/15">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-[#e2d9f3]">KV Incremental Cache</span>
                </div>
                <p className="text-[11px] text-[#9c93b8]">แคชหน้าเว็บ SSG และ Feature Flags</p>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                {health?.services?.kv?.latencyMs ?? 0} ms
              </span>
            </div>

            {/* AI Models Dual Provider */}
            <div className="flex items-center justify-between rounded-2xl bg-[#0e0a1b] p-4 border border-[#e5c07b]/15">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-[#e2d9f3]">AI Providers (Groq & Gemini)</span>
                </div>
                <p className="text-[11px] text-[#9c93b8]">สตรีมคำอ่านไพ่ & ล่ามทาโรต์อัตโนมัติ</p>
              </div>
              <span className="text-xs font-semibold text-emerald-400">พร้อมใช้งาน</span>
            </div>

            {/* Vectorize Semantic Search */}
            <div className="flex items-center justify-between rounded-2xl bg-[#0e0a1b] p-4 border border-[#e5c07b]/15">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-[#e2d9f3]">Vectorize Semantic Search</span>
                </div>
                <p className="text-[11px] text-[#9c93b8]">ค้นหาความหมายไพ่ 1024 มิติ</p>
              </div>
              <span className="text-xs font-semibold text-emerald-400">Index Active</span>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions */}
        <div className="altar-panel rounded-3xl p-6 border border-[#e5c07b]/20 space-y-4">
          <h3 className="text-base font-bold text-white font-mystic-gold flex items-center gap-2">
            <span className="text-[#ffd700]">✨</span>
            <span>คำสั่งด่วน (Quick Actions)</span>
          </h3>
          <p className="text-xs text-[#9c93b8]">ทางลัดสำหรับการดูแลรักษาระบบที่พบบ่อย</p>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => onNavigateTab("content")}
              className="flex items-center justify-between w-full rounded-xl border border-[#e5c07b]/20 bg-[#160f26] p-3 text-left hover:border-[#ffd700] hover:bg-[#201538] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#ffd700] text-sm">✦</span>
                <div>
                  <p className="text-xs font-bold text-[#f5deaa]">แก้ไข Prompt / ไพ่ 78 ใบ</p>
                  <p className="text-[11px] text-[#9c93b8]">ปรับปรุงบุคลิกและคำอ่านไพ่ live</p>
                </div>
              </div>
              <span className="text-xs text-[#9c93b8]">➔</span>
            </button>

            <button
              onClick={handleRebuildIndex}
              disabled={rebuildingIndex}
              className="flex items-center justify-between w-full rounded-xl border border-[#e5c07b]/20 bg-[#160f26] p-3 text-left hover:border-[#ffd700] hover:bg-[#201538] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#ffd700] text-sm">🔍</span>
                <div>
                  <p className="text-xs font-bold text-[#f5deaa]">
                    {rebuildingIndex ? "กำลังสร้าง Index…" : "รีบิลด์ Search Index (Vectorize)"}
                  </p>
                  <p className="text-[11px] text-[#9c93b8]">อัปเดตเวกเตอร์ค้นหาไพ่ 78 ใบ + บทความ</p>
                </div>
              </div>
              <span className="text-xs text-[#9c93b8]">↻</span>
            </button>

            <a
              href="/api/admin/marketing?format=csv"
              download
              className="flex items-center justify-between w-full rounded-xl border border-[#e5c07b]/20 bg-[#160f26] p-3 text-left hover:border-[#ffd700] hover:bg-[#201538] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#ffd700] text-sm">📥</span>
                <div>
                  <p className="text-xs font-bold text-[#f5deaa]">ส่งออกผู้ยินยอมรับข่าวสาร (CSV)</p>
                  <p className="text-[11px] text-[#9c93b8]">ดาวน์โหลดรายชื่อสำหรับส่งแคมเปญ</p>
                </div>
              </div>
              <span className="text-xs text-[#9c93b8]">⤓</span>
            </a>

            <button
              onClick={() => onNavigateTab("entitlement")}
              className="flex items-center justify-between w-full rounded-xl border border-[#e5c07b]/20 bg-[#160f26] p-3 text-left hover:border-[#ffd700] hover:bg-[#201538] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#ffd700] text-sm">🎟</span>
                <div>
                  <p className="text-xs font-bold text-[#f5deaa]">ตรวจสอบโครงสร้างสิทธิ์ D1</p>
                  <p className="text-[11px] text-[#9c93b8]">ตรวจความพร้อมของตารางโควตา</p>
                </div>
              </div>
              <span className="text-xs text-[#9c93b8]">➔</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Log */}
      <div className="altar-panel rounded-3xl p-6 border border-[#e5c07b]/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-mystic-gold flex items-center gap-2">
              <span className="text-[#ffd700]">✦</span>
              <span>บันทึกประวัติกิจกรรมล่าสุด (Audit Activity Log)</span>
            </h3>
            <p className="text-xs text-[#9c93b8]">
              ประวัติการเปลี่ยนแปลงการตั้งค่าและการเข้าใช้งานระบบโดยผู้ดูแล
            </p>
          </div>
          <span className="text-xs font-mono text-[#9c93b8]">
            ล่าสุด {stats?.audit?.length ?? 0} รายการ
          </span>
        </div>

        {(!stats?.audit || stats.audit.length === 0) ? (
          <p className="text-xs text-[#9c93b8] py-4 text-center">ยังไม่มีประวัติกิจกรรมที่บันทึกไว้</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5c07b]/15 text-[#9c93b8]">
                  <th className="pb-3 font-semibold">เวลา</th>
                  <th className="pb-3 font-semibold">กิจกรรม / รายการ</th>
                  <th className="pb-3 font-semibold">รายละเอียดเพิ่มเติม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5c07b]/10">
                {stats.audit.slice(0, 8).map((entry, idx) => {
                  const { label, tagColor } = formatAuditAction(entry.action);
                  return (
                    <tr key={idx} className="hover:bg-[#1f1638]/40 transition-colors">
                      <td className="py-3 text-[#9c93b8] whitespace-nowrap font-mono">
                        {formatThaiTime(entry.ts)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block rounded-lg border px-2.5 py-1 text-[11px] font-medium ${tagColor}`}>
                          {label}
                        </span>
                      </td>
                      <td className="py-3 text-[#cfc8e2] font-mono text-[11px] truncate max-w-md">
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
