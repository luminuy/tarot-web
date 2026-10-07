"use client";

import React, { useEffect, useState } from "react";
import {
  disablePush,
  enablePush,
  getPushStatus,
  getPwaState,
  precacheEncyclopediaWhenIdle,
  setOfflineOptIn,
  type PushStatus,
} from "@/lib/pwa/pwa-client";

/**
 * 🔔 ตั้งค่าแอป: การเตือนที่ผู้ใช้เลือกเอง + สารานุกรมออฟไลน์ (REFLECTION_JOURNAL_PLAN 1.9 · 1.10)
 * ⚠️ ไม่มีการขอสิทธิ์แจ้งเตือนตอนโหลดหน้า — ขอเฉพาะตอนแตะ "เปิดการเตือน"
 * ระบบยังไม่ตั้ง VAPID ➔ ซ่อนส่วนแจ้งเตือนทั้งหมด · iPhone ที่ยังไม่ติดตั้ง ➔ บอกให้ติดตั้งก่อน
 */
export const AppSettingsCard: React.FC<{ isEnglish: boolean; isMember: boolean }> = ({ isEnglish, isMember }) => {
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [hour, setHour] = useState<number | null>(7);
  const [checkins, setCheckins] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(Boolean(getPwaState().offlineOptIn));
    if (!isMember) return;
    void getPushStatus().then((s) => {
      setStatus(s);
      if (s.subscribed) {
        setHour(s.morningHour);
        setCheckins(s.checkins);
      }
    });
  }, [isMember]);

  const save = async () => {
    setBusy(true);
    setMsg("");
    const r = await enablePush({ morningHour: hour, checkins, lang: isEnglish ? "en" : "th" }).catch(() => ({ ok: false, reason: "error" }));
    setBusy(false);
    if (r.ok) {
      setStatus((s) => (s ? { ...s, subscribed: true, permission: "granted", morningHour: hour, checkins } : s));
      setMsg(L({ th: "บันทึกการเตือนแล้ว", en: "Reminders saved" }));
    } else {
      setMsg(
        r.reason === "denied"
          ? L({ th: "เบราว์เซอร์ไม่ได้อนุญาตการแจ้งเตือน — เปิดได้ที่การตั้งค่าของเบราว์เซอร์", en: "Notifications are blocked — allow them in your browser settings." })
          : L({ th: "เปิดการเตือนไม่สำเร็จ ลองใหม่อีกครั้ง", en: "Couldn't turn on reminders. Please try again." }),
      );
    }
  };

  const showPush = isMember && status?.supported && status.enabledOnServer;

  return (
    <section className="glass-tile !rounded-2xl p-4 sm:p-5 space-y-4 font-serif-th text-ink-deep" aria-labelledby="app-settings-h">
      <h2 id="app-settings-h" className="text-sm sm:text-base font-bold">
        {L({ th: "การเตือนและการใช้งานออฟไลน์", en: "Reminders & offline" })}
      </h2>

      {showPush && status && (
        <div className="space-y-3">
          {status.needsInstallOnIos ? (
            <p className="text-xs sm:text-[13px] text-muted">
              {L({
                th: "บน iPhone ต้องเพิ่ม SeerTarot ไปยังหน้าจอโฮมก่อน (แชร์ ➔ เพิ่มไปยังหน้าจอโฮม) แล้วเปิดจากไอคอน จึงจะรับการเตือนได้",
                en: "On iPhone, add SeerTarot to your Home Screen first (Share ➔ Add to Home Screen), then open it from the icon to get reminders.",
              })}
            </p>
          ) : (
            <>
              <label className="flex items-center justify-between gap-3 text-xs sm:text-[13px]">
                <span>{L({ th: "เตือนพิธีเช้าเวลา", en: "Morning ritual reminder at" })}</span>
                <select
                  value={hour ?? "off"}
                  onChange={(e) => setHour(e.target.value === "off" ? null : Number(e.target.value))}
                  className="min-h-[44px] rounded-full border border-line-interactive-warm bg-surface/80 px-3 text-ink-deep"
                >
                  <option value="off">{L({ th: "ไม่ต้องเตือน", en: "Off" })}</option>
                  {[5, 6, 7, 8, 9, 10, 11, 12, 18, 19, 20, 21].map((h) => (
                    <option key={h} value={h}>
                      {`${String(h).padStart(2, "0")}:00`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center justify-between gap-3 text-xs sm:text-[13px]">
                <span>{L({ th: "เตือนเมื่อถึงวันนัดกลับมาเช็ก", en: "Remind me on check-in days" })}</span>
                <input type="checkbox" checked={checkins} onChange={(e) => setCheckins(e.target.checked)} className="w-5 h-5 accent-[var(--color-gold-ink)]" />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => void save()} disabled={busy} className="tap-overlay-y min-h-[44px] px-5 rounded-full btn-gold-glass text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50">
                  {status.subscribed ? L({ th: "บันทึกการตั้งค่า", en: "Save settings" }) : L({ th: "เปิดการเตือน", en: "Turn on reminders" })}
                </button>
                {status.subscribed && (
                  <button
                    type="button"
                    onClick={async () => {
                      await disablePush();
                      setStatus((s) => (s ? { ...s, subscribed: false } : s));
                      setMsg(L({ th: "ปิดการเตือนบนเครื่องนี้แล้ว", en: "Reminders turned off on this device" }));
                    }}
                    className="tap-overlay-y min-h-[44px] px-4 rounded-full text-xs text-muted hover:text-err cursor-pointer"
                  >
                    {L({ th: "ปิดการเตือน", en: "Turn off" })}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted">
                {L({ th: "การเตือนไม่มีคำถามหรือบันทึกของคุณอยู่ในนั้น", en: "Reminders never include your questions or notes." })}
              </p>
            </>
          )}
        </div>
      )}

      <label className="flex items-start justify-between gap-3 text-xs sm:text-[13px]">
        <span>
          <span className="block font-semibold">{L({ th: "อ่านสารานุกรมไพ่ 78 ใบได้แม้ไม่มีเน็ต", en: "Read all 78 cards offline" })}</span>
          <span className="block text-[11px] text-muted">
            {L({ th: "โหลดตอนเครื่องว่างและต่อ Wi-Fi เท่านั้น ไม่กินเน็ตมือถือ", en: "Downloads only when idle on Wi-Fi — never on mobile data." })}
          </span>
        </span>
        <input
          type="checkbox"
          checked={offline}
          onChange={(e) => {
            setOffline(e.target.checked);
            setOfflineOptIn(e.target.checked);
            if (e.target.checked) {
              void precacheEncyclopediaWhenIdle(isEnglish).then((started) =>
                setMsg(
                  started
                    ? L({ th: "กำลังเตรียมสารานุกรมออฟไลน์ตอนเครื่องว่าง", en: "Preparing the offline encyclopedia while idle" })
                    : L({ th: "จะโหลดเมื่อต่อ Wi-Fi", en: "It will download once you're on Wi-Fi" }),
                ),
              );
            }
          }}
          className="w-5 h-5 mt-0.5 accent-[var(--color-gold-ink)]"
        />
      </label>

      {msg && (
        <p className="text-xs text-gold-ink" role="status">
          {msg}
        </p>
      )}
    </section>
  );
};
