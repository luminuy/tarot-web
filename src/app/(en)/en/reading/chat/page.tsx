"use client";

import LocaleLink from "@/components/ui/LocaleLink";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { getPersona } from "@/data/personas";
import { loadFlowState, type PersistedFlow } from "@/lib/utils/flow-persistence";
import { useLocale } from "@/lib/i18n";

/**
 * 💬 Fullscreen Oracle Chat Chamber (/en/reading/chat)
 *
 * Dedicated consultation room separated from the prophecy board.
 * Restores the active reading session from sessionStorage via flow-persistence.
 */

const FollowUpChat = dynamic(
  () => import("@/components/reading/FollowUpChat").then((m) => m.FollowUpChat),
  { ssr: false }
);

export default function EnglishReadingChatPage() {
  const { isEnglish } = useLocale();
  const [flow, setFlow] = useState<PersistedFlow | null | undefined>(undefined);

  useEffect(() => {
    setFlow(loadFlowState());
  }, []);

  const persona = getPersona(flow?.personaId);
  const personaName = isEnglish ? (persona.nameEn || persona.nameTh) : persona.nameTh;
  const hasSession = !!flow && !!flow.readingId && (flow.drawnCards?.length ?? 0) > 0;

  return (
    <>
    <header
      data-site-header="reading-chat"
      className="fixed top-0 inset-x-0 z-40 h-14 w-full border-b border-line bg-surface shadow-raised"
    >
      <div className="mx-auto flex h-full max-w-2xl items-center justify-between gap-3 px-4">
        <LocaleLink
          href="/"
          aria-label="Back to Reading"
          className="flex items-center gap-1.5 rounded-lg py-1.5 pr-2 font-serif-th text-xs text-ink transition-colors hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <span aria-hidden="true">←</span> Back to Reading
        </LocaleLink>
        <span className="flex items-center gap-1.5 font-serif-th text-xs font-bold text-ink">
          Chat with {personaName}
        </span>
      </div>
    </header>

    <main id="main-content" tabIndex={-1} className="min-h-[100dvh] bg-canvas text-ink">
      <div aria-hidden="true" className="h-14" />

      <h1 className="sr-only">
        Chat with {personaName}
      </h1>

      <div className="mx-auto w-full max-w-2xl px-3 sm:px-4 py-2 sm:py-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        {flow === undefined ? (
          <div className="flex h-[60dvh] items-center justify-center font-serif-th text-sm text-muted">
            Opening sanctuary chamber...
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
              No active tarot session found
            </p>
            <p className="font-serif-th text-[13px] leading-relaxed text-muted">
              Please draw your cards and receive your reading first, then click “Chat with Oracle” on the prophecy page to continue.
            </p>
            <LocaleLink
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-2.5 font-serif-th text-xs font-bold text-canvas transition hover:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Begin Tarot Reading
            </LocaleLink>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
