import Link from "next/link";
import { listPublicApprovedReaders, type PublicReaderProfile } from "@/lib/marketplace/readers.repo";
import { listLiveReaderIds } from "@/lib/marketplace/queue.repo";
import { CONSULTATION_PRICE_LABEL } from "@/lib/marketplace/offer";
import { ReadersDirectory } from "@/components/readers/ReadersDirectory";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { buildAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import type { Metadata } from "next";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

export const dynamic = "force-dynamic";

const readersOgImages = buildPageOgImage({
  title: "ปรึกษาแม่หมอตัวจริง",
  eyebrow: "สารบบแม่หมอไพ่ยิปซี",
  cardImage: "major-02.jpg",
  alt: "ปรึกษาแม่หมอตัวจริงและเปิดไพ่พยากรณ์สด 1909 Rider-Waite",
});

export const metadata: Metadata = {
  title: "หมอดูไพ่ยิปซี ปรึกษาแม่หมอตัวจริงและเปิดไพ่พยากรณ์สด",
  description:
    "รวมหมอดูไพ่ยิปซีและแม่หมอผู้เชี่ยวชาญศาสตร์ไพ่ทาโรต์ 1909 ปรึกษาดูดวงความรัก การงาน การเงิน พร้อมระบบดูดวงไพ่ยิปซีฟรีด้วยแม่หมอ AI ตรวจสอบได้จริง",
  alternates: buildAlternates("/readers"),
  openGraph: {
    title: "หมอดูไพ่ยิปซี ปรึกษาแม่หมอตัวจริง · SeerTarot",
    description: "รวมหมอดูไพ่ยิปซีและแม่หมอผู้เชี่ยวชาญศาสตร์ไพ่ทาโรต์ 1909 ปรึกษาดูดวงความรัก การงาน การเงิน",
    url: `${SITE_ORIGIN}/readers`,
    siteName: "SeerTarot",
    type: "website",
    images: readersOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: "หมอดูไพ่ยิปซี ปรึกษาแม่หมอตัวจริง · SeerTarot",
    description: "รวมหมอดูไพ่ยิปซีและแม่หมอผู้เชี่ยวชาญศาสตร์ไพ่ทาโรต์ 1909 ปรึกษาดูดวงความรัก การงาน การเงิน",
    images: [readersOgImages[0].url],
  },
};

export default async function ReadersPage() {
  let readers: PublicReaderProfile[] = [];
  let liveReaderIds: string[] = [];
  try {
    const [list, live] = await Promise.all([listPublicApprovedReaders(), listLiveReaderIds()]);
    readers = list;
    liveReaderIds = [...live];
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
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#F6F1E9] text-ink-deep p-4 sm:p-8 font-sans relative overflow-x-clip">
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbsJsonLd) }}
        />

        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 relative z-10">
          {/* Top Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-serif-th text-muted border-b border-[#E4D8C4]/40 pb-4 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-gold-ink transition-colors">
              หน้าแรก
            </Link>
            <span>/</span>
            <span className="text-ink-deep font-bold">ปรึกษาแม่หมอตัวจริง</span>
          </nav>

          {/* Hero — บอกให้จบในจอแรกว่าได้อะไร · คุยยังไง · ราคาเท่าไหร่ */}
          <header className="text-center space-y-4 pt-2 sm:pt-6">
            <p className="text-xs sm:text-sm font-bold text-gold-ink font-serif-th">แม่หมอตัวจริง · คุยตัวต่อตัว</p>
            <h1 className="font-serif-th text-3xl sm:text-5xl font-bold font-mystic-gold tracking-wide leading-normal sm:leading-tight [text-wrap:balance]">
              ปรึกษาแม่หมอตัวจริง
            </h1>
            <p className="text-sm sm:text-base text-ink max-w-2xl mx-auto leading-relaxed font-serif-th [text-wrap:balance]">
              <ThaiPhrases>
                คุยกับแม่หมอผ่านวิดีโอคอลในเว็บนี้ได้เลย ไม่ต้องแอด LINE ไม่ต้องให้เบอร์โทร
                และ AI จะสรุปคำถามให้แม่หมอเข้าใจเรื่องของคุณ ก่อนเริ่มคุย
              </ThaiPhrases>
            </p>
            <ul className="flex flex-wrap justify-center gap-2 pt-1 text-[13px] font-serif-th text-ink">
              {["วิดีโอคอลในเว็บ", "ไม่เปิดเผยเบอร์และ IP", "ไม่บันทึกภาพและเสียง", CONSULTATION_PRICE_LABEL].map((label) => (
                <li key={label} className="glass-chip inline-flex items-center gap-1.5 px-3 py-1.5">
                  <span aria-hidden="true" className="text-ok font-bold">✓</span>
                  {label}
                </li>
              ))}
            </ul>
          </header>

          {/* Client Interactive Directory */}
          <ReadersDirectory initialReaders={readers} liveReaderIds={liveReaderIds} />

          {/* ขั้นตอนใช้งาน — วางหลังรายชื่อ คนที่รู้อยู่แล้วไม่ต้องเลื่อนผ่าน */}
          <section aria-labelledby="readers-how-it-works" className="space-y-4 pt-4">
            <h2 id="readers-how-it-works" className="font-serif-th text-lg sm:text-xl font-bold text-ink text-center">
              ใช้งานง่ายใน 3 ขั้น
            </h2>
            <ol className="grid gap-3 sm:grid-cols-3">
              {[
                { title: "เลือกแม่หมอ", body: "เลือกคนที่ถนัดเรื่องของคุณ แล้วพิมพ์สิ่งที่อยากถามสั้น ๆ" },
                { title: "รอคิว", body: "AI สรุปคำถามให้แม่หมออ่านก่อน คุณเปิดหน้าคิวทิ้งไว้ได้เลย" },
                { title: "คุยผ่านวิดีโอคอล", body: "ถึงคิวแล้วกดเข้าห้อง คุยตัวต่อตัวกับแม่หมอในเว็บนี้" },
              ].map((step, i) => (
                <li key={step.title} className="altar-card-porcelain !rounded-2xl p-5 flex gap-4 items-start">
                  <span
                    aria-hidden="true"
                    className="h-9 w-9 shrink-0 rounded-full bg-gold-ink text-surface grid place-items-center font-bold font-serif-th"
                  >
                    {i + 1}
                  </span>
                  <div className="space-y-1 font-serif-th">
                    <h3 className="font-bold text-ink">{step.title}</h3>
                    <p className="text-[13px] text-muted leading-relaxed"><ThaiPhrases>{step.body}</ThaiPhrases></p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
