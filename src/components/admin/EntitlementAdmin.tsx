"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { DAILY_LIMIT, GUEST_LIMIT, REQUIRE_SIGNUP_TO_READ } from "@/lib/entitlement/limits";

interface State {
  enabled: boolean;
  announce: boolean;
  announceResetDate: string;
  metrics: Record<string, number>;
}

/** วันนี้ในรูปแบบ YYYY-MM-DD ตามเวลาไทย (ใช้เป็นค่าเริ่มต้น/เพดานของ date picker) */
function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

/** แปลง YYYY-MM-DD → ข้อความไทยสำหรับแบนเนอร์ เช่น "15 กันยายน 2569" */
function isoToThai(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(Date.UTC(y, m - 1, d)));
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

/** metric สุขภาพฐานข้อมูล — ค่าที่ > 0 แปลว่ามีปัญหาจริง ต้องรีบดู */
const DB_HEALTH_METRICS: { key: string; label: string; hint: string }[] = [
  { key: "dbError", label: "DB สิทธิ์ล่ม", hint: "โควตาไม่ได้ถูกบังคับจริงในช่วงนั้น" },
  { key: "dbSelfheal", label: "สร้างตารางใหม่อัตโนมัติ", hint: "ตารางเคยหาย ระบบซ่อมเองสำเร็จ" },
  { key: "dbSelfhealFailed", label: "ซ่อมตารางไม่สำเร็จ", hint: "ต้องกดปุ่ม “เตรียมฐานข้อมูล” ด้านบนเอง" },
];

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

  // ตัวช่วยเลือกวันสำหรับแบนเนอร์ประกาศ — เก็บ ISO ไว้ในเครื่องเท่านั้น (ฝั่ง server เก็บเป็นข้อความไทย)
  const [announceISO, setAnnounceISO] = useState("");

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
        setMsg("บันทึกแล้ว");
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
    setMsg(ok ? "เตรียมฐานข้อมูลเรียบร้อย" : "เตรียมฐานข้อมูลไม่สำเร็จ");
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

  if (!s) return <p className="text-sm text-muted">กำลังโหลด…</p>;

  return (
    <div className="flex flex-col gap-5">
      {msg ? <p className="text-xs text-muted">{msg}</p> : null}

      {/* ── สถานะฐานข้อมูล ── */}
      <div className="altar-panel rounded-2xl border border-line bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              1 · เตรียมฐานข้อมูล{" "}
              {dbReady === null ? (
                <span className="text-muted text-xs font-normal">(กำลังตรวจ…)</span>
              ) : dbReady ? (
                <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  ✓ พร้อม
                </span>
              ) : (
                <span className="inline-flex items-center rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800">
                  ✗ ยังไม่พร้อม
                </span>
              )}
            </h3>
            <p className="mt-1 text-xs text-muted">
              สร้างตารางเก็บโควตา (ทำครั้งเดียว · กดซ้ำได้ ปลอดภัย)
            </p>
          </div>
          <Button size="sm" variant={dbReady ? "outline" : "gold"} isLoading={dbBusy} onClick={initDb}>
            {dbReady ? "เตรียมซ้ำ" : "เตรียมฐานข้อมูล"}
          </Button>
        </div>
      </div>

      {/* ── โบนัสเปลี่ยนผ่าน ── */}
      <div className="altar-panel rounded-2xl border border-line bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-ink">2 · โบนัสเปลี่ยนผ่านผู้ใช้เดิม (10 ครั้ง)</h3>
        <p className="mt-1 mb-3 text-xs text-muted">
          ทำครั้งเดียวก่อนเปิดระบบ — ผู้ใช้ที่สมัคร <strong>ก่อน</strong> วันตัด จะได้โบนัส 10 ครั้ง (ไม่หมดอายุ) · กดซ้ำได้
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="วันตัด">
            {(field) => (
              <Input
                {...field}
                type="date"
                max={todayISO()}
                value={gfDate}
                onChange={(e) => setGfDate(e.target.value)}
              />
            )}
          </Field>
          <Button size="sm" variant="outline" isLoading={gfBusy} onClick={() => setGfDate(todayISO())}>
            ใช้วันนี้
          </Button>
          <Button size="sm" variant="outline" isLoading={gfBusy} onClick={() => grandfather(false)}>
            ตรวจจำนวน
          </Button>
          <Button size="sm" variant="gold" isLoading={gfBusy} onClick={() => grandfather(true)}>
            ให้โบนัส
          </Button>
        </div>
        {gfResult ? <p className="mt-3 text-xs text-ink font-medium">{gfResult}</p> : null}
      </div>

      {/* ── แบนเนอร์ประกาศล่วงหน้า ── */}
      <div className="altar-panel rounded-2xl border border-line bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-ink">3 · แบนเนอร์ประกาศล่วงหน้า</h3>
        <p className="mt-1 mb-3 text-xs text-muted">
          แสดงบนหน้าแรกเมื่อระบบยังปิด — เปิดล่วงหน้าอย่างน้อย <strong>7 วัน</strong> ก่อนเปิดระบบจริง
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="เลือกวันเริ่มใช้">
            {(field) => (
              <Input
                {...field}
                type="date"
                min={todayISO()}
                value={announceISO}
                onChange={(e) => {
                  setAnnounceISO(e.target.value);
                  save({ announceResetDate: isoToThai(e.target.value) });
                }}
              />
            )}
          </Field>
          <Field label="ข้อความที่จะขึ้นในแบนเนอร์ (แก้เองได้)">
            {(field) => (
              <Input
                {...field}
                key={s.announceResetDate}
                placeholder="15 กันยายน 2569"
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
        <p className="mt-3 rounded-xl border border-line bg-surface-pale p-3 text-xs text-muted">
          ตัวอย่างแบนเนอร์:{" "}
          <span className="text-ink font-semibold">
            เร็ว ๆ นี้ การเปิดไพ่จะปรับเป็น{" "}
            {REQUIRE_SIGNUP_TO_READ
              ? `สมัครสมาชิกฟรีก่อนเปิดไพ่ · สมาชิกฟรีวันละ ${DAILY_LIMIT} ครั้ง`
              : `ผู้เยี่ยมชม ${GUEST_LIMIT} ครั้ง · สมาชิกฟรีวันละ ${DAILY_LIMIT} ครั้ง`}
            {s.announceResetDate?.trim() ? ` เริ่ม ${s.announceResetDate.trim()}` : ""}
          </span>
        </p>
      </div>

      {/* ── ธงเปิดระบบจริง ── */}
      <div className="altar-panel rounded-2xl border border-rose-300 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">4 · เปิดระบบสิทธิ์จริง</h3>
            <p className="mt-1 text-xs text-muted">
              เปิด ={" "}
              {REQUIRE_SIGNUP_TO_READ
                ? `ผู้เยี่ยมชมต้องสมัครสมาชิกก่อนเปิดไพ่ · สมาชิกวันละ ${DAILY_LIMIT} ครั้ง · แชทเฉพาะสมาชิก`
                : `ผู้เยี่ยมชม ${GUEST_LIMIT} ครั้ง · สมาชิกวันละ ${DAILY_LIMIT} ครั้ง · แชทเฉพาะสมาชิก`}
              <br />
              <strong className="text-rose-700">
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

      {/* ── ทางลัดไปหน้าจัดการรหัสแลกสิทธิ์ ──
          การ์ดจัดการรหัสเคยอยู่ตรงนี้ แต่ซ้ำกับแท็บ "รหัสแลกสิทธิ์" ที่อีกสายทำมาพร้อมกัน
          (สองหน้าจอ + สอง API เขียนตารางเดียวกันคนละกติกา = ที่มาของข้อมูลเพี้ยน)
          จึงเหลือทางเดียวคือแท็บนั้น ที่นี่เก็บไว้แค่ป้ายบอกทาง */}
      <div className="altar-panel rounded-2xl border border-line bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-ink">5 · รหัสแลกสิทธิ์</h3>
        <p className="mt-1 text-xs text-muted">
          สร้าง/ปิดรหัส · ดูยอดแลกและรายชื่อผู้แลก อยู่ที่แท็บ{" "}
          <a href="/admin?tab=redeem" className="font-semibold text-ink underline">
            รหัสแลกสิทธิ์
          </a>{" "}
          — ทุกใบต้องมีเพดานจำนวนคนและวันหมดอายุเสมอ (INC-0134)
        </p>
      </div>

      {/* ── Metric เฝ้าดู 48 ชม.แรก ── */}
      <div className="altar-panel rounded-2xl border border-line bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-ink">สถิติระบบสิทธิ์ (7 วันล่าสุด)</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(METRIC_LABEL).map(([k, label]) => (
            <div key={k} className="rounded-xl border border-line bg-surface-pale p-3">
              <p className="text-[13px] text-muted">{label}</p>
              <p className="mt-0.5 text-lg font-bold text-ink">
                {(s.metrics[k] ?? 0).toLocaleString("th-TH")}
              </p>
            </div>
          ))}
        </div>
        <button onClick={load} className="mt-3 text-xs text-muted hover:text-ink">
          รีเฟรช
        </button>
      </div>

      {/* ── สุขภาพฐานข้อมูลสิทธิ์ (7 วันล่าสุด) ── */}
      <div className="altar-panel rounded-2xl border border-line bg-white p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-ink">สุขภาพฐานข้อมูลสิทธิ์ (7 วันล่าสุด)</h3>
        <p className="mt-1 text-xs text-muted">
          ทุกค่าควรเป็น <strong>0</strong> — ถ้าไม่ใช่ แปลว่าโควตาอาจไม่ถูกบังคับจริงในช่วงนั้น
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {DB_HEALTH_METRICS.map(({ key, label, hint }) => {
            const value = s.metrics[key] ?? 0;
            const bad = value > 0;
            return (
              <div
                key={key}
                className={`rounded-xl p-3 border ${
                  bad
                    ? "bg-rose-50 border-rose-200"
                    : "bg-surface-pale border-line"
                }`}
              >
                <p className="text-[13px] text-muted">{label}</p>
                <p className={`mt-0.5 text-lg font-bold ${bad ? "text-rose-700" : "text-emerald-700"}`}>
                  {value.toLocaleString("th-TH")}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted">{hint}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
