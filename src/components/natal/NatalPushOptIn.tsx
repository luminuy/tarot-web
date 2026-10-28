"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/data/natal/content";
import { enablePush, getPushStatus, type PushStatus } from "@/lib/pwa/pwa-client";

/**
 * 🔔 เตือนดวงวันนี้ทุกเช้า (ใต้การ์ดดวงวันนี้) — ใช้ระบบแจ้งเตือนเดิมของเว็บ (สมาชิก · เลือกเปิดเอง)
 * ส่งขึ้นเซิร์ฟเวอร์แค่ subscription ของเครื่อง + ชั่วโมงที่อยากให้เตือน + `morningTarget: "natal"`
 * **ไม่ส่งผังเกิดหรือข้อมูลเกิด** ข้อความเตือนเป็นข้อความกลาง ผังคำนวณในเครื่องตอนแตะเปิด
 * ขอสิทธิ์แจ้งเตือนเฉพาะตอนผู้ใช้แตะปุ่ม · เบราว์เซอร์ไม่รองรับหรือระบบยังไม่เปิด = ไม่แสดงอะไรเลย
 */
export default function NatalPushOptIn({ lang }: { lang: Lang }) {
  const isTh = lang === "th";
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [hour, setHour] = useState(7);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [needSignIn, setNeedSignIn] = useState(false);

  useEffect(() => {
    let alive = true;
    void getPushStatus()
      .then((s) => {
        if (!alive) return;
        setStatus(s);
        if (s.subscribed && s.morningHour !== null) setHour(s.morningHour);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (!status || !status.supported || !status.enabledOnServer) return null;
  const on = status.subscribed && status.morningTarget === "natal" && status.morningHour !== null;

  if (status.needsInstallOnIos) {
    return (
      <p className="text-xs text-muted">
        {isTh
          ? "อยากให้เตือนดวงวันนี้ทุกเช้าบน iPhone: เพิ่ม SeerTarot ไปยังหน้าจอโฮมก่อน (แชร์ แล้ว เพิ่มไปยังหน้าจอโฮม) แล้วเปิดจากไอคอน"
          : "For a morning reminder on iPhone, add SeerTarot to your Home Screen first (Share, then Add to Home Screen) and open it from the icon."}
      </p>
    );
  }

  async function turnOn() {
    setBusy(true);
    setMsg(null);
    const r = await enablePush({
      morningHour: hour,
      // คงการตั้งค่าเตือนวันนัดเช็กเดิมไว้ · เครื่องที่ยังไม่เคยสมัคร = เปิดตามค่าเริ่มต้นของระบบ
      checkins: status?.subscribed ? status.checkins : true,
      lang,
      morningTarget: "natal",
    }).catch(() => ({ ok: false, reason: "error" }));
    setBusy(false);
    if (r.ok) {
      setStatus((s) => (s ? { ...s, subscribed: true, permission: "granted", morningHour: hour, morningTarget: "natal" } : s));
      setMsg(isTh ? `เปิดแล้ว จะเตือนทุกวันเวลา ${String(hour).padStart(2, "0")}:00 น.` : `Done. You'll get a reminder every day at ${String(hour).padStart(2, "0")}:00.`);
    } else if (r.reason === "signin") {
      setNeedSignIn(true);
    } else {
      setMsg(
        r.reason === "denied"
          ? isTh
            ? "เบราว์เซอร์ไม่ได้อนุญาตการแจ้งเตือน เปิดได้ที่การตั้งค่าของเบราว์เซอร์"
            : "Notifications are blocked. Allow them in your browser settings."
          : isTh
            ? "เปิดการเตือนไม่สำเร็จ ลองใหม่อีกครั้ง"
            : "Couldn't turn on the reminder. Please try again.",
      );
    }
  }

  return (
    <div className="rounded-xl border border-line-warm p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="nt-push-hour" className="text-sm text-ink">
          {isTh ? "เตือนดวงวันนี้ทุกเช้าเวลา" : "Remind me every morning at"}
        </label>
        <select id="nt-push-hour" value={hour} onChange={(e) => setHour(Number(e.target.value))} className="min-h-[44px] rounded-full border border-line-interactive-warm bg-surface/80 px-3 text-sm text-ink">
          {[5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
            <option key={h} value={h}>{`${String(h).padStart(2, "0")}:00`}</option>
          ))}
        </select>
        <button type="button" onClick={() => void turnOn()} disabled={busy} className="rounded-full btn-gold-glass px-4 min-h-[44px] text-sm font-bold disabled:opacity-50">
          {on ? (isTh ? "บันทึกเวลา" : "Save time") : isTh ? "เปิดการเตือน" : "Turn on"}
        </button>
      </div>
      {on && !msg && <p className="text-xs text-muted">{isTh ? `เปิดอยู่ เตือนเวลา ${String(status.morningHour).padStart(2, "0")}:00 น.` : `On, at ${String(status.morningHour).padStart(2, "0")}:00.`}</p>}
      {msg && (
        <p className="text-xs text-muted" role="status">
          {msg}
        </p>
      )}
      {needSignIn && (
        <a href="/account" className="inline-flex min-h-[44px] items-center text-sm underline text-gold-ink">
          {isTh ? "การเตือนสำหรับสมาชิก เข้าสู่ระบบก่อน" : "Reminders are for members. Sign in first."}
        </a>
      )}
      <p className="text-xs text-muted">
        {isTh
          ? "การเตือนแทนพิธีเช้าเดิม (ถ้าเคยเปิดไว้) ไม่มีข้อมูลเกิดหรือผังของคุณอยู่ในการเตือน ผังคำนวณในเครื่องตอนแตะเปิด"
          : "This replaces the morning ritual reminder if you had one. Reminders carry no birth data; your chart is calculated on your device when you open it."}
      </p>
    </div>
  );
}
