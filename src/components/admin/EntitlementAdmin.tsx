"use client";

import { useCallback, useEffect, useState } from "react";
import { APP_TIME_ZONE, bangkokDayKey } from "@/lib/time/bangkok";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { DAILY_LIMIT, GUEST_LIMIT, REQUIRE_SIGNUP_TO_READ } from "@/lib/entitlement/limits";
import { AdminErrorBanner } from "@/components/admin/AdminErrorBanner";
import { useAdminResource } from "@/lib/admin/use-admin-resource";

interface State {
  enabled: boolean;
  announce: boolean;
  announceResetDate: string;
  metrics: Record<string, number>;
}

/** วันนี้ในรูปแบบ YYYY-MM-DD ตามเวลาไทย (ใช้เป็นค่าเริ่มต้น/เพดานของ date picker)
 *  🕗 R-25: เส้นแบ่งวันมาจาก `@/lib/time/bangkok` ที่เดียว */
function todayISO(): string {
  return bangkokDayKey();
}

/** แปลง YYYY-MM-DD → ข้อความไทยสำหรับแบนเนอร์ เช่น "15 กันยายน 2569" */
function isoToThai(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
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
  { key: "dbSelfhealFailed", label: "ซ่อมตารางไม่สำเร็จ", hint: "กดปุ่ม “เตรียมฐานข้อมูล” ในหัวข้องานตั้งค่าครั้งแรกด้านล่าง" },
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
  /*
   * 🔴 R-28: ของเดิม `.catch(() => setMsg("โหลดไม่สำเร็จ"))` ปล่อยให้ `s` เป็น null ต่อไป
   * แต่หน้าจอเรนเดอร์ "กำลังโหลด…" เมื่อ `s === null` — ผลคือ **ค้างที่คำว่ากำลังโหลดตลอดกาล**
   * ผู้ดูแลจึงนั่งรอสิ่งที่ไม่มีวันมา แทนที่จะเห็นว่ามันพังไปแล้ว
   *
   * 🔴 R-31: ตอนนี้โหลดผ่านฮุกกลาง — แผงนี้เป็นแผงสุดท้ายที่ยังยิง `fetch` โหลดเอง
   */
  const { data: s, error: loadError, reload: reloadState } = useAdminResource<State>(
    "/api/admin/entitlement",
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const [dbBusy, setDbBusy] = useState(false);

  const [gfDate, setGfDate] = useState("");
  const [gfBusy, setGfBusy] = useState(false);
  const [gfResult, setGfResult] = useState("");

  // ตัวช่วยเลือกวันสำหรับแบนเนอร์ประกาศ — เก็บ ISO ไว้ในเครื่องเท่านั้น (ฝั่ง server เก็บเป็นข้อความไทย)
  const [announceISO, setAnnounceISO] = useState("");

  /** โหลดสถานะสิทธิ์ + ตรวจว่าตารางฐานข้อมูลพร้อมไหม (คนละเส้น คนละเรื่อง) */
  const load = useCallback(() => {
    void reloadState();
    ops("check_db")
      .then(({ data }) => setDbReady(!!data.ready))
      .catch(() => setDbReady(false));
  }, [reloadState]);

  useEffect(() => {
    // ฮุกกลางโหลดสถานะสิทธิ์ให้เองตอน mount — ที่นี่เหลือแค่การตรวจฐานข้อมูล
    ops("check_db")
      .then(({ data }) => setDbReady(!!data.ready))
      .catch(() => setDbReady(false));
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
          `ให้โบนัสแล้ว ${data.granted} คน${data.remaining ? ` (เหลืออีก ${data.remaining} — กดซ้ำได้)` : ""}`,
        );
        load();
      } else {
        setGfResult(`พบผู้ใช้ ${data.count} คนที่สมัครก่อน ${gfDate}`);
      }
      setGfBusy(false);
    },
    [gfDate, load],
  );

  if (loadError) return <AdminErrorBanner error={loadError} onRetry={load} />;
  if (!s) return <p className="text-sm text-muted">กำลังโหลด…</p>;

  const policyText = REQUIRE_SIGNUP_TO_READ
    ? `ผู้เยี่ยมชมต้องสมัครสมาชิกก่อนเปิดไพ่ · สมาชิกวันละ ${DAILY_LIMIT} ครั้ง · แชทเฉพาะสมาชิก`
    : `ผู้เยี่ยมชม ${GUEST_LIMIT} ครั้ง · สมาชิกวันละ ${DAILY_LIMIT} ครั้ง · แชทเฉพาะสมาชิก`;

  return (
    <div className="flex flex-col gap-5">
      {msg ? (
        <p role="status" className="text-xs text-muted">
          {msg}
        </p>
      ) : null}

      {/* ── สวิตช์หลัก ── */}
      <section
        className={`rounded-xl border bg-white p-5 ${s.enabled ? "border-line" : "border-rose-300"}`}
        aria-labelledby="ent-switch"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 id="ent-switch" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
              ระบบสิทธิ์เปิดไพ่
              <span
                className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                  s.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {s.enabled ? "เปิดใช้งาน" : "ปิดอยู่"}
              </span>
              {dbReady === false ? (
                <span className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800">
                  ตารางฐานข้อมูลยังไม่พร้อม
                </span>
              ) : null}
            </h3>
            <p className="mt-1 text-xs text-muted">กติกาปัจจุบัน: {policyText}</p>
            {!s.enabled ? (
              <p className="mt-1 text-xs font-semibold text-rose-700">
                ปิดอยู่ = โควตาไม่ถูกบังคับ ผังใหญ่และปรมาจารย์ลับไม่ถูกล็อก
              </p>
            ) : null}
          </div>
          <Button
            size="sm"
            variant={s.enabled ? "outline" : "gold"}
            isLoading={saving}
            disabled={!dbReady}
            onClick={() => {
              const q = s.enabled
                ? "ยืนยันปิดระบบสิทธิ์? ผู้ใช้จะเปิดไพ่ได้ไม่จำกัดจนกว่าจะเปิดใหม่"
                : "ยืนยันเปิดระบบสิทธิ์? โควตาจะถูกบังคับทันที";
              if (!confirm(q)) return;
              save({ enabled: !s.enabled });
            }}
          >
            {s.enabled ? "ปิดระบบสิทธิ์" : "เปิดระบบสิทธิ์"}
          </Button>
        </div>
      </section>

      {/* ── ตัวเลข 7 วัน ── */}
      <section className="altar-card-porcelain p-5" aria-labelledby="ent-metrics">
        <div className="flex items-center justify-between">
          <h3 id="ent-metrics" className="text-sm font-semibold text-ink">
            ตัวเลขระบบสิทธิ์ (7 วันล่าสุด)
          </h3>
          <Button variant="outline" size="sm" onClick={load} className="text-xs">
            โหลดล่าสุด
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(METRIC_LABEL).map(([k, label]) => (
            <div key={k} className="rounded-lg border border-line p-3">
              <p className="text-xs text-muted">{label}</p>
              <p className="mt-0.5 font-mono text-lg font-bold text-ink">{(s.metrics[k] ?? 0).toLocaleString("th-TH")}</p>
            </div>
          ))}
        </div>

        <h4 className="mt-5 text-xs font-semibold text-ink">สุขภาพฐานข้อมูลสิทธิ์ — ทุกค่าควรเป็น 0</h4>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {DB_HEALTH_METRICS.map(({ key, label, hint }) => {
            const value = s.metrics[key] ?? 0;
            const bad = value > 0;
            return (
              <div key={key} className={`rounded-lg border p-3 ${bad ? "border-rose-200 bg-rose-50" : "border-line"}`}>
                <p className="text-xs text-muted">{label}</p>
                <p className={`mt-0.5 font-mono text-lg font-bold ${bad ? "text-rose-700" : "text-ink"}`}>
                  {value.toLocaleString("th-TH")}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted">{hint}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── แบนเนอร์ประกาศล่วงหน้า ── */}
      <section className="altar-card-porcelain p-5" aria-labelledby="ent-announce">
        <h3 id="ent-announce" className="text-sm font-semibold text-ink">
          แบนเนอร์ประกาศเปลี่ยนกติกา
        </h3>
        <p className="mt-1 mb-3 text-xs text-muted">
          ขึ้นบนหน้าแรกเมื่อจะเปลี่ยนกติกาการเปิดไพ่ — ควรประกาศล่วงหน้าอย่างน้อย 7 วัน
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="วันเริ่มใช้">
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
          <Field label="ข้อความวันที่ในแบนเนอร์">
            {(field) => (
              <Input
                {...field}
                key={s.announceResetDate}
                placeholder="15 กันยายน 2569"
                defaultValue={s.announceResetDate}
                onBlur={(e) => {
                  if (e.target.value !== s.announceResetDate) save({ announceResetDate: e.target.value });
                }}
              />
            )}
          </Field>
          <Button size="sm" variant={s.announce ? "gold" : "outline"} onClick={() => save({ announce: !s.announce })}>
            {s.announce ? "แบนเนอร์แสดงอยู่ — กดเพื่อซ่อน" : "แบนเนอร์ซ่อนอยู่ — กดเพื่อแสดง"}
          </Button>
        </div>
        <p className="mt-3 rounded-lg border border-line bg-canvas p-3 text-xs text-muted">
          ตัวอย่าง:{" "}
          <span className="font-semibold text-ink">
            เร็ว ๆ นี้ การเปิดไพ่จะปรับเป็น{" "}
            {REQUIRE_SIGNUP_TO_READ
              ? `สมัครสมาชิกฟรีก่อนเปิดไพ่ · สมาชิกฟรีวันละ ${DAILY_LIMIT} ครั้ง`
              : `ผู้เยี่ยมชม ${GUEST_LIMIT} ครั้ง · สมาชิกฟรีวันละ ${DAILY_LIMIT} ครั้ง`}
            {s.announceResetDate?.trim() ? ` เริ่ม ${s.announceResetDate.trim()}` : ""}
          </span>
        </p>
      </section>

      {/*
        ── งานตั้งค่าครั้งแรก ──
        ระบบเปิดใช้จริงแล้ว สองปุ่มนี้แทบไม่ต้องกดอีก จึงพับเก็บไว้ (เดิมเป็นข้อ 1–2 บนสุดของหน้า)
        ยังต้องมีไว้: ถ้าตารางหาย ปุ่ม "เตรียมฐานข้อมูล" คือทางซ่อมที่ไม่ต้องใช้ terminal
        (การ์ด "รหัสแลกสิทธิ์" ที่เคยอยู่ตรงนี้ถูกถอด — ซ้ำกับเมนู "รหัสแลกสิทธิ์")
      */}
      <details className="altar-card-porcelain p-5" open={dbReady === false}>
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          งานตั้งค่าครั้งแรก (ทำครั้งเดียว)
        </summary>

        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">
              เตรียมตารางฐานข้อมูลสิทธิ์{" "}
              <span className="text-xs font-normal text-muted">
                ({dbReady === null ? "กำลังตรวจ…" : dbReady ? "พร้อมแล้ว" : "ยังไม่พร้อม"})
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted">กดซ้ำได้ ปลอดภัย — ใช้ซ่อมเมื่อตารางหาย</p>
          </div>
          <Button size="sm" variant={dbReady ? "outline" : "gold"} isLoading={dbBusy} onClick={initDb}>
            {dbReady ? "เตรียมซ้ำ" : "เตรียมฐานข้อมูล"}
          </Button>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="text-sm font-medium text-ink">โบนัสเปลี่ยนผ่านผู้ใช้เดิม (10 ครั้ง)</p>
          <p className="mt-0.5 mb-3 text-xs text-muted">
            ผู้ใช้ที่สมัครก่อนวันตัดได้โบนัส 10 ครั้ง (ไม่หมดอายุ) · กดซ้ำได้ ไม่ให้ซ้ำคนเดิม
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="วันตัด">
              {(field) => (
                <Input {...field} type="date" max={todayISO()} value={gfDate} onChange={(e) => setGfDate(e.target.value)} />
              )}
            </Field>
            <Button size="sm" variant="outline" isLoading={gfBusy} onClick={() => grandfather(false)}>
              ตรวจจำนวน
            </Button>
            <Button size="sm" variant="gold" isLoading={gfBusy} onClick={() => grandfather(true)}>
              ให้โบนัส
            </Button>
          </div>
          {gfResult ? <p className="mt-3 text-xs font-medium text-ink">{gfResult}</p> : null}
        </div>
      </details>
    </div>
  );
}
