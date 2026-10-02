"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { PublicReaderProfile } from "@/lib/marketplace/readers.repo";
import { CONSULTATION_MINUTES, CONSULTATION_PRICE_THB } from "@/lib/marketplace/offer";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

interface ReadersDirectoryProps {
  initialReaders: PublicReaderProfile[];
  /** แม่หมอที่เปิดรับคิวสดอยู่ตอนนี้ (อ่านจากเซิร์ฟเวอร์ตอนเปิดหน้า) */
  liveReaderIds: string[];
}

/** ช่องค้นหา + ตัวกรองโผล่เมื่อมีแม่หมอตั้งแต่ 4 คน — น้อยกว่านั้นเห็นครบในจอเดียวอยู่แล้ว */
const SHOW_FILTERS_FROM = 4;

export const ReadersDirectory: React.FC<ReadersDirectoryProps> = ({ initialReaders, liveReaderIds }) => {
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const live = useMemo(() => new Set(liveReaderIds), [liveReaderIds]);
  const showFilters = initialReaders.length >= SHOW_FILTERS_FROM;

  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    for (const r of initialReaders) {
      for (const s of r.specialties) {
        if (s.trim()) set.add(s.trim());
      }
    }
    return Array.from(set);
  }, [initialReaders]);

  // คนที่พร้อมคุยตอนนี้ขึ้นก่อน — ผู้ใช้ส่วนใหญ่อยากคุยเลย ไม่ใช่นัดล่วงหน้า
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialReaders
      .filter((r) => {
        if (selectedSpecialty !== "all" && !r.specialties.includes(selectedSpecialty)) return false;
        if (!q) return true;
        return (
          r.displayName.toLowerCase().includes(q) ||
          r.bio.toLowerCase().includes(q) ||
          r.specialties.some((s) => s.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => Number(live.has(b.id)) - Number(live.has(a.id)));
  }, [initialReaders, selectedSpecialty, search, live]);

  const liveCount = initialReaders.filter((r) => live.has(r.id)).length;

  // ── ยังไม่มีแม่หมอในระบบเลย ───────────────────────────────────────────────
  if (initialReaders.length === 0) {
    return (
      <section className="altar-card-porcelain !rounded-2xl p-8 sm:p-12 text-center space-y-3 font-serif-th">
        <h2 className="text-lg font-bold text-ink">ยังไม่มีแม่หมอเปิดให้คำปรึกษาตอนนี้</h2>
        <p className="text-sm text-muted">ระหว่างนี้ลองเปิดไพ่กับแม่หมอ AI ได้ฟรี แล้วกลับมาดูใหม่เร็ว ๆ นี้</p>
        <Link href="/" className="btn-gold-glass inline-flex items-center gap-2 mt-2 px-6 py-3 text-sm font-bold">
          ดูดวงกับแม่หมอ AI ฟรี <span aria-hidden="true">→</span>
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="readers-list-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="readers-list-heading" className="font-serif-th text-lg sm:text-xl font-bold text-ink">
          แม่หมอที่เปิดให้คำปรึกษา
        </h2>
        <p className="text-[13px] text-muted font-serif-th" aria-live="polite">
          {liveCount > 0 ? `พร้อมคุยตอนนี้ ${liveCount} ท่าน · ` : ""}ทั้งหมด {filtered.length} ท่าน
        </p>
      </div>

      {showFilters && (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              aria-label="ค้นหาแม่หมอตามชื่อหรือความถนัด"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อแม่หมอ หรือเรื่องที่อยากถาม เช่น ความรัก การงาน"
              className="glass-field w-full border border-line-interactive rounded-xl pl-4 pr-12 py-3 text-sm text-ink focus:outline-none focus:border-gold transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="ล้างคำค้นหา"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 grid place-items-center text-muted hover:text-ink cursor-pointer"
              >
                <span aria-hidden="true">✕</span>
              </button>
            )}
          </div>
          {allSpecialties.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="กรองตามความถนัด">
              {["all", ...allSpecialties].map((spec) => {
                const active = selectedSpecialty === spec;
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSelectedSpecialty(spec)}
                    aria-pressed={active}
                    className={`tap-overlay-y px-4 py-1.5 rounded-full text-[13px] font-serif-th transition cursor-pointer ${
                      active ? "btn-gold-glass font-bold" : "bg-surface text-ink border border-line hover:border-gold"
                    }`}
                  >
                    {spec === "all" ? "ทั้งหมด" : spec}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="altar-card-porcelain !rounded-2xl p-10 text-center space-y-3 font-serif-th">
          <p className="text-sm font-semibold text-ink">ไม่พบแม่หมอที่ตรงกับที่ค้นหา</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedSpecialty("all");
            }}
            className="btn-gold-glass tap-overlay-y px-5 py-2.5 text-sm cursor-pointer font-bold"
          >
            ดูแม่หมอทั้งหมด
          </button>
        </div>
      ) : (
        <ul
          className={
            filtered.length === 1 ? "grid max-w-md mx-auto w-full" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {filtered.map((reader) => {
            const isLive = live.has(reader.id);
            return (
              <li key={reader.id}>
                <article className="altar-card-porcelain !rounded-2xl h-full p-5 sm:p-6 flex flex-col gap-4 font-serif-th">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="glass-chip h-16 w-16 overflow-hidden grid place-items-center text-2xl font-bold text-gold-ink">
                        {reader.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={reader.avatarUrl} alt="" /* ภาพประกอบล้วน — <h3> ข้าง ๆ พิมพ์ชื่อแม่หมออยู่แล้ว (INC-0125) */ className="h-full w-full object-cover" />
                        ) : (
                          reader.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      {isLive && (
                        <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-ok ring-2 ring-surface" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-bold text-ink text-lg leading-snug break-words">
                        <ThaiPhrases>{reader.displayName}</ThaiPhrases>
                      </h3>
                      <p className={`flex items-center gap-1.5 text-[13px] font-semibold ${isLive ? "text-ok" : "text-muted"}`}>
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${isLive ? "bg-ok animate-pulse" : "bg-line"}`} />
                        {isLive ? "พร้อมคุยตอนนี้" : "รับจองคิวล่วงหน้า"}
                      </p>
                      <p className="text-[13px] text-muted">
                        <span aria-hidden="true" className="text-ok">✓</span> ยืนยันตัวตนแล้ว
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-ink leading-relaxed line-clamp-3">
                    <ThaiPhrases>{reader.bio || "พร้อมให้คำปรึกษาและชี้แนะแนวทางชีวิตผ่านไพ่ทาโรต์"}</ThaiPhrases>
                  </p>

                  {reader.specialties.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="ความถนัด">
                      {reader.specialties.map((s) => (
                        <li key={s} className="glass-chip px-3 py-1 text-[13px] text-ink">
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto pt-4 border-t border-line flex items-center justify-between gap-3">
                    <p className="text-[13px] text-muted leading-tight">
                      <span className="block text-base font-bold text-ink">{CONSULTATION_PRICE_THB} บาท</span>
                      ต่อ {CONSULTATION_MINUTES} นาที
                    </p>
                    <Link
                      href={`/readers/${reader.id}`}
                      aria-label={`${isLive ? "คุยกับ" : "ดูโปรไฟล์และจองคิว"} ${reader.displayName}`}
                      className="btn-gold-glass inline-flex items-center justify-center gap-1.5 px-5 py-3 text-sm font-bold whitespace-nowrap"
                    >
                      {isLive ? "คุยกับแม่หมอ" : "ดูโปรไฟล์"}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
