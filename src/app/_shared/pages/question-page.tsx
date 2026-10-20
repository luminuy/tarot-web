import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { CardImage } from "@/components/card/CardImage";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { cardById } from "@/data/cards";
import { YES_NO_TONE } from "@/data/cards/yes-no";
import { getSpread } from "@/data/spreads";
import {
  QUESTIONS,
  QUESTION_TOPIC_ORDER,
  TOPIC_PARENT,
  getQuestion,
  relatedQuestions,
  type QuestionPage,
} from "@/data/questions";
import { buildAlternates, localizedUrl, noindexAlternates } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { getCategoryCardImage } from "@/lib/media/og-card-art";
import { hasEnglishTwin } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/types";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";
import { Ui2PageHero } from "@/components/ui2/Ui2PageHero";
import { FrFan, FrInput, FrList, FrMock, FrPanel, Ui2FeatureRows } from "@/components/ui2/Ui2Blocks";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";
import { Ui2Showcase, Ui2ShowcaseStarter, type Ui2ShowcaseSection } from "@/components/ui2/Ui2Showcase";

/**
 * ❓ หน้าคำถาม `/questions/[slug]` + หน้ารวม `/questions` (REFLECTION_JOURNAL_PLAN 1.11 · แทร็ก Q)
 * ---------------------------------------------------------------------------
 * แกนกลางแบบซิงโครนัส ใช้ได้ทั้ง Astro (prerender) — ⚠️ ห้ามก็อปตรรกะ SEO นี้ไปไว้ในไฟล์ `.astro`
 * Structured data: Article + BreadcrumbList (ไม่ใช้ FAQPage เป็นหลัก — Google จำกัด rich result แล้ว)
 * ภาพไพ่ทุกใบผ่าน <CardImage sizes> (กฎเหล็กข้อ 8) · ไพ่ตัวอย่างเป็น "ตัวอย่าง" ติดป้ายชัด ไม่ใช่คำทำนายของใคร
 */

const QUESTIONS_HUB_PATH = "/questions";
const questionPath = (slug: string) => `/questions/${slug}`;

const HUB_COPY = {
  th: {
    title: "คำถามดูดวงไพ่ยิปซีที่คนถามบ่อย พร้อมผังที่เหมาะ",
    description: "รวม 20 คำถามดูดวงไพ่ยิปซีที่คนค้นมากที่สุด ตั้งแต่ความรัก งาน การเงิน จนถึงวิธีตั้งคำถาม แต่ละข้อมีผังที่เหมาะ ไพ่ที่ควรรู้จัก และเปิดไพ่ถามได้ทันที",
    heading: "คำถามที่คนถามไพ่บ่อยที่สุด",
    lead: "เลือกคำถามที่ใกล้กับเรื่องของคุณ แต่ละหน้าบอกว่าไพ่ตอบอะไรได้ ถามแบบไหนได้คำตอบที่ใช้ได้จริง และมีปุ่มเปิดไพ่ที่ตั้งผังไว้ให้แล้ว",
  },
  en: {
    title: "Common Tarot Questions and the Spreads That Fit",
    description: "The 20 most searched tarot questions, from love and work to money and how to ask. Each has the right spread, key cards and a ready-to-draw reading.",
    heading: "The questions people ask tarot most",
    lead: "Pick the question closest to yours. Each page explains what the cards can answer, how to ask for a usable answer, and has a button that opens the right spread for you.",
  },
} as const;

export function questionStaticSlugs(): Array<{ slug: string }> {
  return QUESTIONS.map((q) => ({ slug: q.slug }));
}

export function questionMetadata(slug: string, locale: Locale): Metadata {
  const q = getQuestion(slug);
  if (!q) {
    return { title: locale === "en" ? "Question Not Found" : "ไม่พบคำถามนี้", robots: { index: false, follow: true }, alternates: noindexAlternates() };
  }
  const c = q[locale === "en" ? "en" : "th"];
  const path = questionPath(q.slug);
  const images = buildPageOgImage({
    title: c.question,
    eyebrow: locale === "en" ? "TAROT QUESTION" : "คำถามดูดวงไพ่ยิปซี",
    cardImage: getCategoryCardImage(q.topic === "general" ? null : q.topic),
    alt: c.title,
  });
  return {
    title: c.title,
    description: c.description,
    alternates: buildAlternates(path, { locale, englishTwin: true }),
    openGraph: {
      title: c.title,
      description: c.description,
      url: localizedUrl(path, locale),
      siteName: "SeerTarot",
      type: "article",
      locale: locale === "en" ? "en_US" : "th_TH",
      images,
    },
    twitter: { card: "summary_large_image", title: c.title, description: c.description, images: [images[0].url] },
  };
}

export function questionsHubMetadata(locale: Locale): Metadata {
  const c = HUB_COPY[locale === "en" ? "en" : "th"];
  const images = buildPageOgImage({ title: c.heading, eyebrow: locale === "en" ? "TAROT QUESTIONS" : "คำถามดูดวง", alt: c.title });
  return {
    title: c.title,
    description: c.description,
    alternates: buildAlternates(QUESTIONS_HUB_PATH, { locale, englishTwin: true }),
    openGraph: { title: c.title, description: c.description, url: localizedUrl(QUESTIONS_HUB_PATH, locale), siteName: "SeerTarot", type: "website", locale: locale === "en" ? "en_US" : "th_TH", images },
    twitter: { card: "summary_large_image", title: c.title, description: c.description, images: [images[0].url] },
  };
}

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="text-lg sm:text-xl font-bold font-serif-th text-ink-deep border-b border-line-soft pb-2"><ThaiPhrases>{children}</ThaiPhrases></h2>
);

function crumbs(q: QuestionPage, locale: Locale) {
  const parent = TOPIC_PARENT[q.topic];
  const isEn = locale === "en";
  return [
    homeCrumb(locale),
    { name: isEn ? parent.en : parent.th, path: parent.path },
    { name: isEn ? "Tarot questions" : "คำถามดูดวง", path: QUESTIONS_HUB_PATH },
    { name: q[isEn ? "en" : "th"].question, path: questionPath(q.slug) },
  ];
}

/** ⚙️ เนื้อหาหน้าคำถาม — `askBox` คือ island ที่ส่งเข้ามาจากข้างนอก (Astro `client:visible`) */
export function QuestionPageContent({ question: q, locale, askBox }: { question: QuestionPage; locale: Locale; askBox: ReactNode }) {
  const isEn = locale === "en";
  const c = q[isEn ? "en" : "th"];
  const spread = getSpread(q.spreadId)!;
  const parent = TOPIC_PARENT[q.topic];
  const url = localizedUrl(questionPath(q.slug), locale);
  const related = relatedQuestions(q.slug, 4);
  const cardName = (id: string) => {
    const card = cardById(id);
    return card ? (isEn ? card.nameEn : card.nameTh) : id;
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.question,
    description: c.description,
    inLanguage: locale,
    datePublished: q.updatedAt,
    dateModified: q.updatedAt,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "SeerTarot", url: localizedUrl("/about", hasEnglishTwin("/about") ? locale : "th") }, // `/about` ยังไม่มีฉบับอังกฤษ — ห้ามชี้ /en/about (A7-02)
    publisher: { "@type": "Organization", name: "SeerTarot" },
    about: { "@type": "Thing", name: isEn ? "Tarot reading" : "การดูดวงไพ่ยิปซี" },
  };
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, crumbs(q, locale));
  /* สีโน้ตตามหมวด — ลำดับเดียวกับผนังโน้ตหน้ารวม */
  const noteTone = (Math.max(0, QUESTION_TOPIC_ORDER.indexOf(q.topic)) % 7) + 1;

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink p-4 sm:p-8 relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }} />

      <article className="max-w-3xl mx-auto space-y-10 py-6">
        <nav aria-label="Breadcrumb" className="text-xs font-serif-th text-muted">
          <ol className="flex items-center gap-2 flex-wrap">
            <li><Link href="/" className="hover:text-ink">{isEn ? "Home" : "หน้าแรก"}</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href={parent.path} className="hover:text-ink">{isEn ? parent.en : parent.th}</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href={QUESTIONS_HUB_PATH} className="hover:text-ink">{isEn ? "Tarot questions" : "คำถามดูดวง"}</Link></li>
          </ol>
        </nav>

        {/* หัวหน้า UI 2.0 (เจ้าของ 2026-10-16) — คำถามเป็น h1 · บทนำเดิมอยู่ในหน้าต่างกระจกใต้หัวหน้า */}
        {/* v2 (2026-10-16 "สร้างใหม่เลย") — คำถามคือกระดาษโน้ตใบใหญ่แปะหมุดทอง (ชุดเดียวกับผนังโน้ตหน้ารวมคำถาม) */}
        <header
          className="v2-qp-head"
          style={
            {
              "--note": `var(--ui2-note-${noteTone})`,
              "--note-ink": `var(--ui2-note-ink-${noteTone})`,
              "--note-sub": `var(--ui2-note-sub-${noteTone})`,
            } as React.CSSProperties
          }
        >
          <div className="v2-qp-note">
            <p className="v2-qp-k">{isEn ? `${parent.en} question` : `คำถามหมวด${parent.th}`}</p>
            <h1 className="v2-qp-q">
              <ThaiPhrases>{c.question}</ThaiPhrases>
            </h1>
          </div>
        </header>
        <section className="ui2-win ui2-rv">
          <div className="space-y-3 pt-7 text-sm sm:text-base text-[#4A4338] font-serif-th leading-relaxed">
            {c.intro.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        <section className="space-y-3">
          <H2>{isEn ? "What the cards can — and can't — answer" : "ไพ่ตอบอะไรได้ และอะไรที่ไม่ควรถามไพ่"}</H2>
          <p className="text-sm text-[#4A4338] font-serif-th leading-relaxed">{c.limits}</p>
        </section>

        <section className="space-y-3">
          <H2>{isEn ? "Ask it this way for a usable answer" : "ถามแบบนี้ได้คำตอบที่ใช้ได้จริงกว่า"}</H2>
          <ul className="space-y-2 text-sm text-[#4A4338] font-serif-th leading-relaxed list-none">
            {c.betterQuestions.map((b, i) => <li key={i} className="pl-3 border-l-2 border-line-warm">{b}</li>)}
          </ul>
        </section>

        <section aria-label={isEn ? "Ask now" : "ถามเลย"}>{askBox}</section>

        <section className="space-y-4">
          <H2>{isEn ? `The spread that fits: ${spread.nameEn}` : `ผังที่เหมาะ: ${spread.nameTh}`}</H2>
          <p className="text-sm text-[#4A4338] font-serif-th leading-relaxed">
            {isEn ? spread.descriptionEn || spread.description : spread.description}{" "}
            <Link href={`/spreads/${spread.id}`} className="text-gold-ink font-semibold underline underline-offset-2">
              {isEn ? "Full guide to this spread" : "อ่านคู่มือผังนี้ฉบับเต็ม"}
            </Link>
          </p>
          <ol className="space-y-3">
            {spread.positions.map((pos, i) => (
              <li key={i} className="glass-tile !rounded-xl p-3 sm:p-4 space-y-1">
                <p className="font-serif-th font-semibold text-ink-deep text-sm">{isEn ? pos.nameEn || pos.nameTh : pos.nameTh}</p>
                <p className="text-sm text-[#4A4338] font-serif-th leading-relaxed">{c.positionWhy[i]}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <H2>{isEn ? "Cards worth knowing for this question" : "ไพ่ที่ควรรู้จักสำหรับคำถามนี้"}</H2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {Object.entries(c.cardNotes).map(([id, note]) => {
              const card = cardById(id);
              if (!card) return null;
              const tone = q.yesNo ? YES_NO_TONE[card.yesNo] : null;
              return (
                <li key={id} className="glass-tile !rounded-xl p-3 flex gap-3">
                  <Link href={`/cards/${id}`} className="shrink-0" aria-label={isEn ? card.nameEn : card.nameTh}>
                    <CardImage cardId={id} image={card.image} alt={isEn ? card.nameEn : card.nameTh} sizes="56px" className="w-14 h-auto rounded-md" loading="lazy" />
                  </Link>
                  <div className="min-w-0 space-y-1">
                    <Link href={`/cards/${id}`} className="font-serif-th font-semibold text-ink-deep text-sm hover:text-gold-ink">{isEn ? card.nameEn : card.nameTh}</Link>
                    {tone && (
                      <span className={`ml-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-serif-th ${tone.badgeClass}`}>
                        {isEn ? tone.labelEn : tone.labelTh}
                      </span>
                    )}
                    <p className="text-xs sm:text-sm text-[#4A4338] font-serif-th leading-relaxed">{note}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          {q.yesNo && (
            <p className="text-xs text-muted font-serif-th leading-relaxed">
              {isEn
                ? "The yes/no lean comes from each card's entry in our 78-card encyclopedia — reversed cards keep their lean but with conditions or delays."
                : "แนวโน้มใช่/ไม่ใช่มาจากข้อมูลของไพ่แต่ละใบในสารานุกรม 78 ใบของเรา — ไพ่กลับหัวยังเอนไปทางเดิม แต่มีเงื่อนไขหรือล่าช้ากว่า"}
            </p>
          )}
        </section>

        <section className="space-y-3">
          <H2>{isEn ? "An example reading (illustration)" : "ตัวอย่างการอ่าน (ภาพประกอบ)"}</H2>
          <div className="flex flex-wrap gap-2">
            {c.example.cards.map((x, i) => {
              const card = cardById(x.id);
              if (!card) return null;
              return (
                <figure key={i} className="w-16 sm:w-20 space-y-1 text-center">
                  <CardImage cardId={x.id} image={card.image} alt={cardName(x.id)} sizes="80px" loading="lazy" className={`w-full h-auto rounded-md ${x.reversed ? "rotate-180" : ""}`} />
                  <figcaption className="text-[10px] text-muted font-serif-th leading-tight">
                    {cardName(x.id)}{x.reversed ? (isEn ? " (reversed)" : " (กลับหัว)") : ""}
                  </figcaption>
                </figure>
              );
            })}
          </div>
          <p className="text-sm text-[#4A4338] font-serif-th leading-relaxed">{c.example.text}</p>
          <p className="text-xs text-muted font-serif-th">
            {isEn ? "This is an illustration of how to read the spread, not a reading for anyone in particular." : "นี่คือตัวอย่างวิธีอ่านผัง ไม่ใช่คำทำนายของใครคนใดคนหนึ่ง"}
          </p>
        </section>

        <section className="space-y-3">
          <H2>{isEn ? "After the cards answer" : "เมื่อไพ่ตอบแล้ว ทำอะไรต่อ"}</H2>
          <ul className="space-y-2 text-sm text-[#4A4338] font-serif-th leading-relaxed list-none">
            {c.afterReading.map((b, i) => <li key={i} className="pl-3 border-l-2 border-line-warm">{b}</li>)}
          </ul>
        </section>

        <section className="space-y-4">
          <H2>{isEn ? "Questions people ask next" : "คำถามที่คนมักถามต่อ"}</H2>
          {c.followUps.map((f, i) => (
            <div key={i} className="space-y-1">
              <h3 className="font-serif-th font-semibold text-ink-deep text-sm sm:text-base"><ThaiPhrases>{f.q}</ThaiPhrases></h3>
              <p className="text-sm text-[#4A4338] font-serif-th leading-relaxed">{f.a}</p>
            </div>
          ))}
        </section>

        <nav aria-label={isEn ? "Related questions" : "คำถามที่เกี่ยวข้อง"} className="space-y-3">
          <H2>{isEn ? "Related questions" : "คำถามที่เกี่ยวข้อง"}</H2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={questionPath(r.slug)} className="block glass-tile !rounded-xl p-3 text-sm font-serif-th text-ink-deep hover:text-gold-ink">
                  {r[isEn ? "en" : "th"].question}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-sm font-serif-th">
            <Link href={parent.path} className="text-gold-ink font-semibold underline underline-offset-2">
              {isEn ? `All ${parent.en.toLowerCase()} spreads` : `ผังทั้งหมดหมวด${parent.th}`}
            </Link>
            {" · "}
            <Link href={QUESTIONS_HUB_PATH} className="text-gold-ink font-semibold underline underline-offset-2">
              {isEn ? "All 20 questions" : "คำถามทั้ง 20 ข้อ"}
            </Link>
          </p>
        </nav>
      </article>
      {/* ไปต่อจากตรงนี้ — กล่องหลายขนาดแบบหน้าแรก (เจ้าของ 2026-10-17) */}
      <Ui2NextSteps isEn={locale === "en"} keys={["spreads", "daily", "journal", "cards"]} />
    </main>
  );
}

/** ⚙️ หน้ารวม `/questions` — จัดตามหมวด ลิงก์ลงทุกหน้า (ไม่มี JS) */
export function QuestionsHubContent({ locale }: { locale: Locale }) {
  const isEn = locale === "en";
  const c = HUB_COPY[isEn ? "en" : "th"];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [homeCrumb(locale), { name: isEn ? "Tarot questions" : "คำถามดูดวง", path: QUESTIONS_HUB_PATH }]);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.heading,
    itemListElement: QUESTIONS.map((q, i) => ({ "@type": "ListItem", position: i + 1, url: localizedUrl(questionPath(q.slug), locale), name: q[isEn ? "en" : "th"].question })),
  };
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink px-4 sm:px-6 pb-16 relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(itemList) }} />
      {/* v3 (เจ้าของ 2026-10-17 "ทำแบบหน้าแรกกับหน้าผัง"): หัวหน้าไพ่ลอย ➔ หมวดคำถามเป็นหน้าต่างโชว์เคส · คำถามเป็นกระดาษโน้ตแบบหน้าแรก */}
      <div className="max-w-[1360px] mx-auto relative z-10 v3-qn">
        <Ui2PageHero
          crumbs={[{ label: isEn ? "Home" : "หน้าแรก", href: "/" }, { label: isEn ? "Tarot questions" : "คำถามดูดวง" }]}
          title={c.heading}
          lede={c.lead}
          trust={isEn ? [`${QUESTIONS.length} questions`, "Each with a spread that fits"] : [`${QUESTIONS.length} คำถาม`, "ทุกคำถามมีผังที่เหมาะ"]}
          cards={["major-06", "major-18", "major-09", "cups-02", "major-17", "pentacles-10"]}
        />
        <Ui2Showcase label={isEn ? "Questions by topic" : "คำถามแยกตามหมวด"} sections={hubSections(isEn)} />
        <HubAskRows isEn={isEn} />
        <Ui2NextSteps isEn={isEn} keys={["spreads", "daily", "journal", "cards"]} />
      </div>
    </main>
  );
}

/**
 * ถามแบบไหนให้ไพ่ตอบชัด — แถวสลับซ้ายขวาแบบคำถามที่พบบ่อยหน้าแรก (v4 · เจ้าของ 2026-10-17)
 * หมวดละหนึ่งคำถาม (3 หมวดแรก) · ภาพจำลอง = ช่องพิมพ์คำถาม + "ถามแบบนี้ได้คำตอบชัดกว่า" จากข้อมูลของคำถามนั้นเอง
 * ไพ่ในภาพ = ไพ่ตัวอย่างของคำถามนั้น (example.cards ในไฟล์ข้อมูล · ไม่ใช่ผลเปิดไพ่ของใคร)
 */
function HubAskRows({ isEn }: { isEn: boolean }) {
  const picks = QUESTION_TOPIC_ORDER.flatMap((topic) => QUESTIONS.filter((q) => q.topic === topic).slice(0, 1)).slice(0, 3);
  const tints = ["gold", "teal", "violet"] as const;
  return (
    <div className="ui2-next">
      <Ui2FeatureRows
        id="questions-ask"
        kicker={isEn ? "Ask it well" : "ถามให้ตรงจุด"}
        title={isEn ? "Ask so the cards can answer clearly" : "ถามแบบไหน ให้ไพ่ตอบได้ชัด"}
        rows={picks.map((q, i) => {
          const copy = q[isEn ? "en" : "th"];
          const parent = TOPIC_PARENT[q.topic];
          return {
            id: `ask-${q.slug}`,
            kicker: isEn ? parent.en : parent.th,
            title: copy.question,
            body: <p>{copy.description}</p>,
            link: { href: `${isEn ? "/en" : ""}${questionPath(q.slug)}`, label: isEn ? "See how the cards answer" : "ดูว่าไพ่ตอบอย่างไร" },
            mock: (
              <FrMock tint={tints[i % 3]}>
                {i === 1 ? <FrFan cards={copy.example.cards.slice(0, 3).map((c) => c.id)} /> : null}
                <FrInput title={i === 0 ? (isEn ? "What do you want to ask the cards?" : "อยากถามไพ่เรื่องอะไร") : undefined} text={copy.question.split(/[?？]/)[0] + "?"} />
                <FrPanel label={isEn ? "Ask it this way for a clearer answer" : "ถามแบบนี้ได้คำตอบชัดกว่า"}>
                  <FrList boxed={i !== 1} items={copy.betterQuestions.slice(0, i === 1 ? 2 : 3)} />
                </FrPanel>
              </FrMock>
            ),
          };
        })}
      />
    </div>
  );
}

/** หมวดคำถาม = หน้าต่าง · สีกระดาษโน้ตกับสีหมวดชุดเดียวกัน */
function hubSections(isEn: boolean): Ui2ShowcaseSection[] {
  return QUESTION_TOPIC_ORDER.flatMap((topic, topicIndex) => {
    const items = QUESTIONS.filter((q) => q.topic === topic);
    if (items.length === 0) return [];
    const parent = TOPIC_PARENT[topic];
    const tone = ((topicIndex % 7) + 1) as Ui2ShowcaseSection["tone"];
    return [
      {
        id: `topic-${topic}`,
        kicker: parent.en,
        title: isEn ? parent.en : parent.th,
        tone,
        count: items.length,
        meta: isEn ? `${items.length} questions · tap one to see how the cards answer` : `${items.length} คำถาม · แตะเพื่อดูว่าไพ่ตอบเรื่องนี้อย่างไร`,
        aside: (
          <Ui2ShowcaseStarter
            kicker={isEn ? "Spreads for this topic" : "ผังที่เหมาะกับหมวดนี้"}
            name={isEn ? parent.en : parent.th}
            action={<Link href={parent.path}>{isEn ? "See spreads" : "ดูผัง"}</Link>}
          />
        ),
        children: (
          <ul
            className="ui2-qn-wall"
            style={{ "--note": `var(--ui2-note-${tone})`, "--note-ink": `var(--ui2-note-ink-${tone})`, "--note-sub": `var(--ui2-note-sub-${tone})` } as React.CSSProperties}
          >
            {items.map((q) => (
              <li key={q.slug}>
                <Link href={questionPath(q.slug)} className="ui2-qn-note">
                  <span className="ui2-qn-q">{q[isEn ? "en" : "th"].question}</span>
                  <span className="ui2-qn-d">{q[isEn ? "en" : "th"].description}</span>
                </Link>
              </li>
            ))}
          </ul>
        ),
      },
    ];
  });
}
