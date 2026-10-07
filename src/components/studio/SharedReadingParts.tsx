"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readEnvelope } from "@/lib/api/envelope";

/** ฟอร์มใส่รหัสเปิดคำอ่าน (ลิงก์ที่หมอตั้งรหัสไว้) — ผ่านแล้วรีเฟรชหน้าให้เซิร์ฟเวอร์เรนเดอร์คำอ่าน */
export function UnlockForm({ token, accent }: { token: string; accent: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const env = readEnvelope(await res.json().catch(() => null), res.ok);
      if (env.ok) router.refresh();
      else setError(env.error);
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
      <label htmlFor="studio-pass" className="text-sm font-semibold text-ink-deep">
        รหัสที่ได้รับจากแม่หมอ
      </label>
      <input
        id="studio-pass"
        type="password"
        autoComplete="off"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="min-h-11 rounded-xl border border-line-interactive-warm bg-surface px-4 text-base text-ink-deep outline-none focus-visible:ring-2 focus-visible:ring-gold-ink/50"
      />
      {error && (
        <p role="alert" className="text-sm text-err">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="min-h-11 rounded-xl px-5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: accent }}
      >
        {busy ? "กำลังเปิด…" : "เปิดคำอ่าน"}
      </button>
    </form>
  );
}

/** บันทึกเป็น PDF ด้วยหน้าพิมพ์ของเบราว์เซอร์ — ไม่ต้องมีไลบรารี PDF ฝั่งเซิร์ฟเวอร์ */
export function PrintButton({ accent }: { accent: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="studio-no-print inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors hover:bg-inset-warm"
      style={{ borderColor: accent, color: accent }}
    >
      ✦ บันทึกเป็น PDF / พิมพ์
    </button>
  );
}
