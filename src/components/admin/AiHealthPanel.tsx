"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface ModelResult {
  model: string;
  ok: boolean;
  status: number | null;
  elapsedMs: number;
  finishReason?: string | null;
  partCount?: number;
  thoughtPartCount?: number;
  answerPreview?: string;
  error?: string | null;
}

interface Health {
  ok: boolean;
  verdict: "healthy" | "no_api_key" | "ai_daily_cap" | "gemini_unavailable";
  summary: string;
  nextStep: string;
  key: { configured: boolean; envVar: string | null; length: number; startsWithAIza: boolean };
  chatProbe?: Array<ModelResult & { promptChars?: number }>;
  budget: { usedToday: number; dailyCap: number; memberCapReached: boolean; guestCapReached: boolean };
  models: ModelResult[];
  checkedAt: string;
}

const VERDICT_LABEL: Record<Health["verdict"], string> = {
  healthy: "✦ ปกติดี — แม่หมอตอบด้วย AI จริงได้",
  no_api_key: "✦ ยังไม่ได้ตั้งคีย์ AI",
  ai_daily_cap: "✦ ใช้ครบเพดานรายวันแล้ว",
  gemini_unavailable: "✦ มีคีย์ แต่เรียก Gemini ไม่สำเร็จ",
};

export default function AiHealthPanel() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/ai-health", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ตรวจไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mystic-gold text-base font-bold text-[#29261F]">สุขภาพการเชื่อมต่อ AI</h2>
          <p className="mt-0.5 text-xs text-[#635B4E]">
            ยิงถาม Gemini จริง 1 ครั้งต่อโมเดล เพื่อดูว่าแม่หมอตอบด้วย AI ได้จริงหรือกำลังใช้คำตอบสำรอง
          </p>
        </div>
        <Button
          size="sm"
          onClick={run}
          disabled={loading}
          className="bg-[#29261F] hover:bg-[#171512] text-white font-medium text-xs shadow-xs"
        >
          {loading ? "กำลังตรวจ…" : "✦ ตรวจอีกครั้ง"}
        </Button>
      </div>

      {err && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          {err}
        </p>
      )}

      {loading && !data && <p className="text-sm text-[#635B4E]">กำลังติดต่อ Gemini…</p>}

      {data && (
        <>
          <div
            className={`rounded-2xl border px-5 py-4 shadow-xs ${
              data.ok && data.verdict === "healthy"
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-amber-200 bg-amber-50/70"
            }`}
          >
            <p
              className={`text-sm font-bold ${
                data.ok && data.verdict === "healthy" ? "text-emerald-900" : "text-amber-900"
              }`}
            >
              {VERDICT_LABEL[data.verdict]}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#29261F]">{data.summary}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#635B4E]">
              <span className="font-semibold text-[#29261F]">สิ่งที่ต้องทำต่อ:</span> {data.nextStep}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#D5CEC2] bg-white px-5 py-4 shadow-xs">
              <p className="text-xs font-semibold text-[#29261F]">คีย์ AI</p>
              <p className="mt-1 text-xs text-[#635B4E]">
                {data.key.configured
                  ? `ตั้งไว้แล้วที่ ${data.key.envVar} · ยาว ${data.key.length} ตัว${
                      data.key.startsWithAIza ? " · ขึ้นต้น AIza" : ""
                    }`
                  : "ยังไม่ได้ตั้ง GEMINI_API_KEY / GOOGLE_API_KEY"}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D5CEC2] bg-white px-5 py-4 shadow-xs">
              <p className="text-xs font-semibold text-[#29261F]">เพดานเรียก AI วันนี้</p>
              <p className="mt-1 text-xs text-[#635B4E]">
                ใช้ไป {data.budget.usedToday} / {data.budget.dailyCap} ครั้ง
                {data.budget.memberCapReached
                  ? " · เต็มเพดานแล้ว"
                  : data.budget.guestCapReached
                    ? " · ผู้เยี่ยมชมถูกตัดแล้ว (สมาชิกยังใช้ได้)"
                    : " · ยังเหลือ"}
              </p>
            </div>
          </div>

          {data.models.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-[#D5CEC2] bg-white shadow-xs">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#635B4E] border-b border-[#D5CEC2]">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">โมเดล</th>
                    <th className="px-3.5 py-2.5 font-semibold">ผล</th>
                    <th className="px-3.5 py-2.5 font-semibold">เวลา</th>
                    <th className="px-3.5 py-2.5 font-semibold">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8] text-[#29261F]">
                  {data.models.map((m) => (
                    <tr key={m.model} className="hover:bg-[#FAF8F5] transition-colors align-top">
                      <td className="px-3.5 py-3 font-mono text-xs">{m.model}</td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            m.ok
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {m.ok ? "ผ่าน" : m.status ? `HTTP ${m.status}` : "ล้มเหลว"}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-mono text-xs text-[#635B4E]">{m.elapsedMs}ms</td>
                      <td className="px-3.5 py-3 leading-relaxed">
                        {m.ok ? (
                          <>
                            <span className="text-[#29261F]">ตอบว่า “{m.answerPreview}”</span>
                            <span className="block text-[11px] text-[#756F66] mt-0.5">
                              parts ทั้งหมด {m.partCount} · เป็น part ความคิด {m.thoughtPartCount}
                              {m.finishReason ? ` · finishReason ${m.finishReason}` : ""}
                            </span>
                          </>
                        ) : (
                          <span className="break-all text-xs text-rose-700 font-mono">{m.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.chatProbe && data.chatProbe.length > 0 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-[#29261F]">ทดสอบแบบห้องคุยจริง</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-[#635B4E]">
                  ยิงด้วย prompt ชุดเดียวกับที่ห้องคุยใช้จริง (บุคลิกแม่หมอเต็ม + ไพ่ + ประวัติสนทนา)
                  — ผ่าน ping สั้น ๆ ไม่ได้แปลว่าห้องคุยจะผ่าน ช่องนี้คือตัวชี้ขาด
                </p>
              </div>
              {data.chatProbe.map((m) => (
                <div
                  key={m.model}
                  className={`rounded-2xl border p-4 text-xs shadow-xs ${
                    m.ok
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-rose-200 bg-rose-50/50"
                  }`}
                >
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#29261F]">{m.model}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        m.ok
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {m.ok ? "ตอบได้จริง" : m.status ? `HTTP ${m.status}` : "ล้มเหลว"}
                    </span>
                    <span className="font-mono text-xs text-[#635B4E]">{m.elapsedMs}ms</span>
                    {m.promptChars ? (
                      <span className="text-xs text-[#756F66]">prompt {m.promptChars} ตัวอักษร</span>
                    ) : null}
                  </p>
                  <p className={`mt-2 leading-relaxed ${m.ok ? "text-[#29261F]" : "break-all text-rose-800 font-mono"}`}>
                    {m.ok ? `“${m.answerPreview}”` : m.error}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-[#756F66]">
            ตรวจเมื่อ {new Date(data.checkedAt).toLocaleString("th-TH")}
          </p>
        </>
      )}
    </div>
  );
}
