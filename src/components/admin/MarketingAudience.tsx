"use client";

import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { useAdminResource } from "@/lib/admin/use-admin-resource";

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
    <div className="flex flex-col gap-5">
      <div className="altar-card-porcelain altar-panel p-5">
        <h3 className="text-sm font-semibold text-ink">ผู้ยินยอมรับข่าวสาร (Marketing Consent)</h3>
        <p className="mt-1 text-xs text-muted">
          รายชื่อสมาชิกที่กดยินยอมรับข่าวสารในหน้า <code className="rounded border border-line bg-canvas px-1 py-0.5 text-ink">/account</code> —
          ดาวน์โหลด CSV ไปใช้กับเครื่องมือส่งอีเมลภายนอกได้ (อย่าลืมใส่ลิงก์ยกเลิกรับข่าวสารทุกฉบับ)
        </p>

        {/* ♿ + R-28: ประกาศข้อผิดพลาดให้โปรแกรมอ่านหน้าจอ และให้กดลองใหม่ได้ */}
        {error ? (
          <div className="mt-4">
            <AdminErrorBanner error={error} onRetry={load} />
          </div>
        ) : loading || !state ? (
          <p className="mt-4 text-sm text-muted">กำลังโหลด…</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="altar-card-porcelain !rounded-xl px-4 py-3">
                <p className="text-[13px] text-muted">ยินยอมทั้งหมด</p>
                <p className="mt-0.5 text-2xl font-bold text-ink">
                  {state.count.toLocaleString("th-TH")}
                </p>
              </div>
              <a
                href="/api/admin/marketing?format=csv"
                download
                className="btn-gold-glass !rounded-lg inline-flex items-center gap-1.5 border-ink px-3.5 py-2 text-xs font-semibold hover:bg-dark"
              >
                ดาวน์โหลด CSV
              </a>
              <button
                onClick={load}
                className="text-xs text-muted hover:text-ink"
              >
                รีเฟรช
              </button>
            </div>

            {state.count === 0 ? (
              <p className="mt-4 text-sm text-muted">ยังไม่มีสมาชิกที่ยินยอมรับข่าวสาร</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
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
                      <tr key={u.email} className="border-b border-line/60 hover:bg-surface-warm/60 transition-colors">
                        <td className="py-2.5 pr-3 font-medium text-ink">{u.email}</td>
                        <td className="py-2.5 pr-3 text-ink">{u.name || "—"}</td>
                        <td className="py-2.5 pr-3 text-muted">{u.provider}</td>
                        <td className="py-2.5 text-muted">{u.consentAt || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {state.truncated ? (
                  <p className="mt-3 text-xs text-muted">
                    แสดง 200 รายแรก — ดาวน์โหลด CSV เพื่อดูทั้งหมด
                  </p>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
