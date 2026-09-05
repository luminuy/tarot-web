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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[#FFFFFF] border border-[#D9C8AC] p-4 rounded-lg ">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาแม่หมอ, ความถนัด (เช่น ความรัก, การงาน)…"
            className="w-full bg-[#FFFFFF] border border-[#D5CEC2] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#29261F] placeholder-[#756F66]/60 focus:outline-none focus:border-[#A58A5C] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#635B4E] hover:text-[#29261F] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Total Count Badge */}
        <div className="text-xs text-[#635B4E] text-right shrink-0 font-mono">
          พบ <span className="text-[#29261F] font-bold">{filtered.length}</span> ท่าน
        </div>
      </div>

      {/* Specialty Filter Pills */}
      {allSpecialties.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#635B4E] mr-1 font-serif-th">หมวดความถนัด:</span>
          <button
            type="button"
            onClick={() => setSelectedSpecialty("all")}
            className={`px-3.5 py-1 rounded-full text-xs font-serif-th transition-all duration-200 cursor-pointer ${
              selectedSpecialty === "all"
                ? "bg-[#29261F] text-[#F3F0EA] font-bold shadow-xs"
                : "bg-[#EAE7E0] text-[#29261F] border border-[#D5CEC2] hover:border-[#A58A5C]"
            }`}
          >
            ทั้งหมด
          </button>
          {allSpecialties.map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3.5 py-1 rounded-full text-xs font-serif-th transition-all duration-200 cursor-pointer ${
                selectedSpecialty === spec
                  ? "bg-[#29261F] text-[#F3F0EA] font-bold shadow-xs"
                  : "bg-[#EAE7E0] text-[#29261F] border border-[#D5CEC2] hover:border-[#A58A5C]"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      )}

      {/* Readers Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#D5CEC2] rounded-xl p-12 text-center space-y-3 shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
          <p className="text-sm font-semibold text-[#29261F] font-serif-th">ไม่พบแม่หมอที่ตรงกับเงื่อนไขการค้นหา</p>
          <p className="text-xs text-[#635B4E] font-serif-th">ลองล้างคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นหาแม่หมอท่านอื่น</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedSpecialty("all");
            }}
            className="mt-3 px-5 py-2 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-xs text-[#F3F0EA] transition-colors cursor-pointer font-bold font-serif-th shadow-sm"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((reader) => (
            <div
              key={reader.id}
              className="bg-[#FFFFFF] border border-[#D5CEC2] rounded-xl p-5 flex flex-col justify-between hover:border-[#A58A5C] transition-all duration-300 group shadow-[0_10px_30px_rgba(42,38,31,0.06)]"
            >
              <div className="space-y-4">
                {/* Header: Avatar + Name */}
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 shrink-0 rounded-full border border-[#D5CEC2] bg-[#EAE7E0] overflow-hidden flex items-center justify-center text-xl font-bold text-[#29261F] shadow-inner">
                    {reader.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={reader.avatarUrl} alt={reader.displayName} className="h-full w-full object-cover" />
                    ) : (
                      reader.displayName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-serif-th font-bold text-[#29261F] text-base group-hover:text-[#A58A5C] transition-colors">
                        {reader.displayName}
                      </h3>
                    </div>
                    <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-[#EBF3ED] border border-[#D5CEC2] text-[13px] text-[#3A7044] font-semibold">
                      แม่หมอตัวจริง (ยืนยันแล้ว)
                    </div>
                  </div>
                </div>

                {/* Bio snippet */}
                <p className="text-xs text-[#635B4E] leading-relaxed line-clamp-3 font-serif-th">
                  {reader.bio || "พร้อมให้คำปรึกษาและชี้แนะแนวทางชีวิตอย่างลึกซึ้งผ่านไพ่ทาโรต์"}
                </p>

                {/* Specialties Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {reader.specialties.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] text-[13px] text-[#29261F] font-medium font-serif-th"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 border-t border-[#D5CEC2]/40 mt-4">
                <Link
                  href={`/readers/${reader.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] text-xs font-serif-th font-bold transition-all shadow-sm"
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
