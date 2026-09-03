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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[#FFFFFF] border border-[#E4D8C4] p-4 rounded-lg ">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาแม่หมอ, ความถนัด (เช่น ความรัก, การงาน)…"
            className="w-full bg-[#F0E8DB] border border-[#E4D8C4] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#2E211A] placeholder-[#6F5B4A]/60 focus:outline-none focus:border-[#8F5C1A] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6F5B4A] hover:text-[#2E211A] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Total Count Badge */}
        <div className="text-xs text-[#6F5B4A] text-right shrink-0">
          พบ <span className="text-[#8F5C1A] font-bold">{filtered.length}</span> ท่าน
        </div>
      </div>

      {/* Specialty Filter Pills */}
      {allSpecialties.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#6F5B4A] mr-1">หมวดความถนัด:</span>
          <button
            type="button"
            onClick={() => setSelectedSpecialty("all")}
            className={`px-3 py-1 rounded-full text-xs font-serif-th transition-all duration-200 cursor-pointer ${
              selectedSpecialty === "all"
                ? "bg-[#8F5C1A] text-[#FFFFFF] font-bold"
                : "bg-[#FFFFFF] text-[#6F5B4A] border border-[#E4D8C4] hover:border-[#8F5C1A]"
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
                  ? "bg-[#8F5C1A] text-[#FFFFFF] font-bold"
                  : "bg-[#FFFFFF] text-[#6F5B4A] border border-[#E4D8C4] hover:border-[#8F5C1A]"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      )}

      {/* Readers Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E4D8C4] rounded-lg p-12 text-center space-y-3 ">
          <p className="text-sm font-semibold text-[#2E211A]">ไม่พบแม่หมอที่ตรงกับเงื่อนไขการค้นหา</p>
          <p className="text-xs text-[#6F5B4A]">ลองล้างคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นหาแม่หมอท่านอื่น</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedSpecialty("all");
            }}
            className="mt-3 px-4 py-1.5 rounded-full border border-[#E4D8C4] text-xs text-[#8F5C1A] hover:bg-[#F0E8DB] transition-colors cursor-pointer font-bold"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((reader) => (
            <div
              key={reader.id}
              className="bg-[#FFFFFF] border border-[#E4D8C4] rounded-lg p-5 flex flex-col justify-between hover:border-[#8F5C1A] transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* Header: Avatar + Name */}
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 shrink-0 rounded-full border-2 border-[#E4D8C4] bg-[#F0E8DB] overflow-hidden flex items-center justify-center text-xl font-bold text-[#8F5C1A] shadow-inner">
                    {reader.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={reader.avatarUrl} alt={reader.displayName} className="h-full w-full object-cover" />
                    ) : (
                      reader.displayName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-serif-th font-bold text-[#2E211A] text-base group-hover:text-[#8F5C1A] transition-colors">
                        {reader.displayName}
                      </h3>
                    </div>
                    <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-semibold">
                      <span>✦</span> แม่หมอตัวจริง (ยืนยันแล้ว)
                    </div>
                  </div>
                </div>

                {/* Bio snippet */}
                <p className="text-xs text-[#6F5B4A] leading-relaxed line-clamp-3 font-serif-th">
                  {reader.bio || "พร้อมให้คำปรึกษาและชี้แนะแนวทางชีวิตอย่างลึกซึ้งผ่านไพ่ทาโรต์"}
                </p>

                {/* Specialties Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {reader.specialties.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[#F0E8DB] border border-[#E4D8C4] text-[11px] text-[#2E211A] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 border-t border-[#E4D8C4]/30 mt-4">
                <Link
                  href={`/readers/${reader.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] text-xs font-serif-th font-bold transition-all "
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
