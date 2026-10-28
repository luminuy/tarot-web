"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lang } from "@/data/natal/content";
import { decodeChartShare } from "@/lib/astro/chart-share";
import type { ChartSpec } from "@/lib/astro/chart-spec";

/**
 * 📥 ผังที่เพื่อนส่งมาทางลิงก์ `/natal-chart#add=…` (โหลดแบบ lazy เมื่อเปิดลิงก์แบบนั้น)
 * - ถอดรหัสและตรวจค่าทุกช่อง (`decodeChartShare`) ผิดรูปแบบ = บอกผู้ใช้ ไม่เดาค่า
 * - ลบ `#add=…` ออกจากแถบที่อยู่ทันทีที่อ่านแล้ว กันรีเฟรช/คัดลอกลิงก์ต่อโดยไม่ตั้งใจ
 * - บันทึกลงเครื่องเมื่อผู้ใช้กดเองเท่านั้น
 */
export default function NatalImport({
  code,
  lang,
  onSave,
  onOpen,
  onClose,
}: {
  code: string;
  lang: Lang;
  onSave: (spec: ChartSpec) => boolean;
  onOpen: (spec: ChartSpec) => void;
  onClose: () => void;
}) {
  const isTh = lang === "th";
  const spec = useMemo(() => decodeChartShare(code), [code]);
  const [state, setState] = useState<"idle" | "saved" | "failed">("idle");

  useEffect(() => {
    // ข้อมูลเกิดของเพื่อนไม่ควรค้างในแถบที่อยู่/ประวัติการเปิดหน้า
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  if (!spec) {
    return (
      <div role="alert" className="rounded-xl border border-err p-3 text-sm text-err space-y-2">
        <p>{isTh ? "ลิงก์ผังนี้ไม่สมบูรณ์หรือถูกแก้ไข เปิดไม่ได้ ขอลิงก์ใหม่จากเพื่อนอีกครั้ง" : "This chart link is incomplete or was altered. Ask your friend to send it again."}</p>
        <button type="button" onClick={onClose} className="rounded-full border border-line-warm px-4 min-h-[44px] text-sm text-ink">
          {isTh ? "ปิด" : "Close"}
        </button>
      </div>
    );
  }

  const who = spec.name || (isTh ? "ไม่มีชื่อ" : "Unnamed");
  const date = isTh ? `${spec.day}/${spec.month}/${spec.yearCe + 543}` : `${spec.day}/${spec.month}/${spec.yearCe}`;
  return (
    <section aria-labelledby="nt-import-title" className="altar-card-porcelain rounded-2xl p-4 space-y-3">
      <h2 id="nt-import-title" className="font-serif-th font-bold text-ink text-lg">
        {isTh ? `มีคนส่งผังของ ${who} มาให้` : `Someone sent you ${who}'s chart`}
      </h2>
      <p className="text-sm text-ink">
        {date} · {spec.timeKnown ? `${String(spec.hour).padStart(2, "0")}:${String(spec.minute).padStart(2, "0")}` : isTh ? "ไม่ทราบเวลาเกิด" : "time unknown"} · {isTh ? spec.place.label : spec.place.labelEn ?? spec.place.label}
      </p>
      <p className="text-xs text-muted">
        {isTh
          ? "ข้อมูลมากับลิงก์โดยตรง ไม่ได้ผ่านเซิร์ฟเวอร์ของเว็บ ถ้าบันทึก จะเก็บไว้ในเครื่องนี้เท่านั้น แล้วใช้เทียบในแท็บผังคู่ได้"
          : "The data came inside the link and never passed through our servers. If you save it, it stays on this device and you can compare charts in the synastry tab."}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={state === "saved"}
          onClick={() => setState(onSave(spec) ? "saved" : "failed")}
          className="rounded-full btn-gold-glass px-4 min-h-[44px] text-sm font-bold disabled:opacity-60"
        >
          {state === "saved" ? (isTh ? "บันทึกแล้ว" : "Saved") : isTh ? "บันทึกไว้ในเครื่องนี้" : "Save on this device"}
        </button>
        <button type="button" onClick={() => onOpen(spec)} className="rounded-full border border-line-warm bg-surface px-4 min-h-[44px] text-sm text-ink">
          {isTh ? "เปิดผังนี้" : "Open this chart"}
        </button>
        <button type="button" onClick={onClose} className="rounded-full border border-line-warm px-4 min-h-[44px] text-sm text-ink">
          {isTh ? "ไม่บันทึก" : "Dismiss"}
        </button>
      </div>
      {state === "failed" && <p role="alert" className="text-xs text-err">{isTh ? "บันทึกไม่ได้ เบราว์เซอร์นี้ปิดการเก็บข้อมูลในเครื่อง" : "Could not save: this browser blocks local storage."}</p>}
    </section>
  );
}
