import type { Metadata } from "next";
import type { ReactNode } from "react";

import { RitualHero } from "@/components/reading/one-card/RitualHero";
import { Ui2Window } from "@/components/ui2/Ui2Showcase";
import { SeoArticleShell, type SeoFaqItem } from "@/components/seo/SeoArticleShell";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";
import { CARD_SUMMARIES } from "@/data/cards/summary";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";
import { ZODIAC_SIGNS } from "@/data/zodiac";
import { ASPECT_TEXT, BODY_TEXT, HOUSE_TEXT, SIGN_TEXT } from "@/data/natal/content";
import { CardImage } from "@/components/card/CardImage";
import { ASPECT_DEFS } from "@/lib/astro/natal";
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
 * ส่งเฉพาะฟิลด์ที่ใช้จริง — ก้อนนี้เป็น prop ของ island ถูกฝังลง HTML (คำสำคัญ 3 คำต่อภาษา ใช้บอกความหมายไพ่หลังพลิก)
 */
export const NATAL_CARDS: NatalCardItem[] = CARD_SUMMARIES.filter(
  (c) => c.arcana === "major" || (c.number >= 2 && c.number <= 10),
).map((c) => {
  const en = CARD_KEYWORDS_EN[c.id];
  // ไม่มีคำสำคัญอังกฤษ = ให้บิลด์ล้ม ไม่ปล่อยไพ่ใบนั้นไปโดยไม่มีความหมาย (กฎถาวร: ห้ามทางถอยเงียบ)
  if (!en) throw new Error(`natal-chart: ไพ่ ${c.id} ไม่มีคำสำคัญภาษาอังกฤษใน keywords-en.ts`);
  return {
    id: c.id,
    nameTh: c.nameTh,
    nameEn: c.nameEn,
    image: c.image,
    kw: { th: c.keywords.upright.slice(0, 3).join(" "), en: en.upright.slice(0, 3).join(", ") },
  };
});

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
    a: "ค่าเริ่มต้นของหน้านี้คือราศีสายนะ (สากล · Tropical) ซึ่งนับราศีตามฤดูกาล ส่วนโหราไทยใช้ราศีนิรายนะที่เลื่อนไปราว 24 องศา ลัคนาจึงอาจต่างกันหนึ่งราศี ถ้าอยากได้แบบไทย เลือก \"นิรายนะ แบบไทย/อินเดีย (Lahiri)\" ในตั้งค่าขั้นสูง ผลจะใกล้เคียงหมอดูไทย แต่อาจต่างได้ราว 1 องศาตามตำราที่ใช้ ไพ่ทาโรต์ 1909 ผูกกับระบบสากล",
  },
  {
    q: "ความแม่นยำของการคำนวณเป็นอย่างไร?",
    a: "ตำแหน่งดาวเคราะห์คลาดไม่เกินครึ่งลิปดาเมื่อเทียบข้อมูลของ NASA JPL (ดวงจันทร์ไม่เกิน 1 ลิปดา) ซึ่งละเอียดกว่าที่แสดงบนผัง ความคลาดที่มากที่สุดมักมาจากเวลาเกิดที่จำได้ไม่ตรง เวลาคลาด 4 นาทีทำให้ลัคนาเลื่อนราว 1 องศา",
  },
  {
    q: "ข้อมูลวันเกิดของฉันถูกเก็บไว้ไหม?",
    a: "ไม่ส่งไปที่ไหน การคำนวณทั้งหมดทำในเบราว์เซอร์ของคุณ วันเวลาและสถานที่เกิดไม่ถูกส่งไปที่เซิร์ฟเวอร์ ถ้าคุณกด \"บันทึกในเครื่องนี้\" ข้อมูลจะเก็บอยู่ในเบราว์เซอร์ของเครื่องนั้นเท่านั้น และลบได้ทุกเมื่อ",
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
    a: "No. Everything is calculated in your browser and your birth date, time and place are never sent to our server. If you press \"Save on this device\", it is stored only in that browser and you can delete it any time.",
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

const LAYERS = [
  { th: "ดาว", en: "Planet", qTh: "เรื่องอะไร", qEn: "what part of you" },
  { th: "ราศี", en: "Sign", qTh: "แสดงออกแบบไหน", qEn: "how it shows" },
  { th: "เรือน", en: "House", qTh: "เกิดในเรื่องไหนของชีวิต", qEn: "where in life" },
  { th: "มุมสัมพันธ์", en: "Aspect", qTh: "ดาวคุยกันแบบไหน", qEn: "how planets talk" },
] as const;

/** สีช่องธาตุเดียวกับวงผัง (`--nt-fire` ฯลฯ ใน v2-natal.css) */
const ELEMENTS = [
  { id: "fire", th: "ธาตุไฟ", en: "Fire", noteTh: "ลงมือ กระตือรือร้น", noteEn: "action and drive" },
  { id: "earth", th: "ธาตุดิน", en: "Earth", noteTh: "จับต้องได้ มั่นคง", noteEn: "practical and steady" },
  { id: "air", th: "ธาตุลม", en: "Air", noteTh: "ความคิด การสื่อสาร", noteEn: "ideas and talk" },
  { id: "water", th: "ธาตุน้ำ", en: "Water", noteTh: "อารมณ์ ความรู้สึก", noteEn: "feelings and intuition" },
] as const;

const TONE_LABEL = {
  harmonious: { th: "ไหลลื่น", en: "flowing" },
  tense: { th: "ตึง", en: "tense" },
  neutral: { th: "หลอมรวม", en: "fusing" },
} as const;

/** ตัวอย่างไพ่สามใบของหนึ่งตำแหน่ง: ดวงอาทิตย์ 15 องศาราศีสิงห์ (ช่วงที่ 2) — ดึงจากข้อมูลจริง ไม่ฮาร์ดโค้ดรหัสไพ่ */
const EXAMPLE_LEO = ZODIAC_SIGNS[4];
const EXAMPLE_CARDS = [
  { roleTh: "ไพ่ประจำดาว", roleEn: "Planet card", whyTh: "ดวงอาทิตย์", whyEn: "the Sun", id: BODY_TEXT.sun.cardId },
  { roleTh: "ไพ่ประจำราศี", roleEn: "Sign card", whyTh: EXAMPLE_LEO.nameTh, whyEn: EXAMPLE_LEO.nameEn, id: EXAMPLE_LEO.majorCardId },
  { roleTh: "ไพ่ประจำช่วงองศา", roleEn: "Decan card", whyTh: "ช่วง 10 ถึง 20 องศา", whyEn: "10 to 20 degrees", id: EXAMPLE_LEO.decans[1].cardId },
].map((x) => {
  const card = CARD_SUMMARIES.find((c) => c.id === x.id);
  if (!card) throw new Error(`natal-chart: ไม่พบไพ่ ${x.id} ในตัวอย่างไพ่สามใบ`);
  return { ...x, card };
});

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
          <section aria-labelledby="natal-howto" className="v2-ng space-y-8">
            <div className="space-y-2 text-center">
              <h2 id="natal-howto" className="text-xl sm:text-2xl font-serif-th font-bold text-ink">
                <ThaiPhrases>{isEnglish ? "Four layers of a birth chart" : "ผังดวงมี 4 ชั้น อ่านทีละชั้น"}</ThaiPhrases>
              </h2>
              <p className="text-sm text-muted max-w-xl mx-auto">
                <ThaiPhrases>
                  {isEnglish
                    ? "Every placement answers four questions. Put the answers together and you have a sentence about your life."
                    : "ทุกตำแหน่งในผังตอบคำถาม 4 ข้อ เอาคำตอบมาต่อกันก็ได้หนึ่งประโยคที่เล่าเรื่องชีวิตคุณ"}
                </ThaiPhrases>
              </p>
            </div>

            <ol className="v2-ng-layers">
              {LAYERS.map((l, i) => (
                <li key={l.th}>
                  <span className="v2-ng-layer-n ui2-num">{i + 1}</span>
                  <span className="v2-ng-layer-t">{isEnglish ? l.en : l.th}</span>
                  <span className="v2-ng-layer-q">{isEnglish ? l.qEn : l.qTh}</span>
                </li>
              ))}
            </ol>

            <figure className="v2-ng-example">
              <figcaption>{isEnglish ? "Try reading one placement" : "ลองอ่านหนึ่งตำแหน่ง"}</figcaption>
              <p className="v2-ng-example-head">{isEnglish ? "Venus in Taurus in the 7th house" : "ดาวศุกร์ ในราศีพฤษภ อยู่เรือน 7"}</p>
              <dl className="v2-ng-example-parts">
                <div>
                  <dt>{isEnglish ? "Planet: what" : "ดาว: เรื่องอะไร"}</dt>
                  <dd>{BODY_TEXT.venus.theme[lang]}</dd>
                </div>
                <div>
                  <dt>{isEnglish ? "Sign: how" : "ราศี: แบบไหน"}</dt>
                  <dd>{SIGN_TEXT[1].keywords[lang]}</dd>
                </div>
                <div>
                  <dt>{isEnglish ? "House: where" : "เรือน: เรื่องไหนของชีวิต"}</dt>
                  <dd>{HOUSE_TEXT[6].arena[lang]}</dd>
                </div>
              </dl>
              <p className="v2-ng-example-sum">
                <ThaiPhrases>
                  {isEnglish
                    ? "Read together: you love steadily and slowly, value comfort and beauty, and this shows most with a long-term partner."
                    : "อ่านรวมกัน: คุณรักแบบค่อยเป็นค่อยไปแต่มั่นคง ชอบความสบายและของสวยงาม และเห็นชัดที่สุดกับคู่ชีวิตหรือคนที่ผูกพันกันยาว ๆ"}
                </ThaiPhrases>
              </p>
            </figure>

            <div className="space-y-3">
              <h3 className="v2-ng-h3">
                <span className="v2-ng-h3-n ui2-num">1</span>
                <ThaiPhrases>{isEnglish ? "Planets: what part of you" : "ดาว: เรื่องอะไร"}</ThaiPhrases>
              </h3>
              <p className="v2-ng-note">
                {isEnglish ? "The short code is the label used on the chart wheel." : "ตัวย่อในกรอบคือชื่อที่ใช้บนวงผัง"}
              </p>
              <ul className="v2-ng-planets">
                {PLANET_KEYS.map((k) => (
                  <li key={k}>
                    <span className="v2-ng-abbr" aria-hidden="true">{BODY_TEXT[k].short[lang]}</span>
                    <span>
                      <span className="v2-ng-term">{BODY_TEXT[k].name[lang]}</span>
                      <span className="v2-ng-def">{BODY_TEXT[k].theme[lang]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="v2-ng-h3">
                <span className="v2-ng-h3-n ui2-num">2</span>
                <ThaiPhrases>{isEnglish ? "Signs: how it shows" : "ราศี: แสดงออกแบบไหน"}</ThaiPhrases>
              </h3>
              <p className="v2-ng-note">
                {isEnglish ? "Grouped by element, in the same colours as the chart wheel." : "แบ่งตามธาตุ สีเดียวกับช่องราศีบนวงผัง"}
              </p>
              <div className="v2-ng-elements">
                {ELEMENTS.map((el) => (
                  <div key={el.id} className={`v2-ng-element is-${el.id}`}>
                    <p className="v2-ng-element-t">
                      {isEnglish ? el.en : el.th} <span>{isEnglish ? el.noteEn : el.noteTh}</span>
                    </p>
                    <ul>
                      {ZODIAC_SIGNS.map((s, i) =>
                        s.element === el.id ? (
                          <li key={s.id}>
                            <span className="v2-ng-term">{isEnglish ? s.nameEn : s.nameTh}</span>
                            <span className="v2-ng-def">{SIGN_TEXT[i].keywords[lang]}</span>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="v2-ng-h3">
                <span className="v2-ng-h3-n ui2-num">3</span>
                <ThaiPhrases>{isEnglish ? "Houses: where in life" : "เรือน: เกิดในเรื่องไหนของชีวิต"}</ThaiPhrases>
              </h3>
              <ol className="v2-ng-houses">
                {HOUSE_TEXT.map((h, i) => (
                  <li key={i}>
                    <span className="v2-ng-house-n ui2-num" aria-hidden="true">{i + 1}</span>
                    <span className="v2-ng-term">
                      <span className="sr-only">{isEnglish ? `House ${i + 1}: ` : `เรือน ${i + 1} `}</span>
                      {h.title[lang]}
                    </span>
                    <span className="v2-ng-def">{h.arena[lang]}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-3">
              <h3 className="v2-ng-h3">
                <span className="v2-ng-h3-n ui2-num">4</span>
                <ThaiPhrases>{isEnglish ? "Aspects: how planets talk" : "มุมสัมพันธ์: ดาวคุยกันแบบไหน"}</ThaiPhrases>
              </h3>
              <p className="v2-ng-note">
                {isEnglish
                  ? "On the wheel, blue lines flow easily and red lines create friction."
                  : "บนวงผัง เส้นสีน้ำเงินคือมุมที่ไหลลื่น เส้นสีแดงคือมุมที่ตึง"}
              </p>
              <ul className="v2-ng-aspects">
                {MAJOR_ASPECTS.map((a) => {
                  const def = ASPECT_DEFS.find((d) => d.type === a);
                  return (
                    <li key={a} className={`is-${def?.tone ?? "neutral"}`}>
                      <span className="v2-ng-deg" aria-hidden="true">
                        <span className="ui2-num">{def?.angle}</span>
                        <span>{isEnglish ? "deg" : "องศา"}</span>
                      </span>
                      <span>
                        <span className="v2-ng-term">
                          {/* ชื่อมุมในข้อมูลมีองศาในวงเล็บ ตัดออกเพราะช่องซ้ายแสดงองศาแล้ว */}
                          {ASPECT_TEXT[a].name[lang].replace(/\s*\(.*\)$/, "")} <span className="v2-ng-tone">{TONE_LABEL[def?.tone ?? "neutral"][lang]}</span>
                        </span>
                        <span className="v2-ng-def">{ASPECT_TEXT[a].meaning[lang]}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </Ui2Window>

        <Ui2Window n="03" kicker={isEnglish ? "By sign" : "รายราศี"} tone={5}>
          <section aria-labelledby="natal-by-sign" className="v2-ng space-y-5">
            <div className="space-y-2 text-center">
              <h2 id="natal-by-sign" className="text-xl sm:text-2xl font-serif-th font-bold text-ink">
                <ThaiPhrases>{isEnglish ? "Rising and Moon signs, sign by sign" : "ลัคนาและดวงจันทร์ ครบ 12 ราศี"}</ThaiPhrases>
              </h2>
              <p className="text-sm text-muted max-w-xl mx-auto">
                <ThaiPhrases>
                  {isEnglish
                    ? "Already know your signs? Open the full reading for your Rising sign or Moon sign."
                    : "รู้ราศีของตัวเองแล้ว เปิดอ่านคำทำนายเต็มของลัคนาหรือราศีจันทร์ได้เลย"}
                </ThaiPhrases>
              </p>
            </div>
            <ul className="v2-ng-signs">
              {ZODIAC_SIGNS.map((s, i) => {
                const signName = isEnglish ? s.nameEn : s.nameTh;
                const el = ELEMENTS.find((e) => e.id === s.element);
                return (
                  <li key={s.id} className={`v2-ng-sign is-${s.element}`}>
                    <p className="v2-ng-sign-name">{signName}</p>
                    <p className="v2-ng-sign-meta">
                      {isEnglish ? el?.en : el?.th}
                      <span>{SIGN_TEXT[i].keywords[lang]}</span>
                    </p>
                    <div className="v2-ng-sign-links">
                      <Link href={localeHref(`/natal-chart/rising/${s.id}`, locale)}>
                        {isEnglish ? (
                          <>
                            <span className="sr-only">{signName} </span>Rising
                          </>
                        ) : (
                          <>
                            ลัคนา<span className="sr-only">{signName}</span>
                          </>
                        )}
                      </Link>
                      <Link href={localeHref(`/natal-chart/moon/${s.id}`, locale)}>
                        {isEnglish ? (
                          <>
                            Moon<span className="sr-only"> in {signName}</span>
                          </>
                        ) : (
                          <>
                            จันทร์<span className="sr-only">{signName}</span>
                          </>
                        )}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
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
          <div className="v2-ng space-y-6">
            <p className="text-sm sm:text-base text-ink leading-relaxed">
              {isEnglish
                ? "The 1909 Rider-Waite deck was designed by members of the Hermetic Order of the Golden Dawn, who assigned every Major Arcana card to a planet or zodiac sign and every numbered Minor Arcana card (2 to 10) to a ten-degree slice of the zodiac called a decan. Because of this, any point in your birth chart can be read as a tarot card."
                : "ไพ่ทาโรต์ 1909 Rider-Waite ออกแบบโดยสมาชิกสมาคม Golden Dawn ซึ่งผูกไพ่ชุดใหญ่ทุกใบเข้ากับดาวหรือราศี และผูกไพ่เลข 2 ถึง 10 ของไพ่ชุดเล็กเข้ากับช่วงละ 10 องศาของจักรราศี (Decan) จุดใดก็ตามในผังดวงของคุณจึงอ่านเป็นไพ่ทาโรต์ได้"}
            </p>
            <figure className="v2-ng-trio">
              <figcaption>
                <span className="v2-ng-trio-k">{isEnglish ? "Example" : "ตัวอย่าง"}</span>
                {isEnglish ? "Sun at 15 degrees Leo gives three cards" : "ดวงอาทิตย์อยู่ 15 องศาราศีสิงห์ ได้ไพ่สามใบ"}
              </figcaption>
              <ol>
                {EXAMPLE_CARDS.map((x) => (
                  <li key={x.id}>
                    <CardImage image={x.card.image} cardId={x.card.id} alt={isEnglish ? x.card.nameEn : x.card.nameTh} sizes="(min-width: 640px) 112px, 84px" loading="lazy" className="v2-ng-trio-img" />
                    <span className="v2-ng-trio-role">{isEnglish ? x.roleEn : x.roleTh}</span>
                    <span className="v2-ng-trio-name">{isEnglish ? x.card.nameEn : x.card.nameTh}</span>
                    <span className="v2-ng-trio-why">{isEnglish ? `from ${x.whyEn}` : `มาจาก${x.whyTh}`}</span>
                  </li>
                ))}
              </ol>
            </figure>
            <p className="text-sm sm:text-base text-ink leading-relaxed">
              {isEnglish
                ? "The calculator shows these three cards for every placement in your chart. Your Sun, Moon and Ascendant cards are the most personal, so they appear face down first for you to turn over."
                : "เครื่องคำนวณด้านบนแสดงไพ่สามใบแบบนี้ให้ทุกตำแหน่งในผังของคุณ ไพ่ของดวงอาทิตย์ ดวงจันทร์ และลัคนาเป็นไพ่ที่บอกตัวคุณมากที่สุด จึงคว่ำไว้ให้คุณพลิกเอง"}
            </p>
          </div>
        </SeoArticleShell>
      </div>
      <Ui2NextSteps isEn={isEnglish} keys={["spreads", "daily", "journal", "cards"]} />
    </main>
  );
}
