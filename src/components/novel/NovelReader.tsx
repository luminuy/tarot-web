"use client";

import React, { useEffect, useState } from "react";
import { loadNovelChapter, type NovelChapterLoad } from "@/lib/novel/client";

const AuthModal = React.lazy(() => import("@/components/auth/AuthModal").then((m) => ({ default: m.AuthModal })));

/**
 * 📖 ตัวบทนิยายรายบท — island เดียวของหน้า `/novel/<เลขบท>`
 * ---------------------------------------------------------------------------
 * นิยายอ่านได้เฉพาะสมาชิก (เจ้าของสั่ง 2026-10-27 "ต้องล็อกอิน") ตัวบทจึงไม่อยู่ใน HTML static
 * มีเซสชัน ➔ ดึงจาก `/api/novel/<เลขบท>` (ตรวจเซสชันจริงฝั่งเซิร์ฟเวอร์) · ไม่มี ➔ ย่อหน้าตัวอย่าง + ปุ่มเข้าสู่ระบบ
 * หน้าต่างเข้าสู่ระบบโหลดตอนกดเท่านั้น (ไม่หนักบันเดิลหน้า) · ล็อกอินด้วยอีเมลเสร็จกลับมาหน้าเดิม (`afterEmailAuthUrl`)
 */
export function NovelReader({ number, teaser }: { number: number; teaser: string }) {
  const [state, setState] = useState<NovelChapterLoad | { status: "loading" }>({ status: "loading" });
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    loadNovelChapter(number).then((result) => {
      if (alive) setState(result);
    });
    return () => {
      alive = false;
    };
  }, [number]);

  if (state.status === "ok") {
    return (
      <div className="v2-ar-body v2-nv-body">
        {state.paragraphs.map((p, i) => (
          <p key={i} className={p.kind === "beat" ? "v2-nv-beat" : undefined} dangerouslySetInnerHTML={{ __html: p.html }} />
        ))}
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="v2-nv-gate v2-nv-gate-wait" aria-busy="true">
        <p className="v2-nv-gate-s">กำลังเปิดบทนี้</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="v2-nv-gate" role="alert">
        <p className="v2-nv-gate-t">เปิดบทนี้ไม่สำเร็จ</p>
        <button type="button" className="ui2-btn ui2-btn-gold" onClick={() => window.location.reload()}>
          โหลดใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="v2-ar-body v2-nv-body v2-nv-teaser">
        <p>{teaser}</p>
      </div>
      <div className="v2-nv-gate">
        <p className="v2-nv-gate-t">เข้าสู่ระบบเพื่ออ่านต่อ</p>
        <p className="v2-nv-gate-s">นิยายเรื่องนี้อ่านฟรีทุกบทสำหรับสมาชิก เข้าสู่ระบบด้วย Google LINE หรืออีเมล</p>
        <button type="button" className="ui2-btn ui2-btn-gold" onClick={() => setAuthOpen(true)}>
          เข้าสู่ระบบ หรือสมัครสมาชิก
        </button>
      </div>
      {authOpen && (
        <React.Suspense fallback={null}>
          <AuthModal isOpen onClose={() => setAuthOpen(false)} initialMode="signin" />
        </React.Suspense>
      )}
    </>
  );
}
