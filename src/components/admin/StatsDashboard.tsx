"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PERSONAS } from "@/data/personas";
import { SPREADS } from "@/data/spreads";

interface StatsSnapshot {
  allTime: Record<string, number>;
  range: Record<string, number>;
  rangeDays: number;
  daily: Record<string, Record<string, number>>;
  generatedAt: number;
}
interface AuditEntry {
  ts: number;
  action: string;
  detail?: string;
}

const SPREAD_NAME = Object.fromEntries(SPREADS.map((s) => [s.id, s.nameTh]));
const PERSONA_NAME = Object.fromEntries(PERSONAS.map((p) => [p.id, p.nameTh]));
const CATEGORY_NAME: Record<string, string> = {
  general: "ทั่วไป",
  love: "ความรัก",
  work: "การงาน",
  money: "การเงิน",
  self: "ตัวเอง",
};
const FLAG_NAME: Record<string, string> = {
  crisis: "สัญญาณวิกฤต (1323)",
  medical: "สุขภาพ/การแพทย์",
  legal: "กฎหมาย/คดี",
  gambling: "หวย/พนัน/หุ้น",
  third_party: "เรื่องบุคคลที่สาม",
};

function n(v: number | undefined) {
  return (v ?? 0).toLocaleString("th-TH");
}

function pct(part: number, whole: number) {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

function breakdown(src: Record<string, number>, prefix: string) {
  return Object.entries(src)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, count]) => ({ key: k.slice(prefix.length), count }))
    .sort((a, b) => b.count - a.count);
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[#D5CEC2] bg-white p-4 shadow-xs">
      <p className="text-xs font-semibold text-[#635B4E]">{label}</p>
      <p className="mt-1 text-2xl font-bold font-mono text-[#29261F]">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-[#756F66]">{sub}</p> : null}
    </div>
  );
}

function BarList({
  title,
  rows,
  nameMap,
}: {
  title: string;
  rows: { key: string; count: number }[];
  nameMap?: Record<string, string>;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-2xl border border-[#D5CEC2] bg-white p-5 shadow-xs">
      <h3 className="font-mystic-gold text-sm font-bold text-[#29261F]">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-[#756F66]">ยังไม่มีข้อมูล</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-xs font-medium text-[#29261F]" title={nameMap?.[r.key] ?? r.key}>
                {nameMap?.[r.key] ?? r.key}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#EAE7E0]">
                <span
                  className="block h-full rounded-full bg-[#A58A5C]"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-right text-xs font-mono text-[#635B4E]">{n(r.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function StatsDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<{
    stats: StatsSnapshot;
    audit: AuditEntry[];
    aiCapToday?: number;
    aiDailyCap?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/stats?days=${d}`);
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
    } catch {
      setErr("โหลดสถิติไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const view = useMemo(() => {
    if (!data) return null;
    const r = data.stats.range;
    const started = r.reading_started ?? 0;
    const completed = r.reading_completed ?? 0;
    const failed = r.reading_failed ?? 0;
    const blocked = r.reading_blocked ?? 0;
    const tokIn = r.ai_tokens_in ?? 0;
    const tokOut = r.ai_tokens_out ?? 0;
    const latSum = r.ai_latency_ms ?? 0;
    const groqCalls = r["ai_call:groq"] ?? 0;
    const geminiCalls = r["ai_call:gemini"] ?? 0;
    const aiCalls = groqCalls + geminiCalls;
    const aiCapHit = r.ai_cap_hit ?? 0;
    const foreignTrips = breakdown(r, "ai_foreign_trip:").filter((x) => x.key === "groq").reduce((s, x) => s + x.count, 0);
    const schemaFails = breakdown(r, "ai_schema_fail:").filter((x) => x.key === "groq").reduce((s, x) => s + x.count, 0);
    return {
      started,
      completed,
      failed,
      blocked,
      completionRate: pct(completed, started),
      tokens: tokIn + tokOut,
      avgLatency: completed ? `${Math.round(latSum / completed)}ms` : "-",
      groqCalls,
      geminiCalls,
      groqShare: pct(groqCalls, aiCalls),
      groqFailover: r.ai_failover_groq_to_gemini ?? 0,
      foreignTrips,
      schemaFails,
      aiErrors: (r["ai_error:gemini"] ?? 0) + (r["ai_error:groq"] ?? 0),
      aiCapHit,
      chat: r.chat_message ?? 0,
      spreads: breakdown(r, "spread:"),
      personas: breakdown(r, "persona:"),
      categories: breakdown(r, "category:"),
      flags: breakdown(r, "safety_flag:"),
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                days === d
                  ? "bg-[#29261F] text-white shadow-xs"
                  : "border border-[#D5CEC2] bg-[#FAF8F5] text-[#635B4E] hover:bg-white hover:text-[#29261F]"
              }`}
            >
              {d} วัน
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => load(days)}
          className="text-xs text-[#635B4E] hover:text-[#29261F] font-medium"
          disabled={loading}
        >
          {loading ? "กำลังโหลด…" : "รีเฟรชข้อมูล"}
        </button>
      </div>

      {err ? <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">{err}</p> : null}

      {view ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label={`เริ่มดูดวง (${days} วัน)`} value={n(view.started)} />
            <StatCard label="อ่านจบสมบูรณ์" value={n(view.completed)} sub={`${view.completionRate} ของที่เริ่ม`} />
            <StatCard label="ล้มเหลว / ถูกบล็อก" value={`${n(view.failed)} / ${n(view.blocked)}`} />
            <StatCard label="แชทถามต่อ" value={n(view.chat)} />
            <StatCard
              label="โควตา AI วันนี้ (Cap)"
              value={`${n(data?.aiCapToday ?? 0)} / ${n(data?.aiDailyCap ?? 2000)}`}
              sub={view.aiCapHit > 0 ? `เต็มโควตา ${n(view.aiCapHit)} ครั้ง` : "ใช้งานปกติ"}
            />
            <StatCard
              label="เรียก AI (Groq / Gemini)"
              value={`${n(view.groqCalls)} / ${n(view.geminiCalls)}`}
              sub={`Groq ${view.groqShare} · ผิดพลาด ${n(view.aiErrors)} ครั้ง`}
            />
            <StatCard
              label="Groq เอนจิน — สุขภาพ"
              value={`${n(view.groqFailover)} failover`}
              sub={`ตัดวงจรอักษรแปลก ${n(view.foreignTrips)} · schema fail ${n(view.schemaFails)}`}
            />
            <StatCard label="เวลาเฉลี่ย/คำอ่าน" value={view.avgLatency} />
            <StatCard label="Token รวม" value={n(view.tokens)} sub="in + out" />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <BarList title="ผังที่ถูกเลือก" rows={view.spreads} nameMap={SPREAD_NAME} />
            <BarList title="บุคลิกแม่หมอ" rows={view.personas} nameMap={PERSONA_NAME} />
            <BarList title="หมวดคำถาม" rows={view.categories} nameMap={CATEGORY_NAME} />
            <BarList title="ธงความปลอดภัยที่ตรวจพบ" rows={view.flags} nameMap={FLAG_NAME} />
          </div>

          <div className="rounded-2xl border border-[#D5CEC2] bg-white p-5 shadow-xs">
            <h3 className="font-mystic-gold text-sm font-bold text-[#29261F]">บันทึกการเข้าแอดมิน (ล่าสุด)</h3>
            <ul className="mt-3 flex flex-col gap-2 text-xs">
              {data!.audit.length === 0 ? (
                <li className="text-[#756F66]">ยังไม่มีบันทึก</li>
              ) : (
                data!.audit.slice(0, 20).map((a, i) => (
                  <li key={i} className="flex justify-between gap-3 border-b border-[#E8E2D8] pb-1.5 last:border-0 last:pb-0">
                    <span className="text-[#29261F] font-mono">{a.action}</span>
                    <span className="tabular-nums text-[#756F66]">{new Date(a.ts).toLocaleString("th-TH")}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      ) : loading ? (
        <p className="text-sm text-[#635B4E]">กำลังโหลดสถิติ…</p>
      ) : null}
    </div>
  );
}
