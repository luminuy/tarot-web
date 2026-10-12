"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import type { AdminReader, ReaderActivity, ReaderStatus } from "@/lib/marketplace/readers.repo";
import { formatTime, relativeDayLabel } from "@/lib/marketplace/booking-policy";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";
import {
  CONSOLE_LINK_DAYS,
  DEFAULT_CONSOLE_LINK_DAYS,
  consoleLinkDaysLabel,
  normalizeConsoleLinkDays,
  type ConsoleLinkDays,
} from "@/lib/marketplace/console-link";
import {
  CONSULTATION_MINUTES,
  CONSULTATION_PRICE_THB,
  READER_PRICE_MAX_THB,
  READER_PRICE_MIN_THB,
  readerPriceThb,
} from "@/lib/marketplace/offer";
import { useVisibleInterval } from "@/lib/utils/use-visible-interval";
import { copyToClipboard } from "@/lib/utils/clipboard";

/**
 * ✦ แท็บ "หมอดูพาร์ทเนอร์" ในแผงแอดมิน (CONSULT_FLOW_UX_PLAN คลื่น 4)
 * ---------------------------------------------------------------------------
 * งานที่แอดมินทำจริงกับแม่หมอมีแค่ 4 อย่าง หน้านี้จึงเรียงตามนั้น:
 *   1. ดูว่าแม่หมอแต่ละคน "รับลูกค้าได้อยู่ไหม" — ลูกค้าที่เปิดลิงก์ตอนนี้จะคุยได้เลย นัดได้ หรือจองไม่ได้เลย
 *   2. ส่งลิงก์เข้าแผงให้แม่หมอ (ลิงก์เป็นกุญแจ — เลือกอายุ 1 · 7 · 30 วัน บอกเวลาหมดอายุจริง
 *      และ "ยกเลิกลิงก์เก่าทั้งหมด" ได้ทันทีเมื่อลิงก์หลุด · ISSUE-058)
 *   3. ส่งลิงก์หน้าจองให้ลูกค้า
 *   4. เพิ่ม/แก้ไข/อนุมัติ/พักงาน
 *
 * ⚠️ การกระทำที่ย้อนไม่ได้หรือกระทบลูกค้า (พักงาน · ลบ) ต้องยืนยันในหน้าเดียวกันก่อนเสมอ
 *    (เดิมกด "พักงาน" ทีเดียวมีผลทันที และลบด้วย `confirm()` ของเบราว์เซอร์)
 *    ลบ = ประวัตินัด การชำระเงิน รีวิว และข้อมูลสตูดิโอหายทั้งหมด ➔ ต้องพิมพ์ชื่อแม่หมอยืนยัน
 * ⚠️ ห้ามอิโมจิการ์ตูน (กฎเหล็กข้อ 2) — เดิมป้ายสถานะมี ⏳ / ⛔
 */

type ReaderRow = AdminReader & { activity: ReaderActivity | null };
type Filter = "all" | ReaderStatus;

const STATUS_INFO: Record<ReaderStatus, { label: string; detail: string; chip: string }> = {
  approved: {
    label: "ใช้งานอยู่",
    detail: "โปรไฟล์ขึ้นหน้าเว็บ ลูกค้าจองได้ และแม่หมอเข้าแผงได้",
    chip: "border-ok/30 bg-ok/10 text-ok",
  },
  pending: {
    label: "รออนุมัติ",
    detail: "ยังไม่ขึ้นหน้าเว็บ และแม่หมอยังเข้าแผงไม่ได้",
    chip: "border-gold-ink/30 bg-gold-ink/10 text-gold-ink",
  },
  suspended: {
    label: "พักงาน",
    detail: "ซ่อนจากหน้าเว็บ ลูกค้าจองไม่ได้ และแม่หมอเข้าแผงไม่ได้",
    chip: "border-err/30 bg-err-wash text-err",
  },
};

/** รออนุมัติขึ้นก่อน (งานที่แอดมินต้องทำ) ➔ ใช้งานอยู่ ➔ พักงาน */
const STATUS_ORDER: Record<ReaderStatus, number> = { pending: 0, approved: 1, suspended: 2 };

const DEFAULT_SPECIALTIES = "ความรัก, การงาน, การเงิน, ชีวิตทั่วไป";

interface ConsoleLink {
  readerId: string;
  link: string;
  expiresAt: number;
  days: ConsoleLinkDays;
  /** ข้อความบอกขั้นต่อไปหลังเพิ่ม/อนุมัติแม่หมอ */
  note?: string;
}

type FieldKey = "displayName" | "avatarUrl" | "specialties" | "lineUrl" | "price" | "commission";

function baht(n: number): string {
  return `${n.toLocaleString("th-TH")} บาท`;
}

/** "อา. 12 ต.ค. 21:40 น." — เวลาไทยเสมอ ไม่ขึ้นกับเครื่องแอดมิน */
function formatExpiry(ms: number): string {
  return new Date(ms).toLocaleString("th-TH", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }) + " น.";
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** ส่วนแบ่งต่อครั้ง — สูตรเดียวกับ `calculatePayout` (ปัดเป็นสตางค์) */
function splitPrice(priceThb: number, pct: number): { fee: number; net: number } {
  const gross = priceThb * 100;
  const fee = Math.round((gross * pct) / 100);
  return { fee: fee / 100, net: (gross - fee) / 100 };
}

export default function ReadersManager() {
  const [readers, setReaders] = useState<ReaderRow[] | null>(null);
  const [loadedAt, setLoadedAt] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // แผงลิงก์เข้าแผงแม่หมอ (เปิดทีละคน) · การยืนยันพักงาน · ปุ่มที่กำลังทำงาน
  const [linkPanel, setLinkPanel] = useState<ConsoleLink | null>(null);
  const [confirmPause, setConfirmPause] = useState<string | null>(null);
  /** การ์ดที่กำลังถามยืนยัน "ยกเลิกลิงก์เก่าทั้งหมด" */
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // หน้าต่างเพิ่ม/แก้ไข
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReaderRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [specialtiesText, setSpecialtiesText] = useState("");
  const [lineUrl, setLineUrl] = useState("");
  const [status, setStatus] = useState<ReaderStatus>("approved");
  const [commissionText, setCommissionText] = useState("20");
  /** ค่าดูดวงต่อครั้ง — ช่องว่าง = ราคากลาง */
  const [priceText, setPriceText] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fieldRefs = {
    displayName: useRef<HTMLInputElement>(null),
    avatarUrl: useRef<HTMLInputElement>(null),
    specialties: useRef<HTMLInputElement>(null),
    lineUrl: useRef<HTMLInputElement>(null),
    price: useRef<HTMLInputElement>(null),
    commission: useRef<HTMLInputElement>(null),
  };

  const fetchReaders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/readers");
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.readers)) {
        setReaders(data.readers as ReaderRow[]);
        setLoadedAt(Date.now());
        setError(null);
      } else {
        setError(data.error || "โหลดรายชื่อแม่หมอไม่สำเร็จ");
      }
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ — เช็กอินเทอร์เน็ตแล้วลองใหม่");
    }
  }, []);

  // สถานะคิวสด/นัดเปลี่ยนตลอด — อัปเดตเองทุกนาทีขณะเปิดแท็บนี้อยู่ (หยุดเองตอนสลับไปแท็บอื่นของเบราว์เซอร์)
  useVisibleInterval(fetchReaders, 60_000);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  /** แปลงคำตอบ API (token + เวลาหมดอายุ) เป็นลิงก์แผงที่ส่งให้แม่หมอได้ */
  const toConsoleLink = (r: ReaderRow, d: { token: string; expiresAt?: unknown; days?: unknown }): ConsoleLink => {
    const days = normalizeConsoleLinkDays(d.days);
    const params = new URLSearchParams({ id: r.id, token: d.token });
    return {
      readerId: r.id,
      link: `${origin}/readers/console?${params.toString()}`,
      expiresAt: typeof d.expiresAt === "number" ? d.expiresAt : Date.now() + days * 86_400_000,
      days,
    };
  };

  /** ขอลิงก์แผงแม่หมอใหม่ อายุเต็มตามที่เลือก (ลิงก์เก่ายังใช้ได้จนหมดอายุ — ยกเลิกทั้งหมดได้ในแผงลิงก์) */
  const requestConsoleLink = async (r: ReaderRow, days: ConsoleLinkDays = DEFAULT_CONSOLE_LINK_DAYS): Promise<ConsoleLink | null> => {
    try {
      const res = await fetch(`/api/admin/readers/${r.id}?days=${days}`);
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.token) {
        showToast(d.error || "สร้างลิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง");
        return null;
      }
      return toConsoleLink(r, d);
    } catch {
      showToast("เชื่อมต่อไม่สำเร็จ — ลองใหม่อีกครั้ง");
      return null;
    }
  };

  const openLinkPanel = async (r: ReaderRow, note?: string, days?: ConsoleLinkDays) => {
    setBusy(`link:${r.id}`);
    setConfirmPause(null);
    setConfirmRevoke(null);
    const keepDays = days ?? (linkPanel?.readerId === r.id ? linkPanel.days : DEFAULT_CONSOLE_LINK_DAYS);
    const result = await requestConsoleLink(r, keepDays);
    setBusy(null);
    if (!result) return;
    setLinkPanel({ ...result, note });
    // การ์ดอาจอยู่ล่างจอ (เช่น เพิ่งเพิ่มแม่หมอ) ➔ เลื่อนให้เห็นแผงลิงก์
    requestAnimationFrame(() => document.getElementById(`reader-${r.id}`)?.scrollIntoView({ block: "center" }));
  };

  /**
   * ยกเลิกลิงก์แผงทุกลิงก์ที่เคยส่งให้แม่หมอคนนี้ (เปลี่ยนกุญแจเซ็น) แล้วได้ลิงก์ใหม่ทันที
   * ใช้ตอนลิงก์หลุดไปถึงคนอื่น หรือแม่หมอเลิกใช้เครื่องเดิม — แผงที่เปิดค้างด้วยลิงก์เก่าจะกดอะไรไม่ได้
   */
  const revokeLinks = async (r: ReaderRow) => {
    if (busy) return;
    setBusy(`revoke:${r.id}`);
    const days = linkPanel?.readerId === r.id ? linkPanel.days : DEFAULT_CONSOLE_LINK_DAYS;
    try {
      const res = await fetch(`/api/admin/readers/${r.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_links", days }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.token) {
        showToast(d.error || "ยกเลิกลิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง");
        return;
      }
      setConfirmRevoke(null);
      setLinkPanel({
        ...toConsoleLink(r, d),
        note: `ยกเลิกลิงก์เก่าของ ${r.displayName} ทั้งหมดแล้ว — ลิงก์ที่เคยส่งไปใช้ไม่ได้แล้ว ส่งลิงก์ใหม่นี้ให้แม่หมอแทน`,
      });
      showToast("ยกเลิกลิงก์เก่าทั้งหมดแล้ว");
    } catch {
      showToast("เชื่อมต่อไม่สำเร็จ — ลองใหม่อีกครั้ง");
    } finally {
      setBusy(null);
    }
  };

  /** เปิดแผงแม่หมอในแท็บใหม่ — เปิดแท็บว่างทันทีตอนกด (กันเบราว์เซอร์บล็อกป๊อปอัป) แล้วค่อยใส่ลิงก์ */
  const openConsole = async (r: ReaderRow) => {
    if (busy) return;
    const win = window.open("", "_blank");
    setBusy(`open:${r.id}`);
    // แอดมินเปิดดูเอง ➔ ลิงก์อายุสั้นสุด (1 วัน) ไม่ทิ้งกุญแจอายุยาวไว้ในประวัติเบราว์เซอร์ของแอดมิน
    const result = await requestConsoleLink(r, 1);
    setBusy(null);
    if (!result) {
      win?.close();
      return;
    }
    if (win) {
      win.location.href = result.link;
    } else {
      // เบราว์เซอร์บล็อกแท็บใหม่ ➔ โชว์ลิงก์ให้กดเอง
      setLinkPanel(result);
    }
  };

  const copyBookingLink = async (r: ReaderRow) => {
    const link = `${origin}/readers/${r.id}/book`;
    const ok = await copyToClipboard(link);
    showToast(ok ? `คัดลอกลิงก์หน้าจองของ ${r.displayName} แล้ว — ส่งให้ลูกค้าได้เลย` : `คัดลอกไม่ได้ — ลิงก์คือ ${link}`);
  };

  const changeStatus = async (r: ReaderRow, next: ReaderStatus) => {
    if (busy) return;
    setBusy(`status:${r.id}`);
    try {
      const res = await fetch(`/api/admin/readers/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(d.error || "เปลี่ยนสถานะไม่สำเร็จ");
        return;
      }
      setConfirmPause(null);
      await fetchReaders();
      if (next === "approved") {
        // ขั้นต่อไปที่แอดมินต้องทำเสมอหลังอนุมัติ = ส่งลิงก์เข้าแผงให้แม่หมอ ➔ เปิดให้เลย
        setBusy(null);
        await openLinkPanel(r, `อนุมัติ ${r.displayName} แล้ว — โปรไฟล์ขึ้นหน้าเว็บแล้ว ขั้นต่อไป: ส่งลิงก์นี้ให้แม่หมอเข้าแผงไปตั้งเวลาว่าง`);
      } else {
        if (linkPanel?.readerId === r.id) setLinkPanel(null);
        showToast(`พักงาน ${r.displayName} แล้ว — โปรไฟล์ถูกซ่อนจากหน้าเว็บ`);
      }
    } catch {
      showToast("เชื่อมต่อไม่สำเร็จ — ลองใหม่อีกครั้ง");
    } finally {
      setBusy(null);
    }
  };

  /* ── หน้าต่างเพิ่ม/แก้ไข ───────────────────────────────────────────── */

  const resetFormState = () => {
    setFormError(null);
    setFieldErrors({});
    setShowDelete(false);
    setDeleteConfirmText("");
    setDeleteError(null);
  };

  const openCreateModal = () => {
    setEditing(null);
    setDisplayName("");
    setBio("");
    setAvatarUrl("");
    setSpecialtiesText(DEFAULT_SPECIALTIES);
    setLineUrl("");
    setStatus("approved");
    setCommissionText("20");
    setPriceText("");
    resetFormState();
    setIsModalOpen(true);
  };

  const openEditModal = (r: ReaderRow) => {
    setEditing(r);
    setDisplayName(r.displayName);
    setBio(r.bio);
    setAvatarUrl(r.avatarUrl || "");
    setSpecialtiesText(r.specialties.join(", "));
    setLineUrl(r.lineUrl);
    setStatus(r.status);
    setCommissionText(String(r.commissionPct));
    setPriceText(r.priceThb ? String(r.priceThb) : "");
    resetFormState();
    setIsModalOpen(true);
  };

  const specialties = useMemo(
    () =>
      specialtiesText
        .split(/[,،\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    [specialtiesText]
  );

  const validate = (): Partial<Record<FieldKey, string>> => {
    const errs: Partial<Record<FieldKey, string>> = {};
    if (displayName.trim().length < 2) errs.displayName = "ใส่ชื่อแม่หมออย่างน้อย 2 ตัวอักษร";
    if (avatarUrl.trim() && !isHttpUrl(avatarUrl.trim())) errs.avatarUrl = "ลิงก์รูปต้องขึ้นต้นด้วย https://";
    if (specialties.length > 10) errs.specialties = `ใส่ได้สูงสุด 10 เรื่อง (ตอนนี้ ${specialties.length} เรื่อง)`;
    else if (specialties.some((s) => s.length > 50)) errs.specialties = "แต่ละเรื่องยาวได้ไม่เกิน 50 ตัวอักษร";
    if (lineUrl.trim().length < 3) errs.lineUrl = "ใส่ LINE ของแม่หมอ (ลิงก์ line.me หรือ @ไอดี)";
    if (priceText.trim()) {
      const p = Number(priceText);
      if (!Number.isInteger(p) || p < READER_PRICE_MIN_THB || p > READER_PRICE_MAX_THB) {
        errs.price = `ใส่ราคาเป็นจำนวนเต็ม ${READER_PRICE_MIN_THB}–${READER_PRICE_MAX_THB.toLocaleString("th-TH")} บาท หรือเว้นว่าง`;
      }
    }
    const c = Number(commissionText);
    if (!commissionText.trim() || !Number.isInteger(c) || c < 0 || c > 100) errs.commission = "ใส่ตัวเลข 0–100";
    return errs;
  };

  const focusFirstError = (errs: Partial<Record<FieldKey, string>>) => {
    const order: FieldKey[] = ["displayName", "avatarUrl", "specialties", "lineUrl", "price", "commission"];
    const first = order.find((k) => errs[k]);
    if (first) fieldRefs[first].current?.focus();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormError("ยังบันทึกไม่ได้ — แก้ช่องที่มีข้อความสีแดงก่อน");
      focusFirstError(errs);
      return;
    }
    setFormError(null);
    setSaving(true);

    const payload = {
      displayName: displayName.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim() || null,
      specialties,
      lineUrl: lineUrl.trim(),
      status,
      commissionPct: Number(commissionText),
      priceThb: priceText.trim() ? Number(priceText) : null,
    };

    try {
      const res = await fetch(editing ? `/api/admin/readers/${editing.id}` : "/api/admin/readers", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // ข้อความผิดพลาดรายช่องจากเซิร์ฟเวอร์ (zod) ➔ ขึ้นใต้ช่องนั้นเลย
        const details = (data.details ?? {}) as Record<string, { _errors?: string[] }>;
        const serverErrs: Partial<Record<FieldKey, string>> = {};
        const map: [string, FieldKey][] = [
          ["displayName", "displayName"],
          ["avatarUrl", "avatarUrl"],
          ["specialties", "specialties"],
          ["lineUrl", "lineUrl"],
          ["priceThb", "price"],
          ["commissionPct", "commission"],
        ];
        for (const [src, key] of map) {
          const msg = details[src]?._errors?.[0];
          if (msg) serverErrs[key] = msg;
        }
        setFieldErrors(serverErrs);
        setFormError(data.error || "บันทึกไม่สำเร็จ");
        focusFirstError(serverErrs);
        return;
      }
      setIsModalOpen(false);
      await fetchReaders();
      const saved = data.reader as AdminReader | undefined;
      if (!editing && saved) {
        // ให้เห็นการ์ดของคนที่เพิ่งเพิ่มแน่ ๆ ไม่ว่าตอนนั้นกรอง/ค้นหาอะไรค้างไว้
        setFilter("all");
        setSearch("");
        if (saved.status === "approved") {
          await openLinkPanel(
            { ...saved, activity: null },
            `เพิ่ม ${saved.displayName} แล้ว — ขั้นต่อไป: ส่งลิงก์นี้ให้แม่หมอเข้าแผงไปตั้งเวลาว่าง หรือเปิดรับคิวสด`
          );
        } else {
          showToast(`เพิ่ม ${saved.displayName} แล้ว — กด "อนุมัติ" เมื่อพร้อมให้รับลูกค้า`);
        }
      } else {
        showToast(`บันทึกข้อมูล ${payload.displayName} แล้ว`);
      }
    } catch {
      setFormError("เชื่อมต่อไม่สำเร็จ — ลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || saving) return;
    if (deleteConfirmText.trim() !== editing.displayName.trim()) {
      setDeleteError(`พิมพ์ชื่อ "${editing.displayName}" ให้ตรงก่อนกดลบ`);
      return;
    }
    setDeleteError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/readers/${editing.id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(d.error || "ลบไม่สำเร็จ");
        return;
      }
      setIsModalOpen(false);
      if (linkPanel?.readerId === editing.id) setLinkPanel(null);
      showToast(`ลบ ${editing.displayName} ออกจากระบบแล้ว`);
      await fetchReaders();
    } catch {
      setDeleteError("เชื่อมต่อไม่สำเร็จ — ลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  /* ── รายการ ───────────────────────────────────────────────────────── */

  const counts = useMemo(() => {
    const list = readers ?? [];
    return {
      all: list.length,
      approved: list.filter((r) => r.status === "approved").length,
      pending: list.filter((r) => r.status === "pending").length,
      suspended: list.filter((r) => r.status === "suspended").length,
    };
  }, [readers]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (readers ?? [])
      .filter((r) => filter === "all" || r.status === filter)
      .filter(
        (r) =>
          !q ||
          r.displayName.toLowerCase().includes(q) ||
          r.bio.toLowerCase().includes(q) ||
          r.specialties.some((s) => s.toLowerCase().includes(q))
      )
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [readers, filter, search]);

  const priceNow = priceText.trim() && Number.isFinite(Number(priceText)) ? Number(priceText) : CONSULTATION_PRICE_THB;
  const pctNow = Number(commissionText);
  const split =
    Number.isInteger(pctNow) && pctNow >= 0 && pctNow <= 100 && priceNow >= READER_PRICE_MIN_THB && priceNow <= READER_PRICE_MAX_THB
      ? splitPrice(priceNow, pctNow)
      : null;

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "ทั้งหมด", count: counts.all },
    { id: "pending", label: STATUS_INFO.pending.label, count: counts.pending },
    { id: "approved", label: STATUS_INFO.approved.label, count: counts.approved },
    { id: "suspended", label: STATUS_INFO.suspended.label, count: counts.suspended },
  ];

  return (
    <div className="space-y-5">
      {/* แถบบน: เพิ่มแม่หมอ + ค้นหา + กรองสถานะ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="กรองตามสถานะ">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`tap-overlay-y inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${
                filter === f.id ? "btn-gold-glass font-semibold" : "border border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              {f.label}
              <span className="text-xs tabular-nums">{f.count}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="search"
            aria-label="ค้นหาแม่หมอ"
            placeholder="ค้นหาชื่อ หรือเรื่องที่ถนัด"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-11 sm:w-60"
          />
          <Button onClick={openCreateModal} variant="gold" className="shrink-0 whitespace-nowrap">
            + เพิ่มแม่หมอ
          </Button>
        </div>
      </div>

      {/* วิธีเริ่มรับลูกค้า — ย่อไว้ (คนที่ใช้ประจำไม่ต้องเห็นทุกครั้ง) */}
      <details className="altar-card-porcelain !rounded-xl px-4 py-3 text-sm">
        <summary className="tap-overlay-y flex min-h-11 cursor-pointer items-center font-semibold text-ink">
          วิธีเริ่มรับลูกค้า (3 ขั้น)
        </summary>
        <StartSteps />
      </details>

      {/* รายการแม่หมอ */}
      {readers === null && !error ? (
        <div role="status" className="altar-card-porcelain altar-panel flex h-40 items-center justify-center text-sm text-muted">
          กำลังโหลดรายชื่อแม่หมอ…
        </div>
      ) : error && readers === null ? (
        <div role="alert" className="altar-panel rounded-2xl border border-err/30 bg-err-wash p-6 text-center text-sm text-err">
          <p>{error}</p>
          <Button onClick={() => void fetchReaders()} variant="outline" className="mt-3">
            ลองใหม่
          </Button>
        </div>
      ) : counts.all === 0 ? (
        <div className="altar-card-porcelain altar-panel space-y-4 p-6 sm:p-8">
          <p className="text-base font-semibold text-ink">ยังไม่มีแม่หมอในระบบ</p>
          <StartSteps />
          <Button onClick={openCreateModal} variant="gold">
            + เพิ่มแม่หมอคนแรก
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="altar-card-porcelain altar-panel p-8 text-center text-sm text-muted">
          ไม่พบแม่หมอที่ตรงกับที่เลือก —{" "}
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setSearch("");
            }}
            className="tap-overlay-y font-semibold text-gold-ink underline underline-offset-2"
          >
            ดูทั้งหมด
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {visible.map((r) => (
            <ReaderCard
              key={r.id}
              reader={r}
              nowMs={loadedAt}
              busy={busy}
              linkPanel={linkPanel?.readerId === r.id ? linkPanel : null}
              confirmingPause={confirmPause === r.id}
              onSendLink={() => void openLinkPanel(r)}
              onCloseLink={() => {
                setLinkPanel(null);
                setConfirmRevoke(null);
              }}
              onChangeLinkDays={(days) => void openLinkPanel(r, undefined, days)}
              confirmingRevoke={confirmRevoke === r.id}
              onAskRevoke={() => setConfirmRevoke(r.id)}
              onCancelRevoke={() => setConfirmRevoke(null)}
              onConfirmRevoke={() => void revokeLinks(r)}
              onCopyLink={async (link) => {
                const ok = await copyToClipboard(link);
                showToast(ok ? "คัดลอกลิงก์แล้ว — วางส่งให้แม่หมอทาง LINE ได้เลย" : "คัดลอกไม่ได้ — กดค้างที่ลิงก์แล้วเลือกคัดลอก");
              }}
              onOpenConsole={() => void openConsole(r)}
              onCopyBooking={() => void copyBookingLink(r)}
              onEdit={() => openEditModal(r)}
              onApprove={() => void changeStatus(r, "approved")}
              onAskPause={() => {
                setLinkPanel(null);
                setConfirmPause(r.id);
              }}
              onCancelPause={() => setConfirmPause(null)}
              onConfirmPause={() => void changeStatus(r, "suspended")}
            />
          ))}
        </ul>
      )}

      {/* ประกาศผลการกด — อ่านออกเสียงให้โปรแกรมอ่านหน้าจอด้วย */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm ${toast ? "" : "pointer-events-none"}`}
      >
        {toast && (
          <p className="altar-card-porcelain !rounded-xl px-4 py-3 text-sm font-semibold text-ink shadow-md">{toast}</p>
        )}
      </div>

      {/* หน้าต่างเพิ่ม/แก้ไข */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => (saving ? undefined : setIsModalOpen(false))}
        title={editing ? `แก้ไขข้อมูล ${editing.displayName}` : "เพิ่มแม่หมอ"}
        description={editing ? undefined : "กรอกเท่าที่มี แก้ทีหลังได้เสมอ · ช่องที่มี * ต้องกรอก"}
        maxWidth="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>
              ยกเลิก
            </Button>
            <Button type="submit" form="reader-form" variant="gold" aria-disabled={saving}>
              {saving ? "กำลังบันทึก…" : editing ? "บันทึก" : "เพิ่มแม่หมอ"}
            </Button>
          </div>
        }
      >
        <form id="reader-form" onSubmit={handleSave} noValidate className="space-y-6 pt-1">
          {/* ♿ R-21: ประกาศข้อความผิดพลาดให้โปรแกรมอ่านหน้าจอทันทีที่โหนดปรากฏ */}
          {formError && (
            <div role="alert" className="rounded-xl border border-err/30 bg-err-wash p-3 text-sm text-err">
              {formError}
            </div>
          )}

          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-bold text-ink">ข้อมูลที่ลูกค้าเห็น</legend>
            <Field label="ชื่อที่ลูกค้าเห็น *" error={fieldErrors.displayName}>
              {(field) => (
                <Input
                  {...field}
                  ref={fieldRefs.displayName}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="เช่น แม่หมอจันทร์เจ้า"
                  autoComplete="off"
                />
              )}
            </Field>

            <Field label="แนะนำตัว" hint="ขึ้นในหน้าโปรไฟล์ — เล่าประสบการณ์และสไตล์การดู">
              {(field) => (
                <Textarea
                  {...field}
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="เช่น ดูไพ่มา 8 ปี ถนัดเรื่องความรัก พูดตรงแต่ใจดี"
                />
              )}
            </Field>

            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <Field
                  label="รูปโปรไฟล์ (ลิงก์รูป)"
                  hint="วางลิงก์รูปที่ขึ้นต้นด้วย https:// · เว้นว่างได้ ระบบใช้ตัวอักษรแรกของชื่อแทน"
                  error={fieldErrors.avatarUrl}
                >
                  {(field) => (
                    <Input
                      {...field}
                      ref={fieldRefs.avatarUrl}
                      type="url"
                      inputMode="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://…"
                    />
                  )}
                </Field>
              </div>
              <Avatar name={displayName || "?"} url={isHttpUrl(avatarUrl.trim()) ? avatarUrl.trim() : null} className="mt-6 h-12 w-12" />
            </div>

            <Field
              label="เรื่องที่ถนัด"
              hint="คั่นแต่ละเรื่องด้วยจุลภาค ( , ) สูงสุด 10 เรื่อง"
              error={fieldErrors.specialties}
            >
              {(field) => (
                <Input
                  {...field}
                  ref={fieldRefs.specialties}
                  value={specialtiesText}
                  onChange={(e) => setSpecialtiesText(e.target.value)}
                  placeholder="ความรัก, การงาน, การเงิน"
                />
              )}
            </Field>
            {specialties.length > 0 && (
              <ul aria-label="ตัวอย่างป้ายเรื่องที่ถนัด" className="-mt-2 flex flex-wrap gap-1.5">
                {specialties.slice(0, 10).map((s, i) => (
                  <li key={`${s}-${i}`} className="glass-chip px-2.5 py-0.5 text-xs font-medium text-ink">
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-bold text-ink">ราคาและการติดต่อ</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="ค่าดูดวงต่อครั้ง (บาท)"
                hint={`ครั้งละ ${CONSULTATION_MINUTES} นาที · เว้นว่าง = ราคากลาง ${CONSULTATION_PRICE_THB} บาท`}
                error={fieldErrors.price}
              >
                {(field) => (
                  <Input
                    {...field}
                    ref={fieldRefs.price}
                    type="number"
                    inputMode="numeric"
                    min={READER_PRICE_MIN_THB}
                    max={READER_PRICE_MAX_THB}
                    placeholder={String(CONSULTATION_PRICE_THB)}
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value)}
                  />
                )}
              </Field>
              <Field
                label="ส่วนแบ่งของเว็บ (%)"
                hint={split ? `ต่อครั้ง: เว็บได้ ${baht(split.fee)} · แม่หมอได้ ${baht(split.net)}` : "หักจากค่าดูดวงแต่ละครั้ง"}
                error={fieldErrors.commission}
              >
                {(field) => (
                  <Input
                    {...field}
                    ref={fieldRefs.commission}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={commissionText}
                    onChange={(e) => setCommissionText(e.target.value)}
                  />
                )}
              </Field>
            </div>
            <p className="-mt-2 text-xs text-muted">ราคาใหม่ใช้กับการจองครั้งถัดไป — นัดที่จ่ายเงินแล้วไม่เปลี่ยน</p>

            <Field
              label="LINE ของแม่หมอ *"
              hint="ลูกค้าจะเห็นเมื่อถึงคิวคุยแล้ว (ไว้ติดต่อกันถ้าวิดีโอมีปัญหา) · ใส่ลิงก์ line.me หรือ @ไอดี"
              error={fieldErrors.lineUrl}
            >
              {(field) => (
                <Input
                  {...field}
                  ref={fieldRefs.lineUrl}
                  value={lineUrl}
                  onChange={(e) => setLineUrl(e.target.value)}
                  placeholder="https://line.me/ti/p/~ไอดี หรือ @ไอดี"
                  autoComplete="off"
                />
              )}
            </Field>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-3 text-sm font-bold text-ink">สถานะ</legend>
            {(["approved", "pending", "suspended"] as const).map((s) => (
              <label
                key={s}
                className={`tap-overlay-y flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                  status === s ? "border-gold-ink bg-inset-warm" : "border-line bg-surface hover:border-line-warm"
                }`}
              >
                <input
                  type="radio"
                  name="reader-status"
                  value={s}
                  checked={status === s}
                  onChange={() => setStatus(s)}
                  className="mt-1 h-4 w-4 shrink-0 accent-gold-ink"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{STATUS_INFO[s].label}</span>
                  <span className="block text-xs text-muted">{STATUS_INFO[s].detail}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {editing && (
            <div className="border-t border-line pt-4">
              {!showDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className="tap-overlay-y min-h-11 text-sm font-semibold text-err underline underline-offset-2"
                >
                  ลบแม่หมอคนนี้ออกจากระบบ…
                </button>
              ) : (
                <div className="space-y-3 rounded-xl border border-err/30 bg-err-wash p-4">
                  <p className="text-sm font-bold text-err">ลบแล้วกู้คืนไม่ได้</p>
                  <p className="text-sm leading-relaxed text-ink">
                    ประวัตินัด การชำระเงิน รีวิว และข้อมูลในสตูดิโอของ {editing.displayName} จะถูกลบทั้งหมด
                    {editing.activity && editing.activity.upcoming + editing.activity.liveWaiting > 0
                      ? ` — ตอนนี้ยังมีลูกค้าที่จ่ายเงินแล้วรออยู่ ${editing.activity.upcoming + editing.activity.liveWaiting} ราย`
                      : ""}
                    {" "}ถ้าแค่อยากหยุดชั่วคราว ให้เลือกสถานะ &quot;พักงาน&quot; แทน
                  </p>
                  <Field label={`พิมพ์ชื่อ "${editing.displayName}" เพื่อยืนยัน`} error={deleteError ?? undefined}>
                    {(field) => (
                      <Input
                        {...field}
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        autoComplete="off"
                      />
                    )}
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleDelete()}
                      aria-disabled={saving}
                      className="border-err/40 text-err hover:border-err"
                    >
                      ลบถาวร
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowDelete(false);
                        setDeleteConfirmText("");
                        setDeleteError(null);
                      }}
                    >
                      ไม่ลบ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

/** 3 ขั้นตั้งแต่เพิ่มแม่หมอจนลูกค้าจองได้ — ใช้ทั้งในกล่องย่อและหน้าว่าง */
function StartSteps() {
  const steps = [
    { title: "เพิ่มแม่หมอ แล้วตั้งสถานะ \"ใช้งานอยู่\"", body: "โปรไฟล์จะขึ้นหน้าเว็บทันที" },
    {
      title: "กด \"ส่งลิงก์เข้าแผงให้แม่หมอ\"",
      body: "แม่หมอเปิดลิงก์แล้วตั้งเวลาว่างประจำสัปดาห์ หรือเปิดรับคิวสด · ลิงก์ใช้ได้ 30 วัน (เลือกสั้นกว่านี้ได้) · ลิงก์หลุดไปถึงคนอื่น กด \"ยกเลิกลิงก์เก่าทั้งหมด\" ได้ทันที",
    },
    {
      title: "ส่ง \"ลิงก์หน้าจอง\" ให้ลูกค้า",
      body: "ลูกค้าเลือกเวลา จ่ายเงิน แล้วคุยวิดีโอกับแม่หมอในเว็บได้เองครบ",
    },
  ];
  return (
    <ol className="mt-3 space-y-3">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-ink/10 text-sm font-bold text-gold-ink"
          >
            {i + 1}
          </span>
          <span className="text-sm leading-relaxed">
            <span className="block font-semibold text-ink">{s.title}</span>
            <span className="block text-muted">{s.body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Avatar({ name, url, className = "" }: { name: string; url: string | null; className?: string }) {
  // ลิงก์รูปเสีย (ลบรูปไปแล้ว/พิมพ์ผิด) ➔ ใช้ตัวอักษรแรกแทน ไม่โชว์กรอบรูปแตก
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <span
      aria-hidden
      className={`glass-chip flex shrink-0 items-center justify-center overflow-hidden text-lg font-bold text-ink ${className}`}
    >
      {url && url !== failedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="" /* ภาพประกอบล้วน — ชื่อแม่หมอพิมพ์อยู่ข้าง ๆ แล้ว (INC-0125) */
          onError={() => setFailedUrl(url)}
          className="h-full w-full object-cover"
        />
      ) : (
        name.trim().charAt(0) || "?"
      )}
    </span>
  );
}

/** ลูกค้าที่เปิดลิงก์ของแม่หมอคนนี้ "ตอนนี้" จะทำอะไรได้ — คำเดียวกับการ์ด "ส่งลิงก์ให้ลูกค้า" ในแผงแม่หมอ */
function ActivityBox({ activity, nowMs }: { activity: ReaderActivity; nowMs: number }) {
  const nextLabel = activity.nextSlot ? `${relativeDayLabel(activity.nextSlot, nowMs)} ${formatTime(activity.nextSlot)} น.` : null;
  const tone = activity.isLiveOpen ? "border-ok/30 bg-ok/10" : nextLabel ? "border-line bg-inset-warm" : "border-err/30 bg-err-wash";
  const extras: string[] = [];
  if (activity.liveWaiting > 0) extras.push(`ลูกค้าคิวสดจ่ายเงินแล้วรอคุย ${activity.liveWaiting} คน`);
  if (activity.upcoming > 0) extras.push(`นัดที่จะถึง ${activity.upcoming} นัด`);
  return (
    <div className={`rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${tone}`}>
      <p className="font-semibold text-ink">
        {activity.isLiveOpen ? (
          <>ลูกค้าคุยได้ทันที <span className="font-normal text-muted">(เปิดคิวสดอยู่)</span></>
        ) : nextLabel ? (
          <>ลูกค้านัดได้เร็วสุด {nextLabel}</>
        ) : (
          <span className="text-err">ลูกค้ายังจองไม่ได้</span>
        )}
      </p>
      {!activity.isLiveOpen && !nextLabel && (
        <p className="text-muted">
          {activity.hasSchedule
            ? "เวลาว่างเต็ม หรือปิดทุกวันใน 14 วันข้างหน้า — ให้แม่หมอเพิ่มเวลาว่างในแผงแม่หมอ"
            : "แม่หมอยังไม่ได้ตั้งเวลาว่าง — ส่งลิงก์เข้าแผงให้แม่หมอไปตั้ง หรือเปิดรับคิวสด"}
        </p>
      )}
      {extras.length > 0 && <p className="text-ink">{extras.join(" · ")}</p>}
    </div>
  );
}

function ReaderCard({
  reader: r,
  nowMs,
  busy,
  linkPanel,
  confirmingPause,
  onSendLink,
  onCloseLink,
  onChangeLinkDays,
  confirmingRevoke,
  onAskRevoke,
  onCancelRevoke,
  onConfirmRevoke,
  onCopyLink,
  onOpenConsole,
  onCopyBooking,
  onEdit,
  onApprove,
  onAskPause,
  onCancelPause,
  onConfirmPause,
}: {
  reader: ReaderRow;
  nowMs: number;
  busy: string | null;
  linkPanel: ConsoleLink | null;
  confirmingPause: boolean;
  onSendLink: () => void;
  onCloseLink: () => void;
  onChangeLinkDays: (days: ConsoleLinkDays) => void;
  confirmingRevoke: boolean;
  onAskRevoke: () => void;
  onCancelRevoke: () => void;
  onConfirmRevoke: () => void;
  onCopyLink: (link: string) => void;
  onOpenConsole: () => void;
  onCopyBooking: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onAskPause: () => void;
  onCancelPause: () => void;
  onConfirmPause: () => void;
}) {
  const info = STATUS_INFO[r.status];
  const price = readerPriceThb(r);
  // เปิดกล่องยืนยันแล้วย้ายโฟกัสไปที่กล่อง — โปรแกรมอ่านหน้าจออ่านคำเตือนก่อนถึงปุ่มยืนยัน
  const pauseRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (confirmingPause) pauseRef.current?.focus();
  }, [confirmingPause]);
  const waitingCustomers = (r.activity?.upcoming ?? 0) + (r.activity?.liveWaiting ?? 0);
  const lineHref = isHttpUrl(r.lineUrl) ? r.lineUrl : null;
  const secondary =
    "tap-overlay-y inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:border-line-warm";

  return (
    <li id={`reader-${r.id}`} className="altar-card-porcelain altar-panel flex flex-col gap-4 p-4 sm:p-5">
      {/* ใคร · สถานะ · ราคา */}
      <div className="flex items-start gap-3">
        <Avatar name={r.displayName} url={r.avatarUrl} className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-ink">{r.displayName}</h3>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${info.chip}`}>
              {info.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {baht(price)} / {CONSULTATION_MINUTES} นาที{r.priceThb ? "" : " (ราคากลาง)"} · เว็บหัก {r.commissionPct}%
          </p>
          {r.specialties.length > 0 && <p className="mt-0.5 text-sm text-muted">ถนัด: {r.specialties.join(" · ")}</p>}
        </div>
      </div>

      {r.status === "approved" && r.activity && <ActivityBox activity={r.activity} nowMs={nowMs} />}
      {r.status !== "approved" && <p className="text-sm text-muted">{info.detail}</p>}

      {/* ลิงก์เข้าแผงแม่หมอ — เปิดเมื่อกดส่งลิงก์ / หลังเพิ่ม-อนุมัติ */}
      {linkPanel && (
        <div
          role="region"
          aria-label={`ลิงก์เข้าแผงของ ${r.displayName}`}
          className="space-y-3 rounded-xl border border-gold-ink/30 bg-inset-warm p-4"
        >
          {linkPanel.note && <p className="text-sm font-semibold text-ink">{linkPanel.note}</p>}
          <label className="block text-sm font-semibold text-ink" htmlFor={`console-link-${r.id}`}>
            ลิงก์เข้าแผงแม่หมอของ {r.displayName}
          </label>
          <input
            id={`console-link-${r.id}`}
            readOnly
            value={linkPanel.link}
            onFocus={(e) => e.currentTarget.select()}
            className="min-h-11 w-full rounded-lg border border-line-interactive-warm bg-surface px-3 font-mono text-xs text-ink-deep"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span id={`link-days-${r.id}`} className="text-xs font-semibold text-ink">
              อายุลิงก์
            </span>
            <div role="radiogroup" aria-labelledby={`link-days-${r.id}`} className="flex gap-1 rounded-lg bg-surface p-1">
              {CONSOLE_LINK_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={linkPanel.days === d}
                  onClick={() => linkPanel.days !== d && onChangeLinkDays(d)}
                  className={`tap-overlay-y min-h-11 rounded-md px-3 text-sm font-semibold transition-colors ${
                    linkPanel.days === d ? "bg-gold-ink text-surface" : "text-muted hover:text-ink"
                  }`}
                >
                  {consoleLinkDaysLabel(d)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            ใช้ได้ถึง <strong className="font-semibold text-ink">{formatExpiry(linkPanel.expiresAt)}</strong> (
            {consoleLinkDaysLabel(linkPanel.days)}) · ลิงก์นี้เป็นกุญแจเข้าแผงของแม่หมอ ส่งให้แม่หมอคนนี้คนเดียว
            อย่าโพสต์ในกลุ่ม
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="gold" size="sm" onClick={() => onCopyLink(linkPanel.link)} className="text-sm">
              คัดลอกลิงก์เข้าแผง
            </Button>
            <a
              href={`https://line.me/R/msg/text/?${encodeURIComponent(
                `ลิงก์เข้าแผงแม่หมอของ ${r.displayName} (ใช้ได้ถึง ${formatExpiry(linkPanel.expiresAt)})\n${linkPanel.link}\nเปิดแล้วตั้งเวลาว่าง หรือเปิดรับคิวสดได้เลย`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              /* เขียวโทเคน ok (ตัวขาว 5.9:1) — เขียว LINE สดกับตัวขาวได้แค่ 2.26:1 */
              className="inline-flex min-h-11 items-center justify-center rounded px-4 text-sm font-bold text-white bg-ok transition-opacity hover:opacity-90"
            >
              ส่งทาง LINE
            </a>
            <Button type="button" variant="ghost" size="sm" onClick={onCloseLink} className="text-sm">
              ปิด
            </Button>
          </div>
          {!confirmingRevoke ? (
            <button
              type="button"
              onClick={onAskRevoke}
              className="tap-overlay-y min-h-11 text-left text-sm font-semibold text-err underline underline-offset-2"
            >
              ลิงก์หลุดไปถึงคนอื่น? ยกเลิกลิงก์เก่าทั้งหมด…
            </button>
          ) : (
            <div role="group" aria-labelledby={`revoke-title-${r.id}`} className="space-y-2 rounded-lg border border-err/30 bg-err-wash p-3">
              <p id={`revoke-title-${r.id}`} className="text-sm font-bold text-err">
                ยกเลิกลิงก์เก่าของ {r.displayName} ทั้งหมด?
              </p>
              <p className="text-sm leading-relaxed text-ink">
                ลิงก์ทุกอันที่เคยส่งให้แม่หมอคนนี้จะใช้ไม่ได้ทันที — รวมแผงที่เปิดค้างไว้ แล้วระบบจะสร้างลิงก์ใหม่ให้ส่งแทน
                {waitingCustomers > 0 ? ` · มีลูกค้าที่จ่ายเงินแล้วรออยู่ ${waitingCustomers} ราย ส่งลิงก์ใหม่ให้แม่หมอทันทีหลังกด` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onConfirmRevoke}
                  aria-disabled={busy !== null}
                  className="border-err/40 text-sm text-err hover:border-err"
                >
                  {busy === `revoke:${r.id}` ? "กำลังยกเลิก…" : "ยืนยันยกเลิกลิงก์เก่า"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onCancelRevoke} className="text-sm">
                  ไม่ยกเลิก
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ยืนยันพักงาน */}
      {confirmingPause && (
        <div
          ref={pauseRef}
          tabIndex={-1}
          role="group"
          aria-labelledby={`pause-title-${r.id}`}
          className="space-y-3 rounded-xl border border-err/30 bg-err-wash p-4 focus:outline-none"
        >
          <p id={`pause-title-${r.id}`} className="text-sm font-bold text-err">
            พักงาน {r.displayName}?
          </p>
          <p className="text-sm leading-relaxed text-ink">
            โปรไฟล์จะหายจากหน้าเว็บ ลูกค้าจองใหม่ไม่ได้ และแม่หมอจะเข้าแผงไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง
          </p>
          {waitingCustomers > 0 && (
            <p className="text-sm font-semibold text-err">
              สำคัญ: ยังมีลูกค้าที่จ่ายเงินแล้วรออยู่ {waitingCustomers} ราย — พักงานแล้วแม่หมอจะเข้าไปคุยกับลูกค้าไม่ได้
              ควรให้แม่หมอคุยหรือยกเลิกคืนเงินให้เรียบร้อยก่อน
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onConfirmPause}
              aria-disabled={busy !== null}
              className="border-err/40 text-sm text-err hover:border-err"
            >
              {busy === `status:${r.id}` ? "กำลังพักงาน…" : "ยืนยันพักงาน"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancelPause} className="text-sm">
              ไม่พักงาน
            </Button>
          </div>
        </div>
      )}

      {/* ปุ่ม — ปุ่มหลักตามสถานะ แล้วตามด้วยปุ่มรอง */}
      <div className="flex flex-col gap-2 border-t border-line pt-3">
        {r.status === "approved" ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="gold" onClick={onSendLink} aria-disabled={busy !== null}>
                {busy === `link:${r.id}` ? "กำลังสร้างลิงก์…" : "ส่งลิงก์เข้าแผงให้แม่หมอ"}
              </Button>
              <Button type="button" variant="outline" onClick={onOpenConsole} aria-disabled={busy !== null}>
                {busy === `open:${r.id}` ? "กำลังเปิด…" : "เปิดแผงแม่หมอ"}
                <span aria-hidden className="text-muted">↗</span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onCopyBooking} className={secondary}>
                คัดลอกลิงก์หน้าจองให้ลูกค้า
              </button>
              <a href={`/readers/${r.id}`} target="_blank" rel="noopener noreferrer" className={secondary}>
                ดูหน้าโปรไฟล์ <span aria-hidden className="ml-1 text-muted">↗</span>
              </a>
              {lineHref && (
                <a href={lineHref} target="_blank" rel="noopener noreferrer" className={secondary}>
                  ทักแม่หมอทาง LINE
                </a>
              )}
              <button type="button" onClick={onEdit} className={secondary}>
                แก้ไขข้อมูล
              </button>
              {!confirmingPause && (
                <button type="button" onClick={onAskPause} className={`${secondary} text-err`}>
                  พักงาน
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="gold" onClick={onApprove} aria-disabled={busy !== null}>
              {busy === `status:${r.id}`
                ? "กำลังบันทึก…"
                : r.status === "pending"
                  ? "อนุมัติให้เริ่มรับลูกค้า"
                  : "เปิดใช้งานอีกครั้ง"}
            </Button>
            <Button type="button" variant="outline" onClick={onEdit}>
              แก้ไขข้อมูล
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}
