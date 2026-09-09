"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CardImage } from "@/components/card/CardImage";
import { cardSummaryById } from "@/data/cards/summary";
import { useLocale } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";
import type { SearchResult } from "@/lib/search/vectorize";

export interface SemanticSearchPanelProps {
  query: string;
  onClose?: () => void;
  onPick?: (cardId: string) => void;
}

export function SemanticSearchPanel({ query, onClose, onPick }: SemanticSearchPanelProps) {
  const { isEnglish } = useLocale();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isDegraded, setIsDegraded] = useState(false);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setState("idle");
      return;
    }

    setState("loading");
    setIsDegraded(false);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q.trim())}&type=card&topK=8`,
        { credentials: "same-origin" },
      );

      if (!res.ok) {
        setState("error");
        return;
      }

      const data = await res.json();
      const rawResults: SearchResult[] = Array.isArray(data.results) ? data.results : [];
      setResults(rawResults);
      setIsDegraded(Boolean(data.degraded));
      setState("done");

      trackEvent("semantic_search", {
        query: q.trim(),
        query_len: q.trim().length,
        results_count: rawResults.length,
      });
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    fetchResults(query);
  }, [query, fetchResults]);

  // กรองเฉพาะการ์ดที่มีอยู่จริงในสำรับ 78 ใบ (Rule 14: Zero Fabricated Cards Policy)
  const validCards = results
    .map((res) => {
      const card = cardSummaryById(res.ref);
      return card ? { res, card } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <section
      aria-label={isEnglish ? "Semantic feelings search results" : "ผลลัพธ์การค้นหาด้วยความรู้สึก"}
      className="rounded-2xl border border-[#A58A5C]/40 bg-[#FAF7F2] p-5 sm:p-7 space-y-6 shadow-md transition duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#D5CEC2]/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-serif-th font-semibold px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] text-[#8F5C1A] shadow-2xs">
              {isEnglish ? "Semantic Wisdom Search" : "ค้นหาด้วยความรู้สึกและเจตจำนง"}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F]">
            {isEnglish ? "Cards Resonating with Your Feelings" : "ไพ่ที่ตรงกับความรู้สึกของคุณ"}
          </h2>
          <p className="text-xs text-[#635B4E] font-serif-th">
            {isEnglish
              ? `Showing deep archetypal resonance for "${query.trim()}"`
              : `วิเคราะห์คลื่นพลังงานเชิงลึกจากสำรับ 1909 Rider-Waite สำหรับคำว่า "${query.trim()}"`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchResults(query)}
            disabled={state === "loading"}
            className="text-xs font-serif-th font-bold text-[#8F5C1A] hover:text-[#29261F] px-3 py-1.5 rounded-lg border border-[#D5CEC2] bg-white hover:border-[#A58A5C] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isEnglish ? "Search Again" : "ค้นหาใหม่"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-mono text-[#635B4E] hover:text-[#29261F] p-1.5 rounded-lg border border-transparent hover:border-[#D5CEC2] transition-colors cursor-pointer"
              aria-label={isEnglish ? "Close semantic results" : "ปิดผลการค้นหาด้วยความรู้สึก"}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {state === "loading" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-[#D5CEC2]/60 bg-white/70 p-3.5 flex items-center gap-3 animate-pulse"
            >
              <div className="w-12 h-18 rounded bg-[#EAE7E0] shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 bg-[#EAE7E0] rounded w-3/4" />
                <div className="h-3 bg-[#EAE7E0] rounded w-1/2" />
                <div className="h-2.5 bg-[#EAE7E0] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error / Degraded State */}
      {(state === "error" || isDegraded) && (
        <div className="p-4 rounded-xl border border-[#D5CEC2] bg-white text-center space-y-2">
          <p className="text-xs sm:text-sm font-serif-th text-[#635B4E]">
            {isDegraded
              ? isEnglish
                ? "Daily AI search quota reached. Falling back to title and keyword matching."
                : "โควตาการค้นหาด้วย AI ประจำวันเต็มแล้ว ระบบแนะนำให้ค้นหาด้วยชื่อไพ่หรือคำสำคัญ"
              : isEnglish
                ? "Unable to connect to the semantic oracle service. Please try again."
                : "ไม่สามารถเชื่อมต่อระบบค้นหาด้วยความรู้สึกได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"}
          </p>
        </div>
      )}

      {/* Done & Empty State */}
      {state === "done" && validCards.length === 0 && (
        <div className="p-6 rounded-xl border border-[#D5CEC2] bg-white text-center space-y-2">
          <p className="text-xs sm:text-sm font-serif-th text-[#635B4E]">
            {isEnglish
              ? "No archetype directly matches this expression. Try describing your situation or emotional state with different words."
              : "ไม่พบไพ่ที่ตรงกับคำบรรยายนี้โดยตรง ลองระบุสถานการณ์หรือความรู้สึกของคุณด้วยคำอื่น"}
          </p>
        </div>
      )}

      {/* Results Grid */}
      {state === "done" && validCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {validCards.map(({ res, card }) => {
            const matchPercent = Math.min(99, Math.max(1, Math.round((res.score || 0) * 100)));
            const keywords = card.keywords.upright.slice(0, 2).join(", ");

            const content = (
              <div className="flex items-center gap-3.5 p-3 rounded-xl border border-[#D5CEC2] bg-white hover:border-[#A58A5C] transition duration-200 shadow-xs group h-full">
                {/* 1909 Rider-Waite Authentic Artwork */}
                <div className="w-12 h-20 shrink-0 overflow-hidden rounded-lg border border-[#D5CEC2] bg-[#EAE7E0] relative">
                  <CardImage
                    image={card.image}
                    cardId={card.id}
                    alt={`${card.nameTh} (${card.nameEn})`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 tarot-hd-card-image"
                    sizes="48px"
                  />
                </div>

                {/* Card Information */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-[#8F5C1A] bg-[#8F5C1A]/10 px-2 py-0.5 rounded-full">
                      {isEnglish ? `${matchPercent}% match` : `ตรง ${matchPercent}%`}
                    </span>
                    <span className="text-[11px] font-mono text-[#635B4E] uppercase">
                      {card.arcana === "major" ? "Major" : card.suit}
                    </span>
                  </div>

                  <h3 className="font-serif-th text-sm font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors truncate">
                    {isEnglish ? card.nameEn : card.nameTh}
                  </h3>
                  <p className="text-[11px] font-mono text-[#635B4E] truncate">
                    {isEnglish ? card.nameTh : card.nameEn}
                  </p>

                  {keywords && (
                    <p className="text-[11px] font-serif-th text-[#635B4E]/80 truncate pt-0.5">
                      {keywords}
                    </p>
                  )}
                </div>
              </div>
            );

            if (onPick) {
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onPick(card.id)}
                  className="text-left w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] rounded-xl"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                prefetch={false}
                className="block text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] rounded-xl"
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
