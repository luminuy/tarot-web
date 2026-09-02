"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * แหล่งเดียวของ "ใครกำลังใช้เว็บอยู่" ฝั่งหน้าเว็บ
 * ---------------------------------------------------------------------------
 * ก่อนหน้านี้แต่ละคอมโพเนนต์ยิง `/api/auth/me` เอง (page, แถบโปรไฟล์, การ์ดสิทธิ์,
 * การ์ดเปลี่ยนรหัสผ่าน) — เปิดหน้าบัญชีครั้งเดียวยิง 3–4 ครั้งพร้อมกัน และ page ยัง
 * ยิงซ้ำทุกครั้งที่เปิด/ปิดหน้าต่างเข้าสู่ระบบ ทุกครั้งคือการอ่าน D1 หนึ่งรอบ
 *
 * ที่นี่รวมคำขอที่เกิดพร้อมกันให้เหลือครั้งเดียว (in-flight dedupe) + แคชสั้น ๆ
 */

export interface SessionUser {
  id: string;
  provider: "google" | "line" | "email";
  email?: string;
  name: string;
  avatar?: string;
  createdAt: string;
  emailVerified?: boolean;
  marketingConsent?: boolean;
  /** บัญชีนี้ตั้งรหัสผ่านไว้แล้วหรือยัง — เดาจาก provider ไม่ได้ */
  hasPassword?: boolean;
}

const CACHE_TTL_MS = 30_000;

let cached: { user: SessionUser | null; at: number } | null = null;
let inflight: Promise<SessionUser | null> | null = null;
const listeners = new Set<(user: SessionUser | null) => void>();

/** ล้างแคชเมื่อสถานะล็อกอินเปลี่ยน (ล็อกอิน / ออกจากระบบ / เปลี่ยนความยินยอม) */
export function invalidateSessionCache(): void {
  cached = null;
  inflight = null;
}

/** อัปเดตข้อมูลผู้ใช้ในแคชแบบไม่ต้องยิง API ใหม่ (หลังบันทึกค่าที่ผู้ใช้เพิ่งเปลี่ยน) */
export function patchSessionUser(patch: Partial<SessionUser>): void {
  if (!cached?.user) return;
  cached = { user: { ...cached.user, ...patch }, at: cached.at };
  listeners.forEach((fn) => fn(cached!.user));
}

export async function fetchSessionUser(opts?: { force?: boolean }): Promise<SessionUser | null> {
  if (opts?.force) invalidateSessionCache();

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.user;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const user = (data?.user as SessionUser | undefined) ?? null;
      cached = { user, at: Date.now() };
      listeners.forEach((fn) => fn(user));
      return user;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** hook สำหรับคอมโพเนนต์ที่ต้องรู้ว่าใครล็อกอินอยู่ */
export function useSessionUser(): {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<SessionUser | null>;
} {
  const [user, setUser] = useState<SessionUser | null>(() => cached?.user ?? null);
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async () => {
    const next = await fetchSessionUser({ force: true });
    setUser(next);
    return next;
  }, []);

  useEffect(() => {
    let alive = true;
    listeners.add(setUser);

    fetchSessionUser()
      .then((next) => {
        if (!alive) return;
        setUser(next);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      listeners.delete(setUser);
    };
  }, []);

  return { user, loading, refresh };
}

/**
 * แปลงรหัสข้อผิดพลาดจาก `?auth_error=` เป็นข้อความไทย
 * ⚠️ ห้ามเอาค่าดิบจาก query string ไปแสดงตรง ๆ — ผู้โจมตีส่งลิงก์ที่ทำให้เว็บเรา
 * แสดงข้อความอะไรก็ได้ (เช่น เบอร์โทรปลอมให้ผู้ใช้โทรไป) ได้ทันที
 */
export function describeAuthError(code: string | null | undefined): string {
  switch (code) {
    case "state_mismatch":
      return "คำขอเข้าสู่ระบบหมดอายุหรือไม่ตรงกัน กรุณากดเข้าสู่ระบบใหม่อีกครั้ง";
    case "access_denied":
      return "คุณยกเลิกการให้สิทธิ์เข้าสู่ระบบ ลองใหม่ได้ทุกเมื่อ";
    case "provider_unavailable":
      return "ช่องทางเข้าสู่ระบบนี้ยังไม่พร้อมใช้งาน กรุณาใช้อีเมลหรือช่องทางอื่นก่อน";
    case "provider_error":
      return "ติดต่อผู้ให้บริการล็อกอินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    case "profile_unavailable":
      return "ดึงข้อมูลบัญชีจากผู้ให้บริการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    default:
      return "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  }
}
