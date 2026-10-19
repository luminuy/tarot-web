"use client";

/**
 * ⌨️ ค้นหาเมนูแอดมิน (Ctrl+K / Cmd+K) — พิมพ์ไม่กี่ตัวแล้วกด Enter ไปหน้านั้นทันที
 * ค้นจากชื่อเมนู · คำอธิบาย · ชื่อหมวด · คำค้นเสริม (เช่น "stripe" "คืนเงิน" "ราคา")
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { useDialogBehavior } from "@/lib/use-dialog-behavior";

export interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  group: string;
  keywords?: string;
}

export function CommandPalette({ open, onClose, items, onSelect }: { open: boolean; onClose: () => void; items: PaletteItem[]; onSelect: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setActive(0);
  }, [open]);

  // A5-10: Esc ปิดได้แม้โฟกัสไม่ได้อยู่ในกล่อง · กัก Tab ในกล่อง · คืนโฟกัสให้ปุ่มที่เปิด · โฟกัสเข้าช่องค้นหาตอนเปิด (ฮุกกลาง)
  useDialogBehavior(open, onClose, dialogRef);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((i) => `${i.label} ${i.hint} ${i.group} ${i.keywords ?? ""}`.toLowerCase().includes(t));
  }, [q, items]);

  if (!open) return null;

  const choose = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="ค้นหาเมนูแอดมิน"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-white shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(results.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && results[active]) {
            e.preventDefault();
            choose(results[active].id);
          }
        }}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          placeholder="พิมพ์ชื่อเมนู เช่น คืนเงิน สมาชิก stripe"
          aria-label="ค้นหาเมนู"
          aria-controls="admin-palette-list"
          className="w-full border-b border-line-interactive px-4 py-3 text-sm text-ink outline-none"
        />
        <ul id="admin-palette-list" role="listbox" className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 ? <li className="px-4 py-6 text-center text-xs text-muted">ไม่พบเมนู</li> : null}
          {results.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(r.id)}
              className={`cursor-pointer px-4 py-2 ${i === active ? "bg-canvas" : ""}`}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink">{r.label}</span>
                <span className="shrink-0 text-[11px] text-muted">{r.group}</span>
              </span>
              <span className="block text-[11px] text-muted">{r.hint}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-4 py-2 text-[11px] text-muted">ลูกศรขึ้นลงเพื่อเลือก · Enter เพื่อเปิด · Esc เพื่อปิด</p>
      </div>
    </div>
  );
}
