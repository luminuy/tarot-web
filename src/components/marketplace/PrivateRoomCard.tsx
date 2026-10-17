"use client";

import { useState } from "react";

import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { formatTime, relativeDayLabel } from "@/lib/marketplace/booking-policy";
import type { InviteState, InviteView } from "@/lib/marketplace/invites.repo";

const LABEL_MAX = 40;

const STATE_CHIP: Record<InviteState, { text: string; className: string }> = {
  open: { text: "รอลูกค้าเปิดลิงก์", className: "border-line-warm bg-inset-warm text-ink" },
  paying: { text: "ลูกค้ากำลังชำระเงิน", className: "border-amber-200 bg-amber-50 text-amber-700" },
  paid: { text: "จ่ายแล้ว · รอคุณรับเข้าห้อง", className: "border-ok/30 bg-ok/10 text-ok" },
  in_room: { text: "กำลังคุยในห้อง", className: "border-ok/30 bg-ok/10 text-ok" },
  done: { text: "คุยเสร็จแล้ว", className: "border-line bg-surface text-muted" },
  expired: { text: "หมดอายุ", className: "border-line bg-surface text-muted" },
  cancelled: { text: "ยกเลิกแล้ว", className: "border-line bg-surface text-muted" },
};

function customerName(label: string | null): string {
  return label ? `คุณ${label}` : "ลูกค้า (ไม่ได้ใส่ชื่อ)";
}

function lineMessage(readerName: string, url: string): string {
  return `ห้องคุยดูดวงส่วนตัวกับ ${readerName} ค่ะ แตะลิงก์ ชำระเงิน แล้วรอแม่หมอรับเข้าห้องได้เลย ${url}`;
}

/** ช่องลิงก์ + คัดลอก + ส่งทาง LINE (หน้าตาเดียวกับการ์ด "ส่งลิงก์ให้ลูกค้า") */
function LinkActions({ url, readerName, inputLabel }: { url: string; readerName: string; inputLabel: string }) {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied("idle"), 2500);
  };
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        readOnly
        value={url}
        aria-label={inputLabel}
        onFocus={(e) => e.currentTarget.select()}
        className="min-h-[46px] min-w-0 flex-1 rounded-xl border border-line-interactive-warm bg-surface px-3 font-mono text-[12px] text-ink-deep"
      />
      <button
        type="button"
        onClick={() => void copy()}
        className="min-h-[46px] shrink-0 rounded-full border border-line-interactive-warm bg-surface px-5 font-serif-th text-sm font-semibold text-ink-deep transition-colors cursor-pointer hover:border-gold-ink"
      >
        <span aria-live="polite">{copied === "ok" ? "คัดลอกแล้ว" : copied === "fail" ? "กดค้างที่ลิงก์เพื่อคัดลอก" : "คัดลอกลิงก์ห้อง"}</span>
      </button>
      <a
        href={`https://line.me/R/msg/text/?${encodeURIComponent(lineMessage(readerName, url))}`}
        target="_blank"
        rel="noopener noreferrer"
        /* เขียวโทเคน ok (ตัวขาว 5.9:1) — เขียว LINE สดกับตัวขาวได้แค่ 2.26:1 */
        className="inline-flex min-h-[46px] shrink-0 items-center justify-center rounded-full bg-ok px-5 font-serif-th text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        ส่งลิงก์ห้องทาง LINE
      </a>
    </div>
  );
}

/**
 * ✦ ห้องคุยส่วนตัว — แม่หมอสร้างลิงก์ให้ลูกค้าคนเดียวแล้วส่งทาง LINE (แผน CONSULT_FLOW คลื่น 7 · migrations/0032)
 * ---------------------------------------------------------------------------
 * เจ้าของถาม 2026-10-12 "สร้างลิงก์เข้าห้องให้ลูกค้าได้โดยตรงไหม แบบ Google Meet" ➔ เคาะ "จ่ายบนเว็บก่อนเข้า"
 *   สร้างลิงก์ ➔ ส่งทาง LINE ➔ ลูกค้าจ่าย ➔ การ์ดคิวขึ้นป้าย "ห้องส่วนตัว" ➔ กด "รับเข้าห้อง" = เปิดห้องวิดีโอทันที
 * - ใช้ได้แม้ปิดคิวสดอยู่ · ลูกค้าคนเดียว · 24 ชม. · ยกเลิกได้ (จ่ายแล้วต้องยกเลิกที่การ์ดคิว ซึ่งคืนเงินให้)
 * - สถานะในรายการมากับการถามคิวทุก 5 วินาที แม่หมอจึงเห็น "กำลังชำระเงิน ➔ จ่ายแล้ว" โดยไม่ต้องรีเฟรช
 */
export function PrivateRoomCard({
  invites,
  readerName,
  priceThb,
  nowMs,
  authHeaders,
  onChanged,
}: {
  invites: InviteView[];
  readerName: string;
  priceThb: number | null;
  nowMs: number;
  authHeaders: () => HeadersInit;
  /** สร้าง/ยกเลิกแล้ว — ให้แผงโหลดคิวใหม่และแสดงข้อความ */
  onChanged: (message: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<InviteView | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const until = (ms: number) => `${relativeDayLabel(ms, nowMs)} ${formatTime(ms)} น.`;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/console/invites", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ label: label.trim() || null }),
      });
      const data = (await res.json().catch(() => ({}))) as { invite?: InviteView; error?: string };
      if (!res.ok || !data.invite) {
        setError(data.error || "สร้างลิงก์ห้องไม่สำเร็จ ลองใหม่อีกครั้ง");
        return;
      }
      setCreated(data.invite);
      setLabel("");
      onChanged("สร้างลิงก์ห้องแล้ว — คัดลอกหรือกดส่งทาง LINE ให้ลูกค้าได้เลย");
    } catch {
      setError("เชื่อมต่อไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setCreating(false);
    }
  };

  const cancel = async (invite: InviteView) => {
    setBusyId(invite.id);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/console/invites", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ inviteId: invite.id, action: "cancel" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "ยกเลิกลิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง");
        return;
      }
      setConfirmId(null);
      if (created?.id === invite.id) setCreated(null);
      onChanged(`ยกเลิกลิงก์ห้องของ${customerName(invite.label)}แล้ว — ลิงก์นี้เปิดไม่ได้อีก`);
    } catch {
      setError("เชื่อมต่อไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setBusyId(null);
    }
  };

  // ลิงก์ที่เพิ่งสร้างโชว์เด่นด้านบนจนกว่าลูกค้าจะเริ่มใช้ — จากนั้นย้ายไปอยู่ในรายการ (เห็นสถานะ "กำลังจ่าย/จ่ายแล้ว")
  const createdNow = created ? (invites.find((i) => i.id === created.id) ?? null) : null;
  const showCreated = created !== null && (createdNow === null || createdNow.state === "open");
  const listed = invites.filter((i) => !(showCreated && i.id === created?.id));

  /** ยกเลิกต้องยืนยันในการ์ด (ไม่ใช่ confirm() ของเบราว์เซอร์) — ใช้ทั้งกล่องลิงก์ใหม่และรายการ */
  const cancelControl = (invite: InviteView) =>
    confirmId === invite.id ? (
      <div role="group" aria-label="ยืนยันยกเลิกลิงก์ห้อง" className="space-y-2 rounded-xl border border-err/30 bg-err-wash p-3">
        <p className="text-[13px] leading-relaxed text-err">
          ยกเลิกแล้วลูกค้าจะเปิดลิงก์นี้ไม่ได้อีก
          {invite.state === "paying" ? " ลูกค้าที่กำลังจ่ายจะไม่ถูกตัดเงิน (ถ้าเงินเข้าไปแล้ว ระบบคืนให้เอง)" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-disabled={busyId === invite.id}
            onClick={() => void cancel(invite)}
            className="min-h-[44px] rounded-full bg-err px-4 text-sm font-bold text-white cursor-pointer aria-disabled:opacity-60"
          >
            {busyId === invite.id ? "กำลังยกเลิก…" : "ยืนยันยกเลิกลิงก์"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmId(null)}
            className="min-h-[44px] rounded-full border border-line-interactive-warm bg-surface px-4 text-sm font-semibold text-ink-deep cursor-pointer"
          >
            ไม่ยกเลิก
          </button>
        </div>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setConfirmId(invite.id)}
        className="tap-overlay-y text-[13px] font-semibold text-err underline underline-offset-2 cursor-pointer"
      >
        ยกเลิกลิงก์นี้
      </button>
    );

  return (
    <section aria-labelledby="private-room-heading" className="altar-card-porcelain !rounded-3xl space-y-4 p-5 sm:p-6">
      <div className="space-y-1">
        <h2 id="private-room-heading" className="font-serif-th text-lg font-bold text-ink">
          <ThaiPhrases>ห้องคุยส่วนตัว</ThaiPhrases>
        </h2>
        <p className="font-serif-th text-[13px] leading-relaxed text-muted">
          <ThaiPhrases>
            {`สร้างลิงก์ให้ลูกค้าคนเดียวแล้วส่งทาง LINE — ลูกค้าแตะลิงก์ จ่าย${priceThb ? ` ${priceThb} บาท` : ""}ผ่านเว็บ แล้วรอให้คุณกด "รับเข้าห้อง" ใช้ได้แม้ปิดรับคิวสดอยู่`}
          </ThaiPhrases>
        </p>
      </div>

      <form onSubmit={(e) => void create(e)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="private-room-label" className="text-xs font-semibold tracking-wide text-gold-ink">
            ชื่อลูกค้า (ไม่บังคับ)
          </label>
          <input
            id="private-room-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={LABEL_MAX}
            autoComplete="off"
            placeholder="เช่น บีม — ลูกค้าไม่ต้องพิมพ์ชื่อเอง"
            className="min-h-[46px] w-full rounded-xl border border-line-interactive-warm bg-surface px-3 text-base text-ink-deep placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink/30"
          />
        </div>
        <button
          type="submit"
          aria-disabled={creating}
          className="btn-gold-glass min-h-[46px] shrink-0 px-6 font-serif-th text-sm font-bold cursor-pointer aria-disabled:opacity-60"
        >
          {creating ? "กำลังสร้าง…" : "สร้างลิงก์ห้อง"}
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-err/30 bg-err-wash p-3 font-serif-th text-[13px] text-err">
          {error}
        </p>
      )}

      {showCreated && created && (
        <div role="status" className="space-y-3 rounded-2xl border border-ok/30 bg-ok/10 p-4 font-serif-th">
          <p className="text-sm font-bold text-ink-deep">
            ลิงก์ห้องของ{customerName(created.label)}พร้อมส่งแล้ว
          </p>
          <p className="text-[13px] leading-relaxed text-ink">
            ใช้ได้ถึง {until(created.expiresAt)} · ลูกค้าคนเดียว · จ่ายแล้วการ์ดของลูกค้าจะขึ้นในรายการคิวด้านล่าง
          </p>
          <LinkActions url={created.url} readerName={readerName} inputLabel="ลิงก์ห้องที่เพิ่งสร้าง" />
          {/* ส่งผิดคน/สร้างซ้ำ ➔ ยกเลิกได้ทันที ไม่ต้องรีเฟรชหน้าก่อน */}
          {cancelControl(created)}
        </div>
      )}

      {listed.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-serif-th text-sm font-bold text-ink">ลิงก์ห้องที่ยังใช้ได้</h3>
          <ul className="space-y-2">
            {listed.map((invite) => {
              const chip = STATE_CHIP[invite.state];
              const canCancel = invite.state === "open" || invite.state === "paying";
              return (
                <li key={invite.id} className="space-y-2.5 rounded-2xl border border-line-warm bg-surface p-3.5 font-serif-th">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink-deep">{customerName(invite.label)}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[13px] font-semibold ${chip.className}`}>{chip.text}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted">
                    {invite.state === "paid"
                      ? 'กด "รับเข้าห้อง" ที่การ์ดของลูกค้าในรายการคิวด้านล่าง'
                      : invite.state === "in_room"
                        ? "ห้องวิดีโอของลูกค้าคนนี้อยู่ในรายการคิวด้านล่าง"
                        : invite.state === "done"
                        ? "ลิงก์นี้ใช้ไปแล้ว"
                        : `ใช้ได้ถึง ${until(invite.expiresAt)}`}
                  </p>
                  {invite.state === "open" && (
                    <LinkActions url={invite.url} readerName={readerName} inputLabel={`ลิงก์ห้องของ${customerName(invite.label)}`} />
                  )}
                  {canCancel && cancelControl(invite)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
