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
      return { label: action, tagColor: "text-[#635B4E] bg-[#F3F0EA] border-[#D5CEC2]" };
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
      const [healthRes, statsRes] = await Promise.all([
        fetch("/api/admin/system-health", { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : null,
        ),
        fetch("/api/admin/stats?days=7", { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : null,
        ),
      ]);

      if (healthRes) setHealth(healthRes);
      if (statsRes) setStats(statsRes);
    } catch {
      showToast("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[#D5CEC2] bg-white px-5 py-3 shadow-lg">
          <span className="text-[#A58A5C]">✦</span>
          <span className="text-sm font-medium text-[#29261F]">{toastMsg}</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="rounded-2xl border border-[#D5CEC2] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D5CEC2] bg-[#FAF8F5] px-3 py-1 text-xs font-semibold text-[#29261F]">
              <span className="text-[#A58A5C]">✦</span>
              <span>ศูนย์บัญชาการวิหารพยากรณ์ (Command Center)</span>
            </div>
            <h2 className="font-mystic-gold text-2xl sm:text-3xl font-bold tracking-tight text-[#29261F]">
              ภาพรวมระบบและกิจกรรม
            </h2>
            <p className="text-sm text-[#635B4E] max-w-xl leading-relaxed">
              ติดตามสถิติผู้ใช้งาน ความพร้อมของระบบคลาวด์บน Cloudflare Edge และจัดการข้อมูลวิหารทั้งหมดได้จากจุดเดียว
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="border-[#D5CEC2] bg-[#FAF8F5] text-xs font-medium text-[#29261F] hover:bg-white hover:border-[#A58A5C] transition-all"
            >
              {loading ? "กำลังซิงก์ข้อมูล…" : "✦ รีเฟรชข้อมูลสด"}
            </Button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#29261F] bg-[#29261F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#171512] transition-all shadow-xs"
            >
              <span>✦ ดูหน้าเว็บจริง</span>
              <span className="text-[11px] opacity-75">↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Users */}
        <div className="rounded-2xl border border-[#D5CEC2] bg-white p-5 shadow-xs hover:border-[#A58A5C] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635B4E]">สมาชิกทั้งหมดใน D1</span>
            <span className="rounded-full bg-[#FAF8F5] px-2 py-0.5 text-[11px] font-mono text-[#29261F] border border-[#D5CEC2]">
              D1 Database
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold font-mono text-[#29261F]">
            {loading ? "…" : totalUsers.toLocaleString("th-TH")}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#635B4E] border-t border-[#E8E2D8] pt-2.5">
            <span>Google: <strong className="text-[#29261F] font-semibold">{googleUsers}</strong></span>
            <span>•</span>
            <span>LINE: <strong className="text-[#29261F] font-semibold">{lineUsers}</strong></span>
            <span>•</span>
            <span>อีเมล: <strong className="text-[#29261F] font-semibold">{emailUsers}</strong></span>
          </div>
        </div>

        {/* KPI 2: Total Readings */}
        <div className="rounded-2xl border border-[#D5CEC2] bg-white p-5 shadow-xs hover:border-[#A58A5C] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635B4E]">การเปิดไพ่สะสม</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-mono text-emerald-700 border border-emerald-200 font-semibold">
              7 วัน: {readings7d}
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold font-mono text-[#29261F]">
            {loading ? "…" : totalReadings.toLocaleString("th-TH")}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#635B4E] border-t border-[#E8E2D8] pt-2.5">
            <span>ผังพยากรณ์ 20 รูปแบบ</span>
            <button
              type="button"
              onClick={() => onNavigateTab("stats")}
              className="text-[#A58A5C] hover:text-[#8E754C] font-semibold cursor-pointer"
            >
              ดูรายละเอียด ➔
            </button>
          </div>
        </div>

        {/* KPI 3: System Health */}
        <div className="rounded-2xl border border-[#D5CEC2] bg-white p-5 shadow-xs hover:border-[#A58A5C] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635B4E]">สถานะระบบคลาวด์</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                health?.overallStatus === "healthy"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {health?.overallStatus === "healthy" ? "✦ ปกติดี 100%" : "ตรวจพบคำเตือน"}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-[#29261F]">
            {loading ? "…" : `${health?.passedCount ?? 0} / ${health?.totalCount ?? 0} ด่าน`}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#635B4E] border-t border-[#E8E2D8] pt-2.5">
            <span>Cloudflare Edge Stack</span>
            <button
              type="button"
              onClick={() => onNavigateTab("health")}
              className="text-[#A58A5C] hover:text-[#8E754C] font-semibold cursor-pointer"
            >
              ดูผลตรวจ ➔
            </button>
          </div>
        </div>

        {/* KPI 4: Security & Safety */}
        <div className="rounded-2xl border border-[#D5CEC2] bg-white p-5 shadow-xs hover:border-[#A58A5C] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#635B4E]">ความปลอดภัย & โควตา</span>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-mono text-rose-700 border border-rose-200 font-semibold">
              สายด่วน 1323
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-[#29261F]">
            {loading ? "…" : `${blocked7d.toLocaleString("th-TH")} ครั้ง`}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#635B4E] border-t border-[#E8E2D8] pt-2.5">
            <span>บล็อกคำถามเสี่ยง / สิทธิ์เต็ม</span>
            <button
              type="button"
              onClick={() => onNavigateTab("entitlement")}
              className="text-[#A58A5C] hover:text-[#8E754C] font-semibold cursor-pointer"
            >
              จัดการสิทธิ์ ➔
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Quick Actions & Live Infrastructure Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cloud Services Pulse */}
        <div className="lg:col-span-2 rounded-2xl border border-[#D5CEC2] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#29261F] font-mystic-gold flex items-center gap-2">
                <span className="text-[#A58A5C]">✦</span>
                <span>สัญญาณบริการคลาวด์สด (Cloud Infrastructure Pulse)</span>
              </h3>
              <p className="text-xs text-[#635B4E] mt-0.5">
                สถานะการเชื่อมต่อบริการไร้เซิร์ฟเวอร์แบบเรียลไทม์บน Cloudflare Workers
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("health")}
              className="text-xs text-[#A58A5C] hover:text-[#8E754C] font-semibold underline decoration-dotted cursor-pointer"
            >
              ดูเต็มรูปแบบ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* D1 Database */}
            <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-3.5 border border-[#E8E2D8]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold text-[#29261F]">Cloudflare D1 Database</span>
                </div>
                <p className="text-[11px] text-[#635B4E]">
                  ฐานข้อมูลหลัก: {health?.services?.d1?.metrics?.totalReadings ?? 0} ประวัติดวง
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-700">
                {health?.services?.d1?.latencyMs ?? 0} ms
              </span>
            </div>

            {/* KV Cache */}
            <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-3.5 border border-[#E8E2D8]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span className="text-xs font-bold text-[#29261F]">KV Incremental Cache</span>
                </div>
                <p className="text-[11px] text-[#635B4E]">แคชหน้าเว็บ SSG และ Feature Flags</p>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-700">
                {health?.services?.kv?.latencyMs ?? 0} ms
              </span>
            </div>

            {/* AI Models Dual Provider */}
            <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-3.5 border border-[#E8E2D8]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span className="text-xs font-bold text-[#29261F]">AI Providers (Groq & Gemini)</span>
                </div>
                <p className="text-[11px] text-[#635B4E]">สตรีมคำอ่านไพ่ & ล่ามทาโรต์อัตโนมัติ</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700">พร้อมใช้งาน</span>
            </div>

            {/* Vectorize Semantic Search */}
            <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-3.5 border border-[#E8E2D8]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span className="text-xs font-bold text-[#29261F]">Vectorize Semantic Search</span>
                </div>
                <p className="text-[11px] text-[#635B4E]">ค้นหาความหมายไพ่ 1024 มิติ</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700">Index Active</span>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions */}
        <div className="rounded-2xl border border-[#D5CEC2] bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#29261F] font-mystic-gold flex items-center gap-2">
            <span className="text-[#A58A5C]">✨</span>
            <span>คำสั่งด่วน (Quick Actions)</span>
          </h3>
          <p className="text-xs text-[#635B4E]">ทางลัดสำหรับการดูแลรักษาระบบที่พบบ่อย</p>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab("content")}
              className="flex items-center justify-between w-full rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] p-3 text-left hover:border-[#A58A5C] hover:bg-white transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#A58A5C] text-sm font-bold">✦</span>
                <div>
                  <p className="text-xs font-bold text-[#29261F]">แก้ไข Prompt / ไพ่ 78 ใบ</p>
                  <p className="text-[11px] text-[#635B4E]">ปรับปรุงบุคลิกและคำอ่านไพ่ live</p>
                </div>
              </div>
              <span className="text-xs text-[#635B4E]">➔</span>
            </button>

            <button
              type="button"
              onClick={handleRebuildIndex}
              disabled={rebuildingIndex}
              className="flex items-center justify-between w-full rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] p-3 text-left hover:border-[#A58A5C] hover:bg-white transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#A58A5C] text-sm font-bold">✦</span>
                <div>
                  <p className="text-xs font-bold text-[#29261F]">
                    {rebuildingIndex ? "กำลังสร้าง Index…" : "รีบิลด์ Search Index (Vectorize)"}
                  </p>
                  <p className="text-[11px] text-[#635B4E]">อัปเดตเวกเตอร์ค้นหาไพ่ 78 ใบ + บทความ</p>
                </div>
              </div>
              <span className="text-xs text-[#635B4E]">↻</span>
            </button>

            <a
              href="/api/admin/marketing?format=csv"
              download
              className="flex items-center justify-between w-full rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] p-3 text-left hover:border-[#A58A5C] hover:bg-white transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#A58A5C] text-sm font-bold">✦</span>
                <div>
                  <p className="text-xs font-bold text-[#29261F]">ส่งออกผู้ยินยอมรับข่าวสาร (CSV)</p>
                  <p className="text-[11px] text-[#635B4E]">ดาวน์โหลดรายชื่อสำหรับส่งแคมเปญ</p>
                </div>
              </div>
              <span className="text-xs text-[#635B4E]">⤓</span>
            </a>

            <button
              type="button"
              onClick={() => onNavigateTab("entitlement")}
              className="flex items-center justify-between w-full rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] p-3 text-left hover:border-[#A58A5C] hover:bg-white transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#A58A5C] text-sm font-bold">✦</span>
                <div>
                  <p className="text-xs font-bold text-[#29261F]">ตรวจสอบโครงสร้างสิทธิ์ D1</p>
                  <p className="text-[11px] text-[#635B4E]">ตรวจความพร้อมของตารางโควตา</p>
                </div>
              </div>
              <span className="text-xs text-[#635B4E]">➔</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Log */}
      <div className="rounded-2xl border border-[#D5CEC2] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#29261F] font-mystic-gold flex items-center gap-2">
              <span className="text-[#A58A5C]">✦</span>
              <span>บันทึกประวัติกิจกรรมล่าสุด (Audit Activity Log)</span>
            </h3>
            <p className="text-xs text-[#635B4E]">
              ประวัติการเปลี่ยนแปลงการตั้งค่าและการเข้าใช้งานระบบโดยผู้ดูแล
            </p>
          </div>
          <span className="text-xs font-mono text-[#635B4E]">
            ล่าสุด {stats?.audit?.length ?? 0} รายการ
          </span>
        </div>

        {(!stats?.audit || stats.audit.length === 0) ? (
          <p className="text-xs text-[#635B4E] py-4 text-center">ยังไม่มีประวัติกิจกรรมที่บันทึกไว้</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D5CEC2] text-[#635B4E] bg-[#FAF8F5]">
                  <th className="py-2.5 px-3 font-semibold rounded-l-lg">เวลา</th>
                  <th className="py-2.5 px-3 font-semibold">กิจกรรม / รายการ</th>
                  <th className="py-2.5 px-3 font-semibold rounded-r-lg">รายละเอียดเพิ่มเติม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]">
                {stats.audit.slice(0, 8).map((entry, idx) => {
                  const { label, tagColor } = formatAuditAction(entry.action);
                  return (
                    <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-3 text-[#756F66] whitespace-nowrap font-mono">
                        {formatThaiTime(entry.ts)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block rounded-lg border px-2.5 py-1 text-[11px] font-medium ${tagColor}`}>
                          {label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#29261F] font-mono text-[11px] truncate max-w-md">
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
