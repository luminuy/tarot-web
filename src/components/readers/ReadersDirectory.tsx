"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { PublicReaderProfile } from "@/lib/marketplace/readers.repo";

interface ReadersDirectoryProps {
  initialReaders: PublicReaderProfile[];
}

export const ReadersDirectory: React.FC<ReadersDirectoryProps> = ({ initialReaders }) => {
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");

  // Extract all unique specialties
  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    for (const r of initialReaders) {
      for (const s of r.specialties) {
        if (s.trim()) set.add(s.trim());
      }
    }
    return Array.from(set);
  }, [initialReaders]);

  const filtered = useMemo(() => {
    return initialReaders.filter((r) => {
      if (selectedSpecialty !== "all" && !r.specialties.includes(selectedSpecialty)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.displayName.toLowerCase().includes(q) ||
          r.bio.toLowerCase().includes(q) ||
          r.specialties.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [initialReaders, selectedSpecialty, search]);

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="altar-card-porcelain !rounded-lg flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            aria-label="ค้นหาแม่หมอตามชื่อหรือความถนัด"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาแม่หมอ, ความถนัด (เช่น ความรัก, การงาน)…"
            className="glass-field w-full border border-line-interactive rounded-xl px-4 py-2.5 text-xs sm:text-sm text-ink placeholder-muted/60 focus:outline-none focus:border-gold transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="ล้างคำค้นหา"
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-6 min-h-6 grid place-items-center text-xs text-muted hover:text-ink cursor-pointer"
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>

        {/* Total Count Badge */}
        <div className="text-xs text-muted text-right shrink-0 font-mono">
          พบ <span className="text-ink font-bold">{filtered.length}</span> ท่าน
        </div>
      </div>

      {/* Specialty Filter Pills */}
      {allSpecialties.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted mr-1 font-serif-th">หมวดความถนัด:</span>
          <button
            type="button"
            onClick={() => setSelectedSpecialty("all")}
            aria-pressed={selectedSpecialty === "all"}
            className={`tap-overlay-y px-3.5 py-1 rounded-full text-xs font-serif-th transition duration-200 cursor-pointer ${
              selectedSpecialty === "all"
                ? "btn-gold-glass font-bold"
                : "bg-inset text-ink border border-line hover:border-gold"
            }`}
          >
            ทั้งหมด
          </button>
          {allSpecialties.map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => setSelectedSpecialty(spec)}
              aria-pressed={selectedSpecialty === spec}
              className={`tap-overlay-y px-3.5 py-1 rounded-full text-xs font-serif-th transition duration-200 cursor-pointer ${
                selectedSpecialty === spec
                  ? "btn-gold-glass font-bold"
                  : "bg-inset text-ink border border-line hover:border-gold"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      )}

      {/* Readers Grid */}
      {filtered.length === 0 ? (
        <div className="altar-card-porcelain !rounded-xl p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-ink font-serif-th">ไม่พบแม่หมอที่ตรงกับเงื่อนไขการค้นหา</p>
          <p className="text-xs text-muted font-serif-th">ลองล้างคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นหาแม่หมอท่านอื่น</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedSpecialty("all");
            }}
            className="btn-gold-glass tap-overlay-y mt-3 px-5 py-2 text-xs cursor-pointer font-bold font-serif-th"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((reader) => (
            <div
              key={reader.id}
              className="altar-card-porcelain !rounded-xl p-5 flex flex-col justify-between transition duration-300 group"
            >
              <div className="space-y-4">
                {/* Header: Avatar + Name */}
                <div className="flex items-center gap-3.5">
                  <div className="glass-chip h-14 w-14 shrink-0 overflow-hidden flex items-center justify-center text-xl font-bold text-ink">
                    {reader.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={reader.avatarUrl} alt="" /* ภาพประกอบล้วน — <h3> ข้าง ๆ พิมพ์ชื่อแม่หมออยู่แล้ว (INC-0125) */ className="h-full w-full object-cover" />
                    ) : (
                      reader.displayName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-serif-th font-bold text-ink text-base group-hover:text-gold-ink transition-colors">
                        {reader.displayName}
                      </h3>
                    </div>
                    <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-[#EBF3ED] border border-line text-[13px] text-ok font-semibold">
                      แม่หมอตัวจริง (ยืนยันแล้ว)
                    </div>
                  </div>
                </div>

                {/* Bio snippet */}
                <p className="text-xs text-muted leading-relaxed line-clamp-3 font-serif-th">
                  {reader.bio || "พร้อมให้คำปรึกษาและชี้แนะแนวทางชีวิตอย่างลึกซึ้งผ่านไพ่ทาโรต์"}
                </p>

                {/* Specialties Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {reader.specialties.map((s, idx) => (
                    <span
                      key={idx}
                      className="glass-chip px-2.5 py-0.5 text-[13px] text-ink font-medium font-serif-th"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 border-t border-line/40 mt-4">
                <Link
                  href={`/readers/${reader.id}`}
                  className="btn-gold-glass w-full flex items-center justify-center gap-2 py-2.5 text-xs font-serif-th font-bold"
                >
                  <span>ดูโปรไฟล์ &amp; จองคิว</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
