import Link from "next/link";
import { listPublicApprovedReaders, type PublicReaderProfile } from "@/lib/marketplace/readers.repo";
import { listLiveReaderIds } from "@/lib/marketplace/queue.repo";
import { CONSULTATION_MINUTES, CONSULTATION_PRICE_THB } from "@/lib/marketplace/offer";
import { ReadersDirectory } from "@/components/readers/ReadersDirectory";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { buildAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import type { Metadata } from "next";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { ConsultHeroStage } from "@/components/marketplace/ConsultStage";
import { ChevronIcon } from "@/components/marketplace/ConsultIcons";
import { ReadersValueRail } from "@/components/readers/ReadersValueRail";

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

  const faqs = [
    {
      q: "ต้องลงแอปหรือสมัครอะไรไหม",
      a: "ไม่ต้อง ใช้เบราว์เซอร์ Chrome หรือ Safari บนมือถือหรือคอมได้เลย ถึงคิวแล้วกดเข้าห้องวิดีโอคอลจากหน้าคิวของคุณ",
    },
    {
      q: "แม่หมอเห็นข้อมูลอะไรของฉันบ้าง",
      a: "ชื่อเล่น เรื่องที่คุณถาม สรุปจาก AI และภาพกับเสียงระหว่างคุยเท่านั้น แม่หมอไม่เห็นเบอร์โทร อีเมล หรือหมายเลข IP ของคุณ",
    },
    {
      q: "มีการบันทึกวิดีโอไหม",
      a: "ไม่มี ภาพและเสียงส่งตรงถึงแม่หมอโดยไม่ผ่านการบันทึก ข้อมูลการเชื่อมต่อถูกลบทันทีที่วางสาย",
    },
    {
      q: "ถ้าภาพหรือเสียงมีปัญหาทำอย่างไร",
      a: "กดปุ่ม \"ต่อสายใหม่\" ในห้อง หรือเลือกคุยกับแม่หมอทาง LINE แทนได้จากหน้าคิวเดียวกัน",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="min-h-screen text-ink-deep px-4 pb-16 sm:px-8 font-serif-th relative overflow-x-clip">
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbsJsonLd) }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Top Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 pt-4 text-[13px] text-muted overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-gold-ink transition-colors">
              หน้าแรก
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink-deep font-semibold">ปรึกษาแม่หมอตัวจริง</span>
          </nav>

          {/* ── Hero: ซ้ายคือคำสัญญา · ขวาคือภาพว่าจะได้อะไร ─────────────────────── */}
          <section className="grid items-center gap-10 lg:gap-14 lg:grid-cols-[1.05fr_0.95fr] pt-8 sm:pt-12 pb-14 sm:pb-20">
            <div className="space-y-6 text-center lg:text-left">
              <p className="inline-flex items-center gap-2 text-[13px] font-bold tracking-wide text-gold-ink">
                <span aria-hidden="true">✦</span> แม่หมอตัวจริง · คุยตัวต่อตัว
              </p>
              <h1 className="text-[2.5rem] leading-[1.15] sm:text-6xl sm:leading-[1.1] font-bold text-ink-deep [text-wrap:balance]">
                <ThaiPhrases>ปรึกษาแม่หมอ ตัวต่อตัว</ThaiPhrases>
                <span className="block font-mystic-gold mt-1">ผ่านวิดีโอคอล</span>
              </h1>
              <p className="text-base sm:text-lg text-ink leading-relaxed max-w-xl mx-auto lg:mx-0">
                <ThaiPhrases>
                  เลือกแม่หมอที่ถนัดเรื่องของคุณ พิมพ์สิ่งที่อยากถาม แล้วคุยกันสด ๆ ในเว็บนี้ ไม่ต้องลงแอป ไม่ต้องแอด LINE
                </ThaiPhrases>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a href="#readers" className="btn-gold-glass inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold">
                  เลือกแม่หมอ <span aria-hidden="true">→</span>
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-line bg-surface text-base font-semibold text-ink hover:border-gold transition"
                >
                  ใช้งานอย่างไร
                </a>
              </div>
              <p className="text-[13px] text-muted">
                {CONSULTATION_PRICE_THB} บาท · {CONSULTATION_MINUTES} นาที · ไม่บันทึกภาพและเสียง
              </p>
            </div>
            <div className="max-w-md w-full mx-auto lg:max-w-none">
              <ConsultHeroStage />
            </div>
          </section>

          {/* ── รายชื่อแม่หมอ ─────────────────────────────────────────────────── */}
          <div id="readers" className="scroll-mt-24">
            <ReadersDirectory initialReaders={readers} liveReaderIds={liveReaderIds} />
          </div>

          {/* ── เหตุผลที่ไว้ใจได้ — แถวปัดแบบหน้าแรก ───────────────────────────── */}
          <ReadersValueRail />

          {/* ── ขั้นตอน ──────────────────────────────────────────────────────── */}
          <section id="how-it-works" aria-labelledby="readers-how-it-works" className="pt-20 sm:pt-24 space-y-8 scroll-mt-24">
            <div className="text-center space-y-2">
              <p className="text-[13px] font-bold text-gold-ink">ใช้งานอย่างไร</p>
              <h2 id="readers-how-it-works" className="text-2xl sm:text-3xl font-bold text-ink-deep">
                <ThaiPhrases>สามขั้น จากคำถาม ถึงคำตอบ</ThaiPhrases>
              </h2>
            </div>
            <ol className="relative grid gap-6 sm:grid-cols-3">
              <span aria-hidden="true" className="hidden sm:block absolute top-6 left-[16.6%] right-[16.6%] h-px bg-line" />
              {[
                { title: "เลือกแม่หมอ", body: "ดูความถนัด แล้วพิมพ์สิ่งที่อยากถามสั้น ๆ" },
                { title: "รอคิวสบาย ๆ", body: "AI สรุปคำถามให้แม่หมออ่านก่อน คุณเปิดหน้าคิวทิ้งไว้ได้เลย" },
                { title: "คุยผ่านวิดีโอคอล", body: "ถึงคิวแล้วกดเข้าห้อง คุยตัวต่อตัวกับแม่หมอในเว็บนี้" },
              ].map((step, i) => (
                <li key={step.title} className="relative text-center space-y-3 px-4">
                  <span className="relative mx-auto h-12 w-12 rounded-full bg-ink-deep text-surface grid place-items-center text-lg font-bold">
                    {i + 1}
                  </span>
                  <h3 className="font-bold text-ink-deep text-lg">{step.title}</h3>
                  <p className="text-sm text-muted leading-relaxed max-w-xs mx-auto">
                    <ThaiPhrases>{step.body}</ThaiPhrases>
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* ── คำถามที่พบบ่อย ───────────────────────────────────────────────── */}
          <section aria-labelledby="readers-faq" className="pt-20 sm:pt-24 max-w-3xl mx-auto space-y-6">
            <h2 id="readers-faq" className="text-2xl sm:text-3xl font-bold text-ink-deep text-center">
              คำถามที่พบบ่อย
            </h2>
            <div className="divide-y divide-line rounded-3xl border border-line bg-surface">
              {faqs.map((f) => (
                <details key={f.q} className="group px-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold text-ink-deep [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronIcon className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-5 -mt-1 text-sm text-ink leading-relaxed">
                    <ThaiPhrases>{f.a}</ThaiPhrases>
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
