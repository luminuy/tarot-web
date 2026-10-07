import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicReaderById } from "@/lib/marketplace/readers.repo";
import { getReaderLiveAvailability } from "@/lib/marketplace/queue.repo";
import { getNextAvailableSlot } from "@/lib/marketplace/booking.repo";
import { getReaderReviewSummary, type ReviewSummary } from "@/lib/marketplace/reviews.repo";
import { FREE_CANCEL_HOURS, MAX_RESCHEDULES } from "@/lib/marketplace/booking-policy";
import { ReaderDetailClient } from "@/components/marketplace/ReaderDetailClient";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { buildAlternates, SITE_ORIGIN, noindexAlternates } from "@/lib/config/site";
import type { Metadata } from "next";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { BriefIcon, ClockIcon, ShieldIcon, VideoIcon } from "@/components/marketplace/ConsultIcons";
import { CONSULTATION_MINUTES } from "@/lib/marketplace/offer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const reader = await getPublicReaderById(id);
  if (!reader) {
    return { title: "ไม่พบแม่หมอ", robots: { index: false, follow: true }, alternates: noindexAlternates() };
  }
  return {
    title: `${reader.displayName} · ปรึกษาแม่หมอตัวจริง`,
    description: reader.bio || `ปรึกษาดวงชะตากับ ${reader.displayName} ผ่านศาสตร์ไพ่ทาโรต์`,
    alternates: buildAlternates(`/readers/${reader.id}`),
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
  const [isLiveOpen, nextSlot, reviews] = await Promise.all([
    getReaderLiveAvailability(id),
    getNextAvailableSlot(id, nowMs),
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

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="min-h-screen text-ink-deep px-4 pb-16 pt-5 sm:px-8 sm:pt-8 font-serif-th relative overflow-x-clip">
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd) }}
        />

        <div className="mx-auto max-w-5xl space-y-6 relative z-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[13px] text-muted">
            <Link href="/" className="hover:text-gold-ink transition-colors">
              หน้าแรก
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/readers" className="hover:text-gold-ink transition-colors">
              ปรึกษาแม่หมอ
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-ink-deep">{reader.displayName}</span>
          </nav>

          {/*
            ✦ หน้าโปรไฟล์แม่หมอแบบหน้าโปรไฟล์ผู้ให้บริการของเว็บระดับโลก (เจ้าของสั่ง 2026-10-03)
            หัวโปรไฟล์ (แถบกำมะหยี่ชุดเดียวกับหน้ารวม/หน้าคิว) · ซ้าย = เกี่ยวกับ + วิธีคุย + ขั้นตอน · ขวา = การ์ดจองติดจอ
            มือถือ: การ์ดจองขึ้นต่อจากหัวโปรไฟล์ทันที (ไม่ต้องเลื่อนหา) · ข้อความ PDPA อยู่ในหน้าต่างจองที่เดียว (เดิมซ้ำ 3 ที่)
          */}
          <section className="overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_20px_40px_-28px_rgba(46,33,26,0.45)]">
            <div className="consult-stage h-24 !rounded-none !border-0 !shadow-none sm:h-32" aria-hidden="true" />
            <div className="flex flex-col items-center gap-4 px-5 pb-6 text-center sm:flex-row sm:items-end sm:px-8 sm:text-left">
              <div className="-mt-12 grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-canvas text-3xl font-bold text-gold-ink shadow-md ring-4 ring-surface sm:-mt-14 sm:h-28 sm:w-28">
                {reader.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={reader.avatarUrl}
                    /* ภาพประกอบล้วน — <h1> ข้าง ๆ พิมพ์ชื่อแม่หมออยู่แล้ว (INC-0125) */
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  reader.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2.5 sm:pb-1 sm:pt-4">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap">
                  <h1 className="break-words text-2xl font-bold leading-snug text-ink-deep sm:text-3xl">{reader.displayName}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-ok/30 bg-ok/10 px-2.5 py-0.5 text-[13px] font-semibold text-ok">
                    <ShieldIcon width={14} height={14} />
                    ยืนยันตัวตนแล้ว
                  </span>
                </div>
                {reviews.average !== null && (
                  <a href="#reader-reviews" className="inline-flex items-center gap-1.5 text-sm text-ink hover:text-gold-ink">
                    <span aria-hidden="true" className="text-gold-ink">★</span>
                    <strong className="font-bold">{reviews.average.toFixed(1)}</strong>
                    <span className="text-muted">· {reviews.count} รีวิวจากผู้ที่ปรึกษาจริง</span>
                  </a>
                )}
                {reader.specialties.length > 0 && (
                  <ul className="flex flex-wrap justify-center gap-1.5 sm:justify-start" aria-label="ความถนัด">
                    {reader.specialties.map((s) => (
                      <li key={s} className="rounded-full border border-line-warm bg-inset-warm px-3 py-1 text-[13px] text-ink-deep">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            {/* การ์ดจอง — มือถือขึ้นก่อนเนื้อหา · จอใหญ่ติดขวาและติดจอตอนเลื่อน */}
            <div className="lg:order-2 lg:sticky lg:top-[calc(var(--site-header-h)+20px)]">
              <ReaderDetailClient reader={reader} isLiveOpen={isLiveOpen} nextSlot={nextSlot} nowMs={nowMs} />
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
                    { title: "เลือกเวลาและชำระเงิน", body: "คุยตอนนี้ หรือนัดวันเวลาที่สะดวก บอกชื่อเล่นกับเรื่องที่อยากถาม แล้วชำระผ่าน Stripe" },
                    { title: "รอถึงเวลา", body: "ได้หน้ายืนยันพร้อมปุ่มเพิ่มลงปฏิทิน ถึงคิวหรือถึงเวลานัดแล้ว ปุ่มเข้าห้องจะขึ้นให้ทันที" },
                    { title: "คุยกับแม่หมอ", body: "เข้าห้องวิดีโอคอลในเว็บ หรือคุยทาง LINE" },
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
                      <span aria-hidden="true" className="text-gold-ink">★</span>{" "}
                      <strong className="font-bold">{reviews.average?.toFixed(1)}</strong>
                      <span className="text-muted"> จาก 5 · {reviews.count} รีวิว</span>
                    </p>
                  </div>
                  {reviews.latest.length > 0 ? (
                    <ul className="divide-y divide-line-warm/70">
                      {reviews.latest.map((rv) => (
                        <li key={rv.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
                          <p className="text-[13px]">
                            <span className="text-gold-ink" aria-hidden="true">
                              {"★".repeat(rv.rating)}
                              <span className="text-line-warm">{"★".repeat(5 - rv.rating)}</span>
                            </span>
                            <span className="sr-only">{rv.rating} ดาว</span>{" "}
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
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
