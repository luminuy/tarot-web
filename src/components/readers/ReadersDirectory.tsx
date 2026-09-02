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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[#130d24]/92 border border-[#e5c07b]/20 p-4 rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาแม่หมอ, ความถนัด (เช่น ความรัก, การงาน)…"
            className="w-full bg-[#1c1433]/80 border border-[#e5c07b]/30 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#f5deaa] placeholder-[#9c93b8]/60 focus:outline-none focus:border-[#ffd700] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9c93b8] hover:text-[#f5deaa]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Total Count Badge */}
        <div className="text-xs text-[#9c93b8] text-right shrink-0">
          พบ <span className="text-[#ffd700] font-bold">{filtered.length}</span> ท่าน
        </div>
      </div>

      {/* Specialty Filter Pills */}
      {allSpecialties.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#9c93b8] mr-1">หมวดความถนัด:</span>
          <button
            type="button"
            onClick={() => setSelectedSpecialty("all")}
            className={`px-3 py-1 rounded-full text-xs font-serif-th transition-all duration-200 cursor-pointer ${
              selectedSpecialty === "all"
                ? "bg-[#e5c07b] text-[#130d24] font-bold shadow-[0_0_10px_rgba(229,192,123,0.3)]"
                : "bg-[#1c1433]/60 text-[#c3bdd8] border border-[#e5c07b]/20 hover:border-[#e5c07b]/50"
            }`}
          >
            ทั้งหมด
          </button>
          {allSpecialties.map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1 rounded-full text-xs font-serif-th transition-all duration-200 cursor-pointer ${
                selectedSpecialty === spec
                  ? "bg-[#e5c07b] text-[#130d24] font-bold shadow-[0_0_10px_rgba(229,192,123,0.3)]"
                  : "bg-[#1c1433]/60 text-[#c3bdd8] border border-[#e5c07b]/20 hover:border-[#e5c07b]/50"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      )}

      {/* Readers Grid */}
      {filtered.length === 0 ? (
        <div className="altar-panel rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-[#f5deaa]">ไม่พบแม่หมอที่ตรงกับเงื่อนไขการค้นหา</p>
          <p className="text-xs text-[#9c93b8]">ลองล้างคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นหาแม่หมอท่านอื่น</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedSpecialty("all");
            }}
            className="mt-3 px-4 py-1.5 rounded-full border border-[#e5c07b]/30 text-xs text-[#e5c07b] hover:bg-[#e5c07b]/10 transition-colors"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((reader) => (
            <div
              key={reader.id}
              className="altar-panel rounded-2xl p-5 flex flex-col justify-between hover:border-[#ffd700]/40 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(229,192,123,0.15)] group"
            >
              <div className="space-y-4">
                {/* Header: Avatar + Name */}
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 shrink-0 rounded-full border-2 border-[#ffd700]/40 bg-[#21163b] overflow-hidden flex items-center justify-center text-xl font-bold text-[#ffd700] shadow-inner">
                    {reader.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reader.avatarUrl}
                        alt={reader.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      reader.displayName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-serif-th font-bold text-[#f5deaa] text-base group-hover:text-[#ffd700] transition-colors">
                        {reader.displayName}
                      </h3>
                    </div>
                    <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[10px] text-emerald-300 font-semibold">
                      <span>✦</span> แม่หมอตัวจริง (ยืนยันแล้ว)
                    </div>
                  </div>
                </div>

                {/* Bio snippet */}
                <p className="text-xs text-[#c3bdd8] leading-relaxed line-clamp-3 font-serif-th">
                  {reader.bio || "พร้อมให้คำปรึกษาและชี้แนะแนวทางชีวิตอย่างลึกซึ้งผ่านไพ่ทาโรต์"}
                </p>

                {/* Specialties Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {reader.specialties.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#2d1f4d]/80 border border-[#e5c07b]/20 text-[11px] text-[#e5c07b] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 border-t border-white/5 mt-4">
                <Link
                  href={`/readers/${reader.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#e5c07b]/20 to-[#ffd700]/25 hover:from-[#e5c07b]/30 hover:to-[#ffd700]/40 border border-[#e5c07b]/40 text-xs font-serif-th font-bold text-[#f5deaa] hover:text-white transition-all shadow-sm group-hover:border-[#ffd700]/60"
                >
                  <span>ดูโปรไฟล์ & จองคิว</span>
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
