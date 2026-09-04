"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

// Dynamic Admin Panels
const AdminOverview = dynamic(() => import("@/components/admin/AdminOverview"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดภาพรวมระบบ…" />,
});
const StatsDashboard = dynamic(() => import("@/components/admin/StatsDashboard"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดสถิติ…" />,
});
const SystemHealthPanel = dynamic(() => import("@/components/admin/SystemHealthPanel"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังตรวจสุขภาพระบบ…" />,
});
const AiHealthPanel = dynamic(() => import("@/components/admin/AiHealthPanel"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังตรวจสุขภาพ AI…" />,
});
const ContentEditor = dynamic(() => import("@/components/admin/ContentEditor"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดตัวแก้เนื้อหา…" />,
});
const ReadersManager = dynamic(() => import("@/components/admin/ReadersManager"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดรายชื่อหมอดู…" />,
});
const EntitlementAdmin = dynamic(() => import("@/components/admin/EntitlementAdmin"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดสิทธิ์และโควตา…" />,
});
const MarketingAudience = dynamic(() => import("@/components/admin/MarketingAudience"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดระบบข่าวสาร…" />,
});

function AdminLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#A58A5C] border-t-transparent mb-3" />
      <p className="text-xs text-[#635B4E] font-sans">{label}</p>
    </div>
  );
}

export type TabId =
  | "overview"
  | "stats"
  | "health"
  | "content"
  | "entitlement"
  | "readers"
  | "marketing";

interface NavItem {
  id: TabId;
  label: string;
  badge?: string;
  description: string;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    group: "ภาพรวมและข้อมูล",
    items: [
      {
        id: "overview",
        label: "ภาพรวมระบบ",
        description: "ศูนย์บัญชาการสถานะรวม, สถิติสด, และบันทึกประวัติการกระทำ",
      },
      {
        id: "stats",
        label: "สถิติการใช้งาน",
        description: "กราฟและตัวเลขการเปิดไพ่ อัตราความนิยมของหมวดหมู่และไพ่",
      },
    ],
  },
  {
    group: "ระบบและโครงสร้าง",
    items: [
      {
        id: "health",
        label: "สุขภาพระบบ & AI",
        description: "ตรวจสอบการเชื่อมต่อ Cloudflare D1, KV, Vectorize, และโมเดล AI",
      },
      {
        id: "entitlement",
        label: "สิทธิ์ & โควตา",
        description: "ควบคุมสวิตช์ระบบสิทธิ์, โควตาเปิดไพ่ฟรี, และโครงสร้างฐานข้อมูล D1",
      },
    ],
  },
  {
    group: "เนื้อหาและการบริการ",
    items: [
      {
        id: "content",
        label: "เนื้อหา & ไพ่ 78 ใบ",
        description: "แก้ไข System Prompt, เสียงแม่หมอ 6 สไตล์, และความหมายไพ่ทั้ง 78 ใบ",
      },
      {
        id: "readers",
        label: "หมอดูพาร์ทเนอร์",
        description: "จัดการโปรไฟล์ ตรวจสอบคุณสมบัติ และรายการจองคิวแม่หมอ",
      },
      {
        id: "marketing",
        label: "ข่าวสาร & สมาชิก",
        description: "รายชื่อผู้ยินยอมรับข่าวสาร สมาชิก และการส่งออกข้อมูล CSV",
      },
    ],
  },
];

// SVG Icons for clean, standardized executive feel (No cartoon emojis)
function TabIcon({ id, className = "w-4 h-4" }: { id: TabId; className?: string }) {
  switch (id) {
    case "overview":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      );
    case "stats":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      );
    case "health":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
    case "content":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      );
    case "entitlement":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      );
    case "readers":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      );
    case "marketing":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
  }
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authState, setAuthState] = useState<"loading" | "ready" | "denied">("loading");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [healthSubTab, setHealthSubTab] = useState<"system" | "ai">("system");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync tab from URL query params
  useEffect(() => {
    const rawTab = searchParams.get("tab");
    if (!rawTab) {
      setActiveTab("overview");
      return;
    }

    if (rawTab === "system") {
      setActiveTab("health");
      setHealthSubTab("system");
    } else if (rawTab === "ai") {
      setActiveTab("health");
      setHealthSubTab("ai");
    } else if (
      ["overview", "stats", "health", "content", "readers", "entitlement", "marketing"].includes(
        rawTab,
      )
    ) {
      setActiveTab(rawTab as TabId);
    }
  }, [searchParams]);

  // Authenticate session
  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.admin) setAuthState("ready");
        else {
          setAuthState("denied");
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        setAuthState("denied");
        router.replace("/admin/login");
      });
  }, [router]);

  const selectTab = useCallback(
    (tabId: string) => {
      let resolvedTab: TabId = "overview";
      if (tabId === "system") {
        resolvedTab = "health";
        setHealthSubTab("system");
      } else if (tabId === "ai") {
        resolvedTab = "health";
        setHealthSubTab("ai");
      } else if (
        ["overview", "stats", "health", "content", "readers", "entitlement", "marketing"].includes(
          tabId,
        )
      ) {
        resolvedTab = tabId as TabId;
      }

      setActiveTab(resolvedTab);
      setMobileMenuOpen(false);

      const params = new URLSearchParams(window.location.search);
      params.set("tab", resolvedTab);
      router.replace(`/admin?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
  }, [router]);

  if (authState !== "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F8F6F2] text-sm text-[#635B4E]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#A58A5C] border-t-transparent" />
        <p className="font-sans">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ…</p>
      </div>
    );
  }

  // Find active metadata for header breadcrumb
  let activeItem: NavItem | undefined;
  for (const sec of NAV_SECTIONS) {
    const it = sec.items.find((i) => i.id === activeTab);
    if (it) {
      activeItem = it;
      break;
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#29261F]">
      {/* ─── Top Executive Bar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#D5CEC2] bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8 shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D5CEC2] bg-[#FAF8F5] text-[#29261F] lg:hidden hover:bg-white transition-colors"
            aria-label="เปิดเมนูนำทาง"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <div className="flex items-center gap-3">
            {/* ✦ Official Brand Logo ✦ */}
            <div className="w-10 h-10 rounded-full border border-[#D5CEC2] overflow-hidden relative flex-shrink-0 bg-[#F3F0EA] shadow-2xs">
              <img
                src="/logo.webp"
                alt="SeerTarot Admin"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mystic-gold text-base sm:text-lg font-bold tracking-tight text-[#29261F]">
                  SeerTarot Admin
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-600/25 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-[#635B4E]">
                ศูนย์บริหารจัดการวิหารพยากรณ์ไพ่ทาโรต์ระดับพรีเมียม
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] px-3.5 py-1.5 text-xs font-medium text-[#29261F] hover:bg-white hover:border-[#A58A5C] transition-all shadow-2xs"
          >
            <span>✦ เปิดหน้าเว็บจริง</span>
            <span className="text-[11px] text-[#635B4E]">↗</span>
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-xs text-[#635B4E] hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            ออกจากระบบ
          </Button>
        </div>
      </header>

      {/* ─── Main Admin Workspace ──────────────────────────────────── */}
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* ─── Desktop Sidebar ────────────────────────────────────── */}
        <aside className="hidden w-64 shrink-0 border-r border-[#D5CEC2] bg-white p-4 lg:block">
          <div className="sticky top-20 space-y-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section.group} className="space-y-1.5">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#756F66]">
                  {section.group}
                </p>
                <nav className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectTab(item.id)}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all ${
                          isActive
                            ? "bg-[#F3F0EA] text-[#29261F] font-semibold border border-[#D5CEC2] shadow-2xs"
                            : "text-[#635B4E] hover:bg-[#FAF8F5] hover:text-[#29261F]"
                        }`}
                      >
                        <span
                          className={`transition-colors ${
                            isActive ? "text-[#A58A5C]" : "text-[#756F66] group-hover:text-[#29261F]"
                          }`}
                        >
                          <TabIcon id={item.id} className="w-4 h-4" />
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {isActive && <span className="text-[10px] text-[#A58A5C]">✦</span>}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}

            <div className="rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] p-3 text-[11px] text-[#635B4E]">
              <div className="flex items-center gap-1.5 font-semibold text-[#29261F]">
                <span className="text-[#A58A5C]">✦</span>
                <span>มาตรฐานระบบ</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#635B4E]">
                Provably-Fair Tarot 100% ควบคุมด้วย Cloudflare Workers & D1 Architecture
              </p>
            </div>
          </div>
        </aside>

        {/* ─── Mobile Drawer Menu ──────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="border-b border-[#D5CEC2] bg-white p-4 lg:hidden animate-in fade-in slide-in-from-top duration-200">
            <div className="space-y-4">
              {NAV_SECTIONS.map((section) => (
                <div key={section.group} className="space-y-1">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#756F66]">
                    {section.group}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {section.items.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectTab(item.id)}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                            isActive
                              ? "bg-[#29261F] text-white font-semibold"
                              : "bg-[#FAF8F5] text-[#29261F] border border-[#D5CEC2] hover:bg-white"
                          }`}
                        >
                          <TabIcon id={item.id} className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Mobile Horizontal Quick Pill Strip ───────────────────── */}
        <div className="flex overflow-x-auto border-b border-[#D5CEC2] bg-white px-4 py-2.5 gap-1.5 lg:hidden no-scrollbar">
          {NAV_SECTIONS.flatMap((s) => s.items).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? "bg-[#29261F] text-white font-semibold shadow-xs"
                    : "border border-[#D5CEC2] bg-[#FAF8F5] text-[#635B4E] hover:text-[#29261F]"
                }`}
              >
                <TabIcon id={item.id} className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Tab Content Workspace ──────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* Header Description Banner */}
          {activeItem && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D5CEC2] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[#A58A5C]">✦</span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#29261F] font-mystic-gold">
                    {activeItem.label}
                  </h2>
                </div>
                <p className="text-xs text-[#635B4E] mt-0.5">
                  {activeItem.description}
                </p>
              </div>

              {/* Special Sub-navigation when on "health" tab */}
              {activeTab === "health" && (
                <div className="flex items-center gap-1 rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setHealthSubTab("system")}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                      healthSubTab === "system"
                        ? "bg-white text-[#29261F] shadow-2xs font-semibold border border-[#D5CEC2]"
                        : "text-[#635B4E] hover:text-[#29261F]"
                    }`}
                  >
                    ✦ Cloudflare & D1
                  </button>
                  <button
                    type="button"
                    onClick={() => setHealthSubTab("ai")}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                      healthSubTab === "ai"
                        ? "bg-white text-[#29261F] shadow-2xs font-semibold border border-[#D5CEC2]"
                        : "text-[#635B4E] hover:text-[#29261F]"
                    }`}
                  >
                    ✨ ประสิทธิภาพ AI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Panel View */}
          <div className="space-y-6">
            {activeTab === "overview" && (
              <AdminOverview onNavigateTab={selectTab} />
            )}

            {activeTab === "stats" && <StatsDashboard />}

            {activeTab === "health" && (
              <div>
                {healthSubTab === "system" ? (
                  <SystemHealthPanel
                    onSwitchTab={(target) => {
                      if (target === "ai") setHealthSubTab("ai");
                      else selectTab(target);
                    }}
                  />
                ) : (
                  <AiHealthPanel />
                )}
              </div>
            )}

            {activeTab === "content" && <ContentEditor />}

            {activeTab === "readers" && <ReadersManager />}

            {activeTab === "entitlement" && <EntitlementAdmin />}

            {activeTab === "marketing" && <MarketingAudience />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminHome() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F8F6F2] text-sm text-[#635B4E]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#A58A5C] border-t-transparent" />
          <p className="font-sans">กำลังเตรียมแผงควบคุมระบบ…</p>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
