"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { getPersona } from "@/data/personas";
import { loadFlowState, type PersistedFlow } from "@/lib/utils/flow-persistence";
import { useLocale } from "@/lib/i18n";

/**
 * 💬 หน้าแชทเต็มจอกับแม่หมอ (/reading/chat)
 *
 * แยกห้องสนทนาออกจากหน้าคำทำนายหลัก — ผู้ใช้กดปุ่ม "แชทออนไลน์กับแม่หมอ"
 * จากหน้าผลไพ่แล้วมาที่นี่เพื่อ "คุยอย่างเดียว" ไม่มีอย่างอื่นมากวนสายตา
 *
 * ข้อมูลรอบดูดวง (ไพ่ที่เปิด / บทสรุป / แม่หมอ / โทเค็นเซสชัน) อ่านจาก sessionStorage
 * ผ่าน flow-persistence ตัวเดียวกับที่หน้าหลักเขียนไว้ — จึงต่อบทสนทนากับไพ่ชุดเดิมได้
 */

const FollowUpChat = dynamic(
  () => import("@/components/reading/FollowUpChat").then((m) => m.FollowUpChat),
  { ssr: false }
);

export default function ReadingChatPage() {
  const { isEnglish } = useLocale();
  // undefined = ยังไม่อ่าน · null = ไม่มีรอบดูดวงค้างไว้
  const [flow, setFlow] = useState<PersistedFlow | null | undefined>(undefined);

  useEffect(() => {
    setFlow(loadFlowState());
  }, []);

  const persona = getPersona(flow?.personaId);
  const personaName = isEnglish ? (persona.nameEn || persona.nameTh) : persona.nameTh;
  const hasSession = !!flow && !!flow.readingId && (flow.drawnCards?.length ?? 0) > 0;

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[100dvh] bg-canvas text-ink">
      {/* ตัวกันที่ของแถบหัวที่เป็น `fixed` — สูงเท่า h-14 ของ <header> เป๊ะ ห้ามลบ (INC-0109) */}
      <div aria-hidden="true" className="h-14" />

      {/*
        แถบหัวบาง ๆ — ปุ่มกลับไปหน้าคำทำนาย + ชื่อแม่หมอ
        ใช้ `fixed` ไม่ใช่ `sticky` ด้วยเหตุผลเดียวกับ SiteHeader (INC-0109):
        sticky ต้องคำนวณระยะเยื้องใหม่ทุกเฟรมเทียบ layout viewport ซึ่งบน iOS Safari
        ขยับเองระหว่างเลื่อน (แถบ URL ย่อ/ขยาย · rubber-band) ค่าที่ได้จึงแกว่งจนแถบสั่น
      */}
      <header className="fixed top-0 inset-x-0 z-40 h-14 w-full border-b border-line bg-surface shadow-raised">
        <div className="mx-auto flex h-full max-w-2xl items-center justify-between gap-3 px-4">
          <Link
            href="/"
            aria-label={isEnglish ? "Back to Reading" : "กลับไปหน้าคำทำนาย"}
            className="flex items-center gap-1.5 rounded-lg py-1.5 pr-2 font-serif-th text-xs text-ink transition-colors hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span aria-hidden="true">←</span> {isEnglish ? "Back to Reading" : "กลับไปหน้าคำทำนาย"}
          </Link>
          <span className="flex items-center gap-1.5 font-serif-th text-xs font-bold text-ink">
            
            {isEnglish ? `Chat with ${personaName}` : `แชทกับ${persona.nameTh}`}
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-3 sm:px-4 py-2 sm:py-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        {flow === undefined ? (
          <div className="flex h-[60dvh] items-center justify-center font-serif-th text-sm text-muted">
            {isEnglish ? "Opening sanctuary chamber..." : "กำลังเปิดห้องแชท..."}
          </div>
        ) : hasSession ? (
          <FollowUpChat
            readingId={flow!.readingId as string}
            persona={persona}
            sessionToken={flow!.sessionToken}
            heightClass="h-[calc(100dvh-5rem-env(safe-area-inset-bottom,0px))] sm:h-[calc(100dvh-6.5rem)]"
            readingSnapshot={{
              question: flow!.question || undefined,
              spreadId: flow!.spreadId,
              summary: flow!.readingResult?.summary,
              personaId: persona.id,
              drawn: (flow!.drawnCards || []).map((d) => ({
                order: d.order,
                cardIndex: d.cardIndex,
                isReversed: !!d.isReversed,
              })),
            }}
          />
        ) : (
          <div className="mt-10 space-y-4 rounded-xl border border-line bg-surface p-6 text-center shadow-xs">
            <p className="font-serif-th text-sm text-ink">
              {isEnglish ? "No active tarot session found" : "ยังไม่มีรอบดูดวงที่เปิดค้างไว้"}
            </p>
            <p className="font-serif-th text-[13px] leading-relaxed text-muted">
              {isEnglish
                ? "Please draw your cards and receive your reading first, then click “Chat with Oracle” on the prophecy page to continue."
                : "เปิดไพ่และอ่านคำทำนายก่อน แล้วจึงกดปุ่ม “แชทออนไลน์กับแม่หมอ” จากหน้าผลไพ่เพื่อคุยต่อ"}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-2.5 font-serif-th text-xs font-bold text-canvas transition hover:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {isEnglish ? "Begin Tarot Reading" : "ไปเปิดไพ่"}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
