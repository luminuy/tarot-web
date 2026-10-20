"use client";

/**
 * 🧱 โครงหน้ากลางของแผงแอดมิน — ทุกเมนูจัดหน้าขวาแบบเดียวกัน
 * ---------------------------------------------------------------------------
 *   1. สรุปตัวเลขบนสุด (`KpiGrid` + `StatCard`)
 *   2. แท็บหมวดย่อยในหน้า (`AdminSubTabs`) — จำค่าใน URL `?sub=` เปิดลิงก์เดิมแล้วกลับมาที่หมวดเดิม
 *   3. การ์ดแต่ละส่วน (`AdminSection`) มีหัวข้อ คำอธิบายหนึ่งบรรทัด และปุ่มของส่วนนั้นชิดขวา
 *
 * เพิ่มหน้าแอดมินใหม่ให้ประกอบจากชิ้นเหล่านี้ จะได้หน้าตาและวิธีใช้เหมือนกันทั้งระบบ
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, type ReactNode } from "react";
import { useDialogBehavior } from "@/lib/use-dialog-behavior";

import { CloseIcon } from "@/components/ui/LineIcons";

export interface SubTab<T extends string> {
  id: T;
  label: string;
  /** คำอธิบายสั้นใต้ชื่อแท็บ */
  hint?: string;
  /** ตัวเลขเตือนข้างชื่อแท็บ (แสดงเมื่อ > 0) */
  count?: number | null;
  /** สีของตัวเลข — `alert` ใช้กับเรื่องที่ต้องทำทันที */
  tone?: "alert" | "neutral";
}

/** แท็บย่อยที่จำค่าใน URL `?sub=` · ค่าที่ไม่รู้จักถอยไปแท็บแรก */
export function useSubTab<T extends string>(ids: readonly T[], fallback: T = ids[0]): [T, (id: T) => void] {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("sub");
  const current = (ids as readonly string[]).includes(raw ?? "") ? (raw as T) : fallback;
  const set = useCallback(
    (id: T) => {
      const next = new URLSearchParams(window.location.search);
      next.set("sub", id);
      router.replace(`${window.location.pathname}?${next.toString()}`, { scroll: false });
    },
    [router],
  );
  return [current, set];
}

export function AdminSubTabs<T extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: SubTab<T>[];
  active: T;
  onChange: (id: T) => void;
  /** ชื่อกลุ่มแท็บสำหรับโปรแกรมอ่านจอ */
  label: string;
}) {
  const current = tabs.find((t) => t.id === active);
  return (
    <div className="min-w-0">
      {/* แท็บเส้นใต้แบบคอนโซลองค์กร · มือถือเลื่อนแนวนอนได้ ไม่ตัดบรรทัด */}
      <div role="tablist" aria-label={label} className="no-scrollbar flex max-w-full gap-6 overflow-x-auto border-b border-line">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              title={t.hint}
              onClick={() => onChange(t.id)}
              className={`admin-tab tap-overlay-y -mb-px flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap px-0.5 text-sm transition-colors ${
                on ? "font-semibold" : "font-medium"
              }`}
            >
              {t.label}
              {t.count != null && t.count > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums ${
                    t.tone === "alert" ? "bg-rose-700 text-white" : "bg-inset text-ink"
                  }`}
                >
                  {t.count > 99 ? "99+" : t.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {current?.hint ? <p className="mt-2 text-xs text-muted">{current.hint}</p> : null}
    </div>
  );
}

/** การ์ดหนึ่งส่วนของหน้า: หัวข้อ · คำอธิบาย · ปุ่มของส่วนนี้ (ชิดขวา) · เนื้อหา */
export function AdminSection({
  title,
  hint,
  actions,
  tone = "default",
  padded = true,
  children,
  id,
}: {
  title: string;
  hint?: ReactNode;
  actions?: ReactNode;
  /** `alert` = กรอบแดงอ่อน สำหรับเรื่องที่ต้องทำทันที */
  tone?: "default" | "alert";
  /** ปิดระยะขอบในเมื่อเนื้อหาเป็นตารางเต็มกว้าง */
  padded?: boolean;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <section
      aria-labelledby={id ? `${id}-title` : undefined}
      className={`admin-card overflow-hidden ${tone === "alert" ? "!border-rose-200" : ""}`}
    >
      <header
        className={`flex flex-wrap items-start justify-between gap-3 border-b px-5 py-3.5 ${
          tone === "alert" ? "border-rose-200 bg-rose-50" : "border-line"
        }`}
      >
        <div className="min-w-0">
          <h3 id={id ? `${id}-title` : undefined} className={`text-[15px] font-semibold ${tone === "alert" ? "text-rose-800" : "text-ink"}`}>
            {title}
          </h3>
          {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
        </div>
        {actions ? <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">{actions}</div> : null}
      </header>
      {children ? <div className={padded ? "p-5" : ""}>{children}</div> : null}
    </section>
  );
}

/** แถวการ์ดตัวเลขสรุปบนสุดของหน้า (2 คอลัมน์บนมือถือ · สูงสุด 4 บนจอกว้าง) */
export function KpiGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 }) {
  return <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>{children}</div>;
}

/**
 * แผงรายละเอียดเลื่อนออกจากขวา (แบบหน้ารายละเอียดลูกค้าของร้านค้าออนไลน์)
 * กดดูแถวไหนก็เห็นรายละเอียดข้างตารางทันที ไม่ต้องเลื่อนลงไปหาท้ายหน้า · Esc หรือกดพื้นหลังเพื่อปิด
 */
export function AdminDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  // A5-10: หน้าต่างลอยที่ประกาศ aria-modal ต้องกักโฟกัส · ย้ายโฟกัสเข้า · คืนโฟกัสตอนปิด · ล็อกสกรอลล์ (ฮุกกลางตัวเดียวกับหน้าต่างฝั่งสาธารณะ)
  const panelRef = useRef<HTMLElement>(null);
  useDialogBehavior(open, onClose, panelRef);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onMouseDown={onClose}>
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full max-w-[30rem] flex-col border-l border-line bg-white shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-ink">{title}</h3>
            {subtitle ? <p className="mt-0.5 break-all text-xs text-muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดแผงรายละเอียด"
            className="admin-btn-secondary tap-overlay-y inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}

/** หัวข้อย่อยในแผงรายละเอียด/การ์ด */
export function SubHeading({ children }: { children: ReactNode }) {
  return <h4 className="mb-2 text-xs font-bold text-ink-soft">{children}</h4>;
}

/** กล่องว่างแบบมีคำแนะนำ — ใช้แทนข้อความ "ไม่มีข้อมูล" เปล่า ๆ */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface-warm px-4 py-10 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}
