"use client";

/**
 * 🧰 ฮุกเดียวสำหรับทุกแผงแอดมิน — โหลด · กำลังโหลด · ผิดพลาด · โหลดใหม่
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้ (บทเรียน R-28)
 *
 * รอบตรวจ 2026-09-17 พบว่าแผงแอดมิน 9 แผงเขียนชุด fetch/loading/error เองซ้ำกันทั้ง 9 ครั้ง
 * และ **3 แผงหายไปครึ่งหนึ่ง**:
 *
 * - `AdminOverview` · `AiHealthPanel` · `StatsDashboard` — **ไม่มี UI แสดงข้อผิดพลาดเลย**
 *   API คืน 500 แล้วเรนเดอร์ตารางว่าง ซึ่งผู้ดูแลอ่านได้ว่า "ไม่มีข้อมูล" ไม่ใช่ "พัง"
 *   นี่คือความต่างที่สำคัญที่สุดสำหรับหน้าจอที่มีไว้เฝ้าระบบ
 * - `EntitlementAdmin` — ไม่มี UI ตอนกำลังโหลด
 *
 * เพิ่มแท็บแอดมินใหม่จึงต้องไปลอกแพตเทิร์นจากเพื่อนบ้านที่บังเอิญเปิดเจอ
 * และเพื่อนบ้านแต่ละตัวไม่ตรงกัน
 *
 * ## ทำไมถึงเขียนเป็นฮุกเดียวได้ในวันนี้
 *
 * เพราะ `readEnvelope()` ใน `@/lib/api/envelope` เข้าใจซองจดหมายทั้งสี่แบบที่รีโปนี้ใช้อยู่
 * (R-29) — ฮุกนี้จึงไม่ต้องรู้ว่า route ปลายทางตอบด้วย `ok` · `success` หรือ `error`
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { readEnvelope } from "@/lib/api/envelope";

export interface AdminResource<T> {
  data: T | null;
  loading: boolean;
  /** ข้อความผิดพลาดที่แสดงให้ผู้ดูแลเห็นได้ — `null` แปลว่ายังไม่มีข้อผิดพลาด */
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * โหลดข้อมูลจากเส้น API ของแอดมินหนึ่งเส้น
 *
 * @param url        เส้นทางที่จะยิง (ยิงแบบ `no-store` เสมอ — หน้าจอเฝ้าระบบต้องเห็นของสด)
 * @param options.immediate  โหลดทันทีตอน mount (ค่าเริ่มต้น: true)
 * @param options.select     แปลงเนื้อคำตอบเป็นรูปที่แผงนั้นใช้
 */
export function useAdminResource<T = Record<string, unknown>>(
  url: string,
  options: { immediate?: boolean; select?: (body: Record<string, unknown>) => T } = {},
): AdminResource<T> {
  const { immediate = true, select } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  /*
   * A5-09: ตัวกรองเปลี่ยน ➔ URL เปลี่ยน ➔ ยิงคำขอใหม่ — คำขอเก่าที่กลับมาทีหลังห้ามทับของใหม่ และห้ามปิดสถานะ "กำลังโหลด" แทนคำขอล่าสุด
   * ใช้เลขลำดับ + AbortController: ผลของคำขอที่ไม่ใช่ลำดับล่าสุดถูกทิ้งทั้งหมด (data · error · loading)
   */
  const seq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const loadedUrl = useRef<string | null>(null);

  const reload = useCallback(async () => {
    const mine = ++seq.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const isLatest = () => mine === seq.current;

    setLoading(true);
    setError(null);
    // เปลี่ยนไปโหลดคนละ URL (ตัวกรอง/ช่วงวัน/คำค้นใหม่) = ข้อมูลเดิมเป็นของอีกชุด ห้ามค้างโชว์ใต้ป้ายของชุดใหม่ (R-28)
    if (loadedUrl.current !== null && loadedUrl.current !== url) setData(null);
    try {
      const res = await fetch(url, { cache: "no-store", signal: controller.signal });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!isLatest()) return;
      const envelope = readEnvelope(body, res.ok);

      if (!envelope.ok) {
        /* 🔴 R-28: ล้มเหลว = **ล้างข้อมูลเดิมทิ้งด้วย**
           ถ้าเก็บของเก่าไว้พร้อมข้อความผิดพลาด ผู้ดูแลจะอ่านตัวเลขเก่าเป็นตัวเลขปัจจุบัน
           ซึ่งบนหน้าจอเฝ้าระบบอันตรายกว่าการไม่เห็นตัวเลขเลย */
        setData(null);
        setError(`${envelope.error} (HTTP ${res.status})`);
        return;
      }

      loadedUrl.current = url;
      setData(select ? select(envelope.data) : (envelope.data as T));
    } catch (err) {
      if (!isLatest()) return;
      setData(null);
      setError(
        err instanceof Error
          ? `ติดต่อเซิร์ฟเวอร์ไม่ได้: ${err.message}`
          : "ติดต่อเซิร์ฟเวอร์ไม่ได้",
      );
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [url, select]);

  useEffect(() => {
    if (immediate) void reload();
  }, [immediate, reload]);

  // ออกจากหน้า: ยกเลิกคำขอที่ค้าง และทำให้ผลที่กลับมาทีหลังถูกทิ้ง (ไม่ setState หลัง unmount)
  useEffect(
    () => () => {
      seq.current += 1;
      abortRef.current?.abort();
    },
    [],
  );

  return { data, loading, error, reload };
}
