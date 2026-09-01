"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

interface State {
  enabled: boolean;
  announce: boolean;
  announceResetDate: string;
  metrics: Record<string, number>;
}

const METRIC_LABEL: Record<string, string> = {
  blockedStart: "บล็อกที่ขั้นเลือกผัง",
  blockedRead: "บล็อกที่ขั้นอ่านไพ่",
  blockedChat: "บล็อกแชท (ไม่ใช่สมาชิก)",
  guestConsumed: "ผู้เยี่ยมชมใช้สิทธิ์ฟรี",
  aiCapHit: "ชนเพดาน AI รายวัน",
  signupShown: "การ์ดชวนสมัคร: แสดง",
  signupClicked: "การ์ดชวนสมัคร: กด",
  signupDismissed: "การ์ดชวนสมัคร: ปิด",
};

async function ops(action: string, before?: string) {
  const res = await fetch("/api/admin/entitlement/ops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, before }),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export default function EntitlementAdmin() {
  const [s, setS] = useState<State | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const [dbBusy, setDbBusy] = useState(false);

  const [gfDate, setGfDate] = useState("");
  const [gfBusy, setGfBusy] = useState(false);
  const [gfResult, setGfResult] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/entitlement")
      .then((r) => r.json())
      .then((d) => {
        setS(d);
        if (!gfDate && d.announceResetDate) setGfDate("");
      })
      .catch(() => setMsg("โหลดไม่สำเร็จ"));
    ops("check_db").then(({ data }) => setDbReady(!!data.ready));
  }, [gfDate]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useCallback(
    async (patch: Partial<State>) => {
      setSaving(true);
      setMsg("");
      try {
        const res = await fetch("/api/admin/entitlement", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error();
        setMsg("บันทึกแล้ว ✨");
        load();
      } catch {
        setMsg("บันทึกไม่สำเร็จ");
      } finally {
        setSaving(false);
      }
    },
    [load],
  );

  const initDb = useCallback(async () => {
    setDbBusy(true);
    const { ok, data } = await ops("init_db");
    setDbReady(ok && !!data.ready);
    setMsg(ok ? "เตรียมฐานข้อมูลเรียบร้อย ✨" : "เตรียมฐานข้อมูลไม่สำเร็จ");
    setDbBusy(false);
  }, []);

  const grandfather = useCallback(
    async (run: boolean) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(gfDate)) {
        setGfResult("กรอกวันตัดรูปแบบ YYYY-MM-DD ก่อน (เช่น 2026-09-15)");
        return;
      }
      if (run && !confirm(`ยืนยันให้โบนัส 10 ครั้ง แก่ผู้ใช้ที่สมัครก่อน ${gfDate}?`)) return;
      setGfBusy(true);
      setGfResult("");
      const { ok, data } = await ops(run ? "grandfather_run" : "grandfather_preview", gfDate);
      if (!ok) {
        setGfResult(data.error || "ทำรายการไม่สำเร็จ");
      } else if (run) {
        setGfResult(
          `✅ ให้โบนัสแล้ว ${data.granted} คน${data.remaining ? ` (เหลืออีก ${data.remaining} — กดซ้ำได้)` : ""}`,
        );
        load();
      } else {
        setGfResult(`พบผู้ใช้ ${data.count} คนที่สมัครก่อน ${gfDate}`);
      }
      setGfBusy(false);
    },
    [gfDate, load],
  );

  if (!s) return <p className="text-sm text-[#9c93b8]">กำลังโหลด…</p>;

  return (
    <div className="flex flex-col gap-5">
      {msg ? <p className="text-xs text-[#9c93b8]">{msg}</p> : null}

      {/* ── สถานะฐานข้อมูล ── */}
      <div className="altar-panel rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#e5c07b]">
              1 · เตรียมฐานข้อมูล{" "}
              {dbReady === null ? (
                <span className="text-[#9c93b8]">(กำลังตรวจ…)</span>
              ) : dbReady ? (
                <span className="text-emerald-400">✓ พร้อม</span>
              ) : (
                <span className="text-[#f0a0a0]">✗ ยังไม่พร้อม</span>
              )}
            </h3>
            <p className="mt-1 text-xs text-[#9c93b8]">
              สร้างตารางเก็บโควตา (ทำครั้งเดียว · กดซ้ำได้ ปลอดภัย)
            </p>
          </div>
          <Button size="sm" variant={dbReady ? "outline" : "gold"} isLoading={dbBusy} onClick={initDb}>
            {dbReady ? "เตรียมซ้ำ" : "เตรียมฐานข้อมูล"}
          </Button>
        </div>
      </div>

      {/* ── โบนัสเปลี่ยนผ่าน ── */}
      <div className="altar-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[#e5c07b]">2 · โบนัสเปลี่ยนผ่านผู้ใช้เดิม (10 ครั้ง)</h3>
        <p className="mt-1 mb-3 text-xs text-[#9c93b8]">
          ทำครั้งเดียวก่อนเปิดระบบ — ผู้ใช้ที่สมัคร <strong>ก่อน</strong> วันตัด จะได้โบนัส 10 ครั้ง (ไม่หมดอายุ) · กดซ้ำได้
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="วันตัด (YYYY-MM-DD)">
            {(id) => (
              <Input
                id={id}
                placeholder="2026-09-15"
                value={gfDate}
                onChange={(e) => setGfDate(e.target.value.trim())}
              />
            )}
          </Field>
          <Button size="sm" variant="outline" isLoading={gfBusy} onClick={() => grandfather(false)}>
            ตรวจจำนวน
          </Button>
          <Button size="sm" variant="gold" isLoading={gfBusy} onClick={() => grandfather(true)}>
            ให้โบนัส
          </Button>
        </div>
        {gfResult ? <p className="mt-3 text-xs text-[#f5deaa]">{gfResult}</p> : null}
      </div>

      {/* ── แบนเนอร์ประกาศล่วงหน้า ── */}
      <div className="altar-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[#e5c07b]">3 · แบนเนอร์ประกาศล่วงหน้า</h3>
        <p className="mt-1 mb-3 text-xs text-[#9c93b8]">
          แสดงบนหน้าแรกเมื่อระบบยังปิด — เปิดล่วงหน้าอย่างน้อย <strong>7 วัน</strong> ก่อนเปิดระบบจริง
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="วันเริ่มใช้ (ข้อความในแบนเนอร์ เช่น 15 ก.ย. 2569)">
            {(id) => (
              <Input
                id={id}
                placeholder="15 ก.ย. 2569"
                defaultValue={s.announceResetDate}
                onBlur={(e) => {
                  if (e.target.value !== s.announceResetDate)
                    save({ announceResetDate: e.target.value });
                }}
              />
            )}
          </Field>
          <Button
            size="sm"
            variant={s.announce ? "gold" : "outline"}
            onClick={() => save({ announce: !s.announce })}
          >
            {s.announce ? "ประกาศเปิดอยู่ — กดเพื่อปิด" : "ประกาศปิดอยู่ — กดเพื่อเปิด"}
          </Button>
        </div>
      </div>

      {/* ── ธงเปิดระบบจริง ── */}
      <div className="altar-panel rounded-2xl border border-[#f0a0a0]/25 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#e5c07b]">4 · เปิดระบบสิทธิ์จริง</h3>
            <p className="mt-1 text-xs text-[#9c93b8]">
              เปิด = ผู้เยี่ยมชม 1 ครั้ง · สมาชิกสัปดาห์ละ 3 ครั้ง · แชทเฉพาะสมาชิก
              <br />
              <strong className="text-[#f0a0a0]">
                ⚠️ ทำข้อ 1–3 ให้ครบและรอประกาศ ≥ 7 วันก่อน — จะลดสิทธิ์ผู้ใช้เดิมทันที
              </strong>
            </p>
          </div>
          <Button
            size="sm"
            variant={s.enabled ? "gold" : "outline"}
            isLoading={saving}
            disabled={!dbReady}
            onClick={() => {
              if (
                !s.enabled &&
                !confirm("ยืนยันเปิดระบบสิทธิ์จริง? จะลดสิทธิ์ผู้ใช้เดิมทันที")
              )
                return;
              save({ enabled: !s.enabled });
            }}
          >
            {s.enabled ? "เปิดอยู่ — กดเพื่อปิด" : "ปิดอยู่ — กดเพื่อเปิด"}
          </Button>
        </div>
      </div>

      {/* ── Metric เฝ้าดู 48 ชม.แรก ── */}
      <div className="altar-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[#e5c07b]">สถิติระบบสิทธิ์ (7 วันล่าสุด)</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(METRIC_LABEL).map(([k, label]) => (
            <div key={k} className="rounded-xl bg-[#0c0818]/70 p-3">
              <p className="text-[10px] text-[#9c93b8]">{label}</p>
              <p className="mt-0.5 text-lg font-bold text-[#f5deaa]">
                {(s.metrics[k] ?? 0).toLocaleString("th-TH")}
              </p>
            </div>
          ))}
        </div>
        <button onClick={load} className="mt-3 text-xs text-[#9c93b8] hover:text-[#e5c07b]">
          รีเฟรช ✦
        </button>
      </div>
    </div>
  );
}
