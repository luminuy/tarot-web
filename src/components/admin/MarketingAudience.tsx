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
      <div className="altar-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[#e5c07b]">ผู้ยินยอมรับข่าวสาร (Marketing Consent)</h3>
        <p className="mt-1 text-xs text-[#9c93b8]">
          รายชื่อสมาชิกที่กดยินยอมรับข่าวสารในหน้า <code className="text-[#f5deaa]">/account</code> —
          ดาวน์โหลด CSV ไปใช้กับเครื่องมือส่งอีเมลภายนอกได้ (อย่าลืมใส่ลิงก์ยกเลิกรับข่าวสารทุกฉบับ)
        </p>

        {error ? (
          <p className="mt-4 text-xs text-[#f0a0a0]">{error}</p>
        ) : !state ? (
          <p className="mt-4 text-sm text-[#9c93b8]">กำลังโหลด…</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-xl bg-[#0c0818]/70 px-4 py-3">
                <p className="text-[13px] text-[#9c93b8]">ยินยอมทั้งหมด</p>
                <p className="mt-0.5 text-2xl font-bold text-[#f5deaa]">
                  {state.count.toLocaleString("th-TH")}
                </p>
              </div>
              <a
                href="/api/admin/marketing?format=csv"
                download
                className="inline-flex items-center gap-1.5 rounded bg-[#8F5C1A] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#74490F]"
              >
                ดาวน์โหลด CSV ✦
              </a>
              <button
                onClick={load}
                className="text-xs text-[#9c93b8] hover:text-[#e5c07b]"
              >
                รีเฟรช
              </button>
            </div>

            {state.count === 0 ? (
              <p className="mt-4 text-sm text-[#9c93b8]">ยังไม่มีสมาชิกที่ยินยอมรับข่าวสาร</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="text-[#9c93b8]">
                    <tr className="border-b border-[#e5c07b]/15">
                      <th className="py-2 pr-3 font-medium">อีเมล</th>
                      <th className="py-2 pr-3 font-medium">ชื่อ</th>
                      <th className="py-2 pr-3 font-medium">ช่องทาง</th>
                      <th className="py-2 font-medium">ยินยอมเมื่อ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.users.map((u) => (
                      <tr key={u.email} className="border-b border-[#e5c07b]/10">
                        <td className="py-2 pr-3 text-[#f5deaa]">{u.email}</td>
                        <td className="py-2 pr-3 text-[#c9bfe0]">{u.name || "—"}</td>
                        <td className="py-2 pr-3 text-[#9c93b8]">{u.provider}</td>
                        <td className="py-2 text-[#9c93b8]">{u.consentAt || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {state.truncated ? (
                  <p className="mt-3 text-xs text-[#9c93b8]">
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
