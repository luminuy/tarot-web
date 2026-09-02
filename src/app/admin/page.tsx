"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

const StatsDashboard = dynamic(() => import("@/components/admin/StatsDashboard"), {
  ssr: false,
  loading: () => <p className="text-sm text-[#9c93b8]">กำลังโหลดแดชบอร์ด…</p>,
});
const SystemHealthPanel = dynamic(() => import("@/components/admin/SystemHealthPanel"), {
  ssr: false,
  loading: () => <p className="text-sm text-[#9c93b8]">กำลังตรวจสถานะระบบ…</p>,
});
const ContentEditor = dynamic(() => import("@/components/admin/ContentEditor"), {
  ssr: false,
  loading: () => <p className="text-sm text-[#9c93b8]">กำลังโหลดตัวแก้เนื้อหา…</p>,
});
const ReadersManager = dynamic(() => import("@/components/admin/ReadersManager"), {
  ssr: false,
  loading: () => <p className="text-sm text-[#9c93b8]">กำลังโหลดรายการแม่หมอ…</p>,
});
const EntitlementAdmin = dynamic(() => import("@/components/admin/EntitlementAdmin"), {
  ssr: false,
  loading: () => <p className="text-sm text-[#9c93b8]">กำลังโหลด…</p>,
});
const AiHealthPanel = dynamic(() => import("@/components/admin/AiHealthPanel"), {
  ssr: false,
  loading: () => <p className="text-sm text-[#9c93b8]">กำลังโหลด…</p>,
});

type Tab = "system" | "stats" | "content" | "readers" | "entitlement" | "ai";

const TABS: { id: Tab; label: string }[] = [
  { id: "system", label: "✦ สถานะระบบ (Cloud Health)" },
  { id: "stats", label: "สถิติ" },
  { id: "content", label: "เนื้อหา (prompt / ไพ่ / AI)" },
  { id: "readers", label: "แม่หมอ (Marketplace)" },
  { id: "entitlement", label: "สิทธิ์เปิดไพ่" },
  { id: "ai", label: "สุขภาพ AI" },
];

export default function AdminHome() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "denied">("loading");
  const [tab, setTab] = useState<Tab>("system");

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.admin) setState("ready");
        else {
          setState("denied");
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        setState("denied");
        router.replace("/admin/login");
      });
  }, [router]);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
  }, [router]);

  if (state !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#9c93b8]">
        กำลังตรวจสอบสิทธิ์…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5c07b]/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#ffd700] text-xl">✦</span>
            <h1 className="font-mystic-gold text-lg sm:text-2xl font-bold tracking-wide text-white">
              แผงควบคุมระบบ SeerTarot
            </h1>
          </div>
          <p className="text-xs text-[#9c93b8] mt-1 font-serif-th">
            ศูนย์บริหารจัดการ วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์ระดับพรีเมียม (seertarot.net)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e5c07b]/30 bg-[#170e2a] px-3 py-1.5 text-xs text-[#f5deaa] hover:border-[#ffd700] hover:text-white transition-colors"
          >
            <span>✦ เปิดหน้าเว็บจริง</span>
            <span className="text-[10px] text-[#9c93b8]">↗</span>
          </a>
          <Button variant="ghost" size="sm" onClick={logout} className="text-xs text-[#9c93b8] hover:text-rose-300">
            ออกจากระบบ
          </Button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              tab === t.id
                ? "border-[#ffd700] bg-[#e5c07b]/20 text-[#ffd700] shadow-[0_0_15px_rgba(229,192,123,0.2)]"
                : "border-[#e5c07b]/25 text-[#9c93b8] hover:border-[#ffd700]/40 hover:text-[#e5c07b]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="pt-2">
        {tab === "system" ? (
          <SystemHealthPanel onSwitchTab={(t) => setTab(t)} />
        ) : tab === "stats" ? (
          <StatsDashboard />
        ) : tab === "content" ? (
          <ContentEditor />
        ) : tab === "readers" ? (
          <ReadersManager />
        ) : tab === "ai" ? (
          <AiHealthPanel />
        ) : (
          <EntitlementAdmin />
        )}
      </section>
    </div>
  );
}
