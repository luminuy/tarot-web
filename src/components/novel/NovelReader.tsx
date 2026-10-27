"use client";

import React, { useEffect, useState } from "react";
import { loadNovelChapter, type NovelChapterLoad } from "@/lib/novel/client";
import { STORAGE_KEYS } from "@/lib/storage/keys";

const AuthModal = React.lazy(() => import("@/components/auth/AuthModal").then((m) => ({ default: m.AuthModal })));

/**
 * 📖 ตัวบทนิยายรายบท — island เดียวของหน้า `/novel/<เลขบท>`
 * ---------------------------------------------------------------------------
 * นิยายอ่านได้เฉพาะสมาชิก (เจ้าของสั่ง 2026-10-27 "ต้องล็อกอิน") ตัวบทจึงไม่อยู่ใน HTML static
 * มีเซสชัน ➔ ดึงจาก `/api/novel/<เลขบท>` (ตรวจเซสชันจริงฝั่งเซิร์ฟเวอร์) · ไม่มี ➔ ย่อหน้าตัวอย่าง + ปุ่มเข้าสู่ระบบ
 * ผู้ไม่ล็อกอินได้หน้าต่างเข้าสู่ระบบเด้งขึ้นทันที (เจ้าของสั่ง) — ก้อน `AuthModal` แยกโหลดเฉพาะตอนนั้น ไม่หนักบันเดิลของสมาชิก
 * ล็อกอินด้วยอีเมลเสร็จกลับมาหน้าเดิม (`afterEmailAuthUrl`) · Google/LINE กลับหน้าเดิมอยู่แล้ว
 *
 * หน้าอ่าน (เจ้าของ "เนื้ออ่านนิยายอ่านยาก ไม่สวยเลย ออกแบบใหม่"): ตัวบทอยู่บนแผ่นกระดาษครีม ฟอนต์มีหัวแบบหนังสือ
 * ผู้อ่านเลือกขนาดตัวอักษร 3 ระดับ และพื้นกระดาษ/กลางคืนได้ — จำไว้ในเครื่อง (`STORAGE_KEYS.novelReader`)
 */

type ReaderSize = "s" | "m" | "l";
type ReaderTheme = "paper" | "night";
interface ReaderPrefs {
  size: ReaderSize;
  theme: ReaderTheme;
}

const DEFAULT_PREFS: ReaderPrefs = { size: "m", theme: "paper" };
const SIZES: { id: ReaderSize; label: string }[] = [
  { id: "s", label: "ตัวอักษรเล็ก" },
  { id: "m", label: "ตัวอักษรกลาง" },
  { id: "l", label: "ตัวอักษรใหญ่" },
];
const THEMES: { id: ReaderTheme; label: string }[] = [
  { id: "paper", label: "กระดาษ" },
  { id: "night", label: "กลางคืน" },
];

function readPrefs(): ReaderPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.novelReader) ?? "null") as Partial<ReaderPrefs> | null;
    return {
      size: raw?.size === "s" || raw?.size === "l" ? raw.size : DEFAULT_PREFS.size,
      theme: raw?.theme === "night" ? "night" : DEFAULT_PREFS.theme,
    };
  } catch {
    // ที่เก็บข้อมูลถูกบล็อกหรือค่าเสีย ➔ ใช้ค่าเริ่มต้น
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: ReaderPrefs) {
  try {
    localStorage.setItem(STORAGE_KEYS.novelReader, JSON.stringify(prefs));
  } catch {
    // เบราว์เซอร์บล็อกที่เก็บข้อมูล (โหมดส่วนตัวเข้ม) — ค่าตั้งใช้ได้แค่หน้านี้
  }
}

export function NovelReader({ number, teaser }: { number: number; teaser: string }) {
  const [state, setState] = useState<NovelChapterLoad | { status: "loading" }>({ status: "loading" });
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_PREFS);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    setPrefs(readPrefs());
    let alive = true;
    loadNovelChapter(number).then((result) => {
      if (!alive) return;
      setState(result);
      // ยังไม่ล็อกอิน ➔ เด้งหน้าต่างเข้าสู่ระบบทันที (เจ้าของ 2026-10-27) · ปิดแล้วยังมีปุ่มในกล่องด้านล่างให้เปิดใหม่
      if (result.status === "login") setAuthOpen(true);
    });
    return () => {
      alive = false;
    };
  }, [number]);

  const update = (next: Partial<ReaderPrefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    savePrefs(merged);
  };

  if (state.status === "ok") {
    return (
      <div className="v2-nv-reader" data-size={prefs.size} data-theme={prefs.theme}>
        <div className="v2-nv-tools">
          <div className="v2-nv-seg" role="group" aria-label="ขนาดตัวอักษร">
            {SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`v2-nv-seg-b v2-nv-seg-${s.id}`}
                aria-label={s.label}
                aria-pressed={prefs.size === s.id}
                onClick={() => update({ size: s.id })}
              >
                ก
              </button>
            ))}
          </div>
          <div className="v2-nv-seg" role="group" aria-label="พื้นหลังหน้าอ่าน">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="v2-nv-seg-b"
                aria-pressed={prefs.theme === t.id}
                onClick={() => update({ theme: t.id })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="v2-nv-paper">
          {state.paragraphs.map((p, i) => (
            <p key={i} className={p.kind === "beat" ? "v2-nv-beat" : undefined} dangerouslySetInnerHTML={{ __html: p.html }} />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="v2-nv-gate v2-nv-gate-wait" aria-busy="true">
        <p className="v2-nv-gate-s">กำลังเปิดบทนี้</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="v2-nv-gate" role="alert">
        <p className="v2-nv-gate-t">เปิดบทนี้ไม่สำเร็จ</p>
        <button type="button" className="ui2-btn ui2-btn-gold" onClick={() => window.location.reload()}>
          โหลดใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="v2-nv-reader" data-size="m" data-theme="paper">
        <div className="v2-nv-paper v2-nv-teaser">
          <p>{teaser}</p>
        </div>
      </div>
      <div className="v2-nv-gate">
        <p className="v2-nv-gate-t">เข้าสู่ระบบเพื่ออ่านต่อ</p>
        <p className="v2-nv-gate-s">นิยายเรื่องนี้อ่านฟรีทุกบทสำหรับสมาชิก เข้าสู่ระบบด้วย Google LINE หรืออีเมล</p>
        <button type="button" className="ui2-btn ui2-btn-gold" onClick={() => setAuthOpen(true)}>
          เข้าสู่ระบบ หรือสมัครสมาชิก
        </button>
      </div>
      {authOpen && (
        <React.Suspense fallback={null}>
          <AuthModal isOpen onClose={() => setAuthOpen(false)} initialMode="signin" />
        </React.Suspense>
      )}
    </>
  );
}
