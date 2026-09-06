"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export default function TesterLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<"checking" | "in" | "out">("checking");

  const refresh = () =>
    fetch("/api/tester/session")
      .then((r) => r.json())
      .then((d) => setState(d.tester ? "in" : "out"))
      .catch(() => setState("out"));

  useEffect(() => {
    refresh();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tester/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      setPassword("");
      await refresh();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    await fetch("/api/tester/logout", { method: "POST" }).catch(() => {});
    await refresh();
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="altar-panel rounded-3xl p-7">
        <h1 className="font-mystic-gold text-xl font-bold">โหมดผู้ทดสอบ</h1>

        {state === "in" ? (
          <>
            <p className="mt-2 text-sm text-[#9c93b8]">
              ปลดล็อกแล้ว — เปิดไพ่และคุยกับแม่หมอได้ไม่จำกัด ไม่ติดโควตาหรือลิมิตใด ๆ บนอุปกรณ์นี้
              (นาน 30 วัน)
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/"
                className="w-full rounded-xl bg-[#ffd700] px-4 py-2.5 text-center text-sm font-bold text-[#05040a] hover:bg-[#ffe34d] transition-colors"
              >
                เข้าใช้งานเว็บ
              </Link>
              <button
                type="button"
                onClick={logout}
                disabled={loading}
                className="w-full rounded-xl border border-[#e5c07b]/30 px-4 py-2.5 text-center text-sm text-[#cfc8e2] hover:bg-[#191230] transition-colors disabled:opacity-50"
              >
                ออกจากโหมดผู้ทดสอบ
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-[#9c93b8]">
              ใส่รหัสผ่านผู้ทดสอบเพื่อใช้เว็บแบบไม่จำกัด (สำหรับทีมงานเท่านั้น)
            </p>
            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <Field label="รหัสผ่านผู้ทดสอบ" error={error}>
                {(id) => (
                  <Input
                    id={id}
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </Field>
              <Button type="submit" isLoading={loading} disabled={!password || state === "checking"}>
                ปลดล็อก
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
