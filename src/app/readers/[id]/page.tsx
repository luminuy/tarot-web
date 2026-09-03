import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicReaderById } from "@/lib/marketplace/readers.repo";
import { getReaderLiveAvailability } from "@/lib/marketplace/queue.repo";
import { ReaderDetailClient } from "@/components/marketplace/ReaderDetailClient";
import { SacredNavDropdown } from "@/components/ui/SacredNavDropdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reader = await getPublicReaderById(id);
  if (!reader) {
    return { title: "ไม่พบแม่หมอ | Tarot Marketplace" };
  }
  return {
    title: `${reader.displayName} | ปรึกษาแม่หมอตัวจริง`,
    description: reader.bio || `ปรึกษาดวงชะตากับ ${reader.displayName} ผ่านศาสตร์ไพ่ทาโรต์`,
  };
}

export default async function ReaderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reader = await getPublicReaderById(id);

  if (!reader) {
    notFound();
  }

  const isLiveOpen = await getReaderLiveAvailability(id);

  return (
    <main className="min-h-screen bg-[#F6F1E9] text-[#2E211A] p-4 sm:p-8 font-sans relative overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Top Breadcrumbs */}
        <div className="flex items-center justify-between border-b border-[#D6B48D]/40 pb-4">
          <Link
            href="/readers"
            className="inline-flex items-center gap-1.5 text-xs text-[#5A432F] hover:text-[#CD9F5B] transition-colors py-1.5 px-3.5 rounded-2xl bg-[#FFFFFF] border border-[#D6B48D] hover:border-[#CD9F5B] font-serif-th shadow-xs"
          >
            <span>←</span> หน้ารวมแม่หมอทั้งหมด
          </Link>
          <SacredNavDropdown />
        </div>

        {/* Reader Profile Container */}
        <div className="bg-[#FFFFFF] rounded-[1.618rem] p-6 sm:p-10 space-y-8 shadow-md border border-[#D6B48D]">
          {/* Header info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-full border-2 border-[#D6B48D] bg-[#FCF0E6] overflow-hidden flex items-center justify-center text-3xl font-bold text-[#CD9F5B] shadow-sm">
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

            <div className="space-y-3 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="font-serif-th text-2xl sm:text-3xl font-bold font-mystic-gold">
                  {reader.displayName}
                </h1>
                <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold w-fit mx-auto sm:mx-0">
                  <span>✦</span> แม่หมอตัวจริง (ยืนยันตัวตนแล้ว)
                </span>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {reader.specialties.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-[#FCF0E6] border border-[#D6B48D] text-xs text-[#5A432F] font-medium"
                  >
                    ✦ {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-3 border-t border-[#D6B48D]/30 pt-6">
            <h2 className="text-sm font-bold text-[#5A432F] font-serif-th flex items-center gap-2">
              <span className="text-[#CD9F5B]">✦</span> ประวัติและสไตล์การทำนาย
            </h2>
            <div className="bg-[#FDF7F0] rounded-2xl p-5 border border-[#D6B48D] text-xs sm:text-sm text-[#5A432F] leading-relaxed font-serif-th whitespace-pre-line shadow-xs">
              {reader.bio || "พร้อมให้คำปรึกษาและชี้แนะแนวทางชีวิตอย่างลึกซึ้งผ่านศาสตร์ไพ่ทาโรต์"}
            </div>
          </div>

          {/* Consultation Process Steps */}
          <div className="space-y-4 border-t border-[#D6B48D]/30 pt-6">
            <h2 className="text-sm font-bold text-[#5A432F] font-serif-th flex items-center gap-2">
              <span className="text-[#CD9F5B]">✨</span> ขั้นตอนการรับคำปรึกษา
            </h2>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-2xl bg-[#FDF7F0] border border-[#D6B48D] p-4 space-y-1.5 shadow-xs">
                <span className="text-[#CD9F5B] font-bold text-base">1. สับไพ่และตั้งจิต</span>
                <p className="text-[#8C735D] leading-relaxed">
                  เลือกผังและเปิดไพ่ด้วยตนเองผ่านระบบ หรือระบุหัวข้อคำถามที่ต้องการคำตอบ
                </p>
              </div>
              <div className="rounded-2xl bg-[#FDF7F0] border border-[#D6B48D] p-4 space-y-1.5 shadow-xs">
                <span className="text-[#CD9F5B] font-bold text-base">2. AI สรุปสาระสำคัญ</span>
                <p className="text-[#8C735D] leading-relaxed">
                  ระบบช่วยประมวลผลตำแหน่งไพ่และบริบทคำถาม เพื่อเตรียมข้อมูลส่งต่อให้แม่หมอ
                </p>
              </div>
              <div className="rounded-2xl bg-[#FDF7F0] border border-[#D6B48D] p-4 space-y-1.5 shadow-xs">
                <span className="text-[#CD9F5B] font-bold text-base">3. สนทนากับแม่หมอ</span>
                <p className="text-[#8C735D] leading-relaxed">
                  เชื่อมต่อไปยัง LINE ส่วนตัวของแม่หมอเพื่อสนทนาเจาะลึกและไขข้อข้องใจ
                </p>
              </div>
            </div>
          </div>

          {/* Booking / Consultation Action */}
          <div className="border-t border-[#D6B48D]/30 pt-6 space-y-3 text-center sm:text-left">
            <ReaderDetailClient reader={reader} isLiveOpen={isLiveOpen} />

            <p className="text-[11px] text-[#8C735D] text-center pt-2 font-serif-th">
              🔒 ข้อมูลคำถามจะถูกส่งต่อไปยังแม่หมอโดยตรง และจะถูกลบออกจากระบบภายใน 30 วันตามมาตรฐาน PDPA
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
