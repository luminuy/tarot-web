import Link from "next/link";
import { listPublicApprovedReaders, type PublicReaderProfile } from "@/lib/marketplace/readers.repo";
import { ReadersDirectory } from "@/components/readers/ReadersDirectory";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { OG_IMAGE_ALT, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ปรึกษาแม่หมอตัวจริง · Marketplace แม่หมอทาโรต์",
  description:
    "เลือกปรึกษาและดูดวงกับแม่หมอตัวจริงผู้เชี่ยวชาญศาสตร์ไพ่ทาโรต์ พร้อมระบบ AI ช่วยบรีฟคำถามและสรุปผังไพ่เบื้องต้น",
  alternates: { canonical: `${SITE_ORIGIN}/readers` },
  openGraph: {
    title: "ปรึกษาแม่หมอตัวจริง · SeerTarot",
    description: "เลือกปรึกษาและดูดวงกับแม่หมอตัวจริงผู้เชี่ยวชาญศาสตร์ไพ่ทาโรต์",
    url: `${SITE_ORIGIN}/readers`,
    siteName: "SeerTarot",
    type: "website",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
};

export default async function ReadersPage() {
  let readers: PublicReaderProfile[] = [];
  try {
    readers = await listPublicApprovedReaders();
  } catch (err) {
    console.error("[ReadersPage] Failed to fetch readers:", err);
  }

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "หน้าแรก",
        item: SITE_ORIGIN,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "ปรึกษาแม่หมอตัวจริง",
        item: `${SITE_ORIGIN}/readers`,
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#F6F1E9] text-[#2E211A] p-4 sm:p-8 font-sans relative overflow-x-clip">
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
        />

        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          {/* Top Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-serif-th text-[#635B4E] border-b border-[#E4D8C4]/40 pb-4 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-[#8F5C1A] transition-colors">
              หน้าแรก
            </Link>
            <span>/</span>
            <span className="text-[#2E211A] font-bold">ปรึกษาแม่หมอตัวจริง</span>
          </nav>

          {/* Hero Header */}
          <div className="text-center space-y-4 sm:space-y-5 py-6 sm:py-8">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#E4D8C4] bg-[#FFFFFF] text-xs text-[#8F5C1A] font-bold font-serif-th shadow-xs">
                <span>✦</span> ตลาดรวมแม่หมอตัวจริง (Tarot Marketplace) <span>✦</span>
              </span>
            </div>
            <h1 className="font-serif-th text-3xl sm:text-5xl font-bold font-mystic-gold tracking-wide leading-normal sm:leading-tight pt-1 [text-wrap:balance]">
              ปรึกษาแม่หมอตัวจริง
            </h1>
            <p className="text-xs sm:text-sm text-[#635B4E] max-w-xl mx-auto leading-relaxed font-serif-th [text-wrap:balance]">
              เลือกแม่หมอที่มีความถนัดตรงกับเรื่องที่คุณต้องการคำปรึกษา พร้อมระบบ AI ช่วยสังเคราะห์บรีฟคำถามก่อนเริ่มสนทนา
            </p>
          </div>

          {/* Client Interactive Directory */}
          <ReadersDirectory initialReaders={readers} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
