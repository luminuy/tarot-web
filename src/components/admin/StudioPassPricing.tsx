"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * ✦ ราคาบัตรผ่านสตูดิโอแม่หมอ 30 วัน — ราคากลาง + ราคาเฉพาะคน (src/app/api/admin/studio-pass)
 * ราคาใหม่มีผลกับการกดซื้อครั้งถัดไป · คำสั่งซื้อที่เริ่มไปแล้วยังตรวจยอดตามราคาเดิมของมัน
 */

interface Row {
  id: string;
  displayName: string;
  status: string;
  priceThb: number | null;
  proUntil: number | null;
}

interface Data {
  days: number;
  minThb: number;
  maxThb: number;
  adminDefaultThb: number | null;
  envDefaultThb: number | null;
  effectiveDefaultThb: number | null;
  readers: Row[];
}

const STATUS_TH: Record<string, string> = { approved: "อนุมัติแล้ว", pending: "รออนุมัติ", suspended: "ระงับ" };

function parsePrice(text: string, min: number, max: number): number | null | "invalid" {
  const t = text.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isInteger(n) && n >= min && n <= max ? n : "invalid";
}

export default function StudioPassPricing() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [defaultText, setDefaultText] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/studio-pass");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "โหลดไม่สำเร็จ");
      setData(d);
      setDefaultText(d.adminDefaultThb ? String(d.adminDefaultThb) : "");
      setDrafts(Object.fromEntries((d.readers as Row[]).map((r) => [r.id, r.priceThb ? String(r.priceThb) : ""])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (key: string, method: "PUT" | "PATCH", body: object, done: string) => {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/studio-pass", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "บันทึกไม่สำเร็จ");
      setNotice(done);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(null);
    }
  };

  if (!data) {
    return (
      <section className="altar-card-porcelain p-5" aria-labelledby="studio-pass-h">
        <h3 id="studio-pass-h" className="text-sm font-semibold text-ink">ราคาบัตรผ่านสตูดิโอแม่หมอ</h3>
        <p className="mt-2 text-xs text-muted">{error ?? "กำลังโหลด…"}</p>
      </section>
    );
  }

  const range = `${data.minThb}–${data.maxThb.toLocaleString("th-TH")} บาท`;
  const saveDefault = () => {
    const v = parsePrice(defaultText, data.minThb, data.maxThb);
    if (v === "invalid") return setError(`ราคากลางต้องเป็นบาทเต็ม ${range}`);
    send("default", "PUT", { defaultPriceThb: v }, v === null ? "กลับไปใช้ราคาตั้งต้นแล้ว" : `ตั้งราคากลาง ${v} บาทแล้ว`);
  };
  const saveReader = (r: Row) => {
    const v = parsePrice(drafts[r.id] ?? "", data.minThb, data.maxThb);
    if (v === "invalid") return setError(`ราคาของ ${r.displayName} ต้องเป็นบาทเต็ม ${range} (เว้นว่าง = ใช้ราคากลาง)`);
    send(r.id, "PATCH", { readerId: r.id, priceThb: v }, v === null ? `${r.displayName} ใช้ราคากลางแล้ว` : `ตั้งราคาของ ${r.displayName} เป็น ${v} บาทแล้ว`);
  };

  return (
    <section className="altar-card-porcelain p-5" aria-labelledby="studio-pass-h">
      <h3 id="studio-pass-h" className="text-sm font-semibold text-ink">ราคาบัตรผ่านสตูดิโอแม่หมอ {data.days} วัน</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        เงินที่แม่หมอจ่ายให้ SeerTarot เพื่อร่างคำอ่านด้วย AI ได้มากขึ้น (ไม่ใช่ค่าปรึกษาที่ลูกค้าจ่ายแม่หมอ — อันนั้นแก้ที่ปุ่ม "แก้ไข" ของแม่หมอแต่ละคนด้านบน) ·
        เปลี่ยนแล้วมีผลกับการกดซื้อครั้งถัดไปทันที
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs text-muted">
          ราคากลาง (บาท) · ใช้กับแม่หมอทุกคนที่ไม่ได้ตั้งราคาเฉพาะ
          <Input
            type="number"
            inputMode="numeric"
            min={data.minThb}
            max={data.maxThb}
            placeholder={data.envDefaultThb ? `${data.envDefaultThb} (ค่าตั้งต้น)` : "ยังไม่เปิดขาย"}
            value={defaultText}
            onChange={(e) => setDefaultText(e.target.value)}
            className="mt-1"
          />
        </label>
        <Button variant="gold" onClick={saveDefault} disabled={busy !== null} className="min-h-11">
          {busy === "default" ? "กำลังบันทึก…" : "บันทึกราคากลาง"}
        </Button>
      </div>
      <p className="mt-1 text-[11px] text-muted">
        ตอนนี้ใช้ {data.effectiveDefaultThb ? `${data.effectiveDefaultThb} บาท` : "— (ยังไม่เปิดขาย)"}
        {data.adminDefaultThb ? " · ตั้งจากหน้านี้" : " · ค่าตั้งต้นของระบบ"} · เว้นว่างแล้วบันทึก = กลับไปใช้ค่าตั้งต้น
      </p>

      <h4 className="mt-5 text-xs font-semibold text-ink">ราคาเฉพาะแม่หมอ (เว้นว่าง = ใช้ราคากลาง)</h4>
      {data.readers.length === 0 ? (
        <p className="mt-2 text-xs text-muted">ยังไม่มีแม่หมอในระบบ</p>
      ) : (
        <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
          {data.readers.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{r.displayName}</p>
                <p className="text-[11px] text-muted">
                  {STATUS_TH[r.status] ?? r.status} · จ่ายจริง{" "}
                  <span className="font-semibold text-ink">
                    {r.priceThb ?? data.effectiveDefaultThb ?? "—"}
                    {r.priceThb || data.effectiveDefaultThb ? " บาท" : ""}
                  </span>
                  {r.priceThb ? " (ราคาเฉพาะคน)" : " (ราคากลาง)"}
                  {r.proUntil ? ` · บัตรผ่านใช้ได้ถึง ${new Date(r.proUntil).toLocaleDateString("th-TH", { dateStyle: "medium" })}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={data.minThb}
                  max={data.maxThb}
                  aria-label={`ราคาบัตรผ่านของ ${r.displayName}`}
                  placeholder={data.effectiveDefaultThb ? String(data.effectiveDefaultThb) : "ราคากลาง"}
                  value={drafts[r.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                  className="min-w-0 flex-1 sm:w-32 sm:flex-none"
                />
                <Button variant="outline" size="sm" onClick={() => saveReader(r)} disabled={busy !== null} className="min-h-11 shrink-0 whitespace-nowrap">
                  {busy === r.id ? "…" : "บันทึก"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-xs text-emerald-800">
          {notice}
        </p>
      )}
    </section>
  );
}
