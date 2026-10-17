"use client";

/**
 * 🧾 แท็บ "บันทึกการทำงานแอดมิน" — ใครทำอะไรเมื่อไร (เก็บ 180 วัน · ไม่มีข้อมูลส่วนบุคคล)
 * กรองตามหมวด · ค้นจากข้อความ · ไฮไลต์การใส่รหัสผิด (อาจเป็นการพยายามบุกรุก)
 */

import { useMemo, useState } from "react";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { AdminSection, AdminSubTabs, EmptyState, KpiGrid, useSubTab, type SubTab } from "@/components/admin/AdminLayout";
import { StatCard, thaiDay } from "@/components/admin/StatsWidgets";
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
  const groupIds = useMemo(() => ["all", ...Object.keys(AUDIT_GROUP_NAME)] as ("all" | AuditGroup)[], []);
  const [tab, setTab] = useSubTab<"all" | AuditGroup>(groupIds);
  const group = tab === "all" ? "" : tab;
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
  const today = dayKey(Date.now());
  const todayCount = (data ?? []).filter((e) => dayKey(e.ts) === today).length;
  const last = data?.[0];

  const tabs: SubTab<"all" | AuditGroup>[] = groupIds.map((id) => ({
    id,
    label: id === "all" ? "ทั้งหมด" : AUDIT_GROUP_NAME[id],
    count: id === "all" ? null : (data ?? []).filter((e) => auditGroupOf(e.action) === id).length,
  }));

  return (
    <div className="space-y-4">
      {failedLogins24h > 0 ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
          <strong>ใส่รหัสแอดมินผิด {failedLogins24h} ครั้งใน 24 ชั่วโมง</strong> — ถ้าไม่ใช่คุณ ให้เปลี่ยนรหัส <code>ADMIN_PASSWORD</code> ทันที
        </p>
      ) : null}

      <KpiGrid>
        <StatCard label="รายการที่โหลดมา" value={(data?.length ?? 0).toLocaleString("th-TH")} sub="ล่าสุด 500 รายการ · เก็บ 180 วัน" />
        <StatCard label="วันนี้" value={todayCount.toLocaleString("th-TH")} sub="การกระทำของแอดมินวันนี้" />
        <StatCard
          label="ใส่รหัสผิด 24 ชม."
          value={failedLogins24h.toLocaleString("th-TH")}
          sub={failedLogins24h > 0 ? "ตรวจว่าเป็นคุณหรือไม่" : "ไม่พบความผิดปกติ"}
        />
        <StatCard label="ล่าสุด" value={last ? when(last.ts) : "—"} sub={last ? AUDIT_ACTIONS[last.action]?.label ?? last.action : "ยังไม่มีรายการ"} />
      </KpiGrid>

      <AdminSubTabs label="หมวดบันทึก" tabs={tabs} active={tab} onChange={setTab} />

      {error ? <AdminErrorBanner error={error} onRetry={() => void reload()} /> : null}

      <AdminSection
        title={loading && !data ? "กำลังโหลด…" : `${entries.length.toLocaleString("th-TH")} รายการ`}
        hint="เรียงจากใหม่ไปเก่า แบ่งตามวัน · ตัวสีแดงคือการใส่รหัสผิด"
        padded={false}
        actions={
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ค้น เช่น ชื่อแม่หมอ หรือรหัสแลกสิทธิ์"
            aria-label="ค้นจากข้อความ"
            className="min-h-9 w-full min-w-[14rem] rounded-lg border border-line-interactive bg-white px-3 text-xs text-ink sm:w-72"
          />
        }
      >
        {entries.length === 0 && !loading ? (
          <div className="p-5">
            <EmptyState title="ไม่มีรายการตามตัวกรองนี้" hint="ลองเลือกหมวด ทั้งหมด หรือล้างช่องค้นหา" />
          </div>
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
      </AdminSection>
    </div>
  );
}
