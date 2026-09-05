import type { Metadata } from "next";
import Link from "next/link";
import { AllCardsTable } from "@/components/encyclopedia/AllCardsTable";
import { OG_IMAGE_ALT, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "ความหมายไพ่ยิปซี 78 ใบ ทั้งหมด สรุปครบทุกใบ ตารางเดียวจบ",
  description:
    "ตารางสรุปความหมายไพ่ยิปซี ไพ่ทาโรต์ ครบทั้ง 78 ใบ ทั้งชุดใหญ่ 22 ใบ และชุดเล็ก 56 ใบ 4 ดอก พร้อมชื่อไทย-อังกฤษ ธาตุ และคำสำคัญหัวตั้ง-กลับหัว ดูทีเดียวจบ 1909 Rider-Waite",
  alternates: {
    canonical: `${SITE_ORIGIN}/cards/all`,
  },
  openGraph: {
    title: "ความหมายไพ่ยิปซี 78 ใบ ทั้งหมด สรุปครบทุกใบ ตารางเดียวจบ",
    description:
      "ตารางสรุปความหมายไพ่ยิปซี ไพ่ทาโรต์ ครบทั้ง 78 ใบ ทั้งชุดใหญ่ 22 ใบ และชุดเล็ก 56 ใบ 4 ดอก พร้อมชื่อไทย-อังกฤษ ธาตุ และคำสำคัญหัวตั้ง-กลับหัว ดูทีเดียวจบ 1909 Rider-Waite",
    url: `${SITE_ORIGIN}/cards/all`,
    siteName: "SeerTarot",
    type: "website",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
};

export default function AllCardsSummaryPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ตารางสรุปความหมายไพ่ยิปซี 78 ใบ ทั้งหมด ตารางเดียวจบ",
    description:
      "คลังข้อมูลความหมายไพ่ทาโรต์ครบทั้ง 78 ใบ ทั้งชุดใหญ่และชุดเล็ก สรุปคำสำคัญหัวตั้งและหัวกลับพร้อมธาตุประจำไพ่",
    url: `${SITE_ORIGIN}/cards/all`,
    inLanguage: "th",
  };

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
        name: "คัมภีร์ไพ่ 78 ใบ",
        item: `${SITE_ORIGIN}/cards`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "ตารางสรุป 78 ใบ",
        item: `${SITE_ORIGIN}/cards/all`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans relative overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="text-xs font-serif-th text-[#635B4E]">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li>
              <Link href="/" className="hover:text-[#8F5C1A] transition-colors">
                หน้าแรก
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#A58A5C]">/</li>
            <li>
              <Link href="/cards" className="hover:text-[#8F5C1A] transition-colors">
                คัมภีร์ไพ่ 78 ใบ
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#A58A5C]">/</li>
            <li aria-current="page" className="font-bold text-[#29261F]">
              ตารางสรุป 78 ใบ
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <header className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-8 shadow-xs space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#A58A5C]/40 bg-[#FAF7F2] text-[#8F5C1A] text-xs font-serif-th font-bold">
            <span>ตารางสารานุกรมรวม</span>
            <span className="w-1 h-1 rounded-full bg-[#A58A5C]" />
            <span>ครบ 78 ใบ จบในหน้าเดียว</span>
          </div>

          <h1 className="font-serif-th text-2xl sm:text-3xl font-bold text-[#29261F]">
            ความหมายไพ่ยิปซี 78 ใบ ทั้งหมด สรุปครบทุกใบ ตารางเดียวจบ
          </h1>

          <p className="font-serif-th text-xs sm:text-sm text-[#635B4E] leading-relaxed max-w-3xl">
            ตารางสรุปความหมายไพ่ทาโรต์ 1909 Rider-Waite-Smith ครบทั้ง 78 ใบ ประกอบด้วยไพ่ชุดใหญ่ 22 ใบ (Major Arcana)
            และไพ่ชุดเล็ก 56 ใบ (Minor Arcana: ไม้เท้า, ถ้วย, ดาบ, เหรียญ) พร้อมคำสำคัญหัวตั้ง คำสำคัญกลับหัว และธาตุประจำไพ่
            สามารถใช้ค้นหาได้ทันที หรือกดเข้าไปอ่านบทความเจาะลึก 5 มิติของแต่ละใบ
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-xs font-serif-th">
            <Link href="/cards/major" className="px-3 py-1 rounded-lg border border-[#D5CEC2] bg-[#FAF7F2] hover:bg-[#FFFFFF] text-[#29261F]">
              เจาะลึกชุดใหญ่ 22 ใบ
            </Link>
            <Link href="/cards/minor" className="px-3 py-1 rounded-lg border border-[#D5CEC2] bg-[#FAF7F2] hover:bg-[#FFFFFF] text-[#29261F]">
              เจาะลึกชุดเล็ก 56 ใบ
            </Link>
            <Link href="/cards/wands" className="px-3 py-1 rounded-lg border border-[#D5CEC2] bg-[#FAF7F2] hover:bg-[#FFFFFF] text-[#29261F]">
              ไม้เท้า (ธาตุไฟ)
            </Link>
            <Link href="/cards/cups" className="px-3 py-1 rounded-lg border border-[#D5CEC2] bg-[#FAF7F2] hover:bg-[#FFFFFF] text-[#29261F]">
              ถ้วย (ธาตุน้ำ)
            </Link>
            <Link href="/cards/swords" className="px-3 py-1 rounded-lg border border-[#D5CEC2] bg-[#FAF7F2] hover:bg-[#FFFFFF] text-[#29261F]">
              ดาบ (ธาตุลม)
            </Link>
            <Link href="/cards/pentacles" className="px-3 py-1 rounded-lg border border-[#D5CEC2] bg-[#FAF7F2] hover:bg-[#FFFFFF] text-[#29261F]">
              เหรียญ (ธาตุดิน)
            </Link>
          </div>
        </header>

        {/* Interactive Master Table */}
        <AllCardsTable />
      </div>
    </main>
  );
}
