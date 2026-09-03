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
          <h2 className="font-mystic-gold text-base font-bold">สุขภาพการเชื่อมต่อ AI</h2>
          <p className="mt-0.5 text-xs text-[#9c93b8]">
            ยิงถาม Gemini จริง 1 ครั้งต่อโมเดล เพื่อดูว่าแม่หมอตอบด้วย AI ได้จริงหรือกำลังใช้คำตอบสำรอง
          </p>
        </div>
        <Button size="sm" onClick={run} disabled={loading}>
          {loading ? "กำลังตรวจ…" : "ตรวจอีกครั้ง"}
        </Button>
      </div>

      {err && (
        <p className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-xs text-red-300">
          {err}
        </p>
      )}

      {loading && !data && <p className="text-sm text-[#9c93b8]">กำลังติดต่อ Gemini…</p>}

      {data && (
        <>
          <div
            className={`rounded-2xl border px-4 py-4 ${
              data.ok && data.verdict === "healthy"
                ? "border-emerald-500/40 bg-emerald-950/25"
                : "border-[#e5c07b]/45 bg-[#1c1330]/70"
            }`}
          >
            <p
              className={`text-sm font-bold ${
                data.ok && data.verdict === "healthy" ? "text-emerald-300" : "text-[#f5deaa]"
              }`}
            >
              {VERDICT_LABEL[data.verdict]}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#cfc8e2]">{data.summary}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#9c93b8]">
              <span className="text-[#e5c07b]">สิ่งที่ต้องทำต่อ:</span> {data.nextStep}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e5c07b]/25 bg-[#0d0818] px-4 py-3">
              <p className="text-[13px] uppercase tracking-widest text-[#e5c07b]">คีย์ AI</p>
              <p className="mt-1 text-xs text-[#cfc8e2]">
                {data.key.configured
                  ? `ตั้งไว้แล้วที่ ${data.key.envVar} · ยาว ${data.key.length} ตัว${
                      data.key.startsWithAIza ? " · ขึ้นต้น AIza" : ""
                    }`
                  : "ยังไม่ได้ตั้ง GEMINI_API_KEY / GOOGLE_API_KEY"}
              </p>
            </div>
            <div className="rounded-xl border border-[#e5c07b]/25 bg-[#0d0818] px-4 py-3">
              <p className="text-[13px] uppercase tracking-widest text-[#e5c07b]">เพดานเรียก AI วันนี้</p>
              <p className="mt-1 text-xs text-[#cfc8e2]">
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
            <div className="overflow-x-auto rounded-xl border border-[#e5c07b]/25">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="bg-[#140d28] text-[#e5c07b]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">โมเดล</th>
                    <th className="px-3 py-2 font-semibold">ผล</th>
                    <th className="px-3 py-2 font-semibold">เวลา</th>
                    <th className="px-3 py-2 font-semibold">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="text-[#cfc8e2]">
                  {data.models.map((m) => (
                    <tr key={m.model} className="border-t border-[#e5c07b]/12 align-top">
                      <td className="px-3 py-2 font-mono text-[13px]">{m.model}</td>
                      <td className={`px-3 py-2 font-semibold ${m.ok ? "text-emerald-300" : "text-red-300"}`}>
                        {m.ok ? "ผ่าน" : m.status ? `HTTP ${m.status}` : "ล้มเหลว"}
                      </td>
                      <td className="px-3 py-2 font-mono text-[13px]">{m.elapsedMs}ms</td>
                      <td className="px-3 py-2 leading-relaxed">
                        {m.ok ? (
                          <>
                            ตอบว่า “{m.answerPreview}”
                            <span className="block text-[13px] text-[#9c93b8]">
                              parts ทั้งหมด {m.partCount} · เป็น part ความคิด {m.thoughtPartCount}
                              {m.finishReason ? ` · finishReason ${m.finishReason}` : ""}
                            </span>
                          </>
                        ) : (
                          <span className="break-all text-[13px] text-red-300/90">{m.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.chatProbe && data.chatProbe.length > 0 && (
            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-bold text-[#f5deaa]">ทดสอบแบบห้องคุยจริง</h3>
                <p className="mt-0.5 text-[13px] leading-relaxed text-[#9c93b8]">
                  ยิงด้วย prompt ชุดเดียวกับที่ห้องคุยใช้จริง (บุคลิกแม่หมอเต็ม + ไพ่ + ประวัติสนทนา)
                  — ผ่าน ping สั้น ๆ ไม่ได้แปลว่าห้องคุยจะผ่าน ช่องนี้คือตัวชี้ขาด
                </p>
              </div>
              {data.chatProbe.map((m) => (
                <div
                  key={m.model}
                  className={`rounded-xl border px-4 py-3 text-xs ${
                    m.ok ? "border-emerald-500/35 bg-emerald-950/20" : "border-red-500/35 bg-red-950/15"
                  }`}
                >
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13px] text-[#cfc8e2]">{m.model}</span>
                    <span className={m.ok ? "font-semibold text-emerald-300" : "font-semibold text-red-300"}>
                      {m.ok ? "ตอบได้จริง" : m.status ? `HTTP ${m.status}` : "ล้มเหลว"}
                    </span>
                    <span className="font-mono text-[13px] text-[#9c93b8]">{m.elapsedMs}ms</span>
                    {m.promptChars ? (
                      <span className="text-[13px] text-[#9c93b8]">prompt {m.promptChars} ตัวอักษร</span>
                    ) : null}
                  </p>
                  <p className={`mt-1.5 leading-relaxed ${m.ok ? "text-[#cfc8e2]" : "break-all text-red-300/90"}`}>
                    {m.ok ? `“${m.answerPreview}”` : m.error}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="text-[13px] text-[#9c93b8]">
            ตรวจเมื่อ {new Date(data.checkedAt).toLocaleString("th-TH")}
          </p>
        </>
      )}
    </div>
  );
}
