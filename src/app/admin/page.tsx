"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

const StatsDashboard = dynamic(() => import("@/components/admin/StatsDashboard"), {
  ssr: false,
  loading: () => <p className="text-sm text-[#9c93b8]">กำลังโหลดแดชบอร์ด…</p>,
});
const ContentEditor = dynamic(() => import("@/components/admin/ContentEditor"), {
  ssr: false,
  loading: () => <p className="text-sm text-[#9c93b8]">กำลังโหลดตัวแก้เนื้อหา…</p>,
});
const ReadersManager = dynamic(() => import("@/components/admin/ReadersManager"), {
  ssr: false,
  loading: () => <p className="text-sm text-[#9c93b8]">กำลังโหลดรายการแม่หมอ…</p>,
});

type Tab = "stats" | "content" | "readers";

const TABS: { id: Tab; label: string }[] = [
  { id: "stats", label: "สถิติ" },
  { id: "content", label: "เนื้อหา (prompt / ไพ่ / AI)" },
  { id: "readers", label: "แม่หมอ (Marketplace)" },
];

export default function AdminHome() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "denied">("loading");
  const [tab, setTab] = useState<Tab>("stats");

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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-mystic-gold text-lg font-bold sm:text-xl">✦ แผงแอดมิน</h1>
        <Button variant="ghost" size="sm" onClick={logout}>
          ออกจากระบบ
        </Button>
      </header>

      <nav className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.id
                ? "border-[#ffd700]/70 bg-[#e5c07b]/15 text-[#f5deaa]"
                : "border-[#e5c07b]/25 text-[#9c93b8] hover:border-[#ffd700]/40 hover:text-[#e5c07b]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="mt-6">
        {tab === "stats" ? (
          <StatsDashboard />
        ) : tab === "content" ? (
          <ContentEditor />
        ) : (
          <ReadersManager />
        )}
      </section>
    </div>
  );
}
