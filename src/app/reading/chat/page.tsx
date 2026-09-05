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
    <main className="min-h-[100dvh] bg-[#F3F0EA] text-[#29261F]">
      {/* แถบหัวบาง ๆ — ปุ่มกลับไปหน้าคำทำนาย + ชื่อแม่หมอ */}
      <header className="sticky top-0 z-40 h-14 w-full border-b border-[#D5CEC2] bg-[#FFFFFF] shadow-[var(--shadow-raised)]">
        <div className="mx-auto flex h-full max-w-2xl items-center justify-between gap-3 px-4">
          <Link
            href="/"
            aria-label={isEnglish ? "Back to Reading" : "กลับไปหน้าคำทำนาย"}
            className="flex items-center gap-1.5 rounded-lg py-1.5 pr-2 font-serif-th text-xs text-[#29261F] transition-colors hover:text-[#A58A5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A58A5C]"
          >
            <span aria-hidden="true">←</span> {isEnglish ? "Back to Reading" : "กลับไปหน้าคำทำนาย"}
          </Link>
          <span className="flex items-center gap-1.5 font-serif-th text-xs font-bold text-[#29261F]">
            
            {isEnglish ? `Chat with ${personaName}` : `แชทกับ${persona.nameTh}`}
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 py-4">
        {flow === undefined ? (
          <div className="flex h-[60dvh] items-center justify-center font-serif-th text-sm text-[#635B4E]">
            {isEnglish ? "Opening sanctuary chamber..." : "กำลังเปิดห้องแชท..."}
          </div>
        ) : hasSession ? (
          <FollowUpChat
            readingId={flow!.readingId as string}
            persona={persona}
            sessionToken={flow!.sessionToken}
            heightClass="h-[calc(100dvh-6.5rem)]"
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
          <div className="mt-10 space-y-4 rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 text-center shadow-xs">
            <p className="font-serif-th text-sm text-[#29261F]">
              {isEnglish ? "No active tarot session found" : "ยังไม่มีรอบดูดวงที่เปิดค้างไว้"}
            </p>
            <p className="font-serif-th text-[13px] leading-relaxed text-[#635B4E]">
              {isEnglish
                ? "Please draw your cards and receive your reading first, then click “Chat with Oracle” on the prophecy page to continue."
                : "เปิดไพ่และอ่านคำทำนายก่อน แล้วจึงกดปุ่ม “แชทออนไลน์กับแม่หมอ” จากหน้าผลไพ่เพื่อคุยต่อ"}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#29261F] px-6 py-2.5 font-serif-th text-xs font-bold text-[#F3F0EA] transition-all hover:bg-[#A58A5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A58A5C]"
            >
              {isEnglish ? "Begin Tarot Reading" : "ไปเปิดไพ่"}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
