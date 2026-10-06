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

export interface ExplainPositionText {
  name: string;
  meaning: string;
}

/**
 * `positions` = ข้อความตำแหน่งของผังที่สร้างเอง — ต่อท้ายเป็น `#pos=` (fragment ไม่ถูกส่งไปเซิร์ฟเวอร์/ไม่ติดแคชที่ขอบ)
 * แล้ว `load` เติมกลับเข้าไปในผลลัพธ์ฝั่งเบราว์เซอร์
 */
export function explainUrl(
  spreadId: string,
  drawn: readonly ExplainDrawn[],
  category: string,
  isEnglish: boolean,
  positions?: readonly ExplainPositionText[],
) {
  const cards = [...drawn]
    .sort((a, b) => a.order - b.order)
    .map((d) => `${d.cardIndex}${d.isReversed ? "r" : ""}`)
    .join(",");
  const q = new URLSearchParams({ spread: spreadId, cards, cat: category, lang: isEnglish ? "en" : "th" });
  const base = `/api/reading/explain?${q.toString()}`;
  return positions?.length ? `${base}#pos=${encodeURIComponent(JSON.stringify(positions))}` : base;
}

function positionsFromFragment(url: string): ExplainPositionText[] | null {
  const i = url.indexOf("#pos=");
  if (i < 0) return null;
  try {
    const v = JSON.parse(decodeURIComponent(url.slice(i + 5)));
    return Array.isArray(v) ? (v as ExplainPositionText[]) : null;
  } catch {
    return null;
  }
}

function load(url: string): Promise<ExplainResponse> {
  let p = cache.get(url);
  if (!p) {
    const hash = url.indexOf("#");
    const positions = positionsFromFragment(url);
    p = fetch(hash >= 0 ? url.slice(0, hash) : url).then(async (res) => {
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error || "explain failed");
      const data = body as ExplainResponse;
      if (positions) {
        data.cards = data.cards.map((c) => ({
          ...c,
          position: { name: positions[c.order]?.name ?? "", meaning: positions[c.order]?.meaning ?? "" },
        }));
      }
      return data;
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
