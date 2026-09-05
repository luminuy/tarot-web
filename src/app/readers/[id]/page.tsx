import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicReaderById } from "@/lib/marketplace/readers.repo";
import { getReaderLiveAvailability } from "@/lib/marketplace/queue.repo";
import { ReaderDetailClient } from "@/components/marketplace/ReaderDetailClient";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SITE_ORIGIN } from "@/lib/config/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const reader = await getPublicReaderById(id);
  if (!reader) {
    return { title: "ไม่พบแม่หมอ", robots: { index: false, follow: true } };
  }
  return {
    title: `${reader.displayName} · ปรึกษาแม่หมอตัวจริง`,
    description: reader.bio || `ปรึกษาดวงชะตากับ ${reader.displayName} ผ่านศาสตร์ไพ่ทาโรต์`,
    alternates: { canonical: `${SITE_ORIGIN}/readers/${reader.id}` },
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "หน้าแรก", item: SITE_ORIGIN },
      { "@type": "ListItem", position: 2, name: "ปรึกษาแม่หมอตัวจริง", item: `${SITE_ORIGIN}/readers` },
      { "@type": "ListItem", position: 3, name: reader.displayName, item: `${SITE_ORIGIN}/readers/${reader.id}` },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#F6F1E9] text-[#2E211A] p-4 sm:p-8 font-sans relative overflow-x-clip">
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          {/* Top Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-serif-th text-[#635B4E] border-b border-[#E4D8C4]/40 pb-4 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-[#8F5C1A] transition-colors">
              หน้าแรก
            </Link>
            <span>/</span>
            <Link href="/readers" className="hover:text-[#8F5C1A] transition-colors">
              ปรึกษาแม่หมอตัวจริง
            </Link>
            <span>/</span>
            <span className="text-[#2E211A] font-bold truncate">{reader.displayName}</span>
          </nav>

        {/* Reader Profile Container */}
        <div className="bg-[#FFFFFF] rounded-lg p-6 sm:p-10 space-y-8 border border-[#E4D8C4]">
          {/* Header info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-full border-2 border-[#E4D8C4] bg-[#F0E8DB] overflow-hidden flex items-center justify-center text-3xl font-bold text-[#8F5C1A]">
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
                    className="px-3 py-1 rounded-full bg-[#F0E8DB] border border-[#E4D8C4] text-xs text-[#2E211A] font-medium"
                  >
                    ✦ {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-3 border-t border-[#E4D8C4]/30 pt-6">
            <h2 className="text-sm font-bold text-[#2E211A] font-serif-th flex items-center gap-2">
              <span className="text-[#8F5C1A]">✦</span> ประวัติและสไตล์การทำนาย
            </h2>
            <div className="bg-[#FFFFFF] rounded-lg p-5 border border-[#E4D8C4] text-xs sm:text-sm text-[#2E211A] leading-relaxed font-serif-th whitespace-pre-line">
              {reader.bio || "พร้อมให้คำปรึกษาและชี้แนะแนวทางชีวิตอย่างลึกซึ้งผ่านศาสตร์ไพ่ทาโรต์"}
            </div>
          </div>

          {/* Consultation Process Steps */}
          <div className="space-y-4 border-t border-[#E4D8C4]/30 pt-6">
            <h2 className="text-sm font-bold text-[#2E211A] font-serif-th flex items-center gap-2">
              <span className="text-[#8F5C1A]">✨</span> ขั้นตอนการรับคำปรึกษา
            </h2>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-lg bg-[#FFFFFF] border border-[#E4D8C4] p-4 space-y-1.5">
                <span className="text-[#8F5C1A] font-bold text-base">1. สับไพ่และตั้งจิต</span>
                <p className="text-[#635B4E] leading-relaxed">
                  เลือกผังและเปิดไพ่ด้วยตนเองผ่านระบบ หรือระบุหัวข้อคำถามที่ต้องการคำตอบ
                </p>
              </div>
              <div className="rounded-lg bg-[#FFFFFF] border border-[#E4D8C4] p-4 space-y-1.5">
                <span className="text-[#8F5C1A] font-bold text-base">2. AI สรุปสาระสำคัญ</span>
                <p className="text-[#635B4E] leading-relaxed">
                  ระบบช่วยประมวลผลตำแหน่งไพ่และบริบทคำถาม เพื่อเตรียมข้อมูลส่งต่อให้แม่หมอ
                </p>
              </div>
              <div className="rounded-lg bg-[#FFFFFF] border border-[#E4D8C4] p-4 space-y-1.5">
                <span className="text-[#8F5C1A] font-bold text-base">3. สนทนากับแม่หมอ</span>
                <p className="text-[#635B4E] leading-relaxed">
                  เชื่อมต่อไปยัง LINE ส่วนตัวของแม่หมอเพื่อสนทนาเจาะลึกและไขข้อข้องใจ
                </p>
              </div>
            </div>
          </div>

          {/* Booking / Consultation Action */}
          <div className="border-t border-[#E4D8C4]/30 pt-6 space-y-3 text-center sm:text-left">
            <ReaderDetailClient reader={reader} isLiveOpen={isLiveOpen} />

            <p className="text-[13px] text-[#635B4E] text-center pt-2 font-serif-th">
              🔒 ข้อมูลคำถามจะถูกส่งต่อไปยังแม่หมอโดยตรง และจะถูกลบออกจากระบบภายใน 30 วันตามมาตรฐาน PDPA
            </p>
          </div>
        </div>
      </div>
    </main>
    <SiteFooter />
  </>
  );
}
