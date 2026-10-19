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
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { CloseIcon, MenuIcon, PersonIcon, SearchIcon } from "@/components/ui/LineIcons";
import { AdminSubTabs, useSubTab } from "@/components/admin/AdminLayout";
import { CommandPalette } from "@/components/admin/CommandPalette";
import type { NavBadges } from "@/lib/admin/executive-data";

// Dynamic Admin Panels
const ExecutiveDashboard = dynamic(() => import("@/components/admin/ExecutiveDashboard"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังรวมตัวเลขผู้บริหาร…" />,
});
const PaymentsPanel = dynamic(() => import("@/components/admin/PaymentsPanel"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดรายการชำระเงิน…" />,
});
const AuditLogPanel = dynamic(() => import("@/components/admin/AuditLogPanel"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดบันทึกการทำงาน…" />,
});
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
const StudioPassPricing = dynamic(() => import("@/components/admin/StudioPassPricing"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดราคาแพ็กเกจ AI ช่วยเขียน…" />,
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
const BookingsAdmin = dynamic(() => import("@/components/admin/BookingsAdmin"), {
  ssr: false,
  loading: () => <AdminLoading label="กำลังโหลดการจองและการเงิน…" />,
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
  | "executive"
  | "overview"
  | "stats"
  | "members"
  | "feedback"
  | "redeem"
  | "entitlement"
  | "content"
  | "readers"
  | "bookings"
  | "payments"
  | "health"
  | "audit";

interface NavItem {
  id: TabId;
  label: string;
  /** คำอธิบายบรรทัดเดียวใต้ชื่อเมนู — บอกว่ากดแล้วได้อะไร */
  short: string;
  /** คำอธิบายเต็มบนหัวหน้า */
  description: string;
  /** ตัวเลขเตือนจาก `/api/admin/nav-badges` */
  badge?: { key: "refundDue" | "pendingReaders" | "newFeedback"; tone: "alert" | "watch" | "info"; label: string };
  /** คำค้นเสริมของช่องค้นหาเมนู (Ctrl+K) */
  keywords?: string;
  /** "วิธีใช้หน้านี้" — 2–4 บรรทัด ภาษาคน บอกว่าทำอะไรได้และเริ่มตรงไหน */
  help?: string[];
}

interface NavSection {
  group: string;
  items: NavItem[];
}

/**
 * เมนูจัดตามงานที่ทำจริง เรียงจากสิ่งที่เปิดบ่อยที่สุด: ดูตัวเลข ➔ เงินและแม่หมอ ➔ ลูกค้า ➔ ตั้งค่าเว็บ
 * ชื่อเมนูเป็นภาษาคน (ไม่ใช่ชื่อระบบ) + คำอธิบายสั้นใต้ทุกเมนู + ตัวเลขเตือนเรื่องที่รอทำ
 * ⚠️ `id` คือค่าใน URL `?tab=` — เปลี่ยนชื่อเมนูได้ แต่ห้ามเปลี่ยน id (ลิงก์ที่บุ๊กมาร์กไว้จะพัง)
 */
const NAV_SECTIONS: NavSection[] = [
  {
    group: "ดูตัวเลข",
    items: [
      {
        id: "executive",
        label: "แดชบอร์ดผู้บริหาร",
        short: "เงิน คนใช้ และสิ่งที่ต้องดู",
        description: "รายได้ · Stripe · คนเปิดไพ่ · อัตราซื้อ · AI — เทียบช่วงก่อนหน้า พร้อมสิ่งที่ต้องดู (สำหรับ CMO · COO)",
        help: ["เลือกช่วงเวลา 7 / 28 / 90 วันด้านบน ทุกตัวเลขในหน้าจะเปลี่ยนตาม", "แท็บ ภาพรวม = ตัวเลขหลัก · การตลาด = คนเข้าจนถึงคนซื้อ · การดำเนินงาน = เงิน Stripe และ AI", "กล่อง สิ่งที่ต้องดู สรุปเรื่องที่ควรจัดการให้อัตโนมัติ เรียงเรื่องด่วนก่อน"],
      },
      {
        id: "overview",
        label: "สถานะระบบวันนี้",
        short: "ไฟบริการ ตัวเลข 7 วัน งานแอดมินล่าสุด",
        description: "สถานะระบบ ตัวเลขสำคัญ 7 วัน และกิจกรรมแอดมินล่าสุด",
        help: ["ไฟสถานะบอกว่าบริการไหนทำงานปกติ ถ้าแดงให้ไปที่เมนู สุขภาพระบบ", "รายการ สิ่งที่ต้องทำ มีปุ่มพาไปหน้าที่เกี่ยวข้องทันที"],
      },
      {
        id: "stats",
        label: "สถิติละเอียดรายวัน",
        short: "เลือกดูทีละวัน แนวโน้ม ส่งออก CSV",
        description: "สรุปรายวันแบบเลือกวันได้ · แนวโน้มและความนิยม · โควตาและความเสถียรของ AI",
        help: ["สรุปรายวัน: เลือกวันแล้วเทียบกับวันก่อน", "แนวโน้ม: ดูกราฟและตารางย้อนหลัง 7–90 วัน ส่งออก CSV ได้", "AI และระบบ: ดูโควตา AI วันนี้ ความเร็ว และจุดที่ผู้ใช้ถูกกั้นสิทธิ์"],
      },
    ],
  },
  {
    group: "เงินและแม่หมอ",
    items: [
      {
        id: "payments",
        label: "รายการชำระเงิน",
        short: "ทุกการจ่ายเงิน ค้นหา เปิดใน Stripe",
        description: "ทุกการจ่ายเงินทุกสินค้า (แพ็กเติมรอบ · ปรึกษาแม่หมอ · AI ช่วยเขียน) — กรองสถานะ ค้นด้วยเลขคำสั่งซื้อ เปิดรายการใน Stripe",
        help: ["ค่าเริ่มต้นแสดงเฉพาะเงินจริง เลือก รายการทดสอบ ถ้าต้องการดูรายการทดสอบ", "ค้นด้วยเลขคำสั่งซื้อ รหัสผู้ใช้ หรือรหัส Stripe แบบตรงตัว", "กด เปิดใน Stripe เพื่อคืนเงินหรือดูรายละเอียดบัตร"],
        keywords: "stripe order คำสั่งซื้อ ธุรกรรม ใบเสร็จ ซื้อ แพ็ก",
      },
      {
        id: "bookings",
        label: "การจองและการเงิน",
        short: "เงินต้องคืน การจอง ยอดโอนให้แม่หมอ",
        description: "เงินที่ต้องคืน · รายการจอง · ยอดที่ต้องโอนให้แม่หมอ · รีวิว",
        help: ["แท็บ ต้องทำ คือเงินที่ต้องคืนลูกค้า ควรว่างทุกวัน", "แท็บ ยอดโอนให้แม่หมอ ใช้ตอนโอนเงินรอบเดือน", "แท็บ รีวิว ซ่อนรีวิวที่ไม่เหมาะสมได้ทันที"],
        badge: { key: "refundDue", tone: "alert", label: "รายการเงินที่ต้องคืนลูกค้า" },
        keywords: "คืนเงิน refund โอนเงินแม่หมอ รีวิว นัด",
      },
      {
        id: "readers",
        label: "แม่หมอพาร์ทเนอร์",
        short: "รับสมัคร ตรวจ และจัดการโปรไฟล์",
        description: "รับสมัคร ตรวจสอบ และจัดการโปรไฟล์หมอดูตัวจริง · ราคาแพ็กเกจ AI ช่วยเขียน",
        help: ["แท็บสถานะด้านบนกรองรายชื่อ แท็บ รอตรวจ คือใบสมัครที่ต้องอนุมัติ", "ในการ์ดแต่ละคนมีปุ่มส่งลิงก์แผงแม่หมอ แก้ข้อมูล และหยุดรับลูกค้า", "หมวด ราคา AI ช่วยเขียน ตั้งราคาปกติและราคาพิเศษรายคน"],
        badge: { key: "pendingReaders", tone: "watch", label: "แม่หมอรอตรวจใบสมัคร" },
      },
    ],
  },
  {
    group: "ลูกค้า",
    items: [
      {
        id: "members",
        label: "สมาชิก",
        short: "ค้นหา ดูสิทธิ์คงเหลือ ให้สิทธิ์เพิ่ม",
        description: "ค้นหาสมาชิก ดูสิทธิ์คงเหลือ ให้สิทธิ์เพิ่ม และรายชื่อผู้รับข่าวสาร",
        help: ["ค้นด้วยอีเมล ชื่อ หรือรหัสผู้ใช้ แล้วกด ดู / ให้สิทธิ์", "รายละเอียดเปิดเป็นแผงด้านขวา ให้สิทธิ์เพิ่มได้จากในแผงนั้น (ต้องใส่เหตุผล)", "แท็บ ผู้รับข่าวสาร ดาวน์โหลดรายชื่อเป็น CSV ได้"],
      },
      {
        id: "feedback",
        label: "ความเห็นจากผู้ใช้",
        short: "คะแนนและข้อความที่ส่งมา",
        description: "คะแนนและข้อความที่ผู้ใช้ส่งเข้ามา",
        help: ["แท็บ คะแนนต่ำ และ แจ้งปัญหา คือเรื่องที่ควรอ่านก่อน", "ถ้ามีรหัสคำอ่านแนบมา ค้นต่อได้ที่ทีมเทคนิค"],
        badge: { key: "newFeedback", tone: "info", label: "ความเห็นใหม่ใน 7 วัน" },
      },
      {
        id: "redeem",
        label: "รหัสแลกสิทธิ์",
        short: "สร้างรหัสแจกสิทธิ์ ดูคนที่แลก",
        description: "สร้างรหัส กำหนดเพดานและวันหมดอายุ ดูประวัติการแลก",
        help: ["สร้างรหัสต้องตั้งเพดานจำนวนคนและวันหมดอายุทุกครั้ง", "ปิดรหัสได้ทันทีถ้ารหัสหลุด ประวัติการแลกจะเก็บไว้เสมอ"],
      },
    ],
  },
  {
    group: "ตั้งค่าเว็บ",
    items: [
      {
        id: "entitlement",
        label: "โควตาฟรีและสิทธิ์",
        short: "เปิดปิดระบบสิทธิ์ ประกาศล่วงหน้า",
        description: "สวิตช์ระบบสิทธิ์ ประกาศล่วงหน้า และตัวเลขการถูกกั้นสิทธิ์",
        help: ["แท็บ สวิตช์และกติกา เปิดปิดระบบสิทธิ์ทั้งเว็บ (มีผลทันที)", "แท็บ สุขภาพฐานข้อมูล ทุกค่าควรเป็น 0", "ก่อนเปลี่ยนกติกา ให้เปิดแบนเนอร์ประกาศล่วงหน้าอย่างน้อย 7 วัน"],
      },
      {
        id: "content",
        label: "แก้คำทำนาย AI และไพ่",
        short: "คำสั่ง AI บุคลิกแม่หมอ ความหมายไพ่",
        description: "แก้คำสั่งระบบ บุคลิกแม่หมอ และความหมายไพ่ 78 ใบแบบสด ไม่ต้อง deploy",
        help: ["แก้ได้เฉพาะข้อความ ไม่กระทบโครงไพ่ 78 ใบ", "กด บันทึกทั้งหมด แล้วมีผลกับคำอ่านใหม่ภายใน 1 นาที", "ช่องว่าง = กลับไปใช้ค่าเริ่มต้น"],
      },
    ],
  },
  {
    group: "ระบบ",
    items: [
      {
        id: "health",
        label: "สุขภาพระบบ",
        short: "ตรวจฐานข้อมูล อีเมล ล็อกอิน และ AI",
        description: "ตรวจ D1 · KV · ล็อกอิน · อีเมล และยิงทดสอบ AI จริง",
        help: ["แท็บ เว็บและฐานข้อมูล ตรวจโดเมน ล็อกอิน อีเมล D1 และ KV", "แท็บ AI ยิงทดสอบ AI จริงได้ (ใช้โควตา AI เล็กน้อย)"],
        keywords: "ai groq gemini ล่ม error",
      },
      {
        id: "audit",
        label: "บันทึกการทำงานแอดมิน",
        short: "ใครทำอะไรเมื่อไร ย้อนหลัง 180 วัน",
        description: "ทุกการกระทำในแผงแอดมิน — กรองตามหมวด ค้นจากข้อความ เตือนเมื่อมีคนใส่รหัสผิด",
        help: ["ทุกการกระทำในแผงแอดมินถูกบันทึกที่นี่ 180 วัน", "ถ้ามีแถบแดงเรื่องใส่รหัสผิด และไม่ใช่คุณ ให้เปลี่ยนรหัสแอดมินทันที"],
        keywords: "audit log ประวัติ ความปลอดภัย รหัสผิด",
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
    executive: "M4 19h16M7 16V11m5 5V7m5 9v-6",
    payments: "M3 7h18v10H3V7zm0 4h18M7 15h3",
    audit: "M9 5h10M9 12h10M9 19h10M5 5h.01M5 12h.01M5 19h.01",
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
    bookings: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
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
  if (!raw) return { tab: "executive" };
  if (raw === "system") return { tab: "health", health: "system" };
  if (raw === "ai") return { tab: "health", health: "ai" };
  if (TAB_ALIASES[raw]) return { tab: TAB_ALIASES[raw] };
  if ((ALL_TABS as string[]).includes(raw)) return { tab: raw as TabId };
  return { tab: "executive" };
}

/** สีป้ายบนเมนูข้างพื้นกรมท่า — แดง = ต้องทำทันที · เหลือง = รอตรวจ · ขาวโปร่ง = แจ้งให้ทราบ */
const BADGE_TONE: Record<NonNullable<NavItem["badge"]>["tone"], string> = {
  alert: "bg-rose-600 text-white",
  watch: "bg-amber-300 text-amber-950",
  info: "admin-nav-badge-info",
};

/** ตัวเลขเตือนบนเมนู — แสดงเมื่อ > 0 เท่านั้น · มีคำอธิบายให้โปรแกรมอ่านจอ (ไม่ใช้สีอย่างเดียว) */
function NavBadge({ item, badges }: { item: NavItem; badges: NavBadges | null }) {
  const n = item.badge && badges ? badges[item.badge.key] : null;
  if (!item.badge || n == null || n <= 0) return null;
  return (
    <span
      className={`ml-auto shrink-0 rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums ${BADGE_TONE[item.badge.tone]}`}
      title={item.badge.label}
    >
      {n > 99 ? "99+" : n}
      <span className="sr-only"> {item.badge.label}</span>
    </span>
  );
}

const READER_SUBS = ["list", "pricing"] as const;

/** แม่หมอพาร์ทเนอร์: รายชื่อ (ตรวจ อนุมัติ ส่งลิงก์) กับราคาแพ็กเกจ AI ช่วยเขียน แยกเป็นสองหมวด */
function ReadersPage() {
  const [sub, setSub] = useSubTab(READER_SUBS);
  return (
    <div className="space-y-6">
      <AdminSubTabs
        label="หมวดแม่หมอพาร์ทเนอร์"
        active={sub}
        onChange={setSub}
        tabs={[
          { id: "list", label: "รายชื่อแม่หมอ", hint: "ตรวจ อนุมัติ ส่งลิงก์ แก้ข้อมูล" },
          { id: "pricing", label: "ราคา AI ช่วยเขียน", hint: "ราคาปกติและราคาพิเศษรายคน" },
        ]}
      />
      {sub === "list" ? <ReadersManager /> : <StudioPassPricing />}
    </div>
  );
}

const HEALTH_SUBS = ["system", "ai"] as const;

/** สุขภาพระบบ: เว็บ/ฐานข้อมูล กับ AI · ลิงก์เก่า `?tab=system` / `?tab=ai` ยังพามาหมวดที่ถูก */
function HealthPage({ fallback, onSwitchTab }: { fallback: "system" | "ai"; onSwitchTab: (target: string) => void }) {
  const [sub, setSub] = useSubTab(HEALTH_SUBS, fallback);
  return (
    <div className="space-y-6">
      <AdminSubTabs
        label="หมวดสุขภาพระบบ"
        active={sub}
        onChange={setSub}
        tabs={[
          { id: "system", label: "เว็บและฐานข้อมูล", hint: "โดเมน ล็อกอิน อีเมล D1 KV" },
          { id: "ai", label: "AI", hint: "สถานะผู้ให้บริการ ยิงทดสอบจริง" },
        ]}
      />
      {sub === "system" ? (
        <SystemHealthPanel
          onSwitchTab={(target) => {
            if (target === "ai") setSub("ai");
            else onSwitchTab(target);
          }}
        />
      ) : (
        <AiHealthPanel />
      )}
    </div>
  );
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authState, setAuthState] = useState<"loading" | "ready" | "denied">("loading");
  const [activeTab, setActiveTab] = useState<TabId>("executive");
  const [healthSubTab, setHealthSubTab] = useState<"system" | "ai">("system");
  const [badges, setBadges] = useState<NavBadges | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // เปลี่ยนเมนูแล้วพับกล่องวิธีใช้ของหน้าเดิม
  useEffect(() => setHelpOpen(false), [activeTab]);

  // ลิ้นชักเมนูมือถือ: Esc ปิด · ล็อกการเลื่อนพื้นหลังระหว่างเปิด
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  // Ctrl+K / Cmd+K เปิดช่องค้นหาเมนู
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  // ตัวเลขเตือนบนเมนู — โหลดใหม่ทุกครั้งที่เปลี่ยนแท็บ (คำถามนับ 3 ตัว เบามาก)
  useEffect(() => {
    if (authState !== "ready") return;
    fetch("/api/admin/nav-badges", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBadges(d?.badges ?? null))
      .catch(() => setBadges(null));
  }, [authState, activeTab]);

  const selectTab = useCallback(
    (tabId: string) => {
      const r = resolveTab(tabId);
      setActiveTab(r.tab);
      if (r.health) setHealthSubTab(r.health);

      const params = new URLSearchParams(window.location.search);
      params.set("tab", r.tab);
      // หมวดย่อยเป็นของแต่ละหน้า — เปลี่ยนเมนูแล้วเริ่มที่หมวดแรกของหน้าใหม่
      if (r.health) params.set("sub", r.health);
      else params.delete("sub");
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
  const activeGroup = NAV_SECTIONS.find((sec) => sec.items.some((i) => i.id === activeTab))?.group;

  return (
    <div className="flex min-h-screen text-ink">
      {/* ─── เมนูข้าง (เดสก์ท็อป) — พื้นกรมท่าเต็มความสูง ─────────────── */}
      <aside className="admin-sidebar sticky top-0 hidden h-screen w-64 shrink-0 flex-col lg:flex">
        <AdminSidebar activeTab={activeTab} badges={badges} onSelect={selectTab} />
      </aside>

      {/* ─── เมนูข้าง (มือถือ/แท็บเล็ต) — ลิ้นชักจากซ้าย ─────────────── */}
      {navOpen ? (
        <div className="fixed inset-0 z-50 flex bg-ink/40 lg:hidden" onMouseDown={() => setNavOpen(false)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="เมนูแอดมิน"
            className="admin-sidebar flex h-full w-[17rem] max-w-[85vw] flex-col shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <AdminSidebar
              activeTab={activeTab}
              badges={badges}
              onSelect={(id) => {
                selectTab(id);
                setNavOpen(false);
              }}
              onClose={() => setNavOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ─── แถบบน: เส้นทางหน้า · ค้นหา · บัญชี ───────────────────── */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="เปิดเมนู"
            className="admin-btn-secondary tap-overlay-y inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md lg:hidden"
          >
            <MenuIcon />
          </button>

          <nav aria-label="เส้นทางหน้า" className="min-w-0 flex-1">
            <ol className="flex min-w-0 items-center gap-2 text-sm">
              <li className="hidden shrink-0 text-muted sm:block">ผู้ดูแลระบบ</li>
              <li aria-hidden className="hidden text-line-interactive sm:block">/</li>
              <li className="hidden shrink-0 text-muted md:block">{activeGroup}</li>
              <li aria-hidden className="hidden text-line-interactive md:block">/</li>
              <li aria-current="page" className="truncate font-semibold text-ink">
                {activeItem?.label}
              </li>
            </ol>
          </nav>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-keyshortcuts="Control+K Meta+K"
            aria-label="ค้นหาเมนู"
            className="admin-btn-secondary tap-overlay-y inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-muted md:w-64"
          >
            <SearchIcon className="h-4 w-4 shrink-0" />
            <span className="hidden flex-1 text-left md:inline">ค้นหาเมนู</span>
            <kbd className="hidden rounded border border-line bg-canvas px-1.5 font-sans text-[11px] text-muted md:inline">Ctrl K</kbd>
          </button>

          <AccountMenu onLogout={logout} />
        </header>

        {/* แถบเตือนสภาพแวดล้อมเงิน — เห็นทุกหน้า ไม่ใช่แค่จอกว้าง */}
        {badges?.stripeMode === "test" ? (
          <div role="status" className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 sm:px-6">
            Stripe อยู่ในโหมดทดสอบ — รายการชำระเงินที่เห็นยังไม่ใช่เงินจริง
          </div>
        ) : null}

        <main id="main-content" tabIndex={-1} className="admin-workspace flex min-w-0 flex-1 flex-col">
          {/*
            ⚠️ ทุกหน้าต้องมี <h1> หนึ่งอันเสมอ — มันคือ "ชื่อของหน้า" ที่ screen reader
            ใช้บอกผู้ใช้ว่าตอนนี้อยู่หน้าไหน และเป็นรากของสารบัญหัวข้อทั้งหน้า
            ใช้ `sr-only` เพราะชื่อแท็บ (h2) คือตัวเด่นบนจอ
            ⚠️ ห้ามลบ — ด่าน `test-a11y-critical` ตรวจทุกหน้า
          */}
          <h1 className="sr-only">แผงควบคุมผู้ดูแลระบบ</h1>

          {/* ─── หัวหน้า: แถบขาวคั่นเส้น ─────────────────────────────── */}
          {activeItem && (
            <div className="border-b border-line bg-white">
              <div className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-ink sm:text-2xl">{activeItem.label}</h2>
                    <p className="mt-1 max-w-3xl text-sm text-muted">{activeItem.description}</p>
                  </div>
                  {activeItem.help ? (
                    <button
                      type="button"
                      onClick={() => setHelpOpen((o) => !o)}
                      aria-expanded={helpOpen}
                      aria-controls="admin-page-help"
                      className="admin-btn-secondary tap-overlay-y inline-flex min-h-10 shrink-0 items-center rounded-md px-3.5 text-sm font-medium"
                    >
                      {helpOpen ? "ซ่อนวิธีใช้" : "วิธีใช้หน้านี้"}
                    </button>
                  ) : null}
                </div>
                {activeItem.help && helpOpen ? (
                  <div id="admin-page-help" className="admin-help mt-4 px-4 py-3">
                    <p className="text-xs font-semibold text-ink">วิธีใช้หน้านี้</p>
                    <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
                      {activeItem.help.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <div className="mx-auto w-full max-w-[1320px] flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {activeTab === "executive" && <ExecutiveDashboard />}
              {activeTab === "overview" && <AdminOverview onNavigateTab={selectTab} />}
              {activeTab === "stats" && <StatsDashboard />}
              {activeTab === "members" && <MembersPanel />}
              {activeTab === "feedback" && <FeedbackPanel />}
              {activeTab === "redeem" && <RedeemCodesManager />}
              {activeTab === "entitlement" && <EntitlementAdmin />}
              {activeTab === "content" && <ContentEditor />}
              {activeTab === "readers" && <ReadersPage />}
              {activeTab === "bookings" && <BookingsAdmin />}
              {activeTab === "payments" && <PaymentsPanel />}
              {activeTab === "audit" && <AuditLogPanel />}
              {activeTab === "health" && (
                <HealthPage
                  fallback={healthSubTab}
                  onSwitchTab={(target) => {
                    if (target !== "ai") selectTab(target);
                  }}
                />
              )}
            </div>
          </div>

          <footer className="border-t border-line bg-white">
            <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-muted sm:px-6 lg:px-8">
              <span>SeerTarot Admin Console · ระบบภายในสำหรับผู้ดูแลที่ได้รับอนุญาตเท่านั้น</span>
              <button type="button" onClick={() => selectTab("audit")} className="tap-overlay-y font-medium text-gold-ink hover:underline">
                ทุกการกระทำถูกบันทึกไว้ในบันทึกการทำงาน
              </button>
            </div>
          </footer>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={selectTab}
        items={NAV_SECTIONS.flatMap((sec) =>
          sec.items.map((i) => ({ id: i.id, label: i.label, hint: i.short, group: sec.group, keywords: `${i.description} ${i.keywords ?? ""}` })),
        )}
      />
    </div>
  );
}

/** สถานะเงินของระบบ — ท้ายเมนูข้าง ให้รู้ตลอดว่ากำลังดูเงินจริงหรือเงินทดสอบ */
function StripeModeLine({ badges }: { badges: NavBadges | null }) {
  if (!badges) return null;
  const text =
    badges.stripeMode === "test" ? "Stripe: โหมดทดสอบ" : badges.stripeMode === null ? "Stripe: ยังไม่ได้ตั้งค่า" : "Stripe: เงินจริง";
  return <p className="admin-nav-muted text-[11px]">{text}</p>;
}

/** เนื้อในเมนูข้าง — ใช้ร่วมระหว่างจอกว้าง (ติดซ้าย) กับมือถือ (ลิ้นชัก) */
function AdminSidebar({
  activeTab,
  badges,
  onSelect,
  onClose,
}: {
  activeTab: TabId;
  badges: NavBadges | null;
  onSelect: (id: TabId) => void;
  /** มีเฉพาะในลิ้นชักมือถือ */
  onClose?: () => void;
}) {
  return (
    <>
      <div className="admin-sidebar-line flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <img src="/logo.webp" alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full object-cover" loading="eager" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-semibold text-white">SeerTarot</span>
          <span className="admin-nav-muted block truncate text-[11px]">Admin Console</span>
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดเมนู"
            className="admin-nav-item tap-overlay-y inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      <nav aria-label="เมนูแอดมิน" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.group}>
            <p className="admin-nav-group mb-1 px-3 text-[11px] font-semibold">{section.group}</p>
            <ul className="space-y-px">
              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      title={item.short}
                      className={`admin-nav-item tap-overlay-y relative flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${
                        isActive ? "font-semibold" : "font-medium"
                      }`}
                    >
                      <TabIcon id={item.id} className="h-[18px] w-[18px] shrink-0 opacity-80" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <NavBadge item={item} badges={badges} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-line shrink-0 border-t px-4 py-3">
        <StripeModeLine badges={badges} />
        <a href="/" target="_blank" rel="noopener noreferrer" className="admin-nav-muted mt-1 inline-block text-[11px] hover:text-white hover:underline">
          เปิดหน้าเว็บจริง (แท็บใหม่)
        </a>
      </div>
    </>
  );
}

/** เมนูบัญชีมุมขวาบน — ไปหน้าเว็บจริง · ออกจากระบบ */
function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="admin-btn-secondary tap-overlay-y inline-flex h-10 items-center gap-2 rounded-md pl-1.5 pr-3 text-sm font-medium"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-inset text-ink-soft">
          <PersonIcon className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">ผู้ดูแลระบบ</span>
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1.5 w-56 overflow-hidden rounded-md border border-line bg-white py-1 shadow-lg">
          <p className="border-b border-line px-3.5 py-2 text-xs text-muted">เข้าสู่ระบบด้วยรหัสผู้ดูแล · หมดอายุใน 8 ชั่วโมง</p>
          <a
            role="menuitem"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block min-h-11 px-3.5 py-2.5 text-sm text-ink hover:bg-canvas"
          >
            เปิดหน้าเว็บจริง
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={onLogout}
            className="block min-h-11 w-full px-3.5 py-2.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
          >
            ออกจากระบบ
          </button>
        </div>
      ) : null}
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
