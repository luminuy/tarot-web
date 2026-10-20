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
import { BxFan, FrFan, FrInput, FrList, FrMock, FrPanel, Ui2Bento, Ui2FeatureRows } from "@/components/ui2/Ui2Blocks";
import { ArrowIcon } from "@/components/ui/LineIcons";
import { topicCards } from "@/data/spread-topic-deck";
import { SPREADS } from "@/data/spreads";
import { localeHref } from "@/lib/i18n/paths";

/** ขนาดกล่องของ "เลือกผังตามสถานการณ์" (6 กล่อง) — คอม 3 คอลัมน์เต็ม 9 ช่องพอดี · แท็บเล็ต 2 คอลัมน์ไม่มีช่องโหว่ */
const SITUATION_SIZES = ["wide", "tall", "sm", "sm", "md", "wide"] as const;

/** หัวกล่อง: คำค้นหลัก ("ดูดวงไพ่ยิปซี" / "ไพ่ยิปซี") สีทอง · ที่เหลือตัดวลีตามปกติ — ไม่ให้คำยาวติดกันหักกลางคำ */
function splitKeyword(label: string): [string, string] {
  for (const k of ["ดูดวงไพ่ยิปซี", "ไพ่ยิปซี"]) {
    if (label.startsWith(k)) return [k, label.slice(k.length).trim()];
  }
  const cut = label.indexOf(" ");
  return cut > 0 ? [label.slice(0, cut), label.slice(cut + 1)] : [label, ""];
}

/** จำนวนไพ่ของผังที่ลิงก์ชี้ (`/spreads/<id>`) · หน้าอื่น เช่น `/love/1-card` = 1 */
function cardCountOf(href: string): number {
  const id = href.startsWith("/spreads/") ? href.slice("/spreads/".length) : "";
  return SPREADS.find((x) => x.id === id)?.positions.length ?? 1;
}


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
            <span aria-hidden="true" className="v2-tp-sep" />
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

        {/*
          v3 (เจ้าของ 2026-10-20 "ยังไม่สวยเลย สู้หน้าอื่นไม่ได้") — ส่วนล่างใช้ภาษาภาพกลางของ UI 2.0 แบบหน้าคำถาม/ราคา
          กล่องหลายขนาด (Ui2Bento) · แถวสลับซ้ายขวา + แผงครีม (Ui2FeatureRows) · ภาพไพ่ 1909 จริงตามหมวด (ประดับ)
        */}
        {!isEnglish && topic.situationsTh && topic.situationsTh.length > 0 && (
          <Ui2Bento
            id="tp-sit-h"
            kicker="เลือกตามสถานการณ์"
            title={`${topic.titleTh} เลือกผังตามสถานการณ์ของคุณ`}
            lede="ดูว่าตอนนี้คุณอยู่ตรงไหน แล้วเปิดผังที่ถามตรงเรื่องนั้นที่สุด"
            tiles={topic.situationsTh.map((item, idx) => {
              const [lead, rest] = splitKeyword(item.label);
              const size = SITUATION_SIZES[idx] ?? "sm";
              const count = cardCountOf(item.href);
              const fan = topicCards(topic.slug, 3, idx).map((c) => [c, c] as const);
              return {
                key: item.href,
                size,
                glow: idx === 0 ? "amber" : idx === 1 ? "teal" : undefined,
                label: item.free ? `${item.situation} · เปิดได้ฟรี` : item.situation,
                lead,
                title: rest || undefined,
                // กล่องกว้าง: คำอธิบายย้ายเข้าแผงข้างพัดไพ่ (แบบกล่อง "เลือก ผังที่ใช่กับคำถาม" ของหน้าแรก)
                desc: size === "wide" ? undefined : item.note,
                href: item.href,
                visual:
                  size === "wide" ? (
                    <BxFan cards={fan} label={`ไพ่ ${count} ใบ`} text={item.note} />
                  ) : size === "tall" ? (
                    <BxFan cards={fan} />
                  ) : undefined,
              };
            })}
          />
        )}

        {topicQuestions.length > 0 && (
          <section className="ui2-bk" aria-labelledby="tp-q-h">
            <div className="ui2-bk-head">
              <span className="ui2-bk-kicker">{isEnglish ? "Questions" : "คำถามยอดฮิต"}</span>
              <h2 id="tp-q-h" className="ui2-bk-h2">
                <ThaiPhrases>{isEnglish ? `Common ${topicName.toLowerCase()} questions` : `คำถามที่คนถามบ่อย หมวด${topic.nameTh}`}</ThaiPhrases>
              </h2>
            </div>
            <ul className="ui2-fr-list v2-tp-qlinks">
              {topicQuestions.map((q) => (
                <li key={q.slug}>
                  <Link href={`/questions/${q.slug}`} className="ui2-fr-faq v2-tp-qlink">
                    <span>{q[isEnglish ? "en" : "th"].question}</span>
                    <span className="v2-tp-qgo" aria-hidden="true">
                      <ArrowIcon className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Ui2FeatureRows
          id="tp-faq-h"
          kicker={isEnglish ? "Guide & FAQ" : "คู่มือและคำถามพบบ่อย"}
          title={isEnglish ? `Frequently Asked Questions About ${topicName}` : `คำถามพบบ่อย เกี่ยวกับการดูดวง ด้าน${topic.nameTh}`}
          rows={[
            {
              id: "tp-guide",
              kicker: isEnglish ? "Guide" : "คู่มือ",
              title: isEnglish ? `Guide to Reading ${topicName} Tarot Spreads` : `คู่มือการอ่านไพ่ทาโรต์ หมวด${topic.nameTh}`,
              body: (
                <div className="v2-tp-prose">
                  {editorialIntro.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ),
              mock: (
                <FrMock tint="gold">
                  <FrFan cards={topicCards(topic.slug, 3)} />
                  <FrPanel label={isEnglish ? `${spreads.length} dedicated spreads` : `${spreads.length} ผังเฉพาะหมวดนี้`}>
                    <FrList items={spreads.slice(0, 3).map((x) => (isEnglish ? x.nameEn || x.nameTh : x.nameTh))} />
                  </FrPanel>
                </FrMock>
              ),
            },
            ...(!isEnglish && topic.alsoFitsTh && topic.alsoFitsTh.length > 0
              ? [
                  {
                    id: "tp-also",
                    kicker: "ผังทั่วไป",
                    title: `ถามเรื่อง${topic.nameTh} ด้วยผังทั่วไป`,
                    body: (
                      <ul className="v2-tp-also">
                        {topic.alsoFitsTh.map((item) => (
                          <li key={item.spreadId}>
                            <Link href={`/spreads/${item.spreadId}`}>{item.label}</Link>
                            <span>{item.note}</span>
                          </li>
                        ))}
                      </ul>
                    ),
                    mock: (
                      <FrMock tint="teal">
                        <FrFan cards={topicCards(topic.slug, 3, 3)} />
                      </FrMock>
                    ),
                  },
                ]
              : []),
            ...faqs.slice(0, 1).map((faq) => ({
              kicker: isEnglish ? "Most asked" : "ถามบ่อยที่สุด",
              title: faq.question,
              body: <p>{faq.answer}</p>,
              mock: (
                <FrMock tint="violet">
                  <FrPanel>
                    <FrInput title={isEnglish ? "Your question" : "คำถามของคุณ"} text={faq.question} />
                  </FrPanel>
                </FrMock>
              ),
            })),
          ]}
          rest={faqs.slice(1).map((faq) => ({ q: faq.question, a: <p>{faq.answer}</p> }))}
          restLabel={isEnglish ? "More questions" : "คำถามอื่น ๆ"}
        />

        <Ui2Bento
          id="tp-other-h"
          kicker={isEnglish ? "Other topics" : "หมวดอื่น"}
          title={isEnglish ? "Explore Other Categories" : "สำรวจหมวดหมู่อื่น ๆ"}
          tiles={allTopics
            .filter((t) => t.slug !== topic.slug)
            .map((t, idx) => {
              const name = isEnglish && t.nameEn ? t.nameEn : t.nameTh;
              // หัวกล่อง: คำแรกสีทอง — ไทยตัดที่ "และ" (การงาน | และเส้นทางอาชีพ) · อังกฤษตัดที่คำแรก
              const cut = isEnglish ? name.indexOf(" ") : name.indexOf("และ");
              return {
                key: t.slug,
                size: idx === 0 ? ("wide" as const) : ("sm" as const),
                label: isEnglish ? `${t.spreadIds.length} spreads` : `${t.spreadIds.length} ผัง`,
                lead: cut > 0 ? name.slice(0, cut) : name,
                title: cut > 0 ? name.slice(cut).trim() : undefined,
                desc: isEnglish && t.taglineEn ? t.taglineEn : t.tagline,
                href: localeHref(`/spreads/topic/${t.slug}`, locale),
                visual:
                  idx === 0 ? (
                    <BxFan
                      cards={topicCards(t.slug, 3).map((c) => [c, c] as const)}
                      label={isEnglish ? "Spreads in this topic" : "ผังในหมวดนี้"}
                      text={getSpreadsForTopic(t)
                        .map((x) => (isEnglish ? x.nameEn || x.nameTh : x.nameTh))
                        .join(" · ")}
                    />
                  ) : (
                    <BxFan cards={topicCards(t.slug, 3).map((c) => [c, c] as const)} />
                  ),
              };
            })}
        />
        <p className="v2-tp-foot">
          <Link href="/cards">{isEnglish ? "78-Card Encyclopedia" : "สารานุกรมไพ่ 78 ใบ"}</Link>
          <Link href="/blog">{isEnglish ? "Tarot Articles" : "บทความดูดวง"}</Link>
          <Link href="/">{isEnglish ? "Back to Home" : "กลับหน้าแรก"}</Link>
        </p>
      </div>
      {/* ไปต่อจากตรงนี้ — กล่องหลายขนาดแบบหน้าแรก (เจ้าของ 2026-10-17) */}
      <Ui2NextSteps isEn={isEnglish} keys={["cards", "daily", "journal", "questions"]} />
    </main>
  );
}
