import type { Metadata } from "next";
import type { ReactNode } from "react";

import { RitualHero } from "@/components/reading/one-card/RitualHero";
import { Ui2Window } from "@/components/ui2/Ui2Showcase";
import { SeoArticleShell, type SeoFaqItem } from "@/components/seo/SeoArticleShell";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";
import { CARD_SUMMARIES } from "@/data/cards/summary";
import { ZODIAC_SIGNS } from "@/data/zodiac";
import { ASPECT_TEXT, BODY_TEXT, HOUSE_TEXT, SIGN_TEXT } from "@/data/natal/content";
import { clampDescription, pickTitle } from "@/lib/config/meta-length";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { localeHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/types";
import type { NatalCardItem } from "@/components/natal/NatalChartApp";

import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";

/**
 * 🪐 ผังดวงกำเนิด (Natal Chart) — `/natal-chart` และ `/en/natal-chart`
 * ---------------------------------------------------------------------------
 * หน้านี้เป็น HTML คงที่ (Astro) · เครื่องคำนวณเป็น island (`NatalChartRoot`) ที่โหลดตัวคำนวณดาว
 * แบบ dynamic import ตอนผู้ใช้กด "สร้างผังดวง" เท่านั้น — วันเวลาสถานที่เกิดไม่ออกจากเครื่องผู้ใช้
 * แผนงาน: docs/plans/NATAL_CHART_PLAN_2026-10-27.md
 */

export const NATAL_PATH = "/natal-chart";

/**
 * ไพ่ที่ผังดวงใช้: ไพ่ชุดใหญ่ 22 ใบ (ไพ่ประจำดาว/ราศี) + ไพ่เลข 2–10 ทั้ง 4 ชุด (ไพ่ประจำช่วง 10 องศา)
 * ส่งเฉพาะฟิลด์ที่ใช้จริง — ก้อนนี้เป็น prop ของ island ถูกฝังลง HTML
 */
export const NATAL_CARDS: NatalCardItem[] = CARD_SUMMARIES.filter(
  (c) => c.arcana === "major" || (c.number >= 2 && c.number <= 10),
).map((c) => ({ id: c.id, nameTh: c.nameTh, nameEn: c.nameEn, image: c.image }));

export function natalChartMetadata(locale: Locale): Metadata {
  const isEnglish = locale === "en";
  const title = isEnglish
    ? pickTitle(["Free Natal Chart Calculator with Tarot Cards", "Free Natal Chart Calculator"])
    : pickTitle(["ผังดวงกำเนิด คำนวณลัคนา ดาว 10 ดวง เรือนชะตา ฟรี พร้อมไพ่ทาโรต์", "ผังดวงกำเนิด คำนวณลัคนา ฟรี"]);
  const description = isEnglish
    ? clampDescription(
        "Calculate your birth chart free: Sun, Moon, Ascendant, all planets, Chiron, nodes and Lilith, seven house systems, aspects, chart patterns and a tarot card for every placement. Accurate to NASA data and calculated privately in your browser.",
      )
    : clampDescription(
        "คำนวณผังดวงกำเนิดฟรี รู้ลัคนา ราศีจันทร์ ตำแหน่งดาว 10 ดวง ไครอน ราหู ลิลิธ เรือนชะตา 7 ระบบ มุมสัมพันธ์ และไพ่ทาโรต์ประจำแต่ละดาว ความแม่นเทียบข้อมูล NASA คำนวณในเครื่องคุณ ไม่ส่งข้อมูลวันเกิดออกไปไหน",
      );
  const ogImages = buildPageOgImage({
    title: isEnglish ? "Natal Chart Calculator" : "ผังดวงกำเนิด",
    eyebrow: isEnglish ? "ASTROLOGY × TAROT" : "โหราศาสตร์ × ไพ่ทาโรต์",
    cardImage: "major-17.jpg",
    alt: isEnglish ? "Natal chart calculator with tarot cards" : "ผังดวงกำเนิดพร้อมไพ่ทาโรต์",
  });
  return {
    title,
    description,
    keywords: isEnglish
      ? ["natal chart calculator", "birth chart", "free birth chart", "rising sign calculator", "moon sign", "astrology chart with houses", "tarot astrology"]
      : ["ผังดวงกำเนิด", "คำนวณลัคนา", "ลัคนาราศีอะไร", "ดวงกำเนิด", "ราศีจันทร์", "เรือนชะตา", "natal chart", "birth chart ภาษาไทย"],
    alternates: buildAlternates(NATAL_PATH, { locale, englishTwin: true }),
    openGraph: {
      title,
      description,
      url: localizedUrl(NATAL_PATH, locale),
      siteName: "SeerTarot",
      type: "website",
      locale: isEnglish ? "en_US" : "th_TH",
      images: ogImages,
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImages[0].url] },
  };
}

const FAQ_TH: SeoFaqItem[] = [
  {
    q: "ผังดวงกำเนิดคืออะไร ต่างจากราศีเกิดยังไง?",
    a: "ราศีเกิดที่คนส่วนใหญ่รู้คือราศีของดวงอาทิตย์เพียงดวงเดียว ผังดวงกำเนิดคือภาพท้องฟ้าทั้งหมด ณ นาทีที่คุณเกิด บอกว่าดาวทุกดวงอยู่ราศีไหน เรือนไหน และทำมุมกันอย่างไร จึงละเอียดกว่ามาก",
  },
  {
    q: "ไม่รู้เวลาเกิด คำนวณได้ไหม?",
    a: "ได้ ระบบจะคำนวณตอนเที่ยงวันและบอกตรง ๆ ว่าส่วนไหนเชื่อได้ ตำแหน่งดาวส่วนใหญ่ยังถูกต้อง แต่จะไม่มีลัคนา เรือนชะตา และจุดที่ขึ้นกับเวลา ส่วนดวงจันทร์ระบบจะบอกช่วงที่เดินในวันนั้นให้ ถ้าดาวดวงไหนย้ายราศีในวันเกิด ระบบจะเตือน",
  },
  {
    q: "ลัคนาในหน้านี้ตรงกับลัคนาแบบโหราไทยไหม?",
    a: "ไม่ตรงเสมอไป หน้านี้ใช้โหราศาสตร์สากล (Tropical) ซึ่งนับราศีตามฤดูกาล ส่วนโหราไทยใช้ระบบสุริยยาตร์ (Sidereal) ที่เลื่อนไปราว 24 องศา ลัคนาจึงอาจต่างกันหนึ่งราศี ทั้งสองแบบถูกต้องตามระบบของตัวเอง ไพ่ทาโรต์ 1909 ผูกกับระบบสากล",
  },
  {
    q: "ความแม่นยำของการคำนวณเป็นอย่างไร?",
    a: "ตำแหน่งดาวเคราะห์คลาดไม่เกินครึ่งลิปดาเมื่อเทียบข้อมูลของ NASA JPL (ดวงจันทร์ไม่เกิน 1 ลิปดา) ซึ่งละเอียดกว่าที่แสดงบนผัง ความคลาดที่มากที่สุดมักมาจากเวลาเกิดที่จำได้ไม่ตรง เวลาคลาด 4 นาทีทำให้ลัคนาเลื่อนราว 1 องศา",
  },
  {
    q: "ข้อมูลวันเกิดของฉันถูกเก็บไว้ไหม?",
    a: "ไม่ส่งไปที่ไหน การคำนวณทั้งหมดทำในเบราว์เซอร์ของคุณ วันเวลาและสถานที่เกิดไม่ถูกส่งไปที่เซิร์ฟเวอร์ ถ้าคุณกด \"บันทึกผังนี้ไว้ในเครื่องนี้\" ข้อมูลจะเก็บอยู่ในเบราว์เซอร์ของเครื่องนั้นเท่านั้น และลบได้ทุกเมื่อ",
  },
  {
    q: "ควรเลือกระบบเรือนแบบไหน?",
    a: "ถ้าไม่แน่ใจให้ใช้ Placidus ซึ่งเป็นค่าเริ่มต้นของเว็บโหราสากลส่วนใหญ่ ถ้าคุ้นกับการนับภพแบบโหราไทยลองใช้ Whole Sign (หนึ่งราศีหนึ่งเรือน) ระบบเรือนเปลี่ยนแค่เรือนที่ดาวอยู่ ไม่เปลี่ยนราศีของดาว",
  },
];

const FAQ_EN: SeoFaqItem[] = [
  {
    q: "What is a natal chart?",
    a: "Your star sign is only the Sun's position. A natal chart is a map of the whole sky at the minute you were born: which sign and house every planet occupies and the angles they make to each other.",
  },
  {
    q: "Can I make a chart without my birth time?",
    a: "Yes. The chart is calculated for noon and clearly marks what is reliable. Most planet signs stay accurate, but the Ascendant, houses and time-sensitive points are left out, and the Moon's possible range for the day is shown.",
  },
  {
    q: "How accurate is it?",
    a: "Planet positions agree with NASA JPL data to within half an arcminute (the Moon within one arcminute), finer than the chart displays. The biggest source of error is usually the remembered birth time: four minutes moves the Ascendant about one degree.",
  },
  {
    q: "Is my birth data stored?",
    a: "No. Everything is calculated in your browser and your birth date, time and place are never sent to our server. If you press \"Save this chart on this device\", it is stored only in that browser and you can delete it any time.",
  },
  {
    q: "Which house system should I choose?",
    a: "If unsure, use Placidus, the default on most astrology sites. Whole Sign is the oldest system and popular in traditional astrology. Changing the house system only moves planets between houses, never between signs.",
  },
];

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />;
}

const PLANET_KEYS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "node", "lilith", "asc"] as const;
const MAJOR_ASPECTS = ["conjunction", "sextile", "square", "trine", "opposition"] as const;

export function NatalChartBody({ locale, app }: { locale: Locale; app: ReactNode }) {
  const isEnglish = locale === "en";
  const lang = isEnglish ? "en" : "th";
  const faqs = isEnglish ? FAQ_EN : FAQ_TH;
  const breadcrumbs = isEnglish
    ? [{ label: "Home", href: "/" }, { label: "Zodiac Tarot Cards", href: "/cards/zodiac" }, { label: "Natal Chart" }]
    : [{ label: "หน้าแรก", href: "/" }, { label: "ไพ่ประจำราศี", href: "/cards/zodiac" }, { label: "ผังดวงกำเนิด" }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    homeCrumb(locale),
    { name: isEnglish ? "Zodiac Tarot Cards" : "ไพ่ประจำราศี", path: "/cards/zodiac" },
    { name: isEnglish ? "Natal Chart" : "ผังดวงกำเนิด", path: NATAL_PATH },
  ]);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  // A6-02: ใช้ WebPage ไม่ใช่ WebApplication (ไม่มีเรตติ้งจริง ห้ามกุ)
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: isEnglish ? "Natal Chart Calculator" : "เครื่องคำนวณผังดวงกำเนิด",
    description: isEnglish
      ? "Free natal chart calculator with houses, aspects and tarot correspondences, calculated in your browser."
      : "คำนวณผังดวงกำเนิดฟรี พร้อมเรือนชะตา มุมสัมพันธ์ และไพ่ทาโรต์ประจำตำแหน่ง คำนวณในเบราว์เซอร์ของคุณ",
    url: localizedUrl(NATAL_PATH, locale),
    inLanguage: isEnglish ? "en" : "th",
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink py-6 sm:py-10 px-4 sm:px-6 font-sans relative overflow-x-clip">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={appJsonLd} />
      <div className="max-w-5xl mx-auto space-y-10">
        <RitualHero
          tone="star"
          breadcrumbs={breadcrumbs}
          badgeText={isEnglish ? "Astrology × Tarot" : "โหราศาสตร์ × ไพ่ทาโรต์"}
          trust={isEnglish ? ["Checked against NASA data", "Private: calculated on your device"] : ["ความแม่นเทียบข้อมูล NASA", "คำนวณในเครื่องคุณ ไม่ส่งข้อมูลออก"]}
          title={isEnglish ? "Natal Chart Calculator" : "ผังดวงกำเนิด"}
          accent={isEnglish ? "Natal Chart" : "ดวงกำเนิด"}
          tagline={
            isEnglish
              ? "The whole sky at the minute you were born: every planet, sign, house and aspect, plus the tarot cards behind each placement."
              : "ท้องฟ้าทั้งหมด ณ นาทีที่คุณเกิด รู้ลัคนา ราศีของดาวทุกดวง เรือนชะตา มุมสัมพันธ์ และไพ่ทาโรต์ประจำแต่ละตำแหน่ง"
          }
        />

        <Ui2Window n="01" kicker={isEnglish ? "Your chart" : "สร้างผังดวง"} tone={7}>
          <div id="natal-app">{app}</div>
        </Ui2Window>

        <Ui2Window n="02" kicker={isEnglish ? "How to read it" : "อ่านผังยังไง"} tone={4}>
          <section aria-labelledby="natal-howto" className="space-y-6">
            <h2 id="natal-howto" className="text-xl sm:text-2xl font-serif-th font-bold text-ink text-center">
              <ThaiPhrases>{isEnglish ? "Four layers of a birth chart" : "ผังดวงมี 4 ชั้น อ่านทีละชั้น"}</ThaiPhrases>
            </h2>
            <div className="grid gap-4 md:grid-cols-2 text-sm leading-relaxed">
              <div className="altar-card-porcelain rounded-xl p-4 space-y-2">
                <h3 className="font-serif-th font-bold text-ink"><ThaiPhrases>{isEnglish ? "1. Planets: what" : "1. ดาว: เรื่องอะไร"}</ThaiPhrases></h3>
                <ul className="space-y-1.5 text-muted">
                  {PLANET_KEYS.map((k) => (
                    <li key={k} className="border-l-2 border-line-warm pl-2">
                      <span className="font-semibold text-ink">{BODY_TEXT[k].name[lang]}</span> {BODY_TEXT[k].theme[lang]}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="altar-card-porcelain rounded-xl p-4 space-y-2">
                <h3 className="font-serif-th font-bold text-ink"><ThaiPhrases>{isEnglish ? "2. Signs: how" : "2. ราศี: แสดงออกแบบไหน"}</ThaiPhrases></h3>
                <ul className="space-y-1.5 text-muted">
                  {ZODIAC_SIGNS.map((s, i) => (
                    <li key={s.id} className="border-l-2 border-line-warm pl-2">
                      <span className="font-semibold text-ink">{isEnglish ? s.nameEn : s.nameTh}</span> {SIGN_TEXT[i].keywords[lang]}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="altar-card-porcelain rounded-xl p-4 space-y-2">
                <h3 className="font-serif-th font-bold text-ink"><ThaiPhrases>{isEnglish ? "3. Houses: where in life" : "3. เรือน: เกิดในเรื่องไหนของชีวิต"}</ThaiPhrases></h3>
                <ol className="space-y-1.5 text-muted">
                  {HOUSE_TEXT.map((h, i) => (
                    <li key={i} className="border-l-2 border-line-warm pl-2">
                      <span className="font-semibold text-ink">{isEnglish ? `House ${i + 1}` : `เรือน ${i + 1}`}</span> {h.arena[lang]}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="altar-card-porcelain rounded-xl p-4 space-y-2">
                <h3 className="font-serif-th font-bold text-ink"><ThaiPhrases>{isEnglish ? "4. Aspects: how they talk" : "4. มุมสัมพันธ์: ดาวคุยกันแบบไหน"}</ThaiPhrases></h3>
                <ul className="space-y-1.5 text-muted">
                  {MAJOR_ASPECTS.map((a) => (
                    <li key={a} className="border-l-2 border-line-warm pl-2">
                      <span className="font-semibold text-ink">{ASPECT_TEXT[a].name[lang]}</span> {ASPECT_TEXT[a].meaning[lang]}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </Ui2Window>

        <Ui2Window n="03" kicker={isEnglish ? "By sign" : "รายราศี"} tone={5}>
          <section aria-labelledby="natal-by-sign" className="space-y-4">
            <h2 id="natal-by-sign" className="text-xl sm:text-2xl font-serif-th font-bold text-ink text-center">
              <ThaiPhrases>{isEnglish ? "Rising and Moon signs, sign by sign" : "ลัคนาและดวงจันทร์ ครบ 12 ราศี"}</ThaiPhrases>
            </h2>
            {(["rising", "moon"] as const).map((kind) => (
              <div key={kind} className="space-y-2">
                <h3 className="font-serif-th font-bold text-ink text-center">
                  {kind === "rising" ? (isEnglish ? "Rising sign (Ascendant)" : "ลัคนา") : isEnglish ? "Moon sign" : "ราศีจันทร์"}
                </h3>
                <ul className="flex flex-wrap justify-center gap-2">
                  {ZODIAC_SIGNS.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={localeHref(`/natal-chart/${kind}/${s.id}`, locale)}
                        className="inline-block rounded-full border border-line-warm bg-surface px-3 py-1.5 text-sm text-ink hover:border-gold-ink"
                      >
                        {kind === "rising" ? (isEnglish ? `${s.nameEn} Rising` : `ลัคนา${s.nameTh}`) : isEnglish ? `Moon in ${s.nameEn}` : `จันทร์${s.nameTh}`}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </Ui2Window>

        <SeoArticleShell
          eyebrow={isEnglish ? "Astrology and tarot" : "โหราศาสตร์กับไพ่ทาโรต์"}
          title={isEnglish ? "How the tarot connects to your birth chart" : "ไพ่ทาโรต์เชื่อมกับผังดวงกำเนิดยังไง"}
          faqs={faqs}
          links={(
            isEnglish
              ? [
                  { label: "Zodiac tarot cards", href: "/cards/zodiac" },
                  { label: "Tarot birth card", href: "/cards/birth-card" },
                  { label: "Daily tarot", href: "/daily" },
                  { label: "All 78 cards", href: "/cards" },
                ]
              : [
                  { label: "ไพ่ประจำราศี 12 ราศี", href: "/cards/zodiac" },
                  { label: "คำนวณไพ่ประจำตัว", href: "/cards/birth-card" },
                  { label: "ไพ่ประจำวัน", href: "/daily" },
                  { label: "สารานุกรมไพ่ 78 ใบ", href: "/cards" },
                ]
          ).map((l) => ({ ...l, href: localeHref(l.href, locale) }))}
        >
          <div className="space-y-4 text-xs sm:text-sm text-muted font-sans leading-relaxed">
            {isEnglish ? (
              <>
                <p>
                  The 1909 Rider-Waite deck was designed by members of the Hermetic Order of the Golden Dawn, who assigned every Major Arcana card to a
                  planet or zodiac sign and every numbered Minor Arcana card (2 to 10) to a ten-degree slice of the zodiac called a decan. Because of
                  this, any point in your birth chart can be read as a tarot card.
                </p>
                <p>
                  This calculator shows three cards for each placement: the card of the planet, the card of the sign it sits in, and the decan card for
                  its exact degree. Your Sun, Moon and Ascendant cards are the most personal, so they appear face down first for you to turn over.
                </p>
              </>
            ) : (
              <>
                <p>
                  ไพ่ทาโรต์ 1909 Rider-Waite ออกแบบโดยสมาชิกสมาคม Golden Dawn ซึ่งผูกไพ่ชุดใหญ่ทุกใบเข้ากับดาวหรือราศี และผูกไพ่เลข 2 ถึง 10
                  ของไพ่ชุดเล็กเข้ากับช่วงละ 10 องศาของจักรราศี (Decan) จุดใดก็ตามในผังดวงของคุณจึงอ่านเป็นไพ่ทาโรต์ได้
                </p>
                <p>
                  เครื่องคำนวณนี้แสดงไพ่สามใบต่อหนึ่งตำแหน่ง คือไพ่ประจำดาว ไพ่ประจำราศีที่ดาวอยู่ และไพ่ประจำช่วงองศาที่ดาวอยู่พอดี
                  ไพ่ของดวงอาทิตย์ ดวงจันทร์ และลัคนาเป็นไพ่ที่บอกตัวคุณมากที่สุด จึงคว่ำไว้ให้คุณพลิกเอง
                </p>
              </>
            )}
          </div>
        </SeoArticleShell>
      </div>
      <Ui2NextSteps isEn={isEnglish} keys={["spreads", "daily", "journal", "cards"]} />
    </main>
  );
}
