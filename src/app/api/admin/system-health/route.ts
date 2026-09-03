import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { SITE_DOMAIN, DEFAULT_EMAIL_FROM } from "@/lib/config/site";
import { resolveAppOrigin } from "@/lib/security/app-origin";
import { getAppDB } from "@/lib/platform/db";
import { getAppKV } from "@/lib/platform/cf";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const origin = resolveAppOrigin(request);
  const checkedAt = new Date().toISOString();

  // 1. Domain & Origin
  const appOriginEnv = process.env.APP_ORIGIN;
  const domainHealth = {
    configuredDomain: SITE_DOMAIN,
    runtimeOrigin: origin,
    appOriginEnv: appOriginEnv || null,
    isHttps: origin.startsWith("https://"),
    ok: origin.includes(SITE_DOMAIN) || origin.includes("localhost"),
  };

  // 2. Google OAuth
  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleHealth = {
    configured: Boolean(googleClientId && googleClientSecret),
    clientIdMasked: googleClientId ? `${googleClientId.slice(0, 14)}...` : null,
    hasSecret: Boolean(googleClientSecret),
    callbackUrl: `${origin}/api/auth/google/callback`,
    ok: Boolean(googleClientId && googleClientSecret),
  };

  // 3. LINE Login
  const lineChannelId = process.env.LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
  const lineChannelSecret = process.env.LINE_CHANNEL_SECRET;
  const lineHealth = {
    configured: Boolean(lineChannelId && lineChannelSecret),
    channelId: lineChannelId ? String(lineChannelId) : null,
    hasSecret: Boolean(lineChannelSecret),
    callbackUrl: `${origin}/api/auth/line/callback`,
    ok: Boolean(lineChannelId && lineChannelSecret),
  };

  // 4. Resend Email Service
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM;
  let resendPingOk = false;
  let resendLatencyMs = 0;
  let resendError: string | null = null;
  let verifiedDomainsCount = 0;

  if (resendApiKey) {
    const startPing = Date.now();
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${resendApiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      resendLatencyMs = Date.now() - startPing;
      if (res.ok) {
        resendPingOk = true;
        const data = (await res.json().catch(() => ({}))) as { data?: Array<{ status?: string }> };
        if (Array.isArray(data.data)) {
          verifiedDomainsCount = data.data.filter((d) => d.status === "verified").length;
        }
      } else {
        resendError = `Resend API HTTP ${res.status}`;
      }
    } catch (err) {
      resendLatencyMs = Date.now() - startPing;
      resendError = err instanceof Error ? err.message : "เชื่อมต่อ Resend ล้มเหลว";
    }
  }

  const emailHealth = {
    configured: Boolean(resendApiKey),
    emailFrom,
    pingOk: resendPingOk,
    latencyMs: resendLatencyMs,
    verifiedDomainsCount,
    error: resendError,
    ok: Boolean(resendApiKey && (resendPingOk || !resendError)),
  };

  // 5. Cloudflare D1 Database
  let d1PingOk = false;
  let d1LatencyMs = 0;
  let d1Error: string | null = null;
  let d1Metrics = {
    totalUsers: 0,
    googleUsers: 0,
    lineUsers: 0,
    emailUsers: 0,
    totalReadings: 0,
    readingUsage: 0,
  };

  try {
    const db = await getAppDB();
    const startDb = Date.now();
    await db.prepare("SELECT 1 as ping").first();
    d1LatencyMs = Date.now() - startDb;
    d1PingOk = true;

    // Fetch user counts safely
    const [uAll, uGoogle, uLine, uEmail, rTotal, rUsage] = await Promise.all([
      db.prepare("SELECT count(*) as c FROM users WHERE deleted_at IS NULL").first<{ c: number }>().catch(() => null),
      db.prepare("SELECT count(*) as c FROM users WHERE provider = 'google' AND deleted_at IS NULL").first<{ c: number }>().catch(() => null),
      db.prepare("SELECT count(*) as c FROM users WHERE provider = 'line' AND deleted_at IS NULL").first<{ c: number }>().catch(() => null),
      db.prepare("SELECT count(*) as c FROM users WHERE provider = 'email' AND deleted_at IS NULL").first<{ c: number }>().catch(() => null),
      db.prepare("SELECT count(*) as c FROM reading_journal").first<{ c: number }>().catch(() => null),
      db.prepare("SELECT count(*) as c FROM reading_usage").first<{ c: number }>().catch(() => null),
    ]);

    d1Metrics = {
      totalUsers: uAll?.c ?? 0,
      googleUsers: uGoogle?.c ?? 0,
      lineUsers: uLine?.c ?? 0,
      emailUsers: uEmail?.c ?? 0,
      totalReadings: rTotal?.c ?? 0,
      readingUsage: rUsage?.c ?? 0,
    };
  } catch (err) {
    d1Error = err instanceof Error ? err.message : "เรียกฐานข้อมูล D1 ล้มเหลว";
  }

  const d1Health = {
    pingOk: d1PingOk,
    latencyMs: d1LatencyMs,
    metrics: d1Metrics,
    error: d1Error,
    ok: d1PingOk,
  };

  // 6. Cloudflare KV Store
  let kvPingOk = false;
  let kvLatencyMs = 0;
  let kvError: string | null = null;

  try {
    const kv = await getAppKV();
    const startKv = Date.now();
    await kv.get("app:stat:all");
    kvLatencyMs = Date.now() - startKv;
    kvPingOk = true;
  } catch (err) {
    kvError = err instanceof Error ? err.message : "เข้าถึง KV ล้มเหลว";
  }

  const kvHealth = {
    pingOk: kvPingOk,
    latencyMs: kvLatencyMs,
    error: kvError,
    ok: kvPingOk,
  };

  // 7. Security & Cryptography Engine
  const sessionSecret = process.env.TAROT_SESSION_SECRET;
  const passwordPepper = process.env.PASSWORD_PEPPER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Test SHA-256 Web Crypto Sanity
  let cryptoSanityOk = false;
  try {
    const sample = new TextEncoder().encode("seertarot");
    const digest = await crypto.subtle.digest("SHA-256", sample);
    cryptoSanityOk = digest.byteLength === 32;
  } catch {
    cryptoSanityOk = false;
  }

  const securityHealth = {
    sessionSecretOk: Boolean(sessionSecret && sessionSecret.length >= 32),
    passwordPepperOk: Boolean(passwordPepper && passwordPepper.length >= 24),
    adminPasswordOk: Boolean(adminPassword && adminPassword.length >= 12),
    cryptoSanityOk,
    ok: Boolean(
      sessionSecret && sessionSecret.length >= 32 &&
      passwordPepper && passwordPepper.length >= 24 &&
      adminPassword && adminPassword.length >= 12 &&
      cryptoSanityOk
    ),
  };

  // 8. AI Engines (Gemini & Groq)
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const aiHealth = {
    geminiConfigured: Boolean(geminiKey),
    groqConfigured: Boolean(groqKey),
    ok: Boolean(geminiKey || groqKey),
  };

  // 9. Cloudflare Free Stack (ส่วนเสริม — ไม่นับเป็น critical · ไม่ตั้ง = ระบบเดิมทำงานปกติ)
  const { isAiGatewayEnabled } = await import("@/lib/ai/gateway");
  const { isTurnstileConfigured } = await import("@/lib/security/turnstile");
  const { getAiBinding, getVectorizeBinding } = await import("@/lib/platform/cf");
  const [workersAiBinding, vectorizeBinding] = await Promise.all([
    getAiBinding(),
    getVectorizeBinding(),
  ]);

  const cloudflareStackHealth = {
    aiGateway: {
      enabled: isAiGatewayEnabled(),
      accountIdSet: Boolean(process.env.CF_AI_GATEWAY_ACCOUNT_ID),
      gatewayIdSet: Boolean(process.env.CF_AI_GATEWAY_ID),
    },
    turnstile: {
      enabled: isTurnstileConfigured(),
      siteKeySet: Boolean(process.env.TURNSTILE_SITE_KEY),
      secretKeySet: Boolean(process.env.TURNSTILE_SECRET_KEY),
    },
    workersAi: {
      bindingAvailable: Boolean(workersAiBinding),
    },
    vectorize: {
      bindingAvailable: Boolean(vectorizeBinding),
    },
  };

  // Overall System Status Assessment
  const criticalSystems = [
    domainHealth.ok,
    googleHealth.ok,
    lineHealth.ok,
    emailHealth.ok,
    d1Health.ok,
    kvHealth.ok,
    securityHealth.ok,
    aiHealth.ok,
  ];
  const passedCount = criticalSystems.filter(Boolean).length;
  const totalCount = criticalSystems.length;

  let overallStatus: "healthy" | "degraded" | "critical" = "healthy";
  let summary = "ทุกระบบภายนอกและบริการคลาวด์ออนไลน์สมบูรณ์ 100%";

  if (passedCount === totalCount) {
    overallStatus = "healthy";
  } else if (passedCount >= 6) {
    overallStatus = "degraded";
    summary = `ระบบส่วนใหญ่ทำงานได้ (${passedCount}/${totalCount}) แต่มีบางบริการที่ควรตรวจสอบ`;
  } else {
    overallStatus = "critical";
    summary = `พบข้อบกพร่องหลายจุด (${passedCount}/${totalCount}) ต้องการการตรวจสอบด่วน`;
  }

  return NextResponse.json({
    overallStatus,
    passedCount,
    totalCount,
    summary,
    checkedAt,
    services: {
      domain: domainHealth,
      google: googleHealth,
      line: lineHealth,
      email: emailHealth,
      d1: d1Health,
      kv: kvHealth,
      security: securityHealth,
      ai: aiHealth,
      cloudflareStack: cloudflareStackHealth,
    },
  });
}
