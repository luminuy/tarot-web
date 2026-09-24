import type { Metadata } from "next";
import type { ReactNode } from "react";

import { RitualHero } from "@/components/reading/one-card/RitualHero";
import { SeoArticleShell, type SeoFaqItem } from "@/components/seo/SeoArticleShell";
import { CardImage } from "@/components/card/CardImage";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { ZodiacFinderItem } from "@/components/encyclopedia/ZodiacFinder";
import { CARD_SUMMARIES, type CardSummary } from "@/data/cards/summary";
import {
  ZODIAC_ELEMENT_LABEL,
  ZODIAC_MODALITY_LABEL,
  ZODIAC_SIGNS,
  getZodiacSign,
  type ZodiacSign,
} from "@/data/zodiac";
import { clampDescription, pickTitle } from "@/lib/config/meta-length";
import { buildAlternates, localizedUrl, noindexAlternates } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { decanRanges, formatMonthDay, ZODIAC_INDEX_PATH, zodiacSignPath } from "@/lib/tarot/zodiac";
import { localeHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";

/**
 * ✦ ไพ่ทาโรต์ × 12 ราศี — `/cards/zodiac` และ `/cards/zodiac/<ราศี>` (สองภาษา)
 * ข้อมูลทั้งหมดมาจาก `src/data/zodiac.ts` · ไฟล์ `.astro` แค่เรียกฟังก์ชันในไฟล์นี้
 */

const INDEX_PATH = ZODIAC_INDEX_PATH;
const cardById = new Map(CARD_SUMMARIES.map((c) => [c.id, c]));

/** กฎข้อ 14: รหัสไพ่ที่หาไม่เจอ = ข้อมูลเสีย ต้องล้มตอนบิลด์ ห้ามเดาไพ่ใบอื่นมาแทน */
function card(id: string): CardSummary {
  const found = cardById.get(id);
  if (!found) throw new Error(`zodiac: ไม่พบไพ่ "${id}" ในสำรับ — ตรวจ src/data/zodiac.ts`);
  return found;
}

const RANGES = decanRanges(ZODIAC_SIGNS);

function signRange(sign: ZodiacSign, isEnglish: boolean): string {
  const r = RANGES.get(sign.id);
  if (!r) return "";
  return `${formatMonthDay(r[0].start, isEnglish)} – ${formatMonthDay(r[2].end, isEnglish)}`;
}

export function zodiacStaticParams() {
  return ZODIAC_SIGNS.map((s) => ({ sign: s.id }));
}

/** ข้อมูลแบบย่อสำหรับ island หาราศี — ห้ามใส่คำอธิบายราศีลงไป (ดูคำเตือนใน ZodiacFinder) */
export const ZODIAC_FINDER_ITEMS: ZodiacFinderItem[] = ZODIAC_SIGNS.map((s) => {
  const slim = (id: string) => {
    const c = card(id);
    return { id: c.id, image: c.image, nameTh: c.nameTh, nameEn: c.nameEn };
  };
  return {
    id: s.id,
    nameTh: s.nameTh,
    nameEn: s.nameEn,
    major: slim(s.majorCardId),
    decans: s.decans.map((d) => ({ start: d.start, card: slim(d.cardId) })),
  };
});

/* ───────────────────────── metadata ───────────────────────── */

export function zodiacIndexMetadata(locale: Locale): Metadata {
  const isEnglish = locale === "en";
  const title = isEnglish
    ? pickTitle(["Zodiac Tarot Cards: Your Sign's Tarot Card & Decan", "Zodiac Tarot Cards for All 12 Signs"])
    : pickTitle(["ไพ่ยิปซีประจำราศี 12 ราศี — หาไพ่ทาโรต์ประจำวันเกิด", "ไพ่ประจำราศี 12 ราศี"]);
  const description = isEnglish
    ? clampDescription(
        "Find the tarot card for your zodiac sign, your ruling planet's card and the Minor Arcana card of your birth decan, using the Golden Dawn system behind the 1909 Rider-Waite deck.",
      )
    : clampDescription(
        "หาไพ่ยิปซีประจำราศีของคุณจากวันเกิด พร้อมไพ่ดาวผู้ครองราศีและไพ่ประจำช่วงวันเกิด ตามระบบ Golden Dawn ต้นแบบของไพ่ 1909 Rider-Waite ครบ 12 ราศี ฟรี",
      );
  const ogImages = buildPageOgImage({
    title: isEnglish ? "Zodiac Tarot Cards" : "ไพ่ประจำราศี 12 ราศี",
    eyebrow: isEnglish ? "TAROT × ASTROLOGY" : "ไพ่ทาโรต์ × โหราศาสตร์",
    cardImage: "major-17.jpg",
    alt: isEnglish ? "Zodiac tarot cards, 1909 Rider-Waite" : "ไพ่ประจำราศี 1909 Rider-Waite",
  });
  return {
    title,
    description,
    keywords: isEnglish
      ? ["zodiac tarot cards", "tarot card for my zodiac sign", "tarot astrology", "decan tarot cards", "golden dawn tarot correspondences"]
      : ["ไพ่ประจำราศี", "ไพ่ยิปซีประจำราศี", "ไพ่ทาโรต์ประจำราศี", "ไพ่ทาโรต์ 12 ราศี", "ดูดวงไพ่ยิปซีตามราศี", "ไพ่ทาโรต์กับโหราศาสตร์"],
    alternates: buildAlternates(INDEX_PATH, { locale, englishTwin: true }),
    openGraph: {
      title,
      description,
      url: localizedUrl(INDEX_PATH, locale),
      siteName: "SeerTarot",
      type: "website",
      locale: isEnglish ? "en_US" : "th_TH",
      images: ogImages,
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImages[0].url] },
  };
}

export function zodiacSignMetadata(id: string, locale: Locale): Metadata {
  const sign = getZodiacSign(id);
  const isEnglish = locale === "en";
  if (!sign) {
    return {
      title: isEnglish ? "Zodiac sign not found" : "ไม่พบราศี",
      robots: { index: false, follow: true },
      alternates: noindexAlternates(),
    };
  }
  const path = zodiacSignPath(sign.id);
  const major = card(sign.majorCardId);
  const title = isEnglish
    ? pickTitle([
        `${sign.nameEn} Tarot Card: ${major.nameEn} & Decan Cards`,
        `${sign.nameEn} Tarot Card: ${major.nameEn}`,
      ])
    : pickTitle([
        `ไพ่ประจำ${sign.nameTh} — ${major.nameEn} (${major.nameTh}) และไพ่ประจำช่วงวันเกิด`,
        `ไพ่ประจำ${sign.nameTh} — ${major.nameEn} (${major.nameTh})`,
        `ไพ่ประจำ${sign.nameTh}`,
      ]);
  const description = isEnglish
    ? clampDescription(`${sign.en.tagline} ${sign.nameEn} (${signRange(sign, true)}) is ruled by ${major.nameEn}.`, "Personality, love, work and the three decan cards.")
    : clampDescription(`${sign.th.tagline} ${sign.nameTh} (${signRange(sign, false)}) มีไพ่ประจำราศีคือ ${major.nameEn}`, "พร้อมนิสัย ความรัก การงาน และไพ่ 3 ช่วงวันเกิด");
  const ogImages = buildPageOgImage({
    title: isEnglish ? `${sign.nameEn} · ${major.nameEn}` : `${sign.nameTh} · ${major.nameEn}`,
    eyebrow: isEnglish ? "ZODIAC TAROT CARD" : "ไพ่ประจำราศี",
    cardImage: major.image,
    alt: isEnglish ? `${sign.nameEn} tarot card: ${major.nameEn}` : `ไพ่ประจำ${sign.nameTh}: ${major.nameEn}`,
  });
  return {
    title,
    description,
    keywords: isEnglish
      ? [`${sign.nameEn} tarot card`, `${sign.nameEn} tarot`, `${major.nameEn} ${sign.nameEn}`, `${sign.nameEn} decan tarot`]
      : [`ไพ่ประจำ${sign.nameTh}`, `ไพ่ยิปซี${sign.nameTh}`, `${sign.nameTh} ไพ่ทาโรต์`, `ดูดวง${sign.nameTh}`, `${sign.nameTh} นิสัย`],
    alternates: buildAlternates(path, { locale, englishTwin: true }),
    openGraph: {
      title,
      description,
      url: localizedUrl(path, locale),
      siteName: "SeerTarot",
      type: "article",
      locale: isEnglish ? "en_US" : "th_TH",
      images: ogImages,
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImages[0].url] },
  };
}

/* ───────────────────────── ชิ้นส่วนร่วม ───────────────────────── */

function CardTile({
  id,
  label,
  note,
  isEnglish,
  size = "md",
}: {
  id: string;
  label: string;
  note?: string;
  isEnglish: boolean;
  size?: "md" | "lg";
}) {
  const c = card(id);
  const name = isEnglish ? c.nameEn : `${c.nameTh} (${c.nameEn})`;
  const width = size === "lg" ? "w-[150px] sm:w-[180px]" : "w-[104px] sm:w-[120px]";
  return (
    <Link href={`/cards/${c.id}`} className="group flex flex-col items-center text-center gap-2">
      <span className="text-xs font-serif-th font-semibold text-gold-ink">{label}</span>
      <CardImage
        image={c.image}
        cardId={c.id}
        alt={name}
        sizes={size === "lg" ? "(min-width: 640px) 180px, 150px" : "(min-width: 640px) 120px, 104px"}
        className={`${width} aspect-[1/1.7] rounded-lg border border-line-warm shadow-xs object-cover`}
      />
      <span className="text-xs sm:text-sm font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors">
        {name}
      </span>
      {note && <span className="text-[13px] text-muted font-sans">{note}</span>}
    </Link>
  );
}

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />;
}

/* ───────────────────────── หน้ารวม /cards/zodiac ───────────────────────── */

const INDEX_FAQ_TH: SeoFaqItem[] = [
  {
    q: "ไพ่ประจำราศีคืออะไร?",
    a: "คือไพ่ทาโรต์ที่ผูกกับราศีเกิดของคุณตามระบบ Golden Dawn ซึ่งเป็นระบบที่ผู้สร้างไพ่ 1909 Rider-Waite ใช้ออกแบบสำรับ แต่ละราศีมีไพ่ชุดใหญ่ประจำราศี 1 ใบ ไพ่ของดาวผู้ครองราศี 1 ใบ และไพ่ชุดเล็กประจำช่วงวันเกิดอีก 3 ใบ",
  },
  {
    q: "ทำไมราศีในหน้านี้ไม่ตรงกับราศีที่เคยรู้?",
    a: "หน้านี้ใช้ราศีแบบสากล (Tropical) ที่อิงฤดูกาล เช่น ราศีเมษเริ่ม 21 มีนาคม ส่วนโหราศาสตร์ไทยใช้ราศีตามตำแหน่งดาวจริง (Sidereal) ซึ่งเลื่อนไปราว 24 วัน เช่น ราศีเมษแบบไทยเริ่มราว 13–14 เมษายน ไพ่ทาโรต์ถูกออกแบบคู่กับระบบสากล จึงควรใช้ราศีแบบสากลเมื่อดูไพ่ประจำราศี",
  },
  {
    q: "ไพ่ประจำช่วงวันเกิด (Decan) คืออะไร?",
    a: "แต่ละราศีแบ่งเป็น 3 ช่วง ช่วงละประมาณ 10 วัน แต่ละช่วงมีไพ่ชุดเล็กหมายเลข 2–10 ประจำอยู่หนึ่งใบ ทำให้คนราศีเดียวกันที่เกิดคนละช่วงมีรายละเอียดของพลังต่างกัน รวมทั้งหมด 36 ใบ",
  },
  {
    q: "ใช้ไพ่ประจำราศีอย่างไรดี?",
    a: "ใช้เป็นกระจกสะท้อนตัวเอง ไม่ใช่คำทำนายตายตัว เมื่อไพ่ประจำราศีของคุณโผล่มาในการเปิดไพ่ ให้อ่านว่าเป็นเรื่องที่เกี่ยวกับตัวตนของคุณโดยตรง หรือใช้ภาพไพ่เป็นจุดรวมสมาธิเมื่อต้องการพลังแบบราศีของตัวเอง",
  },
];

const INDEX_FAQ_EN: SeoFaqItem[] = [
  {
    q: "What is a zodiac tarot card?",
    a: "It is the tarot card linked to your sun sign in the Golden Dawn system, the system the creators of the 1909 Rider-Waite deck used. Each sign has one Major Arcana sign card, one card for its ruling planet, and three Minor Arcana decan cards.",
  },
  {
    q: "Why is my sign different from Thai astrology?",
    a: "This page uses the tropical zodiac, tied to the seasons (Aries starts March 21). Thai astrology uses the sidereal zodiac, which sits about 24 days later. Tarot was designed alongside the tropical system, so use your tropical sign for tarot correspondences.",
  },
  {
    q: "What is a decan card?",
    a: "Each sign is split into three decans of about ten days. Each decan has one Minor Arcana card from 2 to 10, so people of the same sign born in different decans carry a different flavour of its energy. There are 36 in total.",
  },
  {
    q: "How should I use my zodiac card?",
    a: "As a mirror for self-reflection, not a fixed prediction. When your sign card appears in a reading, read it as something about you personally, or use its image as a focus when you want to call on your sign's strengths.",
  },
];

export function ZodiacIndexBody({ locale, finder }: { locale: Locale; finder: ReactNode }) {
  const isEnglish = locale === "en";
  const faqs = isEnglish ? INDEX_FAQ_EN : INDEX_FAQ_TH;
  const breadcrumbs = isEnglish
    ? [{ label: "Home", href: "/" }, { label: "78 Tarot Cards", href: "/cards" }, { label: "Zodiac Tarot Cards" }]
    : [{ label: "หน้าแรก", href: "/" }, { label: "สารานุกรมไพ่ 78 ใบ", href: "/cards" }, { label: "ไพ่ประจำราศี" }];

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    homeCrumb(locale),
    { name: isEnglish ? "78 Tarot Cards" : "สารานุกรมไพ่ 78 ใบ", path: "/cards" },
    { name: isEnglish ? "Zodiac Tarot Cards" : "ไพ่ประจำราศี", path: INDEX_PATH },
  ]);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink py-6 sm:py-10 px-4 sm:px-6 font-sans relative overflow-x-clip">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      <div className="max-w-4xl mx-auto space-y-10">
        <RitualHero
          breadcrumbs={breadcrumbs}
          badgeText={isEnglish ? "Tarot × Astrology" : "ไพ่ทาโรต์ × โหราศาสตร์"}
          title={isEnglish ? "Zodiac Tarot Cards" : "ไพ่ประจำราศี 12 ราศี"}
          tagline={
            isEnglish
              ? "Every sign has its own tarot cards. Find yours from your birthday and see what the 1909 Rider-Waite deck says about your sign."
              : "ทุกราศีมีไพ่ทาโรต์ประจำตัว ใส่วันเกิดเพื่อหาไพ่ของคุณ แล้วดูว่าไพ่ 1909 Rider-Waite บอกอะไรเกี่ยวกับราศีของคุณบ้าง"
          }
        />

        {finder}

        <section aria-labelledby="zodiac-grid-title" className="space-y-4">
          <h2 id="zodiac-grid-title" className="text-lg sm:text-xl font-serif-th font-bold text-ink text-center">
            {isEnglish ? "All 12 signs" : "ไพ่ประจำทั้ง 12 ราศี"}
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {ZODIAC_SIGNS.map((sign) => {
              const major = card(sign.majorCardId);
              return (
                <li key={sign.id}>
                  <Link
                    href={zodiacSignPath(sign.id)}
                    className="altar-card-porcelain group flex flex-col items-center text-center gap-2 rounded-xl p-3 h-full hover:border-gold-ink transition-colors"
                  >
                    <CardImage
                      image={major.image}
                      cardId={major.id}
                      alt={isEnglish ? `${sign.nameEn}: ${major.nameEn}` : `${sign.nameTh}: ${major.nameEn}`}
                      sizes="(min-width: 768px) 120px, (min-width: 640px) 30vw, 42vw"
                      className="w-full max-w-[120px] aspect-[1/1.7] rounded-md border border-line-warm object-cover"
                    />
                    <span className="text-sm font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors">
                      {isEnglish ? sign.nameEn : sign.nameTh}
                    </span>
                    <span className="text-[13px] text-muted font-sans leading-snug">{signRange(sign, isEnglish)}</span>
                    <span className="text-xs font-serif-th font-semibold text-gold-ink">{major.nameEn}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <SeoArticleShell
          eyebrow={isEnglish ? "How it works" : "ไพ่กับดวงดาวเกี่ยวกันอย่างไร"}
          title={
            isEnglish
              ? "The Golden Dawn: where tarot meets the zodiac"
              : "Golden Dawn: จุดที่ไพ่ทาโรต์กับโหราศาสตร์มาบรรจบกัน"
          }
          faqs={faqs}
          /* ⚠️ SeoArticleShell ไม่เติม /en ให้เอง (A6-09) — ต้องแปลงเส้นทางตามภาษาก่อนส่งเข้าไป */
          links={[
            { label: isEnglish ? "Tarot Birth Card" : "คำนวณไพ่ประจำตัว (Birth Card)", href: "/cards/birth-card" },
            { label: isEnglish ? "All 78 cards" : "สารานุกรมไพ่ 78 ใบ", href: "/cards" },
            { label: isEnglish ? "Daily tarot" : "ดูดวงไพ่ยิปซีรายวัน", href: "/daily" },
            { label: isEnglish ? "Start a reading" : "เริ่มดูดวงที่หน้าแรก", href: "/" },
          ].map((l) => ({ ...l, href: localeHref(l.href, locale) }))}
        >
          {isEnglish ? (
            <div className="space-y-4 text-xs sm:text-sm text-muted font-sans leading-relaxed">
              <p>
                In the late 1800s the Hermetic Order of the Golden Dawn mapped every tarot card onto the sky. Arthur
                Edward Waite and Pamela Colman Smith, who created the 1909 deck used on this site, were members, so
                these links are built into the imagery itself: the ram heads on The Emperor&apos;s throne are the sign
                of Aries.
              </p>
              <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-2">Three layers for every sign</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Sign card</strong> — twelve Major Arcana cards, one per sign.</li>
                <li><strong>Ruling planet card</strong> — the Major Arcana card of the planet that rules the sign.</li>
                <li><strong>Decan cards</strong> — the 2 to 10 of each suit, three per sign, matching its element (Fire = Wands, Earth = Pentacles, Air = Swords, Water = Cups).</li>
              </ol>
              <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-2">Tropical, not Thai sidereal</h3>
              <p>
                Dates here follow the tropical zodiac. If you know your sign from Thai astrology, it may be the
                previous sign here. Sign changeover days can shift by one day depending on the year.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs sm:text-sm text-muted font-sans leading-relaxed">
              <p>
                ปลายศตวรรษที่ 19 สมาคม Hermetic Order of the Golden Dawn ได้จับคู่ไพ่ทาโรต์ทุกใบเข้ากับดวงดาวและราศี
                A.E. Waite กับ Pamela Colman Smith ผู้สร้างไพ่ 1909 ที่เว็บนี้ใช้ ต่างก็เป็นสมาชิกของสมาคมนี้
                ความเชื่อมโยงจึงถูกวาดไว้ในภาพไพ่เลย เช่น หัวแกะบนบัลลังก์ของ The Emperor คือสัญลักษณ์ของราศีเมษ
              </p>
              <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-2">แต่ละราศีมีไพ่ 3 ชั้น</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>ไพ่ประจำราศี</strong> — ไพ่ชุดใหญ่ 12 ใบ ราศีละหนึ่งใบ</li>
                <li><strong>ไพ่ดาวผู้ครองราศี</strong> — ไพ่ชุดใหญ่ของดาวเคราะห์ที่ครองราศีนั้น</li>
                <li><strong>ไพ่ประจำช่วงวันเกิด (Decan)</strong> — ไพ่เลข 2–10 ของชุดที่ตรงกับธาตุของราศี ราศีละ 3 ใบ (ไฟ = ไม้เท้า · ดิน = เหรียญ · ลม = ดาบ · น้ำ = ถ้วย)</li>
              </ol>
              <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-2">ใช้ราศีแบบสากล ไม่ใช่แบบไทย</h3>
              <p>
                วันที่ในหน้านี้เป็นราศีแบบสากล (Tropical) ถ้าคุณรู้ราศีเกิดจากโหราศาสตร์ไทย ราศีในหน้านี้อาจเป็นราศีก่อนหน้านั้นหนึ่งราศี
                และวันรอยต่อระหว่างราศีอาจคลาดได้ 1 วันตามแต่ละปี
              </p>
            </div>
          )}
        </SeoArticleShell>
      </div>
    </main>
  );
}

/* ───────────────────────── หน้ารายราศี /cards/zodiac/<id> ───────────────────────── */

export function ZodiacSignBody({ sign, locale }: { sign: ZodiacSign; locale: Locale }) {
  const isEnglish = locale === "en";
  const copy = isEnglish ? sign.en : sign.th;
  const major = card(sign.majorCardId);
  const element = ZODIAC_ELEMENT_LABEL[sign.element];
  const modality = ZODIAC_MODALITY_LABEL[sign.modality];
  const ranges = RANGES.get(sign.id) ?? [];
  const name = isEnglish ? sign.nameEn : sign.nameTh;
  const path = zodiacSignPath(sign.id);
  const index = ZODIAC_SIGNS.findIndex((s) => s.id === sign.id);
  const prev = ZODIAC_SIGNS[(index + 11) % 12];
  const next = ZODIAC_SIGNS[(index + 1) % 12];

  const breadcrumbs = isEnglish
    ? [{ label: "Home", href: "/" }, { label: "Zodiac Tarot Cards", href: INDEX_PATH }, { label: sign.nameEn }]
    : [{ label: "หน้าแรก", href: "/" }, { label: "ไพ่ประจำราศี", href: INDEX_PATH }, { label: sign.nameTh }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    homeCrumb(locale),
    { name: isEnglish ? "Zodiac Tarot Cards" : "ไพ่ประจำราศี", path: INDEX_PATH },
    { name, path },
  ]);

  const facts = [
    { label: isEnglish ? "Dates" : "ช่วงวันเกิด", value: signRange(sign, isEnglish) },
    { label: isEnglish ? "Element" : "ธาตุ", value: isEnglish ? `${element.en} · ${element.suitEn}` : `${element.th} · ${element.suitTh}` },
    { label: isEnglish ? "Quality" : "ลักษณะราศี", value: isEnglish ? modality.en : modality.th },
    { label: isEnglish ? "Ruling planet" : "ดาวผู้ครอง", value: isEnglish ? sign.rulerEn : sign.rulerTh },
  ];

  const sections = isEnglish
    ? [
        { title: "Who you are", body: copy.nature },
        { title: "Strengths", body: copy.strength },
        { title: "Shadow side", body: copy.shadow },
        { title: "Love", body: copy.love },
        { title: "Work & money", body: copy.work },
      ]
    : [
        { title: "ตัวตนของคุณ", body: copy.nature },
        { title: "จุดแข็ง", body: copy.strength },
        { title: "ด้านเงาที่ต้องระวัง", body: copy.shadow },
        { title: "ความรัก", body: copy.love },
        { title: "การงานและการเงิน", body: copy.work },
      ];

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink py-6 sm:py-10 px-4 sm:px-6 font-sans relative overflow-x-clip">
      <JsonLd data={breadcrumbJsonLd} />
      <div className="max-w-4xl mx-auto space-y-10">
        <RitualHero
          breadcrumbs={breadcrumbs}
          badgeText={isEnglish ? `${sign.nameEn} · ${major.nameEn}` : `${sign.nameTh} · ${major.nameEn}`}
          title={isEnglish ? `${sign.nameEn} Tarot Cards` : `ไพ่ประจำ${sign.nameTh}`}
          tagline={copy.tagline}
        />

        {/* ข้อมูลราศีโดยย่อ */}
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {facts.map((f) => (
            <div key={f.label} className="altar-card-porcelain rounded-xl p-3 text-center space-y-1">
              <dt className="text-xs font-serif-th font-semibold text-muted">{f.label}</dt>
              <dd className="text-sm font-serif-th font-bold text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>

        {/* ไพ่สองใบหลัก */}
        <section aria-labelledby="zodiac-main-cards" className="altar-panel rounded-2xl p-5 sm:p-8 space-y-6">
          <h2 id="zodiac-main-cards" className="text-lg sm:text-xl font-serif-th font-bold text-ink text-center">
            {isEnglish ? `The cards of ${sign.nameEn}` : `ไพ่หลักของ${sign.nameTh}`}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-md mx-auto">
            <CardTile id={sign.majorCardId} label={isEnglish ? "Sign card" : "ไพ่ประจำราศี"} isEnglish={isEnglish} size="lg" />
            <CardTile
              id={sign.rulerCardId}
              label={isEnglish ? `Ruler: ${sign.rulerEn}` : `ดาวผู้ครอง: ${sign.rulerTh}`}
              isEnglish={isEnglish}
              size="lg"
            />
          </div>
          <p className="text-sm text-ink font-sans leading-relaxed text-center max-w-2xl mx-auto">{copy.advice}</p>
        </section>

        {/* นิสัย ความรัก การงาน */}
        <section aria-labelledby="zodiac-reading" className="altar-panel rounded-2xl p-5 sm:p-8 space-y-5">
          <h2 id="zodiac-reading" className="text-lg sm:text-xl font-serif-th font-bold text-ink">
            {isEnglish ? `${sign.nameEn} through the tarot` : `${sign.nameTh}ในมุมของไพ่ทาโรต์`}
          </h2>
          {sections.map((s) => (
            <div key={s.title} className="space-y-1.5">
              <h3 className="text-base font-serif-th font-bold text-ink">{s.title}</h3>
              <p className="text-sm text-muted font-sans leading-relaxed">{s.body}</p>
            </div>
          ))}
        </section>

        {/* ไพ่ 3 ช่วง */}
        <section aria-labelledby="zodiac-decans" className="altar-panel rounded-2xl p-5 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <h2 id="zodiac-decans" className="text-lg sm:text-xl font-serif-th font-bold text-ink">
              {isEnglish ? "Your decan card" : "ไพ่ประจำช่วงวันเกิด (Decan)"}
            </h2>
            <p className="text-sm text-muted font-sans leading-relaxed">
              {isEnglish
                ? `${sign.nameEn} is split into three decans of about ten days, each with its own ${element.suitEn} card. Find the one for your birthday.`
                : `${sign.nameTh}แบ่งเป็น 3 ช่วง ช่วงละประมาณ 10 วัน แต่ละช่วงมีไพ่${element.suitTh}ประจำอยู่หนึ่งใบ ดูว่าวันเกิดของคุณตรงกับใบไหน`}
            </p>
          </div>
          <ol className="grid grid-cols-3 gap-3 sm:gap-6">
            {sign.decans.map((d, i) => (
              <li key={d.cardId}>
                <CardTile
                  id={d.cardId}
                  label={isEnglish ? `Decan ${i + 1}` : `ช่วงที่ ${i + 1}`}
                  note={
                    ranges[i]
                      ? `${formatMonthDay(ranges[i].start, isEnglish)} – ${formatMonthDay(ranges[i].end, isEnglish)} · ${isEnglish ? d.planetEn : d.planetTh}`
                      : undefined
                  }
                  isEnglish={isEnglish}
                />
              </li>
            ))}
          </ol>
        </section>

        {/* ชวนเปิดไพ่ + ราศีข้างเคียง */}
        <section className="altar-panel rounded-2xl p-5 sm:p-8 space-y-5 text-center">
          <p className="text-sm text-ink font-sans leading-relaxed">
            {isEnglish
              ? `Want to know what ${major.nameEn} has to say about your question today?`
              : `อยากรู้ว่าวันนี้ไพ่มีอะไรจะบอกคนราศี${sign.nameTh.replace("ราศี", "")}บ้าง?`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/daily" className="btn-gold-glass py-3 px-6 text-xs sm:text-sm font-serif-th font-bold">
              {isEnglish ? "Draw today's card" : "เปิดไพ่ดวงรายวัน"}
            </Link>
            <Link href="/" className="glass-chip py-3 px-6 text-xs sm:text-sm font-serif-th font-bold text-ink">
              {isEnglish ? "Ask the tarot a question" : "ถามไพ่เรื่องที่อยากรู้"}
            </Link>
          </div>
          <nav aria-label={isEnglish ? "Other signs" : "ราศีอื่น"} className="flex justify-between gap-3 pt-4 border-t border-line text-sm font-serif-th">
            <Link href={zodiacSignPath(prev.id)} className="text-muted hover:text-gold-ink transition-colors">
              ← {isEnglish ? prev.nameEn : prev.nameTh}
            </Link>
            <Link href={INDEX_PATH} className="text-muted hover:text-gold-ink transition-colors">
              {isEnglish ? "All signs" : "ทุกราศี"}
            </Link>
            <Link href={zodiacSignPath(next.id)} className="text-muted hover:text-gold-ink transition-colors">
              {isEnglish ? next.nameEn : next.nameTh} →
            </Link>
          </nav>
        </section>
      </div>
    </main>
  );
}
