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
  const [show, setShow] = useState(false);

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
    <main id="main-content" tabIndex={-1} className="admin-workspace flex min-h-screen flex-col justify-center px-6">
      <div className="admin-card mx-auto w-full max-w-sm p-7 sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-warm shadow-xs">
          <Image
            src="/logo.webp"
            alt="SeerTarot Logo"
            width={56}
            height={56}
            className="h-full w-full object-cover"
            priority
          />
        </div>
        <h1 className="text-center text-lg font-bold text-ink">แผงแอดมิน SeerTarot</h1>
        <p className="mt-1 text-center text-xs text-muted">
          ใส่รหัสผ่านผู้ดูแลระบบเพื่อเข้าจัดการ
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <Field label="รหัสผ่านแอดมิน" error={error}>
            {(field) => (
              <Input
                {...field}
                type={show ? "text" : "password"}
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
          <label className="-mt-2 inline-flex w-fit cursor-pointer items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 accent-ink" />
            แสดงรหัสผ่าน
          </label>
          <Button type="submit" isLoading={loading} disabled={!password}>
            เข้าสู่ระบบ
          </Button>
        </form>
      </div>
    </main>
  );
}
