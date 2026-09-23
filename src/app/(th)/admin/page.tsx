"use client";

/**
 * ⚠️ T-28 — เหตุผลที่หน้านี้ถูก prerender และแคชสาธารณะได้อย่างปลอดภัย "ในตอนนี้"
 * ---------------------------------------------------------------------------
 * หน้านี้เป็น **เชลล์เปล่า** ล้วน ๆ ไม่มีข้อมูลของผู้ใช้คนไหนถูกเรนเดอร์ฝั่งเซิร์ฟเวอร์เลย
 * ข้อมูลทั้งหมดถูกดึงฝั่งไคลเอนต์หลัง hydrate ผ่าน API ที่ตรวจเซสชันของตัวเอง
 * HTML ที่ออกมาจึงเหมือนกันทุกคน และการแคชที่ขอบ (`s-maxage` ยาว) จึงไม่รั่วข้อมูลใคร
 *
 * 🔴 **วันไหนย้ายไปเรนเดอร์ข้อมูลผู้ใช้ฝั่งเซิร์ฟเวอร์ ต้องเปลี่ยนส่วนหัวแคชทันที**
 * ไม่งั้นข้อมูลของคนแรกที่เปิดหน้าจะถูกแคชสาธารณะแล้วเสิร์ฟให้คนถัดไปทั้งหมด
 * สัญญาณที่บอกว่าถึงเวลาต้องเปลี่ยน: มีการเรียก `cookies()` · `headers()` ·
 * `getSessionUser()` หรือ `await` ข้อมูลผู้ใช้ใด ๆ ในไฟล์นี้หรือ layout ของมัน
 */

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

// Dynamic Admin Panels
const AdminOverview = dynamic(() => import("@/components/admin/AdminOverview"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดภาพรวม…" />,
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
const MembersPanel = dynamic(() => import("@/components/admin/MembersPanel"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดรายชื่อสมาชิก…" />,
});
const FeedbackPanel = dynamic(() => import("@/components/admin/FeedbackPanel"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดความเห็นจากผู้ใช้…" />,
});
const RedeemCodesManager = dynamic(() => import("@/components/admin/RedeemCodesManager"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดรหัสแลกสิทธิ์…" />,
});

function AdminLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-gold border-t-transparent mb-3" />
      <p className="text-xs text-muted font-sans">{label}</p>
    </div>
  );
}

type TabId =
  | "overview"
  | "stats"
  | "members"
  | "feedback"
  | "redeem"
  | "entitlement"
  | "content"
  | "readers"
  | "health";

interface NavItem {
  id: TabId;
  label: string;
  description: string;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

/**
 * เมนูจัดตามงานที่แอดมินทำจริง: ดูตัวเลข ➔ ดูแลผู้ใช้ ➔ ตั้งค่าบริการ ➔ ดูแลระบบ
 * (เดิม "สิทธิ์ & โควตา" อยู่ใต้ "ปรับแต่งเนื้อหาและไพ่" และ "รายชื่อสมาชิก" มีแค่รายชื่อรับข่าวสาร)
 */
const NAV_SECTIONS: NavSection[] = [
  {
    group: "ภาพรวม",
    items: [
      { id: "overview", label: "ภาพรวม", description: "สถานะระบบ ตัวเลขสำคัญ 7 วัน และกิจกรรมแอดมินล่าสุด" },
      {
        id: "stats",
        label: "สถิติการใช้งาน",
        description: "สรุปรายวันแบบเลือกวันได้ · แนวโน้มและความนิยม · โควตาและความเสถียรของ AI",
      },
    ],
  },
  {
    group: "ผู้ใช้",
    items: [
      {
        id: "members",
        label: "สมาชิก",
        description: "ค้นหาสมาชิก ดูสิทธิ์คงเหลือ ให้สิทธิ์เพิ่ม และรายชื่อผู้รับข่าวสาร",
      },
      { id: "feedback", label: "ความเห็นจากผู้ใช้", description: "คะแนนและข้อความที่ผู้ใช้ส่งเข้ามา" },
      { id: "redeem", label: "รหัสแลกสิทธิ์", description: "สร้างรหัส กำหนดเพดานและวันหมดอายุ ดูประวัติการแลก" },
    ],
  },
  {
    group: "ตั้งค่าบริการ",
    items: [
      { id: "entitlement", label: "สิทธิ์ & โควตา", description: "สวิตช์ระบบสิทธิ์ ประกาศล่วงหน้า และตัวเลขการถูกกั้นสิทธิ์" },
      { id: "content", label: "แม่หมอ & ไพ่ 78 ใบ", description: "แก้คำสั่งระบบ บุคลิกแม่หมอ และความหมายไพ่แบบสด" },
      { id: "readers", label: "หมอดูพาร์ทเนอร์", description: "รับสมัคร ตรวจสอบ และจัดการโปรไฟล์หมอดูตัวจริง" },
    ],
  },
  {
    group: "ระบบ",
    items: [
      {
        id: "health",
        label: "สุขภาพระบบ & AI",
        description: "ตรวจ D1 · KV · ล็อกอิน · อีเมล และยิงทดสอบ AI จริง",
      },
    ],
  },
];

const ALL_TABS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.id));

/** ลิงก์เก่าที่ยังถูกบุ๊กมาร์กไว้ ➔ แท็บปัจจุบัน */
const TAB_ALIASES: Record<string, TabId> = { marketing: "members" };

// SVG Icons for clean, standardized executive feel (No cartoon emojis)
function TabIcon({ id, className = "w-4 h-4" }: { id: TabId; className?: string }) {
  const d: Record<TabId, string> = {
    overview:
      "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    stats:
      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    members:
      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    feedback:
      "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    redeem:
      "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
    entitlement:
      "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
    content:
      "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    readers: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    health: "M13 10V3L4 14h7v7l9-11h-7z",
  };
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d[id]} />
    </svg>
  );
}

/** แปลงค่าจาก URL/ปุ่มลัด เป็นแท็บจริง (+ แท็บย่อยของหน้าสุขภาพระบบ) */
function resolveTab(raw: string | null): { tab: TabId; health?: "system" | "ai" } {
  if (!raw) return { tab: "overview" };
  if (raw === "system") return { tab: "health", health: "system" };
  if (raw === "ai") return { tab: "health", health: "ai" };
  if (TAB_ALIASES[raw]) return { tab: TAB_ALIASES[raw] };
  if ((ALL_TABS as string[]).includes(raw)) return { tab: raw as TabId };
  return { tab: "overview" };
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authState, setAuthState] = useState<"loading" | "ready" | "denied">("loading");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [healthSubTab, setHealthSubTab] = useState<"system" | "ai">("system");

  // Sync tab from URL query params
  useEffect(() => {
    const r = resolveTab(searchParams.get("tab"));
    setActiveTab(r.tab);
    if (r.health) setHealthSubTab(r.health);
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
      const r = resolveTab(tabId);
      setActiveTab(r.tab);
      if (r.health) setHealthSubTab(r.health);

      const params = new URLSearchParams(window.location.search);
      params.set("tab", r.tab);
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <p className="font-sans">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ…</p>
      </div>
    );
  }

  const activeItem = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.id === activeTab);

  return (
    <div className="min-h-screen text-ink">
      {/* ─── แถบบน ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-line bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/logo.webp"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full border border-line object-cover"
            loading="eager"
          />
          <span className="text-sm font-bold text-ink sm:text-base">SeerTarot Admin</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink hover:bg-canvas"
          >
            เปิดหน้าเว็บ <span aria-hidden className="text-muted">↗</span>
          </a>
          <Button variant="ghost" size="sm" onClick={logout} className="text-xs text-muted hover:text-rose-700">
            ออกจากระบบ
          </Button>
        </div>
      </header>

      <div className="flex w-full flex-col lg:flex-row min-h-[calc(100vh-3.5rem)]">
        {/* ─── เมนูข้าง (เดสก์ท็อป) ────────────────────────────────── */}
        <aside className="hidden w-60 shrink-0 border-r border-line bg-white p-3 lg:block">
          <nav aria-label="เมนูแอดมิน" className="sticky top-[4.5rem] space-y-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.group} className="space-y-1">
                <p className="px-3 text-[11px] font-semibold text-muted">{section.group}</p>
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectTab(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={`tap-overlay-y flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isActive ? "bg-canvas font-semibold text-ink" : "text-muted hover:bg-canvas hover:text-ink"
                      }`}
                    >
                      <TabIcon id={item.id} className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* ─── แถบเมนู (มือถือ/แท็บเล็ต) ──────────────────────────────── */}
        <nav
          aria-label="เมนูแอดมิน"
          className="flex gap-1.5 overflow-x-auto border-b border-line bg-white px-4 py-2 lg:hidden no-scrollbar"
        >
          {NAV_SECTIONS.flatMap((s) => s.items).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`tap-overlay-y flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                  isActive ? "btn-gold-glass font-semibold" : "border border-line bg-white text-muted hover:text-ink"
                }`}
              >
                <TabIcon id={item.id} className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ─── พื้นที่ทำงาน ───────────────────────────────────────── */}
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/*
            ⚠️ ทุกหน้าต้องมี <h1> หนึ่งอันเสมอ — มันคือ "ชื่อของหน้า" ที่ screen reader
            ใช้บอกผู้ใช้ว่าตอนนี้อยู่หน้าไหน และเป็นรากของสารบัญหัวข้อทั้งหน้า
            ใช้ `sr-only` เพราะชื่อแท็บ (h2) คือตัวเด่นบนจอ
            ⚠️ ห้ามลบ — ด่าน `test-a11y-critical` ตรวจทุกหน้า
          */}
          <h1 className="sr-only">แผงควบคุมผู้ดูแลระบบ</h1>

          {activeItem && (
            <div className="mb-6 flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink sm:text-xl">{activeItem.label}</h2>
                <p className="mt-0.5 text-xs text-muted">{activeItem.description}</p>
              </div>

              {activeTab === "health" && (
                <div role="tablist" aria-label="หมวดสุขภาพระบบ" className="flex w-fit items-center gap-1 rounded-lg border border-line bg-canvas p-1 text-xs">
                  {(
                    [
                      ["system", "Cloudflare & D1"],
                      ["ai", "AI"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={healthSubTab === id}
                      onClick={() => setHealthSubTab(id)}
                      className={`tap-overlay-y rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        healthSubTab === id ? "border border-line bg-white font-semibold text-ink" : "text-muted hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-6">
            {activeTab === "overview" && <AdminOverview onNavigateTab={selectTab} />}
            {activeTab === "stats" && <StatsDashboard />}
            {activeTab === "members" && <MembersPanel />}
            {activeTab === "feedback" && <FeedbackPanel />}
            {activeTab === "redeem" && <RedeemCodesManager />}
            {activeTab === "entitlement" && <EntitlementAdmin />}
            {activeTab === "content" && <ContentEditor />}
            {activeTab === "readers" && <ReadersManager />}
            {activeTab === "health" &&
              (healthSubTab === "system" ? (
                <SystemHealthPanel
                  onSwitchTab={(target) => {
                    if (target === "ai") setHealthSubTab("ai");
                    else selectTab(target);
                  }}
                />
              ) : (
                <AiHealthPanel />
              ))}
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
        <>
        {/*
          ⚠️ fallback ของ Suspense คือ **HTML ที่ถูก prerender ออกมาจริง**
          ไม่ใช่แค่ของชั่วคราวที่ผู้ใช้เห็นเสี้ยววินาที — มันคือสิ่งที่บอตค้นหาและ
          ผู้ใช้เห็นตอน first paint จึงต้องมีโครงครบเหมือนหน้าจริง: <main> + <h1>

          ตรวจเจอตอนขยายด่าน a11y ให้ครอบทั้งเว็บ: หน้านี้มี <h1> ศูนย์อันใน HTML ที่ build
          เพราะเนื้อหาจริงอยู่หลัง Suspense ส่วนที่ prerender คือ fallback นี้เท่านั้น
          ⚠️ ห้ามลบ h1 — ด่าน `test-a11y-critical` ตรวจทั้ง 309 หน้าแล้ว
        */}
        <main
          id="main-content"
          tabIndex={-1}
          role="status"
          aria-busy="true"
          className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-muted"
        >
          <h1 className="sr-only">แผงควบคุมผู้ดูแลระบบ</h1>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="font-sans">กำลังเตรียมแผงควบคุมระบบ…</p>
        </main>
        </>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
