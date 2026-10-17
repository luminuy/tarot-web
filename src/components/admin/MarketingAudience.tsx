"use client";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { useAdminResource } from "@/lib/admin/use-admin-resource";
import { AdminSection, EmptyState } from "@/components/admin/AdminLayout";

interface AudienceRow {
  email: string;
  name: string;
  provider: string;
  consentAt: string;
  joinedAt: string;
}

interface AudienceState {
  count: number;
  users: AudienceRow[];
  truncated: boolean;
  generatedAt: number;
}

export default function MarketingAudience() {
  // R-28/R-31: โหลด · กำลังโหลด · ผิดพลาด · โหลดใหม่ ใช้ฮุกกลางตัวเดียวกับทุกแผง
  const { data: state, loading, error, reload: load } = useAdminResource<AudienceState>(
    "/api/admin/marketing",
  );

  return (
    <AdminSection
      title="ผู้ยินยอมรับข่าวสาร"
      hint={
        <>
          สมาชิกที่กดยินยอมรับข่าวสารในหน้า <code className="rounded border border-line bg-canvas px-1 text-ink">/account</code> ·
          ดาวน์โหลด CSV ไปใช้กับเครื่องมือส่งอีเมล (ทุกฉบับต้องมีลิงก์ยกเลิกรับข่าวสาร)
        </>
      }
      actions={
        <>
          <span className="text-xs text-muted">
            ยินยอมทั้งหมด <strong className="font-mono text-ink">{state ? state.count.toLocaleString("th-TH") : "—"}</strong> คน
          </span>
          <a
            href="/api/admin/marketing?format=csv"
            download
            className="btn-gold-glass !rounded-lg inline-flex items-center border-ink px-3.5 py-2 text-xs font-semibold hover:bg-dark"
          >
            ดาวน์โหลด CSV
          </a>
          <button type="button" onClick={load} className="tap-overlay-y text-xs text-muted hover:text-ink">
            โหลดใหม่
          </button>
        </>
      }
    >
      {/* ♿ + R-28: ประกาศข้อผิดพลาดให้โปรแกรมอ่านหน้าจอ และให้กดลองใหม่ได้ */}
      {error ? (
        <AdminErrorBanner error={error} onRetry={load} />
      ) : loading || !state ? (
        <p className="text-sm text-muted">กำลังโหลด…</p>
      ) : state.count === 0 ? (
        <EmptyState title="ยังไม่มีสมาชิกที่ยินยอมรับข่าวสาร" hint="สมาชิกกดยินยอมได้ที่หน้าบัญชีของตัวเอง" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-muted">
              <tr className="border-b border-line">
                <th className="py-2.5 pr-3 font-semibold">อีเมล</th>
                <th className="py-2.5 pr-3 font-semibold">ชื่อ</th>
                <th className="py-2.5 pr-3 font-semibold">ช่องทาง</th>
                <th className="py-2.5 font-semibold">ยินยอมเมื่อ</th>
              </tr>
            </thead>
            <tbody>
              {state.users.map((u) => (
                <tr key={u.email} className="border-b border-line/60">
                  <td className="py-2.5 pr-3 font-medium text-ink">{u.email}</td>
                  <td className="py-2.5 pr-3 text-ink">{u.name || "—"}</td>
                  <td className="py-2.5 pr-3 text-muted">{u.provider}</td>
                  <td className="py-2.5 text-muted">{u.consentAt || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {state.truncated ? <p className="mt-3 text-xs text-muted">แสดง 200 รายแรก — ดาวน์โหลด CSV เพื่อดูทั้งหมด</p> : null}
        </div>
      )}
    </AdminSection>
  );
}
