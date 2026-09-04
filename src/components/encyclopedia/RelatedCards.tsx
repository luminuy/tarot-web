"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { CardImage } from "@/components/card/CardImage";
import { cardById } from "@/data/cards";

interface SearchResult {
  ref: string;
  title: string;
  subtitle: string;
  score: number;
}

/**
 * "ไพ่ที่พลังงานใกล้เคียง" — ค้นหาเชิงความหมายผ่าน /api/search (Vectorize)
 * Vectorize ยังไม่พร้อม / index ว่าง → คืน [] → คอมโพเนนต์ไม่เรนเดอร์อะไร (degrade เงียบ)
 */
export function RelatedCards({ cardId }: { cardId: string }) {
  const [results, setResults] = useState<SearchResult[] | null>(null);

  useEffect(() => {
    let alive = true;
    setResults(null);
    fetch(`/api/search?like=card:${encodeURIComponent(cardId)}&type=card&topK=4`, {
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((d: { results?: SearchResult[] }) => {
        if (alive) setResults(Array.isArray(d.results) ? d.results : []);
      })
      .catch(() => {
        if (alive) setResults([]);
      });
    return () => {
      alive = false;
    };
  }, [cardId]);

  if (!results || results.length === 0) return null;

  return (
    <section className="pt-8 border-t border-[#D5CEC2]/40">
      <h2 className="font-serif-th text-sm font-bold text-[#8F5C1A] mb-4">
        ✦ ไพ่ที่พลังงานใกล้เคียง
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {results.map((r) => {
          const c = cardById(r.ref);
          if (!c) return null;
          return (
            <Link
              key={r.ref}
              href={`/cards/${r.ref}`}
              className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-[#D5CEC2] bg-white hover:border-[#A58A5C] transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
            >
              <div className="w-8 h-12 shrink-0 overflow-hidden rounded border border-[#D5CEC2] bg-[#EAE7E0]">
                <CardImage
                  image={c.image}
                  cardId={c.id}
                  alt=""
                  className="w-full h-full object-cover tarot-hd-card-image"
                  sizes="32px"
                />
              </div>
              <div className="min-w-0">
                <span className="font-serif-th text-xs font-bold text-[#29261F] group-hover:text-[#A58A5C] block truncate">
                  {c.nameTh}
                </span>
                <span className="font-serif-th text-[11px] text-[#635B4E] block truncate">{c.nameEn}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
