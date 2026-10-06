"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StudioApp } from "@/components/studio/StudioApp";

export const dynamic = "force-dynamic";

/**
 * 🪶 /readers/studio — สตูดิโอแม่หมอ (REFLECTION_JOURNAL_PLAN 1.13)
 * เข้าด้วยลิงก์เดียวกับแผงคิว (`?token=`) — โทเคนส่งต่อให้ API เป็น Bearer เท่านั้น
 */
function StudioInner() {
  const token = useSearchParams().get("token");
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
