"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import type { Reader, ReaderStatus } from "@/lib/marketplace/readers.repo";

export default function ReadersManager() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReader, setEditingReader] = useState<Reader | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [specialtiesText, setSpecialtiesText] = useState("");
  const [lineUrl, setLineUrl] = useState("");
  const [status, setStatus] = useState<ReaderStatus>("approved");
  const [commissionPct, setCommissionPct] = useState<number>(20);

  // Toast / Copy notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchReaders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/readers");
      const data = await res.json();
      if (res.ok && Array.isArray(data.readers)) {
        setReaders(data.readers);
      } else {
        setError(data.error || "ไม่สามารถโหลดรายชื่อแม่หมอได้");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReaders();
  }, [fetchReaders]);

  const openCreateModal = () => {
    setEditingReader(null);
    setDisplayName("");
    setBio("");
    setAvatarUrl("");
    setSpecialtiesText("ความรัก, การงาน, การเงิน, ชีวิตทั่วไป");
    setLineUrl("");
    setStatus("approved");
    setCommissionPct(20);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (r: Reader) => {
    setEditingReader(r);
    setDisplayName(r.displayName);
    setBio(r.bio);
    setAvatarUrl(r.avatarUrl || "");
    setSpecialtiesText(r.specialties.join(", "));
    setLineUrl(r.lineUrl);
    setStatus(r.status);
    setCommissionPct(r.commissionPct);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const specialties = specialtiesText
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      displayName: displayName.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim() || null,
      specialties,
      lineUrl: lineUrl.trim(),
      status,
      commissionPct: Number(commissionPct) || 20,
    };

    if (!payload.displayName) {
      setFormError("กรุณาระบุชื่อแม่หมอ");
      setSaving(false);
      return;
    }

    if (!payload.lineUrl) {
      setFormError("กรุณาระบุ LINE ID หรือ LINE OA URL สำหรับส่งต่อลูกค้า");
      setSaving(false);
      return;
    }

    try {
      const url = editingReader
        ? `/api/admin/readers/${editingReader.id}`
        : "/api/admin/readers";
      const method = editingReader ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      } else {
        setIsModalOpen(false);
        showToast(editingReader ? "อัปเดตข้อมูลแม่หมอแล้ว ✨" : "เพิ่มแม่หมอใหม่เรียบร้อย ✦");
        fetchReaders();
      }
    } catch {
      setFormError("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (id: string, newStatus: ReaderStatus) => {
    try {
      const res = await fetch(`/api/admin/readers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`เปลี่ยนสถานะเป็น ${newStatus} แล้ว`);
        fetchReaders();
      } else {
        const d = await res.json();
        alert(d.error || "เปลี่ยนสถานะไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const handleDelete = async (r: Reader) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์ "${r.displayName}" ออกจากระบบ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/readers/${r.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("ลบแม่หมอเรียบร้อยแล้ว");
        fetchReaders();
      } else {
        const d = await res.json();
        alert(d.error || "ลบไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const copyConsoleLink = (r: Reader) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/readers/console?id=${r.id}`;
    navigator.clipboard.writeText(link).then(
      () => showToast("คัดลอกลิงก์แผงควบคุมแม่หมอแล้ว ✦"),
      () => alert(`ลิงก์: ${link}`)
    );
  };

  const filteredReaders = useMemo(() => {
    return readers.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.displayName.toLowerCase().includes(q) ||
          r.bio.toLowerCase().includes(q) ||
          r.specialties.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [readers, statusFilter, search]);

  const counts = useMemo(() => {
    return {
      all: readers.length,
      approved: readers.filter((r) => r.status === "approved").length,
      pending: readers.filter((r) => r.status === "pending").length,
      suspended: readers.filter((r) => r.status === "suspended").length,
    };
  }, [readers]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#f5deaa]">✦ จัดการแม่หมอตัวจริง (Marketplace)</h2>
          <p className="text-xs text-[#9c93b8]">
            ควบคุมโปรไฟล์ อนุมัติสถานะ และจัดการแม่หมอในระบบพยากรณ์
          </p>
        </div>
        <Button onClick={openCreateModal} variant="gold">
          + เพิ่มแม่หมอใหม่
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: "all", label: `ทั้งหมด (${counts.all})` },
            { id: "approved", label: `เปิดรับงาน (${counts.approved})` },
            { id: "pending", label: `รอตรวจสอบ (${counts.pending})` },
            { id: "suspended", label: `พักงาน (${counts.suspended})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                statusFilter === tab.id
                  ? "bg-[#e5c07b] text-[#120f1d]"
                  : "bg-white/5 text-[#9c93b8] hover:bg-white/10 hover:text-[#f5deaa]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="ค้นหาชื่อ, ความถนัด…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs"
          />
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#e5c07b]/40 bg-[#171226] px-4 py-2.5 text-xs font-semibold text-[#f5deaa] shadow-2xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}

      {/* Readers List */}
      {loading ? (
        <div className="altar-panel flex h-48 items-center justify-center rounded-2xl text-xs text-[#9c93b8]">
          กำลังโหลดข้อมูลแม่หมอ…
        </div>
      ) : error ? (
        <div className="altar-panel rounded-2xl p-6 text-center text-xs text-[#f0a0a0]">
          <p>{error}</p>
          <Button onClick={fetchReaders} variant="ghost" className="mt-3 text-xs">
            ลองใหม่
          </Button>
        </div>
      ) : filteredReaders.length === 0 ? (
        <div className="altar-panel flex flex-col items-center justify-center rounded-2xl py-12 text-center">
          <p className="text-sm font-semibold text-[#f5deaa]">ยังไม่มีแม่หมอในหมวดนี้</p>
          <p className="mt-1 text-xs text-[#9c93b8]">คลิกปุ่ม &quot;+ เพิ่มแม่หมอใหม่&quot; เพื่อเริ่มต้นสร้างโปรไฟล์</p>
          <Button onClick={openCreateModal} variant="outline" className="mt-4 text-xs">
            + เพิ่มแม่หมอ
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReaders.map((r) => (
            <div
              key={r.id}
              className="altar-panel flex flex-col justify-between rounded-2xl p-5 transition-all hover:border-[#e5c07b]/30"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e5c07b]/30 bg-[#231b38] text-lg font-bold text-[#f5deaa] overflow-hidden">
                      {r.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.avatarUrl} alt={r.displayName} className="h-full w-full object-cover" />
                      ) : (
                        r.displayName.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#f5deaa]">{r.displayName}</h3>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                          r.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : r.status === "pending"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {r.status === "approved"
                          ? "✦ เปิดรับงาน"
                          : r.status === "pending"
                            ? "⏳ รออนุมัติ"
                            : "⛔ พักงาน"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="mt-3 text-xs leading-relaxed text-[#c3bdd8] line-clamp-3">
                  {r.bio || "ยังไม่มีข้อมูลประวัติ"}
                </p>

                {/* Specialties */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.specialties.map((s, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-[#32254e]/60 px-2 py-0.5 text-[10px] text-[#e5c07b]"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Contact & Meta */}
                <div className="mt-4 space-y-1 rounded-xl bg-black/20 p-2.5 text-[11px] text-[#9c93b8]">
                  <div className="flex justify-between">
                    <span>LINE ติดต่อ:</span>
                    <span className="font-mono text-[#f5deaa] truncate max-w-[140px]">{r.lineUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ส่วนแบ่งระบบ:</span>
                    <span className="text-[#f5deaa]">{r.commissionPct}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 border-t border-white/5 pt-3 space-y-2">
                <div className="flex gap-2">
                  {r.status !== "approved" && (
                    <button
                      onClick={() => handleQuickStatus(r.id, "approved")}
                      className="flex-1 rounded-lg bg-emerald-500/20 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                    >
                      อนุมัติ
                    </button>
                  )}
                  {r.status !== "suspended" && (
                    <button
                      onClick={() => handleQuickStatus(r.id, "suspended")}
                      className="flex-1 rounded-lg bg-red-500/20 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors"
                    >
                      พักงาน
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(r)}
                    className="flex-1 rounded-lg bg-white/5 py-1.5 text-xs font-medium text-[#c3bdd8] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    แก้ไข
                  </button>
                </div>

                <div className="flex gap-2 text-[11px]">
                  <button
                    onClick={() => copyConsoleLink(r)}
                    className="flex-1 rounded-lg border border-[#e5c07b]/30 py-1 text-[#e5c07b] hover:bg-[#e5c07b]/10 transition-colors"
                  >
                    ✦ ลิงก์แผงแม่หมอ
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    className="px-2.5 py-1 text-[#f0a0a0] hover:text-red-400 transition-colors"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReader ? "✦ แก้ไขข้อมูลแม่หมอ" : "✦ เพิ่มแม่หมอใหม่"}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {formError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-[#f0a0a0]">
              {formError}
            </div>
          )}

          <Field label="ชื่อแม่หมอ (Display Name) *">
            {(id) => (
              <Input
                id={id}
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น แม่หมอจันทร์เจ้า, หมอดูไพ่ญาณทิพย์"
              />
            )}
          </Field>

          <Field label="ประวัติ / สไตล์การทำนาย (Bio)">
            {(id) => (
              <Textarea
                id={id}
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="อธิบายประสบการณ์ สไตล์การดู หรือคำแนะนำเบื้องต้นแก่ผู้รับคำทำนาย…"
              />
            )}
          </Field>

          <Field label="URL รูปโปรไฟล์ (Avatar URL)">
            {(id) => (
              <Input
                id={id}
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            )}
          </Field>

          <Field label="ความถนัด (คั่นด้วยจุลภาค)">
            {(id) => (
              <Input
                id={id}
                value={specialtiesText}
                onChange={(e) => setSpecialtiesText(e.target.value)}
                placeholder="ความรัก, การงาน, การเงิน, สุขภาพ, ธุรกิจ"
              />
            )}
          </Field>

          <Field label="ช่องทางส่งต่อ LINE (LINE ID หรือ LINE OA URL) *">
            {(id) => (
              <Input
                id={id}
                required
                value={lineUrl}
                onChange={(e) => setLineUrl(e.target.value)}
                placeholder="https://line.me/ti/p/~yourid หรือ @yourlineoa"
              />
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="สถานะโปรไฟล์">
              {(id) => (
                <select
                  id={id}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ReaderStatus)}
                  className="w-full rounded-xl border border-white/10 bg-[#161224] px-3 py-2 text-xs text-[#f5deaa] outline-none focus:border-[#e5c07b]"
                >
                  <option value="approved">เปิดรับงาน (Approved)</option>
                  <option value="pending">รอตรวจสอบ (Pending)</option>
                  <option value="suspended">พักงาน (Suspended)</option>
                </select>
              )}
            </Field>

            <Field label="ส่วนแบ่งแพลตฟอร์ม (%)">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={100}
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(Number(e.target.value))}
                />
              )}
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button type="submit" variant="gold" disabled={saving}>
              {saving ? "กำลังบันทึก…" : editingReader ? "บันทึกการแก้ไข" : "+ สร้างโปรไฟล์"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
