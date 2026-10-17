"use client";

import { useState } from "react";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import MarketingAudience from "@/components/admin/MarketingAudience";
import { AdminDrawer, AdminSection, AdminSubTabs, EmptyState, KpiGrid, SubHeading, useSubTab } from "@/components/admin/AdminLayout";
import { StatCard, fmt } from "@/components/admin/StatsWidgets";
import { Button } from "@/components/ui/Button";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";

interface Member {
  id: string;
  provider: string;
  email: string | null;
  name: string;
  createdAt: number;
  lastSeenAt: number;
  deletedAt: number | null;
  marketingConsent: boolean;
  emailVerified: boolean;
  readings: number | null;
}

interface ListPayload {
  query: string;
  members: Member[];
  page: number;
  pageSize: number;
  pageCount: number;
  /** จำนวนสมาชิกที่ตรงคำค้น (ไม่ค้น = ทุกบัญชี รวมที่ลบแล้ว) */
  matched: number;
  pageSizes: number[];
  totals: { total: number; new7d: number; active7d: number };
}

interface DetailPayload {
  member: Member;
  entitlement: {
    remaining: number;
    dailyRemaining: number;
    bonusRemaining: number;
    hasPaidCredits: boolean;
    dailyStreak: number;
  } | null;
  bonuses: { reason: string; granted: number; grantedAt: number }[];
}

/** ค่าเริ่มต้นก่อนเซิร์ฟเวอร์ตอบ — เซิร์ฟเวอร์เป็นคนตัดสินรายการจริง (`pageSizes` ในคำตอบ) */
const FALLBACK_PAGE_SIZES = [25, 50, 100, 200];

const PROVIDER_NAME: Record<string, string> = { google: "Google", line: "LINE", email: "อีเมล" };

function bonusReasonLabel(reason: string): string {
  // รหัสแลกสิทธิ์ใช้ prefix `purchase_redeem` (นับเป็นสิทธิ์จ่ายเงิน) — ต้องเช็กก่อน `purchase_`
  if (reason.startsWith("purchase_redeem")) return "แลกรหัส";
  if (reason.startsWith("purchase_")) return "ซื้อแพ็กเกจ";
  if (reason.startsWith("admin_")) return "แอดมินให้";
  if (reason === "grandfather") return "โบนัสผู้ใช้เดิม";
  if (reason.startsWith("signup")) return "โบนัสสมัครใหม่";
  return reason;
}

function day(ts: number): string {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: APP_TIME_ZONE }).format(
    new Date(ts),
  );
}

const MEMBER_TABS = ["list", "audience"] as const;

export default function MembersPanel() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [tab, setTab] = useSubTab(MEMBER_TABS);

  const list = useAdminResource<ListPayload>(
    `/api/admin/members?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`,
  );
  const data = list.data;
  // ใช้หน้าที่เซิร์ฟเวอร์ตอบจริง (เซิร์ฟเวอร์หนีบหน้าที่เกินจำนวนหน้าให้แล้ว)
  const currentPage = data?.page ?? page;
  const pageCount = data?.pageCount ?? 1;
  const goTo = (p: number) => setPage(Math.min(Math.max(1, p), pageCount));

  return (
    <div className="space-y-6">
      <KpiGrid cols={3}>
        <StatCard label="สมาชิกทั้งหมด" value={fmt(data?.totals.total)} sub="ไม่นับบัญชีที่ลบแล้ว" />
        <StatCard label="สมัครใหม่ 7 วัน" value={fmt(data?.totals.new7d)} sub="บัญชีที่สร้างในสัปดาห์นี้" />
        <StatCard label="เข้าใช้ใน 7 วัน" value={fmt(data?.totals.active7d)} sub="เปิดเว็บแล้วล็อกอินอยู่" />
      </KpiGrid>

      <AdminSubTabs
        label="หมวดในหน้าสมาชิก"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "list", label: "รายชื่อสมาชิก", hint: "ค้นหา ดูสิทธิ์ ให้สิทธิ์เพิ่ม" },
          { id: "audience", label: "ผู้รับข่าวสาร", hint: "รายชื่อที่ยินยอมรับอีเมล" },
        ]}
      />

      {tab === "audience" ? (
        <MarketingAudience />
      ) : (
        <AdminSection
          title={query ? `ผลค้นหา "${query}"` : "สมาชิกที่สมัครล่าสุด"}
          hint={
            <>
              กด "ดู / ให้สิทธิ์" เพื่อเปิดรายละเอียดด้านขวา
              {data && data.matched > 0
                ? ` · แสดง ${fmt((data.page - 1) * data.pageSize + 1)}–${fmt((data.page - 1) * data.pageSize + data.members.length)} จาก ${fmt(data.matched)} คน`
                : null}
            </>
          }
          actions={
            <form
              role="search"
              className="flex w-full gap-2 sm:w-auto"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setQuery(input.trim());
              }}
            >
              <label htmlFor="member-search" className="sr-only">
                ค้นหาสมาชิก
              </label>
              <input
                id="member-search"
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="อีเมล / ชื่อ / รหัสผู้ใช้"
                className="min-h-11 w-full min-w-0 rounded-lg border border-line-interactive bg-white px-3 text-sm text-ink sm:w-72"
              />
              <Button type="submit" size="sm" className="min-h-11 shrink-0">
                ค้นหา
              </Button>
              {query ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11 shrink-0"
                  onClick={() => {
                    setInput("");
                    setQuery("");
                    setPage(1);
                  }}
                >
                  ล้าง
                </Button>
              ) : null}
            </form>
          }
        >
          {list.error ? <AdminErrorBanner error={list.error} onRetry={() => void list.reload()} /> : null}

          {!data ? (
            list.loading ? (
              <p className="text-sm text-muted" aria-live="polite">
                กำลังโหลด…
              </p>
            ) : null
          ) : data.members.length === 0 ? (
            <EmptyState
              title={query ? "ไม่พบสมาชิกที่ตรงกับคำค้น" : "ยังไม่มีสมาชิก"}
              hint={query ? "ลองค้นด้วยอีเมลเต็ม หรือรหัสผู้ใช้จากหน้ารายการชำระเงิน" : undefined}
            />
          ) : (
            <table className="w-full table-fixed text-left text-sm sm:table-auto">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="py-2 pr-3 font-semibold">สมาชิก</th>
                  <th className="hidden py-2 pr-3 font-semibold sm:table-cell">ช่องทาง</th>
                  <th className="hidden py-2 pr-3 font-semibold md:table-cell">สมัคร</th>
                  <th className="hidden py-2 pr-3 font-semibold md:table-cell">เข้าล่าสุด</th>
                  <th className="w-16 py-2 pr-3 text-right font-semibold">เปิดไพ่</th>
                  <th className="w-28 py-2 font-semibold">
                    <span className="sr-only">จัดการ</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.members.map((m) => (
                  <tr key={m.id} className={selected?.id === m.id ? "bg-canvas" : undefined}>
                    <td className="py-2.5 pr-3">
                      <span className="block truncate font-medium text-ink">{m.name || "—"}</span>
                      <span className="block truncate text-xs text-muted">{m.email || m.id}</span>
                    </td>
                    <td className="hidden py-2.5 pr-3 text-muted sm:table-cell">
                      {PROVIDER_NAME[m.provider] ?? m.provider}
                      {m.deletedAt ? <span className="ml-1 text-xs font-semibold text-rose-700">(ลบแล้ว)</span> : null}
                    </td>
                    <td className="hidden whitespace-nowrap py-2.5 pr-3 text-muted md:table-cell">{day(m.createdAt)}</td>
                    <td className="hidden whitespace-nowrap py-2.5 pr-3 text-muted md:table-cell">{day(m.lastSeenAt)}</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-ink">{fmt(m.readings)}</td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(m)}
                        className="tap-overlay-y rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-canvas"
                      >
                        ดู / ให้สิทธิ์
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {data && data.matched > 0 ? (
            <nav
              aria-label="แบ่งหน้ารายชื่อสมาชิก"
              className="mt-4 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2 text-xs text-muted">
                <label htmlFor="member-page-size">แสดงหน้าละ</label>
                <select
                  id="member-page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPage(1);
                    setPageSize(Number(e.target.value));
                  }}
                  className="glass-field min-h-11 rounded-xl border border-line-interactive px-3 text-sm text-ink focus:border-ink focus:outline-none"
                >
                  {(data.pageSizes ?? FALLBACK_PAGE_SIZES).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span>คน</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  disabled={currentPage <= 1 || list.loading}
                  onClick={() => goTo(currentPage - 1)}
                >
                  ก่อนหน้า
                </Button>
                <span className="min-w-24 text-center text-sm text-ink" aria-live="polite">
                  หน้า {fmt(currentPage)} / {fmt(pageCount)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  disabled={currentPage >= pageCount || list.loading}
                  onClick={() => goTo(currentPage + 1)}
                >
                  ถัดไป
                </Button>
              </div>
            </nav>
          ) : null}
        </AdminSection>
      )}

      <AdminDrawer
        open={!!selected}
        title={selected ? selected.name || selected.email || "สมาชิก" : ""}
        subtitle={selected ? selected.email ?? selected.id : undefined}
        onClose={() => setSelected(null)}
      >
        {selected ? <MemberDetail key={selected.id} id={selected.id} /> : null}
      </AdminDrawer>
    </div>
  );
}

function MemberDetail({ id }: { id: string }) {
  const detail = useAdminResource<DetailPayload>(`/api/admin/members?id=${encodeURIComponent(id)}`);
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const grant = async () => {
    if (!confirm(`ยืนยันให้สิทธิ์เปิดไพ่เพิ่ม ${amount} ครั้ง?`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, amount, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ ok: true, text: `ให้สิทธิ์เพิ่ม ${amount} ครั้งแล้ว` });
        setNote("");
        void detail.reload();
      } else {
        setMsg({ ok: false, text: data.error || `ไม่สำเร็จ (HTTP ${res.status})` });
      }
    } catch {
      setMsg({ ok: false, text: "ติดต่อเซิร์ฟเวอร์ไม่ได้" });
    } finally {
      setBusy(false);
    }
  };

  const d = detail.data;
  return (
    <div className="space-y-5">

      {detail.error ? <AdminErrorBanner error={detail.error} onRetry={() => void detail.reload()} /> : null}
      {!d ? (
        detail.loading ? <p className="text-xs text-muted">กำลังโหลด…</p> : null
      ) : (
        <div className="space-y-6">
          <div>
          <SubHeading>ข้อมูลบัญชี</SubHeading>
          <dl className="space-y-1.5 rounded-lg border border-line p-3 text-xs">
            {(
              [
                ["รหัสผู้ใช้", d.member.id],
                ["อีเมล", d.member.email ? `${d.member.email}${d.member.emailVerified ? " (ยืนยันแล้ว)" : " (ยังไม่ยืนยัน)"}` : "—"],
                ["ช่องทาง", PROVIDER_NAME[d.member.provider] ?? d.member.provider],
                ["สมัครเมื่อ", day(d.member.createdAt)],
                ["เข้าล่าสุด", day(d.member.lastSeenAt)],
                ["รับข่าวสาร", d.member.marketingConsent ? "ยินยอม" : "ไม่ยินยอม"],
                ["เปิดไพ่ทั้งหมด", `${fmt(d.member.readings)} ครั้ง`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted">{k}</dt>
                <dd className="break-all text-right text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          </div>

          <div className="space-y-2 text-xs">
            <SubHeading>สิทธิ์คงเหลือตอนนี้</SubHeading>
            {d.entitlement ? (
              <ul className="space-y-1.5 rounded-lg border border-line p-3">
                <li className="flex justify-between">
                  <span className="text-muted">รวมเปิดได้อีก</span>
                  <span className="font-mono font-semibold text-ink">{fmt(d.entitlement.remaining)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted">โควตาฟรีวันนี้</span>
                  <span className="font-mono text-ink">{fmt(d.entitlement.dailyRemaining)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted">โบนัสคงเหลือ</span>
                  <span className="font-mono text-ink">{fmt(d.entitlement.bonusRemaining)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted">มีสิทธิ์ที่ซื้อ</span>
                  <span className="text-ink">{d.entitlement.hasPaidCredits ? "มี" : "ไม่มี"}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted">เปิดไพ่รายวันต่อเนื่อง</span>
                  <span className="font-mono text-ink">{fmt(d.entitlement.dailyStreak)} วัน</span>
                </li>
              </ul>
            ) : (
              <p className="text-muted">อ่านสิทธิ์ไม่ได้ (ตารางสิทธิ์อาจยังไม่พร้อม)</p>
            )}
            {d.bonuses.length > 0 ? (
              <>
                <div className="pt-3"><SubHeading>ประวัติได้รับสิทธิ์</SubHeading></div>
                <ul className="space-y-1">
                  {d.bonuses.map((b) => (
                    <li key={`${b.reason}-${b.grantedAt}`} className="flex justify-between gap-2">
                      <span className="text-muted">
                        {day(b.grantedAt)} · {bonusReasonLabel(b.reason)}
                      </span>
                      <span className="font-mono text-ink">+{b.granted}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <form
            className="space-y-2 rounded-lg border border-line bg-canvas p-3 text-xs"
            onSubmit={(e) => {
              e.preventDefault();
              void grant();
            }}
          >
            <SubHeading>ให้สิทธิ์เปิดไพ่เพิ่ม</SubHeading>
            <p className="text-muted">ใช้ชดเชยลูกค้าที่เจอปัญหา · ไม่หมดอายุ · ไม่ปลดล็อกผังพรีเมียม · บันทึกในกิจกรรมแอดมิน</p>
            <label className="block">
              <span className="text-muted">จำนวนครั้ง (1–50)</span>
              <input
                type="number"
                min={1}
                max={50}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                className="mt-1 min-h-11 w-full rounded-lg border border-line-interactive bg-white px-3 text-sm text-ink"
              />
            </label>
            <label className="block">
              <span className="text-muted">เหตุผล (จำเป็น)</span>
              <input
                type="text"
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น ชดเชยคำอ่านค้าง 2026-09-23"
                className="mt-1 min-h-11 w-full rounded-lg border border-line-interactive bg-white px-3 text-sm text-ink"
              />
            </label>
            <Button type="submit" size="sm" isLoading={busy} disabled={note.trim().length < 3 || !!d.member.deletedAt} className="w-full">
              ให้สิทธิ์ {amount} ครั้ง
            </Button>
            {msg ? (
              <p role="status" className={msg.ok ? "text-emerald-700" : "text-rose-700"}>
                {msg.text}
              </p>
            ) : null}
          </form>
        </div>
      )}
    </div>
  );
}
