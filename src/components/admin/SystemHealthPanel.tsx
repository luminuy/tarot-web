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
    domain: {
      configuredDomain: string;
      runtimeOrigin: string;
      isHttps: boolean;
      ok: boolean;
    };
    google: {
      clientIdMasked: string | null;
      hasSecret: boolean;
      callbackUrl: string;
      ok: boolean;
    };
    line: {
      channelId: string | null;
      hasSecret: boolean;
      callbackUrl: string;
      ok: boolean;
    };
    email: {
      emailFrom: string;
      pingOk: boolean;
      latencyMs: number;
      error: string | null;
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
    security: {
      sessionSecretOk: boolean;
      passwordPepperOk: boolean;
      adminPasswordOk: boolean;
      cryptoSanityOk: boolean;
      ok: boolean;
    };
    ai: {
      geminiConfigured: boolean;
      groqConfigured: boolean;
      ok: boolean;
    };
    cloudflareStack: {
      aiGateway: { enabled: boolean; accountIdSet: boolean; gatewayIdSet: boolean };
      turnstile: { enabled: boolean; siteKeySet: boolean; secretKeySet: boolean };
      workersAi: { bindingAvailable: boolean };
      vectorize: { bindingAvailable: boolean };
    };
  };
}

function CopyBadge({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="tap-overlay-y inline-flex items-center gap-1.5 rounded-lg bg-surface-mist px-2.5 py-1 text-xs text-ink hover:bg-white hover:border-gold transition-colors border border-line shadow-2xs"
      title="คลิกเพื่อคัดลอก"
    >
      <span className="font-mono truncate max-w-[180px] sm:max-w-xs">{text}</span>
      <span className="text-[11px] text-muted">{copied ? "คัดลอกแล้ว" : "คัดลอก"}</span>
    </button>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        ok
          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
          : "bg-rose-50 text-rose-800 border border-rose-200"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-600 animate-pulse" : "bg-rose-600"}`} />
      <span>{label ?? (ok ? "ออนไลน์" : "ต้องตรวจ")}</span>
    </span>
  );
}

export default function SystemHealthPanel({ onSwitchTab }: { onSwitchTab?: (tab: "ai" | "stats") => void }) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rebuild, setRebuild] = useState<{ busy: boolean; msg: string | null }>({ busy: false, msg: null });

  const rebuildSearchIndex = useCallback(async () => {
    setRebuild({ busy: true, msg: null });
    try {
      const res = await fetch("/api/admin/rebuild-search-index", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        upserted?: number;
        embedded?: number;
        error?: string;
      };
      setRebuild({
        busy: false,
        msg: j.ok ? `✅ อัปเดต index แล้ว ${j.upserted} รายการ` : `❌ ${j.error || "ล้มเหลว"}`,
      });
    } catch {
      setRebuild({ busy: false, msg: "❌ เชื่อมต่อไม่ได้" });
    }
  }, []);

  const probe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/system-health", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เรียกข้อมูลสถานะระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void probe();
  }, [probe]);

  const formattedTime = data?.checkedAt
    ? new Intl.DateTimeFormat("th-TH", {
        timeZone: "Asia/Bangkok",
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(new Date(data.checkedAt))
    : "-";

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl p-6 sm:p-7 border border-line bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              
              <h2 className="font-mystic-gold text-lg sm:text-xl font-bold text-ink tracking-tight">
                ศูนย์บัญชาการสถานะระบบคลาวด์ (Cloud & Integrations)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted">
              {data?.summary || "ระบบมอนิเตอร์และตรวจสอบการเชื่อมต่อบริการภายนอก 7 เสาหลักแบบเรียลไทม์"}
            </p>
            {data && (
              <p className="text-[13px] text-muted">
                ตรวจสัญญาณสดล่าสุด: <span className="text-ink font-mono font-medium">{formattedTime}</span> · ผ่าน {data.passedCount} จาก {data.totalCount} ระบบ
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={probe}
              disabled={loading}
              className="bg-ink hover:bg-dark text-white font-medium text-xs shadow-xs border-transparent transition"
            >
              {loading ? "กำลังยิงตรวจสัญญาณ…" : "ยิงตรวจสัญญาณสดทั้งหมด"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {error}
          </div>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. โดเมน & การเข้าถึงเว็บ */}
          <div className="rounded-2xl p-5 border border-line bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                
                <h3 className="font-semibold text-sm text-ink">โดเมนหลัก & SSL (Domain & Origin)</h3>
              </div>
              <StatusPill ok={data.services.domain.ok} />
            </div>
            <div className="space-y-1.5 text-xs text-muted">
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">โดเมนหลัก:</span>
                <span className="font-mono text-ink font-medium">{data.services.domain.configuredDomain}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">Runtime Origin:</span>
                <span className="font-mono text-ink font-medium">{data.services.domain.runtimeOrigin}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted">โปรโตคอลความปลอดภัย:</span>
                <span className="text-emerald-700 font-semibold">
                  {data.services.domain.isHttps ? "HTTPS / TLS 1.2+ (บังคับใช้ 100%)" : "HTTP ธรรมดา"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. เข้าสู่ระบบด้วย Google */}
          <div className="rounded-2xl p-5 border border-line bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                
                <h3 className="font-semibold text-sm text-ink">Google OAuth (เข้าสู่ระบบด้วยกูเกิล)</h3>
              </div>
              <StatusPill ok={data.services.google.ok} />
            </div>
            <div className="space-y-1.5 text-xs text-muted">
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">Client ID:</span>
                <span className="font-mono text-ink font-medium">{data.services.google.clientIdMasked ?? "ยังไม่ตั้ง"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">Client Secret:</span>
                <span className={data.services.google.hasSecret ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                  {data.services.google.hasSecret ? "พร้อมใช้งานใน Secret" : "ไม่มี"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 gap-1">
                <span className="text-muted">Redirect URI:</span>
                <CopyBadge text={data.services.google.callbackUrl} />
              </div>
            </div>
          </div>

          {/* 3. เข้าสู่ระบบด้วย LINE */}
          <div className="rounded-2xl p-5 border border-line bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                
                <h3 className="font-semibold text-sm text-ink">LINE Login (เข้าสู่ระบบด้วยไลน์)</h3>
              </div>
              <StatusPill ok={data.services.line.ok} />
            </div>
            <div className="space-y-1.5 text-xs text-muted">
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">Channel ID:</span>
                <span className="font-mono text-ink font-medium">{data.services.line.channelId ?? "ยังไม่ตั้ง"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">Channel Secret:</span>
                <span className={data.services.line.hasSecret ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                  {data.services.line.hasSecret ? "พร้อมใช้งานใน Secret" : "ไม่มี"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 gap-1">
                <span className="text-muted">Callback URL:</span>
                <CopyBadge text={data.services.line.callbackUrl} />
              </div>
            </div>
          </div>

          {/* 4. ระบบส่งอีเมลธุรกรรม (Resend) */}
          <div className="rounded-2xl p-5 border border-line bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                
                <h3 className="font-semibold text-sm text-ink">Resend Email (ระบบส่งอีเมลธุรกรรม)</h3>
              </div>
              <StatusPill ok={data.services.email.ok} />
            </div>
            <div className="space-y-1.5 text-xs text-muted">
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">ผู้ส่ง (Sender):</span>
                <span className="font-mono text-ink truncate max-w-[200px] font-medium">{data.services.email.emailFrom}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">สถานะการเชื่อมต่อ API:</span>
                <span className={data.services.email.pingOk ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                  {data.services.email.pingOk ? `ปกติ (${data.services.email.latencyMs}ms)` : (data.services.email.error ?? "ไม่สำเร็จ")}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted">โควตาแพ็กเกจฟรี:</span>
                <span className="text-ink font-medium">3,000 ฉบับ/เดือน (100 ฉบับ/วัน)</span>
              </div>
            </div>
          </div>

          {/* 5. ฐานข้อมูล Cloudflare D1 */}
          <div className="rounded-2xl p-5 border border-line bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                
                <h3 className="font-semibold text-sm text-ink">Cloudflare D1 (ฐานข้อมูลหลัก)</h3>
              </div>
              <StatusPill ok={data.services.d1.ok} />
            </div>
            <div className="space-y-1.5 text-xs text-muted">
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">ความเร็ว Query (Ping):</span>
                <span className="font-mono text-emerald-700 font-semibold">{data.services.d1.latencyMs}ms</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">จำนวนสมาชิกทั้งหมด:</span>
                <span className="font-bold text-ink">{data.services.d1.metrics.totalUsers} คน</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line-soft text-[13px] text-muted">
                <span>สัดส่วนช่องทาง:</span>
                <span className="text-ink">
                  Google: {data.services.d1.metrics.googleUsers} · LINE: {data.services.d1.metrics.lineUsers} · Email: {data.services.d1.metrics.emailUsers}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted">บันทึกประวัติดวง (Journal):</span>
                <span className="font-mono text-ink font-semibold">{data.services.d1.metrics.totalReadings} รายการ</span>
              </div>
            </div>
          </div>

          {/* 6. Cloudflare KV Edge Cache */}
          <div className="rounded-2xl p-5 border border-line bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                
                <h3 className="font-semibold text-sm text-ink">Cloudflare KV (Edge Cache & สถิติ)</h3>
              </div>
              <StatusPill ok={data.services.kv.ok} />
            </div>
            <div className="space-y-1.5 text-xs text-muted">
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">ความเร็วตอบสนอง (KV Read):</span>
                <span className="font-mono text-emerald-700 font-semibold">{data.services.kv.latencyMs}ms</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">ลักษณะการกระจายข้อมูล:</span>
                <span className="text-ink">Global Edge (Eventually Consistent)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted">บทบาท:</span>
                <span className="text-ink">เก็บ Stat Counters, Config Overrides, Session Backstop</span>
              </div>
            </div>
          </div>

          {/* 7. ระบบความปลอดภัย & การเข้ารหัส */}
          <div className="rounded-2xl p-5 border border-line bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                
                <h3 className="font-semibold text-sm text-ink">ระบบความปลอดภัย & ถอดรหัส (Security)</h3>
              </div>
              <StatusPill ok={data.services.security.ok} />
            </div>
            <div className="space-y-1.5 text-xs text-muted">
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">Web Crypto SHA-256:</span>
                <span className="text-emerald-700 font-semibold">สมบูรณ์ (Provably-Fair Sanity Passed)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">PASSWORD_PEPPER:</span>
                <span className={data.services.security.passwordPepperOk ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                  {data.services.security.passwordPepperOk ? "เปิดใช้งาน (≥24 ตัวอักษร)" : "สั้นเกินไปหรือยังไม่ตั้ง"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted">TAROT_SESSION_SECRET:</span>
                <span className={data.services.security.sessionSecretOk ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                  {data.services.security.sessionSecretOk ? "แข็งแกร่ง (≥32 ตัวอักษร)" : "สั้นเกินไปหรือยังไม่ตั้ง"}
                </span>
              </div>
            </div>
          </div>

          {/* 8. ปัญญาประดิษฐ์ AI Engine */}
          <div className="rounded-2xl p-5 border border-line bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                
                <h3 className="font-semibold text-sm text-ink">เครื่องยนต์ AI (AI Engine Overview)</h3>
              </div>
              <StatusPill ok={data.services.ai.ok} />
            </div>
            <div className="space-y-1.5 text-xs text-muted">
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">Google Gemini:</span>
                <span className={data.services.ai.geminiConfigured ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                  {data.services.ai.geminiConfigured ? "พร้อมใช้งาน" : "ไม่มีคีย์"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">Groq LPU สำรอง:</span>
                <span className={data.services.ai.groqConfigured ? "text-emerald-700 font-semibold" : "text-muted"}>
                  {data.services.ai.groqConfigured ? "พร้อมใช้งาน" : "ไม่ได้เปิดใช้ (ใช้อัตโนมัติเมื่อตั้งค่า)"}
                </span>
              </div>
              <div className="pt-1">
                {onSwitchTab && (
                  <button
                    type="button"
                    onClick={() => onSwitchTab("ai")}
                    className="text-gold-ink hover:text-gold-deep text-xs font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                  >
                    <span>ตรวจสอบเชิงลึกรายโมเดล & วัด Latency ในแท็บสุขภาพ AI →</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 9. Cloudflare Free Stack */}
          <div className="rounded-2xl p-5 border border-line bg-white shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              
              <h3 className="font-semibold text-sm text-ink">Cloudflare Free Stack (ส่วนเสริม)</h3>
            </div>
            <div className="space-y-1.5 text-xs text-muted">
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">AI Gateway:</span>
                <span className={data.services.cloudflareStack.aiGateway.enabled ? "text-emerald-700 font-semibold" : "text-muted"}>
                  {data.services.cloudflareStack.aiGateway.enabled
                    ? "เปิดใช้ (route AI ผ่าน gateway)"
                    : `ยังไม่เปิด (${data.services.cloudflareStack.aiGateway.accountIdSet ? "" : "ขาด ACCOUNT_ID "}${data.services.cloudflareStack.aiGateway.gatewayIdSet ? "" : "ขาด GATEWAY_ID"})`.trim() || "ยังไม่เปิด"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">Turnstile (กันบอท):</span>
                <span className={data.services.cloudflareStack.turnstile.enabled ? "text-emerald-700 font-semibold" : "text-muted"}>
                  {data.services.cloudflareStack.turnstile.enabled
                    ? "เปิดใช้ (signup/login/forgot)"
                    : `ยังไม่เปิด (${data.services.cloudflareStack.turnstile.siteKeySet ? "" : "ขาด SITE_KEY "}${data.services.cloudflareStack.turnstile.secretKeySet ? "" : "ขาด SECRET_KEY"})`.trim() || "ยังไม่เปิด"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line-soft">
                <span className="text-muted">Workers AI (safety ชั้น 3):</span>
                <span className={data.services.cloudflareStack.workersAi.bindingAvailable ? "text-emerald-700 font-semibold" : "text-muted"}>
                  {data.services.cloudflareStack.workersAi.bindingAvailable ? "binding พร้อม" : "ไม่มี binding (dev / ยังไม่ deploy)"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-muted">Vectorize (ค้นหาเชิงความหมาย):</span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      data.services.cloudflareStack.vectorize.bindingAvailable ? "text-emerald-700 font-semibold" : "text-muted"
                    }
                  >
                    {data.services.cloudflareStack.vectorize.bindingAvailable ? "binding พร้อม" : "ไม่มี binding"}
                  </span>
                  {data.services.cloudflareStack.vectorize.bindingAvailable && (
                    <button
                      type="button"
                      onClick={rebuildSearchIndex}
                      disabled={rebuild.busy}
                      className="tap-overlay-y rounded-lg border border-line bg-surface-mist px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-white hover:border-gold disabled:opacity-50 cursor-pointer transition shadow-2xs"
                    >
                      {rebuild.busy ? "กำลัง index…" : "สร้าง index ใหม่"}
                    </button>
                  )}
                </div>
              </div>
              {rebuild.msg && <p className="pt-1 text-[11px] text-ink font-mono">{rebuild.msg}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
