import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";

import {
  SPREAD_TOPICS,
  getAllTopicSlugs,
  getSpreadTopic,
  getSpreadsForTopic,
} from "@/data/spread-topics";
import type { ReactNode } from "react";
import { QUESTIONS } from "@/data/questions";
import { buildAlternates, localizedUrl, noindexAlternates } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { getCategoryCardImage } from "@/lib/media/og-card-art";
import type { Locale } from "@/lib/i18n/types";
import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { Ui2Crumbs } from "@/components/ui2/Ui2PageHero";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";


export function spreadTopicStaticParams() {
  return getAllTopicSlugs().map((slug) => ({ category: slug }));
}

/**
 * ⚙️ แกนกลางแบบซิงโครนัส — ใช้ได้ทั้งสองเครื่องมือเรนเดอร์
 * (Next ส่ง `params` มาเป็น Promise · Astro รู้ค่าตั้งแต่ `getStaticPaths` แล้ว)
 * ⚠️ ห้ามก็อปตรรกะ SEO นี้ไปไว้ในไฟล์ `.astro` เด็ดขาด — ต้องมีที่เดียว
 */
export function spreadTopicMetadata(category: string, locale: Locale): Metadata {
  const topic = getSpreadTopic(category);
  if (!topic) {
    return {
      title: locale === "en" ? "Spread Topic Not Found" : "ไม่พบหมวดหมู่ผังพยากรณ์",
      robots: { index: false, follow: true },
      alternates: noindexAlternates(),
    };
  }

  const isEnglish = locale === "en";
  const path = `/spreads/topic/${topic.slug}`;
  const title = isEnglish && topic.seoTitleEn ? topic.seoTitleEn : topic.seoTitle;
  const description = isEnglish && topic.metaDescriptionEn ? topic.metaDescriptionEn : topic.metaDescription;

  const topicTitle = isEnglish ? (topic.titleEn || topic.titleTh) : topic.titleTh;
  const ogImages = buildPageOgImage({
    title: topicTitle,
    eyebrow: isEnglish ? "LIFE THEME SPREADS" : "ผังพยากรณ์ตามหมวดชีวิต",
    cardImage: getCategoryCardImage(topic.slug),
    alt: title,
  });

  return {
    title,
    description,
    alternates: buildAlternates(path, { locale, englishTwin: true }),
    openGraph: {
      title,
      description,
      url: localizedUrl(path, locale),
      siteName: "SeerTarot",
      type: "website",
      locale: isEnglish ? "en_US" : "th_TH",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImages[0].url],
    },
  };
}

/**
 * ⚙️ เนื้อหาหน้าหมวดผังแบบซิงโครนัส — รับหมวดที่หาเจอแล้วเข้ามาตรง ๆ
 * (Astro เรียกตัวนี้ · React ฝั่ง SSR เรนเดอร์คอมโพเนนต์แบบ async ไม่ได้)
 */
export function SpreadTopicContent({
  topic,
  locale,
  list,
}: {
  topic: NonNullable<ReturnType<typeof getSpreadTopic>>;
  locale: Locale;
  /** island ของรายการผังในหมวดนี้ — ส่งเข้ามาจากข้างนอกเสมอ */
  list: ReactNode;
}) {
  const isEnglish = locale === "en";
  const spreads = getSpreadsForTopic(topic);
  const allTopics = Object.values(SPREAD_TOPICS);
  // ❓ หน้าคำถามในหมวดนี้ (แทร็ก Q) — ลิงก์ลงไปยังชั้นลูก ให้บอตเห็นโครงหมวด ➔ คำถาม
  const topicQuestions = QUESTIONS.filter((q) => q.topic === topic.slug);
  const currentPath = `/spreads/topic/${topic.slug}`;
  const currentUrl = localizedUrl(currentPath, locale);

  const topicName = isEnglish && topic.nameEn ? topic.nameEn : topic.nameTh;
  const topicHeading = isEnglish && topic.headingEn ? topic.headingEn : topic.heading;
  const topicTagline = isEnglish && topic.taglineEn ? topic.taglineEn : topic.tagline;
  const editorialIntro = isEnglish && topic.editorialIntroEn ? topic.editorialIntroEn : topic.editorialIntro;
  const faqs = isEnglish && topic.faqsEn ? topic.faqsEn : topic.faqs;
  const metaDesc = isEnglish && topic.metaDescriptionEn ? topic.metaDescriptionEn : topic.metaDescription;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isEnglish && topic.titleEn ? topic.titleEn : topic.titleTh,
    description: metaDesc,
    url: currentUrl,
    inLanguage: locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: spreads.length,
      itemListElement: spreads.map((spread, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: isEnglish ? spread.nameEn : spread.nameTh,
        description: isEnglish ? spread.descriptionEn : spread.description,
        url: localizedUrl(`/spreads/${spread.id}`, locale),
      })),
    },
  };

  const breadcrumbsJsonLd = buildBreadcrumbJsonLd(locale, [
    homeCrumb(locale),
    { name: isEnglish ? "26 Tarot Spreads" : "ผังพยากรณ์ 26 แบบ", path: "/spreads" },
    { name: topicName, path: currentPath },
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink px-4 sm:px-8 font-sans relative overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />

      {/*
        v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย") — ห้องหมวด: หัวสีประจำหมวด (`data-topic`) + แถบสลับหมวด
        ➔ รายการผังขึ้นทันที (v1 ให้อ่านคู่มือยาวก่อนถึงผัง) ➔ คำถาม · ผังทั่วไป · คู่มือ · คำถามพบบ่อย · หมวดอื่น
      */}
      <div className="v2-tp" data-topic={topic.slug}>
        <header className="v2-tp-head">
          <Ui2Crumbs
            crumbs={[
              { label: isEnglish ? "Home" : "หน้าแรก", href: "/" },
              { label: isEnglish ? "26 Tarot Spreads" : "ผังพยากรณ์ 26 แบบ", href: "/spreads" },
              { label: topicName },
            ]}
          />
          <h1 className="v2-tp-title">
            <ThaiPhrases>{topicHeading}</ThaiPhrases>
          </h1>
          <p className="v2-tp-lede">
            <ThaiPhrases>{topicTagline}</ThaiPhrases>
          </p>
          <p className="v2-tp-count">
            <b>{spreads.length}</b>
            {isEnglish ? " dedicated spreads" : " ผังเฉพาะหมวดนี้"}
            <span aria-hidden="true" className="v2-tp-dot" />
            {isEnglish
              ? `${Math.min(...spreads.map((x) => x.positions.length))}–${Math.max(...spreads.map((x) => x.positions.length))} cards`
              : `${Math.min(...spreads.map((x) => x.positions.length))}–${Math.max(...spreads.map((x) => x.positions.length))} ใบ`}
          </p>
          <nav className="v2-tp-switch" aria-label={isEnglish ? "Spread topics" : "หมวดผังพยากรณ์"}>
            <Link href="/spreads">{isEnglish ? "All (26)" : "ทั้งหมด (26)"}</Link>
            {allTopics.map((t) => (
              <Link
                key={t.slug}
                href={`/spreads/topic/${t.slug}`}
                data-topic={t.slug}
                aria-current={t.slug === topic.slug ? "page" : undefined}
              >
                {isEnglish && t.nameEn ? t.nameEn : t.nameTh}
                <small>{t.spreadIds.length}</small>
              </Link>
            ))}
          </nav>
        </header>

        <section className="v2-tp-sec" aria-labelledby="tp-list-h">
          <h2 id="tp-list-h" className="v2-tp-h2">
            <ThaiPhrases>{isEnglish ? "Select a Spread for Your Question" : "เลือกผังพยากรณ์ ที่ตรงกับคำถามของคุณ"}</ThaiPhrases>
          </h2>
          {list}
        </section>

        {/* เลือกผังตามสถานะของคนถาม — ตอบคำค้น "ดูดวงไพ่ยิปซี + หมวด" ตรง ๆ (GSC 2026-10-19 · ไทยเท่านั้น) */}
        {!isEnglish && topic.situationsTh && topic.situationsTh.length > 0 && (
          <section className="v2-tp-sec" aria-labelledby="tp-sit-h">
            <h2 id="tp-sit-h" className="v2-tp-h2">
              <ThaiPhrases>{`${topic.titleTh} เลือกผังตามสถานการณ์ของคุณ`}</ThaiPhrases>
            </h2>
            <ul className="v2-tp-also v2-tp-sit">
              {topic.situationsTh.map((item) => (
                <li key={item.href}>
                  <small>
                    {item.situation}
                    {item.free ? <em>เปิดได้ฟรี</em> : null}
                  </small>
                  <Link href={item.href}>{item.label}</Link>
                  <span>{item.note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {topicQuestions.length > 0 && (
          <section className="v2-tp-sec" aria-labelledby="tp-q-h">
            <h2 id="tp-q-h" className="v2-tp-h2">
              <ThaiPhrases>{isEnglish ? `Common ${topicName.toLowerCase()} questions` : `คำถามที่คนถามบ่อย หมวด${topic.nameTh}`}</ThaiPhrases>
            </h2>
            <ul className="v2-tp-qs">
              {topicQuestions.map((q) => (
                <li key={q.slug}>
                  <Link href={`/questions/${q.slug}`}>{q[isEnglish ? "en" : "th"].question}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!isEnglish && topic.alsoFitsTh && topic.alsoFitsTh.length > 0 && (
          <section className="v2-tp-sec" aria-labelledby="tp-also-h">
            <h2 id="tp-also-h" className="v2-tp-h2">
              <ThaiPhrases>{`ถามเรื่อง${topic.nameTh} ด้วยผังทั่วไป`}</ThaiPhrases>
            </h2>
            <ul className="v2-tp-also">
              {topic.alsoFitsTh.map((item) => (
                <li key={item.spreadId}>
                  <Link href={`/spreads/${item.spreadId}`}>{item.label}</Link>
                  <span>{item.note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="v2-tp-sec v2-tp-guide" aria-labelledby="tp-guide-h">
          <h2 id="tp-guide-h" className="v2-tp-h2">
            <ThaiPhrases>{isEnglish ? `Guide to Reading ${topicName} Tarot Spreads` : `คู่มือการอ่านไพ่ทาโรต์ หมวด${topic.nameTh}`}</ThaiPhrases>
          </h2>
          <div className="v2-tp-prose">
            {editorialIntro.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>

        {faqs.length > 0 && (
          <section className="v2-tp-sec" aria-labelledby="tp-faq-h">
            <h2 id="tp-faq-h" className="v2-tp-h2">
              <ThaiPhrases>
                {isEnglish ? `Frequently Asked Questions About ${topicName}` : `คำถามพบบ่อย เกี่ยวกับการดูดวง ด้าน${topic.nameTh}`}
              </ThaiPhrases>
            </h2>
            <div className="v2-tp-faq">
              {faqs.map((faq, index) => (
                <details key={index}>
                  <summary>
                    <ThaiPhrases>{faq.question}</ThaiPhrases>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="v2-tp-sec" aria-labelledby="tp-other-h">
          <h2 id="tp-other-h" className="v2-tp-h2">
            <ThaiPhrases>{isEnglish ? "Explore Other Categories" : "สำรวจหมวดหมู่อื่น ๆ"}</ThaiPhrases>
          </h2>
          <ul className="v2-tp-others">
            {allTopics
              .filter((t) => t.slug !== topic.slug)
              .map((t) => (
                <li key={t.slug}>
                  <Link href={`/spreads/topic/${t.slug}`} data-topic={t.slug}>
                    <b>{isEnglish && t.nameEn ? t.nameEn : t.nameTh}</b>
                    <small>
                      {t.spreadIds.length} {isEnglish ? "spreads" : "ผัง"}
                    </small>
                  </Link>
                </li>
              ))}
          </ul>
          <p className="v2-tp-foot">
            <Link href="/cards">{isEnglish ? "78-Card Encyclopedia" : "สารานุกรมไพ่ 78 ใบ"}</Link>
            <Link href="/blog">{isEnglish ? "Tarot Articles" : "บทความดูดวง"}</Link>
            <Link href="/">{isEnglish ? "Back to Home" : "กลับหน้าแรก"}</Link>
          </p>
        </section>
      </div>
      {/* ไปต่อจากตรงนี้ — กล่องหลายขนาดแบบหน้าแรก (เจ้าของ 2026-10-17) */}
      <Ui2NextSteps isEn={isEnglish} keys={["cards", "daily", "journal", "questions"]} />
    </main>
  );
}
