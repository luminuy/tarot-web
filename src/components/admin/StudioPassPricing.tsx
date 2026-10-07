"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * ✦ ราคาแพ็กเกจ AI ช่วยเขียน 30 วัน (ในโค้ดเรียก "studio pass") — ราคากลาง + ราคาเฉพาะคน (src/app/api/admin/studio-pass)
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
        <h3 id="studio-pass-h" className="text-base font-semibold text-ink">ราคาแพ็กเกจ AI ช่วยเขียน</h3>
        <p className="mt-2 text-sm text-muted">{error ?? "กำลังโหลด…"}</p>
      </section>
    );
  }

  const baht = (n: number) => `${n.toLocaleString("th-TH")} บาท`;
  const rangeError = `ใส่ราคาเป็นจำนวนเต็ม ${data.minThb}–${data.maxThb.toLocaleString("th-TH")} บาท`;
  const normal = data.effectiveDefaultThb;
  const saveDefault = (text: string) => {
    const v = parsePrice(text, data.minThb, data.maxThb);
    if (v === "invalid") return setError(rangeError);
    send("default", "PUT", { defaultPriceThb: v }, v === null ? "กลับไปใช้ราคาเริ่มต้นแล้ว" : `บันทึกราคาปกติ ${baht(v)} แล้ว`);
  };
  const saveReader = (r: Row) => {
    const v = parsePrice(drafts[r.id] ?? "", data.minThb, data.maxThb);
    if (v === "invalid") return setError(`${r.displayName}: ${rangeError}`);
    send(r.id, "PATCH", { readerId: r.id, priceThb: v }, v === null ? `${r.displayName} กลับไปใช้ราคาปกติแล้ว` : `ตั้งราคาพิเศษให้ ${r.displayName}: ${baht(v)}`);
  };

  return (
    <section className="altar-card-porcelain p-5" aria-labelledby="studio-pass-h">
      <h3 id="studio-pass-h" className="text-base font-semibold text-ink">ราคาแพ็กเกจ AI ช่วยเขียน ({data.days} วัน)</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        แม่หมอที่เปิดใช้ AI ในสตูดิโอ ซื้อเพิ่มได้ถ้าอยากให้ AI ช่วยเขียนคำอ่านได้มากขึ้นต่อวัน (ไม่ซื้อก็ใช้สตูดิโอได้ครบ) —
        คนละอย่างกับค่าดูดวงที่ลูกค้าจ่ายแม่หมอ
      </p>

      {/* ราคาปกติ */}
      <div className="mt-5">
        <label htmlFor="studio-pass-default" className="text-sm font-medium text-ink">
          ราคาปกติ
        </label>
        <p className="text-xs text-muted">ใช้กับแม่หมอทุกคน ยกเว้นคนที่ได้ราคาพิเศษด้านล่าง</p>
        <div className="mt-2 flex items-center gap-2">
          <PriceInput
            id="studio-pass-default"
            min={data.minThb}
            max={data.maxThb}
            placeholder={data.envDefaultThb ? String(data.envDefaultThb) : ""}
            value={defaultText}
            onChange={setDefaultText}
          />
          <Button variant="gold" onClick={() => saveDefault(defaultText)} disabled={busy !== null} className="min-h-11 shrink-0 whitespace-nowrap">
            {busy === "default" ? "กำลังบันทึก…" : "บันทึก"}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {normal ? (
            <>
              ตอนนี้ <span className="font-semibold text-ink">{baht(normal)}</span>
              {data.adminDefaultThb ? "" : " (ราคาเริ่มต้นของระบบ)"}
            </>
          ) : (
            "ยังไม่ได้ตั้งราคา — แม่หมอยังซื้อแพ็กเกจไม่ได้"
          )}
          {data.adminDefaultThb && data.envDefaultThb ? (
            <>
              {" · "}
              <button
                type="button"
                onClick={() => saveDefault("")}
                disabled={busy !== null}
                className="tap-overlay-y underline underline-offset-2 hover:text-ink"
              >
                กลับไปใช้ราคาเริ่มต้น ({baht(data.envDefaultThb)})
              </button>
            </>
          ) : null}
        </p>
      </div>

      {/* ราคาพิเศษรายคน */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-ink">ราคาพิเศษรายคน</h4>
        <p className="text-xs text-muted">ใส่ราคาเฉพาะแม่หมอที่ต้องการ · เว้นว่างไว้ = ใช้ราคาปกติ</p>
        {data.readers.length === 0 ? (
          <p className="mt-3 text-sm text-muted">ยังไม่มีแม่หมอในระบบ</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
            {data.readers.map((r) => {
              const pays = r.priceThb ?? normal;
              return (
                <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-ink">
                      <span className="truncate">{r.displayName}</span>
                      {r.status !== "approved" && (
                        <span className="rounded border border-line px-1.5 py-px text-[11px] font-normal text-muted">
                          {STATUS_TH[r.status] ?? r.status}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {pays ? (
                        <>
                          จ่าย <span className="font-semibold text-ink">{baht(pays)}</span>
                          {r.priceThb ? " · ราคาพิเศษ" : " · ราคาปกติ"}
                        </>
                      ) : (
                        "ยังซื้อไม่ได้ (ยังไม่ได้ตั้งราคา)"
                      )}
                      {r.proUntil
                        ? ` · ใช้งานได้ถึง ${new Date(r.proUntil).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriceInput
                      ariaLabel={`ราคาพิเศษของ ${r.displayName}`}
                      min={data.minThb}
                      max={data.maxThb}
                      placeholder={normal ? String(normal) : ""}
                      value={drafts[r.id] ?? ""}
                      onChange={(v) => setDrafts((d) => ({ ...d, [r.id]: v }))}
                      compact
                    />
                    <Button variant="outline" size="sm" onClick={() => saveReader(r)} disabled={busy !== null} className="min-h-11 shrink-0 whitespace-nowrap">
                      {busy === r.id ? "กำลังบันทึก…" : "บันทึก"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-muted">ราคาใหม่ใช้กับการซื้อครั้งถัดไป · คนที่กำลังจ่ายเงินอยู่จะจ่ายราคาเดิม</p>

      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}
    </section>
  );
}

/** ช่องราคามีคำว่า "บาท" ต่อท้ายในช่อง — อ่านจบในตัวไม่ต้องเดาหน่วย */
function PriceInput({
  id,
  ariaLabel,
  min,
  max,
  placeholder,
  value,
  onChange,
  compact,
}: {
  id?: string;
  ariaLabel?: string;
  min: number;
  max: number;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`relative ${compact ? "min-w-0 flex-1 sm:w-36 sm:flex-none" : "min-w-0 flex-1 sm:max-w-xs"}`}>
      <Input
        id={id}
        aria-label={ariaLabel}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-12"
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-muted">
        บาท
      </span>
    </div>
  );
}
