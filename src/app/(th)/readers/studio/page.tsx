"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StudioApp } from "@/components/studio/StudioApp";

export const dynamic = "force-dynamic";

const TOKEN_KEY = "studio_reader_token";

/**
 * 🪶 /readers/studio — สตูดิโอแม่หมอ (REFLECTION_JOURNAL_PLAN 1.13)
 * เข้าด้วยลิงก์เดียวกับแผงคิว (`?token=`) — โทเคนส่งต่อให้ API เป็น Bearer เท่านั้น
 * รับโทเคนแล้วย้ายไปเก็บใน sessionStorage ของแท็บนี้ + ลบออกจาก URL ทันที
 *  • ลิงก์ที่ก๊อปจากแถบที่อยู่/ประวัติเบราว์เซอร์จึงไม่มีโทเคน
 *  • กลับจากหน้าจ่ายเงิน Stripe (URL ไม่มีโทเคน — ตั้งใจ) ยังใช้งานต่อได้ในแท็บเดิม
 */
function StudioInner() {
  const queryToken = useSearchParams().get("token");
  const [token, setToken] = useState<string | null>(queryToken);
  const [ready, setReady] = useState(Boolean(queryToken));
  useEffect(() => {
    let t = queryToken;
    try {
      if (t) sessionStorage.setItem(TOKEN_KEY, t);
      else t = sessionStorage.getItem(TOKEN_KEY);
    } catch {
      // โหมดส่วนตัว/บล็อกที่เก็บ — ใช้โทเคนจาก URL อย่างเดียว
    }
    if (queryToken) {
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
    setToken(t);
    setReady(true);
  }, [queryToken]);
  if (!ready) return <p className="py-20 text-center text-sm text-muted">กำลังเปิดสตูดิโอ…</p>;
  return <StudioApp token={token} />;
}

export default function ReaderStudioPage() {
  return (
    <main className="min-h-screen px-4 pb-16 pt-5 font-serif-th text-ink-deep sm:px-8 sm:pt-8">
      <div className="mx-auto max-w-4xl">
        <Suspense fallback={<p className="py-20 text-center text-sm text-muted">กำลังเปิดสตูดิโอ…</p>}>
          <StudioInner />
        </Suspense>
      </div>
    </main>
  );
}
