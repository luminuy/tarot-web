"use client";

import React, { useEffect, useState } from "react";
import {
  dismissInstall,
  getPwaState,
  isIos,
  isStandalone,
  markInstalled,
  precacheEncyclopediaWhenIdle,
  shouldOfferInstall,
} from "@/lib/pwa/pwa-client";

/**
 * 📱 ชวนติดตั้งแอป — ขึ้นเฉพาะหลังผู้ใช้เห็นคุณค่าแล้ว (REFLECTION_JOURNAL_PLAN 1.10)
 * Android/Chromium: ใช้ `beforeinstallprompt` ของเบราว์เซอร์ · iPhone: แผ่นสอน "แชร์ ➔ เพิ่มไปยังหน้าจอโฮม"
 * ติดตั้งแล้ว (หรือเปิดจากหน้าจอโฮม) ➔ เติมสารานุกรมออฟไลน์ตอนเครื่องว่าง
 * ⚠️ วางเฉพาะหน้าที่ผู้ใช้ "อยู่ต่อ" (/journal · /daily) ไม่วางในเปลือกทุกหน้า — ไม่เพิ่มน้ำหนักให้หน้าอื่น
 */
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export const InstallPrompt: React.FC<{ isEnglish: boolean }> = ({ isEnglish }) => {
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      // เปิดจากหน้าจอโฮม = ติดตั้งแล้ว — เติมสารานุกรมออฟไลน์เงียบ ๆ (เครือข่ายไม่เหมาะ = ข้าม)
      void precacheEncyclopediaWhenIdle(isEnglish);
      return;
    }
    const offer = shouldOfferInstall(getPwaState(), { standalone: false, now: Date.now() });
    const onBip = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
      if (offer) setShow(true);
    };
    const onInstalled = () => {
      markInstalled();
      setShow(false);
      void precacheEncyclopediaWhenIdle(isEnglish);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    if (offer && isIos()) {
      setIos(true);
      setShow(true);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isEnglish]);

  if (!show) return null;
  const close = () => {
    dismissInstall();
    setShow(false);
  };

  return (
    <aside
      role="dialog"
      aria-labelledby="install-h"
      className="glass-tile !rounded-2xl p-4 sm:p-5 w-full max-w-2xl mx-auto space-y-3 font-serif-th text-ink-deep border border-gold-ink/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 id="install-h" className="text-sm sm:text-base font-bold">
            ✦ {L({ th: "เก็บ SeerTarot ไว้บนหน้าจอโฮม", en: "Keep SeerTarot on your home screen" })}
          </h2>
          <p className="text-xs sm:text-[13px] text-muted leading-relaxed">
            {L({
              th: "เปิดพิธีเช้าได้ในแตะเดียว อ่านสารานุกรมไพ่ได้แม้ไม่มีเน็ต และรับการเตือนที่คุณตั้งเอง",
              en: "Open the morning ritual in one tap, read the card encyclopedia offline, and get the reminders you choose.",
            })}
          </p>
        </div>
        <button type="button" onClick={close} aria-label={L({ th: "ปิด", en: "Close" })} className="tap-overlay-y w-11 h-11 -mr-2 -mt-2 rounded-full text-muted hover:text-ink-deep cursor-pointer">
          ×
        </button>
      </div>
      {ios ? (
        <ol className="list-decimal pl-5 text-xs sm:text-[13px] space-y-1">
          <li>{L({ th: "แตะปุ่ม \"แชร์\" (สี่เหลี่ยมมีลูกศรชี้ขึ้น) ด้านล่างของ Safari", en: "Tap Safari's Share button (the square with an up arrow)" })}</li>
          <li>{L({ th: "เลื่อนลงแล้วเลือก \"เพิ่มไปยังหน้าจอโฮม\"", en: "Scroll and choose \"Add to Home Screen\"" })}</li>
          <li>{L({ th: "แตะ \"เพิ่ม\" — เสร็จแล้ว", en: "Tap \"Add\" — that's it" })}</li>
        </ol>
      ) : (
        <button
          type="button"
          disabled={!bip}
          onClick={async () => {
            if (!bip) return;
            await bip.prompt();
            const choice = await bip.userChoice.catch(() => ({ outcome: "dismissed" }));
            if (choice.outcome === "accepted") markInstalled();
            else dismissInstall();
            setShow(false);
          }}
          className="tap-overlay-y min-h-[44px] px-5 rounded-full btn-gold-glass text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
        >
          {L({ th: "ติดตั้งแอป", en: "Install the app" })}
        </button>
      )}
    </aside>
  );
};
