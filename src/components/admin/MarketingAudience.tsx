"use client";

import { useCallback, useEffect, useState } from "react";

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
  const [state, setState] = useState<AudienceState | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    fetch("/api/admin/marketing")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then(setState)
      .catch(() => setError("โหลดรายชื่อไม่สำเร็จ"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <div className="altar-panel rounded-2xl border border-[#D5CEC2] bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-[#29261F]">ผู้ยินยอมรับข่าวสาร (Marketing Consent)</h3>
        <p className="mt-1 text-xs text-[#635B4E]">
          รายชื่อสมาชิกที่กดยินยอมรับข่าวสารในหน้า <code className="rounded border border-[#D5CEC2] bg-[#F2EFE9] px-1 py-0.5 text-[#29261F]">/account</code> —
          ดาวน์โหลด CSV ไปใช้กับเครื่องมือส่งอีเมลภายนอกได้ (อย่าลืมใส่ลิงก์ยกเลิกรับข่าวสารทุกฉบับ)
        </p>

        {error ? (
          <p className="mt-4 text-xs text-rose-700">{error}</p>
        ) : !state ? (
          <p className="mt-4 text-sm text-[#635B4E]">กำลังโหลด…</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-[#D5CEC2] bg-[#F8F6F2] px-4 py-3">
                <p className="text-[13px] text-[#635B4E]">ยินยอมทั้งหมด</p>
                <p className="mt-0.5 text-2xl font-bold text-[#29261F]">
                  {state.count.toLocaleString("th-TH")}
                </p>
              </div>
              <a
                href="/api/admin/marketing?format=csv"
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#29261F] bg-[#29261F] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#1a1814]"
              >
                ดาวน์โหลด CSV
              </a>
              <button
                onClick={load}
                className="text-xs text-[#635B4E] hover:text-[#29261F]"
              >
                รีเฟรช
              </button>
            </div>

            {state.count === 0 ? (
              <p className="mt-4 text-sm text-[#635B4E]">ยังไม่มีสมาชิกที่ยินยอมรับข่าวสาร</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="text-[#635B4E]">
                    <tr className="border-b border-[#D5CEC2]">
                      <th className="py-2.5 pr-3 font-semibold">อีเมล</th>
                      <th className="py-2.5 pr-3 font-semibold">ชื่อ</th>
                      <th className="py-2.5 pr-3 font-semibold">ช่องทาง</th>
                      <th className="py-2.5 font-semibold">ยินยอมเมื่อ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.users.map((u) => (
                      <tr key={u.email} className="border-b border-[#D5CEC2]/60 hover:bg-[#F8F6F2]/60 transition-colors">
                        <td className="py-2.5 pr-3 font-medium text-[#29261F]">{u.email}</td>
                        <td className="py-2.5 pr-3 text-[#29261F]">{u.name || "—"}</td>
                        <td className="py-2.5 pr-3 text-[#635B4E]">{u.provider}</td>
                        <td className="py-2.5 text-[#635B4E]">{u.consentAt || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {state.truncated ? (
                  <p className="mt-3 text-xs text-[#635B4E]">
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
