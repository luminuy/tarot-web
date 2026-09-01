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

export default function EntitlementAdmin() {
  const [s, setS] = useState<State | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/entitlement")
      .then((r) => r.json())
      .then(setS)
      .catch(() => setMsg("โหลดไม่สำเร็จ"));
  }, []);

  useEffect(load, [load]);

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

  if (!s) return <p className="text-sm text-[#9c93b8]">กำลังโหลด…</p>;

  return (
    <div className="flex flex-col gap-5">
      {msg ? <p className="text-xs text-[#9c93b8]">{msg}</p> : null}

      {/* ── ธงเปิดระบบจริง ── */}
      <div className="altar-panel rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#e5c07b]">
              ระบบสิทธิ์เปิดไพ่ (entitlement.enabled)
            </h3>
            <p className="mt-1 text-xs text-[#9c93b8]">
              เปิด = ผู้เยี่ยมชม 1 ครั้ง · สมาชิกสัปดาห์ละ 3 ครั้ง · แชทเฉพาะสมาชิก
              <br />
              <strong className="text-[#f0a0a0]">
                ⚠️ ก่อนเปิด: รันสคริปต์โบนัสเปลี่ยนผ่าน + เปิดประกาศล่วงหน้า ≥ 7 วัน
              </strong>
            </p>
          </div>
          <Button
            size="sm"
            variant={s.enabled ? "gold" : "outline"}
            isLoading={saving}
            onClick={() => {
              if (!s.enabled && !confirm("ยืนยันเปิดระบบสิทธิ์จริง? จะลดสิทธิ์ผู้ใช้เดิมทันที")) return;
              save({ enabled: !s.enabled });
            }}
          >
            {s.enabled ? "เปิดอยู่ — กดเพื่อปิด" : "ปิดอยู่ — กดเพื่อเปิด"}
          </Button>
        </div>
      </div>

      {/* ── แบนเนอร์ประกาศล่วงหน้า ── */}
      <div className="altar-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[#e5c07b]">แบนเนอร์ประกาศล่วงหน้า</h3>
        <p className="mt-1 mb-3 text-xs text-[#9c93b8]">
          แสดงบนหน้าแรกเมื่อระบบยังปิด — เตือนผู้ใช้ว่ากำลังจะมี
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="วันเริ่มใช้ (แสดงในแบนเนอร์)">
            {(id) => (
              <Input
                id={id}
                placeholder="เช่น 15 ก.ย. 2569"
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
            {s.announce ? "ประกาศเปิดอยู่" : "ประกาศปิดอยู่"}
          </Button>
        </div>
      </div>

      {/* ── โบนัสเปลี่ยนผ่าน ── */}
      <div className="altar-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[#e5c07b]">โบนัสเปลี่ยนผ่านผู้ใช้เดิม (10 ครั้ง)</h3>
        <p className="mt-1 text-xs text-[#9c93b8]">
          รันครั้งเดียวก่อนเปิดระบบ — ให้ผู้ใช้ที่สมัครก่อนวันตัดโบนัส 10 ครั้ง (ไม่หมดอายุ)
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0c0818] p-3 text-[11px] text-[#9c93b8]">
          npm run entitlement:grandfather -- --before 2026-09-15
        </pre>
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
