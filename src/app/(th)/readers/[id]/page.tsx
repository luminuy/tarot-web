import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicReaderById } from "@/lib/marketplace/readers.repo";
import { getReaderLiveAvailability } from "@/lib/marketplace/queue.repo";
import { getSoonestSlots } from "@/lib/marketplace/booking.repo";
import { getReaderReviewSummary, type ReviewSummary } from "@/lib/marketplace/reviews.repo";
import { FREE_CANCEL_HOURS, MAX_RESCHEDULES, PAID_GRACE_MINUTES } from "@/lib/marketplace/booking-policy";
import { ReaderDetailClient } from "@/components/marketplace/ReaderDetailClient";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { buildAlternates, SITE_ORIGIN, noindexAlternates } from "@/lib/config/site";
import type { Metadata } from "next";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { buildPageOgImage } from "@/lib/media/og-image";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { BriefIcon, ClockIcon, VideoIcon } from "@/components/marketplace/ConsultIcons";
import { ConsultHero, ConsultWindow } from "@/components/marketplace/ConsultUi2";
import { CONSULTATION_MINUTES } from "@/lib/marketplace/offer";
import "@/styles/ui2-page.css";
import "@/styles/v3-consult.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const reader = await getPublicReaderById(id);
  if (!reader) {
    return { title: "ไม่พบแม่หมอ", robots: { index: false, follow: true }, alternates: noindexAlternates() };
  }
  const title = `${reader.displayName} · ปรึกษาแม่หมอตัวจริง`;
  const description = reader.bio || `ปรึกษาดวงชะตากับ ${reader.displayName} ผ่านศาสตร์ไพ่ทาโรต์`;
  const url = `${SITE_ORIGIN}/readers/${reader.id}`;
  /*
   * A7-04: การ์ดแชร์ของโปรไฟล์ต้องเป็นของแม่หมอคนนี้ (ชื่อ · คำแนะนำตัว · ลิงก์ของหน้าเอง)
   * ไม่ตั้ง = รับ openGraph ของ root layout ทั้งก้อน แชร์ลง LINE/Facebook แล้วขึ้นข้อความหน้าแรก
   * รูปใช้ท่อภาพแชร์กลาง (Cloudinary · ถอยไป og/default.png) แบบหน้า /readers
   */
  const images = buildPageOgImage({
    title: reader.displayName,
    eyebrow: "ปรึกษาแม่หมอตัวจริง",
    cardImage: "major-02.jpg",
    alt: `${reader.displayName} · ปรึกษาแม่หมอตัวจริงที่ SeerTarot`,
  });
  return {
    title,
    description,
    alternates: buildAlternates(`/readers/${reader.id}`),
    openGraph: { title: `${title} · SeerTarot`, description, url, siteName: "SeerTarot", type: "profile", images },
    twitter: { card: "summary_large_image", title: `${title} · SeerTarot`, description, images: [images[0].url] },
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

  const nowMs = Date.now();
  const emptyReviews: ReviewSummary = { count: 0, average: null, latest: [] };
  const [isLiveOpen, quickSlots, reviews] = await Promise.all([
    getReaderLiveAvailability(id),
    getSoonestSlots(id, nowMs, 3),
    getReaderReviewSummary(id).catch(() => emptyReviews),
  ]);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "หน้าแรก", item: SITE_ORIGIN },
      { "@type": "ListItem", position: 2, name: "ปรึกษาแม่หมอตัวจริง", item: `${SITE_ORIGIN}/readers` },
      { "@type": "ListItem", position: 3, name: reader.displayName, item: `${SITE_ORIGIN}/readers/${reader.id}` },
    ],
  };

  /**
   * 🔎 T-48: หน้าโปรไฟล์แม่หมอเคยปล่อยแค่ `BreadcrumbList`
   *
   * ⛔ **ห้ามเพิ่ม `AggregateRating` เด็ดขาด** จนกว่าจะมีระบบรีวิวจริงที่ผู้ใช้เห็นบนหน้านี้
   * structured data ที่ไม่ตรงกับเนื้อหาที่มองเห็นคือเหตุให้ Google ถอด rich result
   * และลงโทษทั้งโดเมน ไม่ใช่แค่หน้านี้หน้าเดียว
   */
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_ORIGIN}/readers/${reader.id}#person`,
    name: reader.displayName,
    url: `${SITE_ORIGIN}/readers/${reader.id}`,
    jobTitle: "นักพยากรณ์ไพ่ทาโรต์",
    ...(reader.bio ? { description: reader.bio } : {}),
    ...(reader.avatarUrl ? { image: reader.avatarUrl } : {}),
    ...(reader.specialties.length > 0 ? { knowsAbout: reader.specialties } : {}),
    worksFor: {
      "@type": "Organization",
      name: "SeerTarot",
      url: SITE_ORIGIN,
    },
  };

  const bio = reader.bio?.trim();
  /** คำโปรยหัวหน้า = บรรทัดแรกของคำแนะนำตัว (ฉบับเต็มอยู่ในส่วน "เกี่ยวกับ") */
  const bioLead = bio?.split("\n")[0]?.trim();

  return (
    <>
      <SiteHeader />
      {/*
        v3 UI 2.0 (เจ้าของ 2026-10-26 "ทำเลย" · ขึ้น preview ก่อน): ภาษาภาพเดียวกับหน้ารวม /readers
        หัวหน้าแถบครีม (ชื่อ · ความถนัด · คะแนน | บัตรแม่หมอ) ➔ หน้าต่างครีมบนท้องฟ้ากลางคืน
        ซ้าย = เกี่ยวกับ + วิธีคุย + ขั้นตอน + รีวิว + นโยบาย · ขวา = การ์ดจองติดจอ (มือถือขึ้นก่อนเนื้อหา)
      */}
      <div className="ui2-pg" data-ui2-page-dark="">
      {/* pb-28 บนมือถือ: เว้นที่ให้แถบจองติดล่างจอ (ReaderDetailClient) ไม่บังเนื้อหาท้ายหน้า */}
      <main id="main-content" tabIndex={-1} className="v3-cs pb-28 lg:pb-16 font-sans">
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd) }}
        />

        {/* เส้นทางหน้า — ซ่อนจากตาแบบ sr-only (globals.css) · โปรแกรมอ่านหน้าจอยังอ่านได้ */}
        <nav aria-label="เส้นทางนำทาง">
          <Link href="/">หน้าแรก</Link> / <Link href="/readers">ปรึกษาแม่หมอ</Link> / <span>{reader.displayName}</span>
        </nav>

        <ConsultHero
          kicker="แม่หมอตัวจริง"
          title={<ThaiPhrases>{reader.displayName}</ThaiPhrases>}
          lede={bioLead ? <ThaiPhrases>{bioLead}</ThaiPhrases> : undefined}
          aside={
            <div className="v3-cs-card">
              <div className="v3-cs-avatar">
                {reader.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={reader.avatarUrl}
                    /* ภาพประกอบล้วน — <h1> ข้าง ๆ พิมพ์ชื่อแม่หมออยู่แล้ว (INC-0125) */
                    alt=""
                  />
                ) : (
                  reader.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="v3-cs-card-name">ตัวต่อตัว {CONSULTATION_MINUTES} นาที</p>
                <p className="v3-cs-card-meta">วิดีโอคอลในเว็บ หรือคุยทาง LINE</p>
              </div>
            </div>
          }
        >
          <ul className="v3-cs-chips" aria-label="ความถนัด">
            <li className="is-ok">ยืนยันตัวตนแล้ว</li>
            {reader.specialties.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          {reviews.average !== null && (
            <a href="#reader-reviews" className="v3-cs-rating">
              <span>คะแนน</span>
              <strong>{reviews.average.toFixed(1)}/5</strong>
              <span>จาก {reviews.count} รีวิวของผู้ที่ปรึกษาจริง</span>
            </a>
          )}
        </ConsultHero>

        <ConsultWindow label={`ปรึกษา ${reader.displayName}`}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            {/* การ์ดจอง — มือถือขึ้นก่อนเนื้อหา · จอใหญ่ติดขวาและติดจอตอนเลื่อน */}
            <div id="book" className="scroll-mt-24 lg:order-2 lg:sticky lg:top-[calc(var(--site-header-h)+20px)]">
              <ReaderDetailClient reader={reader} isLiveOpen={isLiveOpen} quickSlots={quickSlots} nowMs={nowMs} />
            </div>

            <div className="space-y-6 lg:order-1">
              <section aria-labelledby="reader-about" className="altar-card-porcelain !rounded-2xl space-y-3 p-5 sm:p-7">
                <h2 id="reader-about" className="text-lg font-bold text-ink-deep">
                  <ThaiPhrases>{`เกี่ยวกับ ${reader.displayName}`}</ThaiPhrases>
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink sm:text-[15px]">
                  {bio || "พร้อมให้คำปรึกษาและชี้แนะแนวทางชีวิตอย่างลึกซึ้งผ่านศาสตร์ไพ่ทาโรต์"}
                </p>
              </section>

              <section aria-labelledby="reader-format" className="altar-card-porcelain !rounded-2xl space-y-4 p-5 sm:p-7">
                <h2 id="reader-format" className="text-lg font-bold text-ink-deep">
                  <ThaiPhrases>คุยกันแบบไหน</ThaiPhrases>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-3">
                  {[
                    { Icon: VideoIcon, title: "วิดีโอคอลในเว็บ", body: "กดเข้าห้องได้เลย ไม่ต้องลงแอป หรือคุยทาง LINE ก็ได้" },
                    { Icon: ClockIcon, title: `ตัวต่อตัว ${CONSULTATION_MINUTES} นาที`, body: "เวลาของคุณกับแม่หมอสองคนเท่านั้น" },
                    { Icon: BriefIcon, title: "แม่หมออ่านเรื่องก่อนคุย", body: "AI สรุปคำถามของคุณให้แม่หมอเตรียมตัวล่วงหน้า" },
                  ].map(({ Icon, title, body }) => (
                    <li key={title} className="space-y-1.5 rounded-2xl border border-line-warm bg-inset-warm/60 p-4">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface text-gold-ink">
                        <Icon />
                      </span>
                      <p className="text-sm font-bold text-ink-deep">{title}</p>
                      <p className="text-[13px] leading-relaxed text-muted">{body}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-labelledby="reader-steps" className="altar-card-porcelain !rounded-2xl space-y-4 p-5 sm:p-7">
                <h2 id="reader-steps" className="text-lg font-bold text-ink-deep">
                  <ThaiPhrases>ขั้นตอนการปรึกษา</ThaiPhrases>
                </h2>
                <ol className="space-y-4">
                  {[
                    {
                      title: "เลือกเวลา",
                      body: 'แม่หมอออนไลน์อยู่กด "คุยตอนนี้" ได้เลย หรือแตะเวลาว่างที่สะดวก',
                    },
                    {
                      title: "ใส่ชื่อเล่นกับเรื่องที่อยากถาม แล้วชำระเงิน",
                      body: `บัตรหรือพร้อมเพย์ผ่าน Stripe · ยกเลิกก่อนนัด ${FREE_CANCEL_HOURS} ชม. คืนเงินเต็ม`,
                    },
                    {
                      title: "ถึงเวลาแล้วกดเข้าห้อง",
                      body: "ได้ลิงก์นัดของคุณ เปิดจากมือถือหรือคอมเครื่องไหนก็ได้ แล้วกดเข้าห้องวิดีโอคอล หรือคุยทาง LINE",
                    },
                  ].map((step, i, all) => (
                    <li key={step.title} className="relative flex gap-4">
                      {i < all.length - 1 && (
                        <span aria-hidden="true" className="absolute left-[15px] top-9 bottom-[-12px] w-px bg-line" />
                      )}
                      <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-ink text-[13px] font-bold text-surface">
                        {i + 1}
                      </span>
                      <div className="space-y-0.5 pt-1">
                        <p className="text-sm font-bold text-ink-deep">{step.title}</p>
                        <p className="text-[13px] leading-relaxed text-muted">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {reviews.count > 0 && (
                <section id="reader-reviews" aria-labelledby="reader-reviews-heading" className="altar-card-porcelain !rounded-2xl space-y-4 p-5 sm:p-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="reader-reviews-heading" className="text-lg font-bold text-ink-deep">
                      <ThaiPhrases>รีวิวจากผู้ที่ปรึกษาจริง</ThaiPhrases>
                    </h2>
                    <p className="text-sm text-ink">
                      <span className="text-muted">คะแนนเฉลี่ย </span>
                      <strong className="font-bold">{reviews.average?.toFixed(1)}</strong>
                      <span className="text-muted"> จาก 5 · {reviews.count} รีวิว</span>
                    </p>
                  </div>
                  {reviews.latest.length > 0 ? (
                    <ul className="divide-y divide-line-warm/70">
                      {reviews.latest.map((rv) => (
                        <li key={rv.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
                          <p className="text-[13px]">
                            <strong className="text-gold-ink">{rv.rating}/5</strong>{" "}
                            <span className="font-semibold text-ink-deep">{rv.name}</span>
                          </p>
                          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{rv.comment}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">ผู้ที่ปรึกษาให้คะแนนไว้ แต่ยังไม่มีรีวิวแบบข้อความ</p>
                  )}
                  <p className="text-[12px] text-muted">รีวิวได้เฉพาะผู้ที่ชำระเงินและคุยกับแม่หมอจบแล้วเท่านั้น</p>
                </section>
              )}

              <section aria-labelledby="reader-policy" className="altar-card-porcelain !rounded-2xl space-y-3 p-5 sm:p-7">
                <h2 id="reader-policy" className="text-lg font-bold text-ink-deep">
                  <ThaiPhrases>การยกเลิกและคืนเงิน</ThaiPhrases>
                </h2>
                <dl className="divide-y divide-line-warm/70 text-sm">
                  {[
                    { when: `ก่อนเวลานัด ${FREE_CANCEL_HOURS} ชม. ขึ้นไป`, what: `ยกเลิกคืนเงินเต็ม หรือเลื่อนนัดได้ ${MAX_RESCHEDULES} ครั้ง` },
                    { when: `น้อยกว่า ${FREE_CANCEL_HOURS} ชม. ก่อนนัด`, what: "ยกเลิกได้ แต่ไม่คืนเงิน" },
                    {
                      when: `ภายใน ${PAID_GRACE_MINUTES} นาทีหลังจ่าย`,
                      what: "ยกเลิกคืนเงินเต็ม หรือเลื่อนนัดได้ — เผื่อกดเวลาผิด (นัดที่ห่างเกิน 1 ชม.)",
                    },
                    { when: "คิวสดระหว่างรอเรียก", what: "ยกเลิกได้ตลอด คืนเงินเต็ม" },
                    { when: "แม่หมอยกเลิกหรือไม่มาตามนัด", what: "คืนเงินเต็มอัตโนมัติ" },
                  ].map((row) => (
                    <div key={row.when} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
                      <dt className="text-muted sm:w-56 sm:shrink-0">{row.when}</dt>
                      <dd className="font-semibold text-ink-deep">{row.what}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-[13px] leading-relaxed text-muted">
                  เงินคืนเข้าช่องทางเดิมที่ชำระ ภายใน 5–10 วันทำการ (ขึ้นกับธนาคาร)
                </p>
              </section>
            </div>
          </div>
        </ConsultWindow>

        <p className="mt-6 text-center">
          <Link href="/readers" className="v3-cs-back v3-cs-night-link">
            ดูแม่หมอคนอื่น
          </Link>
        </p>
      </main>
      </div>
      <SiteFooter />
    </>
  );
}
