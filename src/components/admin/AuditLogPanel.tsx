"use client";

/**
 * 🧾 แท็บ "บันทึกการทำงานแอดมิน" — ใครทำอะไรเมื่อไร (เก็บ 180 วัน · ไม่มีข้อมูลส่วนบุคคล)
 * กรองตามหมวด · ค้นจากข้อความ · ไฮไลต์การใส่รหัสผิด (อาจเป็นการพยายามบุกรุก)
 */

import { useMemo, useState } from "react";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { thaiDay } from "@/components/admin/StatsWidgets";
import { AUDIT_ACTIONS, AUDIT_ALERT, AUDIT_GROUP_NAME, auditGroupOf, type AuditGroup } from "@/lib/admin/audit-labels";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";

interface Entry {
  ts: number;
  action: string;
  detail?: string;
}

const select = (b: Record<string, unknown>) => (b.entries as Entry[]) ?? [];

const when = (ms: number) =>
  new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE }).format(ms);

const dayKey = (ms: number) => new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(ms);

export default function AuditLogPanel() {
  const { data, loading, error, reload } = useAdminResource<Entry[]>("/api/admin/audit?limit=500", { select });
  const [group, setGroup] = useState<AuditGroup | "">("");
  const [text, setText] = useState("");

  const entries = useMemo(() => {
    const t = text.trim().toLowerCase();
    return (data ?? []).filter(
      (e) =>
        (!group || auditGroupOf(e.action) === group) &&
        (!t || `${AUDIT_ACTIONS[e.action]?.label ?? e.action} ${e.detail ?? ""}`.toLowerCase().includes(t)),
    );
  }, [data, group, text]);

  const failedLogins24h = (data ?? []).filter((e) => AUDIT_ALERT.has(e.action) && Date.now() - e.ts < 86_400_000).length;

  return (
    <div className="space-y-4">
      {failedLogins24h > 0 ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
          <strong>ใส่รหัสแอดมินผิด {failedLogins24h} ครั้งใน 24 ชั่วโมง</strong> — ถ้าไม่ใช่คุณ ให้เปลี่ยนรหัส <code>ADMIN_PASSWORD</code> ทันที
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-3">
        <div role="radiogroup" aria-label="หมวด" className="flex flex-wrap gap-1.5">
          {([["", "ทั้งหมด"], ...Object.entries(AUDIT_GROUP_NAME)] as [AuditGroup | "", string][]).map(([k, label]) => (
            <button
              key={k || "all"}
              type="button"
              role="radio"
              aria-checked={group === k}
              onClick={() => setGroup(k)}
              className={`tap-overlay-y rounded-full border px-3 py-1 text-xs ${group === k ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="ค้นจากข้อความ เช่น ชื่อแม่หมอ หรือรหัสแลกสิทธิ์"
          aria-label="ค้นจากข้อความ"
          className="min-h-9 min-w-[14rem] flex-1 rounded-lg border border-line-interactive bg-white px-3 text-xs text-ink"
        />
      </div>

      {error ? <AdminErrorBanner error={error} onRetry={() => void reload()} /> : null}

      <section className="altar-card-porcelain p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 text-xs text-muted">
          <span>{loading && !data ? "กำลังโหลด…" : `${entries.length.toLocaleString("th-TH")} รายการ`}</span>
          <span>ล่าสุด 500 รายการ · เก็บย้อนหลัง 180 วัน</span>
        </div>
        {entries.length === 0 && !loading ? (
          <p className="px-4 py-10 text-center text-xs text-muted">ไม่มีรายการตามตัวกรองนี้</p>
        ) : (
          <ol className="divide-y divide-line">
            {entries.map((e, i) => {
              const newDay = i === 0 || dayKey(entries[i - 1].ts) !== dayKey(e.ts);
              return (
                <li key={`${e.ts}-${i}`} className="px-4 py-2.5 text-xs">
                  {newDay ? (
                    <p className="mb-1.5 text-[11px] font-bold text-muted">
                      {thaiDay(dayKey(e.ts)).weekday} {thaiDay(dayKey(e.ts)).label}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="w-28 shrink-0 font-mono text-[11px] text-muted">{when(e.ts)}</span>
                    <span className={AUDIT_ALERT.has(e.action) ? "font-semibold text-rose-700" : "font-semibold text-ink"}>
                      {AUDIT_ACTIONS[e.action]?.label ?? e.action}
                    </span>
                    <span className="rounded border border-line px-1.5 text-[10px] text-muted">{AUDIT_GROUP_NAME[auditGroupOf(e.action)]}</span>
                  </div>
                  {e.detail ? <p className="mt-0.5 break-words pl-0 text-muted sm:pl-[7.75rem]">{e.detail}</p> : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
