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
    <main id="main-content" tabIndex={-1} className="admin-workspace flex min-h-screen items-center justify-center px-4 py-10">
      <div className="admin-card grid w-full max-w-3xl overflow-hidden md:grid-cols-[1fr_1.1fr]">
        {/* แผงแบรนด์ — บอกชัดว่าเป็นระบบภายใน */}
        <div className="admin-login-brand flex flex-col justify-between gap-8 p-7 sm:p-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.webp" alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" priority />
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-white">SeerTarot</span>
              <span className="admin-nav-muted block text-xs">Admin Console</span>
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">ระบบผู้ดูแล</p>
            <p className="admin-nav-muted mt-2 text-sm leading-relaxed">
              สำหรับผู้ดูแลที่ได้รับอนุญาตเท่านั้น การเข้าสู่ระบบและทุกการกระทำในระบบนี้ถูกบันทึกไว้
            </p>
          </div>
        </div>

        <div className="p-7 sm:p-8">
          <h1 className="text-xl font-semibold text-ink">เข้าสู่ระบบ</h1>
          <p className="mt-1 text-sm text-muted">ใส่รหัสผ่านผู้ดูแลระบบเพื่อเข้าจัดการ</p>

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
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 accent-gold-ink" />
              แสดงรหัสผ่าน
            </label>
            <Button type="submit" isLoading={loading} disabled={!password}>
              เข้าสู่ระบบ
            </Button>
          </form>

          <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
            ใส่รหัสผิดหลายครั้งติดกัน ระบบจะพักการเข้าสู่ระบบชั่วคราว 15 นาที · เข้าสู่ระบบแล้วอยู่ได้ 8 ชั่วโมง
          </p>
        </div>
      </div>
    </main>
  );
}
