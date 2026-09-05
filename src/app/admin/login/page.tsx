"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ถ้าเข้าระบบอยู่แล้ว เด้งเข้าแผงเลย
  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.admin) router.replace("/admin");
      })
      .catch(() => {});
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      router.replace("/admin");
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="altar-panel rounded-3xl border border-[#D5CEC2] bg-white p-7 shadow-xs">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[#D5CEC2] bg-[#F8F6F2] shadow-xs">
          <Image
            src="/logo.webp"
            alt="SeerTarot Logo"
            width={56}
            height={56}
            className="h-full w-full object-cover"
            priority
          />
        </div>
        <h1 className="text-center text-lg font-bold text-[#29261F]">แผงแอดมิน SeerTarot</h1>
        <p className="mt-1 text-center text-xs text-[#635B4E]">
          ใส่รหัสผ่านผู้ดูแลระบบเพื่อเข้าจัดการ
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <Field label="รหัสผ่านแอดมิน" error={error}>
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
          <Button type="submit" isLoading={loading} disabled={!password}>
            เข้าสู่ระบบ
          </Button>
        </form>
      </div>
    </div>
  );
}
