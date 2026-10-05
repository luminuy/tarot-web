"use client";

import { useEffect, useState } from "react";
import type { ExplainResponse } from "@/lib/tarot/explain-types";

/**
 * ✦ ดึง "หลักฐานของคำอ่าน" จาก `/api/reading/explain` — เรียกเมื่อผู้ใช้เปิดแผงเท่านั้น (`enabled`)
 * ผลขึ้นกับไพ่ + ผัง + หมวดอย่างเดียว ➔ จำไว้ในหน่วยความจำของแท็บ เปิด/ปิดซ้ำไม่ยิงใหม่
 * ⚠️ ห้าม import สารานุกรมไพ่มาคำนวณในเบราว์เซอร์แทน — บันเดิลพุ่ง (HANDOFF_ASTRO_MIGRATION)
 */

const cache = new Map<string, Promise<ExplainResponse>>();

export interface ExplainDrawn {
  order: number;
  cardIndex: number;
  isReversed: boolean;
}

export function explainUrl(spreadId: string, drawn: readonly ExplainDrawn[], category: string, isEnglish: boolean) {
  const cards = [...drawn]
    .sort((a, b) => a.order - b.order)
    .map((d) => `${d.cardIndex}${d.isReversed ? "r" : ""}`)
    .join(",");
  const q = new URLSearchParams({ spread: spreadId, cards, cat: category, lang: isEnglish ? "en" : "th" });
  return `/api/reading/explain?${q.toString()}`;
}

function load(url: string): Promise<ExplainResponse> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then(async (res) => {
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error || "explain failed");
      return body as ExplainResponse;
    });
    // ล้มแล้วต้องลองใหม่ได้ — ไม่จำคำสัญญาที่พัง
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

export function useReadingExplain(url: string | null, enabled: boolean) {
  const [state, setState] = useState<{ url: string | null; data: ExplainResponse | null; error: string | null }>({
    url: null,
    data: null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !url) return;
    let alive = true;
    load(url)
      .then((data) => alive && setState({ url, data, error: null }))
      .catch((err: Error) => alive && setState({ url, data: null, error: err.message }));
    return () => {
      alive = false;
    };
  }, [url, enabled, attempt]);

  const fresh = state.url === url;
  return {
    data: fresh ? state.data : null,
    error: fresh ? state.error : null,
    loading: enabled && !!url && (!fresh || (!state.data && !state.error)),
    retry: () => {
      setState({ url: null, data: null, error: null });
      setAttempt((n) => n + 1);
    },
  };
}
