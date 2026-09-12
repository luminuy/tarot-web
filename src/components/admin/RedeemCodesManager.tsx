"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type {
  RedeemCodeRow,
  RedeemReasonKind,
  RedemptionRow,
} from "@/lib/entitlement/redeem-admin.repo";

function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

function timestampToISO(ts: number | null): string {
  if (!ts) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(ts));
}

function isoToEndOfDayEpoch(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  // 23:59:59 +07:00 => 16:59:59 UTC
  return Date.UTC(y, m - 1, d, 16, 59, 59, 999);
}

function formatTimestampThai(ts: number | null): string {
  if (!ts) return "ไม่มีวันหมดอายุ";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(ts));
}

function formatFullTimeThai(ts: number): string {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(ts));
}

function generateRandomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `SEER-${part(4)}-${part(4)}`;
}

export default function RedeemCodesManager() {
  const [codes, setCodes] = useState<RedeemCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "expired" | "depleted">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCode, setCreateCode] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createCredits, setCreateCredits] = useState(3);
  const [createKind, setCreateKind] = useState<RedeemReasonKind>("premium");
  const [createIsUnlimited, setCreateIsUnlimited] = useState(true);
  const [createMaxUses, setCreateMaxUses] = useState(100);
  const [createHasExpiry, setCreateHasExpiry] = useState(false);
  const [createExpiryDate, setCreateExpiryDate] = useState(todayISO());
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal State
  const [editingCode, setEditingCode] = useState<RedeemCodeRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editIsUnlimited, setEditIsUnlimited] = useState(true);
  const [editMaxUses, setEditMaxUses] = useState(100);
  const [editHasExpiry, setEditHasExpiry] = useState(false);
  const [editExpiryDate, setEditExpiryDate] = useState(todayISO());
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Redemptions Modal State
  const [viewingRedemptionsCode, setViewingRedemptionsCode] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [redemptionsError, setRedemptionsError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`คัดลอกรหัส ${text} แล้ว`);
    } catch {
      showToast("คัดลอกไม่สำเร็จ");
    }
  };

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/redeem");
      const data = await res.json();
      if (res.ok && Array.isArray(data.codes)) {
        setCodes(data.codes);
      } else {
        setError(data.error || "ไม่สามารถดึงข้อมูลรหัสแลกสิทธิ์ได้");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const openCreateModal = () => {
    setCreateCode(generateRandomCode());
    setCreateTitle("");
    setCreateCredits(3);
    setCreateKind("premium");
    setCreateIsUnlimited(true);
    setCreateMaxUses(100);
    setCreateHasExpiry(false);
    setCreateExpiryDate(todayISO());
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);

    const payload = {
      code: createCode.trim().toUpperCase(),
      title: createTitle.trim(),
      credits: Number(createCredits),
      kind: createKind,
      maxUses: createIsUnlimited ? -1 : Number(createMaxUses),
      expiresAt: createHasExpiry ? isoToEndOfDayEpoch(createExpiryDate) : null,
    };

    try {
      const res = await fetch("/api/admin/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsCreateOpen(false);
        showToast(`สร้างรหัส ${payload.code} สำเร็จ`);
        await fetchCodes();
      } else {
        setCreateError(data.error || "สร้างรหัสไม่สำเร็จ");
      }
    } catch {
      setCreateError("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditModal = (c: RedeemCodeRow) => {
    setEditingCode(c);
    setEditTitle(c.title);
    setEditIsUnlimited(c.maxUses === -1);
    setEditMaxUses(c.maxUses === -1 ? 100 : c.maxUses);
    setEditHasExpiry(c.expiresAt !== null);
    setEditExpiryDate(c.expiresAt ? timestampToISO(c.expiresAt) : todayISO());
    setEditIsActive(c.isActive);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode) return;
    setEditSubmitting(true);
    setEditError(null);

    const payload = {
      code: editingCode.code,
      title: editTitle.trim(),
      maxUses: editIsUnlimited ? -1 : Number(editMaxUses),
      expiresAt: editHasExpiry ? isoToEndOfDayEpoch(editExpiryDate) : null,
      isActive: editIsActive,
    };

    try {
      const res = await fetch("/api/admin/redeem", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setEditingCode(null);
        showToast(`อัปเดตรหัส ${editingCode.code} สำเร็จ`);
        await fetchCodes();
      } else {
        setEditError(data.error || "แก้ไขข้อมูลไม่สำเร็จ");
      }
    } catch {
      setEditError("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleActive = async (c: RedeemCodeRow) => {
    const nextActive = !c.isActive;
    try {
      const res = await fetch("/api/admin/redeem", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c.code, isActive: nextActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`${nextActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}รหัส ${c.code} แล้ว`);
        setCodes((prev) =>
          prev.map((item) => (item.code === c.code ? { ...item, isActive: nextActive } : item)),
        );
      } else {
        showToast(data.error || "ไม่สามารถเปลี่ยนสถานะได้");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const openRedemptionsModal = async (code: string) => {
    setViewingRedemptionsCode(code);
    setRedemptions([]);
    setLoadingRedemptions(true);
    setRedemptionsError(null);

    try {
      const res = await fetch(`/api/admin/redeem/${encodeURIComponent(code)}/redemptions`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.redemptions)) {
        setRedemptions(data.redemptions);
      } else {
        setRedemptionsError(data.error || "ไม่สามารถดึงข้อมูลประวัติการแลกได้");
      }
    } catch {
      setRedemptionsError("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const now = Date.now();

  const filteredCodes = useMemo(() => {
    return codes.filter((c) => {
      // ค้นหา
      if (search) {
        const q = search.toLowerCase();
        const matchCode = c.code.toLowerCase().includes(q);
        const matchTitle = c.title.toLowerCase().includes(q);
        if (!matchCode && !matchTitle) return false;
      }

      // กรองสถานะ
      const isExpired = c.expiresAt !== null && now > c.expiresAt;
      const isDepleted = c.maxUses !== -1 && c.usedCount >= c.maxUses;

      if (filter === "active") return c.isActive && !isExpired && !isDepleted;
      if (filter === "inactive") return !c.isActive;
      if (filter === "expired") return isExpired;
      if (filter === "depleted") return isDepleted;
      return true;
    });
  }, [codes, search, filter, now]);

  const summary = useMemo(() => {
    const total = codes.length;
    const active = codes.filter(
      (c) => c.isActive && (!c.expiresAt || now <= c.expiresAt) && (c.maxUses === -1 || c.usedCount < c.maxUses),
    ).length;
    const totalRedemptions = codes.reduce((sum, c) => sum + c.actualRedeemedCount, 0);
    return { total, active, totalRedemptions };
  }, [codes, now]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#29261F] px-4 py-2.5 text-xs text-white shadow-lg border border-[#A58A5C]/40">
          {toastMessage}
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DFD5] pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#29261F]">
            ระบบจัดการรหัสแลกสิทธิ์
          </h2>
          <p className="mt-1 text-xs text-[#635B4E]">
            สร้างและควบคุมรหัสของขวัญ กำหนดโควตา วันหมดอายุ และตรวจสอบการแลกรับสิทธิ์
          </p>
        </div>
        <div>
          <Button variant="gold" onClick={openCreateModal} className="w-full sm:w-auto">
            สร้างรหัสใหม่
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#E5DFD5] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#635B4E]">รหัสทั้งหมดในระบบ</p>
          <p className="mt-1 text-2xl font-bold text-[#29261F]">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-[#E5DFD5] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#635B4E]">รหัสที่พร้อมใช้งาน</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{summary.active}</p>
        </div>
        <div className="rounded-xl border border-[#E5DFD5] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#635B4E]">ยอดแลกรับสิทธิ์รวม</p>
          <p className="mt-1 text-2xl font-bold text-[#A58A5C]">{summary.totalRedemptions} ครั้ง</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารหัส หรือชื่อแคมเปญ…"
            className="w-full text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === "all"
                ? "bg-[#29261F] text-white border-[#29261F]"
                : "bg-white text-[#635B4E] border-[#E5DFD5] hover:bg-[#F2EFE9]"
            }`}
          >
            ทั้งหมด ({codes.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === "active"
                ? "bg-emerald-800 text-white border-emerald-800"
                : "bg-white text-[#635B4E] border-[#E5DFD5] hover:bg-[#F2EFE9]"
            }`}
          >
            เปิดใช้งาน
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === "inactive"
                ? "bg-[#635B4E] text-white border-[#635B4E]"
                : "bg-white text-[#635B4E] border-[#E5DFD5] hover:bg-[#F2EFE9]"
            }`}
          >
            ปิดใช้งาน
          </button>
          <button
            onClick={() => setFilter("expired")}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === "expired"
                ? "bg-amber-800 text-white border-amber-800"
                : "bg-white text-[#635B4E] border-[#E5DFD5] hover:bg-[#F2EFE9]"
            }`}
          >
            หมดอายุ
          </button>
          <button
            onClick={() => setFilter("depleted")}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === "depleted"
                ? "bg-rose-800 text-white border-rose-800"
                : "bg-white text-[#635B4E] border-[#E5DFD5] hover:bg-[#F2EFE9]"
            }`}
          >
            สิทธิ์เต็ม
          </button>
        </div>
      </div>

      {/* Main Table / List View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#A58A5C] border-t-transparent mb-3" />
          <p className="text-xs text-[#635B4E]">กำลังโหลดรายการรหัสแลกสิทธิ์…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800">
          <p>{error}</p>
          <Button variant="outline" onClick={fetchCodes} className="mt-3">
            ลองใหม่
          </Button>
        </div>
      ) : filteredCodes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D5CEC2] bg-[#F8F6F2] p-10 text-center text-xs text-[#635B4E]">
          {search ? "ไม่พบรหัสที่ตรงกับคำค้นหา" : "ยังไม่มีรหัสแลกสิทธิ์ในหมวดหมู่นี้"}
        </div>
      ) : (
        <>
          {/* Mobile Card List View (Zero Scroll, 100% Full-Width Responsive) */}
          <div className="space-y-3 md:hidden">
            {filteredCodes.map((c) => {
              const isExpired = c.expiresAt !== null && now > c.expiresAt;
              const isDepleted = c.maxUses !== -1 && c.usedCount >= c.maxUses;

              return (
                <div
                  key={c.code}
                  className="rounded-xl border border-[#E5DFD5] bg-white p-4 shadow-2xs space-y-3"
                >
                  {/* Top: Code & Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#E5DFD5]/60 pb-2.5">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-[#29261F]">
                      <span className="select-all tracking-wide">{c.code}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(c.code)}
                        title="คัดลอกรหัส"
                        className="text-[#A58A5C] hover:text-[#7A6338] p-1 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                    <div>
                      {!c.isActive ? (
                        <span className="inline-block rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                          ปิดใช้งาน
                        </span>
                      ) : isExpired ? (
                        <span className="inline-block rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          หมดอายุ
                        </span>
                      ) : isDepleted ? (
                        <span className="inline-block rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-800">
                          เต็มแล้ว
                        </span>
                      ) : (
                        <span className="inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                          เปิดใช้งาน
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <p className="text-xs font-semibold text-[#29261F] leading-snug">
                    {c.title}
                  </p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-[#FAF8F5] p-2.5 text-[11px]">
                    <div>
                      <span className="text-[#635B4E] block text-[10px]">สิทธิ์ที่ได้รับ</span>
                      <span className="font-semibold text-[#29261F]">{c.credits} ครั้ง</span>
                    </div>
                    <div>
                      <span className="text-[#635B4E] block text-[10px]">ชนิดสิทธิ์</span>
                      <span className="font-medium text-[#29261F]">
                        {c.reasonPrefix === "purchase_redeem" ? "พรีเมียม" : "โควตาทั่วไป"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#635B4E] block text-[10px]">ยอดใช้ / เพดาน</span>
                      <span className="font-medium text-[#29261F]">
                        {c.usedCount} / {c.maxUses === -1 ? "ไม่จำกัด" : c.maxUses}
                      </span>
                    </div>
                  </div>

                  {/* Expiry & Actions Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs">
                    <span className="text-[11px] text-[#635B4E]">
                      หมดอายุ: {formatTimestampThai(c.expiresAt)}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0 ${
                          c.isActive
                            ? "border-[#D5CEC2] bg-white text-stone-700 hover:bg-[#F2EFE9]"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                      >
                        {c.isActive ? "ปิด" : "เปิด"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openRedemptionsModal(c.code)}
                        className="rounded-lg border border-[#D5CEC2] bg-[#F8F6F2] px-2.5 py-1 text-[11px] font-medium text-[#29261F] hover:bg-[#EAE5DC] transition-colors shrink-0"
                      >
                        คนแลก ({c.actualRedeemedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="rounded-lg border border-[#D5CEC2] bg-white px-2.5 py-1 text-[11px] font-medium text-[#29261F] hover:bg-[#F2EFE9] transition-colors shrink-0"
                      >
                        แก้ไข
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Full-Width Responsive Table (Zero Scroll, Fits Entire Page) */}
          <div className="hidden md:block w-full overflow-hidden rounded-xl border border-[#E5DFD5] bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5DFD5] bg-[#F8F6F2] font-semibold text-[#635B4E]">
                  <th className="py-3.5 px-4 whitespace-nowrap">รหัสแลกสิทธิ์</th>
                  <th className="py-3.5 px-4">ชื่อแคมเปญ</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">สิทธิ์ / ครั้ง</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">ชนิดสิทธิ์</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">ยอดใช้ / เพดาน</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">วันหมดอายุ</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">สถานะ</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]">
                {filteredCodes.map((c) => {
                  const isExpired = c.expiresAt !== null && now > c.expiresAt;
                  const isDepleted = c.maxUses !== -1 && c.usedCount >= c.maxUses;

                  return (
                    <tr key={c.code} className="hover:bg-[#FAF8F5] transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#29261F] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="tracking-wide select-all">{c.code}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(c.code)}
                            title="คัดลอกรหัส"
                            className="text-[#A58A5C] hover:text-[#7A6338] transition-colors p-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 text-[#29261F] font-medium leading-relaxed">
                        {c.title}
                      </td>

                      {/* Credits */}
                      <td className="py-3.5 px-3 text-center font-semibold text-[#29261F] whitespace-nowrap">
                        {c.credits} ครั้ง
                      </td>

                      {/* Kind */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {c.reasonPrefix === "purchase_redeem" ? (
                          <span className="inline-flex items-center rounded-md border border-[#D5CEC2] bg-[#F8F6F2] px-2.5 py-1 text-[11px] font-semibold text-[#8C6D3B] whitespace-nowrap">
                            พรีเมียม
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-700 whitespace-nowrap">
                            โควตาธรรมดา
                          </span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="font-medium text-[#29261F]">
                          {c.usedCount} / {c.maxUses === -1 ? "ไม่จำกัด" : c.maxUses}
                        </span>
                        {c.actualRedeemedCount !== c.usedCount && (
                          <div className="text-[10px] text-[#A58A5C]">
                            ประวัติ: {c.actualRedeemedCount}
                          </div>
                        )}
                      </td>

                      {/* Expires */}
                      <td className="py-3.5 px-4 text-[#635B4E] whitespace-nowrap">
                        {formatTimestampThai(c.expiresAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {!c.isActive ? (
                          <span className="inline-block rounded-md border border-stone-200 bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600 whitespace-nowrap">
                            ปิดใช้งาน
                          </span>
                        ) : isExpired ? (
                          <span className="inline-block rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 whitespace-nowrap">
                            หมดอายุ
                          </span>
                        ) : isDepleted ? (
                          <span className="inline-block rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800 whitespace-nowrap">
                            เต็มแล้ว
                          </span>
                        ) : (
                          <span className="inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 whitespace-nowrap">
                            เปิดใช้งาน
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            title={c.isActive ? "กดเพื่อปิดใช้งานทันที" : "กดเพื่อเปิดใช้งาน"}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                              c.isActive
                                ? "border-[#D5CEC2] bg-white text-stone-700 hover:bg-[#F2EFE9]"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                          >
                            {c.isActive ? "ปิด" : "เปิด"}
                          </button>

                          <button
                            type="button"
                            onClick={() => openRedemptionsModal(c.code)}
                            className="rounded-lg border border-[#D5CEC2] bg-[#F8F6F2] px-2.5 py-1 text-[11px] font-medium text-[#29261F] hover:bg-[#EAE5DC] transition-colors whitespace-nowrap shrink-0"
                          >
                            คนแลก ({c.actualRedeemedCount})
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="rounded-lg border border-[#D5CEC2] bg-white px-2.5 py-1 text-[11px] font-medium text-[#29261F] hover:bg-[#F2EFE9] transition-colors whitespace-nowrap shrink-0"
                          >
                            แก้ไข
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="สร้างรหัสแลกสิทธิ์ใหม่"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          {createError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {createError}
            </div>
          )}

          {/* Code */}
          <Field label="รหัสแลกสิทธิ์ (Code) *">
            {(field) => (
              <div className="flex gap-2">
                <Input
                  {...field}
                  required
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                  placeholder="เช่น VIP3-TAROT-2026 หรือ SEER-9K7X-4M2P"
                  className="font-mono uppercase font-semibold"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateCode(generateRandomCode())}
                  className="shrink-0"
                >
                  สุ่มรหัส
                </Button>
              </div>
            )}
          </Field>

          {/* Title */}
          <Field label="ชื่อแคมเปญ / บันทึกภายใน *">
            {(field) => (
              <Input
                {...field}
                required
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="เช่น แจกผู้ติดตามช่วงเปิดเว็บ, รางวัลกิฟต์การ์ด"
              />
            )}
          </Field>

          {/* Credits */}
          <Field label="จำนวนสิทธิ์ที่ได้รับต่อการแลก (Credits) *">
            {(field) => (
              <Input
                {...field}
                type="number"
                min={1}
                max={100}
                required
                value={createCredits}
                onChange={(e) => setCreateCredits(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            )}
          </Field>

          {/* Kind Selection (Buttons) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#29261F]">
              ชนิดสิทธิ์ที่มอบให้ *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCreateKind("premium")}
                className={`flex flex-col text-left p-3 rounded-xl border transition ${
                  createKind === "premium"
                    ? "border-[#A58A5C] bg-[#F8F6F2] ring-1 ring-[#A58A5C]"
                    : "border-[#E5DFD5] bg-white hover:bg-[#FAF8F5]"
                }`}
              >
                <span className="text-xs font-bold text-[#8C6D3B]">สิทธิ์พรีเมียม</span>
                <span className="mt-1 text-[11px] leading-relaxed text-[#635B4E]">
                  ปลดล็อกผังใหญ่ 15 แบบ และปรมาจารย์ลับ 2 ท่าน (purchase_redeem)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCreateKind("quota")}
                className={`flex flex-col text-left p-3 rounded-xl border transition ${
                  createKind === "quota"
                    ? "border-[#A58A5C] bg-[#F8F6F2] ring-1 ring-[#A58A5C]"
                    : "border-[#E5DFD5] bg-white hover:bg-[#FAF8F5]"
                }`}
              >
                <span className="text-xs font-bold text-stone-800">โควตาธรรมดา</span>
                <span className="mt-1 text-[11px] leading-relaxed text-[#635B4E]">
                  เพิ่มจำนวนครั้งเปิดไพ่ทั่วไป แต่ไม่ปลดล็อกฟีเจอร์พรีเมียม (promo_redeem)
                </span>
              </button>
            </div>
          </div>

          {/* Max Uses */}
          <div className="space-y-2 rounded-xl border border-[#E5DFD5] bg-[#F8F6F2] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#29261F]">เพดานจำนวนคนแลก</span>
              <label className="flex items-center gap-1.5 text-xs text-[#635B4E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={createIsUnlimited}
                  onChange={(e) => setCreateIsUnlimited(e.target.checked)}
                  className="rounded border-[#D5CEC2]"
                />
                ไม่จำกัดจำนวนคนแลก
              </label>
            </div>
            {!createIsUnlimited && (
              <Input
                type="number"
                min={1}
                max={100000}
                value={createMaxUses}
                onChange={(e) => setCreateMaxUses(Math.max(1, parseInt(e.target.value, 10) || 1))}
                placeholder="ระบุจำนวนคนแลกสูงสุด"
                className="text-xs"
              />
            )}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2 rounded-xl border border-[#E5DFD5] bg-[#F8F6F2] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#29261F]">วันหมดอายุ (เวลาไทย)</span>
              <label className="flex items-center gap-1.5 text-xs text-[#635B4E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!createHasExpiry}
                  onChange={(e) => setCreateHasExpiry(!e.target.checked)}
                  className="rounded border-[#D5CEC2]"
                />
                ไม่มีวันหมดอายุ
              </label>
            </div>
            {createHasExpiry && (
              <div>
                <input
                  type="date"
                  min={todayISO()}
                  value={createExpiryDate}
                  onChange={(e) => setCreateExpiryDate(e.target.value)}
                  className="w-full rounded-xl border border-[#D5CEC2] bg-white px-3 py-2 text-xs text-[#29261F] focus:border-[#A58A5C] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-[#635B4E]">
                  จะหมดอายุ ณ เวลา 23:59:59 ของวันที่เลือกตามเวลาประเทศไทย
                </p>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createSubmitting}
            >
              ยกเลิก
            </Button>
            <Button type="submit" variant="gold" disabled={createSubmitting}>
              {createSubmitting ? "กำลังบันทึก…" : "สร้างรหัส"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(editingCode)}
        onClose={() => setEditingCode(null)}
        title="แก้ไขรหัสแลกสิทธิ์"
        maxWidth="lg"
      >
        {editingCode && (
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            {editError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {editError}
              </div>
            )}

            {/* Readonly info */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#E5DFD5] bg-[#F8F6F2] p-3 text-xs">
              <div>
                <span className="text-[#635B4E] block">รหัสแลกสิทธิ์:</span>
                <span className="font-mono font-bold text-[#29261F]">{editingCode.code}</span>
              </div>
              <div>
                <span className="text-[#635B4E] block">สิทธิ์ที่ได้รับ:</span>
                <span className="font-semibold text-[#29261F]">
                  {editingCode.credits} ครั้ง (
                  {editingCode.reasonPrefix === "purchase_redeem" ? "พรีเมียม" : "โควตาธรรมดา"})
                </span>
              </div>
              <p className="col-span-2 text-[10px] text-[#8C6D3B]">
                หมายเหตุ: เพื่อความถูกต้องของประวัติบัญชี ระบบไม่อนุญาตให้แก้ไขรหัสหรือจำนวนสิทธิ์ที่มอบให้
              </p>
            </div>

            {/* Title */}
            <Field label="ชื่อแคมเปญ / บันทึกภายใน *">
              {(field) => (
                <Input
                  {...field}
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              )}
            </Field>

            {/* Max Uses */}
            <div className="space-y-2 rounded-xl border border-[#E5DFD5] bg-[#F8F6F2] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#29261F]">เพดานจำนวนคนแลก</span>
                <label className="flex items-center gap-1.5 text-xs text-[#635B4E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsUnlimited}
                    onChange={(e) => setEditIsUnlimited(e.target.checked)}
                    className="rounded border-[#D5CEC2]"
                  />
                  ไม่จำกัดจำนวนคนแลก
                </label>
              </div>
              {!editIsUnlimited && (
                <Input
                  type="number"
                  min={Math.max(1, editingCode.usedCount)}
                  max={100000}
                  value={editMaxUses}
                  onChange={(e) => setEditMaxUses(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="text-xs"
                />
              )}
            </div>

            {/* Expiry Date */}
            <div className="space-y-2 rounded-xl border border-[#E5DFD5] bg-[#F8F6F2] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#29261F]">วันหมดอายุ (เวลาไทย)</span>
                <label className="flex items-center gap-1.5 text-xs text-[#635B4E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!editHasExpiry}
                    onChange={(e) => setEditHasExpiry(!e.target.checked)}
                    className="rounded border-[#D5CEC2]"
                  />
                  ไม่มีวันหมดอายุ
                </label>
              </div>
              {editHasExpiry && (
                <input
                  type="date"
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                  className="w-full rounded-xl border border-[#D5CEC2] bg-white px-3 py-2 text-xs text-[#29261F] focus:border-[#A58A5C] focus:outline-none"
                />
              )}
            </div>

            {/* Is Active */}
            <label className="flex items-center gap-2 text-xs font-semibold text-[#29261F] cursor-pointer">
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="rounded border-[#D5CEC2]"
              />
              เปิดใช้งานรหัสนี้
            </label>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCode(null)}
                disabled={editSubmitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" variant="gold" disabled={editSubmitting}>
                {editSubmitting ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Redemptions List Modal */}
      <Modal
        isOpen={Boolean(viewingRedemptionsCode)}
        onClose={() => setViewingRedemptionsCode(null)}
        title={`ประวัติผู้แลกรับสิทธิ์: ${viewingRedemptionsCode}`}
        maxWidth="2xl"
      >
        <div className="space-y-4 pt-2">
          {loadingRedemptions ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#A58A5C] border-t-transparent mb-2" />
              <p className="text-xs text-[#635B4E]">กำลังโหลดประวัติการแลก…</p>
            </div>
          ) : redemptionsError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 text-center">
              {redemptionsError}
            </div>
          ) : redemptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D5CEC2] bg-[#F8F6F2] p-8 text-center text-xs text-[#635B4E]">
              ยังไม่มีผู้ใช้แลกรับสิทธิ์จากรหัสนี้
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto rounded-xl border border-[#E5DFD5] bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5DFD5] bg-[#F8F6F2] text-[#635B4E] sticky top-0">
                    <th className="py-2.5 px-3">ลำดับ</th>
                    <th className="py-2.5 px-3">รหัสผู้ใช้ (User ID)</th>
                    <th className="py-2.5 px-3 text-center">สิทธิ์ที่ได้รับ</th>
                    <th className="py-2.5 px-3 text-right">วันเวลาที่แลก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD5]">
                  {redemptions.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-2.5 px-3 text-[#635B4E] font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-[#29261F]">{r.userId}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-[#29261F]">
                        {r.credits} ครั้ง
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#635B4E]">
                        {formatFullTimeThai(r.redeemedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewingRedemptionsCode(null)}
            >
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
